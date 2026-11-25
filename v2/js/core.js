/* ============================================================================
   Jaden's Today v2 — js/core.js
   공통 상태 · 상수(코인·경험치·희귀도) · 계정 프로필 접근 · 저장 정규화 · 유틸 · 모달 · 헤더 · 스플래시 · 날짜 도구
   · 원본 index.html(운영본)의 같은 코드를 기능별로 나눈 파일입니다. 동작은 원본과 같아요.
   · 모듈끼리 같은 전역 스코프를 써요. index.html 에서 core → sync → ... 순서로 불러옵니다.
   ============================================================================ */
'use strict';

/* ============ 기본값 / 상수 ============ */
var STORE_KEY = 'kidsDashboard.v1';
var WEATHER_KEY = 'kidsDashboard.weather.v1';
var HIST_DAYS = 365;

/* 계정 / 클라우드 저장 상수 */
var API_BASE = 'https://api.github.com';
var DEFAULT_OWNER = 'jadenfamily';
var DEFAULT_REPO = 'kids-dashboard-data';
var DEVICE_KEY = 'kidsDashboard.device.v1';
var USERS_CACHE_KEY = 'kidsDashboard.users.v1';
var SHA_KEY = 'kidsDashboard.sha.v1';
var LAST_ID_KEY = 'kidsDashboard.lastId';
var LAST_REMEMBER_KEY = 'kidsDashboard.remember';
var SESSION_KEY = 'kidsDashboard.session.v1';
var HUB_LAST_KEY = 'kidsDashboard.hub.last';
var SESSION_MS = 30 * 24 * 60 * 60 * 1000; /* 로그인 유지 30일 */
var SEC_IDS = ['routine', 'sticker', 'academy', 'week'];
var SEC_NAMES = { routine: '하루 루틴', sticker: '칭찬 스티커', academy: '오늘의 학원', week: '학원 시간표' };
var SEC_EL = { routine: 'secRoutine', sticker: 'secSticker', academy: 'secAcademy', week: 'secWeek' };
var SEC_TITLE_EL = { routine: 'secTitleRoutine', sticker: 'secTitleSticker', academy: 'secTitleAcademy', week: 'secTitleWeek' };

/* ============ DIY 섹션 · 블록 조립 ============
   편집(✏️)에서 섹션(카드)을 만들고, 그 안에 기능 블록을 넣고 빼고 순서를 바꿔요.
   기본 4개 섹션(routine/sticker/academy/week)은 그대로 이어받고,
   예전 설정(sectionTitles·layoutOrder)만 있는 기기는 자동으로 새 모양으로 옮겨요. */
var SEC_DEFAULT_WIDTH = { routine: 'full', sticker: 'half', academy: 'half', week: 'full' };
var SEC_DEFAULT_EMOJI = { routine: '✅', sticker: '⭐', academy: '🎒', week: '🗓️' };
var SEC_CLASS = { routine: 'routine sec-routine', sticker: 'sticker', academy: 'today-academy', week: 'week sec-week' };
var SEC_PRIMARY_BLOCK = { routine: 'routine', sticker: 'sticker_board', academy: 'today_schedule', week: 'weekly_schedule' };
var SEC_ICON_CHOICES = ['✅', '⭐', '🎒', '🗓️', '🎯', '💬', '🌈', '🌙', '🧩', '🏡', '📚', '🍀', '🎨', '📌'];
var BLOCK_ORDER = ['routine', 'target_bar', 'notice_board', 'today_schedule', 'sticker_board', 'weekly_schedule', 'special_missions', 'role_checklist'];
var BLOCK_LABEL = {
  routine: '하루 루틴', target_bar: '목표시간 남은 시간 바', notice_board: '오늘의 한마디 / 게시판',
  today_schedule: '오늘의 일정', sticker_board: '칭찬 스티커', weekly_schedule: '주간 일과표',
  special_missions: '특별 미션', role_checklist: '역할 체크리스트'
};
var BLOCK_ICON = {
  routine: '✅', target_bar: '🎯', notice_board: '💬', today_schedule: '🎒', sticker_board: '⭐', weekly_schedule: '🗓️',
  special_missions: '🎯', role_checklist: '⚡'
};
/* 🎯 특별 미션 · ⚡ 역할 체크리스트 한도와 빠른 이모지 */
var MSN_MAX = 12, MSN_DAYS_MAX = 60, MSN_CELLS_MAX = 62, MSN_REWARD_MAX = 20;
var RCL_MAX = 12, RCL_ITEM_MAX = 12;
/* 이모지 고르기 목록 — 윈도우 10 PC 에서도 ☒로 깨지지 않는 이모지만 골랐어요
   (🪴·🧽 같은 Unicode 13 이후 이모지는 윈도우 10에서 네모로 보여요) */
var MSN_EMOJI = ['🥛', '🦷', '📚', '🏃', '🧹', '🍎', '🎹', '🛏️', '🧴', '🐶'];
var RCL_EMOJI = ['⚡', '🌱', '🐶', '🍽️', '🧺', '🚪', '🧸', '💧', '🧼', '🗑️'];
/* 예전에 저장된 깨지는 이모지는 안전한 이모지로 바꿔요 */
var EMOJI_FIX = { '🪴': '🌱', '🧽': '🧼' };
function fixEmoji(v) {
  var s = String(v == null ? '' : v);
  return EMOJI_FIX[s] || s;
}
var BLOCK_MAX_PER_SEC = 8;
var SEC_MAX = 10;
var SEC_H_MIN = 140;      /* 카드 높이 드래그 최소 px */
var SEC_H_MAX = 1200;     /* 카드 높이 드래그 최대 px */
var SEC_W_MIN = 160;      /* 카드 가로폭 최소 px — 이보다 좁으면 글자가 설 자리가 없어요 */

var ROLES = {
  admin: { label: '관리자', perms: { check: 1, sticker: 1, stickerManage: 1, edit: 1, reset: 1, history: 1, accounts: 1 } },
  parent: { label: '보호자', perms: { check: 1, sticker: 1, stickerManage: 1, edit: 1, reset: 1, history: 1 } },
  /* 아이 계정은 스티커를 보기만 해요 — 붙이기·쓰기·떼기는 보호자·관리자만 */
  child: { label: '아이', perms: { check: 1, history: 1 } },
  viewer: { label: '보기 전용', perms: { history: 1 } }
};

var cloud = {
  conn: null, users: null, me: null, session: null,
  status: 'idle', statusAt: 0,
  sha: {}, months: {}, monthLoading: '',
  dirty: { day: false, settings: false, stickers: false, profile: false },
  lastProfileSig: '',
  profileReady: false,   /* 지금 로그인한 계정의 프로필을 다 불러왔는지 */
  timer: 0, saving: false, again: false, lastSig: ''
};
var acct = { pwFor: '', msg: '', busy: false, link: '', tab: 'list' };

function isAdmin() {
  return !!(cloud && cloud.me && cloud.me.role === 'admin');
}

function can(perm) {
  if (!cloud || !cloud.me) return false;
  var r = ROLES[cloud.me.role];
  return !!(r && r.perms && r.perms[perm]);
}
var DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
var DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];
var GREETING_DEFAULT = '오늘도 화이팅! 🌟';

var CITIES = [
  { id: 'seoul', name: '서울', lat: 37.5665, lon: 126.9780 },
  { id: 'busan', name: '부산', lat: 35.1796, lon: 129.0756 },
  { id: 'daegu', name: '대구', lat: 35.8714, lon: 128.6014 },
  { id: 'incheon', name: '인천', lat: 37.4563, lon: 126.7052 },
  { id: 'gwangju', name: '광주', lat: 35.1595, lon: 126.8526 },
  { id: 'daejeon', name: '대전', lat: 36.3504, lon: 127.3845 },
  { id: 'ulsan', name: '울산', lat: 35.5384, lon: 129.3114 },
  { id: 'suwon', name: '수원', lat: 37.2636, lon: 127.0286 },
  { id: 'sejong', name: '세종', lat: 36.4800, lon: 127.2890 },
  { id: 'chuncheon', name: '춘천', lat: 37.8813, lon: 127.7300 },
  { id: 'cheongju', name: '청주', lat: 36.6424, lon: 127.4890 },
  { id: 'jeonju', name: '전주', lat: 35.8242, lon: 127.1480 },
  { id: 'changwon', name: '창원', lat: 35.2281, lon: 128.6811 },
  { id: 'jeju', name: '제주', lat: 33.4996, lon: 126.5312 }
];

var STICKER_SET = ['⭐️', '🌟', '🌈', '🦄', '🐰', '🍓', '🎈', '🌸', '🐥', '💎', '🍀', '🚀', '🍭', '🐼', '🎁', '🌻'];
/* 칭찬 스티커 모양 — 윈도우 10(세고에 UI 이모지)·안드로이드 7 태블릿에서도 깨지지 않는 이모지로만 골랐어요.
   여기에 없는 모양은 '직접 추가'로 아이가 원하는 이모지를 넣어 쓸 수 있어요. */
var STICKER_SHAPES = [
  { id: 'star', e: '⭐', name: '별' },
  { id: 'heart', e: '❤️', name: '하트' },
  { id: 'hamster', e: '🐹', name: '햄찌' },
  { id: 'crown', e: '👑', name: '왕관' },
  { id: 'rainbow', e: '🌈', name: '무지개' },
  { id: 'dino', e: '🦖', name: '공룡' },
  { id: 'rocket', e: '🚀', name: '로켓' },
  { id: 'strawberry', e: '🍓', name: '딸기' },
  { id: 'cat', e: '🐱', name: '고양이' },
  { id: 'flower', e: '🌸', name: '꽃' },
  { id: 'sparkle', e: '🌟', name: '반짝별' },
  { id: 'clover', e: '🍀', name: '네잎클로버' }
];
var STICKER_SHAPE_MAX = 24;      /* 직접 만든 모양은 24개까지 */
var CONF = ['⭐️', '🎉', '✨', '🌟', '🎈', '💛', '💙', '💖', '🍬', '🌈'];

/* ============ 오늘의 친구 (몬스터 키우기) 기본값 ============ */
var PET_NEED = [5, 10, 15];   /* 0→1 부화, 1→2 1차 진화, 2→3 2차 진화 (단계마다 필요한 기운) */
var PET_STAGE_LABEL = ['🥚 알', '🐣 아기', '✨ 1차 진화', '🌟 2차 진화'];
var PET_STAGE_SHORT = ['알', '아기', '1차', '2차'];
/* 18가지 속성 — 각자 다른 색과 머리 장식으로 그린 우리만의 몬스터 라인 */
var PET_TYPES = [
  { id: 'normal', label: '노멀', color: '#9aa0a6' },
  { id: 'fire', label: '불', color: '#ff7a3d' },
  { id: 'water', label: '물', color: '#3fa4ea' },
  { id: 'grass', label: '풀', color: '#2fbf7a' },
  { id: 'electric', label: '전기', color: '#e0ac00' },
  { id: 'ice', label: '얼음', color: '#41c3dd' },
  { id: 'fighting', label: '격투', color: '#cf5640' },
  { id: 'poison', label: '독', color: '#9a5bc4' },
  { id: 'ground', label: '땅', color: '#bf9a55' },
  { id: 'flying', label: '비행', color: '#749ee8' },
  { id: 'psychic', label: '에스퍼', color: '#e8639f' },
  { id: 'bug', label: '벌레', color: '#7cb342' },
  { id: 'rock', label: '바위', color: '#a89a83' },
  { id: 'ghost', label: '고스트', color: '#6f5aa8' },
  { id: 'dragon', label: '드래곤', color: '#4b5ae0' },
  { id: 'dark', label: '악', color: '#5a5364' },
  { id: 'steel', label: '강철', color: '#8fa3ad' },
  { id: 'fairy', label: '페어리', color: '#f078a8' }
];
var PET_NAMES = {
  normal: ['몽글', '몽글이', '몽글룡'],
  fire: ['콩이', '불콩', '화르르'],
  water: ['방울', '물방울', '파도링'],
  grass: ['새싹', '잎새', '나무룡'],
  electric: ['찌릿', '번쩍', '뇌룡'],
  ice: ['고드름', '얼음이', '빙룡'],
  fighting: ['주먹이', '힘센손', '투혼룡'],
  poison: ['방긋', '독방울', '맹독룡'],
  ground: ['흙돌이', '모래언덕', '대지룡'],
  flying: ['솜깃', '날개콩', '천공룡'],
  psychic: ['반짝', '눈빛이', '초능룡'],
  bug: ['꼬물', '꼬물이', '갑옷룡'],
  rock: ['돌멩', '바위콩', '암석룡'],
  ghost: ['깜깜', '그림자', '유령룡'],
  dragon: ['꼬리', '비늘콩', '용왕룡'],
  dark: ['심술', '까칠이', '암흑룡'],
  steel: ['나사', '철컥이', '강철룡'],
  fairy: ['별사탕', '요정이', '페어룡']
};

