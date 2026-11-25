/* ============================================================================
   Jaden's Today v2 — js/records.js
   지난 기록 · 스티커 사용 기록 · 통계
   · 원본 index.html(운영본)의 같은 코드를 기능별로 나눈 파일입니다. 동작은 원본과 같아요.
   · 모듈끼리 같은 전역 스코프를 써요. index.html 에서 core → sync → ... 순서로 불러옵니다.
   ============================================================================ */
'use strict';

/* ============ 지난 기록 (히스토리) ============ */
var hist = { y: 0, m: 0, sel: '', note: '' };

/* (원본 15353~15358 의 keyToDate 는 뒤에 다시 선언되어 실제로는 쓰이지 않아요 —
   지금 쓰는 keyToDate 는 core.js 에 있어요) */

function cleanPick(v) {
  var out = { sel: [], done: [] };
  if (!v || typeof v !== 'object') return out;
  function cleanList(arr) {
    var list = [];
    if (Object.prototype.toString.call(arr) !== '[object Array]') return list;
    for (var i = 0; i < arr.length && i < 24; i++) {
      var one = arr[i] || {};
      var nm = (typeof one.name === 'string' ? one.name : '').slice(0, 24);
      if (!nm) continue;
      list.push({ id: (typeof one.id === 'string' && one.id) ? one.id : uid('wb'), name: nm });
    }
    return list;
  }
  out.sel = cleanList(v.sel);
  out.done = cleanList(v.done);
  return out;
}

function cleanHistEntry(e) {
  if (!e || typeof e !== 'object') return null;
  var out = { d: 0, t: 0, pct: 0, cats: [] };
  out.d = Math.max(0, parseInt(e.d, 10) || 0);
  out.t = Math.max(0, parseInt(e.t, 10) || 0);
  out.pct = Math.max(0, Math.min(100, parseInt(e.pct, 10) || 0));
  var cats = (Object.prototype.toString.call(e.cats) === '[object Array]') ? e.cats : [];
  for (var i = 0; i < cats.length && i < 20; i++) {
    var c = cats[i] || {};
    var rawItems = (Object.prototype.toString.call(c.items) === '[object Array]') ? c.items : [];
    var items = [];
    for (var j = 0; j < rawItems.length && j < 60; j++) {
      var it = rawItems[j] || {};
      items.push({ text: (typeof it.text === 'string') ? it.text : '', done: it.done === true });
    }
    out.cats.push({
      title: (typeof c.title === 'string') ? c.title : '',
      emoji: (typeof c.emoji === 'string' && c.emoji) ? c.emoji : '✅',
      color: (typeof c.color === 'string' && c.color) ? c.color : '#ff9f1c',
      d: Math.max(0, parseInt(c.d, 10) || 0),
      t: Math.max(0, parseInt(c.t, 10) || 0),
      items: items
    });
  }
  out.wb = cleanPick(e.wb);
  return out;
}

function snapshotDay(key) {
  if (!key) return;
  var ck = state.checks[key] || {};
  var any = false;
  for (var k in ck) {
    if (Object.prototype.hasOwnProperty.call(ck, k) && ck[k]) { any = true; break; }
  }
  var pickNow = cleanPick(state.workbookPicks ? state.workbookPicks[key] : null);
  if (!any && !pickNow.sel.length) {
    if (state.history[key]) delete state.history[key];
    return;
  }
  var cats = [];
  var done = 0;
  var total = 0;
  var dow = keyDayIndex(key);
  for (var i = 0; i < state.categories.length; i++) {
    var cat = state.categories[i];
    if (!activeDay(cat, dow)) continue;
    var items = [];
    var cd = 0;
    for (var j = 0; j < cat.items.length; j++) {
      var on = !!ck[cat.items[j].id];
      if (on) { cd++; done++; }
      items.push({ text: cat.items[j].text, done: on });
    }
    total += cat.items.length;
    cats.push({
      title: cat.title, emoji: cat.emoji, color: cat.color,
      d: cd, t: cat.items.length, items: items
    });
  }
  state.history[key] = {
    d: done, t: total,
    pct: total ? Math.round(done / total * 100) : 0,
    cats: cats,
    wb: cleanPick(state.workbookPicks ? state.workbookPicks[key] : null)
  };
  if (!state.dayUpdated) state.dayUpdated = {};
  state.dayUpdated[key] = new Date().toISOString();
}

