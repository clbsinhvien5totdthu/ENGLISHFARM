// ====== ASSESSMENT SYSTEM: chấm câu trả lời tự do theo tiêu chí (không có đáp án mẫu duy nhất) ======
// Tiêu chí (Design Bible, Chương 8): mức độ liên quan · dùng từ/cấu trúc · hỏi lại khi chưa hiểu · diễn đạt lại khi quên từ · duy trì hội thoại
(() => {
const EF = (window.EF = window.EF || {});
const A = EF.Assess = {};
const words = t => (t.toLowerCase().match(/[a-zà-ỹ’']+/g) || []);
const CONNECT = ['because', 'and', 'but', 'so', 'when', 'where', 'which', 'that', 'if', 'also', 'then', 'first', 'for example'];
const REPAIR = [/could you (say|repeat)/, /what do you mean/, /what is .* called/, /i mean/, /it is like/, /it looks like/, /\bsorry\b/, /\bhow do you say\b/, /\bin other words\b/, /\?/];
const STRUCT = [/\bi (am|was|like|love|feel|think|want|learn|grow|share)\b/, /\bit (is|was|has|means)\b/, /\bthis (is|place|garden)\b/, /\bwe (can|grow|share|learn|are)\b/, /\bthere (is|are)\b/, /\bmy (grandfather|grandpa|family|village|home)\b/];
// rubric = { need:[[từ khóa đồng nghĩa], ...], min:số từ tối thiểu }
A.scoreFree = (text, rubric) => {
  const t = (text || '').trim(), w = words(t), n = w.length, low = t.toLowerCase();
  const need = (rubric && rubric.need) || [], min = (rubric && rubric.min) || 8;
  const hit = need.filter(g => g.some(k => w.indexOf(k) >= 0 || low.indexOf(k) >= 0)).length;
  const rel = need.length ? hit / need.length : (n >= 3 ? 1 : 0);                      // liên quan
  const conn = CONNECT.filter(c => low.indexOf(c) >= 0).length;
  const str = STRUCT.filter(r => r.test(low)).length;
  const langS = Math.min(1, (conn * .35 + str * .3 + Math.min(n, 20) / 40));            // từ/cấu trúc
  const repair = REPAIR.some(r => r.test(low)) ? 1 : 0;                                  // hỏi lại / diễn đạt lại
  const flow = Math.min(1, n / min);                                                    // duy trì hội thoại
  const total = rel * .45 + langS * .25 + flow * .25 + repair * .05;
  let q = 0; if (n >= 3 && rel >= .25) q = 1; if (rel >= .5 && n >= Math.max(5, min * .6) && total >= .5) q = 2;
  const tips = [];
  if (n < min) tips.push('Thử nói dài hơn một chút (khoảng ' + min + ' từ).');
  if (rel < .5 && need.length) tips.push('Bám sát câu hỏi hơn: nói về khu vườn, con người, việc bạn học/làm và lý do.');
  if (!conn) tips.push('Dùng từ nối như because / and / but để câu trôi chảy hơn.');
  if (!tips.length) tips.push('Rất tốt! Bạn trả lời đúng ý và diễn đạt mạch lạc.');
  return { q, rel, lang:langS, flow, repair, words:n, total, tips };
};
// tổng kết 1 hội thoại (danh sách điểm q của từng lượt) → { ratio, success, stars }
A.summarize = (qs, pass) => {
  const max = qs.length * 2, got = qs.reduce((s, x) => s + x, 0), ratio = max ? got / max : 0;
  return { got, max, ratio, success: ratio >= (pass || .6), stars: ratio >= .9 ? 3 : ratio >= .7 ? 2 : ratio >= .5 ? 1 : 0 };
};
})();
