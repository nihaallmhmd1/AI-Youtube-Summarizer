const videoId = 'z6Wk8Y-EFCA';

async function testFetch() {
  console.log('Fetching proxy API...');
  const res = await fetch(`https://youtubetranscript.com/?server_vid=${videoId}`);
  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Response snippet:', text.substring(0, 200));
}

testFetch();
