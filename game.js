(() => {
// ====== CẤU HÌNH ======
const B2_LEVEL = 2;                 // cấp độ người chơi cần đạt để mở bài học B2
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
const CROPS = [
  { id:'carrot',     en:'CARROT',     vi:'cà rốt',   e:'🥕', cost:0,   days:2, price:12 },
  { id:'tomato',     en:'TOMATO',     vi:'cà chua',  e:'🍅', cost:0,   days:3, price:18 },
  { id:'corn',       en:'CORN',       vi:'bắp ngô',  e:'🌽', cost:40,  days:3, price:25 },
  { id:'strawberry', en:'STRAWBERRY', vi:'dâu tây',  e:'🍓', cost:60,  days:3, price:32 },
  { id:'pumpkin',    en:'PUMPKIN',    vi:'bí ngô',   e:'🎃', cost:90,  days:4, price:48 },
  { id:'eggplant',   en:'EGGPLANT',   vi:'cà tím',   e:'🍆', cost:120, days:4, price:60 }
];

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
const fresh = () => ({ coins:20, day:1, sel:'carrot', unlocked:['carrot','tomato'], learned:{},
  exp:0, lvl:1, stamina:100, words:{}, phraseDay:0, own:{}, placed:{},
  plots: Array.from({ length:15 }, () => ({ s:0, c:null, g:0, w:false })) });
let S;
try { S = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) { S = fresh(); }
S.stamina = Math.min(S.stamina, maxSt());
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

// ====== TIỆN ÍCH ======
const $ = s => document.querySelector('#farm-app ' + s);
const crop = id => CROPS.find(c => c.id === id);
const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
let open = false, clk = 360; // clk = phút trong ngày (360 = 06:00)
const hhmm = m => { m = Math.floor(m); return String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
const dark = h => h < 6 ? .5 : h < 8 ? .5 * (8 - h) / 2 : h < 17 ? 0 : h < 20.5 ? .5 * (h - 17) / 3.5 : .5;
const sfx = (f, d = .1, type = 'square') => { try {
  const a = sfx.a || (sfx.a = new (window.AudioContext || window.webkitAudioContext)());
  const o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.value = f;
  g.gain.value = .04; g.gain.exponentialRampToValueAtTime(.0001, a.currentTime + d);
  o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + d); } catch (e) {} };

function modal(title, html, btns) {
  open = true;
  $('#mTitle').textContent = title;
  $('#mText').innerHTML = html;
  const box = $('#mBtns'); box.innerHTML = '';
  btns.forEach(b => {
    const el = document.createElement('button');
    el.type = 'button'; el.textContent = b.label; el.disabled = !!b.off;
    el.onclick = () => b.fn && b.fn(el);
    box.appendChild(el);
  });
  $('#modal').hidden = false;
  const first = box.querySelector('button:not(:disabled)'); if (first) first.focus();
}
function closeModal() { open = false; $('#modal').hidden = true; }
function toast(t) {
  const e = $('#toast'); e.textContent = t; e.classList.add('on');
  clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove('on'), 1800);
}

// ====== STAMINA & EXP ======
function can(n) {
  if (S.stamina >= n) return true;
  toast('Hết sức rồi ⚡ — ăn gì đó ở thị trấn hoặc về nhà đi ngủ nhé!'); sfx(150, .2, 'sawtooth');
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
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => sfx(f, .18, 'triangle'), i * 110));
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
  const box = $('#seeds'); box.innerHTML = '';
  S.unlocked.forEach((id, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = crop(id).e + ' ' + (i + 1);
    b.className = id === S.sel ? 'on' : '';
    b.setAttribute('aria-label', 'Hạt giống ' + (i + 1));
    b.onclick = () => { S.sel = id; hud(); save(); };
    box.appendChild(b);
  });
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
    return n ? `<li>${c.e} <b>${c.en}</b> — ${c.vi} <small>×${n}</small></li>` : '<li class="lock">❔ ???</li>';
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

