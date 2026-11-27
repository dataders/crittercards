// Room state includes seat credentials, so it must only live in a private datastore.
export function memoryRoomStore() {
  const rooms = new Map();
  let pending = Promise.resolve();
  return {
    withRooms(fn) {
      const next = pending.then(() => fn(rooms));
      pending = next.catch(() => {});
      return next;
    },
  };
}

export function postgresRoomStore(connectionString) {
  let poolPromise;
  async function pool() {
    poolPromise ??= (async () => {
      const { Pool } = await import('pg');
      const db = new Pool({ connectionString, connectionTimeoutMillis: 5000 });
      await db.query('CREATE TABLE IF NOT EXISTS critter_room_store (id integer PRIMARY KEY CHECK (id = 1), rooms jsonb NOT NULL)');
      await db.query("INSERT INTO critter_room_store (id, rooms) VALUES (1, '{}'::jsonb) ON CONFLICT DO NOTHING");
      return db;
    })().catch((error) => { poolPromise = undefined; throw error; });
    return poolPromise;
  }
  return {
    async withRooms(fn) {
      const db = await pool();
      const client = await db.connect();
      try {
        await client.query('BEGIN');
        const result = await client.query('SELECT rooms FROM critter_room_store WHERE id = 1 FOR UPDATE');
        const rooms = new Map(Object.entries(result.rows[0].rooms));
        const value = await fn(rooms);
        await client.query('UPDATE critter_room_store SET rooms = $1::jsonb WHERE id = 1', [JSON.stringify(Object.fromEntries(rooms))]);
        await client.query('COMMIT');
        return value;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    },
  };
}
