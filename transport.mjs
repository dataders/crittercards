const pollDelay = 800;

async function request(path, { method = 'GET', token, data } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (data !== undefined) headers['Content-Type'] = 'application/json';

  const response = await fetch(path, {
    method,
    headers,
    body: data === undefined ? undefined : JSON.stringify(data),
    signal: AbortSignal.timeout(10000),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload) {
    const error = new Error(payload?.message ?? 'The room server is unavailable.');
    error.status = response.status;
    error.snapshot = payload?.snapshot;
    throw error;
  }
  return payload;
}

function roomPath(code) {
  return `/api/rooms/${encodeURIComponent(String(code).trim().toUpperCase())}`;
}

function connect(data) {
  const { token, ...initial } = data;
  const path = roomPath(initial.code);
  let subscription;
  let latest = initial;

  const room = {
    ...initial,
    token,
    async act(action) {
      try {
        const snapshot = await request(`${path}/actions`, {
          method: 'POST', token, data: { action, revision: latest.revision },
        });
        accept(snapshot);
        return latest;
      } catch (error) {
        if (error.snapshot) accept(error.snapshot);
        throw error;
      }
    },

    watch(onSnapshot, onError) {
      subscription?.stop();
      let stopped = false;
      let timer;
      let lastError;

      async function poll() {
        let snapshot;
        try {
          snapshot = await request(path, { token });
        } catch (error) {
          if (stopped) return;
          if (lastError !== error.message) onError?.(error);
          lastError = error.message;
          if ([403, 404, 410].includes(error.status)) {
            stop();
            return;
          }
        }

        if (stopped) return;
        if (snapshot) {
          const recovered = Boolean(lastError);
          lastError = undefined;
          accept(snapshot, recovered);
        }
        if (!stopped) timer = setTimeout(poll, pollDelay);
      }

      function stop() {
        stopped = true;
        clearTimeout(timer);
        if (subscription?.stop === stop) subscription = undefined;
      }

      subscription = { stop, onSnapshot };
      timer = setTimeout(poll, 0);
      return stop;
    },
  };

  function accept(snapshot, recovered = false) {
    if (snapshot.revision > latest.revision) {
      latest = snapshot;
      Object.assign(room, snapshot);
      subscription?.onSnapshot?.(latest);
    } else if (recovered) {
      subscription?.onSnapshot?.(latest);
    }
  }

  return room;
}

export async function createRoom(critterId) {
  return connect(await request('/api/rooms', { method: 'POST', data: { critterId } }));
}

export async function joinRoom(code, critterId) {
  return connect(await request(`${roomPath(code)}/join`, { method: 'POST', data: { critterId } }));
}

export async function resumeRoom(code, token) {
  return connect({ ...await request(roomPath(code), { token }), token });
}
