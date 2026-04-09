/**
 * Ollama Proxy Serverless Function
 *
 * Bridges HTTPS app → HTTP localhost Ollama (solves mixed-content issue).
 * The browser cannot directly call http://localhost from an HTTPS app (mixed content).
 * This Vercel function receives the request, validates the Ollama URL for SSRF,
 * and forwards to the local Ollama instance.
 *
 * Expected request:
 * POST /api/ollama-proxy
 * Body: { ollamaBaseUrl: "http://localhost:11434", payload: { ... } }
 *
 * The payload is the OpenAI-compatible chat completion request.
 */

export const config = {
  runtime: 'nodejs',
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ollamaBaseUrl, payload } = body as {
      ollamaBaseUrl: string;
      payload: Record<string, any>;
    };

    if (!ollamaBaseUrl || !payload) {
      return Response.json(
        { error: 'Missing ollamaBaseUrl or payload' },
        { status: 400 }
      );
    }

    // SSRF Guard: Only allow localhost/127.0.0.1/::1
    // This prevents attackers from using the proxy to scan internal networks
    let url: URL;
    try {
      url = new URL(ollamaBaseUrl);
    } catch {
      return Response.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    const hostname = url.hostname.toLowerCase();
    if (!['localhost', '127.0.0.1', '::1'].includes(hostname)) {
      return Response.json(
        { error: 'Only localhost Ollama instances are supported' },
        { status: 403 }
      );
    }

    // Forward to Ollama's OpenAI-compatible endpoint
    const ollamaUrl = new URL(`${ollamaBaseUrl}/v1/chat/completions`);
    const upstream = await fetch(ollamaUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await upstream.json();

    return Response.json(data, { status: upstream.status });
  } catch (error) {
    console.error('[Ollama Proxy] Error:', error);
    return Response.json(
      { error: 'Proxy error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
