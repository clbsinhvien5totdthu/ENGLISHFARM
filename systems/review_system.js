// ====== REVIEW SYSTEM: bài học A2/B1/B2, bài theo chủ đề chương, ôn tập theo lịch (+1, +3, +7, +14, +30 ngày) ======
(() => {
const EF = (window.EF = window.EF || {});
const R = EF.Review = {};
const H = () => EF.host, L = () => EF.Lang;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
const CFG = { A2:{ st:2, exp:3, retry:1, perfect:8, coin:1 }, B1:null, B2:null };
const cfg = lv => (H().LESSON[lv] || CFG.A2);
const N = 5;
const lvOf = key => key === 'review' ? 'B1' : /^topic:/.test(key) ? 'A2' : key;
const label = key => key === 'review' ? '🔁 Ôn tập' : /^topic:/.test(key) ? '📚 ' + (EF.TOPICS[key.slice(6)] || key) : key;

R.run = key => {
  const S = H().S(), lv = lvOf(key), C = cfg(lv);
  const pool = key === 'review' ? EF.vocabAll() : L().pool(key);
  const picks = key === 'review' ? L().reviewWords(N) : L().pick(pool, N);
  if (!picks.length) return H().modal('Ôn tập 🔁', '<b>“Nothing to review today!”</b><br>Chưa có từ nào đến hạn ôn. Hãy học từ mới trước nhé.', [{ label:'Đóng', fn:H().closeModal }]);
  const res = { first:0, exp:0, up:false, seeds:{}, stages:[] };
  const tag = `<span class="tag ${lv === 'B2' ? 'b2' : ''}">${esc(label(key))}</span> `;
  const sk = () => { const s = L().data().skillScores, k = 'lesson_' + lv; s[k] = s[k] || { ok:0, n:0 }; return s[k]; };
  const tired = () => H().modal('Emma 🎓', '<b>“You look exhausted!”</b> (Bạn trông kiệt sức rồi!)<br>Hãy ăn gì đó ở thị trấn hoặc về nhà đi ngủ để lấy lại ⚡ rồi học tiếp nhé.', [{ label:'Đóng', fn:H().closeModal }]);
  const finish = () => {
    const bonus = res.first === picks.length ? C.perfect : 0, coins = res.first * C.coin;
    S.coins += coins; if (coins) H().snd('coin');
    const sd = Object.keys(res.seeds).map(id => H().sico(id, 20) + '×' + res.seeds[id]).join(' ');
    const lvBefore = S.lvl; if (bonus) H().gainExp(bonus); else { H().hud(); H().save(); }
    const ups = res.stages.map(x => `<li><b>${esc(x[0])}</b> → ${L().STAGE_VI[L().STAGE[x[1]]]}</li>`).join('');
    H().modal('Kết quả ' + label(key) + ' 🎓', '<b>“Well done!”</b> (Làm tốt lắm!)<ul class="sum">' +
      `<li>✅ Đúng ngay lần đầu: <b>${res.first}/${picks.length}</b></li><li>🎓 EXP: <b>+${res.exp + bonus}</b>${bonus ? ' (thưởng hoàn hảo +' + bonus + ')' : ''}</li><li>🪙 Coin: <b>+${coins}</b></li>` +
      (sd ? `<li>🌱 Hạt thưởng: ${sd}</li>` : '') + ups + `<li>⭐ Lv ${S.lvl}${S.lvl > lvBefore || res.up ? ' 🎉 vừa lên cấp!' : ''} · ⚡ ${S.stamina}/${H().maxSt()}</li></ul>`,
      [{ label:'Học tiếp 📚', fn:() => (S.stamina >= C.st ? R.run(key) : tired()) }, { label:'Xong', fn:H().closeModal }]);
  };
  const reward = (w, tried, kind, i) => {
    H().use(C.st);
    let sid = null; if (!tried) { res.first++; sid = H().rewardSeed(); res.seeds[sid] = (res.seeds[sid] || 0) + 1; }
    const g = tried ? C.retry : C.exp; res.exp += g; if (H().gainExp(g)) res.up = true;
    const x = !tried ? L().answer(w.en, kind === 'recog' ? 'recog' : 'use', true, 'lesson') : null;
    if (x && x.to > x.from) res.stages.push([w.en, x.to]);
    sk().n++; if (!tried) sk().ok++;
    H().snd('ok');
    H().modal(tried ? 'Gần đúng rồi!' : 'Chính xác! ✨', `${tag}<span class="ok">${esc(w.en)}</span> = ${esc(w.vi)} <small>(${w.pos})</small><div class="sent">${esc(w.ex).replace('{}', '<b>' + esc(w.en) + '</b>')}</div>` +
      (w.col && w.col.length ? `<small>🔗 ${w.col.map(esc).join(' · ')}</small><br>` : '') + `🎓 +${g} EXP${sid ? ' · 🌱 +1 ' + H().sico(sid, 20) + ' ' + H().crop(sid).en : ''}${x && x.to > x.from ? '<br>' + L().STAGE_VI[L().STAGE[x.to]] + ' — từ lên cấp!' : ''}`,
      [{ label:i + 1 < picks.length ? 'Câu tiếp ➜' : 'Xem kết quả', fn:() => ask(i + 1) }]);
  };
  const ask = i => {
    if (i >= picks.length) return finish();
    if (S.stamina < C.st) return tired();
    const w = picks[i], kind = L().kindFor(w, lv);
    L().seen(w.en, 'lesson');
    const others = shuffle(EF.vocabAll().filter(x => x.en !== w.en));
    const ds = others.filter(x => x.pos === w.pos).concat(others.filter(x => x.pos !== w.pos)).slice(0, 3);
    const title = `Câu ${i + 1}/${picks.length}`;
    let tried = false;
    const wrongOnce = () => { if (!tried) { tried = true; L().answer(w.en, kind === 'en2vi' || kind === 'vi2en' ? 'recog' : 'use', false, 'lesson'); H().snd('wrong'); } };
    if (kind === 'unscramble') {
      const words = w.ex.replace('{}', w.en).replace(/[.?!]$/, '').split(' '), target = words.join(' ');
      let chosen = [], bank = shuffle(words.map((t, k) => ({ t, k })));
      const draw = msg => H().modal(title, `${tag}Sắp xếp thành câu đúng <small>(từ khóa: <b>${esc(w.en)}</b>)</small>:<div class="sent">${chosen.length ? esc(chosen.map(c => c.t).join(' ')) : '…'}</div>${msg || ''}`,
        bank.filter(b => chosen.indexOf(b) < 0).map(b => ({ label:b.t, fn:() => { chosen.push(b); if (chosen.length === words.length) { if (chosen.map(c => c.t).join(' ') === target) return reward(w, tried, 'use', i); wrongOnce(); chosen = []; return draw('<br><em>Chưa đúng, thử lại nhé!</em>'); } draw(); } }))
          .concat([{ label:'↩ Làm lại', fn:() => { chosen = []; draw(); } }]));
      return draw();
    }
    let prompt, ans, opts;
    if (kind === 'en2vi') { prompt = `Nghĩa của <b>${esc(w.en)}</b> <small>(${w.pos})</small> là gì?`; ans = w.vi; opts = ds.map(x => x.vi); }
    else if (kind === 'vi2en') { prompt = `Từ tiếng Anh nào có nghĩa là <b>“${esc(w.vi)}”</b>?`; ans = w.en; opts = ds.map(x => x.en); }
    else { prompt = `Điền từ vào chỗ trống <small>(${w.pos})</small>:<div class="sent">${esc(w.ex).replace('{}', '_____')}</div>`; ans = w.en; opts = ds.map(x => x.en); }
    H().modal(title, tag + prompt, shuffle([ans].concat(opts)).map(o => ({ label:o, fn:el => {
      if (o !== ans) { wrongOnce(); el.disabled = true; document.querySelector('#farm-app #mText').innerHTML = tag + prompt + '<br><em>Chưa đúng, thử lại nhé!</em>'; return; }
      reward(w, tried, kind === 'cloze' ? 'use' : 'recog', i);
    } })));
  };
  ask(0);
};
// ---- Menu cô Emma ----
R.menu = () => {
  const S = H().S(), ch = EF.Story.chapter(), due = L().dueList().length, back = R.menu;
  const lvBtn = lv => { const lock = lv === 'B2' && S.lvl < H().B2_LEVEL, cl = lv === 'A2' ? EF.vocabAll().filter(w => w.cefr === 'A2').length : null;
    return { label:lock ? `🔒 B2 — mở ở Lv ${H().B2_LEVEL}` : `${lv === 'A2' ? '📗' : lv === 'B1' ? '📘' : '📙'} Bài ${lv} · ${N} câu (⚡${cfg(lv).st}/câu)`, off:lock, fn:() => R.run(lv) }; };
  const btns = [];
  if (ch && ch.no === 1) btns.push({ label:'🌾 Emma’s Test — giới thiệu nông trại (6 lượt)', fn:() => EF.DialogueUI.run('emma_test', { onEnd:back }) });
  if (ch) btns.push({ label:`📚 Từ của chương: ${EF.TOPICS[ch.topic]}`, fn:() => R.run('topic:' + ch.topic) });
  btns.push(lvBtn('A2'), lvBtn('B1'), lvBtn('B2'));
  btns.push({ label:`🔁 Ôn tập${due ? ' (' + due + ' từ đến hạn)' : ''}`, off:!due, fn:() => R.run('review') });
  btns.push({ label:'📖 Mở Sổ Vườn Từ', fn:() => EF.UI.vocabBook() }, { label:'Đóng', fn:H().closeModal });
  const c = L().counts();
  H().modal('Teacher Emma 🎓', '<b>“Hello! Ready to practise your English?”</b><br>(Chào bạn! Sẵn sàng luyện tiếng Anh chưa?)<br>' +
    `<small>🌰 ${c.seed} · 🌱 ${c.sprout} · 🍎 ${c.fruit} · Gợi ý: bài <b>${L().suggestLevel()}</b> · ⭐ Lv ${S.lvl} · ⚡ ${S.stamina}/${H().maxSt()}</small>`, btns);
};
})();
