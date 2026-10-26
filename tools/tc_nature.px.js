// Tràm Chim — THỰC VẬT (nhìn 3/4: thấy thân + tán, viền tối màu xanh/nâu như cây các map trước, sáng từ trên-trái)
// Gốc vật thể = đáy ảnh (origin .5,1). Bóng đổ lên nền do tc_ground.px.js vẽ.

const OUT_G = "#233f2a", OUT_B = "#3a2d20"
const rnd1 = (r, a, b) => a + Math.floor(r() * (b - a))
const cl = (v, a, b) => Math.max(a, Math.min(b, v))

// ---------- cây tràm ----------
// thân trắng kem bong vỏ giấy, hơi nghiêng; tán lá xanh xám rủ xuống như lông vũ, vài chùm hoa kem
function tramTree(c, p) {
  const r = c.rng(p.seed), W = c.w, H = c.h, cx = Math.floor(W / 2), base = H - 4
  const tcx = cx + p.lean, topY = base - p.trunk                  // đỉnh thân (chỗ toả cành)
  // gốc: đất tối + vài cọng cỏ ôm gốc
  for (let i = -5; i <= 5; i++) if (r() < .75) { const h = rnd1(r, 1, 4); for (let j = 0; j < h; j++) c.px(cx + i, base + 1 - j, j === h - 1 ? "#8fcf5a" : "#4a8a3a") }
  c.hline(cx - 4, base + 2, 9, "#2a4426")
  // thân: lát ngang từ gốc lên, đường cong chữ S nhẹ
  for (let y = base; y >= topY; y--) {
    const t = (base - y) / p.trunk, xc = Math.round(cx + p.lean * (t * t * (3 - 2 * t)) + Math.sin(t * 5 + p.seed) * .8)
    const w = Math.round((p.tw) * (1 - t * .45) + (t < .1 ? 3 - t * 30 : 0))
    const x0 = xc - Math.floor(w / 2), x1 = x0 + w - 1
    for (let x = x0; x <= x1; x++) {
      let col = "#e2d7b5"
      if (x === x0) col = "#f6efd6"; else if (x === x0 + 1 && w > 4) col = "#ece2c2"
      else if (x === x1) col = "#a6976f"; else if (x === x1 - 1 && w > 4) col = "#c2b48b"
      c.px(x, y, col)
    }
    if (r() < .34) { const fx = rnd1(r, x0 + 1, x1), fl = r() < .5; c.px(fx, y, fl ? "#fff9e6" : "#9a8b66"); if (fl && fx + 1 < x1) c.px(fx + 1, y + 1, "#c9bc94") }   // vỏ giấy bong từng mảng
    if (y % 7 === 3) c.px(x1 - 1, y, "#8d7f5c")                  // vết nứt ngang
  }
  // rễ chân choãi
  c.px(cx - 4, base, "#cfc3a0"); c.px(cx - 3, base + 1, "#a6976f"); c.px(cx + 4, base, "#a6976f"); c.px(cx + 3, base + 1, "#8d7f5c")
  // cành toả vào tán
  const ccx = tcx, ccy = topY - Math.round(p.Ry * .55)
  for (const [dx, dy, th] of [[-p.Rx * .55, -p.Ry * .5, 2], [p.Rx * .5, -p.Ry * .42, 2], [-p.Rx * .15, -p.Ry * .8, 2], [p.Rx * .22, -p.Ry * .3, 1]]) {
    c.line(tcx, topY + 1, Math.round(ccx + dx), Math.round(ccy + dy), "#cfc3a0", th)
    c.line(tcx + 1, topY + 1, Math.round(ccx + dx) + 1, Math.round(ccy + dy), "#a6976f")
  }
  // tán: các chùm lá xếp thành 2-3 tầng, rộng và thấp, màu xanh xám kiểu lá tràm; vẽ từ sau ra trước
  const blobs = []
  for (let i = 0; i < p.n; i++) {
    const a = r() * 6.283, d = Math.sqrt(r()), tier = r()
    blobs.push([ccx + Math.cos(a) * p.Rx * d * .86, ccy + Math.sin(a) * p.Ry * d * .7 + (tier < .3 ? p.Ry * .18 : 0), p.br * (.62 + r() * .6)])
  }
  blobs.sort((a, b) => a[1] - b[1])
  const R_ = Math.round
  for (const [x, y, rr] of blobs) c.circ(R_(x + 1), R_(y + 1), R_(rr), "#2c5535")
  for (const [x, y, rr] of blobs) { c.circ(R_(x), R_(y), R_(rr), "#3f7046"); c.circ(R_(x - .7), R_(y - .8), cl(R_(rr - 1), 1, 99), "#5a8c4f") }
  for (const [x, y, rr] of blobs) { c.circ(R_(x - 1.4), R_(y - 1.8), cl(R_(rr * .68), 1, 99), "#7fae59") }
  for (const [x, y, rr] of blobs) { if (rr > 3) c.circ(R_(x - 2.2), R_(y - 2.6), cl(R_(rr * .36), 1, 99), "#aed26f") }
  // tua lá rủ: từ đáy từng chùm thả xuống như lông vũ (đặc trưng tràm)
  for (const [x, y, rr] of blobs) {
    for (let k = 0; k < 4; k++) {
      const sx = R_(x + (r() - .5) * rr * 1.4), sy = R_(y + Math.sqrt(Math.max(0, rr * rr - (sx - x) * (sx - x))) - 1), len = rnd1(r, 2, 6)
      if (sy > base - 14) continue
      for (let q = 0; q < len; q++) c.px(sx + (q > 2 ? (r() < .5 ? 0 : (sx > x ? 1 : -1)) : 0), sy + q, q === len - 1 ? "#6a9a52" : q < 2 ? "#3f7046" : "#4f8449")
    }
  }
  // lá tràm mảnh: nét ngắn chéo, sáng ở nửa trên-trái, tối ở nửa dưới-phải
  const bounds = { x0: ccx - p.Rx - 3, x1: ccx + p.Rx + 3, y0: ccy - p.Ry - 3, y1: ccy + p.Ry + 5 }
  for (let i = 0; i < p.Rx * p.Ry * .55; i++) {
    const x = rnd1(r, bounds.x0, bounds.x1), y = rnd1(r, bounds.y0, bounds.y1)
    if (!c.is(x, y, "*")) continue
    const lit = (x - ccx) * .6 + (y - ccy) < -p.Ry * .08
    const col = lit ? (r() < .5 ? "#c8e68e" : "#9bc864") : (r() < .6 ? "#2f5c3a" : "#4b7e47")
    c.px(x, y, col); if (r() < .65) c.px(x + (r() < .5 ? -1 : 1), y + 1, col); if (r() < .3) c.px(x + (r() < .5 ? -2 : 2), y + 2, col)
  }
  // hoa tràm kem + vài chùm quả
  for (let i = 0; i < p.flowers; i++) {
    const x = rnd1(r, bounds.x0 + 3, bounds.x1 - 3), y = rnd1(r, bounds.y0 + 3, bounds.y1 - 5)
    if (c.is(x, y, "*") && y < base - 10) { c.px(x, y, "#fbf4d2"); c.px(x + 1, y, "#e7dcae"); if (r() < .5) c.px(x, y - 1, "#fffbe8") }
  }
}
const TRAM = [
  ["tram0", 44, 60, { seed: 11, lean: 1, trunk: 20, tw: 5, Rx: 19, Ry: 12, n: 16, br: 5.2, flowers: 9 }],
  ["tram1", 36, 48, { seed: 23, lean: -2, trunk: 15, tw: 4, Rx: 15, Ry: 9, n: 12, br: 4.4, flowers: 6 }],
  ["tram2", 54, 72, { seed: 37, lean: 2, trunk: 24, tw: 6, Rx: 24, Ry: 14, n: 20, br: 6.2, flowers: 14 }],
]
for (const [name, w, h, p] of TRAM) sprite(name, { w, h, outline: OUT_G }, (c) => tramTree(c, p))
sprite("sapling", { w: 18, h: 26, outline: OUT_G }, (c) => tramTree(c, { seed: 5, lean: 1, trunk: 9, tw: 2, Rx: 6, Ry: 5, n: 5, br: 3.2, flowers: 1 }))

