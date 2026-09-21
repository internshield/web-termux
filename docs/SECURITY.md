# Security

WebTermux is a public terminal surface, so isolation is the primary boundary.

Required controls:

- one isolated sandbox session per active terminal
- non-root default user
- CPU, memory, disk and process limits
- idle timeout and explicit cleanup
- no host filesystem mounts
- no provider credentials inside the guest
- opaque session identifiers
- rate limiting / abuse controls
- audit only the minimum metadata needed for operations
- downloadable files stay inside the user's workspace/export path
- security tools are restricted to authorized learning labs and CTF targets

Do not make a shared shell for all visitors.

If network-enabled tooling is offered, isolate it in a separate lab profile and apply explicit egress/target controls. Do not treat a public unauthenticated terminal as an unrestricted scanner.
