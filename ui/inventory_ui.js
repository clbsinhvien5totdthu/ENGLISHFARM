// ====== TÚI ĐỒ kiểu Stardew Valley ======
// Lưới ô 12 cột (tối thiểu 3 hàng = 36 ô), tab lọc theo loại, bảng thông tin món đang chọn, nút sắp xếp.
// Sprite (ba lô, gói hạt, giỏ, cá, len, bàn tay…) do tools/pack_inventory.py vẽ → inventory_assets.js → ASSETS.spr.inv_*
// game.js đưa dữ liệu qua EF.host: invItems() · holdSeed(id) · bin() · snd · modal · closeModal
(() => {
const EF = (window.EF = window.EF || {});
const I = EF.Inventory = {};
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
const SP = () => (window.ASSETS && window.ASSETS.spr) || {};
const spr = (k, px) => SP()[k] ? `<img class="ico" src="${SP()[k]}" width="${px}" height="${px}" alt="">` : '';

const TABS = [
  { id:'all',   spr:'inv_all',    name:'Tất cả' },
  { id:'seed',  spr:'inv_seed',   name:'Hạt giống' },
  { id:'crop',  spr:'inv_basket', name:'Nông sản' },
  { id:'fish',  spr:'inv_fish',   name:'Cá' },
  { id:'goods', spr:'inv_wool',   name:'Vật nuôi' }
];
const SORTS = [{ id:'type', name:'Theo loại' }, { id:'price', name:'Theo giá' }, { id:'name', name:'A → Z' }];
const CAT_NAME = { tool:'Dụng cụ', seed:'Hạt giống', crop:'Nông sản', fish:'Cá', goods:'Sản phẩm vật nuôi' };
const COLS = 12, MIN_ROWS = 3;
const st = { tab:'all', key:null, sort:'type' };
let host = null;
const keyOf = x => x.cat + ':' + x.id;
const coin = (px = 20) => EF.Pixel ? `<img src="${EF.Pixel.coin()}" alt="🪙" width="${px}" height="${px}">` : '🪙';

I.init = h => { host = h; };

// danh sách đang hiển thị (đã lọc tab + sắp xếp)
const view = () => {
  let a = host.invItems();
  if (st.tab !== 'all') a = a.filter(x => x.cat === st.tab);
  if (st.sort === 'price') a = a.slice().sort((x, y) => y.price - x.price || x.en.localeCompare(y.en));
  if (st.sort === 'name') a = a.slice().sort((x, y) => x.en.localeCompare(y.en));
  return a;
};

const html = () => {
  const all = host.invItems(), a = view();
  if (!a.some(x => keyOf(x) === st.key)) { const held = a.find(x => x.held); st.key = a.length ? keyOf(held || a[0]) : null; }
  const cur = a.find(x => keyOf(x) === st.key) || null;

  const tabs = TABS.map(t => {
    const n = t.id === 'all' ? all.length : all.filter(x => x.cat === t.id).length;
    return `<button type="button" class="iv-tab${st.tab === t.id ? ' on' : ''}" data-t="${t.id}" title="${t.name} (${n})" aria-label="${t.name}">${spr(t.spr, 32)}${st.tab === t.id ? `<span>${t.name}</span>` : ''}</button>`;
  }).join('');

  const total = Math.max(COLS * MIN_ROWS, Math.ceil(a.length / COLS) * COLS);
  const slots = Array.from({ length:total }, (_, i) => {
    const x = a[i];
    if (!x) return '<span class="iv-slot"></span>';
    return `<button type="button" class="iv-slot full${keyOf(x) === st.key ? ' sel' : ''}${x.held ? ' held' : ''}" data-i="${i}" title="${esc(x.en)}">${x.ic}` +
      (x.n > 1 ? `<b>${x.n}</b>` : '') + (x.held ? `<i class="iv-hand">${spr('inv_hand', 16)}</i>` : '') + '</button>';
  }).join('');

  let info;
  if (cur) {
    const act = cur.cat === 'seed'
      ? (cur.held ? '<span class="iv-on">✓ Đang cầm trên tay</span>' : '<button type="button" class="iv-hold">✋ Cầm lên tay</button>')
      : '';
    info = `<div class="iv-pic">${cur.ic}</div>
      <div class="iv-txt"><b>${esc(cur.en)}</b><small>${esc(cur.vi)} · ${CAT_NAME[cur.cat]}${cur.n > 1 || cur.cat === 'seed' ? ' · ×' + cur.n : ''}</small><p>${cur.meta || ''}</p></div>
      <div class="iv-act">${act}</div>`;
  } else {
    info = `<div class="iv-pic">${spr('inv_bag', 48)}</div><div class="iv-txt"><b>Túi đang trống</b><p>Thu hoạch cây, câu cá, chơi với vật nuôi hoặc mua hạt ở Plant Workshop để có đồ trong túi nhé!</p></div>`;
  }

  const b = host.bin(), sort = SORTS.find(s => s.id === st.sort) || SORTS[0];
  return `<div class="iv">
    <div class="iv-head"><div class="iv-title">${spr('inv_bag', 40)}<b>Túi đồ</b></div><div class="iv-tabs">${tabs}</div></div>
    <div class="iv-grid">${slots}</div>
    <div class="iv-info">${info}</div>
    <div class="iv-foot">
      <div class="iv-coins">${coin(24)} <b>${host.S().coins}</b> <small>· Lv ${host.S().lvl}</small></div>
      <div class="iv-bin">${b.n ? `📦 Thùng bán hàng: ${b.n} món (~${b.v} 🪙)` : '📦 Thùng bán hàng: trống'}</div>
      <button type="button" class="iv-sort" title="Đổi cách sắp xếp">${spr('inv_sort', 24)}<span>${sort.name}</span></button>
    </div>
  </div>`;
};

const render = keep => {
  host.modal('Túi đồ', html(), [{ label:'Đóng', fn:host.closeModal }], keep, '-');
  const card = document.querySelector('#farm-app .card'); card.classList.add('shop', 'inv');
  bind(document.querySelector('#farm-app #mText'));
};

const bind = root => {
  const a = view();
  root.querySelectorAll('.iv-tab').forEach(b => b.onclick = () => { host.snd('select'); st.tab = b.dataset.t; st.key = null; render(true); });
  root.querySelectorAll('.iv-slot.full').forEach(b => b.onclick = () => {
    const x = a[+b.dataset.i]; if (!x) return;
    if (keyOf(x) === st.key && x.cat === 'seed' && !x.held) { host.holdSeed(x.id); return render(true); }   // bấm lần 2 vào hạt = cầm
    host.snd('select'); st.key = keyOf(x); render(true);
  });
  const hold = root.querySelector('.iv-hold');
  if (hold) hold.onclick = () => { const x = a.find(y => keyOf(y) === st.key); if (x) { host.holdSeed(x.id); render(true); } };
  const sort = root.querySelector('.iv-sort');
  if (sort) sort.onclick = () => { host.snd('click'); st.sort = SORTS[(SORTS.findIndex(s => s.id === st.sort) + 1) % SORTS.length].id; render(true); };
};

I.isOpen = () => { const m = document.querySelector('#farm-app #modal'); return !!(m && !m.hidden && m.querySelector('.card.inv .iv')); };
I.open = keep => render(!!keep);

// phím mũi tên di chuyển ô chọn · E: cầm hạt đang chọn
window.addEventListener('keydown', e => {
  if (!host || !I.isOpen()) return;
  const a = view(); if (!a.length) return;
  const i = Math.max(0, a.findIndex(x => keyOf(x) === st.key));
  const grid = document.querySelector('#farm-app .iv-grid');
  const cols = grid ? getComputedStyle(grid).gridTemplateColumns.split(' ').length : COLS;
  const d = { ArrowLeft:-1, ArrowRight:1, ArrowUp:-cols, ArrowDown:cols }[e.key];
  if (d) { e.preventDefault(); const j = Math.max(0, Math.min(a.length - 1, i + d)); if (j !== i) { host.snd('select'); st.key = keyOf(a[j]); render(true); } return; }
  if ((e.key === 'e' || e.key === 'E') && a[i].cat === 'seed' && !a[i].held) { host.holdSeed(a[i].id); render(true); }
});
})();
