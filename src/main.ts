import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import "./styles.css";

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `<div id="terminal"></div><div id="boot">Connecting to WebTermux backend...</div>`;

const terminalHost = document.querySelector<HTMLDivElement>("#terminal")!;
const bootState = document.querySelector<HTMLDivElement>("#boot")!;
const nav = navigator as Navigator & { deviceMemory?: number };

const term = new Terminal({
  convertEol: false,
  cursorBlink: true,
  scrollback: 50000,
  fontSize: 15,
  fontFamily: "Cascadia Mono, Consolas, Menlo, Monaco, monospace",
  theme: {
    background: "#050505",
    foreground: "#d7d7d7",
    cursor: "#42a5ff",
    cursorAccent: "#050505",
    selectionBackground: "#23425f"
  }
});

const fit = new FitAddon();
term.loadAddon(fit);
term.open(terminalHost);
fit.fit();

const themes = {
  A: { background: "#05080c", foreground: "#4da6ff", cursor: "#4da6ff", selectionBackground: "#18324f" },
  B: { background: "#050805", foreground: "#48ff7f", cursor: "#48ff7f", selectionBackground: "#164322" },
  C: { background: "#090505", foreground: "#ff586b", cursor: "#ff586b", selectionBackground: "#542027" },
  D: { background: "#050505", foreground: "#f4f4f4", cursor: "#ffffff", selectionBackground: "#333333" },
  E: { background: "#050505", foreground: "#7cf7ff", cursor: "#ffcf70", selectionBackground: "#27414a" }
} as const;

const profileFromUrl = new URLSearchParams(location.search).get("profile")?.toLowerCase();
const allowedProfiles = new Set(["debian", "ubuntu", "arch"]);
const storedProfile = localStorage.getItem("webtermux-profile") ?? "ubuntu";
const profile = allowedProfiles.has(profileFromUrl ?? "") ? profileFromUrl! : (allowedProfiles.has(storedProfile) ? storedProfile : "ubuntu");
localStorage.setItem("webtermux-profile", profile);

const sessionId = localStorage.getItem("webtermux-session-id") ?? crypto.randomUUID();
localStorage.setItem("webtermux-session-id", sessionId);

const decoder = new TextDecoder("utf-8");
let socket: WebSocket | null = null;

function browserFacts() {
  return [
    `Browser: ${nav.userAgent}`,
    `CPU: ${nav.hardwareConcurrency ?? "unknown"} logical cores`,
    `Memory: ${nav.deviceMemory ?? "unknown"} GiB (browser exposed)`,
    `Display: ${screen.width}x${screen.height}`
  ];
}

function writeLocalBanner() {
  term.writeln("\x1b[1;34m╔══════════════════════════════════════════════════════╗\x1b[0m");
  term.writeln("\x1b[1;36m║                 INTERN SHIELD                         ║\x1b[0m");
  term.writeln("\x1b[1;37m║                   WEBTERMUX                          ║\x1b[0m");
  term.writeln("\x1b[1;34m╚══════════════════════════════════════════════════════╝\x1b[0m");
  term.writeln(`\x1b[1;32mLinux profile: ${profile}\x1b[0m`);
  term.writeln("\x1b[90mBrowser-side facts (not Linux guest facts):\x1b[0m");
  for (const fact of browserFacts()) term.writeln(`\x1b[90m  ${fact}\x1b[0m`);
  term.writeln("\x1b[90mProfiles: Ctrl+Shift+1 Debian | 2 Ubuntu | 3 Arch\x1b[0m");
  term.writeln("\x1b[90mThemes:   Ctrl+Shift+A/B/C/D/E\x1b[0m");
  term.writeln("");
}

function control(message: string) {
  socket?.send("\0" + message);
}

function sendResize() {
  if (socket?.readyState === WebSocket.OPEN) {
    control(`RESIZE ${term.cols} ${term.rows}`);
  }
}

function setProfile(next: string) {
  localStorage.setItem("webtermux-profile", next);
  location.href = `?profile=${encodeURIComponent(next)}`;
}

function connect() {
  const scheme = location.protocol === "https:" ? "wss:" : "ws:";
  const endpoint = `${scheme}//${location.host}/terminal?sid=${encodeURIComponent(sessionId)}&profile=${encodeURIComponent(profile)}`;

  socket = new WebSocket(endpoint);
  socket.binaryType = "arraybuffer";

  socket.onopen = () => {
    bootState.textContent = `Connected — ${profile}`;
    sendResize();
    term.focus();
    window.setTimeout(() => bootState.remove(), 1200);
  };

  socket.onmessage = async (event) => {
    if (typeof event.data === "string") {
      term.write(event.data);
      return;
    }

    if (event.data instanceof ArrayBuffer) {
      term.write(decoder.decode(new Uint8Array(event.data), { stream: true }));
      return;
    }

    if (event.data instanceof Blob) {
      term.write(decoder.decode(new Uint8Array(await event.data.arrayBuffer()), { stream: true }));
    }
  };

  socket.onerror = () => {
    bootState.textContent = "PTY connection error";
  };

  socket.onclose = (event) => {
    bootState.textContent = `PTY closed (${event.code}) — reload to reconnect`;
  };
}

term.onData((data) => {
  if (socket?.readyState === WebSocket.OPEN) socket.send(data);
});

term.onResize(() => sendResize());
window.addEventListener("resize", () => fit.fit());
terminalHost.addEventListener("click", () => term.focus());
window.addEventListener("load", () => term.focus());


window.addEventListener("keydown", (event) => {
  if (!event.ctrlKey || !event.shiftKey) return;

  const key = event.key.toUpperCase() as keyof typeof themes;
  if (themes[key]) {
    event.preventDefault();
    term.options.theme = themes[key];
    return;
  }

  if (event.key === "1") {
    event.preventDefault();
    setProfile("debian");
  } else if (event.key === "2") {
    event.preventDefault();
    setProfile("ubuntu");
  } else if (event.key === "3") {
    event.preventDefault();
    setProfile("arch");
  }
});

writeLocalBanner();
connect();
