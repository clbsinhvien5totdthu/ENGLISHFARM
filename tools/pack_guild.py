# Chạy: python tools/pack_guild.py  -> ghi guild_assets.js: phòng trong ĐÌNH LÀNG (phòng 336x224px, game phóng 3x).
# Vỏ phòng (sàn gỗ, tường, hai chái) lấy từ Craftpix Guild Hall tầng 1 (img/craftpix/guild/Interior_1st_floor.tmx, bỏ hết đồ đạc kiểu phường hội/rồng xương),
# đổi gạch xanh sang tông ấm, rồi vẽ pixel-art đồ đình làng Việt: hoành phi, câu đối, bàn thờ (đỉnh hương, đèn nến, mâm ngũ quả), cột sơn son, chiếu hoa + mâm trà,
# đệm ngồi, trống đình + chiêng, bảng tin làng, tủ sách, lồng đèn, và cụ Đình trưởng ngồi viết sổ. Chữ "ĐÌNH LÀNG" trên hoành phi do game vẽ đè lên (GUILD.plaque).
import base64, io, json
import xml.etree.ElementTree as ET
from PIL import Image, ImageDraw
D = "img/craftpix/guild/"; KEEP = {"Floor", "Walls", "Walls_top"}

# ---------- 1) vỏ phòng từ TMX ----------
root = ET.parse(D + "Interior_1st_floor.tmx").getroot(); ts = []
for t in root.findall("tileset"):
    src = t.find("image").get("source").split("/")[-1]
    try: img = Image.open(D + src).convert("RGBA")
    except Exception: img = None
    ts.append((int(t.get("firstgid")), int(t.get("columns")), img))
