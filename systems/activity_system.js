// ====== ACTIVITY SYSTEM: các hoạt động nhỏ gắn với quest (hoa, chợ, order bếp, thư cũ, manh mối) ======
// Mỗi hoạt động chạy trên modal, ghi sự kiện cho QuestSystem và từ mới cho LanguageSystem.
(() => {
const EF = (window.EF = window.EF || {});
const A = EF.Act = {};
const H = () => EF.host, Q = () => EF.Quest;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
const pick = (a, n) => shuffle(a).slice(0, n);
A.seen = (list, src) => list.forEach(w => { if (EF.vocabByEn(w)) EF.Lang.seen(w, src); });

// Trắc nghiệm nhiều vòng. rounds: [{ prompt, opts:[{t, ok}], why }] · cb: { onOk(round, firstTry), onDone({first,total}) }
A.mcq = (title, rounds, cb, back) => {
  const st = { first:0, total:rounds.length };
  const ask = i => {
    if (i >= rounds.length) { return cb.onDone ? cb.onDone(st) : H().closeModal(); }
    const r = rounds[i]; let tried = false;
    H().modal(`${title} · ${i + 1}/${rounds.length}`, r.prompt, shuffle(r.opts).map(o => ({ html:o.t, fn:el => {
      if (!o.ok) { tried = true; H().snd('wrong'); el.disabled = true; return reAsk(i, r, tried); }
      H().snd('ok'); if (!tried) st.first++;
      if (cb.onOk) cb.onOk(r, !tried, i);
      if (r.why) H().modal('Chính xác! ✨', r.why, [{ label:i + 1 < rounds.length ? 'Tiếp ➜' : 'Xong', fn:() => ask(i + 1) }]); else ask(i + 1);
    } })).concat(back ? [{ label:'Thoát', fn:back }] : []));
  };
  const reAsk = (i, r, tried) => { // hiển thị lại câu hỏi, khóa các đáp án sai đã thử
    r._bad = (r._bad || 0) + 1;
    H().modal(`${title} · ${i + 1}/${rounds.length}`, r.prompt + '<br><em>Chưa đúng, thử lại nhé!</em>', shuffle(r.opts).map(o => ({ html:o.t, fn:el => {
      if (!o.ok) { H().snd('wrong'); el.disabled = true; return; }
      H().snd('ok'); if (cb.onOk) cb.onOk(r, false, i);
      if (r.why) H().modal('Chính xác! ✨', r.why, [{ label:i + 1 < rounds.length ? 'Tiếp ➜' : 'Xong', fn:() => ask(i + 1) }]); else ask(i + 1);
    } })).concat(back ? [{ label:'Thoát', fn:back }] : []));
  };
  ask(0);
};
const done = (msg, again, back) => H().modal('Hoàn thành 🌟', msg, [].concat(again ? [{ label:'Chơi tiếp 🔁', fn:again }] : [], [{ label:'Xong', fn:() => { H().closeModal(); if (back) back(); } }]));

// ---------- Chương 2: hoa ----------
const FLOWERS = [
  ['Rose', '🌹', 'a red flower with thorns and a sweet smell'], ['Tulip', '🌷', 'a cup-shaped spring flower'], ['Sunflower', '🌻', 'a tall yellow flower that follows the sun'],
  ['Daisy', '🌼', 'small white petals and a yellow centre'], ['Blossom', '🌸', 'soft pink flowers on a tree in spring'], ['Lotus', '🪷', 'a pink water flower of the pond'],
  ['Hibiscus', '🌺', 'a big, bright tropical flower'], ['Lavender', '🪻', 'small purple flowers with a calm smell'], ['Marigold', '🏵️', 'a round orange-yellow festival flower'],
  ['Bouquet', '💐', 'flowers tied together as a gift'], ['Jasmine', '💮', 'small white flowers used in tea'], ['Orchid', '🌿', 'a rare, elegant flower often kept in pots']
];
A.flowerList = back => {
  const todo = FLOWERS.filter(f => !(Q().host.S().story.sets['interact:flower_id'] || []).includes(f[0]));
  if (!todo.length) return done('Bạn đã nhận diện cả 12 loài hoa! 🌸', null, back);
  const rounds = pick(todo, 6).map(f => ({ prompt:`<div class="big">${f[1]}</div><b>“What is this flower? It is ${f[2]}.”</b>`, opts:[{ t:f[0], ok:true }].concat(pick(FLOWERS.filter(x => x !== f), 2).map(x => ({ t:x[0], ok:false }))), why:`<b>${f[0]}</b> — ${f[2]}.`, f }));
  A.mcq('🌸 The Flower List', rounds, { onOk:r => { Q().emit('interact', { tag:'flower_id', id:r.f[0] }); EF.Lang.answer('describe', 'recog', true, 'flowers'); }, onDone:() => done('Làm tốt lắm! Bạn đã nhận diện thêm hoa. 🌸', () => A.flowerList(back), back) }, back);
};
A.nameBeds = back => {
  const got = Q().host.S().story.sets['interact:bed_sign'] || [], todo = FLOWERS.filter(f => !got.includes(f[0]));
  if (!todo.length) return done('Cả 12 luống đều đã có bảng tên! 🪧', null, back);
  const rounds = pick(todo, 6).map(f => ({ prompt:`<b>“Please put the sign for the <u>${f[0]}</u> on the right bed.”</b><br><small>Chọn luống có đúng loài hoa.</small>`, opts:[{ t:`<span class="big">${f[1]}</span>`, ok:true }].concat(pick(FLOWERS.filter(x => x !== f && x[1] !== f[1]), 2).map(x => ({ t:`<span class="big">${x[1]}</span>`, ok:false }))), why:`🪧 <b>${f[0]}</b> — bảng tên đã đặt đúng luống.`, f }));
  A.mcq('🪧 Name Every Bed', rounds, { onOk:r => Q().emit('interact', { tag:'bed_sign', id:r.f[0] }), onDone:() => done('Bảng tên đã được đặt xong đợt này! 🪧', () => A.nameBeds(back), back) }, back);
};

// ---------- Chương 3: chợ ----------
const PRODUCE = [ // [tên, emoji, màu, loại, mức giá]
  ['carrot', '🥕', 'orange', 'vegetable', 'cheap'], ['banana', '🍌', 'yellow', 'fruit', 'cheap'], ['tomato', '🍅', 'red', 'fruit', 'cheap'], ['pineapple', '🍍', 'yellow', 'fruit', 'expensive'],
  ['grape', '🍇', 'purple', 'fruit', 'expensive'], ['broccoli', '🥦', 'green', 'vegetable', 'cheap'], ['corn', '🌽', 'yellow', 'vegetable', 'cheap'], ['eggplant', '🍆', 'purple', 'vegetable', 'expensive'],
  ['strawberry', '🍓', 'red', 'fruit', 'expensive'], ['cucumber', '🥒', 'green', 'vegetable', 'cheap'], ['lemon', '🍋', 'yellow', 'fruit', 'cheap'], ['chili', '🌶️', 'red', 'vegetable', 'expensive']
];
const num = ['one', 'two', 'three', 'four', 'five'];
A.market = back => H().modal('🧺 Riverside Market', '<b>“Welcome! Which job do you want to try today?”</b><br>Mia cần người giúp ở quầy.<br><small>⭐ Mỗi vòng đúng là 1 giao dịch (+2 🪙).</small>', [
  { label:'💰 How Much Is It? (giá)', fn:() => A.trade('price', back) }, { label:'🧺 The Right Basket (giỏ hàng)', fn:() => A.trade('basket', back) },
  { label:'📦 Market Helper (phân loại)', fn:() => A.trade('sort', back) }, { label:'Quay lại', fn:() => { H().closeModal(); if (back) back(); } }]);
A.trade = (mode, back) => {
  A.seen(['price', 'cheap', 'expensive', 'customer', 'quantity', 'sell', 'change'], 'market');
  const rounds = [];
  for (let i = 0; i < 5; i++) {
    if (mode === 'price') {
      const p = pick(PRODUCE, 1)[0], u = 2 + Math.floor(Math.random() * 6), n = 2 + Math.floor(Math.random() * 3), t = u * n;
      const wrong = shuffle([t + u, Math.max(1, t - u), t + 2]).filter(x => x !== t).slice(0, 2);
      rounds.push({ prompt:`<div class="big">${p[1]}</div><b>Sign: “${p[0]}s — ${u} coins each.”</b><br><b>Customer: “How much are ${num[n - 1]} ${p[0]}s, please?”</b>`, opts:[{ t:`That is ${t} coins.`, ok:true }].concat(wrong.map(x => ({ t:`That is ${x} coins.`, ok:false }))), why:`${n} × ${u} = <b>${t}</b> coins.` });
    } else if (mode === 'basket') {
      const kinds = [['color', 2], ['kind', 3], ['price', 4]], [k1, k2] = pick(kinds, 2), a = pick(PRODUCE, 1)[0];
      const word = (key, it) => it[key === 'color' ? 2 : key === 'kind' ? 3 : 4];
      const others = PRODUCE.filter(x => x !== a && (word(k1, x) !== word(k1, a) || word(k2, x) !== word(k2, a)));
      const bad = pick(others.filter(x => word(k1, x) !== word(k1, a) && word(k2, x) !== word(k2, a)).concat(others), 2);
      rounds.push({ prompt:`<b>Customer: “I would like something ${word(k1, a)} and ${word(k2, a)}, please.”</b><br><small>Chọn sản phẩm đúng cả hai điều kiện.</small>`, opts:[{ t:`<span class="big">${a[1]}</span> ${a[0]}`, ok:true }].concat(bad.map(x => ({ t:`<span class="big">${x[1]}</span> ${x[0]}`, ok:false }))), why:`<b>${a[0]}</b> is ${a[2]}, ${a[3]} and ${a[4]}.` });
    } else {
      const p = pick(PRODUCE, 1)[0];
      rounds.push({ prompt:`<div class="big">${p[1]}</div><b>Mia: “Is a ${p[0]} a fruit or a vegetable?”</b>`, opts:[{ t:'A fruit', ok:p[3] === 'fruit' }, { t:'A vegetable', ok:p[3] === 'vegetable' }], why:`A ${p[0]} is a <b>${p[3]}</b>.` });
    }
  }
  A.mcq('🧺 Market · ' + ({ price:'How Much', basket:'Right Basket', sort:'Sort' }[mode]), rounds, { onOk:() => { Q().emit('trade', { mode }); const S = H().S(); S.coins += 2; H().hud(); }, onDone:st => done(`Đúng ngay lần đầu: <b>${st.first}/${st.total}</b>. 🧺 +${st.total * 2} 🪙`, () => A.trade(mode, back), () => A.market(back)) }, () => A.market(back));
};
// Mia: hộp gỗ có mảnh bản đồ (cần đủ 15 giao dịch)
A.woodenBox = back => {
  const S = H().S();
  if ((S.story.stats.trade || 0) < 15) return H().modal('📦 Wooden Box', 'Chiếc hộp gỗ khóa chặt. Mia nói: <b>“Help 15 customers first, then we can open it.”</b><br><small>Giao dịch hiện tại: ' + (S.story.stats.trade || 0) + '/15</small>', [{ label:'OK', fn:() => { H().closeModal(); if (back) back(); } }]);
  A.clue('map_fragment', '📦 Chiếc hộp gỗ mở ra. Bên trong là một mảnh bản đồ cũ, có ngôi sao đánh dấu <b>Moon Lake</b>.', back);
};

// ---------- Manh mối dùng chung ----------
A.clue = (id, intro, back) => {
  const c = EF.CLUES[id], first = Q().clue(id);
  H().snd('levelup');
  H().modal('📖 ' + c.title, `${intro ? intro + '<br><br>' : ''}<div class="sent">“${esc(c.en)}”</div>${c.vi}${first ? '<br><small>🗝️ Manh mối mới đã vào Nhật ký!</small>' : ''}`, [{ label:'OK', fn:() => { H().closeModal(); if (back) back(); } }]);
};
A.oldLetter = () => { // hộp thư nông trại, chương 1
  Q().emit('interact', { tag:'old_letter', id:'old_letter' });
  A.clue('page_01', 'Trong hộp thư cũ có một mảnh giấy vẽ <b>chiếc lá</b>, bên dưới ghi “Page 01”.');
};

// ---------- Chương 6: bếp ----------
const DISHES = [
  { n:'sour fish soup', ing:['fish', 'tomato', 'herbs'], vi:'canh chua cá' }, { n:'fried rice', ing:['rice', 'egg', 'onion'], vi:'cơm chiên' },
  { n:'steamed buns', ing:['flour', 'sugar', 'pork'], vi:'bánh bao hấp' }, { n:'lotus salad', ing:['lotus', 'carrot', 'lime'], vi:'gỏi ngó sen' }
];
const ALLING = ['fish', 'tomato', 'herbs', 'rice', 'egg', 'onion', 'flour', 'sugar', 'pork', 'lotus', 'carrot', 'lime', 'banana', 'chili'];
A.ingredients = back => {
  A.seen(['ingredient', 'recipe', 'boil', 'fry', 'steam'], 'kitchen');
  const rounds = pick(DISHES, 3).map(d => { const need = d.ing[Math.floor(Math.random() * 3)]; return { prompt:`<b>Chef Bo: “We are making <u>${d.n}</u> (${d.vi}). Which ingredient do we need?”</b>`, opts:[{ t:need, ok:true }].concat(pick(ALLING.filter(x => !d.ing.includes(x)), 2).map(x => ({ t:x, ok:false }))), why:`${d.n}: ${d.ing.join(', ')}.` }; });
  A.mcq('🧂 Prepare the Ingredients', rounds, { onDone:() => { Q().emit('interact', { tag:'ingredients', id:'ingredients' }); done('Nguyên liệu đã sẵn sàng! 🧂', null, back); } }, back);
};
A.orders = back => {
  A.seen(['recipe', 'taste', 'spicy', 'recommend'], 'kitchen');
  const S = H().S(), rounds = [];
  for (let i = 0; i < 3; i++) {
    const d = pick(DISHES, 1)[0], k = Math.floor(Math.random() * 3), n = 1 + Math.floor(Math.random() * 2), x = pick(d.ing, 1)[0];
    const id = 'ord' + ((S.story.stats.orderN = (S.story.stats.orderN || 0) + 1));
    let say, right, bad1, bad2;
    if (k === 0) { say = `I would like ${num[n - 1]} ${d.n}, please.`; right = `So, ${num[n - 1]} ${d.n}. Is that right?`; bad1 = `So, ${num[n % 4 + 1]} ${d.n}. Is that right?`; bad2 = `So, ${num[n - 1]} fruit salad. Is that right?`; }
    else if (k === 1) { say = `One ${d.n}, but no ${x}, please.`; right = `One ${d.n} without ${x}. Is that right?`; bad1 = `One ${d.n} with extra ${x}. Is that right?`; bad2 = `Two ${d.n} without ${x}. Is that right?`; }
    else { say = `One ${d.n}, please. Oh, sorry — make it spicy!`; right = `One ${d.n}, spicy. Is that right?`; bad1 = `One ${d.n}, sweet. Is that right?`; bad2 = `One ${d.n}, cold. Is that right?`; }
    rounds.push({ prompt:`<b>Guest: “${say}”</b><br><small>Chọn câu nhắc lại đúng để xác nhận order.</small>`, opts:[{ t:right, ok:true }, { t:bad1, ok:false }, { t:bad2, ok:false }], why:'✔ Nhắc lại đúng yêu cầu: <b>' + right + '</b>', id });
  }
  A.mcq('🍲 Take the Order', rounds, { onOk:(r, first) => { Q().emit('interact', { tag:'order', id:r.id }); if (first) Q().emit('interact', { tag:'confirm_ok', id:r.id }); H().S().coins += 3; H().hud(); }, onDone:st => done(`Xác nhận đúng ngay lần đầu: <b>${st.first}/${st.total}</b> 🍲 (+${st.total * 3} 🪙)`, () => A.orders(back), back) }, back);
};

// ---------- Chương 7: thư cũ ----------
const LETTERS = [
  { id:'L1', text:'Dear Moss, I am sending you Page 05. Please add the story of the wetlands. — Your friend', q:'What does the writer want Moss to do?', ok:'Add a story about the wetlands.', bad:['Buy a new book.', 'Close the library.'] },
  { id:'L2', text:'Dear Hai, the river taught us patience. Please write what you see in the water. — Your friend', q:'What should Hai write about?', ok:'What he sees in the water.', bad:['The price of fish.', 'A song about rain.'] },
  { id:'L3', text:'Dear all, I hope our young friends will tell our home to the world, in English. — Grandpa', q:'Why did Grandpa send the pages?', ok:'He wants young people to share their home in English.', bad:['He lost the pages by accident.', 'He wants to sell the book.'] }
];
A.letters = back => {
  const got = Q().host.S().story.sets['interact:letters'] || [], todo = LETTERS.filter(l => !got.includes(l.id));
  if (!todo.length) return A.pagesFound(back);
  const rounds = todo.map(l => ({ prompt:`<div class="sent">✉️ ${esc(l.text)}</div><b>${l.q}</b>`, opts:[{ t:l.ok, ok:true }].concat(l.bad.map(b => ({ t:b, ok:false }))), why:'✉️ Bức thư đã được ghép vào hồ sơ.', l }));
  A.mcq('✉️ The Old Letters', rounds, { onOk:r => Q().emit('interact', { tag:'letters', id:r.l.id }), onDone:() => A.pagesFound(back) }, back);
};
A.pagesFound = back => {
  if ((Q().host.S().story.sets['interact:letters'] || []).length < 3) return done('Cần đọc đủ 3 lá thư.', null, back);
  A.clue('pages_found', 'Ba lá thư ghép lại thành một bức tranh: <b>những trang nhật ký không hề bị đánh cắp</b>.', back);
};

// ---------- Cảnh ảnh cũ / công thức cũ ----------
A.photo = back => A.clue('photo', 'Trong hộp ảnh có một tấm ảnh cũ: <b>Grandpa cùng những người bạn</b> đứng trước vườn hoa. Mặt sau có dòng chữ viết tay.', back);
A.recipe = back => A.clue('recipe', 'Dưới đáy hộp bếp, Chef Bo tìm thấy <b>công thức cũ của Grandpa</b>, dòng cuối được gạch chân.', back);
})();
