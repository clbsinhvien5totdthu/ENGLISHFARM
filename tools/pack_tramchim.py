# Vẽ pixel-art Vườn quốc gia Tràm Chim (lưới 16px phóng 2x, nhìn thẳng từ trên xuống, sáng từ trên-trái) -> tramchim_assets.js
# chạy: python3 tools/pack_tramchim.py   (cần Pillow)
import base64, io, json, os, random
from PIL import Image
S = 2
def hx(c): c = c.lstrip('#'); return tuple(int(c[i:i+2], 16) for i in (0, 2, 4)) + (255,)
def img(w, h, bg=None): return Image.new('RGBA', (w, h), hx(bg) if bg else (0, 0, 0, 0))
def px(im, x, y, c):
    if 0 <= x < im.width and 0 <= y < im.height: im.putpixel((x, y), hx(c))
def disc(im, cx, cy, r, c, mask=None):
    for y in range(int(cy - r - 1), int(cy + r + 2)):
        for x in range(int(cx - r - 1), int(cx + r + 2)):
            if (x + .5 - cx) ** 2 + (y + .5 - cy) ** 2 <= r * r: px(im, x, y, c)
def line(im, x0, y0, x1, y1, c):
    n = max(abs(x1 - x0), abs(y1 - y0), 1)
    for i in range(n + 1): px(im, round(x0 + (x1 - x0) * i / n), round(y0 + (y1 - y0) * i / n), c)
def up(im): return im.resize((im.width * S, im.height * S), Image.NEAREST)
def b64(im): b = io.BytesIO(); up(im).save(b, 'PNG'); return 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()

P = dict(deep=['#2c6872', '#38808a', '#235660'], shal=['#4a9696', '#62adab', '#3c8587'], wmud=['#56432d', '#68523a', '#3d3022'],
         dmud=['#8a7350', '#9d8661', '#6f5b3e'], grass=['#8c9c47', '#a1b058', '#76873b'], sedge=['#a59b4a', '#bbaf5c', '#867d3a'],
         wood=['#62793a', '#73893f', '#4f6330'], lit=['#7b6a3a', '#8a7845'])
def speck(base, cols, n, rnd, w=16, h=16):
    im = img(w, h, base)
    for _ in range(n): px(im, rnd.randrange(w), rnd.randrange(h), rnd.choice(cols))
    return im
def water(k, rnd, deep):
    c = P['deep' if deep else 'shal']; im = img(16, 16, c[0])
    for _ in range(3 if deep else 4):
        x, y, l = rnd.randrange(1, 11), rnd.randrange(1, 15), rnd.choice([3, 4, 5])
        for i in range(l): px(im, x + i, y, c[1])
        px(im, x + l, y + 1, c[2])       # bóng dưới-phải của gợn sóng (sáng từ trên-trái)
    if not deep:
        for _ in range(5): px(im, rnd.randrange(16), rnd.randrange(16), c[2])
    return im
def ground(base_key, k, rnd, extra=None):
    c = P[base_key]; im = speck(c[0], c[1:] + [c[0]], 26, rnd)
    for _ in range(4):
        x, y = rnd.randrange(1, 14), rnd.randrange(2, 15)
        px(im, x, y, c[1]); px(im, x, y - 1, c[1])      # mầm / nhấp nhô nhỏ, sáng phía trên
        px(im, x + 1, y, c[2])
    if extra: extra(im, rnd)
    return im
def mud_wet(k, rnd):
    c = P['wmud']; im = speck(c[0], [c[1], c[2], c[2]], 22, rnd)
    for _ in range(2):
        x, y = rnd.randrange(1, 11), rnd.randrange(2, 14)
        for i in range(4): px(im, x + i, y, '#7b6747' if i < 3 else c[2])   # vệt bùn ướt bóng
    return im
