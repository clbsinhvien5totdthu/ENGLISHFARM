(() => {
// ====== CẤU HÌNH ======
const B2_LEVEL = 2;                 // cấp độ người chơi cần đạt để mở bài học B2
const SPEED = 150;                 // tốc độ đi bộ
const COST = { till:2, sow:3, water:2, harvest:2 }; // stamina hao khi làm nông
const LESSON = {                    // stamina hao MỖI CÂU hỏi · exp đúng lần đầu / đúng sau khi thử lại · thưởng 5/5 · coin mỗi câu đúng lần đầu
  B1: { st:2, exp:4, retry:1, perfect:10, coin:2 },
  B2: { st:3, exp:7, retry:2, perfect:18, coin:4 }
};
const N_Q = 5;                      // số câu mỗi tiết học
const expNeed = l => 40 + l * 20;   // EXP cần để lên cấp kế tiếp
const maxSt = () => 100 + (S.lvl - 1) * 10; // stamina tối đa tăng theo cấp

// ====== DỮ LIỆU CÂY TRỒNG: thêm cây mới chỉ cần thêm 1 dòng ======
// cost: giá mở khóa hạt · days: số ngày (đã tưới) để lớn · price: tiền khi thu hoạch
// Thêm cây mới: thêm 1 dòng ở đây + 1 tên vào ASSET_META.crops (assets.js) nếu có sprite
const CROPS = [
  // cây mở sẵn
  { id:'carrot',      en:'CARROT',       vi:'cà rốt',        cost:0,   days:2, price:12 },
  { id:'tomato',      en:'TOMATO',       vi:'cà chua',       cost:0,   days:3, price:18 },
  // cây rau củ – ngũ cốc (3-4 ngày)
  { id:'corn',        en:'CORN',         vi:'bắp ngô',       cost:40,  days:3, price:25 },
  { id:'strawberry',  en:'STRAWBERRY',   vi:'dâu tây',       cost:60,  days:3, price:32 },
  { id:'potato',      en:'POTATO',       vi:'khoai tây',     cost:80,  days:3, price:35 },
  { id:'cabbage',     en:'CABBAGE',      vi:'bắp cải',       cost:100, days:3, price:38 },
  { id:'chili',       en:'CHILI',        vi:'ớt',            cost:120, days:3, price:42 },
  { id:'wheat',       en:'WHEAT',        vi:'lúa mì',        cost:140, days:4, price:50 },
  { id:'rice',        en:'RICE',         vi:'lúa gạo',       cost:160, days:4, price:54 },
  { id:'sweetpotato', en:'SWEET POTATO', vi:'khoai lang',    cost:180, days:4, price:58 },
  { id:'garlic',      en:'GARLIC',       vi:'tỏi',           cost:200, days:3, price:50 },
  { id:'sugarcane',   en:'SUGARCANE',    vi:'cây mía',       cost:220, days:4, price:64 },
  { id:'mushroom',    en:'MUSHROOM',     vi:'nấm',           cost:240, days:3, price:60 },
  { id:'soybean',     en:'SOYBEAN',      vi:'đậu nành',      cost:260, days:4, price:68 },
  { id:'tea',         en:'TEA',          vi:'trà',           cost:280, days:4, price:72 },
  { id:'cotton',      en:'COTTON',       vi:'bông vải',      cost:300, days:4, price:76 },
  { id:'jasmine',     en:'JASMINE',      vi:'hoa nhài',      cost:320, days:4, price:80 },
  { id:'rose',        en:'ROSE',         vi:'hoa hồng',      cost:340, days:4, price:86 },
  { id:'melon',       en:'MELON',        vi:'dưa vàng',      cost:360, days:4, price:90 },
  // cây ăn quả (5 ngày)
  { id:'grape',       en:'GRAPE',        vi:'nho',           cost:380, days:5, price:104 },
  { id:'blueberry',   en:'BLUEBERRY',    vi:'việt quất',     cost:400, days:5, price:110 },
  { id:'peach',       en:'PEACH',        vi:'quả đào',       cost:430, days:5, price:118 },
  { id:'lemon',       en:'LEMON',        vi:'chanh vàng',    cost:460, days:5, price:124 },
  { id:'mangosteen',  en:'MANGOSTEEN',   vi:'măng cụt',      cost:490, days:5, price:132 },
  { id:'pineapple',   en:'PINEAPPLE',    vi:'quả dứa',       cost:520, days:5, price:140 },
  { id:'banana',      en:'BANANA',       vi:'chuối',         cost:550, days:5, price:148 },
  { id:'coconut',     en:'COCONUT',      vi:'dừa',           cost:580, days:5, price:156 },
  { id:'coffee',      en:'COFFEE',       vi:'cà phê',        cost:620, days:5, price:170 }
];
// Giá hạt giống & cấp độ mở khóa: cây đắt cần Lv cao hơn → học bài với cô Emma để lên cấp
const SEED_PRICE = c => Math.max(4, Math.round(c.price * .35));
const REQ_LVL = c => 1 + Math.floor(c.cost / 100);
// Hình ảnh: assets.js (icon quả = ICON) · bảng sprite 3 giai đoạn lớn (cây con → đang lớn → chín) theo thứ tự ASSET_META.crops
const FRAME = id => window.ASSET_META.crops.indexOf(id) * 3;
const ICON = id => window.ASSETS.icons[id];
const sico = (id, px = 28) => `<img class="ico" src="${(window.ASSETS.seedIcons && window.ASSETS.seedIcons[id]) || ICON(id)}" alt="" width="${px}" height="${px}">`; // túi hạt giống
const ico = (id, px = 28) => `<img class="ico" src="${ICON(id)}" alt="" width="${px}" height="${px}">`;

// ====== TỪ VỰNG B1 / B2 (cô Emma): nằm trong file vocab.js ======
const VOCAB = window.VOCAB;

// ====== CÂU GIAO TIẾP CỦA DÂN THỊ TRẤN (mỗi ngày nghe 1 câu mới) ======
const VILLAGERS = ['Mrs. Green', 'Old Tom', 'Anna', 'Mr. Lee', 'Grandma Rose', 'Ben'];
const PHRASES = [
  { en:"It's up to you.",                  vi:'Tùy bạn quyết định.',                 tip:'Dùng khi để người khác tự chọn.' },
  { en:"I'm looking forward to seeing you.",vi:'Tôi rất mong được gặp bạn.',          tip:'looking forward to + V-ing (không dùng "to see").' },
  { en:'Could you give me a hand?',        vi:'Bạn giúp tôi một tay được không?',    tip:'give someone a hand = giúp đỡ ai.' },
  { en:"I'm afraid I can't make it.",      vi:'Tôi e là tôi không đến được.',        tip:'make it = có mặt / kịp giờ. Cách từ chối lịch sự.' },
  { en:'Better late than never.',          vi:'Muộn còn hơn không.',                 tip:'Thành ngữ quen thuộc.' },
  { en:"Let's keep in touch.",             vi:'Mình giữ liên lạc nhé.',              tip:'keep in touch = duy trì liên lạc.' },
  { en:'It slipped my mind.',              vi:'Tôi quên mất tiêu.',                  tip:'slip one\'s mind = vô tình quên.' },
  { en:"I'll sort it out.",                vi:'Tôi sẽ giải quyết việc đó.',          tip:'sort out = xử lý, giải quyết (phrasal verb).' },
  { en:'That makes sense.',                vi:'Nghe hợp lý đấy.',                    tip:'make sense = có lý, dễ hiểu.' },
  { en:"I couldn't agree more.",           vi:'Tôi hoàn toàn đồng ý.',               tip:'Dạng phủ định nhưng mang nghĩa rất khẳng định.' },
  { en:"To be honest, I'm not sure.",      vi:'Thành thật mà nói, tôi không chắc.',  tip:'To be honest = nói thật. Mở đầu ý kiến cá nhân.' },
  { en:"It's worth a try.",                vi:'Đáng để thử.',                        tip:'be worth + N/V-ing = đáng để làm.' },
  { en:'I had no idea.',                   vi:'Tôi hoàn toàn không biết.',           tip:'Dùng khi bất ngờ trước thông tin mới.' },
  { en:"Don't get me wrong.",              vi:'Đừng hiểu lầm ý tôi nhé.',            tip:'Nói trước khi đưa ra ý kiến dễ gây hiểu nhầm.' }
];

// ====== ĐỒ ĂN Ở TIỆM: hồi stamina ======
const FOOD = [
  { e:'🍞', en:'Bread', vi:'bánh mì',  cost:6,  st:20 },
  { e:'🥗', en:'Salad', vi:'sa-lát',   cost:12, st:40 },
  { e:'🍲', en:'Soup',  vi:'món súp',  cost:22, st:75 }
];

// ====== ĐỒ TRANG TRÍ NHÀ (tiệm Decor Shop) ======
// kind: 'wall' = treo tường · 'floor' = đặt sàn. Thêm món mới chỉ cần thêm 1 dòng.
const DECOR = [
  { id:'painting', e:'🖼️', en:'Painting', vi:'bức tranh',    cost:40,  kind:'wall' },
  { id:'clock',    e:'🕰️', en:'Clock',    vi:'đồng hồ',      cost:55,  kind:'wall' },
  { id:'lantern',  e:'🏮', en:'Lantern',  vi:'đèn lồng',     cost:45,  kind:'wall' },
  { id:'calendar', e:'📅', en:'Calendar', vi:'tờ lịch',      cost:25,  kind:'wall' },
  { id:'guitar',   e:'🎸', en:'Guitar',   vi:'đàn ghi-ta',   cost:70,  kind:'wall' },
  { id:'cactus',   e:'🌵', en:'Cactus',   vi:'xương rồng',   cost:30,  kind:'floor' },
  { id:'sunflower',e:'🌻', en:'Sunflower',vi:'hoa hướng dương', cost:35, kind:'floor' },
  { id:'chair',    e:'🪑', en:'Chair',    vi:'cái ghế',      cost:35,  kind:'floor' },
  { id:'teddy',    e:'🧸', en:'Teddy bear',vi:'gấu bông',    cost:25,  kind:'floor' },
  { id:'books',    e:'📚', en:'Bookshelf',vi:'giá sách',     cost:50,  kind:'floor' },
  { id:'tv',       e:'📺', en:'Television',vi:'ti vi',       cost:90,  kind:'floor' },
  { id:'fish',     e:'🐠', en:'Fish tank',vi:'bể cá',        cost:80,  kind:'floor' },
  { id:'sofa',     e:'🛋️', en:'Sofa',     vi:'ghế sô-pha',   cost:120, kind:'floor' },
  { id:'piano',    e:'🎹', en:'Piano',    vi:'đàn piano',    cost:150, kind:'floor' }
];
const SLOTS = [ // vị trí đặt đồ trong nhà
  { x:250, y:75, kind:'wall' }, { x:400, y:75, kind:'wall' }, { x:550, y:75, kind:'wall' }, { x:700, y:75, kind:'wall' },
  { x:300, y:200, kind:'floor' }, { x:480, y:200, kind:'floor' }, { x:660, y:200, kind:'floor' },
  { x:270, y:390, kind:'floor' }, { x:530, y:390, kind:'floor' }, { x:690, y:380, kind:'floor' }
];
const placedCount = id => Object.values(S.placed).filter(x => x === id).length;

// ====== LƯU TRỮ ======
const KEY = 'englishFarmSave2'; // giữ nguyên key để không mất dữ liệu cũ; trường mới tự thêm giá trị mặc định
const fresh = () => ({ coins:20, day:1, sel:'carrot', inv:{ seeds:{ carrot:6, tomato:6 }, crops:{} }, learned:{},
  exp:0, lvl:1, stamina:100, words:{}, phraseDay:0, dinhDay:0, own:{}, placed:{},
  plots: Array.from({ length:15 }, () => ({ s:0, c:null, g:0, w:false })) });
let S, old = null;
try { old = JSON.parse(localStorage.getItem(KEY)); S = Object.assign(fresh(), old || {}); } catch (e) { S = fresh(); }
S.stamina = Math.min(S.stamina, maxSt());
// dữ liệu lưu cũ có thể còn cây không còn tồn tại (bí ngô, cà tím…) → dọn để không lỗi
{ const known = id => CROPS.some(c => c.id === id);
  if (!S.inv || !S.inv.seeds) S.inv = { seeds:{ carrot:6, tomato:6 }, crops:{} };
  if (!S.inv.crops) S.inv.crops = {};
  // save cũ (chưa có túi đồ): tặng 3 hạt cho mỗi cây đã mở khóa
  if (old && !old.inv && old.unlocked) old.unlocked.filter(known).forEach(id => { S.inv.seeds[id] = Math.max(S.inv.seeds[id] || 0, 3); });
  [S.inv.seeds, S.inv.crops].forEach(o => Object.keys(o).forEach(id => { if (!known(id) || !(o[id] > 0)) delete o[id]; }));
  if (!known(S.sel)) S.sel = 'carrot';
  S.plots.forEach(p => { if (p.c && !known(p.c)) { p.s = 1; p.c = null; p.g = 0; p.w = false; } }); }
const seedCount = id => S.inv.seeds[id] || 0;
const addSeed = (id, n = 1) => { S.inv.seeds[id] = seedCount(id) + n; };
const owned = () => CROPS.filter(c => seedCount(c.id) > 0).map(c => c.id);
const fixSel = () => { if (seedCount(S.sel) <= 0) { const o = owned(); if (o.length) S.sel = o[0]; } };
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

// ====== TIỆN ÍCH ======
const $ = s => document.querySelector('#farm-app ' + s);
const crop = id => CROPS.find(c => c.id === id);
const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
let open = false, clk = 360; // clk = phút trong ngày (360 = 06:00)
const hhmm = m => { m = Math.floor(m); return String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
const dark = h => h < 6 ? .5 : h < 8 ? .5 * (8 - h) / 2 : h < 17 ? 0 : h < 20.5 ? .5 * (h - 17) / 3.5 : .5;

// ====== ÂM THANH (tổng hợp bằng WebAudio, không cần file mp3) ======
const AU = { c:null, m:null, nb:null, on:(() => { try { return localStorage.getItem('efSound') !== '0'; } catch (e) { return true; } })() };
function au() {
  if (!AU.on) return null;
  try {
    if (!AU.c) {
      const C = window.AudioContext || window.webkitAudioContext; AU.c = new C();
      AU.m = AU.c.createGain(); AU.m.gain.value = .9; AU.m.connect(AU.c.destination);
      const n = AU.c.sampleRate, b = AU.c.createBuffer(1, n, AU.c.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; AU.nb = b;
    }
    if (AU.c.state === 'suspended') AU.c.resume();
    return AU.c;
  } catch (e) { return null; }
}
// nốt nhạc: tần số, độ dài, kiểu sóng, âm lượng, trễ, tần số cuối (trượt)
function tone(f, d = .1, type = 'square', vol = .05, delay = 0, to = 0) {
  const a = au(); if (!a) return;
  const t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + d);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  o.connect(g); g.connect(AU.m); o.start(t); o.stop(t + d + .03);
}
// tiếng ồn lọc (đất, nước, bước chân…): d <= .5
function noise(d = .1, f = 800, kind = 'lowpass', vol = .08, delay = 0, to = 0) {
  const a = au(); if (!a) return;
  const t = a.currentTime + delay, s = a.createBufferSource(), fl = a.createBiquadFilter(), g = a.createGain();
  s.buffer = AU.nb; fl.type = kind; fl.Q.value = kind === 'bandpass' ? 1.2 : .7;
  fl.frequency.setValueAtTime(f, t); if (to) fl.frequency.exponentialRampToValueAtTime(to, t + d);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  s.connect(fl); fl.connect(g); g.connect(AU.m); s.start(t, Math.random() * .5); s.stop(t + d + .03);
}
const sfx = (f, d = .1, type = 'square') => tone(f, d, type, .04);
const SND = {
  step:  () => noise(.07, 450 + Math.random() * 300, 'lowpass', .06),
  wood:  () => { tone(150 + Math.random() * 30, .06, 'square', .03, 0, 90); noise(.05, 700, 'lowpass', .05); },
  till:  () => { noise(.18, 380, 'lowpass', .18); tone(110, .15, 'sine', .09, 0, 55); noise(.08, 900, 'lowpass', .08, .12); },
  sow:   () => { for (let i = 0; i < 5; i++) noise(.04, 3200 + Math.random() * 900, 'highpass', .05, i * .05); tone(320, .1, 'sine', .03, .08, 200); },
  water: () => { noise(.45, 2000, 'bandpass', .1, 0, 600); [.1, .2, .3].forEach(d => tone(500 + Math.random() * 300, .09, 'sine', .035, d, 950)); },
  harvest: () => { noise(.06, 1500, 'bandpass', .08); tone(520, .1, 'triangle', .07, 0, 900); tone(880, .12, 'triangle', .06, .09); tone(1320, .18, 'triangle', .05, .18); },
  coin:  () => { tone(1320, .08, 'square', .03); tone(1760, .2, 'square', .03, .07); },
  buy:   () => { tone(988, .06, 'square', .03); tone(1319, .2, 'square', .03, .06); noise(.05, 4000, 'highpass', .04, .1); },
  error: () => tone(170, .22, 'sawtooth', .05, 0, 90),
  ok:    () => { tone(660, .1, 'square', .04); tone(880, .16, 'square', .04, .09); },
  wrong: () => tone(160, .24, 'sawtooth', .05, 0, 100),
  click: () => tone(720, .04, 'square', .02),
  select:() => tone(900, .06, 'triangle', .05, 0, 1200),
  bag:   () => { noise(.14, 1300, 'bandpass', .08, 0, 500); noise(.1, 1600, 'bandpass', .06, .12, 600); },
  door:  () => { noise(.25, 500, 'lowpass', .12, 0, 200); tone(180, .22, 'sine', .05, .02, 120); },
  eat:   () => { for (let i = 0; i < 3; i++) noise(.05, 2200, 'bandpass', .1, i * .1); tone(500, .1, 'sine', .04, .35, 800); },
  place: () => { tone(320, .09, 'triangle', .07, 0, 200); noise(.06, 900, 'lowpass', .06); },
  chat:  () => { tone(600, .06, 'triangle', .04); tone(760, .08, 'triangle', .04, .08); },
  levelup: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, .2, 'triangle', .06, i * .11)),
  sleep: () => [523, 440, 392, 330].forEach((f, i) => tone(f, .5, 'sine', .05, i * .35)),
  wake:  () => { [392, 523, 659].forEach((f, i) => tone(f, .25, 'triangle', .05, i * .13)); SND.bird(); },
  bird:  () => { const b = 2400 + Math.random() * 1100; tone(b, .07, 'sine', .022, 0, b * 1.3); tone(b * 1.2, .08, 'sine', .022, .1, b); tone(b * 1.35, .06, 'sine', .018, .2, b * 1.1); },
  cricket: () => [0, .1, .2].forEach(d => tone(4300, .05, 'sine', .01, d))
};
const snd = n => { try { if (SND[n]) SND[n](); } catch (e) {} };
// nhạc nền nhẹ (thang âm ngũ cung), chỉ chạy sau khi người chơi bấm / nhấn phím lần đầu
let musicT;
const SCALE = [262, 294, 330, 392, 440, 523, 587, 659];
function startMusic() {
  if (musicT) return;
  musicT = setInterval(() => {
    if (!AU.on || document.hidden || !AU.c) return;
    const n = SCALE[Math.floor(Math.random() * SCALE.length)];
    tone(n, 1.8, 'sine', .016); if (Math.random() < .4) tone(n / 2, 2.2, 'triangle', .01, .05);
  }, 1500);
}

function modal(title, html, btns, keep) {
  const card = $('.card'), top = keep ? card.scrollTop : 0;
  open = true;
  $('#mTitle').textContent = title;
  $('#mText').innerHTML = html;
  const box = $('#mBtns'); box.innerHTML = '';
  btns.forEach(b => {
    const el = document.createElement('button');
    el.type = 'button'; if (b.html) el.innerHTML = b.html; else el.textContent = b.label; el.disabled = !!b.off;
    if (b.on) el.classList.add('on');
    el.onclick = () => { snd('click'); if (b.fn) b.fn(el); };
    box.appendChild(el);
  });
  $('#modal').hidden = false;
  card.scrollTop = top;
  if (!keep) { const first = box.querySelector('button:not(:disabled)'); if (first) first.focus(); }
}
function closeModal() { open = false; $('#modal').hidden = true; }
function toast(t) {
  const e = $('#toast'); e.textContent = t; e.classList.add('on');
  clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove('on'), 1800);
}

