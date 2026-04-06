import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import ytdl from '@distube/ytdl-core';
import { GoogleGenerativeAI } from '@google/generative-ai';
import FormData from 'form-data';
import fetch from 'node-fetch';

// Initialize Gemini SDK
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// Audio Summariser uses OpenAI Whisper for Transcription
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Primary Analysis (Gemini 2.0 Flash via OpenRouter)
const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || 'dummy_key',
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'X-Title': 'AI YT Summariser - Audio Mode',
  }
});

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; },
          set(name: string, value: string, options: CookieOptions) { cookieStore.set({ name, value, ...options }); },
          remove(name: string, options: CookieOptions) { cookieStore.set({ name, value: '', ...options }); },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { url: videoUrl, mode = 'standard', language = 'English' } = await req.json();
    if (!videoUrl) return NextResponse.json({ message: 'URL is required' }, { status: 400 });

    const videoIdMatch = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;
    if (!videoId) return NextResponse.json({ message: 'Invalid YouTube URL' }, { status: 400 });

    // Step 1: Get Video Meta (Non-blocking for Audio Mode)
    let videoTitle = 'YouTube Video';
    let metadataFailed = false;
    try {
      const info = await ytdl.getBasicInfo(videoId);
      videoTitle = info?.videoDetails?.title || 'YouTube Video';
    } catch (e) {
      console.warn('[Audio-API] Metadata fetch failed - but continuing with audio extraction');
      metadataFailed = true;
    }

    // Step 2: Extract Audio Source & Transcribe with Whisper (with retry logic)
    let transcriptText = '';
    const MAX_RETRIES = 2;
    let attempt = 0;
    let audioSuccess = false;

    while (attempt < MAX_RETRIES && !audioSuccess) {
      attempt++;
      try {
        console.log(`[Audio-API] [Attempt ${attempt}] Extracting audio stream for ${videoId}...`);
        
        // Fresh video info with no caching
        const info = await ytdl.getInfo(videoId, { 
          requestOptions: {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': '*/*',
              'Accept-Language': 'en-US,en;q=0.9',
            }
          }
        });

        // Robust format selection: filter for audioonly and sort by quality
        const format = ytdl.chooseFormat(info.formats, { 
          quality: 'highestaudio', 
          filter: 'audioonly' 
        });

        if (!format || !format.url) {
          throw new Error("No valid audio format found.");
        }

        console.log(`[Audio-API] Selected format: ${format.mimeType}, itag: ${format.itag}`);
        
        const stream = ytdl.downloadFromInfo(info, { format });

        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
          chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);
        
        if (buffer.length === 0) throw new Error("Audio buffer is empty.");
        
        console.log(`[Audio-API] Audio download complete. Size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
        console.log('[Audio-API] Transcribing with Whisper...');
        
        const file = new File([buffer], "audio.mp3", { type: "audio/mp3" });
        
        const transcription = await openai.audio.transcriptions.create({
          file: file,
          model: "whisper-1",
          language: language === 'English' ? 'en' : undefined,
        });

        transcriptText = transcription.text;
        if (!transcriptText || transcriptText.length < 50) {
          throw new Error("Transcribed text is too short to generate a reliable summary.");
        }
        
        audioSuccess = true;
        console.log('[Audio-API] Transcription success');

      } catch (error: any) {
        console.error(`[Audio-API] Attempt ${attempt} failed:`, error.message);
        if (attempt >= MAX_RETRIES) {
          const is410 = error.message?.includes('410') || error.status === 410;
          return NextResponse.json({ 
            success: false,
            mode: "audio",
            error: is410 
              ? "Audio stream expired or unavailable (410). Please retry in a moment." 
              : error.message || "Audio transcription failed. Unable to generate summary."
          }, { status: is410 ? 410 : 422 });
        }
        // Small delay before retry
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    // Step 3: Send to Gemini for Analysis
    const transcriptSnippet = transcriptText.substring(0, 25000);
    const systemPrompt = language !== 'English'
      ? `You are an expert ${language} native speaker. ABSOLUTELY ALL output MUST be in ${language}. NO ENGLISH.`
      : "You are an expert summarizer. Generate structured JSON.";

    let prompt = `Video: "${videoTitle}" (AUDIO MODE)\nLanguage: ${language}\nMode: ${mode}\n\nTranscript:\n${transcriptSnippet}\n\n`;
    
    if (mode === 'detailed_summary') prompt += `Generate deep summary with headings. JSON: { "translated_title": "string", "detailed_summary": "markdown" }`;
    else if (mode === 'points_oriented') prompt += `Generate 8-10 value points. JSON: { "translated_title": "string", "points_oriented": ["string"] }`;
    else if (mode === 'timestamped_highlights') prompt += `Extract timestamps. JSON: { "translated_title": "string", "timestamped_highlights": ["00:00 – desc"] }`;
    else if (mode === 'reading_mode') prompt += `Write an article. JSON: { "reading_mode": { "title": "string", "introduction": "string", "sections": [{"heading": "string", "content": "string"}], "conclusion": "string" } }`;
    else prompt += `Generate comprehensive summary. JSON: { "translated_title": "string", "summary": "para", "key_points": ["s"], "highlights": ["s"], "key_takeaways": ["s"] }`;

    const cleanAndParseJSON = (str: string) => {
      try {
        const start = str.indexOf('{');
        const end = str.lastIndexOf('}');
        return JSON.parse(str.substring(start, end + 1));
      } catch (e) {
        throw new Error('Failed to parse AI response.');
      }
    };

    const callAI = async () => {
      if (process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY !== 'dummy_key') {
        try {
          const completion = await openrouter.chat.completions.create({ 
            model: 'google/gemini-2.0-flash-001', 
            messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }], 
            response_format: { type: 'json_object' } 
          });
          return cleanAndParseJSON(completion.choices[0]?.message?.content || '{}');
        } catch (err) {
          console.warn('[Audio-API] OpenRouter failed, attempting fallback...');
        }
      }

      if (genAI) {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', generationConfig: { responseMimeType: 'application/json' } });
        const result = await model.generateContent(`${systemPrompt}\n\n${prompt}`);
        return cleanAndParseJSON(result.response.text());
      }
      throw new Error('No AI configuration found.');
    };

    const responseData = await callAI();
    const finalTitle = responseData.translated_title || responseData.reading_mode?.title || videoTitle;

    // Optional: Store in Supabase
    if (mode === 'standard' && language === 'English') {
      try {
        await supabase.from('summaries').insert({
          user_id: user.id, 
          video_url: videoUrl, 
          video_title: finalTitle, 
          summary: responseData.summary,
          key_points: responseData.key_points, 
          highlights: responseData.highlights, 
          key_takeaways: responseData.key_takeaways, 
          video_id: videoId,
          metadata: { mode: "audio" }
        });
      } catch (dbErr) {
        console.error('[Audio-API] DB logging failed', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      mode: "audio",
      metadata_failed: metadataFailed,
      ...responseData,
      title: finalTitle,
      videoId,
      status: "audio_summarised",
      message: metadataFailed ? "Summary generated using audio-based AI pipeline (Video metadata unavailable)." : "Summary generated using audio-based AI pipeline."
    });

  } catch (error: any) {
    console.error('[Audio-API] Global Error:', error);
    return NextResponse.json({ 
      success: false,
      mode: "audio",
      error: error.message || "Internal Server Error" 
    }, { status: 500 });
  }
}
