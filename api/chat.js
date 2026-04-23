module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.GROK_API_KEY) {
    return res.status(500).json({ error: { message: 'API key not configured on server. Set GROK_API_KEY in Vercel Environment Variables.' } });
  }

  try {
    const { system, messages, max_tokens } = req.body;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROK_API_KEY}`,
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
      return res.status(response.status).json({ error: { message: data.error?.message || 'Groq API error' } });
    }

    const text = data.choices?.[0]?.message?.content || 'No response received.';
    return res.status(200).json({ content: [{ type: 'text', text }] });

  } catch (err) {
    return res.status(500).json({ error: { message: 'Server error: ' + err.message } });
  }
};
