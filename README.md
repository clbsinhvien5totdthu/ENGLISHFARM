# ENGLISHFARM

```
index.html, style.css, game.js, vocab.js, assets.js   game
house_assets.js        ảnh nhà (base64), tự sinh từ img/main_house/*.png
img/main_house/        house.png (nhà ngoài), room.png (trong nhà), smoke.png (khói)
tiled/                 file Tiled (.tmx) + toàn bộ tileset PNG
psd/                   file PSD nguồn (psd/main_house = file lớn của nhà chính)
tools/pack_house.py    sửa PNG xong chạy:  python tools/pack_house.py
```
Cây (3 loại, có hoạt ảnh) + bụi/đá/gốc cây/nấm: nature_assets.js (python tools/pack_nature.py).
Chạy thử: `python -m http.server 8000` rồi mở http://localhost:8000

Từ 18/10/2026: đồ họa cỏ ngoài trời dùng bộ tileset nhà (tiled/ground_grass_details.png) qua ground_assets.js; nhân vật trong nhà phóng 1.5x (HOME_HERO trong game.js). Đường đất (đất nâu + dải đá cuội + viền cỏ) cũng do tools/pack_ground.py tự vẽ (47 ô, không cần PNG). Sửa PNG cỏ hoặc màu đường xong chạy: python tools/pack_ground.py

Từ 19/10/2026: 17 cây trồng mới (img/plants/Plants.png) thay toàn bộ cây cũ; tiệm hạt giống đổi thành **Plant Workshop** (vẽ từ img/workshop/Exterior_house.png). Thêm/sửa cây: sửa CROPS trong game.js + FRAMES trong tools/pack_plants.py, rồi chạy: python tools/pack_plants.py (ghi lại assets.js). Save cũ: hạt/nông sản cây cũ bị dọn, ô đất đang trồng cây cũ trở về đất đã xới; nếu hết sạch hạt sẽ được tặng 6 cà rốt + 6 củ cải.
Plant Workshop vào được (cảnh Workshop, phòng vẽ sẵn trong tools/pack_plants.py → ASSETS.bld.shoproom; Lily đứng sau quầy). Cây nhặt ở Rừng Sương và icon túi đồ là dạng quả/củ (Supplies.png). Cỏ Đồi Cao dùng cùng bộ cỏ với nền thị trấn.

