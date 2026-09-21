# Architecture

Phase 1: terminal-first static frontend using xterm.js.

Production target:
Browser xterm.js -> WebSocket -> Cloudflare Worker -> isolated Linux runtime/container -> PTY -> bash.

The frontend must not fabricate host kernel, disk, GPU, IP or wireless facts.