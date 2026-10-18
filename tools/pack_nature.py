# Chạy: python tools/pack_nature.py  -> ghi nature_assets.js từ tiled/Trees_animation.png + tiled/exterior.png
# Cây: 3 loại (tree / blossom / pine) mỗi loại 13 khung hoạt ảnh gió thổi. Đồ thiên nhiên: cắt theo toạ độ từ exterior.png.
import base64, io, json
import numpy as np
from PIL import Image

def b64(im):
    b = io.BytesIO(); im.save(b, "PNG"); return "data:image/png;base64," + base64.b64encode(b.getvalue()).decode()

# ---------- CÂY ----------
T = Image.open("tiled/Trees_animation.png").convert("RGBA"); a = np.array(T)[:, :, 3] > 0
ROW = 80; ROWS = T.height // ROW            # 13 hàng = 13 khung
row0 = a[0:ROW].any(axis=0); groups = []; x = 0   # 9 cụm cột (3 bộ x 3 cỡ) lấy từ khung đầu tiên
while x < T.width:
    if row0[x]:
        s0 = x
        while x < T.width and row0[x]: x += 1
        groups.append((max(0, s0 - 3), min(T.width, x + 3)))   # chừa lề 3px cho lá rơi
    else: x += 1
assert len(groups) == 9, groups
PICK = {"tree": 0, "blossom": 3, "pine": 6}   # cây lớn của 3 bộ: xanh nhạt / táo đỏ / xanh đậm
trees = {}
for name, gi in PICK.items():
    x0, x1 = groups[gi]
    sub = a[:, x0:x1]
    ys = [np.where(sub[r*ROW:(r+1)*ROW].any(axis=1))[0] for r in range(ROWS)]
    y0 = min(y.min() for y in ys if len(y)); y1 = max(y.max() for y in ys if len(y)) + 1   # hộp chung cho mọi khung → kích thước không đổi
    w, h = x1 - x0, y1 - y0
    sheet = Image.new("RGBA", (w * ROWS, h))
    for r in range(ROWS): sheet.paste(T.crop((x0, r*ROW + y0, x1, r*ROW + y1)), (r * w, 0))
    trees[name] = {"src": b64(sheet), "w": int(w), "h": int(h), "n": int(ROWS)}

# ---------- ĐỒ THIÊN NHIÊN (toạ độ x0,y0,x1,y1 trong exterior.png) ----------
E = Image.open("tiled/exterior.png").convert("RGBA")
BOX = {
  "bushG": (212, 388, 252, 429),    # bụi xanh đậm
  "bushF": (226, 340, 257, 385),    # bụi quả đỏ
  "n_rbush": (191, 340, 226, 385),  # bụi tròn
  "n_bush": (64, 448, 95, 479),     # bụi nhỏ
  "n_fern": (212, 437, 252, 475),   # dương xỉ
  "n_rock": (21, 471, 59, 507),     # đá rêu
  "n_rocks": (62, 479, 128, 514),   # cụm đá
  "n_stump": (190, 756, 223, 782),  # gốc cây
  "n_log": (102, 676, 142, 702),    # khúc gỗ
  "n_mush": (98, 641, 125, 670),    # nấm
  "n_flowers": (128, 864, 161, 881) # hoa
}
decor = {}
for k, bx in BOX.items():
    c = E.crop(bx); bb = c.getbbox(); decor[k] = b64(c.crop(bb))
open("nature_assets.js", "w").write("// Tự sinh bởi tools/pack_nature.py từ tiled/Trees_animation.png + tiled/exterior.png\nwindow.NATURE=" + json.dumps({"trees": trees, "decor": decor}) + ";\n")
print("OK", {k: (v["w"], v["h"], v["n"]) for k, v in trees.items()}, list(decor))
