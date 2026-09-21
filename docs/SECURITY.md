# Security

WebTermux is a public terminal surface. The execution host is the important security boundary.

Required controls:

- never expose the Docker socket to untrusted users directly
- backend port binds to localhost
- Cloudflare Tunnel is the only public path to the backend
- backend requires a secret signature from the Worker
- one Docker container per browser session
- non-root default user inside Linux profiles
- CPU, memory and PID limits
- idle timeout and container cleanup
- workspace is the only host directory mounted into a session
- no host filesystem mounts
- no provider/API credentials inside sessions
- no shared shell between users
- use a separate lab network/policy for authorized security testing

The current backend uses a Docker socket because the host service creates per-session containers. Keep the backend host trusted and do not publish its Docker API.

Network-capable security tools are included for education and authorized testing. Do not use the public service to attack systems you do not own or have permission to test.
