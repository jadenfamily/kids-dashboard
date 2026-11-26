/* ============================================================================
   Jaden's Today v2 — js/routines.js
   하루 루틴 · 날짜 넘김 · 목표 시간 · 주기 작업 · 알림음(오디오 잠금해제·소리 합성·재생)
   · 원본 index.html(운영본)의 같은 코드를 기능별로 나눈 파일입니다. 동작은 원본과 같아요.
   · 모듈끼리 같은 전역 스코프를 써요. index.html 에서 core → sync → ... 순서로 불러옵니다.
   ============================================================================ */
'use strict';

/* ============ 루틴 ============ */
var ROUTINE_VIEW_KEY = 'kidsDashboard.routineView.v1';
var CAT_COLORS = [
  { c: '#ff9f1c', t: '#fff5e8' }, { c: '#12b886', t: '#e8fbf2' },
  { c: '#7c5cfc', t: '#f1edff' }, { c: '#ff5c8a', t: '#ffedf3' },
  { c: '#2f80ed', t: '#eaf3ff' }, { c: '#f2a900', t: '#fff8e3' },
  { c: '#00a8a8', t: '#e6fbfb' }, { c: '#8e6b3d', t: '#f7efe4' }
];
var CAT_EMOJIS = [
  '🌅', '🌙', '⭐', '🌟', '🎒', '📚', '📖', '📝', '✏️', '🔤', '🇺🇸', '🧮', '🤖', '🔬',
  '🏫', '🚌', '🧸', '🎹', '🎨', '🎻', '🎵', '⚽', '🏀', '🏊', '🥋', '🤸', '🚴', '🧘',
  '🍎', '🍽️', '🥛', '🛁', '🚿', '🦷', '💤', '🛌', '🧹', '🧺', '🐶', '🌱', '🩺', '🏠'
];

/* 보기 방식: 이 기기에서만 기억해요 (가로 = 옆으로 넘기기, 세로 = 여러 줄) */
function routineView() {
  var v = lsGet(ROUTINE_VIEW_KEY);
  if (v === 'row' || v === 'grid') return v;
  return window.innerWidth < 1024 ? 'row' : 'grid';
}

function applyRoutineView() {
  eachBlockOfType('routine', function (root, blk) { applyRoutineViewFor(root, blk); });
}

function applyRoutineViewFor(root, blk) {
  var v = routineView();
  var grid = bpart(root, 'grid');
  if (grid && grid.getAttribute('data-view') !== v) grid.setAttribute('data-view', v);
  root.setAttribute('data-routine-view', v);
  var btn = bpart(root, 'viewBtn');
  if (btn) {
    btn.textContent = v === 'row' ? '↕️ 세로 보기' : '↔️ 가로 보기';
    btn.setAttribute('aria-label', v === 'row' ? '루틴 세로로 보기' : '루틴 가로로 보기');
  }
  var addBtn = bpart(root, 'add');
  /* 그룹 추가는 편집 팝업(🧩 그룹·할 일)에서 해요 — 카드 안에는 두지 않아요 */
  if (addBtn) addBtn.hidden = true;
  var empty = bpart(root, 'empty');
  if (empty) empty.hidden = state.categories.length > 0 || !!(blk && blk.group);
}

function toggleRoutineView() {
  var next = routineView() === 'row' ? 'grid' : 'row';
  lsSet(ROUTINE_VIEW_KEY, next);
  applyRoutineView();
}

function renderRoutineJump() {
  eachBlockOfType('routine', function (root, blk) { renderRoutineJumpFor(root, blk); });
}

function renderRoutineJumpFor(root, blk) {
  var box = bpart(root, 'jump');
  if (!box) return;
  var groupId = blk.group || '';
  var dow = keyDayIndex(currentKey);
  var h = '';
  for (var i = 0; i < state.categories.length; i++) {
    var cat = state.categories[i];
    if (groupId && cat.id !== groupId) continue;
    if (!ui.layout && !activeDay(cat, dow)) continue;
    var nm = cat.title || '루틴';
    h += '<button type="button" class="rt-pill" data-act="routine-jump" data-cat="' + esc(cat.id) +
      '" style="--c:' + esc(cat.color) + '" aria-label="' + esc(nm) + '로 이동">' +
      '<span class="pp" aria-hidden="true"></span><span>' + esc(cat.emoji) + ' ' + esc(nm) + '</span></button>';
  }
  box.innerHTML = h;
  /* 그룹이 하나뿐이면 바로가기는 숨겨요 */
  box.hidden = !h || (groupId && h.indexOf('rt-pill') < 0);
}

function emojiOptions(cur) {
  var list = CAT_EMOJIS.slice(0);
  if (cur && list.indexOf(cur) < 0) list.unshift(cur);
  var h = '';
  for (var i = 0; i < list.length; i++) {
    h += '<option value="' + esc(list[i]) + '"' + (list[i] === cur ? ' selected' : '') + '>' + list[i] + '</option>';
  }
  return h;
}

function colorSwatchesHtml(cat) {
  var h = '';
  var cur = String(cat.color || '').toLowerCase();
  for (var i = 0; i < CAT_COLORS.length; i++) {
    var p = CAT_COLORS[i];
    var on = cur === p.c.toLowerCase();
    h += '<button type="button" class="rce-sw' + (on ? ' on' : '') + '" data-act="cat-color" data-cat="' + esc(cat.id) +
      '" data-c="' + esc(p.c) + '" data-t="' + esc(p.t) + '" style="--sc:' + esc(p.c) + '"' +
      ' aria-pressed="' + (on ? 'true' : 'false') + '" aria-label="색 테마 ' + (i + 1) + '"></button>';
  }
  return h;
}

function catEditBarHtml(cat, idx, last) {
  return '<div class="rc-editbar">' +
    '<div class="rce-row">' +
      '<button type="button" class="so-btn cat-move" data-act="cat-left" data-cat="' + esc(cat.id) + '"' +
        (idx === 0 ? ' disabled' : '') + ' aria-label="앞으로 이동">◀</button>' +
      '<button type="button" class="so-btn cat-move" data-act="cat-right" data-cat="' + esc(cat.id) + '"' +
        (idx === last ? ' disabled' : '') + ' aria-label="뒤로 이동">▶</button>' +
      '<select class="inp inp-sm rce-emoji" data-field="catEmoji" data-cat="' + esc(cat.id) + '" aria-label="아이콘">' +
        emojiOptions(cat.emoji) + '</select>' +
      '<button type="button" class="del-btn rce-del" data-act="cat-del" data-cat="' + esc(cat.id) + '" aria-label="' +
        esc(cat.title || '루틴 그룹') + ' 삭제">✕</button>' +
    '</div>' +
    '<div class="rce-colors" role="group" aria-label="색 테마">' + colorSwatchesHtml(cat) + '</div>' +
    daysSelectorHtml(cat.id, cat.days) +
'<div class="rce-target"><span>완료 목표 시간</span>' +
      '<input class="inp inp-sm" type="time" data-field="catTarget" data-cat="' + esc(cat.id) + '" value="' + esc(cat.targetTime || '') + '" aria-label="완료 목표 시간">' +
      (cat.targetTime ? '<button type="button" class="ghost-btn tiny" data-act="cat-target-clear" data-cat="' + esc(cat.id) + '">지우기</button>' : '') +
      '</div>' +
    '<div class="rce-alert"><span>🔔 알림음</span>' +
      '<select class="inp inp-sm rce-alert-sel" data-field="catAlertSound" data-cat="' + esc(cat.id) + '" aria-label="' + esc((cat.title || '이 그룹') + ' 알림음') + '">' +
        catAlertOptionsHtml(cat.alertSound) + '</select>' +
      '<button type="button" class="ghost-btn tiny" data-act="cat-alert-test" data-cat="' + esc(cat.id) + '" aria-label="' + esc((cat.title || '이 그룹') + ' 알림음 미리 듣기') + '">▶</button>' +
      '</div>' +
    '<label class="rce-wb"><input type="checkbox" data-field="catShowWb" data-cat="' + esc(cat.id) + '"' +
      (catWbOn(cat) ? ' checked' : '') + ' aria-label="' + esc(cat.title || '이 그룹') + '에 문제지 고르기 표시">' +
      '<span>📚 문제지 고르기 표시</span></label>' +
    '<input class="inp inp-sm rce-sub" data-field="catSub" data-cat="' + esc(cat.id) + '" value="' + esc(cat.sub || '') +
      '" placeholder="설명 (예: 위클래스, 방과후 로봇)" maxlength="50" aria-label="그룹 설명">' +
    '</div>';
}

function moveCategory(id, dir) {
  if (!can('edit')) return;
  var cats = state.categories;
  var idx = -1;
  for (var i = 0; i < cats.length; i++) if (cats[i].id === id) { idx = i; break; }
  if (idx < 0) return;
  var to = idx + dir;
  if (to < 0 || to >= cats.length) return;
  var moved = cats.splice(idx, 1)[0];
  cats.splice(to, 0, moved);
  saveState();
  renderRoutine();
  var keep = document.querySelector('.routine-card[data-cat="' + id + '"] [data-act="cat-' + (dir < 0 ? 'left' : 'right') + '"]');
  if (keep && !keep.disabled) keep.focus();
  else {
    var other = document.querySelector('.routine-card[data-cat="' + id + '"] [data-act="cat-' + (dir < 0 ? 'right' : 'left') + '"]');
    if (other) other.focus();
  }
}

function addCategory() {
  if (!can('edit')) return;
  if (state.categories.length >= 16) { window.alert('루틴 그룹은 16개까지 만들 수 있어요.'); return; }
  var pal = CAT_COLORS[state.categories.length % CAT_COLORS.length];
  var cat = {
    id: uid('cat'), title: '새 루틴', sub: '내가 만든 루틴', emoji: '⭐️',
    color: pal.c, tint: pal.t, items: [], days: DAY_ALL.slice(0), alertSound: ''
  };
  state.categories.push(cat);
  saveState();
  renderRoutine();
  var card = document.querySelector('.routine-card[data-cat="' + cat.id + '"]');
  if (card && card.scrollIntoView) card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  var inp = document.querySelector('input[data-field="catTitle"][data-cat="' + cat.id + '"]');
  if (inp) { inp.focus(); try { inp.select(); } catch (e) { /* 무시 */ } }
}

function delCategory(id) {
  if (!can('edit')) return;
  var cat = findCat(id);
  if (!cat) return;
  var nm = cat.title || '루틴 그룹';
  if (!window.confirm('"' + nm + '" 그룹을 지울까요?\n그룹 안의 할 일도 함께 사라져요.')) return;
  for (var i = 0; i < state.categories.length; i++) {
    if (state.categories[i].id === id) { state.categories.splice(i, 1); break; }
  }
  saveState();
  renderRoutine();
}

function setCategoryColor(id, c, t) {
  if (!can('edit')) return;
  var cat = findCat(id);
  if (!cat) return;
  cat.color = c;
  cat.tint = t;
  saveState();
  renderRoutine();
}

/* 루틴 그룹의 요일 바꾸기 (day: 0~6, preset: all|weekday|weekend) */
function setCatDays(catId, day, preset) {
  if (!can('edit')) return;
  var cat = findCat(catId);
  if (!cat) return;
  if (preset) {
    cat.days = normDays(presetDays(preset));
  } else {
    if (!isFinite(day)) return;
    var ds = normDays(cat.days);
    var at = ds.indexOf(day);
    if (at >= 0) {
      if (ds.length <= 1) { showToast('요일은 하루 이상 골라 주세요.'); return; }
      ds.splice(at, 1);
    } else {
      ds.push(day);
    }
    cat.days = normDays(ds);
  }
  saveState();
  renderRoutine();
}

function renderRoutine() {
  eachBlockOfType('routine', function (root, blk) { renderRoutineBlock(root, blk); });
  /* 편집 팝업의 그룹·할 일도 같이 맞춰요 */
  if (epUi.tab === 'groups') { try { renderEditSheetBody(); } catch (e) { /* 무시 */ } }
  /* 카드 안 인라인 편집 중이면 그 카드의 그룹·할 일 칸도 다시 그려요 */
  refreshInlineSec();
}

/* 루틴 카드 HTML — 대시보드(보기)와 편집 팝업(edit=true)이 같은 배치를 써요.
   보기 화면은 늘 평소 모양 그대로이고, 폼으로 바꾸는 건 편집 팝업 안에서만 해요. */
