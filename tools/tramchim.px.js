// Tràm Chim — pixel art vẽ bằng pxl. Ô 16px (game phóng 2x), nhìn từ trên xuống, sáng từ trên-trái.
// Mọi ô nền đều liền mạch (vẽ lặp quanh mép) nên ghép cạnh nhau không lộ đường nối.

const WRAP = (f) => { for (const dx of [-16, 0, 16]) for (const dy of [-16, 0, 16]) f(dx, dy) }
const ri = (r, a, b) => a + Math.floor(r() * (b - a))
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

// ---------- nước ----------
// gợn sóng: vạch sáng + vạch tối lệch xuống-phải (bóng của gợn), vài đốm lấp lánh
function ripples(c, r, n, hi, lo, glint, lens) {
  for (let i = 0; i < n; i++) {
    const x = ri(r, 0, 16), y = ri(r, 0, 16), l = lens[ri(r, 0, lens.length)], g = r() < 0.55
    WRAP((dx, dy) => {
      c.hline(x + dx, y + dy, l, hi)
      c.hline(x + dx + 2, y + dy + 1, l - 1, lo)
      if (glint && g) c.px(x + dx + 1, y + dy, glint)
    })
  }
}
// mảng đậm nhạt loang của đáy: ellipse dither Bayer, tự bọc quanh mép ô nên liền mạch
const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]
function patches(c, r, n, col, rx, ry, dens) {
  for (let i = 0; i < n; i++) {
    const x = ri(r, 0, 16), y = ri(r, 0, 16), a = rx + ri(r, 0, 3), b = ry + ri(r, 0, 2)
    for (let yy = -b; yy <= b; yy++) for (let xx = -a; xx <= a; xx++) {
      const d = (xx / a) ** 2 + (yy / b) ** 2
      if (d > 1) continue
      const X = ((x + xx) % 16 + 16) % 16, Y = ((y + yy) % 16 + 16) % 16
      if (BAYER[Y & 3][X & 3] / 16 < dens * (1 - d * 0.55)) c.px(X, Y, col)
    }
  }
}

for (let i = 0; i < 2; i++) {
  sprite("deep" + i, { w: 16, h: 16 }, (c) => {
    const r = c.rng(10 + i)
    c.rect(0, 0, 16, 16, "#2c6872")
    patches(c, r, 3, "#265f69", 4, 2, 0.5)
    patches(c, r, 2, "#357a84", 3, 2, 0.35)
    ripples(c, r, 3, "#3b8791", "#235660", "#6fb0b5", [3, 4, 5])
  })
  sprite("shal" + i, { w: 16, h: 16 }, (c) => {
    const r = c.rng(20 + i)
    c.rect(0, 0, 16, 16, "#4a9696")
    patches(c, r, 3, "#418c8e", 3, 2, 0.5)       // đáy sâu hơn một chút
    patches(c, r, 2, "#5aa7a3", 3, 1, 0.35)       // chỗ nông, sáng
    ripples(c, r, 4, "#68b3af", "#3c8587", "#b6e0d6", [3, 4, 5])
  })
}