// ====== STAMINA & EXP ======
function can(n) {
  if (S.stamina >= n) return true;
  toast('Hết sức rồi ⚡ — ăn gì đó ở thị trấn hoặc về nhà đi ngủ nhé!'); snd('error');
  return false;
}
const use = n => { S.stamina = Math.max(0, S.stamina - n); hud(); };
// Cộng EXP; trả về số cấp vừa lên
function gainExp(n) {
  S.exp += n; let up = 0;
  while (S.exp >= expNeed(S.lvl)) { S.exp -= expNeed(S.lvl); S.lvl++; up++; }
  if (up) {
    S.stamina = maxSt(); // lên cấp được hồi đầy stamina
    toast('🎉 Lên cấp! Bạn đạt Lv ' + S.lvl + ' · stamina tối đa ' + maxSt());
    snd('levelup');
  }
  hud(); save();
  return up;
}

// Sang ngày mới: cây lớn, hồi đầy stamina
function newDay() {
  S.plots.forEach(p => { if (p.s === 2 && p.w) p.g++; p.w = false; });
  S.day++; clk = 360; late = false; S.stamina = maxSt();
}

function dayText() { $('#day').textContent = (clk >= 1080 ? '🌙 Ngày ' : '🌤 Ngày ') + S.day + ' · ' + hhmm(clk); }
function hud() {
  dayText();
  $('#coins').textContent = '🪙 ' + S.coins;
  $('#lvl').textContent = '⭐ Lv ' + S.lvl;
  const mx = maxSt(), need = expNeed(S.lvl);
  $('#stFill').style.width = Math.max(0, S.stamina / mx * 100) + '%';
  $('#stFill').classList.toggle('low', S.stamina / mx < .25);
  $('#stTxt').textContent = S.stamina + '/' + mx;
  $('#xpFill').style.width = Math.min(100, S.exp / need * 100) + '%';
  $('#xpTxt').textContent = S.exp + '/' + need;
  fixSel();
  const box = $('#seeds'); box.innerHTML = '';
  const o = owned();
  if (!o.length) box.innerHTML = '<small class="noseed">🌱 Hết hạt giống — mua ở Seed Shop hoặc học bài với cô Emma</small>';
  o.forEach((id, i) => {
    const b = document.createElement('button');
    const c = crop(id);
    b.type = 'button'; b.innerHTML = sico(id, 26) + '<span class="cnt">' + seedCount(id) + '</span>' + (i < 9 ? '<sup>' + (i + 1) + '</sup>' : '');
    b.className = id === S.sel ? 'on' : '';
    b.title = c.en + ' — ' + c.vi + ' (còn ' + seedCount(id) + ' hạt)';
    b.setAttribute('aria-label', 'Hạt giống ' + c.en + ', còn ' + seedCount(id));
    b.onclick = () => { S.sel = id; snd('select'); hud(); save(); };
    box.appendChild(b);
  });
  const on = box.querySelector('.on'); if (on) box.scrollLeft = on.offsetLeft - box.offsetWidth / 2 + on.offsetWidth / 2;
}

