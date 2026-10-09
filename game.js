(() => {
// ====== CẤU HÌNH ======
const B2_LEVEL = 2;                 // cấp độ người chơi cần đạt để mở bài học B2
const SPEED = 150;                 // tốc độ đi bộ
const COST = { till:2, sow:3, water:2, harvest:2 }; // stamina hao khi làm nông
const LESSON = {                    // stamina hao MỖI CÂU hỏi · exp đúng lần đầu / đúng sau khi thử lại · thưởng 5/5 · coin mỗi câu đúng lần đầu
  B1: { st:2, exp:4, retry:1, perfect:10, coin:2 },
  B2: { st:3, exp:7, retry:2, perfect:18, coin:4 }
};
const N_Q = 5;                      // số câu mỗi tiết học
const expNeed = l => 40 + l * 20;   // EXP cần để lên cấp kế tiếp
const maxSt = () => 100 + (S.lvl - 1) * 10; // stamina tối đa tăng theo cấp

// ====== DỮ LIỆU CÂY TRỒNG: thêm cây mới chỉ cần thêm 1 dòng ======
// cost: giá mở khóa hạt · days: số ngày (đã tưới) để lớn · price: tiền khi thu hoạch
// Thêm cây mới: thêm 1 dòng ở đây + 1 tên vào ASSET_META.crops (assets.js) nếu có sprite
const CROPS = [
  // cây mở sẵn
  { id:'carrot',      en:'CARROT',       vi:'cà rốt',        cost:0,   days:2, price:12 },
  { id:'tomato',      en:'TOMATO',       vi:'cà chua',       cost:0,   days:3, price:18 },
  // cây rau củ – ngũ cốc (3-4 ngày)
  { id:'corn',        en:'CORN',         vi:'bắp ngô',       cost:40,  days:3, price:25 },
  { id:'strawberry',  en:'STRAWBERRY',   vi:'dâu tây',       cost:60,  days:3, price:32 },
  { id:'potato',      en:'POTATO',       vi:'khoai tây',     cost:80,  days:3, price:35 },
  { id:'cabbage',     en:'CABBAGE',      vi:'bắp cải',       cost:100, days:3, price:38 },
  { id:'chili',       en:'CHILI',        vi:'ớt',            cost:120, days:3, price:42 },
  { id:'wheat',       en:'WHEAT',        vi:'lúa mì',        cost:140, days:4, price:50 },
  { id:'rice',        en:'RICE',         vi:'lúa gạo',       cost:160, days:4, price:54 },
  { id:'sweetpotato', en:'SWEET POTATO', vi:'khoai lang',    cost:180, days:4, price:58 },
  { id:'garlic',      en:'GARLIC',       vi:'tỏi',           cost:200, days:3, price:50 },
  { id:'sugarcane',   en:'SUGARCANE',    vi:'cây mía',       cost:220, days:4, price:64 },
  { id:'mushroom',    en:'MUSHROOM',     vi:'nấm',           cost:240, days:3, price:60 },
  { id:'soybean',     en:'SOYBEAN',      vi:'đậu nành',      cost:260, days:4, price:68 },
  { id:'tea',         en:'TEA',          vi:'trà',           cost:280, days:4, price:72 },
  { id:'cotton',      en:'COTTON',       vi:'bông vải',      cost:300, days:4, price:76 },
  { id:'jasmine',     en:'JASMINE',      vi:'hoa nhài',      cost:320, days:4, price:80 },
  { id:'rose',        en:'ROSE',         vi:'hoa hồng',      cost:340, days:4, price:86 },
  { id:'melon',       en:'MELON',        vi:'dưa vàng',      cost:360, days:4, price:90 },
  // cây ăn quả (5 ngày)
  { id:'grape',       en:'GRAPE',        vi:'nho',           cost:380, days:5, price:104 },
  { id:'blueberry',   en:'BLUEBERRY',    vi:'việt quất',     cost:400, days:5, price:110 },
  { id:'peach',       en:'PEACH',        vi:'quả đào',       cost:430, days:5, price:118 },
  { id:'lemon',       en:'LEMON',        vi:'chanh vàng',    cost:460, days:5, price:124 },
  { id:'mangosteen',  en:'MANGOSTEEN',   vi:'măng cụt',      cost:490, days:5, price:132 },
  { id:'pineapple',   en:'PINEAPPLE',    vi:'quả dứa',       cost:520, days:5, price:140 },
  { id:'banana',      en:'BANANA',       vi:'chuối',         cost:550, days:5, price:148 },
  { id:'coconut',     en:'COCONUT',      vi:'dừa',           cost:580, days:5, price:156 },
  { id:'coffee',      en:'COFFEE',       vi:'cà phê',        cost:620, days:5, price:170 }
];
// Giá hạt giống & cấp độ mở khóa: cây đắt cần Lv cao hơn → học bài với cô Emma để lên cấp
const SEED_PRICE = c => Math.max(4, Math.round(c.price * .35));
const REQ_LVL = c => 1 + Math.floor(c.cost / 100);
// Hình ảnh: assets.js (icon quả = ICON) · bảng sprite 3 giai đoạn lớn (cây con → đang lớn → chín) theo thứ tự ASSET_META.crops
const FRAME = id => window.ASSET_META.crops.indexOf(id) * 3;
const ICON = id => window.ASSETS.icons[id];
const sico = (id, px = 28) => `<img class="ico" src="${(window.ASSETS.seedIcons && window.ASSETS.seedIcons[id]) || ICON(id)}" alt="" width="${px}" height="${px}">`; // túi hạt giống
const ico = (id, px = 28) => `<img class="ico" src="${ICON(id)}" alt="" width="${px}" height="${px}">`;

// ====== TỪ VỰNG B1 / B2 (cô Emma): nằm trong file vocab.js ======
const VOCAB = window.VOCAB;

// ====== CÂU GIAO TIẾP CỦA DÂN THỊ TRẤN (mỗi ngày nghe 1 câu mới) ======
const VILLAGERS = ['Mrs. Green', 'Old Tom', 'Anna', 'Mr. Lee', 'Grandma Rose', 'Ben'];
const PHRASES = [
  { en:"It's up to you.",                  vi:'Tùy bạn quyết định.',                 tip:'Dùng khi để người khác tự chọn.' },
  { en:"I'm looking forward to seeing you.",vi:'Tôi rất mong được gặp bạn.',          tip:'looking forward to + V-ing (không dùng "to see").' },
  { en:'Could you give me a hand?',        vi:'Bạn giúp tôi một tay được không?',    tip:'give someone a hand = giúp đỡ ai.' },
  { en:"I'm afraid I can't make it.",      vi:'Tôi e là tôi không đến được.',        tip:'make it = có mặt / kịp giờ. Cách từ chối lịch sự.' },
  { en:'Better late than never.',          vi:'Muộn còn hơn không.',                 tip:'Thành ngữ quen thuộc.' },
  { en:"Let's keep in touch.",             vi:'Mình giữ liên lạc nhé.',              tip:'keep in touch = duy trì liên lạc.' },
  { en:'It slipped my mind.',              vi:'Tôi quên mất tiêu.',                  tip:'slip one\'s mind = vô tình quên.' },
  { en:"I'll sort it out.",                vi:'Tôi sẽ giải quyết việc đó.',          tip:'sort out = xử lý, giải quyết (phrasal verb).' },
  { en:'That makes sense.',                vi:'Nghe hợp lý đấy.',                    tip:'make sense = có lý, dễ hiểu.' },
  { en:"I couldn't agree more.",           vi:'Tôi hoàn toàn đồng ý.',               tip:'Dạng phủ định nhưng mang nghĩa rất khẳng định.' },
  { en:"To be honest, I'm not sure.",      vi:'Thành thật mà nói, tôi không chắc.',  tip:'To be honest = nói thật. Mở đầu ý kiến cá nhân.' },
  { en:"It's worth a try.",                vi:'Đáng để thử.',                        tip:'be worth + N/V-ing = đáng để làm.' },
  { en:'I had no idea.',                   vi:'Tôi hoàn toàn không biết.',           tip:'Dùng khi bất ngờ trước thông tin mới.' },
  { en:"Don't get me wrong.",              vi:'Đừng hiểu lầm ý tôi nhé.',            tip:'Nói trước khi đưa ra ý kiến dễ gây hiểu nhầm.' }
];

// ====== ĐỒ ĂN Ở TIỆM: hồi stamina ======
const FOOD = [
  { e:'🍞', en:'Bread', vi:'bánh mì',  cost:6,  st:20 },
  { e:'🥗', en:'Salad', vi:'sa-lát',   cost:12, st:40 },
  { e:'🍲', en:'Soup',  vi:'món súp',  cost:22, st:75 }
];

// ====== ĐỒ TRANG TRÍ NHÀ (tiệm Decor Shop) ======
// kind: 'wall' = treo tường · 'floor' = đặt sàn. Thêm món mới chỉ cần thêm 1 dòng.
const DECOR = [
  { id:'painting', e:'🖼️', en:'Painting', vi:'bức tranh',    cost:40,  kind:'wall' },
  { id:'clock',    e:'🕰️', en:'Clock',    vi:'đồng hồ',      cost:55,  kind:'wall' },
  { id:'lantern',  e:'🏮', en:'Lantern',  vi:'đèn lồng',     cost:45,  kind:'wall' },
  { id:'calendar', e:'📅', en:'Calendar', vi:'tờ lịch',      cost:25,  kind:'wall' },
  { id:'guitar',   e:'🎸', en:'Guitar',   vi:'đàn ghi-ta',   cost:70,  kind:'wall' },
  { id:'cactus',   e:'🌵', en:'Cactus',   vi:'xương rồng',   cost:30,  kind:'floor' },
  { id:'sunflower',e:'🌻', en:'Sunflower',vi:'hoa hướng dương', cost:35, kind:'floor' },
  { id:'chair',    e:'🪑', en:'Chair',    vi:'cái ghế',      cost:35,  kind:'floor' },
  { id:'teddy',    e:'🧸', en:'Teddy bear',vi:'gấu bông',    cost:25,  kind:'floor' },
  { id:'books',    e:'📚', en:'Bookshelf',vi:'giá sách',     cost:50,  kind:'floor' },
  { id:'tv',       e:'📺', en:'Television',vi:'ti vi',       cost:90,  kind:'floor' },
  { id:'fish',     e:'🐠', en:'Fish tank',vi:'bể cá',        cost:80,  kind:'floor' },
  { id:'sofa',     e:'🛋️', en:'Sofa',     vi:'ghế sô-pha',   cost:120, kind:'floor' },
  { id:'piano',    e:'🎹', en:'Piano',    vi:'đàn piano',    cost:150, kind:'floor' }
];
const SLOTS = [ // vị trí đặt đồ trong nhà
  { x:250, y:75, kind:'wall' }, { x:400, y:75, kind:'wall' }, { x:550, y:75, kind:'wall' }, { x:700, y:75, kind:'wall' },
  { x:300, y:200, kind:'floor' }, { x:480, y:200, kind:'floor' }, { x:660, y:200, kind:'floor' },
  { x:270, y:390, kind:'floor' }, { x:530, y:390, kind:'floor' }, { x:690, y:380, kind:'floor' }
];
const placedCount = id => Object.values(S.placed).filter(x => x === id).length;

// ====== LƯU TRỮ ======
const KEY = 'englishFarmSave2'; // giữ nguyên key để không mất dữ liệu cũ; trường mới tự thêm giá trị mặc định
const fresh = () => ({ coins:20, day:1, sel:'carrot', inv:{ seeds:{ carrot:6, tomato:6 }, crops:{}, fish:{} }, learned:{},
  exp:0, lvl:1, stamina:100, words:{}, phraseDay:0, dinhDay:0, mossDay:0, story:{ ch:0, intro:false, nt:-1, cnt:{ harvest:0, fish:0, forage:0 } }, rod:false, fishDex:{}, foraged:[], forageDay:0, own:{}, placed:{},
  plots: Array.from({ length:15 }, () => ({ s:0, c:null, g:0, w:false })) });
let S, old = null;
try { old = JSON.parse(localStorage.getItem(KEY)); S = Object.assign(fresh(), old || {}); } catch (e) { S = fresh(); }
S.stamina = Math.min(S.stamina, maxSt());
// dữ liệu lưu cũ có thể còn cây không còn tồn tại (bí ngô, cà tím…) → dọn để không lỗi
{ const known = id => CROPS.some(c => c.id === id);
  if (!S.inv || !S.inv.seeds) S.inv = { seeds:{ carrot:6, tomato:6 }, crops:{} };
  if (!S.inv.crops) S.inv.crops = {};
  // save cũ (chưa có túi đồ): tặng 3 hạt cho mỗi cây đã mở khóa
  if (old && !old.inv && old.unlocked) old.unlocked.filter(known).forEach(id => { S.inv.seeds[id] = Math.max(S.inv.seeds[id] || 0, 3); });
  [S.inv.seeds, S.inv.crops].forEach(o => Object.keys(o).forEach(id => { if (!known(id) || !(o[id] > 0)) delete o[id]; }));
  if (!known(S.sel)) S.sel = 'carrot';
  S.plots.forEach(p => { if (p.c && !known(p.c)) { p.s = 1; p.c = null; p.g = 0; p.w = false; } }); }
// dữ liệu lưu cũ: bổ sung các trường mới (cốt truyện, câu cá…)
S.story = Object.assign({ ch:0, intro:false, nt:-1 }, S.story || {}); S.story.cnt = Object.assign({ harvest:0, fish:0, forage:0 }, S.story.cnt || {});
if (!S.inv.fish) S.inv.fish = {}; if (!S.fishDex) S.fishDex = {}; if (!Array.isArray(S.foraged)) S.foraged = [];
const seedCount = id => S.inv.seeds[id] || 0;
const addSeed = (id, n = 1) => { S.inv.seeds[id] = seedCount(id) + n; };
const owned = () => CROPS.filter(c => seedCount(c.id) > 0).map(c => c.id);
const fixSel = () => { if (seedCount(S.sel) <= 0) { const o = owned(); if (o.length) S.sel = o[0]; } };
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

// ====== TIỆN ÍCH ======
const $ = s => document.querySelector('#farm-app ' + s);
const SPR = (window.ASSETS && window.ASSETS.spr) || {};   // sprite pixel-art từ assets.js
const spImg = (k, px = 22) => SPR[k] ? `<img class="ico" src="${SPR[k]}" width="${px}" height="${px}" alt="">` : '';
const crop = id => CROPS.find(c => c.id === id);
const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
let open = false, clk = 360; // clk = phút trong ngày (360 = 06:00)
const hhmm = m => { m = Math.floor(m); return String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
const dark = h => h < 6 ? .5 : h < 8 ? .5 * (8 - h) / 2 : h < 17 ? 0 : h < 20.5 ? .5 * (h - 17) / 3.5 : .5;

// ====== THỜI GIAN · THỜI TIẾT · VẬT NUÔI (mới) ======
const TIME_SPEED = .0045;           // tốc độ đồng hồ (phút game / ms). Muốn ngày dài hơn → giảm số này
const RESCUE = .35;                 // xác suất cụ Moss cứu khi bị móc túi lúc nửa đêm
let warn = 0, robbed = false;       // cảnh báo giờ ngủ · đã xảy ra vụ móc túi trong ngày chưa
const CINE = { on:false };          // đang chiếu cut scene / màn tổng kết (chặn phím Esc, chặn di chuyển)

// thời tiết của 1 ngày: { k:'sun'|'cloud'|'rain', a:giờ bắt đầu mưa, b:giờ tạnh }
const rollWx = () => {
  const r = Math.random();
  if (r < .24) { const a = 7 + Math.floor(Math.random() * 5); return { k:'rain', a, b:Math.min(23, a + 4 + Math.floor(Math.random() * 6)) }; }
  return r < .42 ? { k:'cloud' } : { k:'sun' };
};
if (!S.wx) S.wx = { k:'sun' };
if (!S.nextWx) S.nextWx = rollWx();
const wxNow = () => { const w = S.wx || { k:'sun' }; if (w.k !== 'rain') return w.k; const h = clk / 60; return h >= w.a && h < w.b ? 'rain' : 'cloud'; };
const WX_NAME = { sun:'☀️ Trời nắng', cloud:'☁️ Trời nhiều mây', rain:'🌧️ Trời mưa' };
const todKey = () => { const h = clk / 60; return h < 6 ? 'night' : h < 11 ? 'morning' : h < 17 ? 'noon' : h < 20 ? 'evening' : 'night'; };
const TOD_NAME = { morning:'🌅 Buổi sáng', noon:'☀️ Buổi trưa', evening:'🌇 Chiều tối', night:'🌙 Ban đêm' };

// dữ liệu lưu cũ: bổ sung các trường mới (thùng hàng, sản phẩm vật nuôi…)
if (!S.inv.goods) S.inv.goods = {};
if (!S.bin) S.bin = {}; ['crops', 'fish', 'goods'].forEach(k => { if (!S.bin[k]) S.bin[k] = {}; });
if (!S.petDone) S.petDone = {};
S.petDay = S.petDay || 0; S.mailDay = S.mailDay || 0; S.daisyDay = S.daisyDay || 0; S.peteDay = S.peteDay || 0; S.scopeDay = S.scopeDay || 0; S.rainDay = S.rainDay || 0;

// sản phẩm từ vật nuôi (bỏ vào thùng để bán)
const GOODS = {
  egg:  { e:'🥚', en:'Egg',  vi:'trứng', price:10 },
  milk: { e:'🥛', en:'Milk', vi:'sữa',   price:25 },
  wool: { e:'🧶', en:'Wool', vi:'len',   price:30 }
};
// con vật: sp = tốc độ đi · prod = sản phẩm mỗi ngày · snd = tiếng kêu · line = câu tiếng Anh học kèm
const ANIMALS = {
  chicken: { en:'Chicken', vi:'con gà',   e:'🐔', sp:22, hop:2, sh:.5,  prod:'egg',  snd:'cluck', line:['The chicken lays an egg every morning.', 'Con gà đẻ một quả trứng mỗi sáng.'] },
  cow:     { en:'Cow',     vi:'con bò',   e:'🐄', sp:14, hop:1, sh:1.2, prod:'milk', snd:'moo',   line:['The cow gives us fresh milk.', 'Con bò cho chúng ta sữa tươi.'] },
  sheep:   { en:'Sheep',   vi:'con cừu',  e:'🐑', sp:16, hop:1.5, sh:.8, prod:'wool', snd:'baa',   line:['The sheep has soft white wool.', 'Con cừu có bộ lông trắng mềm.'] },
  rabbit:  { en:'Rabbit',  vi:'con thỏ',  e:'🐇', sp:34, hop:5, sh:.4,  snd:'select', line:['The rabbit hops very fast.', 'Con thỏ nhảy rất nhanh.'] },
  duck:    { en:'Duck',    vi:'con vịt',  e:'🦆', sp:18, hop:1, sh:.0,  snd:'quack', line:['The duck is swimming in the water.', 'Con vịt đang bơi dưới nước.'] },
  cat:     { en:'Cat',     vi:'con mèo',  e:'🐈', sp:20, hop:2, sh:.5,  snd:'meow',  line:['The cat is sleeping in the sun.', 'Con mèo đang ngủ dưới nắng.'] },
  dog:     { en:'Dog',     vi:'con chó',  e:'🐕', sp:0,  hop:0, sh:.6,  snd:'woof',  line:['The dog is my best friend.', 'Con chó là bạn thân của tôi.'] }
};

// ====== PIXEL ART VẼ BẰNG CODE ======
// rows: mỗi hàng viết dạng "ký tự + số lần", ví dụ ".6R2.4" = 6 ô trống, 2 ô đỏ, 4 ô trống
const pxCanvas = (rows, pal, s = 2) => {
  const parsed = rows.map(r => { const a = []; r.replace(/(.)(\d+)/g, (m, c, n) => { for (let i = 0; i < +n; i++) a.push(c); }); return a; });
  const w = Math.max(...parsed.map(r => r.length)), c = document.createElement('canvas'); c.width = w * s; c.height = parsed.length * s;
  const g = c.getContext('2d');
  parsed.forEach((r, y) => r.forEach((ch, x) => { if (pal[ch]) { g.fillStyle = pal[ch]; g.fillRect(x * s, y * s, s, s); } }));
  return c;
};
const ANI_PX = {
  chicken: { pal:{ W:'#fff7e6', R:'#e03a2e', K:'#222', Y:'#f2a81d', O:'#e8921a', G:'#e8d9b8' }, rows:[
    '.6R2.4', '.5W4.3', '.5W1K1W1Y2.2', '.5W4R1.2', '.2W7.3', '.1W3G3W3.2', 'W4G3W3.2', '.1W9.2', '.2W7.3', '.4O1.1O1.5', '.3O2.1O2.4' ] },
  cow: { pal:{ W:'#f5f5f0', k:'#2a2a2a', P:'#f2a0a8', K:'#111', h:'#e8e0c0', H:'#3a2a20' }, rows:[
    '.14h1.2h1.4', '.13W6.3', '.13W1K1W3P1.3', '.13W3P3.3', '.3W15.4', '.2W2k4W3k2W3.6', '.2W2k4W9.5', '.2W9k3W3.5', '.2W6k3W6.5', '.2W15.5', '.3W13.6',
    '.3W2.1W2.4W2.1W2.5', '.3W2.1W2.4W2.1W2.5', '.3H2.1H2.4H2.1H2.5' ] },
  sheep: { pal:{ F:'#f4f4ef', f:'#dcdcd2', D:'#3a3030', K:'#fff' }, rows:[
    '.3F9.4', '.2F11.3', '.1F12D2.1', '.1F11D1K1D1.1', '.1F12D2.1', '.1f1F11D1.2', '.1F12.3', '.2F10.4', '.3F8.5', '.3D1.1D1.4D1.1D1.3', '.3D1.1D1.4D1.1D1.3' ] },
  dog: { pal:{ B:'#b9743a', b:'#8a5226', K:'#111', N:'#222', T:'#ff7a8a', W:'#f5e6cf' }, rows:[
    '.9b1.1b1.2', '.8B5.1', '.8B1K1B1N2.1', '.8B3W1T1.1', 'b1.1B9.3', '.1B11.2', '.1B10.3', '.1B1.1B1.4B1.1B1.3', '.1B1.1B1.4B1.1B1.3', '.1b1.1b1.4b1.1b1.3' ] },
  rabbit: { pal:{ w:'#e8e0d6', p:'#f2a0a8', K:'#111', N:'#e58a98', t:'#ffffff' }, rows:[
    '.6w1.1w1.1', '.6w1.1w1.1', '.5w4.1', '.5w1K1w1N1.1', '.2w7.1', '.1w8.1', 't1w8.1', '.1w8.1', '.1w2.4w2.1' ] },
  duck: { pal:{ Y:'#f5d84a', O:'#f08a1e', K:'#222', B:'#e0a820' }, rows:[
    '.7Y3.2', '.6Y2K1Y2.1', '.7Y3O2', 'Y1.1Y8.2', 'Y10.2', '.1Y10.1', '.1Y3B5Y1.2', '.2Y8.2', '.3Y6.3' ] },
  cat: { pal:{ C:'#e8913a', c:'#b5651d', K:'#111', N:'#f08aa0' }, rows:[
    '.7C1.1C1.2', '.7C3.2', '.7C1K1C1N1.1', '.2C8.2', '.1C10.1', 'c1C10.1', '.1C10.1', '.1C2.2C2.5', '.1c2.2c2.5' ] },
  bfly: { pal:{ p:'#ff8fc8', K:'#222' }, rows:[ 'p2.2p2', 'p1.1K2.1p1', 'p2.2p2' ] }
};

// biểu tượng 16x16 cho ô thời tiết / buổi trong ngày (vẽ từng pixel)
function skyIcon(kind, bare) {
  const c = document.createElement('canvas'); c.width = c.height = 16; const g = c.getContext('2d');
  const R = (col, x, y, w = 1, h = 1) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const D = (col, cx, cy, r) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if ((x + .5 - cx) ** 2 + (y + .5 - cy) ** 2 <= r * r) R(col, x, y); };
  const bands = cols => cols.forEach((col, i) => R(col, 0, Math.round(i * 16 / cols.length), 16, Math.ceil(16 / cols.length) + 1));
  const rays = (cx, cy, col) => { for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; R(col, Math.round(cx + Math.cos(a) * 6.2 - .5), Math.round(cy + Math.sin(a) * 6.2 - .5)); } };
  const cloud = (cols, y0) => { D(cols[0], 5, y0 + 3, 3); D(cols[0], 9, y0 + 1.5, 3.8); D(cols[0], 12, y0 + 4, 2.8); R(cols[0], 3, y0 + 3, 11, 3); R(cols[1], 3, y0 + 5, 11, 1); };
  if (kind === 'sun') { if (!bare) bands(['#4fb3f0', '#6cc4f7']); rays(8, 8, '#ffe27a'); D('#ffd23f', 8, 8, 4.2); D('#fff2a8', 7, 7, 2); }
  else if (kind === 'cloud') { bands(['#8fb4d8', '#a9c6e2']); D('#ffe9a0', 12, 4, 2); cloud(['#ffffff', '#d6e2ee'], 5); }
  else if (kind === 'rain') { bands(['#5d6f86', '#74879e']); cloud(['#cfd8e3', '#aebccc'], 1); ['4,10', '7,11', '10,10', '13,11', '5,13', '9,13'].forEach(p => { const q = p.split(','); R('#7fd0ff', +q[0], +q[1], 1, 2); }); }
  else if (kind === 'morning') { bands(['#ffd9a0', '#ffc08a']); D('#ffe27a', 11, 11, 3.5); R('#5fae5a', 0, 12, 16, 4); D('#5fae5a', 4, 12, 4); D('#4a9a4a', 12, 14, 4); }
  else if (kind === 'noon') { bands(['#3fa9f5', '#7cc9fa']); rays(8, 5, '#fff3a0'); D('#ffe14a', 8, 5, 3.4); R('#5fae5a', 0, 13, 16, 3); R('#4a9a4a', 0, 13, 16, 1); }
  else if (kind === 'evening') { bands(['#5a4a9a', '#c8648a', '#f2a05a']); D('#ffcf6a', 8, 12, 3.6); R('#2d3b5a', 0, 12, 16, 4); D('#2d3b5a', 3, 12, 3); D('#2d3b5a', 13, 12, 3); }
  else if (kind === 'night') { bands(['#0b1445', '#14205f']); const t = document.createElement('canvas'); t.width = t.height = 16; const tg = t.getContext('2d'); tg.fillStyle = '#fff3b0';
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { if ((x + .5 - 10) ** 2 + (y + .5 - 6) ** 2 <= 13 && !((x + .5 - 12) ** 2 + (y + .5 - 5) ** 2 <= 9)) tg.fillRect(x, y, 1, 1); }
    g.drawImage(t, 0, 0); [[3, 3], [6, 10], [13, 12], [2, 12], [14, 2], [8, 14]].forEach(p => R('#ffffff', p[0], p[1])); }
  else if (kind === 'moon') { D('#fff3b0', 8, 8, 6.5); g.globalCompositeOperation = 'destination-out'; D('#000', 11.5, 6, 5.2); g.globalCompositeOperation = 'source-over'; }
  return c;
}
const iconURL = (k, bare) => skyIcon(k, bare).toDataURL();
let _sk = '';
function skyIcons() {
  const w = wxNow(), t = todKey(), k = w + t; if (k === _sk) return; _sk = k;
  const put = (id, kind, tip) => { const b = $(id); if (!b) return; const cv = b.querySelector('canvas'), SP = { sun:'sun', rain:'rain', cloud:'wind', morning:'sunrise', noon:'noon', evening:'sunset', night:'moon', moon:'moon' }[kind], im = SP && IMG['s_ui_' + SP];
    if (im) { // sprite pixel-art trên nền theo buổi
      const BG = { sun:['#4fb3f0','#6cc4f7'], cloud:['#8fb4d8','#a9c6e2'], rain:['#5d6f86','#74879e'], morning:['#ffd9a0','#ffc08a'], noon:['#3fa9f5','#7cc9fa'], evening:['#5a4a9a','#c8648a','#f2a05a'], night:['#0b1445','#14205f'], moon:['#0b1445','#14205f'] }[kind] || ['#4fb3f0'];
      cv.width = cv.height = 32; const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
      BG.forEach((c, n) => { g.fillStyle = c; g.fillRect(0, Math.round(n * 32 / BG.length), 32, 32); });
      const px = kind === 'evening' ? 32 : 28, o = (32 - px) / 2; g.drawImage(im, o, o, px, px);
    } else { const g = cv.getContext('2d'); g.clearRect(0, 0, 16, 16); g.drawImage(skyIcon(kind), 0, 0); }
    b.title = tip; };
  put('#wxBox', w, 'Thời tiết: ' + WX_NAME[w]); put('#todBox', t, TOD_NAME[t]);
}


// ====== ÂM THANH (tổng hợp bằng WebAudio, không cần file mp3) ======
const AU = { c:null, m:null, nb:null, on:(() => { try { return localStorage.getItem('efSound') !== '0'; } catch (e) { return true; } })() };
function au() {
  if (!AU.on) return null;
  try {
    if (!AU.c) {
      const C = window.AudioContext || window.webkitAudioContext; AU.c = new C();
      AU.m = AU.c.createGain(); AU.m.gain.value = .9; AU.m.connect(AU.c.destination);
      const n = AU.c.sampleRate, b = AU.c.createBuffer(1, n, AU.c.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; AU.nb = b;
    }
    if (AU.c.state === 'suspended') AU.c.resume();
    return AU.c;
  } catch (e) { return null; }
}
// nốt nhạc: tần số, độ dài, kiểu sóng, âm lượng, trễ, tần số cuối (trượt)
function tone(f, d = .1, type = 'square', vol = .05, delay = 0, to = 0) {
  const a = au(); if (!a) return;
  const t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + d);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  o.connect(g); g.connect(AU.m); o.start(t); o.stop(t + d + .03);
}
// tiếng ồn lọc (đất, nước, bước chân…): d <= .5
function noise(d = .1, f = 800, kind = 'lowpass', vol = .08, delay = 0, to = 0) {
  const a = au(); if (!a) return;
  const t = a.currentTime + delay, s = a.createBufferSource(), fl = a.createBiquadFilter(), g = a.createGain();
  s.buffer = AU.nb; fl.type = kind; fl.Q.value = kind === 'bandpass' ? 1.2 : .7;
  fl.frequency.setValueAtTime(f, t); if (to) fl.frequency.exponentialRampToValueAtTime(to, t + d);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  s.connect(fl); fl.connect(g); g.connect(AU.m); s.start(t, Math.random() * .5); s.stop(t + d + .03);
}
const sfx = (f, d = .1, type = 'square') => tone(f, d, type, .04);
const SND = {
  step:  () => noise(.07, 450 + Math.random() * 300, 'lowpass', .06),
  wood:  () => { tone(150 + Math.random() * 30, .06, 'square', .03, 0, 90); noise(.05, 700, 'lowpass', .05); },
  till:  () => { noise(.18, 380, 'lowpass', .18); tone(110, .15, 'sine', .09, 0, 55); noise(.08, 900, 'lowpass', .08, .12); },
  sow:   () => { for (let i = 0; i < 5; i++) noise(.04, 3200 + Math.random() * 900, 'highpass', .05, i * .05); tone(320, .1, 'sine', .03, .08, 200); },
  water: () => { noise(.45, 2000, 'bandpass', .1, 0, 600); [.1, .2, .3].forEach(d => tone(500 + Math.random() * 300, .09, 'sine', .035, d, 950)); },
  harvest: () => { noise(.06, 1500, 'bandpass', .08); tone(520, .1, 'triangle', .07, 0, 900); tone(880, .12, 'triangle', .06, .09); tone(1320, .18, 'triangle', .05, .18); },
  coin:  () => { tone(1320, .08, 'square', .03); tone(1760, .2, 'square', .03, .07); },
  buy:   () => { tone(988, .06, 'square', .03); tone(1319, .2, 'square', .03, .06); noise(.05, 4000, 'highpass', .04, .1); },
  error: () => tone(170, .22, 'sawtooth', .05, 0, 90),
  ok:    () => { tone(660, .1, 'square', .04); tone(880, .16, 'square', .04, .09); },
  wrong: () => tone(160, .24, 'sawtooth', .05, 0, 100),
  click: () => tone(720, .04, 'square', .02),
  select:() => tone(900, .06, 'triangle', .05, 0, 1200),
  bag:   () => { noise(.14, 1300, 'bandpass', .08, 0, 500); noise(.1, 1600, 'bandpass', .06, .12, 600); },
  door:  () => { noise(.25, 500, 'lowpass', .12, 0, 200); tone(180, .22, 'sine', .05, .02, 120); },
  eat:   () => { for (let i = 0; i < 3; i++) noise(.05, 2200, 'bandpass', .1, i * .1); tone(500, .1, 'sine', .04, .35, 800); },
  place: () => { tone(320, .09, 'triangle', .07, 0, 200); noise(.06, 900, 'lowpass', .06); },
  chat:  () => { tone(600, .06, 'triangle', .04); tone(760, .08, 'triangle', .04, .08); },
  levelup: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, .2, 'triangle', .06, i * .11)),
  sleep: () => [523, 440, 392, 330].forEach((f, i) => tone(f, .5, 'sine', .05, i * .35)),
  wake:  () => { [392, 523, 659].forEach((f, i) => tone(f, .25, 'triangle', .05, i * .13)); SND.bird(); },
  bird:  () => { const b = 2400 + Math.random() * 1100; tone(b, .07, 'sine', .022, 0, b * 1.3); tone(b * 1.2, .08, 'sine', .022, .1, b); tone(b * 1.35, .06, 'sine', .018, .2, b * 1.1); },
  cricket: () => [0, .1, .2].forEach(d => tone(4300, .05, 'sine', .01, d)),
  thunder: () => { noise(.5, 260, 'lowpass', .3); noise(.5, 180, 'lowpass', .22, .35); tone(60, .7, 'sine', .14, 0, 32); },
  cluck: () => { tone(700, .05, 'square', .03); tone(540, .06, 'square', .03, .08); tone(660, .05, 'square', .025, .16); },
  moo:   () => tone(190, .6, 'sawtooth', .035, 0, 130),
  baa:   () => { tone(430, .4, 'sawtooth', .03, 0, 340); tone(440, .25, 'sawtooth', .02, .22, 360); },
  woof:  () => { tone(320, .1, 'square', .05, 0, 190); tone(300, .1, 'square', .04, .16, 180); },
  quack: () => { tone(540, .09, 'square', .04, 0, 380); tone(520, .09, 'square', .04, .13, 360); },
  meow:  () => tone(640, .35, 'sine', .045, 0, 920)
};
const snd = n => { try { if (SND[n]) SND[n](); } catch (e) {} };
// nhạc nền nhẹ (thang âm ngũ cung), chỉ chạy sau khi người chơi bấm / nhấn phím lần đầu
let musicT;
const SCALE = [262, 294, 330, 392, 440, 523, 587, 659];
function startMusic() {
  if (musicT) return;
  musicT = setInterval(() => {
    if (!AU.on || document.hidden || !AU.c) return;
    const n = SCALE[Math.floor(Math.random() * SCALE.length)];
    tone(n, 1.8, 'sine', .016); if (Math.random() < .4) tone(n / 2, 2.2, 'triangle', .01, .05);
  }, 1500);
}

