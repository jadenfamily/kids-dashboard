/* ============================================================================
   Jaden's Today v2 — js/shop.js
   상점 — 기본 목록 · 상점 화면 · 미리보기
   · 원본 index.html(운영본)의 같은 코드를 기능별로 나눈 파일입니다. 동작은 원본과 같아요.
   · 모듈끼리 같은 전역 스코프를 써요. index.html 에서 core → sync → ... 순서로 불러옵니다.
   ============================================================================ */
'use strict';

/* ---------------- 상점 기본 목록 ---------------- */
function defaultShopItems() {
  return [
    /* 🐾 펫 케어 */
    { id: 'food_basic', cat: 'pet', kind: 'exp', n: 10, name: '맛있는 사료', icon: '🍖', price: 15, color: '#ffb26b', desc: '알·친구 모두 +10 EXP' },
    { id: 'food_snack', cat: 'pet', kind: 'exp', n: 25, name: '특제 간식', icon: '🍪', price: 35, color: '#f0a35e', desc: '알·친구 모두 +25 EXP' },
    { id: 'food_super', cat: 'pet', kind: 'exp', n: 50, name: '슈퍼 진화 열매', icon: '🍎', price: 65, color: '#ff6b6b', desc: '알·친구 모두 +50 EXP' },
    { id: 'food_potion', cat: 'pet', kind: 'exp', n: 20, name: '먹이(경험치 물약)', icon: '🧪', price: 30, color: '#7ce0c0', desc: '알·친구 모두 +20 EXP' },

    /* 🏠 방 가구 */
    { id: 'room_bed', cat: 'room', kind: 'furni', fid: 'bed', w: 2, d: 1, name: '포근한 침대', icon: '🛏', price: 120, color: '#8fb8ff', desc: '2×1 · 눕고 싶은 침대' },
    { id: 'room_stool', cat: 'room', kind: 'furni', fid: 'stool', w: 1, d: 1, name: '동글 스툴', icon: '🪑', price: 40, color: '#ffc97a', desc: '1×1 · 앉는 의자' },
    { id: 'room_desk', cat: 'room', kind: 'furni', fid: 'desk', w: 2, d: 1, name: '나무 책상', icon: '📖', price: 90, color: '#c99b6a', desc: '2×1 · 공부하는 책상' },
    { id: 'room_sofa', cat: 'room', kind: 'furni', fid: 'sofa', w: 2, d: 1, name: '몽글 소파', icon: '🛋', price: 110, color: '#f6a5b8', desc: '2×1 · 폭신 소파' },
    { id: 'room_shelf', cat: 'room', kind: 'furni', fid: 'shelf', w: 1, d: 1, name: '책꽂이', icon: '📚', price: 80, color: '#b98a5c', desc: '1×1 · 책이 가득' },
    { id: 'room_rug', cat: 'room', kind: 'furni', fid: 'rug', w: 2, d: 2, name: '별무늬 러그', icon: '🟣', price: 50, color: '#b9a6ff', desc: '2×2 · 바닥 러그' },
    { id: 'room_plant', cat: 'room', kind: 'furni', fid: 'plant', w: 1, d: 1, name: '초록 화분', icon: '🌿', price: 35, color: '#79c98a', desc: '1×1 · 싱그러운 화분' },
    { id: 'room_wallshelf', cat: 'room', kind: 'furni', fid: 'wallshelf', w: 1, d: 2, name: '벽선반', icon: '🧺', price: 60, color: '#d8b48c', desc: '1×2 · 소품 선반' },
    { id: 'room_guitar', cat: 'room', kind: 'furni', fid: 'guitar', w: 1, d: 1, name: '기타', icon: '🎸', price: 70, color: '#e08a4a', desc: '1×1 · 띵가띵가' },
    { id: 'room_skate', cat: 'room', kind: 'furni', fid: 'skate', w: 2, d: 1, name: '스케이트보드', icon: '🛹', price: 45, color: '#7fd0e8', desc: '2×1 · 바닥 보드' },
    { id: 'room_lamp', cat: 'room', kind: 'furni', fid: 'lamp', w: 1, d: 1, name: '무드 전등', icon: '💡', price: 55, color: '#ffd97a', desc: '1×1 · 은은한 불빛' },
    { id: 'room_tent', cat: 'room', kind: 'furni', fid: 'tent', w: 2, d: 2, name: '비밀 텐트', icon: '⛺', price: 130, color: '#f2b46a', desc: '2×2 · 나만의 아지트' },
    { id: 'room_tv', cat: 'room', kind: 'furni', fid: 'tv', w: 2, d: 1, name: '작은 TV', icon: '📺', price: 140, color: '#8e9db5', desc: '2×1 · 만화 보는 TV' },

    /* 🎨 벽지 */
    { id: 'wall_cream', cat: 'wall', kind: 'wall', name: '크림 벽지', icon: '🧁', price: 0, color: '#fdf1e0', desc: '기본 벽지' },
    { id: 'wall_sky', cat: 'wall', kind: 'wall', name: '하늘 벽지', icon: '☁️', price: 60, color: '#cfe9ff', desc: '구름이 흘러요' },
    { id: 'wall_night', cat: 'wall', kind: 'wall', name: '별밤 벽지', icon: '🌙', price: 90, color: '#3a3f6b', desc: '별이 반짝' },
    { id: 'wall_forest', cat: 'wall', kind: 'wall', name: '숲속 벽지', icon: '🌳', price: 90, color: '#d8efd4', desc: '나무가 우거진' },
    { id: 'wall_cherry', cat: 'wall', kind: 'wall', name: '벚꽃 벽지', icon: '🌸', price: 120, color: '#ffe4ee', desc: '꽃잎이 팔랑' },
    { id: 'wall_galaxy', cat: 'wall', kind: 'wall', name: '은하수 벽지', icon: '🌌', price: 160, color: '#2b2550', desc: '우주 한가운데' },

    /* 👕 아바타 */
    /* --- 헤어: 남아 (0코인 = 바로 쓸 수 있어요) --- */
    { id: 'av_hair_short', cat: 'avatar', kind: 'cloth', slot: 'hair', style: 'crop', g: 'boy', name: '단정 숏컷', icon: '👦', price: 0, color: '#4a3018', desc: '남아 기본 숏컷' },
    { id: 'av_hair_dandy', cat: 'avatar', kind: 'cloth', slot: 'hair', style: 'dandy', g: 'boy', name: '댄디 투블럭', icon: '👦', price: 0, color: '#3f2a17', desc: '옆은 짧게, 위는 볼륨' },
    { id: 'av_hair_comma', cat: 'avatar', kind: 'cloth', slot: 'hair', style: 'comma', g: 'boy', name: '쉼표머리', icon: '👦', price: 0, color: '#4a3018', desc: '이마로 내려온 쉼표' },
    { id: 'av_hair_bowl', cat: 'avatar', kind: 'cloth', slot: 'hair', style: 'bowl', g: 'boy', name: '바가지 컷', icon: '🍄', price: 30, color: '#33220f', desc: '동글동글 바가지' },
    { id: 'av_hair_bang', cat: 'avatar', kind: 'cloth', slot: 'hair', style: 'bang', g: 'boy', name: '앞머리 내림', icon: '👦', price: 25, color: '#3f2a17', desc: '이마를 덮는 앞머리' },
    { id: 'av_hair_spiky', cat: 'avatar', kind: 'cloth', slot: 'hair', style: 'spiky', g: 'boy', name: '뾰족 스포츠', icon: '⚽', price: 25, color: '#4a3018', desc: '뾰족뾰족 활동파' },
    { id: 'av_hair_buzz', cat: 'avatar', kind: 'cloth', slot: 'hair', style: 'buzz', g: 'boy', name: '스포츠 머리', icon: '⚽', price: 25, color: '#4a3018', desc: '짧고 시원하게' },
    { id: 'av_hair_parted', cat: 'avatar', kind: 'cloth', slot: 'hair', style: 'parted', g: 'boy', name: '가르마 펌', icon: '👦', price: 35, color: '#5a3a1c', desc: '단정한 가르마' },
    { id: 'av_hair_regent', cat: 'avatar', kind: 'cloth', slot: 'hair', style: 'regent', g: 'boy', name: '리젠트 펌', icon: '💈', price: 45, color: '#4a3018', desc: '앞머리를 위로 올린 펌' },
    { id: 'av_hair_mohawk', cat: 'avatar', kind: 'cloth', slot: 'hair', style: 'mohawk', g: 'boy', name: '모히칸', icon: '🔥', price: 40, color: '#2b2438', desc: '가운데만 솟은 머리' },
    { id: 'av_hair_shag', cat: 'avatar', kind: 'cloth', slot: 'hair', style: 'shag', g: 'boy', name: '덮수룩 머리', icon: '🍂', price: 40, color: '#3a2412', desc: '눈썹까지 덮는 수룩수룩' },
    /* --- 헤어: 여아 (0코인 = 바로 쓸 수 있어요) --- */
    { id: 'av_hair_long', cat: 'avatar', kind: 'cloth', slot: 'hair', style: 'long', g: 'girl', name: '긴 생머리', icon: '👧', price: 0, color: '#4a3018', desc: '여아 기본 생머리' },
    { id: 'av_hair_bob', cat: 'avatar', kind: 'cloth', slot: 'hair', style: 'bob', g: 'girl', name: '단발 보브컷', icon: '💇', price: 0, color: '#5a3a1c', desc: '가지런한 단발' },
    { id: 'av_hair_pony', cat: 'avatar', kind: 'cloth', slot: 'hair', style: 'pony', g: 'girl', name: '높은 포니테일', icon: '🎀', price: 0, color: '#5a3a1c', desc: '머리 위에서 묶은 꼬리' },
    { id: 'av_hair_twin', cat: 'avatar', kind: 'cloth', slot: 'hair', style: 'twin', g: 'girl', name: '양갈래 리본', icon: '👧', price: 0, color: '#7a4a1f', desc: '깜찍 양갈래' },
    { id: 'av_hair_buns', cat: 'avatar', kind: 'cloth', slot: 'hair', style: 'buns', g: 'girl', name: '양갈래 만두', icon: '🍡', price: 40, color: '#3f2a17', desc: '머리 위 두 개의 만두' },
    { id: 'av_hair_wave', cat: 'avatar', kind: 'cloth', slot: 'hair', style: 'wave', g: 'girl', name: '긴 웨이브', icon: '🌊', price: 35, color: '#6b4423', desc: '찰랑찰랑 웨이브' },
    { id: 'av_hair_ribbon', cat: 'avatar', kind: 'cloth', slot: 'hair', style: 'ribbon', g: 'girl', name: '반묶음 리본', icon: '🎀', price: 30, color: '#5a3a1c', desc: '리본으로 반묶음' },
    { id: 'av_hair_bunup', cat: 'avatar', kind: 'cloth', slot: 'hair', style: 'bunup', g: 'girl', name: '당고머리', icon: '🍬', price: 35, color: '#3f2a17', desc: '머리 위 하나로 묶은 당고' },
    { id: 'av_hair_hime', cat: 'avatar', kind: 'cloth', slot: 'hair', style: 'hime', g: 'girl', name: '히메컷', icon: '🌷', price: 45, color: '#33220f', desc: '가지런 앞머리 + 옆머리' },
    { id: 'av_hair_braid', cat: 'avatar', kind: 'cloth', slot: 'hair', style: 'braid', g: 'girl', name: '사이드 브레이드', icon: '🎗', price: 40, color: '#5f3a1c', desc: '한쪽으로 땋은 머리' },
    { id: 'av_hair_poodle', cat: 'avatar', kind: 'cloth', slot: 'hair', style: 'poodle', g: 'girl', name: '뽀글 펌', icon: '🐩', price: 35, color: '#6b4423', desc: '동글동글 뽀글펌' },
    /* --- 헤어: 공용 --- */
    { id: 'av_hair_basic', cat: 'avatar', kind: 'cloth', slot: 'hair', style: 'short', g: 'boy', name: '기본 머리', icon: '💇', price: 0, color: '#6b4423', desc: '단정한 머리' },
    { id: 'av_hair_curly', cat: 'avatar', kind: 'cloth', slot: 'hair', style: 'curly', g: 'both', name: '곱슬곱슬', icon: '🌀', price: 35, color: '#5f3a1c', desc: '곱슬곱슬' },

    { id: 'av_top_tee', cat: 'avatar', kind: 'cloth', slot: 'top', style: 'tee', g: 'boy', name: '기본 티셔츠', icon: '👕', price: 0, color: '#ffffff', color2: '#7ec8f0', desc: '하얀 티셔츠' },
    { id: 'av_top_blouse', cat: 'avatar', kind: 'cloth', slot: 'top', style: 'blouse', g: 'girl', name: '분홍 블라우스', icon: '🎀', price: 0, color: '#ffd9e7', color2: '#ff9ec4', desc: '여아 기본 블라우스' },
    { id: 'av_top_stripe', cat: 'avatar', kind: 'cloth', slot: 'top', style: 'stripe', g: 'both', name: '줄무늬 티', icon: '👕', price: 25, color: '#ffffff', color2: '#ff8f8f', desc: '빨간 줄무늬' },
    { id: 'av_top_hood', cat: 'avatar', kind: 'cloth', slot: 'top', style: 'hood', g: 'both', name: '후드티', icon: '🧥', price: 40, color: '#7c9cf5', color2: '#5a7ce0', desc: '후드 + 주머니' },
    { id: 'av_top_knit', cat: 'avatar', kind: 'cloth', slot: 'top', style: 'knit', g: 'both', name: '포근 니트', icon: '🧶', price: 35, color: '#ffc46b', color2: '#ffa53d', desc: '보들보들 니트' },
    { id: 'av_top_soccer', cat: 'avatar', kind: 'cloth', slot: 'top', style: 'soccer', g: 'boy', name: '축구 유니폼', icon: '⚽', price: 45, color: '#4a86e8', color2: '#ffffff', desc: '등번호 7번 유니폼' },

    { id: 'av_bottom_jeans', cat: 'avatar', kind: 'cloth', slot: 'bottom', style: 'jeans', g: 'both', name: '청바지', icon: '👖', price: 0, color: '#5b8cc8', desc: '파란 청바지' },
    { id: 'av_bottom_shorts', cat: 'avatar', kind: 'cloth', slot: 'bottom', style: 'shorts', g: 'boy', name: '반바지', icon: '🩳', price: 0, color: '#7fd6a8', desc: '시원한 반바지' },
    { id: 'av_bottom_skirt', cat: 'avatar', kind: 'cloth', slot: 'bottom', style: 'skirt', g: 'girl', name: '주름 치마', icon: '👗', price: 0, color: '#f7a1c4', desc: '팔랑팔랑' },
    { id: 'av_bottom_pleats', cat: 'avatar', kind: 'cloth', slot: 'bottom', style: 'pleats', g: 'girl', name: '플리츠 스커트', icon: '🌸', price: 35, color: '#ff9ec4', desc: '잔주름이 예뻐요' },
    { id: 'av_bottom_denim', cat: 'avatar', kind: 'cloth', slot: 'bottom', style: 'denimskirt', g: 'girl', name: '데님 스커트', icon: '👗', price: 35, color: '#7ba7d9', desc: '청 데님 치마' },
    { id: 'av_bottom_dress', cat: 'avatar', kind: 'cloth', slot: 'bottom', style: 'dress', g: 'girl', name: '원피스 치마', icon: '👘', price: 45, color: '#ffc0d9', desc: '무릎까지 내려와요' },
    { id: 'av_bottom_train', cat: 'avatar', kind: 'cloth', slot: 'bottom', style: 'train', g: 'both', name: '트레이닝', icon: '🏃', price: 30, color: '#9aa4b8', desc: '편한 운동복' },
    { id: 'av_bottom_jogger', cat: 'avatar', kind: 'cloth', slot: 'bottom', style: 'jogger', g: 'boy', name: '조거 팬츠', icon: '🏃', price: 30, color: '#8a94a8', desc: '발목을 조인 팬츠' },

    { id: 'av_shoes_sneaker', cat: 'avatar', kind: 'cloth', slot: 'shoes', style: 'sneaker', name: '운동화', icon: '👟', price: 0, color: '#ffffff', color2: '#7ec8f0', desc: '깔끔한 운동화' },
    { id: 'av_shoes_boots', cat: 'avatar', kind: 'cloth', slot: 'shoes', style: 'boots', name: '부츠', icon: '🥾', price: 30, color: '#a9744a', desc: '든든한 부츠' },
    { id: 'av_shoes_slipper', cat: 'avatar', kind: 'cloth', slot: 'shoes', style: 'slipper', name: '슬리퍼', icon: '🩴', price: 15, color: '#ffb3c7', desc: '집에서 편하게' },

    /* --- 모자·머리장식 (모자 칸) --- */
    { id: 'av_hat_cap', cat: 'avatar', kind: 'cloth', slot: 'hat', style: 'cap', name: '야구모자', icon: '🧢', price: 35, color: '#6fb7ff', desc: '챙이 있는 모자' },
    { id: 'av_hat_beanie', cat: 'avatar', kind: 'cloth', slot: 'hat', style: 'beanie', name: '니트 비니', icon: '🧶', price: 30, color: '#ff9f6b', desc: '보들보들 비니' },
    { id: 'av_hat_crown', cat: 'avatar', kind: 'cloth', slot: 'hat', style: 'crown', name: '반짝 왕관', icon: '👑', price: 60, color: '#ffd34d', desc: '오늘의 왕' },
    { id: 'av_hat_bunny', cat: 'avatar', kind: 'cloth', slot: 'hat', style: 'bunnyband', name: '토끼귀 머리띠', icon: '🐰', price: 40, color: '#ffb3d1', desc: '길쭉 토끼귀' },
    { id: 'av_hat_cat', cat: 'avatar', kind: 'cloth', slot: 'hat', style: 'catband', name: '고양이귀 머리띠', icon: '🐱', price: 40, color: '#b39aff', desc: '야옹 고양이귀' },
    { id: 'av_hat_ribbon', cat: 'avatar', kind: 'cloth', slot: 'hat', style: 'ribbonpin', name: '별핀 리본', icon: '🎀', price: 25, color: '#ff8fb0', desc: '리본 + 별핀' },
    { id: 'av_hat_explorer', cat: 'avatar', kind: 'cloth', slot: 'hat', style: 'explorer', name: '탐험가 모자', icon: '🤠', price: 45, color: '#c9a06a', desc: '넓은 챙 모자' },
    { id: 'av_hat_beret', cat: 'avatar', kind: 'cloth', slot: 'hat', style: 'beret', name: '베레모', icon: '🎨', price: 35, color: '#e0647a', desc: '동글 베레모' },
    /* --- 안경·얼굴·소품 (소품 칸) --- */
    { id: 'av_acc_glasses', cat: 'avatar', kind: 'cloth', slot: 'acc', style: 'glasses', name: '동그란 안경', icon: '👓', price: 25, color: '#5a4a3a', desc: '공부할 때' },
    { id: 'av_acc_heart', cat: 'avatar', kind: 'cloth', slot: 'acc', style: 'heartglasses', name: '하트 선글라스', icon: '😍', price: 35, color: '#ff6f9c', desc: '하트 모양 렌즈' },
    { id: 'av_acc_star', cat: 'avatar', kind: 'cloth', slot: 'acc', style: 'starglasses', name: '별 선글라스', icon: '⭐', price: 35, color: '#3a3550', desc: '반짝이는 별 렌즈' },
    { id: 'av_acc_bag', cat: 'avatar', kind: 'cloth', slot: 'acc', style: 'bag', name: '크로스 가방', icon: '👜', price: 30, color: '#f28fa8', desc: '외출 필수' },
    { id: 'av_acc_backpack', cat: 'avatar', kind: 'cloth', slot: 'acc', style: 'backpack', name: '미니 백팩', icon: '🎒', price: 30, color: '#7cc6f2', desc: '등에 메는 가방' },
    { id: 'av_acc_wings', cat: 'avatar', kind: 'cloth', slot: 'acc', style: 'wings', name: '천사 날개', icon: '🪽', price: 50, color: '#fff6fb', desc: '등 뒤에 폴랑폴랑' },
    { id: 'av_acc_necklace', cat: 'avatar', kind: 'cloth', slot: 'acc', style: 'necklace', name: '목걸이', icon: '📿', price: 20, color: '#ffd34d', desc: '작은 펜던트' },
    /* --- 옛 프로필 호환(모자였던 액세서리) --- */
    { id: 'av_acc_cap', cat: 'avatar', kind: 'cloth', slot: 'hat', style: 'cap', name: '야구 모자(옛)', icon: '🧢', price: 35, color: '#6fb7ff', desc: '옛 액세서리', hidden: true },
    { id: 'av_acc_crown', cat: 'avatar', kind: 'cloth', slot: 'hat', style: 'crown', name: '반짝 왕관(옛)', icon: '👑', price: 60, color: '#ffd34d', desc: '옛 액세서리', hidden: true },

    /* --- 😊 표정 (0코인 3가지 + 코인으로 사는 11가지) --- */
    { id: 'av_face_smile', cat: 'avatar', kind: 'cloth', slot: 'face', style: 'smile', name: '방긋 웃음', icon: '😊', price: 0, color: '#ffe3b3', desc: '기본 표정' },
    { id: 'av_face_bright', cat: 'avatar', kind: 'cloth', slot: 'face', style: 'bright', name: '씩씩 미소', icon: '😄', price: 0, color: '#ffe9a8', desc: '이를 보이고 활짝' },
    { id: 'av_face_wink', cat: 'avatar', kind: 'cloth', slot: 'face', style: 'wink', name: '윙크', icon: '😉', price: 0, color: '#ffe4ee', desc: '한쪽 눈만 감고' },
    { id: 'av_face_angry', cat: 'avatar', kind: 'cloth', slot: 'face', style: 'angry', name: '화남', icon: '😠', price: 30, color: '#ffd0c7', desc: '눈썹 꿈틀 볼 빵빵' },
    { id: 'av_face_sad', cat: 'avatar', kind: 'cloth', slot: 'face', style: 'sad', name: '슬픔 울먹', icon: '😢', price: 30, color: '#cfe6ff', desc: '눈물 뚝뚝' },
    { id: 'av_face_surprise', cat: 'avatar', kind: 'cloth', slot: 'face', style: 'surprise', name: '깜짝', icon: '😲', price: 25, color: '#ffe6b8', desc: '눈 동그랗게' },
    { id: 'av_face_shy', cat: 'avatar', kind: 'cloth', slot: 'face', style: 'shy', name: '부끄러움', icon: '😊', price: 25, color: '#ffd6e2', desc: '볼이 발개요' },
    { id: 'av_face_pout', cat: 'avatar', kind: 'cloth', slot: 'face', style: 'pout', name: '삐짐', icon: '😤', price: 30, color: '#ffd9c2', desc: '입을 쭉 내밀고' },
    { id: 'av_face_heart', cat: 'avatar', kind: 'cloth', slot: 'face', style: 'heart', name: '하트눈', icon: '😍', price: 45, color: '#ffc9dc', desc: '눈이 하트로 콩닥' },
    { id: 'av_face_star', cat: 'avatar', kind: 'cloth', slot: 'face', style: 'star', name: '별눈 반짝', icon: '🤩', price: 45, color: '#ffe98f', desc: '눈이 별로 반짝' },
    { id: 'av_face_sweat', cat: 'avatar', kind: 'cloth', slot: 'face', style: 'sweat', name: '땀 뻘뻘', icon: '😅', price: 30, color: '#cdeeff', desc: '식은땀 줄줄' },
    { id: 'av_face_tongue', cat: 'avatar', kind: 'cloth', slot: 'face', style: 'tongue', name: '메롱', icon: '😜', price: 30, color: '#ffd6ea', desc: '혀 쏙 내밀기' },
    { id: 'av_face_sleepy', cat: 'avatar', kind: 'cloth', slot: 'face', style: 'sleepy', name: '졸림 하품', icon: '🥱', price: 30, color: '#dcd6ff', desc: '하암~ 쿨쿨' },
    { id: 'av_face_cool', cat: 'avatar', kind: 'cloth', slot: 'face', style: 'cool', name: '멋짐 쿨', icon: '😎', price: 40, color: '#c9d2e0', desc: '선글라스 쓰고 폼나게' },

    /* --- 🕺 동작 (0코인 3가지 + 코인으로 사는 8가지) --- */
    { id: 'av_pose_stand', cat: 'avatar', kind: 'cloth', slot: 'pose', style: 'stand', name: '기본 서기', icon: '🧍', price: 0, color: '#ffe3b3', desc: '차분하게 서 있어요' },
    { id: 'av_pose_wave', cat: 'avatar', kind: 'cloth', slot: 'pose', style: 'wave', name: '손 흔들기', icon: '👋', price: 0, color: '#ffe6c2', desc: '안녕~ 손을 흔들어요' },
    { id: 'av_pose_v', cat: 'avatar', kind: 'cloth', slot: 'pose', style: 'v', name: '브이', icon: '✌️', price: 0, color: '#e2f0ff', desc: '브이 하고 찰칵' },
    { id: 'av_pose_cheer', cat: 'avatar', kind: 'cloth', slot: 'pose', style: 'cheer', name: '만세', icon: '🙌', price: 30, color: '#fff0b8', desc: '두 팔 번쩍 만세' },
    { id: 'av_pose_jump', cat: 'avatar', kind: 'cloth', slot: 'pose', style: 'jump', name: '점프', icon: '🦘', price: 35, color: '#d6f5d9', desc: '통통 뛰어요', anim: 1 },
    { id: 'av_pose_dance', cat: 'avatar', kind: 'cloth', slot: 'pose', style: 'dance', name: '신나는 댄스', icon: '💃', price: 40, color: '#ffd9e9', desc: '흔들흔들 춤을 춰요', anim: 1 },
    { id: 'av_pose_heart', cat: 'avatar', kind: 'cloth', slot: 'pose', style: 'heart', name: '하트 포즈', icon: '🫶', price: 35, color: '#ffc9d8', desc: '두 손으로 하트' },
    { id: 'av_pose_kick', cat: 'avatar', kind: 'cloth', slot: 'pose', style: 'kick', name: '태권도 하이킥', icon: '🥋', price: 45, color: '#dfe6ff', desc: '발차기 씽씽' },
    { id: 'av_pose_fight', cat: 'avatar', kind: 'cloth', slot: 'pose', style: 'fight', name: '응원 파이팅', icon: '💪', price: 30, color: '#ffe0cf', desc: '주먹 불끈 파이팅' },
    { id: 'av_pose_cross', cat: 'avatar', kind: 'cloth', slot: 'pose', style: 'cross', name: '팔짱 삐짐', icon: '🙅', price: 30, color: '#ffd6d6', desc: '팔짱 끼고 흥' },
    { id: 'av_pose_hero', cat: 'avatar', kind: 'cloth', slot: 'pose', style: 'hero', name: '한 바퀴 턴', icon: '🦸', price: 45, color: '#d9d0ff', desc: '망토 펄럭 영웅 포즈', anim: 1 },

    /* ---- 🏰 층 컨셉 (한 번 사면 어느 층에나) ---- */
    { id: 'thm_basic', cat: 'theme', kind: 'theme', name: '일반 방', icon: '🏠', price: 0, color: '#f3ddc2', desc: '아늑한 기본 방 · 포근한 나무 바닥' },
    { id: 'thm_game', cat: 'theme', kind: 'theme', name: '게임방', icon: '🕹️', price: 120, color: '#2b2b4d', desc: '네온 픽셀 바닥 · 은은한 빛' },
    { id: 'thm_karaoke', cat: 'theme', kind: 'theme', name: '노래방', icon: '🎤', price: 100, color: '#43284a', desc: '무대 조명 · 스포트라이트' },
    { id: 'thm_pool', cat: 'theme', kind: 'theme', name: '수영장', icon: '🏊', price: 140, color: '#7fd8ff', desc: '출렁이는 물결 바닥' },
    { id: 'thm_bath', cat: 'theme', kind: 'theme', name: '목욕탕(온천)', icon: '♨️', price: 110, color: '#d8b48c', desc: '히노끼 욕탕 · 김이 모락' },
    { id: 'thm_space', cat: 'theme', kind: 'theme', name: '우주 비밀기지', icon: '🚀', price: 150, color: '#1d1846', desc: '별빛 우주선 패널' },
    { id: 'thm_library', cat: 'theme', kind: 'theme', name: '도서관·공부방', icon: '📚', price: 90, color: '#c99a6b', desc: '따뜻한 원목 바닥' },

    /* ---- 🖼 벽 장식 ---- */
    { id: 'deco_poster_hamster', cat: 'decor', kind: 'decor', fid: 'poster', name: '햄찌 포스터', icon: '🐹', price: 45, color: '#ffd6a5', desc: '벽에 거는 포스터' },
    { id: 'deco_poster_rocket', cat: 'decor', kind: 'decor', fid: 'poster', name: '로켓 포스터', icon: '🚀', price: 50, color: '#c9c0ff', desc: '벽에 거는 포스터' },
    { id: 'deco_frame_scenery', cat: 'decor', kind: 'decor', fid: 'frame', name: '풍경 액자', icon: '🏞', price: 50, color: '#c8b08a', desc: '벽에 거는 액자' },
    { id: 'deco_frame_family', cat: 'decor', kind: 'decor', fid: 'frame', name: '가족사진 액자', icon: '👨‍👩‍👦', price: 40, color: '#ffc9d8', desc: '벽에 거는 액자' },
    { id: 'deco_garland_star', cat: 'decor', kind: 'decor', fid: 'garland', name: '별·달 가랜드', icon: '⭐', price: 40, color: '#ffe08a', desc: '벽에 걸어 늘어뜨려요' },
    { id: 'deco_garland_flower', cat: 'decor', kind: 'decor', fid: 'garland', name: '꽃 가랜드', icon: '🌸', price: 40, color: '#ffc4d8', desc: '벽에 걸어 늘어뜨려요' },
    { id: 'deco_flag_bunting', cat: 'decor', kind: 'decor', fid: 'garland', name: '삼각 깃발', icon: '🎉', price: 35, color: '#a8d8ff', desc: '파티 깃발' },
    { id: 'deco_clock', cat: 'decor', kind: 'decor', fid: 'clock', name: '벽시계', icon: '🕐', price: 55, color: '#f0a35e', desc: '짜각짜각 벽시계' },
    { id: 'deco_shelf_mini', cat: 'decor', kind: 'decor', fid: 'shelf', name: '미니 선반', icon: '🧸', price: 50, color: '#d8b48c', desc: '작은 소품 선반' },
    { id: 'deco_neon_game', cat: 'decor', kind: 'decor', fid: 'neon', name: '네온사인', icon: '🎮', price: 70, color: '#6be7ff', desc: '게임방에 딱' },
    { id: 'deco_neon_star', cat: 'decor', kind: 'decor', fid: 'neon', name: '별 네온사인', icon: '⭐', price: 60, color: '#ffd166', desc: '반짝반짝 네온' },
    { id: 'deco_notes_music', cat: 'decor', kind: 'decor', fid: 'notes', name: '음표 장식', icon: '🎵', price: 45, color: '#ff8fd0', desc: '노래방에 딱' },

    /* ---- 🏠 새 가구·소품 ---- */
    { id: 'fur_arcade', cat: 'room', kind: 'furni', fid: 'arcade', w: 2, d: 1, name: '아케이드 게임기', icon: '🕹', price: 160, color: '#6b5cff', desc: '2×1 · 불빛 반짝' },
    { id: 'fur_mic', cat: 'room', kind: 'furni', fid: 'mic', w: 1, d: 1, name: '마이크 스탠드', icon: '🎤', price: 70, color: '#b6b0cc', desc: '1×1 · 노래 부르기' },
    { id: 'fur_mirrorball', cat: 'room', kind: 'furni', fid: 'mirrorball', w: 1, d: 1, name: '미러볼', icon: '🪩', price: 90, color: '#dfe8ff', desc: '1×1 · 반짝반짝' },
    { id: 'fur_stage', cat: 'room', kind: 'furni', fid: 'stage', w: 2, d: 2, name: '미니 무대', icon: '🎪', price: 180, color: '#7b5cff', desc: '2×2 · 무대 위 주인공' },
    { id: 'fur_tube', cat: 'room', kind: 'furni', fid: 'tube', w: 1, d: 1, name: '튜브', icon: '🛟', price: 45, color: '#ff9ec4', desc: '1×1 · 둥실둥실' },
    { id: 'fur_sunbed', cat: 'room', kind: 'furni', fid: 'sunbed', w: 2, d: 1, name: '선베드', icon: '🏖', price: 80, color: '#ffe0a3', desc: '2×1 · 누워서 쉬기' },
    { id: 'fur_bathtub', cat: 'room', kind: 'furni', fid: 'bathtub', w: 2, d: 1, name: '욕조', icon: '🛁', price: 130, color: '#cfe9ff', desc: '2×1 · 따뜻한 물' },
    { id: 'fur_duck', cat: 'room', kind: 'furni', fid: 'duck', w: 1, d: 1, name: '고무오리', icon: '🦆', price: 35, color: '#ffd93d', desc: '1×1 · 꽥꽥' },
    { id: 'fur_piano', cat: 'room', kind: 'furni', fid: 'piano', w: 2, d: 1, name: '피아노', icon: '🎹', price: 170, color: '#4a4458', desc: '2×1 · 딩동댕' },
    { id: 'fur_pethouse', cat: 'room', kind: 'furni', fid: 'pethouse', w: 1, d: 1, name: '펫 집', icon: '🏠', price: 70, color: '#f2b46a', desc: '1×1 · 친구 집' },
    { id: 'fur_wheel', cat: 'room', kind: 'furni', fid: 'wheel', w: 1, d: 1, name: '쳇바퀴', icon: '🎡', price: 60, color: '#c9a6ff', desc: '1×1 · 달려라 햄찌' },
    { id: 'fur_bigplant', cat: 'room', kind: 'furni', fid: 'bigplant', w: 1, d: 1, name: '큰 화분', icon: '🌳', price: 55, color: '#79c98a', desc: '1×1 · 키 큰 나무' },
    { id: 'fur_toybox', cat: 'room', kind: 'furni', fid: 'toybox', w: 1, d: 1, name: '장난감 상자', icon: '🧸', price: 45, color: '#7cc6f2', desc: '1×1 · 장난감 가득' },
    { id: 'fur_robot', cat: 'room', kind: 'furni', fid: 'robot', w: 1, d: 1, name: '로봇 피규어', icon: '🤖', price: 65, color: '#a8b8d8', desc: '1×1 · 삐빅' },
    { id: 'fur_mirror', cat: 'room', kind: 'furni', fid: 'standmirror', w: 1, d: 1, name: '전신 거울', icon: '🪞', price: 85, color: '#e6e0f0', desc: '1×1 · 키가 커 보여요' },
    { id: 'fur_rug_cloud', cat: 'room', kind: 'furni', fid: 'rug', w: 2, d: 2, name: '구름 러그', icon: '☁️', price: 60, color: '#dfeeff', desc: '2×2 · 폭신 러그' },
    { id: 'fur_rug_star', cat: 'room', kind: 'furni', fid: 'rug', w: 2, d: 2, name: '별 러그', icon: '⭐', price: 60, color: '#ffe9a8', desc: '2×2 · 반짝 러그' },

    /* ---- 🎨 새 벽지 ---- */
    { id: 'wall_pastel', cat: 'wall', kind: 'wall', name: '파스텔 체크 벽지', icon: '🌷', price: 70, color: '#fde6ef', desc: '몽글몽글 체크' },
    { id: 'wall_cloud', cat: 'wall', kind: 'wall', name: '구름 하늘 벽지', icon: '☁️', price: 80, color: '#e6f4ff', desc: '구름이 둥실' },
    { id: 'wall_wood', cat: 'wall', kind: 'wall', name: '따뜻한 우드 벽지', icon: '🪵', price: 90, color: '#e8d2b4', desc: '원목 결 그대로' },
    { id: 'wall_bada', cat: 'wall', kind: 'wall', name: '바다 벽지', icon: '🌊', price: 110, color: '#bfe8fa', desc: '파도가 출렁' },
    { id: 'wall_rainbow', cat: 'wall', kind: 'wall', name: '무지개 벽지', icon: '🌈', price: 130, color: '#ffe9cf', desc: '무지개가 뜬 하늘' },
    { id: 'wall_honey', cat: 'wall', kind: 'wall', name: '꿀벌 벽지', icon: '🐝', price: 75, color: '#fff3c4', desc: '노란 꿀방울' }
  ];
}

