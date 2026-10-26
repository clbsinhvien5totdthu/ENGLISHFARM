// Tràm Chim — SẾU, CHÒI, XUỒNG, ĐỒ VẬT, NƯỚC, HIỆU ỨNG (3/4, sáng từ trên-trái)

const OL = "#2b3340"
// ---------- sếu đầu đỏ / cò trắng: 3 hướng (s = nhìn thẳng, n = quay lưng, e = nhìn ngang) x 2 dáng bước ----------
const CRANE = { body: ["#7f8c95", "#aab5bc", "#d2dade", "#eef2f4"], head: "#d8352a", headHi: "#f26a58", beak: "#d9cf9c", leg: "#b96b78", legD: "#8a4a58", tip: "#2b2e35", eye: "#2a1a14" }
const EGRET = { body: ["#b9c2c8", "#dfe5e8", "#f4f6f7", "#ffffff"], head: "#f4f6f7", headHi: "#ffffff", beak: "#e8b83a", leg: "#3a3d44", legD: "#2a2c32", tip: "#d9dfe2", eye: "#2a1a14" }
function bird(c, dir, step, P, k) {                                  // k = tỉ lệ (1 = sếu, .72 = cò)
  const W = c.w, mx = Math.floor(W / 2), S = (v) => Math.round(v * k), top = 2
  const legTop = top + S(30), legLen = S(12), lift = step ? 2 : 0
  const leg = (x, dy) => { c.vline(x, legTop, legLen - dy, P.leg); c.px(x, legTop + legLen - dy, P.legD); c.hline(x - 1, legTop + legLen - dy + 1, 3, P.legD) }
  if (dir === "e") {
    leg(mx - 2, step ? 0 : 0); leg(mx + 2, lift)
    c.ellipse(mx - 1, top + S(24), S(10), S(6), P.body[0]); c.ellipse(mx - 2, top + S(23), S(9), S(5), P.body[1]); c.ellipse(mx - 3, top + S(22), S(6), S(3), P.body[2])
    c.poly([mx - S(10), top + S(22), mx - S(16), top + S(27), mx - S(10), top + S(28)], P.tip)       // lông đuôi / cánh đen
    c.hline(mx - S(7), top + S(25), S(9), P.body[0])                                                   // đường gấp cánh
    c.poly([mx + S(6), top + S(21), mx + S(8), top + S(8), mx + S(11), top + S(8), mx + S(9), top + S(22)], P.body[2]); c.vline(mx + S(8), top + S(10), S(11), P.body[3])   // cổ
    c.rect(mx + S(8), top + S(3), S(4), S(5), P.head); c.px(mx + S(8), top + S(3), P.headHi); c.px(mx + S(9), top + S(5), P.eye)
    c.poly([mx + S(12), top + S(5), mx + S(19), top + S(7), mx + S(12), top + S(8)], P.beak)
    c.hline(mx + S(8), top + S(8), S(3), P.body[3])                                                   // má trắng
  } else if (dir === "s") {
    leg(mx - 3, 0); leg(mx + 3, lift)
    c.ellipse(mx, top + S(23), S(8), S(8), P.body[0]); c.ellipse(mx - 1, top + S(22), S(7), S(7), P.body[1]); c.ellipse(mx - 1, top + S(20), S(4), S(5), P.body[2])
    c.vline(mx, top + S(15), S(10), P.body[3])
    c.poly([mx - S(8), top + S(26), mx - S(6), top + S(32), mx - S(3), top + S(30)], P.tip); c.poly([mx + S(8), top + S(26), mx + S(6), top + S(32), mx + S(3), top + S(30)], P.tip)
    c.rect(mx - 1, top + S(4), 3, S(14), P.body[2]); c.vline(mx - 1, top + S(4), S(14), P.body[3]); c.vline(mx + 1, top + S(4), S(14), P.body[1])
    c.rect(mx - 2, top, 5, S(5), P.head); c.px(mx - 2, top, P.headHi); c.px(mx - 1, top, P.headHi)
    c.px(mx - 1, top + S(3), P.eye); c.px(mx + 1, top + S(3), P.eye); c.hline(mx - 2, top + S(5), 5, P.body[3])
    c.rect(mx, top + S(5), 1, S(3), P.beak); c.px(mx, top + S(7), "#a89a62")
  } else {
    leg(mx - 3, 0); leg(mx + 3, lift)
    c.ellipse(mx, top + S(22), S(8), S(8), P.body[1]); c.ellipse(mx - 1, top + S(21), S(7), S(7), P.body[2]); c.ellipse(mx - 2, top + S(19), S(4), S(4), P.body[3])
    c.vline(mx, top + S(14), S(14), P.body[0]); c.vline(mx - 3, top + S(16), S(10), P.body[0]); c.vline(mx + 3, top + S(16), S(10), P.body[0])
    c.poly([mx - S(7), top + S(28), mx - S(4), top + S(35), mx, top + S(31), mx + S(4), top + S(35), mx + S(7), top + S(28)], P.tip)  // lông bay đen + đuôi
    c.rect(mx - 1, top + S(4), 3, S(12), P.body[1]); c.vline(mx - 1, top + S(4), S(12), P.body[2])
    c.rect(mx - 2, top, 5, S(6), P.head); c.px(mx - 2, top, P.headHi); c.px(mx - 1, top, P.headHi)
  }
}
for (const [nm, P, k, w, h] of [["crane", CRANE, 1, 30, 48], ["egret", EGRET, .72, 24, 36]]) for (const d of ["s", "n", "e"]) for (const st of [0, 1])
  sprite(`${nm}_${d}${st}`, { w, h, outline: OL }, (c) => bird(c, d, st, P, k))

