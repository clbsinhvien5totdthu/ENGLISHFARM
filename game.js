(() => {
// ====== DỮ LIỆU TỪ VỰNG: thêm cây mới chỉ cần thêm 1 dòng ======
// cost: giá mở khóa hạt · days: số ngày (đã tưới) để lớn · price: tiền khi thu hoạch
const CROPS = [
  { id:'carrot',     en:'CARROT',     vi:'cà rốt',   e:'🥕', cost:0,   days:2, price:12 },
  { id:'tomato',     en:'TOMATO',     vi:'cà chua',  e:'🍅', cost:0,   days:3, price:18 },
  { id:'corn',       en:'CORN',       vi:'bắp ngô',  e:'🌽', cost:40,  days:3, price:25 },
  { id:'strawberry', en:'STRAWBERRY', vi:'dâu tây',  e:'🍓', cost:60,  days:3, price:32 },
  { id:'pumpkin',    en:'PUMPKIN',    vi:'bí ngô',   e:'🎃', cost:90,  days:4, price:48 },
  { id:'eggplant',   en:'EGGPLANT',   vi:'cà tím',   e:'🍆', cost:120, days:4, price:60 }
];

// ====== LƯU TRỮ ======
const KEY = 'englishFarmSave2';
const fresh = () => ({ coins:20, day:1, sel:'carrot', unlocked:['carrot','tomato'], learned:{},
  plots: Array.from({ length:15 }, () => ({ s:0, c:null, g:0, w:false })) });
let S;
try { S = JSON.parse(localStorage.getItem(KEY)) || fresh(); } catch (e) { S = fresh(); }
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

// Câu hỏi 3 đáp án; wrong → thử lại không bị phạt, nhưng mất tiền thưởng "đúng ngay lần đầu"
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

function dayText() { $('#day').textContent = (clk >= 1080 ? '🌙 Ngày ' : '🌤 Ngày ') + S.day + ' · ' + hhmm(clk); }
function hud() {
  dayText();
  $('#coins').textContent = '🪙 ' + S.coins;
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

function wordBook() {
  const rows = CROPS.map(c => {
    const n = S.learned[c.id] || 0;
    return n ? `<li>${c.e} <b>${c.en}</b> — ${c.vi} <small>×${n}</small></li>` : '<li class="lock">❔ ???</li>';
  }).join('');
  modal('📖 Sổ từ vựng', '<ul class="book">' + rows + '</ul><p>Trả lời đúng nhiều lần để nhớ lâu hơn!</p>',
    [{ label:'Đóng', fn:closeModal }]);
}

// ====== CẢNH GAME ======
class Farm extends Phaser.Scene {
  constructor() { super('Farm'); }
  tex(k, w, h, f) { const g = this.add.graphics(); f(g); g.generateTexture(k, w, h); g.destroy(); }

  create() {
    this.tex('grass', 32, 32, g => { g.fillStyle(0x7cc062); g.fillRect(0,0,32,32); g.fillStyle(0x72b858); [[4,6],[20,3],[12,18],[26,24],[6,27]].forEach(p => g.fillRect(p[0],p[1],3,3)); g.fillStyle(0x92d374); [[14,8],[28,12],[2,20],[18,28]].forEach(p => g.fillRect(p[0],p[1],2,2)); });
    this.tex('momo', 32, 32, g => { g.fillStyle(0x7a3d0a); g.fillRect(3,7,26,24); g.fillTriangle(3,8,3,-1,13,8); g.fillTriangle(29,8,29,-1,19,8);
      g.fillStyle(0xff9a1f); g.fillRect(4,8,24,22); g.fillTriangle(4,8,4,1,12,8); g.fillTriangle(28,8,28,1,20,8);
      g.fillStyle(0xffb3a7); g.fillTriangle(6,8,6,4,10,8); g.fillTriangle(26,8,26,4,22,8);
      g.fillStyle(0xe27d10); g.fillRect(14,9,4,5); g.fillRect(4,18,4,3); g.fillRect(24,18,4,3);
      g.fillStyle(0xffffff); g.fillRect(10,21,12,9); g.fillStyle(0x222222); g.fillRect(9,13,4,5); g.fillRect(19,13,4,5);
      g.fillStyle(0xffffff); g.fillRect(10,13,1,1); g.fillRect(20,13,1,1); g.fillStyle(0xff6f91); g.fillRect(15,18,2,2); });
    this.tex('lily', 32, 32, g => { g.fillStyle(0x5a3a1a); g.fillRect(6,0,20,8); g.fillRect(5,4,3,14); g.fillRect(24,4,3,14);
      g.fillStyle(0xffd9b8); g.fillRect(8,3,16,11); g.fillStyle(0x5a3a1a); g.fillRect(8,3,16,3);
      g.fillStyle(0xff69b4); g.fillRect(6,14,20,18); g.fillStyle(0xffffff); g.fillRect(11,18,10,14);
      g.fillStyle(0x222222); g.fillRect(12,8,2,3); g.fillRect(19,8,2,3); g.fillStyle(0xff9aa8); g.fillRect(9,11,3,2); g.fillRect(21,11,3,2); });
    this.tex('house', 96, 96, g => { g.fillStyle(0x000000, .18); g.fillEllipse(48,92,92,10);
      g.fillStyle(0x9c5a2e); g.fillRect(6,36,84,56); g.fillStyle(0x84491f); [44,52,60,68,76,84].forEach(y => g.fillRect(6,y,84,1));
      g.fillStyle(0x6e3b17); g.fillRect(66,6,12,24); g.fillStyle(0x8a1f17); g.fillTriangle(-2,42,48,0,98,42); g.fillStyle(0xb5382a); g.fillTriangle(4,40,48,6,92,40);
      g.fillStyle(0x6b3a22); g.fillRect(36,56,24,36); g.fillStyle(0xf2d28b); g.fillRect(38,58,20,34); g.fillStyle(0x6b3a22); g.fillRect(53,76,3,3);
      g.fillStyle(0x6e3b17); g.fillRect(10,46,20,20); g.fillStyle(0x8fd3ff); g.fillRect(12,48,16,16); g.fillStyle(0x6e3b17); g.fillRect(19,48,2,16); g.fillRect(12,55,16,2);
      g.fillStyle(0x6e3b17); g.fillRect(66,46,20,20); g.fillStyle(0x8fd3ff); g.fillRect(68,48,16,16); g.fillStyle(0x6e3b17); g.fillRect(75,48,2,16); g.fillRect(68,55,16,2); });
    this.tex('tree', 48, 64, g => { g.fillStyle(0x000000, .2); g.fillEllipse(24,60,36,10);
      g.fillStyle(0x6b4423); g.fillRect(19,38,10,24); g.fillStyle(0x56361a); g.fillRect(25,38,4,24);
      g.fillStyle(0x24692a); g.fillCircle(24,25,23); g.fillStyle(0x2e7d32); g.fillCircle(22,22,20); g.fillStyle(0x3a9440); g.fillCircle(16,18,11); g.fillStyle(0x56b255); g.fillCircle(14,14,5); });
    this.tex('soil', 56, 56, g => { g.fillStyle(0x8a5e34); g.fillRect(0,0,56,56); g.fillStyle(0x744a27); [10,24,38,50].forEach(y => g.fillRect(4,y,48,3)); g.lineStyle(2,0x4a3320); g.strokeRect(1,1,54,54); });
    this.tex('spark', 6, 6, g => { g.fillStyle(0xffffff); g.fillRect(0,0,6,6); });
    this.tex('shadow', 28, 10, g => { g.fillStyle(0x000000, .28); g.fillEllipse(14,5,26,8); });
    this.tex('flower', 8, 8, g => { g.fillStyle(0xffffff); g.fillRect(3,0,2,2); g.fillRect(0,3,2,2); g.fillRect(6,3,2,2); g.fillRect(3,6,2,2); g.fillStyle(0xffe066); g.fillRect(3,3,2,2); });
    this.tex('path', 32, 32, g => { g.fillStyle(0xd8b87a); g.fillRect(0,0,32,32); g.fillStyle(0xc4a263); [[4,5],[19,9],[9,22],[25,26]].forEach(p => g.fillRect(p[0],p[1],3,2)); });
    this.tex('pond', 160, 100, g => { g.fillStyle(0x2f6f9f); g.fillEllipse(80,50,158,98); g.fillStyle(0x4aa3d8); g.fillEllipse(80,50,144,84); g.fillStyle(0x8fd3ff); g.fillRect(40,34,22,3); g.fillRect(96,56,30,3); g.fillRect(62,70,16,3); });

    const W = 1280, H = 960;
    this.physics.world.setBounds(0, 0, W, H);
    this.add.tileSprite(0, 0, W, H, 'grass').setOrigin(0);
    this.solids = this.physics.add.staticGroup();
    this.house = this.solids.create(200, 170, 'house');
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 45; i++) {
      const x = 40 + rnd() * (W - 80), y = 40 + rnd() * (H - 80);
      if ((x > 80 && x < 900 && y > 60 && y < 520) || (x > 880 && x < 1140 && y > 680 && y < 840)) continue; // chừa khu nông trại
      this.solids.create(x, y, 'tree');
    }
    this.solids.refresh();
    this.solids.children.each(t => t.setDepth(t.y));
    for (let i = 0; i < 16; i++) this.add.image(214 + i * 18, 224 + i * 6.4, 'path').setDepth(.1);
    for (let i = 0; i < 80; i++) { const x = rnd() * W, y = rnd() * H; if (x > 430 && x < 870 && y > 250 && y < 490) continue; this.add.image(x, y, 'flower').setTint([0xffffff, 0xffd54a, 0xff8fb3, 0xb28dff][i % 4]).setDepth(.2); }
    const pond = this.add.image(1010, 760, 'pond').setDepth(.3);
    this.tweens.add({ targets: pond, alpha: .82, yoyo: true, repeat: -1, duration: 1700, ease: 'Sine.InOut' });

    this.lily = this.physics.add.sprite(340, 250, 'lily').setImmovable(true);
    this.add.text(340, 218, 'Lily', {depth: 30, fontSize:'14px', color:'#fff', backgroundColor:'#00000088', padding:{ x:4, y:1 } }).setOrigin(.5);
    this.add.image(340, 266, 'shadow').setDepth(.5);
    this.player = this.physics.add.sprite(420, 340, 'momo').setCollideWorldBounds(true);
    this.shadow = this.add.image(0, 0, 'shadow').setDepth(.5);
    this.physics.add.collider(this.player, this.solids);
    this.physics.add.collider(this.player, this.lily);

    // 15 ô đất (5 x 3)
    this.pv = S.plots.map((p, i) => {
      const x = 520 + (i % 5) * 64, y = 300 + Math.floor(i / 5) * 64;
      return { x, y, bg:this.add.image(x, y, 'soil').setDepth(1), em:this.add.text(x, y - 2, '', { fontSize:'30px' }).setOrigin(.5).setDepth(2) };
    });
    this.pv.forEach((_, i) => this.paint(i));
    this.mark = this.add.rectangle(0, 0, 60, 60).setStrokeStyle(3, 0xffffff).setVisible(false).setDepth(3);
    this.night = this.add.rectangle(0, 0, 960, 540, 0x0a1445, 0).setOrigin(0).setScrollFactor(0).setDepth(2000);

    this.cameras.main.startFollow(this.player, true, .09, .09).setBounds(0, 0, W, H).setZoom(1.25);
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = this.input.keyboard.addKeys({ up:K.W, down:K.S, left:K.A, right:K.D, u2:K.UP, d2:K.DOWN, l2:K.LEFT, r2:K.RIGHT, e:K.E, sp:K.SPACE });
    this.input.on('pointerdown', p => { if (!open) this.target = { x:p.worldX, y:p.worldY }; });
    this.hintText = '';
    hud();
    if (S.day === 1 && !Object.keys(S.learned).length) modal('English Farm 🌱',
      '<b>“Welcome to the farm!”</b><br>Chào mừng bạn! Xới đất → gieo hạt → tưới nước → đi ngủ → thu hoạch. Mỗi bước trả lời đúng một từ tiếng Anh để nhận coin.',
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

  // Tìm thứ gần người chơi nhất để tương tác
  look() {
    const px = this.player.x, py = this.player.y;
    let best = null, d = 62;
    this.pv.forEach((v, i) => { const dd = Phaser.Math.Distance.Between(px, py, v.x, v.y); if (dd < d) { d = dd; best = { t:'plot', i }; } });
    if (best) return best;
    if (Phaser.Math.Distance.Between(px, py, this.lily.x, this.lily.y) < 85) return { t:'lily' };
    if (Phaser.Math.Distance.Between(px, py, this.house.x, this.house.y) < 120) return { t:'house' };
    return null;
  }

  label(c) {
    if (!c) return 'WASD / phím mũi tên: đi · E hoặc Space: hành động · 1-6: chọn hạt';
    if (c.t === 'lily') return 'E: nói chuyện với Lily (cửa hàng hạt giống)';
    if (c.t === 'house') return 'E: đi ngủ để sang ngày mới';
    const p = S.plots[c.i];
    if (p.s === 0) return 'E: xới đất';
    if (p.s === 1) return 'E: gieo hạt ' + crop(S.sel).e;
    if (this.ready(p)) return 'E: thu hoạch ' + crop(p.c).e;
    return p.w ? 'Đã tưới — hãy đi ngủ để cây lớn' : 'E: tưới nước 💧';
  }

  act() {
    if (open || !this.cur) return;
    const c = this.cur;
    if (c.t === 'plot') this.plot(c.i); else if (c.t === 'lily') this.shop(); else this.sleep();
  }

  plot(i) {
    const p = S.plots[i];
    const after = () => { this.paint(i); hud(); save(); };
    if (p.s === 0) { p.s = 1; toast('Đã xới đất'); this.fx(i, 0xb98a5a); sfx(220, .08); return after(); }
    if (p.s === 1) {
      const c = crop(S.sel);
      return quiz('Gieo hạt', `Cây này tiếng Anh là gì?<div class="big">${c.e}</div>`, c.en, first => {
        p.s = 2; p.c = c.id; p.g = 0; p.w = false; this.fx(i, 0x9be564, '🌱');
        S.learned[c.id] = (S.learned[c.id] || 0) + 1;
        if (first) { S.coins += 3; toast(`${c.en} = ${c.vi}. Đúng ngay lần đầu +3 🪙`); } else toast(`${c.en} = ${c.vi}`);
        after();
      });
    }
    if (this.ready(p)) {
      const c = crop(p.c);
      return quiz('Thu hoạch', `Từ nào có nghĩa là <b>“${c.vi}”</b>?`, c.en, first => {
        const gain = c.price + (first ? 5 : 0);
        S.coins += gain; p.s = 1; p.c = null; p.g = 0; p.w = false;
        S.learned[c.id] = (S.learned[c.id] || 0) + 1;
        toast(`Thu hoạch ${c.en}! +${gain} 🪙`); this.fx(i, 0xffd54a, '+' + gain + ' 🪙');
        after();
      });
    }
    if (!p.w) { p.w = true; toast('Đã tưới nước 💧'); this.fx(i, 0x6ec6ff, '💧'); sfx(520, .12, 'sine'); return after(); }
    toast('Cây cần thời gian — hãy đi ngủ để sang ngày mới.');
  }

  shop() {
    const locked = CROPS.filter(c => !S.unlocked.includes(c.id));
    const btns = locked.map(c => ({
      label: `${c.e} ${c.en} — ${c.cost} 🪙`, off: S.coins < c.cost,
      fn: () => { S.coins -= c.cost; S.unlocked.push(c.id); S.sel = c.id; closeModal(); hud(); save(); toast(`Mở khóa: ${c.en} = ${c.vi}`); }
    }));
    btns.push({ label:'Đóng', fn:closeModal });
    modal('Lily', '<b>“Hello! Welcome to my shop.”</b><br>(Xin chào! Chào mừng đến cửa hàng của mình.)<br>' +
      (locked.length ? 'Chọn hạt giống mới:' : 'Bạn đã mở khóa mọi loại hạt!'), btns);
  }

  sleep() {
    modal('Đi ngủ', '<b>“Good night!”</b> (Chúc ngủ ngon!)<br>Cây đã tưới sẽ lớn thêm một ngày.', [
      { label:'Ngủ 🌙', fn:() => {
        closeModal();
        const cam = this.cameras.main; cam.fadeOut(500);
        cam.once('camerafadeoutcomplete', () => {
          S.plots.forEach(p => { if (p.s === 2 && p.w) p.g++; p.w = false; });
          S.day++; clk = 360; this.late = false; this.pv.forEach((_, i) => this.paint(i)); hud(); save();
          cam.fadeIn(500); toast('Good morning! Ngày ' + S.day);
        });
      } },
      { label:'Hủy', fn:closeModal }
    ]);
  }

  update(time, delta) {
    const k = this.keys, J = Phaser.Input.Keyboard.JustDown;
    if (open) { this.player.setVelocity(0); return; }
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
    if (clk >= 1380 && !this.late) { this.late = true; toast('Muộn rồi — về nhà đi ngủ thôi! 🌙'); }
    const moving = !!(vx || vy);
    this.player.setDepth(this.player.y).setAngle(moving ? Math.sin(time / 60) * 7 : 0);
    if (vx) this.player.setFlipX(vx < 0);
    this.shadow.setPosition(this.player.x, this.player.y + 14);
    this.cur = this.look();
    const t = this.label(this.cur);
    if (t !== this.hintText) { this.hintText = t; $('#hint').textContent = t; }
    if (this.cur && this.cur.t === 'plot') { const v = this.pv[this.cur.i]; this.mark.setPosition(v.x, v.y).setVisible(true); }
    else this.mark.setVisible(false);
    if (J(k.e) || J(k.sp)) this.act();
  }
}

const game = new Phaser.Game({
  type: Phaser.AUTO, width: 960, height: 540, parent: 'game-container', pixelArt: true,
  backgroundColor: '#7cc062',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } },
  scene: [Farm]
});

$('#bookBtn').onclick = () => { if (!open) wordBook(); };
$('#actBtn').onclick = () => game.scene.getScene('Farm').act();
window.addEventListener('keydown', e => {
  if (e.key === 'Escape' && open) closeModal();
  const n = parseInt(e.key, 10);
  if (!open && n >= 1 && n <= S.unlocked.length) { S.sel = S.unlocked[n - 1]; hud(); save(); }
});
})();
