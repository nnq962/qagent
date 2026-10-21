import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDashboard } from '../server.js';

async function serve(t, client) {
  const server = createDashboard(client);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return `http://127.0.0.1:${server.address().port}`;
}

test('room snapshots handle bigint timestamps and preserve participant/track details', async (t) => {
  const base = await serve(t, {
    listRooms: async () => [{ sid: 'RM_test', name: '<script>test</script>', creationTime: 1700000000n }],
    listParticipants: async () => [{ identity: 'agent-1', name: 'Bot', kind: 4, state: 2, joinedAt: 1700000001n, tracks: [{ sid: 'TR_1', type: 0, muted: true }] }],
  });
  const response = await fetch(`${base}/api/rooms`);
  assert.equal(response.status, 200);
  const { rooms } = await response.json();
  assert.equal(rooms[0].createdAt, '2023-11-14T22:13:20.000Z');
  assert.equal(rooms[0].participants[0].isAgent, true);
  assert.deepEqual(rooms[0].participants[0].tracks, [{ sid: 'TR_1', type: 'audio', muted: true }]);
  assert.equal((await fetch(`${base}/api/rooms`, { method: 'POST' })).status, 405);
  assert.equal((await fetch(`${base}/.env`)).status, 404);
});

test('closed rooms are skipped when they disappear during polling', async (t) => {
  const base = await serve(t, {
    listRooms: async () => [{ name: 'closed' }],
    listParticipants: async () => { throw Object.assign(new Error('closed'), { code: 'not_found' }); },
  });
  assert.deepEqual((await (await fetch(`${base}/api/rooms`)).json()).rooms, []);
});

test('upstream errors return 502 without leaking secret/error details', async (t) => {
  const base = await serve(t, { listRooms: async () => { throw new Error('private-key-or-secret'); } });
  const response = await fetch(`${base}/api/rooms`);
  assert.equal(response.status, 502);
  assert.doesNotMatch(await response.text(), /private-key-or-secret/);
});
