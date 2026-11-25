/* ============================================================================
   Jaden's Today v2 — js/missions.js
   특별 미션 · 역할 체크리스트 · 오늘의 일정 · 하루 일과표
   · 원본 index.html(운영본)의 같은 코드를 기능별로 나눈 파일입니다. 동작은 원본과 같아요.
   · 모듈끼리 같은 전역 스코프를 써요. index.html 에서 core → sync → ... 순서로 불러옵니다.
   ============================================================================ */
'use strict';

/* ============ 오늘의 학원 / 주간 시간표 ============ */
function renderTodayAcademy() {
  eachBlockOfType('today_schedule', function (root) {
    var box = bpart(root, 'box');
    if (!box) return;
    var idx = new Date().getDay();
    var evs = state.schedule[DAY_KEYS[idx]] || [];
    var h = '<p class="ta-day">' + DAY_NAMES[idx] + '요일</p>';
    if (!evs.length) {
      h += '<p class="ta-empty">오늘은 학원이 없어요! 🎈<br>신나는 하루 보내요</p>';
    } else {
      for (var i = 0; i < evs.length; i++) {
        var e = evs[i];
        h += '<div class="ta-ev" style="--ec:' + colorFor(e.name) + '">' +
          '<span class="ev-dot" aria-hidden="true"></span>' +
          '<span class="ev-name">' + esc(e.name) + '</span>' +
          '<span class="ev-time">' + esc(e.time) + '</span>' +
          '</div>';
      }
    }
    box.innerHTML = h;
  });
}

/* "16:30–17:30" · "16:30-17:30" · "16:30 ~ 17:30" · "14:20" 을 시작·종료로 나눠요 */
function evTimeParts(t) {
  var m = String(t || '').match(/(\d{1,2})\s*[:.]\s*(\d{1,2})\s*(?:[–\-~〜→～]+\s*(\d{1,2})\s*[:.]\s*(\d{1,2}))?/);
  if (!m) return { start: '', end: '' };
  var out = { start: pad2(parseInt(m[1], 10)) + ':' + pad2(parseInt(m[2], 10)), end: '' };
  if (m[3] != null && m[4] != null) out.end = pad2(parseInt(m[3], 10)) + ':' + pad2(parseInt(m[4], 10));
  return out;
}

function evTimeJoin(start, end) {
  if (start && end) return start + '–' + end;
  return start || end || '';
}

/* 시간 고르개로 바꾸면 그 자리에서 저장해요 (입력칸을 다시 만들지 않아 iOS 시간 횔이 닫히지 않아요) */
function setEventTime(el) {
  var day = el.getAttribute('data-day');
  var evId = el.getAttribute('data-id');
  var box = el.closest ? el.closest('.ev-edit') : null;
  var sInp = box ? box.querySelector('[data-field="evTimeStart"]') : null;
  var eInp = box ? box.querySelector('[data-field="evTimeEnd"]') : null;
  var start = sInp ? String(sInp.value || '') : '';
  var end = eInp ? String(eInp.value || '') : '';
  var arr = state.schedule[day] || [];
  for (var j = 0; j < arr.length; j++) {
    if (arr[j].id === evId) { arr[j].time = evTimeJoin(start, end); break; }
  }
  saveState();
  renderTodayAcademy();
}

function renderWeek() {
  eachBlockOfType('weekly_schedule', function (root) { renderWeekInto(root); });
  if (epUi.tab === 'week') { try { renderEditSheetBody(); } catch (e) { /* 무시 */ } }
}

/* 일과표 7일 칸 — 대시보드는 보기 전용, 편집 팝업(edit=true)에서만 입력칸이 돼요 */
function weekGridHtml(edit) {
  var todayIdx = new Date().getDay();
  var html = '';
  for (var n = 0; n < 7; n++) {
    var idx = (n + 1) % 7;
    var key = DAY_KEYS[idx];
    var evs = state.schedule[key] || [];
    var isToday = (idx === todayIdx);

    html += '<div class="day' + (isToday ? ' today' : '') + '">';
    html += '<div class="day-head"><span class="day-name">' + DAY_NAMES[idx] + '요일</span>' +
      (isToday ? '<span class="today-badge">오늘</span>' : '') + '</div>';

    if (edit) {
      for (var i = 0; i < evs.length; i++) {
        var e = evs[i];
        var tp = evTimeParts(e.time);
        html += '<div class="ev-edit">' +
          '<input class="inp inp-sm" data-field="evName" data-day="' + key + '" data-id="' + esc(e.id) +
            '" value="' + esc(e.name) + '" placeholder="학원 이름">' +
          '<div class="ev-times">' +
            '<label class="ev-t"><span>시작</span><input class="inp inp-sm" type="time" data-field="evTimeStart" data-day="' + key +
              '" data-id="' + esc(e.id) + '" value="' + esc(tp.start) + '" aria-label="시작 시간"></label>' +
            '<label class="ev-t"><span>종료</span><input class="inp inp-sm" type="time" data-field="evTimeEnd" data-day="' + key +
              '" data-id="' + esc(e.id) + '" value="' + esc(tp.end) + '" aria-label="종료 시간"></label>' +
          '</div>' +
          '<button class="del-btn" data-act="del-event" data-day="' + key + '" data-id="' + esc(e.id) +
            '" aria-label="삭제">✕</button>' +
          '</div>';
      }
      html += '<button class="add-item add-sm" data-act="add-event" data-day="' + key + '">+ 추가</button>';
    } else if (!evs.length) {
      html += '<div class="day-empty">' + (idx === 0 ? '쉬는 날 🎈' : '학원 없음') + '</div>';
    } else {
      for (var j = 0; j < evs.length; j++) {
        var v = evs[j];
        html += '<div class="ev" style="--ec:' + colorFor(v.name) + '">' +
          '<span class="ev-name">' + esc(v.name) + '</span>' +
          '<span class="ev-time">' + esc(v.time) + '</span>' +
          '</div>';
      }
    }
    html += '</div>';
  }
  return html;
}

function renderWeekInto(root) {
  var grid = bpart(root, 'grid');
  if (!grid) return;
  grid.innerHTML = weekGridHtml(false);
}

function addEvent(dayKey) {
  if (!state.schedule[dayKey]) state.schedule[dayKey] = [];
  var e = { id: uid('ev'), name: '', time: '' };
  state.schedule[dayKey].push(e);
  saveState();
  renderWeek();
  renderTodayAcademy();
  refreshInlineSec();
  var inp = document.querySelector('input[data-field="evName"][data-id="' + e.id + '"]');
  if (inp) inp.focus();
}

function delEvent(dayKey, id) {
  var arr = state.schedule[dayKey] || [];
  for (var i = 0; i < arr.length; i++) {
    if (arr[i].id === id) {
      arr.splice(i, 1);
      break;
    }
  }
  saveState();
  renderWeek();
  renderTodayAcademy();
  refreshInlineSec();
}

/* ============ 일과표 알림 (이 기기에서만) ============ */
var NOTIFY_KEY = 'kidsDashboard.notifySchedule.v1';
var NOTIFY_FIRED_KEY = 'kidsDashboard.notifyFired.v1';
var NOTIFY_LEAD = 10;           /* 시작·종료 10분 전에 알려요 */
var NOTIFY_CHECK_MS = 20000;    /* 20초마다 확인 */
var NOTIFY_GRACE = 5;           /* 알림 시각을 지난 5분 안에만 확인 (늦은 밤에 몰아치지 않게) */
var notifyTimer = 0;

function notifySupported() { return !!window.Notification; }
function notifyPermission() {
  try { return (window.Notification && window.Notification.permission) ? window.Notification.permission : 'default'; }
  catch (e) { return 'denied'; }
}
/* 이 기기에서 알림을 켰는지 — 아이폰 사파리처럼 Notification이 없어도
   화면 안 10분 전 알림 + 소리로 켤 수 있어요. */
function notifyOn() { return lsGet(NOTIFY_KEY) === '1'; }
function notifyNative() { return notifySupported() && notifyPermission() === 'granted'; }
function notifyInPageText() {
  return "화면 내 10분 전 알림을 켰어요! (아이폰 잠금화면 알림은 '공유 → 홈 화면에 추가' 후 열면 돼요)";
}

