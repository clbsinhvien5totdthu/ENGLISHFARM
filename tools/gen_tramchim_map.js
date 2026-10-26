// Sinh bản đồ + vị trí vật thể Tràm Chim (thiết kế sẵn bố cục, không còn là nhiễu ngẫu nhiên).
//   node tools/gen_tramchim_map.js   ->  tools/tramchim_layout.json  +  tools/tramchim_layout.px.js  (pxl đọc qua include)
// Một nguồn dữ liệu duy nhất: pxl dùng nó để vẽ nền + bóng cây, pack_tramchim_pxl.py nhúng nó vào tramchim_assets.js cho game.
//
// Ký tự ô (16px ảnh gốc = 32px trong game):
//   ~ nước sâu (chặn)   - nước nông (lội được)   o nước nông có sen/súng
//   m bùn ướt   d bùn khô nứt   r bãi lau sậy   g cỏ   s cỏ năn   w nền rừng tràm   p lối đất   = ván gỗ (cầu / bến)
const fs = require('fs'), path = require('path');
const W = 50, H = 40, TS = 32;

function rngf(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const hash = (x, y, s) => { let h = (x * 374761393 + y * 668265263 + s * 69069) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
const vn = (x, y, s) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
const R = rngf(20261024);

const K = []; for (let y = 0; y < H; y++) K.push(new Array(W).fill('g'));
const get = (x, y) => (K[y] && K[y][x]) || null;
const set = (x, y, c) => { if (x >= 0 && y >= 0 && x < W && y < H) K[y][x] = c; };
const isWater = c => c === '~' || c === '-' || c === 'o';
const isLand = c => c && !isWater(c) && c !== '=';
// vùng elip có viền lượn sóng
const blob = (cx, cy, rx, ry, wob, seed) => (x, y) => { const dx = (x - cx) / rx, dy = (y - cy) / ry, d = Math.sqrt(dx * dx + dy * dy); return d < 1 + wob * (vn(x / 3.1, y / 3.1, seed) - .5) * 2; };
const fillIf = (inside, c, only) => { for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (inside(x, y) && (!only || only.includes(K[y][x]))) K[y][x] = c; };

// ---- 1. nền: cỏ xanh, đồng cỏ năn vàng ở phía tây + bắc ----
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const n = vn(x / 6.5, y / 6.5, 3), bias = (1 - x / W) * .12 + (1 - y / H) * .06;
  if (n + bias > .66) K[y][x] = 's';
}
// ---- 2. rừng tràm (nền rừng) ----
[[40, 7, 8, 6], [45, 27, 5, 4.5], [3, 25, 4.5, 5.5], [15, 2.5, 8, 3.2], [45, 36, 5, 3.4], [2, 37, 4, 3]].forEach(([cx, cy, rx, ry], i) => fillIf(blob(cx, cy, rx, ry, .35, 20 + i), 'w'));

// ---- 3. nước ----
const L1 = blob(22, 14, 13.5, 7.4, .3, 31), L1deep = blob(22.5, 14.5, 10.2, 5.0, .34, 32);
fillIf(L1, '-'); fillIf(L1deep, '~');
const BAY = blob(5.5, 34, 7.5, 4.6, .3, 33), BAYdeep = blob(4.5, 34, 4.3, 2.4, .35, 34);
fillIf(BAY, '-'); fillIf(BAYdeep, '~');
const NWP = blob(7, 8, 4.8, 3.2, .3, 35); fillIf(NWP, '-'); fillIf(blob(7, 8, 2.4, 1.4, .3, 36), '~');
const P3 = blob(34, 33, 3.6, 2.6, .3, 37); fillIf(P3, '-'); fillIf(blob(34, 33, 1.8, 1.1, .3, 38), '~');
const P4 = blob(12, 27, 3.2, 2.2, .3, 39); fillIf(P4, '-'); fillIf(blob(12, 27, 1.4, .8, .3, 40), '~');
// kênh phía đông: từ đầu đông của hồ chảy xuống góc đông-nam
const chan = [[34, 16], [38, 19], [41, 24], [41.5, 30], [44, 34], [46.5, 39]];
function thick(poly, wDeep, wShal, wob, seed) {
  for (let i = 0; i < poly.length - 1; i++) {
    const [x0, y0] = poly[i], [x1, y1] = poly[i + 1], n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2);
    for (let t = 0; t <= n; t++) {
      const x = x0 + (x1 - x0) * t / n, y = y0 + (y1 - y0) * t / n, w = wob * (vn(x / 4, y / 4, seed) - .5) * 2;
      for (let yy = Math.floor(y - wShal - 2); yy <= Math.ceil(y + wShal + 2); yy++) for (let xx = Math.floor(x - wShal - 2); xx <= Math.ceil(x + wShal + 2); xx++) {
        const d = Math.hypot(xx - x, yy - y); if (d < wDeep + w) set(xx, yy, '~'); else if (d < wShal + w && K[yy] && K[yy][xx] !== '~') set(xx, yy, '-');
      }
    }
  }
}
thick(chan, 1.2, 2.6, .5, 41);
// rừng tràm ngập nước phía đông-bắc + đầm cây chết phía bắc: nước nông xen đất rừng
fillIf((x, y) => blob(40, 7, 8, 6, .35, 20)(x, y) && vn(x / 3.4, y / 3.4, 51) > .56, '-', ['w']);
fillIf((x, y) => blob(15, 2.5, 8, 3.2, .35, 23)(x, y) && vn(x / 3.0, y / 3.0, 52) > .5, '-', ['w', 'g', 's']);
fillIf(blob(15, 2.5, 5.5, 1.6, .3, 53), '~', ['-']);
// vịnh nhỏ phía bắc-đông dưới rừng: nối thông ra hồ
fillIf(blob(33, 10, 3.5, 2.3, .3, 54), '-', ['g', 's', 'w']);
// ---- 4. đảo nhỏ giữa hồ cho chòi quan sát ----
const ISL = blob(22, 12.2, 3.4, 2.5, .15, 55);
fillIf(blob(22, 12.4, 5.0, 3.8, .2, 56), '-');                  // quầng nước nông bao quanh đảo
fillIf(ISL, 'g');
fillIf(blob(22, 12.6, 2.1, 1.3, .1, 57), 'w');