// chim bay (nhìn ngang, hướng sang phải, 3 khung vỗ cánh)
function fly(c, ph) {
  const up = [10, 4, -2][ph], wy = [-9, -3, 5][ph]
  c.ellipse(15, 11, 8, 3, "#d9dfe2"); c.ellipse(14, 10, 7, 2, "#f4f6f7")
  c.poly([22, 10, 29, 9, 29, 11, 22, 12], "#e9eef0"); c.rect(28, 8, 3, 3, "#d8352a"); c.px(31, 9, "#d9cf9c"); c.px(32, 9, "#d9cf9c")       // cổ + đầu đỏ + mỏ
  c.line(7, 11, 0, 13, "#b96b78")                                                                                                         // chân duỗi
  c.poly([8, 9, 14, 9, 19 - Math.round(wy * .2), 11 + wy, 7 - Math.round(wy * .2), 11 + wy], "#eef2f4")
  c.poly([6, 9, 14, 9, 16 - Math.round(wy * .2), 11 + wy, 5, 11 + wy], "#aab5bc")
  c.line(6, 11 + wy, 16 - Math.round(wy * .2), 11 + wy, "#2b2e35", 2)                                                                     // mút cánh đen
  c.hline(2, 10, 5, "#2b2e35")
}
for (let i = 0; i < 3; i++) sprite("bird" + i, { w: 36, h: 26 }, (c) => fly(c, i))