// ---------- bùn ----------
// bùn ướt: bóng loáng ánh trời, vài vũng nước nhỏ phản chiếu
function puddle(c, x, y, rx, ry) {
  WRAP((dx, dy) => {
    c.ellipse(x + dx, y + dy, rx, ry, "#3d3022")                 // viền bùn sẫm
    c.ellipse(x + dx, y + dy, rx - 1, Math.max(1, ry - 1), "#3f6f73")
    c.hline(x + dx - rx + 2, y + dy - Math.max(1, ry - 1), Math.max(1, rx - 2), "#6aa6a8")   // ánh trời ở mép trên
  })
}
function mudWet(c, r, puddles) {
  c.rect(0, 0, 16, 16, "#56432d")
  patches(c, r, 3, "#4a3a27", 3, 2, 0.5)
  patches(c, r, 2, "#62503a", 3, 1, 0.4)
  for (let i = 0; i < 3; i++) {                                   // vệt bùn bóng
    const x = ri(r, 0, 16), y = ri(r, 0, 16), l = ri(r, 3, 6)
    WRAP((dx, dy) => { c.hline(x + dx, y + dy, l, "#7b6747"); c.hline(x + dx + 1, y + dy + 1, l - 1, "#3d3022") })
  }
  for (let i = 0; i < puddles; i++) puddle(c, ri(r, 3, 13), ri(r, 3, 13), 2, 1)
  for (let i = 0; i < 3; i++) { const x = ri(r, 0, 16), y = ri(r, 0, 16); WRAP((dx, dy) => { c.px(x + dx, y + dy, "#3d3022"); c.px(x + dx + 1, y + dy, "#3d3022") }) }
}
for (let i = 0; i < 2; i++) sprite("wmud" + i, { w: 16, h: 16 }, (c) => mudWet(c, c.rng(30 + i), 0))

// bùn khô nứt nẻ: các ô nứt kiểu Voronoi, mỗi ô một sắc độ, mép nứt sáng ở phía có ánh sáng
function cracked(c, r, nseed) {
  const S = []
  for (let i = 0; i < nseed; i++) S.push([ri(r, 0, 16), ri(r, 0, 16), ri(r, 0, 3)])
  const tone = ["#8a7350", "#907955", "#84704e"], crackC = "#6f5b3e", lipC = "#9a8460"
  const cell = [], crack = []
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    let d1 = 1e9, d2 = 1e9, k = 0
    for (let s = 0; s < S.length; s++) {
      let best = 1e9
      for (const ox of [-16, 0, 16]) for (const oy of [-16, 0, 16]) best = Math.min(best, Math.hypot(x - (S[s][0] + ox), y - (S[s][1] + oy)))
      if (best < d1) { d2 = d1; d1 = best; k = s } else if (best < d2) d2 = best
    }
    cell[y * 16 + x] = k; crack[y * 16 + x] = d2 - d1 < 0.9
  }
  const isC = (x, y) => crack[((y + 16) % 16) * 16 + ((x + 16) % 16)]
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    let col = tone[S[cell[y * 16 + x]][2]]
    if (isC(x, y)) col = crackC
    else if (isC(x - 1, y) || isC(x, y - 1)) col = lipC
    c.px(x, y, col)
  }
  for (let i = 0; i < 3; i++) { const x = ri(r, 1, 15), y = ri(r, 1, 15); if (!isC(x, y)) { c.px(x, y, "#b7a07a"); c.px(x + 1, y + 1, "#6f5b3e") } }  // sỏi nhỏ
}
for (let i = 0; i < 2; i++) sprite("dmud" + i, { w: 16, h: 16 }, (c) => cracked(c, c.rng(40 + i), 5 + i))

// ---------- cỏ ----------
function tuft(c, x, y, hi, mid, lo, tall) {
  WRAP((dx, dy) => {
    c.px(x + dx, y + dy, mid)
    c.px(x + dx, y + dy - 1, hi)
    if (tall) c.px(x + dx - 1, y + dy - 2, hi)
    c.px(x + dx + 1, y + dy, lo)                                  // bóng bên phải (sáng từ trái)
    c.px(x + dx + 1, y + dy - 1, mid)
  })
}
function grassTile(c, r, base, dark, light, tuftHi, tuftMid, tuftLo, n, tall) {
  c.rect(0, 0, 16, 16, base)
  patches(c, r, 3, dark, 3, 2, 0.5)
  patches(c, r, 2, light, 3, 2, 0.35)
  for (let i = 0; i < n; i++) tuft(c, ri(r, 0, 16), ri(r, 2, 16), tuftHi, tuftMid, tuftLo, tall && r() < 0.6)
}
for (let i = 0; i < 3; i++) sprite("grass" + i, { w: 16, h: 16 }, (c) => {
  const r = c.rng(50 + i)
  grassTile(c, r, "#8c9c47", "#7f9040", "#9aaa52", "#b8c869", "#9aaa52", "#6c7d34", 7, false)
  if (i === 2) for (let k = 0; k < 1; k++) {                       // hoa dại nhỏ
    const x = ri(r, 2, 14), y = ri(r, 3, 14)
    WRAP((dx, dy) => { c.px(x + dx, y + dy, "#f4d95a"); c.px(x + dx - 1, y + dy, "#fff4d0"); c.px(x + dx + 1, y + dy, "#fff4d0"); c.px(x + dx, y + dy - 1, "#fff4d0"); c.px(x + dx, y + dy + 1, "#fff4d0") })
  }
})
// cỏ năn: vàng-olive, lá dài hơn
for (let i = 0; i < 2; i++) sprite("sedge" + i, { w: 16, h: 16 }, (c) => {
  const r = c.rng(60 + i)
  grassTile(c, r, "#a59b4a", "#968d40", "#b3a957", "#d3c776", "#bbaf5c", "#7e7536", 8, true)
})

