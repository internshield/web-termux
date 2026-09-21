FROM docker.io/cloudflare/sandbox:0.7.0-python

ENV DEBIAN_FRONTEND=noninteractive
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8

RUN apt-get update && apt-get install -y --no-install-recommends \
    bash bash-completion build-essential gcc g++ make cmake gdb git curl wget ca-certificates openssl \
    nmap netcat-openbsd tcpdump iproute2 iputils-ping dnsutils traceroute jq tree tmux vim nano less file \
    zip unzip tar gzip bzip2 xz-utils perl python3 python3-pip python3-venv python3-dev pkg-config sudo procps htop \
    && rm -rf /var/lib/apt/lists/*

RUN useradd --create-home --shell /bin/bash internshield \
    && mkdir -p /workspace \
    && chown -R internshield:internshield /workspace \
    && echo 'internshield ALL=(ALL) NOPASSWD: /usr/bin/apt-get, /usr/bin/apt-cache' > /etc/sudoers.d/internshield \
    && chmod 0440 /etc/sudoers.d/internshield

USER internshield
WORKDIR /workspace

ENV SHELL=/bin/bash
ENV TERM=xterm-256color

CMD ["bash", "-l"]
