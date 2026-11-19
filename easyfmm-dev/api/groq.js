// Vercel Serverless Function (CommonJS: package.json 없이 모든 Node 런타임 호환)
function pickCommonChatFields(payload) {
    const out = {
        messages: payload.messages
    };
    const passthroughKeys = ['temperature', 'top_p', 'stop', 'presence_penalty', 'frequency_penalty', 'seed'];
    for (const key of passthroughKeys) {
        if (payload[key] !== undefined) {
            out[key] = payload[key];
        }
    }
    return out;
}

function hasNonEmptyChoiceContent(data) {
    const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    return typeof content === 'string' && content.trim().length > 0;
}

async function callUpstream(url, apiKey, bodyPayload, timeoutMs = 28000, externalSignal = null) {
    const controller = new AbortController();
    const onExternalAbort = () => controller.abort(externalSignal.reason || new Error('Aborted'));
    if (externalSignal) {
        if (externalSignal.aborted) {
            onExternalAbort();
        } else {
            externalSignal.addEventListener('abort', onExternalAbort, { once: true });
        }
    }
    const timer = setTimeout(() => controller.abort(new Error('Upstream timeout')), timeoutMs);

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            signal: controller.signal,
            body: JSON.stringify(bodyPayload)
        });
        const data = await res.json().catch(() => ({}));
        return { ok: res.ok, status: res.status, data };
    } finally {
        clearTimeout(timer);
        if (externalSignal) {
            externalSignal.removeEventListener('abort', onExternalAbort);
        }
    }
}

async function runTarget(target, externalSignal = null) {
    try {
        const result = await callUpstream(target.url, target.apiKey, target.body, target.timeoutMs, externalSignal);
        if (result.ok && hasNonEmptyChoiceContent(result.data)) {
            return { ok: true, provider: target.name, data: result.data };
        }
        if (result.ok) {
            console.warn(`[${target.name}] Empty completion content`);
            return { ok: false, status: 502, data: { error: `${target.name} returned empty content` }, provider: target.name };
        }
        console.error(`[${target.name}] API Error:`, result.status, result.data);
        return { ok: false, status: result.status, data: result.data, provider: target.name };
    } catch (err) {
        console.error(`[${target.name}] Fetch Failed:`, err.message);
        return { ok: false, status: 502, data: { error: err.message }, provider: target.name };
    }
}

function raceFirstValid(targets) {
    if (targets.length === 1) {
        return runTarget(targets[0]);
    }
    return new Promise((resolve) => {
        const controllers = targets.map(() => new AbortController());
        let settled = false;
        let remaining = targets.length;
        let lastError = null;

        targets.forEach((target, idx) => {
            runTarget(target, controllers[idx].signal).then((outcome) => {
                if (settled) return;
                if (outcome.ok) {
                    settled = true;
                    controllers.forEach((ctrl, j) => {
                        if (j !== idx) ctrl.abort(new Error('Superseded by faster provider'));
                    });
                    resolve(outcome);
                    return;
                }
                lastError = outcome;
                remaining -= 1;
                if (remaining === 0) {
                    settled = true;
                    resolve(lastError || { ok: false, status: 502, data: { error: "모든 AI API 호출 실패" } });
                }
            });
        });
    });
}

