// Tràm Chim — NỀN (scene 800x640 = 50x40 ô 16px; game phóng 2x). Vẽ kiểu top-down 3/4:
//   · bờ nước có "vách đất" nhìn thấy ở bờ phía bắc (người xem nhìn từ phía nam), bờ nam chỉ thấy mép cỏ rủ xuống
//   · sáng từ trên-trái → bóng đổ xuống dưới-phải; mặt nước trong suốt (game đặt nước chuyển động bên dưới)
// Bố cục lấy từ TCL (tools/tramchim_layout.px.js do gen_tramchim_map.js sinh ra).

const TL = globalThis.TCL, CW = TL.w, CH = TL.h, PW = CW * 16, PH = CH * 16
const clampN = (v, a, b) => (v < a ? a : v > b ? b : v)
const hsh = (x, y, s) => { let h = (x * 374761393 + y * 668265263 + s * 69069) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295 }
const vnz = (x, y, s) => {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf)
  const a = hsh(xi, yi, s), b = hsh(xi + 1, yi, s), c = hsh(xi, yi + 1, s), d = hsh(xi + 1, yi + 1, s)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}
const BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]
const bay = (x, y) => (BAY[(y & 3) * 4 + (x & 3)] + .5) / 16

// ---------- bảng màu (mỗi chất liệu 4-6 sắc, tối → sáng) ----------
pal({
  // cỏ (khớp GROUND_BASE của các map trước: #6a9f46)
  a: "#3d6b34", b: "#5a8c3d", c: "#6a9f46", d: "#7db554", e: "#9fd35e", f: "#c4ec82",
  // cỏ năn (vàng-olive)
  h: "#7f7a3c", i: "#9d9a4e", j: "#b9b564", k: "#d6cf86", l: "#ece6ac",
  // nền rừng tràm: lá mục + rêu
  p: "#32532f", m: "#3f6a3a", n: "#4c7c40", o: "#5d8e4a",
  // bùn ướt / bùn khô nứt
  q: "#4a3a27", r: "#645036", s: "#7d6744", t: "#9a835c",
  x: "#826a47", u: "#a38a5f", v: "#b9a074", w: "#cfb98c",
  // lối đất
  B: "#8f6a3a", y: "#b58b55", z: "#cba566", A: "#ddbf86", C: "#efdba8",
  // vách đất bờ nước
  D: "#3d2a19", E: "#5c3f25", F: "#7d5a35", G: "#a07a48",
  // ván gỗ
  H: "#5b3a1f", I: "#8a6035", J: "#b08045", K: "#d3a763", L: "#33200f",
  // hoa dại
  Q: "#fffbe8", R: "#f6d452", S: "#ee86a6", T: "#b39af0", U: "#ffffff",
})
const RAMPS = { g: ["a", "b", "c", "d", "e", "f"], s: ["h", "i", "j", "k", "l"], w: ["p", "m", "n", "o"], m: ["q", "r", "s", "t"], d: ["x", "u", "v", "w"], p: ["B", "y", "z", "A", "C"] }
const DARKER = {}, LIGHTER = {}
for (const k in RAMPS) RAMPS[k].forEach((key, i, a) => { DARKER[key] = a[Math.max(0, i - 1)]; LIGHTER[key] = a[Math.min(a.length - 1, i + 1)] })
ramps("abcdef", "hijkl", "pmno", "qrst", "xuvw", "BzyAC", "DEFG", "HIJK")

// ---------- tô nhiều tông bằng dither Bayer (không dùng nhiễu rải rác) ----------
function toneKey(keys, n, x, y) {                          // n ∈ [0,1] → khoá màu, ranh giới giữa 2 tông được dither
  const v = clampN((n - .5) * 1.9 + .5, 0, .999) * (keys.length - 1), i = Math.floor(v), f = v - i
  return f > bay(x, y) ? keys[i + 1] : keys[i]
}

