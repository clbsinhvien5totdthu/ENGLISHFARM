# Chạy: python tools/pack_ui.py  -> ghi ui_assets.js (icon 64x64, gộp vào ASSETS.spr) và ui_skin.css (khung 9-slice, biến CSS)
# Mọi hình đều vẽ bằng code (không cần PNG nguồn). Muốn đổi màu / hình: sửa file này rồi chạy lại.
import base64, io, json, math
from PIL import Image, ImageDraw

def uri(im):
    b = io.BytesIO(); im.save(b, "PNG"); return "data:image/png;base64," + base64.b64encode(b.getvalue()).decode()

OUT = (58, 36, 18, 255)   # viền nâu đậm giống bộ icon cũ (ui_bag, ui_coin...)
C = dict(cream="#f8ecc0", cream2="#e4cb8c", cream3="#c9a966", brown="#9a6630", brown2="#b98544", brownD="#63401e",
         red="#d8402f", redD="#a02a22", redL="#f27a62", green="#52b04a", greenD="#2f7d37", greenL="#8fdc6a",
         gold="#f4c93e", goldD="#c98f26", goldL="#ffe98a", gray="#a3acb4", grayD="#6b747c", grayL="#d6dde3",
         blue="#4aa3e0", white="#ffffff")
def col(c): return c if isinstance(c, tuple) else Image.new("RGBA", (1, 1), C.get(c, c)).getpixel((0, 0))

class Cv:
    """Canvas 32x32 vẽ không khử răng cưa, tự thêm viền tối, phóng 2x -> 64x64 (cùng cỡ icon cũ)."""
    def __init__(s): s.im = Image.new("RGBA", (32, 32), (0, 0, 0, 0)); s.d = ImageDraw.Draw(s.im)
    def R(s, x0, y0, x1, y1, c): s.d.rectangle([x0, y0, x1, y1], fill=col(c)); return s
    def P(s, pts, c): s.d.polygon(pts, fill=col(c)); return s
    def E(s, x0, y0, x1, y1, c): s.d.ellipse([x0, y0, x1, y1], fill=col(c)); return s
    def L(s, a, b, c, w=1): s.d.line([a, b], fill=col(c), width=w); return s
    def A(s, box, a0, a1, c, w=2): s.d.arc(box, a0, a1, fill=col(c), width=w); return s
    def clear(s, x0, y0, x1, y1, ell=False):
        (s.d.ellipse if ell else s.d.rectangle)([x0, y0, x1, y1], fill=(0, 0, 0, 0)); return s
    def done(s):
        px = s.im.load(); out = s.im.copy(); op = out.load()
        for y in range(32):
            for x in range(32):
                if px[x, y][3]: continue
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < 32 and 0 <= ny < 32 and px[nx, ny][3]: op[x, y] = OUT; break
        return out.resize((64, 64), Image.NEAREST)

ICONS = {}
def icon(name):
    def deco(fn):
        c = Cv(); fn(c); ICONS[name] = c.done(); return fn
    return deco

@icon("ui_book")           # Sổ từ: sách mở
def _(c):
    c.P([(2, 9), (16, 11), (30, 9), (30, 26), (16, 28), (2, 26)], "brown")
    c.P([(2, 9), (16, 11), (16, 28), (2, 26)], "brownD"); c.P([(16, 11), (30, 9), (30, 26), (16, 28)], "brown")
    c.P([(4, 8), (15, 10), (15, 25), (4, 23)], "cream"); c.P([(17, 10), (28, 8), (28, 23), (17, 25)], "cream")
    c.P([(4, 8), (15, 10), (15, 12), (4, 10)], "white"); c.P([(17, 10), (28, 8), (28, 10), (17, 12)], "white")
    for k in range(4):
        y = 13 + k * 3; c.L((6, y - 1), (13, y + 1), "cream3"); c.L((19, y + 1), (26, y - 1), "cream3")
    c.R(15, 10, 16, 25, "cream2"); c.P([(21, 22), (24, 21), (24, 27), (22.5, 25.5), (21, 27)], "red")