module.exports = async function handler(request, response) {
    // 웹/웹뷰(file://, capacitor://, localhost, *.vercel.app, 커스텀 도메인) 공통 CORS 허용
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
    response.setHeader('Access-Control-Max-Age', '86400');

    if (request.method === 'OPTIONS') {
        return response.status(204).end();
    }

    const exaoneKey = (process.env.EXAONE_API_KEY || process.env.LG_EXAONE_API_KEY || '').trim();
    const nvidiaKey = (process.env.NVIDIA_NIM_API_KEY || '').trim();

    // 상태 확인용 GET (/api/groq 접속 시 환경 변수 인식 여부만 true/false로 확인)
    if (request.method === 'GET') {
        return response.status(200).json({
            ok: Boolean(exaoneKey || nvidiaKey),
            providers: {
                exaone: Boolean(exaoneKey),
                nvidia: Boolean(nvidiaKey)
            }
        });
    }

    if (request.method !== 'POST') {
        return response.status(405).json({ error: "Method Not Allowed" });
    }

    if (!exaoneKey && !nvidiaKey) {
        console.error("❌ 서버 환경 변수에 EXAONE_API_KEY / NVIDIA_NIM_API_KEY가 모두 설정되어 있지 않습니다.");
        return response.status(500).json({
            error: "API 키 설정 누락 (Vercel Environment Variables에 EXAONE_API_KEY 또는 NVIDIA_NIM_API_KEY 등록 후 Redeploy 필요)"
        });
    }

    try {
        let payload = request.body;
        if (typeof payload === 'string') {
            payload = JSON.parse(payload);
        }
        if (!payload || !Array.isArray(payload.messages)) {
            return response.status(400).json({ error: "잘못된 요청 형식 (messages 필요)" });
        }

        const baseFields = pickCommonChatFields(payload);
        const requestedExaoneModel = payload.exaoneModel || 'k-exaone_v2.5';
        const requestedNvidiaModel = payload.nvidiaModel || 'nvidia/nemotron-3.5-super-vl-120b-a12b';

        const buildExaoneTarget = (timeoutMs) => ({
            name: 'exaone',
            url: 'https://api.exaone.ai/v1/chat/completions',
            apiKey: exaoneKey,
            timeoutMs,
            body: {
                ...baseFields,
                model: requestedExaoneModel,
                reasoning_effort: payload.reasoning_effort || 'low',
                max_tokens: Math.max(Number(payload.max_tokens) || 3000, 3000)
            }
        });

        const buildNvidiaTarget = (modelName, timeoutMs, minMaxTokens = 0) => {
            const nvidiaBody = {
                ...baseFields,
                model: modelName
            };
            const requestedTokens = Number(payload.max_tokens);
            if (Number.isFinite(requestedTokens) || minMaxTokens > 0) {
                nvidiaBody.max_tokens = Math.max(Number.isFinite(requestedTokens) ? requestedTokens : 900, minMaxTokens);
            }
            return {
                name: 'nvidia',
                url: 'https://integrate.api.nvidia.com/v1/chat/completions',
                apiKey: nvidiaKey,
                timeoutMs,
                body: nvidiaBody
            };
        };

        // 명시적 단일 모델 지정 테스트인 경우 순차 실행, 일반 요청은 EXAONE + 대형 NVIDIA 병렬 레이스
        const hasExplicitModelOverride = Boolean(payload.exaoneModel || payload.nvidiaModel);
        let outcome = null;

        if (exaoneKey && nvidiaKey && !hasExplicitModelOverride) {
            outcome = await raceFirstValid([
                buildExaoneTarget(28000),
                buildNvidiaTarget(requestedNvidiaModel, 28000, 4000)
            ]);
            if (!outcome.ok) {
                // 3차 초고속 안전망 (~1.2초 응답)
                outcome = await runTarget(buildNvidiaTarget('nvidia/nemotron-3.5-bolt-e4b', 12000, 0));
            }
        } else {
            const sequentialTargets = [];
            if (exaoneKey) {
                sequentialTargets.push(buildExaoneTarget(nvidiaKey ? 35000 : 50000));
            }
            if (nvidiaKey) {
                const isDefaultSuper = requestedNvidiaModel === 'nvidia/nemotron-3.5-super-vl-120b-a12b';
                sequentialTargets.push(buildNvidiaTarget(requestedNvidiaModel, 28000, isDefaultSuper ? 4000 : 0));
                if (!payload.nvidiaModel) {
                    sequentialTargets.push(buildNvidiaTarget('nvidia/nemotron-3.5-bolt-e4b', 12000, 0));
                }
            }

            for (const target of sequentialTargets) {
                outcome = await runTarget(target);
                if (outcome.ok) break;
            }
        }

        if (outcome && outcome.ok) {
            return response.status(200).json(outcome.data);
        }

        return response.status((outcome && outcome.status) || 502).json(
            (outcome && outcome.data) || { error: "모든 AI API 호출 실패" }
        );
    } catch (error) {
        return response.status(500).json({ error: "Proxy 서버 내부 오류", details: error.message });
    }
};