function routineCardsHtml(groupId, edit) {
  var ck = checksFor(currentKey);
  var dow = keyDayIndex(currentKey);
  var html = '';
  var last = state.categories.length - 1;
  var shownCats = 0;

  for (var i = 0; i < state.categories.length; i++) {
    var cat = state.categories[i];
    if (groupId && cat.id !== groupId) continue;
    var catOn = activeDay(cat, dow);
    /* 보기 화면은 오늘 요일의 그룹만, 편집 팝업에서는 오늘 쉬는 그룹도 보여 줘요 */
    if (!catOn && !edit) continue;
    shownCats++;
    var done = 0;
    var k;
    for (k = 0; k < cat.items.length; k++) if (ck[cat.items[k].id]) done++;
    var total = cat.items.length;
    var pct = total ? Math.round(done / total * 100) : 0;
    var complete = total > 0 && done === total;

    html += '<article class="routine-card' + (complete && !edit ? ' complete' : '') + (edit ? ' editing' : '') +
      (edit && !catOn ? ' offday' : '') +
      '" data-cat="' + esc(cat.id) + '" style="--c:' + esc(cat.color) + ';--ct:' + esc(cat.tint) + '">';

    html += '<div class="rc-head">';
    html += '<span class="rc-emoji" aria-hidden="true">' + cat.emoji + '</span>';
    html += '<div class="rc-titles">';
    if (edit) {
      html += '<input class="inp title-inp" data-field="catTitle" data-cat="' + esc(cat.id) +
        '" value="' + esc(cat.title) + '" aria-label="카테고리 이름">';
    } else {
      html += '<h3>' + esc(cat.title) + '</h3>';
    }
    html += '<span class="rc-sub">' + esc(cat.sub || '') + '</span>';
    if (daysText(cat.days) !== '매일') html += '<span class="rc-days">📅 ' + esc(daysText(cat.days)) + '</span>';
    if (hhmmValid(cat.targetTime)) html += '<span class="rc-target">⏰ ' + hhmmLabel(cat.targetTime) + '</span>';
    html += '</div>';
    html += '<span class="rc-count' + (complete ? ' done' : '') + '">' +
      (complete ? '완료 🎉' : done + '/' + total) + '</span>';
    html += '</div>';

    if (edit) html += catEditBarHtml(cat, i, last);

    html += '<div class="rc-bar"><i style="width:' + pct + '%"></i></div>';
    html += '<ul class="rc-list">';

    if (!total && !edit) {
      html += '<li class="empty-hint">아직 할 일이 없어요.</li>';
    }

    for (k = 0; k < cat.items.length; k++) {
      var item = cat.items[k];
      var isDone = !!ck[item.id];
      var wbItem = isWbItemText(item.text);
      if (edit) {
        html += '<li class="check-row edit">';
        html += '<span class="box" aria-hidden="true"></span>';
        html += '<input class="item-input" data-field="itemText" data-cat="' + esc(cat.id) +
          '" data-item="' + esc(item.id) + '" value="' + esc(item.text) + '" placeholder="할 일을 적어 주세요">';
        /* 할 일 순서 바꾸기 — 보호자가 ▲▼로 위아래로 옮겨요 */
        html += '<button class="so-item" type="button" data-act="item-up" data-cat="' + esc(cat.id) +
          '" data-item="' + esc(item.id) + '" aria-label="' + esc(item.text) + ' 위로 옮기기"' +
          (k === 0 ? ' disabled' : '') + '>▲</button>';
        html += '<button class="so-item" type="button" data-act="item-down" data-cat="' + esc(cat.id) +
          '" data-item="' + esc(item.id) + '" aria-label="' + esc(item.text) + ' 아래로 옮기기"' +
          (k === cat.items.length - 1 ? ' disabled' : '') + '>▼</button>';
        html += '<button class="del-btn" data-act="del-item" data-cat="' + esc(cat.id) +
          '" data-item="' + esc(item.id) + '" aria-label="' + esc(item.text) + ' 삭제">✕</button>';
        html += '</li>';
      } else {
        var locked = !can('check');
        /* '문제지 풀기' 항목은 체크 대신 문제지 고르기 팝업을 열어요 */
        var rowAct = wbItem ? 'wb-item-open' : 'toggle-check';
        html += '<li class="check-row' + (isDone ? ' done' : '') + (wbItem ? ' wb-row' : '') + (locked ? ' locked' : '') + '"' +
          (locked ? '' : ' role="checkbox" tabindex="0" aria-checked="' + (isDone ? 'true' : 'false') + '"' +
            ' data-act="' + rowAct + '" data-cat="' + esc(cat.id) + '" data-item="' + esc(item.id) + '"') + '>';
        html += '<span class="box" aria-hidden="true"></span>';
        if (wbItem) {
          html += '<span class="wb-main"><span class="wb-t">' + esc(item.text) + '</span>' + wbTagsHtml(item.id) + '</span>';
        } else {
          html += '<span class="label">' + esc(item.text) + '</span>';
        }
        html += '</li>';
      }
    }
    html += '</ul>';

    if (catWbOn(cat)) html += wbBoxHtml();

    if (complete && !edit) html += '<div class="rc-bonus">✨ 그룹 완료 보너스 <span>' + coinSvg() + ' +' + COIN_GROUP + ' 코인</span></div>';

    if (edit) {
      html += '<button class="add-item" data-act="add-item" data-cat="' + esc(cat.id) + '">+ 할 일 추가</button>';
    }
    html += '</article>';
  }
  return { html: html, shown: shownCats };
}

function renderRoutineBlock(root, blk) {
  var grid = bpart(root, 'grid');
  if (!grid) return;
  var groupId = blk.group || '';
  var prevScroll = grid.scrollLeft || 0;
  var made = routineCardsHtml(groupId, false);
  grid.innerHTML = made.html;
  applyRoutineViewFor(root, blk);
  renderRoutineJumpFor(root, blk);
  /* 오늘 요일에 하는 그룹이 하나도 없을 때 */
  var dayEmpty = bpart(root, 'dayEmpty');
  if (dayEmpty) {
    dayEmpty.hidden = groupId ? (made.shown > 0) : (state.categories.length === 0 || made.shown > 0);
    var msg = dayEmpty.querySelector('span');
    if (msg) msg.textContent = groupId ? '이 그룹은 오늘 쉬는 날이에요 🌤️' : '오늘 요일에는 하는 루틴이 없어요 🌤️';
    var editBtn = bpart(root, 'dayEmptyEdit');
    if (editBtn) editBtn.hidden = !can('edit');
  }
  if (prevScroll && grid.scrollLeft !== prevScroll) grid.scrollLeft = prevScroll;
  updateOverallForBlock(root, blk, true);
  renderRoutineTargetsForBlock(root, blk);
}

/* 이름·설명을 고치는 동안 대시보드 카드의 머리 글자도 같이 맞춰요 */
function syncCatHead(catId) {
  var cat = findCat(catId);
  if (!cat) return;
  var cards = document.querySelectorAll('#sections .routine-card[data-cat="' + catId + '"]');
  for (var i = 0; i < cards.length; i++) {
    var h3 = cards[i].querySelector('.rc-titles h3');
    if (h3) h3.textContent = cat.title;
    var sub = cards[i].querySelector('.rc-sub');
    if (sub) sub.textContent = cat.sub || '';
  }
}

function updateCardStats(catId) {
  var cat = findCat(catId);
  if (!cat) return;
  var cards = document.querySelectorAll('.routine-card[data-cat="' + catId + '"]');
  if (!cards.length) return;
  var ck = checksFor(currentKey);
  var done = 0;
  for (var j = 0; j < cat.items.length; j++) if (ck[cat.items[j].id]) done++;
  var total = cat.items.length;
  var pct = total ? Math.round(done / total * 100) : 0;
  var complete = total > 0 && done === total;

  for (var ci = 0; ci < cards.length; ci++) {
    var card = cards[ci];
    var count = card.querySelector('.rc-count');
    if (count) {
      count.textContent = complete ? '완료 🎉' : done + '/' + total;
      count.className = 'rc-count' + (complete ? ' done' : '');
    }
    var bar = card.querySelector('.rc-bar i');
    if (bar) bar.style.width = pct + '%';
    if (complete) card.classList.add('complete');
    else card.classList.remove('complete');

    var bonus = card.querySelector('.rc-bonus');
    if (complete && !ui.layout) {
      if (!bonus) {
        bonus = document.createElement('div');
        bonus.className = 'rc-bonus';
        bonus.innerHTML = '✨ 그룹 완료 보너스 <span>' + coinSvg() + ' +' + COIN_GROUP + ' 코인</span>';
        card.appendChild(bonus);
      }
    } else if (bonus && bonus.parentNode) {
      bonus.parentNode.removeChild(bonus);
    }
  }
}

function blockCounts(blk) {
  if (blk && blk.group) {
    var cat = findCat(blk.group);
    if (!cat) return { done: 0, total: 0 };
    var ck = checksFor(currentKey);
    var done = 0;
    for (var i = 0; i < cat.items.length; i++) if (ck[cat.items[i].id]) done++;
    return { done: done, total: cat.items.length };
  }
  return counts();
}

function updateOverallForBlock(root, blk, silent) {
  var c = blockCounts(blk);
  var pct = c.total ? Math.round(c.done / c.total * 100) : 0;

  var doneEl = bpart(root, 'done');
  var totalEl = bpart(root, 'total');
  var pctEl = bpart(root, 'pct');
  var fill = bpart(root, 'fill');
  var rocket = bpart(root, 'rocket');
  var bar = bpart(root, 'bar');

  if (doneEl) doneEl.textContent = c.done;
  if (totalEl) totalEl.textContent = c.total;
  if (pctEl) pctEl.textContent = pct + '%';
  if (fill) fill.style.width = pct + '%';
  if (rocket) {
    rocket.style.left = (pct > 0 ? Math.min(pct, 94) : 0) + '%';
    rocket.style.opacity = pct > 0 ? '1' : '0.45';
  }

  var hint = bpart(root, 'hint');
  if (hint) {
    if (!can('check')) hint.textContent = '지금은 보기만 할 수 있어요 👀';
    else if (c.total && c.done === c.total) hint.textContent = '오늘 할 일을 모두 끝냈어요! 정말 최고예요 🎉';
    else if (c.done > 0) hint.textContent = '잘하고 있어요! 남은 ' + (c.total - c.done) + '개도 화이팅!';
    else hint.textContent = '오늘 할 일을 하나씩 체크해 보자!';
  }
  return { bar: bar, rocket: rocket, c: c, pct: pct };
}

function updateOverall(silent) {
  var shared = null;
  eachBlockOfType('routine', function (root, blk) {
    var r = updateOverallForBlock(root, blk, silent);
    if (!blk.group) shared = r;
  });
  if (silent) return;
  var c = counts();
  if (c.total && c.done === c.total && state.routineCelebrated !== currentKey) {
    state.routineCelebrated = currentKey;
    saveState();
    confetti(34, (shared && (shared.bar || shared.rocket)) || null);
    snd('win');
    window.setTimeout(showWin, 380);
  }
}

function onToggleCheck(el) {
  var catId = el.getAttribute('data-cat');
  var itemId = el.getAttribute('data-item');
  var ck = checksFor(currentKey);
  var on;
  if (ck[itemId]) {
    delete ck[itemId];
    on = false;
  } else {
    ck[itemId] = true;
    on = true;
  }
  saveState();

  if (on) el.classList.add('done');
  else el.classList.remove('done');
  el.setAttribute('aria-checked', on ? 'true' : 'false');
  /* 같은 항목이 여러 블록(예: 그룹별 루틴 카드)에 보이면 그쪽도 함께 바꿔요 */
  var twins = document.querySelectorAll('.routine-card[data-cat="' + catId + '"] [data-item="' + itemId + '"][data-act]');
  for (var tw = 0; tw < twins.length; tw++) {
    if (twins[tw] === el) continue;
    if (on) twins[tw].classList.add('done'); else twins[tw].classList.remove('done');
    twins[tw].setAttribute('aria-checked', on ? 'true' : 'false');
  }

  el.classList.remove('pop');
  void el.offsetWidth;
  el.classList.add('pop');

  snd(on ? 'check' : 'uncheck');
  updateCardStats(catId);
  updateOverall(false);

  if (on) {
    var gotCoin = awardCheckCoins(itemId);
    if (gotCoin.coin && gotCoin.first) showToast(coinSvg() + ' +' + gotCoin.coin + ' 코인!', true);
    bumpProgress('routine', 1);
    gainXp(XP_CHECK);
    var gcat = findCat(catId);
    if (gcat && gcat.items.length) {
      var allDone = true;
      for (var gi = 0; gi < gcat.items.length; gi++) if (!ck[gcat.items[gi].id]) allDone = false;
      if (allDone) {
        var gcoin = awardGroupCoins(catId);
        if (gcoin) { showToast('🎉 ' + esc(gcat.title || '루틴') + ' 완료! ' + coinSvg() + ' +' + gcoin, true); snd('win'); }
      }
    }
  } else {
    revokeCheckCoins(itemId);
    bumpProgress('routine', -1);
    gainXp(-XP_CHECK);
  }
  saveState();
  renderCoinBadge();
  renderRoutineTargets();
}