// ---------- chòi quan sát cao cẳng trên đảo (mái lá, sàn gỗ, thang, đèn lồng) ----------
sprite("hut", { w: 76, h: 104, outline: "#2c2013" }, (c) => {
  const r = c.rng(5), mx = 38
  // chân cột tràm đứng trong nước + giằng chéo
  c.ellipse(mx, 99, 30, 4, "#0c3a4655")
  for (const x of [14, 62]) { c.rect(x - 2, 62, 5, 38, "#8d6a3c"); c.vline(x - 2, 62, 38, "#b48b52"); c.vline(x + 2, 62, 38, "#5e4325"); c.hline(x - 3, 99, 7, "#3d2a16") }
  for (const x of [30, 46]) { c.rect(x - 2, 62, 4, 30, "#7a5a32"); c.vline(x - 2, 62, 30, "#9c7646"); c.vline(x + 1, 62, 30, "#4e381d") }
  c.line(16, 72, 60, 92, "#6c4a28", 2); c.line(60, 72, 16, 92, "#6c4a28", 2); c.hline(13, 80, 51, "#6c4a28")
  // thang trèo ở giữa phía nam
  c.rect(33, 62, 2, 36, "#a07846"); c.rect(41, 62, 2, 36, "#8a6638")
  for (let y = 66; y < 98; y += 5) c.hline(33, y, 10, "#c9a46a")
  // sàn: mặt sàn nhìn từ trên (hình thang) + thành sàn
  c.poly([6, 56, 70, 56, 74, 63, 2, 63], "#9a7040"); c.hline(6, 56, 64, "#d2a766")
  for (let x = 6; x < 70; x += 5) c.line(x, 56, x - 1 + (x > 38 ? 1 : -1) * 0, 63, "#7a5a32")
  c.rect(2, 63, 72, 4, "#6c4a28"); c.hline(2, 63, 72, "#b48b52"); c.hline(2, 66, 72, "#3d2a16")
  // thân chòi: vách ván đứng + cửa tối + cửa sổ chớp
  c.rect(14, 32, 48, 26, "#b8894f"); for (let x = 14; x < 62; x += 4) c.vline(x, 32, 26, x % 8 ? "#a07846" : "#8a6638")
  c.rect(14, 32, 3, 26, "#d6a967"); c.rect(59, 32, 3, 26, "#7a5a32"); c.hline(14, 57, 48, "#5e4325")
  c.rect(31, 38, 14, 20, "#2a1d12"); c.rect(32, 39, 12, 19, "#3d2a1a"); c.hline(31, 38, 14, "#e0b878"); c.vline(38, 39, 19, "#2a1d12")
  c.rect(18, 40, 9, 8, "#2a1d12"); c.rect(19, 41, 7, 6, "#e8c36a"); c.rect(19, 41, 7, 2, "#f6dc92"); c.vline(22, 41, 6, "#8a6638")      // cửa sổ sáng đèn
  c.rect(49, 40, 9, 8, "#2a1d12"); c.rect(50, 41, 7, 6, "#e8c36a"); c.vline(53, 41, 6, "#8a6638")
  // lan can phía trước
  for (const x of [5, 20, 55, 70]) c.rect(x, 52, 2, 14, "#a07846")
  c.hline(4, 56, 24, "#c9a46a"); c.hline(50, 56, 22, "#c9a46a")
  // mái lá dốc 4 mặt: nhiều lớp tranh so le, mặt trước sáng vừa, mặt trái sáng, mặt phải tối
  c.poly([10, 33, 66, 33, 52, 8, 24, 8], "#b9a35c"); c.poly([10, 33, 24, 8, 30, 3, 4, 36], "#cbb871"); c.poly([66, 33, 52, 8, 46, 3, 72, 36], "#8a7640")
  c.poly([4, 36, 72, 36, 66, 33, 10, 33], "#a58f4c")
  for (let y = 10; y < 36; y += 3) { for (let x = 6; x < 72; x++) { if (!(c.is(x, y, "*"))) continue; if (r() < .75) c.px(x, y, y % 6 === 1 ? "#8a7640" : "#d9c78a"); if (r() < .5 && c.is(x, y + 1, "*")) c.px(x, y + 1, "#7a6736") } }
  c.poly([24, 8, 52, 8, 46, 3, 30, 3], "#c7b36c"); c.hline(30, 3, 16, "#ecdca0"); c.hline(24, 8, 28, "#7a6736")
  for (let x = 6; x < 72; x += 2) if (r() < .85) c.px(x, 36 + (r() < .5 ? 0 : 1), "#6a5a2e")                                              // rìa mái xơ xác
  c.line(38, 3, 38, 0, "#6b4a28"); c.line(35, 1, 41, 1, "#6b4a28")                                                                        // đầu hồi chéo
  // đèn lồng treo hai bên cửa (đỏ cam)
  for (const x of [11, 65]) { c.vline(x, 36, 8, "#3d2a16"); c.rect(x - 3, 44, 7, 8, "#e8553a"); c.rect(x - 3, 44, 2, 8, "#ff8a5c"); c.hline(x - 3, 44, 7, "#8a2a1a"); c.hline(x - 3, 51, 7, "#8a2a1a"); c.hline(x - 2, 47, 5, "#ffd27a") }
  glow("#ffd27a", { r: 7, strength: .4 })
})

