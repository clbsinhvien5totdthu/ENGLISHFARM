# Chạy: python tools/pack_crops.py [--preview]
# Nguồn: img/plants/crops_evolution.png — 28 cây, mỗi cây 4 hình: cây con → đang lớn → chín → nông sản thu hoạch (3 cột x 9-10 hàng).
# Việc làm: tự cắt từng hình, thu nhỏ về cỡ pixel của game, ghép bảng sprite 3 khung/cây (cây con / đang lớn / chín),
#           làm icon quả (khung thứ 4) + túi hạt giống, rồi ghi vào assets.js (crops, icons, seedIcons, ASSET_META) và CROP_SC trong game.js.
# Cần: pillow, numpy, scipy.  Danh sách cây (tên, giá, số ngày…) nằm ở CROPS trong game.js — thứ tự bảng sprite lấy từ CROP_ORDER dưới đây.
import base64, io, json, re, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

SRC = "img/plants/crops_evolution.png"
# thứ tự các hàng trong ảnh nguồn: cột trái (9 hàng) → cột giữa (10 hàng) → cột phải (9 hàng)
SRC_IDS = ["corn", "wheat", "strawberry", "sugarcane", "carrot", "rose", "peach", "pineapple", "mushroom",
           "soybean", "cotton", "tea", "chili", "tomato", "potato", "mangosteen", "grape", "blueberry", "cabbage",
           "coffee", "rice", "cauliflower", "sweetpotato", "melon", "lemon", "coconut", "jasmine", "banana"]
# thứ tự trong bảng sprite = thứ tự CROPS của game.js (rẻ → đắt)
CROP_ORDER = ["carrot", "potato", "cabbage", "cauliflower", "tomato", "chili", "corn", "soybean", "wheat", "strawberry", "sweetpotato", "rice",
              "mushroom", "cotton", "tea", "sugarcane", "melon", "pineapple", "grape", "peach", "lemon", "blueberry", "mangosteen", "banana",
              "coconut", "coffee", "rose", "jasmine"]
K = 3            # thu nhỏ 1/3: ảnh nguồn ~3px mỗi "pixel" → về pixel thật của game
CW, CH = 48, 48  # ô sprite (đáy cây sát đáy ô, căn giữa)
FIT_W, FIT_H = 62, 70   # cây chín phóng cho vừa ô đất 64px

def b64(im):
    b = io.BytesIO(); im.save(b, "PNG"); return "data:image/png;base64," + base64.b64encode(b.getvalue()).decode()

def segment():
    im = Image.open(SRC).convert("RGBA"); a = np.array(im); m = a[..., 3] > 40
    out = []
    for bi, (x0, x1) in enumerate([(0, 430), (430, 860), (860, 1300)]):
        p = m[:, x0:x1].sum(1) > 0; runs = []; st = None
        for y, v in enumerate(p):
            if v and st is None: st = y
            if not v and st is not None: runs.append((st, y)); st = None
        if st is not None: runs.append((st, len(p)))
        rows = []
        for r0, r1 in runs:
            if bi == 1 and r0 == 901: rows += [(901, 1016), (1016, 1116)]   # hàng nho & hàng việt quất dính nhau theo chiều dọc
            else: rows.append((r0, r1))
        lab_all, _ = ndi.label(ndi.binary_dilation(m[:, x0:x1], iterations=6))
        cs = []
        for sl in ndi.find_objects(lab_all):
            if (sl[1].stop - sl[1].start) < 120: cs.append(x0 + (sl[1].start + sl[1].stop) / 2)
        km = np.linspace(min(cs), max(cs), 4)
        for _ in range(20):
            asg = [int(np.argmin(abs(km - c))) for c in cs]
            km = np.array([np.mean([c for c, s in zip(cs, asg) if s == j]) for j in range(4)])
        for y0, y1 in rows:
            band = np.zeros_like(m); band[y0:y1, x0:x1] = m[y0:y1, x0:x1]
            l, _ = ndi.label(band); slots = [[] for _ in range(4)]
            for j, sl in enumerate(ndi.find_objects(l)):
                if (l[sl] == j + 1).sum() < 20: continue
                slots[int(np.argmin(abs(km - (sl[1].start + sl[1].stop) / 2)))].append(j + 1)
            imgs = []
            for s in slots:
                mk = np.isin(l, s); ys, xs = np.where(mk); piece = a.copy(); piece[~mk] = 0
                imgs.append(Image.fromarray(piece).crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)))
            out.append(imgs)
    assert len(out) == len(SRC_IDS) == 28, len(out)
    return dict(zip(SRC_IDS, out))