// ---------- tràm chết đứng giữa nước (thân bạc trắng, cành gãy, chim đậu) ----------
function deadTree(c, seed, tall) {
  const r = c.rng(seed), W = c.w, H = c.h, cx = Math.floor(W / 2), base = H - 5
  for (let y = base; y >= base - tall; y--) {
    const t = (base - y) / tall, xc = Math.round(cx + Math.sin(t * 3.4 + seed) * 1.4), w = Math.round(5 - t * 2.4 + (t < .08 ? 2 : 0))
    const x0 = xc - Math.floor(w / 2), x1 = x0 + w - 1
    for (let x = x0; x <= x1; x++) c.px(x, y, x === x0 ? "#d3ccb8" : x === x1 ? "#6f6757" : x === x1 - 1 ? "#8c8470" : "#aca593")
    if (r() < .3) c.px(rnd1(r, x0, x1 + 1), y, "#5f5849")          // vết nứt dọc
    if (r() < .1) c.px(x0, y, "#ece7d6")
  }
  // cành gãy chĩa ra hai bên
  const topx = Math.round(cx + Math.sin(3.4 + seed) * 1.4), topy = base - tall
  c.line(topx, topy + 2, topx - 6, topy - 5, "#aca593", 2); c.line(topx - 6, topy - 5, topx - 8, topy - 9, "#8c8470")
  c.line(topx + 1, topy + 6, topx + 7, topy - 1, "#aca593", 2); c.line(topx + 7, topy - 1, topx + 9, topy - 5, "#8c8470")
  c.line(topx, topy + 1, topx + 1, topy - 6, "#aca593")
  c.px(topx - 8, topy - 9, "#e9e4d3"); c.px(topx + 9, topy - 5, "#e9e4d3")
  // rêu bám gốc, mảng phân chim trắng
  c.hline(cx - 3, base - 1, 3, "#5f8d44"); c.px(cx + 2, base - 2, "#79a653"); c.px(cx - 1, base - 9, "#f4f1e6"); c.px(cx - 1, base - 8, "#f4f1e6")
}
sprite("tram_dead0", { w: 28, h: 56, outline: "#2f2a24" }, (c) => deadTree(c, 3, 40))
sprite("tram_dead1", { w: 28, h: 48, outline: "#2f2a24" }, (c) => deadTree(c, 9, 32))