function pruneHistory(s) {
  if (!s || !s.history) return;
  var edge = dateKey(new Date(Date.now() - HIST_DAYS * 86400000));
  var keys = [];
  for (var k in s.history) { if (Object.prototype.hasOwnProperty.call(s.history, k)) keys.push(k); }
  for (var i = 0; i < keys.length; i++) {
    var one = keys[i];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(one) || one < edge) delete s.history[one];
  }
  s.stickerLog = pruneLogs(s.stickerLog);
  s.boardLog = pruneLogs(s.boardLog);
}

function pruneLogs(arr) {
  if (Object.prototype.toString.call(arr) !== '[object Array]') return [];
  var min = Date.now() - HIST_DAYS * 86400000;
  var out = [];
  for (var i = 0; i < arr.length; i++) {
    if (arr[i] && Number(arr[i].t) >= min) out.push(arr[i]);
  }
  return out;
}

function entryFor(key) {
  var e = state.history[key];
  if (!e || typeof e.pct !== 'number' || isNaN(e.pct)) return null;
  return e;
}

function streakInfo() {
  var now = new Date();
  var cur = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  var todayEntry = entryFor(dateKey(cur));
  var todayPct = todayEntry ? todayEntry.pct : null;
  var days = 0;
  if (todayPct !== 100) cur.setDate(cur.getDate() - 1);
  for (var i = 0; i < HIST_DAYS + 60; i++) {
    var e = entryFor(dateKey(cur));
    if (e && e.pct >= 100) {
      days++;
      cur.setDate(cur.getDate() - 1);
    } else break;
  }
  return { days: days, todayDone: todayPct === 100 };
}

function weekStats() {
  var now = new Date();
  var base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  var dow = base.getDay();
  var sum = 0;
  var n = 0;
  for (var i = 0; i <= dow; i++) {
    var k = dateKey(new Date(base.getFullYear(), base.getMonth(), base.getDate() - dow + i));
    var e = entryFor(k);
    if (e) { sum += e.pct; n++; }
  }
  return { avg: n ? Math.round(sum / n) : null, days: n };
}

/* 관리자: 스티커 적립·사용 기록을 한 번에 0으로 (다른 기기에도 clearedAt으로 전파) */
function stickerWipeBefore(ts) {
  ts = Number(ts) || 0;
  if (!ts) return false;
  var cur = Number(state.sticker.clearedAt) || 0;
  if (ts <= cur) return false;
  state.sticker.clearedAt = ts;
  var i;
  var lg = [];
  for (i = 0; i < state.stickerLog.length; i++) if (Number(state.stickerLog[i].t) > ts) lg.push(state.stickerLog[i]);
  state.stickerLog = lg;
  var sp = [];
  for (i = 0; i < state.stickerSpends.length; i++) if (Number(state.stickerSpends[i].t) > ts) sp.push(state.stickerSpends[i]);
  state.stickerSpends = sp;
  /* 이 초기화보다 오래된 삭제 표시는 더 볼 필요가 없어요 */
  if (state.deletedSpends) {
    for (var dk in state.deletedSpends) {
      if (!Object.prototype.hasOwnProperty.call(state.deletedSpends, dk)) continue;
      if ((Number(state.deletedSpends[dk]) || 0) <= ts) delete state.deletedSpends[dk];
    }
  }
  var bl = [];
  for (i = 0; i < state.boardLog.length; i++) if (Number(state.boardLog[i].t) > ts) bl.push(state.boardLog[i]);
  state.boardLog = bl;
  state.sticker.stickers = [];
  state.sticker.icons = [];
  state.sticker.celebrated = false;
  touchBoard(ts);
  state.stats = { stickersTotal: state.stickerLog.length };
  return true;
}