def shrink(im):     # thu nhỏ 1/K, giữ nét pixel: alpha chỉ còn 0/255
    sm = im.convert("RGBa").resize((max(1, round(im.width / K)), max(1, round(im.height / K))), Image.BOX).convert("RGBA")
    a = np.array(sm); a[..., 3] = np.where(a[..., 3] >= 128, 255, 0); sm = Image.fromarray(a)
    return sm.crop(sm.getbbox())

def fit(im, n):     # icon vuông n x n, giữ nét pixel
    k = min(4, n // max(im.size))
    if k >= 1: im = im.resize((im.width * k, im.height * k), Image.NEAREST)
    else: im = im.resize((max(1, im.width * n // max(im.size)), max(1, im.height * n // max(im.size))), Image.BOX)
    out = Image.new("RGBA", (n, n)); out.alpha_composite(im, ((n - im.width) // 2, (n - im.height) // 2)); return out

def bag(icon):      # túi hạt giống: giấy nâu + nhãn kem có hình quả
    g = Image.new("RGBA", (64, 64)); d = ImageDraw.Draw(g)
    d.rectangle((14, 10, 50, 56), fill=(150, 98, 52), outline=(74, 45, 22))
    d.rectangle((14, 10, 50, 20), fill=(214, 150, 60), outline=(74, 45, 22))
    d.rectangle((19, 24, 45, 50), fill=(247, 232, 196), outline=(110, 72, 36))
    g.alpha_composite(fit(icon, 22), (21, 26)); return g

if __name__ == "__main__":
    seg = segment(); F = {id: [shrink(i) for i in imgs] for id, imgs in seg.items()}
    sheet = Image.new("RGBA", (CW * 3, CH * len(CROP_ORDER))); icons, seeds, sc = {}, {}, []
    for r, id in enumerate(CROP_ORDER):
        for f in range(3):
            t = F[id][f]; assert t.width <= CW and t.height <= CH, (id, f, t.size)
            sheet.alpha_composite(t, (f * CW + (CW - t.width) // 2, r * CH + CH - 1 - t.height))
        ripe = F[id][2]; sc.append(round(max(1.0, min(2.4, FIT_W / ripe.width, FIT_H / ripe.height)), 2))
        icons[id] = b64(fit(F[id][3], 64)); seeds[id] = b64(bag(F[id][3]))
    L = open("assets.js", encoding="utf-8").read().split("\n")
    js = lambda l: json.loads(l[l.index("=") + 1:].rstrip(";"))
    A_, M_, SI_ = js(L[1]), js(L[2]), js(L[5])
    A_["crops"] = b64(sheet); A_["icons"] = icons; M_["crops"] = CROP_ORDER; M_["cropW"] = CW; M_["cropH"] = CH
    L[1] = "window.ASSETS=" + json.dumps(A_) + ";"; L[2] = "window.ASSET_META=" + json.dumps(M_) + ";"; L[5] = "window.ASSETS.seedIcons=" + json.dumps(seeds) + ";"
    open("assets.js", "w", encoding="utf-8").write("\n".join(L))
    g = open("game.js", encoding="utf-8").read()
    g, n = re.subn(r"const CROP_SC = \[[^\]]*\];", "const CROP_SC = " + json.dumps(sc) + ";", g); assert n == 1
    open("game.js", "w", encoding="utf-8").write(g)
    print("OK", len(CROP_ORDER), "cây; CROP_SC =", sc)
    if "--preview" in sys.argv:
        pv = Image.new("RGBA", (CW * 3 + 70, CH * len(CROP_ORDER)), (150, 110, 70, 255)); pv.alpha_composite(sheet, (0, 0))
        for r, id in enumerate(CROP_ORDER): pv.alpha_composite(fit(F[id][3], 64).resize((48, 48), Image.NEAREST), (CW * 3 + 10, r * CH))
        pv = pv.resize((pv.width * 2, pv.height * 2), Image.NEAREST)
        h = pv.height // 2; pv.crop((0, 0, pv.width, h)).save("/home/claude/crops_a.png"); pv.crop((0, h, pv.width, pv.height)).save("/home/claude/crops_b.png")