function shadeColor(hex, t) {
  var h = String(hex || '#9aa0a6').replace('#', '');
  var r = parseInt(h.substr(0, 2), 16);
  var g = parseInt(h.substr(2, 2), 16);
  var b = parseInt(h.substr(4, 2), 16);
  var mix = t >= 0 ? 255 : 0;
  var k = Math.abs(t);
  r = Math.round(r + (mix - r) * k);
  g = Math.round(g + (mix - g) * k);
  b = Math.round(b + (mix - b) * k);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

var PET_SPECIES = (function () {
  var out = [];
  for (var i = 0; i < PET_TYPES.length; i++) {
    var t = PET_TYPES[i];
    out.push({
      id: t.id, type: t.id, typeLabel: t.label, kind: t.label,
      c: t.color, d: shadeColor(t.color, -0.3), l: shadeColor(t.color, 0.78), accent: shadeColor(t.color, 0.3),
      names: PET_NAMES[t.id] || ['몽글', '몽글이', '몽글룡'],
      desc: t.label + ' 친구'
    });
  }
  return out;
})();

function petTypeInfo(id) {
  for (var i = 0; i < PET_TYPES.length; i++) if (PET_TYPES[i].id === id) return PET_TYPES[i];
  return PET_TYPES[0];
}

function defaultPet() {
  return { currentEgg: PET_SPECIES[0].id, stage: 0, exp: 0, hatchedAt: 0, collection: [], awarded: {} };
}
var EV_COLORS = ['#ff8a3d', '#7c5cfc', '#ff5c8a', '#3d9be9', '#12b886', '#f6a600', '#8e6bff', '#ff6b6b'];

/* ============ 작은 도구들 ============ */
function pad2(n) { return (n < 10 ? '0' : '') + n; }
function clone(o) { return JSON.parse(JSON.stringify(o)); }

/* 모달을 열면 뒤 배경이 따라 스크롤되지 않게 잠급니다 (iOS Safari는 position:fixed 방식) */
var scrollLock = { on: false, y: 0, pad: 0 };
function lockScroll() {
  if (scrollLock.on) return;
  scrollLock.y = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
  var b = document.body;
  b.style.position = 'fixed';
  b.style.top = (-scrollLock.y) + 'px';
  b.style.left = '0';
  b.style.right = '0';
  b.style.width = '100%';
  b.style.overflow = 'hidden';
  var sbw = Math.max(0, (window.innerWidth || 0) - (document.documentElement.clientWidth || 0));
  scrollLock.pad = sbw;
  if (sbw) b.style.paddingRight = sbw + 'px';
  scrollLock.on = true;
}
function unlockScroll() {
  if (!scrollLock.on) {
    document.body.style.overflow = '';
    return;
  }
  var b = document.body;
  var y = scrollLock.y;
  scrollLock.on = false;
  b.style.position = '';
  b.style.top = '';
  b.style.left = '';
  b.style.right = '';
  b.style.width = '';
  b.style.overflow = '';
  b.style.paddingRight = '';
  try { window.scrollTo(0, y); } catch (e) { /* 무시 */ }
  scrollLock.y = 0;
}
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    if (c === '&') return '&amp;';
    if (c === '<') return '&lt;';
    if (c === '>') return '&gt;';
    if (c === '"') return '&quot;';
    return '&#39;';
  });
}
function uid(p) {
  return p + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
function dateKey(d) {
  d = d || new Date();
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}

/* ============ 요일 지정 (0=일 … 6=토) ============
   'YYYY-MM-DD'는 그 기기 시간대의 달력 날짜로 읽어요. UTC로 바꾸면 하루 밀릴 수 있어요. */
var WEEK_KO = ['일', '월', '화', '수', '목', '금', '토'];
var DAY_ALL = [0, 1, 2, 3, 4, 5, 6];
var DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];   /* 화면에는 월요일부터 보여 줘요 */

function keyDayIndex(key) {
  var p = String(key || '').split('-');
  var y = parseInt(p[0], 10), m = parseInt(p[1], 10), d = parseInt(p[2], 10);
  if (!y || !m || !d) return new Date().getDay();
  var dt = new Date(y, m - 1, d);
  if (isNaN(dt.getTime())) return new Date().getDay();
  return dt.getDay();
}

/* days가 없는 예전 그룹은 매일(7일)로 대한다 */
function normDays(days) {
  if (Object.prototype.toString.call(days) !== '[object Array]') return DAY_ALL.slice(0);
  var out = [];
  for (var i = 0; i < DAY_ORDER.length; i++) {
    for (var j = 0; j < days.length; j++) {
      if (Number(days[j]) === DAY_ORDER[i]) { out.push(DAY_ORDER[i]); break; }
    }
  }
  return out.length ? out : DAY_ALL.slice(0);
}
function activeDay(obj, dow) {
  return normDays(obj && obj.days).indexOf(dow) >= 0;
}
function daysPresetKey(days) {
  var j = normDays(days).slice(0).sort(function (a, b) { return a - b; }).join(',');
  if (j === '0,1,2,3,4,5,6') return 'all';
  if (j === '1,2,3,4,5') return 'weekday';
  if (j === '0,6') return 'weekend';
  return '';
}
function presetDays(p) {
  if (p === 'weekday') return [1, 2, 3, 4, 5];
  if (p === 'weekend') return [0, 6];
  return DAY_ALL.slice(0);
}
/* '매일' · '평일' · '주말' · '월~금' · '월·수·금' 처럼 짧게 나타내요 */
function daysText(days) {
  var ds = normDays(days);
  if (ds.length === 7) return '매일';
  if (daysPresetKey(ds) === 'weekday') return '평일';
  if (daysPresetKey(ds) === 'weekend') return '주말';
  var marks = [];
  for (var i = 0; i < DAY_ORDER.length; i++) marks.push(ds.indexOf(DAY_ORDER[i]) >= 0 ? 1 : 0);
  var parts = [];
  var k = 0;
  while (k < DAY_ORDER.length) {
    if (!marks[k]) { k++; continue; }
    var e = k;
    while (e + 1 < DAY_ORDER.length && marks[e + 1]) e++;
    if (e - k + 1 >= 3) parts.push(WEEK_KO[DAY_ORDER[k]] + '~' + WEEK_KO[DAY_ORDER[e]]);
    else for (var q = k; q <= e; q++) parts.push(WEEK_KO[DAY_ORDER[q]]);
    k = e + 1;
  }
  return parts.join('·');
}
/* 요일 7개 버튼 + 매일/평일/주말 빠른 선택 */
function daysSelectorHtml(catId, days) {
  var ds = normDays(days);
  var pre = daysPresetKey(ds);
  var base = ' data-cat="' + esc(catId) + '"';
  var h = '<div class="dp-days" role="group" aria-label="요일 선택">';
  h += '<div class="dp-top">';
  var presets = [['all', '매일'], ['weekday', '평일'], ['weekend', '주말']];
  for (var i = 0; i < presets.length; i++) {
    h += '<button type="button" class="dp-pre' + (pre === presets[i][0] ? ' on' : '') + '" data-act="cat-day-preset"' +
      base + ' data-p="' + presets[i][0] + '" aria-pressed="' + (pre === presets[i][0] ? 'true' : 'false') + '">' +
      presets[i][1] + '</button>';
  }
  h += '<span class="dp-badge" aria-hidden="true">' + esc(daysText(ds)) + '</span>';
  h += '</div><div class="dp-pills">';
  for (var d = 0; d < DAY_ORDER.length; d++) {
    var w = DAY_ORDER[d];
    var on = ds.indexOf(w) >= 0;
    h += '<button type="button" class="dp-pill' + (on ? ' on' : '') + '" data-act="cat-day"' + base +
      ' data-d="' + w + '" aria-pressed="' + (on ? 'true' : 'false') + '" aria-label="' + WEEK_KO[w] + '요일' + (on ? ' (켜짐)' : '') + '">' +
      WEEK_KO[w] + '</button>';
  }
  h += '</div></div>';
  return h;
}
function fmtDate(d) {
  return (d.getMonth() + 1) + '월 ' + d.getDate() + '일 ' + DAY_NAMES[d.getDay()] + '요일';
}
function fmtClock(d) {
  var h = d.getHours();
  var ap = h < 12 ? '오전' : '오후';
  var h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return ap + ' ' + h12 + ':' + pad2(d.getMinutes());
}
function fmtShort(ts) {
  var d = new Date(ts);
  return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
}
function r1(v) {
  if (v == null || isNaN(v)) return null;
  return Math.round(v);
}
function vocative(name) {
  name = String(name || '').trim();
  if (!name) return '';
  var code = name.charCodeAt(name.length - 1);
  if (code < 0xAC00 || code > 0xD7A3) return name + '야';
  var hasJong = ((code - 0xAC00) % 28) !== 0;
  return name + (hasJong ? '아' : '야');
}
function cityById(id) {
  for (var i = 0; i < CITIES.length; i++) if (CITIES[i].id === id) return CITIES[i];
  return CITIES[0];
}
function colorFor(name) {
  var s = String(name || '');
  var h = 0;
  for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100003;
  return EV_COLORS[h % EV_COLORS.length];
}

/* ============ 기본 상태 ============ */
function makeItem(id, text) { return { id: id, text: text }; }
function makeEvent(name, time) { return { id: uid('ev'), name: name, time: time }; }

/* 기본 4개 섹션 — 예전과 똑같이 보이도록(오늘의 학원+칭찬 스티커 반 폭, 루틴·시간표 전체 폭) */
function defaultSections() {
  var out = [];
  for (var i = 0; i < SEC_IDS.length; i++) {
    var base = SEC_IDS[i];
    out.push({
      id: base, base: base,
      emoji: SEC_DEFAULT_EMOJI[base], title: SEC_NAMES[base],
      width: SEC_DEFAULT_WIDTH[base], w: SEC_DEFAULT_WIDTH[base], h: 0, hidden: false,
      blocks: [{ id: 'blk-' + base, type: SEC_PRIMARY_BLOCK[base], group: '' }]
    });
  }
  /* 🎯 특별 미션 · ⚡ 역할 체크리스트 — 새로 시작하는 기기에도 기본으로 보여요 */
  out.push({
    id: 'sec-special-missions', base: '', emoji: '🎯', title: '특별 미션',
    width: 'full', w: 'full', h: 0, hidden: false,
    blocks: [{ id: 'blk-sec-special-missions', type: 'special_missions', group: '', missions: defaultMissions() }]
  });
  out.push({
    id: 'sec-roles', base: '', emoji: '⚡', title: '역할 체크리스트',
    width: 'half', w: 'half', h: 0, hidden: false,
    blocks: [{ id: 'blk-sec-roles', type: 'role_checklist', group: '', roles: defaultRoles() }]
  });
  return out;
}

/* 알림 소리 목록 — 모두 PCM .wav로 만들어 <audio>로 재생해요 (아이폰 무음 스위치에서도 소리) */
var ALERT_SOUNDS = [
  { id: 'hawaii', name: '🎺 하와이 파이브오' },
  { id: 'chime', name: '🔔 맑은 차임벨' },
  { id: 'game', name: '🎮 게임 레벨업 팡파르' },
  { id: 'musicbox', name: '✨ 부드러운 오르골' },
  { id: 'classic', name: '⏰ 클래식 모닝 알람' },
  { id: 'retro_coin', name: '🪙 8비트 코인' },
  { id: 'retro_powerup', name: '⭐ 8비트 파워업' },
  { id: 'retro_clear', name: '🏁 8비트 스테이지 클리어' }
];
var ALERT_SOUND_DEFAULT = 'hawaii';
var ALERT_CUSTOM_MAX = 5;              /* 내 알림음은 5개까지 */
var ALERT_CUSTOM_BYTES = 500 * 1024;   /* 오디오 파일 500KB까지 */

/* 칭찬 스티커 이유 기본값 — 부모님이 편집에서 바꿀 수 있어요 */
var STICKER_REASON_PRESETS = ['환경관리', '특별기여', '기본심부름', '가족돕기'];

/* 예전 기본값(심부름 · 착한 일)은 새 4가지로 옮겨요 */
function migrateStickerReasons(reasons) {
  var legacyMap = { '심부름': '기본심부름', '착한 일': '가족돕기' };
  var anyLegacy = false, moved = [], seenR = {};
  for (var rj = 0; rj < reasons.length; rj++) {
    var rname = reasons[rj];
    if (legacyMap[rname]) { anyLegacy = true; rname = legacyMap[rname]; }
    if (!seenR[rname]) { seenR[rname] = 1; moved.push(rname); }
  }
  if (anyLegacy) {
    var merged = STICKER_REASON_PRESETS.slice(0);
    for (var rm = 0; rm < moved.length; rm++) if (merged.indexOf(moved[rm]) < 0) merged.push(moved[rm]);
    moved = merged;
  }
  return moved;
}

function alertSoundPreset(id) {
  for (var i = 0; i < ALERT_SOUNDS.length; i++) if (ALERT_SOUNDS[i].id === id) return ALERT_SOUNDS[i];
  return null;
}
function customAlertSounds() {
  var list = (state && state.settings && state.settings.customAlertSounds) ? state.settings.customAlertSounds : [];
  return Object.prototype.toString.call(list) === '[object Array]' ? list : [];
}
function customAlertSound(id) {
  var list = customAlertSounds();
  for (var i = 0; i < list.length; i++) if (list[i] && list[i].id === id) return list[i];
  return null;
}
function alertSoundId() {
  var v = (state && state.settings) ? String(state.settings.alertSound || '') : '';
  if (alertSoundPreset(v) || customAlertSound(v)) return v;
  return ALERT_SOUND_DEFAULT;
}
function alertSoundName(id) {
  var p = alertSoundPreset(id);
  if (p) return p.name;
  var c = customAlertSound(id);
  return c ? String(c.name || '내 알림음') : ALERT_SOUNDS[0].name;
}

/* 루틴 그룹이 따로 고른 알림음 — 비어 있으면 '전체 기본음 따르기'예요 */
function catAlertSoundOf(v) {
  var id = (typeof v === 'string') ? v.trim() : '';
  if (!id) return '';
  if (alertSoundPreset(id) || customAlertSound(id)) return id;
  return '';
}
function catAlertSoundId(cat) {
  var id = cat ? catAlertSoundOf(cat.alertSound) : '';
  return id || alertSoundId();
}
/* 그룹 알림음 고르기 목록 — 첫 칸은 '전체 기본음 따르기' */
function catAlertOptionsHtml(cur) {
  cur = catAlertSoundOf(cur);
  var h = '<option value=""' + (cur ? '' : ' selected') + '>전체 기본음 따르기</option>';
  var i;
  for (i = 0; i < ALERT_SOUNDS.length; i++) {
    h += '<option value="' + esc(ALERT_SOUNDS[i].id) + '"' + (cur === ALERT_SOUNDS[i].id ? ' selected' : '') + '>' +
      esc(ALERT_SOUNDS[i].name) + '</option>';
  }
  var list = customAlertSounds();
  for (i = 0; i < list.length; i++) {
    h += '<option value="' + esc(list[i].id) + '"' + (cur === list[i].id ? ' selected' : '') + '>' +
      esc('🎧 ' + String(list[i].name || '내 알림음')) + '</option>';
  }
  return h;
}
function setCatAlertSound(catId, val) {
  if (!can('edit')) return;
  var cat = findCat(catId);
  if (!cat) return;
  cat.alertSound = catAlertSoundOf(val);
  saveAndPush();
  renderRoutine();
  showToast(cat.alertSound
    ? '🔔 "' + (cat.title || '루틴') + '" 알림음은 ' + alertSoundName(cat.alertSound) + '로 울려요.'
    : '🔔 "' + (cat.title || '루틴') + '"는 전체 기본음(' + alertSoundName(alertSoundId()) + ')을 따라요.');
}
function previewCatAlertSound(catId) {
  var cat = findCat(catId);
  if (!cat) return;
  previewAlertSound(catAlertSoundId(cat));
}

/* ============ 조절 가능한 변수 (🎛️ 변수 설정) ============
   화면 규칙에 쓰는 숫자를 state.settings.vars 한곳에 모아 두고,
   config/settings.json 으로 가족 기기끼리 같이 맞춰요. */
