# ENGLISHFARM

```
index.html, style.css, game.js, vocab.js, assets.js   game
house_assets.js        ảnh nhà (base64), tự sinh từ img/main_house/*.png
img/main_house/        house.png (nhà ngoài), room.png (trong nhà), smoke.png (khói)
tiled/                 file Tiled (.tmx) + toàn bộ tileset PNG
psd/                   file PSD nguồn (psd/main_house = file lớn của nhà chính)
tools/pack_house.py    sửa PNG xong chạy:  python tools/pack_house.py
```
Chạy thử: `python -m http.server 8000` rồi mở http://localhost:8000
