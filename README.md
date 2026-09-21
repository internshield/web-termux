# WebTermux

InternShield terminal-first browser workspace.

The UI is intentionally terminal-first: black canvas, shell prompt, fastfetch-style startup, ANSI-oriented themes and xterm.js.

## Important

This repository currently contains the frontend terminal experience. A real server-side Linux PTY requires a runtime backend (Cloudflare Worker + isolated container/PTY, or another Linux host).

The browser frontend never falsely reports host kernel, disk, GPU, IP, or wireless capabilities.

Use security tooling only in systems and labs you are authorized to test.

MIT License
