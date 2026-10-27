/* ====== ÂM THANH VƯỜN QUỐC GIA TRÀM CHIM (tổng hợp bằng WebAudio, không cần file mp3) ======
   game.js gọi TC_AUDIO.init({ AU, au }) sau khi tạo hệ âm thanh chung, rồi dùng:
     TC_AUDIO.fx.<tên>(độ trễ giây, âm lượng)  – tiếng nước / chim / sếu / cò / cu gáy / bói cá …
     TC_AUDIO.event(mood, mưa)                 – tiếng ngẫu nhiên của khu Tràm Chim (gọi định kỳ)
     TC_AUDIO.musicStep(mood)                  – một "nhịp" nhạc nền du dương (sáo trúc + đàn tranh + pad); trả về ms chờ
     TC_AUDIO.score(mood)                      – bản nhạc ~40 giây cho cutscene, trả về thời lượng giây
     TC_AUDIO.stop(ms)                         – nhỏ dần rồi tắt mọi thứ đã lên lịch (khi bỏ qua cutscene)
   Âm giai: ngũ cung "Bắc" của dân nhạc Việt (Rê Mi Sol La Si) – nghe êm, mộc, hợp sông nước. */
(() => {
'use strict';
const R = Math.random;
const T = window.TC_AUDIO = { busy: false, ready: false };
let AU = null, au = () => null, bus = null;

T.init = d => { AU = d.AU; au = d.au; T.ready = true; };

// ---- bus riêng: để nhỏ dần được cả phần đã lên lịch trước (dry → AU.m, wet → AU.rv) ----
function getBus() {
  const a = au(); if (!a || !AU || !AU.m) return null;
  if (!bus || bus.a !== a) {
    const g = a.createGain(), s = a.createGain(); g.gain.value = 1; s.gain.value = 1;
    g.connect(AU.m); if (AU.rv) s.connect(AU.rv);
    bus = { a, g, s };
  }
  return bus;
}
const wsend = (a, node, wet) => { if (wet && bus && AU.rv) { const w = a.createGain(); w.gain.value = wet; node.connect(w); w.connect(bus.s); } };
const ok = () => { const a = au(); return a && getBus() ? a : null; };

// ---- giọng cơ bản ----
// tiếng chim / nốt ngắn: sóng sin trượt tần số
function chirp(f0, f1, dur, vol, dl = 0, wet = .35, type = 'sine', atk = 0) {
  const a = ok(); if (!a) return;
  const t = a.currentTime + dl, o = a.createOscillator(), g = a.createGain(), at = atk || Math.min(.012, dur * .3);
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur);
  g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(vol, t + at); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g); g.connect(bus.g); wsend(a, g, wet); o.start(t); o.stop(t + dur + .03);
}
// gió / nước: nhiễu lọc, mở dần rồi tắt dần (không bị "bụp" lúc đầu như nhiễu thường)
function nz(dur, f0, f1, vol, dl = 0, type = 'bandpass', q = .9, atk = .4, wet = .25) {
  const a = ok(); if (!a || !AU.nb) return;
  const t = a.currentTime + dl, s = a.createBufferSource(), fl = a.createBiquadFilter(), g = a.createGain();
  s.buffer = AU.nb; s.loop = true; fl.type = type; fl.Q.value = q;
  fl.frequency.setValueAtTime(f0, t); fl.frequency.linearRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(vol, t + dur * atk); g.gain.linearRampToValueAtTime(.0001, t + dur);
  s.connect(fl); fl.connect(g); g.connect(bus.g); wsend(a, g, wet);
  s.start(t, R() * 1.5); s.stop(t + dur + .05);
}
// tiếng kèn / hú (sếu): sóng răng cưa qua 2 bộ lọc formant + rung nhanh
function horn(f0, f1, dur, vol, dl = 0, vib = 16, wet = .6) {
  const a = ok(); if (!a) return;
  const t = a.currentTime + dl, o = a.createOscillator(), g = a.createGain(), b1 = a.createBiquadFilter(), b2 = a.createBiquadFilter(), l = a.createOscillator(), lg = a.createGain();
  o.type = 'sawtooth'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  b1.type = 'bandpass'; b1.frequency.value = 900; b1.Q.value = 3; b2.type = 'bandpass'; b2.frequency.value = 1900; b2.Q.value = 4;
  l.frequency.value = vib; lg.gain.value = f0 * .045; l.connect(lg); lg.connect(o.frequency);
  g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(vol, t + .05); g.gain.setValueAtTime(vol, t + dur * .55); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(b1); o.connect(b2); b1.connect(g); b2.connect(g); g.connect(bus.g); wsend(a, g, wet);
  o.start(t); l.start(t); o.stop(t + dur + .05); l.stop(t + dur + .05);
}
// đàn tranh / đàn hạc: gảy – sáng rồi tối dần, ngân vang
function pluck(f, vol = .04, dl = 0, dur = 2.4, wet = .55) {
  const a = ok(); if (!a) return;
  const t = a.currentTime + dl, g = a.createGain(), lp = a.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.setValueAtTime(Math.min(9000, f * 8), t); lp.frequency.exponentialRampToValueAtTime(f * 1.5, t + dur * .6);
  g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(vol, t + .006); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  [['triangle', 1, 1], ['sine', 2, .3], ['sine', 3.01, .1]].forEach(([ty, m, k]) => {
    const o = a.createOscillator(), og = a.createGain(); o.type = ty; o.frequency.value = f * m; og.gain.value = k;
    o.connect(og); og.connect(lp); o.start(t); o.stop(t + dur + .05);
  });
  lp.connect(g); g.connect(bus.g); wsend(a, g, wet);
}
// sáo trúc: sin mềm + hơi thở, lướt vào nốt, rung nhẹ về cuối
function flute(f, dur = 1.4, vol = .045, dl = 0, wet = .6) {
  const a = ok(); if (!a) return;
  const t = a.currentTime + dl, g = a.createGain(), o = a.createOscillator(), o2 = a.createOscillator(), g2 = a.createGain(), l = a.createOscillator(), lg = a.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(f * .975, t); o.frequency.exponentialRampToValueAtTime(f, t + .1);
  o2.type = 'triangle'; o2.frequency.value = f * 2; g2.gain.value = .1;
  l.frequency.value = 5.1; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * .011, t + dur * .7); l.connect(lg); lg.connect(o.frequency);
  g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(vol, t + .14); g.gain.setValueAtTime(vol * .9, t + Math.max(.2, dur - .25)); g.gain.exponentialRampToValueAtTime(.0001, t + dur + .25);
  o.connect(g); o2.connect(g2); g2.connect(g);
  if (AU.nb) { const s = a.createBufferSource(), bp = a.createBiquadFilter(), bg = a.createGain(); s.buffer = AU.nb; s.loop = true; bp.type = 'bandpass'; bp.frequency.value = f * 2; bp.Q.value = 2.5;
    bg.gain.setValueAtTime(.0001, t); bg.gain.linearRampToValueAtTime(vol * .22, t + .1); bg.gain.exponentialRampToValueAtTime(.0001, t + dur + .2); s.connect(bp); bp.connect(bg); bg.connect(g); s.start(t, R()); s.stop(t + dur + .3); }
  g.connect(bus.g); wsend(a, g, wet);
  o.start(t); o2.start(t); l.start(t); o.stop(t + dur + .3); o2.stop(t + dur + .3); l.stop(t + dur + .3);
}
// thảm âm (pad): hợp âm quãng 5 trải dài, vào chậm ra chậm
function pad(fs, dur, vol = .014, dl = 0) {
  const a = ok(); if (!a) return;
  const t = a.currentTime + dl;
  fs.forEach((f, i) => [1, 1.004].forEach(m => {
    const o = a.createOscillator(), g = a.createGain(), lp = a.createBiquadFilter();
    o.type = 'sine'; o.frequency.value = f * m; lp.type = 'lowpass'; lp.frequency.value = 1100;
    g.gain.setValueAtTime(.0001, t + i * .15); g.gain.linearRampToValueAtTime(vol, t + dur * .38); g.gain.linearRampToValueAtTime(vol * .8, t + dur * .65); g.gain.linearRampToValueAtTime(.0001, t + dur);
    o.connect(lp); lp.connect(g); g.connect(bus.g); wsend(a, g, .5); o.start(t + i * .15); o.stop(t + dur + .1);
  }));
}
const chime = (f, dl = 0, v = .03) => { chirp(f, f * .998, 2.6, v, dl, .7); chirp(f * 2.76, f * 2.76, 1.4, v * .35, dl, .7); chirp(f * 5.4, f * 5.4, .6, v * .15, dl, .7); };

