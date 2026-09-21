import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import "./styles.css";

declare const V86: any;

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `<div id="terminal"></div><div id="boot"><span id="boot-state">Starting WebTermux Linux...</span></div>`;

const terminalHost = document.querySelector<HTMLDivElement>("#terminal")!;
const bootState = document.querySelector<HTMLSpanElement>("#boot-state")!;

const nav = navigator as Navigator & { deviceMemory?: number };
const term = new Terminal({
  convertEol: false,
  cursorBlink: true,
  scrollback: 20000,
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

let emulator: any = null;
let booted = false;
let bootstrapSent = false;

function browserFacts() {
  return [
    `Browser: ${nav.userAgent}`,
    `CPU: ${nav.hardwareConcurrency ?? "unknown"} logical cores`,
    `Memory: ${nav.deviceMemory ?? "unknown"} GiB (browser exposed)`,
    `Display: ${screen.width}x${screen.height}`
  ];
}

function send(data: string) {
  emulator?.serial0_send(data);
}

function writeStartup() {
  const lines = [
    "",
    "\x1b[1;34m _       __     __    ____   _____ ____  __  __ _   _  __  __  _  _\x1b[0m",
    "\x1b[1;34m| |     / /__  / /_  / / /  / ___// __ \\|  \\/  | | | |  \\/  | || |\x1b[0m",
    "\x1b[1;34m| | /| / / _ \\/ __ \\/ / /   \\__ \\/ /_/ /| |\\/| | | | | |\\/| | || |_\x1b[0m",
    "\x1b[1;34m| |/ |/ /  __/ /_/ / /_/ /  ___/ /_/ /| |  | | |_| | | | |  | | |__   _|\x1b[0m",
    "\x1b[1;34m|__/|__/\\___/_.___/____/  /____/\\____/ |_|  |_|\\___/| |_| |_|  |_| |_|\x1b[0m",
    "",
    "\x1b[1;36m                 I N T E R N S H I E L D\x1b[0m",
    "\x1b[1;37m                      W E B T E R M U X\x1b[0m",
    "",
    "\x1b[1;32mWebTermux Linux guest is running in your browser.\x1b[0m",
    "\x1b[90mBrowser-side facts (not guest OS facts):\x1b[0m",
    ...browserFacts().map(x => `\x1b[90m  ${x}\x1b[0m`),
    "",
    "\x1b[90mType commands directly. This is a real emulated Linux shell, not a command simulator.\x1b[0m",
    ""
  ];
  term.write(lines.join("\r\n"));
}

function resize() {
  fit.fit();
  if (emulator?.bus) {
    try {
      emulator.bus.send("serial0-resize", [term.cols, term.rows]);
    } catch {}
  }
}

term.onData((data) => {
  if (!emulator) return;
  emulator.serial0_send(data);
});

term.onResize(({ cols, rows }) => {
  try {
    emulator?.bus?.send("serial0-resize", [cols, rows]);
  } catch {}
});

window.addEventListener("resize", resize);

function installThemeHotkeys() {
  window.addEventListener("keydown", (event) => {
    if (!event.ctrlKey || !event.shiftKey) return;
    const key = event.key.toUpperCase() as keyof typeof themes;
    if (!themes[key]) return;
    event.preventDefault();
    term.options.theme = themes[key];
  });
}

async function boot() {
  bootState.textContent = "Loading x86 Linux emulator...";
  term.write("\x1b[1;34mWebTermux\x1b[0m\r\n");
  term.write("\x1b[90mLoading real Linux guest runtime...\x1b[0m\r\n\r\n");

  emulator = new V86({
    wasm_path: "https://copy.sh/v86/build/v86.wasm",
    memory_size: 128 * 1024 * 1024,
    vga_memory_size: 8 * 1024 * 1024,
    bios: { url: "https://copy.sh/v86/bios/seabios.bin" },
    vga_bios: { url: "https://copy.sh/v86/bios/vgabios.bin" },
    bzimage: { url: "https://i.copy.sh/buildroot-bzimage68.bin" },
    filesystem: {},
    cmdline: "tsc=reliable mitigations=off random.trust_cpu=on console=ttyS0",
    autostart: true,
    disable_keyboard: true,
    serial_console: { type: "none" }
  });

  emulator.add_listener("emulator-ready", () => {
    bootState.textContent = "Linux guest ready";
  });

  emulator.add_listener("serial0-output-byte", (byte: number) => {
    const char = String.fromCharCode(byte);
    term.write(char);
    if (!booted && char === "%") {
      booted = true;
      bootState.remove();
      setTimeout(() => {
        if (bootstrapSent) return;
        bootstrapSent = true;
        send("clear; printf '\\033[1;34mInternShield WebTermux\\033[0m\\n'; printf '\\033[1;32mLinux guest: \\033[0m'; uname -srmo; printf '\\033[1;34mHostname: \\033[0m'; hostname; printf '\\033[1;34mShell: \\033[0m'; printf '%s\\n' \\"BusyBox ash\\"; printf '\\033[1;34mWorkspace: \\033[0m'; pwd; printf '\\033[1;34m\\nReady.\\033[0m\\n'\n");
      }, 150);
    }
  });

  emulator.add_listener("download-progress", (event: any) => {
    if (event?.lengthComputable && event.total) {
      const pct = Math.round((event.loaded / event.total) * 100);
      bootState.textContent = `Loading Linux image ${pct}%...`;
    }
  });

  emulator.add_listener("download-error", (event: any) => {
    bootState.textContent = `Linux image load failed: ${event?.file_name ?? "unknown asset"}`;
  });

  installThemeHotkeys();
}

boot().catch((error) => {
  bootState.textContent = "WebTermux boot failed";
  term.writeln(`\\r\\n\\x1b[1;31mBoot error:\\x1b[0m ${String(error)}`);
  term.writeln("Check the browser console and network access to the v86 assets.");
});

resize();
