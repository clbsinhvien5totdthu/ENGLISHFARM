// ====== QUEST SYSTEM: theo dõi nhiều loại hành động, quest định nghĩa bằng dữ liệu (data/quest_data.js) ======
// Trạng thái nằm trong S.story: stats{} (bộ đếm) · sets{} (tập id khác nhau) · flags{} · clues[] · questProgress{ id:{done} } · completed[] (chương)
(() => {
const EF = (window.EF = window.EF || {});
const Q = EF.Quest = { host:null };
const st = () => { const s = Q.host.S().story; s.stats = s.stats || {}; s.sets = s.sets || {}; s.flags = s.flags || {}; s.clues = s.clues || []; s.questProgress = s.questProgress || {}; s.completed = s.completed || []; return s; };
Q.init = host => { Q.host = host; st(); };
const bump = () => { try { Q.check(); } catch (e) { console.error(e); } };
// ---- ghi nhận sự kiện ----
Q.stat = (name, n) => { const s = st(); s.stats[name] = (s.stats[name] || 0) + (n === undefined ? 1 : n); bump(); };
Q.add = (set, id) => { const s = st(), a = (s.sets[set] = s.sets[set] || []); if (a.indexOf(id) < 0) { a.push(id); bump(); return true; } return false; };
Q.flag = f => { const s = st(); if (!s.flags[f]) { s.flags[f] = 1; bump(); } };
Q.hasFlag = f => !!st().flags[f];
Q.clue = id => { const s = st(); if (s.clues.indexOf(id) >= 0) return false; s.clues.push(id); bump(); return true; };
Q.hasClue = id => st().clues.indexOf(id) >= 0;
// sự kiện từ game.js: emit('harvest', {id}) ...
Q.emit = (type, p) => {
  p = p || {};
  switch (type) {
    case 'harvest': Q.stat('harvest'); if (p.id) Q.add('harvestKinds', p.id); break;
    case 'plant': Q.stat('plant'); break;
    case 'catch': if (p.id) Q.add('catch', p.id); break;
    case 'forage': Q.stat('forage'); if (p.id) Q.add('forageKinds', p.id); break;
    case 'trade': Q.stat('trade'); Q.stat('trade_' + (p.mode || 'x')); break;
    case 'visit': Q.add('visit', p.scene); break;
    default: if (p.tag) Q.add(type + ':' + p.tag, p.id || p.tag);
  }
};
// ---- đánh giá mục tiêu ----
const len = k => (st().sets[k] || []).length;
Q.value = o => {
  const s = st();
  switch (o.type) {
    case 'harvest': return o.tag === 'kinds' ? len('harvestKinds') : (s.stats.harvest || 0);
    case 'plant': return s.stats.plant || 0;
    case 'catch': return len('catch');
    case 'forage': return o.tag === 'kinds' ? len('forageKinds') : (s.stats.forage || 0);
    case 'trade': return o.tag ? (s.stats['trade_' + o.tag] || 0) : (s.stats.trade || 0);
    case 'discover_clue': return Q.hasClue(o.tag) ? 1 : 0;
    case 'vocabulary_stage': return EF.Lang.count(o.tag);
    case 'visit': return len('visit') && (s.sets.visit.indexOf(o.tag) >= 0) ? 1 : 0;
    default: return len(o.type + ':' + o.tag);
  }
};
Q.objectives = qid => EF.QUESTS[qid].objectives.map(o => { const cur = Math.min(o.target, Q.value(o)); return { label:o.label, cur, target:o.target, ok:cur >= o.target }; });
Q.isDone = qid => !!(st().questProgress[qid] && st().questProgress[qid].done);
Q.ready = qid => Q.objectives(qid).every(o => o.ok);
Q.pct = qid => { const os = Q.objectives(qid); return os.reduce((s, o) => s + o.cur / o.target, 0) / os.length; };
Q.chapterQuests = chIdx => { const ch = EF.CHAPTERS[chIdx]; return ch ? ch.quests : []; };
Q.chapterReady = chIdx => Q.chapterQuests(chIdx).every(Q.isDone);
Q.nextTodo = chIdx => Q.chapterQuests(chIdx).find(q => !Q.isDone(q));
// hoàn tất quest đã đủ mục tiêu (chỉ chương hiện tại trở về trước) và trao thưởng một lần
Q.check = () => {
  const s = st(), cur = Q.host.S().story.ch; let any = false;
  for (let i = 0; i <= Math.min(cur, EF.CHAPTERS.length - 1); i++) {
    Q.chapterQuests(i).forEach(id => {
      if (Q.isDone(id) || !Q.ready(id)) return;
      s.questProgress[id] = { done:1 }; any = true;
      const q = EF.QUESTS[id], r = q.rewards || {};
      Q.host.S().coins += r.coins || 0;
      Q.host.toast('✅ Quest xong: ' + q.title);
      Q.host.snd('ok');
      if (r.exp) Q.host.gainExp(r.exp);
    });
  }
  if (any) { Q.host.save(); Q.host.hud(); }
  return any;
};
})();
