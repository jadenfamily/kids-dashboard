/* ============================================================================
   Jaden's Today v2 — js/ui.js
   전체 렌더 · DIY 섹션/블록 그리기 · 카드 배치·드래그·크기 조절
   · 원본 index.html(운영본)의 같은 코드를 기능별로 나눈 파일입니다. 동작은 원본과 같아요.
   · 모듈끼리 같은 전역 스코프를 써요. index.html 에서 core → sync → ... 순서로 불러옵니다.
   ============================================================================ */
'use strict';

/* ============ 전체 렌더 ============ */
function renderAll() {
  try { applyVars(); } catch (e) { /* 무시 */ }
  renderHeader();
  renderWeather();
  renderSections();
  renderSectionTitles();
  renderRoutine();
  renderStickers();
  renderPet();
  renderTodayAcademy();
  renderWeek();
  renderTargetBars();
  renderNoticeBlocks();
  renderMissions();
  renderRoles();
  renderEditPanel();
  applyLayoutOrder();
}

/* ============ DIY 섹션 · 블록 그리기 ============ */
function secList() {
  if (!state.settings) state.settings = {};
  var list = state.settings.dashboardSections;
  if (Object.prototype.toString.call(list) !== '[object Array]' || !list.length) {
    state.settings.dashboardSections = defaultSections();
  }
  return state.settings.dashboardSections;
}

function findSec(id) {
  var list = secList();
  for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
  return null;
}

function findBlk(bid) {
  var list = secList();
  for (var i = 0; i < list.length; i++) {
    var blocks = list[i].blocks || [];
    for (var k = 0; k < blocks.length; k++) {
      if (blocks[k].id === bid) return { sec: list[i], secIdx: i, blk: blocks[k], blkIdx: k };
    }
  }
  return null;
}

function catTitleOf(id) {
  var c = findCat(id);
  return c ? (c.emoji ? c.emoji + ' ' : '') + (c.title || '루틴') : '';
}

function blockLabelOf(blk) {
  var base = (BLOCK_ICON[blk.type] || '🧩') + ' ' + (BLOCK_LABEL[blk.type] || blk.type);
  if ((blk.type === 'routine' || blk.type === 'target_bar') && blk.group) {
    var nm = catTitleOf(blk.group);
    if (nm) base += ' · ' + nm;
  }
  if (blk.type === 'notice_board' && blk.title) base += ' · ' + blk.title;
  return base;
}

/* ---- 섹션/블록 설정 바꾸기 ---- */
function afterSectionsChanged(opt) {
  /* 빈칸을 자동으로 메우지 않도록, 줄·칸을 정리만 하고 저장해요 */
  state.settings.dashboardSections = applySectionRows(state.settings.dashboardSections || []);
  syncSectionMirrors(state);
  saveState();
  /* 인라인 편집 중이면 그 카드만 다시 그려 포커스·스크롤을 지켜요 */
  if (!refreshInlineSec()) renderSections();
  renderEditPanel();
  if (opt && opt.focusSel) {
    var el = document.querySelector(opt.focusSel);
    if (el) { try { el.focus(); if (el.select) el.select(); } catch (e) { /* 무시 */ } }
  }
}

function moveSection(id, dir) {
  if (!can('edit')) return;
  var list = secList();
  var idx = -1;
  for (var i = 0; i < list.length; i++) if (list[i].id === id) idx = i;
  if (idx < 0) return;
  var to = idx + dir;
  if (to < 0 || to >= list.length) return;
  /* 이웃 카드와 자리(줄·칸)를 맞바꿔요 — 반 폭·전체 폭이 섞여도 그 자리에 들어가요 */
  var a = list[idx], b = list[to];
  var ar = a.row, ac = a.col;
  a.row = b.row; a.col = b.col;
  b.row = ar; b.col = ac;
  afterSectionsChanged();
}

function addSection() {
  if (!can('edit')) return;
  var list = secList();
  if (list.length >= SEC_MAX) { showToast('섹션은 ' + SEC_MAX + '개까지 만들 수 있어요.'); return; }
  var id = 'sec-' + uid('');
  list.push({
    id: id, base: '', emoji: '🧩', title: '새 섹션', width: 'half', row: null, col: '', hidden: false,
    blocks: [{ id: uid('blk'), type: 'notice_board', group: '', title: '오늘의 한마디', emoji: '💬', text: '' }]
  });
  afterSectionsChanged({ focusSel: 'input[data-field="diySecTitle"][data-sec="' + id + '"]' });
  showToast('새 섹션을 만들었어요. 블록을 넣어 꾸며 보세요!');
}

/* 한마디 카드 안의 '＋ 새 한마디 카드 추가' —
   ⚙️ 전체 설정 → 📐 화면 배치 켜기까지 가지 않아도 한마디 카드를 하나 더 만들 수 있어요.
   지금 카드 바로 아랫줄에 넣고, 새 카드를 그 자리에서 ✏️ 편집으로 열어 둬요. */
function addNoticeSection(afterSecId) {
  if (!can('edit')) return;
  var list = secList();
  if (list.length >= SEC_MAX) { showToast('카드는 ' + SEC_MAX + '개까지 만들 수 있어요.'); return; }
  applySectionRows(list);            /* 예전 배치라 줄·칸이 비어 있으면 먼저 채워요 */
  var cur = findSec(afterSecId || '');
  var baseRow = -1;
  if (cur && typeof cur.row === 'number' && isFinite(cur.row)) baseRow = Math.floor(cur.row);
  else {
    /* 기준 카드를 못 찾으면 맨 아래 줄 뒤에 붙여요 */
    for (var r0 = 0; r0 < list.length; r0++) {
      if (typeof list[r0].row === 'number' && isFinite(list[r0].row) && Math.floor(list[r0].row) > baseRow) baseRow = Math.floor(list[r0].row);
    }
  }
  /* 새 카드가 들어갈 줄을 비우려고, 그 아래 카드는 한 줄씩 내려요 */
  for (var i = 0; i < list.length; i++) {
    if (typeof list[i].row === 'number' && isFinite(list[i].row) && Math.floor(list[i].row) > baseRow) {
      list[i].row = Math.floor(list[i].row) + 1;
      list[i].col = normColOf(list[i].col);
    }
  }
  var id = 'sec-' + uid('');
  var sec = {
    id: id, base: '', emoji: '💬', title: '한마디', width: 'half', w: 'half', wPx: 0, row: baseRow + 1, col: 'left', hidden: false,
    blocks: [{ id: uid('blk'), type: 'notice_board', group: '', title: '오늘의 한마디', emoji: '💬', text: '' }]
  };
  /* 지금 카드 바로 뒤 자리에 넣어요 */
  var at = list.length;
  if (cur) { for (i = 0; i < list.length; i++) if (list[i] === cur) { at = i + 1; break; } }
  list.splice(at, 0, sec);
  ui.inlineEditSecId = id;           /* 새 카드를 바로 고칠 수 있게 열어 둬요 */
  state.settings.dashboardSections = applySectionRows(list);
  syncSectionMirrors(state);
  saveAndPush();
  renderSections();
  /* ⚙️ 전체 설정을 닫힌 상태로 그리는 renderEditPanel 은 인라인 편집 표시를 지우니 부르지 않아요 */
  try {
    var el = document.querySelector('#sections .sec[data-sec="' + id + '"]');
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center' });
    /* 제목 칸에 바로 커서를 놓아요 — 누르자마자 한마디를 적을 수 있게요 */
    var t = document.querySelector('#sections .sec[data-sec="' + id + '"] [data-field="diyNbTitle"]');
    if (t) { t.focus(); if (t.select) t.select(); }
  } catch (e) { /* 무시 */ }
  showToast('💬 새 한마디 카드를 만들었어요. 제목·문구를 적고 💾 저장을 누르면 가족 기기에도 보여요.');
}

function deleteSection(id) {
  if (!can('edit')) return;
  var sec = findSec(id);
  if (!sec) return;
  if (sec.base) { showToast('기본 섹션은 지우지 않고 숨길 수 있어요.'); return; }
  if (!window.confirm('"' + (sec.title || '섹션') + '" 섹션을 지울까요?\n안에 넣은 블록도 함께 사라져요. (체크·스티커 기록은 그대로예요)')) return;
  if (ui.inlineEditSecId === id) ui.inlineEditSecId = '';
  var list = secList();
  for (var i = 0; i < list.length; i++) if (list[i].id === id) { list.splice(i, 1); break; }
  afterSectionsChanged();
}