function onAddItem(catId) {
  var cat = findCat(catId);
  if (!cat) return;
  var id = catId + '-' + Date.now().toString(36);
  cat.items.push({ id: id, text: '' });
  saveState();
  renderRoutine();
  var inp = document.querySelector('.item-input[data-item="' + id + '"]');
  if (inp) {
    inp.focus();
    try { inp.setSelectionRange(0, inp.value.length); } catch (e) { /* 무시 */ }
  }
}

/* 편집 화면에서 할 일을 위/아래로 한 칸 옮겨요 (그룹 안에서만) */
function moveItem(catId, itemId, dir) {
  if (!can('edit')) return;
  var cat = findCat(catId);
  if (!cat) return;
  var idx = -1;
  for (var i = 0; i < cat.items.length; i++) if (cat.items[i].id === itemId) { idx = i; break; }
  if (idx < 0) return;
  var to = idx + dir;
  if (to < 0 || to >= cat.items.length) return;
  var moved = cat.items.splice(idx, 1)[0];
  cat.items.splice(to, 0, moved);
  saveState();          /* config/settings.json 에 그대로 저장돼요 */
  renderRoutine();
  var keep = document.querySelector('.routine-card[data-cat="' + catId + '"] [data-act="item-' + (dir < 0 ? 'up' : 'down') + '"][data-item="' + itemId + '"]');
  if (keep && !keep.disabled) keep.focus();
}

function onDelItem(el) {
  var catId = el.getAttribute('data-cat');
  var itemId = el.getAttribute('data-item');
  var cat = findCat(catId);
  if (!cat) return;
  var text = '';
  var idx = -1;
  for (var i = 0; i < cat.items.length; i++) {
    if (cat.items[i].id === itemId) { idx = i; text = cat.items[i].text; break; }
  }
  if (idx < 0) return;
  if (!window.confirm('"' + (text || '이 항목') + '" 을(를) 지울까요?')) return;
  cat.items.splice(idx, 1);
  var ck = checksFor(currentKey);
  delete ck[itemId];
  try { delete itemPickMap(currentKey)[itemId]; } catch (e2) { /* 무시 */ }
  saveState();
  renderRoutine();
}

/* ============ 날짜 넘김 처리 ============ */
/* 체크는 날짜별(state.checks[currentKey])로 남기 때문에 날짜가 바뀌면
   오늘 화면은 0/N에서 새로 시작합니다. 태블릿을 켜 둔 채 밤을 넘기거나
   잠금이 풀린 뒤 돌아와도 바로 새 날짜로 맞춥니다. */
function checkDayRollover() {
  var k = dateKey(new Date());
  if (k === currentKey) return false;
  try { snapshotDay(currentKey); } catch (e) { /* 무시 */ }
  currentKey = k;
  freshIdx = -1;
  try {
    renderHeader();
    renderSectionTitles();
    renderRoutine();
    renderRoutineTargets();
    renderStickers();
    renderPet();
    renderTodayAcademy();
    renderWeek();
    renderMissions();
    renderRoles();
    updateOverall(true);
    renderCoinBadge();
    if (!document.getElementById('roomModal').hidden) renderRoom();
  } catch (e) { /* 무시 */ }
  try { saveState(); } catch (e) { /* 무시 */ }
  return true;
}

/* 여러 창을 겹쳐 열 때 나중에 연 창이 위로 오게 */
var modalZ = 85;
function raiseModal(id) {
  var el = document.getElementById(id);
  if (!el) return;
  modalZ += 1;
  if (modalZ > 150) modalZ = 86;
  el.style.zIndex = String(modalZ);
}

/* ---------------- 사운드 (iOS Safari) ---------------- */
function unlockAudio() {
  try {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!audioCtx) audioCtx = new AC();
    if (audioCtx.state === 'suspended' && audioCtx.resume) {
      var pr = audioCtx.resume();
      if (pr && pr.then) pr.then(function () { playSilent(); }, function () {});
    } else {
      playSilent();
    }
  } catch (e) { /* 무시 */ }
}
function playSilent() {
  try {
    if (!audioCtx || audioCtx.state !== 'running') return;
    var b = audioCtx.createBuffer(1, 1, 22050);
    var src = audioCtx.createBufferSource();
    src.buffer = b;
    src.connect(audioCtx.destination);
    src.start(0);
  } catch (e) { /* 무시 */ }
}

/* ---- 첫 터치 1회: 알림음 <audio>까지 미리 깨워 둬요 ----
   브라우저는 '사용자가 한 번 누르기 전'에는 소리를 막아요. 예전에는 알림 순간마다
   알림창의 🔊 소리 켜기 버튼을 한 번 더 눌러야 소리가 났는데,
   이제 화면을 처음 누른 그 순간 조용한(무음) 소리로 <audio> 재생을 한 번 성공시켜 두고
   바로 멈춰요 → 그 뒤에는 알림 시각에 버튼 없이 소리가 바로 나요. (무음이라 소리는 새지 않아요) */
var mediaWarm = { done: false, at: 0 };
var silentWavUrl = '';

/* 아주 짧은 무음 .wav 주소 (처음 한 번만 구워 둬요) */
function silentWavSrc() {
  if (silentWavUrl) return silentWavUrl;
  try {
    var bytes = wavFile(new Float32Array(Math.max(1, Math.round(H50_SR * 0.12))), H50_SR);
    silentWavUrl = window.URL.createObjectURL(new Blob([bytes], { type: 'audio/wav' }));
  } catch (e) { silentWavUrl = ''; }
  return silentWavUrl;
}

/* <audio> 하나를 무음으로 재생했다가 바로 멈춰 '이 기기에서 소리를 낼 수 있음'을 잡아 둬요.
   · 지금 진짜 소리가 나고 있으면 건드리지 않아요.
   · 멈추기 전에 주소가 바뀌었거나 다른 소리가 시작됐으면 그대로 둬요 (그 소리를 끊지 않게). */
function warmMediaElement(el, tag) {
  if (!el) return false;
  var src = silentWavSrc();
  if (!src) return false;
  try {
    if (h50AudioOn || h50Want) return false;
    if (!el.paused && !el.ended) return false;
    /* 같은 순간에 두 번 걸지 않아요 (pointerdown·touchstart 가 잇달아 와도 한 번만)
       단 3초가 지나면 풀어 둬요 — 응답이 안 오는 기기라도 다음 터치에 다시 시도할 수 있게 */
    var now = Date.now();
    if (el.__warmBusy && (now - (el.__warmAt || 0)) < 3000) return false;
    try { el.setAttribute('playsinline', ''); } catch (e0) { /* 무시 */ }
    if (el.getAttribute('src') !== src) el.src = src;
    el.__warmBusy = true;
    el.__warmAt = now;
    /* 진짜로 <audio>.play() 가 성공했을 때만 '이 기기에서 소리가 풀렸다'고 표시해요.
       실패하면(구형 안드로이드 크롬이 이 터치를 안 쳐줘서) 다음 터치(touchend·click)에서 다시 시도해요. */
    var settle = function (ok) {
      el.__warmBusy = false;
      try {
        if (ok && !h50AudioOn && !h50Want && String(el.getAttribute('src') || '') === src) {
          el.pause();
          el.currentTime = 0;
        }
      } catch (e1) { /* 무시 */ }
      if (ok) {
        mediaWarm.done = true;
        mediaWarm.at = Date.now();
        try { document.documentElement.setAttribute('data-media-warm', tag || '1'); } catch (e2) { /* 무시 */ }
      } else if (tag === 'touch') {
        mediaWarm.done = false;
      }
    };
    var p = el.play();
    if (p && p.then) p.then(function () { settle(true); }, function () { settle(false); });
    else settle(true);
    return true;
  } catch (e) { try { el.__warmBusy = false; } catch (e2) { /* 무시 */ } return false; }
}

function warmAlertAudio(tag) {
  var el = null;
  try { el = h50Audio(); } catch (e) { el = null; }
  return warmMediaElement(el, tag);
}

function installAudioUnlock() {
  var opts = { capture: true, passive: true };
  /* 화면을 누를 때마다 Web Audio 와 알림음 <audio> 를 함께 풀어 둬요.
     · 손가락이 '닿는 순간'(pointerdown·touchstart)과 '떼는 순간'(touchend·click)을 모두 들어요.
       구형 안드로이드 크롬(7.0 태블릿 등)은 닿는 순간을 진짜 터치로 쳐주지 않고
       떼는 순간만 쳐줘서, 예전에는 화면을 눌러도 소리가 안 풀리고
       알림창의 🔊 소리 켜기 버튼을 또 눌러야 했어요. (버튼은 click 이라 그때 풀렸어요) */
  function onGesture() {
    /* 아직 안 깨어 있으면 풀어 봐요 — 깨어난 뒤에는 조용히 넘어가요 */
    if (!audioCtx || audioCtx.state !== 'running') unlockAudio();
    /* 웜업이 '진짜로 성공'할 때까지 누를 때마다 다시 시도해요.
       성공하면 warmMediaElement 의 settle 안에서 mediaWarm.done = true 가 돼요. */
    if (mediaWarm.done) return;
    mediaWarm.at = Date.now();
    warmAlertAudio('touch');
  }
  document.addEventListener('pointerdown', onGesture, opts);
  document.addEventListener('touchstart', onGesture, opts);
  document.addEventListener('touchend', onGesture, opts);
  document.addEventListener('mousedown', onGesture, opts);
  document.addEventListener('click', onGesture, opts);
  document.addEventListener('keydown', onGesture, { capture: true });
  startAudioKeepAlive();
}

/* ---- 소리 세션 계속 깨어 있게 ----
   첫 터치로 풀린 AudioContext 도 오랫동안 소리가 없으면 브라우저가 잠들게 해요.
   (안드로이드 크롬·아이폰 사파리 모두, 특히 화면을 껐다 켜거나 다른 앱을 다녀오면요)
   잠든 채로 30분·10분 알림을 지나 0분 알림이 오면 <audio>.play() 가 막혀서
   또 🔊 소리 켜기를 눌러야 소리가 났어요.
   → 한 번이라도 터치해서 잠금이 풀린 기기라면 화면이 보이는 동안 25초마다
     아주 짧은 무음을 흘려 세션을 깨어 있게 둬요. (무음이라 소리는 새지 않아요) */
var audioKeep = { timer: 0, at: 0 };
function audioKeepTick() {
  try {
    /* 한 번이라도 터치가 먹혀 AudioContext 가 깨어 있으면, <audio> 웜업이 실패했더라도
       계속 깨워 둬요 — 그러면 알림은 PCM 으로 저절로 울려요. (구형 안드로이드 대비) */
    var ctxUp = !!(audioCtx && audioCtx.state === 'running');
    if (!mediaWarm.done && !ctxUp) return;   /* 아직 한 번도 안 눌렀으면 풀 수 없어요 */
    if (document.hidden) return;        /* 화면이 꺼져 있으면 굳이 깨우지 않아요 */
    unlockAudio();
    audioKeep.at = Date.now();
    try { document.documentElement.setAttribute('data-h50-keep', String(audioKeep.at)); } catch (e) { /* 무시 */ }
    /* <audio> 쪽도 가끔 무음으로 다시 잡아 둬요 (4분에 한 번, 소리가 나는 중이면 건너뜀) */
    if (mediaWarm.done && !melodyPlaying() && (Date.now() - mediaWarm.at) > 240000) {
      mediaWarm.at = Date.now();
      warmAlertAudio('keep');
    }
  } catch (e) { /* 무시 */ }
}
function startAudioKeepAlive() {
  if (audioKeep.timer) return;
  audioKeep.timer = window.setInterval(audioKeepTick, 25000);
  /* 탭·앱으로 돌아오면 바로 한 번 더 깨워요 (돌아온 직후 알림이 와도 소리가 나게) */
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) audioKeepTick();
  });
  window.addEventListener('focus', function () { audioKeepTick(); });
}
/* 점검용: 세션 유지 상태 (화면에는 안 보여요) */
try {
  document.documentElement.h50Keep = function () {
    return {
      on: !!audioKeep.timer, at: audioKeep.at,
      state: audioCtx ? String(audioCtx.state || '') : '',
      mediaWarm: !!(mediaWarm && mediaWarm.done), pcm: h50BufPlaying()
    };
  };
} catch (e) { /* 무시 */ }

/* ---------------- 주기 작업 ---------------- */
function phaseTick() {
  if (!cloud.me) return;
  var p = petState();
  if (p.stage === 0 && p.hatchAt && Date.now() >= p.hatchAt) {
    if (petTryHatch(true)) { saveState(); return; }
  }
  try { petHatchInactiveDue(); } catch (e) { /* 무시 */ }
  var timer = document.getElementById('petTimer');
  if (timer && p.stage === 0) timer.textContent = fmtLeft(petHatchLeft());
}


/* ---------------- 루틴 그룹 완료 목표 시간 (Phase 2) ---------------- */
var TARGET_WINDOW_MIN = 60;   /* 목표 1시간 전부터 알이 왼쪽에서 오른쪽으로 이동해요 */
var lastTargetRender = 0;

