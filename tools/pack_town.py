# Chạy: python tools/pack_town.py  -> ghi town_assets.js từ img/craftpix/*.png (Craftpix: Bridges, Guild Hall)
# Cầu gỗ thị trấn, cầu tàu Hồ Trăng, mặt tiền Đình làng, NPC dân làng (Citizen / Mage). Đường đá cuội: xem tools/pack_ground.py
import base64, colorsys, io, json
from PIL import Image
D = "img/craftpix/"
S = 2   # 1 điểm ảnh gốc = 2px màn hình, cùng tỉ lệ nền cỏ / đường
op = lambda p: Image.open(D + p).convert("RGBA")
up = lambda im, k=S: im.resize((im.width * k, im.height * k), Image.NEAREST)
def uri(im):
    b = io.BytesIO(); im.save(b, "PNG"); return "data:image/png;base64," + base64.b64encode(b.getvalue()).decode()

# ---- cầu gỗ nằm ngang: lấy THÂN cầu liền một khối (x 292-394), giữ hai đầu trụ + đoạn giữa -> 68px (x2 = 136px) phủ sông 104px + hai bờ cát 16px ----
# (bản cũ ghép đầu trái + thân + đầu phải nên bị hở một khe nước giữa ván cầu)
BR = op("Bridges.png"); Y0, Y1 = 356, 392
M = BR.crop((292, Y0, 395, Y1)); CAP = 14; MIDW = 40
bridge = Image.new("RGBA", (CAP + MIDW + CAP, Y1 - Y0))
bridge.paste(M.crop((0, 0, CAP, M.height)), (0, 0)); bridge.paste(M.crop((CAP, 0, CAP + MIDW, M.height)), (CAP, 0)); bridge.paste(M.crop((M.width - CAP, 0, M.width, M.height)), (CAP + MIDW, 0))

# ---- cầu tàu dọc (rộng ~64px = vừa lối đi ở Hồ Trăng) ----
pier = Image.new("RGBA", (33, 12 + 124))
pier.paste(BR.crop((223, 324, 256, 336)), (0, 0)); pier.paste(BR.crop((223, 337, 256, 461)), (0, 12))   # nguồn có 1 hàng trống giữa đầu cầu và thân

# ---- mặt tiền Đình làng: lấy nhà chính trong Exterior.png, KHÔNG lấy tấm biển "GUILD HALL" ----
EXT = op("Exterior.png"); dinh = EXT.crop((6, 31, 154, 144)); roof = EXT.crop((159, 7, 258, 58)); dp, rp = dinh.load(), roof.load()
GREY = {(159, 144, 136, 255), (179, 163, 152, 255)}          # mái giữa trong nguồn là ô xám giữ chỗ, ngói nằm ở mảnh riêng
yb = next(y for y in range(60) if dp[74, y] == (220, 207, 182, 255))   # hàng đầu tiên của tường be
pts = [(x, y) for y in range(yb) for x in range(40, 108) if dp[x, y] in GREY]
gx, gy = min(p[0] for p in pts), min(p[1] for p in pts); ox = (roof.width - (max(p[0] for p in pts) - gx + 1)) // 2
for x, y in pts: dp[x, y] = rp[ox + x - gx, 4 + y - gy]

# ---- NPC: khung đứng nhìn thẳng (hàng 0), đổi màu váy / quần cho mỗi người ----
def recolor(im, hue_lo, hue_hi, shift, smin=.25, ymin=0):
    im = im.copy(); px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if not a or y < ymin: continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            hh = h * 360
            if s >= smin and (hue_lo <= hh <= hue_hi if hue_lo <= hue_hi else hh >= hue_lo or hh <= hue_hi):
                r2, g2, b2 = colorsys.hsv_to_rgb(((h * 360 + shift) % 360) / 360, s, v); px[x, y] = (int(r2 * 255), int(g2 * 255), int(b2 * 255), a)
    return im
C1 = op("Citizen1_Idle_without_shadow.png").crop((0, 0, 32, 32))   # cô áo xanh lá
C2 = op("Citizen2_Idle_without_shadow.png").crop((0, 0, 32, 32))   # chú áo xám, quần đỏ
mg = op("Mage1_without_shadow.png").crop((0, 0, 48, 52)); mg = mg.crop(mg.getbbox())
girl = lambda sh: recolor(C1, 70, 170, sh)
boy = lambda sh: recolor(C2, 340, 25, sh, ymin=22)   # chỉ đổi quần (tránh đổi màu da / tóc)
npc = {"daisy": C1, "lily": girl(210), "emma": girl(100), "rose": girl(160), "mia": girl(-70),
       "pete": C2, "ben": boy(200), "hai": boy(230), "chef": boy(50), "moss": mg}
d = {"bridge": uri(up(bridge)), "pier": uri(up(pier)), "dinh": uri(up(dinh)), "npc": {k: uri(v) for k, v in npc.items()}}
open("town_assets.js", "w").write("// Tự sinh bởi tools/pack_town.py từ img/craftpix/*.png (Craftpix)\nwindow.TOWN=" + json.dumps(d) + ";\n")
print("OK bridge", bridge.size, "pier", pier.size, "dinh", dinh.size, "npc", len(npc))
