/* ============================================================================
   Jaden's Today v2 — js/myroom.js
   마이룸 2.5D · 걷기 · 가구 · 층·컨셉·넓이
   · 원본 index.html(운영본)의 같은 코드를 기능별로 나눈 파일입니다. 동작은 원본과 같아요.
   · 모듈끼리 같은 전역 스코프를 써요. index.html 에서 core → sync → ... 순서로 불러옵니다.
   ============================================================================ */
'use strict';

/* ---------------- 마이룸: 층 · 컨셉 · 크기 ---------------- */
/* 방 크기는 3단계까지만 — 어떤 화면(390px 아이폰~데스크톱)에서도 2.5D 방이 잘리지 않게 */
var ROOM_MAX_FLOORS = 30;
var ROOM_SIZE = {
  1: { N: 6,  label: '기본 방',      cost: 0,   OX: 360, OY: 170, HW: 44,   HH: 22,   VB: '84 24 552 424' },
  2: { N: 8,  label: '중간 방',      cost: 120, OX: 380, OY: 166, HW: 36,   HH: 18,   VB: '52 26 656 448' },
  3: { N: 10, label: '가장 넓은 방', cost: 220, OX: 400, OY: 172, HW: 31,   HH: 15.5, VB: '48 30 704 470' }
};
function roomSizeInfo(size) { return ROOM_SIZE[size] || ROOM_SIZE[1]; }
function roomN(size) { return roomSizeInfo(size).N; }
/* 방이 넓을수록 친구를 더 많이 부를 수 있어요 (6×6 → 4명, 8×8 → 6명, 10×10 → 8명) */
function roomPetMax(size) {
  var s = parseInt(size, 10) || 1;
  if (s <= 1) return 4;
  if (s === 2) return 6;
  return 8;
}
/* 층 가격: 2층 100 · 3층 150 · 4층부터는 200코인 (층 수 제한 없음) */
function floorCost(n) { return n <= 1 ? 0 : (n === 2 ? 100 : (n === 3 ? 150 : 200)); }

/* 층별 컨셉 테마 — 한 번 사면 어느 층에나 바꿔 쓸 수 있어요 */
var THEMES = {
  thm_basic:   { name: '일반 방', icon: '🏠', price: 0,   desc: '아늑한 기본 방 · 포근한 나무 바닥' },
  thm_game:    { name: '게임방',        icon: '🕹️', price: 120, desc: '네온 픽셀 바닥', wall: '#2b2350', wall2: '#221b42', floor: '#2b2b4d', floor2: '#34345c', glow: '#6be7ff', trim: '#7b5cff', floorPat: 'grid', dark: 1, win: '#3a2f6b' },
  thm_karaoke: { name: '노래방',        icon: '🎤', price: 100, desc: '무대 조명 반짝', wall: '#3d2340', wall2: '#33192f', floor: '#43284a', floor2: '#4f3159', glow: '#ff7ad0', trim: '#ffd166', floorPat: 'spot', dark: 1, win: '#4a2a52', beam: 1 },
  thm_pool:    { name: '수영장',        icon: '🏊', price: 140, desc: '물결이 출렁출렁', wall: '#cdeeff', wall2: '#b9e4f7', floor: '#7fd8ff', floor2: '#a2e6ff', glow: '#ffffff', trim: '#6cc4e8', floorPat: 'water', win: '#bfefff', fx: 'bubble' },
  thm_bath:    { name: '목욕탕(온천)',  icon: '♨️', price: 110, desc: '따뜻한 히노끼 온천', wall: '#f0dcc4', wall2: '#e6cdb1', floor: '#d8b48c', floor2: '#c9a175', glow: '#ffd9a0', trim: '#a9784e', floorPat: 'plank', win: '#ffe9c9', fx: 'steam' },
  thm_space:   { name: '우주 비밀기지', icon: '🚀', price: 150, desc: '별빛 가득 우주선', wall: '#231f52', wall2: '#1b1742', floor: '#1d1846', floor2: '#262159', glow: '#9db4ff', trim: '#6f7dff', floorPat: 'star', dark: 1, win: '#120f30', fx: 'star' },
  thm_library: { name: '도서관·공부방', icon: '📚', price: 90,  desc: '따뜻한 원목 책장', wall: '#e9d3b3', wall2: '#ddc3a0', floor: '#c99a6b', floor2: '#bb8b5d', glow: '#ffe0a8', trim: '#8a5a2b', floorPat: 'plank', win: '#ffeec9', shelf: 1 }
};
var THEME_IDS = ['thm_basic', 'thm_game', 'thm_karaoke', 'thm_pool', 'thm_bath', 'thm_space', 'thm_library'];
function themeInfo(id) { return THEMES[id] || THEMES.thm_basic; }

/* 벽 장식 자리 — 벽지·창문·액자와 겹치지 않는 자리에 걸어요 (방이 넓으면 자리가 늘어나요) */
var WALL_SLOTS = {
  L: [{ t: 0.58, h: 72 }, { t: 0.70, h: 72 }, { t: 0.82, h: 72 }, { t: 0.62, h: 20 }, { t: 0.78, h: 20 }],
  R: [{ t: 0.10, h: 72 }, { t: 0.20, h: 72 }, { t: 0.66, h: 72 }, { t: 0.80, h: 72 }, { t: 0.14, h: 20 }]
};
function wallSlotCount(size) { return Math.max(1, Math.min(5, 2 + (parseInt(size, 10) || 1))); }

function defaultFloorRoom(n) {
  return {
    n: parseInt(n, 10) || 1,
    theme: 'thm_basic',
    size: 1,
    wall: 'wall_cream',
    items: [],
    wallItems: [],
    pets: [],
    avatarPos: { x: 3.1, y: 3.5 }
  };
}

function defaultRoom() {
  var f = defaultFloorRoom(1);
  f.items = [
    { u: 'rm-bed', id: 'room_bed', x: 0, y: 1 },
    { u: 'rm-rug', id: 'room_rug', x: 3, y: 2 },
    { u: 'rm-stool', id: 'room_stool', x: 2, y: 3 }
  ];
  /* 옛 화면·도구와 호환되게 지금 보는 층의 벽지·가구를 room 에도 그대로 적어 둬요 */
  return {
    active: 1,
    floors: [f],
    pets: [],
    wall: f.wall,
    items: f.items.slice(),
    avatarPos: { x: 3.1, y: 3.5 }
  };
}

/* 지금 보고 있는 층 — 방 그리기 좌표(ROOM)도 이 층 크기에 맞춰요 */
function curFloor(room) {
  room = (room && typeof room === 'object') ? room : prof().room;
  if (!room || typeof room !== 'object') { room = defaultRoom(); }
  var list = (Object.prototype.toString.call(room.floors) === '[object Array]') ? room.floors : [];
  if (!list.length) {
    var fresh = defaultRoom();
    room.floors = fresh.floors;
    list = room.floors;
  }
  var want = parseInt(room.active, 10) || 1;
  var f = null;
  for (var i = 0; i < list.length; i++) if (parseInt(list[i].n, 10) === want) f = list[i];
  if (!f) { f = list[0]; room.active = parseInt(f.n, 10) || 1; }
  setRoomGeo(f.size);
  return f;
}

function roomFloorCount(room) {
  room = room || prof().room;
  var list = (room && Object.prototype.toString.call(room.floors) === '[object Array]') ? room.floors : [];
  return list.length;
}

/* 옛 프로필·다른 화면과 호환되는 room.wall·room.items·room.avatarPos 를 지금 층에 맞춰요 */
function roomMirrorFor(room) {
  if (!room || typeof room !== 'object') return;
  var list = (Object.prototype.toString.call(room.floors) === '[object Array]') ? room.floors : [];
  if (!list.length) return;
  var want = parseInt(room.active, 10) || 1, f = list[0];
  for (var i = 0; i < list.length; i++) if (parseInt(list[i].n, 10) === want) f = list[i];
  room.wall = f.wall;
  room.items = f.items;
  room.avatarPos = f.avatarPos;
  var pets = [];
  for (var j = 0; j < list.length; j++) {
    var fp = (Object.prototype.toString.call(list[j].pets) === '[object Array]') ? list[j].pets : [];
    for (var k = 0; k < fp.length; k++) if (pets.indexOf(fp[k]) < 0) pets.push(fp[k]);
  }
  room.pets = pets;
}
function roomMirror() {
  roomMirrorFor(state && state.profile ? state.profile.room : null);
}
function defaultProfile() {
  return {
    v: 1,
    clearedAt: 0,   /* /home/ 초기화 시각 — 이 시각보다 오래된 로컬 기록은 버려요 */
    coins: COIN_START,
    pet: {
      id: petNewId(),
      currentEgg: 'normal', speciesId: 'normal', stage: 0, exp: 0, xp: 0,
      hatchAt: Date.now() + HATCH_MS, hatchedAt: 0, gotAt: 0,
      collection: [], art: {}
    },
    /* 내가 가진 알·친구들 — 지금 키우는 친구(prof().pet) 말고 나머지가 여기에 담겨요 */
    pets: [],
    activePetId: '',
    runnerPetId: '',   /* 목표 시간 바에서 달릴 친구 (비어 있으면 지금 키우는 친구) */
    bag: {},
    owned: {
      room_bed: 1, room_stool: 1, room_rug: 1, wall_cream: 1,
      av_hair_basic: 1, av_top_tee: 1, av_bottom_jeans: 1, av_shoes_sneaker: 1
    },
    room: defaultRoom(),
    avatar: defaultAvatar(),
    /* ⭐ 경험치·레벨 (레벨은 한 번 오르면 내려가지 않아요) */
    xp: 0, level: 1,
    /* 업적용 누적 횟수 — 체크를 풀면 함께 줄어요 */
    progress: { routine: 0, workbook: 0, sticker: 0, mission: 0, role: 0, pet: 0 },
    /* 🏆 달성한 업적 { 업적id: { at } } */
    ach: { done: {} },
    allowanceNotices: [],
    award: { day: '', checks: {}, groups: {}, stickers: 0, refunded: {} },
    updatedAt: new Date().toISOString()
  };
}

function own(obj, key) { return Object.prototype.hasOwnProperty.call(obj, key); }

/* 받침에 맞춰 조사를 붙여요 (예: 침대를 / 쿠션을) */
function josa(word, withJong, noJong) {
  var s = String(word == null ? '' : word);
  if (!s) return '';
  var code = s.charCodeAt(s.length - 1);
  var has = (code >= 0xAC00 && code <= 0xD7A3) ? (((code - 0xAC00) % 28) !== 0) : false;
  return s + (has ? withJong : noJong);
}

/* ---------------- 2.5D 마이룸 ---------------- */
var ROOM = { N: 6, OX: 360, OY: 170, HW: 44, HH: 22, WALL_H: 130, VW: 720, VH: 520, VB: '84 24 552 424' };
var WALLS = {
  wall_cream: { name: '크림 벽지', wall: '#fdf2e2', wall2: '#f7e6d0', floor: '#f3ddc2', floor2: '#ebd1b0', pat: 'dot', patC: '#f0dcc0' },
  wall_sky: { name: '하늘 벽지', wall: '#e8f5ff', wall2: '#d5ebff', floor: '#f7e9d5', floor2: '#efdfc7', pat: 'cloud', patC: '#ffffff' },
  wall_night: { name: '별밤 벽지', wall: '#3b3f6d', wall2: '#2f3358', floor: '#565073', floor2: '#4b4568', pat: 'star', patC: '#fff2b8', dark: true },
  wall_forest: { name: '숲속 벽지', wall: '#e2f4de', wall2: '#d0e9ca', floor: '#e9dcc2', floor2: '#dfd0b3', pat: 'leaf', patC: '#b6ddad' },
  wall_cherry: { name: '벚꽃 벽지', wall: '#ffe8f0', wall2: '#ffd8e5', floor: '#f6e3d3', floor2: '#efd8c5', pat: 'petal', patC: '#ffc4d8' },
  wall_galaxy: { name: '은하수 벽지', wall: '#2c2554', wall2: '#241e45', floor: '#4a4270', floor2: '#413a63', pat: 'star', patC: '#c9c0ff', dark: true },
  wall_pastel: { name: '파스텔 체크 벽지', wall: '#fff3f8', wall2: '#ffe9f3', floor: '#fde6ef', floor2: '#f6d8e6', pat: 'check', patC: '#c7e5ff' },
  wall_cloud: { name: '구름 하늘 벽지', wall: '#e6f4ff', wall2: '#d6ecff', floor: '#f4f0e6', floor2: '#eae4d6', pat: 'cloud', patC: '#ffffff' },
  wall_wood: { name: '따뜻한 우드 벽지', wall: '#f4e2cb', wall2: '#ecd6ba', floor: '#d8b68c', floor2: '#cbaa80', pat: 'wood', patC: '#e0c6a3' },
  wall_bada: { name: '바다 벽지', wall: '#ddf2ff', wall2: '#c4e8ff', floor: '#a9dcf2', floor2: '#93d0ea', pat: 'wave', patC: '#8fd0ee' },
  wall_rainbow: { name: '무지개 벽지', wall: '#fff6e2', wall2: '#ffeccc', floor: '#f7e7d3', floor2: '#eedcc5', pat: 'rainbow', patC: '#ffd0e4' },
  wall_honey: { name: '꿀벌 벽지', wall: '#fff8dc', wall2: '#fdf0c4', floor: '#f3e3c0', floor2: '#e9d7ad', pat: 'dot', patC: '#ffe08a' }
};
function wallInfo(id) { return WALLS[id] || WALLS.wall_cream; }

/* 현재 층 크기에 맞춰 방 그리기 좌표를 바꿔요 (넓어져도 화면 밖으로 나가지 않게) */
function setRoomGeo(size) {
  var g = roomSizeInfo(size);
  ROOM.N = g.N; ROOM.OX = g.OX; ROOM.OY = g.OY; ROOM.HW = g.HW; ROOM.HH = g.HH; ROOM.VB = g.VB;
  ROOM.S = g.HW / 44;   /* 기본 방 타일 대비 크기 — 가구·아바타도 같이 줄여요 */
  return g;
}
function roomScale() { return ROOM.S || 1; }