function clearStickerHistory() {
  if (!isAdmin()) return;
  if (!window.confirm('테스트 스티커 적립·사용 기록과 현재 판을 모두 0으로 초기화할까요?')) return;
  var now = Date.now();
  state.sticker.clearedAt = now;
  state.stickerLog = [];
  state.stickerSpends = [];
  state.deletedSpends = {};
  state.boardLog = [];
  state.sticker.stickers = [];
  state.sticker.icons = [];
  state.sticker.celebrated = false;
  touchBoard(now);
  state.stats = { stickersTotal: 0 };
  try { snapshotDay(currentKey); } catch (e) { /* 무시 */ }
  saveState();
  if (cloud.conn && cloud.me) {
    cloud.dirty.settings = true;
    cloud.dirty.stickers = true;
    cloud.dirty.day = true;
    flushSync();
  }
  renderStickers();
  refreshAcctStickerPane();
  var st = document.getElementById('statsModal');
  if (st && !st.hidden) renderStats();
  showToast('스티커 기록을 모두 0으로 지웠어요 🧹');
}

function stickerTotal() {
  var v = parseInt(state.stats && state.stats.stickersTotal, 10);
  return (isNaN(v) || v < 0) ? 0 : v;
}

function logSticker(emoji, reason, shapeId) {
  var now = new Date();
  var entry = { d: dateKey(now), t: now.getTime(), e: emoji, r: (reason || '').slice(0, 20) };
  if (shapeId) entry.s = String(shapeId).slice(0, 24);
  state.stickerLog.push(entry);
  state.stats.stickersTotal = stickerTotal() + 1;
  if (state.stickerLog.length > 6000) state.stickerLog.splice(0, state.stickerLog.length - 6000);
  if (cloud.me) scheduleSync('stickers');
  return entry;
}

/* 판이 바뀐 시각을 적어 둬요 (다른 기기 판과 비교할 때 씀) */
function touchBoard(ts) {
  state.sticker.boardUpdatedAt = Number(ts) || Date.now();
}

function dropStickerLog(emoji) {
  for (var i = state.stickerLog.length - 1; i >= 0; i--) {
    if (state.stickerLog[i].e === emoji) {
      var gone = state.stickerLog[i];
      state.stickerLog.splice(i, 1);
      /* 떼어낸 스티커는 다시 들어와도 새 코인을 주지 않게 표시를 지워요 */
      try {
        if (state.profile && state.profile.stickerCoin && state.profile.stickerCoin.seen) {
          delete state.profile.stickerCoin.seen[stickerCoinKey(gone)];
        }
      } catch (e) { /* 무시 */ }
      break;
    }
  }
  var t = stickerTotal() - 1;
  state.stats.stickersTotal = t < 0 ? 0 : t;
  if (cloud.me) scheduleSync('stickers');
}

function stickersOn(key) {
  var out = [];
  for (var i = 0; i < state.stickerLog.length; i++) {
    if (state.stickerLog[i].d === key) out.push(state.stickerLog[i]);
  }
  return out;
}

function boardsOn(key) {
  var out = [];
  for (var i = 0; i < state.boardLog.length; i++) {
    if (state.boardLog[i].d === key) out.push(state.boardLog[i]);
  }
  return out;
}

