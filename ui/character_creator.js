// ====== CHARACTER CREATOR: tên, đại từ, tóc, trang phục, mũ, phụ kiện ======
// Dùng sprite gốc + các lớp đổi màu / phụ kiện vẽ chồng (tiết kiệm tài nguyên, không cần sprite mới).
(() => {
const EF = (window.EF = window.EF || {});
const C = EF.Char = { base:null };
const FW = 40, FH = 56;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
const rgb2hsl = (r, g, b) => { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0;
  if (mx !== mn) { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; } return [h, s, l]; };
const hsl2rgb = (h, s, l) => { const f = (p, q, t) => { if (t < 0) t += 1; if (t > 1) t -= 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < .5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
  if (!s) return [l * 255, l * 255, l * 255]; const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q; return [f(p, q, h + 1 / 3) * 255, f(p, q, h) * 255, f(p, q, h - 1 / 3) * 255]; };
C.setBase = img => { C.base = img; };
// vẽ nhân vật đã tùy chỉnh lên canvas mới (toàn bộ sprite sheet)
C.render = (img, app) => {
  const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
  const cx = cv.getContext('2d'); cx.drawImage(img, 0, 0);
  app = app || {}; const D = EF.CHAR;
  const outHue = D.outfit[app.outfit | 0] ? D.outfit[app.outfit | 0][1] : null, hat = D.hat[app.hat | 0] ? D.hat[app.hat | 0][1] : null, hair = D.hair[app.hair | 0] ? D.hair[app.hair | 0][1] : null;
  const acc = app.acc || [];
  const cols = Math.floor(img.width / FW), rows = Math.floor(img.height / FH);
  if (outHue !== null || hat !== null || hair !== null) {
    const id = cx.getImageData(0, 0, img.width, img.height), d = id.data, W = img.width;
    const A = (x, y) => d[(y * W + x) * 4 + 3];
    for (let fr = 0; fr < rows; fr++) for (let fc = 0; fc < cols; fc++) for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
      const X = fc * FW + x, Y = fr * FH + y, o = (Y * W + X) * 4; if (d[o + 3] < 40) continue;
      const r = d[o], g = d[o + 1], b = d[o + 2], [h, s, l] = rgb2hsl(r, g, b), v = Math.max(r, g, b) / 255;
      const isHat = h > .04 && h < .14 && s > .45 && (fr === 0 ? (y <= 17 || ((x < 12 || x > 27) && y <= 21)) : fr === 1 ? y <= 26 : y <= 21);
      const isShirt = b > r + 25 && b > g + 5 && s > .35 && y >= (fr === 1 ? 26 : 24) && y < 44;
      const isHair = v < .3 && y >= (fr === 0 ? 13 : fr === 1 ? 14 : 9) && y <= (fr === 0 ? 24 : fr === 1 ? 28 : 27) &&
        [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]].every(p => { const nx = X + p[0], ny = Y + p[1]; return nx >= 0 && ny >= 0 && nx < W && A(nx, ny) > 40; });
      let c = null;
      if (isHat && hat !== null) c = hat === 'cream' ? hsl2rgb(h, s * .3, Math.min(.92, l * .4 + .55)) : hsl2rgb(hat / 360, Math.min(1, s * 1.05), l);
      else if (isShirt && outHue !== null) c = hsl2rgb(outHue / 360, s, l);
      else if (isHair && hair !== null) { const f = Math.max(.5, Math.min(1.5, v / .17)); c = [hair[0] * f, hair[1] * f, hair[2] * f]; }
      if (c) { d[o] = Math.max(0, Math.min(255, c[0])); d[o + 1] = Math.max(0, Math.min(255, c[1])); d[o + 2] = Math.max(0, Math.min(255, c[2])); }
    }
    cx.putImageData(id, 0, 0);
  }
  // phụ kiện: lớp vẽ chồng theo hướng nhìn (hàng 0 = trước, 1 = sau, 2 = ngang)
  const px = (fr, fc, x, y, col) => { cx.fillStyle = col; cx.fillRect(fc * FW + x, fr * FH + y, 1, 1); };
  for (let fc = 0; fc < cols; fc++) {
    if (acc.indexOf('glasses') >= 0 && rows > 0) {
      const dark = '#2a2230';
      [14, 15, 16, 17, 22, 23, 24, 25].forEach(x => { px(0, fc, x, 20, dark); px(0, fc, x, 22, dark); });
      [14, 17, 22, 25].forEach(x => px(0, fc, x, 21, dark)); [18, 19, 20, 21].forEach(x => px(0, fc, x, 20, dark));
      if (rows > 2) { [15, 16, 17, 18].forEach(x => { px(2, fc, x, 21, dark); px(2, fc, x, 23, dark); }); px(2, fc, 15, 22, dark); px(2, fc, 18, 22, dark); [19, 20, 21].forEach(x => px(2, fc, x, 22, dark)); }
    }
    if (acc.indexOf('scarf') >= 0) {
      [[0, 25], [0, 26], [1, 26], [1, 27], [2, 26], [2, 27]].forEach(p => { if (p[0] >= rows) return; for (let x = 12; x <= 26; x++) { const dd = cx.getImageData(fc * FW + x, p[0] * FH + p[1], 1, 1).data; if (dd[3] > 200) px(p[0], fc, x, p[1], (x + p[1]) % 4 < 2 ? '#d94a3d' : '#b83a30'); } });
    }
  }
  return cv;
};
// đặt IMG.hero = ảnh đã tùy chỉnh (Phaser dùng ngay khi khởi tạo Boot)
C.prepare = (IMG, app) => new Promise(res => {
  if (!C.base) C.base = IMG.hero;
  try { const cv = C.render(C.base, app), im = new Image(); im.onload = () => { IMG.hero = im; res(); }; im.onerror = res; im.src = cv.toDataURL(); } catch (e) { res(); }
});
// ----- Giao diện tạo nhân vật -----
const sw = (k, list, cur) => list.map((x, i) => `<button type="button" class="sw${i === cur ? ' on' : ''}" data-k="${k}" data-i="${i}" title="${esc(x[0])}">${esc(x[0])}</button>`).join('');
EF.UI = EF.UI || {};
// trả về Promise, hoàn tất khi người chơi bấm “Bắt đầu”
EF.UI.characterCreator = opts => new Promise(res => {
  opts = opts || {}; const H = EF.host, S = H.S(), D = EF.CHAR;
  const cur = S.character, app = Object.assign({}, D.def, cur.appearance);
  app.acc = (app.acc || []).slice(); let name = cur.name && cur.name !== 'Gardener' ? cur.name : '';
  const draw = () => { const cv = document.querySelector('#farm-app #ccPrev'); if (!cv || !C.base) return; const r = C.render(C.base, app), cx = cv.getContext('2d'); cx.clearRect(0, 0, cv.width, cv.height); cx.imageSmoothingEnabled = false; cx.drawImage(r, 0, 0, FW, FH, 0, 0, cv.width, cv.height); };
  const html = () => `<div class="cc"><canvas id="ccPrev" width="120" height="168"></canvas>
    <label>Tên của bạn <input id="ccName" maxlength="14" placeholder="The Gardener" value="${esc(name)}"></label>
    <div class="ccrow"><b>Đại từ</b> ${D.pronouns.map(p => `<button type="button" class="sw${app.pronouns === p.id ? ' on' : ''}" data-p="${p.id}">${esc(p.label)}</button>`).join('')}</div>
    <div class="ccrow"><b>Tóc</b> ${sw('hair', D.hair, app.hair | 0)}</div>
    <div class="ccrow"><b>Áo</b> ${sw('outfit', D.outfit, app.outfit | 0)}</div>
    <div class="ccrow"><b>Mũ</b> ${sw('hat', D.hat, app.hat | 0)}</div>
    <div class="ccrow"><b>Phụ kiện</b> ${D.acc.map(a => `<button type="button" class="sw${app.acc.indexOf(a.id) >= 0 ? ' on' : ''}" data-a="${a.id}">${a.label}</button>`).join('')}</div>
    <small>Kiểu tóc mới cần thêm hình; hiện đổi được màu tóc, áo, mũ và phụ kiện.</small></div>`;
  const render = () => {
    H.modal(opts.title || 'Tạo nhân vật 🌱', html(), [{ label:opts.cancel ? 'Lưu thay đổi ✔' : 'Bắt đầu ✔', fn:confirm }].concat(opts.cancel ? [{ label:'Hủy', fn:() => { H.closeModal(); res(false); } }] : []), true);
    const box = document.querySelector('#farm-app #mText'), nm = box.querySelector('#ccName');
    nm.addEventListener('input', () => { name = nm.value; });
    ['keydown', 'keyup', 'keypress'].forEach(k => nm.addEventListener(k, e => e.stopPropagation()));
    box.onclick = e => { const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.k) app[b.dataset.k] = +b.dataset.i; else if (b.dataset.p) app.pronouns = b.dataset.p;
      else if (b.dataset.a) { const i = app.acc.indexOf(b.dataset.a); if (i >= 0) app.acc.splice(i, 1); else app.acc.push(b.dataset.a); } else return;
      const keep = nm.value; name = keep; render(); };
    draw();
  };
  const confirm = () => {
    const nmEl = document.querySelector('#farm-app #ccName'); name = (nmEl ? nmEl.value : name).trim().slice(0, 14) || 'Gardener';
    cur.name = name; cur.appearance = app; cur.created = true; H.save(); H.closeModal(); res(true);
  };
  render();
});
})();