// nền rừng tràm: lá khô, rêu, cành mục
sprite("wood0", { w: 16, h: 16 }, (c) => woodFloor(c, c.rng(80)))
sprite("wood1", { w: 16, h: 16 }, (c) => woodFloor(c, c.rng(81)))
function woodFloor(c, r) {
  c.rect(0, 0, 16, 16, "#62793a")
  patches(c, r, 3, "#566b32", 3, 2, 0.55)                          // rêu / bóng tán
  patches(c, r, 2, "#6f8741", 3, 2, 0.35)
  for (let i = 0; i < 9; i++) {                                    // lá tràm rụng: nét chéo ngắn
    const x = ri(r, 0, 16), y = ri(r, 0, 16), col = ["#8a9d4f", "#4f6330", "#8a7845", "#7b6a3a"][ri(r, 0, 4)]
    WRAP((dx, dy) => { c.px(x + dx, y + dy, col); c.px(x + dx + 1, y + dy + 1, col) })
  }
  for (let i = 0; i < 2; i++) { const x = ri(r, 1, 12), y = ri(r, 1, 14); WRAP((dx, dy) => { c.hline(x + dx, y + dy, 4, "#6c5a35"); c.hline(x + dx, y + dy - 1, 3, "#8a7845") }) }  // cành khô nhỏ
}

// đất lau sậy: bùn ướt + gốc sậy
for (let i = 0; i < 2; i++) sprite("reedbed" + i, { w: 16, h: 16 }, (c) => {
  const r = c.rng(70 + i)
  mudWet(c, r, i)
  for (let k = 0; k < 8; k++) {
    const x = ri(r, 0, 16), y = ri(r, 4, 16), l = ri(r, 3, 6)
    WRAP((dx, dy) => {
      for (let j = 0; j < l; j++) c.px(x + dx, y + dy - j, j % 2 ? "#7a8c3c" : "#93a64c")
      c.px(x + dx + 1, y + dy, "#3d3022"); c.px(x + dx + 1, y + dy - 1, "#566a2b")
    })
  }
})