@icon("ui_journal")        # Nhật ký: sổ da có ruy băng
def _(c):
    c.R(7, 3, 25, 29, "brown"); c.R(7, 3, 10, 29, "brownD"); c.R(24, 4, 26, 28, "cream"); c.R(11, 4, 12, 28, "brown2")
    c.R(13, 8, 22, 14, "gold"); c.R(13, 8, 22, 9, "goldL"); c.R(13, 13, 22, 14, "goldD")
    c.L((14, 18), (21, 18), "brown2"); c.L((14, 21), (21, 21), "brown2"); c.L((14, 24), (19, 24), "brown2")
    c.P([(19, 25), (23, 25), (23, 31), (21, 29), (19, 31)], "red")

def speaker(c, mute):
    c.R(3, 12, 8, 20, "gray"); c.R(3, 12, 8, 13, "grayL")
    c.P([(8, 12), (15, 6), (15, 26), (8, 20)], "gray"); c.P([(8, 12), (15, 6), (15, 8), (8, 14)], "grayL"); c.R(13, 10, 15, 22, "grayD")
    if mute:
        c.L((19, 11), (28, 21), "red", 3); c.L((28, 11), (19, 21), "red", 3)
    else:
        c.A((12, 10, 22, 22), -50, 50, "goldL", 2); c.A((11, 6, 28, 26), -55, 55, "gold", 2)
icon("ui_sound")(lambda c: speaker(c, False)); icon("ui_mute")(lambda c: speaker(c, True))

@icon("ui_gear")           # Cài đặt
def _(c):
    for k in range(8):
        a = k * math.pi / 4; ca, sa = math.cos(a), math.sin(a)
        pts = [(16 + ca * r - sa * w, 16 + sa * r + ca * w) for r, w in ((8, -3), (13.5, -2.6), (13.5, 2.6), (8, 3))]
        c.P(pts, "gray")
    c.E(5, 5, 27, 27, "gray"); c.A((6, 6, 26, 26), 180, 290, "grayL", 2); c.A((6, 6, 26, 26), 0, 90, "grayD", 2)
    c.E(11, 11, 21, 21, "grayD"); c.clear(12, 12, 20, 20, True)

@icon("ui_trophy")         # Thành tích
def _(c):
    c.A((2, 6, 12, 18), 90, 270, "goldD", 2); c.A((20, 6, 30, 18), -90, 90, "goldD", 2)
    c.P([(8, 4), (24, 4), (23, 14), (19, 20), (13, 20), (9, 14)], "gold"); c.P([(10, 5), (13, 5), (13, 17), (11, 14)], "goldL")
    c.P([(20, 5), (24, 4), (23, 14), (19, 20), (18, 18), (21, 13)], "goldD")
    c.R(14, 20, 18, 24, "goldD"); c.R(9, 24, 23, 28, "brown"); c.R(9, 24, 23, 25, "brown2"); c.R(9, 27, 23, 28, "brownD")
    c.P([(16, 8), (17.2, 11), (20, 11), (17.8, 13), (18.6, 16), (16, 14.2), (13.4, 16), (14.2, 13), (12, 11), (14.8, 11)], "white")

@icon("ui_pick")           # Cuốc chim (đào đá)
def _(c):
    c.L((6, 28), (23, 11), "brown", 3); c.L((5, 27), (22, 10), "brown2", 1)
    c.P([(11, 8), (17, 3), (24, 4), (28, 9), (29, 17), (26, 14), (23, 11), (19, 9), (14, 11)], "gray")
    c.P([(17, 3), (24, 4), (28, 9), (25, 7), (19, 6)], "grayL"); c.P([(29, 17), (26, 14), (23, 11), (27, 12)], "grayD")

@icon("ui_seed")           # Gói hạt giống
def _(c):
    c.R(7, 4, 25, 29, "cream"); c.R(7, 4, 25, 10, "green"); c.R(7, 9, 25, 10, "greenD"); c.R(23, 11, 25, 29, "cream2")
    for x in (8, 12, 16, 20, 24): c.R(x, 4, x + 1, 5, "greenL")
    c.L((16, 25), (16, 17), "greenD", 2)
    c.P([(16, 20), (10, 14), (9, 19), (13, 22)], "green"); c.P([(16, 18), (23, 12), (23, 17), (19, 20)], "greenL")
    c.R(10, 26, 21, 27, "cream3")