function toggleSectionHidden(id) {
  if (!can('edit')) return;
  var sec = findSec(id);
  if (!sec) return;
  sec.hidden = !sec.hidden;
  /* 숨긴 카드는 보이지 않으니 인라인 편집도 함께 닫아요 */
  if (sec.hidden && ui.inlineEditSecId === id) ui.inlineEditSecId = '';
  afterSectionsChanged();
}

function setSectionWidth(id, w) {
  if (!can('edit')) return;
  var sec = findSec(id);
  if (!sec) return;
  var wasFull = sec.width === 'full';
  if (w === 'third' || w === 'custom') {
    var cw = 0;
    try { cw = (document.getElementById('sections') || {}).clientWidth || 0; } catch (e) { /* 무시 */ }
    if (!cw) cw = Math.max(720, window.innerWidth - 48);
    var px = Math.max(SEC_W_MIN, Math.round((cw - 48) / 3));   /* 카드 사이 여백까지 빼고 3장이 한 줄에 */
    sec.width = 'custom';
    sec.w = 'custom';
    /* 이미 자유 폭이면 그 폭을 그대로 두고, 아니면 1/3 폭부터 시작해요 */
    sec.wPx = (w === 'custom' && Math.round(Number(sec.wPx) || 0) >= SEC_W_MIN) ? Math.round(sec.wPx) : px;
  } else {
    sec.width = (w === 'full') ? 'full' : 'half';
    sec.w = sec.width;
    sec.wPx = 0;
    if (wasFull && sec.width === 'half') secPlaceHalf(sec);
  }
  afterSectionsChanged();
  try { renderStickers(); renderWeek(); } catch (e2) { /* 무시 */ }
  try { pushNow(); } catch (e1) { /* 무시 */ }
  showToast(sec.width === 'custom'
    ? '↔ 가로 폭을 ' + sec.wPx + 'px 로 맞췄어요. 좁은 카드를 한 줄에 3장까지 놓을 수 있어요.'
    : (sec.width === 'full' ? '↔ 전체 폭이에요.' : '↔ 반 폭이에요.'));
}

/* 전체 폭 카드를 반 폭으로 돌렸을 때 — 바로 윗줄·아랫줄에 빈 칸이 있으면 그 옆자리로 가요.
   자동으로 빈칸을 메우는 게 아니라, 사람이 폭을 바꾼 그 카드만 제자리를 찾는 것이에요. */
function secPlaceHalf(sec) {
  var list = secList();
  var i, mates = 0;
  for (i = 0; i < list.length; i++) {
    if (list[i] === sec || list[i].width === 'full') continue;
    if (list[i].row === sec.row) mates++;
  }
  if (mates) return;
  var cands = [sec.row + 1, sec.row - 1];
  for (var ci = 0; ci < cands.length; ci++) {
    var row = cands[ci], hasL = false, hasR = false, hasFull = false, n = 0;
    if (row < 0) continue;
    for (i = 0; i < list.length; i++) {
      var o = list[i];
      if (o === sec || o.row !== row) continue;
      n++;
      if (o.width === 'full') hasFull = true;
      else if (normColOf(o.col) === 'right') hasR = true;
      else hasL = true;
    }
    if (!n || hasFull || (hasL && hasR)) continue;
    sec.row = row;
    sec.col = hasL ? 'right' : 'left';
    return;
  }
  sec.col = 'left';
}

function setSectionEmoji(id, v) {
  if (!can('edit')) return;
  var sec = findSec(id);
  if (!sec) return;
  sec.emoji = String(v == null ? '' : v).trim().slice(0, 4) || '🧩';
  syncSectionMirrors(state);
  saveState();
  syncSectionTitleNode(sec);
  syncSecInputs(sec);
}

function setSectionTitle(id, value) {
  if (!can('edit')) return;
  var sec = findSec(id);
  if (!sec) return;
  var v = String(value == null ? '' : value).replace(/\s+/g, ' ').trim().slice(0, 16);
  sec.title = v || (sec.base ? SEC_NAMES[sec.base] : '새 섹션');
  syncSectionMirrors(state);
  saveState();
  syncSectionTitleNode(sec);
  syncSecInputs(sec);
}

/* 제목·아이콘 입력칸(카드 안·편집 패널)을 서로 맞춰 줘요 — 입력 중인 칸은 건드리지 않습니다 */
function syncSecInputs(sec) {
  var fields = [['secTitle', sec.title || ''], ['diySecTitle', sec.title || '']];
  for (var i = 0; i < fields.length; i++) {
    var nodes = document.querySelectorAll('[data-field="' + fields[i][0] + '"][data-sec="' + sec.id + '"]');
    for (var k = 0; k < nodes.length; k++) {
      if (nodes[k] !== document.activeElement) nodes[k].value = fields[i][1];
    }
  }
  var emos = document.querySelectorAll('[data-field="secEmoji"][data-sec="' + sec.id + '"], [data-field="diySecEmoji"][data-sec="' + sec.id + '"]');
  for (var j = 0; j < emos.length; j++) {
    if (emos[j] !== document.activeElement) emos[j].value = sec.emoji || '';
  }
  var hideBtns = document.querySelectorAll('[data-act="diy-sec-hide"][data-sec="' + sec.id + '"]');
  for (var b = 0; b < hideBtns.length; b++) {
    hideBtns[b].setAttribute('aria-pressed', sec.hidden ? 'true' : 'false');
    hideBtns[b].classList.toggle('on', !!sec.hidden);
  }
}

/* ---- 블록 넣기/옮기기/빼기 ---- */
function addBlock(secId, type) {
  if (!can('edit')) return;
  if (BLOCK_ORDER.indexOf(type) < 0) return;
  var sec = findSec(secId);
  if (!sec) return;
  sec.blocks = sec.blocks || [];
  if (sec.blocks.length >= BLOCK_MAX_PER_SEC) {
    showToast('한 섹션에는 블록을 ' + BLOCK_MAX_PER_SEC + '개까지 넣을 수 있어요.');
    return;
  }
  var blk = { id: uid('blk'), type: type, group: '' };
  if (type === 'notice_board') { blk.title = '오늘의 한마디'; blk.emoji = '💬'; blk.text = ''; }
  sec.blocks.push(blk);
  afterSectionsChanged();
  showToast(BLOCK_ICON[type] + ' ' + BLOCK_LABEL[type] + ' 블록을 넣었어요.');
}

function deleteBlock(bid) {
  if (!can('edit')) return;
  var f = findBlk(bid);
  if (!f) return;
  f.sec.blocks.splice(f.blkIdx, 1);
  afterSectionsChanged();
}

function moveBlock(bid, dir) {
  if (!can('edit')) return;
  var f = findBlk(bid);
  if (!f) return;
  var to = f.blkIdx + dir;
  if (to < 0 || to >= f.sec.blocks.length) return;
  var moved = f.sec.blocks.splice(f.blkIdx, 1)[0];
  f.sec.blocks.splice(to, 0, moved);
  afterSectionsChanged();
}

function setBlockGroup(bid, group) {
  if (!can('edit')) return;
  var f = findBlk(bid);
  if (!f) return;
  if (f.blk.type !== 'routine' && f.blk.type !== 'target_bar') return;
  f.blk.group = (group && findCat(group)) ? group : '';
  afterSectionsChanged();
}

function setNoticeField(bid, field, value) {
  if (!can('edit')) return;
  var f = findBlk(bid);
  if (!f || f.blk.type !== 'notice_board') return;
  if (field === 'title') f.blk.title = String(value || '').replace(/\s+/g, ' ').trim().slice(0, 24) || '오늘의 한마디';
  else if (field === 'emoji') f.blk.emoji = String(value || '').trim().slice(0, 4) || '💬';
  else if (field === 'text') f.blk.text = String(value || '').slice(0, 400);
  saveState();
  paintNotice(f.blk);
}

/* 게시판 제목·문구만 그 자리에서 바꿔요 (입력 중 포커스가 튀지 않게) */
function paintNotice(blk) {
  var root = document.querySelector('[data-block="' + blk.id + '"]');
  if (!root) return;
  var t = root.querySelector('.nb-title');
  if (t) t.innerHTML = '<span aria-hidden="true">' + esc(blk.emoji || '💬') + '</span> ' + esc(blk.title || '오늘의 한마디');
  var tx = root.querySelector('.nb-text');
  if (tx) {
    tx.textContent = blk.text || (ui.layout ? '✏️ 쓰기를 눌러 한마디를 남겨 보세요.' : '오늘의 한마디가 아직 없어요 🌤️');
    if (blk.text) tx.classList.remove('empty'); else tx.classList.add('empty');
  }
  var tag = root.querySelector('.blk-tag');
  if (tag) tag.textContent = blockLabelOf(blk);
}