// ---- ngũ cung Bắc, giọng Rê ----
const N = { D3:146.83, E3:164.81, G3:196, A3:220, B3:246.94, D4:293.66, E4:329.63, G4:392, A4:440, B4:493.88, D5:587.33, E5:659.25, G5:783.99, A5:880, B5:987.77, D6:1174.66 };
const SC = [N.D4, N.E4, N.G4, N.A4, N.B4, N.D5, N.E5, N.G5, N.A5, N.B5];

// ====== HIỆU ỨNG (dl = trễ giây, k = hệ số âm lượng) ======
const fx = T.fx = {
  // nước
  lap(dl = 0, k = 1) { nz(2.8 + R() * 1.8, 300 + R() * 150, 720 + R() * 380, .05 * k, dl, 'bandpass', .9, .45, .3); if (R() < .6) nz(1.6, 1000, 1900, .011 * k, dl + .45, 'bandpass', .8, .5, .2); },
  drop(dl = 0, k = 1) { const f = 850 + R() * 500; chirp(f, f * 2.1, .09, .035 * k, dl, .7); chirp(f * 1.5, f * 2.6, .07, .014 * k, dl + .13, .7); },
  plop(dl = 0, k = 1) { nz(.35, 1300, 500, .055 * k, dl, 'bandpass', 1.2, .12, .3); chirp(520, 190, .16, .06 * k, dl, .4); [.12, .2, .29].forEach(d => chirp(900 + R() * 500, 1700, .06, .014 * k, dl + d, .5)); },
  oar(dl = 0, k = 1) { nz(.7, 700, 360, .045 * k, dl, 'bandpass', .8, .3, .3); chirp(210, 120, .12, .035 * k, dl + .08, .3); fx.drop(dl + .55, k * .8); },
  // chim
  crane(dl = 0, k = 1) {               // sếu đầu đỏ: tiếng kèn "kơ-roo" vang xa trên đồng nước
    horn(540, 650, .2, .1 * k, dl, 20, .6); horn(720, 470, .75, .12 * k, dl + .2, 17, .7);
    horn(500, 600, .16, .04 * k, dl + .62, 20, .8); horn(680, 450, .6, .045 * k, dl + .8, 17, .85);   // vọng lại
  },
  egret(dl = 0, k = 1) { for (let i = 0; i < 2; i++) { chirp(420, 290, .17, .05 * k, dl + i * .24, .4, 'sawtooth'); nz(.15, 1000, 700, .03 * k, dl + i * .24, 'bandpass', 1.4, .2, .3); } },
  dove(dl = 0, k = 1) {                // cu gáy: "cúc – cu – cu – cu" êm, đặc trưng đồng quê Việt Nam
    [[0, 460, .2], [.34, 415, .3], [.78, 415, .3], [1.22, 350, .55]].forEach(([d, f, du]) => chirp(f, f * .92, du, .04 * k, dl + d, .55, 'sine', .07));
  },
  kingfisher(dl = 0, k = 1) { for (let i = 0; i < 6; i++) chirp(4300 - i * 150, 3200 - i * 120, .05, .02 * k, dl + i * .07, .4); },
  warbler(dl = 0, k = 1) { const n = 8 + Math.floor(R() * 7); let d = 0; for (let i = 0; i < n; i++) { const f = 2200 + R() * 2000; chirp(f, f * (R() < .5 ? .8 : 1.25), .04 + R() * .04, .017 * k, dl + d, .3); d += .05 + R() * .06; } },
  swallow(dl = 0, k = 1) { for (let i = 0; i < 5; i++) chirp(3800 + R() * 1200, 3000 + R() * 800, .05, .018 * k, dl + i * .06, .35); },
  wings(dl = 0, k = 1, n = 8) { for (let i = 0; i < n; i++) nz(.07, 1400, 700, .028 * k * (1 - i / (n * 1.4)), dl + i * .085 + R() * .02, 'bandpass', 1.2, .35, .1); },
  flock(dl = 0, k = 1, dur = 4) {       // cả đàn bay qua: tiếng kêu rộn + vỗ cánh
    for (let i = 0; i < 14; i++) { const d = dl + R() * dur; if (R() < .5) fx.swallow(d, k * .8); else fx.warbler(d, k * .7); }
    for (let i = 0; i < 4; i++) fx.wings(dl + i * dur / 4 + R() * .6, k, 7);
    fx.egret(dl + dur * .3, k * .8); fx.egret(dl + dur * .65, k * .7);
  },
  night: {
    owl(dl = 0, k = 1) { chirp(420, 350, .3, .045 * k, dl, .5); chirp(380, 290, .5, .045 * k, dl + .5, .55); },
  }
};
// đăng ký vào SND chung của game để dùng được với snd('tcCrane') …
T.register = SND => { ['crane', 'egret', 'dove', 'kingfisher', 'warbler', 'swallow', 'lap', 'drop', 'plop', 'oar'].forEach(n => { SND['tc' + n[0].toUpperCase() + n.slice(1)] = () => fx[n](0, 1); }); };