// ---- 5. lối đi + ván gỗ ----
const roadCells = [];
function road(poly, w, mark) {
  for (let i = 0; i < poly.length - 1; i++) {
    const [x0, y0] = poly[i], [x1, y1] = poly[i + 1], n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 3);
    for (let t = 0; t <= n; t++) {
      const x = x0 + (x1 - x0) * t / n, y = y0 + (y1 - y0) * t / n, h = w / 2;
      for (let yy = Math.floor(y - h); yy <= Math.ceil(y + h); yy++) for (let xx = Math.floor(x - h); xx <= Math.ceil(x + h); xx++) {
        if (Math.hypot(xx + .5 - x - .5, yy + .5 - y - .5) > h + .1) continue;
        const c = get(xx, yy); if (c == null) continue;
        if (isWater(c) || c === '=') { if (mark !== 'noplank') set(xx, yy, '='); } else if (c !== '=') set(xx, yy, 'p');
      }
    }
  }
}
const wob = (x0, y0, x1, y1, n, amp, seed) => { const out = [[x0, y0]]; for (let i = 1; i < n; i++) { const t = i / n; out.push([x0 + (x1 - x0) * t + (vn(i * 1.7, seed, seed) - .5) * amp, y0 + (y1 - y0) * t + (vn(seed, i * 1.9, seed + 1) - .5) * amp]); } out.push([x1, y1]); return out; };
// trục chính: cổng vào (23,39) → bờ nam hồ → ván gỗ ra đảo chòi
road(wob(23, 39.5, 23, 22, 9, 4.2, 3), 2.0);
// ván gỗ thẳng ra đảo (2 ô rộng), chồng lên mặt nước
for (let y = 15; y <= 22; y++) { for (const x of [22, 23]) { if (!isLand(K[y][x]) || y >= 19) set(x, y, '='); else set(x, y, 'p'); } }
for (let y = 15; y <= 22; y++) for (const x of [22, 23]) if (K[y][x] !== '=' && isWater(K[y][x])) set(x, y, '=');
// nhánh tây: xuống bến thuyền ở vịnh
road(wob(21, 29, 13, 33.5, 6, 2.6, 7), 1.7);
// nhánh đông: sang cầu bắc qua kênh → rừng tràm đông
road(wob(25, 27, 38, 26.5, 7, 3.0, 9), 1.7);
for (let y = 25; y <= 28; y++) for (let x = 38; x <= 45; x++) if (isWater(K[y][x])) set(x, y, '=');
road(wob(44, 26.5, 46, 31, 3, 1, 11), 1.7);
// vòng ven hồ phía tây → bắc → đông-bắc
road(wob(20, 28.5, 12, 24, 5, 2.4, 13).concat(wob(12, 24, 6, 17, 4, 2.2, 14).slice(1)).concat(wob(6, 17, 5.5, 11, 3, 2, 15).slice(1)), 1.7);
road(wob(5.5, 11, 9, 5, 4, 2, 16).concat(wob(9, 5, 24, 4.5, 8, 4.4, 17).slice(1)).concat(wob(24, 4.5, 37, 6, 6, 3.6, 18).slice(1)), 1.7, 'noplank');
road(wob(37, 6, 38, 11, 3, 1.4, 19), 1.7);
// bệ gỗ nhỏ ở đảo + lối từ ván lên chòi
fillIf(blob(22.5, 13.3, 1.6, .9, .1, 58), 'p');