function renderNotifyBtns() {
  var on = notifyOn();
  var blocks = document.querySelectorAll('[data-block-type="weekly_schedule"]');
  for (var i = 0; i < blocks.length; i++) {
    var btn = bpart(blocks[i], 'notify');
    var test = bpart(blocks[i], 'notifyTest');
    if (btn) {
      btn.classList.toggle('on', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.textContent = on ? '🔔 10분 전 알림 켜짐' : '🔔 일과표 10분 전 알림';
    }
    if (test) test.hidden = !on;
  }
}

function setNotifyOn(on) {
  lsSet(NOTIFY_KEY, on ? '1' : '0');
  renderNotifyBtns();
}

function toggleScheduleNotify() {
  if (notifyOn()) { setNotifyOn(false); showToast('🔕 일과표 알림을 껐어요.'); return; }
  /* 알림을 쓰는 브라우저(아이폰 홈 화면 앱 등)면 잠금화면 알림까지 함께 켜요 */
  if (notifyNative()) {
    setNotifyOn(true);
    showToast('🔔 일과표 10분 전 알림을 켰어요!');
    return;
  }
  /* Notification이 없거나 막혀 있어도 화면 안 알림 + 소리로 켤 수 있어요 */
  if (!notifySupported() || notifyPermission() === 'denied') {
    setNotifyOn(true);
    showToast(notifyInPageText(), false, 6000);
    return;
  }
  var done = false;
  var finish = function (res) {
    if (done) return;
    done = true;
    setNotifyOn(true);
    if (res === 'granted') showToast('🔔 일과표 10분 전 알림을 켰어요!');
    else showToast(notifyInPageText(), false, 6000);
    renderNotifyBtns();
  };
  try {
    var req = window.Notification.requestPermission(finish);
    if (req && req.then) req.then(finish);
  } catch (e) { finish('denied'); }
}

function showNotify(title, body) {
  var native = false;
  try {
    if (notifyNative()) {
      new window.Notification(title, { body: body, tag: 'kids-schedule', lang: 'ko' });
      native = true;
    }
  } catch (e) { native = false; }
  /* 잠금화면 알림을 못 쓰는 브라우저(아이폰 사파리)는 화면 안 알림으로만 알려요.
     하루 일과표 알림은 소리를 내지 않아요 — 소리는 루틴 '목표시간' 알림에서만 울려요. */
  if (document.visibilityState !== 'hidden') {
    showToast((native ? '' : '🔔 ') + body, false, native ? 2800 : 9000);
  }
}

function testScheduleNotify() {
  if (!notifyOn()) { showToast('알림을 먼저 켜 주세요.'); return; }
  showNotify('⏰ 하루 일과표', '🔔 알림 테스트예요. 이렇게 알려 드릴게요!');
}

function firedMap() {
  try {
    var o = JSON.parse(lsGet(NOTIFY_FIRED_KEY) || '{}');
    return (o && typeof o === 'object') ? o : {};
  } catch (e) { return {}; }
}

function saveFired(o) {
  var keys = Object.keys(o), keep = {}, cut = Date.now() - 3 * 86400000;
  for (var i = 0; i < keys.length; i++) if (Number(o[keys[i]]) >= cut) keep[keys[i]] = o[keys[i]];
  lsSet(NOTIFY_FIRED_KEY, JSON.stringify(keep));
}

/* 20초마다 오늘 일과표를 보며 시작 10분 전 · 끝(픽업) 10분 전을 한 번씩만 알려요 */
function checkScheduleAlerts() {
  if (!notifyOn()) return;
  var now = new Date();
  var nowMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  var dayKey = DAY_KEYS[now.getDay()];
  var evs = state.schedule[dayKey] || [];
  var fired = firedMap(), changed = false, today = dateKey(now);
  for (var i = 0; i < evs.length; i++) {
    var ev = evs[i] || {};
    var tp = evTimeParts(ev.time);
    var nm = String(ev.name || '').trim() || '일정';
    var marks = [];
    if (tp.start) marks.push({ kind: 'start', hhmm: tp.start, at: hhmmMinutes(tp.start),
      text: '🚗 10분 뒤 ' + tp.start + ' [' + nm + '] 시작 시간이에요!' });
    if (tp.end) marks.push({ kind: 'end', hhmm: tp.end, at: hhmmMinutes(tp.end),
      text: '🎒 10분 뒤 ' + tp.end + ' [' + nm + '] 마치는(픽업) 시간이에요!' });
    for (var k = 0; k < marks.length; k++) {
      var m = marks[k];
      var lead = m.at - NOTIFY_LEAD;
      if (lead < 0) continue;
      var diff = nowMin - lead;
      if (diff < 0 || diff > NOTIFY_GRACE) continue;
      var key = today + '|' + dayKey + '|' + (ev.id || ('i' + i)) + '|' + m.kind + '|' + m.hhmm;
      if (fired[key]) continue;
      fired[key] = Date.now();
      changed = true;
      showNotify('⏰ 하루 일과표', m.text);
    }
  }
  if (changed) saveFired(fired);
}

function startNotifyLoop() {
  renderNotifyBtns();
  if (notifyTimer) return;
  notifyTimer = window.setInterval(function () {
    try { checkScheduleAlerts(); } catch (e) { /* 무시 */ }
  }, NOTIFY_CHECK_MS);
  window.setTimeout(function () { try { checkScheduleAlerts(); } catch (e) { /* 무시 */ } }, 2500);
}

/* ============ 🎯 특별 미션 · ⚡ 역할 체크리스트 ============
   두 카드 모두 부모님이 언제든 만들고·고치고·지울 수 있어요.
   설정과 진행 기록은 config/settings.json(dashboardSections)에 담겨 가족 기기끼리 맞춰져요. */


/* ---- 미션 정리 ---- */
function missionDates(m) {
  var out = [];
  if (!m) return out;
  var d = keyToDate(m.start), end = keyToDate(m.end);
  if (!d || !end) return out;
  while (d.getTime() <= end.getTime() && out.length < MSN_CELLS_MAX) {
    out.push(dateKey(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}
function missionDoneCount(m) {
  if (!m || !m.checks) return 0;
  var dates = missionDates(m), n = 0;
  for (var i = 0; i < dates.length; i++) if (m.checks[dates[i]]) n++;
  return n;
}
function missionComplete(m) {
  return !!m && m.days > 0 && missionDoneCount(m) >= m.days;
}
function normMission(raw) {
  if (!raw || typeof raw !== 'object') return null;
  var start = /^\d{4}-\d{2}-\d{2}$/.test(String(raw.start || '')) ? String(raw.start) : dateKey();
  var end = /^\d{4}-\d{2}-\d{2}$/.test(String(raw.end || '')) ? String(raw.end) : dayKeyAdd(start, 6);
  if (end < start) end = start;
  var span = dayGap(start, end);
  var days = clampInt(raw.days, 1, MSN_DAYS_MAX, span);
  if (days > span) days = span;
  var m = {
    id: (typeof raw.id === 'string' && /^sm-[A-Za-z0-9_-]{1,32}$/.test(raw.id)) ? raw.id : ('sm-' + uid('')),
    emoji: (typeof raw.emoji === 'string' && raw.emoji.trim()) ? fixEmoji(raw.emoji.trim().slice(0, 4)) : '🎯',
    title: (typeof raw.title === 'string' && raw.title.replace(/\s+/g, ' ').trim()) ? raw.title.replace(/\s+/g, ' ').trim().slice(0, 30) : '새 특별 미션',
    start: start, end: end, days: days,
    reward: clampInt(raw.reward, 0, MSN_REWARD_MAX, 1),
    checks: {},
    granted: raw.granted === true,
    grantedAt: Math.max(0, Number(raw.grantedAt) || 0),
    u: Math.max(0, Number(raw.u) || 0)
  };
  var rc = (raw.checks && typeof raw.checks === 'object' && Object.prototype.toString.call(raw.checks) !== '[object Array]') ? raw.checks : {};
  for (var k in rc) {
    if (!Object.prototype.hasOwnProperty.call(rc, k)) continue;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(k) || !rc[k]) continue;
    if (k < m.start || k > m.end) continue;
    m.checks[k] = 1;
  }
  return m;
}
function normMissions(rawList) {
  var out = [], seen = {};
  var arr = (Object.prototype.toString.call(rawList) === '[object Array]') ? rawList : [];
  for (var i = 0; i < arr.length && out.length < MSN_MAX; i++) {
    var m = normMission(arr[i]);
    if (!m || seen[m.id]) continue;
    seen[m.id] = 1;
    out.push(m);
  }
  return out;
}
/* ---- 역할 정리 ---- */
function normRole(raw) {
  if (!raw || typeof raw !== 'object') return null;
  var items = [], seen = {};
  var rawItems = (Object.prototype.toString.call(raw.items) === '[object Array]') ? raw.items : [];
  for (var i = 0; i < rawItems.length && items.length < RCL_ITEM_MAX; i++) {
    var it = rawItems[i] || {};
    var txt = (typeof it.text === 'string') ? it.text.replace(/\s+/g, ' ').trim().slice(0, 40) : '';
    if (!txt) continue;
    var iid = (typeof it.id === 'string' && /^ri-[A-Za-z0-9_-]{1,32}$/.test(it.id) && !seen[it.id]) ? it.id : ('ri-' + uid(''));
    if (seen[iid]) continue;
    seen[iid] = 1;
    items.push({ id: iid, text: txt });
  }
  var done = {}, keys = [];
  var rawDone = (raw.done && typeof raw.done === 'object' && Object.prototype.toString.call(raw.done) !== '[object Array]') ? raw.done : {};
  for (var k in rawDone) {
    if (!Object.prototype.hasOwnProperty.call(rawDone, k)) continue;
    if (!/^(\d{4}-\d{2}-\d{2}|\d{4}-W\d{2}|\d{4}-\d{2})$/.test(k)) continue;
    var rec = rawDone[k];
    if (!rec || typeof rec !== 'object') continue;
    var one = { items: {}, g: rec.g ? 1 : 0, at: Math.max(0, Number(rec.at) || 0) };
    var ri = (rec.items && typeof rec.items === 'object') ? rec.items : {};
    for (var ik in ri) {
      if (!Object.prototype.hasOwnProperty.call(ri, ik)) continue;
      if (typeof ik !== 'string' || ik.length > 40 || !ri[ik]) continue;
      one.items[ik] = 1;
    }
    done[k] = one;
    keys.push(k);
  }
  if (keys.length > 24) {
    keys.sort(function (a, b) { return (done[b].at || 0) - (done[a].at || 0); });
    var keep = {};
    for (var j = 0; j < 24; j++) keep[keys[j]] = done[keys[j]];
    done = keep;
  }
  return {
    id: (typeof raw.id === 'string' && /^rl-[A-Za-z0-9_-]{1,32}$/.test(raw.id)) ? raw.id : ('rl-' + uid('')),
    emoji: (typeof raw.emoji === 'string' && raw.emoji.trim()) ? fixEmoji(raw.emoji.trim().slice(0, 4)) : '⚡',
    title: (typeof raw.title === 'string' && raw.title.replace(/\s+/g, ' ').trim()) ? raw.title.replace(/\s+/g, ' ').trim().slice(0, 16) : '새 역할',
    cycle: normCycle(raw.cycle),
    reward: clampInt(raw.reward, 0, MSN_REWARD_MAX, 1),
    items: items,
    done: done,
    u: Math.max(0, Number(raw.u) || 0)
  };
}
function normRoles(rawList) {
  var out = [], seen = {};
  var arr = (Object.prototype.toString.call(rawList) === '[object Array]') ? rawList : [];
  for (var i = 0; i < arr.length && out.length < RCL_MAX; i++) {
    var r = normRole(arr[i]);
    if (!r || seen[r.id]) continue;
    seen[r.id] = 1;
    out.push(r);
  }
  return out;
}
function defaultRoles() {
  return [
    {
      id: 'rl-power-1', emoji: '⚡', title: '전력관리자', cycle: 'day', reward: 1,
      items: [
        { id: 'ri-power-1', text: '아침에 안 쓰는 전등·전자제품 끄기' },
        { id: 'ri-power-2', text: '저녁에 방 불 끄고 나오기' }
      ],
      done: {}, u: 0
    },
    {
      id: 'rl-plant-1', emoji: '🌱', title: '식집사', cycle: 'month', reward: 1,
      items: [
        { id: 'ri-plant-1', text: '화분마다 물 주기' },
        { id: 'ri-plant-2', text: '잎 색·상태 살펴보기' }
      ],
      done: {}, u: 0
    }
  ];
}

/* ---- 블록·항목 찾기 ---- */
function blockNodeOf(blkId) {
  var nodes = document.querySelectorAll('[data-block-type]');
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i].getAttribute('data-block') === blkId) return nodes[i];
  }
  return null;
}
function missionBlk(blkId) {
  var f = findBlk(blkId);
  if (!f || f.blk.type !== 'special_missions') return null;
  if (Object.prototype.toString.call(f.blk.missions) !== '[object Array]') f.blk.missions = [];
  return f;
}
function roleBlk(blkId) {
  var f = findBlk(blkId);
  if (!f || f.blk.type !== 'role_checklist') return null;
  if (Object.prototype.toString.call(f.blk.roles) !== '[object Array]') f.blk.roles = [];
  return f;
}
function findMissionIn(blk, id) {
  var list = (blk && blk.missions) || [];
  for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
  return null;
}
function findRoleIn(blk, id) {
  var list = (blk && blk.roles) || [];
  for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
  return null;
}