/* ---- 섹션 제목(편집 중이면 입력칸) ---- */
function secTitleOf(id) {
  var sec = findSec(id);
  if (sec) return sec.title || (sec.base ? SEC_NAMES[sec.base] : '섹션');
  return SEC_NAMES[id] || id;
}

function sectionTitleInnerHtml(sec) {
  /* 제목·아이콘은 카드의 ✏️ 상세 팝업에서 바꿔요 (평소 카드 모양은 그대로) */
  return '<span class="sec-emo" aria-hidden="true">' + esc(sec.emoji || '') + '</span><span class="sec-name">' + esc(sec.title || '') + '</span>';
}

function syncSectionTitleNode(sec) {
  /* 인라인 편집 중인 카드는 제목 입력칸을 쓰고 있어요 */
  if (ui.inlineEditSecId === sec.id) return;
  var el = document.getElementById('secTitle-' + sec.id);
  if (!el) return;
  el.innerHTML = '<span class="sec-emo" aria-hidden="true">' + esc(sec.emoji || '') + '</span><span class="sec-name">' + esc(sec.title || '') + '</span>';
}

function renderSectionTitles() {
  var list = secList();
  for (var i = 0; i < list.length; i++) {
    var el = document.getElementById('secTitle-' + list[i].id);
    if (!el) continue;
    el.innerHTML = sectionTitleInnerHtml(list[i]);
  }
}

/* ---- 섹션 그리기 ---- */
function visibleSections() {
  var out = [];
  var list = secList();
  for (var i = 0; i < list.length; i++) {
    if (list[i].hidden) continue;
    out.push(list[i]);
  }
  return out;
}

/* ---- 줄·칸 그리기 ----
   데이터의 row·col을 그대로 화면 줄로 옮겨요. 짧은 칸의 남는 자리를 자동으로 메우지 않으므로
   사람이 ⠿로 끌어다 놓은 자리에만 카드가 들어가요. */
/* 자유 폭(custom) 카드가 한 장이라도 있는 줄은 '흘러가는 줄(flow)'이 돼요.
   그 줄은 왼칸·오른칸을 따로 두지 않고 카드 폭만큼 나란히 놓아서,
   3장 이상 좁은 카드도 한 줄에 나란히 들어가요. 나머지 줄은 예전 그대로예요. */
function sectionRowsOf(list) {
  var rows = [];
  var wide = window.innerWidth >= 720;
  if (!wide) {
    /* 폰은 한 줄로 쌓아요 */
    rows.push({ full: false, row: 0, left: list.slice(0), right: [] });
    return rows;
  }
  var cur = null, curRow = null;
  for (var i = 0; i < list.length; i++) {
    var sec = list[i];
    if (sec.width === 'full') {
      rows.push({ full: true, row: sec.row, sec: sec, left: [], right: [] });
      cur = null; curRow = null;
      continue;
    }
    if (!cur || curRow !== sec.row) {
      curRow = sec.row;
      cur = { full: false, row: sec.row, left: [], right: [], flow: false };
      rows.push(cur);
    }
    if (sec.width === 'custom') cur.flow = true;
    if (normColOf(sec.col) === 'right') cur.right.push(sec); else cur.left.push(sec);
  }
  return rows;
}

function layoutSignature(list) {
  var wide = window.innerWidth >= 720;
  var sig = [];
  for (var i = 0; i < list.length; i++) {
    var s = list[i];
    if (!wide) sig.push('M:' + s.id);
    else if (s.width === 'full') sig.push('F:' + s.id);
    else if (s.width === 'custom') sig.push('C' + s.row + ':' + s.id + '@' + Math.round(Number(s.wPx) || 0));
    else sig.push('H' + s.row + normColOf(s.col).charAt(0).toUpperCase() + ':' + s.id);
  }
  return sig.join('|');
}

function applyLayoutOrder() {
  var box = document.getElementById('sections');
  if (!box) return;
  var list = visibleSections();
  if (!list.length) return;
  var sig = layoutSignature(list);
  if (box.getAttribute('data-layout-sig') === sig) return;

  /* 지금 화면에 있는 카드를 그대로 옮겨 담아요 (카드 안 내용과 입력 중인 칸을 다시 그리지 않게) */
  var byId = {};
  var kids = box.querySelectorAll('.sec');
  for (var i = 0; i < kids.length; i++) {
    var sid = kids[i].getAttribute('data-sec');
    if (sid && !byId[sid]) byId[sid] = kids[i];
  }
  var wide = window.innerWidth >= 720;
  var rows = sectionRowsOf(list);
  var frag = document.createDocumentFragment();
  for (var ri = 0; ri < rows.length; ri++) {
    var row = rows[ri];
    var rowEl = document.createElement('div');
    rowEl.setAttribute('data-row', String(row.row));
    if (row.full) {
      rowEl.className = 'sec-row sec-row-full';
      if (byId[row.sec.id]) rowEl.appendChild(byId[row.sec.id]);
    } else if (wide && row.flow) {
      /* 자유 폭 카드가 섞인 줄 — 카드 폭만큼 나란히, 자리가 모자라면 다음 줄로 흘러가요 */
      rowEl.className = 'sec-row sec-row-flow';
      var blocks = row.left.concat(row.right);
      for (var fk = 0; fk < blocks.length; fk++) {
        var fel = byId[blocks[fk].id];
        if (fel) rowEl.appendChild(fel);
      }
    } else {
      rowEl.className = 'sec-row';
      var cols = wide ? ['left', 'right'] : ['left'];
      for (var ci = 0; ci < cols.length; ci++) {
        var colEl = document.createElement('div');
        colEl.className = 'sec-col';
        colEl.setAttribute('data-col', cols[ci]);
        var cards = (cols[ci] === 'right') ? row.right : row.left;
        for (var k = 0; k < cards.length; k++) {
          var el = byId[cards[k].id];
          if (el) colEl.appendChild(el);
        }
        rowEl.appendChild(colEl);
      }
    }
    frag.appendChild(rowEl);
  }
  /* 목록에 없는 카드(끌어서 놓는 자리표시 등)는 맨 끝 칸에 붙여 둬요 */
  var keep = [];
  var all = box.querySelectorAll('.sec');
  for (i = 0; i < all.length; i++) {
    var lid = all[i].getAttribute('data-sec');
    if (lid && byId[lid] === all[i]) continue;
    keep.push(all[i]);
  }
  box.innerHTML = '';
  box.appendChild(frag);
  if (keep.length) {
    var lastRow = box.lastElementChild;
    var target = null;
    if (lastRow && lastRow.classList.contains('sec-row') && !lastRow.classList.contains('sec-row-full')) {
      target = lastRow.querySelector('.sec-col') || (lastRow.classList.contains('sec-row-flow') ? lastRow : null);
    }
    if (!target) target = lastRow;
    for (i = 0; i < keep.length; i++) { if (target) target.appendChild(keep[i]); }
  }
  box.setAttribute('data-layout-sig', sig);
  syncStickerColumns();
}

/* ---- 카드 크기 드래그 (편집 모드의 ↘ 손잡이) ----
   가로로 끌면 반 폭 ↔ 전체 폭, 세로로 끌면 카드 높이가 바뀌고,
   놓는 순간 dashboardSections의 w·h에 저장돼 가족 기기와 함께 맞춰져요. */
var secDrag = null;

function secApplyHeight(card, px) {
  if (!card) return;
  if (px) {
    card.style.height = px + 'px';
    card.classList.add('has-h');
  } else {
    card.style.height = '';
    card.classList.remove('has-h');
  }
}

function secSetWidthLive(card, mode, wpx) {
  if (!card) return;
  var sec = findSec(card.getAttribute('data-sec'));
  if (sec) { sec.width = mode; sec.w = mode; sec.wPx = (mode === 'custom') ? Math.round(wpx) : 0; }
  card.setAttribute('data-width', mode);
  card.classList.toggle('sec-half', mode === 'half');
  card.classList.toggle('sec-full', mode === 'full');
  card.classList.toggle('sec-wpx', mode === 'custom');
  card.classList.toggle('has-wpx', mode === 'custom');
  if (mode === 'custom') {
    card.style.setProperty('--wpx', Math.round(wpx) + 'px');
    card.setAttribute('data-wpx', String(Math.round(wpx)));
  } else {
    card.style.removeProperty('--wpx');
    card.removeAttribute('data-wpx');
  }
  var box = document.getElementById('sections');
  if (box) box.removeAttribute('data-layout-sig');   /* 줄 모양이 바뀌면 다시 배치 */
  applyLayoutOrder();
}

