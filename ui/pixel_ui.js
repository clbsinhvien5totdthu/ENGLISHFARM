// ====== PIXEL UI: chân dung NPC (vẽ bằng code, 32x32) + bảng cửa hàng kiểu Stardew ======
// Không cần file ảnh: mỗi chân dung được vẽ lên canvas 32x32 rồi phóng to bằng image-rendering:pixelated.
(() => {
const EF = (window.EF = window.EF || {});
const P = EF.Pixel = {};
const OUT = '#2a1b10', W = 32;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));

// ---------- bộ vẽ lưới pixel ----------
const grid = () => {
  const px = new Array(W * W).fill(null);
  const g = {
    px,
    set: (x, y, c) => { if (x >= 0 && y >= 0 && x < W && y < W) px[y * W + x] = c; },
    rect: (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) g.set(x + i, y + j, c); },
    row: (y, x0, x1, c) => { for (let x = x0; x <= x1; x++) g.set(x, y, c); }
  };
  return g;
};
const SKIN = { pale:['#fbe0c8', '#eab898'], light:['#f6d2ae', '#e2a97c'], tan:['#e0a878', '#c4875a'], dark:['#c98a5a', '#a86a40'] };

// ---------- hồ sơ từng NPC ----------
const NPC = {
  mia:   { name:'Mia', role:'Market Keeper', bg:'#f7d9a8', skin:'light', hair:'#7a4a2a', style:'short', hat:{ t:'scarf', c:'#e8873a', c2:'#f6c27a' }, top:'#5b9a55', acc:'#f1e3c0', outfit:'apron', blush:1 },
  lily:  { name:'Lily', role:'Plant Workshop', bg:'#cfe8c0', skin:'pale', hair:'#2a2230', style:'long', flower:'#ee7fa6', top:'#f4e4ea', acc:'#e87aa0', outfit:'collar', blush:1 },
  chef:  { name:'Chef Bo', role:'Food Stall', bg:'#f0c8b0', skin:'tan', hair:'#4a2c18', style:'none', hat:{ t:'chef' }, beard:{ t:'stache', c:'#4a2c18' }, top:'#fdfdf8', acc:'#d94c3f', outfit:'chef' },
  sam:   { name:'Sam', role:'Exchange Student', bg:'#b8d4f0', skin:'light', hair:'#2a2438', style:'spiky', top:'#3f6fb0', acc:'#e0a63a', outfit:'pack' },
  daisy: { name:'Daisy', role:'Guide of Visitors', bg:'#d8f0b8', skin:'pale', hair:'#e8c050', style:'pigtails', flower:'#ffffff', top:'#f2c84a', acc:'#ffffff', outfit:'collar', blush:1 },
  pete:  { name:'Pete', role:'English Corner', bg:'#d8e0f0', skin:'tan', hair:'#b8b4ac', style:'short', hat:{ t:'cap', c:'#c8a870', c2:'#a88650' }, beard:{ t:'stache', c:'#b8b4ac' }, top:'#8a5a30', acc:'#f1e3c0', outfit:'vest' },
  moss:  { name:'Elder Moss', role:'Keeper of Memories', bg:'#b8d8b0', skin:'light', hair:'#e8e8e8', style:'none', hat:{ t:'wizard', c:'#3f7a4a', c2:'#d9a63a' }, beard:{ t:'long', c:'#ececec' }, top:'#5a8a5a', acc:'#d9a63a', outfit:'robe' },
  hai:   { name:'Captain Hai', role:'River Guide', bg:'#a8d0e8', skin:'dark', hair:'#2a2420', style:'none', hat:{ t:'sailor', c:'#f4f0e6', c2:'#27406e' }, beard:{ t:'stubble', c:'#5a3a24' }, top:'#f4f0e6', acc:'#27406e', outfit:'stripe' },
  emma:  { name:'Emma', role:'The Mentor', bg:'#e8d8f0', skin:'pale', hair:'#a0522d', style:'bun', glasses:1, top:'#3a8a8a', acc:'#ffffff', outfit:'collar', blush:1 },
  dinh:  { name:'Cụ Đình trưởng', role:'Đình làng', bg:'#e8d0a0', skin:'tan', hair:'#d8d4cc', style:'none', hat:{ t:'khan', c:'#2c2a34', c2:'#d9a63a' }, beard:{ t:'long', c:'#e6e2da' }, top:'#7a4a2a', acc:'#d9a63a', outfit:'robe' },
  grandpa:{ name:'Grandpa', role:'The Mystery', bg:'#e8e0c8', skin:'light', hair:'#d0d0d0', style:'short', glasses:1, beard:{ t:'stache', c:'#d0d0d0' }, top:'#8a6a4a', acc:'#f1e3c0', outfit:'vest' },
  guest: { name:'Khách', role:'Visitor', bg:'#d8d8e8', skin:'light', hair:'#6a4a30', style:'short', top:'#7a5ab0', acc:'#f1e3c0', outfit:'collar' }
};