var VAR_DEFS = [
  { k: 'coinCheck', def: 10, min: 0, max: 999, step: 1, label: '루틴 1개 체크 코인', unit: '코인', hint: '루틴을 하나 체크할 때마다 주는 코인' },
  { k: 'coinGroup', def: 20, min: 0, max: 999, step: 1, label: '루틴 그룹 완료 보너스', unit: '코인', hint: '한 그룹의 루틴을 다 끝냈을 때 한 번 더 주는 코인' },
  { k: 'coinSticker', def: 10, min: 0, max: 999, step: 1, label: '칭찬 스티커 1개', unit: '코인', hint: '칭찬 스티커를 한 개 붙일 때 주는 코인' },
  { k: 'coinMissionCheck', def: 10, min: 0, max: 999, step: 1, label: '특별 미션 1칸 체크 코인', unit: '코인', hint: '특별 미션 날짜 칸을 하나 체크할 때 주는 코인 (풀면 돌아가요)' },
  { k: 'coinRoleCheck', def: 10, min: 0, max: 999, step: 1, label: '역할 항목 1개 체크 코인', unit: '코인', hint: '역할 체크리스트 항목을 하나 체크할 때 주는 코인 (풀면 돌아가요)' },
  { k: 'coinStart', def: 120, min: 0, max: 99999, step: 10, label: '새 계정 시작 코인', unit: '코인', hint: '새로 만든 계정이 처음 갖고 시작하는 코인' },
  { k: 'petDrawCost', def: 30, min: 0, max: 9999, step: 1, label: '랜덤 알 뽑기 비용', unit: '코인', hint: '🥚 알 뽑기 한 번에 내는 코인' },
  { k: 'hatchHours', def: 24, min: 0, max: 720, step: 1, label: '알 부화 시간', unit: '시간', hint: '새 알이 부화하기까지 걸리는 시간' },
  { k: 'expMax', def: 100, min: 1, max: 9999, step: 10, label: '진화에 필요한 기운', unit: 'EXP', hint: '부화·1차·2차 진화 단계마다 필요한 경험치' },
  { k: 'stickerUnit', def: 1000, min: 100, max: 100000, step: 100, label: '스티커 1개 금액 가치', unit: '원', hint: '스티커 한 개를 돈으로 계산할 때의 값' },
  { k: 'stickerSlots', def: 10, min: 3, max: 30, step: 1, label: '스티커 한 판 칸 수', unit: '칸', hint: '한 판에 붙일 수 있는 스티커 칸 수' },
  { k: 'alertFirstMin', def: 30, min: 0, max: 180, step: 1, label: '목표 시간 첫 알림', unit: '분 전', hint: '루틴 목표 시간 몇 분 전에 처음 알려 줄까요 (0 = 정각)' },
  { k: 'alertSecondMin', def: 10, min: 0, max: 180, step: 1, label: '목표 시간 두 번째 알림', unit: '분 전', hint: '한 번 더 알려 줄 때 몇 분 전인지 (0 = 정각)' }
];

function varDef(k) {
  for (var i = 0; i < VAR_DEFS.length; i++) if (VAR_DEFS[i].k === k) return VAR_DEFS[i];
  return null;
}
function clampVarValue(k, v) {
  var d = varDef(k);
  if (!d) return 0;
  var n = parseInt(v, 10);
  if (isNaN(n)) n = d.def;
  if (n < d.min) n = d.min;
  if (n > d.max) n = d.max;
  return n;
}
function defaultVars() {
  var out = {};
  for (var i = 0; i < VAR_DEFS.length; i++) out[VAR_DEFS[i].k] = VAR_DEFS[i].def;
  return out;
}
function normVars(raw) {
  var out = defaultVars();
  if (raw && typeof raw === 'object') {
    for (var i = 0; i < VAR_DEFS.length; i++) {
      var d = VAR_DEFS[i];
      if (raw[d.k] == null || raw[d.k] === '') continue;
      out[d.k] = clampVarValue(d.k, raw[d.k]);
    }
  }
  return out;
}
function varsOf(st) {
  st = st || state;
  if (!st || typeof st !== 'object') return defaultVars();
  if (!st.settings || typeof st.settings !== 'object') st.settings = {};
  st.settings.vars = normVars(st.settings.vars);
  return st.settings.vars;
}
function vnum(k) {
  var d = varDef(k);
  var v = varsOf(state)[k];
  if (v == null && d) v = d.def;
  return Number(v) || 0;
}
/* 목표 시간 알림 켜기/끄기 — 값이 없으면 켜진 것으로 봐요 */
function targetAlertOn() {
  return !(state && state.settings && state.settings.alertEnabled === false);
}

/* 직접 만든 스티커 모양 검사 — {id, e, name} 으로만 기억해요 */
function normalizeStickerShape(raw) {
  if (!raw || typeof raw !== 'object') return null;
  var e = String(raw.e || '').trim().slice(0, 8);
  if (!e) return null;
  var name = String(raw.name || '').trim().slice(0, 10) || '내 모양';
  var id = String(raw.id || '').trim().slice(0, 24);
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) id = '';
  if (!id) id = 'c' + Date.now().toString(36) + Math.floor(Math.random() * 46656).toString(36);
  return { id: id, e: e, name: name };
}

/* 기본 12종 + 직접 만든 모양 */
function stickerShapesAll() {
  var out = STICKER_SHAPES.slice(0);
  var cs = (state.sticker && state.sticker.shapes) || [];
  for (var i = 0; i < cs.length; i++) out.push(cs[i]);
  return out;
}
function stickerShapeById(id) {
  if (!id) return null;
  var all = stickerShapesAll();
  for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
  return null;
}
function stickerShapeForEmoji(em) {
  if (!em) return null;
  var all = stickerShapesAll();
  for (var i = 0; i < all.length; i++) if (all[i].e === em) return all[i];
  return null;
}
/* 지금 붙일 모양 — 마지막으로 고른 모양, 아직 고른 적 없으면 기본 ⭐ */
function stickerActiveShape() {
  var st = state.sticker || {};
  return stickerShapeById(st.shapeId) || STICKER_SHAPES[0];
}
/* 칸 하나의 모양 id — 옛 스티커(모양 없음)는 이모지로 찾아보고, 그래도 없으면 '' */
function stickerIconOf(i) {
  var st = state.sticker || {};
  var id = (st.icons && st.icons[i]) || '';
  if (stickerShapeById(id)) return id;
  var found = stickerShapeForEmoji((st.stickers || [])[i] || '');
  return found ? found.id : '';
}

function defaultState() {
  return {
    version: 1,
    settings: {
      childName: '', greeting: GREETING_DEFAULT, city: 'seoul', soundOn: true,   /* 이름은 보호자가 넣기 전까지 비워 둬요 (샘플 이름이 화면에 비치지 않게) */
      alertEnabled: true,   /* 목표 시간 알림 켜기/끄기 */
      alertSound: ALERT_SOUND_DEFAULT, customAlertSounds: [],
      sectionTitles: { routine: '하루 루틴', sticker: '칭찬 스티커', academy: '오늘의 학원', week: '학원 시간표' },
      dashboardSections: defaultSections(),
      vars: defaultVars(),
      achievements: defaultAchievements()
    },
    categories: [
      {
        id: 'morning', title: '등교 준비', sub: '아침', emoji: '🌅', days: DAY_ALL.slice(0),
        color: '#ff9f1c', tint: '#fff5e8', alertSound: '',
        items: [
          makeItem('morning-1', '세수하고 양치하기'),
          makeItem('morning-2', '옷 갈아입기'),
          makeItem('morning-3', '아침밥 먹기'),
          makeItem('morning-4', '알림장·준비물 챙기기'),
          makeItem('morning-5', '물통 넣기')
        ]
      },
      {
        id: 'after', title: '하교 후 할 일', sub: '오후', emoji: '🎒', days: DAY_ALL.slice(0),
        color: '#12b886', tint: '#e8fbf2', alertSound: '',
        items: [
          makeItem('after-1', '손 씻고 간식 먹기'),
          makeItem('after-2', '알림장 확인하기'),
          makeItem('after-3', '학교 숙제하기'),
          makeItem('after-4', '가방 정리하기')
        ]
      },
      {
        id: 'study', title: '저녁 공부 체크', sub: '저녁', emoji: '📚', days: DAY_ALL.slice(0),
        color: '#7c5cfc', tint: '#f1edff', alertSound: '',
        items: [
          makeItem('study-1', '책 읽기 20분'),
          makeItem('study-2', '수학 문제 풀기'),
          makeItem('study-3', '영어 듣기·단어'),
          makeItem('study-4', '내일 시간표 챙기기')
        ]
      },
      {
        id: 'habit', title: '매일 할 일 체크', sub: '습관', emoji: '🌙', days: DAY_ALL.slice(0),
        color: '#ff5c8a', tint: '#ffedf3', alertSound: '',
        items: [
          makeItem('habit-1', '이불 정리하기'),
          makeItem('habit-2', '자기 전 양치하기'),
          makeItem('habit-3', '장난감·책상 정리'),
          makeItem('habit-4', '물통 씻어놓기')
        ]
      }
    ],
    sticker: {
      slots: 10, goal: '', stickers: [], celebrated: false,
      /* boardUpdatedAt: 지금 판(10칸)이 마지막으로 바뀐 시각 — 다른 기기의 판과 견줘요 */
      boardUpdatedAt: 0,
      clearedAt: 0,
      unit: 1000,
      reasons: STICKER_REASON_PRESETS.slice(0),
      /* reasonsUpdatedAt: 칭찬 이유 목록이 마지막으로 바뀐 시각 — 오래된 목록이 덮어쓰지 않게 견줘요 */
      reasonsUpdatedAt: 0,
      /* icons: 칸별 스티커 모양 id (stickers 와 같은 순서) — 옛 스티커는 비워 두고 ⭐로 기억해요 */
      icons: [],
      /* shapes: 직접 추가한 스티커 모양 [{id, e, name}] */
      shapes: [],
      shapesUpdatedAt: 0,
      /* shapeId: 마지막으로 고른 모양 (팝업을 열면 이 모양이 먼저 잡혀 있어요) */
      shapeId: ''
    },
    schedule: {
      mon: [makeEvent('태권도', '16:30–17:30'), makeEvent('피아노', '18:00–18:40')],
      tue: [makeEvent('영어', '16:00–17:00'), makeEvent('수영', '17:30–18:30')],
      wed: [makeEvent('미술', '16:30–18:00')],
      thu: [makeEvent('태권도', '16:30–17:30'), makeEvent('영어', '18:00–19:00')],
      fri: [makeEvent('피아노', '17:00–17:40')],
      sat: [makeEvent('수영', '10:00–11:00')],
      sun: []
    },
    checks: {},
    routineCelebrated: '',
    history: {},
    dayUpdated: {},
    stickerLog: [],
    stickerSpends: [],
    /* deletedSpends: 지운 사용 기록 표시 — 다른 기기에도 삭제를 알려요 (열쇠 → 지운 시각) */
    deletedSpends: {},
    /* spendSyncAt: 사용 내역을 마지막으로 저장소에 올린 시각 — 구름에서 사라진 기록을 가려낼 때 씀 */
    spendSyncAt: 0,
    boardLog: [],
    workbooks: [
      { id: 'wb-1', name: '초등 수학' },
      { id: 'wb-2', name: '국어 독해' },
      { id: 'wb-3', name: '영어 단어' },
      { id: 'wb-4', name: '한자·퍼즐' }
    ],
    workbookPicks: {},
    workbookItemPicks: {},
    layoutOrder: ['routine', 'sticker', 'academy', 'week'],
    pet: defaultPet(),
    shop: { items: defaultShopItems() },
    profile: null,
    stats: { stickersTotal: 0 }
  };
}

/* ============ 저장 / 복원 ============ */
function normBlock(raw, catIds) {
  if (!raw || typeof raw !== 'object') return null;
  var type = String(raw.type || '');
  if (BLOCK_ORDER.indexOf(type) < 0) return null;
  var b = {
    id: (typeof raw.id === 'string' && raw.id.trim()) ? raw.id.trim().slice(0, 40) : uid('blk'),
    type: type, group: ''
  };
  if (type === 'routine' || type === 'target_bar') {
    var g = (typeof raw.group === 'string') ? raw.group : '';
    b.group = (g && catIds && catIds[g]) ? g : '';
  }
  if (type === 'notice_board') {
    b.title = (typeof raw.title === 'string' && raw.title.trim()) ? raw.title.trim().slice(0, 24) : '오늘의 한마디';
    b.emoji = (typeof raw.emoji === 'string' && raw.emoji.trim()) ? raw.emoji.trim().slice(0, 4) : '💬';
    b.text = (typeof raw.text === 'string') ? raw.text.slice(0, 400) : '';
  }
  if (type === 'special_missions') {
    b.missions = normMissions(raw.missions);
    b.u = Math.max(0, Number(raw.u) || 0);
  }
  if (type === 'role_checklist') {
    b.roles = normRoles(raw.roles);
    b.u = Math.max(0, Number(raw.u) || 0);
  }
  return b;
}

/* 카드 자리 — 어느 줄(row)의 어느 칸(col)에 있는지
   반 폭 카드(col: 'left'|'right')는 한 줄의 왼칸·오른칸에 위에서부터 쌓여요.
   전체 폭 카드(w: 'full')는 양쪽 칸을 다 쓰는 한 줄을 혼자 차지해요. */
function normColOf(v) { return v === 'right' ? 'right' : 'left'; }

/* 예전 배치(반 폭 두 장이 한 줄)를 그대로 살려 줄·칸을 잡아 줘요.
   예전에는 사이에 전체 폭 카드가 있어도 반 폭 두 장을 한 줄로 모았어요 — 그것도 그대로 이어받아요. */
function legacySectionRows(list) {
  var row = -1, pendingRow = -1;
  for (var i = 0; i < list.length; i++) {
    var s = list[i];
    if (s.width === 'full') { row++; s.row = row; s.col = 'left'; continue; }
    if (pendingRow < 0) { row++; pendingRow = row; s.row = row; s.col = 'left'; }
    else { s.row = pendingRow; s.col = 'right'; pendingRow = -1; }
  }
}

/* 줄·칸을 읽어 화면 순서(줄 → 왼칸 → 오른칸)로 가지런히 정리해요.
   카드가 놓친 줄·칸이 있으면 맨 아래 줄로 붙이고, 빈칸을 자동으로 메우지는 않아요. */