function summaryHtml() {
  var st = streakInfo();
  var wk = weekStats();
  var total = stickerTotal();
  var streakSub;
  if (st.todayDone) streakSub = '오늘도 100% 달성!';
  else if (st.days > 0) streakSub = '오늘까지 채우면 ' + (st.days + 1) + '일!';
  else streakSub = '오늘 100%에 도전해요!';

  var h = '';
  h += '<div class="hsum-card">' +
    '<div class="hsum-k">🔥 연속 달성일</div>' +
    '<div class="hsum-v">' + st.days + '일</div>' +
    '<div class="hsum-s">' + esc(streakSub) + '</div>' +
    '</div>';
  h += '<div class="hsum-card mint">' +
    '<div class="hsum-k">📊 이번 주 평균</div>' +
    '<div class="hsum-v">' + (wk.avg == null ? '—' : wk.avg + '%') + '</div>' +
    '<div class="hsum-s">' + (wk.days ? esc('기록한 ' + wk.days + '일 평균') : '이번 주 기록이 아직 없어요') + '</div>' +
    '</div>';
  h += '<div class="hsum-card sky">' +
    '<div class="hsum-k">⭐ 누적 칭찬 스티커</div>' +
    '<div class="hsum-v">' + total + '개</div>' +
    '<div class="hsum-s">지금 보드 ' + state.sticker.stickers.length + ' / ' + state.sticker.slots + '칸</div>' +
    '</div>';
  return h;
}

function calendarHtml() {
  var now = new Date();
  var y = hist.y;
  var m = hist.m;
  var todayKey = dateKey(now);
  var lead = new Date(y, m, 1).getDay();
  var lastDay = new Date(y, m + 1, 0).getDate();
  var atNow = (y === now.getFullYear() && m === now.getMonth());

  var h = '<div class="hcal">';
  var mkey = y + '-' + pad2(m + 1);
  if (cloud.monthLoading === mkey) h += '<div class="hcal-load">☁️ 저장소에서 이 달의 기록을 불러오는 중…</div>';
  h += '<div class="hcal-head">' +
    '<button type="button" class="hnav" data-act="hist-prev" aria-label="이전 달">‹</button>' +
    '<div class="hcal-title">' + y + '년 ' + (m + 1) + '월</div>' +
    '<button type="button" class="hnav" data-act="hist-next" aria-label="다음 달"' + (atNow ? ' disabled' : '') + '>›</button>' +
    '</div>';
  h += '<div class="hcal-dow"><span class="sun">일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span class="sat">토</span></div>';
  h += '<div class="hcal-grid">';

  for (var i = 0; i < lead; i++) h += '<div class="hday empty" aria-hidden="true"></div>';

  for (var day = 1; day <= lastDay; day++) {
    var key = y + '-' + pad2(m + 1) + '-' + pad2(day);
    var e = entryFor(key);
    var cls = 'hday';
    var inner = '<span class="n">' + day + '</span>';

    if (e) {
      if (e.pct >= 100) cls += ' full';
      else if (e.pct >= 60) cls += ' good';
      else if (e.pct > 0) cls += ' part';
      else cls += ' zero';
      inner += '<span class="p">' + e.pct + '%</span>';
      if (e.pct >= 100) inner += '<span class="star" aria-hidden="true">⭐</span>';
    } else if (key > todayKey) {
      cls += ' fut';
      inner += '<span class="p">·</span>';
    } else {
      cls += ' none';
      inner += '<span class="p">·</span>';
    }
    if (key === todayKey) cls += ' today';
    if (key === hist.sel) cls += ' sel';

    if (key > todayKey) {
      h += '<div class="' + cls + '" aria-hidden="true">' + inner + '</div>';
    } else {
      var label = (m + 1) + '월 ' + day + '일 ' + (e ? e.pct + '% 완료' : '기록 없음');
      h += '<button type="button" class="' + cls + '" data-act="hist-day" data-key="' + key + '"' +
        ' aria-pressed="' + (key === hist.sel ? 'true' : 'false') + '" aria-label="' + esc(label) + '">' + inner + '</button>';
    }
  }

  h += '</div></div>';
  return h;
}

