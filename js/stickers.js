/* ============================================================================
   Jaden's Today v2 — js/stickers.js
   칭찬 스티커 · 모양 선택/추가 · 스티커 장부
   · 원본 index.html(운영본)의 같은 코드를 기능별로 나눈 파일입니다. 동작은 원본과 같아요.
   · 모듈끼리 같은 전역 스코프를 써요. index.html 에서 core → sync → ... 순서로 불러옵니다.
   ============================================================================ */
'use strict';

/* ============ 스티커 ============ */
function renderStickers() {
  eachBlockOfType('sticker_board', function (root) { renderStickerBlock(root); });
}

/* 스티커판 줄 수 — 카드 폭이 좁으면 칸이 카드 밖으로 넘치지 않게 줄을 줄여요 (칸 40px 이상) */
function stickerGridCols(root, slots) {
  var cols = slots <= 6 ? 3 : (slots <= 8 ? 4 : (slots <= 12 ? 5 : 6));
  var hostSec = (root && root.closest) ? root.closest('.sec') : null;
  var cardW = 0;
  if (hostSec) {
    var fixedW = parseInt(hostSec.getAttribute('data-wpx'), 10);
    cardW = (fixedW > 0) ? fixedW : hostSec.clientWidth;   /* 자유 폭이면 저장된 폭을 먼저 믿어요 */
  }
  var innerW = cardW ? (cardW - 44) : 0;
  if (innerW > 0) {
    var fitCols = Math.max(2, Math.floor(innerW / 42));
    if (cols > fitCols) cols = fitCols;
  }
  return cols;
}
/* 카드 폭에 따라 '좁음' 표시를 붙여요 — 컨테이너 질의를 모르는 브라우저도 같은 모양이 되게 */
function syncNarrowFlags() {
  try {
    var nodes = document.querySelectorAll('#sections .sec');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var w = parseInt(el.getAttribute('data-wpx'), 10);
      if (!(w > 0)) w = el.clientWidth || 0;
      el.classList.toggle('sec-narrow', w > 0 && w <= 470);
      el.classList.toggle('sec-tiny', w > 0 && w <= 330);
      el.classList.toggle('sec-micro', w > 0 && w <= 240);
    }
  } catch (e) { /* 무시 */ }
}
/* 카드를 옮기거나 폭을 바꾼 뒤 스티커 칸 수만 다시 맞춰요 */
function syncStickerColumns() {
  try {
    syncNarrowFlags();
    eachBlockOfType('sticker_board', function (root) {
      var board = bpart(root, 'board');
      var st = state.sticker;
      if (!board || !st) return;
      board.style.gridTemplateColumns = 'repeat(' + stickerGridCols(root, st.slots) + ', minmax(0, 1fr))';
    });
  } catch (e) { /* 무시 */ }
}

function renderStickerBlock(root) {
  var board = bpart(root, 'board');
  if (!board) return;
  var st = state.sticker;
  var slots = st.slots;
  var list = st.stickers;
  board.style.gridTemplateColumns = 'repeat(' + stickerGridCols(root, slots) + ', minmax(0, 1fr))';

  var html = '';
  for (var i = 0; i < slots; i++) {
    var em = list[i];
    if (em) {
      var shp = stickerShapeById(stickerIconOf(i));
      var shpAttr = shp ? ' data-shape="' + esc(shp.id) + '"' : '';
      var shpTitle = shp ? ' title="' + esc(shp.name) + '"' : '';
      if (can('stickerManage')) {
        html += '<button class="slot filled' + (i === freshIdx ? ' fresh' : '') + '" data-act="sticker-undo" data-i="' + i + '"' + shpAttr + shpTitle +
          ' aria-label="' + (i + 1) + '번째 스티커 떼기">' + em + '</button>';
      } else {
        html += '<span class="slot filled' + (i === freshIdx ? ' fresh' : '') + '"' + shpAttr + shpTitle + '>' + em + '</span>';
      }
    } else {
      if (can('sticker')) {
        html += '<button class="slot empty tappable" data-act="sticker-slot-add" data-i="' + i +
          '" aria-label="' + (i + 1) + '번째 칸에 스티커 붙이기"><span class="num">+</span></button>';
      } else {
        html += '<span class="slot empty locked"><span class="num">' + (i + 1) + '</span></span>';
      }
    }
  }
  board.innerHTML = html;
  freshIdx = -1;

  var cnt = bpart(root, 'count');
  if (cnt) cnt.textContent = list.length;
  var slotsEl = bpart(root, 'slots');
  if (slotsEl) slotsEl.textContent = slots;
  var unitLine = bpart(root, 'unit');
  if (unitLine) {
    var sub = (st.goal || '').trim();
    if (sub) {
      unitLine.textContent = sub;
      unitLine.hidden = false;
    } else {
      unitLine.textContent = '';
      unitLine.hidden = true;
    }
  }

  var btn = bpart(root, 'new');
  if (btn) {
    var full = list.length >= st.slots;
    btn.hidden = !(full && can('sticker'));
  }
  /* 알림 소리 미리 듣기는 보호자·관리자만 (아이 화면을 깔끔하게) */
  var soundTests = document.querySelectorAll('[data-act="target-sound-test"]');
  for (var si = 0; si < soundTests.length; si++) soundTests[si].hidden = !can('edit');
  renderLedgerFor(root);
}