// ---- 6. bến thuyền (ván ngang ra vịnh) ----
for (let x = 7; x <= 13; x++) for (const y of [33, 34]) set(x, y, '=');
// ---- 7. bùn ven nước, bãi lau sậy, bãi bồi khô cho sếu ----
const near = (x, y, f, r = 1) => { for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (f(get(x + i, y + j))) return true; return false; };
const snap = K.map(r => r.slice());
for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
  const c = snap[y][x]; if (!(c === 'g' || c === 's' || c === 'w')) continue;
  if (Math.hypot(x - 22.5, y - 12.4) < 5.6) continue;                 // đảo chòi giữ cỏ xanh
  if (near(x, y, isWater) && vn(x / 2.2, y / 2.2, 61) > .6) K[y][x] = vn(x / 1.8, y / 1.8, 62) > .45 ? 'r' : 'm';
}
fillIf(blob(30.5, 30.5, 3.0, 1.5, .35, 63), 'd', ['g', 's', 'm', 'r']);
fillIf(blob(8, 20.5, 2.6, 1.5, .35, 64), 'd', ['g', 's', 'm', 'r']);
fillIf(blob(28, 6.5, 2.2, 1.2, .3, 65), 'd', ['g', 's', 'm', 'r', 'w']);
// ---- 8. sen / súng trong nước nông ----
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (K[y][x] === '-' && vn(x / 2.4, y / 2.4, 71) > .62) K[y][x] = 'o';
// lòng hồ sát bờ nam: chừa lối ván thoáng, không sen đè lên
for (let y = 15; y <= 22; y++) for (const x of [21, 24]) if (K[y][x] === 'o') K[y][x] = '-';
// cổng vào: đảm bảo hành lang cỏ/lối
for (let y = 33; y < H; y++) for (let x = 20; x <= 26; x++) if (!(K[y][x] === 'p')) K[y][x] = (vn(x / 3, y / 3, 9) > .62 ? 's' : 'g');
road([[23, 39.5], [23, 33]], 2.0);

// ---- kiểm tra thông được từ cổng vào ----
const walk = c => c && c !== '~';
const seen = new Set(['23,38']), q = [[23, 38]];
while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = x + dx, b = y + dy, k = a + ',' + b; if (a >= 0 && b >= 0 && a < W && b < H && walk(get(a, b)) && !seen.has(k)) { seen.add(k); q.push([a, b]); } } }
let lost = 0; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (walk(K[y][x]) && !seen.has(x + ',' + y)) lost++;