// ---------- xuồng ba lá (3 tấm ván), nhìn ngang ----------
sprite("boat", { w: 54, h: 26, outline: "#2c2013" }, (c) => {
  c.ellipse(27, 20, 24, 4, "#0c3a4644")
  c.poly([2, 12, 8, 6, 46, 6, 52, 11, 46, 19, 8, 19], "#7a5230")
  c.poly([3, 12, 9, 7, 45, 7, 50, 11, 45, 17, 9, 17], "#4a3320")                                                     // lòng xuồng tối
  c.poly([2, 12, 8, 6, 46, 6, 52, 11, 51, 12, 45, 8, 9, 8, 4, 13], "#b4824c"); c.hline(10, 6, 34, "#e0b878")        // mạn trên sáng
  c.poly([2, 13, 9, 19, 45, 19, 52, 12, 51, 14, 45, 21, 9, 21], "#3b7f8f"); c.hline(10, 20, 34, "#2a5f6e")          // dải sơn xanh ven mạn
  for (const x of [16, 27, 38]) { c.vline(x, 8, 9, "#6b4a28"); c.vline(x + 1, 8, 9, "#9a7040") }                   // xà ngồi
  c.line(8, 17, 44, 3, "#8a6638", 2); c.px(44, 3, "#c9a46a"); c.px(45, 2, "#e0b878"); c.px(9, 17, "#5e4325")        // mái chèo / sào gác trong xuồng
  c.hline(16, 10, 8, "#5b4128")
})