// lá: đường cong liền nét (không đứt pixel), gốc dày 2px → ngọn nhọn, mép trái sáng
function blade(c, x0, y0, len, lean, cols, thick) {
  let px = x0, py = y0
  for (let j = 1; j <= len; j++) {
    const t = j / len, x = Math.round(x0 + lean * t * t), y = y0 - j
    const col = t > .8 ? cols[3] : t > .5 ? cols[2] : t > .2 ? cols[1] : cols[0]
    c.line(px, py, x, y, col)
    if (thick && t < .55) c.px(x + 1, y, cols[0])
    if (t > .15 && t < .75 && j % 3 === 0) c.px(x - 1, y, cols[3])
    px = x; py = y
  }
  return [px, py]
}
function reedClump(c, seed, blades, tallMax, plume) {
  const r = c.rng(seed), W = c.w, H = c.h, base = H - 3, mx = Math.floor(W / 2)
  c.ellipse(mx, base + 1, mx - 2, 2, "#2f4b2a88")
  c.ellipse(mx, base, mx - 4, 1, "#4b3a26")
  const tips = []
  for (let i = 0; i < blades; i++) {
    const bx = Math.round(mx + (i - (blades - 1) / 2) * ((W - 8) / blades) + (r() - .5) * 2), bh = Math.round(tallMax * (.5 + r() * .5)), lean = (i - (blades - 1) / 2) * 1.3 + (r() - .5) * 4
    tips.push(blade(c, bx, base, bh, lean, ["#3d6330", "#5b8a3a", "#86ad4a", "#b5d070"], true))
  }
  if (plume) for (let i = 1; i < tips.length; i += 2) {                // bông lau trắng ngà
    const [lx, ly] = tips[i]
    c.line(lx, ly, lx, ly - 4, "#b88f5a"); c.px(lx - 1, ly - 3, "#d6b07a"); c.px(lx + 1, ly - 4, "#d6b07a"); c.px(lx, ly - 5, "#efdcae"); c.px(lx - 1, ly - 5, "#f7ecc9"); c.px(lx + 1, ly - 6, "#efdcae"); c.px(lx, ly - 7, "#f7ecc9")
  }
}
for (let i = 0; i < 3; i++) sprite("reed" + i, { w: 24, h: 36 }, (c) => reedClump(c, 200 + i * 13, 8 + i, 28 - i * 2, true))