function applySectionRows(list) {
  var i, s, has = false;
  for (i = 0; i < list.length; i++) {
    var rv = list[i].row;
    if (typeof rv === 'number' && isFinite(rv) && rv >= 0) { has = true; break; }
  }
  if (!has) legacySectionRows(list);
  var maxRow = -1;
  for (i = 0; i < list.length; i++) {
    s = list[i];
    s.col = normColOf(s.col);
    if (typeof s.row === 'number' && isFinite(s.row) && s.row >= 0) s.row = Math.floor(s.row);
    if (typeof s.row !== 'number' || !isFinite(s.row)) { maxRow++; s.row = maxRow; s.col = 'left'; }
    if (s.row > maxRow) maxRow = s.row;
  }
  /* 줄별로 모아요 (같은 줄 안에서는 들어온 순서 그대로) */
  var byRow = {}, order = [];
  for (i = 0; i < list.length; i++) {
    var k = list[i].row;
    if (!byRow[k]) { byRow[k] = []; order.push(k); }
    byRow[k].push(list[i]);
  }
  order.sort(function (a, b) { return a - b; });
  var out = [], rowNo = -1;
  for (var oi = 0; oi < order.length; oi++) {
    var members = byRow[order[oi]];
    /* 한 줄에 전체 폭 카드가 섞여 있으면 전체 폭 카드는 혼자 한 줄을 차지하게 나눠요 */
    var segs = [], buf = [];
    for (i = 0; i < members.length; i++) {
      if (members[i].width === 'full') {
        if (buf.length) { segs.push(buf); buf = []; }
        segs.push([members[i]]);
      } else buf.push(members[i]);
    }
    if (buf.length) segs.push(buf);
    for (var si = 0; si < segs.length; si++) {
      var seg = segs[si];
      rowNo++;
      if (seg.length === 1 && seg[0].width === 'full') {
        seg[0].row = rowNo; seg[0].col = 'left';
        out.push(seg[0]);
        continue;
      }
      var lefts = [], rights = [];
      for (i = 0; i < seg.length; i++) {
        if (normColOf(seg[i].col) === 'right') rights.push(seg[i]); else lefts.push(seg[i]);
      }
      for (i = 0; i < lefts.length; i++) { lefts[i].row = rowNo; lefts[i].col = 'left'; out.push(lefts[i]); }
      for (i = 0; i < rights.length; i++) { rights[i].row = rowNo; rights[i].col = 'right'; out.push(rights[i]); }
    }
  }
  list.length = 0;
  for (i = 0; i < out.length; i++) list.push(out[i]);
  return list;
}

function normalizeSections(s) {
  var defs = defaultSections();
  var defByBase = {};
  for (var di = 0; di < defs.length; di++) { if (defs[di].base) defByBase[defs[di].base] = defs[di]; }
  var titles = (s.settings && s.settings.sectionTitles) ? s.settings.sectionTitles : {};
  var order = (Object.prototype.toString.call(s.layoutOrder) === '[object Array]') ? s.layoutOrder : [];
  var raw = (s.settings && Object.prototype.toString.call(s.settings.dashboardSections) === '[object Array]')
    ? s.settings.dashboardSections : null;
  var catIds = {};
  for (var ci = 0; ci < s.categories.length; ci++) catIds[s.categories[ci].id] = 1;

  function cleanBlocks(rawBlocks) {
    var out = [];
    var arr = (Object.prototype.toString.call(rawBlocks) === '[object Array]') ? rawBlocks : [];
    for (var bi = 0; bi < arr.length && out.length < BLOCK_MAX_PER_SEC; bi++) {
      var b = normBlock(arr[bi], catIds);
      if (b) out.push(b);
    }
    return out;
  }
  function cleanTitle(v, base) {
    var t = (typeof v === 'string') ? v.replace(/\s+/g, ' ').trim().slice(0, 16) : '';
    if (t) return t;
    if (base) return (typeof titles[base] === 'string' && titles[base].trim()) ? titles[base].trim().slice(0, 16) : SEC_NAMES[base];
    return '새 섹션';
  }
  function cleanEmoji(v, base) {
    var e = (typeof v === 'string') ? fixEmoji(v.trim().slice(0, 4)) : '';
    if (e) return e;
    return base ? SEC_DEFAULT_EMOJI[base] : '🧩';
  }
  /* 카드 폭 — width가 기준이고, 예전 기기의 w도 받아 줘요.
     'custom'은 자유 가로폭(sec.wPx)이에요 — 반 폭보다 좀게, 3장 이상 나란히 놓을 때 써요. */
  function cleanWidth(r, base) {
    var v0 = (r.width === 'full' || r.width === 'half' || r.width === 'custom') ? r.width
      : ((r.w === 'full' || r.w === 'half' || r.w === 'custom') ? r.w : '');
    var px = Math.round(Number(r.wPx) || 0);
    /* px가 없으면 자유 폭이 될 수 없어요 */
    if (v0 === 'custom' && !(px >= SEC_W_MIN)) v0 = '';
    if (v0) return v0;
    return base ? SEC_DEFAULT_WIDTH[base] : 'half';
  }
  function cleanWPx(r, wid) {
    if (wid !== 'custom') return 0;
    var px = Math.round(Number(r.wPx) || 0);
    if (!isFinite(px) || px < SEC_W_MIN) return 0;
    if (px > 4000) px = 4000;
    return px;
  }
  /* 카드 높이 — 드래그로 맞춘 px (0이면 내용에 맞춤) */
  function cleanHeight(v) {
    var n = parseInt(v, 10);
    if (isNaN(n) || n < SEC_H_MIN || n > SEC_H_MAX) return 0;
    return n;
  }

  var list = [], seen = {}, usedBase = {};
  if (raw) {
    for (var i = 0; i < raw.length && list.length < SEC_MAX; i++) {
      var r = raw[i] || {};
      var base = (SEC_IDS.indexOf(String(r.base || '')) >= 0) ? String(r.base)
        : (SEC_IDS.indexOf(String(r.id || '')) >= 0 ? String(r.id) : '');
      if (base && usedBase[base]) continue;
      var id;
      if (base) id = base;
      else {
        id = (typeof r.id === 'string' && /^sec-[A-Za-z0-9_-]{1,32}$/.test(r.id)) ? r.id : ('sec-' + uid(''));
      }
      if (seen[id]) continue;
      seen[id] = 1;
      if (base) usedBase[base] = 1;
      var blocks = cleanBlocks(r.blocks);
      /* 예전 모양으로 들어온 기본 섹션(블록 정보가 아예 없음)은 대표 블록 하나를 넣어요 */
      if (base && !blocks.length && Object.prototype.toString.call(r.blocks) !== '[object Array]') {
        blocks = [{ id: 'blk-' + base, type: SEC_PRIMARY_BLOCK[base], group: '' }];
      }
      var wid = cleanWidth(r, base);
      var wpx = cleanWPx(r, wid);
      if (wid === 'custom' && !wpx) wid = 'half';
      list.push({
        id: id, base: base,
        emoji: cleanEmoji(r.emoji, base),
        title: cleanTitle(r.title, base),
        width: wid,
        w: wid,
        wPx: wpx,
        h: cleanHeight(r.h),
        row: (typeof r.row === 'number' && isFinite(r.row) && r.row >= 0) ? Math.floor(r.row) : null,
        col: (r.col === 'right' || r.col === 'left') ? r.col : '',
        hidden: r.hidden === true,
        blocks: blocks
      });
    }
  }

  if (!raw) {
    /* 예전 설정 → 기본 섹션 (layoutOrder 순서대로) */
    var seq = order.length ? order.slice(0) : SEC_IDS.slice(0);
    for (var si = 0; si < seq.length; si++) {
      var b2 = seq[si];
      if (SEC_IDS.indexOf(b2) < 0 || usedBase[b2]) continue;
      usedBase[b2] = 1;
      var df = defByBase[b2];
      list.push({
        id: b2, base: b2, emoji: df.emoji, title: cleanTitle('', b2),
        width: df.width, w: df.width, h: 0, row: null, col: '', hidden: false, blocks: clone(df.blocks)
      });
    }
  }
  /* 기본 4개 섹션은 항상 있어요 (지워지지 않고 숨기기/블록 빼기만 해요) */
  for (var b3 = 0; b3 < SEC_IDS.length && list.length < SEC_MAX; b3++) {
    var baseId = SEC_IDS[b3];
    if (usedBase[baseId]) continue;
    usedBase[baseId] = 1;
    var df3 = defByBase[baseId];
    list.push({
      id: baseId, base: baseId, emoji: df3.emoji, title: cleanTitle('', baseId),
      width: df3.width, w: df3.width, h: 0, row: null, col: '', hidden: false, blocks: clone(df3.blocks)
    });
  }
  /* 🎯 특별 미션 · ⚡ 역할 체크리스트 카드는 처음 한 번만 기본으로 넣어요.
     이미 다른 카드처럼 보이거나 가족이 지운 경우에는 다시 넣지 않도록 표시를 남겨 둬요. */
  if (s.settings.missionsSeeded !== 1) {
    s.settings.missionsSeeded = 1;
    seedExtraSections(list);
  }
  return applySectionRows(list);
}

/* 새 카드 두 장을 목록 끝에 붙여요 (이미 같은 블록이 있는 카드가 있으면 건너뜀) */
function seedExtraSections(list) {
  var have = {}, i, k;
  for (i = 0; i < list.length; i++) {
    var bs = list[i].blocks || [];
    for (k = 0; k < bs.length; k++) if (bs[k] && bs[k].type) have[bs[k].type] = 1;
  }
  var seeds = [
    { id: 'sec-special-missions', emoji: '🎯', title: '특별 미션', width: 'full', type: 'special_missions' },
    { id: 'sec-roles', emoji: '⚡', title: '역할 체크리스트', width: 'half', type: 'role_checklist' }
  ];
  for (i = 0; i < seeds.length; i++) {
    var sd = seeds[i];
    if (have[sd.type] || list.length >= SEC_MAX) continue;
    var dup = false;
    for (k = 0; k < list.length; k++) if (list[k].id === sd.id) dup = true;
    if (dup) continue;
    var seedBlk = { id: 'blk-' + sd.id, type: sd.type, group: '' };
    if (sd.type === 'special_missions') seedBlk.missions = defaultMissions();
    if (sd.type === 'role_checklist') seedBlk.roles = defaultRoles();
    list.push({
      id: sd.id, base: '', emoji: sd.emoji, title: sd.title,
      width: sd.width, w: sd.width, h: 0, row: null, col: '', hidden: false, blocks: [seedBlk]
    });
  }
}

/* 예전 화면·다른 기기와 섞여도 보이도록 이름·순서도 맞춰 둡니다 */
function syncSectionMirrors(s) {
  var list = s.settings.dashboardSections || [];
  var lo = [], titles = {};
  for (var i = 0; i < list.length; i++) {
    var sec = list[i];
    if (!sec.base) continue;
    lo.push(sec.base);
    if (sec.title) titles[sec.base] = sec.title;
  }
  for (var k = 0; k < SEC_IDS.length; k++) {
    if (!titles[SEC_IDS[k]]) titles[SEC_IDS[k]] = SEC_NAMES[SEC_IDS[k]];
  }
  s.layoutOrder = lo;
  s.settings.sectionTitles = titles;
}

