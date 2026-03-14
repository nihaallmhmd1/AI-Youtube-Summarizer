import { YoutubeTranscript } from 'youtube-transcript';

/**
 * Fallback: Manually scrape transcript from video page using stealth headers
 */
async function scrapeTranscriptManually(videoId: string): Promise<string> {
  const url = `https://www.youtube.com/watch?v=${videoId}`;

  // Try multiple user agents in case one is blocked
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  ];

  let html = '';
  for (const ua of userAgents) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': ua,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1',
          'Cache-Control': 'max-age=0',
        },
        cache: 'no-store'
      });

      if (response.status === 429 || response.status === 403) continue;
      html = await response.text();
      if (html.includes('captionTracks')) break;
    } catch {
      continue;
    }
  }

  if (!html) throw new Error('Could not fetch video page');

  const splitHtml = html.split('"captionTracks":');
  if (splitHtml.length < 2) {
    // Check if it's a private/restricted video
    if (html.includes('"isPrivate":true') || html.includes('This video is private')) {
      throw new Error('Video is private or restricted.');
    }
    throw new Error('No captions found. This video may not have subtitles enabled.');
  }

  const tracksPart = splitHtml[1].split(']')[0] + ']';
  const tracks = JSON.parse(tracksPart);

  // Prefer English, then any track
  const englishTrack =
    tracks.find((t: any) => t.languageCode === 'en') ||
    tracks.find((t: any) => t.languageCode?.startsWith('en')) ||
    tracks[0];

  if (!englishTrack || !englishTrack.baseUrl) {
    throw new Error('No valid caption track found.');
  }

  const transcriptResponse = await fetch(englishTrack.baseUrl, {
    headers: {
      'User-Agent': userAgents[0],
      'Accept': 'application/xml, text/xml, */*',
    },
    cache: 'no-store'
  });

  if (!transcriptResponse.ok) {
    throw new Error(`Caption fetch failed: ${transcriptResponse.status}`);
  }

  const transcriptXml = await transcriptResponse.text();

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
        .replace(/&[^;]+;/g, '');
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Main transcript fetcher with multiple fallback strategies
 */
export const fetchTranscriptWithStealth = async (videoId: string): Promise<string> => {

  // Strategy 1: Use youtube-transcript package (most reliable for production/Vercel)
  try {
    console.log(`[Transcript] Trying youtube-transcript package for ${videoId}`);
    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
    if (transcriptItems && transcriptItems.length > 0) {
      return transcriptItems.map(item => item.text).join(' ').replace(/\s+/g, ' ').trim();
    }
  } catch (err: any) {
    console.warn(`[Transcript] youtube-transcript failed: ${err.message}`);
  }

  // Strategy 2: Try manual scraping with stealth headers
  try {
    console.log(`[Transcript] Trying manual scrape for ${videoId}`);
    return await scrapeTranscriptManually(videoId);
  } catch (err: any) {
    console.warn(`[Transcript] Manual scrape failed: ${err.message}`);
    // Surface meaningful errors
    if (err.message?.includes('private') || err.message?.includes('restricted')) {
      throw err;
    }
    if (err.message?.includes('No captions') || err.message?.includes('subtitles')) {
      throw err;
    }
  }

  // All methods exhausted
  throw new Error('Could not fetch transcript. Please ensure the video has captions/subtitles enabled and is publicly accessible.');
};