function modal(title, html, btns, keep) {
  const card = $('.card'), top = keep ? card.scrollTop : 0;
  open = true;
  $('#mTitle').textContent = title;
  $('#mText').innerHTML = html;
  const box = $('#mBtns'); box.innerHTML = '';
  btns.forEach(b => {
    const el = document.createElement('button');
    el.type = 'button'; if (b.html) el.innerHTML = b.html; else el.textContent = b.label; el.disabled = !!b.off;
    if (b.on) el.classList.add('on');
    el.onclick = () => { snd('click'); if (b.fn) b.fn(el); };
    box.appendChild(el);
  });
  $('#modal').hidden = false;
  card.scrollTop = top;
  if (!keep) { const first = box.querySelector('button:not(:disabled)'); if (first) first.focus(); }
}
function closeModal() { open = false; $('#modal').hidden = true; }
function toast(t) {
  const e = $('#toast'); e.textContent = t; e.classList.add('on');
  clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove('on'), 1800);
}

// ====== STAMINA & EXP ======
function can(n) {
  if (S.stamina >= n) return true;
  toast('Hết sức rồi ⚡ — ăn gì đó ở thị trấn hoặc về nhà đi ngủ nhé!'); snd('error');
  return false;
}
const use = n => { S.stamina = Math.max(0, S.stamina - n); hud(); };
// Cộng EXP; trả về số cấp vừa lên
function gainExp(n) {
  S.exp += n; let up = 0;
  while (S.exp >= expNeed(S.lvl)) { S.exp -= expNeed(S.lvl); S.lvl++; up++; }
  if (up) {
    S.stamina = maxSt(); // lên cấp được hồi đầy stamina
    toast('🎉 Lên cấp! Bạn đạt Lv ' + S.lvl + ' · stamina tối đa ' + maxSt());
    snd('levelup');
  }
  hud(); save();
  return up;
}

// Sang ngày mới: cây lớn, hồi đầy stamina
function newDay() {
  S.plots.forEach(p => { if (p.s === 2 && p.w) p.g++; p.w = false; });
  S.day++; clk = 360; warn = 0; robbed = false; S.stamina = maxSt();
  S.wx = S.nextWx || rollWx(); S.nextWx = rollWx(); S.rainDay = 0; // thời tiết hôm nay + dự báo ngày mai
}

function dayText() {
  const d = $('#day'); d.textContent = (clk >= 1080 ? '🌙 Ngày ' : '🌤 Ngày ') + S.day + ' · ' + hhmm(clk);
  d.classList.toggle('late', clk >= 1320); skyIcons();
}
function hud() {
  dayText(); storyCheck();
  $('#coins').textContent = '🪙 ' + S.coins;
  $('#lvl').textContent = '⭐ Lv ' + S.lvl;
  const mx = maxSt(), need = expNeed(S.lvl);
  $('#stFill').style.width = Math.max(0, S.stamina / mx * 100) + '%';
  $('#stFill').classList.toggle('low', S.stamina / mx < .25);
  $('#stTxt').textContent = S.stamina + '/' + mx;
  $('#xpFill').style.width = Math.min(100, S.exp / need * 100) + '%';
  $('#xpTxt').textContent = S.exp + '/' + need;
  fixSel();
  const box = $('#seeds'); box.innerHTML = '';
  const o = owned();
  if (!o.length) box.innerHTML = '<small class="noseed">🌱 Hết hạt giống — mua ở Seed Shop hoặc học bài với cô Emma</small>';
  o.forEach((id, i) => {
    const b = document.createElement('button');
    const c = crop(id);
    b.type = 'button'; b.innerHTML = sico(id, 26) + '<span class="cnt">' + seedCount(id) + '</span>' + (i < 9 ? '<sup>' + (i + 1) + '</sup>' : '');
    b.className = id === S.sel ? 'on' : '';
    b.title = c.en + ' — ' + c.vi + ' (còn ' + seedCount(id) + ' hạt)';
    b.setAttribute('aria-label', 'Hạt giống ' + c.en + ', còn ' + seedCount(id));
    b.onclick = () => { S.sel = id; snd('select'); hud(); save(); };
    box.appendChild(b);
  });
  const on = box.querySelector('.on'); if (on) box.scrollLeft = on.offsetLeft - box.offsetWidth / 2 + on.offsetWidth / 2;
}

// Câu hỏi về cây trồng (từ vựng cơ bản); wrong → thử lại không bị phạt, nhưng mất thưởng "đúng ngay lần đầu"
function quiz(title, prompt, answer, done) {
  const wrong = shuffle(CROPS.filter(c => c.en !== answer)).slice(0, 2).map(c => c.en);
  let tried = false;
  modal(title, prompt, shuffle([answer, ...wrong]).map(w => ({
    label: w,
    fn: el => {
      if (w === answer) { sfx(660); setTimeout(() => sfx(880, .16), 90); closeModal(); done(!tried); }
      else { tried = true; sfx(150, .22, 'sawtooth'); el.disabled = true; $('#mText').innerHTML = prompt + '<br><em>Chưa đúng, thử lại nhé!</em>'; }
    }
  })));
}

// ====== SỔ TỪ ======
function wordBook() {
  const rows = CROPS.map(c => {
    const n = S.learned[c.id] || 0;
    return n ? `<li>${ico(c.id, 22)} <b>${c.en}</b> — ${c.vi} <small>×${n}</small></li>` : '<li class="lock">❔ ???</li>';
  }).join('');
  const all = [].concat(VOCAB.B1.map(w => [w, 'B1']), VOCAB.B2.map(w => [w, 'B2']));
  const got = all.filter(x => S.words[x[0].en]);
  const adv = got.length
    ? '<ul class="book">' + got.map(x => `<li><span class="tag ${x[1] === 'B2' ? 'b2' : ''}">${x[1]}</span> <b>${x[0].en}</b> — ${x[0].vi} <small>×${S.words[x[0].en]}</small></li>`).join('') + '</ul>'
    : '<p><small>Chưa có từ nào. Hãy đến học với cô Emma 🎓</small></p>';
  modal('📖 Sổ từ vựng',
    '<b>🌱 Cây trồng</b><ul class="book">' + rows + '</ul>' +
    (DECOR.some(d => S.own[d.id]) ? '<b>🛋️ Đồ trang trí đã mua</b><ul class="book">' + DECOR.filter(d => S.own[d.id]).map(d => `<li>${d.e} <b>${d.en}</b> — ${d.vi} <small>×${S.own[d.id]}</small></li>`).join('') + '</ul>' : '') +
    `<b>🎓 Từ B1/B2 đã học (${got.length}/${all.length})</b>` + adv +
    '<p>Trả lời đúng nhiều lần để nhớ lâu hơn!</p>',
    [{ label:'Đóng', fn:closeModal }]);
}

// ====== TÚI ĐỒ: hạt giống (bấm để cầm) + nông sản ======
function bag() {
  snd('bag');
  const got = CROPS.filter(c => (S.inv.crops[c.id] || 0) > 0);
  const o = owned();
  const crops = got.length
    ? '<ul class="book">' + got.map(c => `<li>${ico(c.id, 22)} <b>${c.en}</b> — ${c.vi} <small>×${S.inv.crops[c.id]} · ${c.price}🪙/quả</small></li>`).join('') + '</ul>'
    : '<p><small>Chưa có nông sản. Thu hoạch cây chín để bỏ vào túi, rồi bỏ vào 📦 thùng bán hàng ở nông trại.</small></p>';
  const btns = o.map(id => { const c = crop(id); return { on: id === S.sel, html: `${id === S.sel ? '✋ ' : ''}${sico(id, 26)} ${c.en} <small>(${c.vi})</small> ×${seedCount(id)}`,
    fn: () => { S.sel = id; snd('select'); hud(); save(); bag(); } }; });
  btns.push({ label:'Đóng', fn:closeModal });
  modal('🎒 Túi đồ', '<b>🧺 Nông sản</b>' + crops + fishList() + goodsList() + binLine() + '<b>🌱 Hạt giống</b> <small>— bấm để cầm trên tay rồi đi gieo' + (o.length ? '' : '. Chưa có hạt: mua ở Seed Shop hoặc học bài với cô Emma') + '</small>', btns);
}

// ====== CÔ EMMA: BÀI HỌC B1 / B2 ======
function emma() {
  snd('chat');
  const btn = lv => {
    const L = LESSON[lv], lock = lv === 'B2' && S.lvl < B2_LEVEL;
    return { label: lock ? `🔒 B2 — mở ở Lv ${B2_LEVEL}` : `${lv === 'B1' ? '📘' : '📙'} Bài ${lv} · ${N_Q} câu (⚡${L.st}/câu · +${L.exp} EXP)`,
      off: lock, fn: () => lesson(lv) };
  };
  modal('Teacher Emma 🎓',
    '<b>“Hello! Ready to practise your English?”</b><br>(Chào bạn! Sẵn sàng luyện tiếng Anh chưa?)<br>' +
    `<small>⭐ Lv ${S.lvl} · EXP ${S.exp}/${expNeed(S.lvl)} · ⚡ ${S.stamina}/${maxSt()}. Học từ vựng tốn stamina · trả lời đúng ngay lần đầu được 🌱 hạt giống.</small>`,
    [btn('B1'), btn('B2'), { label:'Đóng', fn:closeModal }]);
}

// Thưởng 1 hạt giống ngẫu nhiên (ưu tiên cây rẻ) cho mỗi câu đúng ngay lần đầu
function rewardSeed() {
  const a = CROPS.filter(c => REQ_LVL(c) <= S.lvl), c = a[Math.floor(Math.random() ** 2 * a.length)];
  addSeed(c.id); return c.id;
}

function lesson(lv) {
  const L = LESSON[lv], pool = VOCAB[lv];
  // ưu tiên những từ bạn ít trả lời đúng nhất
  const picks = pool.map(w => [(S.words[w.en] || 0) + Math.random() * 2.5, w]).sort((a, b) => a[0] - b[0]).slice(0, N_Q).map(x => x[1]);
  const R = { first:0, exp:0, up:false, seeds:{} };
  const tag = `<span class="tag ${lv === 'B2' ? 'b2' : ''}">${lv}</span> `;

  const tired = () => modal('Emma 🎓',
    '<b>“You look exhausted!”</b> (Bạn trông kiệt sức rồi!)<br>Hãy ăn gì đó ở thị trấn hoặc về nhà đi ngủ để lấy lại ⚡ rồi học tiếp nhé.',
    [{ label:'Đóng', fn:closeModal }]);

  const finish = () => {
    let bonus = 0;
    if (R.first === N_Q) bonus = L.perfect;
    const coins = R.first * L.coin; S.coins += coins; if (coins) snd('coin');
    const sd = Object.keys(R.seeds).map(id => sico(id, 20) + '×' + R.seeds[id]).join(' ');
    const lvBefore = S.lvl; if (bonus) gainExp(bonus); else { hud(); save(); }
    const total = R.exp + bonus;
    modal('Kết quả bài ' + lv + ' 🎓',
      '<b>“Well done!”</b> (Làm tốt lắm!)<ul class="sum">' +
      `<li>✅ Đúng ngay lần đầu: <b>${R.first}/${N_Q}</b></li>` +
      `<li>🎓 EXP: <b>+${total}</b>${bonus ? ' (có thưởng 5/5 +' + bonus + ')' : ''}</li>` +
      `<li>🪙 Coin: <b>+${coins}</b></li>` +
      (sd ? `<li>🌱 Hạt thưởng: ${sd}</li>` : '') +
      `<li>⭐ Lv ${S.lvl} · EXP ${S.exp}/${expNeed(S.lvl)}${S.lvl > lvBefore || R.up ? ' 🎉 vừa lên cấp!' : ''}</li>` +
      `<li>⚡ Stamina còn ${S.stamina}/${maxSt()}</li></ul>`,
      [{ label:'Học tiếp 📚', fn:() => (S.stamina >= L.st ? lesson(lv) : tired()) }, { label:'Xong', fn:closeModal }]);
  };

  const ask = i => {
    if (i >= picks.length) return finish();
    if (S.stamina < L.st) return tired();
    const w = picks[i], type = ['en2vi', 'vi2en', 'cloze'][Math.floor(Math.random() * 3)];
    const others = shuffle(pool.filter(x => x.en !== w.en));
    const ds = others.filter(x => x.pos === w.pos).concat(others.filter(x => x.pos !== w.pos)).slice(0, 3);
    let prompt, ans, opts;
    if (type === 'en2vi') { prompt = `Nghĩa của <b>${w.en}</b> <small>(${w.pos})</small> là gì?`; ans = w.vi; opts = ds.map(x => x.vi); }
    else if (type === 'vi2en') { prompt = `Từ tiếng Anh nào có nghĩa là <b>“${w.vi}”</b>?`; ans = w.en; opts = ds.map(x => x.en); }
    else { prompt = `Điền từ vào chỗ trống <small>(${w.pos})</small>:<div class="sent">${w.ex.replace('{}', '_____')}</div>`; ans = w.en; opts = ds.map(x => x.en); }
    let tried = false;
    modal(`Câu ${i + 1}/${N_Q}`, tag + prompt, shuffle([ans, ...opts]).map(o => ({
      label: o,
      fn: el => {
        if (o !== ans) { tried = true; snd('wrong'); el.disabled = true; $('#mText').innerHTML = tag + prompt + '<br><em>Chưa đúng, thử lại nhé!</em>'; return; }
        snd('ok');
        const g = tried ? L.retry : L.exp;
        use(L.st); let sid = null; if (!tried) { R.first++; sid = rewardSeed(); R.seeds[sid] = (R.seeds[sid] || 0) + 1; }
        S.words[w.en] = (S.words[w.en] || 0) + 1;
        R.exp += g; if (gainExp(g)) R.up = true;
        modal(tried ? 'Gần đúng rồi!' : 'Chính xác! ✨',
          `${tag}<span class="ok">${w.en}</span> = ${w.vi} <small>(${w.pos})</small><div class="sent">${w.ex.replace('{}', '<b>' + w.en + '</b>')}</div>🎓 +${g} EXP${sid ? ' · 🌱 +1 ' + sico(sid, 20) + ' ' + crop(sid).en : ''}`,
          [{ label: i + 1 < picks.length ? 'Câu tiếp ➜' : 'Xem kết quả', fn:() => ask(i + 1) }]);
      }
    })));
  };
  ask(0);
}