function detailHtml() {
  var key = hist.sel;
  var dt = key ? keyToDate(key) : null;
  if (!dt) return '';
  var e = entryFor(key);

  var h = '<div class="hdetail">';
  h += '<div class="hd-head">' +
    '<span class="hd-date">' + (dt.getMonth() + 1) + '월 ' + dt.getDate() + '일 ' + DAY_NAMES[dt.getDay()] + '요일</span>';
  if (e) {
    h += '<span class="hd-pct">' + e.pct + '% 완료</span>';
    h += '<span class="hd-sub">' + e.t + '개 중 ' + e.d + '개 완료</span>';
  }
  h += '</div>';

  if (!e) {
    h += '<p class="hd-empty">이 날은 체크한 기록이 없어요. 루틴을 하나라도 체크하면 여기에 쌓여요 🌱</p>';
  } else {
    for (var i = 0; i < e.cats.length; i++) {
      var c = e.cats[i];
      var items = c.items || [];
      h += '<div class="hd-cat">';
      h += '<div class="hd-cat-title">' +
        '<span aria-hidden="true">' + esc(c.emoji || '✅') + '</span>' +
        '<span>' + esc(c.title || '') + '</span>' +
        '<span class="hd-cat-count">' + (c.d || 0) + '/' + (c.t || 0) + '</span>' +
        '</div>';
      h += '<ul class="hd-items">';
      if (!items.length) h += '<li class="hd-item">할 일이 없던 날</li>';
      for (var j = 0; j < items.length; j++) {
        h += '<li class="hd-item' + (items[j].done ? ' done' : '') + '">' +
          (items[j].done ? '✓ ' : '○ ') + esc(items[j].text || '') + '</li>';
      }
      h += '</ul></div>';
    }
  }

  if (e && e.wb && e.wb.sel && e.wb.sel.length) {
    h += '<div class="hd-cat"><div class="hd-cat-title">' +
      '<span aria-hidden="true">📚</span><span>오늘 푼 문제지</span>' +
      '<span class="hd-cat-count">' + e.wb.done.length + '/' + e.wb.sel.length + '</span></div>' +
      '<ul class="hd-items">';
    for (var w = 0; w < e.wb.sel.length; w++) {
      var wd = false;
      for (var wq = 0; wq < e.wb.done.length; wq++) if (e.wb.done[wq].id === e.wb.sel[w].id) wd = true;
      h += '<li class="hd-item' + (wd ? ' done' : '') + '">' + (wd ? '✓ ' : '○ ') + esc(e.wb.sel[w].name) + '</li>';
    }
    h += '</ul></div>';
  }

  var sk = stickersOn(key);
  if (sk.length) {
    var faces = '';
    for (var s = 0; s < sk.length; s++) faces += (sk[s].e || '⭐️');
    h += '<div class="hd-stickers"><span>그날 받은 스티커</span><b>' + sk.length + '개</b>' +
      '<span class="st" aria-hidden="true">' + faces + '</span></div>';
    var rmap = {};
    var rorder = [];
    for (var sr = 0; sr < sk.length; sr++) {
      var rn = sk[sr].r || '이유 없음';
      if (!rmap[rn]) { rmap[rn] = 0; rorder.push(rn); }
      rmap[rn]++;
    }
    var rparts = [];
    for (var ro = 0; ro < rorder.length && ro < 6; ro++) rparts.push(esc(rorder[ro]) + ' ' + rmap[rorder[ro]] + '개');
    if (rparts.length) {
      h += '<div class="hd-sticker-why">이유: ' + rparts.join(' · ') + '</div>';
    }
  }

  var bds = boardsOn(key);
  for (var b = 0; b < bds.length; b++) {
    h += '<div class="hd-board">🏁 스티커 보드 ' + (bds[b].slots || '') + '칸을 모두 채웠어요!' +
      (bds[b].goal ? ' (' + esc(bds[b].goal) + ')' : '') + '</div>';
  }

  h += '</div>';
  return h;
}