/* 컨셉 테마 + 벽지를 합친 방 색감 */
function roomLook(themeId, wallId) {
  var th = themeInfo(themeId);
  var w = wallInfo(wallId);
  var out = {
    wall: w.wall, wall2: w.wall2, floor: w.floor, floor2: w.floor2,
    pat: w.pat, patC: w.patC, dark: !!w.dark, floorPat: 'check',
    glow: '', trim: '', win: w.dark ? '#2b2f4f' : '#cfe9ff', th: th
  };
  if (th.wall) {
    out.wall = mixHex(w.wall, th.wall, 0.62);
    out.wall2 = mixHex(w.wall2, th.wall2 || th.wall, 0.62);
    out.patC = mixHex(w.patC || '#ffffff', th.glow || '#ffffff', 0.45);
  }
  if (th.floor) {
    out.floor = th.floor;
    out.floor2 = th.floor2 || th.floor;
    out.floorPat = th.floorPat || 'check';
  }
  if (th.glow) out.glow = th.glow;
  if (th.trim) out.trim = th.trim;
  if (th.win) out.win = th.win;
  if (th.dark) out.dark = true;
  return out;
}

var roomUi = { panel: 'main', studio: 'wall', sel: '', dsel: '', moving: '', msg: '' };
var roomAnim = { timer: 0 };

/* 마이룸 아바타: 예전보다 작게(58%) 줄이고, 바닥을 누르면 걸어가요 */
var AV_ROOM_SCALE = 0.58;
var AV_WALK_SPEED = 1.15;   /* 초당 타일 */
var roomAva = { x: 3.1, y: 3.5, tx: 3.1, ty: 3.5, idle: 3, walkPh: 0, moving: false, showTarget: false, ready: false };

function roomAvaSync() {
  var f = curFloor();
  var pos = f.avatarPos || {};
  var x = Number(pos.x), y = Number(pos.y);
  roomAva.x = roomAva.tx = isFinite(x) ? Math.max(0.5, Math.min(ROOM.N - 0.5, x)) : Math.min(3.1, ROOM.N - 0.5);
  roomAva.y = roomAva.ty = isFinite(y) ? Math.max(0.5, Math.min(ROOM.N - 0.5, y)) : Math.min(3.5, ROOM.N - 0.5);
  roomAva.idle = 2.6 + Math.random() * 2;
  roomAva.walkPh = 0;
  roomAva.moving = false;
  roomAva.showTarget = false;
  roomAva.ready = true;
}

/* 가구가 있는 자리는 비켜서 걷어요 (러그·스케이트보드는 밟고 설 수 있음) */
function roomSpotFree(x, y) {
  var items = curFloor().items || [];
  for (var i = 0; i < items.length; i++) {
    var def = shopItem(items[i].id);
    if (!def) continue;
    if (def.fid === 'rug' || def.fid === 'skate') continue;
    var sz = roomDefSize(items[i].id);
    if (x > items[i].x - 0.34 && x < items[i].x + sz.w + 0.34 &&
        y > items[i].y - 0.28 && y < items[i].y + sz.d + 0.55) return false;
  }
  return true;
}

function pickWanderTarget() {
  var N = ROOM.N;
  for (var i = 0; i < 10; i++) {
    var nx = Math.max(0.55, Math.min(N - 0.55, roomAva.x + (Math.random() * 2 - 1) * 1.7));
    var ny = Math.max(0.55, Math.min(N - 0.55, roomAva.y + (Math.random() * 2 - 1) * 1.7));
    if (!roomSpotFree(nx, ny)) continue;
    roomAva.tx = nx;
    roomAva.ty = ny;
    return true;
  }
  return false;
}

/* 바닥을 누르면 그 자리로 걸어가요 (가구 자리면 가장 가까운 빈 자리로) */
function roomAvaWalk(cx, cy) {
  var N = ROOM.N;
  var x = Math.max(0.55, Math.min(N - 0.55, cx));
  var y = Math.max(0.55, Math.min(N - 0.55, cy));
  if (!roomSpotFree(x, y)) {
    var best = null, bd = 1e9;
    for (var i = 0; i <= 12; i++) {
      for (var j = 0; j <= 12; j++) {
        var px = 0.55 + i * (N - 1.1) / 12, py = 0.55 + j * (N - 1.1) / 12;
        if (!roomSpotFree(px, py)) continue;
        var d = (px - x) * (px - x) + (py - y) * (py - y);
        if (d < bd) { bd = d; best = [px, py]; }
      }
    }
    if (!best) return false;
    x = best[0];
    y = best[1];
  }
  roomAva.tx = x;
  roomAva.ty = y;
  roomAva.idle = 4;
  roomAva.showTarget = true;
  curFloor().avatarPos = { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 };
  roomMirror();
  saveState();
  renderRoom();
  return true;
}

function iP(x, y) {
  return [ROOM.OX + (x - y) * ROOM.HW, ROOM.OY + (x + y) * ROOM.HH];
}
function pts(arr) {
  var out = [];
  for (var i = 0; i < arr.length; i++) out.push(arr[i][0].toFixed(1) + ',' + arr[i][1].toFixed(1));
  return out.join(' ');
}
function isoQuad(x, y, w, d, lift) {
  lift = lift || 0;
  var a = iP(x, y), b = iP(x + w, y), c = iP(x + w, y + d), e = iP(x, y + d);
  return [[a[0], a[1] - lift], [b[0], b[1] - lift], [c[0], c[1] - lift], [e[0], e[1] - lift]];
}
function isoBox(x, y, w, d, h, top, left, front, lift) {
  lift = lift || 0;
  var base = isoQuad(x, y, w, d, lift);
  var tp = isoQuad(x, y, w, d, lift + h);
  var lf = [base[1], base[2], tp[2], tp[1]];
  var rf = [base[3], base[2], tp[2], tp[3]];
  return '<polygon points="' + pts(lf) + '" fill="' + left + '"/>' +
    '<polygon points="' + pts(rf) + '" fill="' + front + '"/>' +
    '<polygon points="' + pts(tp) + '" fill="' + top + '" stroke="rgba(60,40,25,.10)" stroke-width="1"/>';
}
function darken(hex, t) { return shadeColor(hex, -t); }
function lighten(hex, t) { return shadeColor(hex, t); }

