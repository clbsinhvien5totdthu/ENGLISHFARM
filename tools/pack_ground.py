# Chạy: python tools/pack_ground.py  -> ghi ground_assets.js từ tiled/ground_grass_details.png
# Chỉ lấy các ô 16x16 là cỏ (xanh) để rải lên nền cỏ; các ô nâu (đốm đất) bỏ qua.
import base64, json
from PIL import Image
p = "tiled/ground_grass_details.png"
im = Image.open(p).convert("RGBA"); cols = im.width // 16; rows = im.height // 16
tufts = []
for r in range(rows):
    for c in range(cols):
        px = [q for q in im.crop((c*16, r*16, c*16+16, r*16+16)).getdata() if q[3] > 0]
        if len(px) >= 6 and sum(1 for q in px if q[1] > q[0] + 20) > len(px) / 2: tufts.append(r * cols + c)

# ---- đường đất: 47 ô 64px ghép từ tile gốc trong tiled/ (đất nền + đá cuội) + viền cỏ lởm chởm, theo 4 hướng + 4 góc chéo ----
import random, io
S = 32; rn = random.Random(3)
NZ = [[[rn.random() for _ in range(S)] for _ in range(S)] for _ in range(4)]   # nhiễu tuần hoàn 32px -> ô nào cũng liền mạch với ô bên cạnh
EX = Image.open("tiled/exterior.png").convert("RGBA")
tl = lambda c, r: EX.crop((c*16, r*16, c*16+16, r*16+16))
DIRT = tl(2, 21).getpixel((0, 0))[:3]                      # ô đất nền phẳng (Ground của Exterior.tmx)
COB = tl(2, 11); COB_EDGE = (199, 168, 150)                # ô giữa của dải đá cuội (Road) lát lặp 16px; viền ngoài dải
def base(x, y, m, c, k):
    a, b = k, S - k; ix, iy = a <= x < b, a <= y < b
    if ix and iy: return True
    if ix and ((y < a and m & 1) or (y >= b and m & 4)): return True
    if iy and ((x >= b and m & 2) or (x < a and m & 8)): return True
    return (x >= b and y < a and c & 1) or (x >= b and y >= b and c & 2) or (x < a and y >= b and c & 4) or (x < a and y < a and c & 8)
D4 = ((1,0), (-1,0), (0,1), (0,-1))
def ragged(x, y, m, c, k, z):      # biên lởm chởm: bớt ~35% điểm biên, thêm ~25% điểm ngay ngoài biên
    b = base(x, y, m, c, k); nb = [base(x+dx, y+dy, m, c, k) for dx, dy in D4]
    if b and not all(nb): return NZ[z][x%S][y%S] > .35
    if not b and any(nb): return NZ[z+1][x%S][y%S] < .25
    return b
def tile(m, c, fill=None):
    dm, cm = {}, {}
    dirt = lambda x, y: dm.setdefault((x, y), ragged(x, y, m, c, 2, 0))
    cob = lambda x, y: cm.setdefault((x, y), dirt(x, y) and ragged(x, y, m, c, 8, 2))
    im2 = Image.new("RGBA", (S, S), (0,0,0,0))
    for y in range(S):
        for x in range(S):
            if not dirt(x, y): continue
            edge = not all(dirt(x+dx, y+dy) for dx, dy in D4)
            if edge: col = (79,116,62) if NZ[1][x][y] < .8 else (111,156,80)
            elif any(not all(dirt(x+dx+ex, y+dy+ey) for ex, ey in D4) for dx, dy in D4) and NZ[3][x][y] < .3: col = (111,156,80)
            elif fill is not None: col = fill.getpixel((x % 32, y % 32))[:3]   # đường đá cuội Craftpix (thị trấn)
            elif cob(x, y): col = COB_EDGE if not all(cob(x+dx, y+dy) for dx, dy in D4) else COB.getpixel((x % 16, y % 16))[:3]
            else: col = DIRT
            im2.putpixel((x, y), col + (255,))
    return im2
import numpy as np
CBR = Image.open("img/craftpix/Road5_grass.png").convert("RGBA"); A = np.array(CBR)   # đá cuội màu be (Craftpix Path and Road, Road5)
ok = ((A[:,:,3] == 255) & (A[:,:,0] >= A[:,:,1])).astype(int); ii = np.pad(ok.cumsum(0).cumsum(1), ((1,0),(1,0)))   # ô đặc, không dính cỏ
win = ii[32:,32:] - ii[:-32,32:] - ii[32:,:-32] + ii[:-32,:-32]; wy, wx = np.argwhere(win == 32*32)[0]
COBFILL = CBR.crop((wx, wy, wx+32, wy+32))
frames = [(m, c) for m in range(16) for c in range(16) if c & ~((m&1 and m&2 and 1) | (m&2 and m&4 and 2) | (m&4 and m&8 and 4) | (m&8 and m&1 and 8)) == 0]
RC = 8
def atlas_uri(fill=None):
    atlas = Image.new("RGBA", (RC*S, -(-len(frames)//RC)*S))
    for i, (m, c) in enumerate(frames): atlas.paste(tile(m, c, fill), (i % RC * S, i // RC * S))
    atlas = atlas.resize((atlas.width*2, atlas.height*2), Image.NEAREST)   # 1 điểm ảnh đất = 2px màn hình (cùng tỉ lệ cụm cỏ)
    buf = io.BytesIO(); atlas.save(buf, "PNG"); return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()
d = {"road": atlas_uri(), "road2": atlas_uri(COBFILL), "rf": {str(m*16+c): i for i, (m, c) in enumerate(frames)}, "det": "data:image/png;base64," + base64.b64encode(open(p, "rb").read()).decode(), "cols": cols, "tufts": tufts, "base": [122, 173, 85]}
open("ground_assets.js", "w").write("// Tự sinh bởi tools/pack_ground.py từ tiled/*.png\nwindow.GROUND=" + json.dumps(d) + ";\n")
print("OK", len(tufts), "tufts")
