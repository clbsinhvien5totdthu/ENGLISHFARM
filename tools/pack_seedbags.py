# Chạy: python tools/pack_seedbags.py [--preview]
# Nguồn: img/plants/seed_bags.png (6 hàng x 7 túi hạt giống pixel-art, nền trắng) + img/plants/crops_evolution.png (hình quả).
# Việc làm: tách từng túi, ghép đúng túi cho từng cây trong game; cây nào không có túi hợp (hoặc túi bị cắt ở hàng cuối)
#           thì lấy một túi cùng màu nắp làm khuôn, xóa hình giữa nhãn rồi dán hình quả của cây đó vào.
#           Kết quả ghi vào assets.js (window.ASSETS.seedIcons) — game.js dùng qua sico(id).
# Cần: pillow, numpy, scipy (+ pack_crops.py cạnh file này).
import base64, io, json, sys, os
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pack_crops as PC

SRC = "img/plants/seed_bags.png"
# (hàng, cột) của túi dùng nguyên bản — đánh số từ 1, như ô trong ảnh nguồn
BAG = {"carrot": (4, 2), "potato": (4, 5), "cabbage": (2, 1), "cauliflower": (2, 7), "tomato": (4, 4), "chili": (3, 5), "corn": (1, 2),
       "soybean": (1, 4), "wheat": (2, 2), "strawberry": (3, 2), "sweetpotato": (3, 7), "rice": (2, 6), "cotton": (2, 4), "tea": (1, 1),
       "sugarcane": (3, 3), "melon": (4, 6), "lemon": (4, 7), "coffee": (1, 7), "rose": (5, 1), "jasmine": (1, 6)}
# cây chưa có túi riêng: lấy túi cây con (hàng 1, cột 3 — hình nhỏ giữa nhãn, dễ xóa sạch), đổi màu nắp, dán hình quả của cây đó lên nhãn
BLANK = (1, 3)
FLAP = {  # (hue 0-360, nhân độ bão hòa, nhân độ sáng) cho nắp túi; None = giữ xanh lá
  "mushroom": (24, .85, .95), "pineapple": (40, 1.55, 1.9), "banana": (42, 1.55, 1.9), "grape": (282, .7, 1.0), "peach": (350, .85, 1.9),
  "blueberry": (225, .55, 1.05), "mangosteen": (305, .8, 1.0), "coconut": None}
ICON_BOX = (60, 56)        # cỡ hình quả dán lên nhãn (px ở độ phân giải ảnh nguồn)
ICON_CENTER = (0.40, 0.56) # tâm hình trên túi (tỉ lệ theo rộng/cao túi)

def b64(im):
    b = io.BytesIO(); im.save(b, "PNG"); return "data:image/png;base64," + base64.b64encode(b.getvalue()).decode()

def segment():
    im = Image.open(SRC).convert("RGB"); a = np.array(im)
    near = a.min(2) > 232; lab, _ = ndi.label(near)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    fg = ~np.isin(lab, list(border)); rgba = np.dstack([a, np.where(fg, 255, 0).astype(np.uint8)])
    d = ndi.binary_dilation(fg, iterations=5); lab, _ = ndi.label(d); items = []
    for i, sl in enumerate(ndi.find_objects(lab)):
        mk = fg & (lab == i + 1)
        if mk.sum() < 3000: continue
        ys, xs = np.where(mk); piece = rgba.copy(); piece[~mk] = 0
        items.append(((xs.min() + xs.max()) / 2, (ys.min() + ys.max()) / 2, Image.fromarray(piece).crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))))
    items.sort(key=lambda t: t[1]); rows = []
    for it in items:
        if rows and abs(it[1] - np.mean([r[1] for r in rows[-1]])) < 80: rows[-1].append(it)
        else: rows.append([it])
    grid = [[t[2] for t in sorted(r, key=lambda t: t[0])] for r in rows]
    assert len(grid) == 6 and all(len(r) == 7 for r in grid), [len(r) for r in grid]
    return grid