// ---------- hoa súng ----------
function pad(c, cx, cy, r, notch, flower) {
  WRAP((dx, dy) => {
    const X = cx + dx, Y = cy + dy
    c.circ(X + 1, Y + 1, r, "#2f6b3a")                            // bóng/viền dưới phải
    c.circ(X, Y, r, "#3f8040")
    c.circ(X - 1, Y - 1, Math.max(1, r - 2), "#5a9f4c")
    c.px(X - 2, Y - 2, "#86c46a")
    c.line(X, Y, X + (notch ? r : -r), Y + (notch ? 0 : 0), "#33703a")  // gân lá
    if (notch) { c.px(X + r, Y, "#4a9696"); c.px(X + r - 1, Y - 1, "#4a9696"); c.px(X + r - 1, Y, "#4a9696"); c.px(X + r, Y - 1, "#4a9696") }   // khuyết
    if (flower) {
      c.px(X - 1, Y - 1, "#e27fa6"); c.px(X + 1, Y - 1, "#e27fa6"); c.px(X - 1, Y + 1, "#e27fa6"); c.px(X + 1, Y + 1, "#e27fa6")
      c.px(X, Y - 1, "#f2a3c0"); c.px(X - 1, Y, "#f2a3c0"); c.px(X + 1, Y, "#f2a3c0"); c.px(X, Y + 1, "#f2a3c0")
      c.px(X, Y, "#f7de6a")
    }
  })
}
for (let i = 0; i < 2; i++) sprite("lotus" + i, { w: 16, h: 16 }, (c) => {
  const r = c.rng(90 + i)
  c.rect(0, 0, 16, 16, "#4a9696")
  patches(c, r, 2, "#418c8e", 3, 2, 0.5)
  ripples(c, r, 2, "#68b3af", "#3c8587", null, [3, 4])
  const spots = i ? [[3, 4], [11, 5], [7, 12]] : [[4, 5], [11, 10], [5, 12]]
  spots.forEach(([x, y], k) => pad(c, x, y, 2 + (k === 1 ? 1 : 0), k !== 1, r() < 0.85 && k !== 2))
})

// ---------- ván gỗ (bến thuyền + cầu): liền mạch cả hai chiều vì cầu rộng nhiều ô ----------
sprite("plank", { w: 16, h: 16 }, (c) => {
  const r = c.rng(1)
  const joints = [5, 13, 9, 2]                                       // mối nối so le giữa các hàng ván
  for (let row = 0; row < 4; row++) {
    const y = row * 4, j = joints[row]
    c.rect(0, y, 16, 4, row % 2 ? "#946a3b" : "#9a7040")
    c.hline(0, y, 16, "#b9904f")                                     // mép trên sáng
    c.hline(0, y + 3, 16, "#6c4a28")                                 // khe giữa 2 hàng ván
    for (let k = 0; k < 2; k++) { const gx = ri(r, 0, 16); c.hline(gx, y + 1 + k, 3 + k, "#865c34") }   // thớ gỗ
    c.vline(j, y, 4, "#5a3d20")                                      // mối nối đầu ván
    if (row % 2 === 0) c.px((j + 1) % 16, y + 1, "#3b2814")             // đinh sát mối nối (thưa, không thành lưới đều)
  }
})

// =====================================================================
// VẬT THỂ
// =====================================================================

// ---------- cây tràm (tán nhìn từ trên xuống, bóng đổ xuống dưới-phải) ----------
function tramTree(c, n, R, seed) {
  const r = c.rng(seed), cx = n / 2 - 1, cy = n / 2 - 1
  const blobs = []
  for (let i = 0; i < 7; i++) blobs.push([cx + (r() - .5) * R * .9, cy + (r() - .5) * R * .9, R * (.42 + r() * .26)])
  blobs.sort((a, b) => a[1] - b[1])
  // bóng đổ trên mặt đất (bán trong suốt)
  for (const [x, y, rr] of blobs) c.circ(Math.round(x + 2), Math.round(y + 3), Math.round(rr), "#1c2a1466")
  // tán: viền tối -> thân lá -> mảng sáng phía trên-trái
  for (const [x, y, rr] of blobs) c.circ(Math.round(x), Math.round(y), Math.round(rr), "#2b3d1b")
  for (const [x, y, rr] of blobs) c.circ(Math.round(x - .6), Math.round(y - .6), Math.max(1, Math.round(rr - 1)), "#3e5524")
  for (const [x, y, rr] of blobs) c.circ(Math.round(x - 1.2), Math.round(y - 1.4), Math.max(1, Math.round(rr * .66)), "#55702f")
  for (const [x, y, rr] of blobs) c.circ(Math.round(x - 2), Math.round(y - 2.2), Math.max(1, Math.round(rr * .38)), "#74923a")
  // lá tràm mảnh: nét ngắn chéo rải theo nửa sáng
  for (let i = 0; i < R * 4; i++) {
    const x = Math.round(cx + (r() - .5) * R * 1.5 - R * .12), y = Math.round(cy + (r() - .5) * R * 1.5 - R * .12)
    if (!c.is(x, y, "*")) continue
    const hi = (x + y) < (cx + cy) + R * .1
    c.px(x, y, hi ? "#a9c25e" : "#47602a")
    if (hi && r() < .5) c.px(x + 1, y - 1, "#c3d97a")
  }
  if (R < 6) return
  // hoa tràm kem + mảng vỏ trắng thấp thoáng
  for (let i = 0; i < Math.ceil(R / 2); i++) {
    const x = Math.round(cx + (r() - .6) * R * 1.2), y = Math.round(cy + (r() - .6) * R * 1.2)
    if (c.is(x, y, "*")) { c.px(x, y, "#f3ecc6"); c.px(x + 1, y, "#d9d2b8") }
  }
  for (let i = 0; i < Math.ceil(R / 3); i++) {
    const x = Math.round(cx + (r() - .5) * R * 1.0), y = Math.round(cy + (r() - .5) * R * 1.0 + 1)
    if (c.is(x, y, "*")) { c.hline(x, y, 2, "#d9d2b8"); c.px(x + 2, y + 1, "#a89f82") }
  }
}
;[[0, 28, 10, 100], [1, 24, 8, 101], [2, 32, 12, 102]].forEach(([i, n, R, sd]) => sprite("tree" + i, { w: n, h: n }, (c) => tramTree(c, n, R, sd)))
sprite("sapling", { w: 14, h: 14 }, (c) => tramTree(c, 14, 4, 7))

