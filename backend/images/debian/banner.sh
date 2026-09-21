#!/usr/bin/env bash
printf '\033[1;34m╔══════════════════════════════════════════════════════╗\033[0m\n'
printf '\033[1;36m║                INTERN SHIELD / WEBTERMUX            ║\033[0m\n'
printf '\033[1;34m╚══════════════════════════════════════════════════════╝\033[0m\n'
printf '\033[1;32mOS:\033[0m '; . /etc/os-release; printf '%s %s\n' "$NAME" "$VERSION_ID"
printf '\033[1;32mKernel:\033[0m '; uname -srmo
printf '\033[1;32mShell:\033[0m '; printf '%s\n' "$SHELL"
printf '\033[1;32mUser:\033[0m '; id -un
printf '\033[1;32mWorkspace:\033[0m '; pwd
printf '\033[90mTools: git gcc g++ clang cmake gdb python3 perl node npm go rust nmap tcpdump nc\033[0m\n\n'
