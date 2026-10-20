// ====== QUEST: dữ liệu độc lập với logic hiển thị (Design Bible §6) ======
// type: harvest | plant | catch | forage | interact | vocabulary_stage | dialogue_success | describe | trade | deliver | discover_clue | visit
// tag: 'kinds' = đếm số loại khác nhau (harvest/forage) · còn lại = nhãn sự kiện · target = số cần đạt
(() => {
const EF = (window.EF = window.EF || {});
const O = (type, tag, target, label) => ({ type, tag, target, label });
const Q = (id, chapter, title, hint, objectives, rewards) => ({ id, chapter, title, hint, objectives, rewards: rewards || { coins:10, exp:5 } });
const list = [
// --- Chương 1 ---
Q('new_beginning', 'chapter_01', 'A New Beginning', 'Xới đất, gieo hạt, tưới cây.', [O('plant', '', 3, 'Gieo hạt')]),
Q('first_harvest', 'chapter_01', 'First Harvest', 'Thu hoạch ít nhất 10 cây thuộc 2 loại.', [O('harvest', '', 10, 'Thu hoạch'), O('harvest', 'kinds', 2, 'Số loại cây')], { coins:40, exp:20 }),
Q('old_letter', 'chapter_01', 'The Old Letter', 'Mở hộp thư ở nông trại để đọc thư cũ.', [O('interact', 'old_letter', 1, 'Đọc thư cũ'), O('discover_clue', 'page_01', 1, 'Tìm Page 01')]),
Q('emmas_test', 'chapter_01', 'Emma’s Test', 'Nói chuyện với cô Emma → “Emma’s Test”: giới thiệu nông trại trong 6 lượt.', [O('dialogue_success', 'farm_intro', 1, 'Giới thiệu nông trại')], { coins:20, exp:15 }),
Q('word_garden', 'chapter_01', 'Word Garden', 'Học với cô Emma để từ lên Mầm và Quả.', [O('vocabulary_stage', 'sprout', 20, 'Từ ở trạng thái Mầm'), O('vocabulary_stage', 'fruit', 10, 'Từ ở trạng thái Quả')]),
// --- Chương 2 ---
Q('flower_list', 'chapter_02', 'The Flower List', 'Cô Lily (Plant Workshop) → “Flower List”: nhận diện 12 loài hoa.', [O('interact', 'flower_id', 12, 'Hoa đã nhận diện')]),
Q('name_every_bed', 'chapter_02', 'Name Every Bed', 'Lily → “Name Every Bed”: đặt đúng 12 bảng tên.', [O('interact', 'bed_sign', 12, 'Bảng tên đã đặt')]),
Q('grow_four', 'chapter_02', 'Four Kinds of Crops', 'Trồng và thu hoạch 4 loại cây khác nhau.', [O('harvest', 'kinds', 4, 'Số loại cây đã thu hoạch')]),
Q('better_description', 'chapter_02', 'A Better Description', 'Lily → “Describe a Flower”: giới thiệu một loài hoa trong 7 lượt.', [O('describe', 'flower_desc', 1, 'Mô tả một loài hoa')], { coins:25, exp:15 }),
Q('old_photograph', 'chapter_02', 'The Old Photograph', 'Lily → “The Photo Box”: tìm và đọc bức ảnh cũ.', [O('discover_clue', 'photo', 1, 'Đọc ảnh cũ')]),
// --- Chương 3 ---
Q('how_much', 'chapter_03', 'How Much Is It?', 'Mia → “Market”: trả lời 8 câu hỏi về giá.', [O('trade', 'price', 8, 'Câu hỏi về giá')]),
Q('right_basket', 'chapter_03', 'The Right Basket', 'Mia → “Market”: chọn sản phẩm theo yêu cầu khách (7 lần).', [O('trade', 'basket', 7, 'Giỏ đúng yêu cầu')]),
Q('market_helper', 'chapter_03', 'Market Helper', 'Mia → “Market”: phân loại nông sản (4 lần).', [O('trade', 'sort', 4, 'Phân loại nông sản')]),
Q('customer_request', 'chapter_03', 'A Customer’s Request', 'Mia → “Customer Request”: bán hàng trong 7 lượt, xử lý yêu cầu nhiều điều kiện.', [O('dialogue_success', 'market_sell', 1, 'Bán hàng thành công')], { coins:25, exp:15 }),
Q('map_fragment', 'chapter_03', 'The Map Fragment', 'Mia → “Wooden Box”: tìm mảnh bản đồ.', [O('discover_clue', 'map_fragment', 1, 'Tìm mảnh bản đồ')]),
// --- Chương 4 ---
Q('meet_river_guide', 'chapter_04', 'Meet the River Guide', 'Gặp Chú Hai ở Hồ Trăng và nhận cần câu.', [O('interact', 'rod', 1, 'Nhận cần câu')]),
Q('different_catch', 'chapter_04', 'A Different Catch', 'Câu ít nhất 4 loài cá khác nhau.', [O('catch', '', 4, 'Loài cá đã câu')]),
Q('what_do_you_see', 'chapter_04', 'What Do You See?', 'Chú Hai → “Describe a Fish”: mô tả hình dáng, màu sắc, chuyển động (7 lượt).', [O('describe', 'fish_desc', 1, 'Mô tả một loài cá')], { coins:25, exp:15 }),
Q('river_journal', 'chapter_04', 'The River Journal', 'Chú Hai → “River Journal”: ghi lại quan sát.', [O('interact', 'river_journal', 1, 'Ghi nhật ký sông')]),
Q('missing_mark', 'chapter_04', 'The Missing Mark', 'Chú Hai → “The Map Mark”: giải mã ký hiệu bản đồ.', [O('discover_clue', 'map_mark', 1, 'Giải mã ký hiệu')]),
// --- Chương 5 ---
Q('forest_explorer', 'chapter_05', 'Forest Explorer', 'Nhặt 15 mẫu vật trong Rừng Sương, ít nhất 5 loại.', [O('forage', '', 15, 'Mẫu vật'), O('forage', 'kinds', 5, 'Số loại mẫu vật')]),
Q('nature_notes', 'chapter_05', 'Nature Notes', 'Cụ Mộc → “Nature Notes”: mô tả vật chưa biết tên.', [O('describe', 'nature_notes', 1, 'Viết ghi chú tự nhiên')], { coins:25, exp:15 }),
Q('weather_alert', 'chapter_05', 'Weather Alert', 'Cụ Mộc → “Weather Alert”: thông báo thời tiết, hướng dẫn mọi người trú mưa.', [O('dialogue_success', 'weather_alert', 1, 'Xử lý sự kiện thời tiết')]),
Q('protect_wetlands', 'chapter_05', 'Protect the Wetlands', 'Cụ Mộc → “Protect the Wetlands”: chọn phương án bảo vệ môi trường.', [O('interact', 'protect', 1, 'Chọn phương án')]),
Q('old_friend', 'chapter_05', 'The Old Friend', 'Cụ Mộc → “The Old Friend”: hỏi về Grandpa.', [O('dialogue_success', 'old_friend', 1, 'Hỏi về Grandpa'), O('discover_clue', 'page_05', 1, 'Nhận trang nhật ký')]),
// --- Chương 6 ---
Q('prepare_ingredients', 'chapter_06', 'Prepare the Ingredients', 'Chef Bo → “Ingredients”: chọn đúng nguyên liệu.', [O('interact', 'ingredients', 1, 'Chuẩn bị nguyên liệu')]),
Q('take_order', 'chapter_06', 'Take the Order', 'Chef Bo → “Orders”: nhận 6 order.', [O('interact', 'order', 6, 'Order đã nhận')]),
Q('repeat_to_confirm', 'chapter_06', 'Repeat to Confirm', 'Nhắc lại chính xác ít nhất 5 yêu cầu của khách.', [O('interact', 'confirm_ok', 5, 'Xác nhận đúng')]),
Q('whats_in_dish', 'chapter_06', 'What’s in This Dish?', 'Chef Bo → “Introduce a Dish”: giới thiệu món trong 6–8 câu.', [O('describe', 'dish_intro', 1, 'Giới thiệu món ăn')], { coins:25, exp:15 }),
Q('grandpas_recipe', 'chapter_06', 'Grandpa’s Recipe', 'Chef Bo → “The Old Recipe”: tìm công thức cũ.', [O('discover_clue', 'recipe', 1, 'Tìm công thức')]),
// --- Chương 7 ---
Q('english_corner', 'chapter_07', 'English Corner', 'Pete → “English Corner”: tổ chức 3 cuộc trò chuyện.', [O('dialogue_success', 'english_corner', 3, 'Cuộc trò chuyện')]),
Q('lost_visitor', 'chapter_07', 'Lost Visitor', 'Daisy → “Lost Visitors”: dẫn đường thành công cho 3 khách.', [O('deliver', 'lost_visitor', 3, 'Khách đã được dẫn đường')]),
Q('old_letters', 'chapter_07', 'The Old Letters', 'Nhà dân (Town Homes) → đọc và ghép 3 lá thư cũ.', [O('interact', 'letters', 3, 'Thư đã ghép')]),
Q('missing_pages', 'chapter_07', 'The Missing Pages', 'Sau khi ghép thư: tìm các trang nhật ký.', [O('discover_clue', 'pages_found', 1, 'Tìm các trang thất lạc')]),
Q('sams_question', 'chapter_07', 'Sam’s Question', 'Sam (thị trấn) → trò chuyện về Đồng Tháp.', [O('dialogue_success', 'sam_question', 1, 'Trò chuyện với Sam')], { coins:25, exp:15 }),
// --- Chương 8 ---
Q('welcome_station', 'chapter_08', 'Welcome Station', 'Đình làng → “Open Day”: chào đón khách, giới thiệu bản thân.', [O('dialogue_success', 'open_welcome', 1, 'Trạm chào đón')]),
Q('market_station', 'chapter_08', 'Market Station', 'Đình làng → “Open Day”: giới thiệu nông sản, món ăn, giá cả.', [O('dialogue_success', 'open_market', 1, 'Trạm chợ')]),
Q('garden_tour', 'chapter_08', 'Garden Tour', 'Đình làng → “Open Day”: dẫn khách tham quan.', [O('dialogue_success', 'open_tour', 1, 'Trạm tham quan')]),
Q('unexpected_question', 'chapter_08', 'The Unexpected Question', 'Đình làng → “Open Day”: trả lời câu hỏi cuối cùng.', [O('describe', 'open_final', 1, 'Câu hỏi bất ngờ')], { coins:50, exp:30 })
];
EF.QUESTS = {}; list.forEach(q => { EF.QUESTS[q.id] = q; });
})();