// ---------- lau sậy & cỏ năn: bụi đứng, gốc ở đáy ảnh (origin 0.5,1) ----------
function clump(c, r, w, h, blades, lo, mid, hi, plume) {
  const base = h - 1
  for (let i = 0; i < blades; i++) {
    const bx = Math.round(w / 2 + (i - (blades - 1) / 2) * (w * .7 / blades) + (r() - .5) * 2)
    const bh = Math.round((h - 3) * (.55 + r() * .45)), lean = (r() - .5) * 5
    let px_ = -1
    for (let j = 0; j <= bh; j++) {
      const t = j / bh, x = Math.round(bx + lean * t * t), y = base - j
      c.px(x, y, j > bh * .7 ? mid : lo)
      if (j % 3 === 1 && i % 2 === 0) c.px(x - 1, y, hi)       // mép sáng trái
      px_ = x
    }
    if (plume && i % 3 === 1) { const y = base - bh; c.px(px_, y - 1, plume[0]); c.px(px_ - 1, y - 2, plume[1]); c.px(px_, y - 2, plume[0]); c.px(px_ + 1, y - 1, plume[1]) }
  }
  c.rect(Math.round(w / 2) - 3, base, 7, 1, "#3d3022")              // chân bụi trong bùn
}
for (let i = 0; i < 2; i++) sprite("reed" + i, { w: 16, h: 22 }, (c) => clump(c, c.rng(200 + i), 16, 22, 7 + i, "#5f7a30", "#8aa04a", "#b4c76a", ["#a8794a", "#7d5b36"]))
for (let i = 0; i < 2; i++) sprite("sedgep" + i, { w: 14, h: 12 }, (c) => clump(c, c.rng(300 + i), 14, 12, 7, "#968b40", "#c1b45a", "#e2d78a", null))

// ---------- lục bình trôi ----------
sprite("hyacinth", { w: 18, h: 16 }, (c) => {
  const r = c.rng(1)
  ;[[6, 6, 3], [12, 5, 3], [9, 10, 3]].forEach(([x, y, rr], k) => {
    c.ellipse(x + 1, y + 2, rr + 1, rr, "#2e6a6a66")                 // bóng trên mặt nước
    c.circ(x, y, rr, "#2f6b34"); c.circ(x - 1, y - 1, rr - 1, "#4a8f40"); c.px(x - 1, y - 2, "#8cc464"); c.px(x - 2, y - 1, "#6aae52")
    c.px(x + 1, y + 1, "#b9d86a")                                    // cuống phồng
    if (k !== 1) { c.px(x + 1, y - 1, "#9c7fd6"); c.px(x + 2, y - 1, "#c9b3f0"); c.px(x + 1, y - 2, "#d9c9f7"); c.px(x + 2, y, "#7e62b8") }
  })
})