// bồn bồn / lác: lá bản dài rủ cong + bông nâu (hình điếu) đặc trưng ven nước
function cattail(c, seed) {
  const r = c.rng(seed), W = c.w, H = c.h, base = H - 3
  c.ellipse(Math.floor(W / 2), base + 1, 6, 2, "#2f4b2a88")
  for (let i = 0; i < 6; i++) {                                     // lá bản dài
    const bx = 3 + i * 1.6 + r() * 2, bh = 12 + r() * 12, lean = (i % 2 ? 1 : -1) * (3 + r() * 4)
    for (let j = 0; j <= bh; j++) { const t = j / bh, x = Math.round(bx + lean * t * t), y = base - j; c.px(x, y, t > .8 ? "#a1bb5a" : "#5f8a3a"); if (j % 3 === 0) c.px(x - 1, y, "#8fb04e") }
  }
  for (const [sx, sh] of [[Math.floor(W / 2) - 1, 26], [Math.floor(W / 2) + 3, 20]]) {            // thân + bông điếu
    c.vline(sx, base - sh, sh, "#6d8f3e"); c.vline(sx - 1, base - sh + 6, sh - 6, "#8fb04e")
    c.rect(sx - 1, base - sh - 5, 3, 6, "#5b3d22"); c.vline(sx - 1, base - sh - 5, 6, "#8a5d34"); c.px(sx, base - sh - 6, "#6d8f3e"); c.px(sx, base - sh - 7, "#6d8f3e")
  }
}
for (let i = 0; i < 2; i++) sprite("cattail" + i, { w: 16, h: 36 }, (c) => cattail(c, 300 + i * 7))

// cỏ năn vàng: bụi lá hẹp + bông hạt; cỏ xanh cao
function sedgeClump(c, seed) {
  const r = c.rng(seed), W = c.w, H = c.h, base = H - 2
  c.ellipse(Math.floor(W / 2), base, 6, 1, "#5a4f2a88")
  for (let i = 0; i < 9; i++) {
    const bx = 2 + i * ((W - 5) / 9) + r(), bh = 6 + r() * 7, lean = (r() - .5) * 8
    const [tx, ty] = blade(c, Math.round(bx), base, Math.round(bh), lean, ["#8c8440", "#b3a954", "#d8cf84", "#f0e9b4"], false)
    if (i % 3 === 1) { c.px(tx, ty - 1, "#c9a55e"); c.px(tx + 1, ty - 2, "#e8cf8a") }
  }
}
for (let i = 0; i < 3; i++) sprite("sedgep" + i, { w: 20, h: 18 }, (c) => sedgeClump(c, 400 + i * 11))
function tallGrass(c, seed) {
  const r = c.rng(seed), W = c.w, H = c.h, base = H - 2
  for (let i = 0; i < 7; i++) {
    const bx = 2 + i * ((W - 4) / 7) + r(), bh = 5 + r() * 6, lean = (r() - .5) * 7
    const [tx, ty] = blade(c, Math.round(bx), base, Math.round(bh), lean, ["#4f8a3a", "#6fa845", "#93c852", "#bfe27a"], false)
    if (i % 3 === 0) c.px(tx, ty - 1, "#f1e9b8")
  }
}
for (let i = 0; i < 2; i++) sprite("gtall" + i, { w: 16, h: 14 }, (c) => tallGrass(c, 500 + i * 3))