// Câu hỏi về cây trồng (từ vựng cơ bản); wrong → thử lại không bị phạt, nhưng mất thưởng "đúng ngay lần đầu"
function quiz(title, prompt, answer, done) {
  const wrong = shuffle(CROPS.filter(c => c.en !== answer)).slice(0, 2).map(c => c.en);
  let tried = false;
  modal(title, prompt, shuffle([answer, ...wrong]).map(w => ({
    label: w,
    fn: el => {
      if (w === answer) { sfx(660); setTimeout(() => sfx(880, .16), 90); closeModal(); done(!tried); }
      else { tried = true; sfx(150, .22, 'sawtooth'); el.disabled = true; $('#mText').innerHTML = prompt + '<br><em>Chưa đúng, thử lại nhé!</em>'; }
    }
  })));
}

// ====== SỔ TỪ ======
function wordBook() {
  const rows = CROPS.map(c => {
    const n = S.learned[c.id] || 0;
    return n ? `<li>${ico(c.id, 22)} <b>${c.en}</b> — ${c.vi} <small>×${n}</small></li>` : '<li class="lock">❔ ???</li>';
  }).join('');
  const all = [].concat(VOCAB.B1.map(w => [w, 'B1']), VOCAB.B2.map(w => [w, 'B2']));
  const got = all.filter(x => S.words[x[0].en]);
  const adv = got.length
    ? '<ul class="book">' + got.map(x => `<li><span class="tag ${x[1] === 'B2' ? 'b2' : ''}">${x[1]}</span> <b>${x[0].en}</b> — ${x[0].vi} <small>×${S.words[x[0].en]}</small></li>`).join('') + '</ul>'
    : '<p><small>Chưa có từ nào. Hãy đến học với cô Emma 🎓</small></p>';
  modal('📖 Sổ từ vựng',
    '<b>🌱 Cây trồng</b><ul class="book">' + rows + '</ul>' +
    (DECOR.some(d => S.own[d.id]) ? '<b>🛋️ Đồ trang trí đã mua</b><ul class="book">' + DECOR.filter(d => S.own[d.id]).map(d => `<li>${d.e} <b>${d.en}</b> — ${d.vi} <small>×${S.own[d.id]}</small></li>`).join('') + '</ul>' : '') +
    `<b>🎓 Từ B1/B2 đã học (${got.length}/${all.length})</b>` + adv +
    '<p>Trả lời đúng nhiều lần để nhớ lâu hơn!</p>',
    [{ label:'Đóng', fn:closeModal }]);
}

// ====== TÚI ĐỒ: hạt giống (bấm để cầm) + nông sản ======
function bag() {
  snd('bag');
  const got = CROPS.filter(c => (S.inv.crops[c.id] || 0) > 0);
  const o = owned();
  const crops = got.length
    ? '<ul class="book">' + got.map(c => `<li>${ico(c.id, 22)} <b>${c.en}</b> — ${c.vi} <small>×${S.inv.crops[c.id]} · ${c.price}🪙/quả</small></li>`).join('') + '</ul>'
    : '<p><small>Chưa có nông sản. Thu hoạch cây chín để bỏ vào túi, rồi bán ở Seed Shop.</small></p>';
  const btns = o.map(id => { const c = crop(id); return { on: id === S.sel, html: `${id === S.sel ? '✋ ' : ''}${sico(id, 26)} ${c.en} <small>(${c.vi})</small> ×${seedCount(id)}`,
    fn: () => { S.sel = id; snd('select'); hud(); save(); bag(); } }; });
  btns.push({ label:'Đóng', fn:closeModal });
  modal('🎒 Túi đồ', '<b>🧺 Nông sản</b>' + crops + '<b>🌱 Hạt giống</b> <small>— bấm để cầm trên tay rồi đi gieo' + (o.length ? '' : '. Chưa có hạt: mua ở Seed Shop hoặc học bài với cô Emma') + '</small>', btns);
}

// ====== CÔ EMMA: BÀI HỌC B1 / B2 ======
function emma() {
  snd('chat');
  const btn = lv => {
    const L = LESSON[lv], lock = lv === 'B2' && S.lvl < B2_LEVEL;
    return { label: lock ? `🔒 B2 — mở ở Lv ${B2_LEVEL}` : `${lv === 'B1' ? '📘' : '📙'} Bài ${lv} · ${N_Q} câu (⚡${L.st}/câu · +${L.exp} EXP)`,
      off: lock, fn: () => lesson(lv) };
  };
  modal('Teacher Emma 🎓',
    '<b>“Hello! Ready to practise your English?”</b><br>(Chào bạn! Sẵn sàng luyện tiếng Anh chưa?)<br>' +
    `<small>⭐ Lv ${S.lvl} · EXP ${S.exp}/${expNeed(S.lvl)} · ⚡ ${S.stamina}/${maxSt()}. Học từ vựng tốn stamina · trả lời đúng ngay lần đầu được 🌱 hạt giống.</small>`,
    [btn('B1'), btn('B2'), { label:'Đóng', fn:closeModal }]);
}

// Thưởng 1 hạt giống ngẫu nhiên (ưu tiên cây rẻ) cho mỗi câu đúng ngay lần đầu
function rewardSeed() {
  const a = CROPS.filter(c => REQ_LVL(c) <= S.lvl), c = a[Math.floor(Math.random() ** 2 * a.length)];
  addSeed(c.id); return c.id;
}

function lesson(lv) {
  const L = LESSON[lv], pool = VOCAB[lv];
  // ưu tiên những từ bạn ít trả lời đúng nhất
  const picks = pool.map(w => [(S.words[w.en] || 0) + Math.random() * 2.5, w]).sort((a, b) => a[0] - b[0]).slice(0, N_Q).map(x => x[1]);
  const R = { first:0, exp:0, up:false, seeds:{} };
  const tag = `<span class="tag ${lv === 'B2' ? 'b2' : ''}">${lv}</span> `;

  const tired = () => modal('Emma 🎓',
    '<b>“You look exhausted!”</b> (Bạn trông kiệt sức rồi!)<br>Hãy ăn gì đó ở thị trấn hoặc về nhà đi ngủ để lấy lại ⚡ rồi học tiếp nhé.',
    [{ label:'Đóng', fn:closeModal }]);

  const finish = () => {
    let bonus = 0;
    if (R.first === N_Q) bonus = L.perfect;
    const coins = R.first * L.coin; S.coins += coins; if (coins) snd('coin');
    const sd = Object.keys(R.seeds).map(id => sico(id, 20) + '×' + R.seeds[id]).join(' ');
    const lvBefore = S.lvl; if (bonus) gainExp(bonus); else { hud(); save(); }
    const total = R.exp + bonus;
    modal('Kết quả bài ' + lv + ' 🎓',
      '<b>“Well done!”</b> (Làm tốt lắm!)<ul class="sum">' +
      `<li>✅ Đúng ngay lần đầu: <b>${R.first}/${N_Q}</b></li>` +
      `<li>🎓 EXP: <b>+${total}</b>${bonus ? ' (có thưởng 5/5 +' + bonus + ')' : ''}</li>` +
      `<li>🪙 Coin: <b>+${coins}</b></li>` +
      (sd ? `<li>🌱 Hạt thưởng: ${sd}</li>` : '') +
      `<li>⭐ Lv ${S.lvl} · EXP ${S.exp}/${expNeed(S.lvl)}${S.lvl > lvBefore || R.up ? ' 🎉 vừa lên cấp!' : ''}</li>` +
      `<li>⚡ Stamina còn ${S.stamina}/${maxSt()}</li></ul>`,
      [{ label:'Học tiếp 📚', fn:() => (S.stamina >= L.st ? lesson(lv) : tired()) }, { label:'Xong', fn:closeModal }]);
  };

  const ask = i => {
    if (i >= picks.length) return finish();
    if (S.stamina < L.st) return tired();
    const w = picks[i], type = ['en2vi', 'vi2en', 'cloze'][Math.floor(Math.random() * 3)];
    const others = shuffle(pool.filter(x => x.en !== w.en));
    const ds = others.filter(x => x.pos === w.pos).concat(others.filter(x => x.pos !== w.pos)).slice(0, 3);
    let prompt, ans, opts;
    if (type === 'en2vi') { prompt = `Nghĩa của <b>${w.en}</b> <small>(${w.pos})</small> là gì?`; ans = w.vi; opts = ds.map(x => x.vi); }
    else if (type === 'vi2en') { prompt = `Từ tiếng Anh nào có nghĩa là <b>“${w.vi}”</b>?`; ans = w.en; opts = ds.map(x => x.en); }
    else { prompt = `Điền từ vào chỗ trống <small>(${w.pos})</small>:<div class="sent">${w.ex.replace('{}', '_____')}</div>`; ans = w.en; opts = ds.map(x => x.en); }
    let tried = false;
    modal(`Câu ${i + 1}/${N_Q}`, tag + prompt, shuffle([ans, ...opts]).map(o => ({
      label: o,
      fn: el => {
        if (o !== ans) { tried = true; snd('wrong'); el.disabled = true; $('#mText').innerHTML = tag + prompt + '<br><em>Chưa đúng, thử lại nhé!</em>'; return; }
        snd('ok');
        const g = tried ? L.retry : L.exp;
        use(L.st); let sid = null; if (!tried) { R.first++; sid = rewardSeed(); R.seeds[sid] = (R.seeds[sid] || 0) + 1; }
        S.words[w.en] = (S.words[w.en] || 0) + 1;
        R.exp += g; if (gainExp(g)) R.up = true;
        modal(tried ? 'Gần đúng rồi!' : 'Chính xác! ✨',
          `${tag}<span class="ok">${w.en}</span> = ${w.vi} <small>(${w.pos})</small><div class="sent">${w.ex.replace('{}', '<b>' + w.en + '</b>')}</div>🎓 +${g} EXP${sid ? ' · 🌱 +1 ' + sico(sid, 20) + ' ' + crop(sid).en : ''}`,
          [{ label: i + 1 < picks.length ? 'Câu tiếp ➜' : 'Xem kết quả', fn:() => ask(i + 1) }]);
      }
    })));
  };
  ask(0);
}

