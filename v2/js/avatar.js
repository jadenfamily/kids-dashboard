/* ============================================================================
   Jaden's Today v2 — js/avatar.js
   어린이 아바타 · 피팅룸 · 경험치/레벨업
   · 원본 index.html(운영본)의 같은 코드를 기능별로 나눈 파일입니다. 동작은 원본과 같아요.
   · 모듈끼리 같은 전역 스코프를 써요. index.html 에서 core → sync → ... 순서로 불러옵니다.
   ============================================================================ */
'use strict';

/* ---------------- 아바타 기본값 ---------------- */
var AV_SKINS = [
  { id: 'skin1', label: '밝은 살색', color: '#ffdcbe' },
  { id: 'skin2', label: '복숭아', color: '#f6c69f' },
  { id: 'skin3', label: '구릿빛', color: '#dca576' },
  { id: 'skin4', label: '초콜릿', color: '#b47c55' }
];
/* 미용실에서 20코인으로 바꿀 수 있는 머리색 (id는 예전 프로필과 호환) */
var AV_HAIR_COLORS = [
  { id: 'brown', label: '밤색', color: '#6b4423' },
  { id: 'black', label: '흑발', color: '#2b2438' },
  { id: 'blonde', label: '금발', color: '#e6c069' },
  { id: 'pink', label: '체리핑크', color: '#ef8fb0' },
  { id: 'blue', label: '하늘블루', color: '#5a7fd6' },
  { id: 'lavender', label: '라벤더퍼플', color: '#a98bec' },
  { id: 'mint', label: '민트그린', color: '#5fd3ae' },
  { id: 'silver', label: '실버애쉬', color: '#c3c8d6' }
];
var AV_GENDERS = [
  { id: 'boy', label: '남아', icon: '👦' },
  { id: 'girl', label: '여아', icon: '👧' }
];
var HAIR_DYE_COST = 5;    /* 미용실 염색 1회 요금 */
var AV_SLOTS = [
  { id: 'hair', label: '헤어', icon: '💇' },
  { id: 'hat', label: '모자', icon: '🧢' },
  { id: 'top', label: '상의', icon: '👕' },
  { id: 'bottom', label: '하의', icon: '👖' },
  { id: 'shoes', label: '신발', icon: '👟' },
  { id: 'acc', label: '안경·소품', icon: '🕶' },
  { id: 'face', label: '표정', icon: '😊' },
  { id: 'pose', label: '동작', icon: '🕺' }
];

function defaultAvatar() {
  return {
    gender: 'boy', skin: 'skin1', hairColor: 'brown',
    hair: 'av_hair_basic', hat: '', top: 'av_top_tee', bottom: 'av_bottom_jeans',
    shoes: 'av_shoes_sneaker', acc: '',
    face: 'av_face_smile', pose: 'av_pose_stand'
  };
}
/* ================= ⭐ 경험치(EXP) · 레벨 =================
   · 코인을 받는 일을 하면 경험치도 함께 쌓여요.
   · Lv.1→2 는 100, 그다음부터는 레벨마다 +50 씩 더 필요해요 (100·150·200·250…).
   · 레벨이 오를 때마다 '새 레벨 × 20코인'을 보너스로 줘요.
   · 체크를 풀면 준 경험치도 돌아와요(반복 체크로 레벨을 올릴 수 없어요).
     레벨은 한 번 오르면 내려가지 않아서, 다시 채워도 보너스가 또 나가지는 않아요. */
function xpToLevel(level) {
  var L = Math.max(1, parseInt(level, 10) || 1);
  return 25 * (L - 1) * (L + 2);
}
function xpStep(level) { return 50 * ((parseInt(level, 10) || 1) + 1); }
function levelOfXp(xp) {
  var L = 1;
  while (L < 300 && xp >= xpToLevel(L + 1)) L++;
  return L;
}
function xpInfo() {
  var p = prof();
  var xp = Math.max(0, parseInt(p.xp, 10) || 0);
  var lv = Math.max(1, parseInt(p.level, 10) || 1);
  var calc = levelOfXp(xp);
  if (calc > lv) lv = calc;
  var base = xpToLevel(lv), next = xpToLevel(lv + 1);
  var span = Math.max(1, next - base);
  var into = Math.max(0, Math.min(span, xp - base));
  return { xp: xp, level: lv, base: base, next: next, need: span, into: into, pct: Math.round(into * 100 / span) };
}
/* 경험치 더하기(빼기) — 레벨업하면 축하와 함께 보너스 코인 */
function gainXp(n) {
  n = Math.round(Number(n) || 0);
  if (!n) return null;
  var p = prof();
  var before = xpInfo();
  p.xp = Math.max(0, (parseInt(p.xp, 10) || 0) + n);
  var after = xpInfo();
  var bonus = 0;
  if (after.level > before.level) {
    for (var L = before.level + 1; L <= after.level; L++) bonus += L * 20;
    p.level = after.level;
    if (bonus > 0) coinAdd(bonus);
    try { snd('win'); confetti(26); } catch (e1) { /* 무시 */ }
    showToast('🎉 <b>Lv.' + after.level + '</b> 레벨업! ' + coinSvg() + ' +' + fmtNum(bonus) + ' 코인', true, 3800);
  } else if (after.level < (parseInt(p.level, 10) || 1)) {
    /* 레벨은 내려가지 않아요 (한 번 이룬 것은 그대로) */
    p.level = Math.max(1, parseInt(p.level, 10) || 1);
  }
  p.updatedAt = new Date().toISOString();
  renderLevelBadges();
  try { checkAchievements(); } catch (e2) { /* 무시 */ }
  return { xp: p.xp, level: after.level, bonus: bonus };
}
/* 업적용 누적 횟수 — 체크를 풀면 함께 줄어 반복 체크로 부풀지 않아요 */
function bumpProgress(key, n) {
  var p = prof();
  if (!p.progress || typeof p.progress !== 'object') p.progress = {};
  var cur = parseInt(p.progress[key], 10) || 0;
  p.progress[key] = Math.max(0, Math.min(999999, cur + (Number(n) || 0)));
  return p.progress[key];
}

/* 레벨 배지 · 경험치 바 (상단 · 마이룸 · 아바타 창) */
function renderLevelBadges() {
  var x = xpInfo();
  var el = document.getElementById('lvBadge');
  if (el) {
    el.innerHTML = '<span class="lvb-star" aria-hidden="true">⭐</span> <b>Lv.' + x.level + '</b>';
    el.setAttribute('title', '아바타 레벨 ' + x.level + ' · 다음 레벨까지 ' + fmtNum(Math.max(0, x.need - x.into)) + ' EXP');
  }
  var bars = document.querySelectorAll('[data-xpbar]');
  for (var i = 0; i < bars.length; i++) {
    var host = bars[i];
    if (!host) continue;
    host.innerHTML = '<span class="xp-lv">Lv.' + x.level + '</span>' +
      '<span class="xp-track"><i style="width:' + x.pct + '%"></i></span>' +
      '<span class="xp-num">' + fmtNum(x.into) + ' / ' + fmtNum(x.need) + '</span>';
  }
}

/* ---------------- 아바타 ---------------- */
function avSkin() {
  var id = prof().avatar.skin;
  for (var i = 0; i < AV_SKINS.length; i++) if (AV_SKINS[i].id === id) return AV_SKINS[i];
  return AV_SKINS[0];
}
function avHairColor(av) {
  var id = ((av || prof().avatar) || {}).hairColor;
  for (var i = 0; i < AV_HAIR_COLORS.length; i++) if (AV_HAIR_COLORS[i].id === id) return AV_HAIR_COLORS[i];
  return AV_HAIR_COLORS[0];
}
function avItem(id) {
  var it = id ? shopItem(id) : null;
  return (it && it.kind === 'cloth') ? it : null;
}

/* ---- 표정·동작 그리기 도우미 ---- */
function avHeartPts(cx, cy, sc) {
  var pts = [];
  for (var i = 0; i < 26; i++) {
    var t = i / 26 * Math.PI * 2;
    var x = 16 * Math.pow(Math.sin(t), 3);
    var y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    pts.push((cx + x * sc).toFixed(1) + ',' + (cy + y * sc).toFixed(1));
  }
  return pts.join(' ');
}
function avStarPts(cx, cy, r) {
  var pts = [];
  for (var i = 0; i < 10; i++) {
    var rad = (i % 2 === 0) ? r : r * 0.44;
    var a = -Math.PI / 2 + i * Math.PI / 5;
    pts.push((cx + Math.cos(a) * rad).toFixed(1) + ',' + (cy + Math.sin(a) * rad).toFixed(1));
  }
  return pts.join(' ');
}
function avTwinkle(cx, cy, r, c) {
  return '<path d="M' + cx + ' ' + (cy - r) + 'q' + (r * 0.22) + ' ' + (r * 0.72) + ' ' + r + ' ' + r +
    'q-' + (r * 0.78) + ' ' + (r * 0.22) + ' -' + r + ' ' + r +
    'q-' + (r * 0.22) + ' -' + (r * 0.78) + ' -' + r + ' -' + r +
    'q' + (r * 0.78) + ' -' + (r * 0.22) + ' ' + r + ' -' + r + 'z" fill="' + c + '"/>';
}
function avLimb(pts, w, c) {
  var d = 'M' + pts[0][0] + ' ' + pts[0][1];
  for (var i = 1; i < pts.length; i++) d += 'L' + pts[i][0] + ' ' + pts[i][1];
  return '<path d="' + d + '" fill="none" stroke="' + c + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"/>';
}
function avHand(cx, cy, r, skin) {
  return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + skin + '"/>';
}
/* 엄지손 — 손바닥 동글 + 손가락 쪽으로 살짝 솟은 엄지 */
function avHandThumb(cx, cy, r, skin, dir) {
  var d = dir === 'in' ? -1 : 1;
  return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + skin + '"/>' +
    '<circle cx="' + (cx + d * r * 0.62).toFixed(1) + '" cy="' + (cy + r * 0.42).toFixed(1) +
    '" r="' + (r * 0.44).toFixed(1) + '" fill="' + skin + '"/>';
}

/* 아바타 그라데이션 id 는 그릴 때마다 새로 붙여요.
   한 화면에 여러 아바타(피팅룸 카드·마이룸·상단 배지)가 함께 그려져도
   id 가 겹쳐 엉뚱한 색이 칠해지지 않아요. */
var AV_GID = 0;

