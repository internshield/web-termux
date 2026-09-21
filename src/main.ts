import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import "./styles.css";

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `
<div class="frame">
  <div class="head">
    <div class="brand"><span class="led"></span><strong>WEBTERMUX</strong><em>InternShield</em></div>
    <div class="controls"><button data-theme="A">A</button><button data-theme="B">B</button><button data-theme="C">C</button><button data-theme="D">D</button><button data-theme="E">E</button><button id="clear">clear</button></div>
  </div>
  <div id="terminal"></div>
  <div class="foot"><span id="state">BOOTING</span><span>terminal-first · browser runtime</span></div>
</div>`;

const nav = navigator as Navigator & { deviceMemory?: number };
const term = new Terminal({
  convertEol: true,
  cursorBlink: true,
  scrollback: 10000,
  fontSize: 15,
  fontFamily: "Cascadia Mono, Consolas, Menlo, Monaco, monospace",
  theme: { background: "#070707", foreground: "#d7d7d7", cursor: "#42a5ff", selectionBackground: "#23425f" }
});
const fit = new FitAddon();
term.loadAddon(fit);
term.open(document.querySelector("#terminal")!);
fit.fit();

const banner = [
  "┌─(vidit㉿ViditShringi)-[~]",
  "└─$ fastfetch",
  "",
  "            .--.                         vidit@ViditShringi",
  "           |o_o |                        -----------------",
  "           |:_/ |                        OS: WebTermux browser runtime",
  "          //   \\ \\                       Host: WebAssembly/browser sandbox",
  "         (|     | )                      Kernel: browser-managed runtime",
  "        /'\\_   _/\\`                      Shell: bash-style terminal",
  "        \\___)=(___/                      Terminal: xterm.js",
  "",
  `                                         Browser: ${nav.userAgent}`,
  `                                         CPU: ${nav.hardwareConcurrency ?? "unknown"} logical cores`,
  `                                         Memory: ${nav.deviceMemory ?? "unknown"} GiB (browser exposed)`,
  `                                         Display: ${screen.width}x${screen.height}`,
  "                                         Network: browser sandbox",
  "",
  "                 I N T E R N S H I E L D",
  "                       W E B T E R M U X",
  "",
  "  Terminal ready. Type 'help'.",
  ""
].join("\r\n");

let prompt = "└─$ ";
let input = "";

function promptNow() { term.write("\r\n" + prompt); }

function help() {
  term.writeln("\r\nCommands:");
  term.writeln("  help       show this help");
  term.writeln("  fastfetch  runtime information");
  term.writeln("  about      project information");
  term.writeln("  pwd        virtual home");
  term.writeln("  ls         virtual workspace");
  term.writeln("  echo TEXT  print text");
  term.writeln("  date       current date");
  term.writeln("  clear      clear screen");
}

function run(line: string) {
  const s = line.trim();
  if (!s) { promptNow(); return; }
  const [cmd, ...args] = s.split(/\s+/);

  if (cmd === "help") help();
  else if (cmd === "fastfetch") {
    term.writeln("\r\nOS       WebTermux browser runtime");
    term.writeln("Host     WebAssembly/browser sandbox");
    term.writeln(`Browser  ${nav.userAgent}`);
    term.writeln(`CPU      ${nav.hardwareConcurrency ?? "unknown"} logical cores`);
    term.writeln(`Memory   ${nav.deviceMemory ?? "unknown"} GiB`);
    term.writeln(`Display  ${screen.width}x${screen.height}`);
  } else if (cmd === "about") {
    term.writeln("\r\nInternShield WebTermux");
    term.writeln("Terminal-first browser workspace.");
    term.writeln("The frontend reports only browser-observable facts.");
    term.writeln("A later Cloudflare backend can attach a real isolated Linux PTY.");
  } else if (cmd === "pwd") term.writeln("/home/vidit");
  else if (cmd === "ls") term.writeln("Desktop  Downloads  labs  notes  projects");
  else if (cmd === "echo") term.writeln(args.join(" "));
  else if (cmd === "date") term.writeln(new Date().toString());
  else if (cmd === "clear") term.clear();
  else {
    term.writeln(`\r\n${cmd}: command not found`);
    term.writeln("Use 'help' for commands in this browser build.");
  }
  promptNow();
}

term.onData((data) => {
  for (const ch of data) {
    if (ch === "\r") {
      term.write("\r\n");
      run(input);
      input = "";
    } else if (ch === "\u007f") {
      if (input) { input = input.slice(0, -1); term.write("\b \b"); }
    } else if (ch === "\u0003") {
      input = "";
      term.write("^C");
      promptNow();
    } else if (ch >= " " && ch <= "~") {
      input += ch;
      term.write(ch);
    }
  }
});

const themes: Record<string, {background:string;foreground:string;cursor:string;selectionBackground:string}> = {
  A: {background:"#05080c",foreground:"#4da6ff",cursor:"#4da6ff",selectionBackground:"#18324f"},
  B: {background:"#050805",foreground:"#48ff7f",cursor:"#48ff7f",selectionBackground:"#164322"},
  C: {background:"#090505",foreground:"#ff586b",cursor:"#ff586b",selectionBackground:"#542027"},
  D: {background:"#050505",foreground:"#f4f4f4",cursor:"#ffffff",selectionBackground:"#333333"},
  E: {background:"#050505",foreground:"#7cf7ff",cursor:"#ffcf70",selectionBackground:"#27414a"}
};
document.querySelectorAll<HTMLButtonElement>("[data-theme]").forEach((button) => {
  button.addEventListener("click", () => {
    term.options.theme = themes[button.dataset.theme ?? "A"];
  });
});
document.querySelector("#clear")?.addEventListener("click", () => term.clear());
window.addEventListener("resize", () => fit.fit());
term.write(banner);
term.write("\r\n" + prompt);
document.querySelector("#state")!.textContent = "READY";