// ====== TEXTURE (vẽ bằng code, chỉ tạo 1 lần cho mọi cảnh) ======
function makeTextures(sc) {
  const tex = (k, w, h, f) => { if (sc.textures.exists(k)) return; const g = sc.add.graphics(); f(g); g.generateTexture(k, w, h); g.destroy(); };
  const person = (g, hair, shirt, extra) => {
    g.fillStyle(hair); g.fillRect(6,0,20,8); g.fillRect(5,4,3,14); g.fillRect(24,4,3,14);
    g.fillStyle(0xffd9b8); g.fillRect(8,3,16,11); g.fillStyle(hair); g.fillRect(8,3,16,3);
    g.fillStyle(shirt); g.fillRect(6,14,20,18); g.fillStyle(0xffffff); g.fillRect(11,18,10,14);
    g.fillStyle(0x222222); g.fillRect(12,8,2,3); g.fillRect(19,8,2,3); g.fillStyle(0xff9aa8); g.fillRect(9,11,3,2); g.fillRect(21,11,3,2);
    if (extra) extra(g);
  };
  // một ngôi nhà nhỏ, ox = vị trí x bắt đầu (để ghép nhiều nhà vào 1 texture)
  const bld = (g, ox, w, wall, roof, roofLight) => {
    const h = 104, win = x => { g.fillStyle(0x6e3b17); g.fillRect(x,50,20,20); g.fillStyle(0x8fd3ff); g.fillRect(x+2,52,16,16); g.fillStyle(0x6e3b17); g.fillRect(x+9,52,2,16); g.fillRect(x+2,59,16,2); };
    g.fillStyle(0x000000, .18); g.fillEllipse(ox + w / 2, h - 5, w - 6, 10);
    g.fillStyle(wall); g.fillRect(ox + 6, 38, w - 12, h - 44);
    g.fillStyle(roof); g.fillTriangle(ox - 2, 44, ox + w / 2, 2, ox + w + 2, 44);
    g.fillStyle(roofLight); g.fillTriangle(ox + 5, 42, ox + w / 2, 9, ox + w - 5, 42);
    g.fillStyle(0x6b3a22); g.fillRect(ox + w / 2 - 12, h - 44, 24, 38);
    g.fillStyle(0xf2d28b); g.fillRect(ox + w / 2 - 10, h - 42, 20, 36);
    g.fillStyle(0x6b3a22); g.fillRect(ox + w / 2 + 5, h - 26, 3, 3);
    win(ox + 12); win(ox + w - 32);
  };

  tex('grass', 32, 32, g => { g.fillStyle(0x7cc062); g.fillRect(0,0,32,32); g.fillStyle(0x72b858); [[4,6],[20,3],[12,18],[26,24],[6,27]].forEach(p => g.fillRect(p[0],p[1],3,3)); g.fillStyle(0x92d374); [[14,8],[28,12],[2,20],[18,28]].forEach(p => g.fillRect(p[0],p[1],2,2)); });
  tex('momo', 32, 32, g => { g.fillStyle(0x7a3d0a); g.fillRect(3,7,26,24); g.fillTriangle(3,8,3,-1,13,8); g.fillTriangle(29,8,29,-1,19,8);
    g.fillStyle(0xff9a1f); g.fillRect(4,8,24,22); g.fillTriangle(4,8,4,1,12,8); g.fillTriangle(28,8,28,1,20,8);
    g.fillStyle(0xffb3a7); g.fillTriangle(6,8,6,4,10,8); g.fillTriangle(26,8,26,4,22,8);
    g.fillStyle(0xe27d10); g.fillRect(14,9,4,5); g.fillRect(4,18,4,3); g.fillRect(24,18,4,3);
    g.fillStyle(0xffffff); g.fillRect(10,21,12,9); g.fillStyle(0x222222); g.fillRect(9,13,4,5); g.fillRect(19,13,4,5);
    g.fillStyle(0xffffff); g.fillRect(10,13,1,1); g.fillRect(20,13,1,1); g.fillStyle(0xff6f91); g.fillRect(15,18,2,2); });
  tex('lily', 32, 32, g => person(g, 0x5a3a1a, 0xff69b4));
  tex('emma', 32, 32, g => person(g, 0x8a4b1a, 0x3b6fd8, h => { h.lineStyle(1, 0x222222); h.strokeRect(11,7,6,5); h.strokeRect(18,7,6,5); h.fillStyle(0xf2b632); h.fillRect(1,21,7,9); h.fillStyle(0xffffff); h.fillRect(2,22,5,1); }));
  tex('chef', 32, 32, g => person(g, 0xf5f5f5, 0xffffff, h => { h.fillStyle(0xd33a2c); h.fillRect(12,14,8,3); }));
  tex('ben', 32, 32, g => person(g, 0x2b2b2b, 0x3aa1a1));
  tex('rose', 32, 32, g => person(g, 0xdcdcdc, 0x9b59b6));
  tex('house', 96, 96, g => { g.fillStyle(0x000000, .18); g.fillEllipse(48,92,92,10);
    g.fillStyle(0x9c5a2e); g.fillRect(6,36,84,56); g.fillStyle(0x84491f); [44,52,60,68,76,84].forEach(y => g.fillRect(6,y,84,1));
    g.fillStyle(0x6e3b17); g.fillRect(66,6,12,24); g.fillStyle(0x8a1f17); g.fillTriangle(-2,42,48,0,98,42); g.fillStyle(0xb5382a); g.fillTriangle(4,40,48,6,92,40);
    g.fillStyle(0x6b3a22); g.fillRect(36,56,24,36); g.fillStyle(0xf2d28b); g.fillRect(38,58,20,34); g.fillStyle(0x6b3a22); g.fillRect(53,76,3,3);
    g.fillStyle(0x6e3b17); g.fillRect(10,46,20,20); g.fillStyle(0x8fd3ff); g.fillRect(12,48,16,16); g.fillStyle(0x6e3b17); g.fillRect(19,48,2,16); g.fillRect(12,55,16,2);
    g.fillStyle(0x6e3b17); g.fillRect(66,46,20,20); g.fillStyle(0x8fd3ff); g.fillRect(68,48,16,16); g.fillStyle(0x6e3b17); g.fillRect(75,48,2,16); g.fillRect(68,55,16,2); });
  tex('tree', 48, 64, g => { g.fillStyle(0x000000, .2); g.fillEllipse(24,60,36,10);
    g.fillStyle(0x6b4423); g.fillRect(19,38,10,24); g.fillStyle(0x56361a); g.fillRect(25,38,4,24);
    g.fillStyle(0x24692a); g.fillCircle(24,25,23); g.fillStyle(0x2e7d32); g.fillCircle(22,22,20); g.fillStyle(0x3a9440); g.fillCircle(16,18,11); g.fillStyle(0x56b255); g.fillCircle(14,14,5); });
  tex('soil', 56, 56, g => { g.fillStyle(0x8a5e34); g.fillRect(0,0,56,56); g.fillStyle(0x744a27); [10,24,38,50].forEach(y => g.fillRect(4,y,48,3)); g.lineStyle(2,0x4a3320); g.strokeRect(1,1,54,54); });
  tex('spark', 6, 6, g => { g.fillStyle(0xffffff); g.fillRect(0,0,6,6); });
  tex('shadow', 28, 10, g => { g.fillStyle(0x000000, .28); g.fillEllipse(14,5,26,8); });
  tex('flower', 8, 8, g => { g.fillStyle(0xffffff); g.fillRect(3,0,2,2); g.fillRect(0,3,2,2); g.fillRect(6,3,2,2); g.fillRect(3,6,2,2); g.fillStyle(0xffe066); g.fillRect(3,3,2,2); });
  tex('path', 32, 32, g => { g.fillStyle(0xd8b87a); g.fillRect(0,0,32,32); g.fillStyle(0xc4a263); [[4,5],[19,9],[9,22],[25,26]].forEach(p => g.fillRect(p[0],p[1],3,2)); });
  tex('pond', 160, 100, g => { g.fillStyle(0x2f6f9f); g.fillEllipse(80,50,158,98); g.fillStyle(0x4aa3d8); g.fillEllipse(80,50,144,84); g.fillStyle(0x8fd3ff); g.fillRect(40,34,22,3); g.fillRect(96,56,30,3); g.fillRect(62,70,16,3); });
  // --- thị trấn ---
  tex('shop', 112, 104, g => bld(g, 0, 112, 0xb98a5a, 0x2f7a3a, 0x4caf50));
  tex('homes', 192, 104, g => { bld(g, 0, 96, 0xe0c9a6, 0x2f5f9e, 0x4a7fc4); bld(g, 96, 96, 0xcfe0b0, 0x8a3f9a, 0xa75cb8); });
  tex('stall', 112, 96, g => {
    g.fillStyle(0x000000, .18); g.fillEllipse(56,91,104,10);
    g.fillStyle(0x6e3b17); g.fillRect(8,30,6,62); g.fillRect(98,30,6,62);
    g.fillStyle(0xf2d28b); g.fillRect(14,34,84,30);
    g.fillStyle(0x9c5a2e); g.fillRect(6,62,100,30); g.fillStyle(0x84491f); g.fillRect(6,62,100,4);
    g.fillStyle(0xd9a05b); g.fillEllipse(28,58,20,12); g.fillStyle(0x7cc062); g.fillCircle(56,57,8); g.fillStyle(0xb5382a); g.fillCircle(52,55,3); g.fillCircle(60,57,3);
    g.fillStyle(0x8a5a2b); g.fillRect(78,52,18,10); g.fillStyle(0xe8b04a); g.fillRect(80,50,14,4);
    for (let i = 0; i < 14; i++) { g.fillStyle(i % 2 ? 0xffffff : 0xd33a2c); g.fillRect(i * 8, 8, 8, 22); g.fillTriangle(i * 8, 30, i * 8 + 8, 30, i * 8 + 4, 37); }
  });
  // --- trong nhà + tiệm trang trí ---
  tex('decor', 112, 104, g => bld(g, 0, 112, 0xe8b4c8, 0x8a3f9a, 0xa75cb8));
  tex('mia', 32, 32, g => person(g, 0x7a3d8a, 0xf2b632, h => { h.fillStyle(0xff6f91); h.fillRect(6,0,20,3); }));
  tex('wood', 32, 32, g => { g.fillStyle(0xb9854f); g.fillRect(0,0,32,32); g.fillStyle(0xa8743f); g.fillRect(0,0,32,2); g.fillRect(0,16,32,2);
    g.fillStyle(0xc4935c); [[4,5],[20,9],[10,22],[24,26]].forEach(p => g.fillRect(p[0],p[1],6,1)); g.fillStyle(0x8f6234); g.fillRect(16,2,1,14); g.fillRect(6,18,1,14); });
  tex('wall', 32, 32, g => { g.fillStyle(0xe8d7b0); g.fillRect(0,0,32,32); g.fillStyle(0xdcc99b); g.fillRect(0,0,2,32); g.fillRect(16,0,2,32); g.fillStyle(0xefe2c3); g.fillRect(8,6,2,2); g.fillRect(24,20,2,2); });
  tex('bed', 96, 72, g => { g.fillStyle(0x000000, .18); g.fillEllipse(48,68,92,8);
    g.fillStyle(0x6e3b17); g.fillRect(2,4,92,62); g.fillStyle(0xffffff); g.fillRect(6,8,84,54);
    g.fillStyle(0xfff3d6); g.fillRect(10,12,24,18); g.fillRect(10,40,24,18);
    g.fillStyle(0x4a7fc4); g.fillRect(38,8,52,54); g.fillStyle(0x6a9fe0); g.fillRect(38,28,52,6); });
  tex('rug', 200, 110, g => { g.fillStyle(0x8a2b2b); g.fillEllipse(100,55,196,106); g.fillStyle(0xb5382a); g.fillEllipse(100,55,176,86); g.fillStyle(0xf2d28b); g.fillEllipse(100,55,120,52); });
  tex('fountain', 64, 64, g => { g.fillStyle(0x000000, .2); g.fillEllipse(32,54,58,10);
    g.fillStyle(0x9aa0a6); g.fillCircle(32,38,26); g.fillStyle(0x4aa3d8); g.fillCircle(32,38,20); g.fillStyle(0x8fd3ff); g.fillCircle(32,38,9);
    g.fillStyle(0x9aa0a6); g.fillRect(29,12,6,26); g.fillStyle(0xcfe9ff); g.fillCircle(32,10,5); g.fillRect(24,18,2,6); g.fillRect(38,18,2,6); });
}