/* 얼굴 — 표정마다 눈·입·볼이 확실히 달라요 (새 어린이 얼굴 비율) */
function avFaceSvg(st, girl, skin) {
  var s = '', dark = '#33274a';
  var eyeY = 66;
  var erx = girl ? 5.8 : 5.4, ery = girl ? 7.0 : 6.6;
  var exL = 48, exR = 72;
  var mouthC = '#c4644f';
  var browC = '#7b5638';
  function hl(cx, cy, rx) { return rx || (girl ? 2.1 : 1.9); }

  /* 큰 눈 — 홍채 + 눈동자 + 별빛 하이라이트 2개 */
  function openEye(cx, cy, rx, ry, sparkle) {
    var o = '';
    o += '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="' + dark + '"/>';
    o += '<ellipse cx="' + cx + '" cy="' + (cy + ry * 0.08).toFixed(2) + '" rx="' + (rx * 0.84).toFixed(2) +
      '" ry="' + (ry * 0.86).toFixed(2) + '" fill="#87593a"/>';
    o += '<ellipse cx="' + cx + '" cy="' + (cy + ry * 0.18).toFixed(2) + '" rx="' + (rx * 0.38).toFixed(2) +
      '" ry="' + (ry * 0.46).toFixed(2) + '" fill="#2f2033"/>';
    var r1 = hl(cx, cy);
    o += '<circle cx="' + (cx - rx * 0.40).toFixed(2) + '" cy="' + (cy - ry * 0.44).toFixed(2) + '" r="' + r1 + '" fill="#ffffff"/>';
    o += '<circle cx="' + (cx + rx * 0.44).toFixed(2) + '" cy="' + (cy + ry * 0.42).toFixed(2) + '" r="' + (r1 * 0.48).toFixed(2) +
      '" fill="#ffffff" opacity=".9"/>';
    if (sparkle) o += avTwinkle(cx + rx * 0.10, cy - ry * 0.30, 1.5, '#ffffff');
    return o;
  }
  function openEyes(rx, ry, cy) {
    cy = cy || eyeY;
    rx = rx || erx; ry = ry || ery;
    return openEye(exL, cy, rx, ry) + openEye(exR, cy, rx, ry);
  }
  function closedEyes(bend, cy) {
    cy = cy || eyeY;
    return '<path d="M' + (exL - 5.2) + ' ' + cy + 'q5.2 ' + bend + ' 10.4 0" fill="none" stroke="' + dark + '" stroke-width="2.6" stroke-linecap="round"/>' +
      '<path d="M' + (exR - 5.2) + ' ' + cy + 'q5.2 ' + bend + ' 10.4 0" fill="none" stroke="' + dark + '" stroke-width="2.6" stroke-linecap="round"/>';
  }
  function girlLashes() {
    return '<path d="M' + (exL - 5.4) + ' ' + (eyeY - 4.6) + 'q-2.4-1.2-3.4-3.6" fill="none" stroke="' + dark + '" stroke-width="1.5" stroke-linecap="round"/>' +
      '<path d="M' + (exR + 5.4) + ' ' + (eyeY - 4.6) + 'q2.4-1.2 3.4-3.6" fill="none" stroke="' + dark + '" stroke-width="1.5" stroke-linecap="round"/>';
  }
  /* 자연스러운 눈썹 — 살짝 휘고 끝이 가늘어져요 (얼굴이 갸름해져 눈썹도 살짝 안으로) */
  function brow(l, r, c, w) {
    c = c || browC; w = w || 2.2;
    return '<g transform="translate(60 0) scale(.96 1) translate(-60 0)">' +
      '<path d="' + l + '" fill="none" stroke="' + c + '" stroke-width="' + w + '" stroke-linecap="round"/>' +
      '<path d="' + r + '" fill="none" stroke="' + c + '" stroke-width="' + w + '" stroke-linecap="round"/></g>';
  }
  function blush(o, rx, ry, cy) {
    o = o == null ? .55 : o;
    rx = rx || 5.0; ry = ry || 2.9; cy = cy || 79;
    return '<ellipse cx="39.5" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="#ff9ec4" opacity="' + o + '"/>' +
      '<ellipse cx="80.5" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="#ff9ec4" opacity="' + o + '"/>';
  }
  /* 작은 코 포인트 */
  function nose() {
    return '<ellipse cx="60" cy="75.4" rx="1.7" ry="1.2" fill="' + darken(skin, .26) + '" opacity=".45"/>';
  }
  function smileMouth(cy) {
    cy = cy || 81;
    return '<path d="M54.4 ' + cy + 'q5.6 4.8 11.2 0" fill="none" stroke="' + mouthC + '" stroke-width="2.3" stroke-linecap="round"/>';
  }
  function openMouth(cy, w) {
    cy = cy || 80; w = w || 7.4;
    return '<path d="M' + (60 - w) + ' ' + cy + 'q' + w + ' 9.6 ' + (w * 2) + ' 0z" fill="#b5563f"/>' +
      '<path d="M' + (60 - w + 1.4) + ' ' + (cy + 0.9) + 'h' + (w * 2 - 2.8) + 'q-' + (w - 1.4) + ' 3.2 -' + (w * 2 - 2.8) + ' 0z" fill="#ffffff"/>';
  }

  s += nose();

  if (st === 'bright') {
    s += openEyes(erx + 0.2, ery - 0.2, eyeY - 0.6);
    s += brow('M40.6 56.4q7.4-3.4 13.6-1.2', 'M79.4 56.4q-7.4-3.4-13.6-1.2');
    s += openMouth(79.4, 7.6);
    s += blush(.62, 5.8, 3.3, 80);
    if (girl) s += girlLashes();
  } else if (st === 'wink') {
    s += openEye(exL, eyeY, erx, ery, true);
    s += '<path d="M' + (exR - 5.4) + ' ' + (eyeY + 0.4) + 'q5.4-4.8 10.8 0" fill="none" stroke="' + dark + '" stroke-width="2.7" stroke-linecap="round"/>';
    s += '<path d="M' + (exR + 5.4) + ' ' + (eyeY + 0.4) + 'l3.8-2.8" fill="none" stroke="' + dark + '" stroke-width="1.6" stroke-linecap="round"/>';
    if (girl) s += '<path d="M' + (exL - 5.8) + ' ' + (eyeY - 4.4) + 'q-3-1.6-4.4-4.8" fill="none" stroke="' + dark + '" stroke-width="1.7" stroke-linecap="round"/>';
    s += brow('M41 56q7-2.4 13-1', 'M79 55.4q-7-1.6-13 1.4');
    s += openMouth(80.4, 6.2);
    s += blush(.6, 5.6, 3.2, 79.6);
  } else if (st === 'angry') {
    s += brow('M40.4 57.4l14 6.4', 'M79.6 57.4l-14 6.4', '#5a3a2a', 3);
    s += '<ellipse cx="' + exL + '" cy="' + (eyeY + 0.6) + '" rx="4.4" ry="3.2" fill="' + dark + '"/>';
    s += '<ellipse cx="' + exR + '" cy="' + (eyeY + 0.6) + '" rx="4.4" ry="3.2" fill="' + dark + '"/>';
    s += '<circle cx="' + (exL - 1.2) + '" cy="' + (eyeY - 0.2) + '" r="1.35" fill="#ffffff"/>';
    s += '<circle cx="' + (exR - 1.2) + '" cy="' + (eyeY - 0.2) + '" r="1.35" fill="#ffffff"/>';
    s += '<path d="M55 84.4q5-6 10 0" fill="none" stroke="' + mouthC + '" stroke-width="2.6" stroke-linecap="round"/>';
    s += '<circle cx="37.2" cy="78.6" r="6.2" fill="#ffb3a0" opacity=".5"/>';
    s += '<circle cx="82.8" cy="78.6" r="6.2" fill="#ffb3a0" opacity=".5"/>';
    s += '<path d="M88 42q7-4 5-11M95 46q7-4 5-11" fill="none" stroke="#d9c9b6" stroke-width="2.6" stroke-linecap="round"/>';
  } else if (st === 'sad') {
    s += brow('M41 55.6q7 0 12 5.4', 'M79 55.6q-7 0-12 5.4');
    s += openEyes(erx + 0.2, ery + 0.1, eyeY + 0.8);
    s += '<path d="M55 84.6q5-5.4 10 0" fill="none" stroke="' + mouthC + '" stroke-width="2.4" stroke-linecap="round"/>';
    s += '<path d="M' + (exL + 1.4) + ' 73.6q-1.4 5.4.2 7.6 2 2.4 3.4-.2 1.2-2.8-3.6-7.4z" fill="#7cc6f2"/>';
    s += '<path d="M' + (exR - 1.4) + ' 72.8q-1.2 4.4.2 6.2 1.6 2 2.8-.2 1-2.2-3-6z" fill="#a9dbff"/>';
    s += blush(.5, 5, 3, 79);
  } else if (st === 'surprise') {
    s += brow('M41 52.4q7-2.6 12 0', 'M79 52.4q-7-2.6-12 0');
    s += '<ellipse cx="' + exL + '" cy="' + eyeY + '" rx="6" ry="7" fill="#ffffff" stroke="' + dark + '" stroke-width="1.7"/>';
    s += '<ellipse cx="' + exR + '" cy="' + eyeY + '" rx="6" ry="7" fill="#ffffff" stroke="' + dark + '" stroke-width="1.7"/>';
    s += '<circle cx="' + exL + '" cy="' + (eyeY + 0.6) + '" r="2.7" fill="' + dark + '"/>';
    s += '<circle cx="' + exR + '" cy="' + (eyeY + 0.6) + '" r="2.7" fill="' + dark + '"/>';
    s += '<circle cx="' + (exL - 0.8) + '" cy="' + (eyeY - 0.6) + '" r="1" fill="#ffffff"/>';
    s += '<circle cx="' + (exR - 0.8) + '" cy="' + (eyeY - 0.6) + '" r="1" fill="#ffffff"/>';
    s += '<ellipse cx="60" cy="83.4" rx="4.8" ry="5.6" fill="#b5563f"/>';
    s += '<ellipse cx="60" cy="85.4" rx="2.8" ry="3" fill="#e8897f"/>';
    s += blush(.4, 5, 2.9, 79.6);
  } else if (st === 'shy') {
    s += closedEyes(-5.4);
    s += blush(.92, 7.4, 4.7, 79);
    s += '<circle cx="37.4" cy="77.4" r="1.2" fill="#ffffff" opacity=".75"/>';
    s += '<circle cx="82.6" cy="77.4" r="1.2" fill="#ffffff" opacity=".75"/>';
    s += '<path d="M56.8 82.4q3.2 3.6 6.4 0" fill="none" stroke="' + mouthC + '" stroke-width="2.2" stroke-linecap="round"/>';
    s += avTwinkle(86, 54, 2.6, '#ffd34d');
    if (girl) s += girlLashes();
  } else if (st === 'pout') {
    s += brow('M41 56.4l12 5.4', 'M79 56.4l-12 5.4');
    s += '<path d="M43.4 64h9.2M67.4 64h9.2" stroke="' + dark + '" stroke-width="2.4" stroke-linecap="round"/>';
    s += '<ellipse cx="' + exL + '" cy="' + (eyeY + 1.4) + '" rx="3.7" ry="2.9" fill="' + dark + '"/>';
    s += '<ellipse cx="' + exR + '" cy="' + (eyeY + 1.4) + '" rx="3.7" ry="2.9" fill="' + dark + '"/>';
    s += '<path d="M56.4 83.8q4.6 2.8 9-1.4" fill="none" stroke="' + mouthC + '" stroke-width="2.6" stroke-linecap="round"/>';
    s += '<circle cx="82.8" cy="78.4" r="6" fill="#ffb3a0" opacity=".5"/>';
    s += '<path d="M90 42q6-3 5-9" fill="none" stroke="#d9c9b6" stroke-width="2.4" stroke-linecap="round"/>';
  } else if (st === 'heart') {
    s += '<polygon points="' + avHeartPts(exL, eyeY, 0.31) + '" fill="#ff5c8a"/>';
    s += '<polygon points="' + avHeartPts(exR, eyeY, 0.31) + '" fill="#ff5c8a"/>';
    s += '<circle cx="' + (exL - 2) + '" cy="' + (eyeY - 3.4) + '" r="1.5" fill="#ffffff"/>';
    s += '<circle cx="' + (exR - 2) + '" cy="' + (eyeY - 3.4) + '" r="1.5" fill="#ffffff"/>';
    s += openMouth(79.6, 7.2);
    s += blush(.8, 5.4, 3.1, 80);
    s += '<polygon points="' + avHeartPts(94, 42, 0.16) + '" fill="#ff9ec4" opacity=".9"/>';
    if (girl) s += girlLashes();
  } else if (st === 'star') {
    s += '<polygon points="' + avStarPts(exL, eyeY, 7.8) + '" fill="#ffcf1f" stroke="#e0a800" stroke-width="1"/>';
    s += '<polygon points="' + avStarPts(exR, eyeY, 7.8) + '" fill="#ffcf1f" stroke="#e0a800" stroke-width="1"/>';
    s += '<circle cx="' + exL + '" cy="' + eyeY + '" r="1.5" fill="#9a6a00"/>';
    s += '<circle cx="' + exR + '" cy="' + eyeY + '" r="1.5" fill="#9a6a00"/>';
    s += openMouth(80, 7);
    s += avTwinkle(18, 46, 4.4, '#ffd34d') + avTwinkle(102, 42, 3.6, '#ffe680') + avTwinkle(88, 26, 2.8, '#fff0a8');
  } else if (st === 'sweat') {
    s += brow('M41 53.4q7 1 12 4.4', 'M79 53.4q-7 1-12 4.4');
    s += openEyes(erx + 0.2, ery - 0.3, eyeY - 0.4);
    s += '<path d="M54.4 81.8q7.4 6 14.8-1.6" fill="none" stroke="' + mouthC + '" stroke-width="2.4" stroke-linecap="round"/>';
    s += '<path d="M34.4 45q-3.2 5.4.2 8 3.4 2.4 4.6-1.4 1.2-3.6-4.8-6.6z" fill="#9ed6ff"/>';
    s += '<path d="M90.4 50q-2.4 4 .2 6 2.6 1.8 3.4-1 0.8-2.6-3.6-5z" fill="#c6e9ff"/>';
    s += '<path d="M80 40q4-4 4-9" fill="none" stroke="#9ed6ff" stroke-width="2.4" stroke-linecap="round"/>';
    s += blush(.42, 5, 3, 79);
  } else if (st === 'tongue') {
    s += openEye(exL, eyeY, erx, ery, true);
    s += '<path d="M' + (exR - 5.4) + ' ' + (eyeY + 0.4) + 'q5.4-4.8 10.8 0" fill="none" stroke="' + dark + '" stroke-width="2.7" stroke-linecap="round"/>';
    s += openMouth(79.8, 6.6);
    s += '<ellipse cx="60" cy="87.4" rx="3.9" ry="3.4" fill="#ff8fb0"/>';
    s += '<path d="M60 84.6v4.8" stroke="#e0698c" stroke-width="1.2"/>';
    s += blush(.55, 5.2, 3, 79.6);
    if (girl) s += '<path d="M' + (exL - 5.8) + ' ' + (eyeY - 4.4) + 'q-3-1.6-4.4-4.8" fill="none" stroke="' + dark + '" stroke-width="1.7" stroke-linecap="round"/>';
  } else if (st === 'sleepy') {
    s += brow('M41 58q7-2 12 0', 'M79 58q-7-2-12 0');
    s += '<path d="M' + (exL - 5.4) + ' ' + (eyeY - 0.6) + 'q5.4 6.4 10.8 0" fill="none" stroke="' + dark + '" stroke-width="2.7" stroke-linecap="round"/>';
    s += '<path d="M' + (exR - 5.4) + ' ' + (eyeY + 0.4) + 'q5.4 5.4 10.8-1" fill="none" stroke="' + dark + '" stroke-width="2.7" stroke-linecap="round"/>';
    s += '<ellipse cx="60" cy="83.6" rx="5.2" ry="6.4" fill="#b5563f"/>';
    s += '<ellipse cx="60" cy="85.8" rx="3.3" ry="3.6" fill="#e8897f"/>';
    s += '<text x="86" y="50" font-size="13" font-weight="900" fill="#8fb8ff" font-family="inherit">Z</text>';
    s += '<text x="95" y="38" font-size="9.5" font-weight="900" fill="#b8d4ff" font-family="inherit">z</text>';
    s += blush(.4, 4.8, 2.8, 79.6);
  } else if (st === 'cool') {
    s += '<rect x="37.4" y="58.8" width="20.4" height="13.6" rx="6" fill="#2c2440"/>';
    s += '<rect x="62.2" y="58.8" width="20.4" height="13.6" rx="6" fill="#2c2440"/>';
    s += '<path d="M57.8 63.6h4.4" stroke="#2c2440" stroke-width="3.2"/>';
    s += '<path d="M40.2 61.8l5.2 5.2M66.4 61.8l5.2 5.2" stroke="#ffffff" stroke-width="1.7" opacity=".6" stroke-linecap="round"/>';
    s += '<path d="M55 82q7 4 13.4-2.6" fill="none" stroke="' + mouthC + '" stroke-width="2.6" stroke-linecap="round"/>';
    s += avTwinkle(92, 48, 3, '#ffffff');
    s += brow('M40.6 56l13-4.4', 'M79.4 56l-13-4.4', '#5a4a3a', 2.4);
  } else {
    /* 방긋 웃음 — 기본 얼굴 */
    s += openEyes(erx, ery, eyeY);
    if (girl) {
      s += girlLashes();
      s += blush(.85, 5.6, 3.2, 79.4);
      s += '<circle cx="37.8" cy="78" r="1.1" fill="#ffffff" opacity=".65"/>';
      s += '<circle cx="82.2" cy="78" r="1.1" fill="#ffffff" opacity=".65"/>';
    } else {
      s += blush(.5, 4.6, 2.8, 79.4);
    }
    s += brow('M40.8 56.6q7-3 13-1', 'M79.2 56.6q-7-3-13-1');
    s += smileMouth(81);
  }
  return s;
}