/* 표정·동작의 기본값 (프로필에 아직 없을 때) */
var AV_FACE_DEFAULT = 'av_face_smile';
var AV_POSE_DEFAULT = 'av_pose_stand';

/* 저장된 상점 목록에도 새 기본 아이템(헤어·옷)을 한 번씩 합쳐요.
   seed 판이 올라가면 그때만 합치므로, 보호자가 지우거나 숨긴 아이템은 그 뒤로 그대로 둡니다. */
var SHOP_SEED_V = 5;
/* 부화 단축 아이템은 없어졌어요 — 먹이(경험치 물약) 하나로 알·친구를 함께 키워요 */
var SHOP_LEGACY_PET_IDS = ['egg_vit', 'hatch_blanket', 'hatch_incubator', 'hatch_potion'];
function isLegacyPetItem(it) {
  return !!it && (it.kind === 'hatch' || SHOP_LEGACY_PET_IDS.indexOf(it.id) >= 0);
}
var SHOP_SEED_FREE = ['av_hair_bob', 'av_hair_pony', 'av_hair_twin', 'av_bottom_shorts', 'av_bottom_skirt',
  'av_face_smile', 'av_face_bright', 'av_face_wink',
  'av_pose_stand', 'av_pose_wave', 'av_pose_v'];