// ---------- các trường mịn từ lưới ô (nội suy song tuyến + méo miền → bờ cong tự nhiên, không lộ ô vuông) ----------
const rows = TL.rows
const IND = (test) => { const a = new Float32Array(CW * CH); for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) a[y * CW + x] = test(rows[y][x]) ? 1 : 0; return a }
const samp = (a, fx, fy) => {
  fx -= .5; fy -= .5
  const x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0
  const g = (x, y) => a[clampN(y, 0, CH - 1) * CW + clampN(x, 0, CW - 1)]
  return (g(x0, y0) * (1 - tx) + g(x0 + 1, y0) * tx) * (1 - ty) + (g(x0, y0 + 1) * (1 - tx) + g(x0 + 1, y0 + 1) * tx) * ty
}
const I_water = IND(ch => "~-o=".includes(ch)), I_deep = IND(ch => ch === "~"), I_path = IND(ch => ch === "p")
const I_mud = IND(ch => "mr".includes(ch)), I_dry = IND(ch => ch === "d"), I_wood = IND(ch => ch === "w"), I_sedge = IND(ch => ch === "s")
const warpX = (x, y) => x + (vnz(x / 17, y / 17, 1) - .5) * 9 + (vnz(x / 6, y / 6, 2) - .5) * 3.5
const warpY = (x, y) => y + (vnz(x / 17 + 31, y / 17, 3) - .5) * 9 + (vnz(x / 6, y / 6 + 17, 4) - .5) * 3.5

// ---------- bóng đổ của cây / chòi / bụi lên nền (elip, mềm bằng dither) ----------
const SHAD = { tram0: [14, 6, 6, 0], tram1: [11, 5, 5, 0], tram2: [17, 7, 7, 0], sapling: [6, 3, 3, 0], bush0: [9, 3, 2, 0], bush1: [9, 3, 2, 0], hut: [26, 8, 8, 1], rock0: [6, 2, 1, 0], rock1: [7, 3, 1, 0], rock2: [5, 2, 1, 0], stump: [6, 2, 1, 0], haystack: [13, 4, 3, 0], netrack: [14, 3, 3, 0], tram_dead0: [4, 2, 2, 0], tram_dead1: [4, 2, 2, 0], bench: [9, 2, 1, 0], sign: [6, 2, 2, 0], lampost: [4, 2, 2, 0], kiosk: [24, 5, 4, 0], infoboard: [9, 3, 2, 0] }
const shadowList = TL.objs.filter(o => SHAD[o.k]).map(o => { const s = SHAD[o.k]; return [o.x / 2 + s[2], o.y / 2 - 1 + s[3], s[0], s[1]] })
const shadowAt = (x, y) => {
  let m = 0
  for (const [cx, cy, rx, ry] of shadowList) {
    const dx = (x - cx) / rx, dy = (y - cy) / ry
    if (dx > 1.1 || dx < -1.1 || dy > 1.1 || dy < -1.1) continue
    const d = dx * dx + dy * dy; if (d < 1) m = Math.max(m, 1 - d)
  }
  return m
}

// ---------- chuyển màu bán trong suốt cho mặt nước ----------
const hex2 = (n) => (n < 16 ? "0" : "") + n.toString(16)
const rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
const TINT = rgb("#8fe6d4"), SHADOW = rgb("#0c3a46"), FOAM = rgb("#f2fdf6"), SANDY = rgb("#d9dc9c"), PLANKSH = rgb("#0b2e38")
function over(layers) {                                       // layers: [[rgb, alpha], ...] vẽ từ dưới lên → "#rrggbbaa"
  let r = 0, g = 0, b = 0, a = 0
  for (const [c, al] of layers) { if (al <= 0) continue; const na = al + a * (1 - al); r = (c[0] * al + r * a * (1 - al)) / na; g = (c[1] * al + g * a * (1 - al)) / na; b = (c[2] * al + b * a * (1 - al)) / na; a = na }
  if (a <= .01) return null
  return "#" + hex2(Math.round(r)) + hex2(Math.round(g)) + hex2(Math.round(b)) + hex2(Math.round(a * 255))
}
const chamfer = (src, W, H, cap) => {                         // khoảng cách (ô 3-4) tới các pixel src===1
  const D = new Uint8Array(W * H).fill(cap), BIG = cap
  for (let i = 0; i < W * H; i++) if (src[i]) D[i] = 0
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; let v = D[i]
    if (x > 0) v = Math.min(v, D[i - 1] + 3); if (y > 0) { v = Math.min(v, D[i - W] + 3); if (x > 0) v = Math.min(v, D[i - W - 1] + 4); if (x < W - 1) v = Math.min(v, D[i - W + 1] + 4) }
    D[i] = Math.min(v, BIG) }
  for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) { const i = y * W + x; let v = D[i]
    if (x < W - 1) v = Math.min(v, D[i + 1] + 3); if (y < H - 1) { v = Math.min(v, D[i + W] + 3); if (x < W - 1) v = Math.min(v, D[i + W + 1] + 4); if (x > 0) v = Math.min(v, D[i + W - 1] + 4) }
    D[i] = Math.min(v, BIG) }
  return D
}

