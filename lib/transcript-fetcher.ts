/**
 * Robust YouTube transcript fetcher with multiple fallback methods.
 * Uses youtube-ext, youtube-transcript, and a fallback to a reliable proxy service.
 */
import { YoutubeTranscript } from 'youtube-transcript';
import youtubeExt from 'youtube-ext';

/**
 * Method 1: Using youtube-ext (Reliable scraping library)
 */
async function fetchViaYoutubeExt(videoId: string): Promise<string> {
  console.log(`[Transcript] Method 1: youtube-ext for ${videoId}`);
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
 * Method 2: youtube-transcript npm package
 */
async function fetchViaYoutubeTranscriptPackage(videoId: string): Promise<string> {
  console.log(`[Transcript] Method 2: youtube-transcript package for ${videoId}`);
  const items = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
  if (!items || items.length === 0) throw new Error('No transcript items returned');
  return items
    .map((item) => item.text)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Method 3: Third Party proxy (youtubetranscript.com)
 */
async function fetchViaProxyUrl(videoId: string): Promise<string> {
  console.log(`[Transcript] Method 3: Proxy API for ${videoId}`);
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
 * Main export: tries multiple reliable methods in sequence
 */
export const fetchTranscriptWithStealth = async (videoId: string): Promise<string> => {
  // Ordered by reliability on serverless functions based on testing
  const methods = [
    { name: 'youtube-ext package', fn: () => fetchViaYoutubeExt(videoId) },
    { name: 'youtube-transcript package', fn: () => fetchViaYoutubeTranscriptPackage(videoId) },
    { name: 'youtubetranscript.com proxy', fn: () => fetchViaProxyUrl(videoId) },
  ];

  const errors: string[] = [];

  for (const method of methods) {
    try {
      const result = await method.fn();
      console.log(`[Transcript] Success via ${method.name}`);
      
      // Basic validation: clear out common filler words from formatting & ensure length
      if (result && result.length > 50 && !result.includes('<?xml')) {
        return result;
      }
    } catch (err: any) {
      const msg = err?.message || 'Unknown error';
      console.warn(`[Transcript] ${method.name} failed:`, msg);
      errors.push(`${method.name}: ${msg}`);

      // Propagate definitive errors (e.g. video has no captions at all)
      if (msg.includes('disabled') || msg.includes('NO_CAPTIONS') || msg.includes('No transcript')) {
        throw new Error('Captions are disabled for this video. Please try a video with subtitles enabled.');
      }
    }
  }

  console.error('[Transcript] All methods failed:', errors);
  throw new Error('Could not fetch transcript for this video.');
};