function furniSvg(it, x, y) {
  var w = it.w || 1, d = it.d || 1;
  var c = it.color || '#c99b6a';
  var fid = it.fid || 'custom';
  var s = '';
  if (fid === 'bed') {
    s += isoBox(x, y, w, d, 12, '#c99a6b', '#a97c50', '#b98a5e');
    s += isoBox(x + 0.05, y + 0.05, w - 0.1, d - 0.1, 22, '#93b9ff', '#6f96e0', '#7fa6ee', 10);
    s += isoBox(x + 0.08, y + 0.1, 0.5, d - 0.2, 7, '#ffffff', '#e6ebf5', '#f4f7ff', 30);
    s += isoBox(x + 0.62, y + 0.06, w - 0.68, d - 0.12, 6, '#ffc2d1', '#e39db1', '#f2aec0', 29);
    s += isoBox(x + 0.09, y + 0.12, 0.48, d - 0.24, 2, '#ffe9f0', '#dfd3e6', '#f0e2ea', 29);
  } else if (fid === 'stool') {
    s += isoBox(x + 0.12, y + 0.12, w - 0.24, d - 0.24, 18, c, darken(c, .18), darken(c, .08));
    var cc = iP(x + w / 2, y + d / 2);
    s += '<ellipse cx="' + cc[0] + '" cy="' + (cc[1] - 18) + '" rx="' + (ROOM.HW * 0.68) + '" ry="' + (ROOM.HH * 0.68) + '" fill="' + lighten(c, .25) + '" stroke="rgba(0,0,0,.08)"/>';
  } else if (fid === 'desk') {
    s += isoBox(x + 0.08, y + 0.3, 0.12, 0.12, 24, darken(c, .1), darken(c, .25), darken(c, .18));
    s += isoBox(x + w - 0.2, y + 0.3, 0.12, 0.12, 24, darken(c, .1), darken(c, .25), darken(c, .18));
    s += isoBox(x + 0.08, y + d - 0.42, 0.12, 0.12, 24, darken(c, .1), darken(c, .25), darken(c, .18));
    s += isoBox(x + w - 0.2, y + d - 0.42, 0.12, 0.12, 24, darken(c, .1), darken(c, .25), darken(c, .18));
    s += isoBox(x, y, w, d, 7, lighten(c, .12), darken(c, .2), darken(c, .1), 24);
    s += isoBox(x + 0.2, y + 0.22, 0.5, 0.4, 6, '#ff9da8', '#d97b86', '#ef8e99', 31);
    s += isoBox(x + w - 0.8, y + 0.2, 0.35, 0.45, 5, '#8fd6ff', '#63b4e6', '#7cc6f2', 31);
  } else if (fid === 'sofa') {
    s += isoBox(x, y, w, d, 16, c, darken(c, .2), darken(c, .1));
    s += isoBox(x + 0.08, y + 0.06, w - 0.16, 0.34, 40, lighten(c, .1), darken(c, .22), darken(c, .12), 12);
    s += isoBox(x + 0.05, y + 0.34, 0.26, d - 0.42, 28, darken(c, .05), darken(c, .22), darken(c, .12), 12);
    s += isoBox(x + w - 0.31, y + 0.34, 0.26, d - 0.42, 28, darken(c, .05), darken(c, .22), darken(c, .12), 12);
    s += isoBox(x + 0.34, y + 0.38, w - 0.68, d - 0.46, 22, lighten(c, .22), darken(c, .12), darken(c, .04), 14);
  } else if (fid === 'shelf') {
    s += isoBox(x + 0.08, y + 0.14, w - 0.16, d - 0.28, 78, c, darken(c, .22), darken(c, .12));
    for (var sh = 0; sh < 3; sh++) {
      var lv = 22 + sh * 22;
      s += isoBox(x + 0.12, y + 0.18, w - 0.24, d - 0.36, 3, lighten(c, .2), darken(c, .18), darken(c, .08), lv);
      s += isoBox(x + 0.2, y + 0.22, 0.14, d - 0.44, 14, ['#ff8f8f', '#7cc6f2', '#ffd166'][sh], darken('#dddddd', .1), '#cccccc', lv + 3);
      s += isoBox(x + 0.42, y + 0.22, 0.13, d - 0.44, 12, ['#9ee6a8', '#c9a6ff', '#ffb3c7'][sh], '#bbbbbb', '#cccccc', lv + 3);
    }
  } else if (fid === 'rug') {
    var outer = isoQuad(x + 0.06, y + 0.06, w - 0.12, d - 0.12, 1);
    var inner = isoQuad(x + 0.2, y + 0.2, w - 0.4, d - 0.4, 1);
    s += '<polygon points="' + pts(outer) + '" fill="' + c + '" opacity=".95"/>';
    s += '<polygon points="' + pts(inner) + '" fill="' + lighten(c, .35) + '" opacity=".9"/>';
    var st = iP(x + w / 2, y + d / 2);
    s += '<path d="M' + st[0] + ' ' + (st[1] - 10) + 'l2.6 7 7 .6-5.4 4.4 1.8 7-6-4-6 4 1.8-7-5.4-4.4 7-.6z" fill="#ffffff" opacity=".85"/>';
  } else if (fid === 'plant') {
    s += isoBox(x + 0.26, y + 0.26, 0.48, 0.48, 18, '#e08a5a', '#b96b3f', '#cc7a4c');
    var pc = iP(x + 0.5, y + 0.5);
    s += '<circle cx="' + pc[0] + '" cy="' + (pc[1] - 34) + '" r="16" fill="#6ec27f"/>';
    s += '<circle cx="' + (pc[0] - 13) + '" cy="' + (pc[1] - 52) + '" r="12" fill="#8ad79a"/>';
    s += '<circle cx="' + (pc[0] + 12) + '" cy="' + (pc[1] - 56) + '" r="13" fill="#5cb56e"/>';
    s += '<circle cx="' + (pc[0] + 2) + '" cy="' + (pc[1] - 70) + '" r="10" fill="#8ad79a"/>';
  } else if (fid === 'wallshelf') {
    s += isoBox(x + 0.1, y + 0.1, w - 0.2, d - 0.2, 66, c, darken(c, .24), darken(c, .14));
    for (var wl = 0; wl < 2; wl++) {
      s += isoBox(x + 0.16, y + 0.16, w - 0.32, d - 0.32, 3, lighten(c, .25), darken(c, .2), darken(c, .1), 20 + wl * 24);
    }
    s += isoBox(x + 0.3, y + 0.3, 0.4, 0.4, 12, '#ffd79a', '#d9b075', '#e8bf85', 26);
  } else if (fid === 'guitar') {
    var gp = iP(x + 0.5, y + 0.55);
    s += '<g transform="translate(' + gp[0] + ',' + gp[1] + ')">' +
      '<ellipse cx="0" cy="-24" rx="17" ry="21" fill="' + c + '" stroke="' + darken(c, .35) + '" stroke-width="2"/>' +
      '<ellipse cx="0" cy="-46" rx="12" ry="14" fill="' + lighten(c, .2) + '" stroke="' + darken(c, .35) + '" stroke-width="2"/>' +
      '<circle cx="0" cy="-32" r="6" fill="#4a3018"/>' +
      '<rect x="-2.5" y="-104" width="5" height="52" rx="2" fill="#8a5a2b"/>' +
      '<rect x="-6" y="-112" width="12" height="10" rx="3" fill="#5a3a1a"/>' +
      '<path d="M-2 -100v46M0 -100v46M2 -100v46" stroke="#ffe9b0" stroke-width=".8" opacity=".8"/>' +
      '</g>';
  } else if (fid === 'skate') {
    var sp0 = iP(x + 0.1, y + 0.35), sp1 = iP(x + w - 0.1, y + 0.35), sp2 = iP(x + w - 0.1, y + 0.62), sp3 = iP(x + 0.1, y + 0.62);
    s += '<polygon points="' + pts([sp0, sp1, sp2, sp3]) + '" fill="' + c + '" stroke="' + darken(c, .35) + '" stroke-width="1.6" transform="translate(0,-6)"/>';
    s += '<circle cx="' + sp0[0] + '" cy="' + (sp0[1] + 2) + '" r="3.4" fill="#4a4458"/>';
    s += '<circle cx="' + sp1[0] + '" cy="' + (sp1[1] + 2) + '" r="3.4" fill="#4a4458"/>';
  } else if (fid === 'lamp') {
    s += isoBox(x + 0.3, y + 0.3, 0.4, 0.4, 5, '#d9d0c4', '#b8ae9f', '#c8beae');
    var lp = iP(x + 0.5, y + 0.5);
    s += '<rect x="' + (lp[0] - 2) + '" y="' + (lp[1] - 64) + '" width="4" height="60" fill="#b9ab98"/>';
    s += '<path d="M' + (lp[0] - 17) + ' ' + (lp[1] - 62) + 'h34l-7-20h-20z" fill="#ffe08a" stroke="#e0b955" stroke-width="1.4"/>';
    s += '<circle cx="' + lp[0] + '" cy="' + (lp[1] - 62) + '" r="24" fill="#fff3b8" opacity=".35"/>';
  } else if (fid === 'tent') {
    var a0 = iP(x + 0.1, y + 0.1), a1 = iP(x + w - 0.1, y + 0.1), a2 = iP(x + w / 2, y + d - 0.05);
    s += '<polygon points="' + pts([a0, a1, a2]) + '" fill="' + c + '" stroke="' + darken(c, .3) + '" stroke-width="1.6"/>';
    var t0 = iP(x + 0.1, y + 0.1), t1 = iP(x + w - 0.1, y + 0.1);
    s += '<polygon points="' + pts([[t0[0], t0[1] - 78], [t1[0], t1[1] - 78], [a2[0], a2[1] - 8]]) + '" fill="' + lighten(c, .18) + '" opacity=".92"/>';
    var dc = iP(x + w / 2, y + d - 0.2);
    s += '<path d="M' + (dc[0] - 18) + ' ' + dc[1] + 'q18-30 36 0z" fill="' + darken(c, .35) + '" opacity=".8"/>';
  } else if (fid === 'tv') {
    s += isoBox(x + 0.1, y + 0.25, w - 0.2, d - 0.5, 16, '#b9a894', '#8f8172', '#a2917f');
    s += isoBox(x + 0.12, y + 0.3, w - 0.24, 0.28, 34, '#5b6478', '#3e4554', '#4b5364', 16);
    s += isoBox(x + 0.18, y + 0.34, w - 0.36, 0.1, 26, '#9fd8ff', '#6fa8d8', '#7fb8e8', 22);
  } else if (fid === 'arcade') {
    s += isoBox(x + 0.12, y + 0.16, w - 0.24, d - 0.32, 62, darken(c, .1), darken(c, .3), darken(c, .2));
    s += isoBox(x + 0.3, y + 0.2, w - 0.6, 0.24, 34, '#0d0b1f', '#090716', '#0b0819', 24);
    s += isoBox(x + 0.36, y + 0.24, w - 0.72, 0.1, 26, '#6be7ff', '#2a7f96', '#3aa3bf', 28);
    s += isoBox(x + 0.34, y + 0.56, w - 0.68, 0.16, 9, '#2a2440', '#1a1630', '#221b3a', 26);
    var apc = iP(x + w - 0.42, y + 0.64);
    s += '<circle cx="' + apc[0].toFixed(1) + '" cy="' + (apc[1] - 32) + '" r="3.4" fill="#ff6b8b"/>';
    s += '<circle cx="' + (apc[0] - 9).toFixed(1) + '" cy="' + (apc[1] - 30) + '" r="3.4" fill="#ffd166"/>';
  } else if (fid === 'mic') {
    s += isoBox(x + 0.32, y + 0.32, 0.36, 0.36, 6, '#5a5470', '#3e3a50', '#4a4560');
    var mpc = iP(x + 0.5, y + 0.5);
    s += '<rect x="' + (mpc[0] - 1.6).toFixed(1) + '" y="' + (mpc[1] - 74).toFixed(1) + '" width="3.2" height="70" fill="#9a94b0"/>';
    s += '<ellipse cx="' + mpc[0].toFixed(1) + '" cy="' + (mpc[1] - 78).toFixed(1) + '" rx="7" ry="9" fill="' + c + '" stroke="' + darken(c, .3) + '" stroke-width="1.4"/>';
    s += '<path d="M' + (mpc[0] - 7).toFixed(1) + ' ' + (mpc[1] - 80).toFixed(1) + 'h14M' + (mpc[0] - 7).toFixed(1) + ' ' + (mpc[1] - 76).toFixed(1) + 'h14" stroke="' + darken(c, .25) + '" stroke-width="1"/>';
  } else if (fid === 'mirrorball') {
    var mbc = iP(x + 0.5, y + 0.5);
    s += '<rect x="' + (mbc[0] - 1.5).toFixed(1) + '" y="' + (mbc[1] - 96).toFixed(1) + '" width="3" height="40" fill="#b9b4c8"/>';
    s += '<circle cx="' + mbc[0].toFixed(1) + '" cy="' + (mbc[1] - 74).toFixed(1) + '" r="15" fill="' + c + '" stroke="' + darken(c, .25) + '" stroke-width="1.4"/>';
    s += '<path d="M' + (mbc[0] - 15).toFixed(1) + ' ' + (mbc[1] - 78).toFixed(1) + 'h30M' + (mbc[0] - 15).toFixed(1) + ' ' + (mbc[1] - 70).toFixed(1) + 'h30" stroke="#ffffff" stroke-width="1.2" opacity=".8"/>';
    s += '<circle cx="' + (mbc[0] + 13).toFixed(1) + '" cy="' + (mbc[1] - 92).toFixed(1) + '" r="2" fill="#ffffff"/>';
    s += '<circle cx="' + (mbc[0] - 18).toFixed(1) + '" cy="' + (mbc[1] - 86).toFixed(1) + '" r="1.6" fill="#ffffff"/>';
  } else if (fid === 'tube') {
    var tpc = iP(x + 0.5, y + 0.5);
    s += '<ellipse cx="' + tpc[0].toFixed(1) + '" cy="' + (tpc[1] - 14).toFixed(1) + '" rx="26" ry="13" fill="none" stroke="' + c + '" stroke-width="11"/>';
    s += '<ellipse cx="' + tpc[0].toFixed(1) + '" cy="' + (tpc[1] - 14).toFixed(1) + '" rx="26" ry="13" fill="none" stroke="#ffffff" stroke-width="3" opacity=".7"/>';
    s += '<ellipse cx="' + tpc[0].toFixed(1) + '" cy="' + (tpc[1] - 14).toFixed(1) + '" rx="9" ry="4.6" fill="none" stroke="#ffffff" stroke-width="2.4" opacity=".8"/>';
  } else if (fid === 'sunbed') {
    s += isoBox(x + 0.1, y + 0.1, w - 0.2, d - 0.2, 14, lighten(c, .1), darken(c, .22), darken(c, .12));
    s += isoBox(x + 0.14, y + 0.14, w - 0.28, d - 0.4, 6, '#ffffff', '#e8e2d8', '#f4efe6', 14);
    s += isoBox(x + 0.16, y + 0.16, 0.4, d - 0.32, 8, '#ffd6a5', '#d8b07a', '#e8c08a', 18);
    s += isoBox(x + 0.12, y + 0.12, 0.1, 0.1, 14, darken(c, .3), darken(c, .4), darken(c, .35), -14);
  } else if (fid === 'bathtub') {
    s += isoBox(x + 0.06, y + 0.1, w - 0.12, d - 0.2, 30, '#ffffff', '#d9e6ee', '#eef6fa');
    s += isoBox(x + 0.14, y + 0.18, w - 0.28, d - 0.36, 16, '#8fd6ff', '#5fb3e0', '#7cc6f2', 20);
    var btc = iP(x + w / 2, y + d / 2);
    s += '<ellipse cx="' + btc[0].toFixed(1) + '" cy="' + (btc[1] - 38).toFixed(1) + '" rx="' + (ROOM.HW * (w - 0.4)).toFixed(1) + '" ry="' + (ROOM.HH * (d - 0.5)).toFixed(1) + '" fill="#ffffff" opacity=".55"/>';
    s += '<rect x="' + (btc[0] - 2).toFixed(1) + '" y="' + (btc[1] - 62).toFixed(1) + '" width="4" height="16" fill="#c9d6e0"/>';
    s += '<path d="M' + (btc[0] - 8).toFixed(1) + ' ' + (btc[1] - 64).toFixed(1) + 'h16" stroke="#c9d6e0" stroke-width="3"/>';
  } else if (fid === 'duck') {
    var dpc = iP(x + 0.5, y + 0.5);
    s += '<ellipse cx="' + dpc[0].toFixed(1) + '" cy="' + (dpc[1] - 9).toFixed(1) + '" rx="13" ry="8" fill="' + c + '" stroke="' + darken(c, .25) + '" stroke-width="1.2"/>';
    s += '<circle cx="' + (dpc[0] + 7).toFixed(1) + '" cy="' + (dpc[1] - 20).toFixed(1) + '" r="7.5" fill="' + lighten(c, .12) + '" stroke="' + darken(c, .25) + '" stroke-width="1.2"/>';
    s += '<path d="M' + (dpc[0] + 13).toFixed(1) + ' ' + (dpc[1] - 20).toFixed(1) + 'l7 2-7 2z" fill="#ff8f3d"/>';
    s += '<circle cx="' + (dpc[0] + 9).toFixed(1) + '" cy="' + (dpc[1] - 22).toFixed(1) + '" r="1.2" fill="#3a2f20"/>';
  } else if (fid === 'piano') {
    s += isoBox(x + 0.06, y + 0.16, w - 0.12, d - 0.32, 26, darken(c, .05), darken(c, .35), darken(c, .22));
    s += isoBox(x + 0.1, y + 0.2, w - 0.2, d - 0.42, 4, '#fffdf8', '#e6e0d8', '#f6f0e6', 26);
    for (var pk = 0; pk < 6; pk++) {
      var kx = x + 0.16 + pk * ((w - 0.32) / 6);
      s += isoBox(kx, y + 0.26, 0.03, d - 0.52, 5, '#2b2438', '#1a1626', '#221d30', 28);
    }
    s += isoBox(x + 0.3, y + 0.2, w - 0.6, 0.12, 16, darken(c, .35), darken(c, .5), darken(c, .42), 26);
    s += isoBox(x + 0.14, y + 0.6, 0.1, 0.1, 22, darken(c, .3), darken(c, .45), darken(c, .38));
    s += isoBox(x + w - 0.24, y + 0.6, 0.1, 0.1, 22, darken(c, .3), darken(c, .45), darken(c, .38));
  } else if (fid === 'pethouse') {
    s += isoBox(x + 0.12, y + 0.12, w - 0.24, d - 0.24, 24, lighten(c, .1), darken(c, .2), darken(c, .1));
    var ph = iP(x + 0.5, y + 0.5);
    var rA = iP(x + 0.1, y + 0.1), rB = iP(x + w - 0.1, y + 0.1), rC = iP(x + w - 0.1, y + d - 0.1), rD = iP(x + 0.1, y + d - 0.1);
    var ridge = [ph[0], ph[1] - 50];
    s += '<polygon points="' + pts([[rA[0], rA[1] - 24], [rB[0], rB[1] - 24], ridge]) + '" fill="' + lighten(c, .18) + '"/>';
    s += '<polygon points="' + pts([[rB[0], rB[1] - 24], [rC[0], rC[1] - 24], ridge]) + '" fill="' + darken(c, .12) + '"/>';
    s += '<polygon points="' + pts([[rC[0], rC[1] - 24], [rD[0], rD[1] - 24], ridge]) + '" fill="' + darken(c, .25) + '"/>';
    var dh = iP(x + 0.5, y + d - 0.28);
    s += '<path d="M' + (dh[0] - 9).toFixed(1) + ' ' + dh[1].toFixed(1) + 'q9-16 18 0z" fill="' + darken(c, .45) + '"/>';
  } else if (fid === 'wheel') {
    var whc = iP(x + 0.5, y + 0.5);
    s += isoBox(x + 0.18, y + 0.18, w - 0.36, d - 0.36, 5, '#c9c0d8', '#9a90b0', '#b0a6c0');
    s += '<ellipse cx="' + whc[0].toFixed(1) + '" cy="' + (whc[1] - 40).toFixed(1) + '" rx="20" ry="24" fill="none" stroke="' + c + '" stroke-width="6"/>';
    s += '<ellipse cx="' + whc[0].toFixed(1) + '" cy="' + (whc[1] - 40).toFixed(1) + '" rx="14" ry="17" fill="none" stroke="' + lighten(c, .3) + '" stroke-width="2"/>';
    s += '<path d="M' + whc[0].toFixed(1) + ' ' + (whc[1] - 16).toFixed(1) + 'v-48M' + (whc[0] - 20).toFixed(1) + ' ' + (whc[1] - 40).toFixed(1) + 'h40" stroke="' + darken(c, .2) + '" stroke-width="2"/>';
  } else if (fid === 'bigplant') {
    s += isoBox(x + 0.2, y + 0.2, 0.6, 0.6, 26, '#e08a5a', '#b96b3f', '#cc7a4c');
    var gpc = iP(x + 0.5, y + 0.5);
    s += '<circle cx="' + gpc[0].toFixed(1) + '" cy="' + (gpc[1] - 54).toFixed(1) + '" r="24" fill="#5cb56e"/>';
    s += '<circle cx="' + (gpc[0] - 20).toFixed(1) + '" cy="' + (gpc[1] - 76).toFixed(1) + '" r="18" fill="#8ad79a"/>';
    s += '<circle cx="' + (gpc[0] + 18).toFixed(1) + '" cy="' + (gpc[1] - 82).toFixed(1) + '" r="17" fill="#6ec27f"/>';
    s += '<circle cx="' + gpc[0].toFixed(1) + '" cy="' + (gpc[1] - 104).toFixed(1) + '" r="14" fill="#8ad79a"/>';
    s += '<rect x="' + (gpc[0] - 2).toFixed(1) + '" y="' + (gpc[1] - 44).toFixed(1) + '" width="4" height="30" fill="#7a5a3a"/>';
  } else if (fid === 'toybox') {
    s += isoBox(x + 0.14, y + 0.14, w - 0.28, d - 0.28, 20, lighten(c, .2), darken(c, .18), darken(c, .06));
    s += isoBox(x + 0.12, y + 0.12, w - 0.24, d - 0.24, 5, lighten(c, .35), darken(c, .1), lighten(c, .1), 20);
    var tbc = iP(x + 0.5, y + 0.5);
    s += '<text x="' + tbc[0].toFixed(1) + '" y="' + (tbc[1] - 34).toFixed(1) + '" font-size="17" text-anchor="middle">🧸</text>';
    s += '<text x="' + (tbc[0] - 16).toFixed(1) + '" y="' + (tbc[1] - 26).toFixed(1) + '" font-size="12" text-anchor="middle">🪀</text>';
    s += '<text x="' + (tbc[0] + 15).toFixed(1) + '" y="' + (tbc[1] - 25).toFixed(1) + '" font-size="12" text-anchor="middle">🪁</text>';
  } else if (fid === 'robot') {
    s += isoBox(x + 0.24, y + 0.24, w - 0.48, d - 0.48, 12, darken(c, .1), darken(c, .3), darken(c, .2));
    s += isoBox(x + 0.3, y + 0.3, w - 0.6, d - 0.6, 20, lighten(c, .15), darken(c, .18), darken(c, .05), 12);
    var rbc = iP(x + 0.5, y + 0.5);
    s += '<circle cx="' + rbc[0].toFixed(1) + '" cy="' + (rbc[1] - 34).toFixed(1) + '" r="3" fill="#ff6b8b"/>';
    s += '<circle cx="' + (rbc[0] - 6).toFixed(1) + '" cy="' + (rbc[1] - 34).toFixed(1) + '" r="3" fill="#6be7ff"/>';
    s += '<path d="M' + rbc[0].toFixed(1) + ' ' + (rbc[1] - 56).toFixed(1) + 'v-8" stroke="' + darken(c, .25) + '" stroke-width="2"/>';
    s += '<circle cx="' + rbc[0].toFixed(1) + '" cy="' + (rbc[1] - 66).toFixed(1) + '" r="3" fill="#ffd166"/>';
  } else if (fid === 'standmirror') {
    s += isoBox(x + 0.26, y + 0.26, w - 0.52, d - 0.52, 62, '#d9d0e4', '#b6aacb', '#c8bcd8');
    var smc = iP(x + 0.5, y + 0.5);
    s += '<ellipse cx="' + smc[0].toFixed(1) + '" cy="' + (smc[1] - 64).toFixed(1) + '" rx="14" ry="16" fill="#eef8ff" stroke="#ffffff" stroke-width="2"/>';
    s += '<path d="M' + (smc[0] - 8).toFixed(1) + ' ' + (smc[1] - 56).toFixed(1) + 'l10 -12" stroke="#ffffff" stroke-width="2.5" opacity=".9"/>';
    s += '<path d="M' + (smc[0] - 20).toFixed(1) + ' ' + (smc[1] - 2).toFixed(1) + 'h40" stroke="' + darken('#d9d0e4', .3) + '" stroke-width="4"/>';
  } else if (fid === 'stage') {
    s += isoBox(x + 0.06, y + 0.06, w - 0.12, d - 0.12, 16, lighten(c, .2), darken(c, .2), darken(c, .08));
    s += isoBox(x + 0.06, y + 0.06, w - 0.12, d - 0.12, 4, '#ff9ec4', '#d16e96', '#e687a9', 16);
    var stC = iP(x + 0.5, y + 0.5);
    s += '<circle cx="' + stC[0].toFixed(1) + '" cy="' + (stC[1] - 22).toFixed(1) + '" r="18" fill="#ffe08a" opacity=".45"/>';
  } else {
    /* 사용자가 만든 가구: 색 상자 + 이모지 */
    s += isoBox(x + 0.12, y + 0.12, w - 0.24, d - 0.24, 22, lighten(c, .2), darken(c, .2), darken(c, .08));
    var cp = iP(x + w / 2, y + d / 2);
    s += '<text x="' + cp[0] + '" y="' + (cp[1] - 30) + '" font-size="24" text-anchor="middle">' + (it.icon || '🎁') + '</text>';
  }
  return s;
}