// =====================================================================
// VẬT THỂ (toạ độ game px, gốc = chân vật thể)
// =====================================================================
const objs = [], occ = [];                                    // occ: các vòng tròn đã chiếm chỗ (cx, cy, r) để không chồng lên nhau
const cellOf = (x, y) => get(Math.floor(x / TS), Math.floor(y / TS));
const free = (x, y, r) => occ.every(o => Math.hypot(o[0] - x, o[1] - y) >= o[2] + r);
const add = (k, x, y, extra, r) => { objs.push(Object.assign({ k, x: Math.round(x), y: Math.round(y) }, extra || {})); if (r) occ.push([x, y, r]); };
const cx = c => c * TS + TS / 2;
const pathNear = (x, y, r) => near(Math.floor(x / TS), Math.floor(y / TS), c => c === 'p' || c === '=', r);

// hero objects ---------------------------------------------------------
const hut = { x: cx(22) + 16, y: 13.3 * TS + 12 };            // chân chòi ở đảo
add('hut', hut.x, hut.y, {}, 62);
const boatPos = { x: 8 * TS + 6, y: 32.1 * TS + 8 };
add('boat', boatPos.x, boatPos.y, {}, 30);
add('sign', cx(24) + 22, 36.6 * TS, { text: 'Tràm Chim' }, 18);
{ let best = null, bd = 1e9; for (let y = 20; y <= 26; y++) for (let x = 18; x <= 28; x++) { const c = get(x, y); if ((c === 'g' || c === 's' || c === 'p') && get(x, y - 1) !== '~') { const d = Math.hypot(x - 25.2, y - 22.8) + (c === 'p' ? 3 : 0); if (d < bd) { bd = d; best = [x, y]; } } } add('sign', best[0] * TS + 16, best[1] * TS + 28, { text: 'Chòi' }, 14); }
add('netrack', 15.2 * TS, 31.2 * TS, {}, 30);
add('bench', 19.6 * TS, 24.2 * TS, {}, 24);
add('birdbox', cx(24) + 8, 29.2 * TS, {}, 12);
add('haystack', 33.4 * TS, 37.4 * TS, {}, 30);
// quầy hướng dẫn + Chú Tư (hướng dẫn viên) ở cổng vào, và 3 bảng thông tin dọc đường
const nearLand = (tx, ty, okSet) => { let best = null, bd = 1e9; for (let y = 2; y < H - 1; y++) for (let x = 2; x < W - 2; x++) { const c = get(x, y); if (!okSet.includes(c)) continue; const d = Math.hypot(x + .5 - tx, y + .5 - ty); if (d < bd) { bd = d; best = [x, y]; } } return best; };
const kio = nearLand(29.6, 34.4, 'gs'); add('kiosk', kio[0] * TS + 16, (kio[1] + 1) * TS - 2, {}, 46);
const gd = nearLand(27.3, 35.4, 'gs'); const guide = { x: gd[0] * TS + 16, y: gd[1] * TS + 20 };
const bd0 = nearLand(20.4, 23.6, 'gsp'); add('infoboard', bd0[0] * TS + 16, (bd0[1] + 1) * TS - 4, { id: 0 }, 22);
const bd1 = nearLand(37.0, 27.3, 'gsp'); add('infoboard', bd1[0] * TS + 16, (bd1[1] + 1) * TS - 4, { id: 1 }, 22);
const bd2 = nearLand(14.0, 32.4, 'gsp'); add('infoboard', bd2[0] * TS + 16, (bd2[1] + 1) * TS - 4, { id: 2 }, 22);
// cọc + dây lan can ở ván chính và bến
for (let y = 15; y <= 21; y += 2) { add('post', 22 * TS + 3, (y + 1) * TS, { lamp: y === 17 || y === 21 }, 0); add('post', 24 * TS - 3, (y + 1) * TS, { lamp: y === 19 }, 0); }
for (const x of [8, 10, 12]) { add('post', x * TS + 6, 33 * TS + 4, {}, 0); add('post', x * TS + 6, 35 * TS - 2, { lamp: x === 12 }, 0); }
for (const x of [39, 41, 43]) { add('post', x * TS + 6, 26 * TS + 4, {}, 0); add('post', x * TS + 6, 28 * TS - 2, { lamp: x === 41 }, 0); }
// đèn lồng ở cổng vào
add('lampost', cx(21) + 4, 37.2 * TS, {}, 10); add('lampost', cx(25) + 12, 37.2 * TS, {}, 10);

