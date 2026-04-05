import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { fetchTranscriptWithStealth } from '@/lib/transcript-fetcher';

import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini SDK if API key exists
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// Primary Analysis (Gemini 2.0 Flash via OpenRouter)
const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || 'dummy_key', // avoid crash on construction if missing
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'X-Title': 'AI YT Summariser',
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

    const { url: videoUrl, mode = 'standard', language = 'English', useFallback = false } = await req.json();
    if (!videoUrl) return NextResponse.json({ message: 'URL is required' }, { status: 400 });

    const videoIdMatch = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;
    if (!videoId) return NextResponse.json({ message: 'Invalid YouTube URL' }, { status: 400 });

    let videoTitle = 'YouTube Video';
    try {
      const resp = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
      if (resp.ok) {
        const data = await resp.json();
        videoTitle = data.title || 'YouTube Video';
      }
    } catch (e) {
      console.error('[API] Metadata error:', e);
    }

    let transcriptText = '';
    if (useFallback) {
      try {
        console.log('[API] Using AI audio transcription fallback...');
        const { Innertube } = await import('youtubei.js');
        const Groq = (await import('groq-sdk')).default;
        
        const yt = await Innertube.create({ location: 'US' });
        const info = await yt.getInfo(videoId);
        
        const stream = await info.download({ type: 'audio', quality: 'best' });
        const reader = stream.getReader();
        const chunks: Uint8Array[] = [];
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) chunks.push(value);
        }
        const buffer = Buffer.concat(chunks);
        
        const file = new File([buffer], 'audio.mp4', { type: 'audio/mp4' });
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const transcription = await groq.audio.transcriptions.create({
          file,
          model: 'whisper-large-v3'
        });
        
        transcriptText = transcription.text;
        console.log('[API] Fallback transcription complete length:', transcriptText.length);
        if (!transcriptText || transcriptText.length < 10) {
          throw new Error('AI transcription returned empty result');
        }
      } catch (audioErr: any) {
        console.error('[API] AI transcription failed:', audioErr);
        return NextResponse.json({ message: 'Failed to transcribe audio automatically.' }, { status: 400 });
      }
    } else {
      try {
        transcriptText = await fetchTranscriptWithStealth(videoId);
      } catch (error: any) {
        console.error('[API] Transcript error:', error.message);
        let errorMessage = error.message;
        if (!errorMessage) errorMessage = 'Could not fetch transcript for this video.';
        if (errorMessage === 'IP_BLOCKED') errorMessage = 'Transcription service throttled. Try again later.';
        
        if (errorMessage.includes('disabled') || errorMessage.includes('NO_CAPTIONS')) {
          return NextResponse.json({ message: 'FALLBACK_REQUIRED' }, { status: 400 });
        }
        
        return NextResponse.json({ message: errorMessage }, { status: 400 });
      }
    }

    if (mode === 'standard' && language === 'English') {
      const { data: existingSummary } = await supabase.from('summaries').select('*').eq('video_id', videoId).limit(1).maybeSingle();
      if (existingSummary) return NextResponse.json({ ...existingSummary, title: existingSummary.video_title, videoId: existingSummary.video_id, is_cached: true });
    }

    const transcriptSnippet = transcriptText.substring(0, 20000);
    const systemPrompt = language !== 'English'
      ? `You are an expert ${language} native speaker. ABSOLUTELY ALL output MUST be in ${language}. NO ENGLISH.`
      : "You are an expert summarizer. Generate structured JSON.";

    let prompt = `Video: "${videoTitle}"\nLanguage: ${language}\nMode: ${mode}\n\n`;
    if (mode === 'detailed_summary') prompt += `Generate deep summary with headings. JSON: { "translated_title": "string", "detailed_summary": "markdown" }`;
    else if (mode === 'points_oriented') prompt += `Generate 8-10 value points. JSON: { "translated_title": "string", "points_oriented": ["string"] }`;
    else if (mode === 'timestamped_highlights') prompt += `Extract timestamps. JSON: { "translated_title": "string", "timestamped_highlights": ["00:00 – desc"] }`;
    else if (mode === 'reading_mode') prompt += `Write an article. JSON: { "reading_mode": { "title": "string", "introduction": "string", "sections": [{"heading": "string", "content": "string"}], "conclusion": "string" } }`;
    else prompt += `Generate comprehensive summary. JSON: { "translated_title": "string", "summary": "para", "key_points": ["s"], "highlights": ["s"], "key_takeaways": ["s"] }`;
    
    prompt += `\n\nTranscript:\n${transcriptSnippet}`;

    const cleanAndParseJSON = (str: string) => {
      try {
        const start = str.indexOf('{');
        const end = str.lastIndexOf('}');
        if (start < 0) throw new Error('No JSON start found');
        return JSON.parse(str.substring(start, end + 1));
      } catch (e) {
        console.error('[API] JSON Parse Error. Raw:', str);
        throw new Error('Failed to parse AI response.');
      }
    };

    const callAI = async () => {
      // Logic: Use OpenRouter. If OpenRouter key missing, fallback to Gemini Direct.

      // Try OpenRouter first
      if (process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY !== 'dummy_key') {
        try {
          console.log('[API] Using OpenRouter (Gemini 2.0)');
          const completion = await openrouter.chat.completions.create({ model: 'google/gemini-2.0-flash-001', messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }], response_format: { type: 'json_object' } });
          return cleanAndParseJSON(completion.choices[0]?.message?.content || '{}');
        } catch (err) {
          console.warn('[API] OpenRouter failed, attempting fallback...', err);
        }
      }

      // Fallback to Gemini Direct
      if (genAI) {
        console.log('[API] Using Gemini Direct Fallback');
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', generationConfig: { responseMimeType: 'application/json' } });
        const result = await model.generateContent(`${systemPrompt}\n\n${prompt}`);
        return cleanAndParseJSON(result.response.text());
      }

      throw new Error('No AI configuration found. Please add API keys.');
    };

    const responseData = await callAI();
    console.log(`[API] Success: ${mode}`);

    const finalTitle = responseData.translated_title || responseData.reading_mode?.title || videoTitle;
    
    if (mode === 'standard' && language === 'English') {
      const { data: summaryData } = await supabase.from('summaries').insert({
        user_id: user.id, video_url: videoUrl, video_title: finalTitle, summary: responseData.summary,
        key_points: responseData.key_points, highlights: responseData.highlights, key_takeaways: responseData.key_takeaways, video_id: videoId
      }).select().single();
      return NextResponse.json({ ...responseData, title: finalTitle, videoId, id: summaryData?.id });
    }

    return NextResponse.json({ ...responseData, title: finalTitle, videoId });


  } catch (error: unknown) {
    console.error('[API] Global Error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ message }, { status: 500 });
  }
}