/* 카드 폭 계산 — 끌어온 만큼 자유롭게(px), 절반에 가까우면 반 폭, 끝까지 늘리면 전체 폭 */
function secWidthFromDrag(d, dx) {
  var rowW = d.rowW || 0;
  if (!rowW) rowW = Math.max(320, (document.getElementById('sections') || {}).clientWidth || 0);
  var want = Math.round(d.w0 + dx);
  var gap = d.gap || 16;
  var halfW = Math.round((rowW - gap) / 2);
  var fullAt = rowW - Math.max(28, Math.round(rowW * 0.05));
  if (want >= fullAt) return { mode: 'full', px: 0 };
  if (Math.abs(want - halfW) <= 22) return { mode: 'half', px: 0 };
  if (want < SEC_W_MIN) want = SEC_W_MIN;
  if (want > rowW) want = rowW;
  return { mode: 'custom', px: want };
}

function secResizeMove(ev) {
  var d = secDrag;
  if (!d) return;
  var dx = ev.clientX - d.x0;
  var dy = ev.clientY - d.y0;
  if (Math.abs(dx) > 6 || Math.abs(dy) > 6) d.moved = true;
  if (d.wide && d.canWidth && Math.abs(dx) > 2) {
    var w = secWidthFromDrag(d, dx);
    if (w.mode !== d.width || (w.mode === 'custom' && Math.abs(w.px - (d.wPx || 0)) > 1)) {
      d.width = w.mode;
      d.wPx = w.px;
      secSetWidthLive(d.card, w.mode, w.px);
    }
  }
  var nh = Math.round(d.h0 + dy);
  if (nh < SEC_H_MIN) nh = SEC_H_MIN;
  if (nh > SEC_H_MAX) nh = SEC_H_MAX;
  d.h = nh;
  secApplyHeight(d.card, nh);
}

function secResizeEnd() {
  var d = secDrag;
  secDrag = null;
  document.removeEventListener('pointermove', secResizeMove);
  document.removeEventListener('pointerup', secResizeEnd);
  document.removeEventListener('pointercancel', secResizeEnd);
  if (!d) return;
  if (d.card) d.card.classList.remove('dragging');
  if (!d.moved) return;
  var sec = findSec(d.secId);
  if (!sec) { renderSections(); return; }
  sec.width = (d.width === 'full' || d.width === 'custom') ? d.width : 'half';
  sec.w = sec.width;
  sec.wPx = (sec.width === 'custom') ? Math.max(SEC_W_MIN, Math.round(d.wPx || 0)) : 0;
  sec.h = (d.h >= SEC_H_MIN && d.h <= SEC_H_MAX) ? d.h : 0;
  state.settings.dashboardSections = applySectionRows(secList());
  syncSectionMirrors(state);
  saveAndPush();
  renderSections();
  try { renderStickers(); renderWeek(); } catch (e5) { /* 무시 */ }
  renderEditPanel();
  showToast(sec.width === 'custom'
    ? '↘ 카드 폭을 ' + sec.wPx + 'px 로 맞췄어요. 옆에 작은 카드를 더 놓을 수 있어요.'
    : '↘ 카드 크기를 바꿨어요.');
}

function installSectionResize() {
  document.addEventListener('pointerdown', function (e) {
    var handle = (e.target && e.target.closest) ? e.target.closest('[data-resize]') : null;
    if (!handle || !ui.layout || !can('edit')) return;
    var card = handle.closest('.sec');
    var secId = handle.getAttribute('data-resize');
    if (!card || !secId) return;
    e.preventDefault();
    var rect = card.getBoundingClientRect();
    var sec = findSec(secId);
    var rowEl = card.parentNode;
    var rowW = rect.width;
    var gap = 16;
    try {
      if (rowEl && rowEl.classList && rowEl.classList.contains('sec-row')) {
        rowW = rowEl.getBoundingClientRect().width;
        var cs = window.getComputedStyle(rowEl);
        gap = Math.round(parseFloat(cs.columnGap || cs.gap) || 16);
      }
    } catch (e1) { /* 무시 */ }
    secDrag = {
      secId: secId, card: card, x0: e.clientX, y0: e.clientY,
      h0: rect.height, h: Math.round(rect.height), moved: false,
      wide: window.innerWidth >= 720,
      canWidth: true,
      rowW: rowW, gap: gap, w0: rect.width,
      width: (sec && sec.width === 'custom' && sec.wPx) ? 'custom' : ((sec && sec.width === 'full') ? 'full' : 'half'),
      wPx: (sec && sec.width === 'custom') ? Math.round(sec.wPx) : 0
    };
    card.classList.add('dragging');
    try { handle.setPointerCapture(e.pointerId); } catch (e0) { /* 무시 */ }
    document.addEventListener('pointermove', secResizeMove);
    document.addEventListener('pointerup', secResizeEnd);
    document.addEventListener('pointercancel', secResizeEnd);
  }, { passive: false });
}

/* ---- ✏️ 카드 안 인라인 편집 ----
   편집 모드에서 카드 모서리의 ✏️를 누르면 팝업 대신 그 카드 안에서만 편집해요.
   다른 카드는 평소 프레임 그대로 두고, ✓(또는 ✏️ 다시)를 누르면 닫히며 저장돼요. */
function inlineSecOn(sec) {
  return !!(sec && ui.inlineEditSecId === sec.id && can('edit'));
}

function toggleInlineSec(id) {
  if (!can('edit')) return;
  var sec = findSec(id);
  if (!sec) return;
  var closeIt = (ui.inlineEditSecId === id);
  var card = document.querySelector('#sections .sec[data-sec="' + id + '"]');
  var top0 = card ? card.getBoundingClientRect().top : 0;
  ui.inlineEditSecId = closeIt ? '' : id;
  renderSections();
  /* 카드가 화면에서 보이던 자리를 그대로 지켜요 */
  var now = document.querySelector('#sections .sec[data-sec="' + id + '"]');
  if (card && now) {
    var diff = now.getBoundingClientRect().top - top0;
    if (Math.abs(diff) > 0.5) { try { window.scrollBy(0, diff); } catch (e) { /* 무시 */ } }
  }
  if (!closeIt) {
    showToast('✏️ 이 카드만 고치는 중이에요. 다 고치면 💾 저장을 누르면 바로 가족 기기에도 보여요.');
  } else {
    saveAndPush();
    showToast('💾 저장했어요. 다른 기기에도 바로 보여요.');
  }
}

function closeInlineSec() {
  var id = ui.inlineEditSecId;
  if (!id) return;
  var card = document.querySelector('#sections .sec[data-sec="' + id + '"]');
  var top0 = card ? card.getBoundingClientRect().top : 0;
  ui.inlineEditSecId = '';
  renderSections();
  var now = document.querySelector('#sections .sec[data-sec="' + id + '"]');
  if (card && now) {
    var diff = now.getBoundingClientRect().top - top0;
    if (Math.abs(diff) > 0.5) { try { window.scrollBy(0, diff); } catch (e) { /* 무시 */ } }
  }
  saveAndPush();
  showToast('💾 저장했어요. 다른 기기에도 바로 보여요.');
}

/* 인라인 편집 중인 카드 한 장만 다시 그려요 (블록 추가/삭제처럼 구조가 바뀔 때) */
function refreshInlineSec() {
  var id = ui.inlineEditSecId;
  if (!id || secPainting) return false;
  var sec = findSec(id);
  var el = document.querySelector('#sections .sec[data-sec="' + id + '"]');
  if (!sec || !el || !el.parentNode) { renderSections(); return true; }
  var tmp = document.createElement('div');
  tmp.innerHTML = sectionShellHtml(sec);
  var fresh = tmp.firstElementChild;
  if (!fresh) { renderSections(); return true; }
  el.parentNode.replaceChild(fresh, el);
  applyLayoutOrder();
  return true;
}