// ====== TIẾNG NGẪU NHIÊN CỦA KHU TRÀM CHIM ======
const pick = list => { let r = R() * list.reduce((s, x) => s + x[0], 0); for (const [w, f] of list) { if ((r -= w) <= 0) return f; } return list[0][1]; };
T.event = (mood, rain, snd) => {
  if (!ok()) return;
  if (rain) { pick([[4, () => fx.drop(0, 1)], [3, () => fx.lap(0, .8)], [1, () => snd && snd('frog')]])(); return; }
  if (mood === 'night') { pick([[4, () => snd && snd('frog')], [3, () => snd && snd('cricket')], [1.3, () => fx.night.owl(0, 1)], [2, () => fx.lap(0, .8)], [1, () => fx.drop(0, 1)]])(); return; }
  if (mood === 'dusk') {
    pick([[2, () => fx.dove(0, 1)], [2.5, () => fx.lap(0, 1)], [2, () => snd && snd('frog')], [1.2, () => fx.crane(0, .8)], [1.2, () => fx.egret(0, 1)], [1.5, () => snd && snd('cricket')], [1, () => fx.drop(0, 1)]])(); return;
  }
  const e = pick([[2.6, fx.lap], [2, fx.warbler], [1.5, fx.dove], [1, fx.egret], [1.1, fx.crane], [.7, fx.kingfisher], [.9, fx.drop], [.7, fx.plop], [.6, fx.swallow]]);
  e(0, 1);
  if (R() < .35) setTimeout(() => { if (!document.hidden) pick([[2, fx.warbler], [1, fx.dove], [1, fx.drop]])(0, .8); }, 600 + R() * 1500);   // chim đáp lại
};

