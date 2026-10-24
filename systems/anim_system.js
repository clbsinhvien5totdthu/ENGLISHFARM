/* English Farm — hệ thống hoạt ảnh bằng code (không cần thêm ảnh):
   · Nhân vật chính: nhún khi đi, nghiêng người, thở khi đứng, bụi bước chân, động tác xới / tưới / gieo / câu, "nghỉ ngơi" ngẫu nhiên
   · NPC: thở + đung đưa, vẫy tay + nhún khi bạn lại gần, nghiêng người về phía bạn, hoạt ảnh theo nghề (nấu ăn, hát, thi triển phép…)
   · Tòa nhà: khói ống khói, cửa sổ sáng dần khi trời tối, lửa lò nung, đèn lồng, bánh xe cối xay, chuông trường, nhang đình…
   game.js nạp file này TRƯỚC và gọi các hàm bên dưới; EF_ANIM.darkness / hour / raining do game.js cung cấp. */
(function () {
  const A = window.EF_ANIM = { darkness: () => 0, hour: () => 12, raining: () => false };
  const rnd = (a, b) => a + Math.random() * (b - a), clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ADD = () => Phaser.BlendModes.ADD;

  // ---------- texture phụ (vẽ bằng canvas, tạo 1 lần) ----------
  A.tex = function (sc) {
    const T = sc.textures, mk = (key, size, stops) => {
      if (T.exists(key)) return;
      const t = T.createCanvas(key, size, size), c = t.getContext(), g = c.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      stops.forEach(([o, a]) => g.addColorStop(o, `rgba(255,255,255,${a})`)); c.fillStyle = g; c.fillRect(0, 0, size, size); t.refresh();
    };
    mk('efglow', 64, [[0, 1], [.35, .45], [1, 0]]);
    mk('efpuff', 24, [[0, .9], [.5, .45], [1, 0]]);
  };

  // =====================================================================
  //  NHÂN VẬT CHÍNH — sprite "ảo" bám theo sprite vật lý (va chạm không bị ảnh hưởng)
  // =====================================================================
  A.heroAttach = function (sc) {
    A.tex(sc); sc.efB = []; sc.efNpcs = [];
    const p = sc.player, v = sc.add.sprite(p.x, p.y, p.texture.key, p.frame.name).setOrigin(p.originX, p.originY).setDepth(p.depth);
    p.setVisible(false);
    sc.hv = v;
    sc.hs = { t: 0, w: 0, actT: 0, actDur: 380, icon: '', style: 'swing', tool: null, idle: 0, nextIdle: rnd(5000, 9000), ia: null, shBase: 0, stamp: 0, droplet: 0 };
  };

  const FACE_DIR = sc => (sc.face === 'side' ? (sc.player.flipX ? 1 : -1) : sc.face === 'down' ? 1 : -1);
  const STYLE = { '⛏️': 'swing', '🎣': 'cast', '💧': 'pour' };

  // gọi mỗi khung hình từ Base.move() (đang đi bộ) hoặc từ A.update (khi bị khóa vì hộp thoại)
  A.heroUpdate = function (sc, delta, moving, vx, vy) {
    const v = sc.hv, s = sc.hs, p = sc.player; if (!v || !s) return;
    s.stamp = sc.time.now; s.t += delta;
    if (v.texture.key !== p.texture.key || v.frame.name !== p.frame.name) v.setTexture(p.texture.key, p.frame.name);
    let flip = p.flipX, dy = 0, sx = 1, sy = 1, ang = 0, lift = 0;

    // --- đi bộ: nhún theo nhịp bước (đồng bộ khung hình của hoạt ảnh), nghiêng người, ngả theo hướng đi
    s.w += ((moving ? 1 : 0) - s.w) * Math.min(1, delta / 90);
    if (s.w > .02) {
      let u = (s.t / 400) * 2;
      try { if (p.anims && p.anims.isPlaying) u = p.anims.getProgress() * 2; } catch (e) {}
      const b = Math.pow(Math.sin(Math.PI * (u - .25)), 2), c = Math.cos(Math.PI * (u - .25));
      dy -= b * 2.6 * s.w; sy += (b - .5) * .055 * s.w; sx -= (b - .5) * .04 * s.w;
      ang += c * (sc.face === 'side' ? 1.2 : 2.2) * s.w + clamp(vx || 0, -1, 1) * 3 * s.w;
    }
    // --- đứng yên: thở nhẹ; thỉnh thoảng nhìn quanh / vươn vai / nhảy nhẹ
    const br = Math.sin(s.t / 520) * (1 - s.w);
    sy += br * .018; sx -= br * .01;
    if (moving || s.actT > 0) { s.idle = 0; s.ia = null; }
    else {
      s.idle += delta;
      if (!s.ia && s.idle > s.nextIdle) { const k = ['look', 'stretch', 'hop'][Math.floor(Math.random() * 3)]; s.ia = { k, t: 0, dur: k === 'look' ? 1500 : k === 'stretch' ? 800 : 440 }; }
      if (s.ia) {
        const ia = s.ia; ia.t += delta; const e = clamp(ia.t / ia.dur, 0, 1), k = Math.sin(Math.PI * e);
        if (ia.k === 'look') { if (ia.t > 350 && ia.t < 1050) flip = !p.flipX; }
        else if (ia.k === 'stretch') { sy += .06 * k; sx -= .03 * k; dy -= 1.2 * k; }
        else { dy -= 5 * k; sy += .03 * k; sx -= .02 * k; }
        if (e >= 1) { s.ia = null; s.idle = 0; s.nextIdle = rnd(5000, 10000); }
      }
    }
    // --- động tác làm việc (xới đất, tưới, gieo hạt, câu cá, hái…)
    let toolOn = false;
    if (s.actT > 0) {
      s.actT -= delta; const e = clamp(1 - s.actT / s.actDur, 0, 1), k = Math.sin(Math.PI * e), dir = FACE_DIR(sc);
      sy -= .10 * k; sx += .04 * k; dy += 1.5 * k; ang += dir * (s.style === 'pour' ? 4 : 9) * k;
      toolOn = true; A._tool(sc, s, e, dir);
      if (s.actT <= 0 && s.tool) s.tool.setVisible(false);
    } else if (s.tool && s.tool.visible) s.tool.setVisible(false);

    const bs = p.scaleX, by = p.scaleY, feet = (1 - p.originY) * p.height * by;
    v.setScale(bs * sx, by * sy).setAngle(ang).setFlipX(flip).setDepth(p.depth)
      .setPosition(p.x, p.y + dy * by - feet * (sy - 1));
    lift = -dy;
    if (sc.shadow) { if (!s.shBase) s.shBase = sc.shadow.scaleX || 1; sc.shadow.setScale(s.shBase * (1 - lift * .035)); }
  };

  // công cụ cầm tay (emoji) xoay theo từng kiểu động tác
  A._tool = function (sc, s, e, dir) {
    const p = sc.player, k = p.scaleY;
    if (!s.tool) s.tool = sc.add.text(0, 0, '', { fontSize: '18px' }).setOrigin(.5, .85);
    const t = s.tool; if (t.text !== s.icon) t.setText(s.icon);
    const fx = sc.face === 'side' ? dir * 15 : dir * 9, fy = sc.face === 'up' ? -26 : -13;
    t.setVisible(true).setScale(k).setDepth(p.depth + (sc.face === 'up' ? -.1 : .1));
    let x = p.x + fx * k, y = p.y + fy * k, a = 0, al = 1, sc2 = k;
    if (s.style === 'swing') { const ee = 1 - Math.pow(1 - e, 3); a = dir * (-80 + 135 * ee); if (e > .75) al = 1 - (e - .75) * 4; }
    else if (s.style === 'cast') { const ee = 1 - Math.pow(1 - e, 2); a = dir * (35 - 130 * ee); y -= 4 * k; if (e > .8) al = 1 - (e - .8) * 5; }
    else if (s.style === 'pour') {
      a = dir * 55 * Math.sin(Math.PI * Math.min(1, e * 1.2)); al = e > .85 ? 1 - (e - .85) * 6 : 1;
      if (e > .25 && e < .8 && sc.time.now - s.droplet > 70) { s.droplet = sc.time.now; A._drop(sc, x + dir * 6 * k, y + 4 * k, 0x6ec6ff); }
    }
    else { y -= 16 * k * e; al = 1 - e * e; sc2 = k * (1 + .25 * Math.sin(Math.PI * Math.min(1, e * 2))); }
    t.setPosition(x, y).setAngle(a).setAlpha(clamp(al, 0, 1)).setScale(sc2);
  };
  A._drop = function (sc, x, y, col) {
    const r = sc.add.rectangle(x, y, 2, 3, col, .9).setDepth(sc.player.depth + .2);
    sc.tweens.add({ targets: r, y: y + rnd(10, 16), x: x + rnd(-2, 2), alpha: 0, duration: 380, ease: 'Quad.In', onComplete: () => r.destroy() });
  };
  // gọi từ game: icon = '⛏️' | '💧' | '🌱' | '✋' | '🎣' | '🧺'
  A.act = function (sc, icon) {
    const s = sc && sc.hs; if (!s) return;
    s.icon = icon; s.style = STYLE[icon] || 'lift'; s.actDur = s.style === 'cast' ? 520 : 380; s.actT = s.actDur;
  };

  // bụi / cỏ bay / nước bắn dưới chân mỗi bước
  const DUST = { stepGrass: [0x8cc14f, 0x6ea13a], step: [0xc9a577, 0xb08a5a], stepStone: [0xc8c8c8, 0x9c9c9c] };
  A.dust = function (sc, x, y, kind, dir) {
    const rain = A.raining(), cols = rain && kind !== 'wood' ? [0x9fd4ff, 0xcfe9ff] : DUST[kind]; if (!cols) return;
    for (let i = 0; i < 3; i++) {
      const r = sc.add.rectangle(x + rnd(-4, 4), y + rnd(-1, 1), 3, 3, cols[i % 2], .85).setDepth(sc.player.depth - .1);
      sc.tweens.add({ targets: r, x: r.x - (dir || 0) * rnd(4, 12) + rnd(-6, 6), y: r.y - rnd(4, 11), alpha: 0, scale: rnd(.3, .9), duration: rnd(260, 420), ease: 'Quad.Out', onComplete: () => r.destroy() });
    }
  };

  // =====================================================================
  //  NPC — sprite "ảo" thở / đung đưa / chào khi bạn tới gần / hoạt ảnh theo nghề
  // =====================================================================
  const JOB = { chef: 'cook', moss: 'magic', hai: 'sway', emma: 'teach', pete: 'work', daisy: 'sing', mia: 'sing', ben: 'curious', rose: 'happy', lily: 'happy' };
  A.npc = function (sc, s, key, fy) {
    if (!sc.efNpcs) sc.efNpcs = [];
    const hh = s.height, base = s.scaleX, oy = (hh / 2 + (fy - s.y) / base) / hh;
    const v = sc.add.image(s.x, fy, key).setScale(base).setOrigin(.5, oy).setDepth(s.depth);
    s.setVisible(false);
    sc.efNpcs.push({ s, v, key, base, fy, job: JOB[key] || 'happy', t: rnd(0, 6000), ph: rnd(0, 6), bp: rnd(520, 700), sp: rnd(1300, 2000), sa: .7,
      near: false, greet: 0, look: 0, nextLook: rnd(3000, 8000), burst: 0, nextBurst: rnd(1500, 4000), pt: 0 });
  };
  const note = (sc, x, y) => {
    const t = sc.add.text(x, y, Math.random() < .5 ? '♪' : '♫', { fontSize: '15px', color: Math.random() < .5 ? '#ffe08a' : '#ffffff', stroke: '#2a1d10', strokeThickness: 3 }).setOrigin(.5).setDepth(1500);
    sc.tweens.add({ targets: t, y: y - rnd(24, 34), x: x + rnd(-10, 10), alpha: 0, duration: 1500, ease: 'Sine.Out', onComplete: () => t.destroy() });
  };
  const puff = (sc, x, y, col, big) => {
    const r = sc.add.rectangle(x, y, big ? 5 : 3, big ? 5 : 3, col, .6).setDepth(1500);
    sc.tweens.add({ targets: r, y: y - rnd(14, 24), x: x + rnd(-5, 5), alpha: 0, scale: 2, duration: 900, ease: 'Sine.Out', onComplete: () => r.destroy() });
  };
  const sparkle = (sc, x, y, col) => {
    const t = sc.add.text(x, y, '✦', { fontSize: rnd(10, 15) + 'px', color: col }).setOrigin(.5).setDepth(1500).setBlendMode(ADD());
    sc.tweens.add({ targets: t, y: y - rnd(10, 26), x: x + rnd(-14, 14), alpha: 0, angle: rnd(-90, 90), duration: rnd(900, 1400), ease: 'Sine.Out', onComplete: () => t.destroy() });
  };
  const tink = (sc, x, y) => {
    for (let i = 0; i < 3; i++) { const r = sc.add.rectangle(x, y, 2, 2, 0xffd54a).setDepth(1500);
      sc.tweens.add({ targets: r, x: x + rnd(-10, 10), y: y + rnd(-10, 3), alpha: 0, duration: 300, onComplete: () => r.destroy() }); }
  };

  function npcStep(sc, n, dt, px, py) {
    n.t += dt;
    const { s, v, base } = n, sinB = Math.sin(n.t / n.bp + n.ph);
    let sy = 1 + sinB * .026, sx = 1 - sinB * .013, ang = Math.sin(n.t / n.sp + n.ph) * n.sa, dy = 0, flip = false;
    const d = Math.hypot(px - s.x, py - n.fy), near = d < 135;
    // chào: nhún 2 lần + vẫy khi bạn bước lại gần; rồi nghiêng người về phía bạn
    if (near && !n.near) { n.near = true; n.greet = 1000; } else if (!near && d > 170) n.near = false;
    if (near) ang += clamp((px - s.x) / 70, -1, 1) * 2.4;
    if (n.greet > 0) { n.greet -= dt; const e = 1 - n.greet / 1000;
      if (e < .55) dy -= Math.abs(Math.sin(e / .55 * Math.PI * 2)) * 4.5;
      ang += Math.sin(e * Math.PI * 7) * 7 * (1 - e); }
    // nhìn quanh
    n.nextLook -= dt; if (n.nextLook <= 0) { n.look = 1100; n.nextLook = n.job === 'curious' ? rnd(2000, 4000) : rnd(3500, 9000); }
    if (n.look > 0) { n.look -= dt; flip = true; }
    // theo nghề
    n.nextBurst -= dt; if (n.nextBurst <= 0) { n.burst = 1600; n.nextBurst = rnd(3000, 6000); }
    const bursting = n.burst > 0; if (bursting) n.burst -= dt;
    const bx = s.x, by = n.fy - 30 * base;
    n.pt -= dt;
    switch (n.job) {
      case 'cook':
        if (bursting) { ang += Math.sin(n.t / 50) * 5; sy -= .02; }
        if (n.pt <= 0) { n.pt = 520; puff(sc, bx + 10 * base, by + 4, 0xffffff, true); } break;
      case 'magic':
        dy += -3 + Math.sin(n.t / 600) * 2.5;
        if (n.pt <= 0) { n.pt = rnd(350, 700); sparkle(sc, bx + rnd(-14, 14), by + rnd(-6, 12), Math.random() < .5 ? '#c9a8ff' : '#fff2a0'); } break;
      case 'sway': ang += Math.sin(n.t / 1100) * 2.2; break;
      case 'teach':
        if (bursting) { const k = Math.abs(Math.sin(n.t / 220)); sy -= .05 * k; dy += 1.5 * k; } break;
      case 'work':
        if (bursting) { const k = Math.max(0, Math.sin(n.t / 160)); sy -= .07 * k; dy += 1.8 * k; ang += k * 4;
          if (k > .98 && n.pt <= 0) { n.pt = 300; tink(sc, bx + 12 * base, n.fy - 12 * base); } } break;
      case 'sing':
        if (bursting) dy -= Math.abs(Math.sin(n.t / 260)) * 1.8;
        if (bursting && n.pt <= 0) { n.pt = 700; note(sc, bx + rnd(-6, 8), by - 4); } break;
      case 'curious': if (bursting) ang += Math.sin(n.t / 300) * 2.5; break;
      default:
        if (bursting && n.burst > 1000) { const e = (1600 - n.burst) / 600; dy -= Math.sin(Math.PI * clamp(e, 0, 1)) * 5; }
    }
    v.setScale(base * sx, base * sy).setAngle(ang).setFlipX(flip).setPosition(s.x, n.fy + dy);
  }

  // =====================================================================
  //  TÒA NHÀ — hiệu ứng phủ lên ảnh tĩnh (toạ độ tính theo pixel ảnh gốc)
  // =====================================================================
  // win: [x0,y0,x1,y1,màu?]  glow: [x,y,bán kính,màu,luôn sáng?]  smoke: [x,y]  ...
  const WARM = 0xffc864, PURPLE = 0xb58cff;
  const SPEC = {
    home:   { tex: 'b_home', smoke: [[24, 31]], win: [[36, 73, 47, 84], [57, 73, 68, 84], [14, 104, 25, 115], [41, 104, 52, 115], [67, 104, 78, 115]] },
    seedshop: { tex: 'b_seedshop', smoke: [[134, 6]], win: [[154, 106, 184, 116], [120, 180, 142, 202], [196, 180, 218, 202], [108, 240, 130, 262], [206, 240, 228, 262]] },
    homes:  { tex: 'v_homes', smoke: [[114, 22]], win: [[69, 68, 85, 86], [67, 116, 89, 138], [259, 72, 283, 94], [304, 122, 338, 152]] },
    food:   { tex: 'v_food', fire: [[130, 160, 20, 12], [128, 190, 22, 7]], glow: [[176, 200, 16, WARM]], steam: [[190, 168]] },
    decor:  { tex: 'v_decor', smoke: [[50, 57], [44, 6]], fire: [[40, 120, 20, 16]], win: [[82, 92, 90, 107], [180, 92, 191, 107]], glint: [[175, 138], [197, 132], [220, 140]] },
    school: { tex: 'v_school', win: [[60, 144, 78, 165], [133, 144, 151, 165], [100, 106, 120, 126, 0xbfffe9]], bell: [107, 46] },
    mill:   { tex: 'v_mill', win: [[111, 84, 131, 102]], wheel: [132, 157, 38], drip: [132, 203] },
    wizard: { tex: 'v_wizard', win: [[56, 98, 68, 115, PURPLE], [132, 160, 165, 184]], magic: [62, 8], glow: [[62, 107, 20, PURPLE]] },
    fisher: { tex: 'v_fisher', win: [[64, 66, 92, 88]], glow: [[179, 76, 14, 0xff9a3c]], ripple: [160, 184] },
    observatory: { tex: 'v_observatory', win: [[88, 118, 96, 128, 0xbfe3ff]], glint: [[152, 28]], stars: [40, -14, 110, 20] },
    dinh:   { tex: 'b_dinh', win: [[118, 66, 138, 95], [156, 66, 178, 95], [40, 132, 62, 159], [234, 132, 256, 159]], glow: [[150, 196, 26, WARM]] },
    well:   { tex: 'b_well', leaves: [20, 12, 90, 40] }
  };

  A.building = function (sc, key, img) {
    const sp = SPEC[key]; if (!sp || !img || !img.texture || img.texture.key !== sp.tex) return;
    A.tex(sc); if (!sc.efB) sc.efB = [];
    const sxs = img.scaleX, sys = img.scaleY, L = img.x - img.displayWidth * (img.originX || .5), T = img.y - img.displayHeight * (img.originY === undefined ? 1 : img.originY);
    const X = x => L + x * sxs, Y = y => T + y * sys, dep = (img.depth || 0) + 1, TOP = 2001;   // TOP: trên lớp màn đêm → ô cửa sáng xuyên bóng tối
    const lights = sc.efB;
    const halo = (x, y, r, col, a) => sc.add.image(x, y, 'efglow').setTint(col).setBlendMode(ADD()).setDepth(TOP).setScale(r * 2 / 64).setAlpha(a);

    (sp.win || []).forEach(w => {
      const col = w[4] || WARM, cx = X((w[0] + w[2]) / 2), cy = Y((w[1] + w[3]) / 2), ww = (w[2] - w[0]) * sxs, hh = (w[3] - w[1]) * sys;
      const r = sc.add.rectangle(cx, cy, ww, hh, col, .72).setDepth(TOP).setAlpha(0);
      const h = halo(cx, cy, Math.max(ww, hh) * 1.35, col, 0);
      lights.push({ kind: 'win', o: [r, h], th: rnd(.04, .5), off: rnd(0, 1), ph: rnd(0, 9), a: [.72, .35] });
    });
    (sp.glow || []).forEach(g => lights.push({ kind: 'glow', o: [halo(X(g[0]), Y(g[1]), g[2] * sxs, g[3], 0)], th: rnd(.05, .3), off: 2, ph: rnd(0, 9), a: [.55], always: !!g[4] }));
    (sp.fire || []).forEach(f => { const cx = X(f[0]), cy = Y(f[1]);
      lights.push({ kind: 'fire', o: [halo(cx, cy, f[2] * sxs * 1.1, 0xff8a2a, 0), sc.add.rectangle(cx, cy, f[2] * sxs * .6, f[3] * sys * .6, 0xffc060, 0).setBlendMode(ADD()).setDepth(TOP)], ph: rnd(0, 9), a: [.8, .55] }); });
    (sp.glint || []).forEach(g => { const cx = X(g[0]), cy = Y(g[1]);
      lights.push({ kind: 'glint', o: [halo(cx, cy, 9 * sxs, 0xffffff, 0)], ph: rnd(0, 9), a: [.9] }); });

    (sp.smoke || []).forEach(m => A.chimney(sc, X(m[0]), Y(m[1]), dep + 1, sxs));   // khói ống khói bốc lên, uốn lượn theo gió
    (sp.steam || []).forEach(m => sc.add.particles(X(m[0]), Y(m[1]), 'efpuff', { lifespan: 1700, frequency: 480, speedY: { min: -16, max: -8 }, speedX: { min: -4, max: 4 },
      scale: { start: .12, end: .45 }, alpha: { start: .4, end: 0 }, tint: 0xffffff }).setDepth(dep + 1));
    if (sp.incense) sc.add.particles(X(sp.incense[0]), Y(sp.incense[1]), 'efpuff', { lifespan: 2800, frequency: 260, speedY: { min: -22, max: -14 }, speedX: { min: -3, max: 5 },
      scale: { start: .1, end: .5 }, alpha: { start: .45, end: 0 }, tint: 0xdddddd }).setDepth(dep + 1);
    if (sp.magic) sc.add.particles(X(sp.magic[0]), Y(sp.magic[1]), 'spark', { lifespan: 1900, frequency: 420, speedY: { min: -16, max: -6 }, speedX: { min: -9, max: 9 },
      scale: { start: 1.2, end: 0 }, alpha: { start: 1, end: 0 }, tint: [0xc9a8ff, 0xfff2a0, 0xa8d8ff], blendMode: 'ADD' }).setDepth(dep + 1);
    if (sp.leaves) { const z = sp.leaves; sc.add.particles(X(z[0]), Y(z[1]), 'spark', { lifespan: 4200, frequency: 950, speedY: { min: 9, max: 20 }, speedX: { min: -8, max: 8 },
      scale: { start: 1, end: .5 }, alpha: { start: 1, end: 0 }, rotate: { start: 0, end: 360 }, tint: [0x6ea13a, 0x9bc24a, 0xd9a441],
      emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(0, 0, z[2] * sxs, z[3] * sys) } }).setDepth(dep + 1); }
    if (sp.drip) { sc.add.particles(X(sp.drip[0]), Y(sp.drip[1]), 'spark', { lifespan: 650, frequency: 150, speedY: { min: 40, max: 80 }, speedX: { min: -8, max: 8 }, gravityY: 140,
      scale: { start: .6, end: 0 }, tint: 0x9fd4ff }).setDepth(dep + 1);
      sc.time.addEvent({ delay: 700, loop: true, callback: () => A._ring(sc, X(sp.drip[0]) + rnd(-8, 8), Y(sp.drip[1]) + 5, 0xbfe3ff, dep) }); }
    if (sp.ripple) sc.time.addEvent({ delay: 1100, loop: true, callback: () => A._ring(sc, X(sp.ripple[0]) + rnd(-18, 18), Y(sp.ripple[1]) + rnd(-3, 5), 0xd6ecff, dep, 2.6) });
    if (sp.stars) { const z = sp.stars; sc.time.addEvent({ delay: 650, loop: true, callback: () => {
      if (A.darkness() < .3) return; const x = X(z[0]) + rnd(0, z[2] * sxs), y = Y(z[1]) + rnd(0, z[3] * sys);
      const t = sc.add.text(x, y, '✦', { fontSize: rnd(9, 14) + 'px', color: '#ffffff' }).setOrigin(.5).setDepth(TOP).setBlendMode(ADD()).setAlpha(0);
      sc.tweens.add({ targets: t, alpha: .95, scale: 1.4, duration: 450, yoyo: true, onComplete: () => t.destroy() }); } }); }
    if (sp.wheel) { const [cx, cy, R] = sp.wheel, dots = [];
      for (let i = 0; i < 16; i++) dots.push(sc.add.rectangle(0, 0, 3, 3, i % 2 ? 0xe6d1a2 : 0x6b4a2a, .75).setDepth(dep - .5));
      lights.push({ kind: 'wheel', dots, cx: X(cx), cy: Y(cy), R: R * sxs, ph: 0 }); }
    if (sp.bell) { (sc.efBells = sc.efBells || []).push({ img, x: X(sp.bell[0]), y: Y(sp.bell[1]), dep }); }
  };

  // khói ống khói: từng cụm khói nhỏ bốc lên, nở dần, trôi theo gió (nghiêng nhiều hơn khi mưa) rồi tan; ban đêm hơi xám tối
  A.chimney = function (sc, x, y, dep, k) {
    k = k || 1;
    const spawn = () => {
      const night = A.darkness() > .45, cols = night ? [0xb9bcc6, 0xa4a8b4, 0x9094a0] : [0xffffff, 0xeeeeee, 0xdcdcdc];
      const puff = sc.add.image(x + rnd(-1.5, 1.5) * k, y, 'efpuff').setDepth(dep).setTint(cols[Math.floor(Math.random() * cols.length)]).setScale(.16 * k).setAlpha(0);
      const rise = rnd(48, 72) * k, wind = (A.raining() ? 5 : 11) + rnd(-3, 5), ph = rnd(0, 6.28), amp = rnd(2, 4) * k, t = { v: 0 };
      sc.tweens.add({ targets: t, v: 1, duration: rnd(3200, 4400), ease: 'Linear',
        onUpdate: () => { const e = t.v; puff.setPosition(x + wind * k * e * e * 4.5 + Math.sin(ph + e * 5.5) * amp * e, y - rise * Math.sqrt(e));
          puff.setScale((.16 + .72 * e) * k).setAlpha(Math.min(1, e * 7) * .7 * (1 - e)); },
        onComplete: () => puff.destroy() });
    };
    sc.time.addEvent({ delay: 430, loop: true, startAt: rnd(0, 400), callback: spawn });
  };

  A._ring = function (sc, x, y, col, dep, grow) {
    const e = sc.add.ellipse(x, y, 8, 3).setStrokeStyle(1, col, .7).setDepth(dep);
    sc.tweens.add({ targets: e, scaleX: grow || 2.8, scaleY: grow || 2.8, alpha: 0, duration: 1300, ease: 'Sine.Out', onComplete: () => e.destroy() });
  };
  // chuông trường vang: rung nhẹ tòa nhà + sóng âm + nốt nhạc
  A.chime = function (sc) {
    (sc && sc.efBells || []).forEach(b => {
      sc.tweens.add({ targets: b.img, x: b.img.x + 1, duration: 45, yoyo: true, repeat: 7 });
      for (let i = 0; i < 3; i++) sc.time.delayedCall(i * 420, () => { A._ring(sc, b.x, b.y, 0xffe08a, b.dep + 2, 3.2); note(sc, b.x + rnd(-8, 8), b.y - 6); });
    });
  };

  // =====================================================================
  //  cập nhật mỗi khung hình (gọi đầu Base.update)
  // =====================================================================
  A.update = function (sc, time, delta) {
    const s = sc.hs;
    if (s && sc.time.now - s.stamp > 50) A.heroUpdate(sc, delta, false, 0, 0);   // đang bị khóa (hộp thoại) → vẫn thở / đồng bộ vị trí
    const cam = sc.cameras.main, wv = cam.worldView, pl = sc.player;
    if (sc.efNpcs) sc.efNpcs.forEach(n => {
      if (n.s.x < wv.x - 120 || n.s.x > wv.right + 120 || n.s.y < wv.y - 120 || n.s.y > wv.bottom + 160) return;
      npcStep(sc, n, delta, pl.x, pl.y);
    });
    const L = sc.efB; if (!L || !L.length) return;
    const dk = A.darkness(), h = A.hour(), rain = A.raining();
    let night = clamp((dk - .08) / .42, 0, 1); if (rain) night = Math.max(night, .5);
    const late = h >= 23 || h < 5.5 ? clamp((h >= 23 ? h - 23 : h + 1) / 1.2, 0, 1) : 0;   // khuya: nhiều cửa sổ tắt dần
    const view = wv;
    L.forEach(l => {
      if (l.kind === 'wheel') {
        l.ph += delta * .0014; const vis = l.cx > view.x - 100 && l.cx < view.right + 100 && l.cy > view.y - 100 && l.cy < view.bottom + 100;
        if (!vis) return;
        l.dots.forEach((d, i) => { const ring = i < 8 ? 1 : .62, a = l.ph + (i % 8) * Math.PI / 4; d.setPosition(l.cx + Math.cos(a) * l.R * ring, l.cy + Math.sin(a) * l.R * ring); });
        return;
      }
      const t = time, fl = 1 + Math.sin(t / 130 + l.ph) * .07 + Math.sin(t / 57 + l.ph * 2) * .05;
      let k;
      if (l.kind === 'win') { k = clamp((night - l.th) / .25, 0, 1); if (late > l.off) k = 0; k *= fl; }
      else if (l.kind === 'glow') { k = l.always ? (.45 + night * .55) * (1 + Math.sin(t / 700 + l.ph) * .12) : clamp((night - l.th) / .25, 0, 1) * fl; }
      else if (l.kind === 'fire') { k = (.45 + night * .55) * (1 + Math.sin(t / 90 + l.ph) * .18 + Math.sin(t / 41 + l.ph) * .1); }
      else { const tw = Math.pow(Math.max(0, Math.sin(t / 900 + l.ph)), 12); k = tw * (.35 + night * .65); }   // glint: lóe sáng ngắn
      l.o.forEach((o, i) => o.setAlpha(clamp(k * (l.a[Math.min(i, l.a.length - 1)]), 0, 1)));
    });
  };
})();