function backupHtml() {
  return '<div class="hback">' +
    '<button type="button" class="ghost-btn" data-act="hist-backup">💾 백업 저장 (JSON)</button>' +
    '<button type="button" class="ghost-btn" data-act="hist-import">📂 백업 불러오기</button>' +
    '<span class="hback-note" id="histNote">' + esc(hist.note || '기록은 이 태블릿에만 저장돼요. 백업 파일로 다른 기기에 옮길 수 있어요.') + '</span>' +
    '</div>';
}

function renderHistory(full) {
  var body = document.getElementById('histBody');
  if (!body) return;
  if (full) {
    body.innerHTML =
      '<div class="hsum" id="histSum"></div>' +
      '<div id="histCal"></div>' +
      '<div id="histDetail"></div>' +
      '<div id="histBackup"></div>';
    var bEl = document.getElementById('histBackup');
    if (bEl) bEl.innerHTML = backupHtml();
  }
  var sEl = document.getElementById('histSum');
  if (sEl) sEl.innerHTML = summaryHtml();
  var cEl = document.getElementById('histCal');
  if (cEl) cEl.innerHTML = calendarHtml();
  var dEl = document.getElementById('histDetail');
  if (dEl) dEl.innerHTML = detailHtml();
}

function openHistory() {
  var now = new Date();
  hist.y = now.getFullYear();
  hist.m = now.getMonth();
  hist.sel = dateKey(now);
  hist.note = '';
  renderHistory(true);
  var m = document.getElementById('histModal');
  if (m) m.hidden = false;
  lockScroll();
  var c = document.getElementById('histClose');
  if (c && c.focus) { try { c.focus(); } catch (e) { /* 무시 */ } }
  if (cloud.me) loadMonth(hist.y, hist.m, false);
}

function closeHistory() {
  var m = document.getElementById('histModal');
  if (m) m.hidden = true;
  unlockScroll();
}

function histNav(dir) {
  var now = new Date();
  var y = hist.y;
  var m = hist.m + dir;
  if (m < 0) { m = 11; y--; }
  if (m > 11) { m = 0; y++; }
  if (y > now.getFullYear() || (y === now.getFullYear() && m > now.getMonth())) return;
  hist.y = y;
  hist.m = m;

  var lastDay = new Date(y, m + 1, 0).getDate();
  var todayKey = dateKey(now);
  var firstKey = y + '-' + pad2(m + 1) + '-01';
  var lastKey = y + '-' + pad2(m + 1) + '-' + pad2(lastDay);
  var pick = '';
  for (var d = lastDay; d >= 1; d--) {
    var k = y + '-' + pad2(m + 1) + '-' + pad2(d);
    if (entryFor(k)) { pick = k; break; }
  }
  if (!pick) pick = (todayKey >= firstKey && todayKey <= lastKey) ? todayKey : firstKey;
  hist.sel = pick;
  renderHistory(false);
  if (cloud.me) loadMonth(hist.y, hist.m, false);
}

function histSelect(key) {
  if (!key) return;
  hist.sel = key;
  renderHistory(false);
}

function setHistNote(msg) {
  hist.note = msg || '';
  var el = document.getElementById('histNote');
  if (el) el.textContent = hist.note;
}