/* 동작 — 팔 모양 (기본 서기는 몸과 이어지게 avatarInner 안에서 그려요) */
function avPoseArms(st, skin, topC, topC2) {
  var s = '', sw = 12.6, sl = 6.4;
  if (st === 'wave') {
    s += avLimb([[44, 106], [37, 124]], 13, topC) + avHandThumb(36, 128, sl, skin, 'in');
    s += avLimb([[76, 106], [90, 88], [96, 66]], sw, topC);
    s += '<g class="av-wave-hand">' + avHand(98, 61, 6.8, skin) +
      '<path d="M95 55v-5M99.4 54.4l1.2-5M103.4 57l3.6-3.4" fill="none" stroke="' + skin + '" stroke-width="2.6" stroke-linecap="round"/></g>';
  } else if (st === 'v') {
    s += avLimb([[44, 106], [38, 124]], 13, topC) + avHandThumb(37, 128, sl, skin, 'in');
    s += avLimb([[76, 106], [86, 119]], sw, topC);
    s += avLimb([[86, 119], [74, 91]], 9, skin);
    s += avHand(72, 87, 6.2, skin);
    s += '<path d="M69.6 84.2l-3.6-9.4M74.4 83.4l2.2-9.2" fill="none" stroke="' + skin + '" stroke-width="3" stroke-linecap="round"/>';
  } else if (st === 'cheer') {
    s += avLimb([[44, 106], [30, 86], [25, 60]], sw, topC) + avHandThumb(24, 55, sl, skin, 'in');
    s += avLimb([[76, 106], [90, 86], [95, 60]], sw, topC) + avHandThumb(96, 55, sl, skin, 'out');
    s += avTwinkle(16, 42, 4, '#ffd34d') + avTwinkle(104, 42, 4, '#ffd34d');
  } else if (st === 'jump') {
    s += avLimb([[44, 106], [27, 92], [19, 73]], sw, topC) + avHandThumb(17, 69, sl, skin, 'in');
    s += avLimb([[76, 106], [93, 92], [101, 73]], sw, topC) + avHandThumb(103, 69, sl, skin, 'out');
    s += avTwinkle(50, 20, 3, '#ffd34d') + avTwinkle(74, 16, 2.4, '#ffe680');
  } else if (st === 'dance') {
    s += avLimb([[44, 106], [28, 86], [20, 62]], sw, topC) + avHandThumb(19, 57, sl, skin, 'in');
    s += avLimb([[76, 106], [94, 116], [105, 106]], sw, topC) + avHandThumb(108, 103, sl, skin, 'out');
    s += '<path d="M16 40q5-3 4-8M108 46q5-3 4-8" fill="none" stroke="#ffb0d0" stroke-width="2.6" stroke-linecap="round"/>';
  } else if (st === 'heart') {
    s += avLimb([[44, 106], [35, 126], [52, 121]], sw, topC) + avHandThumb(54, 120, sl, skin, 'in');
    s += avLimb([[76, 106], [85, 126], [68, 121]], sw, topC) + avHandThumb(66, 120, sl, skin, 'out');
    s += '<polygon points="' + avHeartPts(60, 115, 0.42) + '" fill="#ff5c8a" opacity=".95"/>';
    s += avTwinkle(88, 48, 2.6, '#ffb0d0');
  } else if (st === 'kick') {
    s += avLimb([[44, 106], [50, 88]], 12, topC) + avHandThumb(51, 84, 5.8, skin, 'in');
    s += avLimb([[76, 106], [70, 88]], 12, topC) + avHandThumb(69, 84, 5.8, skin, 'out');
    s += '<path d="M104 104q6-6 4-12M110 110q5-5 4-10" fill="none" stroke="#c9d6ff" stroke-width="2.4" stroke-linecap="round"/>';
  } else if (st === 'fight') {
    s += avLimb([[44, 106], [35, 122], [47, 131]], sw, topC) + avHandThumb(49, 132, 6, skin, 'in');
    s += avLimb([[76, 106], [93, 116], [85, 95]], sw, topC);
    s += avHand(84, 91, 7, skin);
    s += '<path d="M79.6 88.6h8.8M80.4 92h7.6" stroke="#c98a5e" stroke-width="1.4" opacity=".55"/>';
    s += '<path d="M96 104q6-4 6-11" fill="none" stroke="#ff9f1c" stroke-width="2.6" stroke-linecap="round"/>';
    s += avTwinkle(104, 84, 3, '#ffd34d');
  } else if (st === 'cross') {
    s += avLimb([[45, 108], [74, 125]], 12.4, topC) + avHandThumb(76, 126, sl, skin, 'out');
    s += avLimb([[75, 108], [46, 126]], 12.4, topC) + avHandThumb(44, 127, sl, skin, 'in');
  } else if (st === 'hero') {
    s += avLimb([[44, 106], [30, 84], [26, 58]], sw, topC);
    s += avHand(25, 53, 7, skin);
    s += '<path d="M20 46l1.6 4.4 4.4 1.6-4.4 1.6L20 58l-1.6-4.4L14 52l4.4-1.6z" fill="#ffd34d" stroke="#f0b400" stroke-width="1"/>';
    s += avLimb([[76, 106], [85, 122], [66, 132]], sw, topC) + avHandThumb(64, 133, 6, skin, 'in');
  }
  return s;
}

/* 다리 — 동작마다 다르게. 왼발·오른발은 따로 움직여요(걷기) */
function avLegsSvg(pstyle, skin, sstyle, shoeC, shoeC2, bot) {
  /* 바지 다리 조각 — 다리와 함께 흔들려요 (허리 부분은 따로 그려요) */
  function pantLeg(side) {
    if (!bot || !bot.pants) return '';
    var bottom = bot.hem || 176;
    /* 가랑이 쪽은 위에서 맞닿고 발목으로 갈수록 살짝 벌어져요 */
    var inTop = side === 'l' ? 60.4 : 59.6, inBot = side === 'l' ? 58.8 : 61.2;
    var outer = side === 'l' ? 41.4 : 78.6;
    var d = side === 'l'
      ? '<path d="M' + outer + ' 149 L' + inTop + ' 149 L' + inBot + ' ' + bottom + ' L' + outer + ' ' + bottom + ' Z" fill="' + bot.c + '"/>'
      : '<path d="M' + inTop + ' 149 L' + outer + ' 149 L' + outer + ' ' + bottom + ' L' + inBot + ' ' + bottom + ' Z" fill="' + bot.c + '"/>';
    var o = d;
    if (bot.style === 'jogger') {
      o += '<path d="M' + (side === 'l' ? 42.4 : 63) + ' ' + (bottom - 3.4) + 'h14" stroke="#ffffff" stroke-width="2.8" opacity=".7"/>';
    } else if (bot.style === 'train') {
      o += '<path d="M' + (side === 'l' ? 43.4 : 76.6) + ' 151v' + (bottom - 153) + '" stroke="#ffffff" stroke-width="2.4" opacity=".42"/>';
    } else if (bot.style === 'jeans') {
      o += '<path d="M' + (side === 'l' ? 43.4 : 66.6) + ' ' + (bottom - 17) + 'q4 2 8 .4" stroke="' + darken(bot.c, .16) + '" stroke-width="1.6" opacity=".55" fill="none"/>';
    }
    return o;
  }
  function shoe(cx, cy, dir) {
    var s = '';
    if (sstyle === 'boots') {
      s += '<rect x="' + (cx - 8) + '" y="' + (cy - 19) + '" width="16" height="22" rx="5" fill="' + shoeC + '"/>';
      s += '<rect x="' + (cx - 11) + '" y="' + (cy - 2) + '" width="22" height="9" rx="4.5" fill="' + shoeC + '"/>';
      s += '<path d="M' + (cx - 9) + ' ' + (cy - 2) + 'h18" stroke="' + shoeC2 + '" stroke-width="2" opacity=".7"/>';
    } else if (sstyle === 'slipper') {
      s += '<ellipse cx="' + cx + '" cy="' + cy + '" rx="11.4" ry="6" fill="' + shoeC + '"/>';
      s += '<path d="M' + (cx - 7) + ' ' + (cy - 2.4) + 'q7-6 14 0" fill="none" stroke="' + shoeC2 + '" stroke-width="2.1"/>';
      s += '<ellipse cx="' + (cx + dir * 6) + '" cy="' + (cy + 1.4) + '" rx="4.6" ry="2.6" fill="' + shoeC2 + '" opacity=".35"/>';
    } else {
      /* 운동화 — 발끝이 바깥쪽으로, 좌우가 구분돼요 */
      s += '<ellipse cx="' + cx + '" cy="' + cy + '" rx="9.4" ry="5.8" fill="' + shoeC + '"/>';
      s += '<path d="M' + (cx - 8.4) + ' ' + (cy + 3) + 'q8.4 3.4 16.8 0" fill="none" stroke="' + shoeC2 + '" stroke-width="2.8" stroke-linecap="round"/>';
      s += '<path d="M' + (cx - dir * 2) + ' ' + (cy - 2) + 'q' + (dir * 2.4) + ' -1.6 ' + (dir * 5) + ' -.2" fill="none" stroke="#ffffff" stroke-width="1.5" opacity=".9"/>';
      s += '<circle cx="' + (cx + dir * 5.6) + '" cy="' + (cy - 0.4) + '" r="1.4" fill="' + shoeC2 + '" opacity=".6"/>';
    }
    return s;
  }
  function sock(cx) {
    return '<rect x="' + (cx - 5.2) + '" y="174" width="10.4" height="11.4" rx="4.2" fill="#fbfcff"/>' +
      '<path d="M' + (cx - 4.6) + ' 178h9.2" stroke="#dbe3f2" stroke-width="1.6"/>';
  }
  var out = {};
  if (pstyle === 'jump') {
    out.l = '<path d="M53 152l-7 15 7 12" fill="none" stroke="' + skin + '" stroke-width="11.4" stroke-linecap="round" stroke-linejoin="round"/>' + shoe(49, 183, -1);
    out.r = '<path d="M67 152l7 13-8 13" fill="none" stroke="' + skin + '" stroke-width="11.4" stroke-linecap="round" stroke-linejoin="round"/>' + shoe(71, 181, 1);
  } else {
    out.l = '<path d="M54 151 C53 162 52.2 172 52.4 182" fill="none" stroke="' + skin + '" stroke-width="11" stroke-linecap="round"/>' + sock(52.4) + shoe(50, 190, -1) + pantLeg('l');
    out.r = '<path d="M66 151 C67 162 67.8 172 67.6 182" fill="none" stroke="' + skin + '" stroke-width="11" stroke-linecap="round"/>' + sock(67.6) + shoe(70, 190, 1) + pantLeg('r');
    if (pstyle === 'dance') {
      out.r = '<path d="M66 152l10 13-4 15" fill="none" stroke="' + skin + '" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>' + sock(71) + shoe(74, 187, 1) + pantLeg('r');
    } else if (pstyle === 'kick') {
      out.r = '<path d="M66 152l19-4 13-10" fill="none" stroke="' + skin + '" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>' + shoe(101, 136, 1) + pantLeg('r');
    }
  }
  return out;
}

