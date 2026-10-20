// ====== SỔ VƯỜN TỪ · NHẬT KÝ · NHIỆM VỤ · TIẾN TRÌNH (UI) ======
(() => {
const EF = (window.EF = window.EF || {});
const U = EF.UI = EF.UI || {};
const H = () => EF.host;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
const bar = p => `<span class="pbar"><i style="width:${Math.round(Math.max(0, Math.min(1, p)) * 100)}%"></i></span>`;
const filt = { topic:'all', stage:'all' };

// ---- Sổ Vườn Từ: lọc theo chủ đề và trạng thái Hạt/Mầm/Quả ----
U.vocabBook = () => {
  const L = EF.Lang, c = L.counts();
  let words = EF.vocabAll().filter(w => L.rec(w.en));
  if (filt.topic !== 'all') words = words.filter(w => w.topic === filt.topic);
  if (filt.stage !== 'all') words = words.filter(w => L.stageOf(w.en) === filt.stage);
  const tops = ['all'].concat(Object.keys(EF.TOPICS));
  const rows = words.sort((a, b) => L.rec(b.en).st - L.rec(a.en).st).map(w => { const r = L.rec(w.en), s = L.stageOf(w.en);
    return `<li>${L.STAGE_VI[s].split(' ')[0]} <span class="tag ${w.cefr === 'B2' ? 'b2' : ''}">${w.cefr}</span> <b>${esc(w.en)}</b> — ${esc(w.vi)} <small>✓${r.c} ✗${r.w}${L.isDue(w.en) ? ' · 🔁 cần ôn' : ''}</small></li>`; }).join('');
  const topicBtn = { label:'📂 Chủ đề: ' + (filt.topic === 'all' ? 'Tất cả' : EF.TOPICS[filt.topic]), fn:() => { filt.topic = tops[(tops.indexOf(filt.topic) + 1) % tops.length]; U.vocabBook(); } };
  const st = ['all', 'seed', 'sprout', 'fruit'];
  const stageBtn = { label:'🔎 Trạng thái: ' + (filt.stage === 'all' ? 'Tất cả' : L.STAGE_VI[filt.stage]), fn:() => { filt.stage = st[(st.indexOf(filt.stage) + 1) % st.length]; U.vocabBook(); } };
  H().modal('📖 Sổ Vườn Từ', `<b>🌰 ${c.seed} · 🌱 ${c.sprout} · 🍎 ${c.fruit}</b> <small>/ ${L.total()} từ · mốc mùa đầu: 500 từ (không giới hạn toàn game)</small>` +
    (rows ? `<ul class="book">${rows}</ul>` : '<p><small>Chưa có từ nào ở bộ lọc này. Hãy học với cô Emma 🎓 hoặc trò chuyện với dân làng.</small></p>') +
    '<p><small>🌰 Hạt: đã gặp · 🌱 Mầm: nhận diện đúng · 🍎 Quả: dùng đúng trong tình huống.</small></p>',
    [topicBtn, stageBtn, { label:'🌱 Cây trồng & đồ trang trí', fn:() => H().oldWordBook() }, { label:'📔 Nhật ký', fn:U.journal }, { label:'Đóng', fn:H().closeModal }], true);
};
// ---- Nhật ký: manh mối / trang nhật ký của Grandpa ----
U.journal = () => {
  const S = H().S(), got = S.story.clues || [], all = Object.keys(EF.CLUES);
  const li = all.map(id => { const c = EF.CLUES[id]; return got.indexOf(id) >= 0 ? `<li>📜 <b>${esc(c.title)}</b><div class="sent">“${esc(c.en)}”</div><small>${esc(c.vi)}</small></li>` : '<li class="lock">❔ ???</li>'; }).join('');
  const fw = (S.story.finalWords || []).map(w => `<li>✍️ “${esc(w)}”</li>`).join('');
  H().modal('📔 Nhật ký của Grandpa', `<b>Trang đã tìm: ${got.length}/${all.length}</b><ul class="book">${li}</ul>` + (fw ? `<b>Từ quan trọng nhất của bạn</b><ul class="book">${fw}</ul>` : '') + `<small>“${esc(EF.GRANDPA_QUOTE)}”</small>`,
    [{ label:'📊 Hồ sơ', fn:U.progress }, { label:'Đóng', fn:H().closeModal }]);
};
// ---- Quest log ----
U.questLog = () => {
  H().snd('click');
  const S = H().S(), St = EF.Story, Q = EF.Quest, ch = St.chapter();
  const quests = ch ? ch.quests.map(id => { const q = EF.QUESTS[id], d = Q.isDone(id), os = Q.objectives(id);
    return `<li>${d ? '✅' : '⬜'} <b>${esc(q.title)}</b>${bar(d ? 1 : Q.pct(id))}<br><small>${esc(q.hint)}</small>${d ? '' : '<br><small>' + os.map(o => `${esc(o.label)}: ${o.cur}/${o.target}`).join(' · ') + '</small>'}</li>`; }).join('') : '';
  const done = EF.CHAPTERS.slice(0, S.story.ch).map(c => `<li>✅ Chương ${c.no} · ${esc(c.title)}</li>`).join('');
  H().modal('📜 Nhiệm vụ', (ch ? `<b>Chương ${ch.no} · ${esc(ch.title)} ${ch.icon}</b><br><small>📍 ${esc(ch.where)} · nộp: ${esc(ch.who)} · chủ đề: ${esc(ch.theme)}</small>${Q.chapterReady(S.story.ch) ? '<p>❗ <b>Xong hết quest! Hãy gặp ' + esc(ch.who) + '.</b></p>' : ''}<ul class="sum quests">${quests}</ul>` :
    '<b>🏮 Bạn đã hoàn thành cốt truyện chính!</b><br>' + esc(EF.CLOSING)) + (done ? `<b>Đã hoàn thành</b><ul class="sum">${done}</ul>` : '') + ((S.story.unlocked || []).length ? `<small>🔓 ${S.story.unlocked.map(esc).join(' · ')}</small>` : ''),
    [{ label:'📔 Nhật ký', fn:U.journal }, { label:'Đóng', fn:H().closeModal }]);
};
// ---- Hồ sơ: nhân vật + tiến trình tiếng Anh (CEFR tách biệt với cấp game) ----
U.progress = () => {
  const S = H().S(), L = EF.Lang, c = L.counts(), sk = L.skills(), ch = S.character, prof = L.estimate();
  const stage = EF.STAGES.filter(s => S.story.ch >= s.ch).pop() || EF.STAGES[0];
  const pr = (EF.CHAR.pronouns.find(p => p.id === ch.appearance.pronouns) || {}).label || '';
  const names = { recog:'Nhận biết từ', use:'Dùng từ trong câu', dialogue:'Hội thoại', repair:'Hỏi lại / diễn đạt lại', lesson_B1:'Bài B1', lesson_B2:'Bài B2' };
  const rows = Object.keys(sk).map(k => `<li>${esc(names[k] || k)} ${bar(sk[k].pct / 100)} <small>${sk[k].pct}% (${sk[k].n})</small></li>`).join('');
  H().modal('📊 Hồ sơ của ' + esc(ch.name), `<b>${stage.en}</b><br><small>${esc(stage.vi)} · ${esc(pr)}</small><ul class="sum"><li>⭐ Cấp game: Lv ${S.lvl} <small>(không phải trình độ CEFR)</small></li><li>🗣️ Mức làm bài ước lượng: <b>${prof}</b> <small>(chỉ để chỉnh độ khó, không phải chứng chỉ)</small></li><li>🌰 ${c.seed} · 🌱 ${c.sprout} · 🍎 ${c.fruit} / ${L.total()} từ</li></ul>` + (rows ? `<b>Kỹ năng</b><ul class="sum">${rows}</ul>` : '<small>Chưa có dữ liệu kỹ năng.</small>'),
    [{ label:'🎨 Đổi ngoại hình', fn:() => EF.UI.characterCreator({ title:'Đổi ngoại hình 🎨', cancel:true }).then(ok => { if (ok) location.reload(); else U.progress(); }) }, { label:'Đóng', fn:H().closeModal }]);
};
})();