def with_icon(bag, icon, flap=None):
    """xóa cây con giữa nhãn, đổi màu nắp túi (nếu có), rồi dán hình quả mới"""
    bag = bag.copy(); a = np.array(bag); W, H = bag.size
    x0, x1, y0, y1 = int(.12 * W), int(.62 * W), int(.40 * H), int(.80 * H)
    rgb = a[..., :3]; reg = rgb[y0:y1, x0:x1].astype(int)
    paper = np.median(reg[reg.sum(2) > 560], axis=0)
    emb = np.abs(reg - paper).sum(2) > 70
    yy, xx = np.mgrid[y0:y1, x0:x1]; emb &= ~((xx > .56 * W) & (yy > .66 * H))          # chừa đống hạt
    mask = np.zeros(rgb.shape[:2], bool); mask[y0:y1, x0:x1] = ndi.binary_dilation(emb, iterations=2)
    idx = ndi.distance_transform_edt(mask, return_distances=False, return_indices=True)
    rgb = rgb[idx[0], idx[1]]
    if flap:                                                                             # đổi màu nắp: chỉ các điểm xanh lá ở phần trên
        hsv = np.array(Image.fromarray(rgb).convert("HSV")).astype(float)
        sel = (np.arange(H)[:, None] < .33 * H) & (hsv[..., 0] > 50) & (hsv[..., 0] < 125) & (hsv[..., 1] > 70)
        hsv[..., 0][sel] = flap[0] / 360 * 255; hsv[..., 1][sel] = np.clip(hsv[..., 1][sel] * flap[1], 0, 255); hsv[..., 2][sel] = np.clip(hsv[..., 2][sel] * flap[2], 0, 255)
        rgb = np.array(Image.fromarray(hsv.astype(np.uint8), "HSV").convert("RGB"))
    a[..., :3] = rgb
    out = Image.fromarray(a); ic = icon.copy(); ic.thumbnail(ICON_BOX, Image.LANCZOS)
    out.alpha_composite(ic, (int(ICON_CENTER[0] * W - ic.width / 2), int(ICON_CENTER[1] * H - ic.height / 2)))
    return out

def to_icon(bag):     # túi → ảnh vuông 64x64, giữ nét pixel
    s = bag.convert("RGBa").resize((max(1, round(bag.width * 34 / bag.height)), 34), Image.BOX).convert("RGBA")
    a = np.array(s); a[..., 3] = np.where(a[..., 3] >= 128, 255, 0); s = Image.fromarray(a); s = s.crop(s.getbbox())
    s = s.resize((s.width * 2, s.height * 2), Image.NEAREST); out = Image.new("RGBA", (64, 64)); out.alpha_composite(s, ((64 - s.width) // 2, 64 - s.height)); return out

if __name__ == "__main__":
    grid = segment(); src = PC.segment()
    icons, bags = {}, {}
    for id in PC.CROP_ORDER:
        if id in BAG: r, c = BAG[id]; bags[id] = grid[r - 1][c - 1]
        else: r, c = BLANK; bags[id] = with_icon(grid[r - 1][c - 1], src[id][3], FLAP[id])
        icons[id] = to_icon(bags[id])
    L = open("assets.js", encoding="utf-8").read().split("\n")
    L[5] = "window.ASSETS.seedIcons=" + json.dumps({k: b64(v) for k, v in icons.items()}) + ";"
    open("assets.js", "w", encoding="utf-8").write("\n".join(L)); print("OK", len(icons), "túi hạt giống")
    if "--preview" in sys.argv:
        n = len(PC.CROP_ORDER); cols = 7; rows = -(-n // cols)
        big = Image.new("RGBA", (cols * 150, rows * 170), (150, 110, 70, 255)); sm = Image.new("RGBA", (cols * 70, rows * 70), (150, 110, 70, 255))
        for i, id in enumerate(PC.CROP_ORDER):
            t = bags[id].copy(); t.thumbnail((140, 160)); big.alpha_composite(t, ((i % cols) * 150 + 5, (i // cols) * 170 + 5))
            sm.alpha_composite(icons[id], ((i % cols) * 70 + 3, (i // cols) * 70 + 3))
        big.save("/home/claude/bags_full.png"); sm.resize((sm.width * 2, sm.height * 2), Image.NEAREST).save("/home/claude/bags_icons.png")