/* 인라인 편집 카드의 머리 — 아이콘·이름을 그 자리에서 바꾸고 ✓로 닫아요 */
function inlineSecHeadHtml(sec) {
  var h = '<div class="card-head sec-head">';
  h += '<div class="il-head">' +
    '<select class="inp inp-sm il-emo" data-field="diySecEmoji" data-sec="' + esc(sec.id) + '" aria-label="카드 아이콘">' + diyEmojiOptions(sec.emoji) + '</select>' +
    '<input class="inp inp-sm il-title-inp" data-field="diySecTitle" data-sec="' + esc(sec.id) + '" value="' + esc(sec.title || '') +
      '" maxlength="16" placeholder="카드 이름" aria-label="카드 이름">' +
    '</div>';
  h += '<div class="head-tools sec-tools sec-ovl">';
  h += '<button type="button" class="sec-tool on" data-act="sec-inline" data-sec="' + esc(sec.id) + '" aria-label="저장하고 닫기" title="저장하고 닫기">💾</button>';
  h += '<button type="button" class="sec-grip" data-drag-sec="' + esc(sec.id) + '" aria-label="끌어서 옮기기" title="끌어서 옮기기">⠿</button>';
  h += '<button type="button" class="sec-tool" data-act="diy-sec-up" data-sec="' + esc(sec.id) + '" aria-label="앞으로 이동" title="순서 앞으로">▲</button>';
  h += '<button type="button" class="sec-tool" data-act="diy-sec-down" data-sec="' + esc(sec.id) + '" aria-label="뒤로 이동" title="순서 뒤로">▼</button>';
  h += '<button type="button" class="sec-tool" data-act="sec-detail" data-sec="' + esc(sec.id) + '" aria-label="팝업에서 전체 관리" title="팝업에서 전체 관리">🧱</button>';
  h += '<button type="button" class="sec-tool' + (sec.hidden ? ' on' : '') + '" data-act="diy-sec-hide" data-sec="' + esc(sec.id) +
    '" aria-pressed="' + (sec.hidden ? 'true' : 'false') + '" aria-label="숨기기" title="숨기기">' + (sec.hidden ? '🙈' : '👁') + '</button>';
  h += '<button type="button" class="sec-tool" data-act="sec-size-reset" data-sec="' + esc(sec.id) + '" aria-label="크기 초기화" title="크기 원래대로">↺</button>';
  if (!sec.base) h += '<button type="button" class="sec-tool danger" data-act="diy-sec-del" data-sec="' + esc(sec.id) + '" aria-label="섹션 삭제" title="섹션 삭제">🗑</button>';
  h += '</div></div>';
  return h;
}

/* 하루 일정 칸 편집 — 그 날 학원 이름·시간을 그 자리에서 */
function inlineDayEditorHtml(key) {
  var evs = state.schedule[key] || [];
  var h = '<div class="il-day">';
  if (!evs.length) h += '<p class="il-note">아직 적어 둔 일정이 없어요. 아래 [＋ 일정]으로 넣어 보세요.</p>';
  for (var i = 0; i < evs.length; i++) {
    var e = evs[i];
    var tp = evTimeParts(e.time);
    h += '<div class="ev-edit">' +
      '<input class="inp inp-sm" data-field="evName" data-day="' + key + '" data-id="' + esc(e.id) + '" value="' + esc(e.name) + '" placeholder="일정 이름">' +
      '<div class="ev-times">' +
        '<label class="ev-t"><span>시작</span><input class="inp inp-sm" type="time" data-field="evTimeStart" data-day="' + key + '" data-id="' + esc(e.id) + '" value="' + esc(tp.start) + '" aria-label="시작 시간"></label>' +
        '<label class="ev-t"><span>종료</span><input class="inp inp-sm" type="time" data-field="evTimeEnd" data-day="' + key + '" data-id="' + esc(e.id) + '" value="' + esc(tp.end) + '" aria-label="종료 시간"></label>' +
      '</div>' +
      '<button class="del-btn" type="button" data-act="del-event" data-day="' + key + '" data-id="' + esc(e.id) + '" aria-label="삭제">✕</button>' +
      '</div>';
  }
  h += '<button class="add-item add-sm" type="button" data-act="add-event" data-day="' + key + '">+ 일정 추가</button></div>';
  return h;
}

/* 블록 하나를 카드 안에서 고치는 칸 */
function inlineBlockEditorHtml(sec, blk, idx, total) {
  var h = '<div class="il-blk" data-il-blk="' + esc(blk.id) + '">';
  h += '<div class="il-blk-head"><span class="il-blk-name">' +
    esc((BLOCK_ICON[blk.type] || '🧩') + ' ' + (BLOCK_LABEL[blk.type] || blk.type)) + '</span>' +
    '<span class="il-tools">' +
    '<button type="button" class="sec-tool" data-act="diy-blk-up" data-blk="' + esc(blk.id) + '"' + (idx === 0 ? ' disabled' : '') + ' aria-label="블록 위로">▲</button>' +
    '<button type="button" class="sec-tool" data-act="diy-blk-down" data-blk="' + esc(blk.id) + '"' + (idx === total - 1 ? ' disabled' : '') + ' aria-label="블록 아래로">▼</button>' +
    '<button type="button" class="sec-tool danger" data-act="diy-blk-del" data-blk="' + esc(blk.id) + '" aria-label="블록 빼기">✕</button>' +
    '</span></div>';

  if (blk.type === 'routine') {
    h += '<label class="il-field"><span>보여 줄 루틴 그룹</span><select class="inp inp-sm" data-field="diyBlkGroup" data-blk="' + esc(blk.id) + '">' +
      diyGroupOptions(blk.group, '오늘의 모든 루틴') + '</select></label>';
    h += '<div class="il-groups">' + routineCardsHtml(blk.group || '', true).html + '</div>';
    h += '<button class="add-item" type="button" data-act="cat-add">+ 루틴 그룹 추가</button>';
  } else if (blk.type === 'target_bar') {
    h += '<label class="il-field"><span>어느 목표를 보여 줄까요</span><select class="inp inp-sm" data-field="diyBlkGroup" data-blk="' + esc(blk.id) + '">' +
      diyGroupOptions(blk.group, '다음 다가오는 목표') + '</select></label>';
    h += '<p class="il-note">목표 시간은 🧩 그룹·할 일에서 정해요. 여기서는 이 카드에 보여 줄 목표를 골라요.</p>';
  } else if (blk.type === 'notice_board') {
    h += '<div class="nb-form-row">' +
      '<input class="inp inp-sm nb-emo" data-field="diyNbEmoji" data-blk="' + esc(blk.id) + '" value="' + esc(blk.emoji || '💬') + '" maxlength="4" aria-label="게시판 아이콘">' +
      '<input class="inp inp-sm" data-field="diyNbTitle" data-blk="' + esc(blk.id) + '" value="' + esc(blk.title || '') + '" maxlength="24" placeholder="제목" aria-label="게시판 제목">' +
      '</div>' +
      '<textarea class="inp nb-text-inp" data-field="diyNbText" data-blk="' + esc(blk.id) + '" rows="3" maxlength="400" placeholder="가족에게 남길 한마디를 적어 주세요">' + esc(blk.text || '') + '</textarea>';
    /* 한마디 카드도 여기서 바로 하나 더 만들 수 있어요 (루틴의 '＋ 그룹 추가'와 같은 자리) */
    h += '<button class="add-item" type="button" data-act="diy-nb-add" data-sec="' + esc(sec.id) + '" data-blk="' + esc(blk.id) + '">＋ 새 한마디 카드 추가</button>';
  } else if (blk.type === 'today_schedule') {
    var ti = new Date().getDay();
    h += '<p class="il-note">' + DAY_NAMES[ti] + '요일 일정이에요. 적은 내용은 오늘의 일정 카드에 바로 보여요.</p>';
    h += inlineDayEditorHtml(DAY_KEYS[ti]);
  } else if (blk.type === 'weekly_schedule') {
    h += '<p class="il-note">요일마다 학원·일정을 적어 두면 일과표와 🔔 10분 전 알림에 쓰여요.</p>';
    h += '<div class="week-grid">' + weekGridHtml(true) + '</div>';
  } else if (blk.type === 'special_missions') {
    h += '<p class="il-note">기간 안에서 목표 일수만큼 채우면 칭찬 스티커를 자동으로 줘요. 미션은 이 카드의 ✏️나 아래 버튼에서 언제든 고치고 지울 수 있어요.</p>';
    h += '<button class="add-item" type="button" data-act="msn-add" data-blk="' + esc(blk.id) + '">＋ 특별 미션 추가</button>';
  } else if (blk.type === 'role_checklist') {
    h += '<p class="il-note">매일·매주·매월 맺은 역할을 체크해요. 역할·주기·항목은 카드의 ✏️나 아래 버튼에서 고칠 수 있어요.</p>';
    h += '<button class="add-item" type="button" data-act="rcl-add" data-blk="' + esc(blk.id) + '">＋ 역할 추가</button>';
  } else if (blk.type === 'sticker_board') {
    var st = state.sticker || {};
    h += '<div class="il-grid2">' +
      fieldWrap('한 판 칸 수', '<input class="inp" type="number" inputmode="numeric" min="3" max="30" step="1" data-field="stickerSlots" value="' + (st.slots || 10) + '">') +
      fieldWrap('스티커 1개 금액(원)', '<input class="inp" type="number" inputmode="numeric" min="100" max="100000" step="100" data-field="stickerUnit" value="' + (st.unit || 1000) + '">') +
      fieldWrap('한 줄 소개', '<input class="inp" data-field="stickerGoal" value="' + esc(st.goal || '') + '" maxlength="40" placeholder="비워 두면 안 보여요">') +
      '</div>' +
      '<p class="il-count">지금 ' + ((st.stickers || []).length) + ' / ' + (st.slots || 10) + '칸 채웠어요.</p>' +
      '<p class="il-note">스티커를 붙일 때 고르는 칭찬 이유예요. 여기서 더하고 지우면 바로 저장되고 아이 화면에도 그대로 보여요.</p>' +
      stickerReasonEditorHtml('inline');
  }
  h += '</div>';
  return h;
}