function avatarInner(av) {
  av = av || prof().avatar;
  var skin = avSkin().color;
  var hairC = avHairColor(av).color;
  var top = avItem(av.top), bottom = avItem(av.bottom), shoes = avItem(av.shoes);
  var hair = avItem(av.hair), hatItem = avItem(av.hat), accItem = avItem(av.acc);
  var girl = avGender(av) === 'girl';
  var topC = top ? top.color : '#ffffff';
  var topC2 = top ? (top.color2 || top.color) : '#7ec8f0';
  var botC = bottom ? bottom.color : '#5b8cc8';
  var shoeC = shoes ? shoes.color : '#ffffff';
  var shoeC2 = shoes ? (shoes.color2 || '#7ec8f0') : '#7ec8f0';
  var hstyle = hair ? hair.style : 'short';
  var ast = accItem ? accItem.style : '';
  var hst = hatItem ? hatItem.style : '';
  var accC = accItem ? (accItem.color || '#5a4a3a') : '#5a4a3a';
  var hatC = hatItem ? (hatItem.color || '#6fb7ff') : '#6fb7ff';
  var faceItem = avItem(av.face), poseItem = avItem(av.pose);
  var fstyle = faceItem ? faceItem.style : 'smile';
  var pstyle = poseItem ? poseItem.style : 'stand';
  var motion = (pstyle === 'jump' || pstyle === 'dance' || pstyle === 'wave' || pstyle === 'hero') ? (' ' + pstyle) : '';
  var uid = 'a' + (++AV_GID);
  /* 머리·모자는 갸름해진 얼굴 폭(31.5~88.5)에 맞춰 가로로 살짝 모아 그려요 */
  var hx = 'translate(60 0) scale(.877 1) translate(-60 0)';
  var gSkin = 'sk' + uid, gShade = 'sd' + uid, gFace = 'fc' + uid;
  var s = '';

  /* 피부 톤 입체 그라데이션 — 아바타마다 다른 id 로 그려요 */
  var skinHi = lighten(skin, .20), skinLo = darken(skin, .12);
  s += '<defs>' +
    '<radialGradient id="' + gSkin + '" cx="38%" cy="26%" r="86%">' +
      '<stop offset="0" stop-color="' + lighten(skin, .34) + '"/>' +
      '<stop offset=".46" stop-color="' + skinHi + '"/>' +
      '<stop offset=".86" stop-color="' + skin + '"/>' +
      '<stop offset="1" stop-color="' + skinLo + '"/>' +
    '</radialGradient>' +
    '<linearGradient id="' + gShade + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="' + skin + '" stop-opacity="0"/>' +
      '<stop offset="1" stop-color="' + skinLo + '" stop-opacity=".55"/>' +
    '</linearGradient>' +
    '<clipPath id="' + gFace + '"><path d="' + avFacePath() + '"/></clipPath>' +
    '</defs>';

  s += '<g class="av-fig ' + (girl ? 'girl' : 'boy') + motion + '">';

  /* 발밑 그림자 — 걷는 동안 숨 쉬듯 오므라들어요 */
  s += '<ellipse class="av-shadow" cx="60" cy="195" rx="29" ry="5.4" fill="#2c2440" opacity=".11"/>';

  /* 영웅 망토는 몸 뒤에서 펄럭여요 */
  if (pstyle === 'hero') {
    s += '<g class="av-cape"><path d="M46 98q-17 26-22 72 15-7 26-3 8 3 10 11 3-8 11-11 11-4 26 3-5-46-22-72z" fill="' + topC2 + '" opacity=".92"/></g>';
  }

  /* 천사 날개 · 미니 백팩은 몸 뒤에 */
  if (ast === 'wings') {
    s += '<path d="M50 112q-26-30-34-12-5 12 8 20-10 2-12 10 18 6 36-8z" fill="#fff8fd" stroke="#e6c8f2" stroke-width="2"/>';
    s += '<path d="M70 112q26-30 34-12 5 12-8 20 10 2 12 10-18 6-36-8z" fill="#fff8fd" stroke="#e6c8f2" stroke-width="2"/>';
  }
  if (ast === 'backpack') {
    s += '<rect x="33" y="102" width="54" height="42" rx="13" fill="' + accC + '"/>';
    s += '<rect x="33" y="112" width="54" height="9" fill="#ffffff" opacity=".38"/>';
  }

  /* 긴 머리는 얼굴 뒤로 어깨까지 내려와요 */
  s += '<g transform="' + hx + '">';
  var bh = 0;
  if (hstyle === 'long' || hstyle === 'wave') bh = 48;
  else if (hstyle === 'pony' || hstyle === 'ribbon') bh = 28;
  else if (hstyle === 'buns') bh = 22;
  else if (hstyle === 'shag') bh = 30;
  else if (hstyle === 'hime' || hstyle === 'braid') bh = 26;
  if (bh) {
    s += '<path d="M27 62c0-22 15-34 33-34s33 12 33 34v' + bh + 'c-6 5-12 6-17 2V66H44v' + (bh - 4) + 'c-5 4-11 3-17-2z" fill="' + hairC + '"/>';
  }
  if (hstyle === 'wave') {
    s += '<circle cx="32" cy="104" r="7.5" fill="' + hairC + '"/><circle cx="41" cy="112" r="6.5" fill="' + hairC + '"/>';
    s += '<circle cx="88" cy="104" r="7.5" fill="' + hairC + '"/><circle cx="79" cy="112" r="6.5" fill="' + hairC + '"/>';
  }
  if (hstyle === 'pony') {
    s += '<path d="M88 72c15 6 22 22 18 40-3 14-11 24-17 26-6 1-8-5-4-10 8-10 12-24 8-38-2-6-6-11-11-14z" fill="' + hairC + '"/>';
    s += '<circle cx="90" cy="70" r="5.5" fill="#ff8fb0"/>';
  }
  if (hstyle === 'braid') {
    var brx = [31, 33, 35, 37, 39], bry = [74, 84, 94, 104, 114];
    s += '<path d="M29 68q3 4 4 8" fill="none" stroke="' + hairC + '" stroke-width="4" stroke-linecap="round"/>';
    for (var bri = 0; bri < brx.length; bri++) {
      s += '<ellipse cx="' + brx[bri] + '" cy="' + bry[bri] + '" rx="6.8" ry="5.8" fill="' + hairC + '" transform="rotate(-12 ' + brx[bri] + ' ' + bry[bri] + ')"/>';
    }
    s += '<ellipse cx="40" cy="121" rx="5.2" ry="2.6" fill="#ff8fb0"/>';
  }
  s += '</g>';

  /* ---- 다리 (걷기에서 따로 흔들리게 묶어요) ---- */
  var bstyle = bottom ? bottom.style : 'jeans';
  var kneeC = darken(botC, .16);
  var PANTS = { jeans: 1, shorts: 1, train: 1, jogger: 1 };
  var botInfo = PANTS[bstyle] ? { pants: 1, style: bstyle, c: botC, hem: bstyle === 'shorts' ? 160 : (bstyle === 'jogger' ? 172 : 176) } : null;
  var legs = avLegsSvg(pstyle, skin, shoes ? shoes.style : 'sneaker', shoeC, shoeC2, botInfo);
  s += '<g class="av-leg-l">' + legs.l + '</g>';
  s += '<g class="av-leg-r">' + legs.r + '</g>';
  if (bstyle === 'skirt') {
    s += '<path d="M40 133h40l11 36H29z" fill="' + botC + '"/>';
    s += '<path d="M42 143h36l3.4 10H38.6z" fill="#ffffff" opacity=".22"/>';
    s += '<path d="M29.4 163h61.2l1.6 6H27.8z" fill="' + darken(botC, .1) + '"/>';
  } else if (bstyle === 'shorts') {
    s += '<path d="M41 133 C40.6 141 41 147 41.4 152 L78.6 152 C79 147 79.4 141 79 133 Z" fill="' + botC + '"/>';
    s += '<path d="M41 139.6h38" stroke="#ffffff" stroke-width="1.8" opacity=".3"/>';
  } else if (bstyle === 'train') {
    s += '<path d="M41 133 C40.4 144 40.6 149.4 41.4 152 L78.6 152 C79.4 149.4 79.6 144 79 133 Z" fill="' + botC + '"/>';
    s += '<path d="M41 140h38" stroke="#ffffff" stroke-width="2" opacity=".38"/>';
  } else if (bstyle === 'pleats') {
    s += '<path d="M41 131h38l12 40H29z" fill="' + botC + '"/>';
    s += '<path d="M46 135l-4 29M54 135l-2 31M62 135v31M70 135l2 31M78 135l4 29" stroke="#ffffff" stroke-width="1.6" opacity=".42"/>';
    s += '<path d="M29 165h62l2 6.4H27z" fill="' + darken(botC, .12) + '"/>';
  } else if (bstyle === 'denimskirt') {
    s += '<path d="M42 131h36l9 33H33z" fill="' + botC + '"/>';
    s += '<path d="M42 136h36" stroke="#ffffff" stroke-width="2.1" opacity=".45"/>';
    s += '<path d="M50 136v23M70 136v23" stroke="#ffffff" stroke-width="1.4" stroke-dasharray="3 3" opacity=".55"/>';
    s += '<path d="M33 160h54l1.4 6H31.6z" fill="' + darken(botC, .12) + '"/>';
    s += '<circle cx="60" cy="136" r="1.5" fill="#ffe08a"/>';
  } else if (bstyle === 'dress') {
    s += '<path d="M38 130h44l6 24 6 30H26l7-30z" fill="' + botC + '"/>';
    s += '<path d="M38 130h44" stroke="' + darken(botC, .14) + '" stroke-width="3" opacity=".45"/>';
    s += '<path d="M26.4 176h67.2l-1.2 8H27.6z" fill="#ffffff" opacity=".55"/>';
    s += '<path d="M56 133h8" stroke="' + darken(botC, .18) + '" stroke-width="2.4"/>';
    s += '<path d="M42 141q18 6 36 0" fill="none" stroke="' + darken(botC, .12) + '" stroke-width="1.6" opacity=".55"/>';
  } else if (bstyle === 'jogger') {
    s += '<path d="M41 133 C40.4 144 40.6 149 41.4 152 L78.6 152 C79.4 149 79.6 144 79 133 Z" fill="' + botC + '"/>';
    s += '<path d="M41 139h38" stroke="#ffffff" stroke-width="1.8" opacity=".28"/>';
  } else {
    /* 청바지 — 이어진 실루엣에 Y자 가랑이 · 무릎 주름 */
    s += '<path d="M41 133 C40.4 144 40.6 149.4 41.4 152 L78.6 152 C79.4 149.4 79.6 144 79 133 Z" fill="' + botC + '"/>';
    s += '<path d="M41 140.4h38" stroke="#ffffff" stroke-width="2.1" opacity=".3"/>';
    s += '<path d="M59.4 148.2q1.4 2.6 1.4 4.4M60.6 148.2q-1.4 2.6-1.4 4.4" stroke="' + darken(botC, .2) + '" stroke-width="1.2" opacity=".5" fill="none"/>';
  }

  /* 몸통·팔·머리는 한 덩어리로 살짝 위아래로 (걷기 바운스) */
  s += '<g class="av-bob">';
  /* ---- 상의 — 목에서 어깨·팔로 이어지는 연속 곡선 ---- */
  s += '<path d="M43.6 103 C47.6 99 52.4 97.6 60 97.6 C67.6 97.6 72.4 99 76.4 103 C80 108 81 118 81 140 L39 140 C39 118 40 108 43.6 103 Z" fill="' + topC + '"/>';
  if (pstyle === 'stand') {
    /* 왼팔 · 오른팔 (어깨에서 손까지 한 붓으로) */
    s += '<g class="av-arm-l">' +
      '<path d="M37 118 C36 126 35.2 131 34.8 135" fill="none" stroke="' + skin + '" stroke-width="9.4" stroke-linecap="round"/>' +
      '<path d="M45.4 104.6 C41.6 109 38.6 113.6 37.2 119.6" fill="none" stroke="' + topC + '" stroke-width="13" stroke-linecap="round"/>' +
      '<path d="M45.4 104.6 C41.6 109 38.6 113.6 37.2 119.6" fill="none" stroke="' + darken(topC, .07) + '" stroke-width="13" stroke-linecap="round" opacity=".0"/>' +
      avHandThumb(34.6, 140, 5.5, skin, 'in') +
      '</g>';
    s += '<g class="av-arm-r">' +
      '<path d="M83 118 C84 126 84.8 131 85.2 135" fill="none" stroke="' + skin + '" stroke-width="9.4" stroke-linecap="round"/>' +
      '<path d="M74.6 104.6 C78.4 109 81.4 113.6 82.8 119.6" fill="none" stroke="' + topC + '" stroke-width="13" stroke-linecap="round"/>' +
      avHandThumb(85.4, 140, 5.5, skin, 'out') +
      '</g>';
  } else {
    s += '<g class="av-arm-l"><path d="M45.4 104.6 C41.6 109 38.6 113.6 37.2 119.6" fill="none" stroke="' + topC + '" stroke-width="13" stroke-linecap="round"/></g>';
    s += '<g class="av-arm-r"><path d="M74.6 104.6 C78.4 109 81.4 113.6 82.8 119.6" fill="none" stroke="' + topC + '" stroke-width="13" stroke-linecap="round"/></g>';
    s += avPoseArms(pstyle, skin, topC, topC2);
  }
  var tstyle = top ? top.style : 'tee';
  if (tstyle === 'stripe') {
    for (var i = 0; i < 3; i++) {
      s += '<path d="M43.4 ' + (106 + i * 9.4) + 'h33.2" stroke="' + topC2 + '" stroke-width="5" opacity=".95"/>';
    }
    s += '<path d="M43.4 106.4h33.2" stroke="#ffffff" stroke-width="1.2" opacity=".3"/>';
  } else if (tstyle === 'hood') {
    s += '<path d="M44 101.4q16 13 32 0q-3.4 13-16 13t-16-13z" fill="' + topC2 + '"/>';
    s += '<rect x="50" y="124" width="20" height="12" rx="5" fill="' + topC2 + '" opacity=".85"/>';
    s += '<path d="M56 104v7M64 104v7" stroke="#ffffff" stroke-width="2" opacity=".7" stroke-linecap="round"/>';
  } else if (tstyle === 'knit') {
    for (var k = 0; k < 4; k++) {
      s += '<path d="M' + (46.5 + k * 9) + ' 104.6v32" stroke="#ffffff" stroke-width="2" opacity=".34"/>';
    }
    s += '<path d="M43.4 103.4q16.6-8.4 33.2 0" stroke="' + topC2 + '" stroke-width="4" fill="none"/>';
  } else if (tstyle === 'blouse') {
    s += '<path d="M53 96.6q7 9.6 14 0l-2 6H55z" fill="' + topC2 + '"/>';
    s += '<path d="M52 98.6q8 10.4 16 0" fill="none" stroke="' + topC2 + '" stroke-width="2.6"/>';
    s += '<path d="M60 105l-5.2-4.2v8.4z" fill="' + topC2 + '"/><path d="M60 105l5.2-4.2v8.4z" fill="' + topC2 + '"/>';
    s += '<circle cx="60" cy="105" r="2.2" fill="' + darken(topC2, .12) + '"/>';
    s += '<circle cx="60" cy="115.6" r="1.7" fill="' + topC2 + '" opacity=".9"/><circle cx="60" cy="124.6" r="1.7" fill="' + topC2 + '" opacity=".9"/>';
    s += '<path d="M45.4 131.4q14.6 5.2 29.2 0" fill="none" stroke="' + topC2 + '" stroke-width="2" opacity=".55"/>';
  } else if (tstyle === 'soccer') {
    s += '<path d="M45.4 99v39M74.6 99v39" stroke="' + topC2 + '" stroke-width="3" opacity=".8"/>';
    s += '<path d="M43 116.4h34" stroke="' + topC2 + '" stroke-width="2.4" opacity=".55"/>';
    s += '<text x="60" y="112" text-anchor="middle" font-size="13" font-weight="900" fill="' + topC2 + '" font-family="inherit">7</text>';
  } else {
    s += '<path d="M52.6 98.6q7.4 6.2 14.8 0" stroke="' + topC2 + '" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".9"/>';
    s += '<circle cx="60" cy="120" r="4.4" fill="' + topC2 + '" opacity=".75"/>';
  }
  if (ast === 'backpack') {
    s += '<path d="M50 100q-7 16-3 30M70 100q7 16 3 30" stroke="' + accC + '" stroke-width="4" fill="none" stroke-linecap="round"/>';
  }

  /* 목 */
  s += '<rect x="54.4" y="90" width="11.2" height="14" rx="4.6" fill="' + darken(skin, .12) + '"/>';
  s += '<rect x="54.4" y="90" width="11.2" height="8" rx="3.4" fill="' + darken(skin, .02) + '"/>';

  /* ---- 얼굴 (갸름한 계란형 + 부드러운 턱선, 귀는 얼굴 폭에 딱 붙게) ---- */
  s += '<ellipse cx="29.5" cy="68" rx="5.6" ry="7.6" fill="url(#' + gSkin + ')"/>';
  s += '<ellipse cx="90.5" cy="68" rx="5.6" ry="7.6" fill="url(#' + gSkin + ')"/>';
  s += '<path d="M30.6 63.8q2.6-1.2 3 1.4" fill="none" stroke="' + darken(skin, .2) + '" stroke-width="1.4" stroke-linecap="round" opacity=".5"/>';
  s += '<path d="M89.4 63.8q-2.6-1.2-3 1.4" fill="none" stroke="' + darken(skin, .2) + '" stroke-width="1.4" stroke-linecap="round" opacity=".5"/>';
  s += '<path d="' + avFacePath() + '" fill="url(#' + gSkin + ')"/>';
  s += '<g clip-path="url(#' + gFace + ')">' +
    '<ellipse cx="60" cy="100" rx="21.5" ry="11" fill="url(#' + gShade + ')" opacity=".5"/>' +
    '</g>';
  s += avFaceSvg(fstyle, girl, skin);

  /* 헤어 (앞머리) — 모양마다 실루엣이 또렷하게 달라요 */
  s += '<g transform="' + hx + '">';
  var cap = '<path d="M27 55.6 C27 34 41 21.6 60 21.6 C79 21.6 93 34 93 55.6 ' +
    'C89.2 51.8 84.8 50 79.4 50.4 C72.6 51 66 52.2 60 52.6 ' +
    'C54 52.2 47.4 51 40.6 50.4 C35.2 50 30.8 51.8 27 55.6 Z" fill="' + hairC + '"/>';
  var hairHi = '#ffffff';
  if (hstyle === 'bob') {
    s += '<path d="M26 56c0-21 15-34 34-34s34 13 34 34z" fill="' + hairC + '"/>';
    s += '<rect x="23" y="52" width="11" height="32" rx="5.5" fill="' + hairC + '"/>';
    s += '<rect x="86" y="52" width="11" height="32" rx="5.5" fill="' + hairC + '"/>';
    s += '<path d="M33 40q14-10 30-8" fill="none" stroke="' + hairHi + '" stroke-width="2.6" opacity=".24"/>';
  } else if (hstyle === 'twin') {
    s += '<circle cx="24" cy="42" r="12" fill="' + hairC + '"/>';
    s += '<circle cx="96" cy="42" r="12" fill="' + hairC + '"/>';
    s += '<circle cx="24" cy="42" r="4" fill="#ff8fb0"/>';
    s += '<circle cx="96" cy="42" r="4" fill="#ff8fb0"/>';
    s += '<path d="M26 56c0-21 15-34 34-34s34 13 34 34z" fill="' + hairC + '"/>';
  } else if (hstyle === 'curly') {
    var curls = [[32, 34], [44, 26], [60, 23], [76, 26], [88, 34], [28, 48], [92, 48]];
    /* 곱슬 사이로 살갗이 비치지 않게 머리 전체를 한 번 깔아요 */
    s += '<path d="M27.4 54c0-18.6 14.6-30.4 32.6-30.4S92.6 35.4 92.6 54z" fill="' + hairC + '"/>';
    for (var ci = 0; ci < curls.length; ci++) s += '<circle cx="' + curls[ci][0] + '" cy="' + curls[ci][1] + '" r="9" fill="' + hairC + '"/>';
    s += '<path d="M27 62c0-16 14-26 33-26s33 10 33 26c-8-8-17-12-33-12s-25 4-33 12z" fill="' + hairC + '"/>';
  } else if (hstyle === 'poodle') {
    var pcurls = [[30, 40], [38, 30], [48, 24], [60, 21], [72, 24], [82, 30], [90, 40], [27, 54], [93, 54], [26, 67], [94, 67]];
    /* 곱슬 사이로 살갗이 비치지 않게 머리 전체를 한 번 깔아요 */
    s += '<path d="M27.4 56c0-19 14.6-31 32.6-31S92.6 37 92.6 56z" fill="' + hairC + '"/>';
    for (var pc = 0; pc < pcurls.length; pc++) s += '<circle cx="' + pcurls[pc][0] + '" cy="' + pcurls[pc][1] + '" r="8.2" fill="' + hairC + '"/>';
    s += '<path d="M28 64c0-18 14-28 32-28s32 10 32 28c-8-9-18-13-32-13s-24 4-32 13z" fill="' + hairC + '"/>';
  } else if (hstyle === 'buzz') {
    s += '<path d="M28 60c0-20 14-31 32-31s32 11 32 31q-6-10-32-10t-32 10z" fill="' + hairC + '"/>';
    s += '<path d="M46 31l3 7 4-6 4 7 3-6 4 6" fill="none" stroke="' + hairC + '" stroke-width="3" stroke-linecap="round"/>';
  } else if (hstyle === 'bang') {
    s += '<path d="M27 64c0-23 14-37 33-37s33 14 33 37c-2-12-6-18-13-19-6 5-12 7-20 7s-14-2-20-7c-7 1-11 7-13 19z" fill="' + hairC + '"/>';
    s += '<path d="M39 47h42" stroke="' + hairHi + '" stroke-width="2.6" opacity=".2"/>';
  } else if (hstyle === 'spiky') {
    s += '<path d="M26 62c0-23 15-36 34-36s34 13 34 36l-7-9-6 6-4-12-7 10-6-14-6 14-7-10-4 12-6-6z" fill="' + hairC + '"/>';
    s += '<path d="M34 46q12-8 26-7" fill="none" stroke="' + hairHi + '" stroke-width="2.2" opacity=".22"/>';
  } else if (hstyle === 'parted') {
    s += '<path d="M26 62c0-23 15-36 34-36 18 0 30 10 33 27-6-6-12-9-19-9-9 0-16 4-21 10-4 5-6 12-6 20-6-14-11-15-21-12z" fill="' + hairC + '"/>';
    s += '<path d="M62 30q-3 12 2 22" fill="none" stroke="' + hairHi + '" stroke-width="2" opacity=".26"/>';
  } else if (hstyle === 'bowl') {
    s += '<path d="M25 66c0-25 16-39 35-39s35 14 35 39l-3 8c-2-16-6-22-14-23H42c-8 1-12 7-14 23z" fill="' + hairC + '"/>';
    s += '<path d="M42 44h36" stroke="' + hairHi + '" stroke-width="2.8" opacity=".22"/>';
  } else if (hstyle === 'mohawk') {
    /* 옆머리는 짧게 붙이고 가운데만 세운 크레스트 */
    s += '<path d="M28 57.6c0-20.4 14.2-31.4 32-31.4s32 11 32 31.4q-6.2-11.4-32-11.4T28 57.6z" fill="' + hairC + '"/>';
    s += '<path d="M49 44 C49 27 52.6 16.4 60.2 11.8 C67.8 16.4 71 27 71 44 Z" fill="' + hairC + '"/>';
    s += '<path d="M58 19q1.4 11 1 23" fill="none" stroke="' + hairHi + '" stroke-width="1.8" opacity=".26"/>';
    s += '<path d="M36.4 40.2q7.8-4.4 13.4-3.4" fill="none" stroke="' + hairHi + '" stroke-width="1.8" opacity=".2"/>';
    s += '<path d="M83.6 40.2q-7.8-4.4-13.4-3.4" fill="none" stroke="' + hairHi + '" stroke-width="1.8" opacity=".2"/>';
  } else if (hstyle === 'crop') {
    s += '<path d="M28 51.6c0-20.6 14-32.6 32-32.6s32 12 32 32.6c-3-6-7-9-12-10-6 2-13 3-20 3s-14-1-20-3c-5 1-9 4-12 10z" fill="' + hairC + '"/>';
    s += '<path d="M42 33c-3 5-4.4 9-4.6 13" fill="none" stroke="' + hairHi + '" stroke-width="2" opacity=".18"/>';
  } else if (hstyle === 'dandy') {
    s += '<path d="M29 54c0-18 14-29 31-29s31 11 31 29q-4-7-9-9H38q-5 2-9 9z" fill="' + lighten(hairC, .26) + '"/>';
    s += '<path d="M30 45c1-14 13-23 30-23s29 9 30 23c-2 2-5 2-8 0-6-4-14-6-22-6s-16 2-22 6c-3 2-6 2-8 0z" fill="' + hairC + '"/>';
    s += '<path d="M38 32q11-7 24-6" fill="none" stroke="' + hairHi + '" stroke-width="2.2" opacity=".24"/>';
  } else if (hstyle === 'comma') {
    s += cap;
    s += '<path d="M62 29c10 3 17 11 18 22 1 7-1 12-5 13-3 1-5-1-5-4 0-7-4-12-10-15-4-2-8-3-12-2 4-5 9-9 14-14z" fill="' + lighten(hairC, .1) + '"/>';
    s += '<path d="M50 34c-5 6-8 12-9 19" fill="none" stroke="' + hairHi + '" stroke-width="2.2" opacity=".24"/>';
  } else if (hstyle === 'regent') {
    s += cap;
    s += '<path d="M38 36c4-14 18-21 31-15 8 4 13 11 15 20-4-6-9-10-15-11-9-2-17 1-23 8-2 2-4 3-8 2z" fill="' + lighten(hairC, .18) + '"/>';
    s += '<path d="M45 25q15-6 28 2" fill="none" stroke="' + hairHi + '" stroke-width="2.2" opacity=".32"/>';
    s += '<path d="M40 44q8-6 18-6" fill="none" stroke="' + hairHi + '" stroke-width="2" opacity=".2"/>';
  } else if (hstyle === 'shag') {
    s += '<path d="M26 58c0-23 15-36 34-36s34 13 34 36c0 8-2 14-5 17-3 2-6 1-6-2 0-2 0-4-1-6-2 3-4 5-7 6-3 1-4-1-3-4 0-2 1-4 1-6-3 3-8 5-13 5s-10-2-13-5c0 2 1 4 1 6 1 3 0 5-3 4-3-1-5-3-7-6-1 2-1 4-1 6 0 3-3 4-6 2-3-3-5-9-5-17z" fill="' + hairC + '"/>';
    s += '<path d="M38 44q22-13 44 0" fill="none" stroke="' + hairHi + '" stroke-width="2.4" opacity=".22"/>';
    s += '<path d="M31 56q-1 8 1 14M89 56q1 8-1 14" stroke="' + hairC + '" stroke-width="3.6" stroke-linecap="round"/>';
  } else if (hstyle === 'hime') {
    s += '<path d="M27 50c0-18 15-28 33-28s33 10 33 28z" fill="' + hairC + '"/>';
    s += '<rect x="27" y="44" width="66" height="9" rx="3" fill="' + hairC + '"/>';
    s += '<rect x="25" y="49" width="13" height="47" rx="5" fill="' + hairC + '"/>';
    s += '<rect x="82" y="49" width="13" height="47" rx="5" fill="' + hairC + '"/>';
    s += '<path d="M34 51h52" stroke="' + hairHi + '" stroke-width="2" opacity=".2"/>';
  } else if (hstyle === 'bunup') {
    s += cap;
    s += '<circle cx="60" cy="19" r="13" fill="' + lighten(hairC, .06) + '"/>';
    s += '<path d="M50 18q10-6 20 0" fill="none" stroke="' + hairHi + '" stroke-width="2.2" opacity=".3"/>';
    s += '<ellipse cx="60" cy="29" rx="12" ry="3.6" fill="#ff8fb0"/>';
    s += '<circle cx="60" cy="29" r="2.4" fill="#ff6fa1"/>';
    s += '<path d="M40 42q20-12 40 0" fill="none" stroke="' + hairHi + '" stroke-width="2.6" opacity=".22"/>';
  } else if (hstyle === 'long') {
    s += cap;
    s += '<path d="M36 44q12-16 26-13" fill="none" stroke="' + hairHi + '" stroke-width="2.4" opacity=".18"/>';
  } else if (hstyle === 'wave') {
    s += cap;
    s += '<path d="M33 42q14-16 30-12" fill="none" stroke="' + hairHi + '" stroke-width="2.6" opacity=".22"/>';
  } else if (hstyle === 'pony') {
    s += '<path d="M28 60c0-20 14-31 32-31s32 11 32 31c-9-11-18-15-32-15s-23 4-32 15z" fill="' + hairC + '"/>';
    s += '<path d="M42 40q18-10 36 0" fill="none" stroke="' + hairHi + '" stroke-width="2.4" opacity=".2"/>';
  } else if (hstyle === 'buns') {
    s += cap;
    s += '<circle cx="40" cy="27" r="11.5" fill="' + hairC + '"/>';
    s += '<circle cx="80" cy="27" r="11.5" fill="' + hairC + '"/>';
    s += '<path d="M34 25q6-5 12 0M74 25q6-5 12 0" fill="none" stroke="' + hairHi + '" stroke-width="2" opacity=".24"/>';
  } else if (hstyle === 'ribbon') {
    s += cap;
    s += '<path d="M60 26l-14-9 2 17z" fill="#ff8fb0"/><path d="M60 26l14-9-2 17z" fill="#ff8fb0"/>';
    s += '<circle cx="60" cy="26" r="4.2" fill="#ff6fa1"/>';
  } else {
    /* 기본 머리 — 이마를 자연스럽게 덮는 앞머리 + 귀 앞으로 내려오는 구레나룻 */
    s += '<path d="M28.8 66.8 C29.6 62.6 30.6 57.2 32 52.6 ' +
      'Q35.8 55.6 41.6 56 Q46.2 53.4 50.4 49.8 Q54.4 51.8 58.4 56.2 ' +
      'Q63 53.8 67.2 50 Q71.6 52 75.6 55.6 Q81 55 84.4 52.4 ' +
      'C85.6 57.4 86.8 62.6 87.8 66.8 ' +
      'C90.4 63.6 93.1 58 93.4 52 ' +
      'C93.4 33.2 78.8 19.6 60 19.6 C41.2 19.6 26.6 33.2 26.6 52 ' +
      'C26.6 58 27.9 62.8 28.8 66.8 Z" fill="' + hairC + '"/>';
  }
  /* 앞머리 윤기 — 어떤 머리든 머리 위쪽에 한 줄 반짝 */
  s += '<path d="M43.6 38.6q10-8.6 22-8.2" fill="none" stroke="#ffffff" stroke-width="2.8" stroke-linecap="round" opacity=".16"/>';
  s += '</g>';

  /* 모자 · 머리장식 */
  s += '<g transform="' + hx + '">';
  if (hst === 'cap') {
    s += '<path d="M28 52c0-20 14-30 32-30s32 10 32 30z" fill="' + hatC + '"/>';
    s += '<path d="M28 52h44q10 0 14 5H26z" fill="' + hatC + '" opacity=".85"/>';
    s += '<circle cx="60" cy="24" r="3" fill="#ffffff" opacity=".7"/>';
  } else if (hst === 'beanie') {
    s += '<path d="M27 52c0-22 15-32 33-32s33 10 33 32z" fill="' + hatC + '"/>';
    s += '<rect x="24" y="47" width="72" height="12" rx="6" fill="' + lighten(hatC, .18) + '"/>';
    s += '<circle cx="60" cy="15" r="7" fill="#ffffff" opacity=".9"/>';
    s += '<path d="M40 30v14M60 24v22M80 30v14" stroke="#ffffff" stroke-width="1.6" opacity=".28"/>';
  } else if (hst === 'crown') {
    s += '<path d="M38 32l4-14 8 9 10-13 10 13 8-9 4 14z" fill="' + hatC + '" stroke="#e0a800" stroke-width="1.5"/>';
    s += '<circle cx="60" cy="24" r="2.6" fill="#ff6b8a"/>';
  } else if (hst === 'bunnyband') {
    s += '<g transform="translate(0,-6)">';
    s += '<path d="M30 54q30-22 60 0" fill="none" stroke="' + hatC + '" stroke-width="6" stroke-linecap="round"/>';
    s += '<ellipse cx="43" cy="20" rx="7.5" ry="17" fill="#ffffff" stroke="#f3c6d8" stroke-width="2" transform="rotate(-12 43 20)"/>';
    s += '<ellipse cx="43" cy="20" rx="3.6" ry="10" fill="#ffc2d6" transform="rotate(-12 43 20)"/>';
    s += '<ellipse cx="77" cy="20" rx="7.5" ry="17" fill="#ffffff" stroke="#f3c6d8" stroke-width="2" transform="rotate(12 77 20)"/>';
    s += '<ellipse cx="77" cy="20" rx="3.6" ry="10" fill="#ffc2d6" transform="rotate(12 77 20)"/>';
    s += '</g>';
  } else if (hst === 'catband') {
    s += '<g transform="translate(0,-6)">';
    s += '<path d="M30 54q30-22 60 0" fill="none" stroke="' + hatC + '" stroke-width="6" stroke-linecap="round"/>';
    s += '<path d="M34 44l2-18 16 10z" fill="' + hatC + '"/>';
    s += '<path d="M86 44l-2-18-16 10z" fill="' + hatC + '"/>';
    s += '<path d="M40 40l1-9 7 5z" fill="#ffd0e0"/><path d="M80 40l-1-9-7 5z" fill="#ffd0e0"/>';
    s += '</g>';
  } else if (hst === 'ribbonpin') {
    s += '<path d="M66 26l-13-7 2 14z" fill="' + hatC + '"/><path d="M66 26l13-7-2 14z" fill="' + hatC + '"/>';
    s += '<circle cx="66" cy="26" r="3.6" fill="#ffd34d"/>';
    s += '<path d="M26 32l1.6 4.2 4.2 1.6-4.2 1.6L26 43.6l-1.6-4.2L20.2 37.8l4.2-1.6z" fill="#ffe066" stroke="#f0b400" stroke-width="1"/>';
  } else if (hst === 'explorer') {
    s += '<ellipse cx="60" cy="50" rx="44" ry="9" fill="' + hatC + '"/>';
    s += '<path d="M32 50q0-24 28-24t28 24z" fill="' + lighten(hatC, .1) + '"/>';
    s += '<rect x="30" y="42" width="60" height="7" rx="3.5" fill="#8a5a2b"/>';
  } else if (hst === 'beret') {
    s += '<ellipse cx="62" cy="34" rx="31" ry="15" fill="' + hatC + '" transform="rotate(-8 62 34)"/>';
    s += '<ellipse cx="62" cy="30" rx="25" ry="10" fill="' + lighten(hatC, .2) + '" opacity=".55" transform="rotate(-8 62 30)"/>';
    s += '<circle cx="89" cy="22" r="3.4" fill="' + darken(hatC, .12) + '"/>';
  }
  s += '</g>';

  /* 안경 · 얼굴 소품 */
  if (ast === 'glasses') {
    s += '<circle cx="48" cy="66" r="9.6" fill="none" stroke="' + accC + '" stroke-width="2.5"/>';
    s += '<circle cx="72" cy="66" r="9.6" fill="none" stroke="' + accC + '" stroke-width="2.5"/>';
    s += '<path d="M57.6 66h4.8" stroke="' + accC + '" stroke-width="2.5"/>';
    s += '<path d="M38.4 63.2l-7.6-2.8M81.6 63.2l7.6-2.8" stroke="' + accC + '" stroke-width="2.1" stroke-linecap="round"/>';
  } else if (ast === 'heartglasses') {
    s += '<path d="M48 59.4c-3.8-3.8-8.4-1-8.4 3.8 0 4.7 4.7 7.6 8.4 11.4 3.7-3.8 8.4-6.7 8.4-11.4 0-4.8-4.6-7.6-8.4-3.8z" fill="' + accC + '" opacity=".92" stroke="#ffffff" stroke-width="1.4"/>';
    s += '<path d="M72 59.4c-3.8-3.8-8.4-1-8.4 3.8 0 4.7 4.7 7.6 8.4 11.4 3.7-3.8 8.4-6.7 8.4-11.4 0-4.8-4.6-7.6-8.4-3.8z" fill="' + accC + '" opacity=".92" stroke="#ffffff" stroke-width="1.4"/>';
    s += '<path d="M57 65h6" stroke="' + accC + '" stroke-width="2.3"/>';
  } else if (ast === 'starglasses') {
    s += '<path d="M48 57.6l2.7 5.6 6.1.8-4.4 4.2 1.1 6-5.5-3-5.5 3 1.1-6-4.4-4.2 6.1-.8z" fill="' + accC + '"/>';
    s += '<path d="M72 57.6l2.7 5.6 6.1.8-4.4 4.2 1.1 6-5.5-3-5.5 3 1.1-6-4.4-4.2 6.1-.8z" fill="' + accC + '"/>';
    s += '<path d="M45 65.4l2-2.6M69 65.4l2-2.6" stroke="#ffffff" stroke-width="1.4" opacity=".8" stroke-linecap="round"/>';
    s += '<path d="M57.4 65h5.2" stroke="' + accC + '" stroke-width="2"/>';
  } else if (ast === 'bag') {
    s += '<path d="M45 102l24 44" stroke="' + accC + '" stroke-width="5" stroke-linecap="round"/>';
    s += '<rect x="62" y="128" width="26" height="20" rx="6" fill="' + accC + '"/>';
    s += '<rect x="62" y="128" width="26" height="7" rx="3.5" fill="#ffffff" opacity=".45"/>';
  } else if (ast === 'necklace') {
    s += '<path d="M48 92q12 12 24 0" fill="none" stroke="' + accC + '" stroke-width="2.4"/>';
    s += '<circle cx="60" cy="99" r="3.4" fill="' + accC + '" stroke="#e0a800" stroke-width="1"/>';
  }

  s += '</g>';   /* av-bob */
  s += '</g>';   /* av-fig */
  return s;
}