// ====== TEXTURE (vẽ bằng code, chỉ tạo 1 lần cho mọi cảnh) ======
// ====== CỐT TRUYỆN · CÂU CÁ · BẢN ĐỒ NHỎ ======
const SCENE_NAME = { Farm:'🌾 Nông trại', Town:'🏘️ Thị trấn Sunny', Forest:'🌲 Rừng Sương', Lake:'🎣 Hồ Trăng', Home:'🏠 Nhà' };
const MM = { big:false };
const COST_FISH = 3;

// hội thoại nhiều trang: pages = [{who,en,vi}], fin chạy sau trang cuối
function talk(pages, fin) {
  let i = 0;
  const show = () => {
    const p = pages[i], last = i === pages.length - 1;
    modal(p.who || '📜', `<b>“${p.en}”</b><br>${p.vi}`, [{ label: last ? 'OK 👍' : 'Next ▶', fn: () => { i++; if (i < pages.length) show(); else { closeModal(); if (fin) fin(); } } }]);
  };
  snd('chat'); show();
}
const PROLOGUE = [
  { who:'📜 Thư của ông', en:'Dear grandchild, the old farm is yours now.', vi:'Cháu yêu, nông trại cũ giờ là của cháu.' },
  { who:'📜 Thư của ông', en:'Long ago, our village held the Lantern Festival at the Village Hall.', vi:'Ngày xưa, làng ta tổ chức Lễ hội Đèn Lồng ở Đình làng.' },
  { who:'📜 Thư của ông', en:'Learn English, make friends, and light the lanterns again.', vi:'Hãy học tiếng Anh, kết bạn và thắp sáng những chiếc đèn lồng lần nữa.' },
  { who:'📜 Thư của ông', en:'Start with your first harvest. Teacher Emma will help you. Love, Grandpa.', vi:'Hãy bắt đầu bằng vụ thu hoạch đầu tiên. Cô Emma sẽ giúp cháu. Thương cháu, ông.' }
];
const STORY = [
  { title:'Chương 1 · Welcome Home 🏡', who:'Cô Emma (nông trại)', at:'Farm:emma', where:'Nông trại',
    goal:() => `Thu hoạch 3 cây (${Math.min(3, S.story.cnt.harvest)}/3), rồi gặp cô Emma`, need:() => S.story.cnt.harvest >= 3,
    done:[ { who:'Teacher Emma 🎓', en:'Wonderful! Your grandfather would be so proud of you.', vi:'Tuyệt vời! Ông của bạn chắc sẽ rất tự hào.' },
      { who:'Teacher Emma 🎓', en:'Nobody remembers the festival now. We must invite the whole village!', vi:'Giờ chẳng ai nhớ lễ hội nữa. Ta phải mời cả làng!' },
      { who:'Teacher Emma 🎓', en:'Go to town and ask Lily at the Seed Shop. She knows every family.', vi:'Hãy vào thị trấn hỏi Lily ở Seed Shop. Cô ấy biết mọi gia đình.' } ],
    reward:{ coins:40, exp:20 } },
  { title:'Chương 2 · Words for Friends 💬', who:'Lily (Seed Shop)', at:'Town:shop', where:'Thị trấn (đi sang phải)',
    goal:() => `Học 10 từ vựng với cô Emma (${Math.min(10, Object.keys(S.words).length)}/10), rồi gặp Lily`, need:() => Object.keys(S.words).length >= 10,
    done:[ { who:'Lily 🌱', en:'Your English is so good now! Everyone will understand our invitation.', vi:'Tiếng Anh của bạn giỏi quá! Ai cũng sẽ hiểu lời mời của ta.' },
      { who:'Lily 🌱', en:'Next, the fishermen must hear the news. Captain Hai lives at Moon Lake.', vi:'Tiếp theo, các ngư dân cần nghe tin. Thuyền trưởng Hải ở Hồ Trăng.' },
      { who:'Lily 🌱', en:'Walk to the bottom of your farm. The lake is just south!', vi:'Đi xuống phía dưới nông trại của bạn. Hồ ở ngay phía nam!' } ],
    reward:{ coins:60, exp:30, seeds:3 } },
  { title:'Chương 3 · The Silver Fish 🎣', who:'Thuyền trưởng Hải (Hồ Trăng)', at:'Lake:captain', where:'Hồ Trăng (cuối nông trại, phía nam)',
    goal:() => `Câu 3 con cá (${Math.min(3, S.story.cnt.fish)}/3), rồi gặp thuyền trưởng Hải`, need:() => S.story.cnt.fish >= 3,
    done:[ { who:'Captain Hai ⚓', en:'Ha-ha! You caught them yourself. That is real fisherman’s luck!', vi:'Ha-ha! Bạn tự câu được rồi. Đúng là vận may của dân chài!' },
      { who:'Captain Hai ⚓', en:'We need lantern paper for the festival. Elder Moss makes the best.', vi:'Lễ hội cần giấy đèn lồng. Cụ Moss làm giấy đẹp nhất.' },
      { who:'Captain Hai ⚓', en:'Look for him in Mist Forest, north of your farm.', vi:'Hãy tìm cụ ở Rừng Sương, phía bắc nông trại của bạn.' } ],
    reward:{ coins:80, exp:40 } },
  { title:'Chương 4 · Whispers of the Forest 🌲', who:'Cụ Moss (Rừng Sương)', at:'Forest:moss', where:'Rừng Sương (phía bắc nông trại)',
    goal:() => `Nhặt 5 món trong rừng (${Math.min(5, S.story.cnt.forage)}/5), rồi gặp cụ Moss`, need:() => S.story.cnt.forage >= 5,
    done:[ { who:'Elder Moss 🧙', en:'Mushrooms, berries and herbs... the forest likes you.', vi:'Nấm, quả mọng và thảo dược... khu rừng quý mến bạn.' },
      { who:'Elder Moss 🧙', en:'Here is the lantern paper, and my blessing.', vi:'Đây là giấy đèn lồng và lời chúc phúc của ta.' },
      { who:'Elder Moss 🧙', en:'Grow strong. Reach level 4, then light the lanterns at the Village Hall!', vi:'Hãy trưởng thành. Đạt cấp 4 rồi thắp đèn lồng ở Đình làng!' } ],
    reward:{ coins:100, exp:50 } },
  { title:'Chương 5 · Lantern Festival 🏮', who:'Đình làng (thị trấn)', at:'Town:dinh', where:'Đình làng (thị trấn)',
    goal:() => `Đạt Lv 4 (Lv ${Math.min(4, S.lvl)}/4), rồi thắp đèn ở Đình làng`, need:() => S.lvl >= 4,
    done:[ { who:'🏮 Village Hall', en:'You place the lantern paper and light the first candle.', vi:'Bạn đặt giấy đèn lồng và thắp ngọn nến đầu tiên.' },
      { who:'🏮 Village Hall', en:'One by one, the villagers come. Lily, Captain Hai, Elder Moss, Emma…', vi:'Từng người một, dân làng kéo đến. Lily, thuyền trưởng Hải, cụ Moss, cô Emma…' },
      { who:'🏮 Village Hall', en:'“Thank you for bringing us together,” they say. “Welcome home!”', vi:'“Cảm ơn bạn đã gắn kết chúng tôi,” họ nói. “Chào mừng về nhà!”' },
      { who:'📜 Grandpa', en:'I knew you could do it. The farm and the village are in good hands.', vi:'Ông biết cháu làm được. Nông trại và ngôi làng đã ở trong tay tốt.' },
      { who:'🎉 THE END', en:'Thank you for playing English Farm!', vi:'Hết phần cốt truyện chính! Bạn vẫn tiếp tục chơi tự do được: đèn lồng sẽ sáng mãi ở Đình làng.' } ],
    reward:{ coins:300, exp:100, seeds:5 } }
];
const curCh = () => STORY[S.story.ch];
function storyCheck() {
  const ch = curCh();
  if (ch && ch.need() && S.story.nt !== S.story.ch) { S.story.nt = S.story.ch; save(); toast('📜 Xong nhiệm vụ! Hãy gặp: ' + ch.who); snd('levelup'); }
  const b = $('#questBtn'); if (b) b.innerHTML = (SPR.ui_scroll ? spImg('ui_scroll', 20) : '📜') + ' Nhiệm vụ' + (ch ? (ch.need() ? ' ❗' : '') : ' ✔');
}
// bấm vào NPC / nơi nhận nhiệm vụ: nếu đủ điều kiện thì trả nhiệm vụ và trả về true
function turnIn(key) {
  const ch = curCh();
  if (!ch || ch.at !== key || !ch.need()) return false;
  talk(ch.done, () => {
    const r = ch.reward; S.coins += r.coins || 0;
    let seeds = ''; for (let i = 0; i < (r.seeds || 0); i++) seeds += sico(rewardSeed(), 20);
    S.story.ch++; save(); hud(); snd('coin');
    const nx = curCh();
    modal('🎁 Hoàn thành!', `<b>${ch.title}</b><br>+${r.coins || 0} 🪙 · +${r.exp || 0} EXP ${seeds}` + (nx ? `<br><br>📜 <b>Nhiệm vụ mới</b><br>${nx.title}<br><small>${nx.goal()}</small>` : '<br><br>🏮 Bạn đã hoàn thành cốt truyện chính!'),
      [{ label:'OK 👍', fn: () => { closeModal(); gainExp(r.exp || 0); } }]);
  });
  return true;
}
function questLog() {
  snd('click');
  const ch = curCh();
  const done = STORY.slice(0, S.story.ch).map(c => `<li>✅ ${c.title}</li>`).join('');
  modal('📜 Nhiệm vụ', (ch ? `<b>${ch.title}</b><br>🎯 ${ch.goal()}<br><small>📍 ${ch.where} · gặp: ${ch.who}</small>` : '<b>🏮 Bạn đã thắp sáng Lễ hội Đèn Lồng!</b><br>Cốt truyện chính đã hoàn thành.') +
    (done ? `<ul class="sum" style="margin-top:8px">${done}</ul>` : ''), [{ label:'Đóng', fn:closeModal }]);
}
function worldMap() {
  snd('click');
  const here = activeScene() ? activeScene().scene.key : '', mk = k => (here === k ? '📍' : '') + SCENE_NAME[k];
  modal('🗺️ Bản đồ', `<pre style="font:inherit;line-height:1.7;margin:0 0 8px;text-align:center">${mk('Forest')}\n↕\n${mk('Farm')} ↔ ${mk('Town')}\n↕\n${mk('Lake')}</pre><small>Rừng: đi lên phía trên nông trại · Hồ: đi xuống phía dưới · Thị trấn: đi sang phải. Phím M: phóng to / thu nhỏ bản đồ nhỏ.</small>`, [{ label:'Đóng', fn:closeModal }]);
}