@icon("ui_close")
def _(c): c.L((7, 7), (24, 24), "red", 5); c.L((24, 7), (7, 24), "red", 5); c.L((8, 7), (24, 23), "redL", 1)
@icon("ui_check")
def _(c): c.L((6, 17), (13, 24), "green", 5); c.L((13, 24), (26, 8), "green", 5); c.L((7, 16), (13, 22), "greenL", 1)
@icon("ui_star")
def _(c):
    pts = []
    for k in range(10):
        r = 14 if k % 2 == 0 else 6; a = -math.pi / 2 + k * math.pi / 5; pts.append((16 + r * math.cos(a), 17 + r * math.sin(a)))
    c.P(pts, "gold"); c.P([pts[0], pts[1], (16, 17), pts[9]], "goldL"); c.P([(16, 17), pts[5], pts[4], pts[3]], "goldD")
@icon("ui_arrow_l")
def _(c): c.P([(4, 16), (15, 5), (15, 11), (28, 11), (28, 21), (15, 21), (15, 27)], "gold"); c.R(15, 11, 28, 13, "goldL"); c.R(15, 19, 28, 21, "goldD")
@icon("ui_arrow_r")
def _(c): c.P([(28, 16), (17, 5), (17, 11), (4, 11), (4, 21), (17, 21), (17, 27)], "gold"); c.R(4, 11, 17, 13, "goldL"); c.R(4, 19, 17, 21, "goldD")

