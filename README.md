# WebTermux

**InternShield WebTermux** is a terminal-first browser Linux workspace backed by a real server-side Linux PTY.

The public site stays on the Cloudflare Workers Free plan. Cloudflare only handles the terminal frontend and WebSocket gateway. Linux execution runs on a Linux host through isolated Docker containers.

## Runtime

```
Browser xterm.js
  -> Cloudflare Worker (Free)
  -> WebSocket
  -> Cloudflare Tunnel
  -> Linux PTY backend
  -> one isolated Docker container per session
```

The browser never fabricates Linux kernel, disk, IP, GPU or wireless facts.

## Linux profiles

Each session uses one real Linux distribution:

- **Debian** — apt
- **Ubuntu** — apt
- **Arch** — pacman

The images include a broad developer and security-learning toolchain:

```
bash git
gcc g++ clang
make cmake gdb
python3 pip venv
perl
node npm
go rust
curl wget openssl
jq tmux vim nano
sqlite3 strace lsof socat ripgrep
nmap tcpdump netcat
dnsutils iproute2 ping traceroute
zip unzip tar gzip bzip2 xz
```

Use `Ctrl+Shift+1/2/3` to change the profile without adding website UI.

## Session isolation

Every browser gets a random session ID. The backend maps that session to:

- one Linux profile
- one Docker container
- one private writable workspace

The backend applies CPU, memory, PID and idle-session limits.

## Free-plan deployment

See [docs/FREE-PLAN-DEPLOYMENT.md](docs/FREE-PLAN-DEPLOYMENT.md).

Cloudflare Worker build settings:

```
Build command:  npm run build
Deploy command: npx wrangler deploy
```

Worker variables:

```
BACKEND_URL
BACKEND_SECRET
```

The Linux backend uses the same secret as `WEBTERMUX_SHARED_SECRET`.

## ZIP-derived ideas

The supplied `web-terminal` reference contributed the useful architecture ideas of xterm.js + WebSocket + per-session containers, non-root sessions, resource limits, idle cleanup and explicit workspace isolation.

## Security

The execution backend should only be operated on a trusted Linux host. Its Docker socket is never exposed to browsers. The backend binds to localhost and is published through Cloudflare Tunnel.

Security tools are for authorized labs, CTFs and systems the operator/user is permitted to test. Do not operate the service as an unrestricted public attack platform.

## License

MIT