function fmtNum(n) {
  return String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function spentCount() {
  var sum = 0;
  for (var i = 0; i < state.stickerSpends.length; i++) sum += state.stickerSpends[i].count || 0;
  return sum;
}

function remainStickers() {
  var left = stickerTotal() - spentCount();
  return left > 0 ? left : 0;
}

function renderLedger() {
  eachBlockOfType('sticker_board', function (root) { renderLedgerFor(root); });
}

function renderLedgerFor(root) {
  var el = bpart(root, 'ledger');
  if (!el) return;
  var unit = state.sticker.unit || 1000;
  var earned = stickerTotal();
  var spent = spentCount();
  var left = remainStickers();
  el.innerHTML =
    '<span class="lchip">적립 <b>' + fmtNum(earned) + '개</b></span>' +
    '<span class="lchip use">사용 <b>' + fmtNum(spent) + '개</b></span>' +
    '<span class="lchip rem">남은 <b>' + fmtNum(left) + '개 · ' + fmtNum(left * unit) + '원</b></span>';
}

/* 보드 한 칸에 스티커를 붙여요 (모양 id 도 같은 순서로 기억) */
function pushStickerSlot(emoji, shapeId) {
  var st = state.sticker;
  if (!st) return;
  if (!st.icons || Object.prototype.toString.call(st.icons) !== '[object Array]') st.icons = [];
  while (st.icons.length < st.stickers.length) st.icons.push('');
  st.stickers.push(emoji);
  st.icons.push(shapeId || '');
}
function clearStickerSlots() {
  var st = state.sticker;
  if (!st) return;
  st.stickers = [];
  st.icons = [];
}

/* 스티커판이 꽉 차면(10/10) 기록만 남기고 곰바로 새 판(0/칸)으로 넘어가요.
   적립·사용·남은 개수와 스티커 장부는 그대로 두고, 판만 새로 시작해요. */
function completeStickerBoard() {
  var st = state.sticker;
  if (!st || !(st.slots > 0) || st.stickers.length < st.slots) return false;
  var full = st.slots;
  var earned = stickerTotal();
  state.boardLog.push({ d: dateKey(), t: Date.now(), slots: full, goal: st.goal || '' });
  clearStickerSlots();
  st.celebrated = false;
  touchBoard(Date.now());
  freshIdx = -1;
  saveState();
  try { if (cloud.me) scheduleSync('stickers'); } catch (e) { /* 무시 */ }
  renderStickers();
  try {
    confetti(70);
    snd('win');
  } catch (e) { /* 무시 */ }
  showToast('🎉 스티커판 ' + full + '개 완성! 새 판으로 자동 리프레시됐어요 · 적립 ' + fmtNum(earned) + '개는 그대로', true);
  try { refreshAcctStickerPane(); } catch (e) { /* 무시 */ }
  return true;
}

function addSticker(reason, shapeId) {
  var st = state.sticker;
  if (st.stickers.length >= st.slots) return;
  /* 고른 모양으로 붙여요 — 안 고르면 마지막에 쓴 모양(처음엔 ⭐) */
  var shape = stickerShapeById(shapeId) || stickerActiveShape();
  if (shapeId) st.shapeId = shape.id;
  var emoji = shape.e;
  pushStickerSlot(emoji, shape.id);
  freshIdx = st.stickers.length - 1;
  var logged = logSticker(emoji, reason, shape.id);
  touchBoard(logged ? logged.t : Date.now());
  markStickerCoinSeen(logged);   /* 이 기기에서 이미 받은 코인 — 다시 당기지 않게 */
  saveState();
  renderStickers();

  var slot = document.querySelector('.slot[data-i="' + (st.stickers.length - 1) + '"]');
  confetti(12, slot || document.getElementById('stickerBoard'));
  snd('sticker');
  awardStickerCoins();
  bumpProgress('sticker', 1);
  gainXp(XP_STICKER);
  saveState();
  renderCoinBadge();
  showToast(emoji + ' 칭찬 스티커! ' + coinSvg() + ' +' + COIN_STICKER, true);

  if (st.stickers.length >= st.slots) {
    /* 다 채웠어요 → 축하하고 바로 새 판으로 (새 판 시작 버튼을 누를 필요 없음) */
    st.celebrated = true;
    window.setTimeout(function () {
      try { completeStickerBoard(); } catch (e) { /* 무시 */ }
    }, 260);
    return;
  }
}

function undoSticker(i) {
  var st = state.sticker;
  if (isNaN(i) || i < 0 || i >= st.stickers.length) return;
  var emoji = st.stickers[i];
  st.stickers.splice(i, 1);
  if (st.icons && st.icons.length > i) st.icons.splice(i, 1);
  st.celebrated = false;
  touchBoard(Date.now());
  dropStickerLog(emoji);
  revokeStickerCoins();
  bumpProgress('sticker', -1);
  gainXp(-XP_STICKER);
  saveState();
  renderCoinBadge();
  renderStickers();
  snd('uncheck');
}

function newBoard(direct) {
  /* direct: 완성 축하 모달의 '새 판 이어서 시작'처럼 잃을 게 없을 때는 확인 없이 진행 */
  if (!direct && !window.confirm('새 스티커 판을 시작할까요?\n적립된 스티커 개수와 사용 내역은 그대로 유지돼요.')) return;
  clearStickerSlots();
  state.sticker.celebrated = false;
  touchBoard(Date.now());
  saveState();
  renderStickers();
  confetti(16, document.getElementById('stickerBoard'));
}

function clearBoard() {
  if (!window.confirm('스티커를 모두 떼어낼까요?')) return;
  clearStickerSlots();
  state.sticker.celebrated = false;
  touchBoard(Date.now());
  saveState();
  renderStickers();
  refreshAcctStickerPane();
}

function openGoalModal() {
  var m = document.getElementById('goalModal');
  var title = document.getElementById('goalModalTitle');
  var t = document.getElementById('goalModalText');
  var unit = state.sticker.unit || 1000;
  var remain = remainStickers();
  if (title) title.textContent = '스티커 판 ' + state.sticker.slots + '칸 완성!';
  if (t) {
    t.innerHTML = '<b>남은 스티커 ' + fmtNum(remain) + '개 · ' + fmtNum(remain * unit) + '원</b>';
  }
  if (m) m.hidden = false;
  lockScroll();
}

function closeGoal() {
  var m = document.getElementById('goalModal');
  if (m) m.hidden = true;
  unlockScroll();
}

/* ---- 다른 기지에서 붙인 스티커의 코인 ----
   스티커 원장(stickers.json)은 가족 모두가 같이 봐요. 그래서 아내 폰에서 붙인 스티커가
   아이 화면으로 넘어올 때도 아이 계정에 +COIN_STICKER가 들어가야 해요.
   이미 준 스티커는 prof().stickerCoin.seen 에 남겨서 두 번 주지 않아요. */
var stickerCoinBootAt = 0;   /* 이번에 화면을 열 때 이미 갖고 있던 마지막 스티커 시각 */
function stickerCoinState() {
  var p = prof();
  var sc = p.stickerCoin;
  if (!sc || typeof sc !== 'object' || !sc.seen || typeof sc.seen !== 'object') {
    /* 이번 업데이트 전부터 쓰던 계정: 지금까지 쌓인 스티커는 지난 일이니
       이 기지가 이미 갖고 있던 마지막 스티커 시각(없으면 지금)을 기준선으로 삼아 다시 주지 않아요.
       (오늘 구름에서 새로 받아 온 스티커는 이 기준선보다 뒤라서 정상으로 코인이 들어가요) */
    var base = 0;
    for (var i = 0; i < state.stickerLog.length; i++) {
      var t0 = Number(state.stickerLog[i] && state.stickerLog[i].t) || 0;
      if (t0 > base) base = t0;
    }
    var boot = Number(stickerCoinBootAt) || 0;
    if (boot && (!base || boot < base)) base = boot;
    if (!base) base = Date.now();
    sc = { since: base, seen: {} };
    p.stickerCoin = sc;
  }
  var since = Number(sc.since);
  if (isNaN(since) || since < 0) sc.since = 0;
  return sc;
}

function stickerCoinKey(entry) {
  if (!entry || !entry.t) return '';
  return entry.t + '|' + (entry.e || '') + '|' + (entry.r || '');
}

/* 내 기기에서 붙인 스티커는 이미 코인을 받았으니 '받은 것'으로 표시만 해요 */
function markStickerCoinSeen(entry) {
  if (!cloud.me || !entry) return;
  var k = stickerCoinKey(entry);
  if (!k) return;
  try { stickerCoinState().seen[k] = 1; } catch (e) { /* 무시 */ }
}

/* 이 기기에 새로 들어온 스티커 기록에 코인을 한 장에 한 번씩 지급해요 */
function creditStickerLogCoins(silent) {
  if (!cloud.me || !cloud.profileReady) return 0;
  if (!state.profile || typeof state.profile !== 'object') return 0;
  var sc = stickerCoinState();
  var p = prof();
  var base = Math.max(Number(sc.since) || 0, Number(state.sticker.clearedAt) || 0);
  var n = 0;
  for (var i = 0; i < state.stickerLog.length; i++) {
    var e = state.stickerLog[i];
    var t = Number(e && e.t) || 0;
    if (!t || t <= base) continue;
    var k = stickerCoinKey(e);
    if (!k || sc.seen[k]) continue;
    sc.seen[k] = 1;
    n += 1;
  }
  if (!n) return 0;
  pruneStickerCoinSeen(sc);
  p.award.stickers = (parseInt(p.award.stickers, 10) || 0) + n;
  coinAdd(COIN_STICKER * n);
  bumpProgress('sticker', n);
  gainXp(XP_STICKER * n);
  try { saveProfileLocal(); } catch (e2) { /* 무시 */ }
  try { onProfileChanged(); } catch (e3) { /* 무시 */ }
  renderCoinBadge();
  if (!silent) {
    try { showToast('⭐ 새 칭찬 스티커 ' + n + '개! ' + coinSvg() + ' +' + fmtNum(n * COIN_STICKER), true); } catch (e4) { /* 무시 */ }
  }
  return n;
}

/* 받은 표시는 최근 800장만 남겨요 (프로필 파일이 너무 커지지 않게) */
function pruneStickerCoinSeen(sc) {
  var keys = [];
  for (var k in sc.seen) { if (own(sc.seen, k)) keys.push(k); }
  if (keys.length <= 800) return;
  keys.sort(function (a, b) { return (parseInt(a, 10) || 0) - (parseInt(b, 10) || 0); });
  for (var i = 0; i < keys.length - 800; i++) delete sc.seen[keys[i]];
}


/* ---- 스티커 여러 개 한 번에 붙이기 (보호자·관리자 전용) ---- */
var bulkState = { count: 5, reason: '', msg: '' };

function openBulkStickers() {
  if (!can('stickerManage')) return;
  bulkState = { count: bulkState.count || 5, reason: '', msg: '' };
  openAccounts('sticker');
  acctScrollTo('bulkBody');
}

function closeBulkStickers() {
  /* 여러 개 붙이기는 계정 창 안으로 옮겨서 따로 닫을 창이 없어요 */
}

function bulkHtml() {
  var n = bulkState.count || 1;
  var unit = state.sticker.unit || 1000;
  var h = '<p class="lf-note">고른 개수만큼 칭찬 스티커를 한 번에 붙여요. 남은 스티커와 코인도 함께 늘어나요.</p>';
  h += '<div class="bulk-quick">';
  [2, 3, 5].forEach(function (q) {
    h += '<button type="button" class="bulk-q' + (n === q ? ' on' : '') + '" data-act="bulk-count" data-n="' + q + '">' +
      q + '개<small>' + fmtNum(q * unit) + '원어치</small></button>';
  });
  h += '</div>';
  h += '<div class="bulk-form">' +
    '<label>몇 개 붙일까요? (1~20)<input type="number" id="bulkCount" min="1" max="20" step="1" value="' + n + '"></label>' +
    '<label>어떤 칭찬인가요?' +
      '<select id="bulkReason" class="inp">' +
        '<option value="">이유 없이 붙이기</option>' +
        (state.sticker.reasons || []).map(function (r) {
          return '<option value="' + esc(r) + '"' + (bulkState.reason === r ? ' selected' : '') + '>' + esc(r) + '</option>';
        }).join('') +
      '</select>' +
    '</label>' +
    '</div>';
  h += '<div class="bulk-preview" id="bulkPreview"></div>';
  h += '<div class="bulk-actions">' +
    '<button type="button" class="pill-btn warm" data-act="bulk-save">스티커 붙이기</button>' +
    '</div>';
  h += '<p class="lf-msg" id="bulkMsg">' + esc(bulkState.msg || '') + '</p>';
  return h;
}

function bulkPreviewText() {
  var n = Math.max(1, Math.min(20, parseInt(bulkState.count, 10) || 1));
  var earned = stickerTotal();
  var left = remainStickers();
  var free = Math.max(0, state.sticker.slots - state.sticker.stickers.length);
  var boards = Math.ceil(Math.max(0, n - free) / Math.max(1, state.sticker.slots));
  return '지금 적립 <b>' + fmtNum(earned) + '개</b> · 붙이면 <b>' + fmtNum(earned + n) + '개</b>' +
    (left ? ' (남은 ' + fmtNum(left) + '개 → ' + fmtNum(left + n) + '개)' : '') +
    ' · 코인 +' + fmtNum(n * COIN_STICKER) +
    (n > free ? '<br>이 판 ' + free + '칸을 채우고 새 판' + (boards > 1 ? ' ' + boards + '장' : '') + '으로 이어져요' : '');
}

function renderBulkStickers() {
  var body = document.getElementById('bulkBody');
  if (body) body.innerHTML = bulkHtml();
  var pv = document.getElementById('bulkPreview');
  if (pv) pv.innerHTML = bulkPreviewText();
}

function bulkPickCount(n) {
  bulkState.count = Math.max(1, Math.min(20, parseInt(n, 10) || 1));
  renderBulkStickers();
}

function bulkReadFields() {
  var c = document.getElementById('bulkCount');
  if (c) {
    var n = parseInt(c.value, 10);
    if (!isNaN(n)) bulkState.count = Math.max(1, Math.min(20, n));
  }
  var r = document.getElementById('bulkReason');
  if (r) bulkState.reason = String(r.value || '').slice(0, 20);
}

/* n개를 한 번에 — 판이 넘치면 새 판으로 이어 붙여요 */
function grantBulkStickers(n, reason) {
  if (!can('stickerManage')) return 0;
  n = Math.max(1, Math.min(20, parseInt(n, 10) || 1));
  var st = state.sticker;
  var granted = 0;
  for (var i = 0; i < n; i++) {
    if (st.stickers.length >= st.slots) {
      /* 앞의 판이 다 찼으면 기록만 남기고 조용히 새 판으로 이어 붙여요 */
      st.celebrated = true;
      state.boardLog.push({ d: dateKey(), t: Date.now(), slots: st.slots, goal: st.goal || '' });
      clearStickerSlots();
      st.celebrated = false;
    }
    var shape = stickerActiveShape();
    pushStickerSlot(shape.e, shape.id);
    var logged = logSticker(shape.e, reason || '', shape.id);
    touchBoard(logged ? logged.t : Date.now());
    markStickerCoinSeen(logged);
    awardStickerCoins();
    granted += 1;
  }
  freshIdx = st.stickers.length - 1;
  saveState();
  if (cloud.me) scheduleSync('stickers');
  renderStickers();
  renderCoinBadge();
  snd('sticker');
  confetti(Math.min(40, 10 + granted * 4), document.getElementById('stickerBoard'));
  showToast('⭐ 칭찬 스티커 ' + granted + '개! ' + coinSvg() + ' +' + fmtNum(granted * COIN_STICKER), true);
  if (st.stickers.length >= st.slots) {
    /* 방금 채운 판도 바로 새 판으로 (자동 리프레시) */
    st.celebrated = true;
    window.setTimeout(function () {
      try { completeStickerBoard(); } catch (e) { /* 무시 */ }
    }, 260);
  }
  return granted;
}

function saveBulkStickers() {
  if (!can('stickerManage')) return;
  bulkReadFields();
  var n = bulkState.count;
  if (!(n >= 1 && n <= 20)) {
    bulkState.msg = '1개에서 20개 사이로 정해 주세요.';
    var msg = document.getElementById('bulkMsg');
    if (msg) msg.textContent = bulkState.msg;
    return;
  }
  bulkState.msg = '스티커 ' + n + '개를 붙였어요!';
  grantBulkStickers(n, bulkState.reason);
  renderBulkStickers();
  refreshAcctStickerPane();
}

/* ---- ⭐ 칭찬 이유 목록 고치기 (✏️ 스티커 편집 창 · 카드 인라인 편집 공통) ----
   칩으로 보여 주고 ×로 지우고, 아래 칸에 적어 ＋ 추가(또는 엔터)로 넣어요.
   바꾸면 바로 state.sticker.reasons에 들어가고 저장·동기화돼서, 스티커 붙일 때 고르는 목록에도
   곧바로 보여요. */
var STICKER_REASON_MAX = 12;   /* 한 번에 고를 수 있는 이유 개수 (읽을 때도 12개까지) */
var STICKER_REASON_LEN = 20;   /* 이유 하나의 최대 글자 수 */

function stickerReasons() {
  if (!state.sticker) return [];
  if (Object.prototype.toString.call(state.sticker.reasons) !== '[object Array]') state.sticker.reasons = [];
  return state.sticker.reasons;
}

function stickerReasonChipsHtml() {
  var list = stickerReasons();
  var h = '';
  for (var i = 0; i < list.length; i++) {
    h += '<span class="sre-chip"><span class="sre-name">' + esc(list[i]) + '</span>' +
      '<button type="button" class="sre-x" data-act="sticker-reason-del" data-i="' + i +
      '" aria-label="' + esc(list[i]) + ' 지우기" title="지우기">×</button></span>';
  }
  if (!list.length) h += '<span class="sre-empty">아직 칭찬 이유가 없어요.</span>';
  return h;
}

function stickerReasonEditorHtml(where) {
  var n = stickerReasons().length;
  return '<div class="sre" data-sre="' + esc(where) + '">' +
    '<div class="sre-head"><span>⭐ 칭찬 이유</span><span class="sre-n" data-sre-n>' + n + ' / ' + STICKER_REASON_MAX + '</span></div>' +
    '<div class="sre-chips" data-sre-chips>' + stickerReasonChipsHtml() + '</div>' +
    '<div class="sre-add">' +
    '<input class="inp sre-inp" data-sre-inp maxlength="' + STICKER_REASON_LEN + '" placeholder="예: 피아노 연습" aria-label="새 칭찬 이유" autocomplete="off">' +
    '<button type="button" class="sre-btn" data-act="sticker-reason-add">+ 추가</button></div>' +
    '<p class="sre-msg" data-sre-msg aria-live="polite"></p>' +
    '</div>';
}

function sreBoxOf(el) {
  return (el && el.closest) ? el.closest('.sre') : null;
}

/* 누른 버튼이 칩 목록을 다시 그리며 사라져도 안내는 남도록, 칸(.sre)을 먼저 찾아 두고 써요 */
function sreMsgIn(box, text, bad) {
  if (!box) return;
  var m = box.querySelector('[data-sre-msg]');
  if (!m) return;
  m.className = 'sre-msg' + (bad ? ' err' : '');
  m.textContent = text || '';
}

/* 열려 있는 칩 목록(편집 창·카드 인라인)을 모두 같은 내용으로 다시 그려요 */
function refreshStickerReasonEditors() {
  var boxes = document.querySelectorAll('.sre');
  for (var i = 0; i < boxes.length; i++) {
    var chips = boxes[i].querySelector('[data-sre-chips]');
    if (chips) chips.innerHTML = stickerReasonChipsHtml();
    var n = boxes[i].querySelector('[data-sre-n]');
    if (n) n.textContent = stickerReasons().length + ' / ' + STICKER_REASON_MAX;
  }
}

/* 받침에 따라 조사를 골라요 — ‘피아노 연습’을 / ‘환경관리’를 */
function josaOf(word, withFinal, noFinal) {
  var s = String(word || '');
  var c = s.charCodeAt(s.length - 1);
  if (c >= 0xAC00 && c <= 0xD7A3) return ((c - 0xAC00) % 28 === 0) ? noFinal : withFinal;
  return withFinal;
}

function addStickerReason(el) {
  if (!can('edit')) return;
  var box = sreBoxOf(el);
  var inp = box ? box.querySelector('[data-sre-inp]') : null;
  var name = inp ? String(inp.value || '').replace(/\s+/g, ' ').trim() : '';
  if (name.length > STICKER_REASON_LEN) name = name.slice(0, STICKER_REASON_LEN);
  var list = stickerReasons();
  if (!name) {
    sreMsgIn(box, '칭찬 이유를 먼저 적어 주세요.', true);
    if (inp) { try { inp.focus(); } catch (e) { /* 무시 */ } }
    return;
  }
  if (list.length >= STICKER_REASON_MAX) {
    sreMsgIn(box, '칭찬 이유는 ' + STICKER_REASON_MAX + '개까지 넣을 수 있어요. 하나 지우고 넣어 주세요.', true);
    return;
  }
  for (var i = 0; i < list.length; i++) {
    if (String(list[i]).trim() === name) {
      sreMsgIn(box, '‘' + name + '’' + josaOf(name, '은', '는') + ' 이미 있어요. 다른 이유를 적어 주세요.', true);
      if (inp) { try { inp.select(); } catch (e) { /* 무시 */ } }
      return;
    }
  }
  list.push(name);
  state.sticker.reasonsUpdatedAt = Date.now();
  saveState();
  if (cloud.me) scheduleSync('stickers');
  refreshStickerReasonEditors();
  if (inp) {
    inp.value = '';
    try { inp.focus(); } catch (e) { /* 무시 */ }
  }
  sreMsgIn(box, '‘' + name + '’' + josaOf(name, '을', '를') + ' 넣었어요.');
}

function delStickerReason(el) {
  if (!can('edit')) return;
  var box = sreBoxOf(el);   /* 칩을 다시 그리면 누른 ×가 사라지니 안내를 쓸 칸을 미리 잡아 둬요 */
  var i = parseInt(el.getAttribute('data-i'), 10);
  var list = stickerReasons();
  if (isNaN(i) || i < 0 || i >= list.length) return;
  if (list.length <= 1) {
    sreMsgIn(box, '칭찬 이유는 하나는 남겨 두세요. 새 이유를 먼저 넣고 지우면 돼요.', true);
    return;
  }
  var gone = list[i];
  list.splice(i, 1);
  state.sticker.reasonsUpdatedAt = Date.now();
  saveState();
  if (cloud.me) scheduleSync('stickers');
  refreshStickerReasonEditors();
  sreMsgIn(box, '‘' + gone + '’' + josaOf(gone, '을', '를') + ' 지웠어요.');
}

/* ---- 스티커 적립 이유 · 붙일 모양 ---- */
function openReason() {
  if (!can('stickerManage')) return;
  reasonState = { custom: false, msg: '', shape: stickerActiveShape().id, shapeNew: false, shapeMsg: '' };
  renderReason();
  var m = document.getElementById('reasonModal');
  if (m) m.hidden = false;
  lockScroll();
}

function closeReason() {
  var m = document.getElementById('reasonModal');
  if (m) m.hidden = true;
  if (isOnlyModal('reasonModal')) unlockScroll();
}

/* 스티커 모양 고르는 줄 — 팝업·설정 창에서 같이 써요 */
function stickerShapeRowHtml(curId, manage) {
  var all = stickerShapesAll();
  var h = '<div class="shape-row" role="group" aria-label="스티커 모양 고르기">';
  for (var i = 0; i < all.length; i++) {
    var s = all[i];
    var on = (s.id === curId) ? ' on' : '';
    h += '<button type="button" class="shape-chip' + on + (s.custom ? ' mine' : '') + '" data-act="reason-shape" data-id="' + esc(s.id) + '"' +
      ' aria-pressed="' + (on ? 'true' : 'false') + '" title="' + esc(s.name) + '">' + esc(s.e) +
      '<small>' + esc(s.name) + '</small></button>';
  }
  if (manage) h += '<button type="button" class="shape-chip add" data-act="shape-add">＋<small>모양 추가</small></button>';
  h += '</div>';
  return h;
}

/* 새 모양 추가 칸 — 팝업·설정 창에서 같이 써요 */
function shapeAddFormHtml(prefix) {
  return '<div class="shape-form" id="' + prefix + 'ShapeForm">' +
    '<input class="inp inp-sm shape-emo" id="' + prefix + 'ShapeEmoji" maxlength="8" placeholder="⭐" aria-label="새 스티커 이모지">' +
    '<input class="inp inp-sm" id="' + prefix + 'ShapeName" maxlength="10" placeholder="이름 (예: 닭)" aria-label="새 스티커 이름">' +
    '<button type="button" class="lf-btn" data-act="shape-save" data-prefix="' + prefix + '">추가</button>' +
    '<p class="ep-hint shape-hint">이모지는 키보드 <b>Win + .</b>(윈도우) 로 골라 넣어요. 폰에서는 이모지 키보드를 쓰면 돼요. (최대 ' + STICKER_SHAPE_MAX + '개)</p>' +
    '</div>';
}

function shapeAddOpen(prefix) {
  if (!can('edit')) return;
  if (prefix === 'reason') { reasonState.shapeNew = true; reasonState.shapeMsg = ''; renderReason(); }
  else { editPanelShapeNew = true; editPanelShapeMsg = ''; renderEditSheetBody(); }
}

/* 모양을 넣거나 지운 뒤 화면 다시 그리기 (팝업이 열려 있으면 그 팝업만) */
function refreshShapeUi() {
  var rm = document.getElementById('reasonModal');
  if (rm && !rm.hidden) { renderReason(); return; }
  try { renderEditSheetBody(); } catch (e) { /* 무시 */ }
  try { renderStickers(); } catch (e2) { /* 무시 */ }
}

function shapeSave(prefix) {
  if (!can('edit')) return;
  var em = String(fieldVal(prefix + 'ShapeEmoji') || '').trim();
  var nm = String(fieldVal(prefix + 'ShapeName') || '').trim();
  function say(msg) {
    if (prefix === 'reason') { reasonState.shapeMsg = msg; renderReason(); }
    else { editPanelShapeMsg = msg; renderEditSheetBody(); }
  }
  if (!em) { say('이모지를 하나 넣어 주세요. (예: ⭐ · 🐣 · 🍎)'); return; }
  if (nm.length > 10) nm = nm.slice(0, 10);
  if (!nm) { say('이름을 적어 주세요. (예: 아기 병아리)'); return; }
  var st = state.sticker;
  if (!st) return;
  if (!st.shapes || Object.prototype.toString.call(st.shapes) !== '[object Array]') st.shapes = [];
  if (st.shapes.length >= STICKER_SHAPE_MAX) { say('모양은 ' + STICKER_SHAPE_MAX + '개까지만 넣을 수 있어요. 하나 지우고 넣어 주세요.'); return; }
  var all = stickerShapesAll();
  for (var i = 0; i < all.length; i++) {
    if (all[i].e === em) { st.shapeId = all[i].id; say('‘' + em + '’' + josaOf(all[i].name, '은', '는') + ' 이미 있어요. 그 모양으로 골랐어요.'); return; }
  }
  var shape = normalizeStickerShape({ id: 'c' + Date.now().toString(36), e: em, name: nm });
  if (!shape) { say('이모지를 하나 넣어 주세요.'); return; }
  st.shapes.push(shape);
  st.shapesUpdatedAt = Date.now();
  st.shapeId = shape.id;
  if (prefix === 'reason') reasonState.shape = shape.id;
  saveState();
  if (cloud.me) scheduleSync('stickers');
  say('‘' + em + ' ' + nm + '’ 모양을 넣었어요!');
}
function shapeDel(id) {
  if (!can('edit')) return;
  var st = state.sticker;
  if (!st) return;
  var list = st.shapes || [];
  for (var i = 0; i < list.length; i++) {
    if (list[i].id !== id) continue;
    var gone = list[i];
    list.splice(i, 1);
    st.shapesUpdatedAt = Date.now();
    if (st.shapeId === id) st.shapeId = '';
    if (reasonState && reasonState.shape === id) reasonState.shape = stickerActiveShape().id;
    saveState();
    if (cloud.me) scheduleSync('stickers');
    showToast('‘' + gone.e + ' ' + gone.name + '’ 모양을 지웠어요.');
    break;
  }
  refreshShapeUi();
}

function reasonHtml() {
  var cur = reasonState.shape || stickerActiveShape().id;
  var h = '<p class="lf-note">어떤 모양으로 붙일까요? 모양을 먼저 고르고 칭찬 이유를 누르면 한 칸 붙어요.</p>';
  h += stickerShapeRowHtml(cur, can('edit'));
  if (reasonState.shapeNew && can('edit')) h += shapeAddFormHtml('reason');
  if (reasonState.shapeMsg) h += '<p class="lf-msg shape-msg">' + esc(reasonState.shapeMsg) + '</p>';
  /* 직접 만든 모양은 팝업에서도 × 로 지울 수 있어요 */
  if (can('edit') && (state.sticker.shapes || []).length) h += stickerShapeMineHtml();
  h += '<p class="lf-note">이번 스티커는 어떤 칭찬인가요? 고르면 바로 한 칸 붙어요.</p>';
  h += '<div class="reason-grid">';
  for (var i = 0; i < state.sticker.reasons.length; i++) {
    var r = state.sticker.reasons[i];
    h += '<button type="button" class="reason-chip" data-act="reason-pick" data-r="' + esc(r) + '">' + esc(r) + '</button>';
  }
  h += '</div>';
  h += '<button type="button" class="reason-chip custom reason-custom-btn" data-act="reason-custom">✏️ 직접 입력</button>';
  if (reasonState.custom) {
    h += '<div class="reason-custom"><input id="reasonInput" maxlength="20" placeholder="예: 피아노 연습">' +
      '<button class="lf-btn" type="button" data-act="reason-save" style="width:auto;padding:0 18px;min-height:48px;font-size:15px">붙이기</button></div>';
  }
  h += '<p class="lf-msg" id="reasonMsg">' + esc(reasonState.msg || '') + '</p>';
  return h;
}

function renderReason() {
  var body = document.getElementById('reasonBody');
  if (body) body.innerHTML = reasonHtml();
  var inp = document.getElementById('reasonInput');
  if (reasonState.custom) { if (inp) { try { inp.focus(); } catch (e) { /* 무시 */ } } }
  else { var em = document.getElementById('reasonShapeEmoji'); if (em && reasonState.shapeNew) { try { em.focus(); } catch (e) { /* 무시 */ } } }
}

function pickReason(r) {
  if (!can('sticker')) return;
  var sid = reasonState.shape || '';
  closeReason();
  addSticker(r || '', sid);
}

function pickStickerShape(id) {
  var s = stickerShapeById(id);
  if (!s) return;
  state.sticker.shapeId = s.id;
  saveState();
  var rm = document.getElementById('reasonModal');
  if (rm && !rm.hidden) { reasonState.shape = s.id; renderReason(); return; }
  try { renderEditSheetBody(); } catch (e) { /* 무시 */ }
}

/* ---- 스티커 사용(원장) ---- */
function openSpend() {
  if (!can('stickerManage')) return;
  spendState = { item: '', count: 1, date: dateKey(), msg: '' };
  openAccounts('sticker');
  acctScrollTo('spendBody');
}

function closeSpend() {
  /* 스티커 쓰기는 계정 창 안으로 옮겨서 따로 닫을 창이 없어요 */
}

function spendPreviewHtml() {
  var unit = state.sticker.unit || 1000;
  var left = remainStickers();
  var cnt = spendState.count || 1;
  if (left < 1) return '<div class="pv-line">지금은 쓸 수 있는 스티커가 없어요</div>';
  var after = Math.max(0, left - cnt);
  return '<div class="pv-line">사용 ' + fmtNum(cnt) + '개 = <b>' + fmtNum(cnt * unit) + '원</b></div>' +
    '<div class="pv-line pv-later">사용 후 남은 스티커: <b>' + fmtNum(after) + '개</b> (' + fmtNum(after * unit) + '원)' +
    (cnt > left ? ' <span class="pv-warn">남은 ' + fmtNum(left) + '개보다 많이 쓸 수 없어요</span>' : '') + '</div>';
}

function spendHtml() {
  var left = remainStickers();
  var unit = state.sticker.unit || 1000;
  var none = left < 1;
  return '<form class="spend-form" id="spendForm" autocomplete="off">' +
    '<div class="spend-balance">현재 남은 스티커: <b>' + fmtNum(left) + '개</b> · ' + fmtNum(left * unit) + '원' +
      '<div class="unit">스티커 1개 = ' + fmtNum(unit) + '원' + (none ? ' · 지금은 쓸 수 있는 스티커가 없어요' : '') + '</div>' +
    '</div>' +
    '<label>날짜<input type="date" id="spendDate" value="' + esc(spendState.date) + '"></label>' +
    '<label>몇 개 쓸까요?<input type="number" id="spendCount" min="1" max="' + Math.max(1, left) + '" step="1" value="' + (spendState.count || 1) + '"' + (none ? ' disabled' : '') + '></label>' +
    '<label class="full">무엇을 샀나요?<input id="spendItem" maxlength="40" placeholder="예: 레고 미니피규어" value="' + esc(spendState.item) + '"></label>' +
    '<div class="spend-preview" id="spendPreview">' + spendPreviewHtml() + '</div>' +
    '<div class="full"><button class="lf-btn" type="submit"' + (none ? ' disabled' : '') + '>기록하기</button></div>' +
    '</form>' +
    '<p class="lf-msg" id="spendMsg">' + esc(spendState.msg || '') + '</p>';
}

function renderSpend() {
  var body = document.getElementById('spendBody');
  if (body) body.innerHTML = spendHtml();
}

function saveSpend() {
  if (!can('stickerManage')) return;
  var item = fieldVal('spendItem').trim();
  var cnt = parseInt(fieldVal('spendCount'), 10);
  var day = fieldVal('spendDate') || dateKey();
  var left = remainStickers();
  var msg = document.getElementById('spendMsg');
  function fail(t) { if (msg) msg.textContent = t; }
  if (!item) return fail('무엇을 샀는지 적어 주세요.');
  if (isNaN(cnt) || cnt < 1) return fail('개수를 1개 이상으로 정해 주세요.');
  if (cnt > left) return fail('남은 스티커가 ' + left + '개예요.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) day = dateKey();
  var unit = state.sticker.unit || 1000;
  state.stickerSpends.push({
    id: uid('sp'), d: day, t: Date.now(), item: item.slice(0, 40), count: cnt,
    amount: cnt * unit, by: cloud.me ? cloud.me.id : ''
  });
  saveState();
  if (cloud.me) scheduleSync('stickers');
  renderStickers();
  spendState = { item: '', count: 1, date: day, msg: '스티커 ' + cnt + '개를 썼어요.' };
  renderSpend();
  refreshAcctStickerPane();
  snd('sticker');
}

function deleteSpend(id) {
  if (!can('stickerManage') || !id) return;
  var target = null;
  for (var i = 0; i < state.stickerSpends.length; i++) if (state.stickerSpends[i].id === id) { target = state.stickerSpends[i]; break; }
  if (!target) return;
  if (!window.confirm('이 사용 기록을 지울까요? 스티커도 다시 남은 개수로 돌아가요.')) return;
  var now = Date.now();
  if (!state.deletedSpends || typeof state.deletedSpends !== 'object') state.deletedSpends = {};
  /* 다른 기기에 다른 이름표로 남아 있어도 같이 지워지게 — 이름표·내용 열쇠 둘 다 남겨요 */
  var delKeys = spendDeleteKeys(target);
  for (var k = 0; k < delKeys.length; k++) state.deletedSpends[delKeys[k]] = now;
  var goneSig = spendSig(target);
  var left = [];
  for (var j = 0; j < state.stickerSpends.length; j++) {
    var cur = state.stickerSpends[j];
    if (cur.id === id || spendSig(cur) === goneSig) continue; /* 혹시 겹쳐 있던 같은 기록도 함께 */
    left.push(cur);
  }
  state.stickerSpends = left;
  pruneSpendDeletions();
  saveState();
  if (cloud.me) scheduleSync('stickers');
  renderStickers();
  renderStats();
  try { refreshAcctStickerPane(); } catch (e) { /* 무시 */ }
}