/* ---- 스티커 자동 지급 (미션·역할 완료) ---- */
function archiveBoardQuiet() {
  var st = state.sticker;
  if (!st || !(st.slots > 0) || st.stickers.length < st.slots) return false;
  state.boardLog.push({ d: dateKey(), t: Date.now(), slots: st.slots, goal: st.goal || '' });
  clearStickerSlots();
  st.celebrated = false;
  return true;
}
/* 칭찬 스티커를 n개 붙이고, 스티커 장부·코인까지 기존 방식 그대로 남겨요 */
function grantStickersAuto(count, reason) {
  var n = clampInt(count, 0, 20, 0);
  if (!n || !state.sticker) return 0;
  var st = state.sticker;
  var slots = Math.max(1, parseInt(st.slots, 10) || 10);
  for (var i = 0; i < n; i++) {
    if (st.stickers.length >= slots) archiveBoardQuiet();
    var shape = stickerActiveShape();
    pushStickerSlot(shape.e, shape.id);
    var logged = logSticker(shape.e, String(reason || '').slice(0, 20), shape.id);
    try { markStickerCoinSeen(logged); } catch (e0) { /* 무시 */ }
    try { awardStickerCoins(); } catch (e1) { /* 무시 */ }
  }
  freshIdx = st.stickers.length - 1;
  touchBoard(Date.now());
  bumpProgress('sticker', n);
  gainXp(XP_STICKER * n);
  saveState();
  try { renderStickers(); } catch (e2) { /* 무시 */ }
  try { renderCoinBadge(); } catch (e3) { /* 무시 */ }
  try { refreshAcctStickerPane(); } catch (e4) { /* 무시 */ }
  try { confetti(22); snd('sticker'); } catch (e5) { /* 무시 */ }
  return n;
}

function showMilestoneWin(emoji, title, text) {
  var m = document.getElementById('msnWinModal');
  if (!m) { showToast(title + ' ' + text); return; }
  var e1 = document.getElementById('msnWinEmoji');
  if (e1) e1.textContent = emoji || '🎉';
  var e2 = document.getElementById('msnWinTitle');
  if (e2) e2.textContent = title || '완료!';
  var e3 = document.getElementById('msnWinText');
  if (e3) e3.textContent = text || '';
  m.hidden = false;
  lockScroll();
  try { confetti(60); snd('win'); } catch (e) { /* 무시 */ }
}
function closeMilestoneWin() {
  var m = document.getElementById('msnWinModal');
  if (m) m.hidden = true;
  if (isOnlyModal('msnWinModal')) unlockScroll();
}

/* 모든 칸을 채운 미션은 보상을 한 번만 줘요 (granted 표시로 중복 지급 방지) */
function settleMission(blkId, m, opts) {
  if (!m || m.granted || !missionComplete(m)) return 0;
  m.granted = true;
  m.grantedAt = Date.now();
  m.u = Date.now();
  var n = clampInt(m.reward, 0, MSN_REWARD_MAX, 0);
  if (n > 0) grantStickersAuto(n, '특별미션');
  saveState();
  if (!opts || opts.celebrate !== false) {
    showMilestoneWin(m.emoji || '🎯', '특별 미션 완료!',
      (m.title || '미션') + ' 미션을 끝냈어요!' + (n > 0 ? ' 칭찬 스티커 ' + n + '개를 받았어요!' : ''));
  }
  return n;
}

function roleCycleState(role) {
  if (!role.done || typeof role.done !== 'object') role.done = {};
  var key = cycleKeyOf(role.cycle);
  var cur = role.done[key];
  if (!cur || typeof cur !== 'object') { cur = { items: {}, g: 0, at: 0 }; role.done[key] = cur; }
  if (!cur.items || typeof cur.items !== 'object') cur.items = {};
  return { key: key, cur: cur };
}
function roleDoneCount(role, cur) {
  var n = 0, items = role.items || [];
  for (var i = 0; i < items.length; i++) if (cur.items[items[i].id]) n++;
  return n;
}
function roleComplete(role, cur) {
  var items = role.items || [];
  return items.length > 0 && roleDoneCount(role, cur) >= items.length;
}
function settleRole(role, cur, opts) {
  if (!role || !cur || cur.g || !roleComplete(role, cur)) return 0;
  var n = clampInt(role.reward, 0, MSN_REWARD_MAX, 0);
  cur.g = 1;
  cur.at = Date.now();
  role.u = Date.now();
  if (n > 0) grantStickersAuto(n, '역할:' + String(role.title || '').slice(0, 12));
  saveState();
  if (!opts || opts.celebrate !== false) {
    showMilestoneWin(role.emoji || '⚡', '역할 완료!',
      (role.title || '역할') + ' 역할의 ' + cycleShortLabel(role.cycle) + ' 몫을 다 했어요!' +
      (n > 0 ? ' 칭찬 스티커 ' + n + '개를 받았어요!' : ''));
  }
  return n;
}

/* ---- 그리기 ---- */
function missionBlockBodyHtml(blk) {
  var list = blk.missions || [];
  var h = '<div class="msn-list">';
  if (!list.length) {
    h += '<p class="blk-empty">아직 특별 미션이 없어요.' + (can('edit') ? ' 아래 [＋ 미션 추가]로 만들어 보세요.' : '') + '</p>';
  }
  for (var i = 0; i < list.length; i++) h += missionCardHtml(blk, list[i]);
  if (can('edit')) h += '<button type="button" class="msn-add" data-act="msn-add" data-blk="' + esc(blk.id) + '">＋ 미션 추가</button>';
  h += '</div>';
  return h;
}

function missionCardHtml(blk, m) {
  var today = dateKey();
  var dates = missionDates(m);
  var done = missionDoneCount(m);
  var goal = Math.max(1, m.days || 1);
  var pct = Math.min(100, Math.round(done * 100 / goal));
  var complete = done >= goal;
  var over = m.end < today;
  var notYet = m.start > today;
  var rewardTxt = m.reward > 0 ? '⭐ ' + m.reward + '개' : '보상 없음';
  var h = '<article class="msn-card' + (complete ? ' done' : '') + (over && !complete ? ' over' : '') + '" data-mission="' + esc(m.id) + '">';
  h += '<div class="msn-top"><span class="msn-emoji" aria-hidden="true">' + esc(m.emoji || '🎯') + '</span>';
  h += '<div class="msn-meta"><b class="msn-title">' + esc(m.title || '특별 미션') + '</b>';
  h += '<span class="msn-sub">' + esc(fmtDayDot(m.start) + '~' + fmtDayDot(m.end)) + ' · ' + goal + '일 중 ' + Math.min(done, goal) + '일</span></div>';
  if (can('edit')) {
    h += '<button type="button" class="msn-edit" data-act="msn-edit" data-blk="' + esc(blk.id) + '" data-mission="' + esc(m.id) +
      '" aria-label="미션 고치기" title="미션 고치기">✏️</button>';
  }
  h += '</div>';
  h += '<div class="msn-cells" role="group" aria-label="' + esc((m.title || '미션') + ' 날짜 체크') + '">';
  for (var i = 0; i < dates.length; i++) {
    var dk = dates[i];
    var dd = keyToDate(dk);
    var on = !!m.checks[dk];
    var isToday = dk === today;
    var future = dk > today;
    var missed = !on && dk < today;
    var cls = 'msn-cell' + (on ? ' on' : '') + (isToday ? ' today' : '') + (future ? ' off' : '') + (missed ? ' missed' : '');
    var dis = future ? ' disabled aria-disabled="true"' : '';
    var lbl = dd ? ((dd.getMonth() + 1) + '월 ' + dd.getDate() + '일 ' + WEEK_KO[dd.getDay()] + '요일') : dk;
    h += '<button type="button" class="' + cls + '" data-act="msn-check" data-blk="' + esc(blk.id) + '" data-mission="' + esc(m.id) +
      '" data-date="' + esc(dk) + '"' + dis + ' aria-pressed="' + (on ? 'true' : 'false') + '" aria-label="' + esc(lbl + (on ? ' 체크됨' : (future ? ' 아직' : ' 체크'))) + '">' +
      '<span class="d">' + (dd ? dd.getDate() : '·') + '</span><span class="w">' + (dd ? WEEK_KO[dd.getDay()] : '') + '</span></button>';
  }
  h += '</div>';
  h += '<div class="msn-foot"><div class="msn-bar" aria-hidden="true"><i style="width:' + pct + '%"></i></div>' +
    '<span class="msn-prog">' + Math.min(done, goal) + '/' + goal + '</span>' +
    '<span class="msn-reward">' + esc(rewardTxt) + '</span></div>';
  if (complete) {
    h += '<p class="msn-msg">🎉 미션 완료!' + (m.reward > 0 ? ' 칭찬 스티커 ' + m.reward + '개 받았어요.' : ' 끝까지 해냈어요!') + '</p>';
  } else if (over) {
    h += '<p class="msn-msg over">⏰ 기간이 끝났어요 · ' + Math.max(0, goal - done) + '일 모자랐어요</p>';
  } else if (notYet) {
    h += '<p class="msn-msg wait">⏳ ' + esc(fmtDayDot(m.start)) + '부터 시작해요</p>';
  } else {
    var left = dayGap(today, m.end);
    h += '<p class="msn-msg wait">⏳ ' + left + '일 남았어요 · 오늘 한 칸 체크!</p>';
  }
  h += '</article>';
  return h;
}

