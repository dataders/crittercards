import assert from 'node:assert/strict';
import { open } from 'node:fs/promises';
import { Readable, Writable } from 'node:stream';
import test from 'node:test';

import { createGameServer } from '../server.mjs';

async function request(url, method = 'GET', headers = {}) {
  const input = Object.assign(Readable.from([]), { url, method, headers });
  const [handle] = createGameServer().listeners('request');
  const chunks = [];
  const response = new Writable({
    write(chunk, _encoding, callback) {
      chunks.push(chunk);
      callback();
    },
  });
  response.writeHead = function (status, responseHeaders) {
    this.status = status;
    this.headers = responseHeaders;
    return this;
  };
  await handle(input, response);
  return { status: response.status, headers: response.headers, body: Buffer.concat(chunks) };
}

test('soundtrack downloads retain metadata, validators, and byte-accurate partial responses', async () => {
  const name = 'crittercards-faster-soundtrack-one-hour.mp3';
  const path = `/downloads/${name}`;
  const head = await request(path, 'HEAD');
  assert.equal(head.status, 200);
  assert.equal(head.headers['Content-Type'], 'audio/mpeg');
  assert.equal(head.headers['Content-Disposition'], `attachment; filename="${name}"`);
  assert.equal(head.body.length, 0);

  const firstBytes = await request(path, 'GET', { range: 'bytes=2-7' });
  assert.equal(firstBytes.status, 206);
  assert.equal(firstBytes.headers['Content-Range'], `bytes 2-7/${head.headers['Content-Length']}`);
  assert.equal(firstBytes.headers['Content-Length'], 6);
  const file = await open(new URL(`../assets/${name}`, import.meta.url));
  try {
    const expected = Buffer.alloc(6);
    await file.read(expected, 0, expected.length, 2);
    assert.deepEqual(firstBytes.body, expected);
  } finally {
    await file.close();
  }
  const unchanged = await request(path, 'GET', { 'if-none-match': head.headers.ETag });
  assert.equal(unchanged.status, 304);
  assert.equal(unchanged.body.length, 0);

  const album = await request('/assets/crittercards-enchanted-woods-album.zip', 'HEAD');
  assert.equal(album.status, 200);
  assert.equal(album.headers['Content-Type'], 'application/zip');
  assert.match(album.headers['Content-Disposition'], /^attachment/);
});
