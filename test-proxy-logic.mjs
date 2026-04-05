async function testProxyParsing() {
  const videoId = 'z6Wk8Y-EFCA';
  const res = await fetch(`https://youtubetranscript.com/?server_vid=${videoId}`);
  const xmlText = await res.text();
  console.log('Includes error= ?', xmlText.includes('error='));
  
  const text = xmlText
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
    
  console.log('Result text length:', text.length);
  console.log('Includes <?xml ?', text.includes('<?xml'));
  console.log('Snippet:', text.substring(0, 100));
}

testProxyParsing();