// ====== CẢNH CƠ SỞ: di chuyển, thời gian, tương tác dùng chung ======
let late = false;
const activeScene = () => game.scene.getScenes(true)[0];
class Base extends Phaser.Scene {
  init(data) { this.from = data && data.from; this.leaving = false; this.target = null; }

  boot(W, H, px, py) {
    makeTextures(this);
    this.W = W; this.H = H;
    this.physics.world.setBounds(0, 0, W, H);
    this.add.tileSprite(0, 0, W, H, 'grass').setOrigin(0).setDepth(-1);
    this.solids = this.physics.add.staticGroup();
    this.player = this.physics.add.sprite(px, py, 'hero', 0).setOrigin(.5, .78).setCollideWorldBounds(true);
    this.player.body.setSize(16, 12).setOffset(12, 40); // chỉ va chạm ở bàn chân
    this.face = 'down';
    this.shadow = this.add.image(0, 0, 'shadow').setDepth(.5);
    this.night = this.add.rectangle(-4000, -4000, 12000, 12000, 0x0a1445, 0).setOrigin(0).setScrollFactor(0).setDepth(2000);
    const cam = this.cameras.main;
    cam.setBackgroundColor('#1d2b19').startFollow(this.player, false, .12, .12).setBounds(0, 0, W, H);
    // khung game co giãn theo cửa sổ (không còn viền xanh); zoom tự chỉnh theo kích thước
    const fit = () => cam.setZoom(Math.max(1, Math.min(this.scale.height / 432, this.scale.width / 640)));
    fit(); this.scale.on('resize', fit); this.events.once('shutdown', () => this.scale.off('resize', fit));
    // tiếng chim ban ngày / dế ban đêm
    this.time.addEvent({ delay:4200, loop:true, callback: () => { if (open || !AU.on || this.scene.key === 'Home' || Math.random() < .4) return; snd(clk >= 1080 || clk < 360 ? 'cricket' : 'bird'); } });
    this.cameras.main.fadeIn(350);
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = this.input.keyboard.addKeys({ up:K.W, down:K.S, left:K.A, right:K.D, u2:K.UP, d2:K.DOWN, l2:K.LEFT, r2:K.RIGHT, e:K.E, sp:K.SPACE });
    this.input.on('pointerdown', p => { if (!open && !this.leaving) this.target = { x:p.worldX, y:p.worldY }; });
    this.hintText = '';
  }

  // nhân vật đứng yên có va chạm + bóng + nhãn tên
  npc(key, x, y, name) {
    const s = this.physics.add.sprite(x, y, key).setImmovable(true).setDepth(y);
    this.add.image(x, y + 16, 'shadow').setDepth(.5);
    if (name) this.add.text(x, y - 32, name, { fontSize:'14px', color:'#fff', backgroundColor:'#00000088', padding:{ x:4, y:1 } }).setOrigin(.5).setDepth(1500);
    this.physics.add.collider(this.player, s);
    return s;
  }

  go(key) {
    if (this.leaving) return;
    this.leaving = true; this.target = null; this.player.setVelocity(0); snd('door');
    const cam = this.cameras.main; cam.fadeOut(300);
    cam.once('camerafadeoutcomplete', () => this.scene.start(key, { from:this.scene.key }));
  }

  // trả về false khi đang mở hộp thoại / đang chuyển cảnh
  move(time, delta) {
    const k = this.keys;
    if (open || this.leaving) { this.player.setVelocity(0); return false; }
    const L = k.left.isDown || k.l2.isDown, R = k.right.isDown || k.r2.isDown, U = k.up.isDown || k.u2.isDown, D = k.down.isDown || k.d2.isDown;
    let vx = (R ? 1 : 0) - (L ? 1 : 0), vy = (D ? 1 : 0) - (U ? 1 : 0);
    if (vx || vy) this.target = null;
    else if (this.target) {
      const dx = this.target.x - this.player.x, dy = this.target.y - this.player.y;
      if (Math.hypot(dx, dy) > 8) { vx = dx; vy = dy; } else this.target = null;
    }
    // tăng / giảm tốc mượt thay vì đổi vận tốc tức thì
    const len = Math.hypot(vx, vy), b = this.player.body, ease = Math.min(1, delta * .016);
    const tx = len ? vx / len * SPEED : 0, ty = len ? vy / len * SPEED : 0;
    const sm = (cur, to) => Math.abs(to - cur) < 4 ? to : cur + (to - cur) * ease;
    b.setVelocity(sm(b.velocity.x, tx), sm(b.velocity.y, ty));

    clk = Math.min(clk + delta * .006, 1500);
    this.night.setAlpha(dark(clk / 60));
    const tick = Math.floor(clk / 10); if (tick !== this.tick) { this.tick = tick; dayText(); }
    if (clk >= 1380 && !late) { late = true; toast('Muộn rồi — về nhà đi ngủ thôi! 🌙'); }
    const moving = !!(vx || vy);
    this.stepT = moving ? (this.stepT || 0) + delta : 220;
    if (this.stepT > 300) { this.stepT = 0; snd(this.scene.key === 'Home' ? 'wood' : 'step'); }
    this.player.setDepth(this.player.y);
    this.animate(vx, vy, moving);
    this.shadow.setPosition(this.player.x, this.player.y + 10);
    return true;
  }

  // hoạt ảnh đi bộ: xuống / lên / ngang (đi trái = lật ảnh đi phải)
  animate(vx, vy, moving) {
    const p = this.player;
    if (moving) {
      if (Math.abs(vx) > Math.abs(vy)) { this.face = 'side'; p.setFlipX(vx > 0); }
      else this.face = vy > 0 ? 'down' : 'up';
    }
    if (this.face !== 'side') p.setFlipX(false);
    if (moving) p.anims.play('walk-' + this.face, true);
    else { p.anims.stop(); p.setFrame({ down:0, up:4, side:8 }[this.face]); }
  }

  // nền: cỏ ngẫu nhiên + đường đất tự ghép góc / ngã ba / ngã tư theo các ô lân cận (ô 64px)
  rng(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }
  paintGround(cells, solid) {
    // Nền được "nướng" thành 1 ảnh duy nhất (hết vạch kẻ ô khi zoom). Cỏ vẽ ô 32px (nhỏ bằng nửa trước), đường đất giữ ô 64px.
    const T = 64, S2 = 32, rnd = this.rng(5), has = (x, y) => cells.has(x + ',' + y);
    const cw = Math.ceil(this.W / T), ch = Math.ceil(this.H / T);
    const rt = this.add.renderTexture(0, 0, cw * T, ch * T).setOrigin(0).setDepth(-.5);
    rt.fill(0x6a9f46);
    for (let cy = 0; cy < ch; cy++) for (let cx = 0; cx < cw; cx++) {
      if (has(cx, cy)) {
        const n = has(cx, cy - 1), e = has(cx + 1, cy), so = has(cx, cy + 1), w = has(cx - 1, cy);
        const full = n && e && so && w && has(cx - 1, cy - 1) && has(cx + 1, cy - 1) && has(cx - 1, cy + 1) && has(cx + 1, cy + 1);
        const f = full || (solid && solid.has(cx + ',' + cy)) ? 22 : 6 + ((n ? 1 : 0) | (e ? 2 : 0) | (so ? 4 : 0) | (w ? 8 : 0)); // 6..21: 16 kiểu đường, 22: đất đặc
        rt.drawFrame('tiles', f, cx * T, cy * T);
      } else for (let sy = 0; sy < 2; sy++) for (let sx = 0; sx < 2; sx++) rt.drawFrame('grassS', 'g' + Math.floor(rnd() * 6), cx * T + sx * S2, cy * T + sy * S2);
    }
  }
  // rải bụi cỏ / bụi hoa trang trí (ok(x,y) = chỗ được phép đặt)
  scatter(n, seed, ok) {
    const rnd = this.rng(seed);
    for (let k = 0, tries = 0; k < n && tries < n * 40; tries++) {
      const x = 30 + rnd() * (this.W - 60), y = 50 + rnd() * (this.H - 70);
      if (!ok(x, y)) continue;
      // không đặt bụi đè lên cây / nhà (hết lỗi bụi hoa chồng lên tán cây)
      if (this.solids.getChildren().some(o => Math.abs(o.x - x) < o.width / 2 + 24 && y > o.y - o.height / 2 - 4 && y - 40 < o.y + o.height / 2)) continue;
      this.add.image(x, y, k % 3 === 2 ? 'bushF' : 'bushG').setOrigin(.5, 1).setDepth(y); k++;
    }
  }

  interact() {
    this.cur = this.look();
    const t = this.label(this.cur);
    if (t !== this.hintText) { this.hintText = t; $('#hint').textContent = t; }
    const k = this.keys, J = Phaser.Input.Keyboard.JustDown;
    if (J(k.e) || J(k.sp)) this.act();
  }

  act() { if (!open && !this.leaving && this.cur) this.doAct(this.cur); }

  update(time, delta) {
    if (!this.move(time, delta)) return;
    this.edge();
    this.interact();
  }
}

// ====== CẢNH 0: NẠP SPRITE (từ assets.js) ======
const IMG = {};
class Boot extends Phaser.Scene {
  constructor() { super('Boot'); }
  create() {
    const T = this.textures, M = window.ASSET_META;
    T.addSpriteSheet('tiles', IMG.tiles, { frameWidth:M.tile, frameHeight:M.tile });          // 0-5 cỏ · 6-21 đường (theo bitmask N=1 E=2 S=4 W=8) · 22 đất đặc
    T.addSpriteSheet('crops', IMG.crops, { frameWidth:M.cropCell, frameHeight:M.cropCell });   // mỗi cây 3 khung: cây con / đang lớn / chín
    T.addSpriteSheet('hero',  IMG.hero,  { frameWidth:M.hero[0], frameHeight:M.hero[1] });     // hàng 1 đi xuống · hàng 2 đi lên · hàng 3 đi ngang
    // cỏ thu nhỏ còn 32px (6 kiểu) để cỏ không còn "quá bự"
    { const cv = document.createElement('canvas'); cv.width = 32 * 6; cv.height = 32;
      const cx = cv.getContext('2d'); cx.imageSmoothingEnabled = true; cx.imageSmoothingQuality = 'high';
      for (let i = 0; i < 6; i++) cx.drawImage(IMG.tiles, i * 64, 0, 64, 64, i * 32, 0, 32, 32);
      const ct = T.addCanvas('grassS', cv); for (let i = 0; i < 6; i++) ct.add('g' + i, 0, i * 32, 0, 32, 32); }
    Object.keys(window.ASSETS.bld || {}).forEach(k => { if (IMG['b_' + k]) T.addImage('b_' + k, IMG['b_' + k]); }); // công trình pixel-art
    T.addImage('shopimg', IMG.shop); T.addImage('bushG', IMG.bushG); T.addImage('bushF', IMG.bushF);
    [['down', 0], ['up', 4], ['side', 8]].forEach(([k, st]) => this.anims.create({
      key:'walk-' + k, frames:this.anims.generateFrameNumbers('hero', { start:st, end:st + 3 }), frameRate:10, repeat:-1 }));
    this.scene.start('Farm');
  }
}

