const https = require('https');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'ANTHROPIC_API_KEY not set in environment variables' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch(e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const { prompt } = body;
  if (!prompt) {
    return { statusCode: 400, body: JSON.stringify({ error: 'No prompt provided' }) };
  }

  const payload = JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }]
  });

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            resolve({ statusCode: 400, body: JSON.stringify({ error: parsed.error.message }) });
          } else {
            resolve({
              statusCode: 200,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ result: parsed.content[0].text.trim() })
            });
          }
        } catch(e) {
          resolve({ statusCode: 500, body: JSON.stringify({ error: 'Failed to parse API response: ' + data }) });
        }
      });
    });

    req.on('error', (e) => {
      resolve({ statusCode: 500, body: JSON.stringify({ error: 'Request failed: ' + e.message }) });
    });

    req.write(payload);
    req.end();
  });
};