function roomItemDef(uidStr) {
  var items = curFloor().items || [];
  for (var i = 0; i < items.length; i++) if (items[i].u === uidStr) return items[i];
  return null;
}
function roomDecorDef(uidStr) {
  var list = curFloor().wallItems || [];
  for (var i = 0; i < list.length; i++) if (list[i].u === uidStr) return list[i];
  return null;
}
function roomDefSize(id) {
  var it = shopItem(id);
  if (!it) return { w: 1, d: 1 };
  return { w: it.w || 1, d: it.d || 1 };
}
function roomOverlap(x, y, w, d, exceptU) {
  var items = curFloor().items || [];
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    if (it.u === exceptU) continue;
    var sz = roomDefSize(it.id);
    if (!(x + w <= it.x || it.x + sz.w <= x || y + d <= it.y || it.y + sz.d <= y)) return true;
  }
  return false;
}

/* ---------------- 2.5D 방 그리기: 벽 장식 · 컨셉 · 넓이 ---------------- */
/* 벽 위에 거는 그림은 벽 기울기에 맞춰 눕혀요 (x=벽을 따라, y=위로) */
function wallMatrix(from, to, t, h) {
  var dx = to[0] - from[0], dy = to[1] - from[1];
  var len = Math.sqrt(dx * dx + dy * dy) || 1;
  var ux = dx / len, uy = dy / len;
  var ox = from[0] + ux * len * t, oy = from[1] + uy * len * t - (h || 0);
  return 'matrix(' + ux.toFixed(4) + ' ' + uy.toFixed(4) + ' 0 1 ' + ox.toFixed(1) + ' ' + oy.toFixed(1) + ')';
}

function wallDecorSvg(it, a, b, c) {
  var def = shopItem(it.id);
  if (!def) return '';
  /* 왼쪽 벽은 a→b, 오른쪽 벽은 c→a 방향 (글자가 거울처럼 뒤집히지 않게) */
  var from = (it.side === 'L') ? a : c;
  var to = (it.side === 'L') ? b : a;
  var slots = WALL_SLOTS[it.side] || WALL_SLOTS.R;
  var slot = slots[Math.max(0, Math.min(slots.length - 1, parseInt(it.slot, 10) || 0))];
  var tf = wallMatrix(from, to, slot.t, slot.h);
  var c1 = def.color || '#ffd9a0';
  var ic = def.icon || '🖼';
  var fid = def.fid || 'poster';
  var g = '';
  if (fid === 'garland') {
    g += '<path d="M-46 2q46 15 92 0" fill ="none" stroke="' + darken(c1, .18) + '" stroke-width="2"/>';
    for (var gi = 0; gi < 5; gi++) {
      var bx = -36 + gi * 18, by = -Math.sin((gi + 1) / 6 * Math.PI) * 11 - 6;
      g += '<circle cx="' + bx + '" cy="' + by + '" r="7.5" fill="' + lighten(c1, .3) + '" stroke="' + darken(c1, .2) + '" stroke-width="1"/>';
      g += '<text x="' + bx + '" y="' + (by + 4) + '" font-size="9" text-anchor="middle">' + ic + '</text>';
    }
  } else if (fid === 'notes') {
    for (var ni = 0; ni < 3; ni++) {
      g += '<text x="' + (-16 + ni * 17) + '" y="' + (-12 - ni * 8) + '" font-size="' + (28 - ni * 5) + '" fill="' + c1 + '" text-anchor="middle" filter="url(#decoGlow)">♪</text>';
    }
  } else if (fid === 'neon') {
    g += '<rect x="-30" y="-56" width="60" height="56" rx="10" fill="' + c1 + '" opacity=".13"/>';
    g += '<rect x="-30" y="-56" width="60" height="56" rx="10" fill="none" stroke="' + c1 + '" stroke-width="3" filter="url(#decoGlow)"/>';
    g += '<text x="0" y="-19" font-size="26" text-anchor="middle">' + ic + '</text>';
  } else if (fid === 'clock') {
    g += '<circle cx="0" cy="-29" r="23" fill="#fffdf8" stroke="' + c1 + '" stroke-width="4"/>';
    g += '<circle cx="0" cy="-29" r="18" fill="none" stroke="' + lighten(c1, .3) + '" stroke-width="1"/>';
    g += '<path d="M0 -29L0 -41M0 -29L11 -24" fill="none" stroke="#6b5a48" stroke-width="2.6" stroke-linecap="round"/>';
    g += '<circle cx="0" cy="-29" r="2.6" fill="' + darken(c1, .25) + '"/>';
  } else if (fid === 'shelf') {
    g += '<rect x="-27" y="-7" width="54" height="7" rx="2" fill="' + c1 + '"/>';
    g += '<path d="M-18 0l7 11h-14z M18 0l7 11h-14z" fill="' + darken(c1, .22) + '"/>';
    g += '<text x="-14" y="-11" font-size="16" text-anchor="middle">' + ic + '</text>';
    g += '<text x="7" y="-11" font-size="13" text-anchor="middle">🧸</text>';
    g += '<text x="20" y="-12" font-size="12" text-anchor="middle">🌿</text>';
  } else {
    g += '<rect x="-25" y="-58" width="50" height="58" rx="4" fill="' + c1 + '"/>';
    g += '<rect x="-21" y="-54" width="42" height="45" rx="3" fill="#fffdf8"/>';
    g += '<text x="0" y="-25" font-size="24" text-anchor="middle">' + ic + '</text>';
    g += '<circle cx="0" cy="-6" r="2.2" fill="' + darken(c1, .3) + '"/>';
  }
  /* 탭 영역을 그림보다 조금 넓혀요 — 손가락으로 눌렀을 때 잘 안 잡히던 문제를 줄여요 */
  var hit = '<rect x="-32" y="-64" width="64" height="72" fill="transparent" pointer-events="all"/>';
  return '<g class="room-decor' + (roomUi.dsel === it.u ? ' on' : '') + '" data-act="room-decor-select" data-u="' + esc(it.u) + '" transform="' + tf + '">' + hit + g + '</g>';
}