def reedbed(k, rnd):
    im = mud_wet(k, rnd)
    for _ in range(7):
        x, y = rnd.randrange(1, 15), rnd.randrange(4, 15)
        for j in range(rnd.randrange(3, 6)): px(im, x, y - j, '#7a8c3c' if j % 2 else '#93a64c')
        px(im, x + 1, y, '#566a2b')
    return im
def wood_floor(k, rnd):
    def ex(im, r):
        for _ in range(5):
            x, y = r.randrange(1, 14), r.randrange(1, 14); px(im, x, y, P['lit'][0]); px(im, x + 1, y, P['lit'][1])
    return ground('wood', k, rnd, ex)
def lotus(k, rnd):
    im = water(k, rnd, False)
    for cx, cy in ((4, 5), (11, 9), (6, 12)):
        disc(im, cx, cy, 2.6, '#4f8f45'); disc(im, cx - .5, cy - .5, 1.6, '#69ab52'); px(im, cx + 2, cy, '#4a9696'); px(im, cx + 2, cy - 1, '#4a9696')
        if rnd.random() < .85: px(im, cx - 1, cy - 1, '#f2a3c0'); px(im, cx, cy - 1, '#ffd5e3'); px(im, cx - 1, cy, '#e27fa6')
    return im
def plank(rnd):
    im = img(16, 16, '#9a7040')
    for y in range(0, 16, 4):
        for x in range(16): px(im, x, y, '#6c4a28')
        for x in range(16): px(im, x, y + 1, '#b2884f')
        px(im, rnd.randrange(16), y + 2, '#865c34')
    for y in (1, 5, 9, 13): px(im, 1, y, '#4a321a'); px(im, 14, y, '#4a321a')
    return im

T = {}
def add(name, im): T[name] = b64(im)
for i in range(2): add(f'deep{i}', water(i, random.Random(10 + i), True)); add(f'shal{i}', water(i, random.Random(20 + i), False))
for i in range(2): add(f'wmud{i}', mud_wet(i, random.Random(30 + i))); add(f'dmud{i}', ground('dmud', i, random.Random(40 + i)))
for i in range(3): add(f'grass{i}', ground('grass', i, random.Random(50 + i)))
for i in range(2):
    add(f'sedge{i}', ground('sedge', i, random.Random(60 + i))); add(f'reedbed{i}', reedbed(i, random.Random(70 + i)))
    add(f'wood{i}', wood_floor(i, random.Random(80 + i))); add(f'lotus{i}', lotus(i, random.Random(90 + i)))
add('plank', plank(random.Random(1)))

# ---------- vật thể ----------
def tram_tree(seed, R=10):
    rnd = random.Random(seed); n = R * 2 + 4; im = img(n, n); c = n / 2
    blobs = [(c + rnd.uniform(-R * .45, R * .45), c + rnd.uniform(-R * .45, R * .45), rnd.uniform(R * .45, R * .7)) for _ in range(6)]
    for (bx, by, br), col in [(b, '#3e5524') for b in blobs] + [((b[0] - .7, b[1] - .7, b[2] - .3), '#55702f') for b in blobs] + [((b[0] - 1.4, b[1] - 1.4, b[2] * .55), '#74923a') for b in blobs]:
        disc(im, bx, by, br, col)
    for _ in range(R * 3):                      # lá tràm mảnh: chấm sáng rải theo nửa trên-trái
        x, y = int(c + rnd.gauss(-R * .2, R * .45)), int(c + rnd.gauss(-R * .2, R * .45))
        if im.getpixel((max(0, min(n - 1, x)), max(0, min(n - 1, y))))[3]: px(im, x, y, rnd.choice(['#93b04c', '#a9c25e', '#6a8a38']))
    for _ in range(R): px(im, int(c + rnd.uniform(-R * .5, R * .5)), int(c + rnd.uniform(-R * .5, R * .5)), '#d9d2b8')  # mảng vỏ trắng thấp thoáng
    return im
