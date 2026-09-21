FROM archlinux:base

ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8
ENV TERM=xterm-256color

RUN pacman -Syu --noconfirm \
    base-devel clang lld cmake gdb git curl wget openssl \
    python python-pip perl nodejs npm go rust \
    nmap tcpdump openbsd-netcat iproute2 iputils bind traceroute \
    jq tree tmux vim nano less file zip unzip tar gzip bzip2 xz \
    sqlite strace lsof socat ripgrep sudo \
    && pacman -Scc --noconfirm

RUN groupadd --gid 10001 internshield \
    && useradd -m -s /bin/bash -u 10001 -g 10001 internshield \
    && echo 'internshield ALL=(ALL) NOPASSWD: ALL' > /etc/sudoers.d/internshield \
    && chmod 0440 /etc/sudoers.d/internshield \
    && mkdir -p /workspace \
    && chown -R internshield:internshield /home/internshield /workspace

COPY banner.sh /usr/local/bin/webtermux-banner
RUN chmod +x /usr/local/bin/webtermux-banner \
    && printf '\nwebtermux-banner\n' >> /home/internshield/.bash_profile \
    && printf '\nPS1="\\[\\e[1;32m\\]\\u@webtermux\\[\\e[0m\\]:\\[\\e[1;34m\\]\\w\\[\\e[0m\\]\\$ "' >> /home/internshield/.bashrc \
    && chown internshield:internshield /home/internshield/.bash_profile /home/internshield/.bashrc

USER internshield
WORKDIR /workspace

CMD ["sleep", "infinity"]
