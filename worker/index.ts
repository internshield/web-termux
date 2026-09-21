import { getSandbox, type Sandbox } from "@cloudflare/sandbox";

export { Sandbox };

interface Env {
  ASSETS: Fetcher;
  Sandbox: DurableObjectNamespace<Sandbox>;
}

function isUpgrade(request: Request) {
  return request.headers.get("Upgrade")?.toLowerCase() === "websocket";
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (isUpgrade(request) && url.pathname === "/terminal") {
      const id = url.searchParams.get("id") || "anonymous-default";
      const sandbox = getSandbox(env.Sandbox, id);
      return await sandbox.terminal(request, {
        cols: 120,
        rows: 32
      });
    }

    if (url.pathname === "/health") {
      return Response.json({
        ok: true,
        service: "web-termux",
        runtime: "cloudflare-sandbox-pty"
      });
    }

    const asset = await env.ASSETS.fetch(request);
    return asset.status === 404
      ? new Response("Not found", { status: 404 })
      : asset;
  }
};
