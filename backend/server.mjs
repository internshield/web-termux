import crypto from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import http from "node:http";
import express from "express";
import pty from "node-pty";
import { WebSocketServer, WebSocket } from "ws";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

const PORT = Number(process.env.PORT || 8787);
const SHARED_SECRET = process.env.WEBTERMUX_SHARED_SECRET || "";
const SESSION_ROOT = path.resolve(process.env.SESSION_ROOT || "/var/lib/webtermux/workspaces");
const SESSION_IDLE_MS = Number(process.env.SESSION_IDLE_MS || 30 * 60 * 1000);
const MAX_SESSIONS = Number(process.env.MAX_SESSIONS || 25);
const CONTAINER_MEMORY = process.env.CONTAINER_MEMORY || "2g";
const CONTAINER_CPUS = process.env.CONTAINER_CPUS || "2";
const CONTAINER_PIDS = process.env.CONTAINER_PIDS || "256";
const CONTAINER_UID = 10001;
const CONTAINER_GID = 10001;

const IMAGES = {
  debian: process.env.DEBIAN_IMAGE || "webtermux-debian:latest",
  ubuntu: process.env.UBUNTU_IMAGE || "webtermux-ubuntu:latest",
  arch: process.env.ARCH_IMAGE || "webtermux-arch:latest"
};

const profiles = new Set(Object.keys(IMAGES));
const sessions = new Map();

await fsp.mkdir(SESSION_ROOT, { recursive: true });

function timingSafeEqualHex(a, b) {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function expectedSignature(sessionId, profile) {
  return crypto.createHmac("sha256", SHARED_SECRET).update(sessionId + "|" + profile).digest("hex");
}

function authenticate(req) {
  if (!SHARED_SECRET) return null;

  const sessionId = req.headers["x-webtermux-session"];
  const profile = req.headers["x-webtermux-profile"];
  const signature = req.headers["x-webtermux-signature"];

  if (typeof sessionId !== "string" || typeof profile !== "string" || typeof signature !== "string") return null;
  if (!/^[0-9a-f-]{36}$/i.test(sessionId) || !profiles.has(profile)) return null;

  return timingSafeEqualHex(expectedSignature(sessionId, profile), signature)
    ? { sessionId, profile }
    : null;
}

function safeKey(profile, sessionId) {
  return `${profile}:${sessionId}`;
}

function containerName(profile, sessionId) {
  const hash = crypto.createHash("sha256").update(safeKey(profile, sessionId)).digest("hex").slice(0, 24);
  return `webtermux-${profile}-${hash}`;
}

function workspacePath(profile, sessionId) {
  const hash = crypto.createHash("sha256").update(safeKey(profile, sessionId)).digest("hex").slice(0, 24);
  return path.join(SESSION_ROOT, profile, hash);
}

function docker(args, options = {}) {
  return execFileSync("docker", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 30_000,
    ...options
  }).trim();
}

function dockerExists(name) {
  try {
    docker(["container", "inspect", name]);
    return true;
  } catch {
    return false;
  }
}

function dockerRunning(name) {
  try {
    return docker(["inspect", "-f", "{{.State.Running}}", name]) === "true";
  } catch {
    return false;
  }
}

async function ensureWorkspace(profile, sessionId) {
  const dir = workspacePath(profile, sessionId);
  await fsp.mkdir(dir, { recursive: true, mode: 0o770 });
  try {
    await fsp.chown(dir, CONTAINER_UID, CONTAINER_GID);
  } catch {}
  return dir;
}

async function ensureContainer(profile, sessionId) {
  const name = containerName(profile, sessionId);
  const workspace = await ensureWorkspace(profile, sessionId);

  if (dockerExists(name)) {
    if (!dockerRunning(name)) docker(["start", name]);
    return { container: name, workspace };
  }

  const image = IMAGES[profile];
  try {
    docker([
      "run", "-d",
      "--name", name,
      "--label", "webtermux=true",
      "--label", `webtermux.session=${sessionId}`,
      "--label", `webtermux.profile=${profile}`,
      "--memory", CONTAINER_MEMORY,
      "--cpus", CONTAINER_CPUS,
      "--pids-limit", CONTAINER_PIDS,
      "--init",
      "--network", "bridge",
      "--mount", `type=bind,src=${workspace},dst=/workspace`,
      "-w", "/workspace",
      image,
      "sleep", "infinity"
    ]);
  } catch (error) {
    throw new Error(
      `Could not start ${profile} image ${image}. Build the profile image first. ${String(error.stderr || error.message || error)}`
    );
  }

  return { name, workspace };
}

function shellFor(containerNameValue, cols, rows) {
  return pty.spawn(
    "docker",
    [
      "exec", "-it",
      "--user", "internshield",
      "--env", "TERM=xterm-256color",
      "--env", "COLORTERM=truecolor",
      "--workdir", "/workspace",
      containerNameValue,
      "/bin/bash", "--login"
    ],
    {
      name: "xterm-256color",
      cols,
      rows,
      cwd: process.cwd(),
      env: {
        ...process.env,
        TERM: "xterm-256color"
      }
    }
  );
}

