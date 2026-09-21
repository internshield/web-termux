# WebTermux Architecture

## Runtime

Browser xterm.js
-> WebSocket
-> Cloudflare Worker
-> Cloudflare Sandbox terminal
-> real Linux PTY
-> bash

The browser must never fake Linux kernel, disk, IP, GPU or wireless facts.

## Linux profiles

The runtime image should be published as three profiles:

1. Debian
2. Ubuntu
3. Arch

The profile selector changes the container image used for a new session. Do not mix apt and pacman binaries into a single distro and call it authentic.

## Workspace

Each session receives a private workspace. Future persistence can use a per-user object/storage key, but public sessions must never share a writable filesystem.

## Tooling

General development:
git, gcc/g++, make/cmake, gdb, Python, Perl, Node/npm, Go, Rust, curl, wget, jq, tmux.

Security learning:
nmap, openssl, tcpdump, netcat and lab-specific tooling.

High-risk tooling should be placed in explicit authorized lab images with additional target/network controls.

## Data paths

- Worker: routing and session policy
- Sandbox: Linux process/filesystem
- R2/Durable Objects/D1: optional persistence, metadata and exports