// ====== CÂU CÁ ======
const FISH = [  // e = emoji dự phòng; sau khi nạp sprite, e thành thẻ <img>
  { id:'sardine',   en:'Sardine',      vi:'Cá mòi',        price:8,   diff:0, w:30, e:'🐟' },
  { id:'tilapia',   en:'Tilapia',      vi:'Cá rô phi',     price:12,  diff:0, w:24, e:'🐟' },
  { id:'carp',      en:'Carp',         vi:'Cá chép',       price:14,  diff:1, w:26, e:'🐟' },
  { id:'shrimp',    en:'Shrimp',       vi:'Tôm',           price:18,  diff:1, w:12, e:'🦐' },
  { id:'catfish',   en:'Catfish',      vi:'Cá trê',        price:20,  diff:2, w:16, e:'🐟' },
  { id:'crab',      en:'Crab',         vi:'Cua',           price:24,  diff:2, w:8,  e:'🦀' },
  { id:'snakehead', en:'Snakehead',    vi:'Cá lóc',        price:28,  diff:2, w:10, e:'🐟' },
  { id:'eel',       en:'Eel',          vi:'Lươn',          price:36,  diff:3, w:6,  e:'🐍' },
  { id:'koi',       en:'Golden Koi',   vi:'Cá chép vàng',  price:120, diff:4, w:2,  e:'🐠' },
  { id:'boot',      en:'Old Boot',     vi:'Chiếc ủng cũ',  price:1,   diff:0, w:3,  e:'👢' }
];
FISH.forEach(f => { f.em = f.e; if (SPR['it_' + f.id]) f.e = spImg('it_' + f.id); });
['egg', 'milk'].forEach(k => { if (SPR['it_' + k]) GOODS[k].e = spImg('it_' + k); });
const fishOf = id => FISH.find(f => f.id === id);
function fishList() {
  const got = FISH.filter(f => (S.inv.fish[f.id] || 0) > 0);
  return '<b>🎣 Cá</b>' + (got.length ? '<ul class="book">' + got.map(f => `<li>${f.e} <b>${f.en}</b> — ${f.vi} <small>×${S.inv.fish[f.id]} · ${f.price}🪙</small></li>`).join('') + '</ul>' : '<p><small>Chưa có cá. Ra Hồ Trăng (phía nam nông trại) để câu.</small></p>');
}
function fishing() {
  if (open) return;
  if (!S.rod) return modal('Hồ Trăng 🎣', '<b>“You need a fishing rod!”</b><br>Bạn cần có cần câu. Hãy nói chuyện với thuyền trưởng Hải gần cầu tàu.', [{ label:'OK', fn:closeModal }]);
  if (!can(COST_FISH)) return;
  use(COST_FISH);
  const tot = FISH.reduce((t, f) => t + f.w, 0); let r = Math.random() * tot, f = FISH[0];
  for (const x of FISH) { if ((r -= x.w) < 0) { f = x; break; } }
  const tok = fishing.tok = {};
  modal('🎣 Đang chờ cá cắn…', '<div class="big">🎣</div><p>Thả câu xuống nước… chờ phao động nhé.</p>', [{ label:'Thu cần về', fn:closeModal }]);
  setTimeout(() => { if (open && fishing.tok === tok && $('#mTitle').textContent.startsWith('🎣')) reel(f); }, 1200 + Math.random() * 2600);
}
function reel(f) {
  snd('select');
  modal('🐟 Cá cắn câu! Kéo lên!',
    '<div class="fish-wrap"><div class="fish-field"><div id="fBar"></div><div id="fFish">' + f.e + '</div></div><div class="fish-prog"><i id="fProg"></i></div></div>' +
    '<button id="fHold" type="button">⬆ Giữ để nâng vùng xanh</button><p><small>Giữ <b>Space</b> hoặc nút để nâng vùng xanh, thả ra để hạ. Giữ cá nằm trong vùng xanh để kéo cá lên!</small></p>',
    [{ label:'Bỏ cuộc', fn: () => { end = true; closeModal(); toast('Cá thoát mất rồi 😅'); } }]);
  if (document.activeElement) document.activeElement.blur();
  const H = 200, bh = Math.max(38, 74 - f.diff * 10), bar = $('#fBar'), fish = $('#fFish'), prog = $('#fProg'), hold = $('#fHold');
  bar.style.height = bh + 'px';
  let by = H - bh, bv = 0, fy = 80, ft = 0, tgt = 80, pr = 30, held = false, end = false, last = performance.now();
  const dn = () => { held = true; }, up = () => { held = false; };
  hold.addEventListener('pointerdown', dn); window.addEventListener('pointerup', up);
  const kd = e => { if (e.code === 'Space') { e.preventDefault(); held = true; } }, ku = e => { if (e.code === 'Space') held = false; };
  window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
  const stop = () => { end = true; window.removeEventListener('pointerup', up); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  const loop = now => {
    if (end || !open) return stop();
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    bv += (held ? -950 : 750) * dt; bv = Math.max(-380, Math.min(380, bv)); by += bv * dt;
    if (by < 0) { by = 0; bv = 0; } if (by > H - bh) { by = H - bh; bv = -bv * .25; }
    ft -= dt; if (ft <= 0) { tgt = Math.random() * (H - 24); ft = .6 + Math.random() * 1.1; }
    const sp = 70 + f.diff * 45, d = tgt - fy; fy += Math.sign(d) * Math.min(Math.abs(d), sp * dt);
    const hit = fy + 12 >= by && fy + 12 <= by + bh;
    pr += (hit ? 26 : -20) * dt; pr = Math.min(100, pr);
    bar.style.top = by + 'px'; fish.style.top = fy + 'px'; prog.style.height = Math.max(0, pr) + '%';
    if (pr >= 100) { stop(); return caught(f); }
    if (pr <= 0) { stop(); closeModal(); toast('Cá thoát mất rồi 😅'); snd('error'); return; }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
function caught(f) {
  S.inv.fish[f.id] = (S.inv.fish[f.id] || 0) + 1;
  if (f.id !== 'boot') S.story.cnt.fish++;
  const first = !S.fishDex[f.id]; S.fishDex[f.id] = (S.fishDex[f.id] || 0) + 1;
  save(); snd('harvest');
  modal(`${f.em} You caught a ${f.en}!`, `<div class="big">${f.e}</div><b>${f.en}</b> = ${f.vi}<br>💰 ${f.price} 🪙 ${first ? '<br>📖 Loài mới! +8 EXP' : '<br>🎓 +2 EXP'}`,
    [{ label:'Câu tiếp 🎣', fn: () => { closeModal(); fishing(); } }, { label:'Đóng', fn:closeModal }]);
  gainExp(first ? 8 : 2);
}
// thuyền trưởng Hải: tặng cần câu, mua cá, kể chuyện
function captain() {
  snd('chat');
  if (!S.rod) {
    return talk([{ who:'Captain Hai ⚓', en:'Welcome to Moon Lake! Every fisherman needs a rod. Take this one!', vi:'Chào mừng đến Hồ Trăng! Dân chài nào cũng cần một chiếc cần câu. Tặng bạn nhé!' },
      { who:'Captain Hai ⚓', en:'Stand near the water and press E to fish. Hold Space to catch the fish.', vi:'Đứng gần mặt nước và bấm E để câu. Giữ Space để kéo cá.' }], () => { S.rod = true; save(); toast('🎣 Nhận được cần câu tre!'); snd('coin'); });
  }
  const got = FISH.filter(f => (S.inv.fish[f.id] || 0) > 0), total = got.reduce((t, f) => t + f.price * S.inv.fish[f.id], 0);
  const sell = list => { let g = 0; list.forEach(f => { g += f.price * S.inv.fish[f.id]; delete S.inv.fish[f.id]; }); S.coins += g; snd('coin'); hud(); save(); toast(`Đã bán cá +${g} 🪙`); captain(); };
  const btns = got.map(f => ({ html: `${f.e} Bán ${f.en} <small>(${f.vi})</small> ×${S.inv.fish[f.id]} — ${f.price * S.inv.fish[f.id]} 🪙`, fn: () => sell([f]) }));
  if (got.length > 1) btns.push({ label:`💰 Bán tất cả — ${total} 🪙`, fn: () => sell(got) });
  btns.push({ label:'Đóng', fn:closeModal });
  const dex = Object.keys(S.fishDex).length;
  modal('Captain Hai ⚓', `<b>“Fresh fish? I will buy them!”</b><br>(Cá tươi à? Tôi mua hết!)<br><small>📖 Đã câu được ${dex}/${FISH.length} loài · ⚡${COST_FISH} stamina mỗi lần thả câu</small>` + (got.length ? '' : '<br><small>Bạn chưa có cá để bán.</small>'), btns);
}

// ====== VẬT NUÔI: chơi với con vật → học từ + nhận sản phẩm mỗi ngày ======
function petAnimal(a) {
  const d = ANIMALS[a.kind];
  if (S.petDay !== S.day) { S.petDay = S.day; S.petDone = {}; }
  const first = !S.petDone[a.id]; S.petDone[a.id] = 1;
  snd(d.snd || 'chat');
  let extra = '';
  if (first && d.prod) { S.inv.goods[d.prod] = (S.inv.goods[d.prod] || 0) + 1; extra = ` · +1 ${GOODS[d.prod].e} ${GOODS[d.prod].en} (${GOODS[d.prod].vi})`; }
  save();
  modal(d.e + ' ' + d.en, `<div class="big">${d.e}</div><b>${d.en.toLowerCase()}</b> = ${d.vi}<div class="sent">${d.line[0]}</div>${d.line[1]}<br>` +
    (first ? `🎓 +2 EXP${extra}` : '<small>Hôm nay bạn đã chơi với bạn này rồi 💕 Mai quay lại nhé!</small>'), [{ label:'OK 👍', fn:closeModal }]);
  if (first) gainExp(2);
}

// ====== THÙNG BÁN HÀNG (nông trại): bỏ hàng vào, qua đêm mới có tiền ======
const listItems = src => {
  const out = [];
  CROPS.forEach(c => { const n = src.crops[c.id] || 0; if (n > 0) out.push({ k:'crops', id:c.id, ic:ico(c.id, 22), en:c.en, vi:c.vi, price:c.price, n }); });
  FISH.forEach(f => { const n = src.fish[f.id] || 0; if (n > 0) out.push({ k:'fish', id:f.id, ic:f.e, en:f.en, vi:f.vi, price:f.price, n }); });
  Object.keys(GOODS).forEach(id => { const n = src.goods[id] || 0; if (n > 0) { const g = GOODS[id]; out.push({ k:'goods', id, ic:g.e, en:g.en, vi:g.vi, price:g.price, n }); } });
  return out;
};
const itemsValue = a => a.reduce((t, x) => t + x.n * x.price, 0);
const binCount = () => listItems(S.bin).reduce((t, x) => t + x.n, 0);
const binValue = () => itemsValue(listItems(S.bin));
const goodsList = () => { const g = listItems({ crops:{}, fish:{}, goods:S.inv.goods }); return g.length ? '<b>🥚 Sản phẩm vật nuôi</b><ul class="book">' + g.map(x => `<li>${x.ic} <b>${x.en}</b> — ${x.vi} <small>×${x.n} · ${x.price}🪙</small></li>`).join('') + '</ul>' : ''; };
const binLine = () => binCount() ? `<p><small>📦 Trong thùng bán hàng: ${binCount()} món (~${binValue()} 🪙) — tiền vào ví sáng mai.</small></p>` : '';

function binUI(keep) {
  snd('bag');
  const inv = listItems(S.inv), inb = listItems(S.bin);
  const move = (arr, from, to) => { arr.forEach(x => { to[x.k][x.id] = (to[x.k][x.id] || 0) + x.n; delete from[x.k][x.id]; }); snd('place'); save(); binUI(true); };
  const rows = inb.length ? '<ul class="book">' + inb.map(x => `<li>${x.ic} <b>${x.en}</b> <small>×${x.n} · ${x.n * x.price}🪙</small></li>`).join('') + '</ul>' : '<p><small>Thùng đang trống.</small></p>';
  const btns = inv.map(x => ({ html:`${x.ic} Bỏ ${x.en} <small>(${x.vi})</small> ×${x.n} — ${x.n * x.price} 🪙`, fn:() => move([x], S.inv, S.bin) }));
  if (inv.length > 1) btns.push({ label:`📦 Bỏ tất cả — ${itemsValue(inv)} 🪙`, fn:() => move(inv, S.inv, S.bin) });
  if (inb.length) btns.push({ label:'↩ Lấy lại tất cả', fn:() => move(inb, S.bin, S.inv) });
  btns.push({ label:'Đóng', fn:closeModal });
  modal('📦 Thùng bán hàng', '<b>“Put your goods in the box.”</b><br>(Hãy bỏ hàng vào thùng.)<br><small>🌙 Qua đêm, Lily sẽ đến lấy hàng — tiền được cộng vào ví lúc bạn thức dậy. Nhớ ngủ trước 24:00!</small>' +
    `<br><b>Trong thùng</b> — ước tính ${itemsValue(inb)} 🪙` + rows + (inv.length ? '' : '<small>Túi bạn chưa có gì để bán. Thu hoạch, câu cá hoặc chơi với vật nuôi nhé!</small>'), btns, keep);
}

// ====== CUT SCENE & MÀN TỔNG KẾT (lớp DOM phủ lên game) ======
const texEl = (key, sc) => {
  const s = activeScene(), c = document.createElement('canvas'); let src = null;
  try { src = s.textures.get(key).getSourceImage(); } catch (e) {}
  const w = src ? src.width : 32, h = src ? src.height : 32; c.width = w; c.height = h; if (src) c.getContext('2d').drawImage(src, 0, 0);
  c.style.width = w * sc + 'px'; c.style.height = h * sc + 'px'; return c;
};
const heroEl = sc => { const M = window.ASSET_META, w = M.hero[0], h = M.hero[1], c = document.createElement('canvas'); c.width = w; c.height = h;
  if (IMG.hero) c.getContext('2d').drawImage(IMG.hero, 0, 0, w, h, 0, 0, w, h); c.style.width = w * sc + 'px'; c.style.height = h * sc + 'px'; return c; };
function countTo(node, from, to, ms) {
  const t0 = performance.now();
  const f = now => { const k = Math.min(1, (now - t0) / ms); node.textContent = Math.round(from + (to - from) * k); if (k < 1 && node.isConnected) requestAnimationFrame(f); };
  requestAnimationFrame(f);
}
function timeline(steps) { // steps: [[ms, fn], …] — skip() chạy nốt mọi bước còn lại ngay lập tức
  const ids = [], ran = steps.map(() => false), run = i => { if (!ran[i]) { ran[i] = true; steps[i][1](); } };
  steps.forEach((s, i) => ids.push(setTimeout(() => run(i), s[0])));
  return { skip() { ids.forEach(clearTimeout); steps.forEach((s, i) => run(i)); } };
}
function stars(box) { let h = ''; for (let i = 0; i < 40; i++) h += `<i style="left:${Math.random() * 100}%;top:${Math.random() * 62}%;opacity:${.4 + Math.random() * .6}"></i>`; box.innerHTML = h; }
function coinBurst(el) {
  for (let i = 0; i < 6; i++) { const s = document.createElement('span'); s.className = 'cn-coin'; s.textContent = '🪙'; s.style.left = (38 + Math.random() * 24) + '%'; s.style.top = (46 + Math.random() * 10) + '%'; s.style.animationDelay = (i * 60) + 'ms'; el.appendChild(s); setTimeout(() => s.remove(), 1300); }
}

// Nửa đêm mà chưa ngủ: bị móc túi (hoặc được cụ Moss cứu)
function robbery() {
  open = true; CINE.on = true;
  const sc = activeScene(), saved = Math.random() < RESCUE, had = S.coins;
  const loss = saved || had <= 0 ? 0 : Math.min(had, Math.max(5, Math.round(had * (.3 + Math.random() * .3))));
  const el = $('#cine'); el.hidden = false; el.className = 'cn robbery';
  el.innerHTML = '<div class="cs-sky"></div><img class="cs-moon" alt="" src="' + iconURL('moon', true) + '"><div class="cs-stars"></div><div class="cs-ground"></div><div class="cs-stage"></div><div class="cs-cap"></div>' +
    '<div class="cs-bar top"></div><div class="cs-bar bot"></div><div class="cs-btns"><button type="button" id="csSkip">⏭ Bỏ qua</button><button type="button" id="csGo" hidden>Tiếp tục ➜</button></div>';
  stars(el.querySelector('.cs-stars'));
  setTimeout(() => el.classList.add('in'), 30);
  const stage = el.querySelector('.cs-stage'), cap = el.querySelector('.cs-cap');
  const say = (vi, en) => { cap.innerHTML = vi + (en ? '<small>' + en + '</small>' : ''); };
  const actor = (node, left) => { const d = document.createElement('div'); d.className = 'sp'; d.style.left = left; d.appendChild(node); stage.appendChild(d); return d; };
  const mv = (a, left, ms) => { a.style.transition = 'left ' + ms + 'ms linear'; void a.offsetWidth; a.style.left = left; };
  const put = (a, txt, cls, l, b) => { const s = document.createElement('span'); s.className = cls; s.textContent = txt; s.style.left = l + 'px'; s.style.bottom = b + 'px'; a.appendChild(s); return s; };
  const bub = (a, txt, ms) => { const b = put(a, txt, 'bub', 30, 0); b.style.bottom = '100%'; setTimeout(() => b.remove(), ms || 1400); };
  const hero = actor(heroEl(2.4), '46%'); hero.firstChild.style.animation = 'nod 2.4s ease-in-out infinite';
  const zz = put(hero, '💤', 'bub zz', 70, 0); zz.style.bottom = '100%';
  const hb = put(hero, '💰', 'bag', 84, 26);
  const th = actor(texEl('thief', 3), '-20%'), tb = put(th, '💰', 'bag', 70, 40); tb.style.display = 'none';
  const mo = actor(texEl('moss', 3), '112%'), lan = put(mo, '🏮', 'bag lan', -24, 36); lan.style.display = 'none';
  const go = el.querySelector('#csGo'), skip = el.querySelector('#csSkip');
  let applied = false;
  const apply = () => { if (applied) return; applied = true; if (loss) { S.coins -= loss; snd('error'); } hud(); save(); };
  const fin = () => { apply(); go.hidden = false; skip.hidden = true; go.focus(); };
  const st = [], at = (ms, fn) => st.push([ms, fn]);
  at(0, () => { say('🕛 Đã quá nửa đêm… bạn mệt quá nên ngồi xuống ven đường và ngủ thiếp đi.', 'It is midnight. You fall asleep by the road.'); snd('sleep'); });
  at(2800, () => { say('👤 Một bóng đen lén lút tiến lại gần…', 'Someone is sneaking closer…'); mv(th, '32%', 2600); snd('cricket'); });
  [3300, 3900, 4500, 5100].forEach(t => at(t, () => snd('step')));
  at(5700, () => { say('🤏 Hắn thò tay vào túi bạn…', 'He is reaching for your money bag!'); bub(th, '…', 1400); });
  if (had <= 0) {
    at(7000, () => { say('🤨 Hắn lục túi bạn… nhưng chẳng có đồng nào!', 'Your pockets are empty!'); bub(th, '💢', 1400); snd('wrong'); });
    at(8600, () => { mv(th, '-25%', 1400); snd('step'); });
    at(10200, () => { say('😅 May mà ví bạn trống không — kẻ gian bỏ đi tay trắng.', 'Always sleep before midnight!'); fin(); });
  } else if (saved) {
    at(7000, () => { hb.style.display = 'none'; tb.style.display = 'block'; say('😱 Hắn giật lấy túi tiền của bạn!', 'He grabs your money bag!'); snd('error'); });
    at(8200, () => { say('🧙 Cụ Moss: “Hey! Stop, thief!”', 'Này! Đứng lại, đồ trộm!'); lan.style.display = 'block'; mv(mo, '64%', 1800); snd('chat'); });
    at(9600, () => { bub(th, '❗', 1300); tb.style.display = 'none'; hb.style.display = 'block'; mv(th, '-25%', 1100); snd('wrong'); });
    at(10700, () => { snd('step'); });
    at(11200, () => { say('🧙 Cụ Moss: “Always go to bed before midnight, young one.”', 'Hãy đi ngủ trước nửa đêm nhé, cháu.'); mv(mo, '58%', 900); snd('chat'); });
    at(13400, () => { say('✨ Nhờ cụ Moss, bạn không mất đồng nào! Cụ còn tặng bạn một món quà nhỏ.', 'Elder Moss saved your money!'); snd('levelup'); fin(); });
  } else {
    at(7000, () => { hb.style.display = 'none'; tb.style.display = 'block'; say('😱 Hắn giật lấy túi tiền của bạn!', 'Stop! My money!'); snd('error'); });
    at(8000, () => { bub(hero, '❗', 1400); mv(th, '115%', 1500); snd('step'); });
    at(10200, () => { say(`🌅 Bạn tỉnh dậy trong nhà… túi tiền nhẹ bẫng. Mất ${loss} 🪙!`, 'Always sleep before midnight!'); fin(); });
  }
  const tl = timeline(st);
  skip.onclick = () => tl.skip();
  go.onclick = () => sleepSummary(sc, { forced:true, loss, saved });
  skip.focus();
}

// Sang ngày mới: thu tiền từ thùng hàng (có hoạt ảnh đếm tiền), báo thời tiết, rồi về nhà thức dậy
function sleepSummary(sc, o) {
  o = o || {};
  const items = listItems(S.bin), total = itemsValue(items), endDay = S.day;
  const gift = o.saved ? rewardSeed() : null;
  const before = S.coins;
  S.coins += total; S.bin = { crops:{}, fish:{}, goods:{} };
  newDay();
  if (o.forced) S.stamina = Math.round(maxSt() * .7);
  save();
  const after = S.coins;
  const el = $('#cine'); el.hidden = false; el.className = 'cn morning'; open = true; CINE.on = true;
  el.innerHTML = '<div class="cn-sky dawn"></div><div class="cn-sky night"></div><div class="cn-stars"></div><img class="cn-sun" alt="" src="' + iconURL('sun', true) + '"><div class="cn-hill h1"></div><div class="cn-hill h2"></div>' +
    '<div class="cn-card" role="dialog"><h2 id="cnT">🌙 Ngày ' + endDay + ' kết thúc…</h2><div id="cnSub" class="cn-sub">Bạn ngủ say… 💤</div><ul id="cnRows" class="cn-rows"></ul>' +
    '<div id="cnTot" class="cn-tot" hidden>💰 Doanh thu đêm qua: <b>+<span id="cnSum">0</span> 🪙</b></div>' +
    '<div id="cnWal" class="cn-wal" hidden>Ví: <span id="cnFrom">' + before + '</span> ➜ <b><span id="cnTo">' + before + '</span> 🪙</b></div><div id="cnExtra" class="cn-extra"></div>' +
    '<div class="cn-btns"><button type="button" id="cnSkip">⏭ Bỏ qua</button><button type="button" id="cnGo" hidden>☀️ Bắt đầu ngày mới</button></div></div>';
  stars(el.querySelector('.cn-stars'));
  const rowsEl = $('#cnRows'), go = $('#cnGo'), skip = $('#cnSkip');
  const st = [], at = (ms, fn) => st.push([ms, fn]);
  let run = 0, t = 3300;
  at(0, () => snd('sleep'));
  at(1500, () => { el.classList.add('dawned'); $('#cnT').textContent = '☀️ Chào buổi sáng! Ngày ' + S.day; $('#cnSub').textContent = 'Lily đã đến lấy hàng trong thùng của bạn…'; snd('wake'); });
  if (!items.length) {
    at(t, () => { $('#cnSub').innerHTML = 'Thùng hàng đêm qua trống trơn. Hãy bỏ nông sản vào <b>📦 thùng</b> ở nông trại để bán nhé!'; });
    t += 700;
  } else {
    at(t - 150, () => { $('#cnTot').hidden = false; });
    items.forEach((x, i) => at(t + i * 520, () => {
      const li = document.createElement('li');
      li.innerHTML = x.ic + ' <span>' + x.en + ' ×' + x.n + ' <small>(' + x.price + '🪙/cái)</small></span><b>+' + x.n * x.price + '</b>';
      rowsEl.appendChild(li); rowsEl.scrollTop = 9999;
      const from = run; run += x.n * x.price; countTo($('#cnSum'), from, run, 380); snd('coin'); coinBurst(el);
    }));
    t += items.length * 520 + 300;
  }
  at(t, () => { $('#cnWal').hidden = false; countTo($('#cnTo'), before, after, 900); if (total) { snd('levelup'); coinBurst(el); } });
  t += 1200;
  at(t, () => {
    const w = S.wx, ex = [];
    ex.push(`<li>${WX_NAME[w.k]}${w.k === 'rain' ? ` — mưa khoảng ${w.a}h đến ${w.b}h, cây được tưới tự nhiên 💧` : ''}</li>`);
    if (o.forced && o.saved) ex.push(`<li>🧙 Cụ Moss cứu bạn, không mất đồng nào! Quà: ${sico(gift, 20)} hạt ${crop(gift).en}</li>`);
    else if (o.forced && o.loss) ex.push(`<li>😱 Bạn bị móc túi mất <b>${o.loss} 🪙</b>. Nhớ ngủ trước 24:00 nhé!</li>`);
    else if (o.forced) ex.push('<li>😅 May mà ví trống rỗng, kẻ gian chẳng lấy được gì.</li>');
    if (o.forced) ex.push('<li>⚡ Ngủ ngoài đường không ngon giấc: stamina chỉ còn 70%</li>');
    if (o.cozy) ex.push(`<li>🛋️ Nhà ấm cúng: +${o.cozy} EXP</li>`);
    $('#cnExtra').innerHTML = '<ul class="sum">' + ex.join('') + '</ul>';
    $('#cnSum').textContent = total; $('#cnTo').textContent = after;
    go.hidden = false; skip.hidden = true; go.focus();
  });
  const tl = timeline(st);
  skip.onclick = () => tl.skip();
  go.onclick = () => {
    el.hidden = true; el.innerHTML = ''; el.className = ''; CINE.on = false; open = false;
    hud(); save(); snd('wake');
    if (sc && sc.scene.key === 'Home') { sc.cameras.main.fadeIn(500); sc.leaving = false; } else if (sc) sc.scene.start('Home', { from:sc.scene.key });
    toast('Good morning! Ngày ' + S.day + ' · ' + WX_NAME[wxNow()]);
    if (o.cozy) gainExp(o.cozy);
  };
  skip.focus();
}

// ====== HIỆU ỨNG MƯA / SẤM CHỚP / ĐOM ĐÓM (canvas phủ lên game) ======
const FX = { drops:[], ff:[], flash:0, nextBolt:0, last:0, node:null };
function rainSound(on) {
  if (!AU.c || !AU.nb) return;
  if (on && AU.on && !FX.node) { try { const a = AU.c, s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
    s.buffer = AU.nb; s.loop = true; f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = .5; g.gain.value = 0; s.connect(f); f.connect(g); g.connect(AU.m); s.start(); FX.node = g; } catch (e) {} }
  if (FX.node) FX.node.gain.value = on && AU.on ? .022 : 0;
}
function fxLoop(now) {
  requestAnimationFrame(fxLoop);
  const cv = $('#fx'); if (!cv) return;
  const box = cv.parentElement, w = box.clientWidth, h = box.clientHeight; if (!w || !h) return;
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  const g = cv.getContext('2d'); g.clearRect(0, 0, w, h);
  const dt = Math.min(.05, (now - (FX.last || now)) / 1000); FX.last = now;
  const sc = activeScene(), key = sc ? sc.scene.key : 'Boot';
  const out = key !== 'Home' && key !== 'Boot' && !CINE.on, wx = wxNow(), hr = clk / 60, raining = out && wx === 'rain';
  rainSound(raining);
  if (raining) {
    while (FX.drops.length < 150) FX.drops.push({ x:Math.random(), y:Math.random(), s:.8 + Math.random() * .6 });
    g.fillStyle = 'rgba(50,70,100,.10)'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(200,225,255,.55)'; g.lineWidth = 1.5; g.beginPath();
    FX.drops.forEach(d => { d.y += dt * 1.3 * d.s; d.x -= dt * .18 * d.s; if (d.y > 1) { d.y = -.05; d.x = Math.random() * 1.2; } if (d.x < 0) d.x += 1.2; const x = d.x * w, y = d.y * h; g.moveTo(x, y); g.lineTo(x - 5, y + 14 * d.s); });
    g.stroke();
    if (now > FX.nextBolt) { if (FX.nextBolt) { FX.flash = 1; setTimeout(() => snd('thunder'), 350); } FX.nextBolt = now + 9000 + Math.random() * 9000; }
  } else { FX.nextBolt = 0; if (out && wx === 'cloud') { g.fillStyle = 'rgba(70,90,120,.05)'; g.fillRect(0, 0, w, h); } }
  if (FX.flash > 0) { g.fillStyle = 'rgba(255,255,255,' + (FX.flash * .4) + ')'; g.fillRect(0, 0, w, h); FX.flash = Math.max(0, FX.flash - dt * 2.5); }
  if (out && !raining && (hr >= 19.5 || hr < 5.5)) {
    while (FX.ff.length < 22) FX.ff.push({ x:Math.random(), y:.2 + Math.random() * .7, p:Math.random() * 6.28, s:.4 + Math.random() * .6 });
    FX.ff.forEach(f => {
      f.x += Math.sin(now / 1500 * f.s + f.p) * dt * .05; f.y += Math.cos(now / 1900 * f.s + f.p) * dt * .04; f.x = (f.x + 1) % 1; f.y = Math.min(.95, Math.max(.1, f.y));
      const a = .35 + .55 * Math.abs(Math.sin(now / 500 + f.p));
      g.fillStyle = 'rgba(255,240,150,' + a * .25 + ')'; g.beginPath(); g.arc(f.x * w, f.y * h, 7, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,250,190,' + a + ')'; g.beginPath(); g.arc(f.x * w, f.y * h, 2, 0, 7); g.fill();
    });
  }
}


function makeTextures(sc) {
  const tex = (k, w, h, f) => { if (sc.textures.exists(k)) return; const g = sc.add.graphics(); f(g); g.generateTexture(k, w, h); g.destroy(); };
  const person = (g, hair, shirt, extra) => {
    g.fillStyle(hair); g.fillRect(6,0,20,8); g.fillRect(5,4,3,14); g.fillRect(24,4,3,14);
    g.fillStyle(0xffd9b8); g.fillRect(8,3,16,11); g.fillStyle(hair); g.fillRect(8,3,16,3);
    g.fillStyle(shirt); g.fillRect(6,14,20,18); g.fillStyle(0xffffff); g.fillRect(11,18,10,14);
    g.fillStyle(0x222222); g.fillRect(12,8,2,3); g.fillRect(19,8,2,3); g.fillStyle(0xff9aa8); g.fillRect(9,11,3,2); g.fillRect(21,11,3,2);
    if (extra) extra(g);
  };
  // một ngôi nhà nhỏ, ox = vị trí x bắt đầu (để ghép nhiều nhà vào 1 texture)
  const bld = (g, ox, w, wall, roof, roofLight) => {
    const h = 104, win = x => { g.fillStyle(0x6e3b17); g.fillRect(x,50,20,20); g.fillStyle(0x8fd3ff); g.fillRect(x+2,52,16,16); g.fillStyle(0x6e3b17); g.fillRect(x+9,52,2,16); g.fillRect(x+2,59,16,2); };
    g.fillStyle(0x000000, .18); g.fillEllipse(ox + w / 2, h - 5, w - 6, 10);
    g.fillStyle(wall); g.fillRect(ox + 6, 38, w - 12, h - 44);
    g.fillStyle(roof); g.fillTriangle(ox - 2, 44, ox + w / 2, 2, ox + w + 2, 44);
    g.fillStyle(roofLight); g.fillTriangle(ox + 5, 42, ox + w / 2, 9, ox + w - 5, 42);
    g.fillStyle(0x6b3a22); g.fillRect(ox + w / 2 - 12, h - 44, 24, 38);
    g.fillStyle(0xf2d28b); g.fillRect(ox + w / 2 - 10, h - 42, 20, 36);
    g.fillStyle(0x6b3a22); g.fillRect(ox + w / 2 + 5, h - 26, 3, 3);
    win(ox + 12); win(ox + w - 32);
  };

  tex('grass', 32, 32, g => { g.fillStyle(0x7cc062); g.fillRect(0,0,32,32); g.fillStyle(0x72b858); [[4,6],[20,3],[12,18],[26,24],[6,27]].forEach(p => g.fillRect(p[0],p[1],3,3)); g.fillStyle(0x92d374); [[14,8],[28,12],[2,20],[18,28]].forEach(p => g.fillRect(p[0],p[1],2,2)); });
  tex('momo', 32, 32, g => { g.fillStyle(0x7a3d0a); g.fillRect(3,7,26,24); g.fillTriangle(3,8,3,-1,13,8); g.fillTriangle(29,8,29,-1,19,8);
    g.fillStyle(0xff9a1f); g.fillRect(4,8,24,22); g.fillTriangle(4,8,4,1,12,8); g.fillTriangle(28,8,28,1,20,8);
    g.fillStyle(0xffb3a7); g.fillTriangle(6,8,6,4,10,8); g.fillTriangle(26,8,26,4,22,8);
    g.fillStyle(0xe27d10); g.fillRect(14,9,4,5); g.fillRect(4,18,4,3); g.fillRect(24,18,4,3);
    g.fillStyle(0xffffff); g.fillRect(10,21,12,9); g.fillStyle(0x222222); g.fillRect(9,13,4,5); g.fillRect(19,13,4,5);
    g.fillStyle(0xffffff); g.fillRect(10,13,1,1); g.fillRect(20,13,1,1); g.fillStyle(0xff6f91); g.fillRect(15,18,2,2); });
  tex('lily', 32, 32, g => person(g, 0x5a3a1a, 0xff69b4));
  tex('emma', 32, 32, g => person(g, 0x8a4b1a, 0x3b6fd8, h => { h.lineStyle(1, 0x222222); h.strokeRect(11,7,6,5); h.strokeRect(18,7,6,5); h.fillStyle(0xf2b632); h.fillRect(1,21,7,9); h.fillStyle(0xffffff); h.fillRect(2,22,5,1); }));
  tex('chef', 32, 32, g => person(g, 0xf5f5f5, 0xffffff, h => { h.fillStyle(0xd33a2c); h.fillRect(12,14,8,3); }));
  tex('ben', 32, 32, g => person(g, 0x2b2b2b, 0x3aa1a1));
  tex('rose', 32, 32, g => person(g, 0xdcdcdc, 0x9b59b6));
  tex('house', 96, 96, g => { g.fillStyle(0x000000, .18); g.fillEllipse(48,92,92,10);
    g.fillStyle(0x9c5a2e); g.fillRect(6,36,84,56); g.fillStyle(0x84491f); [44,52,60,68,76,84].forEach(y => g.fillRect(6,y,84,1));
    g.fillStyle(0x6e3b17); g.fillRect(66,6,12,24); g.fillStyle(0x8a1f17); g.fillTriangle(-2,42,48,0,98,42); g.fillStyle(0xb5382a); g.fillTriangle(4,40,48,6,92,40);
    g.fillStyle(0x6b3a22); g.fillRect(36,56,24,36); g.fillStyle(0xf2d28b); g.fillRect(38,58,20,34); g.fillStyle(0x6b3a22); g.fillRect(53,76,3,3);
    g.fillStyle(0x6e3b17); g.fillRect(10,46,20,20); g.fillStyle(0x8fd3ff); g.fillRect(12,48,16,16); g.fillStyle(0x6e3b17); g.fillRect(19,48,2,16); g.fillRect(12,55,16,2);
    g.fillStyle(0x6e3b17); g.fillRect(66,46,20,20); g.fillStyle(0x8fd3ff); g.fillRect(68,48,16,16); g.fillStyle(0x6e3b17); g.fillRect(75,48,2,16); g.fillRect(68,55,16,2); });
  tex('tree', 48, 64, g => { g.fillStyle(0x000000, .2); g.fillEllipse(24,60,36,10);
    g.fillStyle(0x6b4423); g.fillRect(19,38,10,24); g.fillStyle(0x56361a); g.fillRect(25,38,4,24);
    g.fillStyle(0x24692a); g.fillCircle(24,25,23); g.fillStyle(0x2e7d32); g.fillCircle(22,22,20); g.fillStyle(0x3a9440); g.fillCircle(16,18,11); g.fillStyle(0x56b255); g.fillCircle(14,14,5); });
  tex('soil', 56, 56, g => { g.fillStyle(0x8a5e34); g.fillRect(0,0,56,56); g.fillStyle(0x744a27); [10,24,38,50].forEach(y => g.fillRect(4,y,48,3)); g.lineStyle(2,0x4a3320); g.strokeRect(1,1,54,54); });
  tex('spark', 6, 6, g => { g.fillStyle(0xffffff); g.fillRect(0,0,6,6); });
  tex('shadow', 28, 10, g => { g.fillStyle(0x000000, .28); g.fillEllipse(14,5,26,8); });
  tex('flower', 8, 8, g => { g.fillStyle(0xffffff); g.fillRect(3,0,2,2); g.fillRect(0,3,2,2); g.fillRect(6,3,2,2); g.fillRect(3,6,2,2); g.fillStyle(0xffe066); g.fillRect(3,3,2,2); });
  tex('path', 32, 32, g => { g.fillStyle(0xd8b87a); g.fillRect(0,0,32,32); g.fillStyle(0xc4a263); [[4,5],[19,9],[9,22],[25,26]].forEach(p => g.fillRect(p[0],p[1],3,2)); });
  tex('pond', 160, 100, g => { g.fillStyle(0x2f6f9f); g.fillEllipse(80,50,158,98); g.fillStyle(0x4aa3d8); g.fillEllipse(80,50,144,84); g.fillStyle(0x8fd3ff); g.fillRect(40,34,22,3); g.fillRect(96,56,30,3); g.fillRect(62,70,16,3); });
  // --- thị trấn ---
  tex('shop', 112, 104, g => bld(g, 0, 112, 0xb98a5a, 0x2f7a3a, 0x4caf50));
  tex('homes', 192, 104, g => { bld(g, 0, 96, 0xe0c9a6, 0x2f5f9e, 0x4a7fc4); bld(g, 96, 96, 0xcfe0b0, 0x8a3f9a, 0xa75cb8); });
  tex('stall', 112, 96, g => {
    g.fillStyle(0x000000, .18); g.fillEllipse(56,91,104,10);
    g.fillStyle(0x6e3b17); g.fillRect(8,30,6,62); g.fillRect(98,30,6,62);
    g.fillStyle(0xf2d28b); g.fillRect(14,34,84,30);
    g.fillStyle(0x9c5a2e); g.fillRect(6,62,100,30); g.fillStyle(0x84491f); g.fillRect(6,62,100,4);
    g.fillStyle(0xd9a05b); g.fillEllipse(28,58,20,12); g.fillStyle(0x7cc062); g.fillCircle(56,57,8); g.fillStyle(0xb5382a); g.fillCircle(52,55,3); g.fillCircle(60,57,3);
    g.fillStyle(0x8a5a2b); g.fillRect(78,52,18,10); g.fillStyle(0xe8b04a); g.fillRect(80,50,14,4);
    for (let i = 0; i < 14; i++) { g.fillStyle(i % 2 ? 0xffffff : 0xd33a2c); g.fillRect(i * 8, 8, 8, 22); g.fillTriangle(i * 8, 30, i * 8 + 8, 30, i * 8 + 4, 37); }
  });
  // --- trong nhà + tiệm trang trí ---
  tex('decor', 112, 104, g => bld(g, 0, 112, 0xe8b4c8, 0x8a3f9a, 0xa75cb8));
  tex('mia', 32, 32, g => person(g, 0x7a3d8a, 0xf2b632, h => { h.fillStyle(0xff6f91); h.fillRect(6,0,20,3); }));
  tex('wood', 32, 32, g => { g.fillStyle(0xb9854f); g.fillRect(0,0,32,32); g.fillStyle(0xa8743f); g.fillRect(0,0,32,2); g.fillRect(0,16,32,2);
    g.fillStyle(0xc4935c); [[4,5],[20,9],[10,22],[24,26]].forEach(p => g.fillRect(p[0],p[1],6,1)); g.fillStyle(0x8f6234); g.fillRect(16,2,1,14); g.fillRect(6,18,1,14); });
  tex('wall', 32, 32, g => { g.fillStyle(0xe8d7b0); g.fillRect(0,0,32,32); g.fillStyle(0xdcc99b); g.fillRect(0,0,2,32); g.fillRect(16,0,2,32); g.fillStyle(0xefe2c3); g.fillRect(8,6,2,2); g.fillRect(24,20,2,2); });
  tex('bed', 96, 72, g => { g.fillStyle(0x000000, .18); g.fillEllipse(48,68,92,8);
    g.fillStyle(0x6e3b17); g.fillRect(2,4,92,62); g.fillStyle(0xffffff); g.fillRect(6,8,84,54);
    g.fillStyle(0xfff3d6); g.fillRect(10,12,24,18); g.fillRect(10,40,24,18);
    g.fillStyle(0x4a7fc4); g.fillRect(38,8,52,54); g.fillStyle(0x6a9fe0); g.fillRect(38,28,52,6); });
  tex('rug', 200, 110, g => { g.fillStyle(0x8a2b2b); g.fillEllipse(100,55,196,106); g.fillStyle(0xb5382a); g.fillEllipse(100,55,176,86); g.fillStyle(0xf2d28b); g.fillEllipse(100,55,120,52); });
  tex('hai', 32, 32, g => person(g, 0x2b2b2b, 0x1f6fa8, h => { h.fillStyle(0xf2f2f2); h.fillRect(5,0,22,5); h.fillStyle(0x1f6fa8); h.fillRect(8,5,16,2); }));
  tex('moss', 32, 32, g => person(g, 0xeeeeee, 0x2e7d32, h => { h.fillStyle(0x5b2c83); h.fillRect(6,0,20,4); h.fillRect(11,-0,10,2); h.fillStyle(0xeeeeee); h.fillRect(10,16,12,8); }));
  tex('water', 64, 64, g => { g.fillStyle(0x2f78a8); g.fillRect(0,0,64,64); g.fillStyle(0x3a8bc0); [[6,10],[38,6],[22,30],[50,40],[10,50]].forEach(p => g.fillRect(p[0],p[1],14,3));
    g.fillStyle(0x7cc4ea); [[12,18],[44,26],[28,44],[4,34],[54,58]].forEach(p => g.fillRect(p[0],p[1],8,2)); });
  tex('fountain', 64, 64, g => { g.fillStyle(0x000000, .2); g.fillEllipse(32,54,58,10);
    g.fillStyle(0x9aa0a6); g.fillCircle(32,38,26); g.fillStyle(0x4aa3d8); g.fillCircle(32,38,20); g.fillStyle(0x8fd3ff); g.fillCircle(32,38,9);
    g.fillStyle(0x9aa0a6); g.fillRect(29,12,6,26); g.fillStyle(0xcfe9ff); g.fillCircle(32,10,5); g.fillRect(24,18,2,6); g.fillRect(38,18,2,6); });

  // --- MỚI: vật nuôi (pixel art), thùng bán hàng, cối xay gió, đồi, vườn, cầu… ---
  Object.keys(ANI_PX).forEach(k => { if (!sc.textures.exists('a_' + k)) sc.textures.addCanvas('a_' + k, pxCanvas(ANI_PX[k].rows, ANI_PX[k].pal, 2)); });
  tex('daisy', 32, 32, g => person(g, 0xf2c14e, 0x66bb6a, h => { h.fillStyle(0xff6f91); h.fillRect(6,0,20,4); h.fillRect(9,-1,5,3); h.fillStyle(0xffffff); h.fillRect(16,1,4,2); }));
  tex('pete', 32, 32, g => person(g, 0x6b4a2b, 0xd9822b, h => { h.fillStyle(0xf3e7c9); h.fillRect(5,0,22,5); h.fillRect(9,-1,14,2); h.fillStyle(0x8a5a2b); h.fillRect(5,4,22,2); }));
  tex('thief', 32, 32, g => person(g, 0x151515, 0x2b2b3a, h => {
    h.fillStyle(0x151515); h.fillRect(5,0,22,8); h.fillRect(5,0,4,17); h.fillRect(23,0,4,17); h.fillRect(9,11,14,5);
    h.fillStyle(0xffffff); h.fillRect(12,8,3,2); h.fillRect(19,8,3,2);
    h.fillStyle(0xdddddd); [18,22,26,30].forEach(y => h.fillRect(7,y,18,2)); }));
  tex('bin', 48, 40, g => { g.fillStyle(0x000000, .2); g.fillEllipse(24,37,44,7);
    g.fillStyle(0x6e3b17); g.fillRect(3,14,42,24); g.fillStyle(0x9c5a2e); g.fillRect(5,16,38,20);
    g.fillStyle(0x84491f); [22,28,34].forEach(y => g.fillRect(5,y,38,2));
    g.fillStyle(0x5a2f12); g.fillRect(1,8,46,8); g.fillStyle(0x7a4420); g.fillRect(3,9,42,5);
    g.fillStyle(0xf2b632); g.fillCircle(24,26,6); g.fillStyle(0xffe08a); g.fillCircle(24,26,3.5); g.fillStyle(0xf2b632); g.fillRect(23,23,2,6); });
  tex('windmill', 112, 144, g => { g.fillStyle(0x000000, .2); g.fillEllipse(56,140,96,10);
    g.fillStyle(0xe8d7b0); g.fillTriangle(26,138,86,138,38,50); g.fillTriangle(86,138,74,50,38,50);
    g.fillStyle(0xd2bf94); g.fillTriangle(70,138,86,138,74,50); g.fillTriangle(70,138,74,50,64,50);
    g.fillStyle(0xc4b07e); [72,92,112].forEach(y => g.fillRect(38 - (y - 50) * .12, y, 38 + (y - 50) * .24, 2));
    g.fillStyle(0x8a2a1f); g.fillTriangle(28,54,56,14,84,54); g.fillStyle(0xb5382a); g.fillTriangle(34,52,56,20,78,52);
    g.fillStyle(0x6b3a22); g.fillRect(47,110,18,28); g.fillStyle(0xf2d28b); g.fillRect(49,112,14,26);
    g.fillStyle(0x6e3b17); g.fillRect(49,74,14,14); g.fillStyle(0x8fd3ff); g.fillRect(51,76,10,10); g.fillStyle(0x6e3b17); g.fillRect(55,76,2,10); });
  tex('blades', 100, 100, g => { g.fillStyle(0xf3e7c9);
    g.fillRect(54,6,22,36); g.fillRect(58,54,36,22); g.fillRect(24,58,22,36); g.fillRect(6,24,36,22);
    g.fillStyle(0xd9c79a); [14,22,30].forEach(o => { g.fillRect(54,6 + o - 6,22,2); g.fillRect(58 + 36 - o - 4,54,2,22); g.fillRect(24,58 + 36 - o - 4,22,2); g.fillRect(6 + o - 6,24,2,22); });
    g.fillStyle(0x6b3a22); g.fillRect(46,2,8,96); g.fillRect(2,46,96,8); g.fillStyle(0x4a2a14); g.fillCircle(50,50,7); });
  tex('gazebo', 120, 112, g => { g.fillStyle(0x000000, .2); g.fillEllipse(60,104,112,12);
    g.fillStyle(0xcaa46a); g.fillRect(8,84,104,18); g.fillStyle(0xb48e56); g.fillRect(8,98,104,4);
    g.fillStyle(0x8a5a2e); g.fillRect(14,44,8,46); g.fillRect(98,44,8,46); g.fillRect(56,44,8,46);
    g.fillStyle(0x6b3a22); g.fillRect(14,44,3,46); g.fillRect(98,44,3,46); g.fillRect(56,44,3,46);
    g.fillStyle(0x8a2a1f); g.fillRect(6,42,108,8); g.fillStyle(0x8a2a1f); g.fillTriangle(0,46,60,4,120,46);
    g.fillStyle(0xb5382a); g.fillTriangle(8,44,60,10,112,44); g.fillStyle(0xd0503e); g.fillTriangle(20,42,60,16,60,42); });
  tex('bench', 44, 26, g => { g.fillStyle(0x000000, .18); g.fillEllipse(22,24,40,5);
    g.fillStyle(0x84491f); g.fillRect(2,0,40,6); g.fillStyle(0x9c5a2e); g.fillRect(2,8,40,8); g.fillStyle(0x5a2f12); g.fillRect(5,16,4,8); g.fillRect(35,16,4,8); });
  tex('lamp', 16, 56, g => { g.fillStyle(0x000000, .2); g.fillEllipse(8,54,14,4);
    g.fillStyle(0x3a3a3a); g.fillRect(7,14,2,40); g.fillRect(4,50,8,4); g.fillRect(2,2,12,3); g.fillRect(2,16,12,3); g.fillRect(2,2,2,16); g.fillRect(12,2,2,16);
    g.fillStyle(0xffd27a); g.fillRect(4,5,8,11); g.fillStyle(0xfff0b0); g.fillRect(6,7,3,5); });
  tex('telescope', 40, 48, g => { g.fillStyle(0x000000, .2); g.fillEllipse(20,46,34,6);
    g.lineStyle(3, 0x4a3320); g.lineBetween(20,28,8,46); g.lineBetween(20,28,32,46); g.lineBetween(20,28,20,46);
    g.fillStyle(0x2f5f9e); g.fillTriangle(6,24,10,16,34,6); g.fillTriangle(6,24,34,6,32,14); g.fillStyle(0xd4a62a); g.fillRect(14,15,4,10); g.fillRect(26,8,3,9);
    g.fillStyle(0x8fd3ff); g.fillCircle(34,9,3); g.fillStyle(0x222222); g.fillCircle(8,22,3); });
  tex('cliff', 32, 56, g => { g.fillStyle(0x8a6a4a); g.fillRect(0,0,32,56);
    g.fillStyle(0x6aa84f); g.fillRect(0,0,32,7); g.fillStyle(0x4d8738); g.fillRect(0,6,32,2);
    g.fillStyle(0x7a5c3e); [[0,12,14,14],[16,20,16,12],[4,34,12,12],[18,40,14,10]].forEach(r => g.fillRect(r[0],r[1],r[2],r[3]));
    g.fillStyle(0x9a7a56); [[2,10,10,3],[18,18,12,3],[6,32,8,3],[20,38,10,3]].forEach(r => g.fillRect(r[0],r[1],r[2],r[3]));
    g.fillStyle(0x5a4630); g.fillRect(0,48,32,8); g.fillRect(15,26,2,8); g.fillRect(8,14,2,6); });
  tex('hedge', 32, 32, g => { g.fillStyle(0x2e7d32); g.fillRect(0,0,32,32); g.fillStyle(0x3fa04a); [[2,3],[12,6],[22,2],[6,14],[18,16],[26,10],[10,24],[24,26]].forEach(p => g.fillRect(p[0],p[1],6,5));
    g.fillStyle(0x1f5f26); [[8,10],[20,8],[2,22],[16,28],[28,20]].forEach(p => g.fillRect(p[0],p[1],5,4)); g.fillStyle(0x56bb5c); g.fillRect(0,0,32,2); });
  tex('sand', 32, 32, g => { g.fillStyle(0xe8d7a0); g.fillRect(0,0,32,32); g.fillStyle(0xd8c68a); [[4,5],[19,9],[9,22],[25,26],[14,14]].forEach(p => g.fillRect(p[0],p[1],3,2)); });
}

// ====== CẢNH CƠ SỞ: di chuyển, thời gian, tương tác dùng chung ======
const activeScene = () => game.scene.getScenes(true)[0];
class Base extends Phaser.Scene {
  init(data) { this.from = data && data.from; this.leaving = false; this.target = null; }

  boot(W, H, px, py) {
    makeTextures(this);
    this.W = W; this.H = H;
    this.physics.world.setBounds(0, 0, W, H);
    this.add.tileSprite(0, 0, W, H, 'grass').setOrigin(0).setDepth(-1);
    this.solids = this.physics.add.staticGroup();
    this.player = this.physics.add.sprite(px, py, 'hero', 0).setOrigin(.5, .78).setCollideWorldBounds(true);
    this.player.body.setSize(16, 12).setOffset(12, 40); // chỉ va chạm ở bàn chân
    this.face = 'down';
    this.shadow = this.add.image(0, 0, 'shadow').setDepth(.5);
    this.night = this.add.rectangle(-4000, -4000, 12000, 12000, 0x0a1445, 0).setOrigin(0).setScrollFactor(0).setDepth(2000);
    const cam = this.cameras.main;
    cam.setBackgroundColor('#1d2b19').startFollow(this.player, false, .12, .12).setBounds(0, 0, W, H);
    // khung game co giãn theo cửa sổ (không còn viền xanh); zoom tự chỉnh theo kích thước
    const fit = () => cam.setZoom(Math.max(1, Math.min(this.scale.height / 432, this.scale.width / 640)));
    fit(); this.scale.on('resize', fit); this.events.once('shutdown', () => this.scale.off('resize', fit));
    // tiếng chim ban ngày / dế ban đêm
    this.time.addEvent({ delay:4200, loop:true, callback: () => { if (open || !AU.on || this.scene.key === 'Home' || Math.random() < .4) return; snd(clk >= 1080 || clk < 360 ? 'cricket' : 'bird'); } });
    this.cameras.main.fadeIn(350);
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = this.input.keyboard.addKeys({ up:K.W, down:K.S, left:K.A, right:K.D, u2:K.UP, d2:K.DOWN, l2:K.LEFT, r2:K.RIGHT, e:K.E, sp:K.SPACE });
    this.input.on('pointerdown', p => { if (!open && !this.leaving) this.target = { x:p.worldX, y:p.worldY }; });
    this.hintText = '';
    this.mm = { r:[], n:[], exits:[] }; this.roadCells = null; this._trees = null;
    this.animals = [];
    if (this.scene.key !== 'Home') { // chú chó Biscuit đi theo bạn
      this.dogSh = this.add.image(px - 28, py + 8, 'shadow').setDepth(.5).setScale(.7);
      this.dog = this.add.image(px - 28, py + 8, 'a_dog').setOrigin(.5, 1).setDepth(py);
    } else { this.dog = null; }
  }


  // nhân vật đứng yên có va chạm + bóng + nhãn tên
  npc(key, x, y, name) {
    const s = this.physics.add.sprite(x, y, key).setImmovable(true).setDepth(y), hh = s.height;
    if (hh > 40) s.body.setSize(22, 16).setOffset((s.width - 22) / 2, hh - 18); // chỉ va chạm ở chân
    this.add.image(x, y + hh / 2 - (hh > 40 ? 5 : 0), 'shadow').setDepth(.5);
    if (name) this.add.text(x, y - hh / 2 - 14, name, { fontSize:'14px', color:'#fff', backgroundColor:'#00000088', padding:{ x:4, y:1 } }).setOrigin(.5).setDepth(1500);
    this.physics.add.collider(this.player, s);
    this.mm.n.push(s);
    return s;
  }

  // vật cản hình chữ nhật (toạ độ góc trên-trái)
  block(x, y, w, h) { const z = this.add.zone(x + w / 2, y + h / 2, w, h); this.physics.add.existing(z, true); this.physics.add.collider(this.player, z); return z; }

  // ---- vật nuôi đi lang thang trong khung rect = [x, y, w, h]; ex = các khung cấm ----
  addAnimal(kind, x, y, rect, ex) {
    const d = ANIMALS[kind], n = this.animals.length;
    const sh = this.add.image(x, y, 'shadow').setDepth(.5).setScale(d.sh || 1);
    if (!d.sh) sh.setVisible(false);
    const s = this.add.image(x, y, 'a_' + kind).setOrigin(.5, 1).setDepth(y);
    const a = { id:this.scene.key + kind + n, kind, s, sh, x, y, rect, ex:ex || [], vx:0, vy:0, t:Math.random() * 1500, sp:d.sp || 20 };
    for (let i = 0; i < 40 && this.animalBlocked(a, a.x, a.y); i++) { a.x = rect[0] + 10 + Math.random() * (rect[2] - 20); a.y = rect[1] + 10 + Math.random() * (rect[3] - 20); }
    this.animals.push(a); return a;
  }
  animalBlocked(a, x, y) {
    const r = a.rect;
    if (x < r[0] || x > r[0] + r[2] || y < r[1] || y > r[1] + r[3]) return true;
    if (a.ex.some(e => x > e[0] && x < e[0] + e[2] && y > e[1] && y < e[1] + e[3])) return true;
    return this.solids.getChildren().some(o => Math.abs(o.x - x) < o.width / 2 + 8 && y > o.y - o.height / 2 - 4 && y < o.y + o.height / 2 + 8);
  }
  tickAnimals(time, delta) {
    this.animals.forEach(a => {
      const d = ANIMALS[a.kind];
      a.t -= delta;
      if (a.t <= 0) {
        if (Math.random() < .4) { a.vx = a.vy = 0; a.t = 700 + Math.random() * 2200; }
        else { const ang = Math.random() * 6.283; a.vx = Math.cos(ang) * a.sp; a.vy = Math.sin(ang) * a.sp * .55; a.t = 600 + Math.random() * 1600; }
      }
      let hop = 0;
      if (a.vx || a.vy) {
        const nx = a.x + a.vx * delta / 1000, ny = a.y + a.vy * delta / 1000;
        if (this.animalBlocked(a, nx, ny)) { a.vx = a.vy = 0; a.t = 150 + Math.random() * 400; }
        else { a.x = nx; a.y = ny; if (Math.abs(a.vx) > 1) a.s.setFlipX(a.vx < 0); hop = Math.abs(Math.sin(time / 110 + a.x)) * (d.hop || 1); }
      }
      a.s.setPosition(a.x, a.y - hop).setDepth(a.y); a.sh.setPosition(a.x, a.y - 1);
    });
  }
  animalAt() {
    let best = null, d = 54;
    this.animals.forEach(a => { const dd = Phaser.Math.Distance.Between(this.player.x, this.player.y, a.x, a.y - 6); if (dd < d) { d = dd; best = a; } });
    return best;
  }
  // chú chó Biscuit đi theo người chơi
  followDog(delta) {
    const d = this.dog; if (!d) return;
    const p = this.player, tx = p.x - 28, ty = p.y + 4, dx = tx - d.x, dy = ty - d.y, dist = Math.hypot(dx, dy);
    if (dist > 34) { const v = Math.min(dist * 3, 160) * delta / 1000; d.x += dx / dist * v; d.y += dy / dist * v; if (Math.abs(dx) > 2) d.setFlipX(dx < 0); }
    d.setDepth(d.y); this.dogSh.setPosition(d.x, d.y - 1);
  }

  go(key) {
    if (this.leaving) return;
    this.leaving = true; this.target = null; this.player.setVelocity(0); snd('door');
    const cam = this.cameras.main; cam.fadeOut(300);
    cam.once('camerafadeoutcomplete', () => this.scene.start(key, { from:this.scene.key }));
  }

  // trả về false khi đang mở hộp thoại / đang chuyển cảnh
  move(time, delta) {
    const k = this.keys;
    if (open || this.leaving) { this.player.setVelocity(0); return false; }
    const L = k.left.isDown || k.l2.isDown, R = k.right.isDown || k.r2.isDown, U = k.up.isDown || k.u2.isDown, D = k.down.isDown || k.d2.isDown;
    let vx = (R ? 1 : 0) - (L ? 1 : 0), vy = (D ? 1 : 0) - (U ? 1 : 0);
    if (vx || vy) this.target = null;
    else if (this.target) {
      const dx = this.target.x - this.player.x, dy = this.target.y - this.player.y;
      if (Math.hypot(dx, dy) > 8) { vx = dx; vy = dy; } else this.target = null;
    }
    // tăng / giảm tốc mượt thay vì đổi vận tốc tức thì
    const len = Math.hypot(vx, vy), b = this.player.body, ease = Math.min(1, delta * .016);
    const tx = len ? vx / len * SPEED : 0, ty = len ? vy / len * SPEED : 0;
    const sm = (cur, to) => Math.abs(to - cur) < 4 ? to : cur + (to - cur) * ease;
    b.setVelocity(sm(b.velocity.x, tx), sm(b.velocity.y, ty));

    clk = Math.min(clk + delta * TIME_SPEED, 1500);
    const wxn = wxNow(), dim = wxn === 'rain' ? .16 : wxn === 'cloud' ? .06 : 0;
    this.night.setAlpha(Math.min(.62, dark(clk / 60) + dim));
    const tick = Math.floor(clk / 10); if (tick !== this.tick) { this.tick = tick; dayText(); }
    // mưa bắt đầu: cây đã gieo được tưới tự nhiên
    if (wxn === 'rain' && S.rainDay !== S.day) {
      S.rainDay = S.day; S.plots.forEach(p => { if (p.s === 2) p.w = true; });
      if (this.pv) this.pv.forEach((v, i) => this.paint(i));
      toast('🌧️ Trời mưa rồi! Cây trồng được tưới nước miễn phí 💧'); snd('thunder'); save();
    }
    // cảnh báo giờ ngủ: trước 24:00, không thì bị móc túi
    if (clk >= 1320 && warn < 1) { warn = 1; toast('🌙 22:00 — hãy về nhà đi ngủ trước 24:00, kẻo bị kẻ gian móc túi!'); }
    else if (clk >= 1380 && warn < 2) { warn = 2; toast('⚠️ 23:00 rồi! Còn 1 tiếng nữa là nửa đêm!'); snd('error'); }
    else if (clk >= 1410 && warn < 3) { warn = 3; toast('🚨 23:30! Chạy về nhà ngủ ngay!'); snd('error'); }
    if (clk >= 1440 && !robbed) { robbed = true; this.player.setVelocity(0); robbery(); return false; }
    const moving = !!(vx || vy);
    this.stepT = moving ? (this.stepT || 0) + delta : 220;
    if (this.stepT > 300) { this.stepT = 0; snd(this.scene.key === 'Home' ? 'wood' : 'step'); }
    this.player.setDepth(this.player.y);
    this.animate(vx, vy, moving);
    this.shadow.setPosition(this.player.x, this.player.y + 10);
    return true;
  }

  // hoạt ảnh đi bộ: xuống / lên / ngang (đi trái = lật ảnh đi phải)
  animate(vx, vy, moving) {
    const p = this.player;
    if (moving) {
      if (Math.abs(vx) > Math.abs(vy)) { this.face = 'side'; p.setFlipX(vx > 0); }
      else this.face = vy > 0 ? 'down' : 'up';
    }
    if (this.face !== 'side') p.setFlipX(false);
    if (moving) p.anims.play('walk-' + this.face, true);
    else { p.anims.stop(); p.setFrame({ down:0, up:4, side:8 }[this.face]); }
  }

  // nền: cỏ ngẫu nhiên + đường đất tự ghép góc / ngã ba / ngã tư theo các ô lân cận (ô 64px)
  rng(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }
  paintGround(cells, solid) {
    // Nền được "nướng" thành 1 ảnh duy nhất (hết vạch kẻ ô khi zoom). Cỏ vẽ ô 32px (nhỏ bằng nửa trước), đường đất giữ ô 64px.
    const T = 64, S2 = 32, rnd = this.rng(5), has = (x, y) => cells.has(x + ',' + y);
    const cw = Math.ceil(this.W / T), ch = Math.ceil(this.H / T);
    this.roadCells = cells;
    const rt = this.add.renderTexture(0, 0, cw * T, ch * T).setOrigin(0).setDepth(-.5);
    rt.fill(0x6a9f46);
    for (let cy = 0; cy < ch; cy++) for (let cx = 0; cx < cw; cx++) {
      if (has(cx, cy)) {
        const n = has(cx, cy - 1), e = has(cx + 1, cy), so = has(cx, cy + 1), w = has(cx - 1, cy);
        const full = n && e && so && w && has(cx - 1, cy - 1) && has(cx + 1, cy - 1) && has(cx - 1, cy + 1) && has(cx + 1, cy + 1);
        const f = full || (solid && solid.has(cx + ',' + cy)) ? 22 : 6 + ((n ? 1 : 0) | (e ? 2 : 0) | (so ? 4 : 0) | (w ? 8 : 0)); // 6..21: 16 kiểu đường, 22: đất đặc
        rt.drawFrame('tiles', f, cx * T, cy * T);
      } else for (let sy = 0; sy < 2; sy++) for (let sx = 0; sx < 2; sx++) rt.drawFrame('grassS', 'g' + Math.floor(rnd() * 6), cx * T + sx * S2, cy * T + sy * S2);
    }
  }
  // rải bụi cỏ / bụi hoa trang trí (ok(x,y) = chỗ được phép đặt)
  scatter(n, seed, ok) {
    const rnd = this.rng(seed);
    for (let k = 0, tries = 0; k < n && tries < n * 40; tries++) {
      const x = 30 + rnd() * (this.W - 60), y = 50 + rnd() * (this.H - 70);
      if (!ok(x, y)) continue;
      // không đặt bụi đè lên cây / nhà (hết lỗi bụi hoa chồng lên tán cây)
      if (this.solids.getChildren().some(o => Math.abs(o.x - x) < o.width / 2 + 24 && y > o.y - o.height / 2 - 4 && y - 40 < o.y + o.height / 2)) continue;
      const PR = { Farm:['n_sun', 'n_hay', 'n_pumpkin', 'n_flowers', 'n_rock'], Town:['n_flowers', 'n_sun', 'n_rocks', 'n_rbush'], Forest:['n_mush', 'n_fern', 'n_log', 'n_stump', 'n_rocks', 'n_bamboo'], Lake:['n_cattail', 'n_reed', 'n_rocks', 'n_rock'] }[this.scene.key];
      const pk = PR && rnd() < .45 ? PR[Math.floor(rnd() * PR.length)] : null; // ~45% là đồ trang trí pixel-art, còn lại là bụi cũ
      this.add.image(x, y, pk && this.textures.exists(pk) ? pk : (k % 3 === 2 ? 'bushF' : 'bushG')).setOrigin(.5, 1).setDepth(y); k++;
    }
  }

  interact() {
    let c = this.look();
    if (!c || c.t === 'fish' || c.t === 'river') { const a = this.animalAt(); if (a) c = { t:'animal', a }; }
    this.cur = c;
    const an = c && c.t === 'animal' ? ANIMALS[c.a.kind] : null;
    const t = an ? `E: chơi với ${an.e} ${an.en} (${an.vi}) — học 1 câu mới` : this.label(c);
    if (t !== this.hintText) { this.hintText = t; $('#hint').textContent = t; }
    const k = this.keys, J = Phaser.Input.Keyboard.JustDown;
    if (J(k.e) || J(k.sp)) this.act();
  }

  act() { if (!open && !this.leaving && this.cur) { if (this.cur.t === 'animal') petAnimal(this.cur.a); else this.doAct(this.cur); } }

  // bản đồ nhỏ (góc phải trên): đường, công trình, cây, NPC, lối ra và vị trí người chơi
  drawMini(time) {
    const cv = $('#minimap'); if (!cv) return;
    const hide = this.scene.key === 'Home'; if (cv.hidden !== hide) cv.hidden = hide; if (hide) return;
    if (time - (this._mmT || 0) < 90) return; this._mmT = time;
    const big = MM.big, w = big ? 300 : 176, h = big ? 232 : 138;
    if (cv.width !== w) { cv.width = w; cv.height = h; }
    const g = cv.getContext('2d'), sc = Math.min((w - 8) / this.W, (h - 26) / this.H), ox = (w - this.W * sc) / 2, oy = 4, X = v => ox + v * sc, Y = v => oy + v * sc;
    g.clearRect(0, 0, w, h);
    g.fillStyle = '#5c8f3e'; g.fillRect(X(0), Y(0), this.W * sc, this.H * sc);
    if (this.roadCells) { g.fillStyle = '#d8b87a'; this.roadCells.forEach(k => { const p = k.split(','); g.fillRect(X(p[0] * 64), Y(p[1] * 64), 64 * sc + .6, 64 * sc + .6); }); }
    this.mm.r.forEach(r => { g.fillStyle = r[4] || '#b5651d'; g.fillRect(X(r[0]), Y(r[1]), Math.max(2, r[2] * sc), Math.max(2, r[3] * sc)); });
    if (!this._trees) this._trees = this.solids.getChildren().filter(o => o.texture && /^(tree|pine|blossom)$/.test(o.texture.key));
    g.fillStyle = '#2e6b32'; this._trees.forEach(t => g.fillRect(X(t.x) - 1, Y(t.y) - 2, 3, 3));
    if (this.mm.spots) { g.fillStyle = '#ffd54a'; this.mm.spots.forEach((p, i) => { if (!S.foraged.includes(i)) g.fillRect(X(p.x) - 1.5, Y(p.y) - 1.5, 3, 3); }); }
    g.fillStyle = '#7fe3ff'; this.mm.exits.forEach(e => g.fillRect(X(e[0]), Y(e[1]), Math.max(3, e[2] * sc), Math.max(3, e[3] * sc)));
    g.fillStyle = '#ffe36b'; this.mm.n.forEach(n => { g.beginPath(); g.arc(X(n.x), Y(n.y), 2.2, 0, 7); g.fill(); });
    g.fillStyle = Math.floor(time / 350) % 2 ? '#ff3b30' : '#fff'; g.beginPath(); g.arc(X(this.player.x), Y(this.player.y), 3.2, 0, 7); g.fill();
    g.strokeStyle = '#2a1d10'; g.lineWidth = 1; g.strokeRect(X(0), Y(0), this.W * sc, this.H * sc);
    g.fillStyle = '#f3e7c9'; g.font = '11px sans-serif'; g.fillText(SCENE_NAME[this.scene.key] + '  (M)', 6, h - 5);
  }

  update(time, delta) {
    if (!this.move(time, delta)) return;
    this.edge();
    this.interact();
    this.tickAnimals(time, delta); this.followDog(delta);
    this.drawMini(time);
  }
}

// ====== CẢNH 0: NẠP SPRITE (từ assets.js) ======
const IMG = {};
class Boot extends Phaser.Scene {
  constructor() { super('Boot'); }
  create() {
    const T = this.textures, M = window.ASSET_META;
    T.addSpriteSheet('tiles', IMG.tiles, { frameWidth:M.tile, frameHeight:M.tile });          // 0-5 cỏ · 6-21 đường (theo bitmask N=1 E=2 S=4 W=8) · 22 đất đặc
    T.addSpriteSheet('crops', IMG.crops, { frameWidth:M.cropCell, frameHeight:M.cropCell });   // mỗi cây 3 khung: cây con / đang lớn / chín
    T.addSpriteSheet('hero',  IMG.hero,  { frameWidth:M.hero[0], frameHeight:M.hero[1] });     // hàng 1 đi xuống · hàng 2 đi lên · hàng 3 đi ngang
    // cỏ thu nhỏ còn 32px (6 kiểu) để cỏ không còn "quá bự"
    { const cv = document.createElement('canvas'); cv.width = 32 * 6; cv.height = 32;
      const cx = cv.getContext('2d'); cx.imageSmoothingEnabled = true; cx.imageSmoothingQuality = 'high';
      for (let i = 0; i < 6; i++) cx.drawImage(IMG.tiles, i * 64, 0, 64, 64, i * 32, 0, 32, 32);
      const ct = T.addCanvas('grassS', cv); for (let i = 0; i < 6; i++) ct.add('g' + i, 0, i * 32, 0, 32, 32); }
    Object.keys(window.ASSETS.bld || {}).forEach(k => { if (IMG['b_' + k]) T.addImage('b_' + k, IMG['b_' + k]); }); // công trình pixel-art
    // sprite trùng tên texture vẽ-bằng-code → thay thế luôn (makeTextures bỏ qua key đã có)
    Object.keys(SPR).forEach(k => { if (IMG['s_' + k] && !/^(ui|it)_/.test(k) && !T.exists(k)) T.addImage(k, IMG['s_' + k]); });
    T.addImage('shopimg', IMG.shop); T.addImage('bushG', IMG.bushG); T.addImage('bushF', IMG.bushF);
    [['down', 0], ['up', 4], ['side', 8]].forEach(([k, st]) => this.anims.create({
      key:'walk-' + k, frames:this.anims.generateFrameNumbers('hero', { start:st, end:st + 3 }), frameRate:10, repeat:-1 }));
    this.scene.start('Farm');
  }
}

// ====== CẢNH 1: NÔNG TRẠI ======
class Farm extends Base {
  constructor() { super('Farm'); }

  create() {
    const W = 1280, H = 960;
    const sp = this.from === 'Town' ? [1200, 600] : this.from === 'Forest' ? [610, 70] : this.from === 'Lake' ? [610, 890] : this.from === 'Home' ? [200, 292] : [420, 340];
    this.boot(W, H, sp[0], sp[1]);
    this.house = this.add.image(200, 236, 'b_home').setOrigin(.5, 1).setDepth(236); // nhà người chơi (sprite)
    { const z = this.add.zone(200, 211, 150, 50); this.physics.add.existing(z, true); this.house.zone = z; }
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 45; i++) {
      const x = 40 + rnd() * (W - 80), y = 40 + rnd() * (H - 80);
      if ((x > 80 && x < 900 && y > 60 && y < 520) || (x > 880 && x < 1140 && y > 680 && y < 840)) continue; // chừa khu nông trại
      if (x > 150 && y > 530 && y < 690) continue; // chừa con đường nhà → thị trấn
      if (x > 500 && x < 780 && (y < 150 || y > H - 150)) continue; // chừa lối lên Rừng / xuống Hồ
      this.solids.create(x, y, Math.random() < .18 ? 'blossom' : 'tree');
    }
    this.binObj = this.solids.create(430, 440, 'bin'); // thùng bán hàng
    this.mailObj = this.solids.create(120, 300, 'mailbox'); // hộp thư (thư tiếng Anh mỗi ngày)
    this.solids.refresh();
    this.solids.children.each(t => t.setDepth(t.y + t.height / 2 - 4)); // sắp lớp theo chân cây / nhà
    // đường đất (ô 64px): nhà → xuống dưới → sang thị trấn (phải) + nhánh rẽ ra ruộng
    const cells = new Set(), road = (x0, y0, x1, y1) => { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) cells.add(x + ',' + y); };
    road(3, 3, 3, 9); road(3, 9, 19, 9); road(4, 5, 6, 5); road(9, 0, 9, 2); road(9, 12, 9, 14);
    this.paintGround(cells);
    const near = (x, y) => cells.has(Math.floor(x / 64) + ',' + Math.floor(y / 64));
    this.scatter(34, 21, (x, y) => !near(x, y) && !near(x + 24, y) && !near(x - 24, y) && !near(x, y - 20)
      && !(x > 440 && x < 880 && y > 250 && y < 520) && !(x < 320 && y < 270) && !(x > 900 && y > 690 && y < 830));
    const pond = this.add.image(1010, 760, 'pond').setDepth(.3);
    this.tweens.add({ targets: pond, alpha: .82, yoyo: true, repeat: -1, duration: 1700, ease: 'Sine.InOut' });

    // biển chỉ đường + mũi tên nhấp nháy ở cổng thị trấn
    this.add.text(1195, 548, '🏘️ Thị trấn', { fontSize:'15px', color:'#fff', backgroundColor:'#4a3320', padding:{ x:6, y:2 } }).setOrigin(.5).setDepth(1500);
    const arrow = this.add.text(1262, 600, '➜', { fontSize:'26px', color:'#fff', stroke:'#2a1d10', strokeThickness:4 }).setOrigin(.5).setDepth(1500);
    this.tweens.add({ targets: arrow, x: 1250, yoyo: true, repeat: -1, duration: 500 });

    const sgn = (x, y, t) => this.add.text(x, y, t, { fontSize:'15px', color:'#fff', backgroundColor:'#4a3320', padding:{ x:6, y:2 } }).setOrigin(.5).setDepth(1500);
    sgn(640, 38, '🌲 Rừng Sương ↑'); sgn(640, 926, '🎣 Hồ Trăng ↓');
    this.mm.r.push([105, 73, 190, 163], [488, 268, 320, 192, '#8a5e34'], [930, 710, 160, 100, '#4aa3d8']);
    this.mm.exits.push([this.W - 8, 540, 8, 130], [500, 0, 280, 8], [500, this.H - 8, 280, 8]);
    this.emma = this.npc('emma', 340, 250, 'Emma 🎓 English');
    this.physics.add.collider(this.player, this.solids);
    this.physics.add.collider(this.player, this.house.zone);
    this.add.text(430, 408, '📦 Thùng bán hàng', { fontSize:'14px', color:'#fff', backgroundColor:'#4a3320', padding:{ x:6, y:2 } }).setOrigin(.5).setDepth(1500);
    this.mm.r.push([406, 420, 48, 40, '#9c5a2e']);
    for (let i = 0; i < 3; i++) this.addAnimal('chicken', 130 + i * 70, 440, [90, 380, 300, 130]);
    for (let i = 0; i < 2; i++) this.addAnimal('cow', 940 + i * 90, 430, [900, 360, 250, 190]);
    for (let i = 0; i < 2; i++) this.addAnimal('sheep', 1000 + i * 80, 500, [900, 360, 250, 190]);
    for (let i = 0; i < 2; i++) this.addAnimal('duck', 990 + i * 40, 760, [950, 738, 120, 46]);

    // 15 ô đất (5 x 3)
    this.pv = S.plots.map((p, i) => {
      const x = 520 + (i % 5) * 64, y = 300 + Math.floor(i / 5) * 64;
      return { x, y, f:-2, bg:this.add.image(x, y, 'soil').setDepth(1), img:this.add.image(x, y - 2, 'crops', 0).setDepth(2).setVisible(false) };
    });
    this.pv.forEach((_, i) => this.paint(i));
    this.mark = this.add.rectangle(0, 0, 60, 60).setStrokeStyle(3, 0xffffff).setVisible(false).setDepth(3);

    hud();
    const showWelcome = () => modal('English Farm 🌱',
      '<b>“Welcome to the farm!”</b><br>Chào mừng bạn! Mở <b>🎒 Túi đồ</b> (phím B) → chọn hạt giống → xới đất → gieo hạt → tưới nước → vào nhà đi ngủ → thu hoạch. Làm nông tốn ⚡ stamina.<br>🎓 Nói chuyện với <b>cô Emma</b> để học từ vựng B1/B2: lấy EXP, lên cấp và nhận 🌱 hạt giống thưởng. Đi sang phải để vào 🏘️ thị trấn: mua hạt giống, ăn đồ hồi stamina; qua cầu, vườn hoa và đồi cao cũng rất đáng ghé. Bán nông sản bằng cách bỏ vào 📦 thùng ở nông trại, nhớ đi ngủ trước 24:00 kẻo bị móc túi!',
      [{ label:'Bắt đầu chơi 🌾', fn:closeModal }]);
    const first = S.day === 1 && !Object.keys(S.learned).length && !Object.keys(S.words).length;
    if (!S.story.intro) talk(PROLOGUE, () => { S.story.intro = true; save(); hud(); if (first) showWelcome(); });
    else if (first) showWelcome();
  }

  // ảnh cây: 0 = cây con · 1 = đang lớn · 2 = chín (sẵn sàng thu hoạch)
  stage(p) { const c = crop(p.c); return p.g >= c.days ? 2 : (p.g >= Math.ceil(c.days / 2) ? 1 : 0); }

  paint(i) {
    const p = S.plots[i], v = this.pv[i];
    v.bg.setAlpha(p.s ? 1 : .3).setTint(p.w ? 0x6b4a2b : 0xffffff);
    const f = p.s === 2 ? FRAME(p.c) + this.stage(p) : -1;
    if (v.f === f) return;
    v.f = f;
    if (f < 0) return v.img.setVisible(false);
    v.img.setFrame(f).setVisible(true);
    this.tweens.add({ targets: v.img, scale: { from: .2, to: 1 }, duration: 280, ease: 'Back.Out' });
  }

  fx(i, color, text) {
    const v = this.pv[i];
    const em = this.add.particles(v.x, v.y, 'spark', { speed: { min: 40, max: 120 }, lifespan: 550, scale: { start: 1.4, end: 0 }, tint: color, emitting: false }).setDepth(900);
    em.explode(14); this.time.delayedCall(700, () => em.destroy());
    if (text) {
      const t = this.add.text(v.x, v.y - 20, text, { fontSize: '20px', fontStyle: 'bold', color: '#fff', stroke: '#2a1d10', strokeThickness: 4 }).setOrigin(.5).setDepth(901);
      this.tweens.add({ targets: t, y: t.y - 46, alpha: 0, duration: 1100, ease: 'Cubic.Out', onComplete: () => t.destroy() });
    }
  }

  ready(p) { return p.s === 2 && p.g >= crop(p.c).days; }

  edge() {
    const p = this.player;
    if (p.x > this.W - 30 && p.y > 540 && p.y < 670) this.go('Town');
    else if (p.y < 14 && p.x > 500 && p.x < 780) this.go('Forest');
    else if (p.y > this.H - 14 && p.x > 500 && p.x < 780) this.go('Lake');
  }

  // Tìm thứ gần người chơi nhất để tương tác
  look() {
    const px = this.player.x, py = this.player.y;
    let best = null, d = 62;
    this.pv.forEach((v, i) => { const dd = Phaser.Math.Distance.Between(px, py, v.x, v.y); if (dd < d) { d = dd; best = { t:'plot', i }; } });
    if (best) return best;
    if (Phaser.Math.Distance.Between(px, py, this.binObj.x, this.binObj.y) < 70) return { t:'bin' };
    if (Phaser.Math.Distance.Between(px, py, this.mailObj.x, this.mailObj.y) < 64) return { t:'mail' };
    if (Phaser.Math.Distance.Between(px, py, this.emma.x, this.emma.y) < 85) return { t:'emma' };
    if (Phaser.Math.Distance.Between(px, py, this.house.x, this.house.y) < 120) return { t:'house' };
    return null;
  }

  label(c) {
    if (!c) return 'WASD / phím mũi tên: đi · E hoặc Space: hành động · 1-9 hoặc [ ]: chọn hạt · B: túi đồ · đi sang phải: thị trấn';
    if (c.t === 'emma') return 'E: học tiếng Anh với cô Emma 🎓 (B1/B2)';
    if (c.t === 'bin') return 'E: bỏ nông sản vào thùng 📦 (qua đêm tiền sẽ vào ví)';
    if (c.t === 'mail') return 'E: mở hộp thư ✉️ (mỗi ngày 1 lá thư tiếng Anh, +EXP)';
    if (c.t === 'house') return 'E: vào nhà 🏠 (ngủ, trang trí)';
    const p = S.plots[c.i];
    if (p.s === 0) return `E: xới đất (⚡${COST.till})`;
    if (p.s === 1) return seedCount(S.sel) > 0 ? `E: gieo ${crop(S.sel).en} (${crop(S.sel).vi}) — còn ${seedCount(S.sel)} hạt (⚡${COST.sow})` : 'Hết hạt giống! Mua ở Seed Shop 🌱 hoặc học bài với cô Emma để nhận thêm.';
    if (this.ready(p)) return `E: thu hoạch ${crop(p.c).en} (${crop(p.c).vi}) (⚡${COST.harvest})`;
    const cc = crop(p.c), nm = `${cc.en} (${cc.vi})`;
    return p.w ? `${nm} — đã tưới, hãy đi ngủ để cây lớn (${p.g}/${cc.days} ngày)` : `E: tưới nước 💧 cho ${nm} (⚡${COST.water})`;
  }

  mail() {
    snd('chat');
    if (S.mailDay === S.day) return modal('Hộp thư ✉️', '<b>“No new letters today.”</b><br>(Hôm nay chưa có thư mới.) Mai quay lại nhé!', [{ label:'Đóng', fn:closeModal }]);
    const p = PHRASES[(S.day * 5 + 2) % PHRASES.length]; S.mailDay = S.day; save();
    modal('Hộp thư ✉️', `<b>“Dear farmer, ${p.en}”</b><br>${p.vi}<br><small>💡 ${p.tip}</small><br>🎓 +3 EXP`, [{ label:'Thank you! 💌', fn:closeModal }]);
    gainExp(3);
  }

  doAct(c) {
    if (c.t === 'plot') this.plot(c.i); else if (c.t === 'mail') this.mail(); else if (c.t === 'bin') binUI(); else if (c.t === 'emma') { if (!turnIn('Farm:emma')) emma(); } else this.go('Home');
  }

  plot(i) {
    const p = S.plots[i];
    const after = () => { this.paint(i); hud(); save(); };
    if (p.s === 0) {
      if (!can(COST.till)) return;
      use(COST.till); p.s = 1; toast('Đã xới đất'); this.fx(i, 0xb98a5a); snd('till'); return after();
    }
    if (p.s === 1) {
      const c = crop(S.sel);
      if (seedCount(c.id) <= 0) { snd('error'); return toast('Hết hạt giống rồi 🌱 — mua ở Seed Shop hoặc học bài với cô Emma.'); }
      if (!can(COST.sow)) return;
      use(COST.sow); S.inv.seeds[c.id]--;
      p.s = 2; p.c = c.id; p.g = 0; p.w = wxNow() === 'rain';
      S.learned[c.id] = (S.learned[c.id] || 0) + 1;
      snd('sow'); this.fx(i, 0x9be564, '🌱');
      toast(`Đã gieo ${c.en} = ${c.vi} · còn ${seedCount(c.id)} hạt`);
      fixSel(); return after();
    }
    if (this.ready(p)) {
      if (!can(COST.harvest)) return;
      const c = crop(p.c); use(COST.harvest);
      S.inv.crops[c.id] = (S.inv.crops[c.id] || 0) + 1; S.story.cnt.harvest++;
      const seed = Math.random() < .4; if (seed) addSeed(c.id);
      p.s = 1; p.c = null; p.g = 0; p.w = false;
      S.learned[c.id] = (S.learned[c.id] || 0) + 1;
      snd('harvest'); this.fx(i, 0xffd54a, '+1 🧺');
      toast(`Thu hoạch ${c.en} (${c.vi})! Đã bỏ vào 🎒${seed ? ' · +1 hạt giống' : ''} · +2 EXP`);
      after(); return gainExp(2);
    }
    if (!p.w) {
      if (!can(COST.water)) return;
      use(COST.water); p.w = true; toast('Đã tưới nước 💧'); this.fx(i, 0x6ec6ff, '💧'); snd('water'); return after();
    }
    toast('Cây cần thời gian — hãy đi ngủ để sang ngày mới.');
  }
}

// ====== CẢNH 2: THỊ TRẤN ======
class Town extends Base {
  constructor() { super('Town'); }

  create() {
    const W = 1760, H = 1120;
    this.boot(W, H, 70, 332);
    // ---- đường (ô 64px): đường chính kéo dài qua cầu · lối lên đồi · lối vào khu vườn ----
    const cells = new Set(), road = (x0, y0, x1, y1) => { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) cells.add(x + ',' + y); };
    road(0, 5, 26, 5);                                   // đường chính
    road(3, 4, 3, 4); road(8, 4, 8, 4); road(13, 4, 13, 4); // lối vào tiệm hạt giống / nhà dân / decor
    road(6, 6, 6, 6);                                    // lối xuống quầy ăn
    const plaza = new Set(); road(10, 6, 12, 8);          // sân giếng nước (lát đất đặc)
    for (let x = 10; x <= 12; x++) for (let y = 5; y <= 8; y++) plaza.add(x + ',' + y);
    road(12, 9, 12, 10);                                 // lối lên Đồi Cao
    road(9, 6, 9, 13); road(1, 13, 9, 13); road(4, 11, 4, 15); // lối vào + đường trong khu vườn
    this.paintGround(cells, plaza);

    const place = (key, x, y) => { const s = this.solids.create(x, y, key); s.setDepth(y + s.height / 2 - 4); return s; };
    // Công trình pixel-art: vẽ theo đáy (origin .5,1), vật cản chỉ ở phần chân → đi vòng ra sau được
    const bldg = (key, x, bottom, solidH = 56, solidW = .8) => {
      const s = this.add.image(x, bottom, 'b_' + key).setOrigin(.5, 1).setDepth(bottom);
      const z = this.add.zone(x, bottom - solidH / 2, s.width * solidW, solidH); this.physics.add.existing(z, true); this.physics.add.collider(this.player, z);
      this.mm.r.push([x - s.width / 2, bottom - s.height, s.width, s.height]);
      return s;
    };
    this.shopB  = bldg('seedshop', 220, 304, 60, .75);   // Seed Shop
    this.homesB = bldg('homes', 560, 275, 50, .85);      // nhà dân (2 căn)
    this.foodB  = bldg('food', 380, 545, 50, .8);        // quầy đồ ăn
    this.decorB = bldg('decor', 840, 268, 50, .8);       // tiệm nội thất / trang trí
    this.wellB  = bldg('well', 700, 505, 40, .55);       // giếng nước
    this.dinhB  = bldg('dinh', 950, 572, 56, .85);       // đình làng
    this.mm.exits.push([0, 0, 8, H]);
    if (S.story.ch >= 5) { // sau cốt truyện: đèn lồng sáng quanh Đình làng
      for (let i = 0; i < 8; i++) {
        const x = 832 + i * 34, y = 414 + Math.sin(i * 1.3) * 7;
        const glow = this.add.circle(x, y, 12, 0xffc94a, .28).setDepth(1600), lamp = this.add.circle(x, y, 5, 0xff5a36).setDepth(1601).setStrokeStyle(1, 0xffe08a);
        this.tweens.add({ targets: [glow, lamp], alpha: { from: .55, to: 1 }, yoyo: true, repeat: -1, duration: 700 + i * 90 });
      }
    }

    // ============ SÔNG + CẦU ============
    const RX = 1184, RW = 104, inRiver = x => x > 1150 && x < 1322;
    this.add.tileSprite(RX - 16, 0, 16, H, 'sand').setOrigin(0).setDepth(.15);
    this.add.tileSprite(RX + RW, 0, 16, H, 'sand').setOrigin(0).setDepth(.15);
    this.water = this.add.tileSprite(RX, 0, RW, H, 'water').setOrigin(0).setDepth(.2);
    this.add.rectangle(RX, 0, RW, H).setOrigin(0).setStrokeStyle(3, 0x1e4f73).setDepth(.25);
    this.add.tileSprite(RX - 16, 322, RW + 32, 60, 'wood').setOrigin(0).setDepth(.4);
    { const g = this.add.graphics().setDepth(.45);
      g.fillStyle(0x6e3b17); g.fillRect(RX - 16, 312, RW + 32, 10); g.fillRect(RX - 16, 382, RW + 32, 10);
      g.fillStyle(0x9c5a2e); g.fillRect(RX - 16, 314, RW + 32, 3); g.fillRect(RX - 16, 384, RW + 32, 3);
      g.fillStyle(0x4a2a14); for (let x = RX - 12; x < RX + RW + 16; x += 28) { g.fillRect(x, 306, 6, 16); g.fillRect(x, 380, 6, 16); } }
    this.block(RX, 0, RW, 316); this.block(RX, 388, RW, H - 388);
    this.mm.r.push([RX, 0, RW, H, '#3a86bf']);
    this.riverZone = [[1120, 1184], [1288, 1345]];

    // ============ ĐỒI CAO (chỗ cao) ============
    const PX0 = 700, PY0 = 690, PW = 420, PH = 260;
    { const g = this.add.graphics().setDepth(.4), rnd = this.rng(77);
      g.fillStyle(0x86c765); g.fillRect(PX0, PY0, PW, PH);
      for (let i = 0; i < 90; i++) { g.fillStyle(i % 3 ? 0x7ab95b : 0x95d674); g.fillRect(PX0 + 8 + rnd() * (PW - 20), PY0 + 8 + rnd() * (PH - 20), 3, 3); }
      g.fillStyle(0x4d8738); g.fillRect(PX0, PY0, PW, 8); g.fillRect(PX0, PY0, 8, PH); g.fillRect(PX0 + PW - 8, PY0, 8, PH);
      g.fillStyle(0x8a6a4a); g.fillRect(PX0 - 12, PY0 + 6, 12, PH); g.fillRect(PX0 + PW, PY0 + 6, 12, PH);
      g.fillStyle(0x5a4630); g.fillRect(PX0 - 12, PY0 + 6, 3, PH); g.fillRect(PX0 + PW + 9, PY0 + 6, 3, PH);
      // bậc thang đi lên đồi (x 768-832)
      for (let i = 0; i < 6; i++) { const y = 672 + i * 8; g.fillStyle(i % 2 ? 0xb7a47c : 0xd8c79e); g.fillRect(768, y, 64, 8); g.fillStyle(0x8a7850); g.fillRect(768, y + 6, 64, 2); }
      g.fillStyle(0x8a7850); g.fillRect(764, 672, 4, 48); g.fillRect(832, 672, 4, 48); }
    this.add.tileSprite(PX0, PY0 + PH, PW, 56, 'cliff').setOrigin(0).setDepth(.41);
    this.block(PX0, 684, 68, 14); this.block(832, 684, PX0 + PW - 832, 14);     // mép phía bắc (chừa cầu thang)
    this.block(PX0 - 12, 690, 14, PH); this.block(PX0 + PW - 2, 690, 14, PH);   // mép tây / đông
    this.block(PX0, PY0 + PH - 6, PW, 62);                                      // vách đá phía nam
    this.mm.r.push([PX0, PY0, PW, PH + 56, '#8fcf6a'], [768, 672, 64, 48, '#d8c79e']);
    this.gazebo = this.add.image(900, 905, 'gazebo').setOrigin(.5, 1).setDepth(905);
    this.block(850, 880, 12, 14); this.block(938, 880, 12, 14);
    this.scope = this.add.image(1040, 810, 'telescope').setOrigin(.5, 1).setDepth(810);
    this.block(1028, 796, 24, 14);
    this.add.image(1030, 890, 'bench').setOrigin(.5, 1).setDepth(890);
    { const rnd = this.rng(5), cols = [0xff6f91, 0xffd54a, 0xffffff, 0xb28cff];
      for (let i = 0; i < 26; i++) { const fx = PX0 + 24 + rnd() * (PW - 48), fy = PY0 + 40 + rnd() * (PH - 60); if (fx > 770 && fx < 960 && fy > 800) continue; this.add.image(fx, fy, 'flower').setTint(cols[i % 4]).setDepth(fy); } }
    place('tree', 745, 770); place('tree', 1085, 745); place('tree', 1085, 905);

    // ============ KHU VƯỜN HOA (chỗ thấp, phía tây-nam) ============
    const GX0 = 56, GY0 = 696, GW = 528, GH = 394;
    const hedge = (x, y, w, h) => { this.add.tileSprite(x, y, w, h, 'hedge').setOrigin(0).setDepth(y + h); this.block(x, y, w, h - 4); this.mm.r.push([x, y, w, h, '#2e7d32']); };
    hedge(GX0, GY0, GW, 28); hedge(GX0, GY0 + GH - 28, GW, 28); hedge(GX0, GY0, 24, GH);
    hedge(GX0 + GW - 24, GY0, 24, 136); hedge(GX0 + GW - 24, 896, 24, GY0 + GH - 896);
    const bed = (x, y, w, h, seed) => {
      this.add.rectangle(x, y, w, h, 0x7a4f2c).setOrigin(0).setStrokeStyle(3, 0x4a3320).setDepth(.5);
      const rnd = this.rng(seed), cols = [0xff6f91, 0xffd54a, 0xffffff, 0xb28cff, 0xff9a3c, 0x6ec6ff];
      for (let i = 0; i < Math.floor(w * h / 260); i++) { const fx = x + 8 + rnd() * (w - 16), fy = y + 10 + rnd() * (h - 16); this.add.image(fx, fy, 'flower').setTint(cols[Math.floor(rnd() * cols.length)]).setDepth(fy); }
      this.mm.r.push([x, y, w, h, '#d86a9a']);
    };
    bed(96, 736, 130, 80, 3); bed(350, 736, 190, 80, 4); bed(96, 930, 130, 90, 5); bed(350, 930, 190, 90, 6);
    place('fountain', 288, 972);
    this.daisy = this.npc('daisy', 206, 872, 'Daisy 🌼');
    this.add.image(150, 914, 'bench').setOrigin(.5, 1).setDepth(914); this.add.image(480, 914, 'bench').setOrigin(.5, 1).setDepth(914);
    this.bfly = [];
    [0xff8fc8, 0xffd54a, 0x8fd3ff, 0xc8a2ff, 0xffffff].forEach((tint, i) => {
      const b = this.add.image(120 + i * 80, 790 + (i % 2) * 150, 'a_bfly').setScale(1.6).setTint(tint).setDepth(1400); this.bfly.push(b);
      this.tweens.add({ targets: b, scaleY: { from: 1.6, to: .7 }, yoyo: true, repeat: -1, duration: 140 });
      const mv = () => this.tweens.add({ targets: b, x: Phaser.Math.Between(GX0 + 40, GX0 + GW - 60), y: Phaser.Math.Between(GY0 + 50, GY0 + GH - 60), duration: Phaser.Math.Between(1800, 3400), ease: 'Sine.InOut', onComplete: mv });
      mv();
    });

    // ============ BỜ ĐÔNG: cối xay gió + đồng cỏ ============
    this.add.image(1590, 300, 'windmill').setOrigin(.5, 1).setDepth(300);
    this.block(1556, 268, 68, 32);
    const bl = this.add.image(1590, 196, 'blades').setDepth(301); this.tweens.add({ targets: bl, angle: 360, duration: 9000, repeat: -1 });
    this.mm.r.push([1536, 156, 108, 144, '#e8d7b0']);
    this.pete = this.npc('pete', 1500, 350, 'Miller Pete');
    { const g = this.add.graphics().setDepth(.5);
      for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) { g.fillStyle((i + j) % 2 ? 0xffffff : 0xd33a2c); g.fillRect(1430 + i * 15, 450 + j * 15, 15, 15); } }
    this.add.text(1475, 445, '🧺', { fontSize:'22px' }).setOrigin(.5).setDepth(520);

    // ---- đèn đường: tối đến thì sáng ----
    this.lamps = [];
    [[150, 318], [540, 318], [780, 318], [1010, 318], [1150, 322], [1322, 322], [1660, 322], [236, 900], [344, 900], [545, 850]].forEach(p => {
      this.add.image(p[0], p[1], 'lamp').setOrigin(.5, 1).setDepth(p[1]);
      const glow = this.add.circle(p[0], p[1] - 42, 46, 0xffc860, 0).setDepth(2001).setBlendMode(Phaser.BlendModes.ADD);
      this.lamps.push({ glow });
    });

    // ---- cây: hàng viền + rải ngẫu nhiên ở vùng ngoại ô ----
    for (let x = 30; x < W; x += 66) {
      if (!(x > 80 && x < 360) && !inRiver(x)) place(Math.floor(x / 66) % 4 === 1 ? 'blossom' : 'tree', x, 40);
      if (x > 620 && !inRiver(x)) place('tree', x + 20, H - 36);
    }
    for (let y = 120; y < H - 40; y += 70) { if (!(y > 250 && y < 430)) place('tree', 24, y); place('tree', W - 24, y); }
    const rt = this.rng(9), nearR = (x, y) => cells.has(Math.floor(x / 64) + ',' + Math.floor(y / 64));
    for (let i = 0, n = 0; n < 45 && i < 500; i++) {
      const x = 60 + rt() * (W - 120), y = 80 + rt() * (H - 160);
      if (nearR(x, y) || nearR(x - 30, y) || nearR(x + 30, y) || inRiver(x) || (x < 1150 && y < 650) || (x < 620 && y > 660) || (x > 670 && x < 1150 && y > 650 && y < 1020)
        || (x > 1330 && x < 1740 && y > 500 && y < 1050) || (x > 1490 && x < 1700 && y < 420)) continue;
      place('tree', x, y); n++;
    }
    this.solids.refresh();
    this.physics.add.collider(this.player, this.solids);

    const near = (x, y) => cells.has(Math.floor(x / 64) + ',' + Math.floor(y / 64));
    const inside = (x, y, r) => x > r[0] && x < r[2] && y > r[1] && y < r[3];
    const blocks = [[90, 10, 350, 330], [390, 90, 730, 290], [735, 80, 950, 285], [280, 360, 480, 565], [630, 380, 775, 520], [820, 410, 1085, 600], [1480, 140, 1700, 420]];
    this.scatter(70, 33, (x, y) => !near(x, y) && !near(x + 24, y) && !near(x - 24, y) && !near(x, y - 20) && !inRiver(x) && y < 1070
      && !(x < 600 && y > 660) && !(x > 660 && x < 1150 && y > 640 && y < 1020) && !blocks.some(r => inside(x, y, r)));

    // ---- biển tên + nhân vật ----
    const sign = (x, y, t) => this.add.text(x, y, t, { fontSize:'15px', color:'#fff', backgroundColor:'#4a3320', padding:{ x:6, y:2 } }).setOrigin(.5).setDepth(1500);
    sign(560, 292, '🏠 Town Homes'); sign(380, 562, '🍞 Food Stall'); sign(840, 285, '🛋️ Decor Shop'); sign(220, 322, '🌱 Seed Shop'); sign(950, 596, '🏛️ Đình làng'); sign(60, 292, '← Nông trại');
    sign(1236, 296, '🌉 Cầu Sunny'); sign(800, 660, '⛰️ Đồi Cao ↓'); sign(320, 680, '🌼 Khu vườn Hoa'); sign(1500, 322, '🌬️ Cối xay gió'); sign(1540, 530, '🐄 Đồng cỏ Bờ Đông');
    this.lily = this.npc('lily', 322, 328, 'Lily');
    this.chef = this.npc('chef', 500, 530, 'Chef Bo');
    this.mia = this.npc('mia', 962, 296, 'Mia');
    this.npc('ben', 470, 286); this.npc('rose', 660, 288);
    const arrow = this.add.text(18, 332, '➜', { fontSize:'26px', color:'#fff', stroke:'#2a1d10', strokeThickness:4 }).setOrigin(.5).setFlipX(true).setDepth(1500);
    this.tweens.add({ targets: arrow, x: 30, yoyo: true, repeat: -1, duration: 500 });

    // ---- vật nuôi ----
    this.addAnimal('cat', 160, 430, [100, 360, 170, 140]);
    this.addAnimal('cow', 1450, 700, [1340, 520, 380, 500]); this.addAnimal('cow', 1620, 860, [1340, 520, 380, 500]);
    this.addAnimal('sheep', 1400, 900, [1340, 520, 380, 500]); this.addAnimal('sheep', 1560, 640, [1340, 520, 380, 500]); this.addAnimal('sheep', 1660, 760, [1340, 520, 380, 500]);

    // vùng bấm E: từ lưng chừng công trình xuống ~60px phía trước cửa
    const zn = im => { const r = im.getBounds(); return new Phaser.Geom.Rectangle(r.x - 24, r.bottom - 90, r.width + 48, 150); };
    this.zones = { shop: zn(this.shopB), homes: zn(this.homesB), decor: zn(this.decorB), food: zn(this.foodB), well: zn(this.wellB), dinh: zn(this.dinhB) };
    hud();
    this.time.delayedCall(450, () => toast('Welcome to Sunny Town! 🏘️ — đi sang phải để qua cầu, đi xuống để tới khu vườn và đồi cao'));
  }

  update(time, delta) {
    this.water.tilePositionY += delta * .012;
    const h = clk / 60, dim = dark(h) > .12 || wxNow() === 'rain';
    this.lamps.forEach((l, i) => l.glow.setAlpha(dim ? .3 + Math.sin(time / 300 + i) * .04 : 0));
    const fly = h >= 7 && h < 18 && wxNow() !== 'rain'; this.bfly.forEach(b => b.setVisible(fly));
    super.update(time, delta);
  }

  edge() { if (this.player.x < 22) this.go('Farm'); }

  look() {
    const px = this.player.x, py = this.player.y, D = Phaser.Math.Distance.Between;
    if (D(px, py, this.daisy.x, this.daisy.y) < 75) return { t:'daisy' };
    if (D(px, py, this.pete.x, this.pete.y) < 75) return { t:'pete' };
    if (D(px, py, this.scope.x, this.scope.y - 10) < 80) return { t:'scope' };
    if (this.zones.shop.contains(px, py) || D(px, py, this.lily.x, this.lily.y) < 70) return { t:'shop' };
    if (this.zones.dinh.contains(px, py)) return { t:'dinh' };
    if (this.zones.homes.contains(px, py)) return { t:'homes' };
    if (this.zones.decor.contains(px, py) || D(px, py, this.mia.x, this.mia.y) < 70) return { t:'decor' };
    if (this.zones.food.contains(px, py) || D(px, py, this.chef.x, this.chef.y) < 70) return { t:'food' };
    if (!(py > 300 && py < 400) && this.riverZone.some(r => px > r[0] && px < r[1])) return { t:'river' };
    return null;
  }

  label(c) {
    if (!c) return 'WASD / phím mũi tên: đi · E hoặc Space: hành động · trái: nông trại · phải: qua cầu · xuống: vườn hoa & đồi cao';
    if (c.t === 'shop') return 'E: vào Seed Shop — mua hạt giống 🌱';
    if (c.t === 'dinh') return 'E: thắp hương ở Đình làng 🏛️ (mỗi ngày nhận 1 lời chúc, +EXP)';
    if (c.t === 'homes') return 'E: gõ cửa nhà dân 🏠 (mỗi ngày nghe 1 câu mới, +EXP)';
    if (c.t === 'decor') return 'E: vào Decor Shop — mua đồ trang trí nhà 🛋️';
    if (c.t === 'daisy') return 'E: nói chuyện với Daisy 🌼 (mỗi ngày học tên 1 loài hoa)';
    if (c.t === 'pete') return 'E: nói chuyện với bác Pete ở cối xay gió 🌬️ (mỗi ngày 1 câu mới)';
    if (c.t === 'scope') return 'E: nhìn kính viễn vọng 🔭 — xem dự báo thời tiết ngày mai';
    if (c.t === 'river') return S.rod ? `E: thả câu ở sông 🎣 (⚡${COST_FISH})` : 'Cần có cần câu — hãy hỏi thuyền trưởng Hải ở Hồ Trăng ⚓';
    return 'E: mua đồ ăn 🍞 để hồi ⚡ stamina';
  }

  doAct(c) {
    if (c.t === 'dinh') { if (!turnIn('Town:dinh')) this.dinh(); }
    else if (c.t === 'shop') { if (!turnIn('Town:shop')) this.shop(); }
    else if (c.t === 'homes') this.homes(); else if (c.t === 'decor') this.decorShop();
    else if (c.t === 'daisy') this.daisyTalk(); else if (c.t === 'pete') this.peteTalk(); else if (c.t === 'scope') this.scopeLook();
    else if (c.t === 'river') fishing(); else this.food();
  }

  daisyTalk() {
    snd('chat');
    const FL = [['Rose', 'hoa hồng', 'A red rose smells sweet.', 'Một đóa hồng đỏ thơm ngát.'], ['Lily', 'hoa loa kèn', 'The white lily is tall and graceful.', 'Hoa loa kèn trắng cao và thanh nhã.'],
      ['Tulip', 'hoa tulip', 'Tulips bloom in spring.', 'Hoa tulip nở vào mùa xuân.'], ['Daisy', 'hoa cúc', 'A daisy has white petals and a yellow centre.', 'Hoa cúc có cánh trắng và nhụy vàng.'],
      ['Sunflower', 'hoa hướng dương', 'Sunflowers always face the sun.', 'Hoa hướng dương luôn hướng về mặt trời.'], ['Orchid', 'hoa lan', 'This orchid is very rare.', 'Đóa lan này rất hiếm.'],
      ['Lotus', 'hoa sen', 'The lotus grows in a quiet pond.', 'Hoa sen mọc trong ao yên tĩnh.'], ['Jasmine', 'hoa nhài', 'Jasmine tea has a lovely smell.', 'Trà hoa nhài có mùi rất dễ chịu.']];
    const f = FL[(S.day - 1) % FL.length];
    if (S.daisyDay === S.day) return modal('Daisy 🌼', '<b>“The flowers are happy today!”</b><br>(Hôm nay hoa vui lắm!) Mai ghé lại, mình sẽ dạy bạn tên một loài hoa mới.', [{ label:'Đóng', fn:closeModal }]);
    S.daisyDay = S.day; save();
    const seed = Math.random() < .5 ? rewardSeed() : null;
    modal('Daisy 🌼', `<b>“${f[0]}”</b> = ${f[1]}<div class="sent">${f[2]}</div>${f[3]}<br>🎓 +5 EXP${seed ? ' · 🌱 +1 ' + sico(seed, 20) + ' ' + crop(seed).en : ''}`, [{ label:'Thank you! 🌸', fn:closeModal }]);
    gainExp(5);
  }

  peteTalk() {
    snd('chat');
    if (S.peteDay === S.day) return modal('Miller Pete 🌬️', '<b>“The wind is calm today.”</b><br>(Hôm nay gió lặng.) Mai bác sẽ kể cháu nghe một câu mới.', [{ label:'Đóng', fn:closeModal }]);
    const p = PHRASES[(S.day * 5) % PHRASES.length]; S.peteDay = S.day; save();
    modal('Miller Pete 🌬️', `<b>“${p.en}”</b><br>${p.vi}<br><small>💡 ${p.tip}</small><br>🎓 +5 EXP`, [{ label:'Thank you! 👍', fn:closeModal }]);
    gainExp(5);
  }

  scopeLook() {
    snd('select');
    const n = S.nextWx || { k:'sun' };
    const T = { sun:['It will be sunny tomorrow.', 'Ngày mai trời sẽ nắng.'], cloud:['It will be cloudy tomorrow.', 'Ngày mai trời nhiều mây.'], rain:['It will rain tomorrow. Take an umbrella!', 'Ngày mai trời sẽ mưa. Nhớ mang ô!'] }[n.k];
    const first = S.scopeDay !== S.day; S.scopeDay = S.day; save();
    modal('Kính viễn vọng 🔭', `<div class="big">${n.k === 'rain' ? '🌧️' : n.k === 'cloud' ? '☁️' : '☀️'}</div><b>“${T[0]}”</b><br>${T[1]}<br><small>${WX_NAME[n.k]}${n.k === 'rain' ? ` · mưa khoảng ${n.a}h–${n.b}h (cây sẽ được tưới tự nhiên)` : ''}</small><br>${first ? '🎓 +3 EXP' : '<small>Hôm nay bạn đã xem rồi.</small>'}`, [{ label:'OK 👍', fn:closeModal }]);
    if (first) gainExp(3);
  }

  shop(tab = 'buy', keep = false) {
    this.qty = this.qty || 1;
    const nav = [];
    const close = { label:'Đóng', fn:closeModal };
    const qty = { label:`Số lượng mỗi lần mua: ×${this.qty} (bấm để đổi)`, fn:() => { this.qty = this.qty === 1 ? 5 : this.qty === 5 ? 10 : 1; this.shop('buy', true); } };
    const items = CROPS.map(c => {
      const lock = S.lvl < REQ_LVL(c), pr = SEED_PRICE(c) * this.qty;
      return { off: lock || S.coins < pr,
        html: lock ? `🔒 ${c.en} — mở ở Lv ${REQ_LVL(c)}` : `${sico(c.id, 26)} ${c.en} <small>(${c.vi})</small> — ${pr} 🪙 <small>· đang có ${seedCount(c.id)}</small>`,
        fn:() => { S.coins -= pr; addSeed(c.id, this.qty); S.sel = c.id; snd('buy'); hud(); save(); toast(`Đã mua ${this.qty} hạt ${c.en} 🌱`); this.shop('buy', true); } };
    });
    modal('Lily · Seed Shop', '<b>“Hello! Welcome to my shop.”</b><br>(Xin chào! Chào mừng đến cửa hàng của mình.)<br><small>🪙 ' + S.coins + ' · ⭐ Lv ' + S.lvl + ' — lên cấp bằng cách học bài với cô Emma để mở thêm hạt giống.</small><br><small>📦 Muốn bán nông sản? Bỏ vào thùng ở nông trại — qua đêm Lily sẽ trả tiền vào ví bạn!</small>', nav.concat(qty, items, close), keep);
  }

  food() {
    const btns = FOOD.map(f => ({
      label: `${f.e} ${f.en} (${f.vi}) — ${f.cost} 🪙 · +${f.st} ⚡`,
      off: S.coins < f.cost || S.stamina >= maxSt(),
      fn: () => { S.coins -= f.cost; S.stamina = Math.min(maxSt(), S.stamina + f.st); snd('eat'); hud(); save(); toast(`Yummy! ${f.e} +${f.st} ⚡`); this.food(); }
    }));
    btns.push({ label:'Đóng', fn:closeModal });
    modal('Chef Bo · Food Stall', '<b>“What would you like to eat?”</b><br>(Bạn muốn ăn gì nào?)<br>' +
      `<small>⚡ ${S.stamina}/${maxSt()} · 🪙 ${S.coins}${S.stamina >= maxSt() ? ' — bạn đang no, không cần ăn thêm.' : ''}</small>`, btns);
  }

  decorShop(tab) {
    if (!tab) {
      const n = Object.keys(S.placed).length;
      return modal('Mia · Decor Shop', `<b>“Hi! Let's make your home beautiful.”</b><br>(Chào bạn! Cùng làm ngôi nhà thật xinh nhé.)<br><small>🪙 ${S.coins} · Về nhà để bày đồ vào các ô trống. Nhà có từ 3 món trở lên sẽ thêm EXP mỗi lần ngủ (đang bày ${n} món).</small>`, [
        { label:'🖼️ Treo tường (Wall)', fn:() => this.decorShop('wall') },
        { label:'🪑 Đặt sàn (Floor)', fn:() => this.decorShop('floor') },
        { label:'Đóng', fn:closeModal }]);
    }
    const btns = DECOR.filter(d => d.kind === tab).map(d => ({
      label: `${d.e} ${d.en} (${d.vi}) — ${d.cost} 🪙${S.own[d.id] ? ' · có ' + S.own[d.id] : ''}`, off: S.coins < d.cost,
      fn: () => { S.coins -= d.cost; S.own[d.id] = (S.own[d.id] || 0) + 1; snd('buy'); hud(); save(); toast(`Đã mua ${d.en} ${d.e}`); this.decorShop(tab); }
    }));
    btns.push({ label:'⬅ Quay lại', fn:() => this.decorShop() });
    modal(tab === 'wall' ? 'Đồ treo tường' : 'Đồ đặt sàn', `<b>“What would you like?”</b> <small>🪙 ${S.coins}</small>`, btns);
  }

  dinh() {
    const W = [
      ['A journey of a thousand miles begins with a single step.', 'Hành trình ngàn dặm bắt đầu từ một bước chân.'],
      ['Practice makes perfect.', 'Có công mài sắt có ngày nên kim.'],
      ['Where there is a will, there is a way.', 'Có chí thì nên.'],
      ['Actions speak louder than words.', 'Hành động có sức nặng hơn lời nói.'],
      ['A friend in need is a friend indeed.', 'Bạn bè thật sự là người giúp ta lúc khó khăn.'],
      ['Every cloud has a silver lining.', 'Trong cái rủi có cái may.'],
      ['Rome was not built in a day.', 'Việc lớn cần thời gian, đừng nóng vội.'],
      ['Better late than never.', 'Muộn còn hơn không.']
    ];
    const w = W[(S.day - 1) % W.length];
    if (S.dinhDay === S.day) {
      return modal('Đình làng 🏛️', '<b>“Peace and good harvest!”</b> (Bình an và mùa màng bội thu!)<br>Hôm nay bạn đã thắp hương rồi. Mai quay lại nhận lời chúc mới nhé.', [{ label:'Đóng', fn:closeModal }]);
    }
    S.dinhDay = S.day; S.stamina = Math.min(maxSt(), S.stamina + 10); save(); snd('chat');
    modal('Đình làng 🏛️', `<b>“${w[0]}”</b><br>${w[1]}<br>🎓 +10 EXP · ⚡ +10 stamina`, [{ label:'Thank you! 🙏', fn:closeModal }]);
    gainExp(10);
  }

  homes() {
    if (S.phraseDay === S.day) {
      return modal('Nhà dân 🏠', '<b>“See you tomorrow!”</b> (Hẹn mai gặp lại!)<br>Hôm nay bạn đã nghe câu mới rồi. Ngủ một giấc ở nhà để sang ngày mới nhé.', [{ label:'Đóng', fn:closeModal }]);
    }
    const i = (S.day - 1) % PHRASES.length, p = PHRASES[i], who = VILLAGERS[(S.day - 1) % VILLAGERS.length];
    S.phraseDay = S.day; save(); snd('chat');
    modal(who + ' 🏠', `<b>“${p.en}”</b><br>${p.vi}<br><small>💡 ${p.tip}</small><br>🎓 +5 EXP`, [{ label:'Thank you! 👍', fn:closeModal }]);
    gainExp(5);
  }
}


