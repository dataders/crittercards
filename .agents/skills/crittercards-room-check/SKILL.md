---
name: crittercards-room-check
description: Check Crittercards room play with two headless clients. Use for joining, deck readiness, turn handoff, stale actions, polling, or reconnect after a room or transport change.
---

# Crittercards room check

Run the server contract smoke test from the repo root.

```sh
node .agents/skills/crittercards-room-check/scripts/check-room.mjs
```

The script starts a fresh in-memory server on an ephemeral loopback port and closes it when done. It exercises room creation and joining, deck confirmation, host start, a stale revision, both seats taking a turn, and resume with the saved seat credential.

- For a specific change, inspect the relevant path in `server.mjs`, `transport.mjs`, or `app.mjs`, then add a targeted scratch probe. Check both seats' revisions and state before and after the action. Use snapshots or controlled timers to observe convergence, with a deadline for polling.
- On a stale action, check that neither the revision nor state advanced, that the conflict response gives the current snapshot, and that a valid action can continue from it. For reconnect, distinguish a temporary request failure from a confirmed expired room or invalid seat. Test ticket retention or polling in the client layer when that behavior is in scope.
- If the environment blocks loopback, check the server handler in process where practical and report that boundary. The included script tests HTTP behavior. Browser storage, UI behavior, and cross-device connectivity require their own observations.
- Report the first divergent status, revision, state, or seat and the step that produced it. Keep seat tokens out of output and saved evidence. Add a permanent test or make a product change when the user requests one.
