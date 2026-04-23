// ===== SafeTrack Local Development Server =====
// This replaces the Vercel serverless function for local development.

const express = require('express');
const path = require('path');

// Load .env.local
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON bodies
app.use(express.json());

// Serve static files (index.html, css/, js/)
app.use(express.static(__dirname));

// ===== API route: /api/chat =====
app.post('/api/chat', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: { message: 'GROK_API_KEY not configured in .env.local' } });
  }

  try {
    const { system, messages, model, max_tokens } = req.body;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: max_tokens || 500,
        messages: system
          ? [{ role: 'system', content: system }, ...messages]
          : messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Groq API error:', data);
      return res.status(response.status).json({ error: { message: data.error?.message || 'Groq API error' } });
    }

    const text = data.choices?.[0]?.message?.content || 'No response received.';
    return res.status(200).json({ content: [{ type: 'text', text }] });

  } catch (err) {
    console.error('Server error:', err.message);
    return res.status(500).json({ error: { message: 'Server error: ' + err.message } });
  }
});

// Handle CORS preflight
app.options('/api/chat', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.status(200).end();
});

// Fallback: serve index.html for any unknown route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  const apiKey = process.env.GROK_API_KEY;
  console.log(`\n  🛡️  SafeTrack is running at: http://localhost:${PORT}\n`);
  console.log(`  API Key configured: ${apiKey ? '✅ Yes' : '❌ No — set GROK_API_KEY in .env.local'}\n`);
});