// ---------- ván gỗ: nhận diện từng cụm ô '=' (cầu / bến), hướng ván vuông góc hướng đi ----------
const plankComp = new Int16Array(CW * CH).fill(-1), comps = []
for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) if (rows[y][x] === "=" && plankComp[y * CW + x] < 0) {
  const id = comps.length, st = [[x, y]], c = { x0: x, x1: x, y0: y, y1: y }; plankComp[y * CW + x] = id
  while (st.length) { const [a, b] = st.pop(); c.x0 = Math.min(c.x0, a); c.x1 = Math.max(c.x1, a); c.y0 = Math.min(c.y0, b); c.y1 = Math.max(c.y1, b)
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const p = a + dx, q = b + dy; if (p >= 0 && q >= 0 && p < CW && q < CH && rows[q][p] === "=" && plankComp[q * CW + p] < 0) { plankComp[q * CW + p] = id; st.push([p, q]) } } }
  c.vert = (c.y1 - c.y0) >= (c.x1 - c.x0)                      // dải chạy dọc (bắc-nam) → ván nằm ngang
  comps.push(c)
}
const plankId = (x, y) => { const cx = x >> 4, cy = y >> 4; return cx >= 0 && cy >= 0 && cx < CW && cy < CH ? plankComp[cy * CW + cx] : -1 }
// pixel thuộc ván = ô ván + 5px kéo dài hai đầu (đè lên mép bờ cho khỏi hở)
function plankOwner(x, y) {
  let id = plankId(x, y); if (id >= 0) return id
  for (let k = 1; k <= 5; k++) {
    for (const [dx, dy] of [[k, 0], [-k, 0], [0, k], [0, -k]]) { const j = plankId(x + dx, y + dy); if (j >= 0) { const c = comps[j]; if ((c.vert && dy !== 0) || (!c.vert && dx !== 0)) return j } }
  }
  return -1
}

