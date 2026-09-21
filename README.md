# WebTermux

**InternShield WebTermux** is a terminal-first browser Linux workspace backed by a real server-side Linux PTY.

The browser is only the terminal UI. Linux command execution happens inside a Cloudflare Sandbox container and is streamed through a WebSocket PTY. Cloudflare's current terminal model is:

`Browser xterm.js <-> WebSocket <-> Worker <-> Sandbox PTY (bash)`.

## Target environment

The Linux image is intended to provide a broad developer/security-learning toolchain, including:

- Debian/Ubuntu-family `apt`
- Arch-family `pacman`
- `bash`, `coreutils`, `curl`, `wget`, `git`
- `gcc`, `g++`, `make`, `cmake`, `gdb`, `pkg-config`
- Python 3 + `pip` + virtual environments
- Perl
- Node.js + npm
- Go and Rust toolchains where image size permits
- `vim`, `nano`, `tmux`, `htop`, `tree`, `jq`, `zip`, `unzip`
- security-learning tools such as `nmap`, `openssl`, `tcpdump`, `netcat`, and lab utilities

Do not present multiple distributions as one fake system. The production design should use selectable Linux images/profiles:

- **Debian** — stable general-purpose Linux + apt
- **Ubuntu** — developer/education profile + apt
- **Arch** — rolling developer/security profile + pacman

A single user session gets one Linux image/profile at a time.

## Public-site architecture

```
Browser
  |
  | xterm.js / WebSocket
  v
Cloudflare Worker
  |
  | Sandbox terminal()
  v
Isolated Linux PTY
  |
  +-- filesystem
  +-- compiler/toolchains
  +-- Python/Perl/Node
  +-- security-learning tools
```

The public site can serve everyone from one domain, but the runtime should create isolated sandbox sessions rather than one shared shell.

## Security boundary

The terminal is for development, education, CTFs and systems the user is authorized to test.

A public security terminal should not expose the host filesystem, Cloudflare credentials, other users' sessions, or provider metadata. Network access and high-risk tooling should be constrained to authorized labs/CTF targets rather than turned into an unrestricted public attack platform.

## Local ZIP-derived ideas

The supplied `web-terminal` project contains a useful reference pattern: xterm.js + WebSocket + per-session Linux containers, non-root execution, resource limits, session expiry and explicit cleanup.

Those ideas are carried forward here, while the production backend is moved to Cloudflare Sandbox/PTy instead of requiring a Docker socket on the public web server.

## Deploy

Use the GitHub repository as the source of truth and deploy the Worker with Wrangler. The Worker exposes:

- `/terminal` — WebSocket PTY endpoint
- `/health` — health check
- static assets — Vite build output

Cloudflare Containers/Sandbox currently require Workers Paid and are usage-billed; Containers can scale to zero when idle. Budget for concurrent terminals before making the service fully public.

## License

MIT