// ====== CẢNH 1: NÔNG TRẠI ======
class Farm extends Base {
  constructor() { super('Farm'); }

  create() {
    const W = 1280, H = 960;
    const sp = this.from === 'Town' ? [1200, 600] : this.from === 'Home' ? [200, 292] : [420, 340];
    this.boot(W, H, sp[0], sp[1]);
    this.house = this.add.image(200, 236, 'b_home').setOrigin(.5, 1).setDepth(236); // nhà người chơi (sprite)
    { const z = this.add.zone(200, 211, 150, 50); this.physics.add.existing(z, true); this.house.zone = z; }
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 45; i++) {
      const x = 40 + rnd() * (W - 80), y = 40 + rnd() * (H - 80);
      if ((x > 80 && x < 900 && y > 60 && y < 520) || (x > 880 && x < 1140 && y > 680 && y < 840)) continue; // chừa khu nông trại
      if (x > 150 && y > 530 && y < 690) continue; // chừa con đường nhà → thị trấn
      this.solids.create(x, y, 'tree');
    }
    this.solids.refresh();
    this.solids.children.each(t => t.setDepth(t.y + t.height / 2 - 4)); // sắp lớp theo chân cây / nhà
    // đường đất (ô 64px): nhà → xuống dưới → sang thị trấn (phải) + nhánh rẽ ra ruộng
    const cells = new Set(), road = (x0, y0, x1, y1) => { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) cells.add(x + ',' + y); };
    road(3, 3, 3, 9); road(3, 9, 19, 9); road(4, 5, 6, 5);
    this.paintGround(cells);
    const near = (x, y) => cells.has(Math.floor(x / 64) + ',' + Math.floor(y / 64));
    this.scatter(34, 21, (x, y) => !near(x, y) && !near(x + 24, y) && !near(x - 24, y) && !near(x, y - 20)
      && !(x > 440 && x < 880 && y > 250 && y < 520) && !(x < 320 && y < 270) && !(x > 900 && y > 690 && y < 830));
    const pond = this.add.image(1010, 760, 'pond').setDepth(.3);
    this.tweens.add({ targets: pond, alpha: .82, yoyo: true, repeat: -1, duration: 1700, ease: 'Sine.InOut' });

    // biển chỉ đường + mũi tên nhấp nháy ở cổng thị trấn
    this.add.text(1195, 548, '🏘️ Thị trấn', { fontSize:'15px', color:'#fff', backgroundColor:'#4a3320', padding:{ x:6, y:2 } }).setOrigin(.5).setDepth(1500);
    const arrow = this.add.text(1262, 600, '➜', { fontSize:'26px', color:'#fff', stroke:'#2a1d10', strokeThickness:4 }).setOrigin(.5).setDepth(1500);
    this.tweens.add({ targets: arrow, x: 1250, yoyo: true, repeat: -1, duration: 500 });

    this.emma = this.npc('emma', 340, 250, 'Emma 🎓 English');
    this.physics.add.collider(this.player, this.solids);
    this.physics.add.collider(this.player, this.house.zone);

    // 15 ô đất (5 x 3)
    this.pv = S.plots.map((p, i) => {
      const x = 520 + (i % 5) * 64, y = 300 + Math.floor(i / 5) * 64;
      return { x, y, f:-2, bg:this.add.image(x, y, 'soil').setDepth(1), img:this.add.image(x, y - 2, 'crops', 0).setDepth(2).setVisible(false) };
    });
    this.pv.forEach((_, i) => this.paint(i));
    this.mark = this.add.rectangle(0, 0, 60, 60).setStrokeStyle(3, 0xffffff).setVisible(false).setDepth(3);

    hud();
    if (S.day === 1 && !Object.keys(S.learned).length && !Object.keys(S.words).length) modal('English Farm 🌱',
      '<b>“Welcome to the farm!”</b><br>Chào mừng bạn! Mở <b>🎒 Túi đồ</b> (phím B) → chọn hạt giống → xới đất → gieo hạt → tưới nước → vào nhà đi ngủ → thu hoạch. Làm nông tốn ⚡ stamina.<br>🎓 Nói chuyện với <b>cô Emma</b> để học từ vựng B1/B2: lấy EXP, lên cấp và nhận 🌱 hạt giống thưởng. Đi sang phải để vào 🏘️ thị trấn: mua hạt giống, bán nông sản, ăn đồ hồi stamina.',
      [{ label:'Bắt đầu chơi 🌾', fn:closeModal }]);
  }

  // ảnh cây: 0 = cây con · 1 = đang lớn · 2 = chín (sẵn sàng thu hoạch)
  stage(p) { const c = crop(p.c); return p.g >= c.days ? 2 : (p.g >= Math.ceil(c.days / 2) ? 1 : 0); }

  paint(i) {
    const p = S.plots[i], v = this.pv[i];
    v.bg.setAlpha(p.s ? 1 : .3).setTint(p.w ? 0x6b4a2b : 0xffffff);
    const f = p.s === 2 ? FRAME(p.c) + this.stage(p) : -1;
    if (v.f === f) return;
    v.f = f;
    if (f < 0) return v.img.setVisible(false);
    v.img.setFrame(f).setVisible(true);
    this.tweens.add({ targets: v.img, scale: { from: .2, to: 1 }, duration: 280, ease: 'Back.Out' });
  }

  fx(i, color, text) {
    const v = this.pv[i];
    const em = this.add.particles(v.x, v.y, 'spark', { speed: { min: 40, max: 120 }, lifespan: 550, scale: { start: 1.4, end: 0 }, tint: color, emitting: false }).setDepth(900);
    em.explode(14); this.time.delayedCall(700, () => em.destroy());
    if (text) {
      const t = this.add.text(v.x, v.y - 20, text, { fontSize: '20px', fontStyle: 'bold', color: '#fff', stroke: '#2a1d10', strokeThickness: 4 }).setOrigin(.5).setDepth(901);
      this.tweens.add({ targets: t, y: t.y - 46, alpha: 0, duration: 1100, ease: 'Cubic.Out', onComplete: () => t.destroy() });
    }
  }

  ready(p) { return p.s === 2 && p.g >= crop(p.c).days; }

  edge() { if (this.player.x > this.W - 30 && this.player.y > 540 && this.player.y < 670) this.go('Town'); }

  // Tìm thứ gần người chơi nhất để tương tác
  look() {
    const px = this.player.x, py = this.player.y;
    let best = null, d = 62;
    this.pv.forEach((v, i) => { const dd = Phaser.Math.Distance.Between(px, py, v.x, v.y); if (dd < d) { d = dd; best = { t:'plot', i }; } });
    if (best) return best;
    if (Phaser.Math.Distance.Between(px, py, this.emma.x, this.emma.y) < 85) return { t:'emma' };
    if (Phaser.Math.Distance.Between(px, py, this.house.x, this.house.y) < 120) return { t:'house' };
    return null;
  }

  label(c) {
    if (!c) return 'WASD / phím mũi tên: đi · E hoặc Space: hành động · 1-9 hoặc [ ]: chọn hạt · B: túi đồ · đi sang phải: thị trấn';
    if (c.t === 'emma') return 'E: học tiếng Anh với cô Emma 🎓 (B1/B2)';
    if (c.t === 'house') return 'E: vào nhà 🏠 (ngủ, trang trí)';
    const p = S.plots[c.i];
    if (p.s === 0) return `E: xới đất (⚡${COST.till})`;
    if (p.s === 1) return seedCount(S.sel) > 0 ? `E: gieo ${crop(S.sel).en} (${crop(S.sel).vi}) — còn ${seedCount(S.sel)} hạt (⚡${COST.sow})` : 'Hết hạt giống! Mua ở Seed Shop 🌱 hoặc học bài với cô Emma để nhận thêm.';
    if (this.ready(p)) return `E: thu hoạch ${crop(p.c).en} (${crop(p.c).vi}) (⚡${COST.harvest})`;
    const cc = crop(p.c), nm = `${cc.en} (${cc.vi})`;
    return p.w ? `${nm} — đã tưới, hãy đi ngủ để cây lớn (${p.g}/${cc.days} ngày)` : `E: tưới nước 💧 cho ${nm} (⚡${COST.water})`;
  }

  doAct(c) {
    if (c.t === 'plot') this.plot(c.i); else if (c.t === 'emma') emma(); else this.go('Home');
  }

  plot(i) {
    const p = S.plots[i];
    const after = () => { this.paint(i); hud(); save(); };
    if (p.s === 0) {
      if (!can(COST.till)) return;
      use(COST.till); p.s = 1; toast('Đã xới đất'); this.fx(i, 0xb98a5a); snd('till'); return after();
    }
    if (p.s === 1) {
      const c = crop(S.sel);
      if (seedCount(c.id) <= 0) { snd('error'); return toast('Hết hạt giống rồi 🌱 — mua ở Seed Shop hoặc học bài với cô Emma.'); }
      if (!can(COST.sow)) return;
      use(COST.sow); S.inv.seeds[c.id]--;
      p.s = 2; p.c = c.id; p.g = 0; p.w = false;
      S.learned[c.id] = (S.learned[c.id] || 0) + 1;
      snd('sow'); this.fx(i, 0x9be564, '🌱');
      toast(`Đã gieo ${c.en} = ${c.vi} · còn ${seedCount(c.id)} hạt`);
      fixSel(); return after();
    }
    if (this.ready(p)) {
      if (!can(COST.harvest)) return;
      const c = crop(p.c); use(COST.harvest);
      S.inv.crops[c.id] = (S.inv.crops[c.id] || 0) + 1;
      const seed = Math.random() < .4; if (seed) addSeed(c.id);
      p.s = 1; p.c = null; p.g = 0; p.w = false;
      S.learned[c.id] = (S.learned[c.id] || 0) + 1;
      snd('harvest'); this.fx(i, 0xffd54a, '+1 🧺');
      toast(`Thu hoạch ${c.en} (${c.vi})! Đã bỏ vào 🎒${seed ? ' · +1 hạt giống' : ''} · +2 EXP`);
      after(); return gainExp(2);
    }
    if (!p.w) {
      if (!can(COST.water)) return;
      use(COST.water); p.w = true; toast('Đã tưới nước 💧'); this.fx(i, 0x6ec6ff, '💧'); snd('water'); return after();
    }
    toast('Cây cần thời gian — hãy đi ngủ để sang ngày mới.');
  }
}

// ====== CẢNH 2: THỊ TRẤN ======
class Town extends Base {
  constructor() { super('Town'); }

