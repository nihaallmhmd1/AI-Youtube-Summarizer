import { Innertube } from 'youtubei.js';

async function testFetch() {
  console.log('Testing Youtubei.js Client...');
  try {
    const yt = await Innertube.create({
      lang: 'en',
      location: 'US',
      retrieve_player: false,
    });
    const info = await yt.getInfo('z6Wk8Y-EFCA');
    
    // Attempt to get transcript
    const transcriptInfo = await info.getTranscript();
    console.log('Success!', transcriptInfo?.transcript?.content?.body?.initial_segments[0]?.snippet?.text);
  } catch (e) {
    console.error('Error with youtubei:', e);
  }
}
testFetch();
