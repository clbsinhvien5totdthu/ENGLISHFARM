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