function roomRand(i) {
  var x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/* 컨셉별 분위기 — 네온 테두리·무대 불빛·물방울·김이 피어나요 */
function themeAmbientHtml(look, a, b, c, N) {
  var th = look.th || {};
  var s = '';
  if (look.glow) {
    s += '<polyline points="' + pts([[b[0], b[1] - ROOM.WALL_H], [a[0], a[1] - ROOM.WALL_H], [c[0], c[1] - ROOM.WALL_H]]) +
      '" fill="none" stroke="' + look.glow + '" stroke-width="6" opacity=".45" stroke-linejoin="round" filter="url(#decoGlow)"/>';
  }
  if (th.beam) {
    for (var mi = 0; mi < 3; mi++) {
      var t0 = 0.2 + mi * 0.24;
      var top = [a[0] + (c[0] - a[0]) * t0, a[1] + (c[1] - a[1]) * t0 - ROOM.WALL_H + 4];
      var foot = iP(N * (0.25 + mi * 0.25), N * (0.35 + (mi % 2) * 0.3));
      s += '<polygon points="' + pts([top, [top[0] + 16, top[1]], [foot[0] + 26, foot[1]], [foot[0] - 26, foot[1]]]) +
        '" fill="' + look.glow + '" opacity=".10"/>';
    }
  }
  var fx = th.fx || (th.floorPat === 'grid' ? 'pixel' : '');
  if (fx) {
    s += '<g class="room-fx" pointer-events="none">';
    for (var i = 0; i < 8; i++) {
      var px = 0.6 + roomRand(i + 3) * (N - 1.2);
      var py = 0.6 + roomRand(i + 17) * (N - 1.2);
      var pp = iP(px, py);
      var dly = (i * 0.55).toFixed(2);
      if (fx === 'bubble') {
        s += '<circle class="fx-up" cx="' + pp[0].toFixed(1) + '" cy="' + pp[1].toFixed(1) + '" r="' + (3 + (i % 3)) + '" fill="#ffffff" opacity=".5" style="animation-delay:' + dly + 's"/>';
      } else if (fx === 'steam') {
        s += '<circle class="fx-up" cx="' + pp[0].toFixed(1) + '" cy="' + pp[1].toFixed(1) + '" r="' + (5 + (i % 3) * 2) + '" fill="#ffffff" opacity=".35" style="animation-delay:' + dly + 's"/>';
      } else if (fx === 'star') {
        s += '<circle class="fx-twinkle" cx="' + pp[0].toFixed(1) + '" cy="' + pp[1].toFixed(1) + '" r="' + (1.6 + (i % 3) * 0.7) + '" fill="#ffffff" style="animation-delay:' + dly + 's"/>';
      } else {
        s += '<rect class="fx-up" x="' + pp[0].toFixed(1) + '" y="' + pp[1].toFixed(1) + '" width="6" height="6" rx="1.5" fill="' + (look.glow || '#6be7ff') + '" opacity=".55" style="animation-delay:' + dly + 's"/>';
      }
    }
    s += '</g>';
  }
  return s;
}

/* 바닥 무늬 — 컨셉마다 다른 분위기 */
function floorPatHtml(look, N) {
  var s = '';
  var pat = look.floorPat || 'check';
  if (pat === 'check') {
    for (var gx = 0; gx < N; gx++) {
      for (var gy = 0; gy < N; gy++) {
        if ((gx + gy) % 2 === 0) continue;
        s += '<polygon points="' + pts(isoQuad(gx, gy, 1, 1)) + '" fill="' + look.floor2 + '"/>';
      }
    }
  } else if (pat === 'grid') {
    s += '<polygon points="' + pts(isoQuad(0, 0, N, N)) + '" fill="' + look.floor + '"/>';
    for (var i = 0; i < N; i++) {
      var p1 = iP(i, 0), p2 = iP(i, N), p3 = iP(0, i), p4 = iP(N, i);
      s += '<path d="M' + p1[0].toFixed(1) + ' ' + p1[1].toFixed(1) + 'L' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1) +
        'M' + p3[0].toFixed(1) + ' ' + p3[1].toFixed(1) + 'L' + p4[0].toFixed(1) + ' ' + p4[1].toFixed(1) +
        '" stroke="' + (look.glow || '#6be7ff') + '" stroke-width="1.4" opacity=".45"/>';
    }
    for (var gi = 0; gi < 7; gi++) {
      var cx = Math.floor(roomRand(gi + 5) * N), cy = Math.floor(roomRand(gi + 23) * N);
      s += '<polygon points="' + pts(isoQuad(cx, cy, 1, 1)) + '" fill="' + (look.glow || '#6be7ff') + '" opacity=".16"/>';
    }
  } else if (pat === 'water') {
    s += '<polygon points="' + pts(isoQuad(0, 0, N, N)) + '" fill="' + look.floor + '"/>';
    s += '<g class="room-water">';
    for (var wi = 0; wi < 7; wi++) {
      var yy = wi * (N / 6.4);
      var path = '';
      for (var t = 0; t <= N * 4; t++) {
        var xx = t / 4;
        var wig = Math.sin(xx * 2.2 + wi) * 0.16;
        var pt = iP(xx, yy + wig);
        path += (t === 0 ? 'M' : 'L') + pt[0].toFixed(1) + ' ' + pt[1].toFixed(1);
      }
      s += '<path d="' + path + '" fill="none" stroke="#ffffff" stroke-width="2" opacity="' + (0.28 + (wi % 3) * 0.1).toFixed(2) + '"/>';
    }
    s += '</g>';
    var poolC = iP(N / 2, N / 2);
    s += '<ellipse cx="' + poolC[0].toFixed(1) + '" cy="' + poolC[1].toFixed(1) + '" rx="' + (N * ROOM.HW * 0.42).toFixed(1) + '" ry="' + (N * ROOM.HH * 0.42).toFixed(1) + '" fill="#ffffff" opacity=".18"/>';
  } else if (pat === 'plank') {
    for (var py2 = 0; py2 < N; py2++) {
      s += '<polygon points="' + pts(isoQuad(0, py2, N, 1)) + '" fill="' + (py2 % 2 ? look.floor2 : look.floor) + '"/>';
      var l1 = iP(0, py2), l2 = iP(N, py2);
      s += '<path d="M' + l1[0].toFixed(1) + ' ' + l1[1].toFixed(1) + 'L' + l2[0].toFixed(1) + ' ' + l2[1].toFixed(1) + '" stroke="' + darken(look.floor, .12) + '" stroke-width="1.4" opacity=".6"/>';
    }
  } else if (pat === 'star') {
    s += '<polygon points="' + pts(isoQuad(0, 0, N, N)) + '" fill="' + look.floor + '"/>';
    for (var si = 0; si < 34; si++) {
      var sx = roomRand(si * 3 + 1) * N, sy = roomRand(si * 5 + 7) * N;
      var sp2 = iP(sx, sy);
      s += '<circle cx="' + sp2[0].toFixed(1) + '" cy="' + sp2[1].toFixed(1) + '" r="' + (0.9 + (si % 3) * 0.6).toFixed(1) + '" fill="#ffffff" opacity="' + (0.35 + (si % 4) * 0.15).toFixed(2) + '"/>';
    }
  } else if (pat === 'spot') {
    s += '<polygon points="' + pts(isoQuad(0, 0, N, N)) + '" fill="' + look.floor + '"/>';
    var sc = iP(N / 2, N / 2);
    s += '<ellipse cx="' + sc[0].toFixed(1) + '" cy="' + sc[1].toFixed(1) + '" rx="' + (N * ROOM.HW * 0.5).toFixed(1) + '" ry="' + (N * ROOM.HH * 0.52).toFixed(1) + '" fill="url(#spotGrad)"/>';
  } else {
    for (var qx = 0; qx < N; qx++) {
      for (var qy = 0; qy < N; qy++) {
        if ((qx + qy) % 2 === 0) continue;
        s += '<polygon points="' + pts(isoQuad(qx, qy, 1, 1)) + '" fill="' + look.floor2 + '"/>';
      }
    }
  }
  return s;
}

function roomSceneHtml(withId) {
  var room = prof().room;
  var fl = curFloor(room);
  var N = ROOM.N;
  var look = roomLook(fl.theme, fl.wall);
  var S = roomScale();
  var s = '<svg' + (withId === false ? '' : ' id="roomScene"') + ' viewBox="' + ROOM.VB + '" class="room-svg" role="img" aria-label="2.5D 마이룸 ' + fl.n + '층">';

  s += '<defs>';
  s += '<linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + lighten(look.wall, .16) + '"/><stop offset="1" stop-color="' + look.wall + '"/></linearGradient>';
  s += '<radialGradient id="spotGrad" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="' + (look.glow || '#ffffff') + '" stop-opacity=".5"/><stop offset=".6" stop-color="' + (look.glow || '#ffffff') + '" stop-opacity=".16"/><stop offset="1" stop-color="' + (look.glow || '#ffffff') + '" stop-opacity="0"/></radialGradient>';
  s += '<filter id="decoGlow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';
  s += '<pattern id="wallPat" width="46" height="46" patternUnits="userSpaceOnUse">';
  if (look.pat === 'star') {
    s += '<path d="M12 10l1.8 4.6 4.6 1.8-4.6 1.8L12 23l-1.8-4.6L5.6 16.4l4.6-1.8z" fill="' + look.patC + '" opacity=".7"/>';
    s += '<circle cx="33" cy="30" r="1.6" fill="' + look.patC + '" opacity=".6"/>';
  } else if (look.pat === 'cloud') {
    s += '<ellipse cx="14" cy="16" rx="11" ry="5.5" fill="' + look.patC + '" opacity=".9"/><ellipse cx="9" cy="13" rx="6" ry="5" fill="' + look.patC + '" opacity=".9"/>';
  } else if (look.pat === 'leaf') {
    s += '<path d="M12 26q0-12 12-12q0 12-12 12z" fill="' + look.patC + '" opacity=".8"/>';
  } else if (look.pat === 'petal') {
    s += '<ellipse cx="14" cy="16" rx="4" ry="6" fill="' + look.patC + '" opacity=".85" transform="rotate(24 14 16)"/>';
    s += '<circle cx="34" cy="32" r="2.6" fill="' + look.patC + '" opacity=".7"/>';
  } else if (look.pat === 'check') {
    s += '<rect x="0" y="0" width="23" height="23" fill="' + look.patC + '" opacity=".5"/>';
    s += '<rect x="23" y="23" width="23" height="23" fill="' + look.patC + '" opacity=".5"/>';
  } else if (look.pat === 'wood') {
    s += '<path d="M0 15h46M0 32h46" stroke="' + look.patC + '" stroke-width="2" opacity=".7"/>';
  } else if (look.pat === 'wave') {
    s += '<path d="M2 16q6-6 12 0t12 0 12 0" fill="none" stroke="' + look.patC + '" stroke-width="2.4" opacity=".75"/>';
    s += '<path d="M2 34q6-6 12 0t12 0 12 0" fill="none" stroke="' + look.patC + '" stroke-width="2" opacity=".55"/>';
  } else if (look.pat === 'rainbow') {
    s += '<path d="M4 40q18-26 38-26" fill="none" stroke="#ffb3c7" stroke-width="4" opacity=".6"/>';
    s += '<path d="M8 42q17-22 34-22" fill="none" stroke="#a8d8ff" stroke-width="3" opacity=".55"/>';
  } else {
    s += '<circle cx="12" cy="14" r="2.4" fill="' + look.patC + '" opacity=".8"/><circle cx="34" cy="34" r="1.8" fill="' + look.patC + '" opacity=".6"/>';
  }
  s += '</pattern>';
  s += '<clipPath id="floorClip"><polygon points="' + pts([iP(0, 0), iP(N, 0), iP(N, N), iP(0, N)]) + '"/></clipPath>';
  s += '</defs>';

  /* 벽 */
  var a = iP(0, 0), b = iP(0, N), c = iP(N, 0);
  s += '<polygon points="' + pts([[a[0], a[1]], [b[0], b[1]], [b[0], b[1] - ROOM.WALL_H], [a[0], a[1] - ROOM.WALL_H]]) + '" fill="url(#wallGrad)"/>';
  s += '<polygon points="' + pts([[a[0], a[1]], [c[0], c[1]], [c[0], c[1] - ROOM.WALL_H], [a[0], a[1] - ROOM.WALL_H]]) + '" fill="' + look.wall2 + '"/>';
  s += '<polygon points="' + pts([[a[0], a[1]], [b[0], b[1]], [b[0], b[1] - ROOM.WALL_H], [a[0], a[1] - ROOM.WALL_H]]) + '" fill="url(#wallPat)" opacity=".55"/>';
  s += '<polygon points="' + pts([[a[0], a[1]], [c[0], c[1]], [c[0], c[1] - ROOM.WALL_H], [a[0], a[1] - ROOM.WALL_H]]) + '" fill="url(#wallPat)" opacity=".3"/>';
  /* 방 컨셉 분위기 (네온 테두리·무대 불빛·반짝이) */
  s += themeAmbientHtml(look, a, b, c, N);

  /* 창문 (왼쪽 벽) */
  function wallPt(from, to, t, up) { return [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t - (up || 0)]; }
  var wA = wallPt(a, b, 0.17, 90), wB = wallPt(a, b, 0.45, 90), wC = wallPt(a, b, 0.45, 36), wD = wallPt(a, b, 0.17, 36);
  var pA = wallPt(a, b, 0.2, 84), pB = wallPt(a, b, 0.42, 84), pC = wallPt(a, b, 0.42, 42), pD = wallPt(a, b, 0.2, 42);
  var mA = wallPt(a, b, 0.31, 84), mB = wallPt(a, b, 0.31, 42);
  var hA = wallPt(a, b, 0.2, 63), hB = wallPt(a, b, 0.42, 63);
  s += '<g class="room-window">' +
    '<polygon points="' + pts([wD, wC, wB, wA]) + '" fill="#ffffff" stroke="' + darken(look.wall, .12) + '" stroke-width="1.5"/>' +
    '<polygon points="' + pts([pD, pC, pB, pA]) + '" fill="' + look.win + '"/>' +
    '<path d="M' + mA[0].toFixed(1) + ' ' + mA[1].toFixed(1) + 'L' + mB[0].toFixed(1) + ' ' + mB[1].toFixed(1) + '" stroke="#ffffff" stroke-width="3"/>' +
    '<path d="M' + hA[0].toFixed(1) + ' ' + hA[1].toFixed(1) + 'L' + hB[0].toFixed(1) + ' ' + hB[1].toFixed(1) + '" stroke="#ffffff" stroke-width="3"/>' +
    '<polygon points="' + pts([wallPt(a, b, 0.15, 34), wallPt(a, b, 0.47, 34), wallPt(a, b, 0.47, 28), wallPt(a, b, 0.15, 28)]) + '" fill="' + lighten(look.wall, .1) + '"/>' +
    '<circle cx="' + wallPt(a, b, 0.36, 74)[0].toFixed(1) + '" cy="' + wallPt(a, b, 0.36, 74)[1].toFixed(1) + '" r="11" fill="' + (look.dark ? '#fff8d8' : '#ffe9a8') + '" opacity=".9"/>' +
    '</g>';
  /* 액자 (오른쪽 벽) */
  var f1 = wallPt(a, c, 0.46, 96), f2 = wallPt(a, c, 0.7, 96), f3 = wallPt(a, c, 0.7, 40), f4 = wallPt(a, c, 0.46, 40);
  s += '<g class="room-frame">' +
    '<polygon points="' + pts([f4, f3, f2, f1]) + '" fill="#ffffff" stroke="' + darken(look.wall, .16) + '" stroke-width="4"/>' +
    '<circle cx="' + wallPt(a, c, 0.62, 74)[0] + '" cy="' + wallPt(a, c, 0.62, 74)[1] + '" r="11" fill="#ffd6a5"/>' +
    '<path d="M' + wallPt(a, c, 0.51, 50)[0] + ' ' + wallPt(a, c, 0.51, 50)[1] + 'l13-16 13 16z" fill="#a8d8a0"/>' +
    '</g>';

  /* 벽 장식 */
  var wits = fl.wallItems || [];
  for (var wi = 0; wi < wits.length; wi++) s += wallDecorSvg(wits[wi], a, b, c);

  /* 바닥 */
  s += '<polygon points="' + pts([a, c, iP(N, N), b]) + '" fill="' + look.floor + '"/>';
  s += '<g clip-path="url(#floorClip)">' + floorPatHtml(look, N) + '</g>';
  /* 벽걸이 몰딩 */
  s += '<polyline points="' + pts([b, a, c]) + '" fill="none" stroke="' + (look.trim || darken(look.floor, .18)) + '" stroke-width="5" stroke-linejoin="round"/>';
  /* 바닥 테두리 */
  s += '<polygon points="' + pts([a, c, iP(N, N), b]) + '" fill="none" stroke="' + darken(look.floor, .14) + '" stroke-width="3"/>';
  /* 바닥 클릭 영역 (가구보다 먼저 그려서 가구 클릭을 막지 않게)
     data-act 는 층 이동 탭(room-floor data-n)과 꼭 달라야 해요 —
     같은 이름을 쓰면 2·3층 바닥을 눌렀을 때 1층으로 내려가 버려요. */
  s += '<polygon points="' + pts([a, c, iP(N, N), b]) + '" fill="transparent" class="room-floor" data-act="room-floor-tap"/>';

  /* 가구 + 아바타 + 친구: 뒤에서 앞으로 */
  var draw = [];
  var items = fl.items || [];
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    var def = shopItem(it.id);
    if (!def) continue;
    var sz = roomDefSize(it.id);
    /* 가구는 타일 좌표(iP)로 그려서 방이 넓어지면 저절로 맞춰져요 (따로 줄이지 않아요) */
    var body = furniSvg(def, it.x, it.y);
    draw.push({
      k: it.x + it.y + (sz.w + sz.d) * 0.01 + (def.fid === 'rug' || def.fid === 'skate' ? -3 : 0),
      u: it.u,
      html: '<g class="room-hit' + (roomUi.sel === it.u ? ' on' : '') + '" data-room-drag="' + esc(it.u) + '" data-act="room-item" data-u="' + esc(it.u) + '">' + body + '</g>'
    });
    if (roomUi.sel === it.u) {
      draw.push({ k: 99, html: '<polygon points="' + pts(isoQuad(it.x + 0.02, it.y + 0.02, sz.w - 0.04, sz.d - 0.04, 1)) + '" fill="none" stroke="#ff9f1c" stroke-width="3" stroke-dasharray="7 5" pointer-events="none"/>' });
    }
  }
  /* 아바타 — 작고 귀엽게, 바닥을 누르면 그 자리로 걸어가요 */
  var av = prof().avatar;
  var ap = iP(roomAva.x, roomAva.y);
  var avS = AV_ROOM_SCALE * S;
  draw.push({
    k: roomAva.x + roomAva.y,
    html: '<g class="room-ava" transform="translate(' + ap[0].toFixed(1) + ',' + ap[1].toFixed(1) + ')" pointer-events="none">' +
      '<g class="room-bob"><g class="room-ava-hop">' +
      '<svg x="' + (-60 * avS).toFixed(1) + '" y="' + (-194 * avS).toFixed(1) + '" width="' + (120 * avS).toFixed(1) + '" height="' + (200 * avS).toFixed(1) + '" viewBox="0 0 120 200" aria-hidden="true">' +
      avatarInner(av) + '</svg></g></g></g>'
  });
  if (roomAva.showTarget) {
    var trp = iP(roomAva.tx, roomAva.ty);
    draw.push({
      k: 98.5,
      html: '<g class="room-ava-target" pointer-events="none"><ellipse cx="' + trp[0].toFixed(1) + '" cy="' + trp[1].toFixed(1) + '" rx="20" ry="10" fill="none" stroke="#ff9f1c" stroke-width="3" stroke-dasharray="6 5"/></g>'
    });
  }
  /* 친구 (이 층에서 노는 친구들) */
  var pets = fl.pets || [];
  /* 방이 넓고 친구가 많을수록 골고루 펼쳐 놓아요 (서로 겹치지 않게) */
  var petCols = pets.length <= 2 ? 2 : (pets.length <= 4 ? 2 : (pets.length <= 6 ? 3 : 4));
  var petRows = Math.max(1, Math.ceil(pets.length / petCols));
  var petStepX = (ROOM.N - 3) / Math.max(1, petCols - 1);
  var petStepY = Math.min(2.4, (ROOM.N - 5.0) / Math.max(1, petRows - 1));
  for (var pi = 0; pi < pets.length; pi++) {
    var sp = speciesById(pets[pi]);
    var pcol = pi % petCols, prow = Math.floor(pi / petCols);
    var pp = iP(1.7 + pcol * petStepX, 3.0 + prow * petStepY);
    /* 친구마다 그 종족의 실제 부화 단계(1~3) 모습으로 보여 줘요 — 1단계 조개가 진주룡으로 보이지 않게 */
    var petShowStage = petStageForSpecies(prof(), pets[pi]);
    draw.push({
      k: 6.5,
      html: '<g class="room-pet" data-sp="' + esc(sp.id) + '" transform="translate(' + pp[0].toFixed(1) + ',' + pp[1].toFixed(1) + ') scale(' + (0.72 + 0.28 * S).toFixed(3) + ')" pointer-events="none"><svg x="-34" y="-62" width="68" height="68" viewBox="0 0 100 100">' + monSvg(sp, petShowStage) + '</svg></g>'
    });
  }
  draw.sort(function (x, y) { return x.k - y.k; });
  for (var di = 0; di < draw.length; di++) s += draw[di].html;

  s += '</svg>';
  return s;
}
function roomFloorBarHtml() {
  var room = prof().room;
  var fl = curFloor(room);
  var list = room.floors || [];
  var th = themeInfo(fl.theme);
  var si = roomSizeInfo(fl.size);
  var h = '<div class="room-topbar">';
  h += '<div class="floor-bar" role="tablist" aria-label="마이룸 층 고르기">';
  for (var i = 0; i < list.length; i++) {
    var f = list[i];
    var on = (f.n === fl.n);
    h += '<button type="button" class="floor-chip' + (on ? ' on' : '') + '" role="tab" aria-selected="' + (on ? 'true' : 'false') + '" data-act="room-floor" data-n="' + f.n + '">' +
      '<b>' + f.n + '층</b><small>' + themeInfo(f.theme).icon + '</small></button>';
  }
  if (list.length < ROOM_MAX_FLOORS) {
    var nextN = list.length + 1;
    h += '<button type="button" class="floor-add" data-act="room-floor-add">＋ 새 층<b>' + coinSvg() + ' ' + fmtNum(floorCost(nextN)) + '</b></button>';
  }
  h += '</div>';
  h += '<span class="rt-tag floor-tag" aria-label="지금 층 컨셉">' + th.icon + ' ' + esc(th.name) + '</span>';
  var decoN = (fl.wallItems || []).length;
  var decoMax = 2 * wallSlotCount(fl.size);
  h += '<span class="rt-tag" aria-label="벽 장식 개수">🖼 벽 장식 ' + decoN + '/' + decoMax + '개</span>';
  h += '<span class="shop-coin" id="roomCoins">' + coinSvg() + ' ' + fmtNum(prof().coins) + '</span>';
  h += '</div>';
  return h;
}

