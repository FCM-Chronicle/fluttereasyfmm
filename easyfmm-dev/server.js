const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors());
app.use(express.json());

// API 키는 서버측에서만 관리합니다.
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.post('/proxy/groq', async (req, res) => {
    try {
        const response = await axios.post('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', req.body, {
            headers: {
                'Authorization': `Bearer ${GEMINI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error("Gemini API Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ 
            error: "AI 요청 실패", 
            details: error.response ? error.response.data : error.message 
        });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 AI Proxy Server가 실행 중입니다: http://localhost:${PORT}`);
});