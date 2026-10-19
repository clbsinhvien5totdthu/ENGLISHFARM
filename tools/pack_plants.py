# Chạy: python tools/pack_plants.py  -> ghi lại assets.js (cây trồng + icon + hạt giống + tiệm Plant Workshop)
# Nguồn: img/plants/Plants.png (cây, nửa trái nền đất), img/plants/Supplies.png (thùng nông sản), img/workshop/Exterior_house.png (tiệm)
import base64, io, json
import numpy as np
from PIL import Image, ImageDraw

def b64(im):
    b = io.BytesIO(); im.save(b, "PNG"); return "data:image/png;base64," + base64.b64encode(b.getvalue()).decode()

P = Image.open("img/plants/Plants.png").convert("RGBA")
S = Image.open("img/plants/Supplies.png").convert("RGBA")
X = Image.open("img/workshop/Exterior_house.png").convert("RGBA")

# 3 khung mỗi cây: cây con / đang lớn / chín. Hộp (x0,y0,x1,y1) trong Plants.png; mỗi hộp được cắt sát viền.
col = lambda y0, y1, x=(0, 32, 64, 96): [(x[0], y0, x[1], y1), (x[1], y0, x[2], y1), (x[2], y0, x[3] + 1, y1)]
# thân cây ăn quả: (hàng y0,y1) + 3 khung lấy từ giai đoạn 1 / 3 / 5 của 5 giai đoạn
tree = lambda y0, y1, y1s=None: [(130, y0, 156, y1s or y1), (198, y0, 246, y1), (320, y0, 384, y1)]
FRAMES = {
  "carrot":      [(144, 380, 160, 400), (158, 367, 176, 400), (172, 367, 194, 400)],
  "radish":      [(144, 404, 160, 432), (160, 404, 176, 432), (175, 404, 194, 432)],
  "cauliflower": col(131, 165),
  "bean":        col(50, 95),
  "cucumber":    col(238, 275),
  "chili":       col(95, 131),
  "soybean":     col(166, 212),
  "sunflower":   col(392, 433),
  "wheat":       col(354, 386),
  "pumpkin":     col(284, 322),
  "pineapple":   col(326, 353),
  "grape":       col(0, 50),
  "plum":        tree(0, 81),
  "lemon":       tree(81, 148),
  "pomegranate": tree(148, 214),
  "banana":      tree(214, 293),
  "coconut":     tree(293, 375, 367),
}
IDS = list(FRAMES)
CW, CH = 64, 80   # ô cây: đáy cây nằm sát đáy ô, căn giữa

def trim(box):
    c = P.crop(box); bb = c.getbbox(); return c.crop(bb)

sheet = Image.new("RGBA", (CW * 3, CH * len(IDS)))
ripe = {}
for r, id in enumerate(IDS):
    for f, box in enumerate(FRAMES[id]):
        t = trim(box); assert t.width <= CW and t.height <= CH, (id, f, t.size)
        sheet.alpha_composite(t, (f * CW + (CW - t.width) // 2, r * CH + CH - 2 - t.height))
        if f == 2: ripe[id] = t

def fit(im, n):  # icon vuông n x n, giữ nét pixel (phóng nguyên lần khi nhỏ, thu bằng BOX khi lớn)
    k = n // max(im.size)
    if k >= 1: im = im.resize((im.width * k, im.height * k), Image.NEAREST)
    else: im = im.resize((max(1, im.width * n // max(im.size)), max(1, im.height * n // max(im.size))), Image.BOX)
    out = Image.new("RGBA", (n, n)); out.alpha_composite(im, ((n - im.width) // 2, (n - im.height) // 2)); return out

def bag(icon):  # túi hạt giống: giấy nâu + nhãn kem có hình cây
    g = Image.new("RGBA", (64, 64)); d = ImageDraw.Draw(g)
    d.rectangle((14, 10, 50, 56), fill=(150, 98, 52), outline=(74, 45, 22))
    d.rectangle((14, 10, 50, 20), fill=(214, 150, 60), outline=(74, 45, 22))
    d.rectangle((19, 24, 45, 50), fill=(247, 232, 196), outline=(110, 72, 36))
    g.alpha_composite(fit(icon, 22), (21, 26)); return g

icons = {id: b64(fit(ripe[id], 64)) for id in IDS}
seeds = {id: b64(bag(ripe[id])) for id in IDS}

# ---------- TIỆM: Exterior_house.png (nhà thợ thổi kính) -> Plant Workshop ----------
B = X.crop((0, 9, 138, 160)); a = np.array(B)
a[118:, :18] = 0                                   # bỏ tấm biển khiên thủy tinh bên trái (tên tiệm do game.js vẽ)
B = Image.fromarray(a)
W, H = B.width + 24, B.height + 8
shop = Image.new("RGBA", (W, H)); shop.alpha_composite(B, (12, 0))
crate = lambda box: S.crop(box)
def put(im, cx, bottom): shop.alpha_composite(im, (cx - im.width // 2, bottom - im.height))
CR = {"pine": (33, 0, 60, 42), "grape": (198, 13, 219, 42), "chili": (5, 62, 27, 90), "lemon": (127, 65, 145, 89)}
# 4 thùng nông sản hai bên cửa + 2 cây con có luống đất
for k, cx in (("chili", 38), ("lemon", 54)): put(crate(CR[k]).crop(crate(CR[k]).getbbox()), cx, H - 2)
for k, cx in (("grape", 104), ("pine", 124)): put(crate(CR[k]).crop(crate(CR[k]).getbbox()), cx, H - 2)
put(trim(FRAMES["plum"][1]), 14, H); put(trim(FRAMES["pomegranate"][1]), W - 14, H)
shop = shop.crop(shop.getbbox()); shop = shop.resize((shop.width * 2, shop.height * 2), Image.NEAREST)   # nhân vật cao 56px nên cần cửa to ~2x

# ---------- ghi assets.js ----------
L = open("assets.js", encoding="utf-8").read().split("\n")
js = lambda l: json.loads(l[l.index("=") + 1:].rstrip(";"))
A_, M_, B_, SI_, BM_ = js(L[1]), js(L[2]), js(L[4]), js(L[5]), js(L[6])
A_["crops"] = b64(sheet); A_["icons"] = icons
M_["crops"] = IDS; M_["cropW"] = CW; M_["cropH"] = CH; M_.pop("cropCell", None)
B_["seedshop"] = b64(shop); BM_["seedshop"] = [shop.width, shop.height]
L[1] = "window.ASSETS=" + json.dumps(A_) + ";"; L[2] = "window.ASSET_META=" + json.dumps(M_) + ";"
L[4] = "window.ASSETS.bld=" + json.dumps(B_) + ";"; L[5] = "window.ASSETS.seedIcons=" + json.dumps(seeds) + ";"
L[6] = "window.ASSET_META.bld=" + json.dumps(BM_) + ";"
open("assets.js", "w", encoding="utf-8").write("\n".join(L))
sheet.save("/tmp/crops_sheet.png"); shop.save("/tmp/shop.png"); print("OK", IDS, shop.size)