  create() {
    const W = 1120, H = 640;
    this.boot(W, H, 70, 332);
    // đường chính + lối vào từng cửa
    const cells = new Set(), road = (x0, y0, x1, y1) => { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) cells.add(x + ',' + y); };
    road(0, 5, 17, 5);                                   // đường chính
    road(3, 4, 3, 4); road(8, 4, 8, 4); road(13, 4, 13, 4); // lối vào tiệm hạt giống / nhà dân / decor
    road(6, 6, 6, 6);                                    // lối xuống quầy ăn
    const plaza = new Set(); road(10, 6, 12, 8);          // sân đài phun nước (lát đất đặc)
    for (let x = 10; x <= 12; x++) for (let y = 5; y <= 8; y++) plaza.add(x + ',' + y);
    this.paintGround(cells, plaza);

    const place = (key, x, y) => { const s = this.solids.create(x, y, key); s.setDepth(y + s.height / 2 - 4); return s; };
    // Công trình pixel-art: vẽ theo đáy (origin .5,1), vật cản chỉ ở phần chân → đi vòng ra sau được
    const bldg = (key, x, bottom, solidH = 56, solidW = .8) => {
      const s = this.add.image(x, bottom, 'b_' + key).setOrigin(.5, 1).setDepth(bottom);
      const z = this.add.zone(x, bottom - solidH / 2, s.width * solidW, solidH); this.physics.add.existing(z, true); this.physics.add.collider(this.player, z);
      return s;
    };
    this.shopB  = bldg('seedshop', 220, 304, 60, .75);   // Seed Shop
    this.homesB = bldg('homes', 560, 275, 50, .85);      // nhà dân (2 căn)
    this.foodB  = bldg('food', 380, 545, 50, .8);        // quầy đồ ăn
    this.decorB = bldg('decor', 840, 268, 50, .8);       // tiệm nội thất / trang trí
    this.wellB  = bldg('well', 700, 505, 40, .55);       // giếng nước (thay đài phun nước)
    this.dinhB  = bldg('dinh', 950, 572, 56, .85);       // đình làng
    // hàng cây viền thị trấn
    for (let x = 30; x < W; x += 66) { if (!(x > 80 && x < 360)) place('tree', x, 40); if (!(x + 20 > 800 && x + 20 < 1090)) place('tree', x + 20, 610); }
    for (let y = 120; y < 280; y += 70) place('tree', W - 24, y);
    for (let y = 400; y < 590; y += 70) place('tree', W - 24, y);
    this.solids.refresh();
    this.physics.add.collider(this.player, this.solids);

    const near = (x, y) => cells.has(Math.floor(x / 64) + ',' + Math.floor(y / 64));
    const inside = (x, y, r) => x > r[0] && x < r[2] && y > r[1] && y < r[3];
    const blocks = [[90, 10, 350, 330], [390, 90, 730, 290], [735, 80, 950, 285], [280, 360, 480, 565], [630, 380, 775, 520], [820, 410, 1085, 600]];
    this.scatter(30, 33, (x, y) => !near(x, y) && !near(x + 24, y) && !near(x - 24, y) && !near(x, y - 20) && y < 590 && !blocks.some(r => inside(x, y, r)));

    // biển tên + nhân vật
    const sign = (x, y, t) => this.add.text(x, y, t, { fontSize:'15px', color:'#fff', backgroundColor:'#4a3320', padding:{ x:6, y:2 } }).setOrigin(.5).setDepth(1500);
    sign(560, 292, '🏠 Town Homes'); sign(380, 562, '🍞 Food Stall'); sign(840, 285, '🛋️ Decor Shop'); sign(220, 322, '🌱 Seed Shop'); sign(950, 596, '🏛️ Đình làng'); sign(60, 292, '← Nông trại');
    this.lily = this.npc('lily', 322, 328, 'Lily');
    this.chef = this.npc('chef', 500, 530, 'Chef Bo');
    this.mia = this.npc('mia', 962, 296, 'Mia');
    this.npc('ben', 470, 286); this.npc('rose', 660, 288);
    const arrow = this.add.text(18, 332, '➜', { fontSize:'26px', color:'#fff', stroke:'#2a1d10', strokeThickness:4 }).setOrigin(.5).setFlipX(true).setDepth(1500);
    this.tweens.add({ targets: arrow, x: 30, yoyo: true, repeat: -1, duration: 500 });

    // vùng bấm E: từ lưng chừng công trình xuống ~60px phía trước cửa
    const zn = im => { const r = im.getBounds(); return new Phaser.Geom.Rectangle(r.x - 24, r.bottom - 90, r.width + 48, 150); };
    this.zones = { shop: zn(this.shopB), homes: zn(this.homesB), decor: zn(this.decorB), food: zn(this.foodB), well: zn(this.wellB), dinh: zn(this.dinhB) };
    hud();
    this.time.delayedCall(450, () => toast('Welcome to Sunny Town! 🏘️'));
  }

  edge() { if (this.player.x < 22) this.go('Farm'); }

  look() {
    const px = this.player.x, py = this.player.y;
    if (this.zones.shop.contains(px, py) || Phaser.Math.Distance.Between(px, py, this.lily.x, this.lily.y) < 70) return { t:'shop' };
    if (this.zones.dinh.contains(px, py)) return { t:'dinh' };
    if (this.zones.homes.contains(px, py)) return { t:'homes' };
    if (this.zones.decor.contains(px, py) || Phaser.Math.Distance.Between(px, py, this.mia.x, this.mia.y) < 70) return { t:'decor' };
    if (this.zones.food.contains(px, py) || Phaser.Math.Distance.Between(px, py, this.chef.x, this.chef.y) < 70) return { t:'food' };
    return null;
  }

  label(c) {
    if (!c) return 'WASD / phím mũi tên: đi · E hoặc Space: hành động · đi sang trái: về nông trại';
    if (c.t === 'shop') return 'E: vào Seed Shop — mua hạt giống 🌱';
    if (c.t === 'dinh') return 'E: thắp hương ở Đình làng 🏛️ (mỗi ngày nhận 1 lời chúc, +EXP)';
    if (c.t === 'homes') return 'E: gõ cửa nhà dân 🏠 (mỗi ngày nghe 1 câu mới, +EXP)';
    if (c.t === 'decor') return 'E: vào Decor Shop — mua đồ trang trí nhà 🛋️';
    return 'E: mua đồ ăn 🍞 để hồi ⚡ stamina';
  }

  doAct(c) { if (c.t === 'dinh') this.dinh(); else if (c.t === 'shop') this.shop(); else if (c.t === 'homes') this.homes(); else if (c.t === 'decor') this.decorShop(); else this.food(); }

  shop(tab = 'buy', keep = false) {
    this.qty = this.qty || 1;
    const nav = [
      { label:'🛒 Mua hạt giống', off: tab === 'buy', fn:() => this.shop('buy') },
      { label:'💰 Bán nông sản', off: tab === 'sell', fn:() => this.shop('sell') }
    ];
    const close = { label:'Đóng', fn:closeModal };
    if (tab === 'sell') {
      const got = CROPS.filter(c => (S.inv.crops[c.id] || 0) > 0);
      const total = got.reduce((t, c) => t + c.price * S.inv.crops[c.id], 0);
      const sell = list => { let g = 0; list.forEach(c => { g += c.price * S.inv.crops[c.id]; delete S.inv.crops[c.id]; }); S.coins += g; snd('coin'); hud(); save(); toast(`Đã bán được +${g} 🪙`); this.shop('sell', true); };
      const items = got.map(c => ({ html: `${ico(c.id, 26)} Bán ${c.en} <small>(${c.vi})</small> ×${S.inv.crops[c.id]} — ${c.price * S.inv.crops[c.id]} 🪙`, fn:() => sell([c]) }));
      if (got.length > 1) items.push({ label:`💰 Bán tất cả — ${total} 🪙`, fn:() => sell(got) });
      return modal('Lily · Seed Shop', '<b>“I will buy your vegetables!”</b><br>(Mình sẽ mua rau củ của bạn!)<br><small>🪙 ' + S.coins + (got.length ? '' : ' · Túi chưa có nông sản để bán.') + '</small>', nav.concat(items, close), keep);
    }
    const qty = { label:`Số lượng mỗi lần mua: ×${this.qty} (bấm để đổi)`, fn:() => { this.qty = this.qty === 1 ? 5 : this.qty === 5 ? 10 : 1; this.shop('buy', true); } };
    const items = CROPS.map(c => {
      const lock = S.lvl < REQ_LVL(c), pr = SEED_PRICE(c) * this.qty;
      return { off: lock || S.coins < pr,
        html: lock ? `🔒 ${c.en} — mở ở Lv ${REQ_LVL(c)}` : `${sico(c.id, 26)} ${c.en} <small>(${c.vi})</small> — ${pr} 🪙 <small>· đang có ${seedCount(c.id)}</small>`,
        fn:() => { S.coins -= pr; addSeed(c.id, this.qty); S.sel = c.id; snd('buy'); hud(); save(); toast(`Đã mua ${this.qty} hạt ${c.en} 🌱`); this.shop('buy', true); } };
    });
    modal('Lily · Seed Shop', '<b>“Hello! Welcome to my shop.”</b><br>(Xin chào! Chào mừng đến cửa hàng của mình.)<br><small>🪙 ' + S.coins + ' · ⭐ Lv ' + S.lvl + ' — lên cấp bằng cách học bài với cô Emma để mở thêm hạt giống.</small>', nav.concat(qty, items, close), keep);
  }

  food() {
    const btns = FOOD.map(f => ({
      label: `${f.e} ${f.en} (${f.vi}) — ${f.cost} 🪙 · +${f.st} ⚡`,
      off: S.coins < f.cost || S.stamina >= maxSt(),
      fn: () => { S.coins -= f.cost; S.stamina = Math.min(maxSt(), S.stamina + f.st); snd('eat'); hud(); save(); toast(`Yummy! ${f.e} +${f.st} ⚡`); this.food(); }
    }));
    btns.push({ label:'Đóng', fn:closeModal });
    modal('Chef Bo · Food Stall', '<b>“What would you like to eat?”</b><br>(Bạn muốn ăn gì nào?)<br>' +
      `<small>⚡ ${S.stamina}/${maxSt()} · 🪙 ${S.coins}${S.stamina >= maxSt() ? ' — bạn đang no, không cần ăn thêm.' : ''}</small>`, btns);
  }

  decorShop(tab) {
    if (!tab) {
      const n = Object.keys(S.placed).length;
      return modal('Mia · Decor Shop', `<b>“Hi! Let's make your home beautiful.”</b><br>(Chào bạn! Cùng làm ngôi nhà thật xinh nhé.)<br><small>🪙 ${S.coins} · Về nhà để bày đồ vào các ô trống. Nhà có từ 3 món trở lên sẽ thêm EXP mỗi lần ngủ (đang bày ${n} món).</small>`, [
        { label:'🖼️ Treo tường (Wall)', fn:() => this.decorShop('wall') },
        { label:'🪑 Đặt sàn (Floor)', fn:() => this.decorShop('floor') },
        { label:'Đóng', fn:closeModal }]);
    }
    const btns = DECOR.filter(d => d.kind === tab).map(d => ({
      label: `${d.e} ${d.en} (${d.vi}) — ${d.cost} 🪙${S.own[d.id] ? ' · có ' + S.own[d.id] : ''}`, off: S.coins < d.cost,
      fn: () => { S.coins -= d.cost; S.own[d.id] = (S.own[d.id] || 0) + 1; snd('buy'); hud(); save(); toast(`Đã mua ${d.en} ${d.e}`); this.decorShop(tab); }
    }));
    btns.push({ label:'⬅ Quay lại', fn:() => this.decorShop() });
    modal(tab === 'wall' ? 'Đồ treo tường' : 'Đồ đặt sàn', `<b>“What would you like?”</b> <small>🪙 ${S.coins}</small>`, btns);
  }

  dinh() {
    const W = [
      ['A journey of a thousand miles begins with a single step.', 'Hành trình ngàn dặm bắt đầu từ một bước chân.'],
      ['Practice makes perfect.', 'Có công mài sắt có ngày nên kim.'],
      ['Where there is a will, there is a way.', 'Có chí thì nên.'],
      ['Actions speak louder than words.', 'Hành động có sức nặng hơn lời nói.'],
      ['A friend in need is a friend indeed.', 'Bạn bè thật sự là người giúp ta lúc khó khăn.'],
      ['Every cloud has a silver lining.', 'Trong cái rủi có cái may.'],
      ['Rome was not built in a day.', 'Việc lớn cần thời gian, đừng nóng vội.'],
      ['Better late than never.', 'Muộn còn hơn không.']
    ];
    const w = W[(S.day - 1) % W.length];
    if (S.dinhDay === S.day) {
      return modal('Đình làng 🏛️', '<b>“Peace and good harvest!”</b> (Bình an và mùa màng bội thu!)<br>Hôm nay bạn đã thắp hương rồi. Mai quay lại nhận lời chúc mới nhé.', [{ label:'Đóng', fn:closeModal }]);
    }
    S.dinhDay = S.day; S.stamina = Math.min(maxSt(), S.stamina + 10); save(); snd('chat');
    modal('Đình làng 🏛️', `<b>“${w[0]}”</b><br>${w[1]}<br>🎓 +10 EXP · ⚡ +10 stamina`, [{ label:'Thank you! 🙏', fn:closeModal }]);
    gainExp(10);
  }

  homes() {
    if (S.phraseDay === S.day) {
      return modal('Nhà dân 🏠', '<b>“See you tomorrow!”</b> (Hẹn mai gặp lại!)<br>Hôm nay bạn đã nghe câu mới rồi. Ngủ một giấc ở nhà để sang ngày mới nhé.', [{ label:'Đóng', fn:closeModal }]);
    }
    const i = (S.day - 1) % PHRASES.length, p = PHRASES[i], who = VILLAGERS[(S.day - 1) % VILLAGERS.length];
    S.phraseDay = S.day; save(); snd('chat');
    modal(who + ' 🏠', `<b>“${p.en}”</b><br>${p.vi}<br><small>💡 ${p.tip}</small><br>🎓 +5 EXP`, [{ label:'Thank you! 👍', fn:closeModal }]);
    gainExp(5);
  }
}