function roleBlockBodyHtml(blk) {
  var roles = blk.roles || [];
  var h = '<div class="rcl-list">';
  if (!roles.length) {
    h += '<p class="rcl-empty">아직 맡은 역할이 없어요.' + (can('edit') ? ' 아래 [＋ 역할 추가]로 만들어 보세요.' : '') + '</p>';
  }
  for (var i = 0; i < roles.length; i++) h += roleCardHtml(blk, roles[i]);
  if (can('edit')) h += '<button type="button" class="msn-add" data-act="rcl-add" data-blk="' + esc(blk.id) + '">＋ 역할 추가</button>';
  h += '</div>';
  return h;
}

function roleCardHtml(blk, role) {
  var st = roleCycleState(role);
  var items = role.items || [];
  var done = roleDoneCount(role, st.cur);
  var total = items.length;
  var pct = total ? Math.min(100, Math.round(done * 100 / total)) : 0;
  var complete = total > 0 && done >= total;
  var cyc = normCycle(role.cycle);
  var h = '<article class="rcl-role' + (complete ? ' done' : '') + '" data-role="' + esc(role.id) + '">';
  h += '<div class="rcl-head"><span class="rcl-emoji" aria-hidden="true">' + esc(role.emoji || '⚡') + '</span>' +
    '<b class="rcl-name">' + esc(role.title || '역할') + '</b>' +
    '<span class="rcl-cycle is-' + cyc + '">' + cycleLabel(cyc) + '</span>';
  if (can('edit')) {
    h += '<button type="button" class="msn-edit" data-act="rcl-edit" data-blk="' + esc(blk.id) + '" data-role="' + esc(role.id) +
      '" aria-label="역할 고치기" title="역할 고치기">✏️</button>';
  }
  h += '</div>';
  h += '<ul class="rcl-items">';
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    var on = !!st.cur.items[it.id];
    h += '<li><button type="button" class="rcl-item' + (on ? ' on' : '') + '" data-act="rcl-toggle" data-blk="' + esc(blk.id) +
      '" data-role="' + esc(role.id) + '" data-item="' + esc(it.id) + '" role="checkbox" aria-checked="' + (on ? 'true' : 'false') + '">' +
      '<span class="box" aria-hidden="true">✓</span><span class="tx">' + esc(it.text) + '</span></button></li>';
  }
  if (!items.length) h += '<li class="msn-sub">체크 항목이 없어요. ✏️로 항목을 넣어 주세요.</li>';
  h += '</ul>';
  h += '<div class="rcl-foot"><div class="msn-bar" aria-hidden="true"><i style="width:' + pct + '%"></i></div>' +
    '<span class="rcl-count">' + cycleShortLabel(cyc) + ' ' + done + '/' + total + '</span>' +
    '<span class="msn-reward">' + esc(role.reward > 0 ? '⭐ ' + role.reward + '개' : '보상 없음') + '</span></div>';
  if (complete) h += '<p class="msn-msg">🎉 ' + cycleShortLabel(cyc) + ' 몫을 다 했어요!' + (role.reward > 0 ? ' 스티커 ' + role.reward + '개 받았어요.' : '') + '</p>';
  h += '</article>';
  return h;
}

function renderMissionBlock(blkId) {
  var f = missionBlk(blkId);
  if (!f) return;
  if (can('edit') && inlineSecOn(f.sec)) { renderSections(); return; }
  var root = blockNodeOf(blkId);
  if (!root) return;
  var body = root.querySelector('.blk-body');
  if (body) body.innerHTML = missionBlockBodyHtml(f.blk);
}
function renderRoleBlock(blkId) {
  var f = roleBlk(blkId);
  if (!f) return;
  if (can('edit') && inlineSecOn(f.sec)) { renderSections(); return; }
  var root = blockNodeOf(blkId);
  if (!root) return;
  var body = root.querySelector('.blk-body');
  if (body) body.innerHTML = roleBlockBodyHtml(f.blk);
}
function renderMissions() {
  eachBlockOfType('special_missions', function (root, blk) {
    var body = root.querySelector('.blk-body');
    if (body) body.innerHTML = missionBlockBodyHtml(blk);
  });
}
function renderRoles() {
  eachBlockOfType('role_checklist', function (root, blk) {
    var body = root.querySelector('.blk-body');
    if (body) body.innerHTML = roleBlockBodyHtml(blk);
  });
}

/* ---- 체크 ---- */
function onMissionCheck(blkId, missionId, dk) {
  if (!can('check')) return;
  var f = missionBlk(blkId);
  if (!f) return;
  var m = findMissionIn(f.blk, missionId);
  if (!m || !dk) return;
  var today = dateKey();
  if (dk < m.start || dk > m.end || dk > today) return;
  var wasOn = !!m.checks[dk];
  if (wasOn) delete m.checks[dk]; else m.checks[dk] = 1;
  m.u = Date.now();
  saveState();
  var coinKey = 'msn|' + blkId + '|' + m.id + '|' + dk;
  var coinN = vnum('coinMissionCheck');
  if (!wasOn) {
    try { snd('check'); } catch (e) { /* 무시 */ }
    /* 칸 하나를 체크할 때마다 코인 (미션을 다 채운 보상 스티커는 settleMission 이 따로 줘요) */
    bumpProgress('mission', 1);
    gainXp(XP_MISSION);
    var gotM = awardCoinsOnce(coinKey, coinN);
    if (gotM.coin) {
      try { showToast(coinSvg() + ' +' + fmtNum(gotM.coin) + ' 코인!', true); } catch (e2) { /* 무시 */ }
      try { renderCoinBadge(); } catch (e3) { /* 무시 */ }
    }
    settleMission(blkId, m, { celebrate: true });
  } else {
    try { snd('uncheck'); } catch (e) { /* 무시 */ }
    revokeCoinsOnce(coinKey, coinN);
    bumpProgress('mission', -1);
    gainXp(-XP_MISSION);
    try { renderCoinBadge(); } catch (e4) { /* 무시 */ }
  }
  saveState();   /* 코인·EXP·진행도까지 바로 저장해요 */
  renderMissionBlock(blkId);
}

function onRoleToggle(blkId, roleId, itemId) {
  if (!can('check')) return;
  var f = roleBlk(blkId);
  if (!f) return;
  var role = findRoleIn(f.blk, roleId);
  if (!role || !itemId) return;
  var st = roleCycleState(role);
  var wasOn = !!st.cur.items[itemId];
  if (wasOn) delete st.cur.items[itemId]; else st.cur.items[itemId] = 1;
  st.cur.at = Date.now();
  role.u = Date.now();
  saveState();
  /* 역할 항목 하나를 체크할 때마다 코인 — 주기(매일/매주/매월)마다 따로 세요 */
  var rKey = 'rcl|' + blkId + '|' + role.id + '|' + st.key + '|' + itemId;
  var rCoin = vnum('coinRoleCheck');
  if (!wasOn) {
    try { snd('check'); } catch (e) { /* 무시 */ }
    bumpProgress('role', 1);
    gainXp(XP_CHECK);
    var gotR = awardCoinsOnce(rKey, rCoin);
    if (gotR.coin) {
      try { showToast(coinSvg() + ' +' + fmtNum(gotR.coin) + ' 코인!', true); } catch (e2) { /* 무시 */ }
      try { renderCoinBadge(); } catch (e3) { /* 무시 */ }
    }
    settleRole(role, st.cur, { celebrate: true });
  } else {
    try { snd('uncheck'); } catch (e) { /* 무시 */ }
    revokeCoinsOnce(rKey, rCoin);
    bumpProgress('role', -1);
    gainXp(-XP_CHECK);
    try { renderCoinBadge(); } catch (e4) { /* 무시 */ }
  }
  saveState();   /* 코인·EXP·진행도까지 바로 저장해요 */
  renderRoleBlock(blkId);
}

/* ---- 미션 고치기 팝업 ---- */
var msnEdit = { blk: '', id: '', isNew: false, d: null };

