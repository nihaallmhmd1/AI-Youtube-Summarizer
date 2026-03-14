import { fetchTranscriptWithStealth } from './lib/transcript-fetcher';

async function test() {
  try {
    console.log("Starting test...");
    const text = await fetchTranscriptWithStealth('z6Wk8Y-EFCA');
    console.log("SUCCESS:", text.substring(0, 100) + '...');
  } catch (err) {
    console.error("ERROR:", err);
  }
}
test();
