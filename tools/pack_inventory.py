# Chạy: python tools/pack_inventory.py  -> ghi inventory_assets.js (sprite túi đồ kiểu Stardew, 64x64, gộp vào ASSETS.spr)
# Mọi hình đều vẽ bằng code, cùng phong cách tools/pack_ui.py (canvas 32x32, tự thêm viền tối, phóng 2x).
# Muốn đổi màu / hình: sửa file này rồi chạy lại. Thêm "--preview" để xuất inv_preview.png xem thử.
import base64, io, json, math, sys
from PIL import Image, ImageDraw

def uri(im):
    b = io.BytesIO(); im.save(b, "PNG"); return "data:image/png;base64," + base64.b64encode(b.getvalue()).decode()

OUT = (58, 36, 18, 255)
C = dict(cream="#f8ecc0", cream2="#e4cb8c", cream3="#c9a966", brown="#9a6630", brown2="#b98544", brownD="#63401e",
         red="#d8402f", redD="#a02a22", redL="#f27a62", green="#52b04a", greenD="#2f7d37", greenL="#8fdc6a",
         gold="#f4c93e", goldD="#c98f26", goldL="#ffe98a", gray="#a3acb4", grayD="#6b747c", grayL="#d6dde3",
         blue="#4aa3e0", blueD="#2f78b0", blueL="#9bd4f5", white="#ffffff", orange="#f08a2c", orangeD="#c0621a",
         wool="#f4efe4", woolD="#d4ccb8", woolS="#b8ad94", pink="#f4a6b8")
def col(c): return c if isinstance(c, tuple) else Image.new("RGBA", (1, 1), C.get(c, c)).getpixel((0, 0))

class Cv:
    def __init__(s): s.im = Image.new("RGBA", (32, 32), (0, 0, 0, 0)); s.d = ImageDraw.Draw(s.im)
    def R(s, x0, y0, x1, y1, c): s.d.rectangle([x0, y0, x1, y1], fill=col(c)); return s
    def P(s, pts, c): s.d.polygon(pts, fill=col(c)); return s
    def E(s, x0, y0, x1, y1, c): s.d.ellipse([x0, y0, x1, y1], fill=col(c)); return s
    def L(s, a, b, c, w=1): s.d.line([a, b], fill=col(c), width=w); return s
    def A(s, box, a0, a1, c, w=2): s.d.arc(box, a0, a1, fill=col(c), width=w); return s
    def dot(s, x, y, c): s.im.putpixel((x, y), col(c)); return s
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

@icon("inv_bag")            # Ba lô: quai xách, thân đỏ, nắp, túi trước màu vàng, khóa
def _(c):
    c.A((10, 1, 22, 11), 180, 360, "brownD", 2); c.R(10, 6, 11, 9, "brownD"); c.R(21, 6, 22, 9, "brownD")
    c.R(2, 15, 5, 27, "brownD"); c.R(27, 15, 30, 27, "brownD"); c.R(3, 16, 4, 26, "brown2")      # dây đeo hai bên
    c.E(5, 5, 27, 20, "red"); c.R(5, 12, 27, 29, "red")                                           # thân
    c.R(25, 12, 27, 29, "redD"); c.R(5, 28, 27, 29, "redD"); c.E(8, 7, 14, 11, "redL")           # đổ bóng + sáng
    c.P([(6, 12), (26, 12), (24, 18), (8, 18)], "redD"); c.R(7, 12, 25, 13, "redL")               # nắp
    c.R(9, 19, 23, 27, "gold"); c.R(9, 19, 23, 20, "goldL"); c.R(9, 26, 23, 27, "goldD")          # túi trước
    c.R(21, 20, 23, 26, "goldD")
    for x in (11, 14, 17): c.dot(x, 23, "goldD")
    c.R(14, 16, 18, 20, "brownD"); c.R(15, 17, 17, 19, "goldL")                                    # khóa

@icon("inv_seed")           # Gói hạt: nhãn có mầm cây
def _(c):
    c.R(7, 3, 25, 29, "cream"); c.R(7, 3, 25, 9, "orange"); c.R(7, 8, 25, 9, "orangeD")
    for x in (8, 12, 16, 20, 24): c.R(x, 3, x + 1, 4, "goldL")
    c.R(23, 10, 25, 29, "cream2")
    c.R(10, 12, 21, 25, "white"); c.R(10, 12, 21, 13, "cream"); c.R(10, 24, 21, 25, "cream2")
    c.L((16, 23), (16, 18), "greenD", 2)
    c.P([(16, 19), (11, 14), (10, 18), (14, 21)], "green"); c.P([(16, 18), (22, 13), (22, 17), (18, 20)], "greenL")
    for x, y in ((12, 22), (19, 22)): c.dot(x, y, "brown")