function normalize(raw) {
  var d = defaultState();
  if (!raw || typeof raw !== 'object') return d;
  var s;
  try { s = JSON.parse(JSON.stringify(raw)); } catch (e) { return d; }

  s.version = 1;
  s.settingsClearedAt = Number(s.settingsClearedAt) || 0;
  if (!s.settings || typeof s.settings !== 'object') s.settings = {};
  s.settings.childName = (typeof s.settings.childName === 'string') ? s.settings.childName : d.settings.childName;
  s.settings.greeting = (typeof s.settings.greeting === 'string') ? s.settings.greeting : d.settings.greeting;
  s.settings.soundOn = (typeof s.settings.soundOn === 'boolean') ? s.settings.soundOn : true;
  s.settings.alertEnabled = (typeof s.settings.alertEnabled === 'boolean') ? s.settings.alertEnabled : true;
  var rawCustom = (Object.prototype.toString.call(s.settings.customAlertSounds) === '[object Array]') ? s.settings.customAlertSounds : [];
  var customs = [];
  for (var ci = 0; ci < rawCustom.length && customs.length < ALERT_CUSTOM_MAX; ci++) {
    var one = rawCustom[ci];
    if (!one || typeof one !== 'object') continue;
    var cid = String(one.id || '').slice(0, 16);
    var cnm = String(one.name || '').slice(0, 24).trim();
    var csrc = String(one.src || '');
    if (!cid || !cnm) continue;
    if (!/^(data:audio\/[a-z0-9.+-]+;base64,|https?:\/\/)/i.test(csrc) || csrc.length > 900000) continue;
    customs.push({ id: cid, name: cnm, src: csrc });
  }
  s.settings.customAlertSounds = customs;
  var soundIds = {};
  for (var si0 = 0; si0 < ALERT_SOUNDS.length; si0++) soundIds[ALERT_SOUNDS[si0].id] = 1;
  for (var ck0 = 0; ck0 < customs.length; ck0++) soundIds[customs[ck0].id] = 1;
  var knownSound = false;
  for (var ai = 0; ai < ALERT_SOUNDS.length; ai++) if (ALERT_SOUNDS[ai].id === s.settings.alertSound) knownSound = true;
  for (var cj = 0; cj < customs.length; cj++) if (customs[cj].id === s.settings.alertSound) knownSound = true;
  if (!knownSound) s.settings.alertSound = ALERT_SOUND_DEFAULT;
  var knownCity = false;
  for (var c = 0; c < CITIES.length; c++) if (CITIES[c].id === s.settings.city) knownCity = true;
  if (!knownCity) s.settings.city = d.settings.city;

  /* 섹션 이름 (편집 모드에서 바꿀 수 있음) */
  var rawTitles = (s.settings.sectionTitles && typeof s.settings.sectionTitles === 'object') ? s.settings.sectionTitles : {};
  var titles = {};
  for (var ti = 0; ti < SEC_IDS.length; ti++) {
    var tid = SEC_IDS[ti];
    var tv = rawTitles[tid];
    titles[tid] = (typeof tv === 'string' && tv.trim()) ? tv.trim().slice(0, 16) : d.settings.sectionTitles[tid];
  }
  s.settings.sectionTitles = titles;

  /* 조절 가능한 변수 (🎛️ 변수 설정) */
  s.settings.vars = normVars(s.settings.vars);
  /* 🏆 업적 정의 — 보호자가 만든 것까지 기기끼리 함께 써요 */
  s.settings.achievements = normAchievements(s.settings.achievements);

  var cats = [];
  if (Object.prototype.toString.call(s.categories) === '[object Array]') {
    /* 사용자가 만든 그룹과 지운 그룹을 그대로 살려요. 빈 배열이면 기본 4개를 되살리지 않음. */
    for (var i = 0; i < s.categories.length && cats.length < 16; i++) {
      var rawCat = s.categories[i] || {};
      var defCat = d.categories[i % d.categories.length];
      var cat = {
        id: typeof rawCat.id === 'string' && rawCat.id ? rawCat.id : ('cat-' + i),
        title: typeof rawCat.title === 'string' ? rawCat.title.slice(0, 16) : defCat.title,
        sub: typeof rawCat.sub === 'string' ? rawCat.sub.slice(0, 50) : '',
        emoji: typeof rawCat.emoji === 'string' && rawCat.emoji ? fixEmoji(rawCat.emoji.slice(0, 8)) : '✅',
        targetTime: hhmmValid(rawCat.targetTime) ? rawCat.targetTime : '',
        alertSound: (typeof rawCat.alertSound === 'string' && soundIds[rawCat.alertSound]) ? rawCat.alertSound : '',
        showWorkbooks: (typeof rawCat.showWorkbooks === 'boolean') ? rawCat.showWorkbooks : undefined,
        days: normDays(rawCat.days),
        color: typeof rawCat.color === 'string' && rawCat.color ? rawCat.color : defCat.color,
        tint: typeof rawCat.tint === 'string' && rawCat.tint ? rawCat.tint : defCat.tint,
        items: []
      };
      var rawItems = (Object.prototype.toString.call(rawCat.items) === '[object Array]') ? rawCat.items : [];
      for (var j = 0; j < rawItems.length; j++) {
        var it = rawItems[j] || {};
        if (typeof it.text !== 'string') continue;
        cat.items.push({
          id: (typeof it.id === 'string' && it.id) ? it.id : uid(cat.id),
          text: it.text
        });
      }
      cats.push(cat);
    }
  } else {
    cats = d.categories;
  }
  s.categories = cats;

  if (!s.sticker || typeof s.sticker !== 'object') s.sticker = clone(d.sticker);
  var slots = parseInt(s.sticker.slots, 10);
  if (!slots || isNaN(slots) || slots < 3 || slots > 30) slots = d.sticker.slots;
  var list = [];
  if (Object.prototype.toString.call(s.sticker.stickers) === '[object Array]') {
    for (var k = 0; k < s.sticker.stickers.length && k < 30; k++) {
      if (typeof s.sticker.stickers[k] === 'string') list.push(s.sticker.stickers[k]);
    }
  }
  s.sticker.slots = Math.max(slots, list.length);
  s.sticker.stickers = list;
  s.sticker.goal = (typeof s.sticker.goal === 'string') ? s.sticker.goal : d.sticker.goal;
  /* 예전 기본값('주말 피자 파티')은 토큰형 UI에서 쓰지 않으므로 비워 둔다 */
  if (s.sticker.goal === '주말 피자 파티 🍕') s.sticker.goal = '';
  s.sticker.celebrated = (s.sticker.celebrated === true);
  var boardAt = Number(s.sticker.boardUpdatedAt);
  s.sticker.boardUpdatedAt = (boardAt && !isNaN(boardAt)) ? boardAt : 0;
  var clearedAt = Number(s.sticker.clearedAt);
  s.sticker.clearedAt = (clearedAt && !isNaN(clearedAt)) ? clearedAt : 0;
  var unit = parseInt(s.sticker.unit, 10);
  s.sticker.unit = (isNaN(unit) || unit < 100 || unit > 100000) ? 1000 : unit;
  var reasons = [];
  var rawReasons = (Object.prototype.toString.call(s.sticker.reasons) === '[object Array]') ? s.sticker.reasons : [];
  for (var ri = 0; ri < rawReasons.length && ri < 12; ri++) {
    var rr = rawReasons[ri];
    if (typeof rr === 'string' && rr.trim()) reasons.push(rr.trim().slice(0, 20));
  }
  reasons = migrateStickerReasons(reasons);
  s.sticker.reasons = reasons.length ? reasons : d.sticker.reasons.slice(0);
  var reasonsAt = Number(s.sticker.reasonsUpdatedAt);
  s.sticker.reasonsUpdatedAt = (reasonsAt && !isNaN(reasonsAt)) ? reasonsAt : 0;

  /* 직접 만든 스티커 모양 — [{"id","e","name"}] 만 받아요 */
  var shapes = [];
  var rawShapes = (Object.prototype.toString.call(s.sticker.shapes) === '[object Array]') ? s.sticker.shapes : [];
  for (var sh = 0; sh < rawShapes.length && shapes.length < STICKER_SHAPE_MAX; sh++) {
    var sn = normalizeStickerShape(rawShapes[sh]);
    if (!sn) continue;
    var dup = false;
    for (var sd = 0; sd < shapes.length; sd++) if (shapes[sd].id === sn.id) { dup = true; break; }
    if (!dup) shapes.push(sn);
  }
  s.sticker.shapes = shapes;
  var shapesAt = Number(s.sticker.shapesUpdatedAt);
  s.sticker.shapesUpdatedAt = (shapesAt && !isNaN(shapesAt)) ? shapesAt : 0;
  s.sticker.shapeId = (typeof s.sticker.shapeId === 'string') ? s.sticker.shapeId.slice(0, 24) : '';

  /* 칸별 모양 id — stickers 와 같은 순서로 맞춰요 (없는 칸은 '' = 옛 스티커) */
  var icons = [];
  var rawIcons = (Object.prototype.toString.call(s.sticker.icons) === '[object Array]') ? s.sticker.icons : [];
  for (var ic = 0; ic < list.length; ic++) {
    var iv = rawIcons[ic];
    icons.push((typeof iv === 'string') ? iv.slice(0, 24) : '');
  }
  s.sticker.icons = icons;

  if (!s.schedule || typeof s.schedule !== 'object') s.schedule = {};
  for (var n = 0; n < DAY_KEYS.length; n++) {
    var key = DAY_KEYS[n];
    var arr = (Object.prototype.toString.call(s.schedule[key]) === '[object Array]') ? s.schedule[key] : [];
    var clean = [];
    for (var m = 0; m < arr.length; m++) {
      var ev = arr[m] || {};
      if (typeof ev.name !== 'string') continue;
      clean.push({
        id: (typeof ev.id === 'string' && ev.id) ? ev.id : uid('ev'),
        name: ev.name,
        time: (typeof ev.time === 'string') ? ev.time : ''
      });
    }
    s.schedule[key] = clean;
  }

  if (!s.checks || typeof s.checks !== 'object') s.checks = {};
  if (typeof s.routineCelebrated !== 'string') s.routineCelebrated = '';

  /* 하루 기록(히스토리) */
  if (!s.history || typeof s.history !== 'object') s.history = {};
  var hKeys = [];
  for (var hk in s.history) { if (Object.prototype.hasOwnProperty.call(s.history, hk)) hKeys.push(hk); }
  for (var hn = 0; hn < hKeys.length; hn++) {
    var cleaned = cleanHistEntry(s.history[hKeys[hn]]);
    if (cleaned) s.history[hKeys[hn]] = cleaned;
    else delete s.history[hKeys[hn]];
  }

  /* 스티커 기록 */
  var stickLog = [];
  if (Object.prototype.toString.call(s.stickerLog) === '[object Array]') {
    for (var sl = 0; sl < s.stickerLog.length && sl < 6000; sl++) {
      var se = s.stickerLog[sl] || {};
      var stT = Number(se.t);
      if (!stT || isNaN(stT)) continue;
      var stD = (typeof se.d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(se.d)) ? se.d : dateKey(new Date(stT));
      stickLog.push({ d: stD, t: stT, e: (typeof se.e === 'string' && se.e) ? se.e : '⭐️', r: (typeof se.r === 'string') ? se.r.slice(0, 20) : '' });
    }
  }
  s.stickerLog = stickLog;

  /* 스티커 보드 완성 기록 */
  var boardLog = [];
  if (Object.prototype.toString.call(s.boardLog) === '[object Array]') {
    for (var bl = 0; bl < s.boardLog.length && bl < 2000; bl++) {
      var be = s.boardLog[bl] || {};
      var bt = Number(be.t);
      if (!bt || isNaN(bt)) continue;
      var bd = (typeof be.d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(be.d)) ? be.d : dateKey(new Date(bt));
      var bg = (typeof be.goal === 'string') ? be.goal : '';
      if (bg === '주말 피자 파티 🍕') bg = ''; /* 예전 기본 문구는 기록에서도 숨김 */
      boardLog.push({
        d: bd, t: bt,
        slots: Math.max(0, parseInt(be.slots, 10) || 0),
        goal: bg
      });
    }
  }
  s.boardLog = boardLog;

  /* 스티커 사용 기록 */
  var spends = [];
  var spendSeen = {};
  if (Object.prototype.toString.call(s.stickerSpends) === '[object Array]') {
    for (var sp = 0; sp < s.stickerSpends.length && sp < 3000; sp++) {
      var se2 = s.stickerSpends[sp] || {};
      var spT = Number(se2.t);
      var spD = (typeof se2.d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(se2.d)) ? se2.d : (spT ? dateKey(new Date(spT)) : '');
      if (!spD || !spT) continue;
      var cnt = parseInt(se2.count, 10);
      if (isNaN(cnt) || cnt <= 0) continue;
      var spendOne = {
        /* 이름표가 없으면 읽을 때마다 새로 만들지 않고 고정 이름표를 붙여요 */
        id: (typeof se2.id === 'string' && se2.id) ? se2.id : spendFixedId(spT, cnt),
        d: spD, t: spT,
        item: (typeof se2.item === 'string' ? se2.item : '').slice(0, 40),
        count: cnt,
        amount: Math.max(0, parseInt(se2.amount, 10) || (cnt * s.sticker.unit)),
        by: (typeof se2.by === 'string') ? se2.by.slice(0, 24) : ''
      };
      /* 이름표만 달라 겹쳐 들어간 같은 기록은 하나만 남겨요 */
      var spendSg = spendSig(spendOne);
      if (spendSeen[spendSg]) continue;
      spendSeen[spendSg] = true;
      spends.push(spendOne);
    }
  }
  s.stickerSpends = spends;

  /* 지운 사용 기록 표시 · 마지막으로 저장소에 올린 시각 */
  var dels = {};
  if (s.deletedSpends && typeof s.deletedSpends === 'object' && Object.prototype.toString.call(s.deletedSpends) !== '[object Array]') {
    var dn = 0;
    for (var dk in s.deletedSpends) {
      if (!Object.prototype.hasOwnProperty.call(s.deletedSpends, dk)) continue;
      if (dn++ > 2000) break;
      var dat = Number(s.deletedSpends[dk]) || 0;
      if (!dat || !/^(id|sig):/.test(dk) || dk.length > 80) continue;
      dels[dk] = dat;
    }
  }
  s.deletedSpends = dels;
  s.spendSyncAt = Math.max(0, Number(s.spendSyncAt) || 0);

  /* 문제지 목록 */
  var wbs = [];
  if (Object.prototype.toString.call(s.workbooks) === '[object Array]') {
    for (var wi = 0; wi < s.workbooks.length && wi < 24; wi++) {
      var wb = s.workbooks[wi] || {};
      if (typeof wb.name !== 'string' || !wb.name.trim()) continue;
      wbs.push({ id: (typeof wb.id === 'string' && wb.id) ? wb.id : uid('wb'), name: wb.name.trim().slice(0, 24) });
    }
  }
  s.workbooks = wbs.length ? wbs : d.workbooks.slice(0);

  /* 문제지 선택 기록 */
  var picks = {};
  if (s.workbookPicks && typeof s.workbookPicks === 'object') {
    for (var pk in s.workbookPicks) {
      if (!Object.prototype.hasOwnProperty.call(s.workbookPicks, pk)) continue;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(pk)) continue;
      picks[pk] = cleanPick(s.workbookPicks[pk]);
    }
  }
  s.workbookPicks = picks;

  /* '문제지 풀기' 항목별 문제지 선택 기록 (날짜 → 항목 → 선택) */
  var itemPicks = {};
  if (s.workbookItemPicks && typeof s.workbookItemPicks === 'object') {
    for (var ipk in s.workbookItemPicks) {
      if (!Object.prototype.hasOwnProperty.call(s.workbookItemPicks, ipk)) continue;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(ipk)) continue;
      var perItem = s.workbookItemPicks[ipk];
      if (!perItem || typeof perItem !== 'object') continue;
      var oneDay = {};
      var ipn = 0;
      for (var ipid in perItem) {
        if (!Object.prototype.hasOwnProperty.call(perItem, ipid)) continue;
        if (typeof ipid !== 'string' || !ipid) continue;
        oneDay[ipid.slice(0, 64)] = cleanPick(perItem[ipid]);
        if (++ipn >= 40) break;
      }
      itemPicks[ipk] = oneDay;
    }
  }
  s.workbookItemPicks = itemPicks;

  /* 섹션 순서 */
  var order = [];
  var rawOrder = (Object.prototype.toString.call(s.layoutOrder) === '[object Array]') ? s.layoutOrder : [];
  for (var oi = 0; oi < rawOrder.length; oi++) {
    var key4 = rawOrder[oi];
    if (SEC_IDS.indexOf(key4) >= 0 && order.indexOf(key4) < 0) order.push(key4);
  }
  for (var sj = 0; sj < SEC_IDS.length; sj++) if (order.indexOf(SEC_IDS[sj]) < 0) order.push(SEC_IDS[sj]);
  s.layoutOrder = order;

  /* DIY 섹션·블록 조립 설정 — 없으면 예전 이름·순서에서 그대로 옮겨요 */
  s.settings.dashboardSections = normalizeSections(s);
  syncSectionMirrors(s);

  if (!s.dayUpdated || typeof s.dayUpdated !== 'object') s.dayUpdated = {};
  var duKeys = [];
  for (var duk in s.dayUpdated) { if (Object.prototype.hasOwnProperty.call(s.dayUpdated, duk)) duKeys.push(duk); }
  for (var dun = 0; dun < duKeys.length; dun++) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(duKeys[dun]) || typeof s.dayUpdated[duKeys[dun]] !== 'string') delete s.dayUpdated[duKeys[dun]];
  }

  /* Phase 2: 펫·코인·방·아바타는 계정별 프로필(config/profiles/{id}.json)에 있어요.
     예전 공용 펫 기록은 첫 프로필로 옮길 수 있게 보관만 합니다. */
  if (s.pet && typeof s.pet === 'object') legacyPetSeed = s.pet;
  delete s.pet;
  s.profile = null;
  if (!s.shop || typeof s.shop !== 'object' || Object.prototype.toString.call(s.shop.items) !== '[object Array]' || !s.shop.items.length) {
    s.shop = { items: defaultShopItems() };
  } else {
    /* 저장된 상점 아이콘 중 윈도우 10에서 깨지는 이모지만 안전한 이모지로 바꿔요 */
    for (var shi = 0; shi < s.shop.items.length; shi++) {
      var shIt = s.shop.items[shi];
      if (shIt && typeof shIt.icon === 'string' && EMOJI_FIX[shIt.icon]) shIt.icon = EMOJI_FIX[shIt.icon];
    }
  }

  var totalSt = parseInt(s.stats && s.stats.stickersTotal, 10);
  if (isNaN(totalSt) || totalSt < 0) totalSt = stickLog.length || s.sticker.stickers.length;
  s.stats = { stickersTotal: totalSt };

  pruneChecks(s);
  pruneHistory(s);
  return s;
}