function mergeShopSeed() {
  var shop = state.shop;
  if (!shop || Object.prototype.toString.call(shop.items) !== '[object Array]' || !shop.items.length) return false;
  var seedNow = parseInt(shop.seed, 10) || 1;
  if (seedNow >= SHOP_SEED_V) return false;
  var changed = false, i;
  /* 1) 부화 단축·알 전용 영양제는 상점에서 지워요 (보호자가 고친 다른 아이템·가격은 그대로) */
  var kept = [];
  for (i = 0; i < shop.items.length; i++) {
    var old = shop.items[i];
    if (!old) continue;
    if (isLegacyPetItem(old)) { changed = true; continue; }
    kept.push(old);
  }
  shop.items = kept;

  var dflt = defaultShopItems(), have = {};
  for (i = 0; i < shop.items.length; i++) if (shop.items[i] && shop.items[i].id) have[shop.items[i].id] = 1;
  for (i = 0; i < dflt.length; i++) {
    var d = dflt[i];
    if (!have[d.id]) { shop.items.push(clone(d)); have[d.id] = 1; changed = true; }
  }
  /* 시작 옷·시작 머리는 0코인으로, 헤어는 성별·모양을 지금 기본값으로 맞춰요 */
  var byId = {};
  for (i = 0; i < dflt.length; i++) byId[dflt[i].id] = dflt[i];
  for (i = 0; i < shop.items.length; i++) {
    var it = shop.items[i];
    if (!it || !it.id) continue;
    var base = byId[it.id];
    if (base && it.slot === 'hair') {
      if (base.g && it.g !== base.g) { it.g = base.g; changed = true; }
      if (base.style && it.style !== base.style) { it.style = base.style; changed = true; }
    }
    if (SHOP_SEED_FREE.indexOf(it.id) >= 0) {
      if (it.price !== 0) { it.price = 0; changed = true; }
      if (base && it.name !== base.name) { it.name = base.name; changed = true; }
      if (base && it.desc !== base.desc) { it.desc = base.desc; changed = true; }
    }
  }
  shop.seed = SHOP_SEED_V;
  return changed;
}