// ---------- đồ vật ----------
sprite("sign", { w: 34, h: 38, outline: "#2c2013" }, (c) => {
  c.rect(15, 18, 4, 18, "#8a6638"); c.vline(15, 18, 18, "#b48b52"); c.vline(18, 18, 18, "#5e4325")
  c.rect(2, 4, 30, 15, "#c9a066"); c.rect(2, 4, 30, 2, "#e8c488"); c.rect(2, 17, 30, 2, "#8a6638"); c.rect(2, 4, 2, 15, "#e8c488")
  c.hline(5, 9, 24, "#a07846"); c.hline(5, 13, 24, "#a07846"); c.px(4, 11, "#3d2a16"); c.px(29, 11, "#3d2a16")
  c.ellipse(16, 35, 5, 1, "#2a442688")
})
sprite("lampost", { w: 22, h: 54, outline: "#2c2013" }, (c) => {
  c.rect(9, 12, 4, 40, "#8a6638"); c.vline(9, 12, 40, "#b48b52"); c.vline(12, 12, 40, "#5e4325")
  c.line(11, 12, 18, 10, "#6b4a28", 2); c.vline(18, 12, 6, "#3d2a16")
  c.rect(14, 18, 9, 12, "#e8553a"); c.rect(14, 18, 3, 12, "#ff8a5c"); c.hline(14, 18, 9, "#8a2a1a"); c.hline(14, 29, 9, "#8a2a1a"); c.hline(15, 23, 7, "#ffd27a"); c.px(18, 31, "#8a2a1a")
  glow("#ffd27a", { r: 7, strength: .4 })
})
sprite("lantern", { w: 14, h: 20, outline: "#2c2013" }, (c) => {
  c.vline(7, 0, 5, "#3d2a16"); c.rect(3, 5, 9, 12, "#e8553a"); c.rect(3, 5, 3, 12, "#ff8a5c"); c.hline(3, 5, 9, "#8a2a1a"); c.hline(3, 16, 9, "#8a2a1a"); c.hline(4, 10, 7, "#ffd27a"); c.px(7, 18, "#8a2a1a")
  glow("#ffd27a", { r: 5, strength: .4 })
})
sprite("post", { w: 12, h: 26, outline: "#2c2013" }, (c) => {
  c.rect(4, 4, 5, 20, "#8a6638"); c.vline(4, 4, 20, "#b48b52"); c.vline(8, 4, 20, "#5e4325"); c.rect(3, 2, 7, 3, "#a07846"); c.hline(3, 2, 7, "#d2a766")
  c.hline(4, 10, 5, "#d9c9a0"); c.hline(4, 11, 5, "#a89870")                                                        // dây thừng quấn
})
sprite("netrack", { w: 44, h: 36, outline: "#2c2013" }, (c) => {
  for (const x of [4, 38]) { c.rect(x, 4, 3, 30, "#8a6638"); c.vline(x, 4, 30, "#b48b52") }
  c.rect(3, 4, 38, 3, "#a07846"); c.hline(3, 4, 38, "#d2a766")
  for (let y = 8; y < 28; y++) for (let x = 8; x < 37; x++) if ((x + y) % 3 === 0 && ((x - y) % 3 + 3) % 3 !== 5) c.px(x, y, "#c9d6d8"); else if ((x + y) % 4 === 1 && y % 2) c.px(x, y, "#7d9aa3")
  c.rect(8, 28, 29, 2, "#7d9aa3")
  for (const x of [12, 22, 31]) { c.circ(x, 31, 2, "#e8553a"); c.px(x - 1, 30, "#ffb08a") }                          // phao
})
sprite("bench", { w: 28, h: 20, outline: "#2c2013" }, (c) => {
  c.rect(2, 4, 24, 4, "#b48b52"); c.hline(2, 4, 24, "#e0b878"); c.hline(2, 7, 24, "#6c4a28")
  c.rect(2, 8, 24, 3, "#9a7040"); for (const x of [4, 22]) c.rect(x, 11, 3, 6, "#6c4a28")
  c.rect(2, 0, 24, 3, "#9a7040"); c.hline(2, 0, 24, "#d2a766")
})
sprite("birdbox", { w: 18, h: 32, outline: "#2c2013" }, (c) => {
  c.rect(8, 14, 3, 16, "#8a6638"); c.rect(3, 4, 13, 11, "#b48b52"); c.rect(3, 4, 3, 11, "#d6a967"); c.circ(9, 10, 2, "#2a1d12")
  c.poly([1, 5, 9, 0, 18, 5], "#a8473a"); c.poly([1, 5, 9, 0, 9, 5], "#c9604a"); c.hline(7, 15, 5, "#6c4a28")
})
sprite("haystack", { w: 36, h: 32, outline: "#4a3a14" }, (c) => {
  const r = c.rng(8)
  c.ellipse(18, 22, 15, 9, "#c9a04a"); c.poly([6, 20, 18, 2, 30, 20], "#d9b45a"); c.poly([6, 20, 18, 2, 14, 20], "#ecd080"); c.poly([30, 20, 18, 2, 24, 20], "#b08a38")
  for (let i = 0; i < 26; i++) { const x = 6 + Math.floor(r() * 24), y = 6 + Math.floor(r() * 18); if (c.is(x, y, "*")) c.hline(x, y, 2 + Math.floor(r() * 3), r() < .5 ? "#f3e2a0" : "#9a7a2c") }
  c.hline(8, 22, 20, "#8a6a28"); c.vline(18, 0, 3, "#8a6a28")
})