ts.sort()
def tile(g):
    g &= 0x0FFFFFFF
    for fg, cols, img in reversed(ts):
        if g >= fg:
            if img is None: return None
            i = g - fg; x, y = (i % cols) * 16, (i // cols) * 16; return img.crop((x, y, x + 16, y + 16))
cells = []; x0 = y0 = 10**9; x1 = y1 = -10**9
for L in root.findall("layer"):
    for c in L.find("data").findall("chunk"):
        cx, cy, w = int(c.get("x")), int(c.get("y")), int(c.get("width"))
        for i, v in enumerate([int(v) for v in c.text.replace("\n", "").split(",") if v.strip()]):
            if v: X, Y = cx + i % w, cy + i // w; cells.append((L.get("name"), X, Y, v)); x0, x1, y0, y1 = min(x0, X), max(x1, X), min(y0, Y), max(y1, Y)
room = Image.new("RGBA", ((x1 - x0 + 1) * 16, (y1 - y0 + 1) * 16))
for n in [l.get("name") for l in root.findall("layer")]:
    if n not in KEEP: continue
    for (ln, X, Y, v) in cells:
        if ln == n:
            t = tile(v)
            if t: room.alpha_composite(t, ((X - x0) * 16, (Y - y0) * 16))
# gạch xanh -> nâu ấm (hợp đình gỗ)
px = room.load()
for yy in range(room.height):
    for xx in range(room.width):
        r, g, b, a = px[xx, yy]
        if a and b > r + 8:
            l = (r + g + b) / 3; px[xx, yy] = (min(255, int(l * 1.18)), int(l * .86), int(l * .62), a)

# ---------- 2) vẽ đồ đình ----------
OUT = (43, 21, 13, 255); WOOD = [(58, 33, 20, 255), (90, 55, 31, 255), (128, 80, 44, 255), (160, 106, 60, 255)]
RED = [(92, 20, 16, 255), (150, 34, 26, 255), (190, 56, 42, 255), (222, 96, 74, 255)]; GOLD = [(150, 104, 24, 255), (222, 170, 52, 255), (250, 218, 110, 255)]
d = ImageDraw.Draw(room)
def R(x, y, w, h, c): d.rectangle((x, y, x + w - 1, y + h - 1), fill=c)
def P(x, y, c): d.point((x, y), fill=c)
def shade(x, y, w, h, base):                  # khối có viền + sáng trái / tối phải
    R(x, y, w, h, OUT); R(x + 1, y + 1, w - 2, h - 2, base[1]); R(x + 1, y + 1, 1, h - 2, base[2]); R(x + w - 2, y + 1, 1, h - 2, base[0])
def pillar(cx, base):                         # cột sơn son: chân đá, thân đỏ, hai đai vàng, đầu cột gỗ
    x = cx - 5; h = 50; top = base - h
    R(x - 2, base - 6, 14, 6, OUT); R(x - 1, base - 5, 12, 4, (138, 130, 118, 255)); R(x - 1, base - 5, 12, 1, (176, 168, 152, 255))
    shade(x + 1, top + 4, 8, h - 8, RED)
    for yy in (top + 12, base - 18): R(x + 1, yy, 8, 3, OUT); R(x + 1, yy + 1, 8, 1, GOLD[1]); P(x + 2, yy + 1, GOLD[2])
    R(x - 2, top, 14, 5, OUT); R(x - 1, top + 1, 12, 3, WOOD[2]); R(x - 1, top + 1, 12, 1, WOOD[3])
def lantern(cx, top, s=1):                    # lồng đèn đỏ treo
    R(cx, top, 1, 4, OUT); w = 11 * s
    R(cx - 5, top + 4, 11, 2, OUT); R(cx - 4, top + 5, 9, 1, GOLD[1])
    d.ellipse((cx - 6, top + 6, cx + 6, top + 17), fill=OUT); d.ellipse((cx - 5, top + 7, cx + 5, top + 16), fill=RED[2])
    d.ellipse((cx - 3, top + 8, cx + 1, top + 12), fill=RED[3]); R(cx - 1, top + 7, 1, 9, RED[1])
    R(cx - 4, top + 17, 9, 2, OUT); R(cx - 3, top + 17, 7, 1, GOLD[1]); R(cx, top + 19, 1, 4, RED[2]); R(cx - 1, top + 22, 3, 2, GOLD[1])
def couplet(x, y):                            # câu đối: đôi liễn đỏ dọc, chữ vàng giả
    R(x, y, 10, 42, OUT); R(x + 1, y + 1, 8, 40, RED[1]); R(x + 1, y + 1, 1, 40, RED[2]); R(x + 1, y + 1, 8, 1, GOLD[1]); R(x + 1, y + 40, 8, 1, GOLD[1])
    for i in range(6):
        yy = y + 5 + i * 6; R(x + 3, yy, 4, 1, GOLD[2]); R(x + 4, yy + 1, 1, 3, GOLD[1]); R(x + 3, yy + 3, 4, 1, GOLD[1])
    R(x + 4, y - 2, 2, 2, GOLD[1]); R(x + 4, y + 42, 2, 2, GOLD[1])
def plaque(x, y, w, h):                       # hoành phi: bảng đỏ viền vàng (chữ do game vẽ)
    R(x, y, w, h, OUT); R(x + 1, y + 1, w - 2, h - 2, GOLD[1]); R(x + 2, y + 2, w - 4, h - 4, RED[1]); R(x + 2, y + 2, w - 4, 1, RED[2])
    for xx in (x + 4, x + w - 5): R(xx, y - 3, 1, 3, OUT)
def altar(cx, base):                          # bàn thờ: mặt gỗ, khăn đỏ viền vàng, đỉnh hương, 2 nến, 2 bình sen, mâm ngũ quả
    w = 66; x = cx - w // 2
    R(x + 2, base - 5, 5, 5, OUT); R(x + w - 7, base - 5, 5, 5, OUT); R(x + 3, base - 5, 3, 4, WOOD[1]); R(x + w - 6, base - 5, 3, 4, WOOD[1])
    R(x, base - 24, w, 20, OUT); R(x + 1, base - 23, w - 2, 18, RED[1]); R(x + 1, base - 23, w - 2, 2, RED[2])
    R(x + 1, base - 7, w - 2, 2, GOLD[1])
    for i in range(7): xx = x + 6 + i * 9; R(xx, base - 17, 3, 3, GOLD[1]); P(xx + 1, base - 16, GOLD[2]); R(xx + 1, base - 14, 1, 2, GOLD[0])
    R(x - 2, base - 28, w + 4, 6, OUT); R(x - 1, base - 27, w + 2, 4, WOOD[2]); R(x - 1, base - 27, w + 2, 1, WOOD[3])
    t = base - 28
    # đỉnh hương đồng (giữa): chân ba, thân tròn, khói do game vẽ
    R(cx - 8, t - 3, 17, 3, OUT); R(cx - 7, t - 2, 15, 1, GOLD[0]); d.ellipse((cx - 8, t - 14, cx + 8, t - 2), fill=OUT); d.ellipse((cx - 7, t - 13, cx + 7, t - 3), fill=GOLD[0])
    d.ellipse((cx - 6, t - 12, cx + 2, t - 6), fill=GOLD[1]); R(cx - 7, t - 12, 15, 2, GOLD[1]); R(cx - 6, t - 12, 13, 1, (84, 40, 20, 255))
    for k, dx in enumerate((-3, 0, 3)): R(cx + dx, t - 20 - (k % 2), 1, 8, (190, 40, 28, 255)); P(cx + dx, t - 21 - (k % 2), (255, 190, 80, 255))
    # nến hai bên
    for dx in (-19, 19):
        R(cx + dx - 3, t - 2, 7, 2, OUT); R(cx + dx - 2, t - 2, 5, 1, GOLD[1]); R(cx + dx - 2, t - 11, 4, 9, OUT); R(cx + dx - 1, t - 10, 2, 8, RED[2]); R(cx + dx - 2, t - 12, 4, 1, GOLD[1]); P(cx + dx - 1, t - 14, GOLD[2]); P(cx + dx - 1, t - 13, (255, 150, 40, 255))
    # bình sen
    for dx in (-30, 30):
        R(cx + dx - 3, t - 12, 7, 11, OUT); R(cx + dx - 2, t - 11, 5, 9, (52, 110, 120, 255)); R(cx + dx - 2, t - 11, 1, 9, (96, 170, 170, 255)); R(cx + dx - 2, t - 8, 5, 1, GOLD[1])
        R(cx + dx, t - 18, 1, 7, (52, 120, 60, 255)); d.ellipse((cx + dx - 3, t - 24, cx + dx + 3, t - 17), fill=(242, 150, 178, 255)); P(cx + dx, t - 22, (255, 232, 140, 255)); P(cx + dx - 2, t - 21, (255, 200, 214, 255))
    # mâm ngũ quả trước bàn thờ
    d.ellipse((cx - 11, t + 1, cx + 11, t + 6), fill=OUT); d.ellipse((cx - 10, t + 1, cx + 10, t + 5), fill=GOLD[1])
    for dx, c in ((-6, (214, 60, 40, 255)), (-2, (240, 190, 40, 255)), (2, (120, 190, 70, 255)), (6, (230, 120, 40, 255)), (0, (210, 70, 110, 255))): d.ellipse((cx + dx - 2, t - 3 + (abs(dx) // 3), cx + dx + 2, t + 2), fill=c); P(cx + dx - 1, t - 2 + (abs(dx) // 3), (255, 255, 255, 140))
def mat(x, y, w, h):                          # chiếu cói dệt, viền đỏ + chỉ vàng
    R(x, y, w, h, OUT); R(x + 1, y + 1, w - 2, h - 2, RED[1]); R(x + 3, y + 3, w - 6, h - 6, GOLD[0]); R(x + 4, y + 4, w - 8, h - 8, (214, 182, 96, 255))
    for yy in range(y + 4, y + h - 4):
        for xx in range(x + 4, x + w - 4):
            if (yy - y) % 3 == 0: P(xx, yy, (190, 154, 76, 255))
            elif (xx - x + ((yy - y) // 3) * 2) % 6 == 0: P(xx, yy, (228, 198, 116, 255))
    R(x + 2, y + 2, w - 4, 1, GOLD[1]); R(x + 2, y + h - 3, w - 4, 1, GOLD[1])
    for xx in range(x + 8, x + w - 8, 10): R(xx, y + 1, 3, 1, GOLD[2]); R(xx, y + h - 2, 3, 1, GOLD[2])
def cushion(cx, cy):                          # đệm tròn đỏ
    d.ellipse((cx - 7, cy - 4, cx + 7, cy + 4), fill=OUT); d.ellipse((cx - 6, cy - 3, cx + 6, cy + 3), fill=RED[2]); d.ellipse((cx - 4, cy - 3, cx + 1, cy), fill=RED[3]); P(cx, cy, GOLD[2]); P(cx + 1, cy, GOLD[1])
def teatable(cx, cy):                         # mâm gỗ thấp + ấm chén
    x = cx - 18; R(x, cy, 37, 15, OUT); R(x + 1, cy + 1, 35, 7, WOOD[2]); R(x + 1, cy + 1, 35, 1, WOOD[3]); R(x + 1, cy + 8, 35, 6, WOOD[0]); R(x + 3, cy + 15, 4, 3, OUT); R(x + 30, cy + 15, 4, 3, OUT)
    R(cx - 7, cy - 6, 10, 7, OUT); R(cx - 6, cy - 5, 8, 5, (236, 236, 226, 255)); R(cx - 6, cy - 5, 2, 5, (190, 200, 214, 255)); R(cx - 9, cy - 4, 2, 3, OUT); R(cx + 3, cy - 7, 2, 4, OUT); R(cx - 6, cy - 8, 6, 2, (236, 236, 226, 255)); R(cx - 6, cy - 9, 6, 1, OUT)
    for dx in (8, 13): R(cx + dx, cy - 2, 4, 3, OUT); R(cx + dx + 1, cy - 2, 2, 2, (236, 236, 226, 255))
    R(cx - 15, cy - 3, 6, 4, OUT); R(cx - 14, cy - 3, 4, 3, (200, 60, 44, 255)); R(cx - 13, cy - 4, 2, 1, GOLD[1])
def drum(cx, base):                           # trống đình trên giá gỗ + dùi
    R(cx - 15, base - 6, 5, 6, OUT); R(cx + 11, base - 6, 5, 6, OUT); R(cx - 14, base - 5, 3, 4, WOOD[2]); R(cx + 12, base - 5, 3, 4, WOOD[2])
    R(cx - 14, base - 14, 4, 9, OUT); R(cx + 11, base - 14, 4, 9, OUT); R(cx - 13, base - 13, 2, 8, WOOD[2]); R(cx + 12, base - 13, 2, 8, WOOD[2])
    d.ellipse((cx - 14, base - 34, cx + 15, base - 6), fill=OUT); d.ellipse((cx - 13, base - 33, cx + 14, base - 7), fill=RED[1])
    d.ellipse((cx - 10, base - 30, cx + 11, base - 10), fill=GOLD[0]); d.ellipse((cx - 9, base - 29, cx + 10, base - 11), fill=(226, 196, 136, 255)); d.ellipse((cx - 5, base - 25, cx + 6, base - 15), fill=(206, 170, 110, 255))
    import math
    for k in range(14): a = k / 14 * 6.2832; P(int(cx + .5 + 12 * math.cos(a)), int(base - 20 + 12.5 * math.sin(a)), GOLD[2])
    R(cx + 18, base - 12, 2, 10, OUT); R(cx + 18, base - 12, 1, 9, WOOD[3])
def gong(cx, base):                           # chiêng đồng treo khung gỗ
    R(cx - 12, base - 30, 3, 30, OUT); R(cx + 10, base - 30, 3, 30, OUT); R(cx - 11, base - 29, 1, 28, WOOD[2]); R(cx + 11, base - 29, 1, 28, WOOD[2]); R(cx - 12, base - 32, 26, 3, OUT); R(cx - 11, base - 31, 24, 1, WOOD[3])
    d.ellipse((cx - 9, base - 26, cx + 10, base - 6), fill=OUT); d.ellipse((cx - 8, base - 25, cx + 9, base - 7), fill=GOLD[0]); d.ellipse((cx - 7, base - 24, cx + 5, base - 12), fill=GOLD[1]); d.ellipse((cx - 3, base - 20, cx + 3, base - 14), fill=GOLD[2]); R(cx, base - 31, 1, 6, OUT)
def noticeboard(x, base):                     # bảng tin làng: khung gỗ + giấy dán + hai mảnh đỏ
    w = 38; h = 40; top = base - h
    R(x + 3, base - 5, 3, 5, OUT); R(x + w - 6, base - 5, 3, 5, OUT)
    R(x, top, w, h - 4, OUT); R(x + 1, top + 1, w - 2, h - 6, WOOD[1]); R(x + 3, top + 3, w - 6, h - 10, (206, 176, 118, 255))
    for (px_, py_, ww, hh, c) in ((x + 5, top + 5, 11, 9, (245, 238, 220, 255)), (x + 19, top + 5, 12, 8, (245, 238, 220, 255)), (x + 6, top + 17, 9, 10, RED[2]), (x + 18, top + 16, 13, 11, (245, 238, 220, 255))):
        R(px_, py_, ww, hh, OUT); R(px_ + 1, py_ + 1, ww - 2, hh - 2, c)
        for k in range(2, hh - 2, 3): R(px_ + 2, py_ + k, ww - 4, 1, (120, 96, 70, 255) if c != RED[2] else GOLD[1])
def cabinet(x, base):                         # tủ sổ sách: thân gỗ, hai cánh, sổ + bút lông trên nóc
    w = 42; h = 26; top = base - h
    R(x, top, w, h, OUT); R(x + 1, top + 1, w - 2, h - 2, WOOD[1]); R(x + 1, top + 1, w - 2, 2, WOOD[3])
    for dx in (3, 22): R(dx + x, top + 5, 17, 17, OUT); R(dx + x + 1, top + 6, 15, 15, WOOD[2]); R(dx + x + 7, top + 12, 3, 3, GOLD[1])
    R(x + 5, top - 5, 14, 5, OUT); R(x + 6, top - 4, 12, 3, (236, 226, 200, 255)); R(x + 6, top - 4, 12, 1, RED[2]); R(x + 24, top - 7, 9, 7, OUT); R(x + 25, top - 6, 7, 5, (52, 110, 120, 255))
    R(x + 28, top - 14, 1, 8, OUT); R(x + 27, top - 16, 3, 3, (30, 20, 20, 255))
def elder(cx, base):                          # cụ Đình trưởng ngồi xếp bằng, áo dài gấm xanh, khăn đóng đen, râu bạc, tay cầm bút
    ROBE = [(26, 56, 92, 255), (44, 92, 138, 255), (76, 134, 178, 255)]
    d.ellipse((cx - 11, base - 7, cx + 11, base + 1), fill=OUT); d.ellipse((cx - 10, base - 7, cx + 10, base), fill=ROBE[1])
    R(cx - 8, base - 22, 17, 17, OUT); R(cx - 7, base - 21, 15, 16, ROBE[1]); R(cx - 7, base - 21, 3, 16, ROBE[2]); R(cx + 5, base - 21, 3, 16, ROBE[0]); R(cx - 1, base - 21, 1, 14, GOLD[1]); R(cx - 7, base - 10, 15, 1, GOLD[1])
    R(cx - 11, base - 16, 5, 7, OUT); R(cx - 10, base - 15, 3, 5, ROBE[1]); R(cx + 7, base - 16, 5, 7, OUT); R(cx + 8, base - 15, 3, 5, ROBE[1])
    R(cx - 5, base - 33, 11, 11, OUT); R(cx - 4, base - 32, 9, 9, (232, 190, 150, 255)); R(cx - 4, base - 29, 2, 1, OUT); R(cx + 2, base - 29, 2, 1, OUT)
    R(cx - 5, base - 25, 11, 3, OUT); R(cx - 4, base - 24, 9, 4, (240, 240, 236, 255)); R(cx - 3, base - 20, 7, 3, (240, 240, 236, 255)); R(cx - 1, base - 18, 3, 2, (214, 214, 210, 255))
    R(cx - 6, base - 39, 13, 7, OUT); R(cx - 5, base - 38, 11, 5, (32, 28, 30, 255)); R(cx - 5, base - 38, 11, 1, (70, 64, 70, 255)); R(cx - 6, base - 33, 13, 1, GOLD[1])
def vase(cx, base):                           # lọ hoa lớn men xanh
    R(cx - 7, base - 18, 14, 18, OUT); R(cx - 6, base - 17, 12, 16, (46, 100, 120, 255)); R(cx - 6, base - 17, 3, 16, (96, 164, 170, 255)); R(cx - 6, base - 11, 12, 1, GOLD[1]); R(cx - 4, base - 20, 8, 3, OUT); R(cx - 3, base - 19, 6, 1, (46, 100, 120, 255))
    for dx, dy, c in ((-6, -33, (240, 150, 176, 255)), (0, -38, (250, 210, 90, 255)), (6, -32, (240, 150, 176, 255))): R(cx + dx // 3, base - 21 + dy // 2 + 8, 1, 14 - dy // 4 - 8, (52, 120, 60, 255)); d.ellipse((cx + dx - 3, base + dy - 2, cx + dx + 3, base + dy + 4), fill=c); P(cx + dx, base + dy + 1, (255, 240, 200, 255))

# --- bố trí (toạ độ px phòng 336x224; sàn chính x66-266 y78-190, hai chái x18-64 / 270-318 y105-157) ---
for cx in (94, 238): pillar(cx, 94)                      # hai cột sau
couplet(114, 33); couplet(212, 33)
plaque(124, 33, 84, 15)
for cx in (80, 110, 222, 252): lantern(cx, 28)
altar(166, 94)
noticeboard(22, 110)                                     # chái trái: bảng tin làng
cabinet(272, 110)                                        # chái phải: tủ sổ sách
vase(288, 156)
mat(114, 100, 104, 62)
cushion(128, 152); cushion(204, 152)
elder(166, 133)                                          # cụ ngồi sau mâm trà, ngay dưới bàn thờ
teatable(166, 131)
drum(36, 152); gong(66, 154)                             # chái trái phía trước: trống đình + chiêng
vase(76, 184); vase(256, 184)
for yy in range(160, 190):                               # thảm đỏ từ cửa vào
    R(152, yy, 28, 1, RED[1]); R(152, yy, 1, 1, OUT); R(179, yy, 1, 1, OUT)
    if yy % 6 == 0: R(158, yy, 16, 1, GOLD[1])
b = io.BytesIO(); room.save(b, "PNG")
meta = {"plaque": [166, 41], "burner": [166, 46], "candles": [[147, 52], [185, 52]]}
open("guild_assets.js", "w").write("// Tự sinh bởi tools/pack_guild.py (vỏ phòng Craftpix Guild Hall + đồ đình vẽ bằng code)\nwindow.GUILD=" + json.dumps({"room": "data:image/png;base64," + base64.b64encode(b.getvalue()).decode(), "w": room.width, "h": room.height, **meta}) + ";\n")
room.save("/tmp/dinh_room.png"); print("OK", room.size)