function shopAll() {
  if (!state.shop || typeof state.shop !== 'object' || Object.prototype.toString.call(state.shop.items) !== '[object Array]' || !state.shop.items.length) {
    state.shop = { items: defaultShopItems(), seed: SHOP_SEED_V };
  } else if (mergeShopSeed()) {
    state.shop.updatedAt = new Date().toISOString();
    if (cloud.conn && cloud.me) scheduleSync('settings');
  }
  return state.shop.items;
}
function shopItem(id) {
  var list = shopAll();
  for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
  return null;
}
function shopCat(cat) {
  var list = shopAll(), out = [];
  for (var i = 0; i < list.length; i++) if (list[i].cat === cat && !list[i].hidden) out.push(list[i]);
  return out;
}
function isOwned(id) { return !!prof().owned[id]; }
function bagCount(id) { return prof().bag[id] || 0; }
function itemOwnedOrFree(it) { return it.price <= 0 || isOwned(it.id); }

/* ---------------- 상점 화면 ---------------- */
var shopUi = { tab: 'pet', admin: false, addOpen: false, msg: '', draft: {} };

function openShop(tab) {
  shopUi.tab = tab || shopUi.tab || 'pet';
  var m = document.getElementById('shopModal');
  if (m) m.hidden = false;
  renderShop();
  raiseModal('shopModal');
  lockScroll();
}
function closeShop() {
  var m = document.getElementById('shopModal');
  if (m) m.hidden = true;
  /* 닫으면 상점 목록·미리보기 그림을 비워요 (숨은 방/아바타 그림이 남지 않게) */
  var b = document.getElementById('shopBody');
  if (b) b.innerHTML = '';
  if (isOnlyModal('shopModal')) unlockScroll();
}

