# Cắt bảng sprite hướng dẫn viên (img/guide/sheet.png: 4 cột = xuống/trái/phải/lên, 4 hàng = đứng + 3 dáng bước)
# -> img/guide/frames/{s,l,r,n}{0..3}.png (50x68, 1px nguồn ≈ 1px game) + img/guide/portrait.png (48x48, cho hộp thoại)
# Chạy: python3 tools/slice_guide.py   (cần Pillow + numpy), rồi python3 tools/pack_tramchim_pxl.py
import os
import numpy as np
from PIL import Image
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'); G = os.path.join(ROOT, 'img', 'guide'); OUT = os.path.join(G, 'frames')
os.makedirs(OUT, exist_ok=True)
im = Image.open(os.path.join(G, 'sheet.png')).convert('RGBA')
al = np.array(im)[..., 3] > 128
def runs(p, th=2):
    r, s = [], None
    for i, v in enumerate(p):
        if v > th and s is None: s = i
        if v <= th and s is not None: r.append((s, i)); s = None
    if s is not None: r.append((s, len(p)))
    return r
rows, cols = runs(al.sum(axis=1)), runs(al.sum(axis=0))          # nền trong suốt → tự dò lưới 4x4
assert len(rows) == 4 and len(cols) == 4, (rows, cols)
S = 64 / 300.0; CW, CH = 50, 68
def shrink(crop, scale):                                          # thu nhỏ BOX trên ảnh nhân sẵn alpha → mép sạch, rồi nhị phân hoá alpha
    a = np.array(crop).astype(float); alpha = a[..., 3:4] / 255.0
    pm = Image.fromarray(np.dstack([a[..., :3] * alpha, a[..., 3:4]]).astype('uint8'), 'RGBA')
    r = np.array(pm.resize((max(1, round(crop.width * scale)), max(1, round(crop.height * scale))), Image.BOX)).astype(float)
    k = r[..., 3:4] / 255.0; rgb = np.where(k > .01, r[..., :3] / np.maximum(k, 1e-3), 0)
    return Image.fromarray(np.dstack([np.clip(rgb, 0, 255), (k > .5) * 255]).astype('uint8'), 'RGBA')
for ci, (x0, x1) in enumerate(cols):
    for ri, (y0, y1) in enumerate(rows):
        crop = im.crop((max(0, x0 - 6), y0 - 4, min(im.width, x1 + 6), y1 + 4)); m = np.array(crop)[..., 3] > 128
        ys, xs = np.where(m); top, bot = ys.min(), ys.max()
        hx = np.where(m[top:top + int((bot - top) * .32)].any(axis=0))[0]; cxh = (hx.min() + hx.max()) / 2.0   # căn theo tâm nón (cố định giữa các dáng bước)
        sm = shrink(crop, S); cv = Image.new('RGBA', (CW, CH), (0, 0, 0, 0))
        cv.alpha_composite(sm, (int(round(CW / 2 - cxh * S)), int(round(CH - 1 - (bot + 1) * S))))
        cv.save(os.path.join(OUT, 'slrn'[ci] + str(ri) + '.png'))
x0, x1 = cols[0]; y0 = rows[0][0]; side = x1 - x0 + 10                  # chân dung: nón → ngực của khung đứng nhìn thẳng
p = im.crop((x0 - 5, y0 - 4, x0 - 5 + side, y0 - 4 + side)); p = shrink(p, 48.0 / side)
cv = Image.new('RGBA', (48, 48), (0, 0, 0, 0)); cv.alpha_composite(p, (0, 0)); cv.save(os.path.join(G, 'portrait.png'))
print('ok', len(os.listdir(OUT)), 'frames')