@icon("inv_basket")         # Giỏ nông sản: cà rốt + táo + lá
def _(c):
    c.P([(9, 9), (14, 2), (17, 8)], "greenD"); c.P([(15, 9), (19, 1), (21, 8)], "green")        # lá cà rốt
    c.P([(8, 8), (15, 8), (12, 18)], "orange"); c.R(10, 10, 11, 11, "goldL")
    c.E(15, 8, 25, 18, "red"); c.E(17, 9, 19, 11, "redL"); c.R(19, 6, 20, 8, "greenD")
    c.P([(3, 15), (29, 15), (26, 29), (6, 29)], "brown2"); c.R(3, 15, 29, 17, "brown")
    for y in (20, 24, 28): c.L((5, y), (27, y), "brownD", 1)
    for x in (9, 14, 19, 24): c.L((x, 17), (x - 1, 29), "brownD", 1)
    c.R(3, 15, 29, 16, "cream3")

@icon("inv_fish")           # Cá
def _(c):
    c.P([(2, 11), (11, 15), (11, 19), (2, 23), (5, 17)], "orangeD")                               # đuôi
    c.E(8, 7, 29, 25, "blue"); c.E(10, 9, 27, 19, "blueL"); c.P([(8, 16), (29, 16), (28, 21), (22, 25), (12, 25), (9, 21)], "blueD")
    c.P([(14, 8), (20, 3), (24, 8)], "orange")                                                    # vây lưng
    c.L((14, 14), (14, 20), "blueD", 1); c.L((18, 13), (18, 21), "blueD", 1)
    c.R(24, 12, 26, 14, "white"); c.R(25, 13, 26, 14, "brownD")                                   # mắt
    c.L((28, 17), (28, 20), "redD", 1)

@icon("inv_wool")           # Cuộn len
def _(c):
    c.E(4, 5, 27, 28, "wool"); c.E(4, 5, 27, 28, "wool"); c.A((5, 6, 26, 27), 20, 110, "woolD", 3)
    c.A((8, 8, 24, 26), 190, 300, "woolS", 2); c.A((6, 12, 25, 22), 200, 330, "woolS", 1); c.A((9, 6, 22, 22), 30, 120, "woolS", 1)
    c.E(8, 8, 13, 12, "white")
    c.L((22, 24), (29, 28), "wool", 2); c.L((24, 26), (30, 29), "woolS", 1); c.E(27, 26, 31, 30, "pink")

@icon("inv_all")            # Tab "Tất cả": lưới 2x2 ô
def _(c):
    for x0, y0, f in ((3, 3, "gold"), (17, 3, "cream2"), (3, 17, "cream2"), (17, 17, "gold")):
        c.R(x0, y0, x0 + 11, y0 + 11, f); c.R(x0, y0, x0 + 11, y0 + 1, "goldL"); c.R(x0, y0 + 10, x0 + 11, y0 + 11, "goldD")

@icon("inv_sort")           # Nút "Sắp xếp": hai mũi tên đảo chiều
def _(c):
    c.P([(11, 3), (19, 12), (14, 12), (14, 28), (8, 28), (8, 12), (3, 12)], "green"); c.R(8, 12, 9, 28, "greenL")
    c.P([(21, 29), (29, 20), (24, 20), (24, 4), (18, 4), (18, 20), (13, 20)], "blue"); c.R(18, 4, 19, 20, "blueL")

@icon("inv_hand")           # Dấu "đang cầm trên tay": bàn tay găng
def _(c):
    c.R(9, 14, 23, 28, "cream"); c.R(9, 26, 23, 28, "cream2")
    for i, x in enumerate((9, 13, 17, 21)): c.R(x, 4 + (i % 2) * 2, x + 2, 15, "cream"); c.R(x + 2, 6, x + 2, 15, "cream2")
    c.P([(9, 17), (3, 13), (2, 18), (9, 24)], "cream"); c.R(9, 25, 23, 28, "greenD"); c.R(9, 25, 23, 26, "green")

@icon("inv_lock")           # Ô khóa (chưa mở)
def _(c):
    c.A((9, 3, 23, 19), 180, 360, "grayD", 3); c.R(7, 14, 25, 28, "gold"); c.R(7, 14, 25, 15, "goldL"); c.R(7, 27, 25, 28, "goldD")
    c.R(15, 18, 17, 24, "brownD")

if __name__ == "__main__":
    js = "// Tự sinh bởi tools/pack_inventory.py — sprite túi đồ kiểu Stardew 64x64, gộp vào ASSETS.spr (nạp TRƯỚC game.js)\n" + \
         "(function(){var A=window.ASSETS=window.ASSETS||{};A.spr=A.spr||{};var N=" + json.dumps({k: uri(v) for k, v in ICONS.items()}, indent=0) + \
         ";for(var k in N)A.spr[k]=N[k];})();\n"
    open("inventory_assets.js", "w", encoding="utf-8").write(js)
    print("ghi inventory_assets.js:", ", ".join(ICONS))
    if "--preview" in sys.argv:
        names = list(ICONS); sheet = Image.new("RGBA", (len(names) * 72, 80), (226, 189, 120, 255))
        for i, n in enumerate(names): sheet.alpha_composite(ICONS[n], (i * 72 + 4, 8))
        sheet.resize((sheet.width * 2, sheet.height * 2), Image.NEAREST).save("/home/claude/inv_preview.png")