def blades(seed, n, ln, cols, tip=None, size=16):
    rnd = random.Random(seed); im = img(size, size); c = size / 2
    import math
    for i in range(n):
        a = i / n * 6.283 + rnd.uniform(-.3, .3); L = ln * rnd.uniform(.7, 1.1); curl = rnd.uniform(-.25, .25)
        for j in range(1, int(L) + 1):
            aa = a + curl * j / L; x, y = int(c + math.cos(aa) * j), int(c + math.sin(aa) * j * .9)
            top = math.cos(aa) + math.sin(aa) < 0          # nửa hướng lên-trái thì sáng hơn
            px(im, x, y, cols[0] if top else cols[1])
        if tip: px(im, int(c + math.cos(a + curl) * (L + .5)), int(c + math.sin(a + curl) * (L + .5) * .9), tip)
    disc(im, c, c, 1.2, cols[1]); return im
def hyacinth(seed):
    rnd = random.Random(seed); im = img(16, 16)
    for cx, cy in ((5, 6), (10, 5), (8, 10)):
        disc(im, cx, cy, 2.8, '#3f7f3a'); disc(im, cx - .6, cy - .6, 1.9, '#5fa14a'); px(im, cx - 1, cy - 1, '#8cc464')
        if rnd.random() < .7: px(im, cx + 1, cy, '#b79be0'); px(im, cx + 1, cy - 1, '#d4c1f2')
    return im
def branch():
    im = img(16, 8); line(im, 1, 6, 14, 2, '#5b4128'); line(im, 1, 5, 14, 1, '#7d5c3a'); line(im, 7, 4, 10, 6, '#5b4128'); px(im, 1, 5, '#a98258'); return im
def prints():
    im = img(16, 16)
    for i, (x, y) in enumerate(((3, 12), (8, 9), (4, 5), (9, 2))):
        for dx, dy in ((0, 0), (1, 0), (0, 1), (1, 1), (0, 2)): px(im, x + dx + (i % 2) * 2, y + dy, '#3d3022')
        px(im, x + (i % 2) * 2, y, '#2f2418')
    return im
def crane():
    im = img(16, 16); c = 8
    for (x, y, r, col) in ((8, 9, 4.2, '#aeb6bb'), (7.4, 8.6, 3.5, '#d6dcdf'), (7, 8, 2.2, '#eef1f2')): disc(im, x, y, r, col)
    for y in range(11, 15): px(im, 6, y, '#3a3d44'); px(im, 7, y, '#3a3d44'); px(im, 9, y, '#3a3d44')     # đuôi/cánh bay đen
    for y in range(3, 7): px(im, 8, y, '#c9d0d3')        # cổ
    px(im, 8, 2, '#d2342a'); px(im, 7, 2, '#e04a3c'); px(im, 8, 1, '#d2342a'); px(im, 7, 1, '#b72920'); px(im, 8, 0, '#e8d8a0')  # đầu đỏ + mỏ
    return im
def bird(frame):
    im = img(16, 10)
    if frame == 0: line(im, 1, 1, 8, 6, '#e8ecee'); line(im, 15, 1, 8, 6, '#cfd6d9'); line(im, 1, 2, 8, 7, '#8d969b'); line(im, 15, 2, 8, 7, '#8d969b')
    else: line(im, 1, 5, 8, 5, '#e8ecee'); line(im, 15, 5, 8, 5, '#cfd6d9'); line(im, 1, 6, 8, 6, '#8d969b'); line(im, 15, 6, 8, 6, '#8d969b')
    disc(im, 8, 5.5, 1.6, '#f4f6f6'); px(im, 8, 3, '#d2342a'); return im
