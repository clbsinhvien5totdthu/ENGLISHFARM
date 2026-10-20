// ====== LANGUAGE SYSTEM: Hạt → Mầm → Quả, lịch ôn, hồ sơ CEFR (Design Bible §4) ======
// S.language = { profile:'A2', words:{ [en]:{ st, c, w, use, lvl, due, last, first, src[] } }, reviewQueue:[], skillScores:{} }
//   st: 0 Hạt (gặp) · 1 Mầm (nhận diện đúng) · 2 Quả (dùng đúng trong tình huống)
// CEFR của người chơi (language.profile) TÁCH BIỆT với cấp game (S.lvl).
(() => {
const EF = (window.EF = window.EF || {});
const STAGE = ['seed', 'sprout', 'fruit'];
const STAGE_VI = { seed:'🌰 Hạt', sprout:'🌱 Mầm', fruit:'🍎 Quả' };
const INTERVALS = [0, 1, 3, 7, 14, 30];            // ngày: ngày đầu, +1, +3, +7, +14, +30
const REVIEW_GOAL = ['Nhận diện', 'Nhớ lại', 'Dùng trong câu', 'Dùng trong tình huống mới', 'Kiểm tra ghi nhớ', 'Củng cố dài hạn'];
const L = EF.Lang = { STAGE, STAGE_VI, INTERVALS, REVIEW_GOAL, host:null };
const S = () => L.host.S();
const day = () => (L.host && L.host.S().day) || 1;
const lang = () => { const s = S(); if (!s.language) s.language = { profile:'A2', words:{}, reviewQueue:[], skillScores:{} }; return s.language; };
L.data = lang;
L.rec = en => lang().words[en] || null;
L.stageOf = en => { const r = L.rec(en); return r ? STAGE[r.st] : null; };
// ghi nhận lần đầu gặp từ (qua NPC, bảng hiệu, vật phẩm, nhiệm vụ)
L.seen = (en, src) => {
  const W = lang().words; let r = W[en];
  if (!r) { r = W[en] = { st:0, c:0, w:0, use:0, lvl:0, due:day(), last:day(), first:day(), src:[] }; }
  if (src && r.src.indexOf(src) < 0 && r.src.length < 6) r.src.push(src);
  return r;
};
// cập nhật khi người chơi trả lời: kind = 'recog' (nhận biết nghĩa) | 'use' (dùng trong câu / tình huống)
// trả về { from, to } để UI báo "lên Mầm / lên Quả"
L.answer = (en, kind, ok, src) => {
  const r = L.seen(en, src), from = r.st;
  r.last = day();
  const sk = lang().skillScores; sk[kind] = sk[kind] || { ok:0, n:0 }; sk[kind].n++; if (ok) sk[kind].ok++;
  if (ok) {
    r.c++;
    if (kind === 'use') r.use++;
    if (r.st === 0) r.st = 1;                         // nhận diện đúng → Mầm
    if (kind === 'use' && r.st === 1) r.st = 2;       // dùng đúng trong tình huống → Quả
    if (r.lvl < INTERVALS.length - 1 && L.isDue(en)) r.lvl++;
    r.due = day() + INTERVALS[r.lvl];
  } else {
    r.w++; r.lvl = 0; r.due = day();                  // sai → quay lại nhóm cần ôn
    if (r.st === 2) r.st = 1;                         // Quả → Mầm (không phạt "héo")
  }
  lang().reviewQueue = L.dueList().map(x => x.en);
  const S0 = S(); if (S0.words) S0.words[en] = (S0.words[en] || 0) + (ok ? 1 : 0); // giữ tương thích bài học cũ
  return { from, to:r.st };
};
L.isDue = en => { const r = L.rec(en); return !!r && r.due <= day(); };
L.dueList = () => Object.keys(lang().words).filter(L.isDue).map(en => Object.assign({ en }, lang().words[en]))
  .sort((a, b) => a.due - b.due || a.lvl - b.lvl);
L.count = stage => { const idx = Math.max(0, STAGE.indexOf(stage)); return Object.keys(lang().words).filter(en => lang().words[en].st >= idx).length; };
L.counts = () => ({ seed:L.count('seed'), sprout:L.count('sprout'), fruit:L.count('fruit') });
L.total = () => EF.vocabAll().length;
// bộ từ cho bài học: level 'A2' | 'B1' | 'B2' | 'topic:farm' | 'review'
L.pool = key => {
  const all = EF.vocabAll();
  if (key === 'A2' || key === 'B1' || key === 'B2') return all.filter(w => w.cefr === key);
  if (/^topic:/.test(key)) return all.filter(w => w.topic === key.slice(6));
  return all;
};
// chọn từ cho 1 bài: ưu tiên từ đến hạn ôn → từ chưa gặp / ở trạng thái thấp
L.pick = (pool, n) => {
  const W = lang().words;
  const score = w => { const r = W[w.en]; if (!r) return 1 + Math.random(); const due = r.due <= day() ? -2 : 0; return 2 + r.st * 2 + due + Math.random() * 1.5 - Math.min(r.c, 4) * .1; };
  return pool.map(w => [score(w), w]).sort((a, b) => a[0] - b[0]).slice(0, n).map(x => x[1]);
};
L.reviewWords = n => L.dueList().map(x => EF.vocabByEn(x.en)).filter(Boolean).slice(0, n);
// loại câu hỏi hợp với trạng thái của từ: Hạt → nhận biết · Mầm → dùng · Quả → dùng trong ngữ cảnh mới
L.kindFor = (w, level) => {
  const r = L.rec(w.en), st = r ? r.st : 0, R = Math.random();
  if (st === 0) return R < .55 ? 'en2vi' : 'vi2en';
  if (level === 'A2') return R < .5 ? 'unscramble' : 'cloze';
  return R < .6 ? 'cloze' : (R < .85 ? 'unscramble' : 'vi2en');
};
// ---- hồ sơ tiếng Anh ----
const rate = k => { const s = lang().skillScores[k]; return s && s.n >= 3 ? s.ok / s.n : null; };
L.skills = () => {
  const sk = lang().skillScores, out = {};
  Object.keys(sk).forEach(k => { out[k] = { n:sk[k].n, pct:Math.round(sk[k].ok / Math.max(1, sk[k].n) * 100) }; });
  return out;
};
// Ước lượng mức làm bài (KHÔNG phải chứng chỉ CEFR): dựa trên tỉ lệ đúng ở bài B1/B2 và hội thoại
L.estimate = () => {
  const sk = lang().skillScores, b = k => (sk[k] && sk[k].n >= 5) ? sk[k].ok / sk[k].n : null;
  const b1 = b('lesson_B1'), b2 = b('lesson_B2'), dlg = b('dialogue');
  let p = 'A2';
  if (b1 !== null && b1 >= .7) p = 'B1';
  if (b2 !== null && b2 >= .7 && (dlg === null || dlg >= .6)) p = 'B2';
  lang().profile = p; return p;
};
// gợi ý cấp độ bài học nên làm tiếp
L.suggestLevel = () => ({ A2:'A2', B1:'B1', B2:'B2' }[L.estimate()]);
L.init = host => { L.host = host; lang(); };
})();
