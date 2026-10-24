# Đóng gói pixel-art Tràm Chim (vẽ bằng pxl: tools/tramchim.px.js) -> tramchim_assets.js
# Quy trình:  node <pxl>/bin/pxl.js build tools/tramchim.px.js --out img/tramchim_build   (hoặc dùng PNG có sẵn trong img/tramchim/)
#             python3 tools/pack_tramchim_pxl.py   (cần Pillow)
# Ô 16px, game phóng 2x (nearest). Tên khoá khớp với game.js: 'tc_' + khoá.
import base64, io, json, os
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); SRC = os.path.join(HERE, '..', 'img', 'tramchim')
TILES = ['deep0','deep1','shal0','shal1','wmud0','wmud1','dmud0','dmud1','grass0','grass1','grass2','sedge0','sedge1',
         'wood0','wood1','reedbed0','reedbed1','lotus0','lotus1','plank','shoreN','shoreS','shoreW','shoreE']
OBJS = ['tree0','tree1','tree2','sapling','reed0','reed1','sedgep0','sedgep1','hyacinth','branch','prints','crane','bird0','bird1','shelter','boat']
def b64(name):
    im = Image.open(os.path.join(SRC, name + '.png')).convert('RGBA')
    im = im.resize((im.width * 2, im.height * 2), Image.NEAREST)
    b = io.BytesIO(); im.save(b, 'PNG', optimize=True); return 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()
data = {'tiles': {k: b64(k) for k in TILES}, 'objs': {k: b64(k) for k in OBJS}}
js = '/* English Farm — pixel-art Vườn quốc gia Tràm Chim (vẽ bằng pxl: tools/tramchim.px.js, đóng gói bởi tools/pack_tramchim_pxl.py). Ô 16px phóng 2x, nhìn từ trên xuống, sáng từ trên-trái. */\nwindow.TRAMCHIM=' + json.dumps(data, separators=(',', ':')) + ';\n'
open(os.path.join(HERE, '..', 'tramchim_assets.js'), 'w').write(js); print(len(js) // 1024, 'KB')
