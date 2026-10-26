# Đóng gói pixel-art Tràm Chim (vẽ bằng pxl) -> tramchim_assets.js
# Quy trình:
#   node tools/gen_tramchim_map.js                       (sinh bố cục: tramchim_layout.json + .px.js)
#   node <pxl>/bin/pxl.js build tools/tramchim.px.js --out img/tramchim_build --no-preview
#   python3 tools/pack_tramchim_pxl.py                   (cần Pillow; copy PNG sang img/tramchim/ rồi nhúng base64, phóng 2x)
# Nhóm: chars = Chú Tư (img/guide, tools/slice_guide.py) · tiles = nền (ground 1600x1280) + 2 ô nước; objs = mọi vật thể; layout = bản đồ + vị trí vật thể cho game.js
import base64, io, json, os, shutil
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.join(HERE, '..')
BUILD = os.path.join(ROOT, 'img', 'tramchim_build'); DST = os.path.join(ROOT, 'img', 'tramchim')
if os.path.isdir(DST): shutil.rmtree(DST)
os.makedirs(DST)
for f in os.listdir(os.path.join(BUILD, 'sprites')):
    if f.endswith('.png') and not f.startswith('_'): shutil.copy(os.path.join(BUILD, 'sprites', f), DST)
shutil.copy(os.path.join(BUILD, 'scenes', 'ground.png'), DST)
def b64(path):
    im = Image.open(path).convert('RGBA'); im = im.resize((im.width * 2, im.height * 2), Image.NEAREST)
    b = io.BytesIO(); im.save(b, 'PNG', optimize=True); return 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()
def raw(path):                                                      # nhân vật: giữ nguyên 1x (khung 50x68 ≈ cỡ nhân vật chính)
    b = io.BytesIO(); Image.open(path).convert('RGBA').save(b, 'PNG', optimize=True); return 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()
chars = {}
GD = os.path.join(ROOT, 'img', 'guide')
for f in sorted(os.listdir(os.path.join(GD, 'frames'))): chars['guide_' + f[:-4]] = raw(os.path.join(GD, 'frames', f))
chars['guide_portrait'] = raw(os.path.join(GD, 'portrait.png'))
tiles, objs = {}, {}
for f in sorted(os.listdir(DST)):
    k = f[:-4]; (tiles if k in ('ground', 'water_a', 'water_b') else objs)[k] = b64(os.path.join(DST, f))
layout = json.load(open(os.path.join(HERE, 'tramchim_layout.json')))
js = '/* English Farm — pixel-art Vườn quốc gia Tràm Chim (pxl: tools/tramchim.px.js + tc_*.px.js; bố cục: tools/gen_tramchim_map.js). Nhìn 3/4, ô 16px phóng 2x, sáng từ trên-trái. */\nwindow.TRAMCHIM=' + json.dumps({'tiles': tiles, 'objs': objs, 'chars': chars, 'layout': layout}, separators=(',', ':')) + ';\n'
open(os.path.join(ROOT, 'tramchim_assets.js'), 'w').write(js); print(len(js) // 1024, 'KB', len(tiles), 'tiles', len(objs), 'objs', len(chars), 'chars')
