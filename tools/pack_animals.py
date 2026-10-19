# Chạy: python tools/pack_animals.py  -> ghi animals_assets.js (8 loài vật nuôi có hoạt ảnh)
# Nguồn: img/animals/<loài>.png (Craftpix "Free Top-Down Animals Farm", bản không bóng; xem img/animals/license.txt)
# Mỗi sheet gồm 6 cột x 8 hàng ô vuông: hàng 0-3 = ĐI (trước, sau, trái, phải) 6 khung · hàng 4-7 = ĐỨNG YÊN (trước, sau, trái, phải) 4 khung.
# Tool cắt sát mọi ô theo MỘT khung chung của loài đó (+1px viền trong suốt) nên chân luôn nằm đúng đáy ô, game đặt origin (.5, 1).
import base64, io, json
from PIL import Image

KINDS = ["chick", "rooster", "turkey", "sheep", "lamb", "calf", "bull", "piglet"]
COLS, ROWS, PAD = 6, 8, 1

def b64(im):
    b = io.BytesIO(); im.save(b, "PNG"); return "data:image/png;base64," + base64.b64encode(b.getvalue()).decode()

out = {}
for k in KINDS:
    im = Image.open(f"img/animals/{k}.png").convert("RGBA")
    cw, ch = im.width // COLS, im.height // ROWS
    cell = lambda r, c: im.crop((c * cw, r * ch, (c + 1) * cw, (r + 1) * ch))
    boxes = [cell(r, c).getbbox() for r in range(ROWS) for c in range(COLS)]
    boxes = [b for b in boxes if b]
    x0, y0 = min(b[0] for b in boxes), min(b[1] for b in boxes)
    x1, y1 = max(b[2] for b in boxes), max(b[3] for b in boxes)
    w, h = x1 - x0 + PAD * 2, y1 - y0 + PAD * 2
    sheet = Image.new("RGBA", (w * COLS, h * ROWS))
    for r in range(ROWS):
        for c in range(COLS):
            sheet.alpha_composite(cell(r, c).crop((x0, y0, x1, y1)), (c * w + PAD, r * h + PAD))
    # icon: khung đứng yên nhìn thẳng, cắt sát rồi đặt vào ô vuông (hiện trong hộp thoại khi chơi với vật nuôi)
    f = cell(4, 0).crop((x0, y0, x1, y1)); f = f.crop(f.getbbox()); n = max(f.size)
    icon = Image.new("RGBA", (n, n)); icon.alpha_composite(f, ((n - f.width) // 2, (n - f.height) // 2))
    out[k] = {"src": b64(sheet), "w": w, "h": h, "icon": b64(icon)}
    print(k, "ô", (w, h), "sheet", sheet.size)

open("animals_assets.js", "w", encoding="utf-8").write(
    "// Tự sinh bởi tools/pack_animals.py từ img/animals/*.png — không cần sửa tay.\n"
    "window.ANIMAL_SPR=" + json.dumps(out) + ";\n")
print("OK animals_assets.js")