// ====== CẢNH 3: TRONG NHÀ ======
class Home extends Base {
  constructor() { super('Home'); }

  create() {
    const W = 800, H = 520;
    this.boot(W, H, 400, H - 70);
    this.physics.world.setBounds(0, 120, W, H - 120); // không đi lên tường được
    this.add.tileSprite(0, 0, W, 130, 'wall').setOrigin(0).setDepth(.05);
    this.add.rectangle(0, 126, W, 8, 0x6b4a2b).setOrigin(0).setDepth(.07);
    this.add.tileSprite(0, 134, W, H - 134, 'wood').setOrigin(0).setDepth(.05);
    // cửa sổ
    this.add.rectangle(110, 68, 70, 56, 0x6e3b17).setDepth(.1);
    this.add.rectangle(110, 68, 62, 48, 0x8fd3ff).setDepth(.11);
    this.add.rectangle(110, 68, 3, 48, 0x6e3b17).setDepth(.12);
    this.add.rectangle(110, 68, 62, 3, 0x6e3b17).setDepth(.12);
    this.add.image(400, 330, 'rug').setDepth(.2);
    // cửa ra ngoài
    this.add.rectangle(W / 2, H - 6, 110, 14, 0x6b3a22).setDepth(.3);
    this.add.text(W / 2, H - 44, '⬇ Ra ngoài', { fontSize:'15px', color:'#fff', backgroundColor:'#4a3320', padding:{ x:6, y:2 } }).setOrigin(.5).setDepth(1500);
    this.bed = this.solids.create(120, 196, 'bed'); this.bed.setDepth(196);
    this.solids.refresh();
    this.physics.add.collider(this.player, this.solids);
    this.slotV = SLOTS.map(s => ({
      box: this.add.rectangle(s.x, s.y, 44, 44).setStrokeStyle(2, 0xffffff, .55).setDepth(.4),
      em: this.add.text(s.x, s.y, '', { fontSize: s.kind === 'wall' ? '36px' : '44px' }).setOrigin(.5).setDepth(s.kind === 'wall' ? 5 : s.y)
    }));
    this.refreshSlots();
    hud();
  }

  refreshSlots() {
    SLOTS.forEach((s, i) => {
      const d = DECOR.find(x => x.id === S.placed[i]);
      this.slotV[i].em.setText(d ? d.e : ''); this.slotV[i].box.setVisible(!d);
    });
  }

  edge() {
    this.night.setAlpha(this.night.alpha * .25); // trong nhà sáng hơn
    if (this.player.y > this.H - 34 && this.player.x > 330 && this.player.x < 470) this.go('Farm');
  }

  look() {
    const px = this.player.x, py = this.player.y;
    if (Phaser.Math.Distance.Between(px, py, this.bed.x, this.bed.y) < 90) return { t:'bed' };
    let best = null, d = 999;
    SLOTS.forEach((s, i) => {
      const dd = Phaser.Math.Distance.Between(px, py, s.x, s.y);
      if (dd < (s.kind === 'wall' ? 85 : 62) && dd < d) { d = dd; best = { t:'slot', i }; }
    });
    return best;
  }

  label(c) {
    if (!c) return 'WASD / phím mũi tên: đi · E hoặc Space: hành động · đi xuống cửa để ra ngoài';
    if (c.t === 'bed') return 'E: ngủ trên giường 🛏️ — hồi đầy ⚡, sang ngày mới';
    const d = DECOR.find(x => x.id === S.placed[c.i]);
    return d ? `E: đổi hoặc cất ${d.e} ${d.en}` : (SLOTS[c.i].kind === 'wall' ? 'E: treo đồ lên tường 🖼️' : 'E: đặt đồ trang trí vào đây 🪑');
  }

  doAct(c) { if (c.t === 'bed') this.sleep(); else this.slot(c.i); }

  slot(i) {
    const sl = SLOTS[i], cur = DECOR.find(x => x.id === S.placed[i]);
    const avail = DECOR.filter(d => d.kind === sl.kind && (S.own[d.id] || 0) - placedCount(d.id) > 0);
    const btns = avail.map(d => ({ label: `${d.e} ${d.en}`, fn: () => {
      S.placed[i] = d.id; save(); this.refreshSlots(); closeModal(); snd('place'); toast(`${d.en} = ${d.vi}`);
    } }));
    if (cur) btns.push({ label:'📦 Cất đồ này đi', fn: () => { delete S.placed[i]; save(); this.refreshSlots(); closeModal(); toast('Đã cất ' + cur.en); } });
    btns.push({ label:'Đóng', fn:closeModal });
    modal(sl.kind === 'wall' ? 'Tường 🖼️' : 'Sàn nhà 🪑',
      (cur ? `Đang bày: ${cur.e} <b>${cur.en}</b> (${cur.vi})<br>` : '') +
      (avail.length ? 'Chọn món để bày:' : 'Chưa có món phù hợp. Hãy mua ở <b>Decor Shop</b> trong thị trấn nhé!'), btns);
  }

  sleep() {
    const n = Object.keys(S.placed).length, cozy = Math.min(3, Math.floor(n / 3)) * 2;
    modal('Đi ngủ 🛏️', '<b>“Good night!”</b> (Chúc ngủ ngon!)<br>Cây đã tưới sẽ lớn thêm một ngày, và bạn được hồi đầy ⚡ stamina.' +
      (cozy ? `<br>🛋️ Nhà ấm cúng: +${cozy} EXP` : '<br><small>Bày từ 3 món đồ trang trí để nhận thêm EXP khi ngủ.</small>'), [
      { label:'Ngủ 🌙', fn:() => {
        closeModal(); this.leaving = true; snd('sleep');
        const cam = this.cameras.main; cam.fadeOut(500);
        cam.once('camerafadeoutcomplete', () => {
          newDay(); hud(); save();
          cam.fadeIn(500); this.leaving = false;
          snd('wake'); toast('Good morning! Ngày ' + S.day + ' · ⚡ đã đầy');
          if (cozy) gainExp(cozy);
        });
      } },
      { label:'Hủy', fn:closeModal }
    ]);
  }
}

let game;
const startGame = () => { game = new Phaser.Game({
  type: Phaser.AUTO, parent: 'game-container', pixelArt: true, backgroundColor: '#1d2b19',
  render: { pixelArt: true, antialias: false, roundPixels: false },   // không làm tròn pixel → di chuyển mượt
  scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' }, // lấp đầy khung, không còn viền
  physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false, fps: 240 } }, // bước vật lý nhỏ → hết giật
  scene: [Boot, Farm, Town, Home]
}); };
const loadImg = (key, src) => new Promise(r => { const i = new Image(); i.onload = () => { IMG[key] = i; r(); }; i.onerror = r; i.src = src; });
Promise.all(['tiles', 'crops', 'hero', 'shop', 'bushG', 'bushF'].map(k => loadImg(k, window.ASSETS[k]))
  .concat(Object.keys(window.ASSETS.bld || {}).map(k => loadImg('b_' + k, window.ASSETS.bld[k])))).then(startGame);

$('#bookBtn').onclick = () => { if (!open) { snd('click'); wordBook(); } };
$('#bagBtn').onclick = () => { if (!open) bag(); };
const sndLabel = () => { $('#sndBtn').textContent = AU.on ? '🔊' : '🔇'; };
$('#sndBtn').onclick = () => { AU.on = !AU.on; try { localStorage.setItem('efSound', AU.on ? '1' : '0'); } catch (e) {} sndLabel(); if (AU.on) { snd('select'); startMusic(); } };
sndLabel();
// trình duyệt chỉ cho phát âm thanh sau lần tương tác đầu tiên
const unlockAudio = () => { au(); startMusic(); };
window.addEventListener('pointerdown', unlockAudio, { once:true });
window.addEventListener('keydown', unlockAudio, { once:true });
$('#actBtn').onclick = () => { const s = activeScene(); if (s && s.act) s.act(); };
window.addEventListener('keydown', e => {
  if (e.key === 'Escape' && open) closeModal();
  const n = parseInt(e.key, 10), o = owned();
  if (!open && n >= 1 && n <= o.length) { S.sel = o[n - 1]; snd('select'); hud(); save(); }
  if (!open && (e.key === '[' || e.key === ']') && o.length) { const k = o.length; S.sel = o[(Math.max(0, o.indexOf(S.sel)) + (e.key === ']' ? 1 : k - 1)) % k]; snd('select'); hud(); save(); }
  if (!open && (e.key === 'b' || e.key === 'B' || e.key === 'i' || e.key === 'I')) bag();
});
hud();
})();