function pruneChecks(s) {
  var keys = [];
  for (var k in s.checks) { if (Object.prototype.hasOwnProperty.call(s.checks, k)) keys.push(k); }
  var now = Date.now();
  for (var i = 0; i < keys.length; i++) {
    var parts = keys[i].split('-');
    if (parts.length !== 3) { delete s.checks[keys[i]]; continue; }
    var t = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])).getTime();
    if (isNaN(t) || (now - t) > 30 * 86400000) delete s.checks[keys[i]];
  }
}

function loadState() {
  var raw = null;
  try { raw = window.localStorage.getItem(STORE_KEY); } catch (e) { raw = null; }
  if (!raw) return defaultState();
  try { return normalize(JSON.parse(raw)); } catch (e) { return defaultState(); }
}

function saveState() {
  try { onProfileChanged(); } catch (e) { /* 프로필 저장 실패는 무시 */ }
  try { snapshotDay(currentKey); } catch (e) { /* 기록 갱신 실패는 무시 */ }
  try { pruneHistory(state); } catch (e) { /* 무시 */ }
  try { window.localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* 저장 공간 부족 등은 무시 */ }
  if (cloud && cloud.me) {
    var sig = settingsSignature();
    if (sig !== cloud.lastSig) { cloud.lastSig = sig; scheduleSync('settings'); }
    scheduleSync('day');
  }
}

function saveLocalOnly() {
  try { window.localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* 무시 */ }
}

/* 고친 내용을 서버에 '바로' 올려요 — 900ms 디바운스를 기다리지 않아요.
   · 저장 버튼을 누르면 이 기기와 다른 기기(아이 태블릿·엄마 폰)에 거의 동시에 보여요.
   · 올리지 못하면(인터넷 끊김 등) 토스트로 알려 주고, 다음 저장 때 다시 올려요. */
var pushNoticeAt = 0;
function pushNow() {
  if (!cloud || !cloud.conn || !cloud.me) return;
  try {
    var p = flushSync();
    if (p && p.then) {
      p.then(function () {
        if (cloud.lastError && Date.now() - pushNoticeAt > 5000) {
          pushNoticeAt = Date.now();
          showToast('☁️ 저장을 서버에 바로 못 올렸어요. 인터넷을 확인하면 다시 올려요.');
        }
      }, function () { /* 무시 */ });
    }
  } catch (e) { /* 무시 */ }
}
function saveAndPush() {
  saveState();
  pushNow();
}

/* ============ 사운드 ============ */
function snd(kind) {
  if (!state.settings.soundOn) return;
  try {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!audioCtx) audioCtx = new AC();
    if (audioCtx.state !== 'running') {
      if (audioCtx.resume) audioCtx.resume();
      if (!snd.retry) { snd.retry = 1; window.setTimeout(function () { snd.retry = 0; snd(kind); }, 140); }
      return;
    }
    var t0 = audioCtx.currentTime;
    var notes;
    if (kind === 'check') notes = [[660, 0], [880, 0.08]];
    else if (kind === 'uncheck') notes = [[400, 0]];
    else if (kind === 'sticker') notes = [[700, 0], [920, 0.07], [1180, 0.14]];
    else if (kind === 'win') notes = [[523, 0], [659, 0.1], [784, 0.2], [1046, 0.3]];
    else if (kind === 'chime') notes = [[784, 0], [1046, 0.09], [1318, 0.18]];
    else notes = [[600, 0]];

    for (var i = 0; i < notes.length; i++) {
      var o = audioCtx.createOscillator();
      var g = audioCtx.createGain();
      var st = t0 + notes[i][1];
      o.type = 'sine';
      o.frequency.setValueAtTime(notes[i][0], st);
      g.gain.setValueAtTime(0.0001, st);
      g.gain.exponentialRampToValueAtTime(0.13, st + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, st + 0.17);
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start(st);
      o.stop(st + 0.22);
    }
  } catch (e) { /* 소리는 없어도 괜찮아요 */ }
}

/* ============ 축하 효과 ============ */
function confetti(n, originEl) {
  var layer = document.getElementById('fx');
  if (!layer) return;
  var r;
  if (originEl && originEl.getBoundingClientRect) {
    r = originEl.getBoundingClientRect();
  } else {
    r = { left: window.innerWidth / 2, top: window.innerHeight * 0.34, width: 0, height: 0 };
  }
  var cx = r.left + r.width / 2;
  var cy = r.top + r.height / 2;
  for (var i = 0; i < n; i++) {
    var p = document.createElement('span');
    p.className = 'confetti';
    p.textContent = CONF[Math.floor(Math.random() * CONF.length)];
    p.style.left = cx + 'px';
    p.style.top = cy + 'px';
    p.style.fontSize = (13 + Math.random() * 16).toFixed(0) + 'px';
    p.style.setProperty('--dx', ((Math.random() - 0.5) * 320).toFixed(0) + 'px');
    p.style.setProperty('--dy', (-90 - Math.random() * 220).toFixed(0) + 'px');
    p.style.setProperty('--rot', ((Math.random() - 0.5) * 900).toFixed(0) + 'deg');
    p.style.animationDelay = (Math.random() * 0.12).toFixed(2) + 's';
    layer.appendChild(p);
    (function (node) {
      window.setTimeout(function () {
        if (node.parentNode) node.parentNode.removeChild(node);
      }, 2400);
    })(p);
  }
}

/* ============ 날짜 / 진행률 ============ */
function checksFor(key) {
  if (!state.checks[key]) state.checks[key] = {};
  return state.checks[key];
}
function findCat(id) {
  for (var i = 0; i < state.categories.length; i++) {
    if (state.categories[i].id === id) return state.categories[i];
  }
  return null;
}
function counts() {
  var ck = checksFor(currentKey);
  var dow = keyDayIndex(currentKey);
  var total = 0;
  var done = 0;
  for (var i = 0; i < state.categories.length; i++) {
    var cat = state.categories[i];
    if (!activeDay(cat, dow)) continue;
    for (var j = 0; j < cat.items.length; j++) {
      total++;
      if (ck[cat.items[j].id]) done++;
    }
  }
  return { total: total, done: done };
}

/* ============ 헤더 ============ */
function renderHeader() {
  var name = String(state.settings.childName || '').trim();
  var greet = String(state.settings.greeting || '').trim();
  var title;
  if (name && greet) title = vocative(name) + ', ' + greet;
  else if (name) title = vocative(name) + '!';
  else title = greet || '안녕! 👋';

  var el = document.getElementById('helloTitle');
  if (el) el.textContent = title;
  /* 탭 제목은 항상 "jadenfamily" — 링크 미리보기(카카오톡 등)와 통일 */

  renderSoundBtn();
  renderCoinBadge();
  renderLevelBadges();
  updateClock(new Date());
}

function setBtnLabel(btn, icon, label) {
  if (!btn) return;
  var bi = btn.querySelector('.bi'), bl = btn.querySelector('.bl');
  if (bi && bl) { bi.textContent = icon; bl.textContent = label; }
  else btn.textContent = icon + ' ' + label;
}

function renderSoundBtn() {
  var b = document.getElementById('soundBtn');
  if (!b) return;
  var on = state.settings.soundOn;
  b.textContent = on ? '🔔' : '🔕';
  b.setAttribute('aria-label', on ? '소리 끄기' : '소리 켜기');
  b.setAttribute('aria-pressed', on ? 'true' : 'false');
  b.title = on ? '소리 끄기' : '소리 켜기';
}

function updateClock(now) {
  var dateEl = document.getElementById('dateLine');
  var clockEl = document.getElementById('clockLine');
  if (dateEl) dateEl.textContent = fmtDate(now);
  if (clockEl) clockEl.textContent = fmtClock(now);
}

/* ======================================================================
   Phase 2 — 계정별 프로필 · 코인 · 펫 케어 · 54종 도감 · 2.5D 마이룸 ·
              아바타 · 상점(관리자 편집)
   ====================================================================== */
var PROFILE_PREFIX = 'kidsDashboard.profile.v1.';
var legacyPetSeed = null;   /* 예전 settings.json의 공용 펫 기록 (첫 프로필로 이사) */
var COIN_CHECK = 10;      /* 루틴 하나 체크 */
var COIN_GROUP = 20;      /* 루틴 그룹 완료 보너스 */
var COIN_STICKER = 10;    /* 칭찬 스티커 */
var COIN_START = 120;     /* 새 계정 시작 코인 */
var COIN_MAX = 999999999;  /* 코인 상한 — 사실상 무제한 (입력·잔액 모두 여기까지만 잘라요) */
/* ⭐ 아바타 경험치(EXP) — 코인을 받는 일을 하면 함께 쌓여요 */
var XP_CHECK = 10;        /* 루틴 체크 · 문제지 완료 · 역할 체크 */
var XP_MISSION = 15;      /* 특별 미션 칸 체크 */
var XP_STICKER = 15;      /* 칭찬 스티커 한 장 */
var ACH_MAX = 40;         /* 업적 최대 개수 */
var ACH_NAME_MAX = 16, ACH_DESC_MAX = 40, ACH_GOAL_MAX = 999, ACH_REWARD_MAX = 999;
var ACH_KIND_LABEL = {
  routine: '루틴 체크', workbook: '문제지 완료', sticker: '칭찬 스티커', mission: '특별 미션',
  role: '역할 체크', level: '아바타 레벨', pet: '펫 부화', manual: '직접 완료'
};
var ACH_KIND_UNIT = { routine: '번', workbook: '번', sticker: '장', mission: '번', role: '번', level: 'Lv', pet: '마리', manual: '' };
var ACH_EMOJI = ['🏆', '🥇', '🏅', '👑', '⭐', '🌟', '🎯', '🏹', '📚', '🎓', '🔥', '💪', '🚀', '🛸', '🥚', '🐣', '🌈', '🍀', '💎', '🎖️'];
var HATCH_MS = 24 * 60 * 60 * 1000;  /* 새 알 기본 부화 시간 24시간 (🎛️ hatchHours 변수로 바뀌어요) */
var EXP_MAX = 100;        /* 단계마다 필요한 경험치 (🎛️ expMax 변수로 바뀌어요) */

PET_NEED = [EXP_MAX, EXP_MAX, EXP_MAX];

/* 🎛️ 변수 설정 값 → 실제 규칙에 쓰는 값.
   renderAll()·설정 수신·변수 수정 때마다 다시 맞춰서 화면과 계산이 늘 같게 해요. */
function applyVars() {
  var v = varsOf(state);
  /* 스티커 금액·칸 수는 화면(state.sticker)이 기준이에요 — 변수 화면에는 같은 값을 비춰 줘요 */
  if (state.sticker) {
    if (state.sticker.unit) v.stickerUnit = clampVarValue('stickerUnit', state.sticker.unit);
    if (state.sticker.slots) {
      var keepSlots = Math.max(state.sticker.slots, (state.sticker.stickers || []).length);
      v.stickerSlots = clampVarValue('stickerSlots', keepSlots);
    }
  }
  COIN_CHECK = v.coinCheck;
  COIN_GROUP = v.coinGroup;
  COIN_STICKER = v.coinSticker;
  COIN_START = v.coinStart;
  PET_DRAW_COST = v.petDrawCost;
  EXP_MAX = v.expMax;
  PET_NEED = [EXP_MAX, EXP_MAX, EXP_MAX];
  HATCH_MS = v.hatchHours * 60 * 60 * 1000;
  var a = v.alertFirstMin, b = v.alertSecondMin;
  TAM_MARKS = (a === b) ? [a] : ((a > b) ? [a, b] : [b, a]);
}

var RARITY = [
  { id: 'common', label: '일반', color: '#94a3b8' },
  { id: 'rare', label: '희귀', color: '#3d9be9' },
  { id: 'legend', label: '전설', color: '#f0a500' }
];

function mixHex(a, b, t) {
  t = Math.max(0, Math.min(1, t == null ? 0.5 : t));
  var ha = String(a || '#999999').replace('#', '');
  var hb = String(b || '#ffffff').replace('#', '');
  var out = '#';
  for (var i = 0; i < 3; i++) {
    var va = parseInt(ha.substr(i * 2, 2), 16);
    var vb = parseInt(hb.substr(i * 2, 2), 16);
    if (isNaN(va)) va = 153;
    if (isNaN(vb)) vb = 255;
    var v = Math.round(va + (vb - va) * t);
    out += ('0' + v.toString(16)).slice(-2);
  }
  return out;
}

/* ---------------- 프로필 접근 ---------------- */
function prof() {
  if (!state.profile || typeof state.profile !== 'object') state.profile = defaultProfile();
  var p = state.profile;
  if (!p.room || typeof p.room !== 'object' || Object.prototype.toString.call(p.room.floors) !== '[object Array]' || !p.room.floors.length) p.room = defaultRoom();
  if (!p.award || typeof p.award !== 'object') p.award = { day: '', checks: {}, groups: {}, stickers: 0, refunded: {} };
  if (!p.award.refunded || typeof p.award.refunded !== 'object') p.award.refunded = {};
  if (p.award.day !== currentKey) p.award = { day: currentKey, checks: {}, groups: {}, stickers: 0, refunded: {} };
  if (p.xp == null) p.xp = 0;
  if (p.level == null) p.level = 1;
  if (!p.progress || typeof p.progress !== 'object') p.progress = { routine: 0, workbook: 0, sticker: 0, mission: 0, role: 0, pet: 0 };
  if (!p.ach || typeof p.ach !== 'object') p.ach = { done: {} };
  if (!p.ach.done || typeof p.ach.done !== 'object') p.ach.done = {};
  return p;
}

