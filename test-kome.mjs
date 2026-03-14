async function test() {
  const videoId = 'dQw4w9WgXcQ';
  console.log('Testing Kome API...');
  try {
    const res = await fetch(`https://api.kome.ai/api/v1/transcript?video_id=${videoId}`, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    const data = await res.json();
    console.log('Success!', data.transcript?.substring(0, 150));
  } catch (err) {
    console.error('Failed:', err);
  }
}
test();
