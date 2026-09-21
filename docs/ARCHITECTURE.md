# WebTermux Architecture

## Runtime

```
Browser xterm.js
      |
      | WebSocket
      v
Cloudflare Worker (Free)
      |
      | signed WebSocket proxy
      v
Cloudflare Tunnel
      |
      v
Linux PTY backend
      |
      +---- Docker session: Debian
      +---- Docker session: Ubuntu
      +---- Docker session: Arch
```

The browser is only the terminal UI. Linux command execution happens on the backend host.

## Per-session isolation

Each browser session gets:

- one opaque UUID session ID
- one Linux profile
- one Docker container
- one writable workspace directory

The profile images are separate real distributions. apt is used in Debian/Ubuntu, pacman in Arch.

## Tooling

Developer:
git, gcc/g++, clang, make, cmake, gdb, Python 3, pip, Perl, Node.js/npm, Go, Rust, curl, wget, OpenSSL, jq, tmux, vim, nano and common Unix utilities.

Security learning:
nmap, tcpdump, netcat, DNS/IP tools and related utilities.

The public service should be operated only with an appropriate network policy and authorized lab targets.

## Why Cloudflare Free

The Worker is used as the public gateway because Workers Free supports WebSockets. Cloudflare Tunnel is used to reach the Linux backend without opening an inbound port. The Linux compute is therefore outside the paid Workers Containers product.