// ---------- nước (game đặt 2 lớp cuộn chậm dưới nền) ----------
const WR = (c, N, f) => { for (const dx of [-N, 0, N]) for (const dy of [-N, 0, N]) f(dx, dy) }
sprite("water_a", { w: 32, h: 32 }, (c) => {
  const r = c.rng(3)
  c.rect(0, 0, 32, 32, "#2d7f8f")
  for (let i = 0; i < 5; i++) { const x = Math.floor(r() * 32), y = Math.floor(r() * 32), rx = 5 + Math.floor(r() * 4), ry = 2 + Math.floor(r() * 2), col = i % 2 ? "#33899a" : "#27727f"; WR(c, 32, (dx, dy) => c.ellipse(x + dx, y + dy, rx, ry, col)) }
  for (let i = 0; i < 7; i++) { const x = Math.floor(r() * 32), y = Math.floor(r() * 32), l = 3 + Math.floor(r() * 4); WR(c, 32, (dx, dy) => { c.hline(x + dx, y + dy, l, "#4aa2ae"); c.hline(x + dx + 2, y + dy + 1, l - 1, "#236a77") }) }
})
sprite("water_b", { w: 32, h: 32 }, (c) => {
  const r = c.rng(9)
  for (let i = 0; i < 9; i++) { const x = Math.floor(r() * 32), y = Math.floor(r() * 32), l = 2 + Math.floor(r() * 3); WR(c, 32, (dx, dy) => { c.hline(x + dx, y + dy, l, "#d8f6fa99"); if (i % 3 === 0) c.px(x + dx + 1, y + dy - 1, "#ffffffcc") }) }
})

// ---------- hiệu ứng ----------
for (let i = 0; i < 4; i++) sprite("glint" + i, { w: 7, h: 5 }, (c) => {
  const f = [[3, 2, 0], [3, 2, 1], [3, 2, 2], [3, 2, 1]][i]
  c.px(3, 2, "#ffffff"); if (f[2] >= 1) { c.hline(2, 2, 3, "#e8fbff"); c.vline(3, 1, 3, "#e8fbff") } if (f[2] >= 2) { c.hline(0, 2, 7, "#bfeef5aa"); c.px(3, 0, "#bfeef5aa"); c.px(3, 4, "#bfeef5aa") }
})
for (let i = 0; i < 6; i++) sprite("ripple" + i, { w: 34, h: 16 }, (c) => { const k = 2 + i * 2.6; c.ellipse(17, 8, Math.round(k), Math.max(1, Math.round(k * .45)), i < 4 ? "#f2fdff99" : "#f2fdff55", true) })
sprite("firefly", { w: 9, h: 9 }, (c) => { c.px(4, 4, "#fffbc0"); c.px(3, 4, "#f4f27a"); c.px(5, 4, "#f4f27a"); c.px(4, 3, "#f4f27a"); c.px(4, 5, "#f4f27a"); glow("#fffbc0", { r: 4, strength: .6 }) })
sprite("petal0", { w: 5, h: 4 }, (c) => { c.px(1, 1, "#ffc6dc"); c.px(2, 1, "#ffe6ef"); c.px(2, 2, "#f294b8"); c.px(3, 2, "#ffc6dc") })
sprite("petal1", { w: 5, h: 4 }, (c) => { c.px(1, 2, "#b9e07a"); c.px(2, 1, "#8fc653"); c.px(3, 1, "#b9e07a"); c.px(2, 2, "#5f9a40") })
for (let i = 0; i < 2; i++) sprite("dragonfly" + i, { w: 14, h: 10 }, (c) => {
  c.hline(2, 5, 8, "#2f7fa0"); c.px(10, 5, "#1f5f7a"); c.rect(10, 4, 2, 2, "#4aa8c8"); c.px(11, 4, "#e8553a")
  const up = i === 0; c.line(5, 4, up ? 3 : 4, up ? 0 : 2, "#dff6ffaa"); c.line(7, 4, up ? 8 : 9, up ? 0 : 2, "#dff6ffaa"); c.line(5, 6, up ? 3 : 4, up ? 9 : 8, "#dff6ff88"); c.line(7, 6, up ? 8 : 9, up ? 9 : 8, "#dff6ff88")
})
sprite("mist", { w: 96, h: 40 }, (c) => { for (let y = 0; y < 40; y++) for (let x = 0; x < 96; x++) { const d = Math.pow((x - 48) / 48, 2) + Math.pow((y - 20) / 20, 2); if (d < 1 && (1 - d) > (((x & 3) * 4 + (y & 3)) % 16) / 16 * .9) c.px(x, y, (x + y) % 2 ? "#ffffff30" : "#ffffff20") } })
sprite("shaft", { w: 40, h: 120 }, (c) => { for (let y = 0; y < 120; y++) for (let x = 0; x < 40; x++) { const cx = 14 + y * .16, d = Math.abs(x - cx) / (9 + y * .06), f = (1 - d) * (1 - y / 120); if (f > 0 && f > (((x & 3) * 4 + (y & 3)) % 16) / 16 * .8) c.px(x, y, "#fff2b055") } })

