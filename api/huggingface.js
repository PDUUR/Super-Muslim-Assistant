// ═══════════════════════════════════════════════════════════
// Vercel Serverless Function: /api/huggingface
// Proxy untuk mengirim audio ke Hugging Face Inference API
// Mengatasi CORS karena request dilakukan dari server (same-origin)
// ═══════════════════════════════════════════════════════════

export const config = {
    api: {
        bodyParser: false, // Kita menerima raw binary audio, bukan JSON
    },
};

// Helper: baca raw body dari request sebagai Buffer
function getRawBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', (chunk) => chunks.push(chunk));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });
}

export default async function handler(req, res) {
    // ─── CORS Headers ─────────────────────────────────────────
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight (OPTIONS)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Hanya terima POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Use POST.' });
    }

    // ─── Ambil token dari Environment Variable (server-side, aman) ──
    const HF_TOKEN = process.env.HUGGINGFACE_TOKEN;
    if (!HF_TOKEN) {
        console.error('[API] HUGGINGFACE_TOKEN not set in environment variables');
        return res.status(500).json({
            error: 'Server configuration error: API token not found.',
            hint: 'Set HUGGINGFACE_TOKEN in Vercel Environment Variables.'
        });
    }

    // ─── Tentukan model dari query parameter atau default ──────
    const model = req.query.model || 'tarteel-ai/whisper-base-ar-quran';
    const HF_API_URL = `https://api-inference.huggingface.co/models/${model}`;

    try {
        // ─── Step 1: Baca audio binary dari request body ──────────
        const audioBuffer = await getRawBody(req);

        if (!audioBuffer || audioBuffer.length === 0) {
            return res.status(400).json({ error: 'No audio data received.' });
        }

        if (audioBuffer.length < 1000) {
            return res.status(400).json({ error: 'Audio too short. Please record longer.' });
        }

        console.log(`[API] Received ${audioBuffer.length} bytes, sending to ${model}...`);

        // ─── Step 2: Kirim ke Hugging Face ────────────────────────
        const hfResponse = await fetch(HF_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${HF_TOKEN}`,
                'Content-Type': req.headers['content-type'] || 'audio/webm',
            },
            body: audioBuffer,
        });

        // ─── Step 3: Handle response dari HuggingFace ─────────────

        // Model sedang loading (cold start)
        if (hfResponse.status === 503) {
            const body = await hfResponse.json().catch(() => ({}));
            const estimatedTime = body.estimated_time ? Math.ceil(body.estimated_time) : 30;
            return res.status(503).json({
                error: `Model sedang dipersiapkan (~${estimatedTime} detik). Coba lagi nanti.`,
                estimated_time: estimatedTime,
            });
        }

        // Error lainnya dari HuggingFace
        if (!hfResponse.ok) {
            const body = await hfResponse.json().catch(() => ({}));
            console.error('[API] HuggingFace Error:', hfResponse.status, body);
            return res.status(hfResponse.status).json({
                error: body.error || `HuggingFace API Error (${hfResponse.status})`,
                status: hfResponse.status,
            });
        }

        // Sukses! Kirim hasil transkripsi ke frontend
        const result = await hfResponse.json();
        console.log('[API] Transcription success:', result.text?.substring(0, 50) + '...');

        return res.status(200).json(result);

    } catch (error) {
        console.error('[API] Server Error:', error.message);
        return res.status(500).json({
            error: 'Internal server error during transcription.',
            details: error.message,
        });
    }
}
