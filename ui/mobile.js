/* English Farm — điều khiển cảm ứng (joystick ảo + nút hành động + menu gọn cho điện thoại).
   Tự bật khi thiết bị dùng cảm ứng; trên máy tính không có gì thay đổi. game.js đọc window.EF_TOUCH. */
(function () {
  const $ = s => document.querySelector(s), app = $('#farm-app'), zone = $('#game-container'),
    pad = $('#pad'), knob = $('#padKnob'), act = $('#actRound'), lbl = $('#actLbl'), wrap = $('#actWrap'),
    menu = $('#menu'), mbtn = $('#menuBtn'), fs = $('#fsBtn');
  const R = 46, ZONE_X = .55, ZONE_Y = .25;      // bán kính cần gạt; vùng cảm ứng = 55% bên trái, 75% phía dưới khung game
  const T = window.EF_TOUCH = { on:false, x:0, y:0, hint:() => {}, blocks:(x, y, w, h) => T.on && x < w * ZONE_X && y > h * ZONE_Y, reset:() => { T.x = T.y = 0; } };
  const buzz = ms => { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} };

  function enable() {
    if (T.on) return; T.on = true; app.classList.add('touch'); pad.hidden = wrap.hidden = false;
    T.hint = t => { lbl.textContent = String(t || '').replace(/^E( hoặc Space)?:\s*/i, ''); wrap.classList.toggle('has', !!t); };
  }
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (matchMedia('(pointer: coarse)').matches || (navigator.maxTouchPoints > 0 && !fine)) enable();
  window.addEventListener('touchstart', enable, { once:true, passive:true });   // máy lai (laptop cảm ứng): bật khi chạm lần đầu

  // ---- joystick nổi: chạm vào nửa trái màn hình, cần gạt xuất hiện ngay dưới ngón tay ----
  let pid = null, cx = 0, cy = 0;
  const move = e => {
    const dx = e.clientX - cx, dy = e.clientY - cy, d = Math.hypot(dx, dy) || 1, k = d > R ? R / d : 1, m = Math.min(1, d / R);
    knob.style.transform = `translate(${dx * k}px,${dy * k}px)`;
    if (m < .22) { T.x = T.y = 0; } else { T.x = dx / d * m; T.y = dy / d * m; }
  };
  const release = e => {
    if (e.pointerId !== pid) return;
    pid = null; T.reset(); knob.style.transform = ''; pad.classList.remove('active'); pad.style.left = pad.style.top = '';
  };
  zone.addEventListener('pointerdown', e => {
    if (!T.on || e.pointerType === 'mouse' || pid !== null || e.target.closest('#actWrap,#seedBtn,#minimap')) return;
    const r = zone.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    if (!T.blocks(x, y, r.width, r.height)) return;
    e.preventDefault(); pid = e.pointerId; try { zone.setPointerCapture(pid); } catch (er) {}
    cx = Math.max(R + 8, Math.min(r.width * ZONE_X - R, x)) + r.left; cy = Math.max(r.top + R + 8, Math.min(r.bottom - R - 8, e.clientY));
    pad.style.left = (cx - r.left) + 'px'; pad.style.top = (cy - r.top) + 'px'; pad.classList.add('active');
    move(e);
  });
  zone.addEventListener('pointermove', e => { if (e.pointerId === pid) { e.preventDefault(); move(e); } });
  zone.addEventListener('pointerup', release); zone.addEventListener('pointercancel', release);
  zone.addEventListener('lostpointercapture', release);
  zone.addEventListener('contextmenu', e => e.preventDefault());

  // ---- nút hành động (thay phím E / Space) ----
  act.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); buzz(12); $('#actBtn').click(); });

  // ---- menu gọn cho màn hình nhỏ ----
  mbtn.onclick = e => { e.stopPropagation(); menu.classList.toggle('open'); };
  menu.addEventListener('click', () => setTimeout(() => menu.classList.remove('open'), 0));
  document.addEventListener('pointerdown', e => { if (!menu.contains(e.target) && e.target !== mbtn) menu.classList.remove('open'); });

  // ---- toàn màn hình (Android / máy tính bảng; iPhone Safari không hỗ trợ nên tự ẩn) ----
  const FS = document.fullscreenEnabled || document.webkitFullscreenEnabled;
  if (!FS) fs.remove(); else fs.onclick = () => {
    const d = document, on = d.fullscreenElement || d.webkitFullscreenElement;
    try { on ? (d.exitFullscreen || d.webkitExitFullscreen).call(d) : (app.requestFullscreen || app.webkitRequestFullscreen).call(app); } catch (e) {}
  };
  // chặn kéo / phóng to trang bằng 2 ngón (iOS Safari bỏ qua user-scalable=no)
  ['gesturestart', 'gesturechange'].forEach(ev => document.addEventListener(ev, e => e.preventDefault()));
})();