// ---------- quầy hướng dẫn du lịch ở cổng (mái lá nhỏ, quầy gỗ, bản đồ, nón lá treo, cờ đuôi nheo) ----------
sprite("kiosk", { w: 74, h: 62, outline: "#2c2013" }, (c) => {
  const r = c.rng(21)
  c.ellipse(37, 58, 32, 3, "#1c3a1e55")
  for (const x of [8, 64]) { c.rect(x - 2, 22, 4, 36, "#8d6a3c"); c.vline(x - 2, 22, 36, "#b48b52"); c.vline(x + 1, 22, 36, "#5e4325") }       // cột
  // lưng quầy: vách ván + bản đồ + nón lá
  c.rect(8, 22, 58, 22, "#b8894f"); for (let x = 8; x < 66; x += 4) c.vline(x, 22, 22, x % 8 ? "#a07846" : "#8a6638")
  c.rect(14, 25, 20, 14, "#efe2b8"); c.rect(14, 25, 20, 1, "#fff6d6"); c.rect(14, 38, 20, 1, "#c9b888")                                        // bản đồ giấy
  c.ellipse(24, 32, 6, 3, "#6fc1c4"); c.px(21, 31, "#9ee0e0"); c.line(15, 37, 22, 34, "#c9904a"); c.line(26, 30, 33, 27, "#c9904a"); c.px(30, 30, "#4a8f40"); c.px(17, 28, "#4a8f40"); c.px(18, 28, "#4a8f40")
  for (const [x, y] of [[44, 29], [54, 31]]) { c.poly([x - 8, y + 3, x, y - 5, x + 8, y + 3], "#d9aa55"); c.poly([x - 8, y + 3, x, y - 5, x - 2, y + 3], "#f0cb7a"); c.hline(x - 8, y + 3, 17, "#8a6030"); c.vline(x, y - 5, -3, "#8a6030") }  // nón lá treo
  // mái lá nhỏ
  c.poly([2, 24, 72, 24, 62, 6, 12, 6], "#b9a35c"); c.poly([2, 24, 12, 6, 17, 2, 0, 27], "#cbb871"); c.poly([72, 24, 62, 6, 57, 2, 74, 27], "#8a7640")
  for (let y = 7; y < 26; y += 3) for (let x = 4; x < 71; x++) { if (!c.is(x, y, "*")) continue; if (r() < .72) c.px(x, y, y % 6 === 1 ? "#8a7640" : "#d9c78a"); if (r() < .4 && c.is(x, y + 1, "*")) c.px(x, y + 1, "#7a6736") }
  c.poly([12, 6, 62, 6, 57, 2, 17, 2], "#c7b36c"); c.hline(17, 2, 40, "#ecdca0")
  // cờ đuôi nheo dưới mái
  const cols = ["#e8553a", "#f7d447", "#3b9a8f", "#ee86a6", "#7a9be0"]
  for (let i = 0; i < 9; i++) { const x = 6 + i * 7; c.poly([x, 26, x + 5, 26, x + 2, 31], cols[i % 5]) }
  c.hline(4, 26, 66, "#3d2a16")
  // quầy trước: mặt quầy + hộp tờ rơi + ly trà + ống nhòm
  c.rect(6, 44, 62, 4, "#c9a066"); c.hline(6, 44, 62, "#e8c488"); c.hline(6, 47, 62, "#8a6638")
  c.rect(6, 48, 62, 10, "#9a7040"); for (let x = 8; x < 66; x += 6) c.vline(x, 48, 10, "#7a5a32"); c.hline(6, 48, 62, "#6c4a28"); c.hline(6, 57, 62, "#3d2a16")
  c.rect(12, 41, 9, 4, "#f4f0e0"); c.hline(12, 41, 9, "#ffffff"); c.rect(13, 38, 8, 3, "#e8d8b0"); c.hline(13, 38, 8, "#fff3d0")                    // chồng tờ rơi
  c.rect(44, 40, 5, 5, "#e8e2d0"); c.px(49, 42, "#e8e2d0"); c.hline(45, 40, 3, "#7a4a2a")                                                          // ly trà
  c.rect(54, 40, 3, 5, "#3d3a46"); c.rect(58, 40, 3, 5, "#3d3a46"); c.hline(54, 41, 7, "#6a6676"); c.px(55, 40, "#b8d8e8"); c.px(59, 40, "#b8d8e8")      // ống nhòm
  c.circ(37, 52, 3, "#2f7a3a"); c.circ(37, 52, 2, "#5aa84a"); c.px(36, 51, "#bfe28a")                                                              // biểu tượng lá tràm trên quầy
  // đèn lồng treo
  c.vline(68, 26, 5, "#3d2a16"); c.rect(65, 31, 7, 8, "#e8553a"); c.rect(65, 31, 2, 8, "#ff8a5c"); c.hline(65, 31, 7, "#8a2a1a"); c.hline(65, 38, 7, "#8a2a1a"); c.hline(66, 34, 5, "#ffd27a")
  glow("#ffd27a", { r: 6, strength: .35 })
})