Từ 19/10/2026 (đợt 2): vật nuôi mới (8 loài Craftpix: gà con, gà trống, gà tây, cừu, cừu non, bê, bò đực, heo con) có hoạt ảnh đi/đứng 4 hướng, nằm trong animals_assets.js (python tools/pack_animals.py, nguồn img/animals/*.png). Đã xóa toàn bộ động vật cũ (gà, bò, cừu, vịt, mèo, chó, thỏ vẽ bằng code/sprite) và cây cỏ cũ trong assets.js (tiles, bushG/bushF, cây tree/pine/blossom/banyan, n_*) — cây và bụi hiện lấy từ nature_assets.js. Bạn đồng hành Biscuit giờ là cừu non. Đất trồng vẽ lại bằng code (soilCanvas trong game.js): ô liền khít, khung gỗ quanh ruộng, 3 trạng thái chưa xới / đã xới / đã tưới. Stamina hao nhiều hơn: xới 4, gieo 5, tưới 4, thu hoạch 4, câu cá 5, nhặt đồ rừng 2, học từ 3 (B1) / 4 (B2) mỗi câu, chơi với vật nuôi 1 mỗi lần (chỉnh ở đầu game.js: COST, COST_PET, LESSON, COST_FISH).

Từ 20/10/2026: tích hợp 3 pack Craftpix (nguồn PNG trong img/craftpix/). Đường thị trấn là đá cuội (Road5) — tools/pack_ground.py sinh thêm bộ road2 vào ground_assets.js. Cầu gỗ thị trấn, cầu tàu Hồ Trăng, mặt tiền Đình làng (Guild Hall, đã bỏ biển hiệu) và NPC dân làng (Citizen đổi màu váy/quần, Elder Moss là Mage) nằm trong town_assets.js: sửa PNG xong chạy `python tools/pack_town.py`. Chưa có cảnh nội thất Đình làng (hiện vẫn là hộp thoại).
Giấy phép: Craftpix chỉ cho dùng, không phân phối lại tài nguyên — đừng để thư mục img/craftpix/ trong repo công khai.

---
## Từ 20/10/2026 — Nâng cấp theo Design Bible v1.0 (Grow & Speak)
Giữ Phaser 3.80.1, JS thuần (không ES Modules), các Scene cũ, asset cũ và khóa save `englishFarmSave2`.
```
data/      characters · story_data (Prologue + 8 chương, manh mối) · quest_data (36 quest) · dialogue_data · vocabulary_data (A2 theo chủ đề)
systems/   language (Hạt→Mầm→Quả, lịch ôn) · quest · dialogue · story · review (bài A2/B1/B2/chủ đề/ôn tập, menu Emma)
           assessment (chấm câu tự viết) · activity (hoa, chợ, order bếp, thư cũ, manh mối) · save (v3 + migration + sao lưu)
ui/        character_creator · dialogue_ui · vocabulary_book (Sổ Vườn Từ + Nhật ký + Quest log + Hồ sơ)
```
- **Custom Character**: tên, đại từ, màu tóc/áo/mũ, kính, khăn — recolor sprite gốc + lớp vẽ chồng (không cần sprite mới). Kiểu tóc mới cần thêm hình.
- **Prologue → 8 chương**: `S.story.ch` = số chương đã xong; chương lấy từ `EF.CHAPTERS`. Nộp quest ở đúng NPC (Emma, Lily, Mia, Chú Hai, Cụ Moss, Chef Bo, Pete, Đình làng).
- **Quest**: thêm quest mới = thêm 1 mục vào `data/quest_data.js` và id vào `quests` của chương. Loại mục tiêu: harvest, plant, catch, forage, interact, vocabulary_stage, dialogue_success, describe, trade, deliver, discover_clue, visit.
- **Hội thoại**: `turns` (tuyến tính, 3 lựa chọn: đúng ngữ cảnh / chiến lược hỏi lại / lạc đề) hoặc `nodes` (sơ đồ nhánh như Sam). Có nút "✍️ Tự viết" (chấm theo từ khóa + cấu trúc + hỏi lại).
- **Ngôn ngữ**: `S.language.profile/words/skillScores`, tách khỏi `S.lvl`. Mốc 500 từ chỉ là cột mốc mùa đầu. Không có cơ chế "từ héo".
- **Save**: migration lên v3, sao lưu `englishFarmSave2.backup.v2` trước khi chuyển; từ cũ → Hạt (không tự thành thạo); chương cũ k → (k-1) chương mới.
- Phím J = Nhật ký. Cổng chương 1 theo Bible: 20 từ Mầm + 10 từ Quả (chỉnh ở `quest_data.js`, quest `word_garden`).
- Kiểm thử logic: `node` có thể nạp các file data/systems với DOM giả (xem cách làm trong lịch sử phát triển); chưa chạy trên trình duyệt thật.

### Sửa lỗi hiển thị (20/10/2026)
- NPC 32px chỉ cao ~25px trong khung nên bé hơn nhân vật chính: phóng `NPC_SC = 1.5` lần (Lily trong Workshop nhân thêm `HOME_HERO`), căn lại bóng, vùng va chạm và độ sâu theo chân.
- Nhãn tên NPC giờ bám sát đỉnh đầu thật (trước đây lơ lửng cao vì khung có viền trong suốt).
- Nhãn “Captain Hai” không còn bị biển “Hồ Trăng” đè (dời Chú Hai sang x=830); nhãn “Miller Pete” không còn bị biển “Cối xay gió” che (biển dời xuống y=410); biển “Cầu Sunny” dời lên khỏi lan can cầu.


---
## Từ 22/10/2026 — Pixel UI (sprite + font VT323)
- **Font**: VT323 chạy offline từ `fonts/VT323-Regular.ttf` (@font-face trong style.css; giấy phép OFL, giữ `fonts/OFL.txt`). Đã bỏ Google Fonts / Baloo 2; chữ trên canvas Phaser (ĐÌNH LÀNG) cũng dùng VT323 — game chờ font tải xong mới khởi động.
- **Sprite UI vẽ bằng code**: `python tools/pack_ui.py` ghi `ui_assets.js` (13 icon 64x64 gộp vào `ASSETS.spr`: ui_book, ui_journal, ui_sound, ui_mute, ui_gear, ui_trophy, ui_pick, ui_seed, ui_close, ui_check, ui_star, ui_arrow_l, ui_arrow_r) và `ui_skin.css` (khung 9-slice: panel, panel_dark, tab, slot, nút btn/ok/no/gold/wood + bản nhấn `_p`, ván gỗ HUD, 3 ô đổ thanh chỉ số). Đổi màu/hình: sửa tools/pack_ui.py rồi chạy lại.
- **Thứ tự nạp** trong index.html: `assets.js` -> `ui_assets.js` -> ... -> `game.js`; CSS: `style.css` -> `ui_skin.css`.
- Nút trong hộp thoại tự đổi màu theo nhãn: Xác nhận/Tiếp/Xong/Gửi/Bắt đầu/Nhận/Mua → xanh; Hủy/Thoát/Không/Bỏ → đỏ; Quay lại/Đóng → gỗ. Ép màu bằng `cls:'ok'|'no'|'back'|'on'` trong mảng nút của `modal()`.


---
## Từ 24/10/2026 — Tràm Chim vẽ lại kiểu top-down 3/4 (pxl)
- **Bản đồ thiết kế sẵn** (không còn nhiễu ngẫu nhiên): hồ sen ở giữa, ván gỗ ra chòi quan sát trên đảo, rừng tràm ngập nước + tràm chết đứng ở phía bắc/đông, bến thuyền ở vịnh tây-nam, bãi bồi và đồng cỏ năn cho sếu. `node tools/gen_tramchim_map.js` sinh `tools/tramchim_layout.json` (game dùng) + `tools/tramchim_layout.px.js` (pxl dùng) — một nguồn dữ liệu duy nhất cho nền, bóng cây và vị trí vật thể.
- **Nền** (`tools/tc_ground.px.js`): scene 800x640 → ảnh `tc_ground` 1600x1280. Bờ cong tự nhiên, bờ phía bắc có vách đất nhìn thấy, mép cỏ rủ ở bờ nam, bóng đổ xuống dưới-phải, ván gỗ đóng khe/đinh, lối đất, bùn nứt, hoa dại. Chỗ mặt nước **trong suốt**: game đặt 2 lớp nước cuộn chậm (`tc_water_a/b`) bên dưới.
- **Vật thể** (`tc_nature.px.js`, `tc_things.px.js`): tràm 3 cỡ (thân trắng bong vỏ, tán rủ), tràm chết, lau sậy, bồn bồn, cỏ năn, bụi hoa, sen cao, hoa súng, lục bình; sếu đầu đỏ + cò trắng 3 hướng x 2 dáng bước, sếu bay; chòi cao cẳng mái lá, xuồng ba lá, đèn lồng, biển, lưới phơi, đụn rơm…
- **Không khí** (`TramChim.mkAtmosphere` trong game.js): lấp lánh + gợn sóng, sương (đậm sáng sớm/chiều), tia nắng xuyên rừng, cánh hoa bay, chuồn chuồn, đom đóm + quầng đèn lồng khi tối, bóng đàn sếu bay lướt trên nền.
- Dựng lại: `node tools/gen_tramchim_map.js && node <pxl>/bin/pxl.js build tools/tramchim.px.js --out img/tramchim_build --no-preview && python3 tools/pack_tramchim_pxl.py`
- Lưu ý: chưa chạy thử trên trình duyệt thật (chỉ kiểm tra cú pháp + ghép ảnh xem trước); nếu đi lệch chỗ va chạm, chỉnh `TC_SOLID` ở đầu lớp `TramChim` trong game.js.

---
## Chú Tư — hướng dẫn viên Tràm Chim (25/10/2026)
- Nhân vật từ bảng sprite người dùng gửi (`img/guide/sheet.png`: 4 hướng x [đứng + 3 dáng bước]). `python3 tools/slice_guide.py` cắt thành `img/guide/frames/*.png` (50x68, tỉ lệ 1:1 với nhân vật chính) + `portrait.png` (chân dung hộp thoại); `pack_tramchim_pxl.py` đóng gói vào nhóm `chars`.
- Trong game (`TramChim`): đi dạo quanh quầy hướng dẫn ở cổng, quay mặt về phía người chơi khi lại gần, có bong bóng 💬 (ẩn sau khi đã nói chuyện trong ngày). Bấm E để nghe 3 câu chuyện (Lịch sử Tràm Chim · Sếu đầu đỏ · Đồng Tháp Mười thu nhỏ), mỗi trang có thêm một câu tiếng Anh; xong lần đầu +8 EXP/câu chuyện. Có "Đố vui" 5 câu (+3 EXP/câu đúng, nhận một lần mỗi ngày). Nội dung ở `TC_TOUR`, `TC_QUIZ`, `TC_BOARDS` trong game.js.
- 3 bảng thông tin dọc đường (E: đọc, +4 EXP lần đầu). Quầy hướng dẫn + bảng vẽ bằng pxl (`kiosk`, `infoboard` trong tc_things.px.js).
- Đồ hoạ thêm: bóng phản chiếu cây/chòi/cọc trên mặt nước, gợn sóng khi lội, dây thừng lan can dọc ván gỗ, bãi bùn khô nứt mịn hơn, vườn hoa dại ở cổng.
- Số liệu lịch sử (1985, 1986, 1991, 29/12/1998 QĐ 253/1998/QĐ-TTg, Ramsar 22/5/2012, số sếu 1.052 → 9 → 0) lấy từ báo/ban quản lý VQG; nếu có số mới hơn, sửa trong `TC_TOUR`.