/* 어린이 얼굴 — 갸름한 계란형(가로 57) · 볼은 부드럽게, 턱은 살짝 좁게 */
function avFacePath() {
  return 'M60 28.4 C49.8 28.4 39.8 33.2 34.8 43.2 C32.2 48.2 31.26 55.2 31.56 62.2 ' +
    'C32.1 74 36.4 84.4 43.6 92 C48.2 96.8 53.7 99.2 60 99.2 ' +
    'C66.3 99.2 71.8 96.8 76.4 92 C83.6 84.4 87.9 74 88.44 62.2 ' +
    'C88.74 55.2 87.8 48.2 85.4 43.2 C80.2 33.2 70.2 28.4 60 28.4 Z';
}

function avatarSvg(av, cls) {
  return '<svg viewBox="0 0 120 200" class="' + (cls || 'av-svg') + '" aria-hidden="true">' + avatarInner(av) + '</svg>';
}

/* ===== 아바타 피팅룸: 탭에서 고른 것은 모두 '미리보기(draft)' =====
   위쪽 ✅ 적용하기를 눌러야 저장되고, 머리색이 바뀌었을 때만 염색 요금이 나가요. */
var AV_ALL_KEYS = ['gender', 'skin', 'hairColor', 'hair', 'top', 'bottom', 'shoes', 'hat', 'acc', 'face', 'pose'];
var AV_WEAR_KEYS = ['hair', 'top', 'bottom', 'shoes', 'hat', 'acc', 'face', 'pose'];
var AV_DEFAULT_HAIR_COLOR = 'brown';