// ====== NHẠC NỀN DU DƯƠNG (đổi theo buổi) ======
const PROG = [[N.D3, N.A3, N.E4], [N.G3, N.D4, N.A4], [N.E3, N.B3, N.G4], [N.A3, N.D4, N.E4]];
let mn = 0, mi = 3;
T.musicStep = mood => {
  if (T.busy || !ok()) return 2500;
  const night = mood === 'night', dusk = mood === 'dusk', rr = R();
  if (mn % 4 === 0) pad(PROG[(mn / 4 | 0) % 4], night ? 12 : 10, night ? .011 : .013);
  mn++;
  mi = Math.max(0, Math.min(SC.length - 1, mi + [-2, -1, -1, 0, 1, 1, 2][Math.floor(R() * 7)]));
  const up = rr < .5, len = 2 + Math.floor(R() * 3);
  for (let i = 0; i < len; i++) {            // đàn tranh: vài nốt rải nhẹ
    const idx = Math.max(0, Math.min(SC.length - 1, mi + (up ? i : -i)));
    pluck(SC[idx] * (night ? .5 : 1), night ? .018 : .026, i * (dusk || night ? .4 : .3), night ? 3.2 : 2.4, .6);
  }
  if (!night && R() < .55) {                 // sáo: một câu ngắn, có quãng nghỉ
    const base = Math.max(2, Math.min(SC.length - 1, mi + 2)), n = 2 + Math.floor(R() * 2); let d = len * .3 + .5;
    for (let i = 0; i < n; i++) { const du = 1 + R() * .9; flute(SC[Math.max(2, Math.min(SC.length - 1, base + [0, 1, -1, 2, -2][Math.floor(R() * 5)]))] * (dusk ? .5 : 1), du, .03, d); d += du + .15; }
  }
  return night ? 4800 : dusk ? 3900 : 3300;
};

