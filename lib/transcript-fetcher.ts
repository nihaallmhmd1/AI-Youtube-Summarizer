/**
 * Robust YouTube transcript fetcher with multiple fallback methods.
 * Designed to work reliably on Vercel serverless by mimicking browser requests.
 */

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

function getRandomUA(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Method 1: Innertube API (YouTube's internal API, most reliable on Vercel)
 * Fetches captions by calling the /youtubei/v1/get_transcript endpoint.
 */
async function fetchViaInnertube(videoId: string): Promise<string> {
  console.log(`[Transcript] Method 1: Innertube API for ${videoId}`);

  const ua = getRandomUA();
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': ua,
    'Accept-Language': 'en-US,en;q=0.9',
    'Origin': 'https://www.youtube.com',
    'Referer': `https://www.youtube.com/watch?v=${videoId}`,
    'X-Youtube-Client-Name': '1',
    'X-Youtube-Client-Version': '2.20240101.00.00',
  };

  const body = {
    context: {
      client: {
        clientName: 'WEB',
        clientVersion: '2.20240101.00.00',
        hl: 'en',
        gl: 'US',
      },
    },
    videoId,
    params: btoa(`\x0a\x0b${videoId}`),
  };

  const res = await fetch(
    `https://www.youtube.com/youtubei/v1/get_transcript?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8`,
    { method: 'POST', headers, body: JSON.stringify(body) }
  );

  if (!res.ok) throw new Error(`Innertube API responded with ${res.status}`);

  const data = await res.json();

  // Navigate the nested response structure
  const actions = data?.actions;
  if (!actions || !Array.isArray(actions)) throw new Error('No actions in Innertube response');

  const transcriptAction = actions.find((a: any) => a?.updateEngagementPanelAction);
  const content = transcriptAction?.updateEngagementPanelAction?.content?.transcriptRenderer?.content
    ?.transcriptSearchPanelRenderer?.body?.transcriptSegmentListRenderer?.initialSegments;

  if (!content || !Array.isArray(content)) throw new Error('No transcript segments in Innertube response');

  const text = content
    .map((seg: any) => {
      const snippet = seg?.transcriptSegmentRenderer?.snippet;
      if (!snippet) return '';
      // runs is an array of text parts
      if (snippet.runs) return snippet.runs.map((r: any) => r.text || '').join('');
      return snippet.text || '';
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!text) throw new Error('Innertube returned empty transcript text');
  return text;
}

/**
 * Method 2: Fetch the YouTube watch page and extract the timedtext URL,
 * then parse the XML/JSON captions. Works without any npm package.
 */
async function fetchViaTimedtext(videoId: string): Promise<string> {
  console.log(`[Transcript] Method 2: Timedtext scrape for ${videoId}`);

  const ua = getRandomUA();
  const watchRes = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=en`, {
    headers: {
      'User-Agent': ua,
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });

  const html = await watchRes.text();

  // Extract the captions track URL from the page HTML
  const captionMatch = html.match(/"captionTracks":\[.*?"baseUrl":"(.*?)"/);
  if (!captionMatch) {
    // Check if captions are disabled
    if (html.includes('"captionTracks":[]') || !html.includes('captionTracks')) {
      throw new Error('NO_CAPTIONS');
    }
    throw new Error('Could not find caption track URL in page HTML');
  }

  let timedtextUrl = captionMatch[1].replace(/\\u0026/g, '&').replace(/\\/g, '');

  // Make sure we request English
  if (!timedtextUrl.includes('lang=')) {
    timedtextUrl += '&lang=en';
  }
  timedtextUrl += '&fmt=srv3'; // JSON format

  const captionRes = await fetch(timedtextUrl, {
    headers: { 'User-Agent': ua, 'Referer': 'https://www.youtube.com/' },
  });

  const captionText = await captionRes.text();

  // Check if it's JSON (srv3 format)
  if (captionText.startsWith('{') || captionText.startsWith('[')) {
    try {
      const json = JSON.parse(captionText);
      const events = json?.events || [];
      const text = events
        .filter((e: any) => e.segs)
        .map((e: any) => e.segs.map((s: any) => s.utf8 || '').join(''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (text) return text;
    } catch (_) {
      // fall through to XML parsing
    }
  }

  // Parse XML format
  const xmlText = captionText
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

  if (!xmlText) throw new Error('Timedtext returned empty transcript');
  return xmlText;
}

/**
 * Method 3: youtube-transcript npm package as last resort
 */
async function fetchViaPackage(videoId: string): Promise<string> {
  console.log(`[Transcript] Method 3: youtube-transcript package for ${videoId}`);
  const { YoutubeTranscript } = await import('youtube-transcript');
  const items = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
  if (!items || items.length === 0) throw new Error('No transcript items returned');
  return items
    .map((item) => item.text)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Main export: tries all methods in sequence, throws a clean error if all fail.
 */
export const fetchTranscriptWithStealth = async (videoId: string): Promise<string> => {
  const methods = [
    { name: 'Innertube', fn: () => fetchViaInnertube(videoId) },
    { name: 'Timedtext', fn: () => fetchViaTimedtext(videoId) },
    { name: 'Package',   fn: () => fetchViaPackage(videoId) },
  ];

  const errors: string[] = [];

  for (const method of methods) {
    try {
      const result = await method.fn();
      console.log(`[Transcript] Success via ${method.name}`);
      return result;
    } catch (err: any) {
      const msg = err?.message || 'Unknown error';
      console.warn(`[Transcript] ${method.name} failed: ${msg}`);
      errors.push(`${method.name}: ${msg}`);

      // Propagate definitive errors immediately (no point trying more methods)
      if (msg === 'NO_CAPTIONS' || msg.toLowerCase().includes('disabled')) {
        throw new Error('Captions are disabled for this video. Please try a video with subtitles enabled.');
      }
      if (msg.toLowerCase().includes('private') || msg.toLowerCase().includes('restricted')) {
        throw new Error('This video is private or restricted.');
      }
    }
  }

  console.error('[Transcript] All methods failed:', errors);
  throw new Error('Could not fetch transcript for this video. YouTube may be blocking server requests — please try again in a moment.');
};