function avatarClone(av) {
  var o = {}, fallback = { gender: 'boy', skin: 'skin1', hairColor: AV_DEFAULT_HAIR_COLOR, hair: 'av_hair_basic',
    top: 'av_top_tee', bottom: 'av_bottom_jeans', shoes: 'av_shoes_sneaker', hat: '', acc: '', face: '', pose: '' };
  for (var i = 0; i < AV_ALL_KEYS.length; i++) {
    var k = AV_ALL_KEYS[i];
    o[k] = (av && av[k] != null) ? av[k] : fallback[k];
  }
  return o;
}
function avatarShown() { return avatarUi.draft || prof().avatar; }
function avatarDraftAv() {
  if (!avatarUi.draft) avatarUi.draft = avatarClone(prof().avatar);
  return avatarUi.draft;
}
function avatarDirty() {
  var d = avatarUi.draft;
  if (!d) return false;
  var s = prof().avatar;
  for (var i = 0; i < AV_ALL_KEYS.length; i++) {
    var k = AV_ALL_KEYS[i];
    if (String(d[k] == null ? '' : d[k]) !== String(s[k] == null ? '' : s[k])) return true;
  }
  return false;
}
/* 머리색이 바뀌었을 때만 염색 요금 — 기본(밤색)으로 되돌리는 건 무료 */
function avatarDyeFee() {
  var d = avatarUi.draft;
  if (!d) return 0;
  var saved = prof().avatar.hairColor || AV_DEFAULT_HAIR_COLOR;
  var next = d.hairColor || AV_DEFAULT_HAIR_COLOR;
  if (saved === next) return 0;
  if (next === AV_DEFAULT_HAIR_COLOR) return 0;
  return HAIR_DYE_COST;
}

