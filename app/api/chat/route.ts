import OpenAI from 'openai';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

    const { message, transcript, videoTitle, history = [] } = await req.json();

    if (!message || !transcript) {
      return NextResponse.json({ message: 'Message and transcript are required' }, { status: 400 });
    }

    const systemPrompt = `You are a helpful AI Assistant specialized in analyzing YouTube videos.
Your goal is to provide accurate, concise, and insightful answers based ONLY on the provided video transcript.
If the information is not in the transcript, politely say you don't know based on the video content.

Video Title: "${videoTitle}"
Transcript Context: ${transcript.substring(0, 20000)}

Guidelines:
- Maintain a friendly and professional tone.
- Use Markdown for formatting (bolding, lists, etc.).
- Keep answers focused on the video content.
- If asking about specific parts, refer to them clearly.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10),
      { role: 'user', content: message }
    ];

    const completion = await openai.chat.completions.create({
      messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      model: 'gpt-4o-mini',
      max_tokens: 2048,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0]?.message?.content || "I'm sorry, I couldn't process that.";

    return NextResponse.json({ response: aiResponse });

  } catch (error: unknown) {
    console.error('[Chat API] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ message }, { status: 500 });
  }
}