function openMissionEditor(blkId, missionId) {
  if (!can('edit')) return;
  var f = missionBlk(blkId);
  if (!f) return;
  var m = missionId ? findMissionIn(f.blk, missionId) : null;
  var isNew = !m;
  if (isNew && (f.blk.missions || []).length >= MSN_MAX) { showToast('미션은 ' + MSN_MAX + '개까지 만들 수 있어요.'); return; }
  var start = dateKey();
  msnEdit = {
    blk: blkId, id: m ? m.id : ('sm-' + uid('')), isNew: isNew,
    d: m ? { emoji: m.emoji, title: m.title, start: m.start, end: m.end, days: m.days, reward: m.reward }
      : { emoji: '🎯', title: '', start: start, end: dayKeyAdd(start, 6), days: 7, reward: 1 }
  };
  renderMissionEditor();
  var el = document.getElementById('msnModal');
  if (el) { el.hidden = false; lockScroll(); }
  var inp = document.getElementById('msnTitle');
  if (inp) { try { inp.focus(); inp.select(); } catch (e) { /* 무시 */ } }
}
function closeMissionEditor() {
  var el = document.getElementById('msnModal');
  if (el) el.hidden = true;
  msnEdit = { blk: '', id: '', isNew: false, d: null };
  if (isOnlyModal('msnModal')) unlockScroll();
}
function missionCalcText(d) {
  var span = dayGap(d.start, d.end);
  var days = clampInt(d.days, 1, MSN_DAYS_MAX, 1);
  if (days > span) return '기간이 ' + span + '일이라, 목표 ' + days + '일에 맞춰 종료일을 늘려 저장해요.';
  return span + '일 기간 중 ' + days + '일을 채우면 완료! 하루에 한 칸씩 체크해요.';
}
function emojiRowHtml(cur, list, act) {
  var h = '<div class="me-emoji">';
  var all = list.slice(0);
  cur = fixEmoji(cur);
  if (cur && all.indexOf(cur) < 0) all.unshift(cur);
  for (var i = 0; i < all.length; i++) {
    h += '<button type="button" data-act="' + act + '" data-e="' + esc(all[i]) + '" class="' + (all[i] === cur ? 'on' : '') +
      '" aria-pressed="' + (all[i] === cur ? 'true' : 'false') + '">' + esc(all[i]) + '</button>';
  }
  h += '</div>';
  return h;
}
function missionEditorHtml() {
  var d = msnEdit.d;
  if (!d) return '';
  var h = '<h2 id="msnModalTitle">' + (msnEdit.isNew ? '🎯 새 특별 미션' : '🎯 미션 고치기') + '</h2>';
  h += '<p class="me-note">제목·기간·목표 일수·보상 스티커를 만들고 나서도 언제든 바꿀 수 있어요.</p>';
  h += '<div class="me-field"><span>이모지</span>' + emojiRowHtml(d.emoji, MSN_EMOJI, 'msn-pick-emoji') +
    '<input class="inp" id="msnEmoji" maxlength="4" value="' + esc(fixEmoji(d.emoji) || '🎯') + '" placeholder="직접 입력 (Win+.)" aria-label="미션 이모지"></div>';
  h += '<label class="me-field"><span>무엇을 하나요</span><input class="inp" id="msnTitle" maxlength="30" placeholder="예: 일주일 동안 우유 마시기" value="' + esc(d.title || '') + '"></label>';
  h += '<div class="me-row">' +
    '<label class="me-field"><span>시작일</span><input class="inp" type="date" id="msnStart" value="' + esc(d.start) + '"></label>' +
    '<label class="me-field"><span>종료일</span><input class="inp" type="date" id="msnEnd" value="' + esc(d.end) + '"></label>' +
    '</div>';
  h += '<div class="me-row">' +
    '<div class="me-field"><span>목표 일수</span><div class="me-step">' +
      '<button type="button" data-act="msn-days-minus" aria-label="목표 일수 줄이기">−</button>' +
      '<input class="inp" type="number" inputmode="numeric" id="msnDays" min="1" max="' + MSN_DAYS_MAX + '" value="' + clampInt(d.days, 1, MSN_DAYS_MAX, 1) + '">' +
      '<button type="button" data-act="msn-days-plus" aria-label="목표 일수 늘리기">＋</button></div></div>' +
    '<div class="me-field"><span>보상 스티커</span><div class="me-step">' +
      '<button type="button" data-act="msn-reward-minus" aria-label="보상 줄이기">−</button>' +
      '<input class="inp" type="number" inputmode="numeric" id="msnReward" min="0" max="' + MSN_REWARD_MAX + '" value="' + clampInt(d.reward, 0, MSN_REWARD_MAX, 0) + '">' +
      '<button type="button" data-act="msn-reward-plus" aria-label="보상 늘리기">＋</button></div></div>' +
    '</div>';
  h += '<p class="me-note" id="msnCalc">' + esc(missionCalcText(d)) + '</p>';
  h += '<div class="me-actions">' +
    '<button type="button" class="modal-btn" data-act="msn-save">💾 저장</button>' +
    '<button type="button" class="modal-btn sub" data-act="msn-close">취소</button>' +
    (msnEdit.isNew ? '' : '<button type="button" class="me-del" data-act="msn-del">삭제</button>') +
    '</div>';
  return h;
}
function renderMissionEditor() {
  var body = document.getElementById('msnEditBody');
  if (body) body.innerHTML = missionEditorHtml();
}
function syncMissionCalc() {
  var el = document.getElementById('msnCalc');
  if (el && msnEdit.d) el.textContent = missionCalcText(msnEdit.d);
  var ds = document.getElementById('msnDays');
  if (ds && msnEdit.d) ds.value = clampInt(msnEdit.d.days, 1, MSN_DAYS_MAX, 1);
  var rs = document.getElementById('msnReward');
  if (rs && msnEdit.d) rs.value = clampInt(msnEdit.d.reward, 0, MSN_REWARD_MAX, 0);
  var es = document.getElementById('msnEnd');
  if (es && msnEdit.d) es.value = msnEdit.d.end;
}
function saveMissionEditor() {
  if (!can('edit') || !msnEdit.d) return;
  var f = missionBlk(msnEdit.blk);
  if (!f) { closeMissionEditor(); return; }
  var d = msnEdit.d;
  var title = String(d.title || '').replace(/\s+/g, ' ').trim().slice(0, 30);
  if (!title) { showToast('미션 이름을 적어 주세요.'); return; }
  var start = /^\d{4}-\d{2}-\d{2}$/.test(String(d.start || '')) ? d.start : dateKey();
  var end = /^\d{4}-\d{2}-\d{2}$/.test(String(d.end || '')) ? d.end : start;
  if (end < start) end = start;
  var days = clampInt(d.days, 1, MSN_DAYS_MAX, 1);
  if (days > dayGap(start, end)) end = dayKeyAdd(start, days - 1);
  var list = f.blk.missions || (f.blk.missions = []);
  var at = -1;
  for (var i = 0; i < list.length; i++) if (list[i].id === msnEdit.id) at = i;
  if (at < 0 && list.length >= MSN_MAX) { showToast('미션은 ' + MSN_MAX + '개까지 만들 수 있어요.'); return; }
  var old = at >= 0 ? list[at] : null;
  var m = {
    id: msnEdit.id, emoji: fixEmoji(String(d.emoji || '🎯').trim().slice(0, 4)) || '🎯', title: title,
    start: start, end: end, days: days,
    reward: clampInt(d.reward, 0, MSN_REWARD_MAX, 0),
    checks: old ? (old.checks || {}) : {},
    granted: old ? !!old.granted : false,
    grantedAt: old ? (Number(old.grantedAt) || 0) : 0,
    u: Date.now()
  };
  var keep = {}, dates = missionDates(m);
  for (var k = 0; k < dates.length; k++) if (m.checks[dates[k]]) keep[dates[k]] = 1;
  m.checks = keep;
  if (at >= 0) list[at] = m; else list.push(m);
  var blkId = msnEdit.blk, wasNew = msnEdit.isNew;
  f.blk.u = Date.now();
  saveAndPush();
  closeMissionEditor();
  settleMission(blkId, m, { celebrate: true });
  renderMissionBlock(blkId);
  try { renderEditPanel(); } catch (e0) { /* 무시 */ }
  showToast(wasNew ? '🎯 특별 미션을 만들었어요.' : '🎯 미션을 고쳤어요.');
}
function deleteMissionEditor() {
  if (!can('edit') || !msnEdit.d) return;
  var f = missionBlk(msnEdit.blk);
  if (!f) { closeMissionEditor(); return; }
  var list = f.blk.missions || [];
  var at = -1;
  for (var i = 0; i < list.length; i++) if (list[i].id === msnEdit.id) at = i;
  if (at < 0) { closeMissionEditor(); return; }
  var m = list[at];
  if (!window.confirm('"' + (m.title || '미션') + '" 미션을 지울까요?\n체크한 날짜와 받은 보상 기록도 함께 사라져요.')) return;
  var blkId = msnEdit.blk;
  list.splice(at, 1);
  f.blk.u = Date.now();
  saveAndPush();
  closeMissionEditor();
  renderMissionBlock(blkId);
  try { renderEditPanel(); } catch (e0) { /* 무시 */ }
  showToast('미션을 지웠어요.');
}

/* ---- 역할 고치기 팝업 ---- */
var rclEdit = { blk: '', id: '', isNew: false, d: null };