function normalizeProfile(raw, userId) {
  var d = defaultProfile();
  var p = (raw && typeof raw === 'object') ? clone(raw) : {};
  var out = {
    v: 1,
    clearedAt: Number(p.clearedAt) || 0,
    coins: (p.coins == null) ? d.coins : Math.max(0, Math.min(COIN_MAX, parseInt(p.coins, 10) || 0)),
    pet: d.pet,
    bag: {},
    owned: {},
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
    updatedAt: (typeof p.updatedAt === 'string' && p.updatedAt) ? p.updatedAt : new Date().toISOString(),
    userId: userId || ''
  };

  /* ---- 펫 ---- */
  var rp = (p.pet && typeof p.pet === 'object') ? p.pet : {};
  var pet = d.pet;
  if (typeof rp.currentEgg === 'string' && speciesById(rp.currentEgg).id === rp.currentEgg) pet.currentEgg = rp.currentEgg;
  var st = parseInt(rp.stage, 10);
  pet.stage = (isNaN(st) || st < 0) ? 0 : Math.min(st, 3);
  var ex = parseInt(rp.exp, 10);
  pet.exp = (isNaN(ex) || ex < 0) ? 0 : Math.min(ex, EXP_MAX);
  if (pet.stage >= 3) pet.exp = 0;
  var ha = Number(rp.hatchAt);
  pet.hatchAt = (ha && !isNaN(ha)) ? ha : 0;
  var hat = Number(rp.hatchedAt);
  pet.hatchedAt = (hat && !isNaN(hat)) ? hat : 0;
  if (pet.stage === 0 && !pet.hatchAt) pet.hatchAt = Date.now() + HATCH_MS;
  if (pet.stage > 0) pet.hatchAt = 0;
  var col = [];
  var rawCol = (Object.prototype.toString.call(rp.collection) === '[object Array]') ? rp.collection : [];
  for (var i = 0; i < rawCol.length && col.length < SPECIES_MAX; i++) {
    var cc = rawCol[i];
    var cid = (typeof cc === 'string') ? cc : (cc && cc.id);
    if (typeof cid !== 'string' || speciesById(cid).id !== cid) continue;
    var dup = false;
    for (var j = 0; j < col.length; j++) if (col[j].id === cid) dup = true;
    if (dup) continue;
    col.push({ id: cid, at: (cc && Number(cc.at)) || Date.now() });
  }
  pet.collection = col;
  var art = {};
  if (rp.art && typeof rp.art === 'object') {
    for (var sid in rp.art) {
      if (!own(rp.art, sid) || speciesById(sid).id !== sid) continue;
      var box = rp.art[sid];
      if (!box || typeof box !== 'object') continue;
      var clean = {};
      for (var stg in box) {
        if (!own(box, stg) || !/^[0-3]$/.test(stg)) continue;
        var u = String(box[stg] || '');
        if (petArtOk(u)) clean[stg] = u;
      }
      if (clean['0'] || clean['1'] || clean['2'] || clean['3']) art[sid] = clean;
    }
  }
  pet.art = art;
  /* 친구 한 마리마다 자기 id·종족·단계·경험치를 가지고 있어요 (여러 마리 키우기) */
  pet.id = (typeof rp.id === 'string' && rp.id) ? rp.id.slice(0, 40) : petNewId();
  pet.speciesId = pet.currentEgg;
  pet.xp = pet.exp;
  pet.gotAt = Number(rp.gotAt) || 0;
  out.pet = pet;

  /* 내 펫 목록 — 지금 키우는 친구(out.pet)는 목록에서 빼고 나머지만 담아요 */
  var petList = [];
  var rawPets = (Object.prototype.toString.call(p.pets) === '[object Array]') ? p.pets : [];
  for (var pi = 0; pi < rawPets.length && petList.length < 80; pi++) {
    var onePet = petCleanInstance(rawPets[pi]);
    if (!onePet || onePet.id === pet.id) continue;
    var dupPet = false;
    for (var pj = 0; pj < petList.length; pj++) if (petList[pj].id === onePet.id) dupPet = true;
    if (dupPet) continue;
    petList.push(onePet);
  }
  out.pets = petList;
  out.activePetId = pet.id;
  out.runnerPetId = (typeof p.runnerPetId === 'string') ? p.runnerPetId : '';

  /* ---- 가방(먹이·부화권) ---- */
  if (p.bag && typeof p.bag === 'object') {
    for (var bid in p.bag) {
      if (!own(p.bag, bid)) continue;
      if (['egg_vit', 'hatch_blanket', 'hatch_incubator', 'hatch_potion'].indexOf(bid) >= 0) continue;
      var n = parseInt(p.bag[bid], 10);
      if (isNaN(n) || n <= 0) continue;
      out.bag[bid] = Math.min(99, n);
    }
  }

  /* ---- 보유 아이템(가구·벽지·옷) ---- */
  var all = shopAll();
  var known = {};
  for (var ai = 0; ai < all.length; ai++) known[all[ai].id] = all[ai];
  for (var did in d.owned) if (own(d.owned, did)) out.owned[did] = 1;
  if (p.owned && typeof p.owned === 'object') {
    for (var oid in p.owned) {
      if (!own(p.owned, oid) || !p.owned[oid]) continue;
      var it = known[oid];
      if (!it) continue;
      if (it.kind === 'exp' || it.kind === 'egg' || it.kind === 'hatch') continue;   /* 가방 아이템은 소유 목록에 넣지 않아요 */
      out.owned[oid] = 1;
    }
  }

  /* ---- 마이룸 (층마다 컨셉·크기·벽지·가구·벽 장식) ---- */
  var rr = (p.room && typeof p.room === 'object') ? p.room : {};

  function normPets(rawList, col, pet, maxN) {
    var out2 = [];
    var cap = Math.max(1, parseInt(maxN, 10) || roomPetMax(1));
    var raw3 = (Object.prototype.toString.call(rawList) === '[object Array]') ? rawList : [];
    for (var pj = 0; pj < raw3.length && out2.length < cap; pj++) {
      var pid2 = raw3[pj];
      if (typeof pid2 !== 'string') continue;
      var have2 = false;
      for (var pk2 = 0; pk2 < col.length; pk2++) if (col[pk2].id === pid2) have2 = true;
      /* 아직 자라는 중인 친구(부화 직후)도 방에 놀 수 있어요 */
      if (!have2 && pet.stage >= 1 && pet.currentEgg === pid2) have2 = true;
      /* 내 펫 목록에서 부화한 친구도 새로고침 뒤에도 방에 남아 있어요 */
      if (!have2 && out && out.pets) {
        for (var pk3 = 0; pk3 < out.pets.length; pk3++) {
          if (out.pets[pk3] && out.pets[pk3].stage >= 1 && out.pets[pk3].currentEgg === pid2) { have2 = true; break; }
        }
      }
      if (have2 && out2.indexOf(pid2) < 0) out2.push(pid2);
    }
    return out2;
  }

  function normFloor(rawF, num, withDefaultItems) {
    var f = defaultFloorRoom(num);
    var src = (rawF && typeof rawF === 'object') ? rawF : {};
    var sz = parseInt(src.size, 10);
    f.size = (sz >= 1 && sz <= 3) ? sz : 1;
    var N = roomN(f.size);
    if (typeof src.theme === 'string' && THEMES[src.theme]) f.theme = src.theme;
    if (typeof src.wall === 'string' && known[src.wall] && known[src.wall].kind === 'wall') f.wall = src.wall;
    if (!out.owned[f.wall]) f.wall = 'wall_cream';
    /* 가구 */
    var items = [];
    var rawItems = (Object.prototype.toString.call(src.items) === '[object Array]') ? src.items : null;
    for (var ri = 0; rawItems && ri < rawItems.length && items.length < 60; ri++) {
      var rIt = rawItems[ri] || {};
      var def = known[rIt.id];
      if (!def || def.kind !== 'furni' || !out.owned[rIt.id]) continue;
      var fx = parseInt(rIt.x, 10), fy = parseInt(rIt.y, 10);
      if (isNaN(fx) || isNaN(fy)) continue;
      fx = Math.max(0, Math.min(N - (def.w || 1), fx));
      fy = Math.max(0, Math.min(N - (def.d || 1), fy));
      items.push({ u: (typeof rIt.u === 'string' && rIt.u) ? rIt.u : uid('rm'), id: rIt.id, x: fx, y: fy });
    }
    /* 방 기록이 아예 없으면(새 계정·초기화) 기본 가구를 놓아 둔 상태로 시작해요.
       빈 배열이면 아이가 일부러 다 치운 것으로 보고 그대로 둡니다. */
    if (rawItems) f.items = items;
    else if (withDefaultItems) f.items = defaultRoom().floors[0].items;
    /* 벽 장식 */
    var wid = [];
    var rawW = (Object.prototype.toString.call(src.wallItems) === '[object Array]') ? src.wallItems : [];
    var usedSlot = {};
    for (var wi = 0; wi < rawW.length && wid.length < 10; wi++) {
      var wIt = rawW[wi] || {};
      var wd = known[wIt.id];
      if (!wd || wd.kind !== 'decor' || !out.owned[wIt.id]) continue;
      var side = (wIt.side === 'L') ? 'L' : 'R';
      var slot = parseInt(wIt.slot, 10);
      if (isNaN(slot) || slot < 0 || slot >= wallSlotCount(f.size)) continue;
      if (usedSlot[side + slot]) continue;
      usedSlot[side + slot] = 1;
      wid.push({ u: (typeof wIt.u === 'string' && wIt.u) ? wIt.u : uid('wd'), id: wIt.id, side: side, slot: slot });
    }
    f.wallItems = wid;
    /* 친구 */
    f.pets = normPets(src.pets, col, pet, roomPetMax(f.size));
    var rawPos = (src.avatarPos && typeof src.avatarPos === 'object') ? src.avatarPos : null;
    var apx = rawPos ? Number(rawPos.x) : NaN, apy = rawPos ? Number(rawPos.y) : NaN;
    f.avatarPos = {
      x: isFinite(apx) ? Math.max(0.5, Math.min(N - 0.5, Math.round(apx * 100) / 100)) : Math.min(3.1, N - 0.5),
      y: isFinite(apy) ? Math.max(0.5, Math.min(N - 0.5, Math.round(apy * 100) / 100)) : Math.min(3.5, N - 0.5)
    };
    return f;
  }

  var floors = [];
  var srcFloors = (Object.prototype.toString.call(rr.floors) === '[object Array]') ? rr.floors : null;
  if (srcFloors && srcFloors.length) {
    for (var fi = 0; fi < srcFloors.length && floors.length < ROOM_MAX_FLOORS; fi++) {
      floors.push(normFloor(srcFloors[fi], floors.length + 1, floors.length === 0));
    }
  } else {
    /* 옛 단일 방(room.wall·room.items·room.pets) → 1층으로 옮겨요 */
    floors.push(normFloor(rr, 1, true));
    if (Object.prototype.toString.call(rr.pets) === '[object Array]') floors[0].pets = normPets(rr.pets, col, pet, roomPetMax(floors[0].size));
  }
  var room = defaultRoom();
  room.floors = floors;
  var act = parseInt(rr.active, 10) || 1;
  var hasAct = false;
  for (var fk = 0; fk < floors.length; fk++) if (floors[fk].n === act) hasAct = true;
  room.active = hasAct ? act : floors[0].n;
  roomMirrorFor(room);
  out.room = room;

  /* ---- 아바타 ---- */
  var ra = (p.avatar && typeof p.avatar === 'object') ? p.avatar : {};
  var av = defaultAvatar();
  var skinOk = false, hcOk = false;
  for (var si = 0; si < AV_SKINS.length; si++) if (AV_SKINS[si].id === ra.skin) skinOk = true;
  for (var hi = 0; hi < AV_HAIR_COLORS.length; hi++) if (AV_HAIR_COLORS[hi].id === ra.hairColor) hcOk = true;
  if (skinOk) av.skin = ra.skin;
  if (hcOk) av.hairColor = ra.hairColor;
  av.gender = (ra.gender === 'girl') ? 'girl' : 'boy';
  var slots = ['hair', 'hat', 'top', 'bottom', 'shoes', 'acc', 'face', 'pose'];
  for (var sl = 0; sl < slots.length; sl++) {
    var key = slots[sl];
    var val = ra[key];
    if (typeof val !== 'string' || !val) continue;
    var item = known[val];
    if (!item || item.kind !== 'cloth' || item.slot !== key) continue;
    if (!out.owned[val] && !(item.price <= 0)) continue;
    av[key] = val;
  }
  if (!av.face) av.face = AV_FACE_DEFAULT;
  if (!av.pose) av.pose = AV_POSE_DEFAULT;
  /* 옛 프로필: 모자를 액세서리 칸에 쓰고 있었다면 모자 칸으로 옮겨요 */
  if (!av.hat && typeof ra.acc === 'string' && ra.acc) {
    var oldAcc = known[ra.acc];
    if (oldAcc && oldAcc.kind === 'cloth' && oldAcc.slot === 'hat' && out.owned[ra.acc]) av.hat = ra.acc;
  }
  out.avatar = av;

  /* ---- ⭐ 경험치 · 레벨 · 업적 ---- */
  var rxp = parseInt(p.xp, 10);
  out.xp = (isNaN(rxp) || rxp < 0) ? 0 : Math.min(rxp, 99999999);
  var rlv = parseInt(p.level, 10);
  out.level = (isNaN(rlv) || rlv < 1) ? 1 : Math.min(rlv, 999);
  var rpg = (p.progress && typeof p.progress === 'object') ? p.progress : {};
  var progKeys = ['routine', 'workbook', 'sticker', 'mission', 'role', 'pet'];
  for (var pki = 0; pki < progKeys.length; pki++) {
    var pv = parseInt(rpg[progKeys[pki]], 10);
    out.progress[progKeys[pki]] = (isNaN(pv) || pv < 0) ? 0 : Math.min(pv, 999999);
  }
  var rAch = (p.ach && typeof p.ach === 'object' && p.ach.done && typeof p.ach.done === 'object') ? p.ach.done : {};
  var achN = 0;
  for (var ak in rAch) {
    if (!own(rAch, ak) || !rAch[ak] || achN >= 200) continue;
    if (!/^ach-[A-Za-z0-9_-]{1,32}$/.test(ak)) continue;
    var atv = Number(rAch[ak] && rAch[ak].at);
    out.ach.done[ak] = { at: (atv && !isNaN(atv)) ? atv : Date.now() };
    achN += 1;
  }

  /* ---- 코인 기록 (용돈 주기 · 빼기 · 직접 맞추기) ---- */
  var an = [];
  var rawAn = (Object.prototype.toString.call(p.allowanceNotices) === '[object Array]') ? p.allowanceNotices : [];
  for (var ani = 0; ani < rawAn.length && an.length < 30; ani++) {
    var nn = rawAn[ani];
    if (!nn || typeof nn !== 'object') continue;
    var amt = parseInt(nn.amount, 10);
    var md = (nn.mode === 'sub' || nn.mode === 'set') ? nn.mode : 'give';
    if (isNaN(amt)) continue;
    /* 맞추기는 0만큼 바뀔 수도 있어요(같은 값으로 맞춤) — 그 기록은 남겨요 */
    if (!amt && md !== 'set') continue;
    var bf = parseInt(nn.before, 10), af = parseInt(nn.after, 10);
    an.push({
      id: (typeof nn.id === 'string' && nn.id) ? nn.id : ('al' + ani),
      at: Number(nn.at) || 0,
      amount: Math.max(-COIN_MAX, Math.min(COIN_MAX, amt)),
      mode: md,
      before: isNaN(bf) ? 0 : Math.max(0, Math.min(COIN_MAX, bf)),
      after: isNaN(af) ? 0 : Math.max(0, Math.min(COIN_MAX, af)),
      reason: String(nn.reason == null ? '' : nn.reason).slice(0, 60),
      from: String(nn.from == null ? '' : nn.from).slice(0, 40),
      fromName: String(nn.fromName == null ? '' : nn.fromName).slice(0, 20),
      read: !!nn.read
    });
  }
  out.allowanceNotices = an.slice(-30);

  /* ---- 오늘의 코인 기록 ---- */
  if (p.award && typeof p.award === 'object') {
    var day = (typeof p.award.day === 'string') ? p.award.day : '';
    if (day === currentKey) {
      out.award.day = day;
      if (p.award.checks && typeof p.award.checks === 'object') {
        for (var ck in p.award.checks) if (own(p.award.checks, ck) && p.award.checks[ck]) out.award.checks[ck] = 1;
      }
      if (p.award.groups && typeof p.award.groups === 'object') {
        for (var gk in p.award.groups) if (own(p.award.groups, gk) && p.award.groups[gk]) out.award.groups[gk] = 1;
      }
      out.award.stickers = Math.max(0, parseInt(p.award.stickers, 10) || 0);
      if (p.award.refunded && typeof p.award.refunded === 'object') {
        out.award.refunded = {};
        for (var rk in p.award.refunded) if (own(p.award.refunded, rk) && p.award.refunded[rk]) out.award.refunded[rk] = 1;
      }
    }
  }

  /* ---- 다른 기기 스티커에 준 코인 기록 (하루가 지나도 남아야 두 번 안 줘요) ---- */
  if (p.stickerCoin && typeof p.stickerCoin === 'object' && p.stickerCoin.seen && typeof p.stickerCoin.seen === 'object') {
    var since = Number(p.stickerCoin.since);
    var scSeen = {};
    var scN = 0;
    for (var sk in p.stickerCoin.seen) {
      if (!own(p.stickerCoin.seen, sk) || !p.stickerCoin.seen[sk]) continue;
      if (scN >= 800) break;
      scSeen[String(sk).slice(0, 80)] = 1;
      scN += 1;
    }
    out.stickerCoin = { since: (since && !isNaN(since)) ? since : 0, seen: scSeen };
  }
  return out;
}