# ---------------- khung 9-slice (vẽ ở 1x, CSS phóng nguyên số lần, image-rendering:pixelated) ----------------
def frame(n, slice_, outer, edge, edge2, hi, face, lo=None, notch=True, rings=None):
    """n x n: viền ngoài tối, viền gỗ 2 tông, vạch sáng trong, nền; 4 góc bo nhẹ."""
    im = Image.new("RGBA", (n, n), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    rings = rings or [outer, edge, edge, edge2, hi]
    for i, c in enumerate(rings):
        d.rectangle([i, i, n - 1 - i, n - 1 - i], outline=col(c))
    d.rectangle([len(rings), len(rings), n - 1 - len(rings), n - 1 - len(rings)], fill=col(face))
    if lo:  # vạch tối dưới đáy phần nền (cảm giác nút nổi)
        d.line([(len(rings), n - 1 - len(rings)), (n - 1 - len(rings), n - 1 - len(rings))], fill=col(lo))
    if notch:
        for x, y in ((0, 0), (n - 1, 0), (0, n - 1), (n - 1, n - 1)): im.putpixel((x, y), (0, 0, 0, 0))
    return im

def button(face, hi, lo, edge, edge2, pressed=False):
    n = 12; im = frame(n, 4, OUT, edge, edge2, hi, face, lo, rings=[OUT, edge, edge2, hi])   # viền 4px nguồn = 8px màn hình (gọn cho HUD)
    d = ImageDraw.Draw(im)
    if pressed:
        d.rectangle([4, 4, n - 5, n - 5], fill=col(lo)); d.line([(4, 4), (n - 5, 4)], fill=col(OUT))
    else:
        d.line([(4, n - 5), (n - 5, n - 5)], fill=col(lo))
    return im

SK = {}
SK["panel"] = frame(22, 8, OUT, C["brown2"], C["brown"], C["cream3"], C["cream"])
SK["panel_dark"] = frame(22, 8, OUT, "#7a5430", "#5a3b1f", "#8e6638", "#3f2a15")
SK["tab"] = frame(16, 6, OUT, C["gold"], C["goldD"], C["goldL"], C["cream"])
SK["btn"] = button(C["cream"], C["white"], C["cream2"], "#b9843f", "#8b5d2b")
SK["btn_p"] = button(C["cream"], C["white"], C["cream3"], "#b9843f", "#8b5d2b", True)
SK["btn_ok"] = button(C["green"], C["greenL"], C["greenD"], "#6bd05a", "#3b8f3a")
SK["btn_ok_p"] = button(C["green"], C["greenL"], C["greenD"], "#6bd05a", "#3b8f3a", True)
SK["btn_no"] = button(C["red"], C["redL"], C["redD"], "#e86a55", "#b0352b")
SK["btn_no_p"] = button(C["red"], C["redL"], C["redD"], "#e86a55", "#b0352b", True)
SK["btn_gold"] = button(C["gold"], C["goldL"], C["goldD"], "#f7de78", "#c58f25")
SK["btn_gold_p"] = button(C["gold"], C["goldL"], C["goldD"], "#f7de78", "#c58f25", True)
SK["btn_wood"] = button("#8a5f33", "#b98544", "#5e3a1b", "#a9763a", "#6e4723")
SK["btn_wood_p"] = button("#8a5f33", "#b98544", "#5e3a1b", "#a9763a", "#6e4723", True)
SK["slot"] = frame(14, 5, OUT, "#a9763a", "#7a5430", "#d9c08a", "#f1e2b4")

# ván gỗ lặp ngang cho thanh HUD / thanh dưới (tile 24x20)
plank = Image.new("RGBA", (24, 20), col("#6b4a2b")); pd = ImageDraw.Draw(plank)
pd.rectangle([0, 0, 23, 2], fill=col("#86603a")); pd.rectangle([0, 17, 23, 19], fill=col("#4a3320"))
pd.line([(0, 9), (23, 9)], fill=col("#5e3f22")); pd.line([(0, 10), (23, 10)], fill=col("#7a552f"))
for x, y in ((4, 5), (14, 6), (9, 13), (19, 14), (2, 15)): pd.point((x, y), fill=col("#7a552f")); pd.point((x + 1, y), fill=col("#5a3b1f"))
pd.line([(11, 0), (11, 8)], fill=col("#4a3320")); pd.line([(22, 11), (22, 19)], fill=col("#4a3320"))
SK["plank"] = plank

# thanh chỉ số: nền rãnh + 3 màu đổ đầy (xanh lá stamina, xanh dương EXP, vàng xu)
def fill_tile(a, b, c):
    t = Image.new("RGBA", (8, 14)); td = ImageDraw.Draw(t); td.rectangle([0, 0, 7, 13], fill=col(a))
    td.rectangle([0, 0, 7, 3], fill=col(b)); td.rectangle([0, 10, 7, 13], fill=col(c)); td.line([(7, 0), (7, 13)], fill=col(c)); return t
SK["fill_green"] = fill_tile("#4fc23f", "#a4ee77", "#2a8a2c")
SK["fill_blue"] = fill_tile("#3fa6e8", "#9adcff", "#2468b0")
SK["fill_gold"] = fill_tile("#f4c93e", "#ffe98a", "#b9801f")

# ---------------- ghi file ----------------
spr = {k: uri(v) for k, v in ICONS.items()}
open("ui_assets.js", "w", encoding="utf-8").write(
    "// Tự sinh bởi tools/pack_ui.py — icon UI pixel 64x64, gộp vào ASSETS.spr (nạp TRƯỚC game.js)\n"
    "(function(){var A=window.ASSETS=window.ASSETS||{};A.spr=A.spr||{};var N=" + json.dumps(spr) + ";for(var k in N)A.spr[k]=N[k];})();\n")
css = ":root{\n" + "".join(f"  --sk-{k.replace('_','-')}:url({uri(v)});\n" for k, v in SK.items()) + "}\n"
open("ui_skin.css", "w", encoding="utf-8").write("/* Tự sinh bởi tools/pack_ui.py — ảnh khung 9-slice / ván gỗ / thanh chỉ số dạng biến CSS */\n" + css)

# bản xem thử
sheet = Image.new("RGBA", (64 * 8 + 16, 64 * 2 + 16 + 120), (130, 130, 130, 255))
for i, (k, v) in enumerate(ICONS.items()): sheet.alpha_composite(v, (4 + (i % 8) * 64, 4 + (i // 8) * 64))
x = 4
for k in ("panel", "btn", "btn_ok", "btn_no", "btn_gold", "btn_wood", "slot", "tab", "plank"):
    v = SK[k].resize((SK[k].width * 3, SK[k].height * 3), Image.NEAREST); sheet.alpha_composite(v, (x, 150)); x += v.width + 6
sheet.save("/home/claude/ui_preview.png")
print(len(ICONS), "icon,", len(SK), "khung")
