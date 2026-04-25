const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// API Keys - store these in .env file for production
const DEEPSEEK_KEY = 'sk-12524fde8516466fbb3a7a1c253d172d';
const GROK_KEY = 'xai-cAHACcJvqmIvf3nWjulgcRW5ENOMtFUzr58HuQ05o7BUYrCNtxnH5TtQh1aPIHq2D7T8M0PnChHXrVKM';

// DeepSeek API route
app.post('/api/deepseek', async (req, res) => {
    try {
        const { systemPrompt, history, userMessage } = req.body;
        
        const messages = [
            { role: 'system', content: systemPrompt },
            ...history,
            { role: 'user', content: userMessage }
        ];

        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                max_tokens: 200,
                temperature: 0.88,
                messages: messages
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`DeepSeek API error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        const reply = data?.choices?.[0]?.message?.content?.trim();

        if (!reply || reply.length < 3) {
            throw new Error('Empty response from DeepSeek');
        }

        res.json({ success: true, reply, source: 'deepseek' });
    } catch (error) {
        console.error('DeepSeek error:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            fallback: true 
        });
    }
});

// Grok API route
app.post('/api/grok', async (req, res) => {
    try {
        const { systemPrompt, history, userMessage } = req.body;
        
        const messages = [
            { role: 'system', content: systemPrompt },
            ...history,
            { role: 'user', content: userMessage }
        ];

        const response = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROK_KEY}`
            },
            body: JSON.stringify({
                model: 'grok-beta',
                max_tokens: 200,
                temperature: 1.0,
                messages: messages
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Grok API error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        const reply = data?.choices?.[0]?.message?.content?.trim();

        if (!reply || reply.length < 3) {
            throw new Error('Empty response from Grok');
        }

        res.json({ success: true, reply, source: 'grok' });
    } catch (error) {
        console.error('Grok error:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            fallback: true 
        });
    }
});

// Health check route
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 POVChat server running at http://localhost:${PORT}`);
    console.log(`📱 Open http://localhost:${PORT} in your browser`);
});
