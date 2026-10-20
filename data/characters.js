// ====== NHÂN VẬT: tùy chỉnh người chơi + hồ sơ NPC (Design Bible §1) ======
(() => {
const EF = (window.EF = window.EF || {});
EF.CHAR = {
  pronouns: [ { id:'he', label:'he / him', vi:'Anh ấy' }, { id:'she', label:'she / her', vi:'Cô ấy' }, { id:'they', label:'they / them', vi:'Bạn ấy' }, { id:'none', label:'Không hiển thị', vi:'Không nêu' } ],
  // màu = [tên, hue(độ) | null = giữ nguyên, ghi chú]
  outfit: [ ['Xanh dương (gốc)', null], ['Đỏ', 355], ['Cam', 22], ['Vàng', 48], ['Xanh lá', 125], ['Xanh ngọc', 175], ['Tím', 275], ['Hồng', 325] ],
  hat:    [ ['Rơm (gốc)', null], ['Trắng kem', 'cream'], ['Đỏ', 355], ['Xanh dương', 215], ['Xanh lá', 120] ],
  hair:   [ ['Đen (gốc)', null], ['Nâu', [92, 58, 34]], ['Nâu hạt dẻ', [128, 72, 38]], ['Vàng', [214, 170, 70]], ['Đỏ gừng', [176, 70, 36]], ['Xám bạc', [150, 150, 158]], ['Xanh đêm', [40, 52, 120]] ],
  acc:    [ { id:'glasses', label:'👓 Kính' }, { id:'scarf', label:'🧣 Khăn' } ],
  def: { name:'Gardener', pronouns:'they', outfit:0, hat:0, hair:0, acc:[] }
};
// Hành trình trưởng thành của The Gardener — dùng ở Nhật ký/Hồ sơ
EF.STAGES = [
  { id:'silent',   en:'The Silent Student',  vi:'Biết từ nhưng ngại nói, sợ sai.',            ch:0 },
  { id:'curious',  en:'The Curious Gardener', vi:'Bắt đầu tò mò, hỏi và khám phá.',            ch:1 },
  { id:'helper',   en:'The Helpful Friend',   vi:'Dùng tiếng Anh để giúp người khác.',         ch:3 },
  { id:'speaker',  en:'The Confident Speaker', vi:'Biết hỏi lại và diễn đạt cách khác.',       ch:5 },
  { id:'story',    en:'The Storyteller',      vi:'Tự tin kể về quê hương.',                    ch:7 }
];
// NPC: mong muốn riêng + vấn đề riêng (quy tắc: không NPC nào chỉ để phát từ mới)
EF.NPCS = {
  emma:    { name:'Emma', role:'The Mentor', icon:'🎓', want:'Muốn người học dám thử sai.', problem:'Nhận ra Sổ Vườn Từ giống một dự án cũ.' },
  lily:    { name:'Linh / Lily', role:'The Flower Keeper', icon:'🌼', want:'Giới thiệu hoa của gia đình với khách quốc tế.', problem:'Bảng tên hoa chưa có tiếng Anh.' },
  mia:     { name:'Mia', role:'The Market Keeper', icon:'🧺', want:'Quầy hàng đông khách.', problem:'Bảng giá thiếu tiếng Anh, không hiểu khách nước ngoài.' },
  hai:     { name:'Chú Hai', role:'The River Guide', icon:'⚓', want:'Truyền nghề sông nước cho người trẻ.', problem:'Giữ một ký hiệu lạ trên bản đồ, không nhớ nghĩa.' },
  moss:    { name:'Cụ Mộc / Elder Moss', role:'Keeper of Memories', icon:'🧙', want:'Có người nghe chuyện xưa.', problem:'Giữ những trang nhật ký đầu tiên nhưng không dám giao.' },
  chef:    { name:'Chef Bo', role:'The Chef', icon:'🍲', want:'Buổi giới thiệu ẩm thực thật suôn sẻ.', problem:'Order của khách nước ngoài hay bị nhầm.' },
  sam:     { name:'Sam', role:'Exchange Student', icon:'🎒', want:'Hiểu quê hương của người chơi.', problem:'Lạc đường trong ngày đầu.' },
  pete:    { name:'Pete', role:'English Corner', icon:'🌬️', want:'Một góc nói chuyện cho cả làng.', problem:'Ít người dám tham gia.' },
  daisy:   { name:'Daisy', role:'Guide of Visitors', icon:'🌸', want:'Khách tham quan không bị lạc.', problem:'Quá nhiều khách, thiếu người dẫn đường.' },
  grandpa: { name:'Grandpa', role:'The Mystery', icon:'📜', want:'Người trẻ kể được câu chuyện quê hương.', problem:'Dự án sổ song ngữ dang dở.' }
};
EF.GRANDPA_QUOTE = 'A word is not alive because you remember it. It is alive because you use it.';
})();