function inlineSecBodyHtml(sec) {
  var blocks = sec.blocks || [];
  var h = '<div class="sec-blocks il-body">';
  h += '<p class="il-note">이 카드만 고치는 중이에요. 바꾼 내용은 바로 저장되고 가족 기기에도 같이 맞춰져요.</p>';
  if (!blocks.length) h += '<p class="blk-empty">아직 블록이 없어요. 아래에서 골라 넣어 보세요.</p>';
  for (var i = 0; i < blocks.length; i++) h += inlineBlockEditorHtml(sec, blocks[i], i, blocks.length);
  h += diyBlockAddHtml(sec);
  h += '<div class="il-done"><button class="pill-btn" type="button" data-act="sec-inline" data-sec="' + esc(sec.id) + '">💾 저장하고 닫기</button></div>';
  h += '</div>';
  return h;
}

/* ---- ⠿ 카드 끌어서 옮기기 (자석 스냅) ----
   끌고 있는 카드는 손끝을 따라오는 반투명 고스트로 보이고, 가장 가까운 자리에
   점선 자리표시가 자석처럼 붙어요. 놓으면 그 슬롯으로 들어가 순서가 저장돼요. */
var secMove = null;
var secPainting = false;

/* ---- ⠿ 카드 끌어서 옮기기 (자석 스냅) ----
   끌고 있는 카드는 손끝을 따라오는 반투명 고스트로 보이고, 포인터가 가리키는 줄·칸의
   자리에 점선 자리표시가 자석처럼 붙어요. 놓으면 그 칸(row·col)으로 들어가 저장돼요.
   왼쪽 카드가 길고 오른쪽 카드가 짧아 생긴 빈자리에도 그대로 넣을 수 있어요. */
var secMove = null;
var secPainting = false;

/* 화면에 있는 줄(.sec-row)들 — 끌어서 놓는 자리를 계산할 때 써요 */
function secRowEls() {
  var box = document.getElementById('sections');
  var out = [];
  if (!box) return out;
  for (var i = 0; i < box.children.length; i++) {
    var el = box.children[i];
    if (!el.classList || !el.classList.contains('sec-row')) continue;
    if (el.getAttribute('data-drop') === '1') continue;
    if (!el.getBoundingClientRect().height) continue;
    out.push(el);
  }
  return out;
}

function secRowNo(el) {
  var n = el ? parseInt(el.getAttribute('data-row'), 10) : NaN;
  return isNaN(n) ? 0 : n;
}

/* 포인터가 가리키는 자리 — 어느 줄의 어느 칸, 몇 번째에 놓일지 */
function secDropSlot(px, py) {
  var d = secMove;
  if (!d) return null;
  var rows = secRowEls();
  var i, count = rows.length, rects = [];
  for (i = 0; i < count; i++) rects.push(rows[i].getBoundingClientRect());
  if (!count) return { kind: 'newrow', rowEl: null, at: 'after', col: 'left' };

  /* 폰(1단)에서는 위아래 순서만 바꿔요 */
  if (window.innerWidth < 720) {
    var idx = 0;
    var cards = rows[0].querySelectorAll('.sec');
    for (i = 0; i < cards.length; i++) {
      if (cards[i] === d.card || cards[i] === d.drop) continue;
      var cr = cards[i].getBoundingClientRect();
      if (!cr.height) continue;
      if (py > cr.top + cr.height / 2) idx++;
    }
    return { kind: 'flat', index: idx, rowEl: rows[0] };
  }

  /* 포인터가 들어 있는 줄 */
  var hit = -1;
  for (i = 0; i < count; i++) {
    if (py >= rects[i].top && py <= rects[i].bottom) { hit = i; break; }
  }
  if (hit < 0) {
    if (py < rects[0].top) return { kind: 'newrow', rowEl: rows[0], at: 'before', col: (px <= rects[0].left + rects[0].width / 2) ? 'left' : 'right' };
    if (py > rects[count - 1].bottom) return { kind: 'newrow', rowEl: rows[count - 1], at: 'after', col: (px <= rects[count - 1].left + rects[count - 1].width / 2) ? 'left' : 'right' };
    /* 줄 사이 빈틈 — 가까운 쪽으로 새 줄을 만들어요 */
    for (i = 0; i < count - 1; i++) {
      if (py > rects[i].bottom && py < rects[i + 1].top) {
        var midGap = (rects[i].bottom + rects[i + 1].top) / 2;
        return { kind: 'newrow', rowEl: py < midGap ? rows[i + 1] : rows[i], at: py < midGap ? 'before' : 'after',
                 col: (px <= rects[i].left + rects[i].width / 2) ? 'left' : 'right' };
      }
    }
    return { kind: 'newrow', rowEl: rows[count - 1], at: 'after', col: 'left' };
  }

  var rowEl = rows[hit], rr = rects[hit];
  var col = (px <= rr.left + rr.width / 2) ? 'left' : 'right';
  var mid = (rr.top + rr.bottom) / 2;
  if (d.isFull) {
    /* 전체 폭 카드는 한 줄을 혼자 써요 */
    return { kind: 'newrow', rowEl: rowEl, at: (py < mid ? 'before' : 'after'), col: col };
  }
  if (rowEl.classList.contains('sec-row-full')) {
    /* 전체 폭 카드 위/아래로는 새 줄에 들어가요 */
    return { kind: 'newrow', rowEl: rowEl, at: (py < mid ? 'before' : 'after'), col: col };
  }
  /* 반 폭 줄 — 그 칸의 카드 사이(빈자리 포함) 중 포인터 아래 자리 */
  if (rowEl.classList.contains('sec-row-flow')) {
    /* 자유 폭 줄 — 카드 왼/오른쪽 중 어느 자리에 놓을지 가로 위치로 정해요 */
    var fi = 0, fk = rowEl.children;
    for (i = 0; i < fk.length; i++) {
      var fc = fk[i];
      if (!fc.classList || !fc.classList.contains('sec') || fc === d.card || fc === d.drop) continue;
      var fb = fc.getBoundingClientRect();
      if (!fb.height) continue;
      if (px > fb.left + fb.width / 2) fi++;
    }
    return { kind: 'stack', rowEl: rowEl, col: (px <= rr.left + rr.width / 2) ? 'left' : 'right', index: fi };
  }
  var colEl = rowEl.querySelector('.sec-col[data-col="' + col + '"]');
  var idx2 = 0;
  if (colEl) {
    var cs = colEl.children;
    for (i = 0; i < cs.length; i++) {
      var c2 = cs[i];
      if (!c2.classList || !c2.classList.contains('sec')) continue;
      if (c2 === d.card || c2 === d.drop) continue;
      var b2 = c2.getBoundingClientRect();
      if (!b2.height) continue;
      if (py > b2.top + b2.height / 2) idx2++;
    }
  }
  return { kind: 'stack', rowEl: rowEl, col: col, index: idx2 };
}

function secSlotKey(slot) {
  if (!slot) return '';
  if (slot.kind === 'flat') return 'F' + slot.index;
  if (slot.kind === 'newrow') return 'N' + secRowNo(slot.rowEl) + slot.at + slot.col;
  return 'S' + secRowNo(slot.rowEl) + slot.col + slot.index;
}

function secPaintGhost() {
  var d = secMove;
  if (!d || !d.ghost) return;
  d.ghost.style.left = Math.round(d.left + d.dx) + 'px';
  d.ghost.style.top = Math.round(d.top + d.dy) + 'px';
}