// ====== CẢNH 4: RỪNG SƯƠNG (phía bắc nông trại) ======
const FORAGE = ['mushroom', 'blueberry', 'tea', 'garlic', 'strawberry'];
const FSPOTS = [[150, 130], [470, 150], [830, 100], [1110, 210], [990, 430], [250, 530], [1150, 630], [820, 600]];
class Forest extends Base {
  constructor() { super('Forest'); }

  create() {
    const W = 1280, H = 800;
    this.boot(W, H, 640, 735);
    const cells = new Set(), road = (x0, y0, x1, y1) => { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) cells.add(x + ',' + y); };
    road(9, 8, 10, 12); road(4, 8, 10, 8); road(4, 3, 5, 8); road(3, 2, 6, 3);
    this.paintGround(cells);
    this.add.rectangle(0, 0, W, H, 0x0b3d1a, .17).setOrigin(0).setDepth(1990);
    if (S.forageDay !== S.day) { S.forageDay = S.day; S.foraged = []; save(); }
    const near = (x, y, r = 40) => cells.has(Math.floor(x / 64) + ',' + Math.floor(y / 64)) || cells.has(Math.floor((x + r) / 64) + ',' + Math.floor(y / 64)) || cells.has(Math.floor((x - r) / 64) + ',' + Math.floor(y / 64));
    const rnd = this.rng(11);
    for (let i = 0, n = 0; n < 95 && i < 600; i++) {
      const x = 30 + rnd() * (W - 60), y = 50 + rnd() * (H - 80);
      if (near(x, y) || FSPOTS.some(p => Math.hypot(p[0] - x, p[1] - y) < 56)) continue;
      const t = this.solids.create(x, y, Math.random() < .5 ? 'pine' : 'tree'); t.setDepth(y + 28); n++;
    }
    this.solids.refresh();
    this.physics.add.collider(this.player, this.solids);
    this.spots = FSPOTS.map((p, i) => {
      const id = FORAGE[(i + S.day) % FORAGE.length];
      const img = this.add.image(p[0], p[1], 'crops', FRAME(id) + 2).setScale(.8).setDepth(p[1]).setVisible(!S.foraged.includes(i));
      this.tweens.add({ targets: img, y: p[1] - 4, yoyo: true, repeat: -1, duration: 900 + i * 60 });
      return { x: p[0], y: p[1], id, img };
    });
    this.moss = this.npc('moss', 330, 205, 'Elder Moss 🧙');
    for (let i = 0; i < 3; i++) this.addAnimal('rabbit', 300 + i * 220, 400 + i * 40, [80, 250, 1100, 450]);
    this.add.text(640, 770, '↓ Nông trại', { fontSize:'15px', color:'#fff', backgroundColor:'#4a3320', padding:{ x:6, y:2 } }).setOrigin(.5).setDepth(1500);
    this.add.text(330, 150, '🌲 Rừng Sương', { fontSize:'15px', color:'#fff', backgroundColor:'#4a3320', padding:{ x:6, y:2 } }).setOrigin(.5).setDepth(1500);
    this.mm.exits.push([520, H - 8, 240, 8]);
    this.mm.spots = this.spots;
    hud();
    this.time.delayedCall(450, () => toast('Mist Forest 🌲 — nhặt nấm, quả mọng, thảo dược!'));
  }

  edge() { if (this.player.y > this.H - 14 && this.player.x > 520 && this.player.x < 760) this.go('Farm'); }

  look() {
    const px = this.player.x, py = this.player.y;
    if (Phaser.Math.Distance.Between(px, py, this.moss.x, this.moss.y) < 80) return { t:'moss' };
    let best = null, d = 54;
    this.spots.forEach((s, i) => { if (S.foraged.includes(i)) return; const dd = Phaser.Math.Distance.Between(px, py, s.x, s.y); if (dd < d) { d = dd; best = { t:'forage', i }; } });
    return best;
  }

  label(c) {
    if (!c) return 'WASD / phím mũi tên: đi · E hoặc Space: nhặt đồ trong rừng · đi xuống: về nông trại';
    if (c.t === 'moss') return 'E: nói chuyện với cụ Moss 🧙';
    const cc = crop(this.spots[c.i].id);
    return `E: nhặt ${cc.en} (${cc.vi}) 🍄 (⚡1)`;
  }

  doAct(c) {
    if (c.t === 'moss') return this.talkMoss();
    const s = this.spots[c.i];
    if (!can(1)) return;
    use(1); S.foraged.push(c.i); s.img.setVisible(false);
    const cc = crop(s.id); S.inv.crops[cc.id] = (S.inv.crops[cc.id] || 0) + 1; S.story.cnt.forage++;
    let extra = ''; if (Math.random() < .25) { const sid = rewardSeed(); extra = ' + hạt ' + crop(sid).en; }
    snd('harvest'); toast(`+1 ${cc.en} (${cc.vi})${extra}`); gainExp(2); save();
  }

  talkMoss() {
    if (turnIn('Forest:moss')) return;
    snd('chat');
    if (S.mossDay === S.day) return modal('Elder Moss 🧙', '<b>“The forest is quiet today.”</b><br>(Hôm nay rừng yên ắng.) Mai cụ sẽ kể bạn nghe một câu mới.', [{ label:'Đóng', fn:closeModal }]);
    const p = PHRASES[(S.day * 3) % PHRASES.length]; S.mossDay = S.day; save();
    modal('Elder Moss 🧙', `<b>“${p.en}”</b><br>${p.vi}<br><small>💡 ${p.tip}</small><br>🎓 +5 EXP`, [{ label:'Thank you! 🙏', fn:closeModal }]);
    gainExp(5);
  }
}

