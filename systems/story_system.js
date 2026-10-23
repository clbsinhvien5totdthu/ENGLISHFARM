// ====== STORY SYSTEM: chương, nộp nhiệm vụ, menu hoạt động của NPC ======
// S.story.ch = số chương đã hoàn thành (giữ nguyên ý nghĩa cũ để save cũ vẫn đọc được) · chapterId theo EF.CHAPTERS[ch]
(() => {
const EF = (window.EF = window.EF || {});
const St = EF.Story = { host:null };
const H = () => St.host, Q = () => EF.Quest;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
St.init = host => { St.host = host; };
St.index = () => H().S().story.ch;
St.chapter = () => EF.CHAPTERS[St.index()] || null;
St.finished = () => St.index() >= EF.CHAPTERS.length;
// mục tiêu hiện tại (dạng văn bản ngắn cho Nhiệm vụ)
St.goal = () => {
  const ch = St.chapter(); if (!ch) return '';
  const q = Q().nextTodo(St.index());
  if (!q) return 'Mọi quest đã xong! Hãy gặp: ' + ch.who;
  const Qd = EF.QUESTS[q], os = Q().objectives(q), o = os.find(x => !x.ok) || os[0];
  return `${Qd.title} — ${o.label} (${o.cur}/${o.target})`;
};
// đối tượng chương dưới dạng cũ (title, who, at, where, goal(), need(), done, reward) để game.js dùng lại
St.current = () => {
  const ch = St.chapter(); if (!ch) return null;
  return { title:`Chương ${ch.no} · ${ch.title} ${ch.icon}`, who:ch.who, at:ch.giver, where:ch.where, goal:St.goal, need:() => Q().chapterReady(St.index()), done:ch.done, reward:ch.reward, ch };
};
St.check = () => { Q().check(); };
// nộp nhiệm vụ nếu đủ điều kiện và đúng NPC/địa điểm
St.turnIn = key => {
  const c = St.current(); if (!c || c.at !== key || !c.need()) return false;
  const S = H().S(), ch = c.ch;
  H().talk(ch.done, () => {
    const r = ch.reward; S.coins += r.coins || 0;
    let seeds = ''; for (let i = 0; i < (r.seeds || 0); i++) seeds += H().sico(H().rewardSeed(), 20);
    S.story.completed = S.story.completed || []; S.story.completed.push(ch.id);
    S.story.unlocked = (S.story.unlocked || []).concat(r.unlock || []);
    S.story.ch++; H().save(); H().hud(); H().snd('coin');
    const nx = St.chapter();
    const body = `<b>${c.title}</b><br>+${r.coins || 0} 🪙 · +${r.exp || 0} EXP ${seeds}` + ((r.unlock || []).length ? `<br>🔓 Mở: ${r.unlock.join(', ')}` : '') +
      (nx ? `<br><br>📜 <b>Chương mới</b><br>Chương ${nx.no} · ${nx.title}<br><small>📍 ${nx.where} · gặp: ${nx.who}</small>` : '<br><br>🏮 Bạn đã hoàn thành cốt truyện chính!');
    H().modal('🎁 Hoàn thành!', body, [{ label:'OK 👍', fn:() => { H().closeModal(); H().gainExp(r.exp || 0); if (ch.finale) St.finale(); } }]);
  });
  return true;
};
// ----- Cảnh kết: Sam hỏi lại đường đến thư viện → Grandpa trao trang cuối → người chơi tự viết từ quan trọng nhất -----
St.finale = () => {
  EF.DialogueUI.run('sam_library_02', { showVi:false, onEnd:() => {
    H().talk([{ who:'📜 Grandpa', en:'You answered without fear. I am proud of you.', vi:'Cháu trả lời không chút sợ hãi. Ông tự hào về cháu.' },
      { who:'📜 Grandpa', en:EF.CLUES.final_page.en, vi:EF.CLUES.final_page.vi }], () => {
      Q().clue('final_page');
      H().modal('✍️ Trang cuối', `<b>“Now, tell them your story.”</b><br>Hãy viết <b>từ hoặc câu quan trọng nhất</b> với bạn (bằng tiếng Anh).<textarea id="efFinal" rows="3" maxlength="160" placeholder="My most important word is..."></textarea>`, [
        { label:'Lưu vào Sổ Vườn Từ 📖', fn:() => { const t = document.querySelector('#farm-app #efFinal'); const v = t ? t.value.trim() : ''; if (!v) return;
          const S = H().S(); S.story.finalWords = (S.story.finalWords || []).concat([v]); H().save(); H().closeModal();
          H().modal('🏮 Hết cốt truyện chính', `<div class="sent">“${esc(v)}”</div><b>${esc(EF.CLOSING)}</b><br><small>Bạn vẫn tiếp tục chơi tự do: nông trại, Sổ Vườn Từ và ôn tập luôn ở đây.</small>`, [{ label:'Tiếp tục chơi 🌾', fn:H().closeModal }]); } }]);
      const t = document.querySelector('#farm-app #efFinal'); if (t) { ['keydown', 'keyup', 'keypress'].forEach(k => t.addEventListener(k, e => e.stopPropagation())); t.focus(); }
    });
  } });
};
// ----- Menu hoạt động của từng NPC -----
const dlg = (id, back) => () => EF.DialogueUI.run(id, { onEnd:() => { if (back) back(); } });
const nextOf = (prefix, tag, n) => { const done = (H().S().story.sets['dialogue_success:' + tag] || []); for (let i = 1; i <= n; i++) if (done.indexOf(prefix + i) < 0) return prefix + i; return null; };
const ACT = {
  lily: [
    { ch:1, label:'🌸 The Flower List — nhận diện 12 loài hoa', run:b => EF.Act.flowerList(b) },
    { ch:1, label:'🪧 Name Every Bed — đặt 12 bảng tên', run:b => EF.Act.nameBeds(b) },
    { ch:1, label:'🗣️ Describe a Flower — giới thiệu một loài hoa (7 lượt)', run:b => dlg('lily_flower', b)() },
    { ch:1, label:'📷 The Photo Box — tìm bức ảnh cũ', run:b => EF.Act.photo(b), need:() => Q().isDone('flower_list') || (H().S().story.sets['interact:flower_id'] || []).length >= 6, lock:'Hãy nhận diện ít nhất 6 loài hoa trước.' }
  ],
  mia: [
    { ch:2, label:'🧺 Market — giúp quầy hàng (giá · giỏ · phân loại)', run:b => EF.Act.market(b) },
    { ch:2, label:'🛍️ Customer Request — bán hàng nhiều điều kiện (7 lượt)', run:b => dlg('mia_sell', b)() },
    { ch:2, label:'📦 The Wooden Box — mảnh bản đồ', run:b => EF.Act.woodenBox(b) }
  ],
  hai: [
    { ch:3, label:'🐟 Describe a Fish — mô tả trước, gọi tên sau (7 lượt)', run:b => dlg('hai_fish', b)() },
    { ch:3, label:'📓 The River Journal — ghi lại quan sát', run:b => dlg('river_journal', b)() },
    { ch:3, label:'🧭 The Map Mark — giải mã ký hiệu', run:b => dlg('missing_mark', b)(), need:() => Q().isDone('what_do_you_see'), lock:'Hoàn thành “Describe a Fish” trước.' }
  ],
  moss: [
    { ch:4, label:'📝 Nature Notes — mô tả vật chưa biết tên', run:b => dlg('moss_notes', b)() },
    { ch:4, label:'🌧️ Weather Alert — thông báo mưa, chỉ chỗ trú', run:b => dlg('moss_weather', b)() },
    { ch:4, label:'🌿 Protect the Wetlands — chọn phương án bảo vệ', run:b => dlg('moss_protect', b)() },
    { ch:4, label:'👴 The Old Friend — hỏi về Grandpa', run:b => dlg('moss_friend', b)() }
  ],
  chef: [
    { ch:5, label:'🧂 Prepare the Ingredients', run:b => EF.Act.ingredients(b) },
    { ch:5, label:'🍲 Take the Order — nhận & nhắc lại order', run:b => EF.Act.orders(b) },
    { ch:5, label:'🍜 What’s in This Dish? — giới thiệu món (6 lượt)', run:b => dlg('chef_dish', b)() },
    { ch:5, label:'📜 The Old Recipe — công thức của Grandpa', run:b => EF.Act.recipe(b), need:() => Q().isDone('whats_in_dish'), lock:'Giới thiệu món ăn xong trước nhé.' }
  ],
  pete: [
    { ch:6, label:'💬 English Corner — một cuộc trò chuyện mới', run:b => { const id = nextOf('corner_', 'english_corner', 3); if (!id) return EF.host.modal('English Corner', '<b>“Great job! Three conversations done.”</b>', [{ label:'OK', fn:b }]); dlg(id, b)(); } }
  ],
  daisy: [
    { ch:6, label:'🧳 Lost Visitors — dẫn đường cho khách', run:b => { const id = nextOf('visitor_', 'lost_visitor', 3); if (!id) return EF.host.modal('Daisy 🌸', '<b>“All visitors found their way. Thank you!”</b>', [{ label:'OK', fn:b }]); dlg(id, b)(); } }
  ],
  sam: [
    { ch:6, label:'🎒 Sam’s Question — kể về Đồng Tháp', run:b => dlg('sam_question', b)() }
  ],
  homes: [
    { ch:6, label:'✉️ The Old Letters — đọc và ghép thư cũ', run:b => EF.Act.letters(b) }
  ],
  dinh: [
    { ch:7, label:'👋 Welcome Station — chào đón khách', run:b => dlg('open_welcome', b)() },
    { ch:7, label:'🧺 Market Station — giới thiệu nông sản, món ăn, giá cả', run:b => dlg('open_market', b)() },
    { ch:7, label:'🌿 Garden Tour — dẫn khách tham quan', run:b => dlg('open_tour', b)() },
    { ch:7, label:'❓ The Unexpected Question — câu hỏi cuối cùng', run:b => dlg('open_final', b)(), need:() => ['welcome_station', 'market_station', 'garden_tour'].every(Q().isDone), lock:'Hoàn thành 3 trạm trước.' }
  ]
};
St.activities = npc => (ACT[npc] || []).filter(a => St.index() >= a.ch);
// mở menu NPC; nếu không có hoạt động cốt truyện thì chạy tương tác thường (fallback)
St.npcMenu = (npc, fallback, title) => {
  const acts = St.activities(npc);
  if (!acts.length || St.finished() && npc !== 'dinh' && npc !== 'sam') return fallback ? fallback() : null;
  const back = () => St.npcMenu(npc, fallback, title);
  const btns = acts.map(a => ({ label:a.label, off:false, fn:() => { if (a.need && !a.need()) { H().toast(a.lock || 'Chưa mở'); H().snd('error'); return; } a.run(back); } }));
  if (fallback) btns.push({ label:'💬 Trò chuyện thường', fn:() => { H().closeModal(); fallback(); } });
  btns.push({ label:'Đóng', fn:H().closeModal });
  const ch = St.chapter(), nm = EF.NPCS[npc] || { name:npc, icon:'💬', want:'' };
  H().modal(`${nm.icon} ${title || nm.name}`, `<b>“Hi! Can you help me today?”</b><span class="qchip">${ch ? '📌 Chương ' + ch.no + ' · ' + ch.title + '<em>' + St.goal() + '</em>' : 'Cốt truyện chính đã hoàn thành — bạn vẫn luyện tập tự do.'}</span>`, btns);
};
})();
// ----- Prologue: The Freeze → Sam hỏi đường → Emma trao Sổ Vườn Từ -----
(() => {
const EF = window.EF, St = EF.Story;
St.prologue = fin => {
  const H = St.host;
  H.talk(EF.PROLOGUE.freeze, () => EF.DialogueUI.run('sam_library_01', { showVi:true, onEnd:() => {
    EF.Quest.flag('prologue.sam_met'); EF.Quest.flag('prologue.done'); EF.Quest.clue('prologue');
    H.talk(EF.PROLOGUE.afterSam, () => { if (fin) fin(); });
  } }));
};
})();