function secPlaceDrop(px, py) {
  var d = secMove;
  if (!d || !d.drop) return;
  var box = document.getElementById('sections');
  if (!box) return;
  var slot = secDropSlot(px, py);
  if (!slot) return;
  d.slot = slot;
  var key = secSlotKey(slot);
  if (key === d.slotKey) return;
  d.slotKey = key;
  if (d.dropRow && d.dropRow.parentNode) d.dropRow.parentNode.removeChild(d.dropRow);
  d.dropRow = null;

  if (slot.kind === 'flat') {
    var colEl0 = slot.rowEl.querySelector('.sec-col') || slot.rowEl;
    colEl0.insertBefore(d.drop, secNthCard(colEl0, slot.index, d));
    return;
  }
  if (slot.kind === 'newrow') {
    var rowEl = document.createElement('div');
    rowEl.className = 'sec-row' + (d.isFull ? ' sec-row-full' : '');
    rowEl.setAttribute('data-drop', '1');
    if (d.isFull) rowEl.appendChild(d.drop);
    else {
      var l = document.createElement('div'); l.className = 'sec-col'; l.setAttribute('data-col', 'left');
      var r = document.createElement('div'); r.className = 'sec-col'; r.setAttribute('data-col', 'right');
      (slot.col === 'right' ? r : l).appendChild(d.drop);
      rowEl.appendChild(l); rowEl.appendChild(r);
    }
    d.drop.classList.toggle('sec-half', !d.isFull);
    d.drop.classList.toggle('sec-full', d.isFull);
    if (!slot.rowEl) box.appendChild(rowEl);
    else if (slot.at === 'before') box.insertBefore(rowEl, slot.rowEl);
    else box.insertBefore(rowEl, slot.rowEl.nextSibling);
    d.dropRow = rowEl;
    return;
  }
  /* 같은 줄의 그 칸에 놓아요 */
  var colEl = slot.rowEl.querySelector('.sec-col[data-col="' + slot.col + '"]');
  if (!colEl && slot.rowEl.classList.contains('sec-row-flow')) colEl = slot.rowEl;
  if (!colEl) {
    colEl = document.createElement('div');
    colEl.className = 'sec-col';
    colEl.setAttribute('data-col', slot.col);
    slot.rowEl.appendChild(colEl);
  }
  d.drop.classList.remove('sec-full');
  d.drop.classList.add('sec-half');
  colEl.insertBefore(d.drop, secNthCard(colEl, slot.index, d));
}

/* 칸 안에서 n번째 카드(끌고 있는 카드·자리표시는 빼고) — 그 앞에 끼워 넣어요 */
function secNthCard(colEl, n, d) {
  var kids = colEl.children, seen = 0;
  for (var i = 0; i < kids.length; i++) {
    var el = kids[i];
    if (!el.classList || !el.classList.contains('sec')) continue;
    if (d && (el === d.card || el === d.drop)) continue;
    if (seen === n) return el;
    seen++;
  }
  return null;
}

function secMoveMove(ev) {
  var d = secMove;
  if (!d) return;
  if (ev.cancelable) ev.preventDefault();
  var dx = ev.clientX - d.x0;
  var dy = ev.clientY - d.y0;
  if (Math.abs(dx) > 4 || Math.abs(dy) > 4) d.moved = true;
  d.dx = dx; d.dy = dy;
  d.lastX = ev.clientX; d.lastY = ev.clientY;
  secPaintGhost();
  secPlaceDrop(ev.clientX, ev.clientY);
}

/* 화면 가장자리로 끌면 긴 목록도 스스로 스크롤해요 (모바일 대비) */
function secMoveTick() {
  var d = secMove;
  if (!d) return;
  var vh = window.innerHeight;
  var y = d.lastY || 0;
  var speed = 0;
  if (y && y < 90) speed = -Math.min(20, (90 - y) / 3 + 4);
  else if (y && y > vh - 90) speed = Math.min(20, (y - (vh - 90)) / 3 + 4);
  if (speed) {
    var before = window.pageYOffset;
    window.scrollBy(0, speed);
    if (window.pageYOffset !== before) secPlaceDrop(d.lastX || 0, d.lastY || 0);
  }
  d.raf = window.requestAnimationFrame(secMoveTick);
}

/* 놓은 자리를 데이터(row·col·순서)에 반영해요 */
function secCommitDrop(secId, slot) {
  var list = secList();
  var sec = findSec(secId);
  if (!sec || !slot) return false;
  var arr = [], i;
  for (i = 0; i < list.length; i++) if (list[i] !== sec) arr.push(list[i]);

  if (slot.kind === 'flat') {
    /* 폰(1단)에서는 위아래 순서만 바뀌어요 — 줄·칸도 그 순서대로 다시 잡아요 */
    var at = Math.max(0, Math.min(slot.index, arr.length));
    arr.splice(at, 0, sec);
    for (i = 0; i < arr.length; i++) { arr[i].row = null; arr[i].col = ''; }
  } else if (slot.kind === 'newrow') {
    var target, j;
    if (!slot.rowEl) {
      target = 0;
      for (i = 0; i < arr.length; i++) if (arr[i].row >= target) target = arr[i].row + 1;
    } else {
      target = secRowNo(slot.rowEl) + (slot.at === 'after' ? 1 : 0);
    }
    for (i = 0; i < arr.length; i++) {
      var rv = arr[i].row;
      if (typeof rv === 'number' && rv >= target) arr[i].row = rv + 1;
    }
    sec.row = target;
    sec.col = normColOf(slot.col);
    arr.push(sec);
  } else {
    var wantRow = secRowNo(slot.rowEl);
    sec.row = wantRow;
    sec.col = normColOf(slot.col);
    var idx = -1, seen = 0;
    for (i = 0; i < arr.length; i++) {
      if (arr[i].row === wantRow && normColOf(arr[i].col) === sec.col) {
        if (seen === slot.index) { idx = i; break; }
        seen++;
      }
    }
    if (idx < 0) {
      idx = arr.length;
      for (i = arr.length - 1; i >= 0; i--) {
        if (typeof arr[i].row !== 'number' || arr[i].row <= wantRow) { idx = i + 1; break; }
      }
      if (i < 0) { idx = 0; for (i = 0; i < arr.length; i++) { if (arr[i].row > wantRow) break; idx = i + 1; } }
    }
    arr.splice(idx, 0, sec);
  }
  applySectionRows(arr);
  list.length = 0;
  for (i = 0; i < arr.length; i++) list.push(arr[i]);
  return true;
}

function secMoveEnd() {
  var d = secMove;
  if (!d) return;
  secMove = null;
  window.removeEventListener('pointermove', secMoveMove);
  window.removeEventListener('pointerup', secMoveEnd);
  window.removeEventListener('pointercancel', secMoveEnd);
  if (d.raf) window.cancelAnimationFrame(d.raf);
  if (d.ghost && d.ghost.parentNode) d.ghost.parentNode.removeChild(d.ghost);
  document.body.classList.remove('sec-drag-live');
  d.card.classList.remove('drag-hide');
  if (d.dropRow && d.dropRow.parentNode) d.dropRow.parentNode.removeChild(d.dropRow);
  if (d.drop && d.drop.parentNode) d.drop.parentNode.removeChild(d.drop);
  if (!d.moved || !d.slot) { applyLayoutOrder(); return; }
  if (!secCommitDrop(d.secId, d.slot)) { applyLayoutOrder(); return; }
  syncSectionMirrors(state);
  saveState();
  renderSections();
  renderEditPanel();
  showToast('카드를 옮겼어요.');
}

function secStartMove(e) {
  var handle = (e.target && e.target.closest) ? e.target.closest('[data-drag-sec]') : null;
  if (!handle || !ui.layout || !can('edit') || secMove) return;
  var secId = handle.getAttribute('data-drag-sec');
  var card = handle.closest('.sec');
  var sec = findSec(secId);
  if (!card || !sec) return;
  e.preventDefault();
  try { handle.setPointerCapture(e.pointerId); } catch (e0) { /* 무시 */ }
  var rect = card.getBoundingClientRect();
  var drop = document.createElement('div');
  drop.className = 'sec sec-drop' + (sec.width === 'half' ? ' sec-half' : ' sec-full');
  drop.setAttribute('data-width', sec.width === 'half' ? 'half' : 'full');
  drop.setAttribute('aria-hidden', 'true');
  drop.style.height = Math.round(rect.height) + 'px';
  drop.innerHTML = '<p class="blk-empty">여기로 옮겨요</p>';
  var ghost = document.createElement('div');
  ghost.className = 'sec-ghost';
  ghost.style.width = Math.round(rect.width) + 'px';
  ghost.innerHTML = '<b><span aria-hidden="true">' + esc(sec.emoji || '🧩') + '</span>' + esc(sec.title || '카드') + '</b>' +
    '<small>⠿ 끌어서 옮기는 중</small>';
  document.body.appendChild(ghost);
  card.parentNode.insertBefore(drop, card);
  card.classList.add('drag-hide');
  document.body.classList.add('sec-drag-live');
  secMove = {
    secId: secId, card: card, drop: drop, ghost: ghost,
    isFull: sec.width === 'full', slot: null, slotKey: '', dropRow: null,
    x0: e.clientX, y0: e.clientY, dx: 0, dy: 0,
    left: rect.left, top: rect.top, moved: false, raf: 0,
    lastX: e.clientX, lastY: e.clientY
  };
  secPaintGhost();
  window.addEventListener('pointermove', secMoveMove, { passive: false });
  window.addEventListener('pointerup', secMoveEnd);
  window.addEventListener('pointercancel', secMoveEnd);
  secMove.raf = window.requestAnimationFrame(secMoveTick);
}