function saveBackup() {
  try {
    var payload = {
      app: 'kids-dashboard',
      version: 1,
      exportedAt: new Date().toISOString(),
      state: state
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    var url = window.URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'kids-dashboard-backup-' + dateKey() + '.json';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    window.setTimeout(function () {
      if (a.parentNode) a.parentNode.removeChild(a);
      try { window.URL.revokeObjectURL(url); } catch (e) { /* 무시 */ }
    }, 2000);
    setHistNote('백업 파일을 만들었어요. 태블릿의 다운로드 폴더를 확인해 보세요!');
  } catch (e) {
    setHistNote('백업 파일을 만들지 못했어요. 브라우저 설정을 확인해 주세요.');
  }
}

function pickBackup() {
  var f = document.getElementById('histFile');
  if (f) f.click();
}

function applyBackup(text) {
  var obj = null;
  try { obj = JSON.parse(text); } catch (e) { obj = null; }
  if (!obj || typeof obj !== 'object') {
    setHistNote('백업 파일을 읽지 못했어요. 올바른 JSON 파일인지 확인해 주세요.');
    return;
  }
  var raw = (obj.state && typeof obj.state === 'object') ? obj.state : obj;
  if (!raw || (!raw.history && !raw.checks && !raw.sticker && !raw.categories)) {
    setHistNote('대시보드 백업 파일이 아니에요.');
    return;
  }
  var ok = window.confirm('이 백업 파일로 지금 대시보드를 바꿀까요?\n\n지금 태블릿에 있는 기록 · 스티커 · 설정이 백업 내용으로 바뀝니다.');
  if (!ok) {
    setHistNote('불러오기를 취소했어요.');
    return;
  }
  state = normalize(raw);
  ui.editing = false;
  ui.layout = false;
  var btn = document.getElementById('editBtn');
  if (btn) {
    setBtnLabel(btn, '⚙️', '전체 설정');
    btn.classList.remove('on');
  }
  currentKey = dateKey();
  saveState();
  renderAll();
  renderHistory(false);
  setHistNote('백업을 불러왔어요! 📂');
}

/* ---- 통계 ---- */
function openStats() {
  if (!can('edit')) return;
  renderStats();
  var m = document.getElementById('statsModal');
  if (m) m.hidden = false;
  lockScroll();
  var now = new Date();
  if (cloud.me) {
    loadMonth(now.getFullYear(), now.getMonth());
    var pm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    loadMonth(pm.getFullYear(), pm.getMonth());
  }
}

function closeStats() {
  var m = document.getElementById('statsModal');
  if (m) m.hidden = true;
  if (isOnlyModal('statsModal')) unlockScroll();
}

function reasonBarsHtml() {
  var map = {};
  var order = [];
  for (var i = 0; i < state.stickerLog.length; i++) {
    var r = state.stickerLog[i].r || '이유 없음';
    if (!map[r]) { map[r] = 0; order.push(r); }
    map[r]++;
  }
  if (!order.length) return '<p class="spend-empty">아직 적립한 스티커가 없어요.</p>';
  order.sort(function (a, b) { return map[b] - map[a]; });
  var max = map[order[0]] || 1;
  var h = '<div class="bars">';
  for (var k = 0; k < order.length && k < 8; k++) {
    var name = order[k];
    var n = map[name];
    h += '<div class="bar-row"><span class="bar-name">' + esc(name) + '</span>' +
      '<span class="bar-track"><i class="bar-fill" style="display:block;width:' + Math.max(4, Math.round(n / max * 100)) + '%"></i></span>' +
      '<span class="bar-val">' + n + '개</span></div>';
  }
  h += '</div>';
  return h;
}

function chart14Html() {
  var now = new Date();
  var base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  var h = '<div class="chart14">';
  var total = 0;
  var n = 0;
  for (var i = 13; i >= 0; i--) {
    var d = new Date(base.getFullYear(), base.getMonth(), base.getDate() - i);
    var key = dateKey(d);
    var e = entryFor(key);
    var pct = e ? e.pct : 0;
    if (e) { total += pct; n++; }
    var height = e ? Math.max(6, Math.round(pct * 0.8)) : 4;
    var cls = e ? (pct >= 100 ? 'col full' : 'col') : 'col zero';
    h += '<div class="c14' + (i === 0 ? ' today' : '') + '" title="' + (d.getMonth() + 1) + '/' + d.getDate() + ' · ' + (e ? pct + '%' : '기록 없음') + '">' +
      '<span class="v">' + (e ? pct : '') + '</span>' +
      '<span class="' + cls + '" style="height:' + height + 'px"></span>' +
      '<span class="d">' + d.getDate() + '</span>' +
      '</div>';
  }
  h += '</div>';
  h += '<p class="spend-empty" style="margin:8px 0 0">' +
    (n ? '이 14일 평균 ' + Math.round(total / n) + '% · 기록한 날 ' + n + '일' : '최근 14일 기록이 없어요.') + '</p>';
  return h;
}

function spendListHtml() {
  var list = state.stickerSpends.slice(0);
  list.sort(function (a, b) { return b.t - a.t; });
  if (!list.length) return '<p class="spend-empty">아직 스티커를 쓴 기록이 없어요. 🎁</p>';
  var h = '<div class="spend-list">';
  for (var i = 0; i < list.length && i < 60; i++) {
    var s = list[i];
    var d = keyToDate(s.d);
    h += '<div class="spend-item">' +
      '<span class="si-date">' + (d ? (d.getMonth() + 1) + '/' + d.getDate() : esc(s.d)) + '</span>' +
      '<span class="si-item">' + esc(s.item || '선물') + '</span>' +
      '<span class="si-num">' + s.count + '개 · ' + fmtNum(s.amount) + '원</span>' +
      (can('stickerManage') ? '<button class="del-btn" type="button" data-act="spend-del" data-id="' + esc(s.id) + '" aria-label="삭제">✕</button>' : '') +
      '</div>';
  }
  h += '</div>';
  return h;
}

function statsHtml() {
  var unit = state.sticker.unit || 1000;
  var earned = stickerTotal();
  var spent = spentCount();
  var left = remainStickers();
  var h = '';
  if (isAdmin()) {
    h += '<div class="stat-sec stat-admin">' +
      '<h3>🧹 기록 정리 (관리자)</h3>' +
      '<p class="spend-empty" style="margin:0 0 8px">테스트로 붙였다가 쓴 스티커 기록과 지금 판을 모두 0으로 지워요. 사진·체크 기록은 그대로예요.</p>' +
      '<button class="ghost-btn danger" data-act="stickers-reset-logs">🧹 스티커 기록 초기화</button>' +
      '</div>';
  }
  h += '<div class="stat-sum">' +
    '<div class="stat-box"><b>총 적립</b><strong>' + fmtNum(earned) + '개</strong><small>' + fmtNum(earned * unit) + '원 어치</small></div>' +
    '<div class="stat-box pink"><b>사용</b><strong>' + fmtNum(spent) + '개</strong><small>' + fmtNum(spent * unit) + '원</small></div>' +
    '<div class="stat-box mint"><b>남은 스티커</b><strong>' + fmtNum(left) + '개</strong><small>' + fmtNum(left * unit) + '원</small></div>' +
    '</div>';
  h += '<div class="stat-sec"><h3>⭐ 적립 이유별 분포</h3>' + reasonBarsHtml() + '</div>';
  h += '<div class="stat-sec"><h3>📈 최근 14일 루틴 달성률</h3>' + chart14Html() + '</div>';
  h += '<div class="stat-sec"><h3>🎁 스티커 사용 내역</h3>' + spendListHtml() + '</div>';
  return h;
}

function renderStats() {
  var body = document.getElementById('statsBody');
  if (body) body.innerHTML = statsHtml();
}

/* ---- 100% 달성 축하 ---- */
function showWin() {
  var c = counts();
  var st = streakInfo();
  var line = '루틴 ' + c.done + '/' + c.total + '개 완료';
  if (st.days > 0) line += ' · ' + st.days + '일 연속 달성!';
  var el = document.getElementById('winLine');
  if (el) el.textContent = line;
  var m = document.getElementById('winModal');
  if (m) m.hidden = false;
  lockScroll();
}

function closeWin() {
  var m = document.getElementById('winModal');
  if (m) m.hidden = true;
  if (isOnlyModal('winModal')) unlockScroll();
}
