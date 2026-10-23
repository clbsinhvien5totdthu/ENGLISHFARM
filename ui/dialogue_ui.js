// ====== DIALOGUE UI: hiển thị hội thoại bằng modal của game ======
(() => {
const EF = (window.EF = window.EF || {});
const U = EF.DialogueUI = {};
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
const H = () => EF.host;
const stars = n => '⭐'.repeat(n) + '☆'.repeat(3 - n);
// run(id, { onEnd(result, sess), showVi, preface:[html] })
U.run = (id, opts) => {
  opts = opts || {};
  const sess = EF.Dialogue.create(id), d = sess.def, hist = [];
  let showVi = opts.showVi !== undefined ? opts.showVi : EF.Lang.data().profile === 'A2';
  const histHtml = () => hist.slice(-4).map(h => `<div class="${h.cls}">${h.html}</div>`).join('');
  const npcHtml = v => `<div class="npc"><b>“${esc(v.text)}”</b>${showVi && v.vi ? `<br><small class="vi">${esc(v.vi)}</small>` : ''}</div>`;
  const head = v => (sess.def.turns || v.total > 1) && v.total > 0 && !sess.def.nodes ? `<small class="turn">Lượt ${Math.min(v.turnNo, v.total)}/${v.total}</small>` : '';
  const viBtn = () => ({ label:showVi ? '🇻🇳 Ẩn dịch' : '🇻🇳 Hiện dịch', fn:() => { showVi = !showVi; show(); } });
  const quit = () => ({ label:'Thoát', fn:() => { H().closeModal(); if (opts.onQuit) opts.onQuit(); } });

  const show = () => {
    const v = sess.view();
    if (v.free && !v.choices.length) return showFree(v);
    const btns = v.choices.map(c => ({
      html:`${esc(c.text)}${showVi && c.vi ? `<br><small>${esc(c.vi)}</small>` : ''}`, off:c.locked,
      fn:() => pick(c.i, v)
    }));
    if (v.canFree && (EF.Lang.data().profile !== 'A2' || (H().S().story.ch >= 3))) btns.push({ label:'✍️ Tự viết câu trả lời', fn:() => showFree(v) });
    btns.push(viBtn(), quit());
    H().modal(v.name || d.name, histHtml() + head(v) + npcHtml(v), btns, false, /customer|guest|visitor/i.test(v.name || d.name) ? undefined : d.speaker);
  };
  const pick = (i, v) => {
    const r = sess.choose(i), c = sess.cur().choices[i];
    hist.push({ cls:'npc old', html:`<small>${esc(v.name)}:</small> “${esc(v.text)}”` });
    hist.push({ cls:'you', html:`<small>Bạn:</small> “${esc(c.text)}”` });
    after(r);
  };
  const showFree = v => {
    const rub = sess.rubric();
    H().modal(v.name || d.name, histHtml() + npcHtml(v) + `<textarea id="efFree" rows="4" placeholder="Write your answer in English..." maxlength="400"></textarea>` + (rub.tip ? `<small>💡 ${esc(rub.tip)}</small>` : '<small>💡 Viết 1–2 câu, bám sát câu hỏi. Quên từ thì mô tả vòng hoặc hỏi lại.</small>'),
      [{ label:'Gửi ✔', fn:() => { const t = document.querySelector('#farm-app #efFree'); const text = t ? t.value.trim() : ''; if (!text) return; hist.push({ cls:'npc old', html:`<small>${esc(v.name)}:</small> “${esc(v.text)}”` }); hist.push({ cls:'you', html:`<small>Bạn:</small> “${esc(text)}”` }); after(sess.submitFree(text)); } },
       { label:'↩ Quay lại', fn:show }]);
    const t = document.querySelector('#farm-app #efFree');
    if (t) { ['keydown', 'keyup', 'keypress'].forEach(k => t.addEventListener(k, e => e.stopPropagation())); t.focus(); }
  };
  const after = r => {
    const mark = r.q === 2 ? '✅' : r.q === 1 ? '🟡' : '❌';
    if (r.retry) {
      if (r.reply) hist.push({ cls:'npc', html:`“${esc(r.reply)}”${showVi && r.replyVi ? `<br><small class="vi">${esc(r.replyVi)}</small>` : ''}` });
      return H().modal(d.name, histHtml() + `<div class="fb bad">${mark} ${esc(r.fb)}</div>`, [{ label:'Thử lại ↩', fn:show }]);
    }
    H().snd(r.q === 2 ? 'ok' : 'click');
    H().modal(d.name, histHtml() + `<div class="fb ${r.q === 2 ? 'good' : 'mid'}">${mark} ${esc(r.fb)}</div>`, [{ label:'Tiếp ▶', fn:() => { if (sess.advance()) finish(); else show(); } }]);
  };
  const finish = () => {
    const res = EF.Dialogue.complete(sess), end = sess.endNode;
    const wl = (res.words || []).map(w => `<li><b>${esc(w[0])}</b> → ${EF.Lang.STAGE_VI[EF.Lang.STAGE[w[1]]]}</li>`).join('');
    const body = (end ? `<div class="npc"><b>“${esc(end.text)}”</b>${end.vi ? `<br><small class="vi">${esc(end.vi)}</small>` : ''}</div>` : '') +
      `<div class="big">${stars(res.stars)}</div><p>${res.success ? '🎉 <b>Hội thoại thành công!</b> Bạn giữ được cuộc trò chuyện.' : '🌱 Chưa đủ điểm. Không sao — thử lại, hỏi lại khi chưa hiểu cũng là kỹ năng.'}</p>` +
      `<small>Điểm: ${res.got}/${res.max} · lượt hỏi lại: ${res.repairs}</small>` + (wl ? `<ul class="sum">${wl}</ul>` : '');
    const btns = [];
    if (!res.success) btns.push({ label:'Thử lại 🔁', fn:() => U.run(id, opts) });
    btns.push({ label:'Xong', fn:() => { H().closeModal(); if (opts.onEnd) opts.onEnd(res, sess); } });
    H().modal(res.success ? 'Kết quả 🎉' : 'Kết quả', body, btns);
  };
  if (opts.preface && opts.preface.length) H().modal(d.name, opts.preface.join('<br>'), [{ label:'Bắt đầu ▶', fn:show }]);
  else show();
  return sess;
};
})();
