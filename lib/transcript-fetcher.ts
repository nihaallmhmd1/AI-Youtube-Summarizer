import { YtCaptionKit } from 'yt-caption-kit';

/**
 * A custom HttpClient for yt-caption-kit that adds stealth headers 
 * to bypass bot detection on platforms like Vercel.
 */
class StealthHttpClient {
  private cookies = new Map<string, string>();

  constructor() {
    // Load cookies from environment if present
    const envCookies = process.env.YOUTUBE_COOKIES;
    if (envCookies) {
      try {
        // Support simple key=value; key2=value2 format
        envCookies.split(';').forEach(pair => {
          const [name, ...valueParts] = pair.trim().split('=');
          if (name && valueParts.length > 0) {
            this.cookies.set(name, valueParts.join('='));
          }
        });
      } catch (e) {
        console.error('[Transcript] Failed to parse YOUTUBE_COOKIES env var');
      }
    }
  }

  async get(url: string) {
    return this.request('GET', url);
  }

  async postJson(url: string, body: unknown) {
    return this.request('POST', url, JSON.stringify(body), {
      'Content-Type': 'application/json',
    });
  }

  setCookie(name: string, value: string) {
    this.cookies.set(name, value);
  }

  private async request(method: string, url: string, body?: string, extraHeaders: Record<string, string> = {}) {
    const cookieString = Array.from(this.cookies.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');

    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Origin': 'https://www.youtube.com',
      'Referer': 'https://www.youtube.com/',
      'Sec-Ch-Ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      ...(cookieString ? { 'Cookie': cookieString } : {}),
      ...extraHeaders,
    };

    const response = await fetch(url, {
      method,
      headers,
      body,
      cache: 'no-store'
    });

    if (response.status === 429) {
      throw new Error('IP_BLOCKED');
    }

    const text = await response.text();

    return {
      statusCode: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      text: async () => text,
      json: async () => JSON.parse(text),
    };
  }
}

/**
 * Fallback: Manually scrape transcript from video page
 */
async function scrapeTranscriptManually(videoId: string): Promise<string> {
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'en-US,en;q=0.9',
      'Sec-Ch-Ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
    },
    cache: 'no-store'
  });

  if (response.status === 429) {
    throw new Error('IP_BLOCKED');
  }

  const html = await response.text();
  const splitHtml = html.split('"captionTracks":');
  
  if (splitHtml.length < 2) {
    throw new Error('No caption tracks found in HTML');
  }

  const tracksPart = splitHtml[1].split(']')[0] + ']';
  const tracks = JSON.parse(tracksPart);
  const englishTrack = tracks.find((t: any) => t.languageCode === 'en') || tracks[0];

  if (!englishTrack || !englishTrack.baseUrl) {
    throw new Error('No valid track found');
  }

  const transcriptResponse = await fetch(englishTrack.baseUrl, { 
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    },
    cache: 'no-store' 
  });

  if (transcriptResponse.status === 429) {
    throw new Error('IP_BLOCKED');
  }

  const transcriptXml = await transcriptResponse.text();
  
  // Basic XML parsing for text with entity decoding
  const textMatches = transcriptXml.match(/text="([^"]*)"/g) || [];
  return textMatches
    .map(m => {
      const match = m.match(/text="([^"]*)"/);
      if (!match) return '';
      return match[1]
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;#39;/g, "'")
        .replace(/&lt;br\s*\/?&gt;/g, '\n')
        .replace(/&[^;]+;/g, ''); // Remove any other entities
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const fetchTranscriptWithStealth = async (videoId: string) => {
  // Try Kit first
  try {
    // @ts-ignore
    const kit = new YtCaptionKit({ httpClient: new StealthHttpClient() });
    const transcript = await kit.fetch(videoId);
    return transcript.snippets.map(s => s.text).join(' ');
  } catch (error: any) {
    if (error.message === 'IP_BLOCKED') throw error;

    console.log(`[Transcript] Kit failed for ${videoId}: ${error.message}. Trying manual fallback...`);
    
    // Fallback to manual scrape
    try {
      return await scrapeTranscriptManually(videoId);
    } catch (fallbackError: any) {
      if (fallbackError.message === 'IP_BLOCKED') throw fallbackError;

      console.error(`[Transcript] Manual fallback failed for ${videoId}:`, fallbackError.message);
      
      const isBlocked = error.message?.includes('429') || error.message?.includes('blocked') || fallbackError.message?.includes('blocked');
      if (isBlocked) {
        throw new Error('IP_BLOCKED');
      }
      
      throw new Error('Captions are not available for this video.');
    }
  }
};