function openRoleEditor(blkId, roleId) {
  if (!can('edit')) return;
  var f = roleBlk(blkId);
  if (!f) return;
  var role = roleId ? findRoleIn(f.blk, roleId) : null;
  var isNew = !role;
  if (isNew && (f.blk.roles || []).length >= RCL_MAX) { showToast('역할은 ' + RCL_MAX + '개까지 만들 수 있어요.'); return; }
  rclEdit = {
    blk: blkId, id: role ? role.id : ('rl-' + uid('')), isNew: isNew,
    d: role
      ? { emoji: role.emoji, title: role.title, cycle: role.cycle, reward: role.reward,
          items: (role.items || []).map(function (it) { return { id: it.id, text: it.text }; }) }
      : { emoji: '⚡', title: '', cycle: 'day', reward: 1, items: [{ id: 'ri-' + uid(''), text: '' }] }
  };
  renderRoleEditor();
  var el = document.getElementById('rclModal');
  if (el) { el.hidden = false; lockScroll(); }
  var inp = document.getElementById('rclName');
  if (inp) { try { inp.focus(); } catch (e) { /* 무시 */ } }
}
function closeRoleEditor() {
  var el = document.getElementById('rclModal');
  if (el) el.hidden = true;
  rclEdit = { blk: '', id: '', isNew: false, d: null };
  if (isOnlyModal('rclModal')) unlockScroll();
}
function roleEditorHtml() {
  var d = rclEdit.d;
  if (!d) return '';
  var h = '<h2 id="rclModalTitle">' + (rclEdit.isNew ? '⚡ 새 역할' : '⚡ 역할 고치기') + '</h2>';
  h += '<p class="me-note">이름·이모지·주기·보상 스티커와 체크 항목을 언제든 바꿀 수 있어요.</p>';
  h += '<div class="me-field"><span>이모지</span>' + emojiRowHtml(d.emoji, RCL_EMOJI, 'rcl-pick-emoji') +
    '<input class="inp" id="rclEmoji" maxlength="4" value="' + esc(fixEmoji(d.emoji) || '⚡') + '" placeholder="직접 입력 (Win+.)" aria-label="역할 이모지"></div>';
  h += '<label class="me-field"><span>역할 이름</span><input class="inp" id="rclName" maxlength="16" placeholder="예: 전력관리자" value="' + esc(d.title || '') + '"></label>';
  h += '<div class="me-field"><span>주기 — 이 주기가 바뀌면 체크가 새로 시작해요</span><div class="me-cycles">';
  var cycles = [['day', '매일'], ['week', '매주'], ['month', '매월']];
  for (var i = 0; i < cycles.length; i++) {
    h += '<button type="button" data-act="rcl-cycle" data-c="' + cycles[i][0] + '" class="' + (normCycle(d.cycle) === cycles[i][0] ? 'on' : '') +
      '" aria-pressed="' + (normCycle(d.cycle) === cycles[i][0] ? 'true' : 'false') + '">' + cycles[i][1] + '</button>';
  }
  h += '</div></div>';
  h += '<div class="me-field"><span>완료 보상 스티커 (0 = 스티커 없이 완료)</span><div class="me-step">' +
    '<button type="button" data-act="rcl-reward-minus" aria-label="보상 줄이기">−</button>' +
    '<input class="inp" type="number" inputmode="numeric" id="rclReward" min="0" max="' + MSN_REWARD_MAX + '" value="' + clampInt(d.reward, 0, MSN_REWARD_MAX, 0) + '">' +
    '<button type="button" data-act="rcl-reward-plus" aria-label="보상 늘리기">＋</button></div></div>';
  h += '<div class="me-field"><span>체크 항목</span><div class="me-items">';
  for (var j = 0; j < d.items.length; j++) {
    h += '<div class="me-item"><input class="inp" data-ritem="' + j + '" maxlength="40" placeholder="예: 아침에 안 쓰는 불 끄기" value="' + esc(d.items[j].text || '') + '">' +
      '<button type="button" class="del-btn" data-act="rcl-item-del" data-i="' + j + '" aria-label="항목 지우기">✕</button></div>';
  }
  h += '</div>';
  if (d.items.length < RCL_ITEM_MAX) h += '<button type="button" class="me-add" data-act="rcl-item-add">＋ 항목 추가</button>';
  h += '</div>';
  h += '<div class="me-actions">' +
    '<button type="button" class="modal-btn" data-act="rcl-save">💾 저장</button>' +
    '<button type="button" class="modal-btn sub" data-act="rcl-close">취소</button>' +
    (rclEdit.isNew ? '' : '<button type="button" class="me-del" data-act="rcl-del">삭제</button>') +
    '</div>';
  return h;
}
function renderRoleEditor() {
  var body = document.getElementById('rclEditBody');
  if (body) body.innerHTML = roleEditorHtml();
}
function saveRoleEditor() {
  if (!can('edit') || !rclEdit.d) return;
  var f = roleBlk(rclEdit.blk);
  if (!f) { closeRoleEditor(); return; }
  var d = rclEdit.d;
  var title = String(d.title || '').replace(/\s+/g, ' ').trim().slice(0, 16);
  if (!title) { showToast('역할 이름을 적어 주세요.'); return; }
  var items = [], seen = {};
  for (var i = 0; i < d.items.length && items.length < RCL_ITEM_MAX; i++) {
    var txt = String(d.items[i].text || '').replace(/\s+/g, ' ').trim().slice(0, 40);
    if (!txt) continue;
    var iid = (typeof d.items[i].id === 'string' && /^ri-[A-Za-z0-9_-]{1,32}$/.test(d.items[i].id) && !seen[d.items[i].id]) ? d.items[i].id : ('ri-' + uid(''));
    if (seen[iid]) continue;
    seen[iid] = 1;
    items.push({ id: iid, text: txt });
  }
  if (!items.length) { showToast('체크 항목을 하나 이상 적어 주세요.'); return; }
  var list = f.blk.roles || (f.blk.roles = []);
  var at = -1;
  for (var j = 0; j < list.length; j++) if (list[j].id === rclEdit.id) at = j;
  if (at < 0 && list.length >= RCL_MAX) { showToast('역할은 ' + RCL_MAX + '개까지 만들 수 있어요.'); return; }
  var old = at >= 0 ? list[at] : null;
  var role = {
    id: rclEdit.id, emoji: fixEmoji(String(d.emoji || '⚡').trim().slice(0, 4)) || '⚡', title: title,
    cycle: normCycle(d.cycle),
    reward: clampInt(d.reward, 0, MSN_REWARD_MAX, 0),
    items: items,
    done: old && old.done && typeof old.done === 'object' ? old.done : {},
    u: Date.now()
  };
  if (old && normCycle(old.cycle) !== role.cycle) role.done = {};   /* 주기를 바꾸면 그 주기부터 새로 */
  if (at >= 0) list[at] = role; else list.push(role);
  var blkId = rclEdit.blk, wasNew = rclEdit.isNew;
  f.blk.u = Date.now();
  saveAndPush();
  closeRoleEditor();
  var st = roleCycleState(role);
  settleRole(role, st.cur, { celebrate: true });
  renderRoleBlock(blkId);
  try { renderEditPanel(); } catch (e0) { /* 무시 */ }
  showToast(wasNew ? '⚡ 역할을 만들었어요.' : '⚡ 역할을 고쳤어요.');
}
function deleteRoleEditor() {
  if (!can('edit') || !rclEdit.d) return;
  var f = roleBlk(rclEdit.blk);
  if (!f) { closeRoleEditor(); return; }
  var list = f.blk.roles || [];
  var at = -1;
  for (var i = 0; i < list.length; i++) if (list[i].id === rclEdit.id) at = i;
  if (at < 0) { closeRoleEditor(); return; }
  var role = list[at];
  if (!window.confirm('"' + (role.title || '역할') + '" 역할을 지울까요?\n체크 기록과 받은 보상 기록도 함께 사라져요.')) return;
  var blkId = rclEdit.blk;
  list.splice(at, 1);
  f.blk.u = Date.now();
  saveAndPush();
  closeRoleEditor();
  renderRoleBlock(blkId);
  try { renderEditPanel(); } catch (e0) { /* 무시 */ }
  showToast('역할을 지웠어요.');
}

/* 팝업 입력 — 미션·역할 고치기 */
document.addEventListener('input', function (e) {
  var el = e.target;
  if (!el || !el.getAttribute) return;
  if (el.hasAttribute('data-ritem')) {
    if (rclEdit.d) {
      var rIdx = parseInt(el.getAttribute('data-ritem'), 10);
      if (!isNaN(rIdx) && rclEdit.d.items[rIdx]) rclEdit.d.items[rIdx].text = String(el.value || '').slice(0, 40);
    }
    return;
  }
  if (!el.id) return;
  if (el.id === 'msnTitle' && msnEdit.d) { msnEdit.d.title = String(el.value || '').slice(0, 30); return; }
  if (el.id === 'msnEmoji' && msnEdit.d) { msnEdit.d.emoji = String(el.value || '').slice(0, 4); return; }
  if (el.id === 'msnDays' && msnEdit.d) { msnEdit.d.days = clampInt(el.value, 1, MSN_DAYS_MAX, 1); syncMissionCalc(); return; }
  if (el.id === 'msnReward' && msnEdit.d) { msnEdit.d.reward = clampInt(el.value, 0, MSN_REWARD_MAX, 0); syncMissionCalc(); return; }
  if (el.id === 'rclName' && rclEdit.d) { rclEdit.d.title = String(el.value || '').slice(0, 16); return; }
  if (el.id === 'rclEmoji' && rclEdit.d) { rclEdit.d.emoji = String(el.value || '').slice(0, 4); return; }
  if (el.id === 'rclReward' && rclEdit.d) { rclEdit.d.reward = clampInt(el.value, 0, MSN_REWARD_MAX, 0); return; }
});
document.addEventListener('change', function (e) {
  var el = e.target;
  if (!el || !el.id) return;
  if (el.id === 'msnStart' && msnEdit.d) {
    var s = String(el.value || '');
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      msnEdit.d.start = s;
      if (msnEdit.d.end < s) msnEdit.d.end = dayKeyAdd(s, clampInt(msnEdit.d.days, 1, MSN_DAYS_MAX, 1) - 1);
      syncMissionCalc();
    }
    return;
  }
  if (el.id === 'msnEnd' && msnEdit.d) {
    var en = String(el.value || '');
    if (/^\d{4}-\d{2}-\d{2}$/.test(en)) {
      msnEdit.d.end = en;
      if (msnEdit.d.end < msnEdit.d.start) msnEdit.d.end = msnEdit.d.start;
      var span = dayGap(msnEdit.d.start, msnEdit.d.end);
      if (msnEdit.d.days > span) msnEdit.d.days = span;
      syncMissionCalc();
    }
  }
});