// tràm: rừng + vài cây lẻ ----------------------------------------------
const R2 = rngf(777);
const cand = [];
for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) cand.push([x, y]);
cand.sort(() => R2() - .5);
let nTree = 0;
for (const [x, y] of cand) {
  const c = K[y][x], px = x * TS + 6 + R2() * 20, py = y * TS + 10 + R2() * 20;
  if (pathNear(px, py, 1)) continue;
  const nearHut = Math.hypot(px - hut.x, py - hut.y) < 170; if (nearHut) continue;
  const nearGate = py > 31 * TS && px > 19 * TS && px < 28 * TS; if (nearGate) continue;
  const wood = c === 'w', shallowTree = c === '-' && near(x, y, v => v === 'w', 2), lone = (c === 'g' || c === 's') && R2() < .012;
  if (!(wood && R2() < .5) && !(shallowTree && R2() < .42) && !lone) continue;
  const big = R2();
  const kind = big < .3 ? 'tram2' : big < .68 ? 'tram0' : 'tram1', rr = kind === 'tram2' ? 40 : kind === 'tram0' ? 34 : 28;
  if (!free(px, py, rr * .55)) continue;
  add(kind, px, py, { w: c === '-' ? 1 : 0 }, rr * .55); nTree++;
}
// tràm chết đứng trong nước (đầm phía bắc + ven hồ bắc)
let nDead = 0;
for (const [x, y] of cand) { const c = K[y][x]; if (nDead >= 16) break;
  if (!(c === '~' || c === '-')) continue; if (!(y < 9 && x > 6 && x < 30) && !(y > 4 && y < 11 && x > 34 && x < 42)) continue;
  const px = x * TS + 8 + R2() * 16, py = y * TS + 14 + R2() * 14; if (!free(px, py, 30) || Math.hypot(px - hut.x, py - hut.y) < 190) continue;
  add('tram_dead' + (R2() < .5 ? 0 : 1), px, py, {}, 30); nDead++; }
// cây con rải rác
let nSap = 0; for (const [x, y] of cand) { if (nSap >= 14) break; const c = K[y][x]; if (c !== 'g' && c !== 's') continue; const px = x * TS + 16, py = y * TS + 24; if (pathNear(px, py, 1) || !free(px, py, 18) || Math.hypot(px - hut.x, py - hut.y) < 140 || (py > 31 * TS && px > 19 * TS && px < 28 * TS)) continue; if (R2() < .1) { add('sapling', px, py, {}, 12); nSap++; } }
// bụi hoa, bụi cây, đá, gốc cây
let nB = 0; for (const [x, y] of cand) { if (nB >= 34) break; const c = K[y][x]; if (c !== 'g' && c !== 's' && c !== 'w') continue; const px = x * TS + 8 + R2() * 16, py = y * TS + 14 + R2() * 14; if (pathNear(px, py, 1) || !free(px, py, 16)) continue; if (R2() < .12) { add(R2() < .5 ? 'bush0' : 'bush1', px, py, {}, 14); nB++; } }
let nR = 0; for (const [x, y] of cand) { if (nR >= 16) break; const c = K[y][x]; if (c === '~' || c === '=' || c === 'p') continue; const px = x * TS + 8 + R2() * 16, py = y * TS + 16 + R2() * 12; if (pathNear(px, py, 1) || !free(px, py, 14)) continue; if (R2() < .06) { add(['rock0', 'rock1', 'rock2', 'stump', 'log'][Math.floor(R2() * 5)], px, py, {}, 14); nR++; } }