// ---------- bảng thông tin (mái lá nhỏ, mặt bảng nghiêng, hình chim sếu) ----------
sprite("infoboard", { w: 40, h: 50, outline: "#2c2013" }, (c) => {
  c.ellipse(20, 47, 15, 2, "#1c3a1e55")
  for (const x of [6, 32]) { c.rect(x, 14, 3, 33, "#8d6a3c"); c.vline(x, 14, 33, "#b48b52"); c.vline(x + 2, 14, 33, "#5e4325") }
  c.rect(4, 17, 32, 22, "#c9a066"); c.rect(4, 17, 32, 2, "#e8c488"); c.rect(4, 37, 32, 2, "#8a6638")
  c.rect(7, 20, 26, 16, "#f1e6c2"); c.hline(7, 20, 26, "#fff6d6"); c.hline(7, 35, 26, "#cbb98a")
  c.poly([12, 31, 16, 24, 18, 26, 20, 31], "#d8dde0"); c.rect(15, 22, 3, 3, "#d8352a"); c.px(18, 23, "#d9cf9c"); c.vline(14, 31, 4, "#b96b78")                // hình sếu
  c.hline(23, 24, 8, "#8a7a52"); c.hline(23, 27, 8, "#8a7a52"); c.hline(23, 30, 6, "#8a7a52"); c.hline(10, 33, 14, "#8a7a52")                        // dòng chữ giả
  c.poly([1, 17, 39, 17, 33, 7, 7, 7], "#b9a35c"); c.poly([1, 17, 7, 7, 10, 3, 0, 19], "#cbb871"); c.poly([39, 17, 33, 7, 30, 3, 40, 19], "#8a7640")
  c.poly([7, 7, 33, 7, 30, 3, 10, 3], "#c7b36c"); c.hline(10, 3, 20, "#ecdca0")
  for (let y = 8; y < 18; y += 2) for (let x = 3; x < 38; x++) if (c.is(x, y, "*") && (x * 7 + y * 3) % 5 === 0) c.px(x, y, y % 4 ? "#8a7640" : "#d9c78a")
  c.hline(2, 17, 36, "#6a5a2e")
})