function roomToolsHtml() {
  var fl = curFloor();
  var placed = (fl.items || []).length;
  var ownedFurni = 0, all = shopAll();
  for (var i = 0; i < all.length; i++) {
    if (all[i].kind === 'furni' && prof().owned[all[i].id] && !all[i].hidden) ownedFurni++;
  }
  var pets = (Object.prototype.toString.call(fl.pets) === '[object Array]') ? fl.pets : [];
  var decoN = (fl.wallItems || []).length;
  function pill(key, label, act) {
    return '<button type="button" class="tool-pill' + (roomUi.panel === key ? ' on' : '') + '" data-act="' + (act || ('room-' + key)) + '">' + label + '</button>';
  }
  /* 네 칸 반듯하게 — 아이폰 390px에서는 2×2, 넓은 화면에서는 한 줄 */
  var h = '<div class="room-xprow"><div class="xpbar" data-xpbar></div>' +
    '<button type="button" class="tool-pill" data-act="ach-open">🏆 업적</button></div>' +
    '<div class="room-ctrl">' +
    pill('studio', '🎨 벽지·컨셉') +
    pill('storage', '🧺 보관함 ' + Math.max(0, ownedFurni - placed)) +
    pill('pets', '🐾 친구 ' + pets.length + '/' + roomPetMax(fl.size)) +
    pill('size', '📐 방 확장') +
    '</div>';
  if (decoN && roomUi.panel !== 'studio') h += '<p class="room-hint slim">벽에 건 장식 ' + decoN + '개 · 벽에 걸린 장식을 누르면 치울 수 있어요</p>';
  return h;
}

function roomStudioTabsHtml() {
  var t = roomUi.studio || 'wall';
  function tb(k, label) {
    return '<button type="button" class="tab' + (t === k ? ' on' : '') + '" data-act="room-studio-tab" data-tab="' + k + '">' + label + '</button>';
  }
  return '<div class="studio-tabs">' + tb('wall', '🎨 벽지') + tb('decor', '🖼 벽 장식') + tb('theme', '🏷 컨셉') + '</div>';
}

function roomPanelHtml() {
  var h = '';
  var fl = curFloor();
  if (roomUi.panel === 'studio') {
    var tab = roomUi.studio || 'wall';
    h += '<div class="room-panel"><div class="rp-head"><b>🎨 방 꾸미기 · ' + fl.n + '층</b><button type="button" class="ghost-btn tiny" data-act="room-back">닫기</button></div>';
    h += roomStudioTabsHtml();
    if (tab === 'wall') {
      h += '<div class="rp-grid">';
      var walls = shopCat('wall');
      for (var i = 0; i < walls.length; i++) {
        var w = walls[i];
        var ownIt = w.price <= 0 || prof().owned[w.id];
        var thw = wallInfo(w.id);
        h += '<button type="button" class="wall-card' + (fl.wall === w.id ? ' on' : '') + '" data-act="room-wall-set" data-id="' + esc(w.id) + '">' +
          '<span class="wc-prev" style="--w:' + thw.wall + ';--f:' + thw.floor + '"></span>' +
          '<b>' + esc(w.name) + '</b><small>' + (ownIt ? (fl.wall === w.id ? '사용 중' : '바꾸기') : coinSvg() + ' ' + fmtNum(w.price)) + '</small>' +
          '</button>';
      }
      h += '</div><p class="lf-note">벽지는 지금 보고 있는 ' + fl.n + '층에만 발라져요. 층마다 따로 고를 수 있어요.</p>';
    } else if (tab === 'decor') {
      var placedIds = {};
      for (var d0 = 0; d0 < (fl.wallItems || []).length; d0++) placedIds[fl.wallItems[d0].id] = (placedIds[fl.wallItems[d0].id] || 0) + 1;
      var all2 = shopAll(), anyDeco = false;
      h += '<div class="rp-grid">';
      for (var d1 = 0; d1 < all2.length; d1++) {
        var dd = all2[d1];
        if (dd.kind !== 'decor' || dd.hidden || !prof().owned[dd.id]) continue;
        anyDeco = true;
        var used = placedIds[dd.id] || 0;
        h += '<button type="button" class="wall-card deco-card" data-act="room-decor-place" data-id="' + esc(dd.id) + '">' +
          '<span class="dc-prev" style="--ic:' + esc(dd.color || '#ffd9a0') + '">' + (dd.icon || '🖼') + '</span>' +
          '<b>' + esc(dd.name) + '</b><small>' + (used ? '방에 ' + used + '개 · 더 걸기' : '걸기') + '</small></button>';
      }
      if (!anyDeco) h += '<p class="spend-empty">아직 벽 장식이 없어요. 상점에서 골라 보세요!</p>';
      h += '</div>';
      var decoN2 = (fl.wallItems || []).length;
      var decoMax2 = 2 * wallSlotCount(fl.size);
      h += '<p class="lf-note">벽 장식 ' + decoN2 + '개 / 최대 ' + decoMax2 + '개 · 벽에 걸린 장식을 누르면 치울 수 있어요.</p>';
      if (decoN2 > 0) h += '<button type="button" class="pill-btn shop-jump" data-act="room-decor-reset">🧹 벽장식 초기화 (모두 치우기)</button>';
      h += '<button type="button" class="pill-btn warm shop-jump" data-act="shop-open" data-shop-tab="room">🖼 벽 장식 상점 가기</button>';
    } else {
      h += '<div class="rp-grid">';
      var ths = shopCat('theme');
      for (var t0 = 0; t0 < ths.length; t0++) {
        var ti = ths[t0];
        var info = THEMES[ti.id];
        if (!info) continue;
        var haveT = ti.price <= 0 || prof().owned[ti.id];
        var cur = (fl.theme === ti.id);
        h += '<button type="button" class="wall-card theme-card' + (cur ? ' on' : '') + '" data-act="room-theme-set" data-id="' + esc(ti.id) + '">' +
          '<span class="wc-prev theme-prev" style="--w:' + (info.wall || wallInfo(fl.wall).wall) + ';--f:' + (info.floor || wallInfo(fl.wall).floor) + '">' + (info.icon || '🏷') + '</span>' +
          '<b>' + esc(info.name) + '</b><small>' + (cur ? '사용 중' : (haveT ? '바꾸기' : coinSvg() + ' ' + fmtNum(ti.price))) + '</small></button>';
      }
      h += '</div><p class="lf-note">한 번 사면 어느 층에나 바꿔 쓸 수 있어요. 컨셉마다 바닥·벽·불빛이 달라져요.</p>';
    }
    h += '</div>';
  } else if (roomUi.panel === 'size') {
    h += '<div class="room-panel"><div class="rp-head"><b>📐 방 넓히기 · ' + fl.n + '층</b><button type="button" class="ghost-btn tiny" data-act="room-back">닫기</button></div><div class="size-list">';
    for (var sz = 1; sz <= 3; sz++) {
      var si = roomSizeInfo(sz);
      var st = (fl.size === sz) ? 'now' : (fl.size > sz ? 'past' : (fl.size + 1 === sz ? 'next' : 'far'));
      h += '<div class="size-row' + (st === 'now' ? ' on' : '') + '">' +
        '<span class="sz-name"><b>' + sz + '단계 · ' + si.label + '</b><small>' + si.N + '×' + si.N + ' 바닥</small></span>' +
        (st === 'now' ? '<span class="sz-tail">지금 크기</span>'
          : st === 'past' ? '<span class="sz-tail muted">지나왔어요</span>'
          : st === 'next' ? '<button type="button" class="pill-btn warm" data-act="room-size-up">' + coinSvg() + ' ' + fmtNum(si.cost) + ' 넓히기</button>'
          : '<span class="sz-tail muted">먼저 ' + (sz - 1) + '단계</span>') +
        '</div>';
    }
    h += '</div><p class="lf-note">방은 3단계가 최대예요. 그래야 어떤 화면에서도 방이 잘리지 않고 예쁘게 담겨요. 넓히면 가구 놓을 자리와 벽 장식 자리가 늘어나요.</p></div>';
  } else if (roomUi.panel === 'storage') {
    h += '<div class="room-panel"><div class="rp-head"><b>🧺 가구 보관함 · ' + fl.n + '층</b><button type="button" class="ghost-btn tiny" data-act="room-back">닫기</button></div>';
    var placedIds2 = {};
    for (var pi = 0; pi < (fl.items || []).length; pi++) placedIds2[fl.items[pi].id] = (placedIds2[fl.items[pi].id] || 0) + 1;
    var list = shopAll(), any = false;
    h += '<div class="storage-grid">';
    for (var k = 0; k < list.length; k++) {
      var it = list[k];
      if (it.kind !== 'furni' || it.hidden || !prof().owned[it.id]) continue;
      any = true;
      var used2 = placedIds2[it.id] || 0;
      h += '<div class="storage-card">' +
        '<span class="st-ic" style="--ic:' + esc(it.color) + '">' + (it.icon || '🪑') + '</span>' +
        '<b>' + esc(it.name) + '</b><small>방에 ' + used2 + '개</small>' +
        '<button type="button" class="pill-btn" data-act="room-place" data-id="' + esc(it.id) + '">놓기</button></div>';
    }
    if (!any) h += '<p class="spend-empty">가구가 없어요. 상점에서 사 보세요!</p>';
    h += '</div><button type="button" class="pill-btn warm shop-jump" data-act="shop-open" data-shop-tab="room">🛒 가구 상점 가기</button></div>';
  } else if (roomUi.panel === 'pets') {
    h += '<div class="room-panel"><div class="rp-head"><b>🐾 함께 놀 친구 · ' + fl.n + '층</b><button type="button" class="ghost-btn tiny" data-act="room-back">닫기</button></div>';
    var pickIds = [];
    /* 지금 키우는 친구는 부화한 순간(1단계)부터 바로 부를 수 있어요 */
    if (prof().pet.stage >= 1 && prof().pet.currentEgg) pickIds.push(prof().pet.currentEgg);
    /* 내 펫 목록에 있는 친구들도 부화했으면 함께 놀 수 있어요 */
    var ownPick = petOwnedList(prof());
    for (var c1 = 0; c1 < ownPick.length; c1++) {
      if (ownPick[c1].stage >= 1 && ownPick[c1].currentEgg && pickIds.indexOf(ownPick[c1].currentEgg) < 0) pickIds.push(ownPick[c1].currentEgg);
    }
    for (var c0 = 0; c0 < prof().pet.collection.length; c0++) if (pickIds.indexOf(prof().pet.collection[c0].id) < 0) pickIds.push(prof().pet.collection[c0].id);
    for (var c2 = 0; c2 < prof().room.floors.length; c2++) {
      var fp2 = prof().room.floors[c2].pets || [];
      for (var c3 = 0; c3 < fp2.length; c3++) if (pickIds.indexOf(fp2[c3]) < 0) pickIds.push(fp2[c3]);
    }
    if (!pickIds.length) {
      h += '<p class="spend-empty">아직 함께 놀 친구가 없어요. 알을 키워 부화하면 마이룸에 바로 놀러 와요!</p>';
    } else {
      h += '<div class="pet-pick-grid">';
      for (var c = 0; c < pickIds.length; c++) {
        var sp = speciesById(pickIds[c]);
        var on = fl.pets.indexOf(sp.id) >= 0;
        var stg = petStageForSpecies(prof(), sp.id);
        var elsewhere = '';
        for (var c4 = 0; c4 < prof().room.floors.length; c4++) {
          if (prof().room.floors[c4].n === fl.n) continue;
          if ((prof().room.floors[c4].pets || []).indexOf(sp.id) >= 0) elsewhere = prof().room.floors[c4].n + '층';
        }
        h += '<button type="button" class="pet-pick' + (on ? ' on' : '') + '" data-act="room-pet-toggle" data-id="' + esc(sp.id) + '">' +
          '<span class="pp-art">' + petArt(sp, stg, 0) + '</span><b>' + esc(sp.names[stg - 1]) + '</b><small>' + esc(sp.rarityLabel) + '</small>' +
          '<span class="pp-check">' + (on ? '이 층에 있음' : (elsewhere ? elsewhere + '에 있음' : '불러오기')) + '</span></button>';
      }
      h += '</div><p class="lf-note">' + (fl.size >= 3 ? '가장 넓은 방' : roomSizeInfo(fl.size).label) + '이라 친구 ' + roomPetMax(fl.size) + '명까지 함께 놀 수 있어요' +
        (fl.size < 3 ? ' (방을 넓히면 ' + roomPetMax(fl.size + 1) + '명)' : '') +
        '. 부화한 아기부터 바로 불러요!</p>';
    }
    h += '</div>';
  }
  return h;
}