// ====== CẢNH 5: HỒ TRĂNG (phía nam nông trại) ======
class Lake extends Base {
  constructor() { super('Lake'); }

  create() {
    const W = 1280, H = 800;
    this.boot(W, H, 640, 70);
    const cells = new Set(), road = (x0, y0, x1, y1) => { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) cells.add(x + ',' + y); };
    road(9, 0, 10, 3); road(8, 3, 12, 3);
    this.paintGround(cells);
    // mặt hồ + cầu tàu (vật cản chừa lối đi trên cầu)
    this.water = this.add.tileSprite(160, 300, 960, 440, 'water').setOrigin(0).setDepth(.2);
    this.add.tileSprite(608, 270, 64, 270, 'wood').setOrigin(0).setDepth(.4);
    this.add.rectangle(160, 300, 960, 440).setOrigin(0).setStrokeStyle(4, 0x1e4f73).setDepth(.3);
    [[160, 300, 448, 440], [672, 300, 448, 440], [608, 540, 64, 200]].forEach(r => { const z = this.add.zone(r[0] + r[2] / 2, r[1] + r[3] / 2, r[2], r[3]); this.physics.add.existing(z, true); this.physics.add.collider(this.player, z); });
    const rnd = this.rng(23);
    for (let i = 0, n = 0; n < 40 && i < 400; i++) {
      const x = 30 + rnd() * (W - 60), y = 40 + rnd() * (H - 60);
      if ((x > 120 && x < 1160 && y > 240 && y < 780) || (x > 520 && x < 760 && y < 280) || y < 30) continue;
      const t = this.solids.create(x, y, 'tree'); t.setDepth(y + 28); n++;
    }
    this.solids.refresh();
    this.physics.add.collider(this.player, this.solids);
    this.scatter(26, 41, (x, y) => !(x > 140 && x < 1140 && y > 280 && y < 760) && !(x > 540 && x < 740 && y < 300));
    this.hai = this.npc('hai', 740, 285, 'Captain Hai ⚓');
    for (let i = 0; i < 3; i++) this.addAnimal('duck', 260 + i * 120, 400 + i * 50, [200, 330, 860, 370], [[590, 260, 100, 300]]);
    this.fishZone = new Phaser.Geom.Rectangle(150, 285, 980, 470);
    const sg = (x, y, t) => this.add.text(x, y, t, { fontSize:'15px', color:'#fff', backgroundColor:'#4a3320', padding:{ x:6, y:2 } }).setOrigin(.5).setDepth(1500);
    sg(640, 28, '↑ Nông trại'); sg(640, 255, '🎣 Hồ Trăng');
    this.mm.r.push([160, 300, 960, 440, '#3a86bf'], [608, 270, 64, 270, '#b9854f']);
    this.mm.exits.push([520, 0, 240, 8]);
    hud();
    this.time.delayedCall(450, () => toast('Moon Lake 🎣 — đứng gần mặt nước và bấm E để câu cá!'));
  }

  update(time, delta) { this.water.tilePositionX += delta * .01; this.water.tilePositionY += delta * .004; super.update(time, delta); }

  edge() { if (this.player.y < 14 && this.player.x > 520 && this.player.x < 760) this.go('Farm'); }

  look() {
    const px = this.player.x, py = this.player.y;
    if (Phaser.Math.Distance.Between(px, py, this.hai.x, this.hai.y) < 80) return { t:'captain' };
    if (this.fishZone.contains(px, py)) return { t:'fish' };
    return null;
  }

  label(c) {
    if (!c) return 'WASD / phím mũi tên: đi · lại gần mặt nước để câu cá · đi lên: về nông trại';
    if (c.t === 'captain') return 'E: nói chuyện với thuyền trưởng Hải ⚓ (bán cá)';
    return S.rod ? `E: thả câu 🎣 (⚡${COST_FISH})` : 'Cần có cần câu — hãy hỏi thuyền trưởng Hải ⚓';
  }

  doAct(c) { if (c.t === 'captain') { if (!turnIn('Lake:captain')) captain(); } else fishing(); }
}