/* 다른 기기에서 체크한 진행을 조용히 맞춰요 (내가 고치는 중이 아닐 때만) */
var progressPullAt = 0, progressPulling = false;
function mergeMissionProgress(localList, remoteSettings) {
  var remoteList = remoteSettings && remoteSettings.dashboardSections;
  if (Object.prototype.toString.call(remoteList) !== '[object Array]') return false;
  /* 이 기기에서 방금 고쳐 저장을 기다리는 중이면 구름 것도 덮어쓰지 않아요 */
  if (cloud.dirty.settings || cloud.saving) return false;
  var rBlocks = {};
  for (var i = 0; i < remoteList.length; i++) {
    var bs = (remoteList[i] && remoteList[i].blocks) || [];
    for (var k = 0; k < bs.length; k++) if (bs[k] && bs[k].id) rBlocks[bs[k].id] = bs[k];
  }
  var changed = false;
  function newer(a, b) {
    var av = Math.max(0, Number(a) || 0), bv = Math.max(0, Number(b) || 0);
    return av > bv;
  }
  /* 미션 하나의 내용·진행을 통째로 옮겨요 */
  function copyMission(dst, src) {
    dst.emoji = src.emoji; dst.title = src.title; dst.start = src.start; dst.end = src.end;
    dst.days = src.days; dst.reward = src.reward; dst.checks = src.checks;
    dst.granted = src.granted; dst.grantedAt = src.grantedAt; dst.u = src.u;
  }
  function copyRole(dst, src) {
    dst.emoji = src.emoji; dst.title = src.title; dst.cycle = src.cycle; dst.reward = src.reward;
    dst.items = src.items;
    /* 주기마다 따로 남는 체크 기록은 더 최근 것만 골라 담아요 (이 기기의 새 체크를 지키려고) */
    if (!dst.done || typeof dst.done !== 'object') dst.done = {};
    if (src.done && typeof src.done === 'object') {
      for (var kk in src.done) {
        if (!Object.prototype.hasOwnProperty.call(src.done, kk)) continue;
        var cur = dst.done[kk];
        if (!cur || (Number(src.done[kk] && src.done[kk].at) || 0) >= (Number(cur.at) || 0)) dst.done[kk] = src.done[kk];
      }
    }
    dst.u = src.u;
  }
  for (var li = 0; li < localList.length; li++) {
    var lb = (localList[li] && localList[li].blocks) || [];
    for (var lk = 0; lk < lb.length; lk++) {
      var local = lb[lk];
      if (!local || !local.id) continue;
      var remote = rBlocks[local.id];
      if (!remote || remote.type !== local.type) continue;
      /* 카드(블록) 단위로 마지막에 고친 시각 — 새로 만들거나 지운 것도 이걸로 가려내요 */
      var remoteNewer = newer(remote.u, local.u);

      if (local.type === 'special_missions') {
        var rl = normMissions(remote.missions), ll = local.missions || [];
        if (!local.missions) { local.missions = ll = []; }
        var rById = {}, lById = {};
        for (var a = 0; a < rl.length; a++) rById[rl[a].id] = rl[a];
        for (var b = 0; b < ll.length; b++) lById[ll[b].id] = ll[b];
        /* 다른 기기에서 새로 만든 미션 */
        for (var ra = 0; ra < rl.length; ra++) {
          if (lById[rl[ra].id]) continue;
          if (!remoteNewer) break;
          ll.push(clone(rl[ra]));
          changed = true;
        }
        /* 다른 기기에서 지운 미션 */
        if (remoteNewer) {
          for (var lx = ll.length - 1; lx >= 0; lx--) {
            if (rById[ll[lx].id]) continue;
            ll.splice(lx, 1);
            changed = true;
          }
        }
        /* 둘 다 있는 미션 — 더 최근에 고친 쪽의 내용·진행을 따라요 */
        for (var rj = 0; rj < rl.length; rj++) {
          var rm = rl[rj], mine = null;
          for (var bi = 0; bi < ll.length; bi++) if (ll[bi].id === rm.id) { mine = ll[bi]; break; }
          if (!mine) continue;
          if (newer(rm.u, mine.u)) { copyMission(mine, rm); changed = true; }
        }
        if (remoteNewer) { local.u = remote.u; changed = true; }
      } else if (local.type === 'role_checklist') {
        var rr = normRoles(remote.roles), lrl = local.roles || [];
        if (!local.roles) { local.roles = lrl = []; }
        var rRById = {}, lRById = {};
        for (var c = 0; c < rr.length; c++) rRById[rr[c].id] = rr[c];
        for (var d0 = 0; d0 < lrl.length; d0++) lRById[lrl[d0].id] = lrl[d0];
        for (var rc = 0; rc < rr.length; rc++) {
          if (lRById[rr[rc].id]) continue;
          if (!remoteNewer) break;
          lrl.push(clone(rr[rc]));
          changed = true;
        }
        if (remoteNewer) {
          for (var lx2 = lrl.length - 1; lx2 >= 0; lx2--) {
            if (rRById[lrl[lx2].id]) continue;
            lrl.splice(lx2, 1);
            changed = true;
          }
        }
        for (var rq = 0; rq < rr.length; rq++) {
          var rOne = rr[rq], mineR = null;
          for (var b2 = 0; b2 < lrl.length; b2++) if (lrl[b2].id === rOne.id) { mineR = lrl[b2]; break; }
          if (!mineR) continue;
          if (newer(rOne.u, mineR.u)) { copyRole(mineR, rOne); changed = true; }
        }
        if (remoteNewer) { local.u = remote.u; changed = true; }
      }
    }
  }
  return changed;
}
async function refreshProgressFromCloud() {
  if (!cloud.conn || !cloud.me || !cloud.profileReady) return false;
  if (progressPulling || cloud.saving || cloud.again) return false;
  if (cloud.dirty.settings || cloud.dirty.stickers || cloud.dirty.day) return false;
  if (ui.editing || msnEdit.d || rclEdit.d) return false;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return false;
  var now = Date.now();
  if (now - progressPullAt < 60000) return false;
  progressPullAt = now;
  progressPulling = true;
  try {
    var res = await ghGet('config/settings.json');
    if (!res || !res.ok || !res.data) return false;
    if (cloud.saving || cloud.dirty.settings) return false;
    var changed = mergeMissionProgress(secList(), res.data.settings || {});
    if (!changed) return false;
    saveState();
    try { renderMissions(); } catch (e0) { /* 무시 */ }
    try { renderRoles(); } catch (e1) { /* 무시 */ }
    return true;
  } catch (e) {
    return false;
  } finally {
    progressPulling = false;
  }
}

/* 점검용: 다른 기기의 미션·역할 수정을 지금 한 번 받아 와요 (화면에는 안 보여요) */
try {
  document.documentElement.kidsPullProgress = function () { return refreshProgressFromCloud(); };
} catch (e) { /* 무시 */ }

function renderSections() {
  var box = document.getElementById('sections');
  if (!box) return;
  state.settings.dashboardSections = normalizeSections(state);
  var list = visibleSections();
  computeFirstBlocks(list);
  var h = '';
  for (var i = 0; i < list.length; i++) h += sectionShellHtml(list[i], i);
  if (!list.length) {
    h += '<section class="card sec sec-full"><p class="blk-empty">보이는 섹션이 없어요. ✏️ 편집에서 섹션을 보이게 해 주세요.</p></section>';
  }
  var keepTop = window.pageYOffset || 0;
  box.innerHTML = h;
  box.removeAttribute('data-layout-sig');
  secPainting = true;
  try {
    applyLayoutOrder();
    renderBlockContents();
  } finally {
    secPainting = false;
  }
  /* 카드가 최종 폭으로 자리를 잡은 뒤에 스티커 칸 줄 수를 다시 맞춰요 */
  syncStickerColumns();
  try { window.scrollTo(0, keepTop); } catch (e) { /* 무시 */ }
}

function eachBlockOfType(type, fn) {
  var nodes = document.querySelectorAll('[data-block-type="' + type + '"]');
  for (var i = 0; i < nodes.length; i++) {
    var bid = nodes[i].getAttribute('data-block');
    var f = findBlk(bid);
    if (!f) continue;
    fn(nodes[i], f.blk, i === 0);
  }
}

function bpart(root, name) {
  if (!root) return null;
  return root.querySelector('[data-part="' + name + '"]');
}

function renderBlockContents() {
  try { renderRoutine(); } catch (e) { /* 무시 */ }
  try { renderStickers(); } catch (e) { /* 무시 */ }
  try { renderTodayAcademy(); } catch (e) { /* 무시 */ }
  try { renderWeek(); } catch (e) { /* 무시 */ }
  try { renderTargetBars(); } catch (e) { /* 무시 */ }
  try { renderNoticeBlocks(); } catch (e) { /* 무시 */ }
  try { renderNotifyBtns(); } catch (e) { /* 무시 */ }
  try { renderMissions(); } catch (e) { /* 무시 */ }
  try { renderRoles(); } catch (e) { /* 무시 */ }
}

/* ---- 블록 골격 ---- */
function routineBlockInner(blk) {
  var first = isFirstBlock(blk);
  function id(v) { return first ? ' id="' + v + '"' : ''; }
  var h = '<div class="rt-top routine-top">' +
    '<div class="rt-left"><p class="rt-hint"' + id('routineHint') + ' data-part="hint">오늘 할 일을 하나씩 체크해 보자!</p></div>' +
    '<div class="rt-right">' +
      '<div class="rt-count"><strong' + id('overallDone') + ' data-part="done">0</strong> / <span' + id('overallTotal') + ' data-part="total">0</span> 완료</div>' +
      '<div class="rt-percent"' + id('overallPct') + ' data-part="pct">0%</div>' +
      '<div class="rt-bar"' + id('overallBar') + ' data-part="bar"><div class="rt-fill"' + id('overallFill') + ' data-part="fill"></div>' +
        '<span class="rt-rocket"' + id('overallRocket') + ' data-part="rocket">🚀</span></div>' +
      '<button class="rt-view-btn" data-act="routine-view-toggle"' + id('routineViewBtn') + ' data-part="viewBtn" aria-label="루틴 가로로 보기">↔️ 가로 보기</button>' +
    '</div></div>' +
    '<button type="button" class="rt-mute-btn" data-act="alert-mute" data-part="mute" aria-label="울리는 알림 소리 끄기" aria-pressed="false" hidden>🔇 알림 끄기</button>' +
    '<div class="rt-targets" data-part="targets"' + id('routineTargets') + ' hidden></div>' +
    '<div class="rt-jump" data-part="jump"' + id('routineJump') + ' role="group" aria-label="루틴 그룹 바로가기"></div>' +
    '<div class="routine-grid" data-part="grid"' + id('routineGrid') + ' data-view="grid"></div>' +
    '<p class="routine-empty" data-part="empty"' + id('routineEmpty') + ' hidden>아직 루틴 그룹이 없어요. 편집(✏️)에서 그룹을 만들 수 있어요.</p>' +
    '<div class="routine-empty day-empty" data-part="dayEmpty"' + id('routineDayEmpty') + ' hidden>' +
      '<span>오늘 요일에는 하는 루틴이 없어요 🌤️</span>' +
      '<button class="rt-view-btn" data-act="edit-toggle"' + id('routineDayEmptyEdit') + ' hidden>✏️ 편집에서 요일 바꾸기</button></div>' +
    '<button class="add-item add-group" data-act="cat-add" data-part="add"' + id('routineAddBtn') + ' hidden>+ 루틴 그룹 추가</button>';
  return h;
}

function stickerBlockInner(blk) {
  var first = isFirstBlock(blk);
  function id(v) { return first ? ' id="' + v + '"' : ''; }
  var h = '<div class="blk-head-row">' +
    '<span class="rt-percent"><strong' + id('stickerCount') + ' data-part="count">0</strong> / <span' + id('stickerSlots') + ' data-part="slots">10</span></span>' +
    '<button class="pill-btn warm" data-act="sticker-new"' + id('newBoardBtn') + ' data-part="new" hidden>🎉 새 판 시작</button>' +
    '</div>' +
    '<p class="goal" data-part="unit"' + id('stickerUnitLine') + ' hidden></p>' +
    '<div class="board" data-part="board"' + id('stickerBoard') + '></div>' +
    '<div class="ledger" data-part="ledger"' + id('stickerLedger') + '></div>';
  return h;
}