// ---------- cành gãy & dấu chân sếu ----------
sprite("branch", { w: 18, h: 10 }, (c) => {
  c.line(2, 8, 15, 4, "#4a331b", 2)                                  // thân sẫm (bóng)
  c.line(2, 7, 15, 3, "#7d5c3a"); c.line(2, 6, 15, 2, "#9a7448")     // mặt trên sáng
  c.line(8, 5, 11, 8, "#5b4128"); c.line(11, 3, 13, 0, "#7d5c3a"); c.px(2, 6, "#c6a374"); c.px(1, 7, "#d9d2b8")
  c.px(6, 5, "#d9d2b8"); c.px(9, 4, "#d9d2b8")                        // vỏ tràm bong trắng
  c.px(15, 3, "#3d2a14"); c.px(16, 4, "#3d2a14")
})
sprite("prints", { w: 16, h: 16 }, (c) => {
  ;[[4, 13, 0], [10, 8, 1], [4, 3, 0]].forEach(([x, y, f]) => {      // sếu 3 ngón + ngón sau, dấu lún có mép sáng dưới-phải
    const ox = f ? 1 : 0
    c.line(x + ox, y, x + ox - 2, y - 3, "#3d3022"); c.line(x + ox, y, x + ox, y - 4, "#3d3022"); c.line(x + ox, y, x + ox + 2, y - 3, "#3d3022"); c.px(x + ox, y + 1, "#3d3022")
    c.line(x + ox + 1, y + 1, x + ox + 3, y - 2, "#7b6747")
  })
})

// ---------- sếu đầu đỏ (đầu hướng lên; game xoay theo hướng đi) ----------
sprite("crane", { w: 16, h: 20 }, (c) => {
  c.ellipse(8, 13, 5, 6, "#1c2a1455")
  c.ellipse(8, 11, 5, 7, "#8b949a")                                   // cánh gập: xám đậm ở viền
  c.ellipse(7, 10, 4, 6, "#b3bbbf")
  c.ellipse(7, 9, 3, 5, "#d6dcdf")
  c.vline(8, 5, 12, "#c3cacd")                                        // đường gấp giữa 2 cánh
  c.px(5, 8, "#eef1f2"); c.px(6, 7, "#eef1f2"); c.px(5, 10, "#eef1f2")
  c.line(8, 4, 8, 8, "#c9d0d3", 2)                                    // cổ
  c.vline(8, 5, 4, "#aeb6bb")
  c.vline(4, 14, 5, "#3a3d44"); c.vline(5, 15, 5, "#3a3d44")          // lông bay đen
  c.vline(11, 14, 5, "#3a3d44"); c.vline(12, 15, 4, "#2a2c32")
  c.px(7, 17, "#3a3d44"); c.px(9, 17, "#3a3d44"); c.px(7, 18, "#d98a8a"); c.px(9, 18, "#d98a8a")   // chân hồng
  c.rect(7, 2, 3, 3, "#d2342a"); c.px(7, 2, "#ec5a48"); c.px(8, 2, "#ec5a48")
  c.px(7, 4, "#f4f6f6"); c.px(9, 4, "#f4f6f6")
  c.vline(8, 0, 3, "#e8d8a0"); c.px(8, 0, "#bfae78"); c.px(7, 3, "#2a1a14")
})

