import { YoutubeTranscript } from 'youtube-transcript';

/**
 * Fetches a YouTube video transcript using the youtube-transcript package.
 * This works reliably in serverless environments like Vercel.
 */
export const fetchTranscriptWithStealth = async (videoId: string): Promise<string> => {
  try {
    console.log(`[Transcript] Fetching transcript for ${videoId}`);
    const items = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });

    if (!items || items.length === 0) {
      throw new Error('No transcript items returned. The video may not have captions enabled.');
    }

    return items
      .map(item => item.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

  } catch (error: any) {
    console.error(`[Transcript] Failed for ${videoId}:`, error.message);

    // Surface a clean, user-friendly error message
    if (error.message?.toLowerCase().includes('disabled') || error.message?.includes('No transcript')) {
      throw new Error('Captions are disabled for this video. Please try a video with subtitles enabled.');
    }

    if (error.message?.includes('private') || error.message?.includes('restricted')) {
      throw new Error('This video is private or restricted.');
    }

    throw new Error('Could not fetch transcript for this video.');
  }
};