function profilePath(userId) {
  return 'config/profiles/' + String(userId || '').replace(/[^A-Za-z0-9_-]/g, '') + '.json';
}
function profileCacheKey(userId) {
  return PROFILE_PREFIX + String(userId || '').replace(/[^A-Za-z0-9_-]/g, '');
}
function readProfileCache(userId) {
  try {
    var raw = window.localStorage.getItem(profileCacheKey(userId));
    if (!raw) return null;
    var o = JSON.parse(raw);
    return (o && typeof o === 'object') ? o : null;
  } catch (e) { return null; }
}
function writeProfileCache(userId, profile) {
  if (!userId || !profile) return;
  try { window.localStorage.setItem(profileCacheKey(userId), JSON.stringify(profile)); } catch (e) { /* 무시 */ }
}

/* ---------------- 코인 ---------------- */
/* 🪙 이모지는 아이폰·윈도우에서 돌멩이처럼 보여서, 반짝이는 금동전 SVG로 그려요. */
function coinSvg(cls) {
  return '<svg class="coin-ico' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<circle cx="12" cy="12" r="11.4" fill="url(#coinRim)"/>' +
    '<circle cx="12" cy="12" r="9.3" fill="url(#coinGold)"/>' +
    '<circle cx="12" cy="12" r="6.5" fill="none" stroke="#c98b00" stroke-width="1" opacity=".45"/>' +
    '<text x="12" y="15.4" text-anchor="middle" font-size="8.6" font-weight="900" fill="#a8690a" font-family="inherit">C</text>' +
    '<ellipse cx="8.4" cy="7.2" rx="3.2" ry="1.8" fill="#fffbe8" opacity=".8" transform="rotate(-30 8.4 7.2)"/>' +
    '</svg>';
}

function coinBalance() { return prof().coins; }

function coinAdd(n) {
  if (!n) return;
  var p = prof();
  p.coins = Math.max(0, Math.min(COIN_MAX, p.coins + n));
  p.updatedAt = new Date().toISOString();
  renderCoinBadge(n);
}

function renderCoinBadge(pop) {
  var el = document.getElementById('coinBadge');
  if (el) {
    var v = prof().coins;
    el.innerHTML = coinSvg() + ' <b>' + fmtNum(v) + '</b>';
    el.setAttribute('title', '내 코인 ' + fmtNum(v) + '개');
    if (pop) {
      var f = document.createElement('i');
      f.className = 'coin-pop' + (pop < 0 ? ' minus' : '');
      f.setAttribute('aria-hidden', 'true');
      f.textContent = (pop > 0 ? '+' : '') + pop;
      el.appendChild(f);
      window.setTimeout(function () { if (f.parentNode) f.parentNode.removeChild(f); }, 1100);
    }
  }
  var rc = document.getElementById('roomCoins');
  if (rc) rc.innerHTML = coinSvg() + ' ' + fmtNum(prof().coins);
  var sc = document.getElementById('shopCoins');
  if (sc) sc.innerHTML = coinSvg() + ' <b>' + fmtNum(prof().coins) + '</b>';
}

/* 오늘 처음 체크한 항목인지(first)를 같이 돌려줘요.
   코인은 풀었다 다시 체크해도 잔액이 정확히 돌아오지만, 안내 말풍선(+10 코인!)은
   처음 체크할 때만 띄워요. 두 번째부터 또 뜨면 코인을 또 받은 줄 알 수 있으니까요. */
function awardCheckCoins(itemId) {
  return awardCoinsOnce(itemId, COIN_CHECK);
}
function revokeCheckCoins(itemId) {
  return revokeCoinsOnce(itemId, COIN_CHECK);
}
/* 미션·역할 체크도 루틴 체크와 같은 방식으로 코인을 줘요.
   · 체크하면 정해진 코인을 주고, 풀면 돌려받아요(잔액이 정확히 돌아옴).
   · '이미 받은 코인' 표시는 지우지 않아서 풀었다 다시 채워도 새 코인은 없어요. */
function awardCoinsOnce(key, amount) {
  var n = Math.max(0, parseInt(amount, 10) || 0);
  if (!n || !key) return { coin: 0, first: false };
  var a = prof().award;
  if (!a.refunded || typeof a.refunded !== 'object') a.refunded = {};
  if (a.checks[key]) {
    if (a.refunded[key]) {
      delete a.refunded[key];
      coinAdd(n);
      return { coin: n, first: false };
    }
    return { coin: 0, first: false };
  }
  a.checks[key] = 1;
  coinAdd(n);
  return { coin: n, first: true };
}
function revokeCoinsOnce(key, amount) {
  var n = Math.max(0, parseInt(amount, 10) || 0);
  if (!n || !key) return 0;
  var a = prof().award;
  if (!a.checks[key]) return 0;
  if (!a.refunded || typeof a.refunded !== 'object') a.refunded = {};
  if (a.refunded[key]) return 0;
  a.refunded[key] = 1;
  coinAdd(-n);
  return -n;
}
function awardGroupCoins(catId) {
  var a = prof().award;
  if (a.groups[catId]) return 0;
  a.groups[catId] = 1;
  coinAdd(COIN_GROUP);
  return COIN_GROUP;
}
function awardStickerCoins() {
  prof().award.stickers += 1;
  coinAdd(COIN_STICKER);
}
function revokeStickerCoins() {
  var a = prof().award;
  if (a.stickers <= 0) return;
  a.stickers -= 1;
  coinAdd(-COIN_STICKER);
}

function keyToDate(key) {
  var p = String(key || '').split('-');
  if (p.length !== 3) return null;
  var y = parseInt(p[0], 10), m = parseInt(p[1], 10), d = parseInt(p[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  var dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
  return dt;
}
function dayKeyAdd(key, n) {
  var d = keyToDate(key);
  if (!d) return key;
  d.setDate(d.getDate() + Number(n || 0));
  return dateKey(d);
}
/* 두 날짜 사이 날 수 (둘 다 포함) */
function dayGap(aKey, bKey) {
  var a = keyToDate(aKey), b = keyToDate(bKey);
  if (!a || !b) return 1;
  return Math.round((b.getTime() - a.getTime()) / 86400000) + 1;
}
function clampInt(v, lo, hi, def) {
  var n = parseInt(v, 10);
  if (isNaN(n)) n = def;
  if (n < lo) n = lo;
  if (n > hi) n = hi;
  return n;
}
function fmtDayDot(key) {
  var d = keyToDate(key);
  return d ? (d.getMonth() + 1) + '/' + d.getDate() : String(key || '');
}
/* 월요일 시작 주 열쇠 — 매주 역할은 주마다 새로 시작해요 */
function weekKeyOf(d) {
  var t = new Date((d || new Date()).getTime());
  t = new Date(t.getFullYear(), t.getMonth(), t.getDate());
  var dow = (t.getDay() + 6) % 7;          /* 월=0 … 일=6 */
  t.setDate(t.getDate() - dow + 3);        /* 그 주의 목요일 */
  var y = t.getFullYear();
  var jan4 = new Date(y, 0, 4);
  var jan4dow = (jan4.getDay() + 6) % 7;
  var week1 = new Date(y, 0, 4 - jan4dow);
  var wk = 1 + Math.round((t.getTime() - week1.getTime()) / (7 * 86400000));
  return y + '-W' + (wk < 10 ? '0' + wk : wk);
}
function normCycle(v) { return (v === 'week' || v === 'month') ? v : 'day'; }
function cycleKeyOf(cycle) {
  cycle = normCycle(cycle);
  if (cycle === 'month') return dateKey().slice(0, 7);
  if (cycle === 'week') return weekKeyOf(new Date());
  return dateKey();
}
function cycleLabel(cycle) {
  cycle = normCycle(cycle);
  return cycle === 'month' ? '매월' : (cycle === 'week' ? '매주' : '매일');
}
function cycleShortLabel(cycle) {
  cycle = normCycle(cycle);
  return cycle === 'month' ? '이번 달' : (cycle === 'week' ? '이번 주' : '오늘');
}
/* 처음 한 번 보여 줄 예시 미션 — 부모님이 고치거나 지울 수 있어요 */
function defaultMissions() {
  var start = dateKey();
  var d = keyToDate(start) || new Date();
  var toSun = (7 - d.getDay()) % 7;
  var end = dayKeyAdd(start, toSun);
  return [{
    id: 'sm-milk-1', emoji: '🥛', title: '이번 주 일요일까지 우유 마시기',
    start: start, end: end, days: Math.max(1, dayGap(start, end)), reward: 1,
    checks: {}, granted: false, grantedAt: 0, u: 0
  }];
}

/* ---- 첫 로딩 스플래시 ----
   새로고침·진입 때 클라우드에서 첫 데이터(프로필·설정·오늘 기록·스티커)를 다 받을 때까지
   로그인 화면(🏠 Jaden's Today)을 그대로 보여 주고, 끝나면 한 번에 대시보드로 넘어가요.
   오프라인·로컬 전용·오래 걸림(6초)일 때는 멈추지 않고 기기에 있던 것으로 바로 열어요. */
var splash = { on: false, timer: 0, startedAt: 0 };
var SPLASH_TIMEOUT_MS = 6000;

function splashHtml() {
  return '<div class="splash-wrap">' +
    '<div class="splash-spin" aria-hidden="true"></div>' +
    '<p class="splash-note">가족 데이터를 불러오는 중...</p>' +
    '<p class="splash-sub">잠시만 기다려 주세요 ☁️</p>' +
    '</div>';
}

function showSplash() {
  if (splash.on) return;
  var login = document.getElementById('loginScreen');
  var app = document.getElementById('appRoot');
  var lock = document.getElementById('lockScreen');
  if (lock) lock.hidden = true;
  if (app) app.hidden = true;
  if (login) login.hidden = false;
  var body = document.getElementById('loginBody');
  if (body) body.innerHTML = splashHtml();
  splash.on = true;
  splash.startedAt = Date.now();
  if (splash.timer) window.clearTimeout(splash.timer);
  splash.timer = window.setTimeout(function () {
    splash.timer = 0;
    /* 응답이 너무 늦으면 기다리지 않고 기기에 있던 값으로 열어요 */
    try { endSplash(true); } catch (e) { /* 무시 */ }
  }, SPLASH_TIMEOUT_MS);
  try { unlockScroll(); } catch (e) { /* 무시 */ }
  renderSyncPill();
}

/* 스플래시를 걷고 완성된 대시보드를 한 번에 보여 줘요.
   force = 응답이 너무 늦을 때 — 로그인 정보가 아직 없어도 기기에 있던 값으로 열어요 */
function endSplash(force) {
  var was = splash.on;
  splash.on = false;
  if (splash.timer) { window.clearTimeout(splash.timer); splash.timer = 0; }
  if (!cloud.me && !force) return;             /* 로그인이 안 된 상태면 그대로 */
  var login = document.getElementById('loginScreen');
  var app = document.getElementById('appRoot');
  var lock = document.getElementById('lockScreen');
  if (lock && !lock.hidden) return;            /* 권한 없음 화면은 그대로 */
  /* 화면을 보여 주기 "전에" 다 그려 두어, 열리는 순간 120코인 같은 기본값이 비치지 않게 해요 */
  if (was) {
    try { renderAll(); } catch (e) { /* 무시 */ }
    if (cloud.me) { try { applyPermissions(); } catch (e2) { /* 무시 */ } }
  }
  if (login) login.hidden = true;
  if (app) app.hidden = false;
  if (was) { try { applyLayoutOrder(); } catch (e3) { /* 무시 */ } }
  renderSyncPill();
}