// ---------- chim bay (hướng sang phải, 2 khung vỗ cánh) ----------
function flyBird(c, up) {
  c.ellipse(9, 7, 5, 1, "#f1f4f5"); c.hline(5, 8, 9, "#cfd6d9")        // thân dài
  c.rect(14, 6, 2, 1, "#f1f4f5"); c.px(16, 6, "#d2342a"); c.px(17, 6, "#e8d8a0")   // cổ, đầu đỏ, mỏ
  c.hline(0, 7, 4, "#b8c0c4"); c.px(0, 8, "#5e666b")                   // đuôi + chân duỗi
  if (up) {
    c.poly([7, 6, 11, 6, 10, 1, 7, 0], "#eef1f2"); c.poly([7, 8, 11, 8, 10, 13, 7, 13], "#cfd6d9")
    c.line(7, 0, 10, 1, "#2f3238"); c.line(7, 13, 10, 12, "#2f3238"); c.px(7, 1, "#2f3238"); c.px(7, 12, "#2f3238")
  } else {
    c.poly([6, 6, 11, 6, 10, 3, 6, 2], "#eef1f2"); c.poly([6, 8, 11, 8, 10, 11, 6, 11], "#cfd6d9")
    c.line(6, 2, 10, 3, "#2f3238"); c.line(6, 11, 10, 10, "#2f3238"); c.px(6, 3, "#2f3238"); c.px(6, 10, "#2f3238")
  }
}
sprite("bird0", { w: 18, h: 14 }, (c) => flyBird(c, true))
sprite("bird1", { w: 18, h: 14 }, (c) => flyBird(c, false))

// ---------- chòi quan sát: sàn gỗ + mái lá dốc 4 mặt ----------
sprite("shelter", { w: 48, h: 48 }, (c) => {
  const r = c.rng(5)
  c.rect(7, 9, 40, 38, "#1c2a1455")                                  // bóng đổ xuống dưới-phải
  // sàn
  c.rect(4, 4, 40, 42, "#8d6a3c")
  for (let y = 4; y < 46; y += 3) { c.hline(4, y, 40, "#a07846"); c.hline(4, y + 2, 40, "#6c4a28") }
  c.rect(4, 4, 40, 1, "#c29a62"); c.rect(4, 4, 1, 42, "#c29a62"); c.rect(43, 4, 1, 42, "#5e4325"); c.rect(4, 45, 40, 1, "#5e4325")
  // thang xuống phía nam
  c.rect(19, 41, 10, 7, "#7a5a30"); c.vline(19, 41, 7, "#4a321a"); c.vline(28, 41, 7, "#4a321a")
  for (let y = 42; y < 48; y += 2) c.hline(20, y, 8, "#c29a62")
  // mái: 4 mặt, bắc/tây sáng, nam/đông tối
  const N = [3, 3, 45, 3, 33, 19, 15, 19], S = [3, 39, 45, 39, 33, 19, 15, 19], Wf = [3, 3, 15, 19, 3, 39], E = [45, 3, 33, 19, 45, 39]
  c.poly(N, "#a8975a"); c.poly(S, "#6f6038"); c.poly(Wf, "#bba96a"); c.poly(E, "#7d6d41")
  // tranh lợp: từng hàng lá song song mép mái (vạch tối + vạch sáng, đứt quãng cho tự nhiên)
  const inside = (P, x, y) => { let k = false; for (let i = 0, j = P.length - 2; i < P.length; j = i, i += 2) { const xi = P[i], yi = P[i + 1], xj = P[j], yj = P[j + 1]; if ((yi > y) !== (yj > y) && x + .5 < (xj - xi) * (y + .5 - yi) / (yj - yi) + xi) k = !k } return k }
  const courses = (P, vert, hi, lo) => {
    for (let t = 0; t < 44; t += 3) for (let s2 = 0; s2 < 44; s2++) {
      const x = vert ? t : s2, y = vert ? s2 : t, x2 = vert ? t + 1 : s2, y2 = vert ? s2 : t + 1
      if (inside(P, x, y) && r() < .88) c.px(x, y, lo)
      if (inside(P, x2, y2) && r() < .72) c.px(x2, y2, hi)
    }
  }
  courses(N, false, "#bfae6c", "#8a7a45"); courses(S, false, "#8a7849", "#4e4327")
  courses(Wf, true, "#d2c07f", "#9a8a50"); courses(E, true, "#94814c", "#4e4327")
  // đường gờ mái + sống mái
  c.line(3, 3, 15, 19, "#7d6c3a"); c.line(45, 3, 33, 19, "#4e4327"); c.line(3, 39, 15, 19, "#8a7a45"); c.line(45, 39, 33, 19, "#3e3520")
  c.rect(14, 18, 20, 3, "#c9b878"); c.hline(14, 18, 20, "#e2d49a"); c.hline(14, 20, 20, "#8a7a45")
  for (const x of [17, 22, 27, 31]) c.vline(x, 18, 3, "#6a5a30")        // dây buộc sống mái
  // rìa mái xơ xác
  for (let x = 3; x < 45; x += 2) { if (r() < .8) c.px(x, 2, "#6a5a30"); if (r() < .8) c.px(x, 40, "#3e3520") }
  for (let y = 3; y < 40; y += 2) { if (r() < .8) c.px(2, y, "#8a7a45"); if (r() < .8) c.px(45, y, "#3e3520") }
})