function hhmmValid(v) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(v || ''));
}
function hhmmMinutes(v) {
  if (!hhmmValid(v)) return -1;
  var p = String(v).split(':');
  return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
}
function hhmmLabel(v) {
  if (!hhmmValid(v)) return '';
  var p = String(v).split(':');
  var h = parseInt(p[0], 10);
  var m = p[1];
  var ampm = h < 12 ? '오전' : '오후';
  var h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return ampm + ' ' + h12 + ':' + m;
}
function nowMinuteFloat() {
  var d = new Date();
  return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
}
function leftText(mins) {
  var m = Math.ceil(mins);
  if (m <= 0) return '';
  if (m >= 60) {
    var h = Math.floor(m / 60);
    var mm = m % 60;
    return h + '시간' + (mm ? ' ' + mm + '분' : '') + ' 남았어요';
  }
  return m + '분 남았어요';
}

function setCatTarget(id, val) {
  var c = findCat(id);
  if (!c) return;
  if (!val) { c.targetTime = ''; }
  else if (hhmmValid(val)) { c.targetTime = val; }
  else return;
  saveState();
  /* 입력칸을 새로 만들면 iOS 시간 휠이 닫혀 버려요 — 카드 머리의 목표 배지만 그 자리에서 고쳐요 */
  paintCatTarget(c);
  renderRoutineTargets();
  updateOverall(true);
}

function paintCatTarget(cat) {
  var card = document.querySelector('.routine-card[data-cat="' + cat.id + '"]');
  if (!card) return;
  var valid = hhmmValid(cat.targetTime);
  var badge = card.querySelector('.rc-target');
  if (valid) {
    if (!badge) {
      var titles = card.querySelector('.rc-titles');
      if (!titles) return;
      badge = document.createElement('span');
      badge.className = 'rc-target';
      titles.appendChild(badge);
    }
    badge.textContent = '⏰ ' + hhmmLabel(cat.targetTime);
  } else if (badge && badge.parentNode) {
    badge.parentNode.removeChild(badge);
  }
  /* 지우기 버튼만 살짝 보이거나 숨겨요 (시간 입력칸은 그대로 둡니다) */
  var clearBtn = card.querySelector('[data-act="cat-target-clear"]');
  if (valid && !clearBtn) {
    var row = card.querySelector('.rce-target');
    if (row) {
      clearBtn = document.createElement('button');
      clearBtn.type = 'button';
      clearBtn.className = 'ghost-btn tiny';
      clearBtn.setAttribute('data-act', 'cat-target-clear');
      clearBtn.setAttribute('data-cat', cat.id);
      clearBtn.textContent = '지우기';
      row.appendChild(clearBtn);
    }
  } else if (!valid && clearBtn && clearBtn.parentNode) {
    clearBtn.parentNode.removeChild(clearBtn);
  }
}
function clearCatTarget(id) {
  var c = findCat(id);
  if (!c) return;
  c.targetTime = '';
  saveState();
  renderRoutine();
  showToast('목표 시간을 지웠어요.');
}

function renderRoutineTargets() {
  eachBlockOfType('routine', function (root, blk) { renderRoutineTargetsForBlock(root, blk); });
}

function renderRoutineTargetsForBlock(root, blk) {
  var box = bpart(root, 'targets');
  if (!box) return;
  var groupId = blk.group || '';
  var ck = checksFor(currentKey);
  var now = nowMinuteFloat();
  var dow = keyDayIndex(currentKey);
  /* 목표 시간 바에서 달릴 친구 — 아이가 고른 친구(없으면 지금 키우는 친구) */
  var runP = petRunnerPick();
  var sp = speciesById(runP.currentEgg);
  var petStage = runP.stage;
  var petIcon = petArt(sp, petStage, 0);
  var runName = petStage === 0 ? '알' : sp.names[Math.max(0, petStage - 1)];
  var html = '';
  for (var i = 0; i < state.categories.length; i++) {
    var cat = state.categories[i];
    if (groupId && cat.id !== groupId) continue;
    if (!hhmmValid(cat.targetTime)) continue;
    if (!activeDay(cat, dow)) continue;
    var target = hhmmMinutes(cat.targetTime);
    var total = cat.items.length;
    var done = 0;
    for (var k = 0; k < total; k++) if (ck[cat.items[k].id]) done++;
    var complete = total > 0 && done === total;
    var left = target - now;
    /* 목표 1시간 전부터만 바를 띄워요 — 아직 멀었거나 지난 목표는 보이지 않습니다 */
    if (left < 0 || left > TARGET_WINDOW_MIN) continue;
    var late = false;
    var hot = !complete && left > 0 && left <= TARGET_WINDOW_MIN;
    /* 60분 남음 = 0%(왼쪽) → 목표 시각 = 100%(오른쪽) */
    var pct;
    if (complete || left <= 0) pct = 100;
    else pct = Math.max(0, Math.min(100, (1 - left / TARGET_WINDOW_MIN) * 100));
    var iconPct = 4 + pct * 0.92;
    var status, big, sub;
    if (complete) {
      status = '✓ ' + esc(cat.title) + ' 제시간에 완료! 🎉';
      big = '목표 달성!';
      sub = josa(runName, '이', '가') + ' 결승선에 도착했어요 🎊';
    } else if (left > 0) {
      status = esc(cat.title) + ' 완료까지';
      big = leftText(left);
      sub = hot ? josa(runName, '이', '가') + ' 오른쪽으로 달려요! 🏁' : '목표 ' + hhmmLabel(cat.targetTime) + ' · 1시간 전부터 ' + josa(runName, '이', '가') + ' 출발해요';
    } else {
      status = esc(cat.title) + ' 목표 시간이 지났어요! 서두르자 💪';
      big = '목표 ' + hhmmLabel(cat.targetTime) + ' 지남';
      sub = josa(runName, '이', '가') + ' 결승선에 도착했어요';
    }
    var who = complete ? '🎉' : (late ? '🏃' : cat.emoji);
    html += '<div class="rt-target' + (complete ? ' done' : '') + (late ? ' late' : '') + (hot ? ' hot' : '') + '" style="--c:' + esc(cat.color) + '">' +
      '<div class="rtt-head">' +
        '<span class="rtt-emoji" aria-hidden="true">' + who + '</span>' +
        '<span class="rtt-text">' + status + '</span>' +
        '<span class="rtt-goal">목표 ' + hhmmLabel(cat.targetTime) + '</span>' +
      '</div>' +
      '<div class="rtt-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(pct) + '" aria-label="' + esc(cat.title) + ' 남은 시간">' +
        '<i style="width:' + pct.toFixed(1) + '%"></i>' +
        '<span class="rtt-pet" style="left:' + iconPct.toFixed(1) + '%">' + petIcon + '</span>' +
      '</div>' +
      '<div class="rtt-foot">' +
        '<span class="rtt-big">' + big + '</span>' +
        '<span class="rtt-sub">' + sub + '</span>' +
      '</div>' +
      '</div>';
  }
  box.innerHTML = html;
  box.hidden = !html;
}

function tickTargets() {
  var nowMs = Date.now();
  var now = nowMinuteFloat();
  var dow = keyDayIndex(currentKey);
  var inWindow = false;
  for (var i = 0; i < state.categories.length; i++) {
    var c = state.categories[i];
    if (!hhmmValid(c.targetTime)) continue;
    if (!activeDay(c, dow)) continue;
    var l = hhmmMinutes(c.targetTime) - now;
    if (l > 0 && l <= TARGET_WINDOW_MIN) inWindow = true;
  }
  /* 1시간 안에 들어오면 15초마다 알이 조금씩 움직이게 */
  if (nowMs - lastTargetRender < (inWindow ? 15000 : 60000)) return;
  lastTargetRender = nowMs;
  renderRoutineTargets();
  renderTargetBars();
}


/* ---------------- 목표 시간 30분·10분 알림 + 하와이 파이브오 멜로디 ----------------
   · 루틴 그룹의 완료 목표 시간이 30분·10분 남았을 때 화면 가운데 알림창을 띄워요.
   · 알림창이 떠 있는 동안 하와이 파이브오 주제가를 신시사이저로 만들어 반복 재생하고,
     '확인'을 누르면 바로 멈춰요.
   · 그룹마다·알림마다·날짜마다 한 번만 울리도록 이 기기에 기록해 두어요. */
var TAM_FIRED_KEY = 'kidsDashboard.targetAlertFired.v1';
var TAM_MARKS = [30, 10];
var TAM_GRACE = 5;            /* 알림 시각을 지난 5분 안에만 (탭이 잠깐 멈췄어도 한 번은 울리게) */
var tamOpen = null;
var tamSoundId = '';      /* 지금 울리는 알림의 소리 — 루틴 그룹별로 고른 소리가 있을 수 있어요 */

function tamFiredMap() {
  try {
    var o = JSON.parse(lsGet(TAM_FIRED_KEY) || '{}');
    return (o && typeof o === 'object') ? o : {};
  } catch (e) { return {}; }
}
function tamSaveFired(o) {
  var keys = Object.keys(o), keep = {}, cut = Date.now() - 3 * 86400000;
  for (var i = 0; i < keys.length; i++) if (Number(o[keys[i]]) >= cut) keep[keys[i]] = o[keys[i]];
  lsSet(TAM_FIRED_KEY, JSON.stringify(keep));
}

/* 지금 울려야 할 알림이 있는지 — 가장 급한(10분) 것부터 */
function targetAlertDue() {
  var now = nowMinuteFloat();
  var dow = keyDayIndex(currentKey);
  var ck = checksFor(currentKey);
  var fired = tamFiredMap();
  var best = null;
  for (var i = 0; i < state.categories.length; i++) {
    var cat = state.categories[i];
    if (!hhmmValid(cat.targetTime) || !activeDay(cat, dow)) continue;
    var total = cat.items.length, done = 0;
    for (var k = 0; k < total; k++) if (ck[cat.items[k].id]) done++;
    if (total > 0 && done === total) continue;      /* 다 끝낸 그룹은 알리지 않아요 */
    var left = hhmmMinutes(cat.targetTime) - now;
    if (left <= -TAM_GRACE) continue;   /* 정각(0분) 알림도 울리게 — 유예 시간을 넘긴 것만 건너뜀 */
    for (var mi = 0; mi < TAM_MARKS.length; mi++) {
      var mark = TAM_MARKS[mi];
      if (left > mark || left <= mark - TAM_GRACE) continue;
      /* 목표 시간을 고치면 같은 날이라도 새 시간에 맞춰 다시 울려야 해요 — 열쇠에 목표 시간을 넣어요 */
      var key = currentKey + '|' + cat.id + '|' + cat.targetTime + '|' + mark;
      if (fired[key]) continue;
      if (!best || mark < best.mark) best = { cat: cat, mark: mark, left: left, key: key };
    }
  }
  return best;
}

function fireTargetAlert(hit) {
  var m = document.getElementById('targetAlertModal');
  if (!m || tamOpen) return;
  var fired = tamFiredMap();
  fired[hit.key] = Date.now();
  tamSaveFired(fired);
  tamOpen = hit;
  /* 이 루틴 그룹이 따로 고른 알림음이 있으면 그 소리로 울려요 (없으면 전체 기본음) */
  tamSoundId = catAlertSoundId(hit.cat);
  var badge = document.getElementById('tamBadge');
  var title = document.getElementById('tamTitle');
  var text = document.getElementById('tamText');
  var emo = document.getElementById('tamEmoji');
  if (badge) badge.textContent = hit.mark === 0 ? '정각' : hit.mark + '분';
  if (title) title.textContent = hit.mark === 0 ? '목표 시간이에요!' : '목표 시간 ' + hit.mark + '분 전이에요!';
  if (emo) emo.textContent = hit.mark === 0 ? '⏰' : (hit.mark === 10 ? '⏰' : '🔔');
  if (text) {
    var whenText;
    if (hit.mark === 0) {
      var pastMin = -hit.left;
      whenText = (pastMin < 1) ? '지금 정각이에요' : Math.round(pastMin) + '분 지났어요';
    } else {
      whenText = leftText(hit.left) || '곧 목표 시간이에요';
    }
    text.innerHTML = (hit.cat.emoji || '') + ' <b>' + esc(hit.cat.title || '루틴') + '</b> · 목표 ' + hhmmLabel(hit.cat.targetTime) +
      '<br>' + whenText + ' · 서두르자! 💪';
  }
  m.hidden = false;
  raiseModal('targetAlertModal');
  lockScroll();
  if (window.navigator && window.navigator.vibrate) { try { window.navigator.vibrate([90, 60, 90]); } catch (e) { /* 무시 */ } }
  playTargetMelody(true, 0, tamSoundId);
}

