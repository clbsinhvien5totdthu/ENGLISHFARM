

## Cập nhật (nhà Tiny Village + Đình làng + sửa lỗi)
- `python tools/pack_village.py` → `village_assets.js` (phóng 3x + bóng đổ chân): Town Homes = Town House + Painter's House, Decor Shop = Potter's House, quầy ăn = Bakery, Mill House (nhà xay bột), School House (trường làng), Observatory (Đồi Cao), Stable (Nông trại), Fisherman's Hut (Hồ Trăng), Wizard Hut (Rừng Sương). Plant Workshop và Đình làng giữ bản cũ. Nguồn PNG: `img/village/`. Muốn thêm nhà: bỏ PNG vào đó, thêm tên vào `NAMES`, rồi đặt `this.add.image(x, y, 'v_<tên>')` trong cảnh.
- `python tools/pack_guild.py` → `guild_assets.js`: phòng trong Đình làng (scene `Guild`): vỏ phòng (sàn / tường / chái) từ `img/craftpix/guild/Interior_1st_floor.tmx`, còn đồ đình (hoành phi, câu đối, bàn thờ, cột sơn son, chiếu + mâm trà, trống đình, chiêng, bảng tin, tủ sổ, lồng đèn, cụ Đình trưởng) vẽ bằng code trong chính script này. Sửa bố cục: đổi toạ độ ở phần `# --- bố trí` rồi chạy lại; nhớ chỉnh khối va chạm `Guild.create()` trong `game.js` (px phòng x3).
- `python tools/pack_town.py`: cầu gỗ giờ lấy thân cầu liền khối (hết khe hở), phủ cả hai bờ cát.
- Game: cây trồng phóng theo `CROP_SC`; vùng nước (`wetRect` / `wetEllipse`, `dryRect` cho cầu / cầu tàu) cấm vật nuôi + Biscuit; `clearOfRoad()` không cho tán cây chồng lên đường (Nông trại, Thị trấn, Rừng).
- Giấy phép: các pack Craftpix / Pixel-Deck không được đưa lên repo công khai dưới dạng file nguồn tải lại được — cân nhắc để `img/craftpix/` và `img/village/` ngoài repo (chỉ giữ các file `*_assets.js` đã đóng gói).

pack_ui.py   vẽ icon UI + khung 9-slice bằng code -> ui_assets.js, ui_skin.css (không cần PNG nguồn)