function shopCardHtml(it) {
  var p = prof();
  var own = p.owned[it.id];
  var inBag = p.bag[it.id] || 0;
  var canBuy = p.coins >= it.price;
  var btn;
  if (it.kind === 'furni' || it.kind === 'wall' || it.kind === 'cloth') {
    btn = own
      ? '<button type="button" class="shop-btn done" disabled>보유 중</button>'
      : '<button type="button" class="shop-btn' + (canBuy ? '' : ' off') + '" data-act="shop-buy" data-id="' + esc(it.id) + '">' + coinSvg() + ' ' + fmtNum(it.price) + '</button>';
  } else {
    btn = '<button type="button" class="shop-btn' + (canBuy ? '' : ' off') + '" data-act="shop-buy" data-id="' + esc(it.id) + '">' + coinSvg() + ' ' + fmtNum(it.price) + '</button>';
  }
  return '<article class="shop-card">' +
    '<div class="sc-icon" style="--ic:' + esc(it.color || '#ffd9a0') + '">' + (it.icon || '🎁') + '</div>' +
    '<div class="sc-body">' +
      '<div class="sc-name">' + esc(it.name) + (inBag ? '<span class="sc-bag">×' + inBag + '</span>' : '') + '</div>' +
      '<div class="sc-desc">' + esc(it.desc || '') + '</div>' +
    '</div>' + btn + '</article>';
}

