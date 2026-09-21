# Security

Use security tooling only against systems and labs you are authorized to test.

Do not expose a shared PTY to unrelated users. A production runtime should isolate filesystem/process/network resources, use opaque sessions, expire idle sessions, and keep provider secrets outside the guest.