function closeTargetAlert() {
  var m = document.getElementById('targetAlertModal');
  if (m) m.hidden = true;
  var sb = document.getElementById('tamSoundBtn');
  if (sb) sb.hidden = true;
  tamOpen = null;
  tamSoundId = '';
  stopTargetMelody();
  /* '확인'을 누른 그 손가락 안에서 오디오 세션을 다시 풀어 둬요.
     그래야 30분·10분 알림을 지나 0분 알림이 올 때 버튼 없이 바로 울려요.
     (확인을 누르는 순간이 브라우저가 '사용자가 눌렀다'고 인정하는 마지막 순간이에요) */
  try { unlockAudio(); } catch (e) { /* 무시 */ }
  try { warmAlertAudio('confirm'); } catch (e) { /* 무시 */ }
  try {
    if (mediaWarm) { mediaWarm.done = true; mediaWarm.at = Date.now(); }
    document.documentElement.setAttribute('data-audio-rewarm', String(Date.now()));
  } catch (e) { /* 무시 */ }
  if (isOnlyModal('targetAlertModal')) unlockScroll();
}

function checkTargetAlerts() {
  if (tamOpen) return;
  if (!targetAlertOn()) return;      /* 🎛️ 변수 설정에서 알림을 꺼 두면 울리지 않아요 */
  if (!cloud || !cloud.me) return;
  if (document.hidden) return;
  var hit = null;
  try { hit = targetAlertDue(); } catch (e) { return; }
  if (hit) fireTargetAlert(hit);
}

/* ---- 알림 1분 전 사전 웜업 ----
   화면을 오래 켜 두면 브라우저가 오디오 세션을 잠들게 해요. 그때 알림이 오면
   버튼을 다시 눌러야 소리가 나요. 그래서 알림 1분 전(60초 이내)에, 이미 한 번
   터치해서 잠금이 풀린 기기라면 무음으로 세션을 한 번 더 깨워 둬요. */
var tamWarmKey = '', tamWarmAt = 0;
function targetAlertWarmup() {
  try {
    if (tamOpen) return;
    if (!targetAlertOn()) return;
    if (document.hidden) return;
    if (!mediaWarm.done) return;          /* 아직 한 번도 안 눌렀으면 깨울 수 없어요 */
    var now = nowMinuteFloat();
    var dow = keyDayIndex(currentKey);
    var key = '';
    for (var i = 0; i < state.categories.length; i++) {
      var c = state.categories[i];
      if (!hhmmValid(c.targetTime) || !activeDay(c, dow)) continue;
      var left = hhmmMinutes(c.targetTime) - now;
      /* 30분·10분·0분 — 어떤 알림이든 그 60초 전이면 미리 깨워 둬요.
         알림이 바로 앞에 없어도 목표 시간 1분 전이면 예전처럼 한 번 깨워 둬요. */
      for (var mi = 0; mi < TAM_MARKS.length; mi++) {
        var mark = TAM_MARKS[mi];
        if (!(left > mark && left <= mark + 1)) continue;
        key = c.id + '|' + c.targetTime + '|' + mark;
        break;
      }
      if (!key && left > 0 && left <= 1) key = c.id + '|' + c.targetTime + '|near';
      if (key) break;
    }
    if (!key) return;
    if (key === tamWarmKey && (Date.now() - tamWarmAt) < 40000) return;   /* 40초에 한 번만 */
    tamWarmKey = key;
    tamWarmAt = Date.now();
    unlockAudio();
    warmAlertAudio('pre');
    try { document.documentElement.setAttribute('data-tam-warm', String(tamWarmAt)); } catch (e) { /* 무시 */ }
  } catch (e) { /* 무시 */ }
}

/* ---- 알림 소리: 하와이 파이브오 멜로디를 .wav로 만들어 재생 ----
   · 아이폰은 무음 스위치를 켜면 Web Audio(AudioContext) 소리가 나지 않아요.
   · 그래서 멜로디를 16비트 모노 22050Hz PCM .wav로 직접 만들어 <audio>로 재생해요.
     <audio>로 재생하는 소리는 무음 스위치와 상관없이 미디어 볼륨으로 나와요.
   · Web Audio 신시사이저는 .wav 재생이 막혔을 때만 두 번째 순서로 써요. */
var H50_STEP = 0.215;       /* 8분음표 한 칸 (약 140 BPM) */
var H50_LOOP = 8;           /* 2마디 = 8칸마다 반복 */
var H50_BARS = 3;           /* .wav는 3마디 ≈ 5.6초 */
var H50_SR = 22050;         /* 16비트 모노 22050Hz */
var h50 = { on: false, timer: 0, gain: null, nextAt: 0, tries: 0 };

/* 악보 (8분음표 칸 단위) — 신시사이저와 .wav가 같은 악보를 써요 */
var H50_LEAD = [
  [0, 392.00, .22], [0.5, 392.00, .22], [0.75, 392.00, .2], [1, 466.16, .22], [1.25, 523.25, .2], [1.5, 587.33, .42],
  [2.5, 587.33, .2], [2.75, 523.25, .2], [3, 466.16, .2], [3.25, 523.25, .2], [3.5, 392.00, .45],
  [4, 392.00, .22], [4.5, 392.00, .22], [4.75, 466.16, .2], [5, 523.25, .2], [5.25, 587.33, .2], [5.5, 622.25, .42],
  [6.5, 587.33, .2], [6.75, 523.25, .2], [7, 587.33, .2], [7.25, 523.25, .2], [7.5, 392.00, .45]
];
var H50_BASS = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5];
var H50_TOM = [0, 0.5, 1.25, 1.75, 2.5, 3, 3.75, 4, 4.5, 5.25, 5.75, 6.5, 7, 7.75];
var H50_HAT = 16;

function h50SetState(v) {
  try { document.documentElement.setAttribute('data-tam-audio', v); } catch (e) { /* 무시 */ }
  try { document.documentElement.setAttribute('data-h50-audio', v); } catch (e) { /* 무시 */ }
  var s = document.getElementById('tamSound');
  if (s) {
    s.textContent = (v === 'on')
      ? '♪ ' + alertSoundName((tamOpen ? tamSoundId : '') || alertSoundId()) + ' 알림 소리가 울리는 중 — 확인을 누르면 멈춰요'
      : '🔇 소리가 멈춰 있어요 — 아래 버튼을 눌러 주세요';
    s.hidden = (v !== 'on' && v !== 'blocked');
  }
  /* 소리가 막혔을 때만 알림창에 🔊 소리 켜기 버튼이 보여요 */
  var sb = document.getElementById('tamSoundBtn');
  if (sb) sb.hidden = (v !== 'blocked');
  try { updateSoundUi(); } catch (e) { /* 무시 */ }
}

function h50Ctx() {
  var AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  try {
    if (!audioCtx) audioCtx = new AC();
    if (audioCtx.state === 'suspended' && audioCtx.resume) audioCtx.resume();
  } catch (e) { return null; }
  return audioCtx;
}

/* 금관 느낌의 리드 (톱니파 + 낮은 사각파를 겹쳐 두껍게) */
function h50Tone(ctx, t, freq, dur, vol, kind, dest) {
  try {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = (kind === 'square') ? 'square' : 'sawtooth';
    o.frequency.setValueAtTime(freq, t);
    if (kind === 'brass') {
      var f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.setValueAtTime(2600, t);
      f.frequency.exponentialRampToValueAtTime(1300, t + Math.max(0.06, dur));
      f.Q.value = 0.9;
      o.connect(f); f.connect(g);
    } else {
      o.connect(g);
    }
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.setValueAtTime(vol, t + Math.max(0.02, dur * 0.55));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(dest);
    o.start(t);
    o.stop(t + dur + 0.02);
  } catch (e) { /* 무시 */ }
}

/* 톰·큰북 */
function h50Tom(ctx, t, f0, f1, vol, dest) {
  try {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + 0.16);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    o.connect(g); g.connect(dest);
    o.start(t); o.stop(t + 0.22);
  } catch (e) { /* 무시 */ }
}

/* 심벌·하이햇 (짧은 잡음) */
function h50Noise(ctx, t, dur, vol, hp, dest) {
  try {
    var len = Math.max(32, Math.floor(ctx.sampleRate * dur));
    var b = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = b.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var src = ctx.createBufferSource();
    src.buffer = b;
    var f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = hp || 7000;
    var g = ctx.createGain();
    g.gain.value = vol;
    src.connect(f); f.connect(g); g.connect(dest);
    src.start(t);
  } catch (e) { /* 무시 */ }
}

/* 두 마디 한 번에 예약 — 빠른 리드 · 낮은 금관 · 탐 · 하이햇 */
function h50Bar(ctx, t0, dest) {
  var lead = H50_LEAD, bass = H50_BASS, tom = H50_TOM, i;
  for (i = 0; i < lead.length; i++) {
    var at = t0 + lead[i][0] * H50_STEP;
    h50Tone(ctx, at, lead[i][1], lead[i][2], 0.075, 'brass', dest);
    h50Tone(ctx, at, lead[i][1] / 2, lead[i][2] * 0.9, 0.028, 'square', dest);
  }
  for (i = 0; i < bass.length; i++) {
    var bt = t0 + bass[i] * H50_STEP;
    h50Tone(ctx, bt, 98.00, H50_STEP * 0.8, 0.055, 'square', dest);
    h50Tone(ctx, bt, 196.00, H50_STEP * 0.45, 0.022, 'square', dest);
  }
  for (i = 0; i < tom.length; i++) {
    h50Tom(ctx, t0 + tom[i] * H50_STEP, i % 2 ? 215 : 175, i % 2 ? 122 : 92, 0.07, dest);
  }
  for (var hx = 0; hx < H50_HAT; hx++) {
    h50Noise(ctx, t0 + hx * H50_STEP / 2, 0.028, hx % 2 ? 0.012 : 0.02, 7200, dest);
  }
}

function h50Pump() {
  if (!h50.on || !audioCtx) return;
  try {
    var now = audioCtx.currentTime;
    if (h50.nextAt < now - 0.5) h50.nextAt = now + 0.06;   /* 탭이 멈췄다 돌아오면 따라잡기 */
    var ahead = now + 1.2, guard = 0;
    while (h50.nextAt < ahead && guard++ < 4) {
      h50Bar(audioCtx, h50.nextAt, h50.gain);
      h50.nextAt += H50_LOOP * H50_STEP;
    }
  } catch (e) { /* 무시 */ }
}

function h50Start() {
  var ctx = h50Ctx();
  if (!ctx) { h50SetState('off'); return false; }
  if (h50.on) { h50SetState('on'); return true; }
  if (ctx.state !== 'running') {
    if (ctx.resume) { try { ctx.resume(); } catch (e) { /* 무시 */ } }
    h50SetState('blocked');
    /* 아이가 화면을 한 번 누르면 소리가 켜져요 (아이패드·안드로이드 자동재생 제한) */
    if (h50.tries < 12) {
      h50.tries += 1;
      window.setTimeout(function () { if (tamOpen && !melodyPlaying()) h50Start(); }, 300);
    }
    return false;
  }
  h50.tries = 0;
  h50.gain = ctx.createGain();
  h50.gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  h50.gain.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + 0.2);
  h50.gain.connect(ctx.destination);
  h50.on = true;
  h50.nextAt = ctx.currentTime + 0.08;
  h50Pump();
  h50.timer = window.setInterval(h50Pump, 200);
  h50SetState('on');
  return true;
}

function h50Stop() {
  if (h50.timer) { window.clearInterval(h50.timer); h50.timer = 0; }
  var ctx = audioCtx;
  if (ctx && h50.gain) {
    try {
      var g = h50.gain.gain, t = ctx.currentTime;
      g.cancelScheduledValues(t);
      g.setValueAtTime(Math.max(0.0001, g.value), t);
      g.exponentialRampToValueAtTime(0.0001, t + 0.12);
    } catch (e) { /* 무시 */ }
  }
  h50.on = false;
  h50.gain = null;
  h50.nextAt = 0;
  h50SetState('off');
}

/* ---------- .wav로 굽기 (아이폰 무음 스위치에서도 들리는 쪽) ---------- */

/* 톱니·사각 파형에 낮은 통과 필터를 걸어 금관 느낌으로 */
function pcmBrass(out, sr, t0, freq, dur, vol, kind) {
  var i0 = Math.round(t0 * sr), len = Math.max(1, Math.round(dur * sr));
  var i1 = Math.min(out.length, i0 + len);
  if (i0 >= i1) return;
  var inc = freq / sr, phase = 0, lp = 0;
  var cut = (kind === 'square') ? 1500 : 2600;
  var a = 1 - Math.exp(-2 * Math.PI * cut / sr);
  var atk = 0.012, hold = Math.max(0.02, dur * 0.55);
  for (var i = i0; i < i1; i++) {
    phase += inc;
    if (phase >= 1) phase -= 1;
    var raw = (kind === 'square') ? (phase < 0.5 ? 0.72 : -0.72) : (2 * phase - 1);
    lp += a * (raw - lp);
    var t = (i - i0) / sr, e;
    if (t < atk) e = t / atk;
    else if (t < hold) e = 1;
    else {
      var k = (t - hold) / Math.max(0.001, dur - hold);
      e = (k >= 1) ? 0 : Math.exp(-3.4 * k) * (1 - k);
    }
    out[i] += lp * vol * e;
  }
}

