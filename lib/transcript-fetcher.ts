/**
 * Robust YouTube transcript fetcher with multiple proxy fallback methods.
 * Designed to work reliably on Vercel serverless by bypassing YouTube IP blocks.
 */
import { YoutubeTranscript } from 'youtube-transcript';
import youtubeExt from 'youtube-ext';

/**
 * Method 1: youtubetranscript.com API (Free proxy, reliable for Vercel)
 */
async function fetchViaProxyUrl1(videoId: string): Promise<string> {
  console.log(`[Transcript] Method 1: Proxy API for ${videoId}`);

  const res = await fetch(`https://youtubetranscript.com/?server_vid=${videoId}`);
  if (!res.ok) throw new Error(`Proxy responded with ${res.status}`);

  const xmlText = await res.text();
  if (xmlText.includes('error=')) {
    throw new Error('Proxy returned an error for this video.');
  }

  // Parse XML format from proxy
  const text = xmlText
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

  if (!text) throw new Error('Proxy returned empty transcript');
  return text;
}

/**
 * Method 2: youtube-ext package (uses different scraping technique)
 */
async function fetchViaYoutubeExt(videoId: string): Promise<string> {
  console.log(`[Transcript] Method 2: youtube-ext for ${videoId}`);
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const transcriptData = await youtubeExt.transcript(videoUrl, { lang: 'en' });
  
  if (!transcriptData || !transcriptData.data || transcriptData.data.length === 0) {
    throw new Error('youtube-ext returned empty transcript');
  }

  return transcriptData.data
    .map(t => t.text)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Method 3: youtube-transcript npm package as last resort
 */
async function fetchViaYoutubeTranscriptPackage(videoId: string): Promise<string> {
  console.log(`[Transcript] Method 3: youtube-transcript package for ${videoId}`);
  const items = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
  if (!items || items.length === 0) throw new Error('No transcript items returned');
  return items
    .map((item) => item.text)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Main export: tries multiple reliable proxy/scraping methods in sequence
 */
export const fetchTranscriptWithStealth = async (videoId: string): Promise<string> => {
  const methods = [
    { name: 'youtubetranscript.com API', fn: () => fetchViaProxyUrl1(videoId) },
    { name: 'youtube-ext package', fn: () => fetchViaYoutubeExt(videoId) },
    { name: 'youtube-transcript package', fn: () => fetchViaYoutubeTranscriptPackage(videoId) },
  ];

  const errors: string[] = [];

  for (const method of methods) {
    try {
      const result = await method.fn();
      console.log(`[Transcript] Success via ${method.name}`);
      // Must be decently long to be a real transcript
      if (result && result.length > 50) return result;
    } catch (err: any) {
      const msg = err?.message || 'Unknown error';
      console.warn(`[Transcript] ${method.name} failed:`, msg);
      errors.push(`${method.name}: ${msg}`);

      // Propagate definitive errors perfectly
      if (msg.includes('disabled') || msg.includes('NO_CAPTIONS') || msg.includes('No transcript')) {
        throw new Error('Captions are disabled for this video. Please try a video with subtitles enabled.');
      }
    }
  }

  console.error('[Transcript] All methods failed:', errors);
  throw new Error('Could not fetch transcript for this video.');
};