/* 상점에서 산 옷은 바로 입어요 — 피팅룸 미리보기와 별개 */
function wearAvatarNow(slot, id) {
  var it = avItem(id);
  if (!it || it.slot !== slot) return;
  prof().avatar[slot] = id;
  prof().owned[id] = 1;
  prof().updatedAt = new Date().toISOString();
  if (avatarUi.draft) avatarUi.draft[slot] = id;
  if (!document.getElementById('avatarModal').hidden) renderAvatar(true);
  renderPet();
  if (!document.getElementById('roomModal').hidden) renderRoom();
}

function equipAvatar(slot, id, silent) {
  var it = avItem(id);
  if (!it || it.slot !== slot) return;
  if (!isOwned(id) && it.price > 0) return;
  avatarDraftAv()[slot] = id;
  if (!silent) {
    snd('sticker');
    if (slot === 'face') showToast('😊 ' + it.name + ' 표정을 미리 보는 중이에요!');
    else if (slot === 'pose') showToast('🕺 ' + it.name + ' 동작을 미리 보는 중이에요!');
    else showToast('👕 ' + josa(it.name, '을', '를') + ' 입어 보는 중이에요!');
  }
  renderAvatar(true);
}

function setAvatarSkin(id) {
  avatarDraftAv().skin = id;
  renderAvatar(true);
}
function setAvatarHairColor(id) {
  avatarDraftAv().hairColor = id;
  renderAvatar(true);
}

var avatarUi = { slot: 'hair', salon: false, draft: null };   /* draft: 저장 전 미리보기 · salon: 아래 칸을 머리색 고르기로 */

function openAvatar() {
  avatarUi.draft = null;      /* 창을 열 때는 항상 저장된 모습으로 시작해요 */
  avatarUi.salon = false;
  renderAvatar();
  var m = document.getElementById('avatarModal');
  if (m) m.hidden = false;
  raiseModal('avatarModal');
  lockScroll();
}
function closeAvatar() {
  avatarUi.draft = null;      /* 확인하지 않고 닫으면 미리보기는 사라지고 코인은 그대로예요 */
  avatarUi.salon = false;
  var m = document.getElementById('avatarModal');
  if (m) m.hidden = true;
  if (isOnlyModal('avatarModal')) unlockScroll();
}

function avGender(av) {
  var g = (av || prof().avatar || {}).gender;
  return g === 'girl' ? 'girl' : 'boy';
}

function genderButtonsHtml(av) {
  var h = '', cur = avGender(av);
  for (var i = 0; i < AV_GENDERS.length; i++) {
    var g = AV_GENDERS[i];
    h += '<button type="button" class="gender-btn' + (cur === g.id ? ' on' : '') + '" data-act="av-gender" data-id="' + g.id + '"' +
      (cur === g.id ? ' aria-pressed="true"' : '') + '>' + g.icon + ' ' + g.label + '</button>';
  }
  return h;
}

/* 성별마다 시작 옷·시작 머리 (모두 0코인) */
var AV_STARTER = {
  boy: { hair: 'av_hair_short', top: 'av_top_tee', bottom: 'av_bottom_shorts' },
  girl: { hair: 'av_hair_long', top: 'av_top_blouse', bottom: 'av_bottom_skirt' }
};
/* 아직 아무것도 안 고른 기본 모습 */
var AV_PLAIN = { hair: 'av_hair_basic', top: 'av_top_tee', bottom: 'av_bottom_jeans' };

function setAvatarGender(id) {
  if (id !== 'boy' && id !== 'girl') return;
  var av = avatarDraftAv();
  if (avGender(av) === id) return;
  var from = avGender(av);
  av.gender = id;
  /* 지금 입은 게 '반대 성별 시작 옷'이거나 '아직 기본'이면 새 성별 시작 옷으로 갈아입혀요.
     아이가 골라 입은 옷은 그대로 둬요. */
  var swap = ['hair', 'top', 'bottom'], swapped = [];
  for (var si = 0; si < swap.length; si++) {
    var slot = swap[si], cur = av[slot], it = avItem(cur);
    var cg = it ? (it.g || 'both') : 'both';
    var otherStarter = (AV_STARTER[from] && AV_STARTER[from][slot] === cur);
    var plain = (AV_PLAIN[slot] === cur);
    var otherOnly = (cg !== 'both' && cg !== id);
    if (!(otherStarter || plain || otherOnly)) continue;
    var next = AV_STARTER[id][slot];
    if (!avItem(next) || next === cur) continue;
    av[slot] = next;
    swapped.push(slot);
  }
  snd('sticker');
  showToast((id === 'girl' ? '👧 여아' : '👦 남아') + ' 아바타를 미리 보는 중이에요!' +
    (swapped.length ? ' 머리와 옷도 ' + (id === 'girl' ? '여아' : '남아') + ' 기본으로 맞췄어요.' : ''));
  renderAvatar(true);
}

/* 💇 미용실: 색을 누르면 미리보기만 — 위쪽 ✅ 적용하기를 눌러야 염색 요금이 나가요 */
function hairColorById(id) {
  for (var i = 0; i < AV_HAIR_COLORS.length; i++) if (AV_HAIR_COLORS[i].id === id) return AV_HAIR_COLORS[i];
  return null;
}
function dyePick(id) {
  var c = hairColorById(id);
  if (!c) return;
  var d = avatarDraftAv();
  if (d.hairColor === id) return;
  d.hairColor = id;
  renderAvatar(true);
}

/* 미리보기를 저장해요 (머리색이 바뀌었을 때만 염색 요금) */
function applyAvatarDraft() {
  if (!avatarDirty()) return;
  var p = prof(), d = avatarUi.draft;
  var fee = avatarDyeFee();
  if (fee > 0 && p.coins < fee) {
    snd('uncheck');
    showToast(coinSvg() + ' 코인이 부족해요. 염색은 ' + HAIR_DYE_COST + '코인이에요!', true);
    return;
  }
  if (fee > 0) p.coins -= fee;
  for (var i = 0; i < AV_ALL_KEYS.length; i++) {
    var k = AV_ALL_KEYS[i];
    p.avatar[k] = d[k];
  }
  for (var w = 0; w < AV_WEAR_KEYS.length; w++) {
    var wid = p.avatar[AV_WEAR_KEYS[w]];
    if (wid) p.owned[wid] = 1;
  }
  p.updatedAt = new Date().toISOString();
  avatarUi.draft = null;
  saveState();
  renderCoinBadge();
  snd('chime');
  showToast(fee > 0
    ? '✅ 적용했어요! 머리색 염색 ' + coinSvg() + ' -' + fee
    : '✅ 아바타를 적용했어요!', true);
  renderAvatar(true);
  renderPet();
  if (!document.getElementById('roomModal').hidden) renderRoom();
}
function revertAvatarDraft() {
  if (!avatarUi.draft) return;
  avatarUi.draft = null;
  renderAvatar(true);
  showToast('↩️ 미리 보기를 되돌렸어요. 코인은 그대로예요!');
}
/* 🔄 초기화: 아바타를 깨끗한 기본 모습으로 (미리보기만 — 적용하기를 눌러야 저장) */
function resetAvatarDraft() {
  var d = avatarDraftAv();
  var g = avGender(d);
  d.gender = g;
  d.skin = 'skin1';
  d.hairColor = AV_DEFAULT_HAIR_COLOR;
  d.hair = AV_PLAIN.hair;
  d.top = AV_PLAIN.top;
  d.bottom = AV_PLAIN.bottom;
  d.shoes = 'av_shoes_sneaker';
  d.hat = '';
  d.acc = '';       /* 모자·안경·날개·가방도 같이 비워요 */
  d.face = 'av_face_smile';
  d.pose = 'av_pose_stand';   /* 영웅 포즈의 망토까지 사라져요 */
  avatarUi.salon = false;
  renderAvatar(true);
  showToast('🔄 아바타를 처음 모습으로 되돌렸어요. 위쪽 ✅ 적용하기를 누르면 저장돼요!');
}