function shopAdminHtml() {
  var list = shopAll();
  var h = '<div class="shop-admin">' +
    '<p class="lf-note">코인은 <b>👥 계정 → 🪙 코인 관리</b>에서 주거나 뺀 수 있어요.</p>' +
    '<p class="lf-note">가격을 바꾸면 바로 저장돼요. 아이템을 숨기거나 지울 수도 있어요.</p>';
  if (shopUi.msg) h += '<p class="shop-msg">' + esc(shopUi.msg) + '</p>';
  h += '<div class="admin-list">';
  for (var i = 0; i < list.length; i++) {
    var it = list[i];
    h += '<div class="admin-row' + (it.hidden ? ' off' : '') + '">' +
      '<span class="ar-icon" style="--ic:' + esc(it.color || '#ffd9a0') + '">' + (it.icon || '🎁') + '</span>' +
      '<span class="ar-name">' + esc(it.name) +
        '<small>' + esc({ pet: '펫 케어', room: '가구', wall: '벽지', decor: '벽 장식', theme: '층 컨셉', avatar: '아바타' }[it.cat] || it.cat) + '</small></span>' +
      '<label class="ar-price">' + coinSvg() + '<input type="number" min="0" step="1" value="' + (parseInt(it.price, 10) || 0) + '" data-field="shopPrice" data-id="' + esc(it.id) + '"></label>' +
      '<button type="button" class="ghost-btn tiny" data-act="shop-hide" data-id="' + esc(it.id) + '">' + (it.hidden ? '보이기' : '숨기기') + '</button>' +
      '<button type="button" class="ghost-btn tiny danger" data-act="shop-del" data-id="' + esc(it.id) + '">삭제</button>' +
      '</div>';
  }
  h += '</div>';

  h += '<div class="admin-add">';
  if (!shopUi.addOpen) {
    h += '<button type="button" class="pill-btn warm" data-act="shop-add-open">+ 새 아이템 만들기</button>';
  } else {
    var d = shopUi.draft || {};
    h += '<div class="add-grid">' +
      '<label>이름<input class="inp inp-sm" data-field="newShopName" value="' + esc(d.name || '') + '" maxlength="16" placeholder="예: 무지개 쿠션"></label>' +
      '<label>이모지<input class="inp inp-sm" data-field="newShopIcon" value="' + esc(d.icon || '🎁') + '" maxlength="4"></label>' +
      '<label>종류<select class="inp inp-sm" data-field="newShopCat">' +
        '<option value="pet"' + (d.cat === 'pet' ? ' selected' : '') + '>🐾 펫 케어</option>' +
        '<option value="room"' + (d.cat === 'room' ? ' selected' : '') + '>🏠 가구</option>' +
        '<option value="wall"' + (d.cat === 'wall' ? ' selected' : '') + '>🎨 벽지</option>' +
        '<option value="decor"' + (d.cat === 'decor' ? ' selected' : '') + '>🖼 벽 장식</option>' +
        '<option value="avatar"' + (d.cat === 'avatar' ? ' selected' : '') + '>👕 아바타</option>' +
      '</select></label>' +
      '<label>가격(코인)<input class="inp inp-sm" type="number" min="0" data-field="newShopPrice" value="' + esc(d.price == null ? '30' : String(d.price)) + '"></label>' +
      '<label>효과<select class="inp inp-sm" data-field="newShopEffect">' +
        '<option value="exp"' + (d.cat === 'pet' || !d.cat ? ' selected' : '') + '>먹이 (+EXP)</option>' +
        '<option value="furni"' + (d.cat === 'room' ? ' selected' : '') + '>가구로 놓기</option>' +
        '<option value="wall">벽지로 쓰기</option>' +
        '<option value="decor">벽에 거는 장식</option>' +
        '<option value="cloth"' + (d.cat === 'avatar' ? ' selected' : '') + '>아바타 옷</option>' +
      '</select></label>' +
      '<label>색<input class="inp inp-sm color-inp" type="color" data-field="newShopColor" value="' + esc(d.color || '#ffd9a0') + '"></label>' +
      '</div>' +
      '<div class="add-actions">' +
        '<button type="button" class="pill-btn warm" data-act="shop-add">추가하기</button>' +
        '<button type="button" class="ghost-btn" data-act="shop-add-cancel">취소</button>' +
      '</div>' +
      '<p class="lf-note">가구·아바타 옷은 1×1 크기로 만들어져요. 만든 뒤 방에서 옮길 수 있어요.</p>';
  }
  h += '</div></div>';
  return h;
}