function installSectionMove() {
  document.addEventListener('pointerdown', secStartMove, { passive: false });
}

/* 카드 크기를 처음 크기로 — 가로는 섹션 기본 폭, 세로는 내용에 맞춤 */
function resetSectionSize(secId) {
  if (!can('edit')) return;
  var sec = findSec(secId);
  if (!sec) return;
  var wasFull = sec.width === 'full';
  sec.width = sec.base ? SEC_DEFAULT_WIDTH[sec.base] : 'half';
  sec.w = sec.width;
  sec.wPx = 0;          /* 자유 폭도 함께 되돌려요 */
  sec.h = 0;
  if (wasFull && sec.width === 'half') secPlaceHalf(sec);
  state.settings.dashboardSections = applySectionRows(secList());
  syncSectionMirrors(state);
  saveAndPush();
  renderSections();
  try { renderStickers(); renderWeek(); } catch (e2) { /* 무시 */ }
  renderEditPanel();
  showToast('카드 크기를 처음 크기로 돌렸어요.');
}

function sectionShellHtml(sec, idx) {
  var layoutOn = ui.layout && can('edit');
  var canEdit = can('edit');
  var inline = inlineSecOn(sec);
  var width = (sec.width === 'custom' && Math.round(Number(sec.wPx) || 0) >= SEC_W_MIN) ? 'custom'
    : (sec.width === 'half' ? 'half' : 'full');
  var wpx = width === 'custom' ? Math.round(Number(sec.wPx) || 0) : 0;
  var hpx = (sec.h >= SEC_H_MIN && sec.h <= SEC_H_MAX) ? sec.h : 0;
  var styleBits = [];
  if (hpx) styleBits.push('height:' + hpx + 'px');
  if (wpx) styleBits.push('--wpx:' + wpx + 'px');
  var cls = 'card sec ' + (SEC_CLASS[sec.base] || 'sec-custom') + (width === 'custom' ? ' sec-wpx' : ' sec-' + width) +
    (wpx ? ' has-wpx' : '') +
    (layoutOn ? ' edit-on' : '') + (inline ? ' inline-now' : '') + (hpx ? ' has-h' : '');
  var domId = sec.base ? ('sec' + sec.base.charAt(0).toUpperCase() + sec.base.slice(1)) : '';
  var h = '<section class="' + cls + '"' + (domId ? ' id="' + domId + '"' : '') +
    ' data-sec="' + esc(sec.id) + '" data-base="' + esc(sec.base || '') + '" data-width="' + width + '"' +
    (wpx ? ' data-wpx="' + wpx + '"' : '') +
    (styleBits.length ? ' style="' + styleBits.join(';') + '"' : '') +
    (sec.hidden ? ' hidden' : '') + '>';
  if (inline) {
    /* ✏️ 그 카드 안에서만 고치는 중 — 다른 카드는 평소 프레임 그대로예요 */
    h += inlineSecHeadHtml(sec);
    h += inlineSecBodyHtml(sec);
    h += '</section>';
    return h;
  }
  h += '<div class="card-head sec-head">';
  h += '<h2 class="sec-title" id="secTitle-' + esc(sec.id) + '">' + sectionTitleInnerHtml(sec) + '</h2>';
  h += '<div class="head-tools sec-tools' + (layoutOn ? ' sec-ovl' : ' sec-quick') + '">';
  if (!layoutOn && canEdit) {
    /* 평소에도 바로 보이는 ✏️ — 카드 하나만 골라서 고쳐요 */
    h += '<button type="button" class="sec-quick-edit" data-act="sec-inline" data-sec="' + esc(sec.id) +
      '" aria-label="' + esc((sec.title || '카드') + ' 고치기') + '" title="이 카드 고치기">✏️</button>';
  }
  if (layoutOn) {
    /* 작은 반투명 편집 바 — 카드 배치와 크기는 그대로예요 */
    h += '<button type="button" class="sec-grip" data-drag-sec="' + esc(sec.id) + '" aria-label="끌어서 옮기기" title="끌어서 옮기기">⠿</button>';
    h += '<button type="button" class="sec-tool" data-act="diy-sec-up" data-sec="' + esc(sec.id) + '" aria-label="앞으로 이동" title="순서 앞으로">▲</button>';
    h += '<button type="button" class="sec-tool" data-act="diy-sec-down" data-sec="' + esc(sec.id) + '" aria-label="뒤로 이동" title="순서 뒤로">▼</button>';
    h += '<button type="button" class="sec-tool" data-act="sec-inline" data-sec="' + esc(sec.id) + '" aria-label="카드 안에서 고치기" title="카드 안에서 고치기">✏️</button>';
    h += '<button type="button" class="sec-tool" data-act="sec-detail" data-sec="' + esc(sec.id) + '" aria-label="팝업에서 전체 관리" title="팝업에서 전체 관리">🧱</button>';
    h += '<button type="button" class="sec-tool" data-act="sec-blk-add" data-sec="' + esc(sec.id) + '" aria-label="블록 넣기" title="블록 넣기">＋</button>';
    h += '<button type="button" class="sec-tool' + (sec.hidden ? ' on' : '') + '" data-act="diy-sec-hide" data-sec="' + esc(sec.id) +
      '" aria-pressed="' + (sec.hidden ? 'true' : 'false') + '" aria-label="숨기기" title="숨기기">' + (sec.hidden ? '🙈' : '👁') + '</button>';
    h += '<button type="button" class="sec-tool" data-act="sec-size-reset" data-sec="' + esc(sec.id) + '" aria-label="크기 초기화" title="크기 원래대로">↺</button>';
    if (!sec.base) h += '<button type="button" class="sec-tool danger" data-act="diy-sec-del" data-sec="' + esc(sec.id) + '" aria-label="섹션 삭제" title="섹션 삭제">🗑</button>';
  }
  h += '</div></div>';
  h += '<div class="sec-blocks">';
  var blocks = sec.blocks || [];
  if (!blocks.length) {
    h += '<p class="blk-empty">아직 블록이 없어요.' + (layoutOn ? ' ✏️ 로 블록을 넣어 보세요.' : '') + '</p>';
  }
  for (var i = 0; i < blocks.length; i++) h += blockShellHtml(sec, blocks[i], i, blocks.length);
  h += '</div>';
  if (layoutOn) {
    h += '<button type="button" class="sec-resize" data-resize="' + esc(sec.id) + '" aria-label="카드 크기 조절">↘</button>';
  }
  h += '</section>';
  return h;
}

function blockShellHtml(sec, blk, idx, total) {
  /* 편집 모드에서도 블록은 평소 모양 그대로 — 블록 순서·추가는 카드의 ✏️ 상세 팝업에서 해요 */
  var h = '<div class="blk blk-' + esc(blk.type) + '" data-block="' + esc(blk.id) + '" data-block-type="' + esc(blk.type) + '">';
  if (total > 1) {
    h += '<div class="blk-h">' + esc(blockLabelOf(blk)) + '</div>';
  }
  h += '<div class="blk-body">' + blockInnerHtml(sec, blk) + '</div>';
  h += '</div>';
  return h;
}

function blockInnerHtml(sec, blk) {
  if (blk.type === 'routine') return routineBlockInner(blk);
  if (blk.type === 'sticker_board') return stickerBlockInner(blk);
  if (blk.type === 'today_schedule') return '<div' + (isFirstBlock(blk) ? ' id="todayBox"' : '') + ' data-part="box"></div>';
  if (blk.type === 'weekly_schedule') return weekBlockInner(blk);
  if (blk.type === 'target_bar') return '<div class="rt-targets" data-part="box" hidden></div>';
  if (blk.type === 'notice_board') return noticeBlockInner(blk);
  if (blk.type === 'special_missions') return missionBlockBodyHtml(blk);
  if (blk.type === 'role_checklist') return roleBlockBodyHtml(blk);
  return '';
}