// ====== CÔ EMMA: BÀI HỌC B1 / B2 ======
function emma() {
  const btn = lv => {
    const L = LESSON[lv], lock = lv === 'B2' && S.lvl < B2_LEVEL;
    return { label: lock ? `🔒 B2 — mở ở Lv ${B2_LEVEL}` : `${lv === 'B1' ? '📘' : '📙'} Bài ${lv} · ${N_Q} câu (⚡${L.st}/câu · +${L.exp} EXP)`,
      off: lock, fn: () => lesson(lv) };
  };
  modal('Teacher Emma 🎓',
    '<b>“Hello! Ready to practise your English?”</b><br>(Chào bạn! Sẵn sàng luyện tiếng Anh chưa?)<br>' +
    `<small>⭐ Lv ${S.lvl} · EXP ${S.exp}/${expNeed(S.lvl)} · ⚡ ${S.stamina}/${maxSt()}. Học từ vựng tốn stamina.</small>`,
    [btn('B1'), btn('B2'), { label:'Đóng', fn:closeModal }]);
}

function lesson(lv) {
  const L = LESSON[lv], pool = VOCAB[lv];
  // ưu tiên những từ bạn ít trả lời đúng nhất
  const picks = pool.map(w => [(S.words[w.en] || 0) + Math.random() * 2.5, w]).sort((a, b) => a[0] - b[0]).slice(0, N_Q).map(x => x[1]);
  const R = { first:0, exp:0, up:false };
  const tag = `<span class="tag ${lv === 'B2' ? 'b2' : ''}">${lv}</span> `;

  const tired = () => modal('Emma 🎓',
    '<b>“You look exhausted!”</b> (Bạn trông kiệt sức rồi!)<br>Hãy ăn gì đó ở thị trấn hoặc về nhà đi ngủ để lấy lại ⚡ rồi học tiếp nhé.',
    [{ label:'Đóng', fn:closeModal }]);

  const finish = () => {
    let bonus = 0;
    if (R.first === N_Q) bonus = L.perfect;
    const coins = R.first * L.coin; S.coins += coins;
    const lvBefore = S.lvl; if (bonus) gainExp(bonus); else { hud(); save(); }
    const total = R.exp + bonus;
    modal('Kết quả bài ' + lv + ' 🎓',
      '<b>“Well done!”</b> (Làm tốt lắm!)<ul class="sum">' +
      `<li>✅ Đúng ngay lần đầu: <b>${R.first}/${N_Q}</b></li>` +
      `<li>🎓 EXP: <b>+${total}</b>${bonus ? ' (có thưởng 5/5 +' + bonus + ')' : ''}</li>` +
      `<li>🪙 Coin: <b>+${coins}</b></li>` +
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
        if (o !== ans) { tried = true; sfx(150, .22, 'sawtooth'); el.disabled = true; $('#mText').innerHTML = tag + prompt + '<br><em>Chưa đúng, thử lại nhé!</em>'; return; }
        sfx(660); setTimeout(() => sfx(880, .16), 90);
        const g = tried ? L.retry : L.exp;
        use(L.st); if (!tried) R.first++;
        S.words[w.en] = (S.words[w.en] || 0) + 1;
        R.exp += g; if (gainExp(g)) R.up = true;
        modal(tried ? 'Gần đúng rồi!' : 'Chính xác! ✨',
          `${tag}<span class="ok">${w.en}</span> = ${w.vi} <small>(${w.pos})</small><div class="sent">${w.ex.replace('{}', '<b>' + w.en + '</b>')}</div>🎓 +${g} EXP`,
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
    this.player = this.physics.add.sprite(px, py, 'momo').setCollideWorldBounds(true);
    this.shadow = this.add.image(0, 0, 'shadow').setDepth(.5);
    this.night = this.add.rectangle(0, 0, 960, 540, 0x0a1445, 0).setOrigin(0).setScrollFactor(0).setDepth(2000);
    this.cameras.main.startFollow(this.player, true, .09, .09).setBounds(0, 0, W, H).setZoom(1.25);
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
    this.leaving = true; this.target = null; this.player.setVelocity(0);
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
    this.player.setVelocity(vx, vy);
    if (vx || vy) this.player.body.velocity.normalize().scale(190);

    clk = Math.min(clk + delta * .006, 1500);
    this.night.setAlpha(dark(clk / 60));
    const tick = Math.floor(clk / 10); if (tick !== this.tick) { this.tick = tick; dayText(); }
    if (clk >= 1380 && !late) { late = true; toast('Muộn rồi — về nhà đi ngủ thôi! 🌙'); }
    const moving = !!(vx || vy);
    this.player.setDepth(this.player.y).setAngle(moving ? Math.sin(time / 60) * 7 : 0);
    if (vx) this.player.setFlipX(vx < 0);
    this.shadow.setPosition(this.player.x, this.player.y + 14);
    return true;
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

// ====== CẢNH 1: NÔNG TRẠI ======
class Farm extends Base {
  constructor() { super('Farm'); }

  create() {
    const W = 1280, H = 960;
    const sp = this.from === 'Town' ? [1200, 600] : this.from === 'Home' ? [200, 244] : [420, 340];
    this.boot(W, H, sp[0], sp[1]);
    this.house = this.solids.create(200, 170, 'house');
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 45; i++) {
      const x = 40 + rnd() * (W - 80), y = 40 + rnd() * (H - 80);
      if ((x > 80 && x < 900 && y > 60 && y < 520) || (x > 880 && x < 1140 && y > 680 && y < 840)) continue; // chừa khu nông trại
      if (x > 380 && y > 540 && y < 670) continue; // chừa con đường sang thị trấn
      this.solids.create(x, y, 'tree');
    }
    this.solids.refresh();
    this.solids.children.each(t => t.setDepth(t.y));
    for (let i = 0; i < 16; i++) this.add.image(214 + i * 18, 224 + i * 6.4, 'path').setDepth(.1);
    // đường sang thị trấn (bên phải)
    this.add.tileSprite(492, 456, 32, 160, 'path').setOrigin(0).setDepth(.1);
    this.add.tileSprite(492, 584, W - 492, 32, 'path').setOrigin(0).setDepth(.1);
    for (let i = 0; i < 80; i++) { const x = rnd() * W, y = rnd() * H; if (x > 430 && x < 870 && y > 250 && y < 490) continue; this.add.image(x, y, 'flower').setTint([0xffffff, 0xffd54a, 0xff8fb3, 0xb28dff][i % 4]).setDepth(.2); }
    const pond = this.add.image(1010, 760, 'pond').setDepth(.3);
    this.tweens.add({ targets: pond, alpha: .82, yoyo: true, repeat: -1, duration: 1700, ease: 'Sine.InOut' });

    // biển chỉ đường + mũi tên nhấp nháy ở cổng thị trấn
    this.add.text(1195, 548, '🏘️ Thị trấn', { fontSize:'15px', color:'#fff', backgroundColor:'#4a3320', padding:{ x:6, y:2 } }).setOrigin(.5).setDepth(1500);
    const arrow = this.add.text(1262, 600, '➜', { fontSize:'26px', color:'#fff', stroke:'#2a1d10', strokeThickness:4 }).setOrigin(.5).setDepth(1500);
    this.tweens.add({ targets: arrow, x: 1250, yoyo: true, repeat: -1, duration: 500 });

    this.emma = this.npc('emma', 340, 250, 'Emma 🎓 English');
    this.physics.add.collider(this.player, this.solids);

    // 15 ô đất (5 x 3)
    this.pv = S.plots.map((p, i) => {
      const x = 520 + (i % 5) * 64, y = 300 + Math.floor(i / 5) * 64;
      return { x, y, bg:this.add.image(x, y, 'soil').setDepth(1), em:this.add.text(x, y - 2, '', { fontSize:'30px' }).setOrigin(.5).setDepth(2) };
    });
    this.pv.forEach((_, i) => this.paint(i));
    this.mark = this.add.rectangle(0, 0, 60, 60).setStrokeStyle(3, 0xffffff).setVisible(false).setDepth(3);

    hud();
    if (S.day === 1 && !Object.keys(S.learned).length && !Object.keys(S.words).length) modal('English Farm 🌱',
      '<b>“Welcome to the farm!”</b><br>Chào mừng bạn! Xới đất → gieo hạt → tưới nước → vào nhà đi ngủ → thu hoạch. Làm nông tốn ⚡ stamina.<br>🎓 Nói chuyện với <b>cô Emma</b> để học từ vựng B1/B2 lấy EXP và lên cấp. Đi sang phải để vào 🏘️ thị trấn: mua hạt giống, ăn đồ hồi stamina.',
      [{ label:'Bắt đầu chơi 🌾', fn:closeModal }]);
  }

  paint(i) {
    const p = S.plots[i], v = this.pv[i];
    v.bg.setAlpha(p.s ? 1 : .3).setTint(p.w ? 0x6b4a2b : 0xffffff);
    let t = '';
    if (p.s === 2) { const c = crop(p.c); t = p.g >= c.days ? c.e : (p.g >= c.days - 1 ? '🌿' : '🌱'); }
    if (v.em.text !== t) { v.em.setText(t); if (t) this.tweens.add({ targets: v.em, scale: { from: .2, to: 1 }, duration: 280, ease: 'Back.Out' }); }
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
    if (!c) return 'WASD / phím mũi tên: đi · E hoặc Space: hành động · 1-9: chọn hạt · đi sang phải: thị trấn';
    if (c.t === 'emma') return 'E: học tiếng Anh với cô Emma 🎓 (B1/B2)';
    if (c.t === 'house') return 'E: vào nhà 🏠 (ngủ, trang trí)';
    const p = S.plots[c.i];
    if (p.s === 0) return `E: xới đất (⚡${COST.till})`;
    if (p.s === 1) return `E: gieo hạt ${crop(S.sel).e} (⚡${COST.sow})`;
    if (this.ready(p)) return `E: thu hoạch ${crop(p.c).e} (⚡${COST.harvest})`;
    return p.w ? 'Đã tưới — hãy đi ngủ để cây lớn' : `E: tưới nước 💧 (⚡${COST.water})`;
  }

  doAct(c) {
    if (c.t === 'plot') this.plot(c.i); else if (c.t === 'emma') emma(); else this.go('Home');
  }

  plot(i) {
    const p = S.plots[i];
    const after = () => { this.paint(i); hud(); save(); };
    if (p.s === 0) {
      if (!can(COST.till)) return;
      use(COST.till); p.s = 1; toast('Đã xới đất'); this.fx(i, 0xb98a5a); sfx(220, .08); return after();
    }
    if (p.s === 1) {
      if (!can(COST.sow)) return;
      const c = crop(S.sel);
      return quiz('Gieo hạt', `Cây này tiếng Anh là gì?<div class="big">${c.e}</div>`, c.en, first => {
        use(COST.sow);
        p.s = 2; p.c = c.id; p.g = 0; p.w = false; this.fx(i, 0x9be564, '🌱');
        S.learned[c.id] = (S.learned[c.id] || 0) + 1;
        if (first) { S.coins += 3; toast(`${c.en} = ${c.vi}. Đúng ngay lần đầu +3 🪙 +2 EXP`); } else toast(`${c.en} = ${c.vi}`);
        after();
        if (first) gainExp(2);
      });
    }
    if (this.ready(p)) {
      if (!can(COST.harvest)) return;
      const c = crop(p.c);
      return quiz('Thu hoạch', `Từ nào có nghĩa là <b>“${c.vi}”</b>?`, c.en, first => {
        use(COST.harvest);
        const gain = c.price + (first ? 5 : 0);
        S.coins += gain; p.s = 1; p.c = null; p.g = 0; p.w = false;
        S.learned[c.id] = (S.learned[c.id] || 0) + 1;
        toast(`Thu hoạch ${c.en}! +${gain} 🪙${first ? ' +2 EXP' : ''}`); this.fx(i, 0xffd54a, '+' + gain + ' 🪙');
        after();
        if (first) gainExp(2);
      });
    }
    if (!p.w) {
      if (!can(COST.water)) return;
      use(COST.water); p.w = true; toast('Đã tưới nước 💧'); this.fx(i, 0x6ec6ff, '💧'); sfx(520, .12, 'sine'); return after();
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
    this.add.tileSprite(0, 300, W, 64, 'path').setOrigin(0).setDepth(.1);
    [[220, 268, 34], [560, 268, 34], [850, 268, 34]].forEach(p => this.add.tileSprite(p[0] - 16, p[1], 32, p[2], 'path').setOrigin(0).setDepth(.1));
    this.add.tileSprite(400 - 16, 364, 32, 68, 'path').setOrigin(0).setDepth(.1);
    this.add.tileSprite(730, 410, 100, 120, 'path').setOrigin(0).setDepth(.1); // sân đài phun nước

    const place = (key, x, y) => { const s = this.solids.create(x, y, key); s.setDepth(y); return s; };
    this.shopB = place('shop', 220, 215);
    this.homesB = place('homes', 560, 205);
    this.foodB = place('stall', 400, 480);
    this.decorB = place('decor', 850, 215);
    place('fountain', 780, 470);
    // hàng cây viền thị trấn
    for (let x = 30; x < W; x += 66) { place('tree', x, 40); place('tree', x + 20, 610); }
    for (let y = 120; y < 280; y += 70) place('tree', W - 24, y);
    for (let y = 400; y < 590; y += 70) place('tree', W - 24, y);
    this.solids.refresh();
    this.physics.add.collider(this.player, this.solids);

    let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 70; i++) { const x = 30 + rnd() * (W - 60), y = 60 + rnd() * (H - 120); if (y > 290 && y < 372) continue; this.add.image(x, y, 'flower').setTint([0xffffff, 0xffd54a, 0xff8fb3, 0xb28dff][i % 4]).setDepth(.2); }

    // biển tên + nhân vật
    const sign = (x, y, t) => this.add.text(x, y, t, { fontSize:'15px', color:'#fff', backgroundColor:'#4a3320', padding:{ x:6, y:2 } }).setOrigin(.5).setDepth(1500);
    sign(220, 148, '🌱 Seed Shop'); sign(560, 138, '🏠 Town Homes'); sign(400, 420, '🍞 Food Stall'); sign(850, 148, '🛋️ Decor Shop'); sign(60, 292, '← Nông trại');
    this.lily = this.npc('lily', 284, 276, 'Lily');
    this.chef = this.npc('chef', 484, 500, 'Chef Bo');
    this.mia = this.npc('mia', 914, 276, 'Mia');
    this.npc('ben', 470, 286); this.npc('rose', 660, 288);
    const arrow = this.add.text(18, 332, '➜', { fontSize:'26px', color:'#fff', stroke:'#2a1d10', strokeThickness:4 }).setOrigin(.5).setFlipX(true).setDepth(1500);
    this.tweens.add({ targets: arrow, x: 30, yoyo: true, repeat: -1, duration: 500 });

    this.zones = {
      shop:  Phaser.Geom.Rectangle.Inflate(this.shopB.getBounds(), 44, 44),
      homes: Phaser.Geom.Rectangle.Inflate(this.homesB.getBounds(), 44, 44),
      decor: Phaser.Geom.Rectangle.Inflate(this.decorB.getBounds(), 44, 44),
      food:  Phaser.Geom.Rectangle.Inflate(this.foodB.getBounds(), 44, 44)
    };
    hud();
    this.time.delayedCall(450, () => toast('Welcome to Sunny Town! 🏘️'));
  }

  edge() { if (this.player.x < 22) this.go('Farm'); }

  look() {
    const px = this.player.x, py = this.player.y;
    if (this.zones.shop.contains(px, py) || Phaser.Math.Distance.Between(px, py, this.lily.x, this.lily.y) < 70) return { t:'shop' };
    if (this.zones.homes.contains(px, py)) return { t:'homes' };
    if (this.zones.decor.contains(px, py) || Phaser.Math.Distance.Between(px, py, this.mia.x, this.mia.y) < 70) return { t:'decor' };
    if (this.zones.food.contains(px, py) || Phaser.Math.Distance.Between(px, py, this.chef.x, this.chef.y) < 70) return { t:'food' };
    return null;
  }

  label(c) {
    if (!c) return 'WASD / phím mũi tên: đi · E hoặc Space: hành động · đi sang trái: về nông trại';
    if (c.t === 'shop') return 'E: vào Seed Shop — mua hạt giống 🌱';
    if (c.t === 'homes') return 'E: gõ cửa nhà dân 🏠 (mỗi ngày nghe 1 câu mới, +EXP)';
    if (c.t === 'decor') return 'E: vào Decor Shop — mua đồ trang trí nhà 🛋️';
    return 'E: mua đồ ăn 🍞 để hồi ⚡ stamina';
  }

  doAct(c) { if (c.t === 'shop') this.shop(); else if (c.t === 'homes') this.homes(); else if (c.t === 'decor') this.decorShop(); else this.food(); }

  shop() {
    const locked = CROPS.filter(c => !S.unlocked.includes(c.id));
    const btns = locked.map(c => ({
      label: `${c.e} ${c.en} — ${c.cost} 🪙`, off: S.coins < c.cost,
      fn: () => { S.coins -= c.cost; S.unlocked.push(c.id); S.sel = c.id; closeModal(); hud(); save(); toast(`Mở khóa: ${c.en} = ${c.vi}`); }
    }));
    btns.push({ label:'Đóng', fn:closeModal });
    modal('Lily · Seed Shop', '<b>“Hello! Welcome to my shop.”</b><br>(Xin chào! Chào mừng đến cửa hàng của mình.)<br>' +
      (locked.length ? 'Chọn hạt giống mới:' : 'Bạn đã mở khóa mọi loại hạt!'), btns);
  }

  food() {
    const btns = FOOD.map(f => ({
      label: `${f.e} ${f.en} (${f.vi}) — ${f.cost} 🪙 · +${f.st} ⚡`,
      off: S.coins < f.cost || S.stamina >= maxSt(),
      fn: () => { S.coins -= f.cost; S.stamina = Math.min(maxSt(), S.stamina + f.st); sfx(500, .08, 'sine'); hud(); save(); toast(`Yummy! ${f.e} +${f.st} ⚡`); this.food(); }
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
      fn: () => { S.coins -= d.cost; S.own[d.id] = (S.own[d.id] || 0) + 1; sfx(700, .1); hud(); save(); toast(`Đã mua ${d.en} ${d.e}`); this.decorShop(tab); }
    }));
    btns.push({ label:'⬅ Quay lại', fn:() => this.decorShop() });
    modal(tab === 'wall' ? 'Đồ treo tường' : 'Đồ đặt sàn', `<b>“What would you like?”</b> <small>🪙 ${S.coins}</small>`, btns);
  }

  homes() {
    if (S.phraseDay === S.day) {
      return modal('Nhà dân 🏠', '<b>“See you tomorrow!”</b> (Hẹn mai gặp lại!)<br>Hôm nay bạn đã nghe câu mới rồi. Ngủ một giấc ở nhà để sang ngày mới nhé.', [{ label:'Đóng', fn:closeModal }]);
    }
    const i = (S.day - 1) % PHRASES.length, p = PHRASES[i], who = VILLAGERS[(S.day - 1) % VILLAGERS.length];
    S.phraseDay = S.day; save();
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
      S.placed[i] = d.id; save(); this.refreshSlots(); closeModal(); sfx(600, .1); toast(`${d.en} = ${d.vi}`);
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
        closeModal(); this.leaving = true;
        const cam = this.cameras.main; cam.fadeOut(500);
        cam.once('camerafadeoutcomplete', () => {
          newDay(); hud(); save();
          cam.fadeIn(500); this.leaving = false;
          toast('Good morning! Ngày ' + S.day + ' · ⚡ đã đầy');
          if (cozy) gainExp(cozy);
        });
      } },
      { label:'Hủy', fn:closeModal }
    ]);
  }
}

const game = new Phaser.Game({
  type: Phaser.AUTO, width: 960, height: 540, parent: 'game-container', pixelArt: true,
  backgroundColor: '#7cc062',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } },
  scene: [Farm, Town, Home]
});

$('#bookBtn').onclick = () => { if (!open) wordBook(); };
$('#actBtn').onclick = () => { const s = activeScene(); if (s && s.act) s.act(); };
window.addEventListener('keydown', e => {
  if (e.key === 'Escape' && open) closeModal();
  const n = parseInt(e.key, 10);
  if (!open && n >= 1 && n <= S.unlocked.length) { S.sel = S.unlocked[n - 1]; hud(); save(); }
});
hud();
})();
