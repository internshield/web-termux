# Cloudflare runtime

WebTermux uses Cloudflare Workers + Sandbox terminal PTY.

The terminal endpoint is `/terminal`. The browser uses xterm.js and `SandboxAddon` to connect over WebSocket. Cloudflare's current Sandbox terminal API is designed for persistent PTY connections, including resize/reconnect handling.

## Linux image strategy

The public service should expose one domain with isolated sessions. Distribution selection is a session/profile attribute, not a shared filesystem.

Profiles:
- Debian: apt + stable dev/security-learning toolchain
- Ubuntu: apt + developer/education toolchain
- Arch: pacman + rolling developer/security-learning toolchain

A single guest should remain internally consistent; do not install apt and pacman side-by-side simply to claim multiple distributions.

## ZIP-derived reference

The supplied reference project used xterm.js + WebSocket + one container per connection, non-root execution, resource limits, idle cleanup, and rate limiting. WebTermux carries the isolation principles forward while replacing a Docker-socket host with Cloudflare Sandbox.

## Cost awareness

Cloudflare Containers/Sandbox are usage-based on Workers Paid. Concurrent terminals consume CPU/memory/disk resources, so enforce quotas and idle timeouts before opening the service broadly.