// lau sậy, bồn bồn, cỏ năn: bám mép nước --------------------------------
for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
  const c = K[y][x];
  const px = x * TS + 16 + (R2() - .5) * 14, py = y * TS + 28 + (R2() - .5) * 8;
  if (c === 'r') { const n = 1 + (R2() < .6 ? 1 : 0); for (let i = 0; i < n; i++) add('reed' + Math.floor(R2() * 3), px + i * 11 - 5, py + i * 3, {}, 0); }
  else if (c === '-' && near(x, y, isLand) && R2() < .22 && !pathNear(px, py, 1)) add(R2() < .6 ? 'cattail' + Math.floor(R2() * 2) : 'reed' + Math.floor(R2() * 3), px, py, {}, 0);
  else if (c === 's' && R2() < .32 && !pathNear(px, py, 0)) add('sedgep' + Math.floor(R2() * 3), px, py - 6, {}, 0);
  else if (c === 'g' && R2() < .1 && !pathNear(px, py, 0)) add('gtall' + Math.floor(R2() * 2), px, py - 4, {}, 0);
  else if (c === 'w' && R2() < .16) add('fern', px, py - 4, {}, 0);
}
// sen, súng, lục bình ----------------------------------------------------
const pads = [], bigLotus = [];
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const c = K[y][x];
  if (c === 'o') {
    const n = 2 + Math.floor(R2() * 3);
    for (let i = 0; i < n; i++) { const px = x * TS + 4 + R2() * 24, py = y * TS + 4 + R2() * 24; pads.push({ k: (R2() < .5 ? 'padf' : 'pad') + Math.floor(R2() * 3), x: Math.round(px), y: Math.round(py) }); }
    if (R2() < .5) bigLotus.push({ k: 'lotus' + Math.floor(R2() * 3), x: Math.round(x * TS + 8 + R2() * 16), y: Math.round(y * TS + 18 + R2() * 12) });
  } else if (c === '-' && R2() < .07 && !near(x, y, v => v === '=' , 1)) {
    pads.push({ k: R2() < .65 ? 'hyac0' : 'hyac1', x: Math.round(x * TS + 16 + (R2() - .5) * 16), y: Math.round(y * TS + 16 + (R2() - .5) * 16), drift: 1 });
  } else if (c === '-' && R2() < .09 && !near(x, y, v => v === '=', 1)) {
    pads.push({ k: 'pad' + Math.floor(R2() * 3), x: Math.round(x * TS + 16 + (R2() - .5) * 18), y: Math.round(y * TS + 16 + (R2() - .5) * 18) });
  }
}
// sếu đầu đỏ: bãi bồi + đồng cỏ năn thoáng, xa cổng vào ------------------
const cranes = [];
const openAt = (x, y, r) => { for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) { const c = get(x + i, y + j); if (!(c === 'g' || c === 's' || c === 'd' || c === 'm')) return false; if (!seen.has((x + i) + ',' + (y + j))) return false; } return true; };
const wantC = [[30, 30], [8, 20], [28, 6], [5, 15], [31, 24], [11, 8], [35, 29]];
for (const [wx, wy] of wantC) { let best = null, bd = 1e9; for (let y = 2; y < H - 3; y++) for (let x = 2; x < W - 2; x++) if (openAt(x, y, 1) && !(y > 31 && x > 18 && x < 29)) { const d = Math.hypot(x - wx, y - wy); if (d < bd && !cranes.some(c => Math.hypot(c[0] - x, c[1] - y) < 4)) { bd = d; best = [x, y]; } } if (best) cranes.push(best); }
// đèn lồng treo (toạ độ ánh sáng, game dùng khi trời tối)
const lamps = objs.filter(o => o.lamp).map(o => [o.x, o.y - 26]).concat([[hut.x - 26, hut.y - 118], [hut.x + 24, hut.y - 118], [cx(21) + 4, 37.2 * TS - 40], [cx(25) + 12, 37.2 * TS - 40], [hut.x, hut.y - 70]]);

const rows = K.map(r => r.join(''));
const layout = { w: W, h: H, ts: TS, rows, guide, spawn: [23 * TS + 16, H * TS - 60], hut, boat: boatPos, cranes: cranes.map(c => [c[0] * TS + 16, c[1] * TS + 16]), lamps, objs, pads, bigLotus };
fs.writeFileSync(path.join(__dirname, 'tramchim_layout.json'), JSON.stringify(layout));
fs.writeFileSync(path.join(__dirname, 'tramchim_layout.px.js'), '// tự sinh bởi tools/gen_tramchim_map.js — đừng sửa tay\nglobalThis.TCL = ' + JSON.stringify(layout) + '\n');
console.log(rows.join('\n'));
console.log('unreachable walkable cells:', lost, '| trees', nTree, 'dead', nDead, 'cranes', cranes.length, 'objs', objs.length, 'pads', pads.length, 'lotus', bigLotus.length);
