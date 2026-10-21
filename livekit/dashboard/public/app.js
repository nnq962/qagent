const $ = (id) => document.getElementById(id);
let snapshot = null;
let busy = false;
const expanded = new Set();
const time = (value) => value ? new Date(value).toLocaleString('vi-VN') : '—';
function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function render() {
  if (!snapshot) return;
  const all = snapshot.rooms;
  const participants = all.flatMap((r) => r.participants);
  $('room-count').textContent = all.length;
  $('participant-count').textContent = participants.length;
  $('audio-count').textContent = participants.flatMap((p) => p.tracks).filter((t) => t.type === 'audio').length;
  const query = $('search').value.trim().toLocaleLowerCase('vi');
  const rooms = all.filter((r) => [r.name, ...r.participants.flatMap((p) => [p.name, p.identity])].some((v) => v.toLocaleLowerCase('vi').includes(query)));
  const container = $('rooms');
  container.replaceChildren();
  if (!rooms.length) {
    const empty = element('div', undefined, 'empty');
    empty.append(element('div', '◉', 'empty-icon'), element('h3', all.length ? 'Không tìm thấy kết quả' : 'Chưa có phòng nào đang mở'));
    empty.append(element('p', all.length ? 'Thử tìm bằng tên phòng hoặc identity khác.' : 'Khi người dùng hoặc bot tham gia, phòng sẽ xuất hiện tại đây.'));
    container.append(empty);
  }
  const currentNames = new Set(all.map((r) => r.name));
  for (const name of expanded) if (!currentNames.has(name)) expanded.delete(name);
  for (const room of rooms) {
    const details = element('details', undefined, 'room');
    details.open = expanded.has(room.name) || !!query;
    details.addEventListener('toggle', () => details.open ? expanded.add(room.name) : expanded.delete(room.name));
    const summary = element('summary');
    const title = element('div');
    title.append(element('strong', room.name), element('small', `Tạo lúc ${time(room.createdAt)}`));
    summary.append(title, element('span', `${room.participants.length} kết nối`, 'badge'));
    details.append(summary);
    if (!room.participants.length) details.append(element('p', 'Phòng đang mở, chưa có người tham gia.', 'room-empty'));
    else {
      const wrap = element('div', undefined, 'table-wrap');
      const table = element('table');
      const head = element('thead');
      const row = element('tr');
      for (const label of ['Người tham gia', 'Loại', 'Trạng thái', 'Tham gia lúc', 'Track đang phát']) row.append(element('th', label));
      head.append(row);
      const body = element('tbody');
      for (const p of room.participants) {
        const tr = element('tr');
        const person = element('td');
        person.append(element('strong', p.name), element('small', p.identity));
        tr.append(person, element('td', p.isAgent ? 'AI agent' : 'Participant'), element('td', ['Đang kết nối', 'Đã tham gia', 'Đang hoạt động', 'Đã ngắt kết nối'][p.state] || 'Không rõ'), element('td', time(p.joinedAt)));
        const tracks = element('td');
        if (!p.tracks.length) tracks.textContent = 'Chưa có track';
        for (const t of p.tracks) tracks.append(element('span', `${t.type}${t.muted ? ' · đã tắt' : ''}`, 'track'));
        tr.append(tracks);
        body.append(tr);
      }
      table.append(head, body);
      wrap.append(table);
      details.append(wrap);
    }
    container.append(details);
  }
}
async function refresh() {
  if (busy) return;
  busy = true;
  $('refresh').disabled = true;
  try {
    const response = await fetch('/api/rooms', { signal: AbortSignal.timeout(15000), cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    snapshot = data;
    render();
    $('status').textContent = '● LiveKit đang trực tuyến';
    $('status').className = 'online';
    $('updated').textContent = `Cập nhật ${time(data.updatedAt)} · Mỗi 5 giây`;
    $('error').hidden = true;
  } catch (error) {
    $('status').textContent = '● Không thể cập nhật';
    $('status').className = 'offline';
    $('error').textContent = error.name === 'TimeoutError' ? 'Server phản hồi quá lâu. Hệ thống sẽ tự thử lại.' : (error.message || 'Không kết nối được dashboard.');
    $('error').hidden = false;
    if (!snapshot) $('rooms').replaceChildren(element('div', 'Chưa tải được dữ liệu. Hệ thống sẽ tự thử lại sau 5 giây.', 'empty'));
    else $('updated').textContent = `Dữ liệu cũ từ ${time(snapshot.updatedAt)}`;
  } finally {
    busy = false;
    $('refresh').disabled = false;
  }
}
$('search').addEventListener('input', render);
$('refresh').addEventListener('click', refresh);
await refresh();
setInterval(refresh, 5000);