// ====== BẢN NHẠC CUTSCENE (~40 giây, khớp 6 cảnh quay) ======
T.score = (mood, snd) => {
  if (!ok()) return 0;
  const night = mood === 'night';
  const sched = (sec, fn) => setTimeout(() => { if (T.busy) fn(); }, sec * 1000);
  // thảm âm nền
  pad([N.D3, N.A3, N.D4], 13, .017, 0); pad([N.G3, N.D4, N.G4], 11, .017, 12); pad([N.E3, N.B3, N.E4], 11, .017, 21); pad([N.D3, N.A3, N.D4, N.A4], 14, .019, 30);
  // đàn tranh theo từng cảnh
  const A = [[1.0, 'D4'], [1.8, 'A4'], [2.5, 'B4'], [3.2, 'D5'], [4.4, 'B4'], [5.1, 'A4'], [5.8, 'G4']];
  const B = [[6.8, 'E4'], [7.4, 'G4'], [8.0, 'A4'], [8.6, 'D5'], [9.4, 'B4'], [10.2, 'A4'], [10.9, 'G4'], [11.6, 'E4'], [12.2, 'D4']];
  const C = [[12.7, 'G4'], [13.2, 'A4'], [13.7, 'B4'], [14.2, 'D5'], [14.7, 'E5'], [15.2, 'D5'], [15.7, 'B4'], [16.2, 'A4'], [17.0, 'G4'], [17.8, 'A4'], [18.6, 'B4']];
  const E = []; for (let i = 0; i < 12; i++) E.push([25.6 + i * .5, ['G4', 'A4', 'B4', 'A4'][i % 4]]);
  const F = [[31.8, 'D4'], [32.3, 'A4'], [32.8, 'D5'], [33.5, 'E5'], [34.2, 'D5']];
  [A, B, C, E, F].forEach(arr => arr.forEach(([s, n]) => pluck(N[n] * (night ? .5 : 1), .03, s, 2.6, .6)));
  ['D4', 'E4', 'G4', 'A4', 'B4', 'D5', 'E5', 'G5', 'A5'].forEach((n, i) => pluck(N[n], .024, 19.8 + i * .08, 2.2, .7));   // lướt đàn khi đàn chim cất cánh
  // sáo trúc: giai điệu chính
  if (!night) [[7.2, 'A4', 1.4], [8.7, 'B4', 1.0], [9.9, 'D5', 2.2], [13.0, 'E5', 1.6], [14.8, 'D5', 1.0], [16.0, 'B4', 1.4], [17.5, 'A4', 2.4],
    [21.0, 'A5', 1.6], [22.7, 'G5', .9], [23.7, 'E5', 1.8], [26.0, 'B4', 1.2], [27.4, 'D5', 1.2], [28.8, 'E5', 1.6], [30.4, 'D5', 1.0], [34.4, 'D5', 3.6]].forEach(([s, n, du]) => flute(N[n], du, .04, s));
  else [[8, 'A3', 2.2], [14, 'D4', 2.4], [22, 'E4', 2.6], [32, 'D4', 4]].forEach(([s, n, du]) => flute(N[n], du, .03, s));
  chime(N.D5, 35.2, .03); chime(N.A4, 36.6, .02);   // chuông ngân khi hiện tên vườn
  // nước, chim, cảnh vật (có thể bỏ qua khi tối)
  fx.lap(0, 1); fx.lap(3, .9); fx.lap(7, .8); fx.lap(12, .8); fx.lap(19, .8); fx.lap(26, .8); fx.lap(33, .9); fx.lap(37, 1);
  [[1.5], [2.7], [4.1], [5.4], [8.2], [10.6], [13.8], [20.6], [27.2], [29.4], [31.3], [36.0]].forEach(([s]) => fx.drop(s, 1));
  fx.plop(4.8, .9); fx.plop(24.6, .8); fx.oar(27.5, 1); fx.oar(29.6, .9);
  if (night) {
    [[2, 'frog'], [5, 'cricket'], [9, 'frog'], [11, 'owl'], [15, 'cricket'], [19, 'frog'], [23, 'cricket'], [28, 'frog'], [33, 'owl'], [36, 'cricket']].forEach(([s, n]) => n === 'owl' ? fx.night.owl(s, 1) : sched(s, () => snd && snd(n)));
    fx.crane(17.6, .6);
  } else {
    fx.dove(2.0, 1); fx.warbler(5.0, 1); fx.warbler(8.0, .9); fx.swallow(10.5, 1); fx.dove(11.0, .9); fx.egret(12.9, .8);
    fx.crane(14.6, 1.1); fx.crane(18.4, 1); fx.warbler(15.8, .8); fx.kingfisher(16.8, 1);
    fx.flock(20.2, 1, 4.6); fx.egret(24.8, .8);
    fx.warbler(26.4, .8); fx.dove(28.0, .9); fx.kingfisher(30.4, .9);
    fx.dove(36.0, 1); fx.warbler(37.2, 1); fx.crane(38.2, .8);
    sched(21.0, () => snd && snd('bee'));
  }
  T.busy = true; setTimeout(() => { T.busy = false; }, 40500);
  return 40;
};

// nhỏ dần rồi tắt (đã lên lịch trước cũng im theo vì đi qua bus)
T.stop = (ms = 700) => {
  const b = bus; T.busy = false;
  if (!b) return;
  try { const t = b.a.currentTime; b.g.gain.setTargetAtTime(0, t, ms / 3000); b.s.gain.setTargetAtTime(0, t, ms / 3000); } catch (e) {}
  bus = null;
  setTimeout(() => { try { b.g.disconnect(); b.s.disconnect(); } catch (e) {} }, ms + 2500);
};
})();
