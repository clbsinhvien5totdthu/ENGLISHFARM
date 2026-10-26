// Tràm Chim — toàn bộ pixel-art vẽ bằng pxl (kiểu top-down 3/4).
//   node <pxl>/bin/pxl.js build tools/tramchim.px.js --out img/tramchim_build --no-preview
//   python3 tools/pack_tramchim_pxl.py        (đóng gói -> tramchim_assets.js)
// Bố cục: node tools/gen_tramchim_map.js (sinh tramchim_layout.px.js dùng chung cho nền + game)
include("tramchim_layout.px.js")
include("tc_ground.px.js")
include("tc_nature.px.js")
include("tc_things.px.js")