def shelter():
    n = 48; im = img(n, n)
    for y in range(4, 44):                                   # sàn gỗ
        for x in range(4, 44): px(im, x, y, '#a07846' if (y // 3) % 2 else '#8d6a3c')
    for x in range(4, 44): px(im, x, 4, '#c29a62'); px(im, x, 43, '#5e4325')
    for y in range(4, 44): px(im, 4, y, '#c29a62'); px(im, 43, y, '#5e4325')
    for yy in range(34, 44):                                   # thang xuống phía nam
        for xx in range(19, 29): px(im, xx, yy + 3 if yy + 3 < n else yy, '#7a5a30' if (yy % 3) else '#c29a62')
    cx, cy = 24, 21                                          # mái 4 mái dốc nhìn từ trên
    for y in range(1, 41):
        for x in range(2, 46):
            dx, dy = (x - cx) / 22, (y - cy) / 20
            if abs(dx) + abs(dy) * .0 > 1 or abs(dy) > 1: continue
            top, bot, lef, rig = dy < 0 and -dy >= abs(dx), dy > 0 and dy >= abs(dx), dx < 0 and -dx > abs(dy), dx > 0 and dx > abs(dy)
            col = '#8a7a45' if top else '#5e5230' if bot else '#a18f52' if lef else '#6d6038'
            if (x + y) % 5 == 0: col = {'#8a7a45': '#9b8a50', '#5e5230': '#6a5c37', '#a18f52': '#b4a25e', '#6d6038': '#7a6c40'}[col]
            px(im, x, y, col)
    for i in range(-3, 4): px(im, cx + i, cy, '#c9b878')       # sống mái
    for i in range(20): px(im, cx - 22 + i, cy - 20 + i, '#7d6c3a'); px(im, cx + 22 - i, cy - 20 + i, '#4e4327')  # đường gờ mái
    return im
def boat():
    im = img(24, 12)
    for y in range(1, 11):
        for x in range(0, 24):
            if ((x - 11.5) / 11.5) ** 2 + ((y - 5.5) / 5) ** 2 <= 1.0: px(im, x, y, '#8a5e34')
    for y in range(3, 9):
        for x in range(3, 21):
            if ((x - 11.5) / 8.5) ** 2 + ((y - 5.5) / 2.9) ** 2 <= 1.0: px(im, x, y, '#4a3320')
    for x in range(1, 23): px(im, x, 1 if x > 3 and x < 21 else 2, '#b4824c')
    line(im, 5, 9, 18, 0, '#6b4a28'); return im
O = {}
for i, R in enumerate((10, 8, 12)): O[f'tree{i}'] = b64(tram_tree(100 + i, R))
O['sapling'] = b64(tram_tree(7, 5))
for i in range(2): O[f'reed{i}'] = b64(blades(200 + i, 11, 7, ['#8aa04a', '#5f7a30'], '#a8794a'))
for i in range(2): O[f'sedgep{i}'] = b64(blades(300 + i, 14, 5, ['#c1b45a', '#968b40']))
O['hyacinth'] = b64(hyacinth(1)); O['branch'] = b64(branch()); O['prints'] = b64(prints()); O['crane'] = b64(crane())
O['bird0'] = b64(bird(0)); O['bird1'] = b64(bird(1)); O['shelter'] = b64(shelter()); O['boat'] = b64(boat())
js = '/* English Farm — pixel-art Vườn quốc gia Tràm Chim (tools/pack_tramchim.py). Ô 16px phóng 2x, nhìn thẳng từ trên xuống, sáng từ trên-trái. */\nwindow.TRAMCHIM=' + json.dumps({'tiles': T, 'objs': O}, separators=(',', ':')) + ';\n'
open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'tramchim_assets.js'), 'w').write(js)
# xem trước (không nằm trong game)
sheet = Image.new('RGBA', (900, 420), hx('#1d2b19')); x = y = 6
for d in (T, O):
    for k, v in d.items():
        im = Image.open(io.BytesIO(base64.b64decode(v.split(',')[1]))).convert('RGBA')
        if x + im.width + 6 > 900: x = 6; y += 100
        sheet.alpha_composite(im, (x, y)); x += im.width + 6
    x = 6; y += 100
sheet.save('/home/claude/tc/preview.png'); print(len(js) // 1024, 'KB')