function roomSelHtml() {
  if (roomUi.dsel) {
    var dIt = roomDecorDef(roomUi.dsel);
    if (dIt) {
      var dDef = shopItem(dIt.id);
      return '<div class="room-selbar">' +
        '<span class="rs-name">' + (dDef ? (dDef.icon + ' ' + esc(dDef.name)) : '벽 장식') + ' <small>벽에 걸림</small></span>' +
        '<button type="button" class="ghost-btn" data-act="room-decor-remove">🗑 치우기</button>' +
        '<button type="button" class="ghost-btn" data-act="room-deselect">✕</button>' +
        '</div>';
    }
  }
  if (!roomUi.sel) return '';
  var it = roomItemDef(roomUi.sel);
  if (!it) return '';
  var def = shopItem(it.id);
  return '<div class="room-selbar">' +
    '<span class="rs-name">' + (def ? (def.icon + ' ' + esc(def.name)) : '가구') + '</span>' +
    '<button type="button" class="pill-btn' + (roomUi.moving ? ' warm' : '') + '" data-act="room-move">' + (roomUi.moving ? '✋ 자리 고르는 중' : '↔️ 옮기기') + '</button>' +
    '<button type="button" class="ghost-btn" data-act="room-remove">🗑 치우기</button>' +
    '<button type="button" class="ghost-btn" data-act="room-deselect">✕</button>' +
    '</div>';
}

/* 위에 고정되는 부분: 층 바 + 2.5D 방 그림 */
function roomTopActsHtml() {
  return '<div class="room-top-acts" role="group" aria-label="마이룸 바로가기">' +
    '<button type="button" class="room-top-btn" data-act="avatar-open">👕 아바타</button>' +
    '<button type="button" class="room-top-btn" data-act="pethome-open">🥚 내 펫</button>' +
    '<button type="button" class="room-top-btn" data-act="shop-open">🛒 상점</button>' +
    '</div>';
}

function roomStageHtml() {
  var h = roomTopActsHtml() + roomFloorBarHtml();
  h += '<div class="room-wrap">' + roomSceneHtml() + '</div>';
  return h;
}

/* 아래에서 스크롤되는 부분: 방 조작 바 + 서랍(벽지·장식·컨셉·보관함·친구·확장) */
function roomDrawerHtml() {
  var h = roomToolsHtml();
  if (roomUi.msg) h += '<p class="shop-msg">' + esc(roomUi.msg) + '</p>';
  h += roomPanelHtml();
  h += roomSelHtml();
  h += '<ul class="room-hint-list">' +
    '<li>바닥을 누르면 아바타가 그 자리로 걸어가요.</li>' +
    '<li>층마다 컨셉·벽지·가구·벽 장식을 따로 꾸밀 수 있어요.</li>' +
    '<li>부화한 친구들은 지금 보는 층에서 함께 놀아요.</li>' +
    '</ul>';
  h += '<div class="room-foot"><button type="button" class="ghost-btn" data-act="room-close">닫기</button></div>';
  return h;
}

function renderRoom() {
  var st = document.getElementById('roomStage');
  var b = document.getElementById('roomBody');
  if (!b) return;
  var keep = roomUi.panel;
  var key = roomUi.panel + '|' + (roomUi.studio || '');
  var keepTop = (roomUi._drawerKey === key) ? b.scrollTop : 0;
  if (st) st.innerHTML = roomStageHtml();
  b.innerHTML = roomDrawerHtml();
  try { renderLevelBadges(); } catch (e0) { /* 무시 */ }
  roomUi.panel = keep;
  roomUi._drawerKey = key;
  try { b.scrollTop = keepTop; } catch (e) { /* 무시 */ }
  startRoomAnim();
}


function openRoom() {
  roomUi.panel = 'main';
  roomUi.sel = '';
  roomUi.dsel = '';
  roomUi.moving = '';
  roomUi.msg = '';
  roomAvaSync();
  renderRoom();
  var m = document.getElementById('roomModal');
  if (m) m.hidden = false;
  raiseModal('roomModal');
  lockScroll();
}
function closeRoom() {
  stopRoomAnim();
  var m = document.getElementById('roomModal');
  if (m) m.hidden = true;
  if (isOnlyModal('roomModal')) unlockScroll();
}

function startRoomAnim() {
  stopRoomAnim();
  var svg = document.getElementById('roomScene');
  if (!svg) return;
  var avaEl = svg.querySelector('.room-ava');
  var hopEl = avaEl ? avaEl.querySelector('.room-ava-hop') : null;
  var figEl = avaEl ? avaEl.querySelector('.av-fig') : null;
  var faceDir = 1;   /* 1 = 오른쪽을 보고 걸어요, -1 = 왼쪽 */
  var ringEl = svg.querySelector('.room-ava-target');
  var nodes = svg.querySelectorAll('.room-pet');
  var pets = [];
  for (var i = 0; i < nodes.length; i++) {
    /* 처음 그려 둔 자리(발밑 좌표)에서 조금씩만 둥실거리게 해요.
       방 넓이·친구 수에 맞춰 그린 자리를 그대로 쓰므로 서로 겹치지 않아요. */
    var tf0 = nodes[i].getAttribute('transform') || '';
    var mt = /translate\(([-\d.]+),([-\d.]+)\)/.exec(tf0);
    var ms = /scale\(([-\d.]+)\)/.exec(tf0);
    var bx = mt ? Number(mt[1]) : 0;
    var by = mt ? Number(mt[2]) : 0;
    pets.push({
      el: nodes[i],
      bx: bx,
      by: by,
      sc: ms ? ms[1] : '1',
      rx: 9 + (i % 2) * 4,
      ry: 5 + (i % 3) * 2,
      sp: 0.5 + i * 0.13,
      ph: i * 1.7
    });
  }
  var t0 = Date.now(), tPrev = t0;
  roomAnim.timer = window.setInterval(function () {
    var now = Date.now();
    var t = (now - t0) / 1000;
    var dt = Math.min(0.3, (now - tPrev) / 1000);
    tPrev = now;
    for (var k = 0; k < pets.length; k++) {
      var o = pets[k];
      var px = o.bx + Math.sin(t * o.sp + o.ph) * o.rx;
      var py = o.by + Math.cos(t * o.sp * 0.8 + o.ph) * o.ry;
      var hop = Math.abs(Math.sin(t * 3.4 + o.ph)) * 5;
      if (o.el && o.el.setAttribute) o.el.setAttribute('transform', 'translate(' + px.toFixed(1) + ',' + (py - hop).toFixed(1) + ') scale(' + o.sc + ')');
    }
    /* 아바타 걷기: 목표 자리로 통통 걸어가고, 도착하면 잠깐 쉬었다가 근처를 산책해요 */
    if (avaEl) {
      var dx = roomAva.tx - roomAva.x, dy = roomAva.ty - roomAva.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0.015) {
        var step = Math.min(dist, AV_WALK_SPEED * dt);
        roomAva.x += dx / dist * step;
        roomAva.y += dy / dist * step;
        roomAva.walkPh += dt * 8.5;
        roomAva.moving = true;
        /* 걷는 방향으로 몸을 돌려요 — 오른쪽으로 가면 그대로, 왼쪽으로 가면 좌우 반전 */
        if (dx !== 0) faceDir = dx > 0 ? 1 : -1;
        if (figEl && figEl.setAttribute) {
          if (figEl.getAttribute('data-walk') !== '1') {
            figEl.setAttribute('data-walk', '1');
            try { figEl.classList.add('walking'); } catch (e0) { /* 무시 */ }
          }
          var flip = faceDir < 0 ? 'translate(120,0) scale(-1,1)' : 'translate(0,0)';
          if (figEl.getAttribute('transform') !== flip) figEl.setAttribute('transform', flip);
        }
      } else if (roomAva.moving) {
        roomAva.x = roomAva.tx;
        roomAva.y = roomAva.ty;
        roomAva.moving = false;
        roomAva.walkPh = 0;
        roomAva.showTarget = false;
        /* 산책한 자리는 메모리에만 남겨 두고, 다음 저장 때 함께 저장돼요 */
        curFloor().avatarPos = { x: Math.round(roomAva.x * 100) / 100, y: Math.round(roomAva.y * 100) / 100 };
        roomMirror();
        /* 도착하면 걷기를 멈추고 차분한 대기 모션으로 돌아가요 */
        if (figEl && figEl.getAttribute('data-walk') === '1') {
          try { figEl.classList.remove('walking'); } catch (e1) { /* 무시 */ }
          figEl.setAttribute('data-walk', '0');
          figEl.setAttribute('transform', 'translate(0,0)');
        }
        if (hopEl) hopEl.setAttribute('transform', 'translate(0,0)');
        if (ringEl) ringEl.setAttribute('visibility', 'hidden');
        /* 걷는 사이 방을 다시 그렸다면 목표 표시도 새것으로 찾아 숨겨요 (안 그러면 링이 남아요) */
        var ringNow = document.querySelector('#roomScene .room-ava-target');
        if (ringNow && ringNow.setAttribute) ringNow.setAttribute('visibility', 'hidden');
        roomAva.idle = 3 + Math.random() * 3;
      } else {
        roomAva.idle -= dt;
        if (roomAva.idle <= 0 && !pickWanderTarget()) roomAva.idle = 4;
      }
      var ap2 = iP(roomAva.x, roomAva.y);
      avaEl.setAttribute('transform', 'translate(' + ap2[0].toFixed(1) + ',' + ap2[1].toFixed(1) + ')');
    }
  }, 90);
}
function stopRoomAnim() {
  if (roomAnim.timer) { window.clearInterval(roomAnim.timer); roomAnim.timer = 0; }
}

