# Chạy sau khi sửa PNG trong img/main_house/: python tools/pack_house.py  -> ghi lại house_assets.js
import base64, glob, os, json
d = {os.path.basename(f)[:-4]: "data:image/png;base64," + base64.b64encode(open(f, "rb").read()).decode() for f in sorted(glob.glob("img/main_house/*.png"))}
open("house_assets.js", "w").write("// Tự sinh bởi tools/pack_house.py từ img/main_house/*.png\nwindow.HOUSE=" + json.dumps(d) + ";\n")
print("OK", list(d))