/* 톰·큰북 (사인 + 빠른 음높이 내림) */
function pcmDrum(out, sr, t0, f0, f1, dur, vol) {
  var i0 = Math.round(t0 * sr), len = Math.max(1, Math.round(dur * sr));
  var i1 = Math.min(out.length, i0 + len);
  if (i0 >= i1) return;
  var phase = 0;
  for (var i = i0; i < i1; i++) {
    var t = (i - i0) / sr, p = Math.min(1, t / dur);
    phase += (f0 * Math.pow(f1 / f0, p)) / sr;
    var e = (t < 0.004 ? t / 0.004 : 1) * Math.exp(-6.5 * p);
    out[i] += Math.sin(phase * 2 * Math.PI) * vol * e;
  }
}

/* 하이햇 (아주 짧은 잡음) */
function pcmHiss(out, sr, t0, dur, vol) {
  var i0 = Math.round(t0 * sr), len = Math.max(1, Math.round(dur * sr));
  var i1 = Math.min(out.length, i0 + len);
  if (i0 >= i1) return;
  var prev = 0;
  for (var i = i0; i < i1; i++) {
    var t = (i - i0) / sr, n = Math.random() * 2 - 1, hp = n - prev * 0.86;
    prev = n;
    out[i] += hp * vol * Math.exp(-75 * t);
  }
}

/* Float32 샘플 → 16비트 모노 WAV(RIFF) */
function wavFile(samples, sr) {
  var n = samples.length, buf = new ArrayBuffer(44 + n * 2), dv = new DataView(buf);
  function tag(off, s) { for (var i = 0; i < s.length; i++) dv.setUint8(off + i, s.charCodeAt(i)); }
  tag(0, 'RIFF'); dv.setUint32(4, 36 + n * 2, true); tag(8, 'WAVE');
  tag(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
  dv.setUint32(24, sr, true); dv.setUint32(28, sr * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true);
  tag(36, 'data'); dv.setUint32(40, n * 2, true);
  var p = 44;
  for (var i = 0; i < n; i++) {
    var v = samples[i];
    if (v > 1) v = 1; else if (v < -1) v = -1;
    dv.setInt16(p, Math.round(v < 0 ? v * 32768 : v * 32767), true);
    p += 2;
  }
  return new Uint8Array(buf);
}

/* 너무 작거나 찢어지지 않게 크기를 맞추고, 시작·끝을 부드럽게 */
function pcmPolish(out, sr) {
  var peak = 0, i, v;
  for (i = 0; i < out.length; i++) { v = out[i] < 0 ? -out[i] : out[i]; if (v > peak) peak = v; }
  var g = peak > 0.0001 ? 0.9 / peak : 1;
  for (i = 0; i < out.length; i++) out[i] = Math.tanh(out[i] * g * 1.15) * 0.92;
  var fade = Math.round(sr * 0.05);
  for (i = 0; i < fade && i < out.length; i++) {
    var k = i / fade;
    out[i] *= k;
    out[out.length - 1 - i] *= k;
  }
}

/* 멜로디 3마디 (약 5.6초) */
function h50PcmSamples() {
  var sr = H50_SR, step = H50_STEP, bar = step * 8;
  var out = new Float32Array(Math.round(sr * (bar * H50_BARS + 0.45)));
  for (var b = 0; b < H50_BARS; b++) {
    var t0 = b * bar, i;
    for (i = 0; i < H50_LEAD.length; i++) {
      var at = t0 + H50_LEAD[i][0] * step;
      pcmBrass(out, sr, at, H50_LEAD[i][1], H50_LEAD[i][2], 0.30, 'brass');
      pcmBrass(out, sr, at, H50_LEAD[i][1] / 2, H50_LEAD[i][2] * 0.9, 0.11, 'square');
    }
    for (i = 0; i < H50_BASS.length; i++) {
      var bt = t0 + H50_BASS[i] * step;
      pcmBrass(out, sr, bt, 98.00, step * 0.8, 0.22, 'square');
      pcmBrass(out, sr, bt, 196.00, step * 0.45, 0.09, 'square');
    }
    for (i = 0; i < H50_TOM.length; i++) {
      pcmDrum(out, sr, t0 + H50_TOM[i] * step, i % 2 ? 215 : 175, i % 2 ? 122 : 92, 0.2, 0.20);
    }
    for (i = 0; i < H50_HAT; i++) pcmHiss(out, sr, t0 + i * step / 2, 0.028, i % 2 ? 0.035 : 0.055);
  }
  pcmPolish(out, sr);
  return out;
}

/* --- 소리별 PCM (.wav로 구워 <audio>로 재생해요) --- */

/* 쨍그랑 울리는 종소리 한 음 */
function pcmBell(out, sr, t0, freq, dur, vol) {
  var i0 = Math.round(t0 * sr), len = Math.max(1, Math.round(dur * sr));
  var i1 = Math.min(out.length, i0 + len);
  if (i0 >= i1) return;
  var parts = [[1, 1], [2.0, 0.42], [3.01, 0.22], [4.17, 0.11], [5.43, 0.05]];
  for (var i = i0; i < i1; i++) {
    var t = (i - i0) / sr, e = (t < 0.004 ? t / 0.004 : 1) * Math.exp(-3.1 * t);
    var v = 0;
    for (var p = 0; p < parts.length; p++) v += Math.sin(2 * Math.PI * freq * parts[p][0] * t + p) * parts[p][1];
    out[i] += v * vol * e;
  }
}

/* 🔔 맑은 차임벨 — 도·미·솔·도 차례로 */
function chimePcmSamples() {
  var sr = H50_SR, out = new Float32Array(Math.round(sr * 3.3));
  var notes = [0, 523.25, 0.3, 659.25, 0.6, 783.99, 0.9, 1046.50];
  for (var i = 0; i < notes.length; i += 2) pcmBell(out, sr, notes[i], notes[i + 1], 2.3, 0.34);
  pcmPolish(out, sr);
  return out;
}

/* 🎮 게임 레벨업 팡파르 — 빠른 상승음 + 화음 */
function gamePcmSamples() {
  var sr = H50_SR, out = new Float32Array(Math.round(sr * 2.8));
  var up = [523.25, 659.25, 783.99, 1046.50], i;
  for (i = 0; i < up.length; i++) pcmBrass(out, sr, i * 0.1, up[i], 0.13, 0.42, 'square');
  pcmBell(out, sr, 0.44, 1567.98, 0.7, 0.28);
  var chord = [523.25, 659.25, 783.99, 1046.50];
  for (i = 0; i < chord.length; i++) {
    pcmBrass(out, sr, 0.46, chord[i], 1.5, 0.24, 'brass');
    pcmBrass(out, sr, 0.46, chord[i] / 2, 1.5, 0.09, 'square');
  }
  pcmDrum(out, sr, 0.46, 220, 90, 0.35, 0.3);
  pcmPolish(out, sr);
  return out;
}

/* ✨ 부드러운 오르골 — 미·솔·도·시·라·솔·미·도 */
function musicboxPcmSamples() {
  var sr = H50_SR, out = new Float32Array(Math.round(sr * 4.4));
  var mel = [659.25, 783.99, 1046.50, 987.77, 880.00, 783.99, 659.25, 523.25];
  for (var i = 0; i < mel.length; i++) {
    pcmBell(out, sr, i * 0.42, mel[i], 2.0, 0.26);
    pcmBell(out, sr, i * 0.42, mel[i] * 2, 0.9, 0.05);
  }
  pcmPolish(out, sr);
  return out;
}

/* ⏰ 클래식 모닝 알람 — 두 종이 같이 울리는 소리 */
function classicPcmSamples() {
  var sr = H50_SR, out = new Float32Array(Math.round(sr * 2.9));
  for (var k = 0; k < 4; k++) {
    var t = k * 0.62;
    pcmBrass(out, sr, t, 880.00, 0.26, 0.34, 'square');
    pcmBrass(out, sr, t, 1108.73, 0.26, 0.28, 'square');
    pcmBell(out, sr, t, 1760.00, 0.3, 0.1);
  }
  pcmPolish(out, sr);
  return out;
}

/* 8비트 사각파 (칩튠) — 살짝만 부드럽게 해서 찌르는 소리 없이 */
function pcmChip(out, sr, t0, freq, dur, vol, duty) {
  var i0 = Math.round(t0 * sr), len = Math.max(1, Math.round(dur * sr));
  var i1 = Math.min(out.length, i0 + len);
  if (i0 >= i1) return;
  var inc = freq / sr, phase = 0, lp = 0, a = 1 - Math.exp(-2 * Math.PI * 7000 / sr);
  var d = (duty == null) ? 0.5 : duty, atk = 0.003;
  for (var i = i0; i < i1; i++) {
    phase += inc;
    if (phase >= 1) phase -= 1;
    var raw = (phase < d) ? 0.8 : -0.8;
    lp += a * (raw - lp);
    var t = (i - i0) / sr, e = (t < atk) ? t / atk : 1;
    if (dur > 0.12) e *= Math.exp(-1.6 * Math.max(0, t - atk));
    out[i] += lp * vol * e;
  }
}

/* 🪙 8비트 코인 — 시(B5) → 미(E6) 딸랑, 세 번 */
function retroCoinPcmSamples() {
  var sr = H50_SR, out = new Float32Array(Math.round(sr * 2.1));
  for (var k = 0; k < 3; k++) {
    var t = k * 0.62;
    pcmChip(out, sr, t, 987.77, 0.06, 0.5, 0.5);
    pcmChip(out, sr, t + 0.06, 1318.51, 0.34, 0.5, 0.5);
    pcmChip(out, sr, t + 0.06, 659.25, 0.1, 0.12, 0.25);
  }
  pcmPolish(out, sr);
  return out;
}

/* ⭐ 8비트 파워업 — 빠르게 올라가는 아르페지오 */
function retroPowerupPcmSamples() {
  var sr = H50_SR, out = new Float32Array(Math.round(sr * 2.0));
  var up = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51, 1567.98, 2093.00];
  for (var i = 0; i < up.length; i++) pcmChip(out, sr, i * 0.058, up[i], 0.07, 0.42, 0.25);
  pcmChip(out, sr, 0.60, 2093.00, 0.5, 0.46, 0.5);
  pcmChip(out, sr, 0.60, 1046.50, 0.5, 0.26, 0.25);
  pcmChip(out, sr, 0.78, 2637.02, 0.32, 0.3, 0.5);
  pcmPolish(out, sr);
  return out;
}

/* 🏁 8비트 스테이지 클리어 — 밝게 올라가서 끝나는 팡파르 */
function retroClearPcmSamples() {
  var sr = H50_SR, out = new Float32Array(Math.round(sr * 2.6));
  var mel = [[0, 523.25, 0.1], [0.11, 523.25, 0.1], [0.22, 523.25, 0.1], [0.33, 523.25, 0.16],
             [0.52, 659.25, 0.12], [0.66, 783.99, 0.12], [0.80, 1046.50, 0.3],
             [1.14, 1318.51, 0.16], [1.32, 1046.50, 0.16], [1.50, 1318.51, 0.5]];
  var i;
  for (i = 0; i < mel.length; i++) pcmChip(out, sr, mel[i][0], mel[i][1], mel[i][2], 0.44, 0.5);
  for (i = 0; i < mel.length; i++) pcmChip(out, sr, mel[i][0], mel[i][1] / 2, mel[i][2] * 0.9, 0.16, 0.25);
  pcmChip(out, sr, 1.5, 659.25, 0.5, 0.2, 0.25);
  pcmDrum(out, sr, 1.5, 180, 80, 0.3, 0.26);
  pcmPolish(out, sr);
  return out;
}

function alertSoundSamples(id) {
  if (id === 'chime') return chimePcmSamples();
  if (id === 'game') return gamePcmSamples();
  if (id === 'musicbox') return musicboxPcmSamples();
  if (id === 'classic') return classicPcmSamples();
  if (id === 'retro_coin') return retroCoinPcmSamples();
  if (id === 'retro_powerup') return retroPowerupPcmSamples();
  if (id === 'retro_clear') return retroClearPcmSamples();
  return h50PcmSamples();
}

var alertWavCache = {};

/* 기본 알림음 → Blob URL (.wav). 한 번 구우면 다시 써요 */
function alertWavUrl(id) {
  if (alertWavCache[id] && alertWavCache[id].url) return alertWavCache[id].url;
  try {
    if (!window.Blob || !window.URL || !window.URL.createObjectURL) return '';
    var bytes = wavFile(alertSoundSamples(id), H50_SR);
    var url = window.URL.createObjectURL(new Blob([bytes], { type: 'audio/wav' }));
    alertWavCache[id] = { url: url, bytes: bytes.length, dur: (bytes.length - 44) / 2 / H50_SR };
    return url;
  } catch (e) { return ''; }
}