// dương xỉ ở nền rừng
sprite("fern", { w: 18, h: 14 }, (c) => {
  const base = 12
  for (const [a, l] of [[-1.4, 8], [-.8, 10], [-.2, 11], [.4, 10], [1.0, 9], [1.5, 7]]) {
    for (let j = 0; j <= l; j++) { const x = Math.round(9 + Math.sin(a) * j * .9), y = Math.round(base - Math.cos(a) * j * .7 + j * j * .015); c.px(x, y, j > l * .6 ? "#9cca5e" : "#4f8a3a"); if (j % 2 === 1) { c.px(x - 1, y + 1, "#6fa545"); c.px(x + 1, y + 1, "#3d7332") } }
  }
  c.px(9, base + 1, "#2a4426")
})

// ---------- bụi cây có hoa (viền tối, nhiều tầng sáng) ----------
function bush(c, seed, flower, flower2) {
  const r = c.rng(seed), W = c.w, H = c.h
  for (const [x, y, rr, dark, mid, light] of [[9, 12, 7, "#2f5f35", "#478b45", "#68ad57"], [17, 12, 6, "#2f5f35", "#478b45", "#68ad57"], [13, 8, 7, "#2f5f35", "#478b45", "#7bbd62"]]) {
    c.circ(x + 1, y + 1, rr, dark); c.circ(x, y, rr, mid); c.circ(x - 1, y - 1, rr - 2, light)
  }
  c.circ(11, 5, 2, "#9ed16b")
  for (let i = 0; i < 14; i++) { const x = rnd1(r, 3, W - 3), y = rnd1(r, 2, H - 4); if (c.is(x, y, "*")) { c.px(x, y, flower); c.px(x + 1, y, flower2); if (r() < .5) c.px(x, y - 1, flower2) } }
}
sprite("bush0", { w: 28, h: 22, outline: OUT_G }, (c) => bush(c, 61, "#f4a3c0", "#ffd9e6"))
sprite("bush1", { w: 28, h: 22, outline: OUT_G }, (c) => bush(c, 62, "#f7dc5a", "#fff2b0"))

// ---------- đá phủ rêu, gốc cây, khúc gỗ trôi ----------
function rockS(c, w, h, seed) {
  const r = c.rng(seed)
  c.ellipse(w / 2, h - 3, w / 2 - 1, h / 2 - 1, "#4d5459")
  c.ellipse(w / 2 - 1, h - 4, w / 2 - 2, h / 2 - 2, "#7a858b")
  c.ellipse(w / 2 - 2, h - 5, w / 2 - 4, h / 2 - 3, "#a3aeb3")
  c.px(Math.floor(w / 2) - 3, h - 7, "#d5dde0"); c.px(Math.floor(w / 2) - 2, h - 7, "#d5dde0")
  for (let i = 0; i < 6; i++) { const x = rnd1(r, 2, w - 2), y = rnd1(r, 1, h - 3); if (c.is(x, y, "*")) c.px(x, y, i % 2 ? "#6b9a48" : "#8fbf5c") }   // rêu trên đá
}
sprite("rock0", { w: 16, h: 12, outline: "#2f353a" }, (c) => rockS(c, 16, 12, 1))
sprite("rock1", { w: 20, h: 14, outline: "#2f353a" }, (c) => rockS(c, 20, 14, 2))
sprite("rock2", { w: 12, h: 9, outline: "#2f353a" }, (c) => rockS(c, 12, 9, 3))
sprite("stump", { w: 18, h: 16, outline: OUT_B }, (c) => {
  c.rect(3, 6, 12, 8, "#7a5632"); c.rect(3, 6, 3, 8, "#a07646"); c.rect(12, 6, 3, 8, "#563a20")
  c.ellipse(9, 6, 6, 3, "#c9a46a"); c.ellipse(9, 6, 4, 2, "#dcbb82"); c.ellipse(9, 6, 2, 1, "#b08a52"); c.px(9, 6, "#8a6a3a")
  c.px(4, 13, "#563a20"); c.px(13, 14, "#563a20"); c.hline(5, 12, 3, "#6b9a48"); c.px(7, 11, "#8fbf5c")
})
sprite("log", { w: 28, h: 12, outline: OUT_B }, (c) => {
  c.rect(2, 3, 24, 7, "#7a5632"); c.hline(2, 3, 24, "#a07646"); c.hline(2, 9, 24, "#563a20")
  c.ellipse(3, 6, 2, 3, "#c9a46a"); c.ellipse(3, 6, 1, 1, "#8a6a3a")
  c.hline(10, 5, 5, "#563a20"); c.px(18, 6, "#563a20"); c.hline(14, 3, 6, "#6b9a48"); c.px(16, 2, "#8fbf5c"); c.px(22, 4, "#e8e2c8")
})