// ---------- vẽ một chân dung ----------
const draw = n => {
  const g = grid(), [s1, s2] = SKIN[n.skin] || SKIN.light, h = n.hair, hh = n.hat, st = n.style;
  const dk = (c, a) => c; // chỗ để mở rộng đổ bóng sau này
  // tóc phía sau
  if (st === 'long') { g.rect(8, 7, 16, 20, h); g.rect(7, 12, 1, 12, h); g.rect(24, 12, 1, 12, h); }
  if (st === 'pigtails') { [6, 23].forEach(x => { g.rect(x, 9, 3, 2, '#e8603a'); g.rect(x, 11, 3, 7, h); g.rect(x + (x < 10 ? 0 : 1), 18, 2, 3, h); }); }
  // thân áo
  const body = [[24, 9, 22], [25, 8, 23], [26, 7, 24]];
  body.forEach(([y, a, b]) => g.row(y, a, b, n.top));
  for (let y = 27; y < W; y++) g.row(y, 6, 25, n.top);
  // chi tiết trang phục
  const o = n.outfit;
  if (o === 'apron') { g.rect(11, 26, 10, 6, n.acc); g.rect(12, 24, 1, 2, n.acc); g.rect(19, 24, 1, 2, n.acc); g.rect(15, 28, 2, 2, '#d9a63a'); }
  if (o === 'pack') { g.rect(10, 25, 2, 7, n.acc); g.rect(20, 25, 2, 7, n.acc); g.rect(15, 28, 2, 4, '#2c4f86'); }
  if (o === 'vest') { g.rect(7, 26, 5, 6, n.acc); g.rect(20, 26, 5, 6, n.acc); g.rect(15, 26, 2, 6, '#5a3a1c'); g.set(13, 28, '#d9a63a'); g.set(18, 28, '#d9a63a'); }
  if (o === 'chef') { g.rect(14, 25, 4, 2, n.acc); g.set(16, 28, '#c9c4b0'); g.set(16, 30, '#c9c4b0'); g.rect(9, 27, 1, 5, '#e3dfcf'); }
  if (o === 'stripe') { g.row(28, 6, 25, n.acc); g.row(30, 6, 25, n.acc); g.rect(13, 25, 6, 1, '#d94c3f'); }
  if (o === 'robe') { g.rect(15, 25, 2, 7, n.acc); g.rect(6, 29, 20, 1, n.acc); g.rect(7, 26, 1, 6, '#00000022'); }
  if (o === 'collar') { g.rect(11, 24, 3, 2, n.acc); g.rect(18, 24, 3, 2, n.acc); g.set(13, 26, n.acc); g.set(18, 26, n.acc); }
  // cổ + mặt
  g.rect(14, 22, 4, 3, s2); g.rect(14, 24, 4, 1, s2);
  g.row(9, 12, 19, s1); g.row(10, 11, 20, s1);
  for (let y = 11; y <= 19; y++) g.row(y, 10, 21, s1);
  g.row(20, 11, 20, s1); g.row(21, 12, 19, s1); g.row(22, 13, 18, s1);
  g.rect(9, 14, 1, 3, s1); g.rect(22, 14, 1, 3, s1);              // tai
  // tóc phía trước
  if (st !== 'none' && st !== 'bald') {
    g.row(6, 12, 19, h); g.row(7, 10, 21, h); g.row(8, 9, 22, h); g.row(9, 9, 22, h);
    g.row(10, 9, 12, h); g.row(10, 19, 22, h);
    g.rect(9, 11, 2, 4, h); g.rect(21, 11, 2, 4, h);
    g.row(10, 14, 16, h);                                            // mái lệch
    if (st === 'spiky') { [[11, 5], [14, 4], [17, 5], [20, 4], [12, 4], [19, 5]].forEach(([x, y]) => g.set(x, y, h)); g.row(5, 11, 21, h); g.set(15, 3, h); g.set(18, 3, h); }
    if (st === 'bun') { g.row(2, 14, 17, h); g.row(3, 13, 18, h); g.row(4, 13, 18, h); g.row(5, 14, 17, h); }
  } else {
    g.rect(9, 12, 2, 4, h); g.rect(21, 12, 2, 4, h);                // tóc mai hai bên
  }
  // lông mày + mắt + mũi + miệng
  g.row(13, 12, 14, h === '#e8e8e8' ? '#c9c9c9' : h); g.row(13, 17, 19, h === '#e8e8e8' ? '#c9c9c9' : h);
  g.rect(13, 15, 1, 2, OUT); g.rect(18, 15, 1, 2, OUT);
  g.set(13, 15, '#ffffff'); g.set(18, 15, '#ffffff'); g.set(13, 16, OUT); g.set(18, 16, OUT);
  g.rect(13, 15, 1, 1, OUT); g.rect(18, 15, 1, 1, OUT);
  g.set(15, 17, s2); g.set(16, 17, s2);
  if (n.blush) { g.rect(11, 18, 2, 1, '#f0a090'); g.rect(19, 18, 2, 1, '#f0a090'); }
  g.row(19, 14, 17, '#a23f35'); g.set(13, 19, s2); g.set(18, 19, s2);
  // râu
  const b = n.beard;
  if (b) {
    if (b.t === 'stache') { g.rect(12, 18, 8, 1, b.c); g.set(11, 19, b.c); g.set(20, 19, b.c); g.row(19, 14, 17, '#a23f35'); }
    if (b.t === 'stubble') { [[11, 19], [12, 20], [13, 21], [15, 21], [17, 21], [19, 20], [20, 19], [14, 22], [17, 22], [12, 18], [19, 18]].forEach(([x, y]) => g.set(x, y, b.c)); }
    if (b.t === 'long') {
      g.rect(12, 18, 8, 1, b.c); g.set(10, 17, b.c); g.set(21, 17, b.c); g.rect(10, 18, 2, 3, b.c); g.rect(20, 18, 2, 3, b.c);
      g.rect(11, 20, 10, 2, b.c); g.rect(12, 22, 8, 2, b.c); g.rect(13, 24, 6, 2, b.c); g.rect(14, 26, 4, 2, b.c); g.rect(15, 28, 2, 1, b.c);
      g.row(19, 14, 17, '#a23f35');
    }
  }
  // kính
  if (n.glasses) {
    const L = '#3a2a1a';
    [[11, 14], [17, 14]].forEach(([x, y]) => { g.rect(x, y, 5, 1, L); g.rect(x, y + 3, 5, 1, L); g.rect(x, y, 1, 4, L); g.rect(x + 4, y, 1, 4, L); g.rect(x + 1, y + 1, 3, 2, '#ffffff55'); });
    g.set(16, 15, L); g.set(13, 15, OUT); g.set(18, 15, OUT); g.set(13, 16, OUT); g.set(18, 16, OUT);
  }
  // mũ
  if (hh) {
    if (hh.t === 'chef') {
      g.row(0, 12, 19, '#fdfdf8'); g.row(1, 10, 21, '#fdfdf8'); for (let y = 2; y <= 6; y++) g.row(y, 9, 22, '#fdfdf8');
      g.rect(13, 2, 1, 4, '#dcd8c8'); g.rect(18, 2, 1, 4, '#dcd8c8'); g.rect(10, 7, 12, 2, '#fdfdf8'); g.row(8, 10, 21, '#dcd8c8');
    }
    if (hh.t === 'cap') { g.row(4, 12, 19, hh.c); g.row(5, 10, 21, hh.c); g.rect(9, 6, 14, 3, hh.c); g.rect(8, 8, 16, 2, hh.c2); g.rect(14, 5, 4, 1, hh.c2); }
    if (hh.t === 'wizard') {
      for (let y = 0; y <= 7; y++) { const hw = 1 + Math.round(y * 1.25); g.row(y, 16 - hw, 15 + hw, hh.c); }
      g.rect(10, 7, 12, 1, hh.c2); g.rect(6, 8, 20, 2, hh.c); g.set(14, 4, hh.c2); g.set(17, 2, hh.c2); g.set(18, 5, hh.c2);
    }
    if (hh.t === 'sailor') {
      g.row(3, 12, 19, hh.c); g.row(4, 10, 21, hh.c); g.rect(9, 5, 14, 3, hh.c); g.rect(9, 7, 14, 2, hh.c2); g.rect(8, 9, 16, 1, hh.c2);
      g.rect(15, 4, 2, 2, '#d9a63a'); g.set(15, 6, '#d9a63a'); g.set(16, 6, '#d9a63a');
    }
    if (hh.t === 'scarf') {
      g.row(4, 12, 19, hh.c); g.row(5, 10, 21, hh.c); g.rect(9, 6, 14, 4, hh.c); g.rect(9, 9, 14, 1, hh.c2);
      [[12, 6], [16, 7], [20, 6], [14, 8], [19, 8]].forEach(([x, y]) => g.set(x, y, hh.c2)); g.rect(22, 8, 3, 3, hh.c); g.rect(23, 11, 2, 2, hh.c);
    }
    if (hh.t === 'khan') {
      g.row(2, 12, 19, hh.c); g.row(3, 10, 21, hh.c); for (let y = 4; y <= 7; y++) g.row(y, 9, 22, hh.c);
      g.rect(9, 8, 14, 1, hh.c2); g.rect(9, 9, 14, 1, hh.c); g.set(14, 5, '#46424e'); g.set(17, 4, '#46424e'); g.set(19, 6, '#46424e');
    }
  }
  // hoa cài tóc
  if (n.flower) {
    const fx = 20, fy = n.style === 'pigtails' ? 5 : 6;
    [[1, 0], [0, 1], [2, 1], [1, 2]].forEach(([dx, dy]) => g.set(fx + dx, fy + dy, n.flower)); g.set(fx + 1, fy + 1, '#f2b632');
    if (n.flower === '#ffffff') { g.set(fx, fy, '#ffffff'); g.set(fx + 2, fy, '#ffffff'); g.set(fx, fy + 2, '#ffffff'); g.set(fx + 2, fy + 2, '#ffffff'); }
  }
  // viền đen quanh hình
  const full = g.px.slice();
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    if (full[y * W + x]) continue;
    const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const X = x + dx, Y = y + dy; return X >= 0 && Y >= 0 && X < W && Y < W && full[Y * W + X]; });
    if (nb) g.px[y * W + x] = OUT;
  }
  return g.px;
};