// ====== CẢNH 3: TRONG NHÀ ======
class Home extends Base {
  constructor() { super('Home'); }

  create() {
    const W = 800, H = 520;
    this.boot(W, H, 400, H - 70);
    this.physics.world.setBounds(0, 120, W, H - 120); // không đi lên tường được
    this.add.tileSprite(0, 0, W, 130, 'wall').setOrigin(0).setDepth(.05);
    this.add.rectangle(0, 126, W, 8, 0x6b4a2b).setOrigin(0).setDepth(.07);
    this.add.tileSprite(0, 134, W, H - 134, 'wood').setOrigin(0).setDepth(.05);
    // cửa sổ
    this.add.rectangle(110, 68, 70, 56, 0x6e3b17).setDepth(.1);
    this.add.rectangle(110, 68, 62, 48, 0x8fd3ff).setDepth(.11);
    this.add.rectangle(110, 68, 3, 48, 0x6e3b17).setDepth(.12);
    this.add.rectangle(110, 68, 62, 3, 0x6e3b17).setDepth(.12);
    this.add.image(400, 330, 'rug').setDepth(.2);
    // cửa ra ngoài
    this.add.rectangle(W / 2, H - 6, 110, 14, 0x6b3a22).setDepth(.3);
    this.add.text(W / 2, H - 44, '⬇ Ra ngoài', { fontSize:'15px', color:'#fff', backgroundColor:'#4a3320', padding:{ x:6, y:2 } }).setOrigin(.5).setDepth(1500);
    this.bed = this.solids.create(120, 196, 'bed'); this.bed.setDepth(196);
    this.solids.refresh();
    this.physics.add.collider(this.player, this.solids);
    this.slotV = SLOTS.map(s => ({
      box: this.add.rectangle(s.x, s.y, 44, 44).setStrokeStyle(2, 0xffffff, .55).setDepth(.4),
      em: this.add.text(s.x, s.y, '', { fontSize: s.kind === 'wall' ? '36px' : '44px' }).setOrigin(.5).setDepth(s.kind === 'wall' ? 5 : s.y)
    }));
    this.refreshSlots();
    hud();
  }

