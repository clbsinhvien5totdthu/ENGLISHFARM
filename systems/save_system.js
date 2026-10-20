// ====== SAVE SYSTEM: giữ khóa englishFarmSave2, thêm version/character/story/language/relationships ======
// Quy tắc: sao lưu trước khi chuyển đổi · không ghi đè save cũ nếu lỗi · giữ toàn bộ dữ liệu nông trại
(() => {
const EF = (window.EF = window.EF || {});
const Sv = EF.Save = { VERSION:3 };
const NPC_IDS = ['emma', 'lily', 'mia', 'hai', 'moss', 'sam', 'grandpa'];
Sv.defaults = () => ({
  version:Sv.VERSION,
  character:{ name:'Gardener', appearance:{ pronouns:'they', outfit:0, hat:0, hair:0, acc:[] }, created:false },
  language:{ profile:'A2', words:{}, reviewQueue:[], skillScores:{} },
  relationships:NPC_IDS.reduce((o, k) => { o[k] = 0; return o; }, {})
});
const isObj = x => x && typeof x === 'object' && !Array.isArray(x);
// S: state đã gộp fresh()+old · old: dữ liệu đọc từ localStorage (hoặc null) · store: { get, set } để sao lưu
Sv.migrate = (S, old, store) => {
  const d = Sv.defaults();
  try {
    const oldVersion = old && old.version ? old.version : (old ? 2 : 0);
    if (old && oldVersion < Sv.VERSION && store) { try { store.set('englishFarmSave2.backup.v' + oldVersion, JSON.stringify(old)); } catch (e) {} }
    if (!isObj(S.character)) S.character = d.character;
    S.character.appearance = Object.assign({}, d.character.appearance, isObj(S.character.appearance) ? S.character.appearance : {});
    if (typeof S.character.name !== 'string' || !S.character.name) S.character.name = d.character.name;
    if (!isObj(S.language)) S.language = d.language;
    S.language.words = isObj(S.language.words) ? S.language.words : {};
    S.language.skillScores = isObj(S.language.skillScores) ? S.language.skillScores : {};
    S.language.reviewQueue = Array.isArray(S.language.reviewQueue) ? S.language.reviewQueue : [];
    S.language.profile = ['A2', 'B1', 'B2'].indexOf(S.language.profile) >= 0 ? S.language.profile : 'A2';
    S.relationships = Object.assign({}, d.relationships, isObj(S.relationships) ? S.relationships : {});
    const st = S.story = Object.assign({ ch:0, intro:false, nt:-1 }, isObj(S.story) ? S.story : {});
    st.cnt = Object.assign({ harvest:0, fish:0, forage:0 }, st.cnt || {});
    ['stats', 'sets', 'flags', 'questProgress'].forEach(k => { if (!isObj(st[k])) st[k] = {}; });
    ['clues', 'completed', 'unlocked', 'finalWords'].forEach(k => { if (!Array.isArray(st[k])) st[k] = []; });
    if (!old || oldVersion < Sv.VERSION) {
      // --- save cũ (v2): từ đã gặp → Hạt (KHÔNG tự đánh dấu thành thạo) ---
      Object.keys(S.words || {}).forEach(en => { if (!S.language.words[en] && S.words[en] > 0) S.language.words[en] = { st:0, c:0, w:0, use:0, lvl:0, due:S.day || 1, last:S.day || 1, first:S.day || 1, src:['legacy'] }; });
      if (old) {
        // 5 chương cũ → 8 chương mới: chương cũ k hoàn thành ≈ (k-1) chương mới (k ≥ 1); tiến độ đếm được giữ lại
        const k = Math.max(0, Math.min(5, st.ch | 0)); st.ch = Math.max(0, k - 1);
        st.stats.harvest = Math.max(st.stats.harvest || 0, st.cnt.harvest | 0);
        st.stats.forage = Math.max(st.stats.forage || 0, st.cnt.forage | 0);
        st.sets.harvestKinds = Object.keys(S.learned || {});
        st.sets.catch = Object.keys(S.fishDex || {}).filter(id => id !== 'boot');
        if (S.rod) st.sets['interact:rod'] = ['rod'];
        if (old.story && old.story.intro) { st.flags['prologue.done'] = 1; st.flags['prologue.skipped'] = 1; }
        for (let i = 0; i < st.ch; i++) { const ch = EF.CHAPTERS && EF.CHAPTERS[i]; if (!ch) continue; st.completed.push(ch.id); ch.quests.forEach(q => { st.questProgress[q] = { done:1 }; }); }
      }
      S.version = Sv.VERSION;
    }
    S.version = Sv.VERSION;
  } catch (e) {
    // lỗi chuyển đổi: không ghi đè dữ liệu cũ (bản sao lưu đã có); dùng giá trị mặc định tạm cho các trường mới
    console.error('Save migration failed', e);
    Object.keys(d).forEach(k => { if (S[k] === undefined) S[k] = d[k]; });
    S.__noSave = true;
  }
  return S;
};
})();