/* ---- <audio> 자동재생이 막혔을 때: 고른 소리를 Web Audio PCM 버퍼로 ----
   브라우저가 한동안 손대지 않은 <audio>.play() 를 막아도, 첫 터치·'확인'으로 풀어 둔
   AudioContext 가 아직 깨어 있으면 같은 소리를 그대로 틀 수 있어요.
   (예전엔 여기서 하와이 파이브오 신시사이저로 넘어가서, 차임벨을 골랐어도 하와이가 났어요) */
var h50Buf = { src: null, gain: null, id: '', at: 0 };
var h50BufCache = {};      /* id → { ctx, buffer } — AudioContext 가 바뀌면 다시 만들어요 */

function h50BufPlaying() { return !!h50Buf.src; }

/* 내가 올린 소리(주소·파일)는 PCM 으로 만들 수 없어요 — 내장 소리만 */
function alertSoundPcmAllowed(id) {
  if (!id) return false;
  try { if (customAlertSound(id)) return false; } catch (e) { /* 무시 */ }
  return true;
}

function h50BufferFor(ctx, id) {
  var c = h50BufCache[id];
  if (c && c.ctx === ctx && c.buffer) return c.buffer;
  if (!alertSoundPcmAllowed(id)) return null;
  var samples = null;
  try { samples = alertSoundSamples(id); } catch (e) { samples = null; }
  if (!samples || !samples.length) return null;
  var buf = ctx.createBuffer(1, samples.length, H50_SR);
  var ch = buf.getChannelData(0);
  if (ch.set) ch.set(samples);
  else { for (var i = 0; i < samples.length; i++) ch[i] = samples[i]; }
  h50BufCache[id] = { ctx: ctx, buffer: buf };
  return buf;
}

/* 점검용 표시 — 화면에는 안 보여요 */
function h50StampPcm(id) {
  try {
    var d = document.documentElement;
    d.setAttribute('data-h50-play', 'playing');
    d.setAttribute('data-h50-sound', id);
    d.setAttribute('data-h50-source', 'pcm');
    d.setAttribute('data-h50-pcm', id);
    d.removeAttribute('data-h50-wav');
    d.removeAttribute('data-h50-mp3');
    d.removeAttribute('data-h50-src');
  } catch (e) { /* 무시 */ }
}

function h50BufStop() {
  var b = h50Buf;
  h50Buf = { src: null, gain: null, id: '', at: 0 };
  try { document.documentElement.removeAttribute('data-h50-pcm'); } catch (e) { /* 무시 */ }
  if (!b.src) return;
  var ctx = audioCtx;
  try { b.src.onended = null; } catch (e) { /* 무시 */ }
  try {
    if (ctx && b.gain) {
      var g = b.gain.gain, t = ctx.currentTime;
      g.cancelScheduledValues(t);
      g.setValueAtTime(Math.max(0.0001, g.value), t);
      g.exponentialRampToValueAtTime(0.0001, t + 0.08);
    }
    b.src.stop((ctx ? ctx.currentTime : 0) + 0.12);
  } catch (e) { /* 무시 */ }
  try { b.src.disconnect(); } catch (e) { /* 무시 */ }
  try { if (b.gain) b.gain.disconnect(); } catch (e) { /* 무시 */ }
}

/* AudioContext 가 지금 바로 소리를 낼 수 있나 */
function h50PcmReady() {
  try {
    if (!audioCtx) return false;
    if (audioCtx.state !== 'running' && audioCtx.resume) {
      try {
        var pr = audioCtx.resume();
        /* 아직 터치가 없어 못 깨우면 조용히 넘어가요 (콘솔에 오류를 남기지 않게) */
        if (pr && pr.catch) pr.catch(function () { /* 무시 */ });
      } catch (e) { /* 무시 */ }
    }
    return audioCtx.state === 'running';
  } catch (e) { return false; }
}

/* PCM 버퍼로 재생 — 틀었으면 true. (loop 면 '확인'을 누를 때까지 반복)
   <audio> 가 막혔을 때만 불러요 — 고른 알림 소리를 그대로 들려줘야 하니까요. */
function h50PlayPcm(want) {
  var id = (want && want.id) || alertSoundId();
  if (!h50PcmReady()) return false;
  var ctx = audioCtx, buf = null;
  try { buf = h50BufferFor(ctx, id); } catch (e) { buf = null; }
  if (!buf) return false;
  try {
    h50BufStop();
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.85, ctx.currentTime + 0.06);
    gain.connect(ctx.destination);
    var src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = !!(want && want.loop);
    src.connect(gain);
    src.onended = function () {
      if (h50Buf.src !== src || src.loop) return;
      h50Buf = { src: null, gain: null, id: '', at: 0 };
      h50AudioOn = false;
      h50Want = null;
      try { document.documentElement.removeAttribute('data-h50-pcm'); } catch (e) { /* 무시 */ }
      try { document.documentElement.setAttribute('data-h50-play', 'stopped'); } catch (e) { /* 무시 */ }
      if (!h50.on) h50SetState('off');
      try { updateSoundUi(); } catch (e) { /* 무시 */ }
    };
    h50Buf = { src: src, gain: gain, id: id, at: Date.now() };
    src.start(0);
    h50AudioOn = true;
    h50Want = want || { id: id, loop: false, maxMs: 0, canFallback: false, no: ++h50Try };
    h50SetState('on');      /* 'on' 이면 🔊 소리 켜기 버튼은 숨어요 */
    h50StampPcm(id);
    h50ArmStop(h50Want);
    return true;
  } catch (e) {
    h50BufStop();
    return false;
  }
}

/* 🎺 하와이 파이브오 — 진짜 오프닝 테마(MP3).
   · 로그인한 기기는 비공개 저장소에 넣어 둔 원본 음원을 한 번 받아 메모리에 들고 있다가 바로 틀어요.
   · 외부 사이트 주소는 기기에 따라 인증서·연결이 막히고 늦어서, 마지막 순서로만 남겨 둬요. */
var H50_REMOTE = {
  hawaii: 'https://www.myinstants.com/media/sounds/hawaii-five-o-2010-opening-theme.mp3'
};

/* ---------------- 원본 음원 → 메모리 캐시 ----------------
   그림 팩(sprites.json)과 같은 길로 받아 와요 — 로그인한 기기만.
   받아 둔 음원은 blob: 주소로 들고 있다가 알림이 울릴 때 기다림 없이 바로 틀어요. */
var H50_SOUND_PATH = 'assets/sounds/hawaii.mp3';
var H50_SOUND_MAX = 1024 * 1024;          /* 1MB가 넘으면 받지 않아요 (지금 파일은 약 244KB) */
var H50_PACK_TTL = 6 * 60 * 60 * 1000;    /* 6시간마다 한 번 새로 받아 와요 */
var h50Pack = { url: '', at: 0, loading: false, tries: 0 };

