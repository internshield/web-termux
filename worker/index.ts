const VALID_PROFILES = new Set(["debian", "ubuntu", "arch"]);
interface Env {
  ASSETS: Fetcher;
  BACKEND_URL?: string;
  BACKEND_SECRET?: string;
}

function isUpgrade(request: Request) {
  return request.headers.get("Upgrade")?.toLowerCase() === "websocket";
}

function hex(bytes: ArrayBuffer) {
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sign(secret: string, value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)));
}

function validSession(value: string) {
  return /^[0-9a-f-]{36}$/i.test(value);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return Response.json({
        ok: true,
        service: "web-termux",
        runtime: "cloudflare-free-websocket-gateway",
        backendConfigured: Boolean(env.BACKEND_URL && env.BACKEND_SECRET),
        profiles: [...VALID_PROFILES]
      });
    }

    if (isUpgrade(request) && url.pathname === "/terminal") {
      if (!env.BACKEND_URL || !env.BACKEND_SECRET) {
        return new Response("WebTermux backend is not configured.", { status: 503 });
      }

      const sessionId = url.searchParams.get("sid") ?? "";
      const profile = (url.searchParams.get("profile") ?? "ubuntu").toLowerCase();

      if (!validSession(sessionId)) {
        return new Response("Invalid session id.", { status: 400 });
      }
      if (!VALID_PROFILES.has(profile)) {
        return new Response("Invalid Linux profile.", { status: 400 });
      }

      const upstream = new URL(env.BACKEND_URL);
      upstream.pathname = "/terminal";
      upstream.search = "";

      const signature = await sign(env.BACKEND_SECRET, sessionId + "|" + profile);
      const upstreamRequest = new Request(upstream.toString(), request);
      upstreamRequest.headers.set("x-webtermux-session", sessionId);
      upstreamRequest.headers.set("x-webtermux-profile", profile);
      upstreamRequest.headers.set("x-webtermux-signature", signature);

      return fetch(upstreamRequest);
    }

    const asset = await env.ASSETS.fetch(request);
    return asset.status === 404
      ? new Response("Not found", { status: 404 })
      : asset;
  }
};
