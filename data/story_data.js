// ====== CỐT TRUYỆN: Prologue + 8 chương (Design Bible §2) ======
// Chương: giver = nơi nộp nhiệm vụ (khớp khóa turnIn cũ: 'Farm:emma', 'Town:shop', 'Lake:captain'...).
// quests = id trong quest_data.js · unlock = tuyến mở ra (hiển thị trong Nhật ký; cảnh cũ vẫn đi lại tự do)
(() => {
const EF = (window.EF = window.EF || {});
const E = (who, en, vi) => ({ who, en, vi });
EF.PROLOGUE = {
  freeze: [
    E('📖 Prologue · The Freeze', 'Summer holiday. You are back at Grandpa’s farm in a quiet village by the river.', 'Kỳ nghỉ hè. Bạn trở về nông trại của ông, trong một ngôi làng yên tĩnh bên sông.'),
    E('📖 Prologue · The Freeze', 'You know many English words. But when a stranger speaks to you... your mind goes blank.', 'Bạn biết nhiều từ tiếng Anh. Nhưng khi người lạ hỏi... đầu óc bạn trống rỗng.')
  ],
  afterSam: [
    E('Teacher Emma 🎓', 'Hello! I saw you with Sam. It is okay to feel nervous. You knew the words — you only need practice.', 'Chào bạn! Cô thấy bạn nói chuyện với Sam. Hồi hộp là bình thường. Bạn biết từ rồi — chỉ cần luyện tập.'),
    E('Teacher Emma 🎓', 'Your grandfather left this for you. It is called the Garden Word Book.', 'Ông bạn để lại thứ này cho bạn. Nó tên là Sổ Vườn Từ.'),
    E('📖 Sổ Vườn Từ', 'For the one who is brave enough to begin.', 'Dành cho người đủ dũng cảm để bắt đầu.'),
    E('Teacher Emma 🎓', 'Plant your first seed. Every word grows like a plant: seed, sprout, then fruit.', 'Hãy gieo hạt đầu tiên. Mỗi từ lớn lên như một cái cây: hạt, mầm, rồi quả.')
  ]
};
// manh mối / trang nhật ký
EF.CLUES = {
  prologue:    { title:'Dòng chữ đầu tiên', en:'For the one who is brave enough to begin.', vi:'Dành cho người đủ dũng cảm để bắt đầu.' },
  page_01:     { title:'Page 01 · Chiếc lá', en:'A leaf is drawn on the note: “Page 01”. Someone wanted this book to start here.', vi:'Một chiếc lá được vẽ trên mảnh giấy: “Page 01”. Có ai đó muốn cuốn sổ bắt đầu từ đây.' },
  photo:       { title:'Bức ảnh cũ', en:'A place can be remembered through its flowers.', vi:'Một nơi chốn có thể được nhớ qua những loài hoa.' },
  map_fragment:{ title:'Mảnh bản đồ', en:'A map piece marks Moon Lake with a small star.', vi:'Một mảnh bản đồ đánh dấu Hồ Trăng bằng ngôi sao nhỏ.' },
  map_mark:    { title:'Ký hiệu trên bản đồ', en:'The mark means: listen to the water, and the wetlands will answer.', vi:'Ký hiệu nghĩa là: hãy lắng nghe nước, và vùng đất ngập nước sẽ đáp lời.' },
  page_05:     { title:'Page 05 · Cụ Mộc giữ', en:'The first pages were never lost. Moss has kept them safe for many summers.', vi:'Những trang đầu chưa bao giờ mất. Cụ Mộc đã giữ chúng nhiều mùa hè.' },
  recipe:      { title:'Công thức của ông', en:'Food is a language everyone understands.', vi:'Món ăn là ngôn ngữ ai cũng hiểu.' },
  pages_found: { title:'Những trang thất lạc', en:'Grandpa sent each page to an old friend, so each friend could add one story, one memory and one new way to say it.', vi:'Ông gửi mỗi trang cho một người bạn cũ để mỗi người thêm một câu chuyện, một ký ức và một cách diễn đạt mới.' },
  final_page:  { title:'Trang cuối', en:'Now, tell them your story.', vi:'Giờ thì, hãy kể cho họ câu chuyện của bạn.' }
};
const CH = (o) => o;
EF.CHAPTERS = [
CH({ id:'chapter_01', no:1, title:'Back to the Roots', icon:'🌾', area:'Farm', theme:'Farming & daily life', topic:'farm',
  giver:'Farm:emma', who:'Cô Emma (nông trại)', where:'Nông trại',
  quests:['new_beginning', 'first_harvest', 'old_letter', 'emmas_test', 'word_garden'],
  done:[ E('Teacher Emma 🎓', 'You restored the soil, and you spoke about the farm with a smile.', 'Bạn đã phục hồi luống đất, và còn tự giới thiệu nông trại bằng nụ cười.'),
    E('Teacher Emma 🎓', 'This Word Book looks like a project from many years ago. Someone planned something big.', 'Cuốn sổ này giống một dự án từ nhiều năm trước. Ai đó đã dự định một điều lớn.'),
    E('Teacher Emma 🎓', 'Visit Lily at the Plant Workshop. She keeps the family flowers.', 'Hãy gặp Lily ở Plant Workshop. Cô ấy giữ những loài hoa của gia đình.') ],
  reward:{ coins:40, exp:20, seeds:3, unlock:['Tuyến Vườn ươm (Plant Workshop)'], clue:null } }),
CH({ id:'chapter_02', no:2, title:'Flower Trail', icon:'🌸', area:'Workshop / Town', theme:'Plants & descriptions', topic:'flowers',
  giver:'Town:shop', who:'Lily (Plant Workshop)', where:'Thị trấn → Plant Workshop',
  quests:['flower_list', 'name_every_bed', 'grow_four', 'better_description', 'old_photograph'],
  done:[ E('Lily 🌼', 'Now every bed has a name, and every name has a smile. Thank you!', 'Giờ mỗi luống đều có tên, và mỗi cái tên đều có nụ cười. Cảm ơn bạn!'),
    E('Lily 🌼', 'This map piece was in the old photo box. Mia at the market may know it.', 'Mảnh bản đồ này nằm trong hộp ảnh cũ. Mia ở chợ có thể biết nó.') ],
  reward:{ coins:60, exp:30, seeds:3, unlock:['Tuyến Chợ ven sông', 'Mảnh bản đồ'] } }),
CH({ id:'chapter_03', no:3, title:'Riverside Market', icon:'🧺', area:'Town / bờ sông', theme:'Shopping & numbers', topic:'market',
  giver:'Town:mia', who:'Mia (chợ ven sông, thị trấn)', where:'Thị trấn (gần Decor Shop)',
  quests:['how_much', 'right_basket', 'market_helper', 'customer_request', 'map_fragment'],
  done:[ E('Mia 🧺', 'Fifteen customers and not one lost price. You are a market star!', 'Mười lăm giao dịch mà không sai một giá. Bạn là ngôi sao của chợ!'),
    E('Mia 🧺', 'The wooden box held a map. Moon Lake is marked. Captain Hai knows that water.', 'Chiếc hộp gỗ có một bản đồ đánh dấu Hồ Trăng. Chú Hai rành vùng nước đó.') ],
  reward:{ coins:80, exp:40, seeds:4, unlock:['Hồ Trăng'] } }),
CH({ id:'chapter_04', no:4, title:'Whispers of the Water', icon:'🎣', area:'Lake', theme:'Fish & water', topic:'water',
  giver:'Lake:captain', who:'Chú Hai (Hồ Trăng)', where:'Hồ Trăng (cuối nông trại, phía nam)',
  quests:['meet_river_guide', 'different_catch', 'what_do_you_see', 'river_journal', 'missing_mark'],
  done:[ E('Captain Hai ⚓', 'You looked first and named later. That is how a river guide learns.', 'Bạn nhìn trước rồi mới gọi tên. Người dẫn sông học như thế đấy.'),
    E('Captain Hai ⚓', 'This mark on the map points to the wetlands. Elder Moss lives near them.', 'Ký hiệu này trên bản đồ chỉ về vùng ngập nước. Cụ Mộc sống gần đó.') ],
  reward:{ coins:100, exp:50, seeds:4, unlock:['Vườn sinh thái (Rừng Sương)'] } }),
CH({ id:'chapter_05', no:5, title:'The Living Wetlands', icon:'🌿', area:'Forest', theme:'Nature & environment', topic:'nature',
  giver:'Forest:moss', who:'Cụ Mộc (Rừng Sương)', where:'Rừng Sương (phía bắc nông trại)',
  quests:['forest_explorer', 'nature_notes', 'weather_alert', 'protect_wetlands', 'old_friend'],
  done:[ E('Elder Moss 🧙', 'You described what you did not know. That is better than staying silent.', 'Bạn mô tả được điều chưa biết tên. Thế còn hơn im lặng.'),
    E('Elder Moss 🧙', 'Your grandfather and I wrote the first pages here. Now the kitchen needs you.', 'Ông bạn và ta đã viết những trang đầu ở đây. Giờ nhà bếp đang cần bạn.') ],
  reward:{ coins:120, exp:60, seeds:4, unlock:['Bếp cộng đồng'] } }),
CH({ id:'chapter_06', no:6, title:'Stories Around the Table', icon:'🍲', area:'Town / bếp', theme:'Food & communication', topic:'food',
  giver:'Town:food', who:'Chef Bo (quầy ăn, thị trấn)', where:'Thị trấn (Food Stall)',
  quests:['prepare_ingredients', 'take_order', 'repeat_to_confirm', 'whats_in_dish', 'grandpas_recipe'],
  done:[ E('Chef Bo 🍲', 'Six orders, and you repeated them like a pro. The kitchen is happy!', 'Sáu order, và bạn nhắc lại như người trong nghề. Nhà bếp vui lắm!'),
    E('Chef Bo 🍲', 'Pete is starting an English Corner. The student zone is open too.', 'Pete sắp mở English Corner. Khu sinh viên cũng đã mở.') ],
  reward:{ coins:140, exp:70, seeds:5, unlock:['Khu sinh viên', 'Tuyến tìm trang nhật ký'] } }),
CH({ id:'chapter_07', no:7, title:'The Lost Pages', icon:'📜', area:'Home / Town', theme:'Directions, emotions, community', topic:'community',
  giver:'Town:pete', who:'Pete (English Corner, cối xay gió)', where:'Thị trấn (cối xay gió, phía đông)',
  quests:['english_corner', 'lost_visitor', 'old_letters', 'missing_pages', 'sams_question'],
  done:[ E('Pete 🌬️', 'The pages were never stolen. Your grandfather sent them to his friends.', 'Những trang nhật ký không hề bị đánh cắp. Ông bạn gửi chúng cho những người bạn.'),
    E('Daisy 🌸', 'Each friend added one story. Now the whole village wants to hear yours.', 'Mỗi người bạn thêm một câu chuyện. Giờ cả làng muốn nghe câu chuyện của bạn.'),
    E('Pete 🌬️', 'The Village Hall is ready. An invitation to Open Day is on its way!', 'Đình làng đã sẵn sàng. Thư mời Open Day đang tới!') ],
  reward:{ coins:160, exp:80, seeds:5, unlock:['Đình làng', 'Thư mời Open Day'] } }),
CH({ id:'chapter_08', no:8, title:'English Farm Open Day', icon:'🏮', area:'Village Hall', theme:'Presentation & interaction', topic:'present',
  giver:'Town:dinh', who:'Đình làng (thị trấn)', where:'Đình làng (thị trấn)',
  quests:['welcome_station', 'market_station', 'garden_tour', 'unexpected_question'],
  done:[ E('🏮 Village Hall', 'Guests fill the hall. Sam walks up and asks the first question again.', 'Khách đầy đình làng. Sam bước tới và hỏi lại câu hỏi đầu tiên.') ],
  reward:{ coins:300, exp:120, seeds:6, unlock:[] }, finale:true })
];
EF.chapter = i => EF.CHAPTERS[i];
EF.chapterById = id => EF.CHAPTERS.find(c => c.id === id);
EF.CLOSING = 'A garden grows food. A community grows confidence. And a language grows every time someone dares to speak.';
})();