function b64ToBytes(b64) {
  var s = String(b64 || '').replace(/\s/g, '');
  if (!s) return null;
  var bin;
  try { bin = window.atob(s); } catch (e) { return null; }
  var out = new Uint8Array(bin.length), i;
  for (i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function loadSoundPack(force) {
  if (!cloud.conn || !cloud.me) return false;          /* 로그인한 기기만 받아요 */
  if (h50Pack.loading || !window.fetch || !window.Blob || !window.Uint8Array) return false;
  if (!window.URL || !window.URL.createObjectURL) return false;
  if (!force && h50Pack.url && (Date.now() - h50Pack.at) < H50_PACK_TTL) return false;
  h50Pack.loading = true;
  h50Pack.tries = Date.now();
  try {
    var branch = (cloud.conn && cloud.conn.branch) || 'main';
    var res = await window.fetch(ghBase() + '/contents/' + H50_SOUND_PATH + '?ref=' + encodeURIComponent(branch),
      { headers: ghHeaders(), cache: 'no-store' });
    if (!res.ok) return false;
    var j = await res.json();
    if (!j || !j.content) return false;
    if (j.size && Number(j.size) > H50_SOUND_MAX) return false;
    var bytes = b64ToBytes(j.content);
    if (!bytes || bytes.length < 2048 || bytes.length > H50_SOUND_MAX) return false;
    var old = h50Pack.url;
    h50Pack.url = window.URL.createObjectURL(new window.Blob([bytes], { type: 'audio/mpeg' }));
    h50Pack.at = Date.now();
    /* 예전 주소는 지금 트는 소리가 그 주소가 아닐 때만 정리해요 */
    if (old && old !== h50Pack.url && (!h50AudioEl || String(h50AudioEl.src || '') !== old)) {
      try { window.URL.revokeObjectURL(old); } catch (e) { /* 무시 */ }
    }
    try { document.documentElement.setAttribute('data-h50-pack', 'ready'); } catch (e) { /* 무시 */ }
    return true;
  } catch (e) {
    return false;
  } finally {
    h50Pack.loading = false;
  }
}

/* 이 소리는 진짜 음원(주소)으로 트나요? 내 알림음이 같은 id를 쓰면 그쪽이 먼저예요 */
function alertSoundRemote(id) {
  if (!id || !H50_REMOTE[id]) return '';
  if (customAlertSound(id)) return '';
  return H50_REMOTE[id];
}

/* 알림음 재생 주소 — 내 알림음은 올린 소리·주소 그대로,
   하와이는 받아 둔 원본 음원 → 아직 준비 전이면 바로 내장 .wav, 나머지는 Blob .wav */
function alertSoundSrc(id) {
  var c = customAlertSound(id);
  if (c && c.src) return String(c.src);
  if (H50_REMOTE[id]) {
    if (h50Pack.url) return h50Pack.url;      /* 받아 둔 진짜 음원 — 기다림 없이 바로 */
    var wav = alertWavUrl(id);
    if (wav) return wav;                      /* 아직 안 받았으면 내장 소리로 바로 (터치 타이밍을 지켜요) */
    return H50_REMOTE[id];
  }
  return alertWavUrl(id);
}

/* 알림음은 끝까지 재생해요 — 인위적으로 끊는 시간(maxMs)은 두지 않아요.
   미리 듣기·🎵 알림 소리·10분 전 알림 모두 소리가 다 끝날 때(ended)까지 울려요. */
function alertSoundMaxMs(id) {
  return 0;              /* 0 = 시간 제한 없음 (소리가 끝날 때까지) */
}

var h50AudioEl = null, h50AudioOn = false, h50AudioStop = 0;
var h50Want = null;      /* 지금 트는 소리 — 주소가 안 되면 .wav로 바꿔 트는 데 써요 */
var h50Try = 0;
var chimeAudioEl = null;

function makeAudioEl() {
  if (!window.Audio) return null;
  var el = new Audio();
  try { el.preload = 'auto'; } catch (e) { /* 무시 */ }
  try { el.setAttribute('playsinline', ''); } catch (e) { /* 무시 */ }
  return el;
}

function h50Audio() {
  if (!h50AudioEl) {
    h50AudioEl = makeAudioEl();
    if (h50AudioEl) {
      h50AudioEl.addEventListener('ended', function () {
        if (h50AudioEl.loop) return;
        h50AudioOn = false;
        h50Want = null;
        /* 끝까지 다 울렸어요 (멈춤은 currentTime 0, 끝까지 울린 건 끝 위치에 머물러요) */
        try { document.documentElement.setAttribute('data-h50-play', 'stopped'); } catch (e) { /* 무시 */ }
        if (!h50.on) h50SetState('off');
      });
      h50AudioEl.addEventListener('loadedmetadata', function () {
        try { document.documentElement.setAttribute('data-h50-dur', String(Math.round(h50AudioEl.duration * 10) / 10)); } catch (e) { /* 무시 */ }
      });
      h50AudioEl.addEventListener('error', function () {
        /* 진짜 음원(MP3)이 안 열리면 직접 만든 .wav로 이어서 틀어요 */
        if (h50Want && h50Want.canFallback && h50AudioOn) { h50PlayFallback(h50Want); return; }
        h50AudioOn = false;
        h50Want = null;
        if (!h50.on) h50SetState('off');
      });
    }
  }
  return h50AudioEl;
}

/* 점검용 읽기 전용 상태 (화면에는 안 보여요) */
try {
  document.documentElement.h50Status = function () {
    var el = h50AudioEl;
    return {
      src: el ? String(el.src || '') : '', paused: el ? !!el.paused : true,
      currentTime: el ? Number(el.currentTime || 0) : 0, loop: el ? !!el.loop : false,
      duration: el ? Number(el.duration || 0) : 0, on: h50AudioOn,
      pcm: h50BufPlaying(), pcmId: h50Buf.id || ''
    };
  };
  /* 점검용: 소리 멈추기 (화면에는 안 보여요) */
  document.documentElement.h50Stop = function () { stopTargetMelody(); };
} catch (e) { /* 무시 */ }

function h50MarkFallback(v) {
  try {
    if (v) document.documentElement.setAttribute('data-h50-fallback', 'wav');
    else document.documentElement.removeAttribute('data-h50-fallback');
  } catch (e) { /* 무시 */ }
}

/* 지금 트는 소리가 무엇인지 화면 속성으로 남겨 둬요 (점검·시험용) */
function h50Stamp(id, src) {
  try {
    var d = document.documentElement, s = String(src), kind;
    if (h50Pack.url && s === h50Pack.url) kind = 'mp3';
    else if (s.indexOf('blob:') === 0) kind = 'wav';
    else if (s === alertSoundRemote(id)) kind = 'mp3';
    else kind = 'url';
    d.setAttribute('data-h50-play', 'playing');
    d.setAttribute('data-h50-sound', id);
    d.setAttribute('data-h50-src', s);
    d.setAttribute('data-h50-source', kind);
    if (kind === 'wav') d.setAttribute('data-h50-wav', s); else d.removeAttribute('data-h50-wav');
    if (kind === 'mp3') d.setAttribute('data-h50-mp3', s); else d.removeAttribute('data-h50-mp3');
  } catch (e) { /* 무시 */ }
}

function chimeAudio() {
  if (!chimeAudioEl) {
    chimeAudioEl = makeAudioEl();
    if (chimeAudioEl) {
      chimeAudioEl.addEventListener('playing', function () {
        try { document.documentElement.setAttribute('data-h50-chime-play', 'playing'); } catch (e) { /* 무시 */ }
      });
      chimeAudioEl.addEventListener('ended', function () {
        try { document.documentElement.setAttribute('data-h50-chime-play', 'stopped'); } catch (e) { /* 무시 */ }
      });
    }
  }
  return chimeAudioEl;
}

/* 일과표 알림 소리 멈추기 (다른 소리를 들려줄 때 겹치지 않게) */
function stopChimeSound() {
  var el = chimeAudioEl;
  if (!el) return;
  try { el.pause(); el.currentTime = 0; } catch (e) { /* 무시 */ }
  try { document.documentElement.setAttribute('data-h50-chime-play', 'stopped'); } catch (e) { /* 무시 */ }
}

/* 점검용 읽기 전용 상태 (화면에는 안 보여요) */
try {
  document.documentElement.h50ChimeStatus = function () {
    var el = chimeAudioEl;
    return {
      src: el ? String(el.src || '') : '', paused: el ? !!el.paused : true,
      currentTime: el ? Number(el.currentTime || 0) : 0,
      duration: el ? Number(el.duration || 0) : 0,
      play: document.documentElement.getAttribute('data-h50-chime-play') || ''
    };
  };
} catch (e) { /* 무시 */ }

function playWav(el, src, loop) {
  if (!el || !src) return null;
  try {
    if (el.getAttribute('src') !== src) el.src = src;
    el.loop = !!loop;
    try { el.currentTime = 0; } catch (e0) { /* 아직 준비 전이면 그냥 재생 */ }
    return el.play();
  } catch (e) { return null; }
}

function h50ArmStop(want) {
  if (h50AudioStop) { window.clearTimeout(h50AudioStop); h50AudioStop = 0; }
  if (!want || !want.maxMs) return;
  h50AudioStop = window.setTimeout(function () {
    h50AudioStop = 0;
    if (!tamOpen) stopWavMelody();
  }, want.maxMs);
}

/* .wav/MP3 재생 → 아예 못 틀면 false (부르는 쪽이 신시사이저로 넘어가요)
   · 주소(MP3)로 트는 소리는 실패하면 직접 만든 .wav로 한 번 더 시도해요
   · <audio> 가 막히면(자동재생 제한) 깨어 있는 AudioContext 로 같은 소리를 PCM 재생해요 */
function h50PlayWav(loop, maxMs, id) {
  id = id || alertSoundId();
  var el = h50Audio(), src = alertSoundSrc(id), wav = alertWavUrl(id);
  /* 진짜 음원(blob MP3·올린 소리)이 안 열리면 내장 .wav로 이어서 틀어요.
     이미 .wav로 트는 중이면 같은 소리를 또 대체하지 않아요. */
  var want = { id: id, loop: !!loop, maxMs: maxMs || 0, canFallback: !!(wav && src !== wav), no: ++h50Try };
  if (!el || !src) return h50PlayPcm(want);      /* <audio> 자체가 없으면 Web Audio 로 */
  if (h50AudioStop) { window.clearTimeout(h50AudioStop); h50AudioStop = 0; }
  h50Want = want;
  h50MarkFallback(false);
  var p = playWav(el, src, loop);
  if (p === null) return want.canFallback ? h50PlayFallback(want) : h50PlayPcm(want);
  h50AudioOn = true;
  h50SetState('on');
  h50Stamp(id, src);
  if (p && p.then) {
    p.then(function () {
      try { document.documentElement.setAttribute('data-h50-play', 'playing'); } catch (e) { /* 무시 */ }
    }, function () {
      if (h50Want !== want) return;                     /* 이미 다른 소리를 트는 중 */
      if (want.canFallback) { h50PlayFallback(want); return; }
      h50Want = null;
      h50AudioOn = false;
      try { document.documentElement.setAttribute('data-h50-play', 'blocked'); } catch (e) { /* 무시 */ }
      if (h50PlayPcm(want)) return;                     /* 고른 소리를 Web Audio 로 */
      if (!h50.on) h50Start();
    });
  }
  h50ArmStop(want);
  return true;
}

/* 진짜 음원(MP3)이 안 될 때 — 직접 만든 .wav로 이어서 틀어요. 그것도 안 되면 PCM → 신시사이저.
   (아이폰 무음 스위치에서도 들리는 쪽은 여전히 <audio>예요) */
function h50PlayFallback(want) {
  var id = want.id, el = h50Audio(), wav = alertWavUrl(id);
  var next = { id: id, loop: want.loop, maxMs: want.maxMs, canFallback: false, no: ++h50Try };
  h50Want = next;
  h50MarkFallback(true);
  if (!el || !wav) return h50PlayPcm(next);
  if (h50AudioStop) { window.clearTimeout(h50AudioStop); h50AudioStop = 0; }
  try { el.pause(); } catch (e) { /* 무시 */ }
  var p = playWav(el, wav, next.loop);
  h50AudioOn = true;
  h50SetState('on');
  h50Stamp(id, wav);
  if (p && p.then) {
    p.then(function () {
      try { document.documentElement.setAttribute('data-h50-play', 'playing'); } catch (e) { /* 무시 */ }
    }, function () {
      if (h50Want !== next) return;
      h50Want = null;
      h50AudioOn = false;
      try { document.documentElement.setAttribute('data-h50-play', 'blocked'); } catch (e) { /* 무시 */ }
      if (h50PlayPcm(next)) return;
      if (!h50.on) h50Start();
    });
  }
  h50ArmStop(next);
  return true;
}

function stopWavMelody() {
  if (h50AudioStop) { window.clearTimeout(h50AudioStop); h50AudioStop = 0; }
  h50AudioOn = false;
  h50Want = null;
  h50BufStop();
  var el = h50AudioEl;
  if (el) {
    try { el.pause(); } catch (e) { /* 무시 */ }
    try { el.currentTime = 0; } catch (e) { /* 무시 */ }
    try { el.loop = false; } catch (e) { /* 무시 */ }
  }
  try { document.documentElement.setAttribute('data-h50-play', 'stopped'); } catch (e) { /* 무시 */ }
}

function melodyPlaying() { return h50AudioOn || h50.on; }

/* 알림 멜로디 재생 — 1순위 .wav/올린 소리, 2순위 Web Audio PCM, 3순위 신시사이저 */
function playTargetMelody(loop, maxMs, id) {
  id = id || (tamOpen ? tamSoundId : '') || alertSoundId();
  if (h50PlayWav(loop, maxMs, id)) return true;
  if (h50PlayPcm({ id: id, loop: !!loop, maxMs: maxMs || 0, canFallback: false, no: ++h50Try })) return true;
  return h50Start();
}

/* 알림 멜로디 정지 — <audio>·신시사이저·일과표 알림 소리까지 모두 멈춰요 */
function stopTargetMelody() {
  stopWavMelody();
  stopChimeSound();
  h50Stop();
  try { updateSoundUi(); } catch (e) { /* 무시 */ }
}

/* 진입·첫 터치에 소리를 몰래 틀지 않아요 (예전엔 muted 로 한 번 틀어 봤지만,
   아이폰 사파리에서 소리가 새어 나올 수 있어 아예 없앴어요).
   소리가 막힌 알림창에서는 화면을 누를 때 아래 pointerdown 이 다시 틀어 줘요. */
function preloadTargetMelody() {
  try {
    if (!alertWavCache[alertSoundId()]) alertWavUrl(alertSoundId());
  } catch (e) { /* 무시 */ }
  /* 원본 음원은 처음 한 번만 받아 둬요 (터치할 때마다 요청하지 않게 1분 간격) */
  try {
    if (!h50Pack.url && (Date.now() - h50Pack.tries) > 60000) loadSoundPack();
  } catch (e) { /* 무시 */ }
}

/* 하루 일과표 알림은 소리를 내지 않아요 (checkScheduleAlerts → showNotify 는 화면 안 알림만).
   알림 소리는 루틴 '목표시간' 30분·10분 전 알림과 🎵 미리 듣기에서만 울려요. */

/* 미리 듣기 — 고른 소리를 한 번 끝까지 들려줘요 (다시 누르면 처음부터) */
function previewAlertSound(id) {
  id = id || alertSoundId();
  stopWavMelody();
  stopChimeSound();
  if (!h50PlayWav(false, alertSoundMaxMs(id), id)) {
    showToast('🔔 소리를 들려드리지 못했어요. 화면을 한 번 누른 뒤 다시 눌러 주세요.');
    return false;
  }
  showToast('🎵 ' + alertSoundName(id) + ' 알림 소리를 들려드려요!');
  updateSoundUi();
  return true;
}

/* 하루 일과표의 🎵 알림 소리 — 지금 고른 소리로 */
function h50Test() {
  if (!can('edit')) return;
  previewAlertSound(alertSoundId());
}

/* 🔇 알림 끄기 — 울리는 소리를 바로 멈춰요 */
function stopAlertSoundByUser() {
  stopTargetMelody();
  updateSoundUi();
  showToast('🔇 알림 소리를 껐어요.');
}

/* 🎵 알림 소리 · ▶ 미리 듣기 — 울리는 중이면 바로 끄고, 멈춰 있으면 들려줘요 */
function toggleAlertSoundTest() {
  if (alertSoundPlaying()) { stopAlertSoundByUser(); return; }
  h50Test();
  updateSoundUi();
}

/* 소리가 막혀 있으면 알림창을 누를 때 다시 켜고, 처음엔 .wav를 미리 만들어 둬요.
   (진입·첫 터치에 소리를 미리 틀지 않아요 — 그 순간 소리가 새어 나오면 안 되니까요) */
document.addEventListener('pointerdown', function () {
  if (tamOpen && !melodyPlaying()) { playTargetMelody(true, 0); return; }
  preloadTargetMelody();
}, { capture: true, passive: true });

/* 🔇 알림 끄기 / 🎵 버튼 상태 — 소리가 울리는 동안만 루틴 머리에 버튼이 보이고,
   🎵 알림 소리·▶ 미리 듣기는 ⏹ 알림음 끄기로 바뀌어요. */
function chimeSoundPlaying() {
  var el = chimeAudioEl;
  if (!el || el.paused) return false;
  return Number(el.currentTime || 0) > 0;
}
function alertSoundPlaying() { return !!(h50AudioOn || h50.on || chimeSoundPlaying()); }

function soundUiNames() { return alertSoundName(alertSoundId()).replace(/^\S+\s/, ''); }

function updateSoundUi() {
  var playing = alertSoundPlaying();
  try { document.documentElement.setAttribute('data-alert-sound', playing ? 'on' : 'off'); } catch (e) { /* 무시 */ }
  var mutes = document.querySelectorAll('[data-act="alert-mute"]');
  for (var i = 0; i < mutes.length; i++) {
    mutes[i].hidden = !playing;
    mutes[i].setAttribute('aria-pressed', playing ? 'true' : 'false');
  }
  var tests = document.querySelectorAll('[data-act="target-sound-test"], [data-act="alert-sound-test"]');
  for (var k = 0; k < tests.length; k++) {
    var b = tests[k];
    b.setAttribute('aria-pressed', playing ? 'true' : 'false');
    if (playing) b.classList.add('stop'); else b.classList.remove('stop');
    if (b.getAttribute('data-act') === 'target-sound-test') {
      b.textContent = playing ? '⏹ 알림음 끄기' : '🎵 알림 소리';
      b.setAttribute('aria-label', playing ? '울리는 알림음 끄기' : '목표 시간 알림 소리 미리 듣기');
    } else {
      b.textContent = playing ? '⏹ 알림음 끄기' : '▶ 미리 듣기 · ' + soundUiNames();
      b.setAttribute('aria-label', playing ? '울리는 알림음 끄기' : '알림 소리 미리 듣기');
    }
  }
}