// ---------- xuồng gỗ ----------
sprite("boat", { w: 26, h: 14 }, (c) => {
  c.ellipse(13, 7, 12, 6, "#ffffff22", true)                         // gợn nước quanh thân
  c.poly([1, 7, 5, 3, 13, 2, 21, 3, 25, 7, 21, 12, 13, 13, 5, 12], "#3a2814")   // viền/bóng
  c.poly([2, 7, 6, 3, 13, 2, 20, 3, 24, 7, 20, 11, 13, 12, 6, 11], "#8a5e34")   // mạn gỗ
  c.hline(6, 3, 14, "#b4824c"); c.hline(3, 5, 4, "#b4824c")
  c.poly([5, 7, 8, 5, 18, 5, 21, 7, 18, 9, 8, 9], "#4a3320")                    // lòng xuồng
  c.hline(8, 5, 10, "#5b4128")
  c.vline(10, 5, 5, "#9a7040"); c.vline(16, 5, 5, "#9a7040")                    // 2 thanh ngồi
  c.line(6, 10, 19, 1, "#6b4a28"); c.px(19, 1, "#9a7448"); c.px(20, 0, "#c29a62")  // mái chèo
})

// ---------- viền bờ: phủ lên ô nước khi sát đất liền (game.js vẽ sau lớp nền) ----------
// bờ phía trên/trái đổ bóng xuống nước (sáng từ trên-trái), bờ phía dưới/phải có vệt bọt sáng
function shoreShadow(c, vert) {
  const P = (i, j, col) => vert ? c.px(i, j, col) : c.px(j, i, col)   // i = khoảng cách tới bờ, j = vị trí dọc bờ
  for (let j = 0; j < 16; j++) {
    P(0, j, "#10343c99"); P(1, j, (j % 2 ? "#10343c66" : "#10343c88")); if (j % 2 === 0) P(2, j, "#10343c44")
  }
  for (let j = 0; j < 16; j++) if (j % 4 === 0) P(3, j, "#10343c33")
}
function shoreFoam(c, vert) {
  const P = (i, j, col) => vert ? c.px(15 - i, j, col) : c.px(j, 15 - i, col)
  for (let j = 0; j < 16; j++) {
    P(0, j, j % 3 === 2 ? "#d9f0ea55" : "#e8f7f299"); if (j % 2 === 0) P(1, j, "#bfe3dc66")
  }
  for (let j = 1; j < 16; j += 5) P(2, j, "#bfe3dc44")
}
sprite("shoreN", { w: 16, h: 16 }, (c) => shoreShadow(c, false))
sprite("shoreW", { w: 16, h: 16 }, (c) => shoreShadow(c, true))
sprite("shoreS", { w: 16, h: 16 }, (c) => shoreFoam(c, false))
sprite("shoreE", { w: 16, h: 16 }, (c) => shoreFoam(c, true))