// =====================================================================
// CÂY THUỶ SINH (đặt trên mặt nước, origin giữa)
// =====================================================================
// lá súng: hình bầu dục (nhìn 3/4 nên dẹt), có khuyết, gân lá; bóng mờ trên mặt nước
function padDraw(c, cx, cy, rx, ry, notch, ang) {
  c.ellipse(cx + 1, cy + 2, rx + 1, ry, "#0f3b4a55")
  c.ellipse(cx, cy, rx, ry, "#2c6e3c")
  c.ellipse(cx, cy - 1, rx - 1, ry - 1, "#46a04a")
  c.ellipse(cx - 1, cy - 1, Math.max(1, rx - 3), Math.max(1, ry - 2), "#68bd5a")
  c.hline(cx - rx + 3, cy - ry + 1, 3, "#9bdc7c")
  c.line(cx, cy, cx + (notch ? rx - 1 : -(rx - 2)), cy + (notch ? 1 : 0), "#2f7a3a")
  if (notch) { c.px(cx + rx, cy + 1, "#00000000"); c.px(cx + rx - 1, cy + 1, "_"); c.px(cx + rx - 1, cy, "_"); c.px(cx + rx, cy, "_") }
}
for (let i = 0; i < 3; i++) sprite("pad" + i, { w: 18, h: 12 }, (c) => padDraw(c, 9, 6, 6 + (i === 1 ? 1 : 0), 3 + (i === 2 ? 1 : 0), i !== 1, 0))
function lilyFlower(c, cx, cy, pink) {
  const o = pink ? ["#c9568a", "#f08fb4", "#ffc6dc", "#ffe6ef"] : ["#b8b49a", "#ece8d4", "#fffdf2", "#ffffff"]
  c.ellipse(cx, cy, 4, 3, o[0]); c.ellipse(cx, cy - 1, 4, 2, o[1])
  for (const dx of [-3, -1, 1, 3]) c.px(cx + dx, cy - 2 - (Math.abs(dx) === 1 ? 1 : 0), o[2])
  c.ellipse(cx, cy - 1, 2, 1, o[3]); c.px(cx, cy - 1, "#f7d447"); c.px(cx - 1, cy - 1, "#f7d447"); c.px(cx + 1, cy - 1, "#e8b830")
}
for (let i = 0; i < 3; i++) sprite("padf" + i, { w: 20, h: 18 }, (c) => { padDraw(c, 10, 11, 7, 4, i !== 1, 0); lilyFlower(c, 9 + (i - 1) * 2, 8, i !== 2) })