function weekBlockInner(blk) {
  var first = isFirstBlock(blk);
  function id(v) { return first ? ' id="' + v + '"' : ''; }
  var h = '<div class="head-tools week-tools blk-week-tools">' +
    '<button type="button" class="notify-btn" data-act="notify-toggle" data-part="notify"' + id('notifyBtn') + ' aria-pressed="false">🔔 일과표 10분 전 알림</button>' +
    '<button type="button" class="ghost-btn tiny" data-act="notify-test" data-part="notifyTest"' + id('notifyTestBtn') + ' hidden>테스트 알림</button>' +
    (can('edit') ? '<button type="button" class="ghost-btn tiny" data-act="target-sound-test" aria-label="목표 시간 알림 소리 미리 듣기">🎵 알림 소리</button>' : '') +
    '</div>' +
    '<div class="week-grid" data-part="grid"' + id('weekGrid') + '></div>';
  return h;
}

function noticeBlockInner(blk) {
  var editing = ui.editing && can('edit');
  var open = noticeEditOpen(blk.id);
  var h = '<div class="nb">';
  h += '<div class="nb-head"><b class="nb-title"><span aria-hidden="true">' + esc(blk.emoji || '💬') + '</span> ' + esc(blk.title || '오늘의 한마디') + '</b>';
  h += '<span class="nb-tools">';
  if (can('edit')) {
    h += '<button type="button" class="nb-edit" data-act="' + (open ? 'nb-cancel' : 'nb-edit') + '" data-blk="' + esc(blk.id) + '">' +
      (open ? '닫기' : '✏️ 쓰기') + '</button>';
  }
  h += '</span></div>';
  if (open && can('edit')) {
    h += '<div class="nb-form">' +
      '<div class="nb-form-row">' +
        '<input class="inp inp-sm nb-emo" data-field="nbEmoji" data-blk="' + esc(blk.id) + '" value="' + esc(blk.emoji || '💬') + '" maxlength="4" aria-label="게시판 아이콘">' +
        '<input class="inp inp-sm nb-title-inp" data-field="nbTitle" data-blk="' + esc(blk.id) + '" value="' + esc(blk.title || '') + '" maxlength="24" placeholder="제목" aria-label="게시판 제목">' +
      '</div>' +
      '<textarea class="inp nb-text-inp" data-field="nbText" data-blk="' + esc(blk.id) + '" rows="3" maxlength="400" placeholder="가족에게 남길 한마디를 적어 주세요">' + esc(blk.text || '') + '</textarea>' +
      '<div class="nb-form-act"><button type="button" class="pill-btn" data-act="nb-save" data-blk="' + esc(blk.id) + '">💾 저장</button></div>' +
      '</div>';
  } else {
    h += blk.text ? '<p class="nb-text">' + esc(blk.text) + '</p>' : '<p class="nb-text empty">' + (editing ? '✏️ 쓰기를 눌러 한마디를 남겨 보세요.' : '오늘의 한마디가 아직 없어요 🌤️') + '</p>';
  }
  h += '</div>';
  return h;
}

var firstBlockIds = {};
function computeFirstBlocks(list) {
  var map = {};
  for (var i = 0; i < list.length; i++) {
    var bs = list[i].blocks || [];
    for (var k = 0; k < bs.length; k++) {
      if (!map[bs[k].type]) map[bs[k].type] = bs[k].id;
    }
  }
  firstBlockIds = map;
}

function isFirstBlock(blk) {
  if (!blk) return false;
  if (firstBlockIds[blk.type]) return firstBlockIds[blk.type] === blk.id;
  var nodes = document.querySelectorAll('[data-block-type="' + blk.type + '"]');
  if (!nodes.length) return true;
  return nodes[0].getAttribute('data-block') === blk.id;
}

var noticeUi = { open: '', draft: null };
function noticeEditOpen(bid) { return noticeUi.open === bid; }

function renderNoticeBlocks() {
  eachBlockOfType('notice_board', function (root, blk) {
    var body = root.querySelector('.blk-body');
    if (!body) return;
    var sc = body.scrollTop;
    body.innerHTML = noticeBlockInner(blk);
    body.scrollTop = sc;
  });
}

/* 🎯 목표시간 남은 시간 바 — 고른 그룹(또는 다음 다가오는 목표) 하나만 */
function renderTargetBars() {
  eachBlockOfType('target_bar', function (root, blk) {
    var box = bpart(root, 'box');
    if (!box) return;
    box.innerHTML = targetBarHtml(blk);
    box.hidden = false;
  });
}

function targetPickGroup(blk) {
  var dow = keyDayIndex(currentKey);
  var now = nowMinuteFloat();
  if (blk.group) {
    var c = findCat(blk.group);
    return (c && activeDay(c, dow)) ? c : null;
  }
  /* 다음 다가오는 목표: 아직 안 끝났고 목표가 가까운 순서 */
  var best = null, bestLeft = 1e9;
  for (var i = 0; i < state.categories.length; i++) {
    var cat = state.categories[i];
    if (!hhmmValid(cat.targetTime) || !activeDay(cat, dow)) continue;
    var left = hhmmMinutes(cat.targetTime) - now;
    var cand = { cat: cat, left: left };
    if (left >= 0 && left < bestLeft) { bestLeft = left; best = cand; }
  }
  if (best) return best.cat;
  /* 오늘 목표가 다 지났으면 가장 최근 목표를 보여 줘요 */
  var last = null, lastLeft = -1e9;
  for (var k = 0; k < state.categories.length; k++) {
    var c2 = state.categories[k];
    if (!hhmmValid(c2.targetTime) || !activeDay(c2, dow)) continue;
    var l2 = hhmmMinutes(c2.targetTime) - now;
    if (l2 > lastLeft) { lastLeft = l2; last = c2; }
  }
  return last;
}

function targetBarHtml(blk) {
  var cat = targetPickGroup(blk);
  if (!cat) {
    return '<div class="rt-target tb-idle"><div class="rtt-head"><span class="rtt-emoji" aria-hidden="true">🎯</span>' +
      '<span class="rtt-text">' + (blk.group ? '이 그룹은 오늘 쉬는 날이에요' : '오늘은 정한 목표 시간이 없어요') + '</span></div>' +
      '<div class="rtt-foot"><span class="rtt-sub">편집(✏️)에서 루틴 그룹의 완료 목표 시간을 정해 주세요.</span></div></div>';
  }
  var ck = checksFor(currentKey);
  var now = nowMinuteFloat();
  var target = hhmmMinutes(cat.targetTime);
  var total = cat.items.length, done = 0;
  for (var i = 0; i < total; i++) if (ck[cat.items[i].id]) done++;
  var complete = total > 0 && done === total;
  var left = target - now;
  var pct = complete || left <= 0 ? 100 : Math.max(0, Math.min(100, (1 - Math.min(left, TARGET_WINDOW_MIN) / TARGET_WINDOW_MIN) * 100));
  var hot = !complete && left > 0 && left <= TARGET_WINDOW_MIN;
  var late = !complete && left <= 0;
  var status, big, sub;
  var runP = petRunnerPick();
  var runSp = speciesById(runP.currentEgg);
  var runName = runP.stage === 0 ? '알' : runSp.names[Math.max(0, runP.stage - 1)];
  if (complete) {
    status = '✓ ' + esc(cat.title) + ' 제시간에 완료! 🎉';
    big = '목표 달성!';
    sub = josa(runName, '이', '가') + ' 결승선에 도착했어요 🎊';
  } else if (left > 0) {
    status = esc(cat.title) + ' 완료까지';
    big = leftText(left);
    sub = '목표 ' + hhmmLabel(cat.targetTime) + (hot ? ' · ' + josa(runName, '이', '가') + ' 오른쪽으로 달려요!' : ' · 1시간 전부터 ' + josa(runName, '이', '가') + ' 출발해요');
  } else {
    status = esc(cat.title) + ' 목표 시간이 지났어요! 서두르자 💪';
    big = '목표 ' + hhmmLabel(cat.targetTime) + ' 지남';
    sub = '목표 시간이 지났어요';
  }
  var who = complete ? '🎉' : (late ? '🏃' : cat.emoji);
  var petIcon = '';
  try { petIcon = petArt(runSp, runP.stage, 0); } catch (e) { petIcon = ''; }
  var iconPct = 4 + pct * 0.92;
  return '<div class="rt-target' + (complete ? ' done' : '') + (late ? ' late' : '') + (hot ? ' hot' : '') + '" style="--c:' + esc(cat.color) + '">' +
    '<div class="rtt-head">' +
      '<span class="rtt-emoji" aria-hidden="true">' + who + '</span>' +
      '<span class="rtt-text">' + status + '</span>' +
      '<span class="rtt-goal">목표 ' + hhmmLabel(cat.targetTime) + '</span>' +
    '</div>' +
    '<div class="rtt-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(pct) + '" aria-label="' + esc(cat.title) + ' 남은 시간">' +
      '<i style="width:' + pct.toFixed(1) + '%"></i>' +
      '<span class="rtt-pet" style="left:' + iconPct.toFixed(1) + '%">' + petIcon + '</span>' +
    '</div>' +
    '<div class="rtt-foot"><span class="rtt-big">' + big + '</span><span class="rtt-sub">' + sub + '</span></div>' +
    '</div>';
}

function wbEditHtml() {
  var h = '';
  for (var i = 0; i < state.workbooks.length; i++) {
    var w = state.workbooks[i];
    h += '<div class="wb-edit-row"><input class="inp inp-sm" data-field="wbName" data-id="' + esc(w.id) + '" value="' + esc(w.name) + '" placeholder="문제지 이름" maxlength="24">' +
      '<button class="del-btn" type="button" data-act="wb-del" data-id="' + esc(w.id) + '" aria-label="삭제">✕</button></div>';
  }
  if (!state.workbooks.length) h += '<span class="ep-hint">아직 문제지가 없어요.</span>';
  return h;
}