/* 넓은 가로 화면의 상점 왼쪽 — 지금 고른 탭에 맞는 방/아바타를 바로 보여 줘요 */
function shopPreviewHtml() {
  var p = prof();
  var isAv = (shopUi.tab === 'avatar');
  var h = '<div class="shop-prev" id="shopPreview">';
  h += '<div class="shop-prev-head">' + (isAv ? '👕 나의 아바타' : '🏡 마이 룸') + '</div>';
  if (isAv) {
    h += '<div class="shop-prev-stage av" id="shopAvatarPreview">' + avatarSvg(p.avatar) + '</div>';
  } else {
    h += '<div class="shop-prev-stage room" id="shopRoomPreview"><div class="room-wrap">' + roomSceneHtml(false) + '</div></div>';
  }
  h += '<div class="shop-prev-foot"></div>';
  h += '<p class="shop-prev-hint">' + (isAv ? '산 옷은 바로 입혀지고, 여기서 미리 보여요.' : '가구·벽지·컨셉은 산 뒤 마이룸에서 꾸며요.') + '</p>';
  h += '</div>';
  return h;
}

function shopHtml() {
  var p = prof();
  var h = '<div class="shop-split"><aside class="shop-left">' + shopPreviewHtml() + '</aside><div class="shop-right">';
  h += '<div class="shop-top">' +
    '<div class="tabs shop-tabs">' +
      '<button type="button" class="tab' + (shopUi.tab === 'pet' ? ' on' : '') + '" data-act="shop-tab" data-tab="pet">🐾 펫 케어</button>' +
      '<button type="button" class="tab' + (shopUi.tab === 'room' ? ' on' : '') + '" data-act="shop-tab" data-tab="room">🏠 방 꾸미기</button>' +
      '<button type="button" class="tab' + (shopUi.tab === 'avatar' ? ' on' : '') + '" data-act="shop-tab" data-tab="avatar">👕 아바타 코디</button>' +
    '</div>' +
    '<span class="shop-coin" id="shopCoins">' + coinSvg() + ' <b>' + fmtNum(p.coins) + '</b></span>' +
    (can('edit') ? '<button type="button" class="ghost-btn" data-act="shop-admin">' + (shopUi.admin ? '✅ 관리 닫기' : '⚙️ 상점 관리') + '</button>' : '') +
  '</div>';

  h += '<p class="lf-note">루틴 체크 +' + COIN_CHECK + ' · 그룹 완료 +' + COIN_GROUP + ' · 칭찬 스티커 +' + COIN_STICKER + ' 코인! 모은 코인으로 먹이를 주고 방을 꾸며요.</p>';

  if (shopUi.tab === 'pet') {
    h += '<div class="pet-gacha shop">' +
      '<span class="pg-txt"><b>🥚 랜덤 알 뽑기</b><small>' + fmtNum(PET_DRAW_COST) + '코인 · ' + PET_TYPES.length + '속성 ' + PET_SPECIES.length + '종 중 하나가 나와요</small></span>' +
      '<button type="button" class="pill-btn warm" data-act="pet-gacha">🥚 알 뽑기 (' + fmtNum(PET_DRAW_COST) + '코인)</button>' +
      '</div>';
  }

  var cats = [];
  if (shopUi.tab === 'pet') cats = ['pet'];
  else if (shopUi.tab === 'room') cats = ['room', 'decor', 'wall', 'theme'];
  else cats = ['avatar'];

  for (var ci = 0; ci < cats.length; ci++) {
    var cat = cats[ci];
    if (cat === 'wall') h += '<h3 class="shop-sec">🎨 벽지</h3>';
    else if (cat === 'room') h += '<h3 class="shop-sec">🏠 가구·소품</h3>';
    else if (cat === 'decor') h += '<h3 class="shop-sec">🖼 벽 장식</h3>';
    else if (cat === 'theme') h += '<h3 class="shop-sec">🏷 층 컨셉</h3>';
    else if (cat === 'avatar') h += '<h3 class="shop-sec">👕 코디</h3>';
    var list = shopCat(cat);
    h += '<div class="shop-grid">';
    if (!list.length) h += '<p class="spend-empty">이 종류에는 아이템이 없어요.</p>';
    for (var i = 0; i < list.length; i++) h += shopCardHtml(list[i]);
    h += '</div>';
  }

  if (shopUi.admin && can('edit')) h += shopAdminHtml();
  h += '</div></div>';
  return h;
}

