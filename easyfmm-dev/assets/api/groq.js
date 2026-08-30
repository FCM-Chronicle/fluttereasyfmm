// Vercel Serverless Function
export default async function handler(request, response) {
    // CORS 헤더 설정
    response.setHeader('Access-Control-Allow-Credentials', true);
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    response.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (request.method === 'OPTIONS') {
        return response.status(200).end();
    }

    // Vercel Dashboard의 Settings > Environment Variables에 등록된 값을 읽습니다.
    const apiKey = process.env.NVIDIA_NIM_API_KEY;

    if (!apiKey) {
        console.error("❌ 서버 환경 변수에 NVIDIA_NIM_API_KEY가 설정되어 있지 않습니다.");
        return response.status(500).json({ error: "API 키 설정 누락" });
    }

    try {
        const nimResponse = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(request.body)
        });

        const data = await nimResponse.json().catch(() => ({}));

        if (!nimResponse.ok) {
            console.error("NVIDIA NIM API Error Response:", data);
            return response.status(nimResponse.status).json(data);
        }

        return response.status(200).json(data);
    } catch (error) {
        return response.status(500).json({ error: "Proxy 서버 내부 오류", details: error.message });
    }
}