# Chạy: python tools/pack_village.py  -> ghi village_assets.js từ img/village/*.png (Tiny Top-Down Village, Pixel-Deck, 80x80)
# Mỗi công trình: cắt phần trong suốt thừa, phóng 3x (cùng tỉ lệ nhân vật 40x56 và phòng trong nhà 3x), thêm bóng đổ mềm dưới chân cho đồng bộ.
# Ghép: homes = townhouse + painters (2 căn nhà dân cạnh nhau). Đổi tên: decor = potters (Decor Shop), food = bakery (quầy ăn Chef Bo).
import base64, io, json
from PIL import Image, ImageDraw
D = "img/village/"; S = 3
def load(n):
    im = Image.open(D + n + ".png").convert("RGBA"); im = im.crop(im.getbbox()); return im.resize((im.width * S, im.height * S), Image.NEAREST)
def uri(im):
    b = io.BytesIO(); im.save(b, "PNG"); return "data:image/png;base64," + base64.b64encode(b.getvalue()).decode()
def shadow(im, pad=8):                       # bóng đổ hình elip dưới chân + chừa chỗ cho nó
    out = Image.new("RGBA", (im.width + 16, im.height + pad), (0, 0, 0, 0)); sh = Image.new("RGBA", out.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).ellipse((10, out.height - 26, out.width - 10, out.height - 2), fill=(20, 30, 10, 70))
    out.alpha_composite(sh); out.alpha_composite(im, (8, 0)); return out
def side_by_side(a, b, gap=24):
    c = Image.new("RGBA", (a.width + gap + b.width, max(a.height, b.height)), (0, 0, 0, 0))
    c.alpha_composite(a, (0, c.height - a.height)); c.alpha_composite(b, (a.width + gap, c.height - b.height)); return c
imgs = {"homes": side_by_side(load("townhouse"), load("painters")), "decor": load("potters"), "food": load("bakery"),
        "mill": load("mill"), "school": load("school"), "observatory": load("observatory"), "fisher": load("fisher"), "stable": load("stable"), "wizard": load("wizard")}
d = {}
for k, im in imgs.items():
    im = shadow(im); d[k] = {"src": uri(im), "w": im.width, "h": im.height}
open("village_assets.js", "w").write("// Tự sinh bởi tools/pack_village.py từ img/village/*.png\nwindow.VILLAGE=" + json.dumps(d) + ";\n")
print("OK", {k: (v["w"], v["h"]) for k, v in d.items()})
