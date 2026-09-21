# Free-plan deployment

WebTermux keeps the public web application on the Cloudflare Workers Free plan.

Cloudflare Worker:
- serves the terminal frontend
- upgrades browser connections to WebSocket
- signs the session/profile request
- forwards the WebSocket to the external PTY backend

Linux backend:
- runs on a Linux host, VM or server
- runs isolated Docker containers per session
- exposes localhost port 8787 only
- is published through a Cloudflare Tunnel

## Why

Cloudflare Workers Free supports WebSockets, while Cloudflare Containers/Sandbox is a paid-plan product. The Linux execution therefore stays on infrastructure you control.

## Backend host

Install Docker and Node.js 24+ on a Linux machine.

From the repository:

```bash
cd backend
npm install
```

Build all three Linux profiles:

```bash
cd ..
chmod +x backend/build-images.sh
./backend/build-images.sh
```

Create a backend secret:

```bash
openssl rand -hex 32
```

Create `backend/.env`:

```env
WEBTERMUX_SHARED_SECRET=<same-long-secret-used-in-Cloudflare>
```

Start the backend:

```bash
cd backend
docker compose up -d --build
```

Verify locally:

```bash
curl http://127.0.0.1:8787/health
```

The backend must not be exposed directly to the public Internet.

## Cloudflare Tunnel

Create a named Cloudflare Tunnel and publish:

`terminal-backend.<your-domain>` -> `http://localhost:8787`

Cloudflare Tunnel supports WebSockets and is available on all plans. It keeps the backend off the public Internet.

Set these Worker environment variables in Workers & Pages -> Settings -> Variables:

- `BACKEND_URL` = `https://terminal-backend.<your-domain>`
- `BACKEND_SECRET` = the same secret as `WEBTERMUX_SHARED_SECRET`

Do not commit the secret to GitHub.

## Worker build settings

Build command:

```text
npm run build
```

Deploy command:

```text
npx wrangler deploy
```

No Containers flag is needed.

## Profiles

The browser has no extra UI. Use:

- `Ctrl+Shift+1` -> Debian
- `Ctrl+Shift+2` -> Ubuntu
- `Ctrl+Shift+3` -> Arch

The selected profile is stored locally in the browser. Each profile gets a separate isolated container and workspace.

## Limits

The backend defaults are bounded:

- 25 sessions
- 2 GiB RAM per container
- 2 vCPU per container
- 256 processes per container
- 30 minute idle cleanup

Security tooling is for authorized labs, CTFs and systems the user is permitted to test.