const cache = {};
const toURL = (px, w) => {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = px.length / w;
  const ctx = cv.getContext('2d');
  px.forEach((c, i) => { if (c) { ctx.fillStyle = c; ctx.fillRect(i % w, (i / w) | 0, 1, 1); } });
  return cv.toDataURL();
};
P.portrait = id => cache[id] || (cache[id] = toURL(draw(NPC[id] || NPC.guest), W));
P.bg = id => (NPC[id] || NPC.guest).bg;

// đồng xu pixel 10x10
const COIN = [
  '..oooooo..', '.oyyyyyyo.', 'oyYYYYYYdo', 'oyYddddYdo', 'oyYdyydYdo', 'oyYdyydYdo', 'oyYddddYdo', 'oyYYYYYYdo', '.oddddddo.', '..oooooo..'
];
P.coin = () => cache.coin || (cache.coin = toURL(COIN.join('').split('').map(ch => ({ o:'#6a3d12', y:'#ffe27a', Y:'#f2b632', d:'#c47c1a' }[ch] || null)), 10));

// ---------- nhận diện NPC theo tiêu đề cửa sổ ----------
const EMO = /[\u{1F000}-\u{1FFFF}\u{2190}-\u{2BFF}\uFE0F\u200D]/gu;
const clean = t => String(t || '').replace(EMO, '').replace(/\s+/g, ' ').trim();
const RULES = [[/\bmia\b/i, 'mia'], [/lily|linh|plant workshop/i, 'lily'], [/chef|bo\b/i, 'chef'], [/\bsam\b/i, 'sam'], [/daisy/i, 'daisy'],
  [/pete|english corner/i, 'pete'], [/moss|cụ mộc/i, 'moss'], [/hai\b/i, 'hai'], [/emma/i, 'emma'], [/đình|dinh/i, 'dinh'], [/grandpa/i, 'grandpa'],
  [/customer|guest|visitor|khách/i, 'guest']];