function salonHtml(av, p) {
  var can = p.coins >= HAIR_DYE_COST;
  var savedId = p.avatar.hairColor || AV_DEFAULT_HAIR_COLOR;
  var fee = avatarDyeFee();
  var h = '<div class="salon" id="hairSalon">' +
    '<div class="salon-head"><b>💇 미용실 · 머리 염색</b><small>' + coinSvg() + ' ' + HAIR_DYE_COST + '코인</small></div>' +
    '<p class="lf-note">색을 누르면 <b>미리보기</b>만 해요. 마음에 들면 위쪽 <b>✅ 적용하기</b>를 눌러 ' + HAIR_DYE_COST + '코인으로 염색해요. 저장된 색은 무료예요.</p>' +
    '<div class="salon-grid">';
  for (var i = 0; i < AV_HAIR_COLORS.length; i++) {
    var c = AV_HAIR_COLORS[i];
    var now = savedId === c.id;
    var picked = av.hairColor === c.id && !now;
    h += '<button type="button" class="salon-sw' + (picked ? ' prev' : (now ? ' on' : '')) + '" data-act="av-dye" data-id="' + c.id + '" style="--sw:' + c.color + '" title="' + esc(c.label) + ' 머리색"' +
      ((now || picked) ? ' aria-pressed="true"' : '') + '>' +
      '<span class="ssw-dot"></span><b>' + esc(c.label) + '</b>' +
      '<small>' + (now ? '현재 색' : (picked ? '고른 색' : (can ? coinSvg() + ' ' + HAIR_DYE_COST : '코인 부족'))) + '</small>' +
      '</button>';
  }
  h += '</div>';
  if (fee > 0) {
    h += '<p class="salon-note" id="salonNote">💇 위쪽 <b>✅ 적용하기 (염색 ' + coinSvg() + ' ' + fee + ')</b>를 누르면 염색돼요. 아직 코인은 그대로예요!</p>';
  }
  h += '</div>';
  return h;
}

function avatarSlotItems(slot) {
  var list = shopAll(), out = [];
  for (var i = 0; i < list.length; i++) {
    var it = list[i];
    if (it.kind !== 'cloth' || it.slot !== slot || it.hidden) continue;
    out.push(it);
  }
  return out;
}

var AV_GROUP_TITLE = {
  boy: { icon: '👦', label: '남아 머리' },
  girl: { icon: '👧', label: '여아 머리' },
  both: { icon: '🧑', label: '남녀 공용 머리' }
};

/* 지금 고른 성별 → 다른 성별 → 공용 순서로 묶고, 0코인 머리를 먼저 보여 줘요 */
function avatarItemGroups(slot) {
  var g = avGender(avatarShown());
  var order = [g, (g === 'girl' ? 'boy' : 'girl'), 'both'];
  var all = avatarSlotItems(slot), groups = [];
  for (var oi = 0; oi < order.length; oi++) {
    var gems = [];
    for (var i = 0; i < all.length; i++) if ((all[i].g || 'both') === order[oi]) gems.push(all[i]);
    gems.sort(function (a, b) { return (a.price > 0 ? 1 : 0) - (b.price > 0 ? 1 : 0); });
    groups.push({ g: order[oi], items: gems });
  }
  return groups;
}

function avCardHtml(av, p, it, slot) {
  var ownIt = it.price <= 0 || p.owned[it.id];
  var on = av[slot] === it.id;
  var ig = it.g || 'both';
  var gmark = (ig !== 'both' && (slot === 'top' || slot === 'bottom')) ? (ig === 'boy' ? ' 👦' : ' 👧') : '';
  var tmpAv = {}, ak;
  for (ak in av) if (Object.prototype.hasOwnProperty.call(av, ak)) tmpAv[ak] = av[ak];
  tmpAv[it.slot] = it.id;
  /* 머리·모자는 얼굴을 크게, 옷은 입은 부분만 크게 보여 줘야 모양이 구분돼요 */
  var thumbVB = '0 0 120 200', thumbCls = ' av-thumb-fig';
  if (slot === 'hair') {
    thumbVB = '18 -12 84 104'; thumbCls = ' av-thumb-fig face';
    tmpAv.hat = '';   /* 머리 모양이 잘 보이도록 미리보기에서는 모자를 벗겨요 */
  } else if (slot === 'hat') {
    thumbVB = '6 0 108 108'; thumbCls = ' av-thumb-fig face';
  } else if (slot === 'acc') {
    thumbVB = '8 8 104 124'; thumbCls = ' av-thumb-fig bust';
  } else if (slot === 'top') {
    thumbVB = '20 86 80 62'; thumbCls = ' av-thumb-fig bust';
  } else if (slot === 'bottom') {
    thumbVB = '22 118 76 86'; thumbCls = ' av-thumb-fig bust';
  } else if (slot === 'face') {
    thumbVB = '22 28 76 74'; thumbCls = ' av-thumb-fig face';
  } else if (slot === 'pose') {
    thumbVB = '0 0 120 200'; thumbCls = ' av-thumb-fig pose';
  }
  var ownTxt = slot === 'face' ? (on ? '쓰는 중' : '써 보기')
    : slot === 'pose' ? (on ? '하는 중' : '해 보기')
    : (on ? '입는 중' : '입어 보기');
  return '<button type="button" class="av-card' + (on ? ' on' : '') + (ownIt ? '' : ' locked') + '" data-act="av-wear" data-id="' + esc(it.id) + '">' +
    '<span class="av-thumb' + thumbCls + '">' + '<svg viewBox="' + thumbVB + '" aria-hidden="true">' + avatarInner(tmpAv) + '</svg></span>' +
    '<b>' + esc(it.name) + gmark + '</b>' +
    '<small>' + (ownIt ? ownTxt : coinSvg() + ' ' + fmtNum(it.price)) + (it.anim ? ' · 🎬' : '') + '</small>' +
    '</button>';
}

/* 머리색 줄: 지금(또는 미리보는) 색 동그라미 + 이름 + 💇 미용실 버튼 */
function avHairLineHtml(av) {
  var shown = avHairColor(av);
  var changed = String(av.hairColor || AV_DEFAULT_HAIR_COLOR) !== String(prof().avatar.hairColor || AV_DEFAULT_HAIR_COLOR);
  return '<div class="av-hairline" id="avHairLine">' +
    '<span>머리색</span>' +
    '<span class="ah-dot" style="--sw:' + shown.color + '" aria-hidden="true"></span>' +
    '<b class="ah-name" id="avHairName">' + esc(shown.label) + (changed ? '<small>미리보기</small>' : '') + '</b>' +
    '<button type="button" class="ah-salon' + (avatarUi.salon ? ' on' : '') + '" data-act="av-salon" aria-pressed="' + (avatarUi.salon ? 'true' : 'false') + '">' +
      (avatarUi.salon ? '← 헤어로' : '💇 미용실') + '</button>' +
    '</div>';
}

/* 미리보기가 저장된 모습과 다를 때만 뜨는 적용 막대 */
function avApplyBarHtml() {
  if (!avatarDirty()) return '';
  var fee = avatarDyeFee();
  return '<div class="av-applybar" id="avApplyBar">' +
    '<span class="aab-msg">👀 미리 보는 중 · 아직 저장 전이에요</span>' +
    '<button type="button" class="aab-go" data-act="av-apply">✅ 적용하기' +
      (fee > 0 ? ' (염색 ' + coinSvg() + ' ' + fee + ')' : '') + '</button>' +
    '<button type="button" class="aab-back" data-act="av-revert">↩️ 되돌리기</button>' +
    '</div>';
}

function avTopHtml(av, p) {
  var h = '<div class="av-top">' +
    '<div class="av-preview">' + avatarSvg(av) + '</div>' +
    '<div class="av-side">' +
      '<div class="av-title-row"><b>나의 아바타</b>' +
        '<button type="button" class="av-reset" data-act="ach-open">🏆 업적</button>' +
        '<button type="button" class="av-reset" data-act="av-reset">🔄 초기화</button></div>' +
      '<div class="xpbar av-xp" data-xpbar></div>' +
      '<p class="lf-note">옷·표정·동작을 고르면 미리 보여 주고, 위쪽 <b>적용하기</b>를 누르면 저장돼요.</p>' +
      '<div class="av-gender"><span>성별</span>' + genderButtonsHtml(av) + '</div>' +
      '<div class="av-swatches"><span>피부</span>';
  for (var i = 0; i < AV_SKINS.length; i++) {
    h += '<button type="button" class="sw' + (av.skin === AV_SKINS[i].id ? ' on' : '') + '" data-act="av-skin" data-id="' + AV_SKINS[i].id + '" style="--sw:' + AV_SKINS[i].color + '" title="' + esc(AV_SKINS[i].label) + '"></button>';
  }
  h += '</div>' +
      avHairLineHtml(av) +
      '<div class="shop-coin">' + coinSvg() + ' <b>' + fmtNum(p.coins) + '</b></div>' +
    '</div></div>';
  return h;
}

function avTabsHtml(av) {
  var h = '<div class="tabs av-tabs">';
  for (var s = 0; s < AV_SLOTS.length; s++) {
    var slot = AV_SLOTS[s];
    var wearing = avItem(av[slot.id]);
    h += '<button type="button" class="tab' + (avatarUi.slot === slot.id ? ' on' : '') + '" data-act="av-slot" data-slot="' + slot.id + '">' +
      slot.icon + ' ' + slot.label + (wearing ? '' : ' <small>없음</small>') + '</button>';
  }
  h += '</div>';
  return h;
}

function avSlotGridHtml(av, p) {
  var h = '';
  if (avatarUi.slot === 'hair') {
    h += '<p class="lf-note">지금 고른 성별 머리가 먼저 나와요. <b>0코인</b> 머리는 코인 없이 바로 쓸 수 있어요.</p>';
    var grp = avatarItemGroups('hair');
    for (var gi = 0; gi < grp.length; gi++) {
      var gset = grp[gi];
      if (!gset.items.length) continue;
      var freeN = 0;
      for (var fi = 0; fi < gset.items.length; fi++) if (gset.items[fi].price <= 0) freeN++;
      h += '<div class="av-sec ' + gset.g + '"><span class="av-sec-badge">' + AV_GROUP_TITLE[gset.g].icon + ' ' + AV_GROUP_TITLE[gset.g].label + '</span>' +
        '<small>' + gset.items.length + '가지 · 0코인 ' + freeN + '가지</small></div>';
      h += '<div class="av-grid">';
      for (var hk = 0; hk < gset.items.length; hk++) h += avCardHtml(av, p, gset.items[hk], 'hair');
      h += '</div>';
    }
    return h;
  }

  if (avatarUi.slot === 'face') {
    h += '<p class="lf-note">표정을 고르면 얼굴이 바로 바뀌고 마이룸에도 나타나요. <b>0코인</b> 표정부터 써 보세요!</p>';
  } else if (avatarUi.slot === 'pose') {
    h += '<p class="lf-note">동작을 고르면 아바타가 그 자세를 해요. 점프·댄스는 움직이기도 해요. <b>0코인</b> 동작부터 써 보세요!</p>';
  } else if (avatarUi.slot === 'top' || avatarUi.slot === 'bottom') {
    h += '<p class="lf-note">👦 👧 표시가 있는 옷은 그 성별에 맞춘 옷이에요. 어느 성별이든 입을 수 있어요.</p>';
  }

  h += '<div class="av-grid">';
  if (avatarUi.slot === 'acc' || avatarUi.slot === 'hat') {
    h += '<button type="button" class="av-card' + (!av[avatarUi.slot] ? ' on' : '') + '" data-act="av-off" data-slot="' + avatarUi.slot + '">' +
      '<span class="av-thumb">🚫</span><b>안 쓰기</b><small>' + (avatarUi.slot === 'hat' ? '모자 없음' : '소품 없음') + '</small></button>';
  }
  var list = avatarSlotItems(avatarUi.slot);
  if (avatarUi.slot === 'face' || avatarUi.slot === 'pose') {
    list.sort(function (a, b) { return (a.price > 0 ? 1 : 0) - (b.price > 0 ? 1 : 0); });
  }
  for (var k = 0; k < list.length; k++) h += avCardHtml(av, p, list[k], avatarUi.slot);
  h += '</div>';
  return h;
}

function avatarHtml() {
  var av = avatarShown();
  var p = prof();
  /* 넓은 가로 화면에서는 왼쪽 미리보기 · 오른쪽 옷장 2단, 세로 화면에서는 지금처럼 위·아래로 */
  var h = '<div class="av-split">';
  h += '<div class="av-col av-left"><div class="av-sticky">' + avTopHtml(av, p) + avApplyBarHtml() + '</div></div>';
  h += '<div class="av-col av-right">' + avTabsHtml(av);
  h += '<div class="av-items">' + (avatarUi.salon ? salonHtml(av, p) : avSlotGridHtml(av, p));
  h += '<div class="care-actions">' +
    '<button type="button" class="pill-btn" data-act="shop-open" data-shop-tab="avatar">🛒 아바타 상점</button>' +
    '<button type="button" class="ghost-btn" data-act="avatar-close">닫기</button></div>';
  h += '</div></div></div>';
  return h;
}


function renderAvatar(keepScroll) {
  var b = document.getElementById('avatarBody');
  if (!b) return;
  var sc = keepScroll ? b.scrollTop : 0;
  b.innerHTML = avatarHtml();
  if (keepScroll) b.scrollTop = sc;
  try { renderLevelBadges(); } catch (e0) { /* 무시 */ }
}