async function closeSession(key, removeContainer = true) {
  const session = sessions.get(key);
  if (!session) return;

  if (session.pty) {
    try { session.pty.kill(); } catch {}
    session.pty = null;
  }

  if (session.ws) {
    try { session.ws.close(1000, "session closed"); } catch {}
    session.ws = null;
  }

  if (removeContainer) {
    try { docker(["rm", "-f", session.container]); } catch {}
  }

  sessions.delete(key);
}

async function attachSession(auth, ws) {
  const key = safeKey(auth.profile, auth.sessionId);

  if (!sessions.has(key)) {
    if (sessions.size >= MAX_SESSIONS) {
      ws.close(1013, "WebTermux session capacity reached");
      return;
    }

    const runtime = await ensureContainer(auth.profile, auth.sessionId);
    sessions.set(key, {
      ...runtime,
      profile: auth.profile,
      sessionId: auth.sessionId,
      ws: null,
      pty: null,
      lastActivity: Date.now()
    });
  }

  const session = sessions.get(key);
  if (!session) return;

  if (session.pty) {
    try { session.pty.kill(); } catch {}
    session.pty = null;
  }

  if (session.ws && session.ws !== ws) {
    try { session.ws.close(1012, "Reconnected"); } catch {}
  }

  session.ws = ws;
  session.lastActivity = Date.now();
  session.pty = shellFor(session.container, 120, 32);

  session.pty.onData((data) => {
    session.lastActivity = Date.now();
    if (ws.readyState === WebSocket.OPEN) ws.send(data);
  });

  session.pty.onExit(({ exitCode }) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(`\\r\\n\\x1b[1;31m[WebTermux] shell exited (${exitCode})\\x1b[0m\\r\\n`);
    }
  });

  ws.send(`\\x1b[1;36m[WebTermux] Connected to isolated ${auth.profile} Linux workspace.\\x1b[0m\\r\\n`);
}

wss.on("connection", async (ws, _req, auth) => {
  try {
    await attachSession(auth, ws);
  } catch (error) {
    const message = String(error?.stack || error?.message || error);
    console.error("[WebTermux] session attach failed:", message);
    if (ws.readyState === WebSocket.OPEN) {
      try { ws.send(`\\r\\n\\x1b[1;31m[WebTermux] session error: ${String(error?.message || error)}\\x1b[0m\\r\\n`); } catch {}
    }
    try { ws.close(1011, String(error?.message || error)); } catch {}
    return;
  }

  const key = safeKey(auth.profile, auth.sessionId);
  const session = sessions.get(key);
  if (!session) {
    console.error("[WebTermux] session missing after attach:", key);
    try { ws.close(1011, "Session missing after attach"); } catch {}
    return;
  }

  ws.on("message", (raw, isBinary) => {
    session.lastActivity = Date.now();
    const text = Buffer.isBuffer(raw) ? raw.toString("utf8") : String(raw);

    if (text.startsWith("\\0RESIZE ")) {
      const [, colsRaw, rowsRaw] = text.trim().split(/\\s+/);
      const cols = Math.max(20, Math.min(300, Number(colsRaw) || 120));
      const rows = Math.max(5, Math.min(100, Number(rowsRaw) || 32));
      try { session.pty?.resize(cols, rows); } catch {}
      return;
    }

    if (session.pty) {
      session.pty.write(isBinary ? Buffer.from(raw) : text);
    }
  });

  ws.on("close", () => {
    if (session.ws === ws) {
      session.ws = null;
      session.lastActivity = Date.now();
      try { session.pty?.kill(); } catch {}
      session.pty = null;
    }
  });
});

server.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (url.pathname !== "/terminal") {
    socket.destroy();
    return;
  }

  const auth = authenticate(req);
  if (!auth) {
    socket.write("HTTP/1.1 401 Unauthorized\\r\\nConnection: close\\r\\n\\r\\n");
    socket.destroy();
    return;
  }

  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit("connection", ws, req, auth);
  });
});

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "web-termux-backend",
    profiles: Object.keys(IMAGES),
    sessions: sessions.size,
    maxSessions: MAX_SESSIONS,
    sharedSecretConfigured: Boolean(SHARED_SECRET)
  });
});

app.get("/", (_req, res) => {
  res.type("text/plain").send("InternShield WebTermux PTY backend");
});

setInterval(async () => {
  const now = Date.now();

  for (const [key, session] of sessions) {
    if (!session.ws && now - session.lastActivity > SESSION_IDLE_MS) {
      await closeSession(key, true);
    }
  }
}, 60_000).unref();

process.on("SIGTERM", async () => {
  for (const key of [...sessions.keys()]) await closeSession(key, false);
  server.close(() => process.exit(0));
});

process.on("SIGINT", async () => {
  for (const key of [...sessions.keys()]) await closeSession(key, false);
  server.close(() => process.exit(0));
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`WebTermux backend listening on 0.0.0.0:${PORT}`);
});
