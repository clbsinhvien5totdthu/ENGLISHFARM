// ====== HỘI THOẠI (Design Bible §3) ======
// Hai dạng dữ liệu cùng chạy trên DialogueSystem:
//  1) turns: danh sách lượt tuyến tính  [lời NPC, dịch, [[câu chọn, dịch, q], ...], {free:{...}}]
//     q = 2 phù hợp ngữ cảnh · 1 chiến lược giao tiếp chấp nhận được (hỏi lại, mô tả vòng) · 0 chưa đúng ngữ cảnh (NPC hỏi lại, được chọn lại)
//  2) nodes: sơ đồ node có nhánh {start, nodes:{id:{text, choices:[{id,text,next,q,fb}], next, type:'end', setFlags}}}
// kind: dialogue_success | describe | deliver  ·  tag: nhãn đếm cho quest  ·  pass: tỉ lệ điểm tối thiểu để thành công
(() => {
const EF = (window.EF = window.EF || {});
const D = EF.DIALOGUES = {};
const def = (id, o, turns) => { D[id] = Object.assign({ id, kind:'dialogue_success', pass:.6 }, o, { turns }); };
const T = (en, vi, opts, extra) => Object.assign({ en, vi, opts: opts.map(o => ({ en:o[0], vi:o[1], q:o[2] })) }, extra || {});

// ---------- Prologue: Sam hỏi đường (dạng node có nhánh) ----------
D.sam_library_01 = { id:'sam_library_01', speaker:'sam', name:'Sam 🎒', chapter:'prologue', kind:'dialogue_success', tag:'sam_library', start:'ask_library', nodes:{
  ask_library:{ text:'Excuse me, could you tell me where the library is?', vi:'Xin lỗi, bạn có thể chỉ giúp mình thư viện ở đâu không?', choices:[
    { id:'direction', text:'Go straight and turn left.', vi:'Đi thẳng rồi rẽ trái.', next:'ask_location', q:2 },
    { id:'dont_know', text:'Sorry, I don’t know.', vi:'Xin lỗi, mình không biết.', next:'ask_for_help', q:1, fb:'Không biết cũng là một câu trả lời hợp lý — quan trọng là bạn tiếp tục giúp.' },
    { id:'off', text:'The library is very interesting.', vi:'Thư viện rất thú vị.', next:'off_topic', q:0 } ] },
  off_topic:{ text:'Um... but how do I get there?', vi:'Ừm... nhưng mình đi tới đó bằng cách nào?', fb:'Câu này chưa đúng ngữ cảnh: Sam cần chỉ đường.', retry:'ask_library' },
  ask_location:{ text:'Is it next to the canteen?', vi:'Nó nằm cạnh căng-tin phải không?', choices:[
    { id:'yes', text:'Yes, it is next to the canteen.', vi:'Vâng, nó nằm cạnh căng-tin.', next:'complete', q:2 },
    { id:'repeat', text:'Sorry, could you say that again?', vi:'Xin lỗi, bạn nói lại được không?', next:'complete', q:1, fb:'Hỏi lại khi chưa nghe rõ là chiến lược rất tốt.' },
    { id:'blank', text:'Um... er...', vi:'Ừm... à...', next:'wait', q:0 } ] },
  wait:{ text:'No problem. Take your time.', vi:'Không sao. Bạn cứ từ từ.', retry:'ask_location', fb:'Sam kiên nhẫn chờ. Hít thở và thử lại nhé.' },
  ask_for_help:{ text:'Could you help me find someone who knows?', vi:'Bạn giúp mình tìm người biết đường được không?', choices:[
    { id:'sure', text:'Sure. Let’s ask Emma.', vi:'Được. Mình hỏi cô Emma nhé.', next:'complete', q:2 },
    { id:'ok', text:'Okay, wait here.', vi:'Được, bạn đợi ở đây.', next:'complete', q:1 } ] },
  complete:{ type:'end', setFlags:['prologue.sam_met'], text:'Thank you so much! You are kind.', vi:'Cảm ơn bạn nhiều! Bạn tốt bụng quá.' }
} };
// Cảnh kết: Sam hỏi lại câu của Prologue, lần này người chơi tự tin
D.sam_library_02 = { id:'sam_library_02', speaker:'sam', name:'Sam 🎒', chapter:'chapter_08', kind:'dialogue_success', tag:'sam_library_final', start:'ask', nodes:{
  ask:{ text:'Excuse me, could you tell me where the library is?', vi:'Xin lỗi, bạn có thể chỉ giúp mình thư viện ở đâu không?', choices:[
    { id:'lead', text:'Of course! Go straight, then turn left. It is next to the canteen. Come with me — I will take you there.', vi:'Dĩ nhiên! Đi thẳng rồi rẽ trái, nó cạnh căng-tin. Đi cùng mình nhé, mình dẫn bạn tới.', next:'complete', q:2 },
    { id:'direct', text:'Go straight and turn left. It is next to the canteen.', vi:'Đi thẳng rồi rẽ trái. Nó cạnh căng-tin.', next:'complete', q:2 } ] },
  complete:{ type:'end', setFlags:['finale.sam_led'], text:'You sound so confident now! Thank you!', vi:'Giờ bạn nghe thật tự tin! Cảm ơn bạn!' }
} };

// ---------- Chương 1 ----------
def('emma_test', { speaker:'emma', name:'Emma 🎓', chapter:'chapter_01', tag:'farm_intro', turnsGoal:6 }, [
  T('Welcome to the farm! What is this place?', 'Chào mừng đến nông trại! Đây là nơi nào?', [['This is my grandfather’s farm.', 'Đây là nông trại của ông mình.', 2], ['It is... farm... I think.', 'Nó là... nông trại... mình nghĩ vậy.', 1], ['I like pizza.', 'Mình thích pizza.', 0]]),
  T('What do you do here every day?', 'Mỗi ngày bạn làm gì ở đây?', [['I plant seeds and water the crops.', 'Mình gieo hạt và tưới cây.', 2], ['Sorry, could you repeat the question?', 'Xin lỗi, cô nhắc lại câu hỏi được không?', 1], ['I sleep on the moon.', 'Mình ngủ trên mặt trăng.', 0]]),
  T('What can you grow on this farm?', 'Bạn có thể trồng gì ở nông trại này?', [['I can grow carrots, radishes and beans.', 'Mình trồng được cà rốt, củ cải và đậu.', 2], ['Many vegetables.', 'Nhiều loại rau.', 1], ['A carrot is a car.', 'Cà rốt là xe hơi.', 0]]),
  T('When do you harvest the crops?', 'Khi nào bạn thu hoạch?', [['We harvest when the crops are ready.', 'Chúng mình thu hoạch khi cây đã chín.', 2], ['In the morning?', 'Vào buổi sáng à?', 1], ['The farm is blue.', 'Nông trại màu xanh.', 0]]),
  T('How do you feel about farm work?', 'Bạn thấy công việc nông trại thế nào?', [['It is hard, but I enjoy it.', 'Nó vất vả nhưng mình thích.', 2], ['Good.', 'Tốt.', 1], ['No farm. Banana.', 'Không nông trại. Chuối.', 0]]),
  T('What do you want to learn here?', 'Bạn muốn học gì ở đây?', [['I want to speak English with confidence.', 'Mình muốn nói tiếng Anh tự tin.', 2], ['English... maybe.', 'Tiếng Anh... có lẽ.', 1], ['I do not want. Table.', 'Mình không muốn. Cái bàn.', 0]])
]);

// ---------- Chương 2 ----------
def('lily_flower', { speaker:'lily', name:'Lily 🌼', chapter:'chapter_02', kind:'describe', tag:'flower_desc', turnsGoal:7 }, [
  T('Welcome to our flower garden! Which flower do you like?', 'Chào mừng đến vườn hoa! Bạn thích loài hoa nào?', [['I like the lotus. It is very beautiful.', 'Mình thích hoa sen. Nó rất đẹp.', 2], ['Flower... yes.', 'Hoa... vâng.', 1], ['The market is closed.', 'Chợ đóng cửa rồi.', 0]]),
  T('What colour is it?', 'Nó màu gì?', [['It is pink and white.', 'Nó màu hồng và trắng.', 2], ['I forget the word. It is like the sunrise.', 'Mình quên từ đó. Nó giống bình minh.', 1], ['It is loud.', 'Nó ồn ào.', 0]]),
  T('What shape are the petals?', 'Cánh hoa có hình dạng thế nào?', [['The petals are soft and round.', 'Cánh hoa mềm và tròn.', 2], ['Sorry, what is “petal”?', 'Xin lỗi, “petal” là gì?', 1], ['They are twelve o’clock.', 'Chúng là mười hai giờ.', 0]]),
  T('How does it smell?', 'Nó có mùi thế nào?', [['It has a sweet, fresh fragrance.', 'Nó có hương thơm ngọt, tươi mát.', 2], ['It smells... good.', 'Nó thơm... tốt.', 1], ['It smells like a table.', 'Nó có mùi cái bàn.', 0]]),
  T('Where does it grow?', 'Nó mọc ở đâu?', [['It grows in ponds and calm water.', 'Nó mọc ở ao và nước lặng.', 2], ['In water, I think.', 'Trong nước, mình nghĩ vậy.', 1], ['On the moon.', 'Trên mặt trăng.', 0]]),
  T('Why is it special for your village?', 'Vì sao nó đặc biệt với làng bạn?', [['Many families grow it, and it is part of our village life.', 'Nhiều gia đình trồng nó, và nó là một phần đời sống làng mình.', 2], ['It is... famous.', 'Nó... nổi tiếng.', 1], ['I do not like flowers.', 'Mình không thích hoa.', 0]]),
  T('Please describe it for a visitor in one sentence.', 'Hãy mô tả nó cho khách tham quan trong một câu.', [['It is a colourful flower with delicate petals and a lovely fragrance.', 'Nó là loài hoa nhiều màu với cánh mỏng manh và hương thơm dễ chịu.', 2], ['It is a nice flower.', 'Nó là một loài hoa đẹp.', 1], ['No.', 'Không.', 0]])
]);

// ---------- Chương 3 ----------
def('mia_sell', { speaker:'mia', name:'Customer 🛍️', chapter:'chapter_03', tag:'market_sell', turnsGoal:7 }, [
  T('Hello! Do you have any fresh vegetables?', 'Xin chào! Chỗ bạn có rau tươi không?', [['Yes, we have fresh carrots and beans.', 'Có, chúng tôi có cà rốt và đậu tươi.', 2], ['Yes... vegetables.', 'Có... rau.', 1], ['No, I am a fish.', 'Không, tôi là con cá.', 0]]),
  T('I want something cheap. What do you recommend?', 'Tôi muốn món rẻ. Bạn gợi ý gì?', [['I recommend the radishes. They are cheap today.', 'Tôi gợi ý củ cải. Hôm nay chúng rẻ.', 2], ['Maybe this one?', 'Có lẽ món này?', 1], ['Everything is a cloud.', 'Mọi thứ là đám mây.', 0]]),
  T('How much are two bunches of carrots?', 'Hai bó cà rốt giá bao nhiêu?', [['Two bunches are six coins.', 'Hai bó là sáu đồng.', 2], ['Six?', 'Sáu?', 1], ['I like carrots very much.', 'Mình rất thích cà rốt.', 0]]),
  T('That is a little expensive. Can you give me a discount?', 'Hơi đắt. Bạn giảm giá cho tôi được không?', [['Okay, I can give you a ten percent discount.', 'Được, tôi giảm cho bạn mười phần trăm.', 2], ['Maybe... a little.', 'Có lẽ... một chút.', 1], ['No. Go home.', 'Không. Về nhà đi.', 0]]),
  T('Great! I will take three bunches. Here is a large note.', 'Tuyệt! Tôi lấy ba bó. Đây là tờ tiền lớn.', [['Thank you. Here is your change.', 'Cảm ơn. Đây là tiền thừa của bạn.', 2], ['Yes... money.', 'Vâng... tiền.', 1], ['I do not have a bag.', 'Tôi không có cái túi.', 0]]),
  T('Could I have a receipt, please?', 'Cho tôi xin hóa đơn được không?', [['Of course. Here is your receipt.', 'Dĩ nhiên. Đây là hóa đơn của bạn.', 2], ['Receipt? Sorry, could you say it again?', 'Hóa đơn? Xin lỗi, bạn nói lại được không?', 1], ['There are no receipts in the river.', 'Không có hóa đơn trong sông.', 0]]),
  T('Thank you! Do you sell flowers too?', 'Cảm ơn! Bạn có bán hoa không?', [['Not today, but you can visit the Plant Workshop.', 'Hôm nay không, nhưng bạn có thể ghé Plant Workshop.', 2], ['Flowers... Workshop?', 'Hoa... Workshop?', 1], ['Yes, they swim.', 'Có, chúng biết bơi.', 0]])
], { clueNote:null });

// ---------- Chương 4 ----------
def('hai_fish', { speaker:'hai', name:'Captain Hai ⚓', chapter:'chapter_04', kind:'describe', tag:'fish_desc', turnsGoal:7 }, [
  T('Look at the fish in the bucket. What do you see?', 'Nhìn con cá trong xô. Bạn thấy gì?', [['I see a small silver fish.', 'Mình thấy một con cá bạc nhỏ.', 2], ['A fish.', 'Một con cá.', 1], ['I see a car.', 'Mình thấy xe hơi.', 0]]),
  T('What colour is it?', 'Nó màu gì?', [['It is silver with a dark back.', 'Nó màu bạc, lưng sẫm.', 2], ['Silver.', 'Màu bạc.', 1], ['It is a song.', 'Nó là bài hát.', 0]]),
  T('What is its shape?', 'Hình dạng của nó thế nào?', [['It has a long, thin body and a small tail.', 'Nó có thân dài, mảnh và đuôi nhỏ.', 2], ['Long... thin?', 'Dài... mảnh?', 1], ['It is a square.', 'Nó là hình vuông.', 0]]),
  T('What does it do in the water?', 'Nó làm gì dưới nước?', [['It swims fast near the surface.', 'Nó bơi nhanh gần mặt nước.', 2], ['It... goes.', 'Nó... đi.', 1], ['It sings.', 'Nó hát.', 0]]),
  T('Does it live in deep or shallow water?', 'Nó sống ở nước sâu hay nước nông?', [['It lives in shallow water near the plants.', 'Nó sống ở nước nông gần cây cỏ.', 2], ['Shallow, I think.', 'Nước nông, mình nghĩ vậy.', 1], ['In the sky.', 'Trên trời.', 0]]),
  T('How can you recognise it?', 'Làm sao bạn nhận ra nó?', [['It has small scales and a bright fin.', 'Nó có vảy nhỏ và vây sáng.', 2], ['Fin... and scales.', 'Vây... và vảy.', 1], ['By its hat.', 'Qua cái mũ của nó.', 0]]),
  T('Now tell me: what is its name?', 'Giờ nói chú nghe: tên của nó là gì?', [['Maybe it is a small river fish. Could you tell me its name?', 'Có lẽ là cá sông nhỏ. Chú cho mình biết tên được không?', 2], ['I do not know. Can you help me?', 'Mình không biết. Chú giúp mình được không?', 1], ['It is a horse.', 'Nó là con ngựa.', 0]])
]);
def('river_journal', { speaker:'hai', name:'Captain Hai ⚓', chapter:'chapter_04', kind:'interact', tag:'river_journal', pass:.5, reward:{ coins:10, exp:8 } }, [
  T('Write today’s note. How is the river today?', 'Ghi chép hôm nay. Dòng sông hôm nay thế nào?', [['Today the river is calm and the sky is clear.', 'Hôm nay sông lặng và trời quang.', 2], ['River calm.', 'Sông lặng.', 1], ['Today is river.', 'Hôm nay là sông.', 0]]),
  T('What did you see?', 'Bạn đã thấy gì?', [['I saw many fish near the surface.', 'Mình thấy nhiều cá gần mặt nước.', 2], ['Fish... many.', 'Cá... nhiều.', 1], ['I saw a mountain of soup.', 'Mình thấy núi canh.', 0]]),
  T('What did you learn?', 'Bạn học được gì?', [['I learned that the current is slower in shallow water.', 'Mình học được rằng dòng chảy chậm hơn ở nước nông.', 2], ['Water... slow.', 'Nước... chậm.', 1], ['I learned nothing, only pizza.', 'Mình chẳng học gì, chỉ có pizza.', 0]])
]);
def('missing_mark', { speaker:'hai', name:'Captain Hai ⚓', chapter:'chapter_04', kind:'interact', tag:'map_mark', pass:.5, clue:'map_mark' }, [
  T('This mark is on Grandpa’s map. What do you think it means?', 'Ký hiệu này nằm trên bản đồ của ông. Bạn nghĩ nó nghĩa gì?', [['It shows a wave and an ear. Maybe it means: listen to the water.', 'Nó vẽ sóng và cái tai. Có lẽ nghĩa là: hãy lắng nghe nước.', 2], ['A line... I am not sure.', 'Một đường... mình không chắc.', 1], ['It is a chicken.', 'Nó là con gà.', 0]]),
  T('Where should we go to listen?', 'Ta nên đi đâu để lắng nghe?', [['We should go to the wetlands near the forest.', 'Ta nên tới vùng đất ngập nước gần khu rừng.', 2], ['Forest?', 'Rừng?', 1], ['To the bakery.', 'Tới tiệm bánh.', 0]])
]);

// ---------- Chương 5 ----------
def('moss_notes', { speaker:'moss', name:'Elder Moss 🧙', chapter:'chapter_05', kind:'describe', tag:'nature_notes', turnsGoal:4 }, [
  T('I found something. I do not know its name. Can you write a note?', 'Ta tìm được một vật mà không biết tên. Con ghi chú giúp ta được không?', [['Of course. What does it look like?', 'Dĩ nhiên. Nó trông thế nào?', 2], ['Note?', 'Ghi chú?', 1], ['I want pizza.', 'Mình muốn pizza.', 0]]),
  T('It is small, round and green. What is it like?', 'Nó nhỏ, tròn và xanh. Nó giống gì?', [['It is a small, round, green thing with a smooth skin.', 'Là một vật nhỏ, tròn, xanh, vỏ mịn.', 2], ['It is... a thing.', 'Nó là... một vật.', 1], ['It is a bus.', 'Nó là xe buýt.', 0]]),
  T('Where did I find it? Near the water, under a big tree. What might it do?', 'Ta tìm thấy nó gần nước, dưới cây lớn. Nó có thể làm gì?', [['Maybe it is food for birds that live near the water.', 'Có lẽ là thức ăn cho chim sống gần nước.', 2], ['Maybe a plant.', 'Có lẽ là cây.', 1], ['It drives.', 'Nó lái xe.', 0]]),
  T('If you do not know a word, what can you do?', 'Nếu không biết một từ, con có thể làm gì?', [['I can describe it, or ask: “What is this called?”', 'Mình có thể mô tả nó, hoặc hỏi: “Cái này gọi là gì?”', 2], ['I ask someone.', 'Mình hỏi người khác.', 1], ['I stay silent.', 'Mình im lặng.', 0]])
]);
def('moss_weather', { speaker:'moss', name:'Elder Moss 🧙', chapter:'chapter_05', tag:'weather_alert', turnsGoal:3 }, [
  T('Look! Dark clouds. People are standing in the open field. What do you tell them?', 'Nhìn kìa! Mây đen. Mọi người đang đứng giữa đồng. Con nói gì với họ?', [['Attention, please! It is going to rain. Please come to the shelter.', 'Xin chú ý! Trời sắp mưa. Mời mọi người vào chỗ trú.', 2], ['Rain! Go! Go!', 'Mưa! Đi! Đi!', 1], ['The sun is very hot.', 'Mặt trời rất nóng.', 0]]),
  T('An old man cannot walk fast. What do you say?', 'Một cụ già đi không nhanh. Con nói gì?', [['Let me help you. The shelter is over there, on the left.', 'Để cháu giúp. Chỗ trú ở đằng kia, bên trái.', 2], ['Walk quickly.', 'Đi nhanh lên.', 1], ['Stay in the rain.', 'Ở lại dưới mưa.', 0]]),
  T('When the rain stops, what should we check?', 'Khi mưa tạnh, ta nên kiểm tra gì?', [['We should check the plants and the river.', 'Ta nên kiểm tra cây cối và dòng sông.', 2], ['Everything.', 'Mọi thứ.', 1], ['Nothing.', 'Không gì cả.', 0]])
]);
def('moss_protect', { speaker:'moss', name:'Elder Moss 🧙', chapter:'chapter_05', kind:'interact', tag:'protect', pass:.5 }, [
  T('How can we protect the wetlands?', 'Làm sao ta bảo vệ vùng đất ngập nước?', [['We can reduce plastic and keep the water clean.', 'Ta có thể giảm nhựa và giữ nước sạch.', 2], ['We can plant more trees and protect the habitat.', 'Ta có thể trồng thêm cây và bảo vệ môi trường sống.', 2], ['We can throw rubbish in the river.', 'Ta có thể vứt rác xuống sông.', 0]]),
  T('Why is that important?', 'Vì sao điều đó quan trọng?', [['Because animals need a clean home to survive.', 'Vì động vật cần một nơi ở sạch để sống sót.', 2], ['Because... good.', 'Vì... tốt.', 1], ['Because rubbish is fun.', 'Vì rác vui.', 0]])
]);
def('moss_friend', { speaker:'moss', name:'Elder Moss 🧙', chapter:'chapter_05', tag:'old_friend', clue:'page_05', pass:.5, turnsGoal:3 }, [
  T('You want to ask me about your grandfather? Go on.', 'Con muốn hỏi ta về ông con? Cứ hỏi.', [['Did you know my grandfather well?', 'Cụ có biết ông cháu rõ không?', 2], ['Grandpa? You?', 'Ông? Cụ?', 1], ['Where is the bus?', 'Xe buýt ở đâu?', 0]]),
  T('Yes. We wrote about the wetlands together, long ago.', 'Có. Chúng ta từng viết về vùng ngập nước cùng nhau, từ lâu rồi.', [['What did you write together?', 'Hai người đã viết gì cùng nhau?', 2], ['Wetlands... book?', 'Vùng ngập nước... sách?', 1], ['I like soup.', 'Cháu thích canh.', 0]]),
  T('A bilingual book to show our home to the world. Do you want these first pages?', 'Một cuốn sổ song ngữ để giới thiệu quê hương ra thế giới. Con muốn nhận những trang đầu này không?', [['Yes, please. I will take care of them.', 'Vâng ạ. Cháu sẽ giữ gìn chúng.', 2], ['Yes. Thank you.', 'Vâng. Cảm ơn cụ.', 1], ['No, give them to the cat.', 'Không, đưa cho con mèo.', 0]])
]);

// ---------- Chương 6 ----------
def('chef_dish', { speaker:'chef', name:'Chef Bo 🍲', chapter:'chapter_06', kind:'describe', tag:'dish_intro', turnsGoal:6 }, [
  T('Let us introduce sour fish soup to our guests. How do you start?', 'Ta giới thiệu canh chua cá cho khách. Bạn mở đầu thế nào?', [['This is sour fish soup, a local dish from our village.', 'Đây là canh chua cá, món địa phương của làng mình.', 2], ['Fish soup.', 'Canh cá.', 1], ['This is a shoe.', 'Đây là chiếc giày.', 0]]),
  T('What are the main ingredients?', 'Nguyên liệu chính là gì?', [['The main ingredients are fish, tomatoes and fresh herbs.', 'Nguyên liệu chính là cá, cà chua và rau thơm tươi.', 2], ['Fish... tomato.', 'Cá... cà chua.', 1], ['Only rocks.', 'Chỉ có đá.', 0]]),
  T('How does it taste?', 'Nó có vị thế nào?', [['It tastes sour and a little sweet.', 'Nó có vị chua và hơi ngọt.', 2], ['It is... delicious.', 'Nó... ngon.', 1], ['It tastes like a chair.', 'Nó có vị như cái ghế.', 0]]),
  T('How do we cook it?', 'Ta nấu nó thế nào?', [['First we boil the water, then we add the fish and vegetables.', 'Đầu tiên ta đun sôi nước, rồi cho cá và rau vào.', 2], ['Boil... fish.', 'Đun... cá.', 1], ['We paint it.', 'Ta sơn nó.', 0]]),
  T('When do people eat it?', 'Mọi người ăn nó khi nào?', [['Families eat it on hot days with rice.', 'Các gia đình ăn nó vào ngày nóng cùng cơm.', 2], ['With rice.', 'Với cơm.', 1], ['At midnight in the tree.', 'Nửa đêm trên cây.', 0]]),
  T('Finish with a recommendation for the guests.', 'Hãy kết thúc bằng lời gợi ý cho khách.', [['I recommend you try it. It is warm, fresh and full of flavour.', 'Mình gợi ý bạn thử. Nó ấm, tươi và đậm đà.', 2], ['Please try it.', 'Mời bạn thử.', 1], ['Do not eat.', 'Đừng ăn.', 0]])
]);

// ---------- Chương 7: English Corner (3 cuộc trò chuyện) ----------
const corner = (n, topic, qs) => def('corner_' + n, { speaker:'pete', name:'English Corner 🌬️', chapter:'chapter_07', tag:'english_corner', pass:.6, topic }, qs);
corner(1, 'Hobbies', [
  T('Welcome to English Corner! Please introduce yourself.', 'Chào mừng đến English Corner! Hãy giới thiệu bản thân.', [['Hello, I am a student. I live on a farm.', 'Xin chào, mình là sinh viên. Mình sống ở nông trại.', 2], ['Hello. Name... farm.', 'Xin chào. Tên... nông trại.', 1], ['Goodbye.', 'Tạm biệt.', 0]]),
  T('What do you like to do in your free time?', 'Lúc rảnh bạn thích làm gì?', [['I like fishing and growing vegetables.', 'Mình thích câu cá và trồng rau.', 2], ['Fishing.', 'Câu cá.', 1], ['I like homework on the roof.', 'Mình thích bài tập trên mái nhà.', 0]]),
  T('Why do you enjoy it?', 'Vì sao bạn thích?', [['Because it is quiet and I can relax.', 'Vì nó yên tĩnh và mình thư giãn được.', 2], ['Because... good.', 'Vì... tốt.', 1], ['Because rain.', 'Vì mưa.', 0]]),
  T('Would you like to ask me a question?', 'Bạn muốn hỏi mình điều gì không?', [['Yes. What do you like to do on weekends?', 'Có. Cuối tuần bạn thích làm gì?', 2], ['You? Weekend?', 'Bạn? Cuối tuần?', 1], ['No pizza.', 'Không pizza.', 0]])
]);
corner(2, 'Weekend', [
  T('What did you do last weekend?', 'Cuối tuần trước bạn đã làm gì?', [['I visited the market with my friends.', 'Mình đi chợ với bạn bè.', 2], ['Market.', 'Chợ.', 1], ['I flew to Mars.', 'Mình bay lên sao Hỏa.', 0]]),
  T('Was it fun?', 'Có vui không?', [['Yes, it was fun. We ate fresh fruit.', 'Có, vui lắm. Bọn mình ăn trái cây tươi.', 2], ['Yes.', 'Có.', 1], ['No, fruit is a cloud.', 'Không, trái cây là đám mây.', 0]]),
  T('What will you do next weekend?', 'Cuối tuần sau bạn sẽ làm gì?', [['I will help my neighbour at the flower garden.', 'Mình sẽ giúp hàng xóm ở vườn hoa.', 2], ['Help... flower.', 'Giúp... hoa.', 1], ['I will sleep forever.', 'Mình sẽ ngủ mãi.', 0]]),
  T('Sorry, I did not catch that. Could you say it again?', 'Xin lỗi, mình chưa nghe rõ. Bạn nói lại được không?', [['Sure. I will help my neighbour at the flower garden.', 'Được. Mình sẽ giúp hàng xóm ở vườn hoa.', 2], ['Again... help neighbour.', 'Lại... giúp hàng xóm.', 1], ['No.', 'Không.', 0]])
]);
corner(3, 'Favourite place', [
  T('What is your favourite place in the village?', 'Nơi bạn thích nhất trong làng là đâu?', [['My favourite place is Moon Lake.', 'Nơi mình thích nhất là Hồ Trăng.', 2], ['Lake.', 'Hồ.', 1], ['A shoe shop.', 'Tiệm giày.', 0]]),
  T('What can people do there?', 'Mọi người có thể làm gì ở đó?', [['People can fish, watch birds and enjoy the quiet.', 'Mọi người có thể câu cá, ngắm chim và tận hưởng sự yên tĩnh.', 2], ['Fish.', 'Câu cá.', 1], ['Sleep in a tree.', 'Ngủ trên cây.', 0]]),
  T('How do you feel when you are there?', 'Bạn cảm thấy thế nào khi ở đó?', [['I feel calm and proud of my home.', 'Mình thấy bình yên và tự hào về quê mình.', 2], ['I feel... good.', 'Mình thấy... tốt.', 1], ['I feel purple.', 'Mình thấy màu tím.', 0]]),
  T('Would you invite a visitor there?', 'Bạn có mời khách tới đó không?', [['Yes. I would invite every visitor and share my stories.', 'Có. Mình sẽ mời mọi khách và chia sẻ những câu chuyện.', 2], ['Yes, visitor.', 'Có, khách.', 1], ['Never. Soup.', 'Không bao giờ. Canh.', 0]])
]);
const visitor = (n, askEn, askVi, good, goodVi, weak, weakVi, far, farVi) => def('visitor_' + n, { speaker:'daisy', name:'Visitor 🧳', chapter:'chapter_07', kind:'deliver', tag:'lost_visitor', pass:.6 }, [
  T(askEn, askVi, [[good, goodVi, 2], [weak, weakVi, 1], ['The weather is nice.', 'Thời tiết đẹp.', 0]]),
  T('Is it far from here?', 'Chỗ đó có xa không?', [[far, farVi, 2], ['Not far.', 'Không xa.', 1], ['It is a banana.', 'Nó là quả chuối.', 0]])
]);
visitor(1, 'Excuse me, where can I buy flower seeds?', 'Xin lỗi, tôi mua hạt giống hoa ở đâu?', 'Go along the main street. The Plant Workshop is at the left end.', 'Đi dọc phố chính. Plant Workshop nằm ở cuối bên trái.', 'Sorry, I do not know. Let me ask Lily.', 'Xin lỗi, mình không biết. Để mình hỏi Lily.', 'No, it is about five minutes on foot.', 'Không, đi bộ khoảng năm phút.');
visitor(2, 'Hello! Could you tell me where the Village Hall is?', 'Xin chào! Bạn chỉ giúp Đình làng ở đâu được không?', 'Cross the bridge, then go straight. The Village Hall is on your right.', 'Qua cầu rồi đi thẳng. Đình làng ở bên phải bạn.', 'Straight... bridge... sorry. Please follow me.', 'Thẳng... cầu... xin lỗi. Mời đi theo mình.', 'It is not far. It is next to the market.', 'Không xa. Nó cạnh chợ.');
visitor(3, 'I am looking for a place to eat. Any ideas?', 'Tôi đang tìm chỗ ăn. Bạn có gợi ý nào không?', 'Turn left at the corner. The Food Stall is near the well.', 'Rẽ trái ở góc đường. Quầy ăn gần cái giếng.', 'Food... corner. I can show you.', 'Đồ ăn... góc đường. Mình dẫn bạn đi.', 'It is close. You can walk there in three minutes.', 'Gần thôi. Bạn đi bộ ba phút là tới.');
def('sam_question', { speaker:'sam', name:'Sam 🎒', chapter:'chapter_07', tag:'sam_question', pass:.6 }, [
  T('I want to learn about your hometown. What is it famous for?', 'Mình muốn biết về quê bạn. Nơi đó nổi tiếng về gì?', [['It is famous for its flowers, lotus ponds and river markets.', 'Nơi đó nổi tiếng với hoa, ao sen và chợ sông.', 2], ['Flowers... lotus.', 'Hoa... sen.', 1], ['It is famous for nothing.', 'Nó không nổi tiếng gì cả.', 0]]),
  T('What do people eat there?', 'Người ta ăn gì ở đó?', [['People eat fresh fish, rice and sour soup.', 'Người ta ăn cá tươi, cơm và canh chua.', 2], ['Fish. Rice.', 'Cá. Cơm.', 1], ['They eat clocks.', 'Họ ăn đồng hồ.', 0]]),
  T('What is the weather like in summer?', 'Mùa hè thời tiết thế nào?', [['It is hot and sunny, but sometimes it rains suddenly.', 'Trời nóng và nắng, nhưng đôi khi mưa bất chợt.', 2], ['Hot.', 'Nóng.', 1], ['It snows every day.', 'Ngày nào cũng có tuyết.', 0]]),
  T('Could you describe it in one more sentence for a friend abroad?', 'Bạn mô tả thêm một câu cho người bạn ở nước ngoài được không?', [['It is a quiet, friendly place where the river is part of daily life.', 'Đó là nơi yên tĩnh, thân thiện, nơi dòng sông là một phần cuộc sống.', 2], ['It is a nice place.', 'Đó là nơi đẹp.', 1], ['I do not know.', 'Mình không biết.', 0]]),
  T('Thank you! Can you tell me how to get to the lake?', 'Cảm ơn! Bạn chỉ mình đường tới hồ được không?', [['Go south past the farm. The lake is at the bottom of the path.', 'Đi về phía nam qua nông trại. Hồ nằm cuối con đường.', 2], ['South... farm.', 'Nam... nông trại.', 1], ['Fly up.', 'Bay lên.', 0]])
]);

// ---------- Chương 8: Open Day ----------
def('open_welcome', { speaker:'grandpa', name:'Guest 🎟️', chapter:'chapter_08', tag:'open_welcome', pass:.6 }, [
  T('Hello! Is this the English Farm Open Day?', 'Xin chào! Đây có phải Open Day của English Farm không?', [['Yes, welcome! My name is the Gardener. I am happy to see you.', 'Vâng, chào mừng! Mình là Gardener. Mình rất vui được gặp bạn.', 2], ['Yes. Welcome.', 'Vâng. Chào mừng.', 1], ['No. Go away.', 'Không. Đi chỗ khác.', 0]]),
  T('Who are you? What do you do here?', 'Bạn là ai? Bạn làm gì ở đây?', [['I am a student. I take care of this farm and I love sharing it.', 'Mình là sinh viên. Mình chăm nông trại này và rất thích chia sẻ nó.', 2], ['I am student. Farm.', 'Mình sinh viên. Nông trại.', 1], ['I am a spoon.', 'Mình là cái thìa.', 0]]),
  T('Where are you from?', 'Bạn đến từ đâu?', [['I am from Đồng Tháp, a village by the river.', 'Mình đến từ Đồng Tháp, một ngôi làng bên sông.', 2], ['From here. Village.', 'Từ đây. Làng.', 1], ['From the bakery.', 'Từ tiệm bánh.', 0]]),
  T('Sorry, I did not understand. Could you say that again?', 'Xin lỗi, tôi chưa hiểu. Bạn nói lại được không?', [['Of course. I am from Đồng Tháp, a village by the river.', 'Dĩ nhiên. Mình đến từ Đồng Tháp, một làng bên sông.', 2], ['Again: Đồng Tháp, village.', 'Lại nhé: Đồng Tháp, làng.', 1], ['Never.', 'Không bao giờ.', 0]])
]);
def('open_market', { speaker:'mia', name:'Guest 🎟️', chapter:'chapter_08', tag:'open_market', pass:.6 }, [
  T('These vegetables look so fresh! What are they?', 'Những loại rau này trông tươi quá! Chúng là gì?', [['These are carrots and beans. We harvested them this morning.', 'Đây là cà rốt và đậu. Bọn mình thu hoạch sáng nay.', 2], ['Carrots. Beans.', 'Cà rốt. Đậu.', 1], ['They are shoes.', 'Chúng là giày.', 0]]),
  T('How much is a basket?', 'Một giỏ giá bao nhiêu?', [['A basket is ten coins. It is a good price.', 'Một giỏ là mười đồng. Giá rất tốt.', 2], ['Ten?', 'Mười?', 1], ['Free. I like rocks.', 'Miễn phí. Mình thích đá.', 0]]),
  T('What local dish do you recommend?', 'Bạn gợi ý món địa phương nào?', [['I recommend sour fish soup. It tastes sour and a little sweet.', 'Mình gợi ý canh chua cá. Vị chua và hơi ngọt.', 2], ['Fish soup.', 'Canh cá.', 1], ['I recommend sand.', 'Mình gợi ý cát.', 0]]),
  T('Great, I will buy it. Is there a discount?', 'Tuyệt, tôi sẽ mua. Có giảm giá không?', [['Yes, you get a small discount today. Here is your receipt.', 'Có, hôm nay bạn được giảm nhỏ. Đây là hóa đơn.', 2], ['Yes, discount.', 'Có, giảm giá.', 1], ['No. Never.', 'Không. Không bao giờ.', 0]])
]);
def('open_tour', { speaker:'daisy', name:'Guest 🎟️', chapter:'chapter_08', tag:'open_tour', pass:.6 }, [
  T('Can you show me around the garden?', 'Bạn dẫn tôi tham quan khu vườn được không?', [['Of course. Please follow me. First, let us see the flowers.', 'Dĩ nhiên. Mời đi theo mình. Trước tiên ta xem những loài hoa.', 2], ['Follow me.', 'Đi theo mình.', 1], ['No garden.', 'Không có vườn.', 0]]),
  T('What is this flower?', 'Hoa này là gì?', [['It is a lotus. It has delicate petals and a sweet fragrance.', 'Đó là hoa sen. Nó có cánh mỏng và hương thơm ngọt.', 2], ['A lotus. Beautiful.', 'Hoa sen. Đẹp.', 1], ['It is a bicycle.', 'Nó là xe đạp.', 0]]),
  T('And what lives in the river?', 'Còn dưới sông có gì?', [['Many fish live there. They swim near the surface in the morning.', 'Nhiều loài cá sống ở đó. Chúng bơi gần mặt nước vào buổi sáng.', 2], ['Fish. Many.', 'Cá. Nhiều.', 1], ['Only cars.', 'Chỉ có xe hơi.', 0]]),
  T('The people here seem very friendly.', 'Người ở đây có vẻ rất thân thiện.', [['Thank you. Our community loves to share its stories.', 'Cảm ơn. Cộng đồng bọn mình thích chia sẻ câu chuyện.', 2], ['Thank you.', 'Cảm ơn.', 1], ['No, they are angry.', 'Không, họ đang giận.', 0]])
]);
def('open_final', { speaker:'grandpa', name:'Guest 🎟️', chapter:'chapter_08', kind:'describe', tag:'open_final', pass:.5, free:true }, [
  T('The Unexpected Question: “What does this garden mean to you? Please explain it to someone who has never been here.”', 'Câu hỏi bất ngờ: “Khu vườn này có ý nghĩa gì với bạn? Hãy giải thích cho người chưa từng đến đây.”', [], {
    free:{ need:[['garden','farm','place','village','home','here'], ['grandfather','grandpa','family','people','community','friends','neighbour','neighbours'], ['grow','plant','learn','speak','english','story','stories','share','words','flowers','river'], ['because','mean','feel','love','proud','happy','special','important']], min:12,
      tip:'Gợi ý: nói khu vườn là gì · ai gắn với nó · bạn học/làm gì · vì sao nó quan trọng. Quên từ thì mô tả vòng hoặc hỏi lại.' } })
]);
})();
