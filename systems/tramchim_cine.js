/* ====== CUTSCENE VƯỜN QUỐC GIA TRÀM CHIM ======
   TC_CINE.play(scene, { mood, snd, onEnd }) – 6 cảnh quay (~39 giây), đường đi camera là hàm của thời gian:
     A  mặt hồ sen (lia + lùi nhẹ)      D  đàn chim bay ngang hồ (lia theo đàn)
     B  rừng tràm (nâng máy từ dưới lên) E  dolly dọc ván gỗ ra chòi quan sát
     C  sếu đầu đỏ (bám theo + đẩy vào)  F  bay lùi về cổng, hiện tên vườn quốc gia
   Bỏ qua: nút "Bỏ qua", hoặc phím Space / E / Enter / Esc. Game được khoá (open=true) do game.js lo. */
(() => {
'use strict';
const C = window.TC_CINE = { on: false };
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;       // easeInOutQuad
const easeOut = t => 1 - Math.pow(1 - t, 3);
const clamp01 = t => Math.max(0, Math.min(1, t));

// lời dẫn: [tiếng Việt, tiếng Anh] – câu tiếng Anh khớp với nội dung bài học của Chú Tư
const CAP = [
  ['Mặt hồ lặng như gương, sen nở kín đồng — Tràm Chim thức dậy trong làn sương mỏng.', 'The lake is calm. Lotus flowers cover the water.'],
  ['Rừng tràm xanh mướt, tán nhẹ như lông vũ, soi bóng xuống nước.', 'Melaleuca trees grow in flooded soil.'],
  ['Kìa — sếu đầu đỏ, loài chim quý nhất của vườn quốc gia!', 'Look! The red-headed crane!'],
  ['Gần 150 loài chim về đây kiếm ăn, làm tổ.', 'Nearly 150 kinds of birds live here.'],
  ['Theo ván gỗ băng qua mặt hồ, ra chòi quan sát nhé!', 'Follow the wooden path to the tower.'],
  ['Chào mừng đến Tràm Chim — hãy đi nhẹ, nói khẽ nhé!', 'Welcome to Tram Chim!']
];
// ranh giới các cảnh (giây)
const TM = [0, 6.5, 12.5, 19.5, 25.5, 31.5, 39];

C.play = (sc, opt = {}) => {
  if (C.on) return false;
  const cam = sc.cameras.main, app = document.getElementById('farm-app'), host = app && app.querySelector('#game-container');
  if (!host) { if (opt.onEnd) opt.onEnd(); return false; }
  C.on = true;
  const AUD = window.TC_AUDIO, snd = opt.snd, mood = opt.mood || 'day';

  // ---- lớp phủ: letterbox, vignette, phụ đề, tiêu đề, nút bỏ qua ----
  const el = document.createElement('div'); el.id = 'tcCine';
  el.innerHTML = '<div class="tc-fade"></div><div class="tc-bar top"></div><div class="tc-bar bot"></div><div class="tc-vig"></div>' +
    '<div class="tc-cap"><b></b><small></small></div>' +
    '<div class="tc-title"><div class="t1">VƯỜN QUỐC GIA TRÀM CHIM</div><div class="t2">TRAM CHIM NATIONAL PARK</div><div class="t3">Khu Ramsar thứ 2.000 của thế giới · Đồng Tháp</div></div>' +
    '<button type="button" class="tc-skip">⏭ Bỏ qua</button>';
  host.appendChild(el); app.classList.add('tc-cine');
  const fadeEl = el.querySelector('.tc-fade');
  const fade = (to, ms) => { fadeEl.style.transition = 'opacity ' + ms + 'ms linear'; fadeEl.style.opacity = to; };   // thay cho cam.fadeIn/fadeOut (không thể kẹt đen)
  const capB = el.querySelector('.tc-cap b'), capS = el.querySelector('.tc-cap small'), capEl = el.querySelector('.tc-cap'), titleEl = el.querySelector('.tc-title');
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('in')));

  // ---- trạng thái ----
  const fitZ = () => Math.max(1, Math.min(sc.scale.height / 432, sc.scale.width / 640));
  const focus = { x: sc.player.x, y: sc.player.y, m: 1 };
  cam.stopFollow(); try { cam.resetFX(); } catch (e) {}
  const t0 = performance.now(); let shot = -1, ended = false, fadedOut = false, state = {}, extras = [];
  const hero = sc.player;

  // ---- đàn chim dựng riêng cho cảnh D ----
  const mkFlock = () => {
    const off = [[0, 0], [-26, 12], [-26, -12], [-52, 24], [-52, -24], [-78, 36], [-78, -36], [-104, 48], [-104, -48], [-130, 60], [-130, -60]], list = [];
    off.forEach(([dx, dy], i) => {
      if (!sc.textures.exists('tc_bird0')) return;
      const b = sc.add.image(0, 0, 'tc_bird0').setDepth(1800).setScale(1.25), sh = sc.add.image(0, 0, 'tc_bird0').setDepth(1.5).setTintFill(0x0a2a2a).setAlpha(.17).setScale(.9);
      list.push({ b, sh, dx, dy, ph: i * .7 });
    });
    return list;
  };

  // ---- 6 cảnh quay: at(u, e) trả về [x, y, độ zoom so với zoom chuẩn] ----
  const SHOTS = [
    { at: (u) => { const e = ease(u); return [lerp(420, 590, e), lerp(600, 505, e), lerp(1.95, 1.55, e)]; } },
    { at: (u) => { const e = ease(u); return [lerp(185, 200, e), lerp(940, 640, e), lerp(1.45, 1.75, e)]; } },
    { enter: () => {
        const cr = (sc.cranes || []).slice().sort((a, b) => Math.hypot(a.x - 736, a.y - 850) - Math.hypot(b.x - 736, b.y - 850))[0];
        state.cr = cr; state.sx = cr ? cr.x : 736; state.sy = cr ? cr.y : 850;
      },
      at: (u) => { const cr = state.cr; if (cr) { state.sx = lerp(state.sx, cr.x, .07); state.sy = lerp(state.sy, cr.y, .07); } const m = lerp(1.15, 2.25, easeOut(u)); return [state.sx, state.sy - 22 / m, m]; } },
    { enter: () => { state.fl = mkFlock(); extras.push(...state.fl.flatMap(f => [f.b, f.sh])); state.t = performance.now(); },
      at: (u) => {
        const e = ease(u), sec = (performance.now() - state.t) / 1000;
        (state.fl || []).forEach(f => {
          const x = 330 + 112 * sec + f.dx, y = 470 + f.dy * .8 + Math.sin(sec * 1.3 + f.ph) * 5 - sec * 4, fr = Math.floor(sec * 6.5 + f.ph) % 4;
          f.b.setPosition(x, y).setTexture('tc_bird' + (fr === 3 ? 1 : fr)); f.sh.setPosition(x - 14, y + 100).setTexture('tc_bird' + (fr === 3 ? 1 : fr));
        });
        return [lerp(470, 880, e), lerp(560, 500, e), lerp(1.35, 1.5, e)];
      } },
    { at: (u) => { const e = ease(u); return [736, lerp(730, 470, e), lerp(1.45, 1.85, e)]; } },
    { at: (u) => { const e = ease(u); return [lerp(736, hero.x, e), lerp(470, hero.y - 30, e), lerp(1.85, 1, e)]; } }
  ];

  // ---- đổi phụ đề có hiệu ứng mờ ----
  const setCap = i => { capEl.classList.remove('on'); setTimeout(() => { if (ended) return; capB.textContent = CAP[i][0]; capS.textContent = CAP[i][1]; capEl.classList.add('on'); }, 350); };

  // ---- vòng cập nhật theo thời gian thực ----
  const tick = () => { try { tickBody(); } catch (err) { console.error('[TC_CINE] lỗi khi chiếu, tự thoát cutscene:', err); finish(true); } };
  const tickBody = () => {
    if (ended) return;
    lastTick = performance.now();
    const t = (performance.now() - t0) / 1000;
    let i = TM.findIndex((s, k) => t >= s && t < TM[k + 1]); if (i < 0) i = SHOTS.length - 1;
    if (t >= TM[TM.length - 1]) return finish(false);
    if (i !== shot) {
      shot = i; fadedOut = false; if (SHOTS[i].enter) SHOTS[i].enter();
      if (i > 0 && i < 5) fade(0, 320); else if (i === 0) fade(0, 1200);
      setCap(i);
      if (i === 5) setTimeout(() => { if (!ended) titleEl.classList.add('on'); }, 2000);
    }
    // cắt "mờ về đen" ở cuối mỗi cảnh (trừ cảnh E → F là một cú máy liền)
    if (!fadedOut && shot < 4 && t > TM[shot + 1] - .34) { fadedOut = true; fade(1, 320); }
    const u = clamp01((t - TM[shot]) / (TM[shot + 1] - TM[shot])), p = SHOTS[shot].at(u);
    if (sc.night) { sc.cinK = (sc.cinK == null ? 1 : sc.cinK); sc.cinK += (.1 - sc.cinK) * .06; sc.night.setAlpha((sc.nightBase || 0) * sc.cinK); }   // lớp tối ngày/đêm của game đứng yên khi bị khoá → làm sáng cho cảnh phim
    const sway = Math.sin(t * .9) * 1.6, sway2 = Math.cos(t * .7) * 1.1;          // rung nhẹ như máy cầm tay
    cam.setZoom(fitZ() * p[2]); cam.centerOn(p[0] + sway / p[2], p[1] + sway2 / p[2]);
  };
  let lastTick = performance.now() + 1500;
  const showErr = m => { let b = el.querySelector('.tc-err'); if (!b) { b = document.createElement('div'); b.className = 'tc-err'; el.appendChild(b); } b.textContent = '⚠ ' + m; };
  const onErr = ev => { const m = (ev.message || (ev.reason && (ev.reason.message || ev.reason)) || 'lỗi không rõ') + (ev.filename ? ' @' + ev.filename.split('/').pop() + ':' + ev.lineno : ''); console.error('[TC_CINE] lỗi trong lúc chiếu:', m, ev.error || ev.reason || ''); showErr(m); };
  window.addEventListener('error', onErr); window.addEventListener('unhandledrejection', onErr);
  const wd = setInterval(() => { if (!ended && performance.now() - lastTick > 2500) { showErr('Phaser không còn gọi update (game bị treo?) – tự thoát cutscene'); finish(true); } }, 800);
  sc.events.on('update', tick);

  // ---- bỏ qua / kết thúc ----
  const onKey = e => {
    if (e.ctrlKey || e.metaKey || e.altKey || /^F\d+$/.test(e.code)) return;
    if (!ended && (e.code === 'Space' || e.code === 'Escape' || e.code === 'Enter' || e.code === 'KeyE') && !e.repeat) finish(true);
    e.stopImmediatePropagation(); e.preventDefault();      // chặn mọi phím khác (B, Q, M…) trong lúc chiếu
  };
  const onKeyUp = e => { if (e.ctrlKey || e.metaKey || e.altKey || /^F\d+$/.test(e.code)) return; e.stopImmediatePropagation(); };
  window.addEventListener('keydown', onKey, true); window.addEventListener('keyup', onKeyUp, true);
  el.querySelector('.tc-skip').addEventListener('click', e => { e.stopPropagation(); finish(true); });
  sc.events.once('shutdown', () => finish(true));

  function finish(skipped) {
    if (ended) return; ended = true;
    sc.events.off('update', tick); window.removeEventListener('keydown', onKey, true); setTimeout(() => window.removeEventListener('keyup', onKeyUp, true), 400);
    if (AUD) { if (skipped) AUD.stop(700); else { AUD.busy = false; AUD.stop(2500); } }
    extras.forEach(o => { try { o.destroy(); } catch (e) {} });
    const back = () => { if (sc.cinK == null) { sc.events.off('update', back); return; } sc.cinK += (1 - sc.cinK) * .05; if (sc.night) sc.night.setAlpha((sc.nightBase || 0) * sc.cinK); if (sc.cinK > .995) { sc.cinK = 1; sc.events.off('update', back); } };
    sc.events.on('update', back);   // trả độ tối ngày/đêm về từ từ
    fade(0, skipped ? 350 : 1); try { cam.resetFX(); } catch (e) {}
    clearInterval(wd); window.removeEventListener('error', onErr); window.removeEventListener('unhandledrejection', onErr);
    // trả camera về người chơi
    cam.setZoom(fitZ()); cam.centerOn(hero.x, hero.y - 30); cam.startFollow(hero, false, .12, .12);
    el.classList.remove('in'); el.classList.add('out'); titleEl.classList.remove('on'); capEl.classList.remove('on');
    app.classList.remove('tc-cine');
    setTimeout(() => { el.remove(); C.on = false; }, 1100);
    if (opt.onEnd) opt.onEnd(skipped);
  }
  C.skip = () => finish(true);

  // âm thanh cho cảnh phim
  try { if (AUD) AUD.score(mood, snd); } catch (err) { console.error('[TC_CINE] âm thanh:', err); }
  return true;
};
})();
