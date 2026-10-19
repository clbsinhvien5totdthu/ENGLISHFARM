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
