# Linux profiles

WebTermux uses one public terminal site with isolated real Linux profiles.

## Debian

Real Debian Bookworm userspace with `apt`.

Includes development, scripting, networking and security-learning tools such as:

`git gcc g++ clang make cmake gdb python3 perl node npm go rust nmap tcpdump netcat curl wget openssl`.

## Ubuntu

Real Ubuntu 24.04 userspace with `apt`.

The same broad developer/security-learning toolchain is installed.

## Arch

Real Arch Linux userspace with `pacman`.

The image uses Arch's native packages and includes the corresponding development, scripting, networking and security-learning tools.

## Important

Do not mix apt and pacman into one filesystem and call it a real multi-distro environment. The Worker selects the profile when a session is created.

Use:

- Ctrl+Shift+1 = Debian
- Ctrl+Shift+2 = Ubuntu
- Ctrl+Shift+3 = Arch
