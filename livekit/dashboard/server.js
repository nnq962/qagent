import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { RoomServiceClient } from 'livekit-server-sdk';

const files = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
  '/style.css': ['style.css', 'text/css; charset=utf-8'],
};
const date = (seconds) => Number(seconds) > 0 ? new Date(Number(seconds) * 1000).toISOString() : null;

export function createDashboard(client) {
  return createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'self'; frame-ancestors 'none'; base-uri 'none'");
    const json = (status, body) => {
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(body));
    };
    if (req.method !== 'GET') return json(405, { error: 'Chỉ hỗ trợ GET.' });
    const pathname = new URL(req.url, 'http://localhost').pathname;
    try {
      if (pathname === '/api/rooms') {
        const listed = await client.listRooms();
        // Bound concurrency when querying rooms. A room may close between API calls.
        const rooms = [];
        for (let i = 0; i < listed.length; i += 8) {
          rooms.push(...await Promise.all(listed.slice(i, i + 8).map(async (room) => {
            let participants;
            try {
              participants = await client.listParticipants(room.name);
            } catch (error) {
              if (error.code === 'not_found' || error.status === 404) return null;
              throw error;
            }
            return {
              sid: room.sid, name: room.name, createdAt: date(room.creationTime),
              participants: participants.map((p) => ({
                identity: p.identity, name: p.name || p.identity,
                isAgent: p.kind === 4, state: p.state,
                joinedAt: date(p.joinedAt),
                tracks: p.tracks.map((t) => ({
                  sid: t.sid, type: ['audio', 'video', 'data'][t.type] || 'unknown', muted: t.muted,
                })),
              })),
            };
          })));
        }
        return json(200, { updatedAt: new Date().toISOString(), rooms: rooms.filter(Boolean) });
      }
      const file = files[pathname];
      if (!file) return json(404, { error: 'Không tìm thấy trang.' });
      const content = await readFile(new URL(`./public/${file[0]}`, import.meta.url));
      res.writeHead(200, { 'Content-Type': file[1] });
      res.end(content);
    } catch {
      // Never expose upstream errors or credentials in the browser response.
      json(502, { error: 'Không lấy được dữ liệu LiveKit. Kiểm tra server và cấu hình API key/secret.' });
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { LIVEKIT_API_KEY, LIVEKIT_API_SECRET } = process.env;
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) throw new Error('Missing LiveKit credentials');
  const client = new RoomServiceClient(
    process.env.LIVEKIT_HTTP_URL || 'http://127.0.0.1:7880',
    LIVEKIT_API_KEY, LIVEKIT_API_SECRET,
    { requestTimeout: 5 },
  );
  const host = process.env.DASHBOARD_HOST || '127.0.0.1';
  const port = Number(process.env.DASHBOARD_PORT || 3080);
  const server = createDashboard(client);
  server.listen(port, host, () => console.log(`Dashboard: http://${host}:${port}`));
  process.on('SIGTERM', () => server.close());
  process.on('SIGINT', () => server.close());
}