function renderShop() {
  var b = document.getElementById('shopBody');
  if (!b) return;
  var m = document.getElementById('shopModal');
  if (m && m.hidden) { b.innerHTML = ''; return; }   /* 닫혀 있으면 그리지 않아요 */
  b.innerHTML = shopHtml();
  placeShopTopTools();
}

/* 코인 잔액·⚙️ 상점 관리 버튼은 한 벌만 두고, 넓은 가로 화면에서는 왼쪽 미리보기 아래로 옮겨요 */
function placeShopTopTools() {
  var body = document.getElementById('shopBody');
  if (!body) return;
  var top = body.querySelector('.shop-top');
  var foot = body.querySelector('.shop-prev-foot');
  if (!top) return;
  var wide = false;
  try { wide = window.matchMedia('(min-width:768px) and (orientation:landscape)').matches; } catch (e) { wide = false; }
  var coin = top.querySelector('.shop-coin');
  var admin = top.querySelector('[data-act="shop-admin"]');
  var target = (wide && foot) ? foot : top;
  if (coin && coin.parentNode !== target) target.appendChild(coin);
  if (admin && admin.parentNode !== target) target.appendChild(admin);
}

function buyItem(id) {
  var it = shopItem(id);
  if (!it || it.hidden) return;
  var p = prof();
  if ((it.kind === 'furni' || it.kind === 'wall' || it.kind === 'cloth' || it.kind === 'theme' || it.kind === 'decor') && p.owned[id]) {
    showToast('이미 가지고 있어요!');
    return;
  }
  if (p.coins < it.price) {
    snd('uncheck');
    showToast(coinSvg() + ' 코인이 부족해요. 루틴을 체크해서 모아 보세요!', true);
    return;
  }
  p.coins -= it.price;
  p.updatedAt = new Date().toISOString();
  var msg = '';
  if (it.kind === 'exp') {
    p.bag[id] = Math.min(99, (p.bag[id] || 0) + 1);
    msg = (it.icon || '🎁') + ' ' + josa(it.name, '을', '를') + ' 가방에 넣었어요!';
  } else {
    p.owned[id] = 1;
    if (it.kind === 'wall') {
      var wf = curFloor();
      wf.wall = id;
      roomMirror();
      msg = '🎨 ' + it.name + '으로 벽을 바꿨어요!';
    } else if (it.kind === 'decor') {
      var hung = roomPlaceDecor(id, true);
      msg = hung ? (it.icon || '🖼') + ' ' + josa(it.name, '을', '를') + ' 벽에 걸었어요!'
        : (it.icon || '🖼') + ' ' + josa(it.name, '을', '를') + ' 샀어요! 벽이 가득 차면 방에서 자리를 골라요.';
    } else if (it.kind === 'theme') {
      var tf = curFloor();
      tf.theme = id;
      roomMirror();
      msg = (it.icon || '🏷') + ' ' + it.name + ' 컨셉을 펼쳤어요! 어느 층에나 바꿔 쓸 수 있어요.';
    } else if (it.kind === 'cloth') {
      wearAvatarNow(it.slot, id);   /* 산 옷은 바로 입혀요(미리보기 대기 없음) */
      msg = it.slot === 'face' ? '😊 ' + it.name + ' 표정을 샀어요!'
        : it.slot === 'pose' ? '🕺 ' + it.name + ' 동작을 샀어요!'
        : '👕 ' + josa(it.name, '을', '를') + ' 입었어요!';
    } else {
      msg = '🛋 ' + josa(it.name, '을', '를') + ' 샀어요! 마이룸 보관함에서 놓을 수 있어요.';
    }
  }
  snd('sticker');
  saveState();
  renderCoinBadge(-it.price);
  showToast(msg);
  renderShop();
  renderPet();
  if (!document.getElementById('careModal').hidden) renderCare();
  if (!document.getElementById('roomModal').hidden) { renderRoom(); }
  if (!document.getElementById('avatarModal').hidden) { renderAvatar(); }
}

function setShopPrice(id, price) {
  var it = shopItem(id);
  if (!it) return;
  var n = parseInt(price, 10);
  if (isNaN(n) || n < 0) n = 0;
  it.price = Math.min(COIN_MAX, n);
  state.shop.updatedAt = new Date().toISOString();
  saveState();
  if (!document.getElementById('shopModal').hidden) {
    /* 입력 중 포커스가 튀지 않게 가격만 다시 그립니다 */
    renderCoinBadge();
  }
}

function toggleShopHidden(id) {
  var it = shopItem(id);
  if (!it) return;
  it.hidden = it.hidden ? 0 : 1;
  saveState();
  renderShop();
}

function deleteShopItem(id) {
  var it = shopItem(id);
  if (!it) return;
  if (!window.confirm('"' + it.name + '" ' + josa(it.name, '을', '를') + ' 상점에서 지울까요?\n이미 산 사람의 보관함에는 그대로 남아요.')) return;
  var list = shopAll();
  for (var i = 0; i < list.length; i++) {
    if (list[i].id === id) { list.splice(i, 1); break; }
  }
  state.shop.updatedAt = new Date().toISOString();
  saveState();
  renderShop();
  renderPet();
}

function addShopItem() {
  var d = shopUi.draft || {};
  var name = String(d.name || '').trim();
  if (!name) { shopUi.msg = '아이템 이름을 적어 주세요.'; renderShop(); return; }
  var cat = ['pet', 'room', 'wall', 'decor', 'avatar'].indexOf(d.cat) >= 0 ? d.cat : 'pet';
  var eff = String(d.effect || '');
  var price = Math.max(0, Math.min(COIN_MAX, parseInt(d.price, 10) || 0));
  var icon = String(d.icon || '🎁').slice(0, 4) || '🎁';
  var color = String(d.color || '#ffd9a0');
  var it = { id: 'custom-' + Date.now().toString(36), cat: cat, name: name.slice(0, 16), icon: icon, price: price, color: color, desc: '' };
  if (eff === 'furni') {
    it.kind = 'furni'; it.fid = 'custom'; it.w = 1; it.d = 1; it.desc = '1×1 · 내가 만든 가구';
  } else if (eff === 'wall') {
    it.kind = 'wall'; it.desc = '내가 만든 벽지';
  } else if (eff === 'decor') {
    it.kind = 'decor'; it.fid = 'poster'; it.cat = 'decor'; it.desc = '내가 만든 벽 장식';
  } else if (eff === 'cloth') {
    it.kind = 'cloth'; it.slot = 'top'; it.style = 'tee'; it.desc = '내가 만든 옷';
  } else {
    it.kind = 'exp'; it.n = 10; it.cat = 'pet'; it.desc = '알·친구 모두 +10 EXP';
  }
  shopAll().push(it);
  state.shop.updatedAt = new Date().toISOString();
  shopUi.addOpen = false;
  shopUi.draft = {};
  shopUi.msg = '"' + it.name + '" 을(를) 추가했어요!';
  saveState();
  renderShop();
}
