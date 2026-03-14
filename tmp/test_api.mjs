import fetch from 'node-fetch';

async function testApi() {
  try {
    const response = await fetch('http://localhost:3000/api/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: 'https://www.youtube.com/watch?v=0CmtDk-joT4',
        mode: 'standard',
        language: 'English'
      })
    });

    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    const text = await response.text();
    console.log('Body snippet:', text.substring(0, 500));
    
    try {
      const json = JSON.parse(text);
      console.log('Successfully parsed JSON!');
    } catch (e) {
      console.log('FAILED to parse JSON. Starts with:', text.trim().substring(0, 50));
    }
  } catch (err) {
    console.error('Test failed:', err);
  }
}

testApi();