// sen: thân cao, lá tròn như chiếc dù nghiêng, nụ + hoa hồng (đặc trưng Đồng Tháp)
function lotus(c, seed, bloom) {
  const r = c.rng(seed), W = c.w, H = c.h
  c.ellipse(W / 2, H - 3, 6, 2, "#0f3b4a55")
  const leaf = (x, y, rx, ry) => {
    c.ellipse(x + 1, y + 1, rx, ry, "#2a6a3a"); c.ellipse(x, y, rx, ry, "#3f9145"); c.ellipse(x - 1, y - 1, rx - 1, ry - 1, "#5fb552"); c.ellipse(x - 2, y - 1, Math.max(1, rx - 4), Math.max(1, ry - 2), "#7fcf68")
    c.px(x, y, "#2f7a3a"); c.line(x, y, x + rx - 2, y - 1, "#3f9145"); c.line(x, y, x - rx + 3, y + 1, "#3f9145"); c.line(x, y, x, y + ry - 1, "#3f9145"); c.px(x, y, "#c9efa6")
  }
  c.vline(5, H - 12, 10, "#3c7f3a"); c.vline(6, H - 12, 10, "#5aa04a")
  c.vline(15, H - 18, 16, "#3c7f3a"); c.vline(16, H - 18, 16, "#5aa04a")
  leaf(6, H - 14, 6, 3); leaf(16, H - 20, 7, 3)
  const fx = 11, fy = H - 22
  c.vline(fx, fy, 18, "#4a8f40")
  if (bloom) {                                                       // hoa sen nở
    const P = ["#d8689a", "#f294b8", "#ffc9dc", "#fff0f5"]
    c.ellipse(fx, fy + 1, 5, 3, P[0]); c.poly([fx - 5, fy + 1, fx - 3, fy - 5, fx - 1, fy - 1, fx + 1, fy - 6, fx + 3, fy - 1, fx + 5, fy - 5, fx + 6, fy + 1], P[1])
    c.poly([fx - 3, fy + 1, fx - 1, fy - 4, fx, fy - 1, fx + 2, fy - 4, fx + 3, fy + 1], P[2]); c.px(fx, fy - 5, P[3]); c.px(fx - 2, fy - 3, P[3]); c.px(fx + 2, fy - 3, P[3]); c.rect(fx - 1, fy, 3, 2, "#f6d24a"); c.px(fx, fy + 1, "#e7a82b")
  } else {                                                           // nụ sen
    c.poly([fx - 2, fy + 2, fx - 3, fy - 2, fx, fy - 8, fx + 3, fy - 2, fx + 2, fy + 2], "#e8779f"); c.poly([fx - 1, fy + 1, fx - 1, fy - 3, fx, fy - 7, fx + 1, fy - 3, fx + 1, fy + 1], "#ffb6cf"); c.px(fx, fy - 8, "#fff0f5"); c.hline(fx - 2, fy + 2, 5, "#4a8f40")
  }
}
for (let i = 0; i < 3; i++) sprite("lotus" + i, { w: 24, h: 40 }, (c) => lotus(c, 600 + i, i !== 1))

// lục bình: lá phao phồng bóng + chùm hoa tím nhạt
function hyac(c, flowers) {
  const rosette = (x, y, k) => {
    c.ellipse(x + 1, y + 3, 7, 3, "#0f3b4a55")
    for (const [dx, dy] of [[-4, 0], [4, 1], [0, -2], [-2, 2], [3, -1]]) { c.circ(x + dx, y + dy, 3, "#3e7f3a"); c.circ(x + dx - 1, y + dy - 1, 2, "#6bb356") }
    c.px(x - 2, y - 2, "#bfe48a"); c.px(x + 2, y - 3, "#bfe48a"); c.px(x - 5, y - 1, "#bfe48a")
    c.circ(x + 1, y + 1, 1, "#d6ee9a")
    if (flowers && k % 2 === 0) { c.vline(x + 1, y - 7, 6, "#5aa04a"); for (const [dx, dy, col] of [[0, -9, "#b79be8"], [2, -9, "#cdb8f2"], [1, -8, "#9c7fd6"], [0, -7, "#d9c9f7"], [2, -7, "#b79be8"], [1, -10, "#e6dbfb"]]) c.px(x + dx, y + dy, col); c.px(x + 1, y - 9, "#f4e68a") }
  }
  rosette(9, 11, 0); rosette(19, 12, 1)
}
sprite("hyac0", { w: 28, h: 22 }, (c) => hyac(c, true))
sprite("hyac1", { w: 28, h: 22 }, (c) => hyac(c, false))
