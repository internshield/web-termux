# Linux profiles

WebTermux has one public site but uses isolated Linux sandboxes.

## Current default

The production Sandbox image is Ubuntu-based and includes a broad developer and security-learning toolchain:

- bash, git
- gcc/g++, make/cmake/gdb
- Python 3, pip and venv
- Perl
- Node.js/npm from the Cloudflare base
- nmap, tcpdump, netcat
- curl/wget, OpenSSL
- common Unix utilities

## Planned selectable profiles

- **Debian** — real Debian userspace + apt
- **Ubuntu** — real Ubuntu userspace + apt
- **Arch** — real Arch userspace + pacman

These must be separate images. Do not install apt and pacman into one filesystem and present it as multiple authentic distributions.

Security tooling is intended for authorized labs, CTFs and systems the user is permitted to test.