function cellFromEvent(svg, e) {
  if (!svg || !svg.getScreenCTM) return null;
  try {
    var pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    var p = pt.matrixTransform(svg.getScreenCTM().inverse());
    var u = (p.x - ROOM.OX) / ROOM.HW;
    var v = (p.y - ROOM.OY) / ROOM.HH;
    return { x: (u + v) / 2, y: (v - u) / 2 };
  } catch (err) { return null; }
}

function moveRoomItem(u, cx, cy) {
  var it = roomItemDef(u);
  if (!it) return;
  var sz = roomDefSize(it.id);
  var nx = Math.round(cx - sz.w / 2);
  var ny = Math.round(cy - sz.d / 2);
  nx = Math.max(0, Math.min(ROOM.N - sz.w, nx));
  ny = Math.max(0, Math.min(ROOM.N - sz.d, ny));
  var spots = [[nx, ny], [nx + 1, ny], [nx - 1, ny], [nx, ny + 1], [nx, ny - 1], [nx + 1, ny + 1], [nx - 1, ny - 1], [nx + 1, ny - 1], [nx - 1, ny + 1]];
  for (var i = 0; i < spots.length; i++) {
    var x = spots[i][0], y = spots[i][1];
    if (x < 0 || y < 0 || x + sz.w > ROOM.N || y + sz.d > ROOM.N) continue;
    if (roomOverlap(x, y, sz.w, sz.d, u)) continue;
    it.x = x; it.y = y;
    roomUi.moving = '';
    roomUi.msg = '';
    saveState();
    renderRoom();
    snd('check');
    return;
  }
  roomUi.moving = '';
  roomUi.msg = '그 자리에는 다른 가구가 있어요. 다른 곳을 눌러 주세요.';
  renderRoom();
}

/* 가구 끌어서 옮기기 / 눌러서 고르기 */
var roomDrag = { u: '', x: 0, y: 0, moved: false, inScene: false };
function installRoomDrag() {
  document.addEventListener('pointerdown', function (e) {
    var m = document.getElementById('roomModal');
    if (!m || m.hidden) return;
    var svg = document.getElementById('roomScene');
    var el = (e.target && e.target.closest) ? e.target.closest('[data-room-drag]') : null;
    roomDrag = {
      u: el ? el.getAttribute('data-room-drag') : '',
      x: e.clientX, y: e.clientY, moved: false,
      inScene: !!(svg && e.target && svg.contains(e.target))
    };
  }, { passive: true });
  document.addEventListener('pointermove', function (e) {
    if (!roomDrag.u) return;
    if (Math.abs(e.clientX - roomDrag.x) + Math.abs(e.clientY - roomDrag.y) > 12) roomDrag.moved = true;
  }, { passive: true });
  document.addEventListener('pointerup', function (e) {
    var m = document.getElementById('roomModal');
    if (!m || m.hidden) { roomDrag = { u: '', x: 0, y: 0, moved: false, inScene: false }; return; }
    var svg = document.getElementById('roomScene');
    var grab = roomDrag;
    roomDrag = { u: '', x: 0, y: 0, moved: false, inScene: false };
    if (roomUi.moving) {
      var mv = cellFromEvent(svg, e);
      if (mv) moveRoomItem(roomUi.moving, mv.x, mv.y);
      return;
    }
    if (grab.u) {
      if (!grab.moved) return;
      var cell = cellFromEvent(svg, e);
      if (cell) moveRoomItem(grab.u, cell.x, cell.y);
      return;
    }
    /* 빈 바닥을 톡 누르면 아바타가 그 자리로 걸어가요 */
    if (!grab.inScene || !svg) return;
    if (Math.abs(e.clientX - grab.x) + Math.abs(e.clientY - grab.y) > 18) return;
    var tEl = (e.target && e.target.closest) ? e.target.closest('[data-act]') : null;
    var tAct = tEl ? (tEl.getAttribute('data-act') || '') : '';
    if (tAct && tAct !== 'room-floor-tap') return;
    var at = cellFromEvent(svg, e);
    if (at) roomAvaWalk(at.x, at.y);
  });
}

function roomAddFromStorage(id) {
  var def = shopItem(id);
  if (!def || def.kind !== 'furni') return;
  var fl = curFloor();
  var sz = { w: def.w || 1, d: def.d || 1 };
  for (var y = 0; y <= ROOM.N - sz.d; y++) {
    for (var x = 0; x <= ROOM.N - sz.w; x++) {
      if (roomOverlap(x, y, sz.w, sz.d, '')) continue;
      fl.items.push({ u: uid('rm'), id: id, x: x, y: y });
      roomUi.sel = '';
      roomUi.moving = '';
      roomUi.msg = josa(def.name, '을', '를') + ' ' + fl.n + '층에 놓았어요!';
      saveState();
      renderRoom();
      snd('check');
      return;
    }
  }
  roomUi.msg = '방이 꽉 찼어요. 가구를 치우거나 방을 넓혀 보세요.';
  renderRoom();
}

function roomRemoveSel() {
  var u = roomUi.sel;
  var fl = curFloor();
  for (var i = 0; i < fl.items.length; i++) {
    if (fl.items[i].u === u) {
      var def = shopItem(fl.items[i].id);
      fl.items.splice(i, 1);
      roomUi.sel = '';
      roomUi.moving = '';
      roomUi.msg = josa(def ? def.name : '가구', '을', '를') + ' 보관함에 넣었어요.';
      saveState();
      renderRoom();
      return;
    }
  }
}

function setRoomWall(id) {
  var it = shopItem(id);
  if (!it || it.kind !== 'wall') return;
  if (it.price > 0 && !prof().owned[id]) {
    buyItem(id);
    if (!prof().owned[id]) return;
  }
  prof().owned[id] = 1;
  var fl = curFloor();
  fl.wall = id;
  roomMirror();
  saveState();
  snd('check');
  showToast('🎨 ' + it.name + '으로 ' + fl.n + '층 벽을 바꿨어요!');
  renderRoom();
}

/* 방 컨셉 바꾸기 (한 번 산 컨셉은 어느 층에나) */
function setRoomTheme(id) {
  var th = THEMES[id];
  var it = shopItem(id);
  if (!th || !it || it.hidden) return;
  if (it.price > 0 && !prof().owned[id]) {
    buyItem(id);
    if (!prof().owned[id]) return;
  }
  prof().owned[id] = 1;
  var fl = curFloor();
  fl.theme = id;
  roomMirror();
  saveState();
  snd('check');
  showToast(th.icon + ' ' + fl.n + '층을 ' + th.name + '(으)로 꾸몄어요!');
  renderRoom();
}

/* 벽 장식 걸기 — 빈 자리를 찾아 걸어요 */
function roomPlaceDecor(id, quiet) {
  var def = shopItem(id);
  if (!def || def.kind !== 'decor') return false;
  var fl = curFloor();
  if (Object.prototype.toString.call(fl.wallItems) !== '[object Array]') fl.wallItems = [];
  var maxSlot = wallSlotCount(fl.size);
  var sides = ['R', 'L'];
  for (var s = 0; s < 2; s++) {
    for (var k = 0; k < maxSlot; k++) {
      var taken = false;
      for (var i = 0; i < fl.wallItems.length; i++) {
        if (fl.wallItems[i].side === sides[s] && parseInt(fl.wallItems[i].slot, 10) === k) taken = true;
      }
      if (taken) continue;
      fl.wallItems.push({ u: uid('wd'), id: id, side: sides[s], slot: k });
      roomUi.dsel = '';
      if (!quiet) {
        roomUi.msg = (def.icon || '🖼') + ' ' + josa(def.name, '을', '를') + ' 벽에 걸었어요!';
        snd('check');
        saveState();
        renderRoom();
      } else {
        saveState();
      }
      return true;
    }
  }
  if (!quiet) {
    roomUi.msg = '벽이 가득 찼어요. 방을 넓히면 걸 자리가 늘어나요!';
    renderRoom();
  }
  return false;
}

function roomDecorRemoveSel() {
  var u = roomUi.dsel;
  var fl = curFloor();
  for (var i = 0; i < fl.wallItems.length; i++) {
    if (fl.wallItems[i].u === u) {
      var def = shopItem(fl.wallItems[i].id);
      fl.wallItems.splice(i, 1);
      roomUi.dsel = '';
      roomUi.msg = josa(def ? def.name : '벽 장식', '을', '를') + ' 벽에서 치웠어요.';
      saveState();
      renderRoom();
      return;
    }
  }
}

/* 벽 장식 초기화 — 지금 층에 걸린 벽 장식을 모두 치워요 */
function roomDecorResetAll() {
  var fl = curFloor();
  var n = (fl.wallItems || []).length;
  if (!n) return;
  fl.wallItems = [];
  roomUi.dsel = '';
  roomUi.msg = '벽 장식 ' + n + '개를 모두 치웠어요.';
  saveState();
  renderRoom();
}

/* 새 층 올리기 (층 수 제한 없음) */
function roomAddFloor() {
  var room = prof().room;
  var nextN = room.floors.length + 1;
  if (room.floors.length >= ROOM_MAX_FLOORS) { showToast('층은 ' + ROOM_MAX_FLOORS + '개까지 올릴 수 있어요.'); return; }
  var cost = floorCost(nextN);
  if (prof().coins < cost) {
    snd('uncheck');
    showToast(coinSvg() + ' 코인이 ' + fmtNum(cost - prof().coins) + '개 모자라요. 루틴을 체크해서 모아 보세요!', true);
    return;
  }
  prof().coins -= cost;
  var f = defaultFloorRoom(nextN);
  room.floors.push(f);
  room.active = nextN;
  roomMirror();
  roomUi.panel = 'main';
  roomUi.msg = '🏰 ' + nextN + '층을 올렸어요! 새 층을 꾸며 보세요.';
  saveState();
  renderCoinBadge(-cost);
  snd('win');
  showToast('🏰 ' + nextN + '층이 생겼어요!');
  roomAvaSync();
  renderRoom();
}

function roomGoFloor(n) {
  var room = prof().room;
  /* 층 번호가 없으면 아무것도 하지 않아요 (예전엔 1층으로 내려갔어요) */
  var want = parseInt(n, 10);
  if (!want || isNaN(want)) return;
  var found = false;
  for (var i = 0; i < room.floors.length; i++) if (room.floors[i].n === want) found = true;
  if (!found) return;
  room.active = want;
  roomUi.sel = '';
  roomUi.dsel = '';
  roomUi.moving = '';
  roomUi.msg = '';
  roomMirror();
  roomAvaSync();
  saveState();
  renderRoom();
}

/* 방 넓히기 (1→2→3단계, 3단계가 최대) */
function roomSizeUp() {
  var fl = curFloor();
  var next = fl.size + 1;
  if (next > 3) { showToast('방은 3단계가 최대예요.'); return; }
  var info = roomSizeInfo(next);
  if (prof().coins < info.cost) {
    snd('uncheck');
    showToast(coinSvg() + ' 코인이 ' + fmtNum(info.cost - prof().coins) + '개 모자라요!', true);
    return;
  }
  prof().coins -= info.cost;
  fl.size = next;
  /* 넓어진 바닥 가운데로 아바타를 옮겨요 */
  fl.avatarPos = { x: Math.min(info.N - 1.5, fl.avatarPos.x + 1), y: Math.min(info.N - 1.5, fl.avatarPos.y + 1) };
  roomMirror();
  saveState();
  renderCoinBadge(-info.cost);
  snd('win');
  showToast('📐 ' + fl.n + '층을 ' + info.label + '(으)로 넓혔어요!');
  roomAvaSync();
  renderRoom();
}

function toggleRoomPet(id) {
  var fl = curFloor();
  if (Object.prototype.toString.call(fl.pets) !== '[object Array]') fl.pets = [];
  var at = fl.pets.indexOf(id);
  if (at >= 0) fl.pets.splice(at, 1);
  else {
    if (fl.pets.length >= roomPetMax(fl.size)) { showToast('이 방은 친구 ' + roomPetMax(fl.size) + '명까지예요. 방을 넓히면 더 불러요!'); return; }
    var have = (prof().pet.stage >= 1 && prof().pet.currentEgg === id);
    for (var i = 0; i < prof().pet.collection.length; i++) if (prof().pet.collection[i].id === id) have = true;
    if (!have) {
      var ownNow = petOwnedList(prof());
      for (var i2 = 0; i2 < ownNow.length; i2++) if (ownNow[i2].stage >= 1 && ownNow[i2].currentEgg === id) have = true;
    }
    if (!have) { showToast('아직 알 속에 있는 친구예요.'); return; }
    /* 친구는 한 층에서만 놀아요 — 다른 층에 있으면 이 층으로 옮겨 와요 */
    for (var j = 0; j < prof().room.floors.length; j++) {
      var other = prof().room.floors[j];
      if (other.n === fl.n || Object.prototype.toString.call(other.pets) !== '[object Array]') continue;
      var oi = other.pets.indexOf(id);
      if (oi >= 0) other.pets.splice(oi, 1);
    }
    fl.pets.push(id);
    snd('sticker');
  }
  roomMirror();
  saveState();
  renderRoom();
}