  refreshSlots() {
    SLOTS.forEach((s, i) => {
      const d = DECOR.find(x => x.id === S.placed[i]);
      this.slotV[i].em.setText(d ? d.e : ''); this.slotV[i].box.setVisible(!d);
    });
  }

  edge() {
    this.night.setAlpha(this.night.alpha * .25); // trong nhà sáng hơn
    if (this.player.y > this.H - 34 && this.player.x > 330 && this.player.x < 470) this.go('Farm');
  }

  look() {
    const px = this.player.x, py = this.player.y;
    if (Phaser.Math.Distance.Between(px, py, this.bed.x, this.bed.y) < 90) return { t:'bed' };
    let best = null, d = 999;
    SLOTS.forEach((s, i) => {
      const dd = Phaser.Math.Distance.Between(px, py, s.x, s.y);
      if (dd < (s.kind === 'wall' ? 85 : 62) && dd < d) { d = dd; best = { t:'slot', i }; }
    });
    return best;
  }

  label(c) {
    if (!c) return 'WASD / phím mũi tên: đi · E hoặc Space: hành động · đi xuống cửa để ra ngoài';
    if (c.t === 'bed') return 'E: ngủ trên giường 🛏️ — hồi đầy ⚡, sang ngày mới';
    const d = DECOR.find(x => x.id === S.placed[c.i]);
    return d ? `E: đổi hoặc cất ${d.e} ${d.en}` : (SLOTS[c.i].kind === 'wall' ? 'E: treo đồ lên tường 🖼️' : 'E: đặt đồ trang trí vào đây 🪑');
  }

  doAct(c) { if (c.t === 'bed') this.sleep(); else this.slot(c.i); }

  slot(i) {
    const sl = SLOTS[i], cur = DECOR.find(x => x.id === S.placed[i]);
    const avail = DECOR.filter(d => d.kind === sl.kind && (S.own[d.id] || 0) - placedCount(d.id) > 0);
    const btns = avail.map(d => ({ label: `${d.e} ${d.en}`, fn: () => {
      S.placed[i] = d.id; save(); this.refreshSlots(); closeModal(); snd('place'); toast(`${d.en} = ${d.vi}`);
    } }));
    if (cur) btns.push({ label:'📦 Cất đồ này đi', fn: () => { delete S.placed[i]; save(); this.refreshSlots(); closeModal(); toast('Đã cất ' + cur.en); } });
    btns.push({ label:'Đóng', fn:closeModal });
    modal(sl.kind === 'wall' ? 'Tường 🖼️' : 'Sàn nhà 🪑',
      (cur ? `Đang bày: ${cur.e} <b>${cur.en}</b> (${cur.vi})<br>` : '') +
      (avail.length ? 'Chọn món để bày:' : 'Chưa có món phù hợp. Hãy mua ở <b>Decor Shop</b> trong thị trấn nhé!'), btns);
  }

  sleep() {
    const n = Object.keys(S.placed).length, cozy = Math.min(3, Math.floor(n / 3)) * 2, nb = binCount();
    modal('Đi ngủ 🛏️', '<b>“Good night!”</b> (Chúc ngủ ngon!)<br>Cây đã tưới sẽ lớn thêm một ngày, và bạn được hồi đầy ⚡ stamina.' +
      (nb ? `<br>📦 Thùng bán hàng có ${nb} món (~${binValue()} 🪙) — sáng mai tiền sẽ vào ví.` : '<br><small>📦 Thùng bán hàng đang trống.</small>') +
      (cozy ? `<br>🛋️ Nhà ấm cúng: +${cozy} EXP` : '<br><small>Bày từ 3 món đồ trang trí để nhận thêm EXP khi ngủ.</small>'), [
      { label:'Ngủ 🌙', fn:() => {
        closeModal(); this.leaving = true; snd('sleep');
        const cam = this.cameras.main; cam.fadeOut(500);
        cam.once('camerafadeoutcomplete', () => sleepSummary(this, { cozy }));
      } },
      { label:'Hủy', fn:closeModal }
    ]);
  }
}

let game;
const startGame = () => { game = new Phaser.Game({
  type: Phaser.AUTO, parent: 'game-container', pixelArt: true, backgroundColor: '#1d2b19',
  render: { pixelArt: true, antialias: false, roundPixels: false },   // không làm tròn pixel → di chuyển mượt
  scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' }, // lấp đầy khung, không còn viền
  physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false, fps: 240 } }, // bước vật lý nhỏ → hết giật
  scene: [Boot, Farm, Town, Forest, Lake, Home]
}); };
const loadImg = (key, src) => new Promise(r => { const i = new Image(); i.onload = () => { IMG[key] = i; r(); }; i.onerror = r; i.src = src; });
Promise.all(['tiles', 'crops', 'hero', 'shop', 'bushG', 'bushF'].map(k => loadImg(k, window.ASSETS[k]))
  .concat(Object.keys(window.ASSETS.bld || {}).map(k => loadImg('b_' + k, window.ASSETS.bld[k])))
  .concat(Object.keys(SPR).map(k => loadImg('s_' + k, SPR[k])))).then(() => { startGame(); uiSkin(); });

// icon pixel-art cho thanh HUD (stamina, EXP, túi, bản đồ)
function uiSkin() {
  const ms = document.querySelectorAll('#farm-app .meter > span'), put = (el, k) => { if (el && SPR[k]) el.innerHTML = spImg(k, 20); };
  put(ms[0], 'ui_bolt'); put(ms[1], 'ui_exp');
  if (SPR.ui_bag) $('#bagBtn').innerHTML = spImg('ui_bag', 20) + ' Túi';
  if (SPR.ui_map) $('#mapBtn').innerHTML = spImg('ui_map', 20) + ' Bản đồ';
  storyCheck();
}
$('#bookBtn').onclick = () => { if (!open) { snd('click'); wordBook(); } };
$('#bagBtn').onclick = () => { if (!open) bag(); };
$('#questBtn').onclick = () => { if (!open) questLog(); };
$('#mapBtn').onclick = () => { if (!open) worldMap(); };
$('#minimap').onclick = () => { MM.big = !MM.big; };
const sndLabel = () => { $('#sndBtn').textContent = AU.on ? '🔊' : '🔇'; };
$('#sndBtn').onclick = () => { AU.on = !AU.on; try { localStorage.setItem('efSound', AU.on ? '1' : '0'); } catch (e) {} sndLabel(); if (AU.on) { snd('select'); startMusic(); } };
sndLabel();
// trình duyệt chỉ cho phát âm thanh sau lần tương tác đầu tiên
const unlockAudio = () => { au(); startMusic(); };
window.addEventListener('pointerdown', unlockAudio, { once:true });
window.addEventListener('keydown', unlockAudio, { once:true });
$('#actBtn').onclick = () => { const s = activeScene(); if (s && s.act) s.act(); };
window.addEventListener('keydown', e => {
  if (e.key === 'Escape' && open && !CINE.on) closeModal();
  const n = parseInt(e.key, 10), o = owned();
  if (!open && n >= 1 && n <= o.length) { S.sel = o[n - 1]; snd('select'); hud(); save(); }
  if (!open && (e.key === '[' || e.key === ']') && o.length) { const k = o.length; S.sel = o[(Math.max(0, o.indexOf(S.sel)) + (e.key === ']' ? 1 : k - 1)) % k]; snd('select'); hud(); save(); }
  if (!open && (e.key === 'm' || e.key === 'M')) MM.big = !MM.big;
  if (!open && (e.key === 'q' || e.key === 'Q')) questLog();
  if (!open && (e.key === 'b' || e.key === 'B' || e.key === 'i' || e.key === 'I')) bag();
});
hud();
requestAnimationFrame(fxLoop);
})();
