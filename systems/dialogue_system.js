// ====== DIALOGUE SYSTEM: hội thoại phân nhánh, chấm theo mục đích giao tiếp ======
// Luồng: NPC nêu tình huống → người chơi chọn câu hoặc tự viết → đánh giá → phản hồi / cập nhật quest, từ vựng, cờ truyện → lưu.
// Session không đụng DOM (dễ kiểm thử); giao diện nằm trong ui/dialogue_ui.js.
(() => {
const EF = (window.EF = window.EF || {});
const DS = EF.Dialogue = { host:null };
const STOP = 'the a an is are was were be to of and in on at for with it this that you your i me my we our they he she his her do does did can could will would please yes no not just very so as by from'.split(' ');
DS.init = host => { DS.host = host; };
const compile = d => {
  if (d.nodes) return { start:d.start, nodes:d.nodes };
  const nodes = {};
  d.turns.forEach((t, i) => {
    const nx = i + 1 < d.turns.length ? 't' + (i + 1) : 'END';
    nodes['t' + i] = { text:t.en, vi:t.vi, free:t.free || null, choices:t.opts.map((o, k) => ({ id:'o' + k, text:o.en, vi:o.vi, q:o.q, next:nx })) };
  });
  return { start:'t0', nodes };
};
DS.exists = id => !!EF.DIALOGUES[id];
DS.create = id => {
  const d = EF.DIALOGUES[id]; if (!d) throw new Error('Dialogue not found: ' + id);
  const g = compile(d);
  const s = { id, def:d, nodes:g.nodes, node:g.start, turnQ:{}, tries:0, locked:{}, repairs:0, used:[], nextId:null, done:false, order:[], flags:[] };
  s.turnsTotal = Object.keys(g.nodes).filter(k => g.nodes[k].choices || g.nodes[k].free).length;
  s.cur = () => s.nodes[s.node];
  // tạo nhóm từ khóa để chấm câu tự viết từ đáp án tốt nhất của lượt
  s.rubric = () => {
    const n = s.cur(); if (n.free) return n.free;
    const best = (n.choices || []).filter(c => c.q === 2).sort((a, b) => b.text.length - a.text.length)[0];
    const toks = best ? (best.text.toLowerCase().match(/[a-z’']+/g) || []).filter(w => w.length > 3 && STOP.indexOf(w) < 0) : [];
    return { need:toks.map(w => [w.replace(/s$/, ''), w]), min:5 };
  };
  s.view = () => {
    const n = s.cur();
    if (!s.order[s.node] && n.choices) s.order[s.node] = n.choices.map((_, i) => i).sort(() => Math.random() - .5);
    return { name:d.name, text:n.text, vi:n.vi, turnNo:Object.keys(s.turnQ).length + 1, total:s.turnsTotal, free:!!n.free, canFree:!!(n.choices && n.choices.length && d.turns),
      choices:(n.choices ? s.order[s.node] : []).map(i => ({ i, text:n.choices[i].text, vi:n.choices[i].vi, locked:!!s.locked[s.node + ':' + i] })) };
  };
  // chọn 1 phương án → { q, fb, reply, retry }
  s.choose = i => {
    const n = s.cur(), c = n.choices[i];
    if (c.q === 0) {            // chưa đúng ngữ cảnh: NPC hỏi lại, được chọn lại (lựa chọn đã khóa)
      s.locked[s.node + ':' + i] = 1; s.repairs++; s.tries++;
      const bridge = c.next && s.nodes[c.next] && s.nodes[c.next].retry ? s.nodes[c.next] : null;
      return { q:0, retry:true, reply:bridge ? bridge.text : 'Hmm, I am not sure I understand. Could you try again?', replyVi:bridge ? bridge.vi : 'Hmm, mình chưa chắc hiểu. Bạn thử lại nhé?',
        fb:(bridge && bridge.fb) || c.fb || 'Câu này chưa đúng ngữ cảnh. Thử một câu khác — hỏi lại hoặc mô tả cũng là chiến lược tốt.' };
    }
    const q = s.tries ? Math.min(c.q, 1) : c.q;
    s.turnQ[s.node] = q; s.used.push({ text:c.text, q }); s.nextId = c.next; s.tries = 0;
    return { q, retry:false, reply:null, fb:c.fb || (q === 2 ? 'Tuyệt! Câu trả lời đúng ngữ cảnh và rõ ràng.' : 'Chấp nhận được — bạn giữ được cuộc trò chuyện. Lần sau thử nói đầy đủ hơn nhé.') };
  };
  s.submitFree = text => {
    const n = s.cur(), r = EF.Assess.scoreFree(text, s.rubric());
    if (r.q === 0) { s.repairs++; s.tries++; return { q:0, retry:true, fb:r.tips.join(' '), detail:r }; }
    s.turnQ[s.node] = s.tries ? Math.min(r.q, 1) : r.q; s.used.push({ text, q:r.q }); s.tries = 0;
    s.nextId = n.choices && n.choices[0] ? n.choices[0].next : 'END';
    return { q:s.turnQ[s.node], retry:false, fb:r.tips.join(' '), detail:r };
  };
  // sang lượt kế; trả về true nếu hội thoại đã kết thúc
  s.advance = () => {
    const nx = s.nextId; s.nextId = null;
    if (nx === 'END') { s.done = true; return true; }
    const n = s.nodes[nx];
    if (n && n.type === 'end') { (n.setFlags || []).forEach(f => s.flags.push(f)); s.endNode = n; s.done = true; return true; }
    s.node = nx; return false;
  };
  s.result = () => {
    const A = EF.Assess.summarize(Object.keys(s.turnQ).map(k => s.turnQ[k]), d.pass);
    return Object.assign(A, { id, repairs:s.repairs, turns:Object.keys(s.turnQ).length, flags:s.flags.slice() });
  };
  return s;
};
// từ vựng xuất hiện trong câu người chơi dùng (đúng ngữ cảnh) → ghi nhận Hạt/Mầm/Quả
const norm = w => { const L = [w, w.replace(/s$/, ''), w.replace(/es$/, ''), w.replace(/ed$/, ''), w.replace(/d$/, ''), w.replace(/ing$/, ''), w.replace(/ing$/, 'e')]; for (let i = 0; i < L.length; i++) if (EF.vocabByEn(L[i])) return L[i]; return null; };
DS.words = used => {
  const out = {};
  used.forEach(u => (u.text.toLowerCase().match(/[a-z]+/g) || []).forEach(t => { const w = norm(t); if (w) out[w] = Math.max(out[w] || 0, u.q); }));
  return out;
};
// áp dụng kết quả: quest, manh mối, cờ truyện, từ vựng, quan hệ NPC, thưởng
DS.complete = sess => {
  const d = sess.def, r = sess.result(), H = DS.host, S = H.S();
  const L = EF.Lang;
  // ghi điểm kỹ năng hội thoại
  const sk = L.data().skillScores; sk.dialogue = sk.dialogue || { ok:0, n:0 };
  Object.keys(sess.turnQ).forEach(k => { sk.dialogue.n++; if (sess.turnQ[k] >= 1) sk.dialogue.ok++; });
  sk.repair = sk.repair || { ok:0, n:0 }; sk.repair.n += 1; if (sess.repairs <= 1) sk.repair.ok++;
  // từ vựng dùng trong hội thoại: q2 = dùng đúng (→ Quả nếu đã là Mầm), q1 = chỉ ghi nhận
  const ws = DS.words(sess.used), learned = [];
  Object.keys(ws).forEach(w => { if (ws[w] === 2) { const x = L.answer(w, 'use', true, 'dialogue:' + d.id); learned.push([w, x.to]); } else L.seen(w, 'dialogue:' + d.id); });
  r.words = learned;
  if (r.success) {
    r.flags.forEach(f => EF.Quest.flag(f));
    if (d.kind === 'interact' || d.kind === 'describe' || d.kind === 'deliver' || d.kind === 'dialogue_success') EF.Quest.add(d.kind + ':' + d.tag, d.id);
    if (d.clue) EF.Quest.clue(d.clue);
    if (d.reward) { S.coins += d.reward.coins || 0; if (d.reward.exp) H.gainExp(d.reward.exp); }
    S.relationships = S.relationships || {}; if (d.speaker) S.relationships[d.speaker] = (S.relationships[d.speaker] || 0) + 1;
    H.gainExp(6 + r.stars * 3); H.snd('levelup');
  } else { H.snd('wrong'); }
  H.save(); H.hud();
  return r;
};
})();
