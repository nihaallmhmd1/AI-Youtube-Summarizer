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

    console.log(`[API-DIAGNOSTIC] Starting check for video ID: ${videoId}`);
    let videoTitle = 'YouTube Video';
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const resp = await fetch(oembedUrl);
      
      if (!resp.ok) {
        console.error(`[API-DIAGNOSTIC] YouTube accessibility check: FAILED. oEmbed returned status ${resp.status}`);
        console.log(`[API-DIAGNOSTIC] Final decision path: video_inaccessible`);
        return NextResponse.json({ status: 'video_inaccessible', message: 'Video cannot be accessed from server.' }, { status: 400 });
      }
      
      const data = await resp.json();
      videoTitle = data.title || 'YouTube Video';
      console.log(`[API-DIAGNOSTIC] YouTube accessibility check: SUCCESS. Title: ${videoTitle}`);
      
    } catch (e: any) {
      console.error('[API-DIAGNOSTIC] YouTube accessibility check: FAILED. Error:', e.message);
      console.log(`[API-DIAGNOSTIC] Final decision path: video_inaccessible`);
      return NextResponse.json({ status: 'video_inaccessible', message: 'Video cannot be accessed from server.' }, { status: 400 });
    }

    let transcriptText = '';
    if (useFallback) {
      try {
        console.log('[API] Using AI metadata fallback (Title + Description)...');
        const { Innertube } = await import('youtubei.js');
        const yt = await Innertube.create({ location: 'US' });
        const info = await yt.getInfo(videoId);
        
        const basicInfo = info.basic_info;
        const channelName = basicInfo.author || 'Unknown Channel';
        const description = basicInfo.short_description || (basicInfo as any).description || 'No description available.';
        const title = basicInfo.title || videoTitle;
        
        transcriptText = `Title: ${title}\nChannel: ${channelName}\nDescription:\n${description}`;
        console.log('[API] Fallback metadata gathered successfully');
      } catch (fallbackErr: any) {
        console.error('[API] Metadata fallback failed:', fallbackErr);
        return NextResponse.json({ message: 'Failed to access video metadata automatically.' }, { status: 400 });
      }
    } else {
      try {
        transcriptText = await fetchTranscriptWithStealth(videoId);
        console.log(`[API-DIAGNOSTIC] Transcript fetch status: success`);
        console.log(`[API-DIAGNOSTIC] Final decision path: standard_transcript`);
      } catch (error: any) {
        console.warn('[API-DIAGNOSTIC] Transcript fetch failed with standard method. Error:', error.message);
        
        let hasCaptions = false;
        try {
          console.log(`[API-DIAGNOSTIC] Fallback checking captionTracks availability natively...`);
          const { Innertube } = await import('youtubei.js');
          const yt = await Innertube.create({ location: 'US' });
          const info = await yt.getInfo(videoId);
          if (info.captions?.caption_tracks && info.captions.caption_tracks.length > 0) {
            hasCaptions = true;
          }
        } catch (checkErr: any) {
          console.error('[API-DIAGNOSTIC] Failed to verify captionTracks via youtubei:', checkErr.message);
        }

        console.log(`[API-DIAGNOSTIC] Caption availability: ${hasCaptions ? 'exists' : 'missing'}`);

        if (!hasCaptions) {
          console.log(`[API-DIAGNOSTIC] Transcript fetch status: failed (no captions)`);
          console.log(`[API-DIAGNOSTIC] Final decision path: no_captions`);
          return NextResponse.json({ 
            status: 'no_captions', 
            message: 'No captions available for this video.' 
          }, { status: 400 });
        } else {
          console.log(`[API-DIAGNOSTIC] Transcript fetch status: blocked`);
          console.log(`[API-DIAGNOSTIC] Final decision path: transcript_blocked`);
          return NextResponse.json({ 
            status: 'transcript_blocked', 
            message: 'Transcript exists but could not be fetched (likely blocked by YouTube).' 
          }, { status: 400 });
        }
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
    if (useFallback) {
      prompt += "INSTRUCTION: Generate a detailed and accurate summary of this video based on the title and description below. Infer the likely content.\n\n";
    }
    if (mode === 'detailed_summary') prompt += `Generate deep summary with headings. JSON: { "translated_title": "string", "detailed_summary": "markdown" }`;
    else if (mode === 'points_oriented') prompt += `Generate 8-10 value points. JSON: { "translated_title": "string", "points_oriented": ["string"] }`;
    else if (mode === 'timestamped_highlights') prompt += `Extract timestamps. JSON: { "translated_title": "string", "timestamped_highlights": ["00:00 – desc"] }`;
    else if (mode === 'reading_mode') prompt += `Write an article. JSON: { "reading_mode": { "title": "string", "introduction": "string", "sections": [{"heading": "string", "content": "string"}], "conclusion": "string" } }`;
    else prompt += `Generate comprehensive summary. JSON: { "translated_title": "string", "summary": "para", "key_points": ["s"], "highlights": ["s"], "key_takeaways": ["s"] }`;
    
    if (useFallback) {
      prompt += `\n\nVideo Metadata Info:\n${transcriptSnippet}`;
    } else {
      prompt += `\n\nTranscript:\n${transcriptSnippet}`;
    }

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
    console.log(`[API-DIAGNOSTIC] Final summarisation result: SUCCESS`);

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
