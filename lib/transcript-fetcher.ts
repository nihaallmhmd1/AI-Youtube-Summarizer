/**
 * Robust YouTube transcript fetcher with multiple fallback methods.
 * Uses youtubei.js (Innertube), youtube-ext, proxy APIs, and youtube-transcript.
 */
import { YoutubeTranscript } from 'youtube-transcript';
import { Innertube } from 'youtubei.js';
import youtubeExt from 'youtube-ext';

/**
 * Method 1: Using Youtubei.js (Reverse-engineered internal API)
 * Extremely reliable for bypassing Datacenter IP blocking.
 */
async function fetchViaYoutubei(videoId: string): Promise<string> {
  console.log(`[Transcript] Method 1: Youtubei.js for ${videoId}`);
  
  const yt = await Innertube.create({
    lang: 'en',
    location: 'US',
    retrieve_player: false,
  });

  const info = await yt.getInfo(videoId);
  const transcriptData = await info.getTranscript();

  if (!transcriptData || !transcriptData.transcript || !transcriptData.transcript.content) {
    throw new Error('youtubei.js returned empty transcript');
  }

  const segments = transcriptData.transcript.content.body?.initial_segments;
  if (!segments || segments.length === 0) {
    throw new Error('youtubei.js returned no segments');
  }

  const text = segments.map((seg: any) => seg.snippet?.text).join(' ').trim();
  if (!text) throw new Error('youtubei.js returned empty text');

  return text;
}

/**
 * Method 2: Third Party proxy (youtubetranscript.com)
 */
async function fetchViaProxyUrl(videoId: string): Promise<string> {
  console.log(`[Transcript] Method 2: Proxy API for ${videoId}`);
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
 * Method 3: youtube-ext package (fallback)
 */
async function fetchViaYoutubeExt(videoId: string): Promise<string> {
  console.log(`[Transcript] Method 3: youtube-ext for ${videoId}`);
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
 * Method 4: youtube-transcript npm package as last resort
 */
async function fetchViaYoutubeTranscriptPackage(videoId: string): Promise<string> {
  console.log(`[Transcript] Method 4: youtube-transcript package for ${videoId}`);
  const items = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
  if (!items || items.length === 0) throw new Error('No transcript items returned');
  return items
    .map((item) => item.text)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}


/**
 * Main export: tries multiple reliable methods in sequence
 */
export const fetchTranscriptWithStealth = async (videoId: string): Promise<string> => {
  // Ordered by reliability on serverless functions based on testing
  const methods = [
    { name: 'youtubei.js API', fn: () => fetchViaYoutubei(videoId) },
    { name: 'youtubetranscript.com proxy', fn: () => fetchViaProxyUrl(videoId) },
    { name: 'youtube-ext package', fn: () => fetchViaYoutubeExt(videoId) },
    { name: 'youtube-transcript package', fn: () => fetchViaYoutubeTranscriptPackage(videoId) },
  ];

  const errors: string[] = [];

  for (const method of methods) {
    try {
      const result = await method.fn();
      console.log(`[Transcript] Success via ${method.name}`);
      
      // Basic validation: clear out common filler words from formatting & ensure length
      if (result && result.length > 10 && !result.includes('<?xml')) {
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
