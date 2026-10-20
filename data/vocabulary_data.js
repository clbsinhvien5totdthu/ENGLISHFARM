// ====== DỮ LIỆU TỪ VỰNG THEO CHỦ ĐỀ (A2 + gắn nhãn B1/B2 cho vocab.js) ======
// Mỗi dòng: 'từ|nghĩa|loại từ|câu ví dụ ({} = chỗ trống)|chủ đề|CEFR (mặc định A2)|collocations (ngăn bởi ;)'
// Thêm từ mới: thêm 1 dòng vào WORDS. Từ khóa mỗi chương khớp Design Bible.
(() => {
const EF = (window.EF = window.EF || {});
const POS = { v:'verb', n:'noun', a:'adj', d:'adv' };
const TOPICS = {
  basic:'Giao tiếp cơ bản', farm:'Nông trại', flowers:'Hoa & mô tả', market:'Chợ & số tiền', water:'Sông nước & cá',
  nature:'Thiên nhiên', food:'Ẩm thực', community:'Cộng đồng & chỉ đường', present:'Thuyết trình', general:'Từ vựng chung'
};
const WORDS = [
// --- Prologue: giao tiếp cơ bản ---
'introduce|giới thiệu|v|Let me {} myself. My name is Lan.|basic',
'library|thư viện|n|Is the {} next to the canteen?|basic',
'straight|thẳng|d|Go {} and then turn left.|basic|A2|go straight',
'left|bên trái|a|Turn {} at the corner.|basic',
'right|bên phải|a|The shop is on your {}.|basic',
'corner|góc đường|n|The cafe is on the {}.|basic',
'excuse|xin lỗi (để hỏi nhờ)|v|{} me, where is the station?|basic|A2|excuse me',
'near|gần|a|My house is {} the river.|basic',
'welcome|chào đón|v|We {} you to our farm.|basic',
'repeat|nhắc lại|v|Could you {} that, please?|basic|A2|repeat the question',
'understand|hiểu|v|I do not {} this word.|basic',
'slowly|chậm rãi|d|Please speak more {}.|basic',
// --- Chương 1: farming & daily life ---
'seed|hạt giống|n|Plant one {} in the soil.|farm|A2|plant a seed',
'soil|đất|n|The {} is soft and dark.|farm|A2|rich soil',
'water|tưới nước|v|I {} the plants every morning.|farm|A2|water the crops',
'plant|trồng|v|We {} carrots in spring.|farm|A2|plant seeds',
'harvest|thu hoạch|v|Farmers {} rice in the autumn.|farm|A2|harvest crops; harvest rice',
'basket|cái giỏ|n|She put the tomatoes in a {}.|farm',
'fresh|tươi|a|These vegetables are very {}.|farm|A2|fresh vegetables',
'grow|mọc, trồng|v|Beans {} quickly in warm weather.|farm|A2|grow vegetables',
'field|cánh đồng|n|The cows are in the {}.|farm',
'farmer|nông dân|n|My grandfather was a {}.|farm',
// --- Chương 2: hoa ---
'petal|cánh hoa|n|A rose has soft red {}.|flowers',
'stem|thân cây|n|Cut the {} below the flower.|flowers',
'bloom|nở hoa|v|Lotus flowers {} in summer.|flowers|A2|come into bloom',
'fragrance|hương thơm|n|I love the {} of jasmine.|flowers|B1',
'colourful|nhiều màu sắc|a|The garden is bright and {}.|flowers',
'delicate|mỏng manh|a|The petals are very {}.|flowers|B1',
'nursery|vườn ươm|n|We bought young plants at the {}.|flowers|A2|plant nursery',
'care|chăm sóc|v|Please {} for the flowers every day.|flowers|A2|care for plants',
'describe|mô tả|v|Can you {} this flower for me?|flowers|A2|describe a picture',
// --- Chương 3: chợ ---
'price|giá|n|What is the {} of this fish?|market',
'cheap|rẻ|a|The bananas are {} today.|market',
'expensive|đắt|a|That basket is too {} for me.|market',
'customer|khách hàng|n|The {} wants two kilos of rice.|market',
'quantity|số lượng|n|What {} do you need?|market|B1',
'purchase|mua|v|You can {} tickets at the gate.|market|B1',
'sell|bán|v|They {} fresh fruit at the market.|market',
'change|tiền thừa|n|Here is your {}, thank you.|market|A2|keep the change',
'discount|giảm giá|n|Buy two and get a {}.|market|A2|give a discount',
'receipt|hóa đơn|n|Please keep the {} for the shop.|market',
// --- Chương 4: sông nước & cá ---
'river|dòng sông|n|The boat moves slowly down the {}.|water',
'current|dòng chảy|n|The {} is strong after the rain.|water|B1',
'surface|mặt nước|n|A small fish jumped to the {}.|water',
'deep|sâu|a|The lake is very {} here.|water',
'shallow|nông|a|Children can play in the {} water.|water|B1',
'scale|vảy cá|n|A silver {} shines on its body.|water',
'fin|vây cá|n|The fish moves its {} to turn.|water',
'swim|bơi|v|Fish {} in groups.|water',
'observe|quan sát|v|Please {} the fish before you write.|water|B1|observe carefully',
// --- Chương 5: thiên nhiên ---
'wetland|vùng đất ngập nước|n|Many birds live in the {}.|nature|B1',
'wildlife|động vật hoang dã|n|The park protects local {}.|nature|B1',
'habitat|môi trường sống|n|A forest is a home and {} for animals.|nature|B1',
'protect|bảo vệ|v|We must {} the wetlands.|nature|A2|protect nature',
'pollution|ô nhiễm|n|{} makes the water dirty.|nature|B1',
'survive|sống sót|v|Plants need water to {}.|nature|B1',
'environment|môi trường|n|Planting trees helps the {}.|nature|B1',
'climate|khí hậu|n|The {} here is hot and wet.|nature|B1',
'conservation|bảo tồn|n|{} keeps rare birds safe.|nature|B2',
// --- Chương 6: ẩm thực ---
'ingredient|nguyên liệu|n|Fish is the main {} of this soup.|food',
'recipe|công thức nấu ăn|n|Grandpa kept an old {}.|food|A2|a family recipe',
'boil|luộc, đun sôi|v|{} the water before you add rice.|food',
'fry|chiên|v|I {} the fish with a little oil.|food',
'steam|hấp|v|We {} the buns for ten minutes.|food',
'taste|nếm, vị|v|Please {} the soup.|food|A2|taste good',
'sour|chua|a|This soup is a little {}.|food',
'sweet|ngọt|a|The mango is very {}.|food',
'spicy|cay|a|I do not like {} food.|food',
'recommend|giới thiệu, gợi ý|v|What do you {} for dinner?|food|A2|I recommend',
// --- Chương 7: cộng đồng & chỉ đường ---
'direction|hướng|n|Which {} is the market?|community',
'visitor|khách tham quan|n|The {} asked for a map.|community',
'community|cộng đồng|n|Our {} cleans the river together.|community|B1',
'memory|kỷ niệm, ký ức|n|This photo is a happy {}.|community',
'neighbour|hàng xóm|n|My {} gave me some mangoes.|community',
'tradition|truyền thống|n|Sharing food is a village {}.|community|B1',
'proud|tự hào|a|I am {} of our village.|community',
'share|chia sẻ|v|Please {} your story with us.|community|A2|share a story',
'lost|bị lạc|a|The visitor is {} and needs help.|community',
'friendly|thân thiện|a|The people here are very {}.|community',
// --- Chương 8: thuyết trình ---
'audience|khán giả|n|The {} listened carefully.|present',
'explain|giải thích|v|Can you {} how this works?|present|A2|explain clearly',
'story|câu chuyện|n|Tell me a {} about your village.|present',
'confident|tự tin|a|She feels {} when she speaks English.|present|B1',
'guide|dẫn đường, hướng dẫn|v|I will {} you around the garden.|present|A2|guide visitors',
'local|địa phương|a|We eat {} food on festival days.|present',
'experience|trải nghiệm|n|The boat trip was a great {}.|present',
'opinion|ý kiến|n|In my {}, the lake is beautiful.|present|B1',
'festival|lễ hội|n|The {} starts at the village hall.|present',
'journey|hành trình|n|The {} to the market is short.|present'
];
const A2 = WORDS.map((r, i) => { const p = r.split('|'); const w = { id:'a2_' + i, en:p[0], vi:p[1], pos:POS[p[2]], ex:p[3], topic:p[4], cefr:p[5] || 'A2', col:p[6] ? p[6].split(';') : [] };
  w.pat = w.ex.replace('{}', w.en); return w; });
const V = window.VOCAB = window.VOCAB || { B1:[], B2:[] };
(['B1', 'B2']).forEach(lv => V[lv].forEach(w => { w.cefr = lv; w.topic = w.topic || 'general'; w.col = w.col || []; }));
V.A2 = A2;
EF.TOPICS = TOPICS;
EF.vocabAll = () => [].concat(V.A2, V.B1, V.B2);
EF.vocabByEn = (() => { let m = null; return en => { if (!m) { m = {}; EF.vocabAll().forEach(w => { if (!m[w.en]) m[w.en] = w; }); } return m[en]; }; })();
EF.vocabByTopic = t => EF.vocabAll().filter(w => w.topic === t);
})();
