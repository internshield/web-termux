FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8
ENV TERM=xterm-256color

RUN apt-get update && apt-get install -y --no-install-recommends \
    bash bash-completion sudo ca-certificates \
    build-essential clang lld cmake gdb make git curl wget openssl \
    python3 python3-pip python3-venv python3-dev perl \
    nodejs npm golang-go rustc cargo \
    nmap tcpdump netcat-openbsd iproute2 iputils-ping dnsutils traceroute \
    jq tree tmux vim nano less file zip unzip tar gzip bzip2 xz-utils \
    sqlite3 strace lsof socat ripgrep \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -m -s /bin/bash -u 1000 internshield \
    && echo 'internshield ALL=(ALL) NOPASSWD: /usr/bin/apt, /usr/bin/apt-get, /usr/bin/apt-cache' > /etc/sudoers.d/internshield \
    && chmod 0440 /etc/sudoers.d/internshield \
    && mkdir -p /home/internshield/.config /workspace \
    && chown -R internshield:internshield /home/internshield /workspace \
    && printf '#!/bin/sh\nexec sudo /usr/bin/apt "$@"\n' > /usr/local/bin/apt \
    && printf '#!/bin/sh\nexec sudo /usr/bin/apt-get "$@"\n' > /usr/local/bin/apt-get \
    && chmod +x /usr/local/bin/apt /usr/local/bin/apt-get

COPY banner.sh /usr/local/bin/webtermux-banner
RUN chmod +x /usr/local/bin/webtermux-banner \
    && printf '\nwebtermux-banner\n' >> /home/internshield/.bash_profile \
    && printf '\nPS1="\\[\\e[1;32m\\]\\u@webtermux\\[\\e[0m\\]:\\[\\e[1;34m\\]\\w\\[\\e[0m\\]\\$ "\n' >> /home/internshield/.bashrc \
    && chown internshield:internshield /home/internshield/.bash_profile /home/internshield/.bashrc

USER internshield
WORKDIR /workspace

CMD ["sleep", "infinity"]