// ---------- NỀN ----------
scene("_ground", { w: PW, h: PH }, (c) => {
  const N = PW * PH
  const Wf = new Float32Array(N), Df = new Float32Array(N), Pf = new Float32Array(N), Mf = new Float32Array(N), Xf = new Float32Array(N), Gf = new Float32Array(N), Sf = new Float32Array(N)
  for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) {
    const i = y * PW + x, fx = warpX(x + .5, y + .5) / 16, fy = warpY(x + .5, y + .5) / 16
    Wf[i] = samp(I_water, fx, fy); Df[i] = samp(I_deep, fx, fy); Pf[i] = samp(I_path, fx, fy); Mf[i] = samp(I_mud, fx, fy); Xf[i] = samp(I_dry, fx, fy); Gf[i] = samp(I_wood, fx, fy); Sf[i] = samp(I_sedge, fx, fy)
  }
  const own = new Int16Array(N), isW = new Uint8Array(N), isDeep = new Uint8Array(N), isL = new Uint8Array(N)
  for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) {
    const i = y * PW + x, o = plankOwner(x, y); own[i] = o
    const w = Wf[i] > .5 && o < 0; isW[i] = w ? 1 : 0; isDeep[i] = w && Df[i] > .5 ? 1 : 0; isL[i] = !w && o < 0 ? 1 : 0
  }
  const dLand = chamfer(isL, PW, PH, 60), dWater = chamfer(isW, PW, PH, 40), dDeep = chamfer(isDeep, PW, PH, 90)
  // lớp đất: path > bùn khô > bùn ướt > rừng > cỏ năn > cỏ
  const kindAtPx = (i) => (Pf[i] > .5 ? "p" : Xf[i] > .5 ? "d" : Mf[i] > .5 ? "m" : Gf[i] > .5 ? "w" : Sf[i] > .5 ? "s" : "g")
  // vách bờ bắc: đếm số pixel nước liên tiếp phía dưới mép đất theo từng cột
  const wallTop = new Uint8Array(N), wallCnt = new Uint8Array(N)
  for (let x = 0; x < PW; x++) {
    let cnt = 0, top = 0
    for (let y = 0; y < PH; y++) { const i = y * PW + x
      if (isL[i]) { cnt = 0; top = kindAtPx(i) === "m" || kindAtPx(i) === "d" ? 2 : 1 }
      else if (isW[i] && cnt >= 0) { cnt++; wallCnt[i] = Math.min(cnt, 255); wallTop[i] = top }
      else { cnt = -1 }                                         // gặp ván: ngắt
      if (own[i] >= 0) cnt = -1
      if (isL[i]) cnt = 0
    }
  }
  const wallH = (x) => 4 + Math.floor(hsh(x >> 1, 7, 11) * 2.2)  // 4-5 px, thay đổi chậm theo cột
  const plankPaint = (x, y, id) => {
    const cm = comps[id], lx = x - cm.x0 * 16, ly = y - cm.y0 * 16, spanW = (cm.x1 - cm.x0 + 1) * 16, spanH = (cm.y1 - cm.y0 + 1) * 16
    const along = cm.vert ? ly : lx, across = cm.vert ? lx : ly, width = cm.vert ? spanW : spanH, length = cm.vert ? spanH : spanW
    if (across < 2 || across >= width - 2) return across < 2 ? (cm.vert ? (lx < 1 ? "L" : "H") : (ly < 1 ? "K" : "H")) : (across >= width - 1 ? "L" : "H")   // dầm dọc hai bên
    const b = Math.floor((along + 4) / 4), r = (along + 4) % 4, tone = ["I", "J", "I", "K", "J", "I"][Math.floor(hsh(b, id, 5) * 6)]
    if (r === 3) return "L"                                                     // khe giữa hai ván
    const joint = Math.floor(hsh(b, id, 6) * (width - 12)) + 6
    if (across === joint) return "H"                                           // mối nối đầu ván
    if (across === joint + 1) return "K"
    if ((across === 4 || across === width - 5) && r === 1 && hsh(b, id, 7) < .55) return "L"   // đinh
    if (r === 0) return tone === "K" ? "K" : "K"                                // mép trên sáng
    return tone
  }
  for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) {
    const i = y * PW + x, sh = shadowAt(x, y), shDither = sh > 0 && sh > bay(x, y) * .85
    // ---- ván ----
    if (own[i] >= 0) { c.px(x, y, plankPaint(x, y, own[i])); continue }
    // ---- nước: chỉ vẽ lớp phủ bán trong suốt, nước thật nằm dưới (game) ----
    if (isW[i]) {
      const cnt = wallCnt[i], H = wallH(x), top = wallTop[i], dl = dLand[i] / 3
      if (cnt >= 1 && cnt <= H) {                                               // vách đất bờ bắc (nhìn thấy)
        const t = cnt, last = t === H
        let key
        if (t === 1) key = top === 2 ? "q" : (hsh(x, y, 3) < .5 ? "a" : "b")      // mép cỏ / bùn rủ xuống
        else if (last) key = "D"
        else {
          key = t === 2 ? (top === 2 ? "r" : "G") : (t === H - 1 ? "E" : "F")
          if (top === 2) key = t === 2 ? "s" : t === H - 1 ? "q" : "r"
          if (hsh(x, 5, 9) < .2 && t > 2) key = top === 2 ? "q" : "D"                     // rễ cây thả xuống
          else if ((x * 7 + t * 3) % 11 === 0 && hsh(x, t, 4) < .5) key = top === 2 ? "t" : "G"     // sỏi
        }
        c.px(x, y, key); continue
      }
      const dd = dDeep[i] / 3, shallow = !isDeep[i]
      let a1 = 0
      if (shallow) {
        const t = clampN(dd / 9, 0, 1), lv = [.1, .2, .32, .44, .55], v = t * (lv.length - 1), k = Math.min(lv.length - 2, Math.floor(v)), f = v - k
        a1 = f > bay(x, y) ? lv[k + 1] : lv[k]
        if (dl < 5) a1 = Math.min(.66, a1 + .1 * (1 - dl / 5))
      }
      let a2 = 0                                                              // bóng đổ
      if (cnt > H && cnt <= H + 4) a2 = [.44, .3, .18, .08][cnt - H - 1]      // vách đổ bóng xuống mặt nước
      if (dl <= 3 && (isL[i - 1] || isL[i - 2])) a2 = Math.max(a2, .3)         // bờ tây đổ bóng sang đông
      if (sh > 0 && shDither) a2 = Math.max(a2, .34)
      for (let k = 1; k <= 4 && a2 < .3; k++) { const j = plankOwner(x - k, y - k - 1); if (j >= 0) { a2 = Math.max(a2, .36 - k * .05); break } }   // bóng ván
      let foam = 0
      if (dl <= 1.1 && (isL[i + 1] || isL[i + PW] === 1 && false)) foam = .55 // bọt sáng sát bờ đông
      if (dl <= 1.1 && isL[i + PW]) foam = Math.max(foam, .5)                  // bờ nam (nước ở phía bắc của đất)
      let sand = 0
      if (shallow && dl <= 3.2 && bay(x + 1, y + 2) < .32) sand = .26
      const layers = [[TINT, a1], [SANDY, sand], [SHADOW, a2], [FOAM, foam]]
      const hx = over(layers); if (hx) c.px(x, y, hx)
      continue
    }
    // ---- đất ----
    const kind = kindAtPx(i), ramp = RAMPS[kind]
    const nA = vnz(x / 13, y / 13, 21) * .62 + vnz(x / 5.5, y / 5.5, 22) * .38
    let key
    if (kind === "g") key = toneKey(["b", "c", "d"], nA, x, y)
    else if (kind === "s") key = toneKey(["i", "j", "k"], nA, x, y)
    else if (kind === "w") key = toneKey(["p", "m", "n"], nA, x, y)
    else if (kind === "m") { key = toneKey(["q", "r", "s"], nA, x, y); if (vnz(x / 4, y / 12, 31) > .74 && bay(x, y) < .6) key = "t" }   // vệt bùn bóng
    else if (kind === "d") {
      // bùn khô nứt kiểu Voronoi: lưới điểm lệch, mép nứt tối, mép trên-trái sáng
      const g = 7, gx = Math.floor(x / g), gy = Math.floor(y / g); let d1 = 99, d2 = 99
      for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) { const sx = (gx + ox) * g + hsh(gx + ox, gy + oy, 41) * g, sy = (gy + oy) * g + hsh(gx + ox, gy + oy, 42) * g, d = Math.hypot(x - sx, y - sy); if (d < d1) { d2 = d1; d1 = d } else if (d < d2) d2 = d }
      key = d2 - d1 < .6 ? "x" : d2 - d1 < 1.3 && (x + y) % 2 ? "w" : toneKey(["u", "v", "w"], nA * .8 + .1, x, y)
    }
    else { // lối đất: tông chính + mép loang dần vào cỏ (dither), vệt xe/bước chân nhẹ
      key = toneKey(["y", "z", "A"], nA * .9 + .08, x, y)
      const e = clampN(dWater[i], 0, 40)
    }
    // mép nước: đường viền tối + mép sáng
    const dw = dWater[i]
    if (dw <= 3) {                                                     // sát nước (≤1px)
      const southWater = isW[i + PW] || isW[i + PW * 2], northWater = isW[i - PW], westW = isW[i - 1] || isW[i - 2], eastW = isW[i + 1] || isW[i + 2]
      if (southWater) key = kind === "m" || kind === "d" ? "q" : kind === "p" ? "B" : "a"                           // mép cỏ rủ xuống bờ phía bắc → viền tối
      else if (northWater) key = kind === "m" || kind === "d" ? "r" : kind === "p" ? "y" : (bay(x, y) < .5 ? "b" : "c")        // bờ nam: cỏ gối lên nước
      else if (westW || eastW) key = kind === "m" || kind === "d" ? "r" : kind === "p" ? "y" : "b"
    } else if (dw <= 6 && (kind === "g" || kind === "s") && bay(x, y) < .22 * (1 - (dw - 3) / 4)) key = DARKER[key]   // cỏ gần nước sẫm & ẩm hơn
    // cạnh lối đất: viền tối mờ
    if (kind === "p") { let edge = false; for (const [dx, dy] of [[2, 0], [-2, 0], [0, 2], [0, -2]]) { const j = (y + dy) * PW + (x + dx); if (j >= 0 && j < N && Pf[j] <= .5 && Wf[j] <= .5) edge = true } if (edge && bay(x + 1, y) < .55) key = "B" }
    if (shDither) key = DARKER[key]
    c.px(x, y, key)
  }

  // dây thừng lan can nối các cọc dọc ván gỗ (vẽ trên nền; cọc là sprite đứng)
  {
    const posts = TL.objs.filter(o => o.k === "post").map(o => [Math.round(o.x / 2), Math.round(o.y / 2) - 11])
    for (const a of posts) for (const b of posts) {
      if (a === b || Math.abs(a[0] - b[0]) > 2 || b[1] - a[1] < 14 || b[1] - a[1] > 40) continue         // cùng một phía, cọc kế tiếp theo chiều dọc
      const n = b[1] - a[1]
      for (let i = 0; i <= n; i++) { const y = a[1] + i, sag = Math.round(Math.sin(i / n * Math.PI) * 2); c.px(a[0] + Math.round((b[0] - a[0]) * i / n) + 1, y + 0, "z"); c.px(a[0] + Math.round((b[0] - a[0]) * i / n) + 1, y + 0 + (i % 5 === 0 ? 1 : 0), "B") }
    }
    for (const a of posts) for (const b of posts) {                                                         // cầu ngang (bến, cầu đông): nối theo chiều ngang
      if (a === b || Math.abs(a[1] - b[1]) > 2 || b[0] - a[0] < 14 || b[0] - a[0] > 40) continue
      const n = b[0] - a[0]
      for (let i = 0; i <= n; i++) { const sag = Math.round(Math.sin(i / n * Math.PI) * 2); c.px(a[0] + i, a[1] + sag, "z"); c.px(a[0] + i, a[1] + sag + 1, "B") }
    }
  }
})

