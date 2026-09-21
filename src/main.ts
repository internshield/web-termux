import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { SandboxAddon } from "@cloudflare/sandbox";
import "@xterm/xterm/css/xterm.css";
import "./styles.css";

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `<div id="terminal"></div><div id="boot">Connecting to Linux PTY...</div>`;

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
  term.writeln("\x1b[90mBrowser-side facts (not Linux guest facts):\x1b[0m");
  for (const fact of browserFacts()) term.writeln(`\x1b[90m  ${fact}\x1b[0m`);
  term.writeln("");
}

function connect() {
  const addon = new SandboxAddon({
    terminal: term,
    url: "/terminal"
  });
  term.loadAddon(addon);
  addon.connect();

  bootState.textContent = "Linux PTY connected";
  window.setTimeout(() => bootState.remove(), 1200);
}

term.onResize(({ cols, rows }) => {
  // SandboxAddon handles the PTY resize through the active WebSocket.
  void cols;
  void rows;
});

window.addEventListener("resize", () => fit.fit());

window.addEventListener("keydown", (event) => {
  if (!event.ctrlKey || !event.shiftKey) return;
  const key = event.key.toUpperCase() as keyof typeof themes;
  if (!themes[key]) return;
  event.preventDefault();
  term.options.theme = themes[key];
});

writeLocalBanner();

try {
  connect();
} catch (error) {
  bootState.textContent = "Terminal connection failed";
  term.writeln("");
  term.writeln(`\x1b[1;31m[WebTermux] ${String(error)}\x1b[0m`);
  term.writeln("\x1b[90mExpected backend: Cloudflare Worker + Sandbox PTY.\x1b[0m");
}