// who: id NPC ép buộc ('-' = không dùng chân dung)
P.npcFor = (title, who) => {
  if (who === '-') return null;
  if (who && NPC[who]) return who;
  const t = clean(title);
  for (const [re, id] of RULES) if (re.test(t)) return id;
  return null;
};
P.plate = (title, id) => {
  const t = clean(title), p = t.split('·').map(s => s.trim()), n = NPC[id] || NPC.guest;
  const isGuest = id === 'guest';
  return { name: isGuest ? (p[0] || n.name) : n.name, role: p[1] && !isGuest ? p[1] : n.role };
};
// gắn chân dung vào #mPortrait
P.fill = (el, title, who) => {
  const id = P.npcFor(title, who);
  if (!id) { el.hidden = true; el.innerHTML = ''; return false; }
  const pl = P.plate(title, id);
  el.style.setProperty('--pbg', P.bg(id));
  el.innerHTML = `<div class="pf"><img src="${P.portrait(id)}" alt="" width="124" height="124"></div><div class="np"><b>${esc(pl.name)}</b><small>${esc(pl.role)}</small></div>`;
  el.hidden = false; return true;
};

// ====== CỬA HÀNG (Stardew style) ======
// opts: { npc, say:[en, vi], coins, qty, items:[{icon,name,vi,price,off,lock,lvl,own,fn}], inv:[{icon,n,sel,tip,fn}], setQty(q) }
const S = EF.ShopUI = {};
S.html = o => {
  const rows = o.items.map((it, i) => `<button type="button" class="sh-row${it.lock ? ' lock' : ''}" data-i="${i}"${it.off ? ' disabled' : ''}>` +
    `<span class="sh-ic">${it.lock ? '<i class="sh-pad"></i>' : it.icon}</span>` +
    `<span class="sh-nm"><b>${esc(it.name)}</b><small>${it.lock ? 'Mở khóa ở Lv ' + it.lvl : esc(it.vi) + (it.own ? ' · đang có ' + it.own : '')}</small></span>` +
    `<span class="sh-pr${!it.lock && it.off ? ' poor' : ''}">${it.lock ? '🔒' : it.price + ' <img src="' + P.coin() + '" alt="🪙" width="20" height="20">'}</span></button>`).join('');
  const SLOTS = 24;
  const slots = Array.from({ length: SLOTS }, (_, i) => {
    const s = o.inv[i];
    return s ? `<button type="button" class="sh-slot full${s.sel ? ' sel' : ''}" data-s="${i}" title="${esc(s.tip)}">${s.icon}<b>${s.n}</b></button>` : '<span class="sh-slot"></span>';
  }).join('');
  const q = [1, 5, 10].map(n => `<button type="button" class="sh-q${o.qty === n ? ' on' : ''}" data-q="${n}">×${n}</button>`).join('');
  const say = o.say || ['', ''];
  return `<div class="sh">
    <div class="sh-who"><div class="pf" style="--pbg:${P.bg(o.npc)}"><img src="${P.portrait(o.npc)}" alt="" width="124" height="124"></div>
      <div class="sh-say"><b>“${esc(say[0])}”</b><small>${esc(say[1])}</small></div></div>
    <div class="sh-main"><div class="sh-top"><span>🌱 Hạt giống</span><span class="sh-qty">Mua mỗi lần ${q}</span></div><div class="sh-list">${rows}</div></div>
    <div class="sh-bot"><div class="sh-coins"><img src="${P.coin()}" alt="" width="24" height="24"> <b>${o.coins}</b> <small>· Lv ${o.lvl}</small></div><div class="sh-inv">${slots}</div>
    <small class="sh-hint">Bấm hạt trong túi để cầm gieo. Học bài với cô Emma để lên cấp, mở thêm hạt.</small></div></div>`;
};
S.bind = (root, o) => {
  const snd = n => { try { EF.host.snd(n); } catch (e) {} };
  root.querySelectorAll('.sh-row').forEach(b => b.onclick = () => { const it = o.items[+b.dataset.i]; if (it && !it.off) it.fn(); });
  root.querySelectorAll('.sh-slot.full').forEach(b => b.onclick = () => { snd('select'); const it = o.inv[+b.dataset.s]; if (it) it.fn(); });
  root.querySelectorAll('.sh-q').forEach(b => b.onclick = () => { snd('click'); o.setQty(+b.dataset.q); });
};
})();