// =====================================================================
// CHI TIẾT BỀ MẶT: cỏ lá, hoa dại, lá khô, sỏi… (cọ nhỏ rải đúng chỗ, mỗi nét đều có lý do)
// =====================================================================
sprite("_t0", `
f.e
.e.
.a.`)
sprite("_t1", `
f..e.
.e.e.
.ede.
..a..`)
sprite("_t2", `
.f.e.f
.e.e.e
..eae.
..aa..`)
sprite("_t3", `
e.
ea
.a`)
sprite("_hS", `
.Q.
QRQ
.Q.`)
sprite("_hY", `
.R.
RQR
.R.`)
sprite("_hP", `
.S.
SQS
.S.`)
sprite("_hT", `
.T.
TQT
.T.`)
sprite("_hd", "Q")
sprite("_sedgeT", `
l.k.l
.k.k.
.jkj.
..h..`)
sprite("_sedgeT2", `
.l
kk
.h`)
sprite("_leaf0", "kh")
sprite("_leaf1", `
.o
n.`)
sprite("_moss", `
.o.
ono
.n.`)
sprite("_peb", `
Cy
yB`)
sprite("_peb2", "Cy")
sprite("_mudp", `
.#.
#.#`.replace(/#/g, "t"))
sprite("_shine", "tt")
sprite("_crack2", "xx")
sprite("_shroom", `
.S.
SQS
.w.`)

scene("ground", { w: PW, h: PH },
  stamp("_ground", 0, 0),
  scatter("_t*", 0, 0, PW, PH, 2300, { on: "bcd", clip: true, rflip: "x" }),
  scatter("_sedgeT*", 0, 0, PW, PH, 1500, { on: "ijk", clip: true, rflip: "x" }),
  scatter("_t3", 0, 0, PW, PH, 700, { on: "mn", clip: true, rflip: "x" }),
  scatter("_leaf*", 0, 0, PW, PH, 700, { on: "pmn", clip: true, rflip: "xy" }),
  scatter("_moss", 0, 0, PW, PH, 160, { on: "pm", clip: true }),
  scatter("_hS", 0, 0, PW, PH, 120, { on: "cd", clip: true }),
  scatter("_hY", 0, 0, PW, PH, 120, { on: "cdj", clip: true }),
  scatter("_hP", 0, 0, PW, PH, 70, { on: "cd", clip: true }),
  scatter("_hT", 0, 0, PW, PH, 60, { on: "cd", clip: true }),
  scatter("_hd", 0, 0, PW, PH, 260, { on: "cd", clip: true }),
  scatter("_hP", 290, 500, 220, 140, 26, { on: "cd", clip: true }),
  scatter("_hY", 290, 500, 220, 140, 26, { on: "cdj", clip: true }),
  scatter("_hS", 290, 500, 220, 140, 22, { on: "cd", clip: true }),
  scatter("_hT", 290, 500, 220, 140, 14, { on: "cd", clip: true }),
  scatter("_peb", 0, 0, PW, PH, 220, { on: "yzA", clip: true, rflip: "x" }),
  scatter("_peb2", 0, 0, PW, PH, 260, { on: "yzArstuvw", clip: true, rflip: "xy" }),
  scatter("_mudp", 0, 0, PW, PH, 260, { on: "qr", clip: true }),
  scatter("_shine", 0, 0, PW, PH, 120, { on: "rs", clip: true }),
  scatter("_shroom", 0, 0, PW, PH, 18, { on: "pm", clip: true })
)
