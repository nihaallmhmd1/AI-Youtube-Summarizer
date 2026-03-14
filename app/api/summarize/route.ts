import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';
import { fetchTranscriptWithStealth } from '@/lib/transcript-fetcher';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { url, mode = 'standard', language = 'English' } = await req.json();

    if (!url) {
      return NextResponse.json({ message: 'URL is required' }, { status: 400 });
    }

    // Extract Video ID
    // Support watch, y2u.be, shorts, embed, and extra params
    const videoIdMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;

    if (!videoId) {
      return NextResponse.json({ message: 'Invalid YouTube URL' }, { status: 400 });
    }

    // Fetch Video Title
    let videoTitle = 'YouTube Video';
    try {
      const resp = await fetch(`https://www.youtube.com/oembed?url=http://www.youtube.com/watch?v=${videoId}&format=json`);
      if (resp.ok) {
        const data = await resp.json();
        videoTitle = data.title;
      }
    } catch (e) {
      console.error('Error fetching title:', e);
    }

    // Fetch Transcript
    let transcriptText = '';
    try {
      transcriptText = await fetchTranscriptWithStealth(videoId);
      console.log(`[API] Transcript fetched for ${videoId}, length: ${transcriptText.length}`);
    } catch (error: any) {
      console.error('Error fetching transcript:', error.message);

      let errorMessage = 'Could not fetch transcript for this video. Please ensure it has captions enabled and is public.';

      // Check for specialized error messages from our stealth fetcher
      if (error.message?.includes('IP_BLOCKED')) {
        errorMessage = 'Transcription service is temporarily unavailable due to high demand. Please try again in a few minutes.';
      }

      return NextResponse.json({ message: errorMessage }, { status: 400 });
    }

    // 0. Cache Check (Standard Mode) - Temporarily English-only to avoid translation conflicts
    if (mode === 'standard' && language === 'English') {
      const { data: existingSummary } = await supabase
        .from('summaries')
        .select('*')
        .eq('video_id', videoId)
        .limit(1)
        .maybeSingle();

      if (existingSummary) {
        console.log(`[API] Returning cached summary for ${videoId}`);
        return NextResponse.json({
          ...existingSummary,
          title: existingSummary.video_title,
          videoId: existingSummary.video_id,
          id: existingSummary.id,
          is_cached: true
        });
      }
    }

    interface SummarizerResponse {
      summary?: string;
      key_points?: string[];
      highlights?: string[];
      key_takeaways?: string[];
      translated_title?: string;
      reading_mode?: {
        title: string;
        introduction: string;
        sections: { heading: string; content: string }[];
      };
      detailed_summary?: string;
      points_oriented?: string[];
      timestamped_highlights?: string[];
    }

    // AI Summarization
    const systemPrompt = language !== 'English'
      ? `You are an expert ${language} linguist and native speaker. You MUST generate ALL content strictly in ${language} using its PROPER NATIVE SCRIPT. Ensure the language is natural, fluent, and culturally accurate. NEVER use Roman/Latin letters for ${language} content. ABSOLUTELY NO TRANSLITERATION. DO NOT use English.`
      : "You are an expert summarizer. Generate structured JSON summaries.";

    const transcriptSnippet = transcriptText.substring(0, 10000); // reduced slightly to give more room for output in context window

    // Unified Prompt Construction
    let prompt = `Video: "${videoTitle}"\nTarget Language: ${language}\nMode: ${mode}\n\n`;

    if (mode === 'detailed_summary') {
      prompt += `Generate a DEEP, DETAILED summary with Markdown headings. JSON: { "translated_title": "string", "detailed_summary": "markdown" }`;
    } else if (mode === 'points_oriented') {
      prompt += `Generate 8-10 HIGH-VALUE bullet points. JSON: { "translated_title": "string", "points_oriented": ["string"] }`;
    } else if (mode === 'timestamped_highlights') {
      prompt += `Extract 5-8 key moments with timestamps. JSON: { "translated_title": "string", "timestamped_highlights": ["00:00 – description"] }`;
    } else if (mode === 'reading_mode') {
      prompt += `Write a complete article based on the video. JSON: { "reading_mode": { "title": "string", "introduction": "string", "sections": [{"heading": "string", "content": "string"}], "conclusion": "string" } }`;
    } else {
      prompt += `Generate a comprehensive summary. JSON: { "translated_title": "string", "summary": "paragraph", "key_points": ["string"], "highlights": ["string"], "key_takeaways": ["string"] }`;
    }

    prompt += `\n\nTranscript:\n${transcriptSnippet}\n\nIMPORTANT: Ensure the JSON is valid and complete. Do NOT cut off mid-sentence. ABSOLUTELY ALL generated values (summary, key_points, etc.) MUST be in ${language}.`;

    const cleanJSON = (str: string) => {
      try {
        const start = str.indexOf('{');
        const end = str.lastIndexOf('}');
        if (start < 0 || end < 0) return str;
        return str.substring(start, end + 1);
      } catch { return str; }
    };

    const callAI = async (modelName: string, maxRetries = 1): Promise<SummarizerResponse> => {
      try {
        const completion = await groq.chat.completions.create({
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }],
          model: modelName,
          response_format: { type: 'json_object' },
          max_tokens: 8192, // Increased from 4096 to prevent "max completion tokens reached" error
          temperature: 0.1, // Lower temperature for more consistent JSON
        });
        const content = completion.choices[0]?.message?.content || '{}';
        return JSON.parse(cleanJSON(content)) as SummarizerResponse;
      } catch (err: unknown) {
        const error = err as { status?: number; message?: string };
        if ((error.status === 429 || error.status === 400) && modelName === 'llama-3.3-70b-versatile' && maxRetries > 0) {
          console.log(`[API] Fallback to 8B for ${mode} in ${language} due to error ${error.status}`);
          return callAI('llama-3.1-8b-instant', 0);
        }
        throw error;
      }
    };

    const responseData = await callAI('llama-3.3-70b-versatile');
    console.log(`[API] AI Success: ${mode} in ${language}`);

    // Standardize Response
    const finalTitle = responseData.translated_title || responseData.reading_mode?.title || videoTitle;
    const finalId = videoId;

    // Save logic for Standard Mode (English only for now to preserve primary summary)
    if (mode === 'standard' && language === 'English') {
      const { data: summaryData, error: dbErr } = await supabase
        .from('summaries')
        .insert({
          user_id: user.id,
          video_url: url,
          video_title: finalTitle,
          summary: responseData.summary,
          key_points: responseData.key_points,
          highlights: responseData.highlights,
          key_takeaways: responseData.key_takeaways,
          video_id: videoId
        })
        .select()
        .single();

      if (dbErr) console.error('[API] DB Error:', dbErr.message);
      return NextResponse.json({ ...responseData, title: finalTitle, videoId: finalId, id: summaryData?.id });
    }

    return NextResponse.json({ ...responseData, title: finalTitle, videoId: finalId });

  } catch (error: unknown) {
    console.error('[API] Global Error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ message }, { status: 500 });
  }
}
