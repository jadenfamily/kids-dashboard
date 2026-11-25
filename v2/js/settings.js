/* ============================================================================
   Jaden's Today v2 — js/settings.js
   전체 설정 · 변수 · 알림음 고르기 · 화면 배치 · 계정 관리 · 코인 조절 · 요청하기 · 문제지/원장
   · 원본 index.html(운영본)의 같은 코드를 기능별로 나눈 파일입니다. 동작은 원본과 같아요.
   · 모듈끼리 같은 전역 스코프를 써요. index.html 에서 core → sync → ... 순서로 불러옵니다.
   ============================================================================ */
'use strict';

/* ============ 편집 패널 ============ */
function fieldWrap(label, control) {
  return '<label class="ep-field"><span>' + esc(label) + '</span>' + control + '</label>';
}

function slotsOptions(cur) {
  var opts = [6, 8, 10, 12, 15];
  var h = '';
  var found = false;
  for (var i = 0; i < opts.length; i++) {
    if (opts[i] === cur) found = true;
    h += '<option value="' + opts[i] + '"' + (opts[i] === cur ? ' selected' : '') + '>' + opts[i] + '칸</option>';
  }
  if (!found) h += '<option value="' + cur + '" selected>' + cur + '칸</option>';
  return h;
}

/* ---- DIY 편집기 (섹션 · 블록) ---- */
function diyEmojiOptions(cur) {
  var list = SEC_ICON_CHOICES.slice(0);
  if (cur && list.indexOf(cur) < 0) list.unshift(cur);
  var h = '';
  for (var i = 0; i < list.length; i++) {
    h += '<option value="' + esc(list[i]) + '"' + (list[i] === cur ? ' selected' : '') + '>' + list[i] + '</option>';
  }
  return h;
}

function diyGroupOptions(cur, allLabel) {
  var h = '<option value=""' + (cur ? '' : ' selected') + '>' + esc(allLabel) + '</option>';
  for (var i = 0; i < state.categories.length; i++) {
    var c = state.categories[i];
    h += '<option value="' + esc(c.id) + '"' + (cur === c.id ? ' selected' : '') + '>' +
      esc((c.emoji || '') + ' ' + (c.title || '루틴')) + '</option>';
  }
  return h;
}

function diyBlockAddHtml(sec) {
  var h = '<div class="diy-add-blk"><span>+ 블록 넣기</span>';
  var short = {
    routine: '✅ 루틴', target_bar: '🎯 목표바', notice_board: '💬 한마디',
    today_schedule: '🎒 일정', sticker_board: '⭐ 스티커', weekly_schedule: '🗓️ 일과표',
    special_missions: '🎯 미션', role_checklist: '⚡ 역할'
  };
  for (var i = 0; i < BLOCK_ORDER.length; i++) {
    var t = BLOCK_ORDER[i];
    h += '<button type="button" class="diy-add-btn" data-act="diy-blk-add" data-sec="' + esc(sec.id) + '" data-type="' + esc(t) + '">' +
      esc(short[t] || BLOCK_LABEL[t]) + '</button>';
  }
  h += '</div>';
  return h;
}

function diyBlockRowHtml(sec, blk, idx, total) {
  var h = '<div class="diy-blk" data-blk="' + esc(blk.id) + '" data-blk-type="' + esc(blk.type) + '">';
  h += '<div class="diy-blk-head">' +
    '<span class="diy-blk-name">' + esc((BLOCK_ICON[blk.type] || '🧩') + ' ' + (BLOCK_LABEL[blk.type] || blk.type)) + '</span>' +
    '<span class="diy-tools">' +
      '<button type="button" class="sec-tool" data-act="diy-blk-up" data-blk="' + esc(blk.id) + '"' + (idx === 0 ? ' disabled' : '') + ' aria-label="블록 위로">▲</button>' +
      '<button type="button" class="sec-tool" data-act="diy-blk-down" data-blk="' + esc(blk.id) + '"' + (idx === total - 1 ? ' disabled' : '') + ' aria-label="블록 아래로">▼</button>' +
      '<button type="button" class="sec-tool danger" data-act="diy-blk-del" data-blk="' + esc(blk.id) + '" aria-label="블록 빼기">✕</button>' +
    '</span></div>';
  if (blk.type === 'routine') {
    h += '<label class="diy-field"><span>보여 줄 루틴</span><select class="inp inp-sm" data-field="diyBlkGroup" data-blk="' + esc(blk.id) + '">' +
      diyGroupOptions(blk.group, '오늘의 모든 루틴') + '</select></label>';
  } else if (blk.type === 'target_bar') {
    h += '<label class="diy-field"><span>어느 목표를 보여 줄까요</span><select class="inp inp-sm" data-field="diyBlkGroup" data-blk="' + esc(blk.id) + '">' +
      diyGroupOptions(blk.group, '다음 다가오는 목표') + '</select></label>';
  } else if (blk.type === 'notice_board') {
    h += '<div class="diy-field nb-row">' +
      '<input class="inp inp-sm nb-emo" data-field="diyNbEmoji" data-blk="' + esc(blk.id) + '" value="' + esc(blk.emoji || '💬') + '" maxlength="4" aria-label="게시판 아이콘">' +
      '<input class="inp inp-sm" data-field="diyNbTitle" data-blk="' + esc(blk.id) + '" value="' + esc(blk.title || '') + '" maxlength="24" placeholder="제목" aria-label="게시판 제목">' +
      '</div>' +
      '<textarea class="inp nb-text-inp" data-field="diyNbText" data-blk="' + esc(blk.id) + '" rows="2" maxlength="400" placeholder="가족에게 남길 한마디">' + esc(blk.text || '') + '</textarea>';
  } else if (blk.type === 'weekly_schedule') {
    h += '<p class="ep-hint">주 7일 학원 일과표와 🔔 10분 전 알림 버튼이 들어가요.</p>';
  } else if (blk.type === 'sticker_board') {
    h += '<p class="ep-hint">부모님 한 번 누르기 스티커 판이에요.</p>';
  } else if (blk.type === 'today_schedule') {
    h += '<p class="ep-hint">오늘 학원·일정을 모아 보여 줘요.</p>';
  } else if (blk.type === 'special_missions') {
    h += '<p class="ep-hint">기간 안에서 목표 일수만큼 채우면 칭찬 스티커를 자동으로 줘요. 미션은 카드의 ✏️에서 언제든 고치고 지울 수 있어요.</p>';
  } else if (blk.type === 'role_checklist') {
    h += '<p class="ep-hint">매일·매주·매월 맡은 집안 역할을 체크해요. 역할과 항목은 카드의 ✏️에서 고칠 수 있어요.</p>';
  }
  h += '</div>';
  return h;
}

function diySectionRowHtml(sec, idx, total) {
  var h = '<div class="diy-sec' + (sec.hidden ? ' off' : '') + (sec.base ? '' : ' custom') + '" data-sec="' + esc(sec.id) + '">';
  h += '<div class="diy-sec-head">' +
    '<select class="inp inp-sm diy-emo" data-field="diySecEmoji" data-sec="' + esc(sec.id) + '" aria-label="섹션 아이콘">' + diyEmojiOptions(sec.emoji) + '</select>' +
    '<input class="inp inp-sm diy-title" data-field="diySecTitle" data-sec="' + esc(sec.id) + '" value="' + esc(sec.title || '') + '" maxlength="16" placeholder="섹션 이름" aria-label="섹션 이름">' +
    '<select class="inp inp-sm diy-width" data-field="diySecWidth" data-sec="' + esc(sec.id) + '" aria-label="가로 크기">' +
      '<option value="half"' + (sec.width === 'half' ? ' selected' : '') + '>반 폭</option>' +
      '<option value="third"' + (sec.width === 'custom' ? ' selected' : '') + '>' +
        (sec.width === 'custom' ? '내 폭 ' + Math.round(Number(sec.wPx) || 0) + 'px' : '1/3 폭') + '</option>' +
      '<option value="full"' + (sec.width === 'full' ? ' selected' : '') + '>전체 폭</option>' +
    '</select>' +
    '<span class="diy-tools">' +
      '<button type="button" class="sec-tool' + (sec.hidden ? ' on' : '') + '" data-act="diy-sec-hide" data-sec="' + esc(sec.id) + '" aria-pressed="' + (sec.hidden ? 'true' : 'false') + '" aria-label="숨기기/보이기">' + (sec.hidden ? '🙈' : '👁') + '</button>' +
      '<button type="button" class="sec-tool" data-act="diy-sec-up" data-sec="' + esc(sec.id) + '"' + (idx === 0 ? ' disabled' : '') + ' aria-label="섹션 위로">▲</button>' +
      '<button type="button" class="sec-tool" data-act="diy-sec-down" data-sec="' + esc(sec.id) + '"' + (idx === total - 1 ? ' disabled' : '') + ' aria-label="섹션 아래로">▼</button>' +
      (sec.base ? '' : '<button type="button" class="sec-tool danger" data-act="diy-sec-del" data-sec="' + esc(sec.id) + '" aria-label="섹션 삭제">🗑</button>') +
    '</span></div>';
  var blocks = sec.blocks || [];
  h += '<div class="diy-blocks">';
  if (!blocks.length) h += '<p class="ep-hint">아직 블록이 없어요. 아래에서 골라 넣어 보세요.</p>';
  for (var i = 0; i < blocks.length; i++) h += diyBlockRowHtml(sec, blocks[i], i, blocks.length);
  h += '</div>';
  h += diyBlockAddHtml(sec);
  h += '</div>';
  return h;
}

function diyEditorHtml() {
  var list = secList();
  var h = '<div class="diy-list">';
  for (var i = 0; i < list.length; i++) h += diySectionRowHtml(list[i], i, list.length);
  h += '</div>';
  return h;
}

/* ============ 편집 패널 ============
   ✏️ 편집을 눌러도 대시보드 카드의 크기·배치는 그대로 두고,
   위쪽에는 짧은 도구 줄만 얹어요. 상세 수정은 팝업(ep-sheet)에서 해요. */
var epUi = { tab: '' };
var EP_TABS = [
  { id: 'groups', icon: '🧩', label: '그룹·할 일' },
  { id: 'sections', icon: '🧱', label: '섹션·블록' },
  { id: 'week', icon: '🗓️', label: '일과표' },
  { id: 'sticker', icon: '⭐', label: '스티커' },
  { id: 'notice', icon: '💬', label: '한마디' },
  { id: 'sound', icon: '🔔', label: '알림음' },
  { id: 'basic', icon: '⚙️', label: '기본 설정' },
  { id: 'vars', icon: '🎛️', label: '변수 설정' }
];

function epTabDef(id) {
  for (var i = 0; i < EP_TABS.length; i++) if (EP_TABS[i].id === id) return EP_TABS[i];
  return EP_TABS[0];
}
function epTabLabel(id) { return id ? epTabDef(id).label : '편집'; }

function epGroupsHtml() {
  var h = '<p class="ep-hint">평소 화면과 똑같은 카드 모양이에요. 이름·요일·할 일을 여기서 고치면 대시보드에 바로 반영돼요.</p>';
  h += '<div class="ep-groups">' + routineCardsHtml('', true).html + '</div>';
  h += '<button class="ghost-btn" type="button" data-act="cat-add">+ 루틴 그룹 추가</button>';
  return h;
}

function epSectionsHtml() {
  return '<p class="ep-hint">카드를 만들고 그 안에 기능 블록을 넣어 우리 집에 맞게 바꿔 보세요. 카드 오른쪽 아래 ↘를 끌면 크기도 바뀌어요.</p>' +
    diyEditorHtml() +
    '<button class="ghost-btn diy-add-sec" type="button" data-act="diy-sec-add">＋ 새 섹션 만들기</button>';
}

function epWeekHtml() {
  return '<p class="ep-hint">요일마다 학원·일정을 적어 두면 오늘의 일정과 🔔 10분 전 알림에 쓰여요.</p>' +
    '<div class="week-grid" id="epWeekGrid">' + weekGridHtml(true) + '</div>';
}

function epStickerHtml() {
  var st = state.sticker;
  var h = '<div class="ep-grid">' +
    fieldWrap('스티커 한 판 칸 수', '<input class="inp" type="number" inputmode="numeric" min="3" max="30" step="1" data-field="stickerSlots" value="' + (st.slots || 10) + '">') +
    fieldWrap('스티커 1개 금액(원)', '<input class="inp" type="number" inputmode="numeric" min="100" max="100000" step="100" data-field="stickerUnit" value="' + (st.unit || 1000) + '">') +
    fieldWrap('스티커 한 줄 소개', '<input class="inp" data-field="stickerGoal" value="' + esc(st.goal || '') + '" placeholder="비워 두면 안 보여요 (예: 모아서 원하는 선물에 써요)" maxlength="40">') +
    '</div>' +
    '<p class="ep-hint">스티커를 붙일 때 고르는 칭찬 이유예요. 아래 칸에 적고 ＋ 추가를 누르면 바로 저장되고, 칩 옆 ×로 지울 수 있어요.</p>' +
    stickerReasonEditorHtml('panel') +
    '<div class="ep-sub"><h3>🎨 스티커 모양</h3>' +
    '<p class="ep-hint">붙일 때 고를 수 있는 모양이에요. 기본 ' + STICKER_SHAPES.length + '종에 우리 집만의 모양을 더할 수 있어요. (칸에 붙은 모양은 가족 기기에 같이 저장돼요)</p>' +
    stickerShapeRowHtml(st.shapeId || '', can('edit')) +
    shapeAddFormHtml('panel') +
    (editPanelShapeMsg ? '<p class="lf-msg shape-msg">' + esc(editPanelShapeMsg) + '</p>' : '') +
    stickerShapeMineHtml() +
    '</div>' +
    '<div class="ep-actions">' +
    '<button class="ghost-btn" type="button" data-act="sticker-clear">스티커 보드 비우기</button>' +
    (isAdmin() ? '<button class="ghost-btn danger" type="button" data-act="stickers-reset-logs">🧹 스티커 기록 초기화</button>' : '') +
    '</div>';
  return h;
}

/* ⚙️ 설정 창 — 직접 만든 모양 목록 (× 로 지우기) */
function stickerShapeMineHtml() {
  var mine = (state.sticker && state.sticker.shapes) || [];
  if (!mine.length) return '<p class="ep-hint">직접 만든 모양은 아직 없어요.</p>';
  var h = '<p class="ep-hint shape-mine-h">내가 만든 모양 — × 를 누르면 지워져요</p><div class="shape-mine">';
  for (var i = 0; i < mine.length; i++) {
    h += '<span class="shape-chip mine" title="' + esc(mine[i].name) + '">' + esc(mine[i].e) +
      '<small>' + esc(mine[i].name) + '</small>' +
      '<button type="button" class="shape-x" data-act="shape-del" data-id="' + esc(mine[i].id) + '" aria-label="' + esc(mine[i].name) + ' 모양 지우기">×</button></span>';
  }
  h += '</div>';
  return h;
}

function epNoticeHtml() {
  var list = [];
  var secs = secList();
  for (var i = 0; i < secs.length; i++) {
    var bs = secs[i].blocks || [];
    for (var k = 0; k < bs.length; k++) if (bs[k].type === 'notice_board') list.push(bs[k]);
  }
  if (!list.length) {
    return '<p class="ep-hint">아직 한마디 게시판이 없어요. 🧱 섹션·블록에서 💬 한마디 블록을 넣어 보세요.</p>';
  }
  var h = '<p class="ep-hint">가족에게 남길 한마디예요. 저장하면 대시보드 게시판에 바로 보여요.</p>';
  for (var j = 0; j < list.length; j++) {
    var b = list[j];
    h += '<div class="ep-sub nb-row">' +
      '<div class="nb-form-row">' +
      '<input class="inp inp-sm nb-emo" data-field="diyNbEmoji" data-blk="' + esc(b.id) + '" value="' + esc(b.emoji || '💬') + '" maxlength="4" aria-label="게시판 아이콘">' +
      '<input class="inp inp-sm" data-field="diyNbTitle" data-blk="' + esc(b.id) + '" value="' + esc(b.title || '') + '" maxlength="24" placeholder="제목" aria-label="게시판 제목">' +
      '</div>' +
      '<textarea class="inp nb-text-inp" data-field="diyNbText" data-blk="' + esc(b.id) + '" rows="3" maxlength="400" placeholder="가족에게 남길 한마디를 적어 주세요">' + esc(b.text || '') + '</textarea>' +
      '</div>';
  }
  return h;
}

/* 🔔 전체 알림음 — 전체 기본음과 루틴 그룹별 소리를 한곳에서 맞춰요 */
function epSoundHtml() {
  var h = '<div class="ep-sub"><h3>🔔 목표 시간 알림</h3>' +
    '<p class="ep-hint">루틴의 목표 시간에 맞춰 울릴 때 나는 소리예요. 그룹마다 다른 소리를 고르면 그 그룹 알림만 그 소리로 울려요. (가족 기기에 같이 저장돼요)</p>' +
    '<div class="ep-actions"><button class="ghost-btn' + (targetAlertOn() ? '' : ' danger') + '" type="button" data-act="alert-toggle">' +
      (targetAlertOn() ? '🔔 알림 켜져 있어요 · 끄기' : '🔕 알림 꺼져 있어요 · 켜기') + '</button>' +
      '<button class="ghost-btn" type="button" data-act="alert-sound-test">▶ 전체 기본음 미리 듣기</button></div>' +
    alertPickerHtml() + '</div>';
  h += '<div class="ep-sub"><h3>🧩 루틴 그룹별 알림음</h3>' +
    '<p class="ep-hint">비워 두면 위에서 고른 전체 기본음을 따라요. 그룹마다 다른 소리로 울리고 싶을 때만 골라 주세요.</p>' +
    '<div class="as-list ep-group-sounds">';
  for (var i = 0; i < state.categories.length; i++) {
    var cat = state.categories[i];
    h += '<div class="rce-alert"><span class="ep-gs-name">' + esc((cat.emoji || '') + ' ' + (cat.title || '루틴')) + '</span>' +
      '<select class="inp inp-sm rce-alert-sel" data-field="catAlertSound" data-cat="' + esc(cat.id) + '" aria-label="' + esc((cat.title || '루틴') + ' 알림음') + '">' +
      catAlertOptionsHtml(cat.alertSound) + '</select>' +
      '<button type="button" class="ghost-btn tiny" data-act="cat-alert-test" data-cat="' + esc(cat.id) + '" aria-label="' + esc((cat.title || '루틴') + ' 알림음 미리 듣기') + '">▶</button></div>';
  }
  h += '</div></div>';
  return h;
}

function epBasicHtml() {
  var s = state.settings;
  var h = '<div class="ep-grid">' +
    fieldWrap('아이 이름', '<input class="inp" data-field="childName" value="' + esc(s.childName) + '" placeholder="예: 지우" maxlength="12">') +
    fieldWrap('인사말', '<input class="inp" data-field="greeting" value="' + esc(s.greeting) + '" placeholder="예: 오늘도 화이팅! 🌟" maxlength="40">') +
    fieldWrap('동네 (날씨)', '<select class="inp" data-field="city">' + cityOptions(s.city) + '</select>') +
    '</div>';
  h += '<div class="ep-sub alert-picker"><h3>🔔 알림 소리 고르기</h3>' +
    '<p class="ep-hint">목표 시간·일과표 알림에 쓸 소리예요. 눌러서 바로 들어 보고, 우리 집 소리를 직접 담을 수도 있어요. (가족 기기에 같이 저장돼요)</p>' +
    alertPickerHtml() + '</div>';
  h += '<div class="ep-sub"><h3>📚 문제지 목록</h3><div class="wb-edit">' + wbEditHtml() + '</div>' +
    '<button class="ghost-btn" type="button" data-act="wb-add">+ 문제지 추가</button></div>';
  h += '<div class="ep-actions">' +
    '<button class="ghost-btn danger" type="button" data-act="reset-all">모두 처음 상태로</button>' +
    '<span class="ep-hint">바꾼 내용은 바로 저장돼요.</span></div>';
  return h;
}

/* 🎛️ 변수 하나 바꾸기 — 화면 규칙과 스티커 값에 바로 반영하고 저장해요 */
function setVarValue(k, raw) {
  if (!can('edit')) return;
  var d = varDef(k);
  if (!d) return;
  var v = varsOf(state);
  v[k] = clampVarValue(k, raw);
  if (k === 'stickerUnit' && state.sticker) state.sticker.unit = v[k];
  if (k === 'stickerSlots' && state.sticker) {
    var n = Math.max(v[k], state.sticker.stickers.length);
    state.sticker.slots = n;
    state.sticker.celebrated = state.sticker.stickers.length >= n;
    v.stickerSlots = n;
  }
  applyVars();
  saveState();
  /* 숫자를 계속 올리고 내려도 입력칸 포커스가 안 풀리게, 팝업은 다시 그리지 않아요 */
  try { renderHeader(); } catch (e1) { /* 무시 */ }
  try { renderStickers(); } catch (e2) { /* 무시 */ }
  try { renderRoutine(); } catch (e3) { /* 무시 */ }
  try { renderTargetBars(); } catch (e4) { /* 무시 */ }
  if (epUi.tab === 'vars') {
    var hint = document.querySelector('#editSheetBody .ep-actions .ep-hint');
    if (hint) {
      var vv = varsOf(state);
      hint.textContent = '지금은 루틴 체크 ' + vv.coinCheck + '코인 · 그룹 보너스 ' + vv.coinGroup + '코인 · 알 뽑기 ' + vv.petDrawCost + '코인이에요.';
    }
  } else {
    renderEditPanel();
  }
}

function resetVars() {
  if (!can('edit')) return;
  state.settings.vars = defaultVars();
  state.settings.alertEnabled = true;
  if (state.sticker) {
    state.sticker.unit = state.settings.vars.stickerUnit;
    var n = Math.max(state.settings.vars.stickerSlots, state.sticker.stickers.length);
    state.sticker.slots = n;
    state.sticker.celebrated = state.sticker.stickers.length >= n;
    state.settings.vars.stickerSlots = n;
  }
  applyVars();
  saveState();
  renderAll();
  if (epUi.tab === 'vars') renderEditSheetBody();
  showToast('🎛️ 변수를 기본값으로 돌렸어요.');
}

/* 🎛️ 변수 설정 — 규칙 숫자를 항목별 설명과 함께 직접 바꿔요 */
function toggleTargetAlertOn() {
  if (!can('edit')) return;
  state.settings.alertEnabled = !targetAlertOn();
  saveState();
  if (epUi.tab === 'vars') renderEditSheetBody();
  showToast(state.settings.alertEnabled ? '🔔 목표 시간 알림을 켰어요.' : '🔕 목표 시간 알림을 껐어요.');
}

function epVarsHtml() {
  var v = varsOf(state);
  var h = '<p class="ep-hint">코인·기운·스티커 같은 규칙 숫자를 여기서 바꿔요. 바꾸면 바로 저장되고 가족 기기에도 같이 맞춰져요.</p>';
  h += '<div class="var-list">';
  var switchDone = false;
  for (var i = 0; i < VAR_DEFS.length; i++) {
    var d = VAR_DEFS[i];
    /* 목표 시간 알림 항목 위에 알림 켜기/끄기 스위치 */
    if (!switchDone && d.k.indexOf('alert') === 0) {
      switchDone = true;
      var tamOn = targetAlertOn();
      h += '<div class="var-switch-row">' +
        '<span class="var-txt"><b>목표 시간 알림</b><small>목표 시간이 다가오면 화면 가운데 알림과 소리로 알려 줘요</small></span>' +
        '<button class="var-switch' + (tamOn ? ' on' : '') + '" type="button" role="switch" aria-checked="' + (tamOn ? 'true' : 'false') +
        '" aria-label="목표 시간 알림 ' + (tamOn ? '끄기' : '켜기') + '" data-act="alert-toggle"><span class="sw-knob"></span></button></div>';
    }
    h += '<label class="var-row">' +
      '<span class="var-txt"><b>' + esc(d.label) + '</b><small>' + esc(d.hint) + '</small></span>' +
      '<span class="var-in"><input class="inp var-inp" type="number" inputmode="numeric" min="' + d.min + '" max="' + d.max + '" step="' + d.step +
      '" data-field="varNum" data-var="' + d.k + '" value="' + v[d.k] + '" aria-label="' + esc(d.label) + '">' +
      '<span class="var-unit">' + esc(d.unit) + '</span></span></label>';
  }
  h += '</div>';
  h += '<div class="ep-actions">' +
    '<button class="ghost-btn" type="button" data-act="vars-reset">기본값으로 되돌리기</button>' +
    '<span class="ep-hint">지금은 루틴 체크 ' + v.coinCheck + '코인 · 그룹 보너스 ' + v.coinGroup + '코인 · 알 뽑기 ' + v.petDrawCost + '코인이에요.</span></div>';
  return h;
}

function epSheetBodyHtml(tab) {
  if (!tab) return '';
  if (!can('edit')) return '<p class="ep-hint">편집 권한이 없어요.</p>';
  if (tab === 'groups') return epGroupsHtml();
  if (tab === 'sections') return epSectionsHtml();
  if (tab === 'week') return epWeekHtml();
  if (tab === 'sticker') return epStickerHtml();
  if (tab === 'notice') return epNoticeHtml();
  if (tab === 'sound') return epSoundHtml();
  if (tab === 'basic') return epBasicHtml();
  if (tab === 'vars') return epVarsHtml();
  return '';
}

function renderEditPanel() {
  var p = document.getElementById('editPanel');
  if (!p) return;
  if (ui.editing && !can('edit')) ui.editing = false;
  if (!ui.editing) {
    ui.inlineEditSecId = '';
    p.hidden = true;
    p.innerHTML = '';
    epUi.tab = '';
    return;
  }
  p.hidden = false;
  var h = '<div class="ep-head">' +
    '<h2>⚙️ 전체 설정</h2>' +
    '<span class="ep-hint">모든 카드에 같이 쓰는 것만 여기서 맞춰요. 카드 하나만 고칠 때는 그 카드 오른쪽 ✏️를 누르면 돼요.</span>' +
    '<button class="done-btn" type="button" data-act="settings-close">닫기</button>' +
    '</div>';
  h += '<div class="ep-tools">';
  h += '<button type="button" class="ep-tool layout' + (ui.layout ? ' on' : '') + '" data-act="layout-toggle" aria-pressed="' + (ui.layout ? 'true' : 'false') + '">' +
    '<span aria-hidden="true">📐</span>화면 배치 ' + (ui.layout ? '끄기' : '켜기') + '</button>';
  for (var i = 0; i < EP_TABS.length; i++) {
    var t = EP_TABS[i];
    h += '<button type="button" class="ep-tool' + (epUi.tab === t.id ? ' on' : '') + '" data-act="edit-open" data-tab="' + t.id + '">' +
      '<span aria-hidden="true">' + t.icon + '</span>' + esc(t.label) + '</button>';
  }
  h += '</div>';
  h += '<p class="ep-note">' + (ui.layout
    ? '📐 화면 배치 모드가 켜져 있어요 — 카드의 ⠿로 옮기고, ↘로 가로·세로 크기를 바꾸고, 눈 아이콘으로 숨겨요.'
    : '카드 오른쪽 ✏️를 누르면 그 카드만 바로 고칠 수 있어요. 순서·크기·숨김은 📐 화면 배치를 켜서 맞춰요.') + '</p>';
  h += '<div class="ep-sheet" id="editSheet"' + (epUi.tab ? '' : ' hidden') + ' role="dialog" aria-modal="true" aria-label="' + esc(epTabLabel(epUi.tab)) + '">' +
    '<div class="ep-sheet-card">' +
    '<div class="ep-sheet-head"><h2 id="editSheetTitle">' + (epUi.tab ? esc(epTabDef(epUi.tab).icon) + ' ' : '') + esc(epTabLabel(epUi.tab)) + '</h2>' +
    '<button class="hist-close" type="button" data-act="edit-sheet-close" aria-label="닫기">✕</button></div>' +
    '<div class="ep-sheet-body" id="editSheetBody">' + epSheetBodyHtml(epUi.tab) + '</div>' +
    '<div class="ep-sheet-foot"><button class="pill-btn" type="button" data-act="sheet-save">💾 저장하고 닫기</button>' +
    '<span class="ep-hint">저장하면 다른 기기에도 바로 보여요.</span></div>' +
    '</div></div>';
  p.innerHTML = h;
}

/* 팝업 안쪽만 다시 그려요 (카드·목록을 고칠 때 화면 깜빡임 없이) */
function renderEditSheetBody() {
  if (!epUi.tab) return;
  var body = document.getElementById('editSheetBody');
  if (!body) return;
  body.innerHTML = epSheetBodyHtml(epUi.tab);
}

function openEditSheet(tab, focusSec) {
  if (!can('edit')) return;
  epUi.tab = tab || 'groups';
  renderEditPanel();
  var sheet = document.getElementById('editSheet');
  if (sheet) sheet.hidden = false;
  try { lockScroll(); } catch (e) { /* 무시 */ }
  if (focusSec) {
    var row = document.querySelector('#editSheetBody .diy-sec[data-sec="' + focusSec + '"]');
    if (row && row.scrollIntoView) { try { row.scrollIntoView({ block: 'center' }); } catch (e2) { /* 무시 */ } }
  }
}

function closeEditSheet() {
  epUi.tab = '';
  var sheet = document.getElementById('editSheet');
  if (sheet) sheet.hidden = true;
  var body = document.getElementById('editSheetBody');
  if (body) body.innerHTML = '';
  var tools = document.querySelectorAll('#editPanel .ep-tool');
  for (var i = 0; i < tools.length; i++) tools[i].classList.remove('on');
  try { unlockScroll(); } catch (e) { /* 무시 */ }
}

/* ---------------- 코인 조절 (엄마·아빠 → 아이) — 주기 / 빼기 / 직접 맞추기 ---------------- */
var allowUi = { to: '', amount: 50, mode: 'add', reason: '', msg: '', err: false, busy: false,
                bal: null, balFor: '', balErr: '', balSeq: 0 };

function roleLabel(role) {
  var r = ROLES[role];
  return (r && r.label) || role || '가족';
}
function allowUserList() {
  var out = [], users = (cloud.users && cloud.users.users) || [];
  for (var i = 0; i < users.length; i++) {
    var u = users[i];
    if (!u || !u.id) continue;
    out.push(u);
  }
  return out;
}
function allowName(id) {
  var list = allowUserList();
  for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i].name || list[i].id;
  return id ? String(id) : '가족';
}
function defaultAllowTarget() {
  var list = allowUserList(), me = (cloud.me && cloud.me.id) || '', i;
  for (i = 0; i < list.length; i++) if (list[i].role === 'child' && list[i].id !== me) return list[i].id;
  for (i = 0; i < list.length; i++) if (list[i].role !== 'admin' && list[i].id !== me) return list[i].id;
  for (i = 0; i < list.length; i++) if (list[i].id === me) return list[i].id;
  return list.length ? list[0].id : '';
}

/* add = 용돈 주기(+), sub = 차감(-), set = 지금 코인을 그 숫자로 맞추기(=) */
function allowModeOf() {
  return (allowUi.mode === 'sub' || allowUi.mode === 'set') ? allowUi.mode : 'add';
}
function allowAmountOf(v) {
  var n = parseInt(v, 10);
  if (isNaN(n) || n < 0) n = 0;
  return Math.min(COIN_MAX, n);
}
function allowKnownBal() {
  return (allowUi.to && allowUi.balFor === allowUi.to && allowUi.bal != null) ? allowUi.bal : null;
}

function setAllowMode(mode) {
  var m = (mode === 'sub' || mode === 'set') ? mode : 'add';
  if (m === allowUi.mode) return;
  allowUi.mode = m;
  allowUi.msg = '';
  allowUi.err = false;
  if (m === 'set') {
    /* 직접 맞추기는 '지금 코인'에서 시작하면 고치기 쉬워요 */
    var bal = allowKnownBal();
    if (bal != null) allowUi.amount = bal;
  } else if (!(allowUi.amount > 0)) {
    allowUi.amount = 50;
  }
  renderAllowance();
}

/* 받는 사람의 지금 코인 — 창을 열 때·사람을 바꿀 때·저장한 뒤에 다시 읽어요 */
function allowBalanceHtml() {
  if (!allowUi.to) return '';
  var bal = allowKnownBal();
  if (bal == null) {
    var retry = '<button type="button" class="allow-bal-re" data-act="allow-refresh">다시</button>';
    if (allowUi.balErr) {
      return '<span class="allow-bal-err">지금 코인을 못 읽었어요. ' + esc(allowUi.balErr) + '</span>' + retry;
    }
    return '<span class="allow-bal-ico">' + coinSvg() + '</span><span class="allow-bal-wait">지금 코인을 불러오는 중…</span>';
  }
  return '<span class="allow-bal-ico">' + coinSvg() + '</span>' +
    '<span>지금 <b>' + fmtNum(bal) + '</b> 코인</span>' +
    '<button type="button" class="allow-bal-re" data-act="allow-refresh" aria-label="지금 코인 새로고침">↻</button>';
}

function paintAllowBalance() {
  var el = document.getElementById('allowBal');
  if (el) el.innerHTML = allowBalanceHtml();
  var pv = document.getElementById('allowPrev');
  if (pv) pv.innerHTML = allowPrevHtml();
}

async function loadAllowBalance(force) {
  var to = allowUi.to;
  if (!to) return;
  if (!force && allowUi.balFor === to && allowUi.bal != null) return;
  var seq = ++allowUi.balSeq;
  var mine = !!(cloud.me && to === cloud.me.id);
  allowUi.balFor = mine ? to : '';
  allowUi.bal = mine ? Math.max(0, Math.min(COIN_MAX, parseInt(prof().coins, 10) || 0)) : null;
  allowUi.balErr = '';
  paintAllowBalance();
  var res = await ghGet(profilePath(to));
  if (seq !== allowUi.balSeq || allowUi.to !== to) return;
  allowUi.balFor = to;
  if (!res.ok) {
    allowUi.bal = null;
    allowUi.balErr = res.error || '연결을 확인해 주세요.';
  } else if (res.missing || !res.data) {
    allowUi.bal = 0;          /* 아직 프로필이 없는 계정 = 코인 0 */
    allowUi.balErr = '';
  } else {
    allowUi.bal = Math.max(0, Math.min(COIN_MAX, parseInt(normalizeProfile(res.data, to).coins, 10) || 0));
    allowUi.balErr = '';
  }
  paintAllowBalance();
}

function openAllowance() {
  if (!can('edit') || !cloud.me || cloud.me.role === 'child') return;
  var list = allowUserList(), ok = false;
  for (var i = 0; i < list.length; i++) if (list[i].id === allowUi.to) ok = true;
  if (!ok) allowUi.to = defaultAllowTarget();
  allowUi.mode = 'add';
  allowUi.msg = '';
  allowUi.err = false;
  allowUi.busy = false;
  allowUi.bal = null;
  allowUi.balFor = '';
  allowUi.balErr = '';
  allowUi.balSeq++;
  if (!(allowUi.amount > 0)) allowUi.amount = 50;
  openAccounts('coin');
}
function closeAllowance() {
  allowUi.balSeq++;
  closeAccounts();
}

function allowPrevHtml() {
  var mode = allowModeOf();
  var n = allowAmountOf(allowUi.amount);
  var name = esc(allowName(allowUi.to));
  var bal = allowKnownBal();
  var h;
  if (mode === 'set') {
    h = name + '의 코인을 ' + coinSvg() + ' <b>' + fmtNum(n) + '</b>개로 맞추기';
    if (bal != null) {
      var d2 = n - bal;
      h += ' <span class="allow-diff">(지금 ' + fmtNum(bal) + ' → ' + fmtNum(n) + ' · ' +
        (d2 ? (d2 > 0 ? '+' : '') + fmtNum(d2) : '그대로') + ')</span>';
    }
  } else {
    var d = (mode === 'sub' ? -1 : 1) * n;
    h = name + '에게 ' + coinSvg() + ' <b>' + (d > 0 ? '+' : '-') + fmtNum(Math.abs(d)) + '</b> 코인';
    if (bal != null) {
      h += ' <span class="allow-diff">(지금 ' + fmtNum(bal) + ' → ' + fmtNum(Math.max(0, Math.min(COIN_MAX, bal + d))) + ')</span>';
    }
  }
  if (allowUi.reason) h += '<br>“' + esc(allowUi.reason) + '”';
  return h;
}

function renderAllowance() {
  var b = document.getElementById('allowBody');
  if (!b) return;
  var list = allowUserList(), i, me = (cloud.me && cloud.me.id) || '';
  var mode = allowModeOf();
  var n = allowAmountOf(allowUi.amount);
  var h = '';
  if (!list.length) {
    h += '<p class="lf-note">가족 계정이 아직 없어요. 👥 계정에서 먼저 만들어 주세요.</p>';
  } else {
    h += '<label class="allow-target"><span>받는 사람</span><select class="inp" data-field="allowTarget" aria-label="받는 사람">';
    for (i = 0; i < list.length; i++) {
      h += '<option value="' + esc(list[i].id) + '"' + (allowUi.to === list[i].id ? ' selected' : '') + '>' +
        esc(list[i].name || list[i].id) + ' · ' + esc(roleLabel(list[i].role)) + (list[i].id === me ? ' (나)' : '') + '</option>';
    }
    h += '</select></label>';
  }

  h += '<div class="allow-bal" id="allowBal" aria-live="polite">' + allowBalanceHtml() + '</div>';

  h += '<div class="allow-row3">' +
    '<button type="button" class="allow-mode add' + (mode === 'add' ? ' on' : '') + '" data-act="allow-mode" data-mode="add" data-minus="0" aria-pressed="' + (mode === 'add') + '"><b>+ 주기</b><span>용돈</span></button>' +
    '<button type="button" class="allow-mode sub' + (mode === 'sub' ? ' on' : '') + '" data-act="allow-mode" data-mode="sub" data-minus="1" aria-pressed="' + (mode === 'sub') + '"><b>- 빼기</b><span>차감</span></button>' +
    '<button type="button" class="allow-mode set' + (mode === 'set' ? ' on' : '') + '" data-act="allow-mode" data-mode="set" data-minus="0" aria-pressed="' + (mode === 'set') + '"><b>= 직접 맞추기</b><span>설정</span></button>' +
    '</div>';

  h += '<div class="allow-quick">';
  if (mode === 'set') {
    var qs2 = [0, 50, 100, 300];
    for (i = 0; i < qs2.length; i++) {
      h += '<button type="button" class="qbtn' + (n === qs2[i] ? ' on' : '') + '" data-act="allow-quick" data-n="' + qs2[i] + '">' + fmtNum(qs2[i]) + '</button>';
    }
  } else {
    var qs = [10, 30, 50, 100];
    for (i = 0; i < qs.length; i++) {
      h += '<button type="button" class="qbtn' + (n === qs[i] ? ' on' : '') + '" data-act="allow-quick" data-n="' + qs[i] + '">' +
        (mode === 'sub' ? '-' : '+') + qs[i] + '</button>';
    }
  }
  h += '</div>';

  h += '<div class="allow-line">' + (mode === 'set' ? '맞출 코인' : '코인 수') +
    ' <input class="inp" type="number" min="' + (mode === 'set' ? 0 : 1) + '" max="' + COIN_MAX + '" step="1" inputmode="numeric" data-field="allowAmount" value="' + n + '" aria-label="' + (mode === 'set' ? '맞출 코인' : '코인 수') + '">' +
    (mode === 'set' ? '' : ' 코인') + '</div>';
  h += '<div class="allow-line">' + (mode === 'add' ? '한마디' : '메모') +
    ' <input class="inp" type="text" maxlength="40" data-field="allowReason" value="' + esc(allowUi.reason) + '" placeholder="' +
    (mode === 'add' ? '예: 심부름 도와줘서 고마워!' : (mode === 'sub' ? '예: 약속을 못 지켰어요' : '예: 형제 코인을 맞춰 줘요')) +
    '" aria-label="' + (mode === 'add' ? '한마디' : '메모') + '"></div>';
  h += '<div class="allow-prev" id="allowPrev">' + allowPrevHtml() + '</div>';
  if (allowUi.msg) h += '<p class="allow-msg' + (allowUi.err ? ' err' : '') + '">' + esc(allowUi.msg) + '</p>';
  h += '<div class="care-actions">' +
    '<button type="button" class="pill-btn warm" data-act="allow-send"' + (allowUi.busy ? ' disabled' : '') + '>' +
    (allowUi.busy ? '저장하는 중…' : (mode === 'add' ? '보내기' : (mode === 'sub' ? '빼기' : '맞추기'))) + '</button>' +
    '<button type="button" class="ghost-btn" data-act="allow-close">닫기</button></div>';
  h += '<p class="lf-note">' + (mode === 'add'
    ? '보낸 코인은 아이가 다음에 로그인할 때 알림으로 알려 줘요.'
    : '빼기·맞추기는 알림 없이 코인만 바뀌어요. 코인은 0보다 작아지지 않아요.') + '</p>';
  b.innerHTML = h;
}

async function sendAllowance() {
  if (!can('edit') || allowUi.busy) return;
  var mode = allowModeOf();
  var to = allowUi.to;
  if (!to) { allowUi.err = true; allowUi.msg = '받는 사람을 골라 주세요.'; renderAllowance(); return; }
  var n = allowAmountOf(allowUi.amount);
  if (mode !== 'set' && n < 1) {
    allowUi.err = true;
    allowUi.msg = mode === 'sub' ? '뺄 코인 수를 1개 이상 적어 주세요.' : '보낼 코인 수를 1개 이상 적어 주세요.';
    renderAllowance();
    return;
  }
  allowUi.busy = true;
  allowUi.msg = '';
  allowUi.err = false;
  renderAllowance();

  var res = await ghGet(profilePath(to));
  if (!res.ok) {
    allowUi.busy = false;
    allowUi.err = true;
    allowUi.msg = '불러오지 못했어요. ' + (res.error || '연결을 확인해 주세요.');
    renderAllowance();
    return;
  }
  var raw = (res.data && typeof res.data === 'object') ? clone(res.data) : null;
  if (!raw) {
    /* 아직 프로필이 없는 계정이면 깨끗한 상태에서 시작해요 (기본 코인은 빼고) */
    raw = defaultProfile();
    raw.coins = 0;
    raw.clearedAt = 0;
  }
  var before = Math.max(0, Math.min(COIN_MAX, parseInt(raw.coins, 10) || 0));
  var after;
  if (mode === 'set') after = n;
  else if (mode === 'sub') after = Math.max(0, before - n);
  else after = Math.min(COIN_MAX, before + n);
  var delta = after - before;
  raw.coins = after;
  raw.updatedAt = new Date().toISOString();
  var notes = (Object.prototype.toString.call(raw.allowanceNotices) === '[object Array]') ? raw.allowanceNotices : [];
  notes.push({
    id: uid('al'),
    at: Date.now(),
    amount: delta,
    before: before,
    after: after,
    mode: (mode === 'add' ? 'give' : mode),   /* give = 용돈 주기, sub = 빼기, set = 직접 맞추기 */
    reason: String(allowUi.reason || '').slice(0, 40),
    from: (cloud.me && cloud.me.id) || '',
    fromName: (cloud.me && cloud.me.name) || '',
    read: mode !== 'add'   /* 용돈 주기만 아이에게 축하 알림으로 떠요 */
  });
  raw.allowanceNotices = notes.slice(-30);

  var put = await ghPut(profilePath(to), raw,
    (mode === 'set' ? '코인 맞추기 ' : (mode === 'sub' ? '코인 빼기 ' : '코인 용돈 ')) + after + ' · ' + to);
  allowUi.busy = false;
  if (!put.ok) {
    allowUi.err = true;
    allowUi.msg = (mode === 'add' ? '보내지' : '저장하지') + ' 못했어요. ' + (put.error || '잠시 뒤 다시 해 주세요.');
    renderAllowance();
    return;
  }

  /* 방금 저장한 값으로 지금 코인을 바로 맞춰 둬요 */
  allowUi.balFor = to;
  allowUi.bal = after;
  allowUi.balErr = '';

  /* 나에게 바꾼 경우엔 이 기기 화면(헤더·마이룸 코인)도 바로 맞춰요 */
  if (to === ((cloud.me && cloud.me.id) || '')) {
    prof().coins = after;
    prof().allowanceNotices = raw.allowanceNotices;
    prof().updatedAt = raw.updatedAt;
    writeProfileCache(cloud.me.id, prof());
    lastProfileSig = profileSignature();
    cloud.lastProfileSig = lastProfileSig;
    renderCoinBadge(delta);
    renderAll();
    var rm = document.getElementById('roomModal');
    if (rm && !rm.hidden) renderRoom();
  }

  var nm = allowName(to);
  allowUi.err = false;
  if (mode === 'set') {
    allowUi.msg = nm + '의 코인을 ' + fmtNum(after) + '개로 맞췄어요!' +
      (delta ? ' (지금 ' + fmtNum(after) + '코인 · ' + (delta > 0 ? '+' : '') + fmtNum(delta) + ')' : ' (원래 그대로예요)');
  } else if (mode === 'sub') {
    allowUi.msg = nm + '의 코인을 ' + fmtNum(Math.abs(delta)) + '개 뺐어요! (지금 ' + fmtNum(after) + '코인' +
      (delta === 0 ? ' · 이미 0코인이라 더 빼지 않았어요' : '') + ')';
  } else {
    allowUi.msg = nm + '에게 코인 ' + fmtNum(n) + '개를 보냈어요! (지금 ' + fmtNum(after) + '코인)';
  }
  allowUi.reason = '';
  snd('chime');
  showToast(mode === 'add' ? ('🎁 ' + nm + '에게 코인 ' + fmtNum(n) + '개를 보냈어요!')
    : (mode === 'sub' ? ('↩️ ' + nm + '의 코인 ' + fmtNum(Math.abs(delta)) + '개를 뺐어요')
      : ('🎯 ' + nm + '의 코인을 ' + fmtNum(after) + '개로 맞췄어요')), false);
  renderAllowance();
}

/* 아이 화면: 받지 않은 코인 용돈 알림 */
function unreadAllowances() {
  var p = prof(), list = (Object.prototype.toString.call(p.allowanceNotices) === '[object Array]') ? p.allowanceNotices : [];
  var out = [];
  for (var i = 0; i < list.length; i++) if (list[i] && !list[i].read && list[i].amount) out.push(list[i]);
  return out;
}

function allowWhen(ms) {
  var t = Number(ms) || 0;
  if (!t) return '방금';
  var d = new Date(t);
  if (isNaN(d.getTime())) return '방금';
  var diff = Date.now() - t;
  if (diff < 60 * 1000) return '방금';
  if (diff < 60 * 60 * 1000) return Math.floor(diff / 60000) + '분 전';
  if (diff < 24 * 60 * 60 * 1000) return Math.floor(diff / 3600000) + '시간 전';
  return (d.getMonth() + 1) + '월 ' + d.getDate() + '일';
}

function renderAllowanceNotice(list) {
  var b = document.getElementById('allowNoticeBody');
  if (!b) return;
  var total = 0, senders = [], i, h = '';
  for (i = 0; i < list.length; i++) {
    total += list[i].amount;
    var nm = list[i].fromName || '가족';
    if (senders.indexOf(nm) < 0) senders.push(nm);
  }
  h += '<div class="an-big">' + coinSvg() + '<span>' + (total >= 0 ? '+' : '') + fmtNum(total) + '</span></div>';
  h += '<p class="an-who">' + (senders.length === 1 ? esc(josa(senders[0], '이', '가')) + ' 보냈어요' : '가족이 보냈어요') + '</p>';
  var ttl = document.getElementById('allowNoticeTitle');
  if (ttl) ttl.textContent = total < 0 ? '코인을 잠시 가져갔어요' : '코인 용돈이 도착했어요!';
  var emo = document.querySelector('#allowNoticeModal .modal-emoji');
  if (emo) emo.textContent = total < 0 ? '↩️' : '🎁';
  if (list.length > 1) h += '<p class="lf-note">알림 ' + list.length + '개를 모아서 보여 줘요.</p>';
  h += '<div class="an-list">';
  for (i = list.length - 1; i >= 0; i--) {
    var nt = list[i];
    h += '<div class="an-item">' +
      '<div class="an-amt">' + coinSvg() + ' ' + (nt.amount > 0 ? '+' : '') + fmtNum(nt.amount) + ' 코인</div>' +
      (nt.reason ? '<div class="an-why">“' + esc(nt.reason) + '”</div>' : '') +
      '<div class="an-from">' + esc(nt.fromName || '가족') + '님 · ' + esc(allowWhen(nt.at)) + '</div>' +
      '</div>';
  }
  h += '</div>';
  b.innerHTML = h;
}

function maybeAllowanceNotice() {
  var m = document.getElementById('allowNoticeModal');
  if (!m || !m.hidden) return;
  if (!cloud.me) return;
  var list = unreadAllowances();
  if (!list.length) return;
  renderAllowanceNotice(list);
  m.hidden = false;
  raiseModal('allowNoticeModal');
  lockScroll();
  snd('chime');
}

function acceptAllowance() {
  var p = prof();
  var list = (Object.prototype.toString.call(p.allowanceNotices) === '[object Array]') ? p.allowanceNotices : [];
  var had = false;
  for (var i = 0; i < list.length; i++) {
    if (!list[i].read) had = true;
    list[i].read = true;
  }
  p.updatedAt = new Date().toISOString();
  if (cloud.me) {
    writeProfileCache(cloud.me.id, p);
    lastProfileSig = profileSignature();
    cloud.lastProfileSig = lastProfileSig;
    scheduleSync('profile');
  }
  var m = document.getElementById('allowNoticeModal');
  if (m) m.hidden = true;
  if (isOnlyModal('allowNoticeModal')) unlockScroll();
  if (had) {
    snd('sticker');
    showToast('🎁 코인 용돈을 받았어요! 고마워요!');
  }
  renderCoinBadge();
}

/* ---------- 🔔 알림 소리 고르기 (부모님용) ---------- */
function alertPickerHtml() {
  var cur = alertSoundId(), i, h = '<div class="as-list">';
  for (i = 0; i < ALERT_SOUNDS.length; i++) {
    var p = ALERT_SOUNDS[i];
    h += '<button type="button" class="as-chip' + (p.id === cur ? ' on' : '') + '" data-act="alert-sound-pick" data-sound="' + p.id +
      '" aria-pressed="' + (p.id === cur ? 'true' : 'false') + '">' + esc(p.name) + '</button>';
  }
  var list = customAlertSounds();
  for (i = 0; i < list.length; i++) {
    var c = list[i];
    h += '<span class="as-chip-wrap">' +
      '<button type="button" class="as-chip' + (c.id === cur ? ' on' : '') + '" data-act="alert-sound-pick" data-sound="' + esc(c.id) +
      '" aria-pressed="' + (c.id === cur ? 'true' : 'false') + '">' + esc(c.name) + '</button>' +
      '<button type="button" class="as-del" data-act="alert-sound-del" data-sound="' + esc(c.id) +
      '" aria-label="' + esc(c.name) + ' 지우기">✕</button></span>';
  }
  h += '</div>' +
    '<div class="as-actions">' +
      '<button type="button" class="ghost-btn tiny" data-act="alert-sound-test">▶ 미리 듣기 · ' + esc(alertSoundName(cur).replace(/^\S+\s/, '')) + '</button>' +
      '<label class="ghost-btn tiny as-add">＋ 내 알림음 추가<input type="file" accept="audio/*,.mp3,.m4a,.wav,.ogg" data-act="alert-sound-file" hidden></label>' +
    '</div>' +
    '<div class="as-url">' +
      '<input class="inp inp-sm" data-field="customSoundName" maxlength="24" placeholder="이름 (예: 할머니 목소리)" aria-label="내 알림음 이름">' +
      '<input class="inp inp-sm" data-field="customSoundUrl" placeholder="소리 주소 (https://...)" aria-label="내 알림음 주소">' +
      '<button type="button" class="ghost-btn tiny" data-act="alert-sound-url-add">＋ 주소로 추가</button>' +
    '</div>';
  return h;
}

function setAlertSound(id) {
  if (!alertSoundPreset(id) && !customAlertSound(id)) return false;
  state.settings.alertSound = id;
  saveState();
  return true;
}

function addCustomAlertSound(name, src) {
  var list = customAlertSounds().slice(0), i;
  if (list.length >= ALERT_CUSTOM_MAX) {
    showToast('내 알림음은 ' + ALERT_CUSTOM_MAX + '개까지 담을 수 있어요.');
    return null;
  }
  /* 가족 기기와 함께 쓰는 설정 파일이 너무 커지지 않게 (동기화 실패 방지) */
  var used = 0;
  for (i = 0; i < list.length; i++) used += String(list[i].src || '').length;
  if (used + String(src || '').length > 700000) {
    showToast('내 알림음 저장 공간이 가득 찼어요. 쓰지 않는 소리를 ✕로 지우고 다시 담아 주세요.');
    return null;
  }
  var id = 'c' + String(Date.now()).slice(-6) + String(Math.floor(Math.random() * 90) + 10);
  var item = { id: id, name: String(name || '내 알림음').slice(0, 24) || '내 알림음', src: src };
  list.push(item);
  state.settings.customAlertSounds = list;
  state.settings.alertSound = id;
  saveState();
  return item;
}

function removeCustomAlertSound(id) {
  var list = customAlertSounds(), out = [];
  for (var i = 0; i < list.length; i++) if (list[i].id !== id) out.push(list[i]);
  state.settings.customAlertSounds = out;
  if (state.settings.alertSound === id) state.settings.alertSound = ALERT_SOUND_DEFAULT;
  delete alertWavCache[id];
  saveState();
}

function pickAlertSound(id) {
  if (!can('edit')) return;
  if (!setAlertSound(id)) return;
  renderEditPanel();
  previewAlertSound(id);
}

function deleteAlertSound(id) {
  if (!can('edit')) return;
  var c = customAlertSound(id);
  if (!c) return;
  var was = (state.settings.alertSound === id);
  removeCustomAlertSound(id);
  renderEditPanel();
  showToast('🗑️ "' + c.name + '"을(를) 지웠어요.' + (was ? ' 알림 소리는 ' + alertSoundName(alertSoundId()) + '(으)로 바뀌었어요.' : ''));
}

function readAlertSoundFile(file) {
  if (!file) return;
  if (!can('edit')) return;
  if (file.size > ALERT_CUSTOM_BYTES) {
    showToast('소리 파일이 너무 커요(' + Math.round(file.size / 1024) + 'KB). 500KB 이하 짧은 소리로 올려 주세요.');
    return;
  }
  if (typeof window.FileReader !== 'function') {
    showToast('이 브라우저에서는 파일을 불러올 수 없어요.');
    return;
  }
  var reader = new window.FileReader();
  reader.onload = function () {
    var src = String(reader.result || '');
    if (src.indexOf('data:audio/') !== 0) {
      showToast('오디오 파일(mp3·m4a·wav·ogg)만 올릴 수 있어요.');
      return;
    }
    var nm = String(file.name || '내 알림음').replace(/\.[a-z0-9]+$/i, '').slice(0, 24) || '내 알림음';
    var item = addCustomAlertSound(nm, src);
    if (!item) return;
    renderEditPanel();
    showToast('➕ "' + nm + '"을(를) 내 알림음에 담았어요.');
    previewAlertSound(item.id);
  };
  reader.onerror = function () { showToast('소리 파일을 읽지 못했어요. 다시 시도해 주세요.'); };
  reader.readAsDataURL(file);
}

function addAlertSoundFromUrl() {
  if (!can('edit')) return;
  var panel = document.getElementById('editPanel') || document;
  var nameEl = panel.querySelector('[data-field="customSoundName"]');
  var urlEl = panel.querySelector('[data-field="customSoundUrl"]');
  var name = nameEl ? String(nameEl.value || '').trim().slice(0, 24) : '';
  var url = urlEl ? String(urlEl.value || '').trim() : '';
  if (!url) { showToast('소리 주소(URL)를 넣어 주세요.'); return; }
  if (!/^(https?:\/\/|data:audio\/)/i.test(url)) { showToast('http(s) 주소나 data:audio 소리만 쓸 수 있어요.'); return; }
  if (!name) name = '내 알림음 ' + (customAlertSounds().length + 1);
  var item = addCustomAlertSound(name, url);
  if (!item) return;
  renderEditPanel();
  showToast('➕ "' + name + '"을(를) 내 알림음에 담았어요.');
  previewAlertSound(item.id);
}

document.addEventListener('change', function (e) {
  var el = e.target;
  if (!el || !el.getAttribute) return;
  if (el.getAttribute('data-act') !== 'alert-sound-file') return;
  var f = el.files && el.files[0];
  el.value = '';
  readAlertSoundFile(f);
});

/* 수정 창에서 값을 바꾸면 900ms를 기다리지 않고 서버로 바로 보내요.
   (글자를 칠 때마다 요청을 쏘지 않게 350ms만 모아서 보내고, 저장 버튼은 즉시 보내요) */
var fieldPushTimer = 0;
function pushSoon() {
  if (fieldPushTimer) window.clearTimeout(fieldPushTimer);
  fieldPushTimer = window.setTimeout(function () {
    fieldPushTimer = 0;
    pushNow();
  }, 350);
}
document.addEventListener('input', function (e) {
  var el = e.target;
  if (!el || !el.getAttribute) return;
  if (el.hasAttribute('data-field') || el.hasAttribute('data-var') || el.hasAttribute('data-ritem')) pushSoon();
}, true);
document.addEventListener('change', function (e) {
  var el = e.target;
  if (!el || !el.getAttribute) return;
  if (el.hasAttribute('data-field') || el.hasAttribute('data-var') || el.hasAttribute('data-ritem')) pushSoon();
}, true);

/* 버튼으로 고친 것(색·요일·순서·항목·스티커 설정 등)도 곧바로 서버로 보내요 */
document.addEventListener('click', function (e) {
  var el = (e.target && e.target.closest) ? e.target.closest('[data-act]') : null;
  if (!el) return;
  var act = el.getAttribute('data-act') || '';
  if (act.indexOf('cat-') === 0 || act.indexOf('msn-') === 0 || act.indexOf('rcl-') === 0 ||
      act.indexOf('diy-') === 0 || act.indexOf('nb-') === 0 || act.indexOf('sticker-') === 0 ||
      act === 'add-item' || act === 'del-item' || act === 'item-up' || act === 'item-down' ||
      act === 'add-event' || act === 'del-event' || act === 'vars-reset' || act === 'sec-size-reset') {
    pushSoon();
  }
}, false);

/* ============ 동작 ============ */
/* ⚙️ 전체 설정 — 모든 카드에 공통인 것(알림음·변수·화면 배치)을 다뤄요.
   카드 하나만 고칠 때는 그 카드의 ✏️를 바로 누르면 돼요. */
function toggleEdit() {
  if (!can('edit')) return;
  ui.editing = !ui.editing;
  if (!ui.editing) ui.layout = false;
  ui.inlineEditSecId = '';
  epUi.tab = '';
  try { unlockScroll(); } catch (e0) { /* 무시 */ }
  var btn = document.getElementById('editBtn');
  if (btn) {
    setBtnLabel(btn, ui.editing ? '✅' : '⚙️', ui.editing ? '설정 닫기' : '전체 설정');
    if (ui.editing) btn.classList.add('on');
    else btn.classList.remove('on');
  }
  renderEditPanel();
  renderSections();
  renderSectionTitles();
  renderRoutine();
  renderWeek();
  renderStickers();
  renderTodayAcademy();
  renderTargetBars();
  renderNoticeBlocks();
  updateOverall(true);
}

/* 📐 화면 배치 모드 — 카드를 끌어 옮기고, 숨기고, 크기를 조절해요 */
function toggleLayoutMode() {
  if (!can('edit')) return;
  ui.layout = !ui.layout;
  if (ui.layout && !ui.editing) ui.editing = true;
  ui.inlineEditSecId = '';
  renderEditPanel();
  renderSections();
  renderRoutine();
  renderStickers();
  renderWeek();
  renderTodayAcademy();
  renderNoticeBlocks();
  renderTargetBars();
  updateOverall(true);
  showToast(ui.layout
    ? '📐 화면 배치 모드 — ⠿로 옮기고, ↘로 크기를 맞추고, 눈 아이콘으로 숨겨요.'
    : '📐 화면 배치 모드를 끘어요. 카드는 그대로 남아 있어요.');
}

function toggleSound() {
  if (!can('check')) return;
  state.settings.soundOn = !state.settings.soundOn;
  saveState();
  renderSoundBtn();
  if (state.settings.soundOn) { unlockAudio(); snd('chime'); }
  else showToast('🔕 소리를 껐어요');
}

function resetAll() {
  if (!window.confirm('정말 처음 상태로 돌아갈까요?\n체크 기록, 스티커, 시간표, 이름이 모두 초기화돼요.\n(코인·펫·마이룸은 그대로 남아요.)')) return;
  var keepProfile = state.profile;
  state = defaultState();
  state.profile = keepProfile;
  ui.editing = false;
  ui.layout = false;
  var btn = document.getElementById('editBtn');
  if (btn) {
    setBtnLabel(btn, '⚙️', '전체 설정');
    btn.classList.remove('on');
  }
  saveState();
  renderAll();
}

/* ============ 문제지 / 스티커 원장 / 통계 / 섹션 순서 ============ */
var reasonState = { custom: false, msg: '', shape: '', shapeNew: false, shapeMsg: '' };
/* ⚙️ 전체 설정 > ⭐ 스티커 안의 모양 관리 상태 */
var editPanelShapeNew = false, editPanelShapeMsg = '';
var spendState = { item: '', count: 1, date: '', msg: '' };
var wbState = { sel: [], msg: '', itemId: '', catId: '' };

/* ---- '문제지 풀기' 루틴 항목 ←→ 문제지 목록 연결 ---- */
function isWbItemText(text) {
  return String(text || '').replace(/\s+/g, '').indexOf('문제지풀기') >= 0;
}

function itemPickMap(key) {
  key = key || currentKey;
  if (!state.workbookItemPicks || typeof state.workbookItemPicks !== 'object') state.workbookItemPicks = {};
  if (!state.workbookItemPicks[key] || typeof state.workbookItemPicks[key] !== 'object') state.workbookItemPicks[key] = {};
  return state.workbookItemPicks[key];
}

function pickForItem(itemId, key) {
  key = key || currentKey;
  var map = itemPickMap(key);
  if (map[itemId]) return cleanPick(map[itemId]);
  /* 예전 날짜 단위 선택은 첫 '문제지 풀기' 항목에 그대로 이어 줘요 */
  var any = false;
  for (var k in map) if (Object.prototype.hasOwnProperty.call(map, k)) { any = true; break; }
  if (!any) return cleanPick(state.workbookPicks ? state.workbookPicks[key] : null);
  return { sel: [], done: [] };
}

function wbTagsHtml(itemId) {
  var pick = pickForItem(itemId, currentKey);
  var h = '<span class="wb-tags">';
  if (!pick.sel.length) {
    h += '<span class="wb-tag none">📚 문제지를 골라 보세요</span>';
  } else {
    var max = 3;
    for (var i = 0; i < pick.sel.length && i < max; i++) {
      var w = pick.sel[i];
      var done = false;
      for (var j = 0; j < pick.done.length; j++) if (pick.done[j].id === w.id) done = true;
      h += '<span class="wb-tag' + (done ? ' done' : '') + '">' + (done ? '✓ ' : '') + esc(w.name) + '</span>';
    }
    if (pick.sel.length > max) h += '<span class="wb-tag more">+' + (pick.sel.length - max) + '</span>';
  }
  h += '</span>';
  return h;
}

/* 📚 문제지 고르기 상자 — 그룹마다 켜고 끄기 (예전엔 '저녁 공부' 그룹에만 고정) */
function catWbOn(cat) {
  if (!cat) return false;
  if (cat.showWorkbooks === true) return true;
  if (cat.showWorkbooks === false) return false;
  return cat.id === 'study';      /* 예전 설정과 같은 모습: 저녁 공부는 기본으로 보여요 */
}

function setCatShowWb(id, on) {
  if (!can('edit')) return;
  var c = findCat(id);
  if (!c) return;
  var was = catWbOn(c);
  c.showWorkbooks = !!on;
  saveState();
  if (was !== !!on) syncWbBoxIn(id, !!on);
  renderRoutine();
  showToast(on ? '📚 문제지 고르기를 보여 줄게요.' : '📚 문제지 고르기를 숨겼어요.');
}

/* 편집 창 안 카드도 새로 그리지 않고 상자만 바로 붙였다 뗐다 해요 */
function syncWbBoxIn(id, on) {
  var cards = document.querySelectorAll('.routine-card[data-cat="' + id + '"]');
  for (var i = 0; i < cards.length; i++) {
    var card = cards[i];
    var box = card.querySelector('.wb-box');
    if (on && !box) {
      var holder = document.createElement('div');
      holder.innerHTML = wbBoxHtml();
      var node = holder.firstChild;
      if (!node) continue;
      var anchor = card.querySelector('.rc-bonus') || card.querySelector('.add-item');
      if (anchor) card.insertBefore(node, anchor);
      else card.appendChild(node);
    } else if (!on && box) {
      box.parentNode.removeChild(box);
    }
  }
}

function wbBoxHtml() {
  var pick = cleanPick(state.workbookPicks ? state.workbookPicks[currentKey] : null);
  var h = '<div class="wb-box">';
  h += '<div class="wb-head"><span>📚 오늘 풀 문제지</span>' +
    (can('check') ? '<button type="button" class="wb-pick" data-act="wb-open">고르기</button>' : '') + '</div>';
  h += '<div class="wb-chips">';
  if (!pick.sel.length) {
    h += '<span class="wb-empty">아직 고르지 않았어요' + (can('check') ? ' · [고르기]를 눌러 보세요' : '') + '</span>';
  } else {
    for (var i = 0; i < pick.sel.length; i++) {
      var w = pick.sel[i];
      var done = false;
      for (var j = 0; j < pick.done.length; j++) if (pick.done[j].id === w.id) done = true;
      if (can('check')) {
        h += '<button type="button" class="wb-chip' + (done ? ' done' : '') + '" data-act="wb-toggle" data-id="' + esc(w.id) + '">' +
          (done ? '✓ ' : '') + esc(w.name) + '</button>';
      } else {
        h += '<span class="wb-chip locked' + (done ? ' done' : '') + '">' + (done ? '✓ ' : '') + esc(w.name) + '</span>';
      }
    }
  }
  h += '</div></div>';
  return h;
}

function openWb() {
  if (!can('check')) return;
  var pick = cleanPick(state.workbookPicks[currentKey]);
  wbState = { sel: [], msg: '', itemId: '', catId: '' };
  for (var i = 0; i < pick.sel.length; i++) wbState.sel.push(pick.sel[i].id);
  renderWb();
  var m = document.getElementById('wbModal');
  if (m) m.hidden = false;
  lockScroll();
}

function openWbForItem(el) {
  if (!can('check') || !el) return;
  var catId = el.getAttribute('data-cat') || '';
  var itemId = el.getAttribute('data-item') || '';
  var pick = pickForItem(itemId, currentKey);
  wbState = { sel: [], msg: '', itemId: itemId, catId: catId };
  for (var i = 0; i < pick.sel.length; i++) wbState.sel.push(pick.sel[i].id);
  renderWb();
  var m = document.getElementById('wbModal');
  if (m) m.hidden = false;
  lockScroll();
}

function closeWb() {
  var m = document.getElementById('wbModal');
  if (m) m.hidden = true;
  if (isOnlyModal('wbModal')) unlockScroll();
}

/* ============ 💬 요청하기 — 사무실 접수함으로 보내기 ============
   아이·가족이 화면에서 적은 요구를 사무실(inbox.json)에 그대로 덧붙여요.
   기존 항목은 건드리지 않고, 다른 기기가 먼저 저장했으면 다시 읽어 이어 붙입니다. */
var INBOX_PATH = 'ai-office/inbox.json';
var reqUi = { kind: '불편', busy: false };
var REQ_KINDS = [['불편', '😣 불편'], ['요청', '🙏 요청'], ['질문', '❓ 질문']];

function reqKindsHtml() {
  var h = '';
  for (var i = 0; i < REQ_KINDS.length; i++) {
    var k = REQ_KINDS[i][0];
    var on = reqUi.kind === k;
    h += '<button type="button" class="req-kind' + (on ? ' on' : '') + '" data-act="req-kind" data-k="' + esc(k) + '" aria-pressed="' + (on ? 'true' : 'false') + '">' + REQ_KINDS[i][1] + '</button>';
  }
  return h;
}

function renderReqKinds() {
  var box = document.getElementById('reqKinds');
  if (box) box.innerHTML = reqKindsHtml();
}

function openRequest() {
  var m = document.getElementById('reqModal');
  if (!m) return;
  reqUi.kind = reqUi.kind || '불편';
  renderReqKinds();
  m.hidden = false;
  raiseModal('reqModal');
  lockScroll();
  var t = document.getElementById('reqText');
  if (t) window.setTimeout(function () { try { t.focus(); } catch (e) { /* 무시 */ } }, 80);
}

function closeRequest() {
  var m = document.getElementById('reqModal');
  if (m) m.hidden = true;
  var t = document.getElementById('reqText');
  if (t) t.value = '';
  if (isOnlyModal('reqModal')) unlockScroll();
}

function inboxStamp(d) {
  return String(d.getFullYear()) + pad2(d.getMonth() + 1) + pad2(d.getDate()) +
    pad2(d.getHours()) + pad2(d.getMinutes()) + pad2(d.getSeconds());
}

function inboxRand4() {
  var pool = 'abcdefghijklmnopqrstuvwxyz0123456789', out = '';
  for (var i = 0; i < 4; i++) out += pool.charAt(Math.floor(Math.random() * pool.length));
  return out;
}

/* 한 번만 저장해 보고 결과를 그대로 돌려줘요 (충돌은 부른 쪽이 다시 읽고 재시도) */
async function ghPutOnce(path, obj, message, sha) {
  var payload = {
    message: message || ('기록 업데이트: ' + path),
    content: b64encodeUtf8(JSON.stringify(obj, null, 2)),
    branch: (cloud.conn && cloud.conn.branch) || 'main'
  };
  if (sha) payload.sha = sha;
  try {
    var res = await window.fetch(ghBase() + '/contents/' + path, {
      method: 'PUT', headers: ghHeaders(), body: JSON.stringify(payload)
    });
    if (res.ok) {
      var j = await res.json();
      var ns = j && j.content && j.content.sha;
      if (ns) rememberSha(path, ns);
      return { ok: true, sha: ns || '' };
    }
    if (res.status === 409 || res.status === 422) return { ok: false, conflict: true, status: res.status };
    if (res.status === 401) return { ok: false, status: 401, error: '토큰이 올바르지 않아요' };
    if (res.status === 403) return { ok: false, status: 403, error: '쓰기 권한이 없어요' };
    return { ok: false, status: res.status, error: 'HTTP ' + res.status };
  } catch (e) {
    return { ok: false, status: 0, error: '네트워크에 연결하지 못했어요' };
  }
}

async function appendInbox(item) {
  for (var attempt = 0; attempt < 4; attempt++) {
    var got = await ghGet(INBOX_PATH);
    if (!got.ok) return { ok: false, error: got.error || '접수함을 읽지 못했어요' };
    var box;
    if (got.missing || !got.data || Object.prototype.toString.call(got.data) !== '[object Object]') {
      box = { version: 1, updatedAt: item.at, items: [] };
    } else {
      box = got.data;
    }
    if (Object.prototype.toString.call(box.items) !== '[object Array]') box.items = [];
    /* 아까 시도가 실제로 저장됐는데 응답만 놓쳤으면 또 넣지 않아요 */
    for (var i = 0; i < box.items.length; i++) {
      var it = box.items[i];
      if (it && String(it.id) === item.id) return { ok: true, already: true };
    }
    box.items.push(item);
    box.version = box.version || 1;
    box.updatedAt = item.at;
    var res = await ghPutOnce(INBOX_PATH, box, '대시보드 요청 접수: ' + item.kind + (item.name ? (' · ' + item.name) : ''), got.sha);
    if (res.ok) return { ok: true };
    if (res.conflict) {
      await new Promise(function (resolve) { window.setTimeout(resolve, 320 * (attempt + 1)); });
      continue;
    }
    return { ok: false, error: res.error || ('HTTP ' + res.status) };
  }
  return { ok: false, error: '다른 기기에서 먼저 저장했어요' };
}

async function sendRequest() {
  if (reqUi.busy) return;
  var ta = document.getElementById('reqText');
  var raw = ta ? String(ta.value || '') : '';
  if (!raw.replace(/\s/g, '')) {
    showToast('보낼 내용을 먼저 적어 주세요.');
    if (ta) { try { ta.focus(); } catch (e) { /* 무시 */ } }
    return;
  }
  if (!cloud.conn) {
    showToast('지금은 보낼 수 없어요. 연결을 확인한 뒤 다시 눌러 주세요.');
    return;
  }
  reqUi.busy = true;
  var btn = document.getElementById('reqSend');
  var label = btn ? btn.textContent : '';
  if (btn) { btn.disabled = true; btn.textContent = '보내는 중…'; }
  var now = new Date();
  var item = {
    id: 'ib-' + inboxStamp(now) + '-' + inboxRand4(),
    at: now.toISOString(),
    source: 'kids',
    sourceLabel: "Jaden's Today",
    kind: reqUi.kind || '요청',
    name: (cloud.me && cloud.me.name) || '',
    text: raw,
    status: 'new',
    handledAt: null
  };
  var res = await appendInbox(item);
  reqUi.busy = false;
  if (btn) { btn.disabled = false; btn.textContent = label || '보내기'; }
  if (res.ok) {
    closeRequest();
    showToast('사무실로 전달했어요!');
    return;
  }
  showToast('사무실로 전달하지 못했어요. 잠시 뒤 다시 보내 주세요.');
}

function isOnlyModal(id) {
  var ids = ['histModal', 'acctModal', 'reasonModal', 'spendModal', 'statsModal', 'wbModal', 'goalModal', 'winModal', 'petModal', 'evoModal', 'petHomeModal', 'roomModal', 'avatarModal', 'shopModal', 'careModal', 'allowModal', 'allowNoticeModal', 'targetAlertModal', 'bulkModal', 'reqModal', 'msnModal', 'rclModal', 'msnWinModal', 'achModal'];
  for (var i = 0; i < ids.length; i++) {
    if (ids[i] === id) continue;
    var el = document.getElementById(ids[i]);
    if (el && !el.hidden) return false;
  }
  return true;
}

function wbHtml() {
  var h = '<p class="lf-note">' + (wbState.itemId
    ? '오늘 푼 문제지를 골라 주세요. 고르면 이 항목이 바로 체크돼요.'
    : '오늘 풀 문제지를 골라 보세요. 고른 문제지는 루틴 카드에 생겨요.') + '</p>';
  h += '<div class="acct-list">';
  if (!state.workbooks.length) h += '<p class="spend-empty">등록된 문제지가 없어요. 편집 모드에서 추가해 주세요.</p>';
  for (var i = 0; i < state.workbooks.length; i++) {
    var w = state.workbooks[i];
    var on = wbState.sel.indexOf(w.id) >= 0;
    h += '<button type="button" class="wb-pick-row' + (on ? ' on' : '') + '" data-act="wb-pick" data-id="' + esc(w.id) + '">' +
      '<span class="nm">' + esc(w.name) + '</span><span class="tick"></span></button>';
  }
  h += '</div>';
  h += '<button class="lf-btn" type="button" data-act="wb-save" style="margin-top:12px">오늘은 이걸로!</button>';
  h += (wbState.itemId
    ? '<p class="lf-msg">모두 지우고 저장하면 이 항목의 체크가 풀려요.</p>'
    : '<p class="lf-msg">' + esc(wbState.msg || '') + '</p>');
  return h;
}

function renderWb() {
  var body = document.getElementById('wbBody');
  if (body) body.innerHTML = wbHtml();
}

function saveWbPick() {
  if (!can('check')) return;
  var sel = [];
  for (var i = 0; i < state.workbooks.length; i++) {
    var w = state.workbooks[i];
    if (wbState.sel.indexOf(w.id) >= 0) sel.push({ id: w.id, name: w.name });
  }
  if (wbState.itemId) {
    var prevItem = pickForItem(wbState.itemId, currentKey);
    var itemDone = [];
    for (var pj = 0; pj < prevItem.done.length; pj++) {
      for (var pk = 0; pk < sel.length; pk++) if (sel[pk].id === prevItem.done[pj].id) itemDone.push({ id: sel[pk].id, name: sel[pk].name });
    }
    itemPickMap(currentKey)[wbState.itemId] = { sel: sel, done: itemDone };
    /* 날짜 단위 기록도 같이 맞춰 둬요 (예전 화면·다른 기기와 호환) */
    state.workbookPicks[currentKey] = { sel: sel.slice(0), done: itemDone.slice(0) };
    var wbItemId = wbState.itemId;
    var wbCatId = wbState.catId;
    saveState();
    closeWb();
    setWbItemChecked(wbCatId, wbItemId, sel.length > 0);
    return;
  }
  var prev = cleanPick(state.workbookPicks[currentKey]);
  var done = [];
  for (var j = 0; j < prev.done.length; j++) {
    for (var k = 0; k < sel.length; k++) if (sel[k].id === prev.done[j].id) done.push({ id: sel[k].id, name: sel[k].name });
  }
  state.workbookPicks[currentKey] = { sel: sel, done: done };
  saveState();
  renderRoutine();
  closeWb();
}

/* '문제지 풀기' 항목의 체크 상태를 문제지 선택과 맞춰 줘요 */
function setWbItemChecked(catId, itemId, on) {
  if (!can('check') || !itemId) { renderRoutine(); return; }
  var ck = checksFor(currentKey);
  var was = !!ck[itemId];
  if (was === !!on) { renderRoutine(); return; }
  if (on) ck[itemId] = true;
  else delete ck[itemId];
  saveState();
  if (on) {
    var got = awardCheckCoins(itemId);
    if (got.coin && got.first) showToast(coinSvg() + ' +' + got.coin + ' 코인!', true);
    bumpProgress('workbook', 1);
    gainXp(XP_CHECK);
    var cat = findCat(catId);
    if (cat && cat.items.length) {
      var allDone = true;
      for (var gi = 0; gi < cat.items.length; gi++) if (!ck[cat.items[gi].id]) allDone = false;
      if (allDone) {
        var gcoin = awardGroupCoins(catId);
        if (gcoin) { showToast('🎉 ' + esc(cat.title || '루틴') + ' 완료! ' + coinSvg() + ' +' + gcoin, true); }
      }
    }
    snd('check');
  } else {
    revokeCheckCoins(itemId);
    bumpProgress('workbook', -1);
    gainXp(-XP_CHECK);
    snd('uncheck');
  }
  saveState();
  renderCoinBadge();
  renderRoutine();
  updateOverall(false);
}

function toggleWbDone(id) {
  if (!can('check') || !id) return;
  var pick = cleanPick(state.workbookPicks[currentKey]);
  var done = [];
  var found = false;
  for (var i = 0; i < pick.done.length; i++) {
    if (pick.done[i].id === id) { found = true; continue; }
    done.push(pick.done[i]);
  }
  if (!found) {
    for (var j = 0; j < pick.sel.length; j++) if (pick.sel[j].id === id) done.push({ id: pick.sel[j].id, name: pick.sel[j].name });
  }
  pick.done = done;
  state.workbookPicks[currentKey] = pick;
  saveState();
  renderRoutine();
  snd(found ? 'uncheck' : 'check');
}

/* ============ 계정별 대시보드 접근 권한 (가족 허브의 👥 계정 설정과 같은 규칙) ============ */
var DASH_ID = 'kids';
var DASH_IDS = ['kids', 'fridge', 'ledger'];
var DASH_DEFAULTS = {
  admin: ['kids', 'fridge', 'ledger'],
  parent: ['kids', 'fridge', 'ledger'],
  viewer: ['kids', 'fridge', 'ledger'],
  child: ['kids']
};
function dashboardsFor(u) {
  if (!u) return [];
  if (u.role === 'admin') return DASH_IDS.slice();
  if (Object.prototype.toString.call(u.dashboards) === '[object Array]') {
    var out = [];
    for (var i = 0; i < u.dashboards.length; i++) {
      var id = String(u.dashboards[i] == null ? '' : u.dashboards[i]);
      if (DASH_IDS.indexOf(id) >= 0 && out.indexOf(id) < 0) out.push(id);
    }
    return out;
  }
  var def = DASH_DEFAULTS[u.role] || DASH_IDS;
  return def.slice();
}
function dashAllowed(u) { return dashboardsFor(u).indexOf(DASH_ID) >= 0; }

function showLock() {
  var login = document.getElementById('loginScreen');
  var app = document.getElementById('appRoot');
  var lock = document.getElementById('lockScreen');
  splash.on = false;
  if (splash.timer) { window.clearTimeout(splash.timer); splash.timer = 0; }
  if (login) login.hidden = true;
  if (app) app.hidden = true;
  if (lock) lock.hidden = false;
  var who = document.getElementById('lockWho');
  if (who) {
    who.textContent = (cloud.me ? ((cloud.me.name || cloud.me.id) + ' 계정은 이 대시보드를 열 수 없어요.') : '') +
      ' 허브에서 관리자에게 요청해 주세요.';
  }
  renderSyncPill();
}

async function restoreSession(sess) {
  var u = findUserById(sess.id);
  /* 세션이 있으면 로그인 화면 대신 🏠 Jaden's Today 불러오는 화면을 먼저 보여 줘요.
     (오프라인이면 기기에 있던 것으로 바로 열려고 기다리지 않아요) */
  if (navigator.onLine !== false) {
    try { showSplash(); } catch (e0) { /* 무시 */ }
  }
  /* 갈 수 있는 대시보드 권한은 저장소의 최신 계정 파일로 확인해요 (관리자가 방금 바꿨을 수 있어요) */
  var fresh = await ghGet('config/users.json');
  if (fresh && fresh.ok && fresh.data && Object.prototype.toString.call(fresh.data.users) === '[object Array]') {
    cloud.users = fresh.data;
    saveUsersCache(fresh.data);
    u = findUserById(sess.id);
  }
  if (!u) {
    clearSession();
    showLogin('login');
    setLoginMsg('계정을 찾을 수 없어 다시 로그인해야 해요.');
    return;
  }
  cloud.me = { id: u.id, name: u.name || u.id, role: ROLES[u.role] ? u.role : 'viewer', dashboards: dashboardsFor(u) };
  saveSession(cloud.me, sess.store === 'local', sess);
  if (!dashAllowed(cloud.me)) { showLock(); return; }
  await enterDashboard({ splash: true });
  verifySession();
}

async function verifySession() {
  if (!cloud.conn || !cloud.me) return;
  var res = await ghGet('config/users.json');
  if (!res.ok || !res.data || Object.prototype.toString.call(res.data.users) !== '[object Array]') return;
  cloud.users = res.data;
  saveUsersCache(res.data);
  var u = findUserById(cloud.me.id);
  if (!u) {
    await doLogout(true);
    setLoginMsg('계정이 삭제되어 로그아웃했어요. 다시 로그인해 주세요.');
    return;
  }
  var role = ROLES[u.role] ? u.role : 'viewer';
  var name = u.name || u.id;
  if (!dashAllowed(u)) {
    cloud.me = { id: u.id, name: name, role: role, dashboards: dashboardsFor(u) };
    saveSession(cloud.me, !!(cloud.session && cloud.session.store === 'local'), cloud.session);
    showLock();
    return;
  }
  if (role !== cloud.me.role || name !== cloud.me.name || dashboardsFor(u).join(',') !== dashboardsFor(cloud.me).join(',')) {
    cloud.me = { id: u.id, name: name, role: role, dashboards: dashboardsFor(u) };
    saveSession(cloud.me, !!(cloud.session && cloud.session.store === 'local'), cloud.session);
    applyUserUi();
    applyPermissions();
  }
}

function setLoginMsg(text, ok) {
  var body = document.getElementById('loginBody');
  if (!body) return;
  if (!body.querySelector('#loginForm') && !body.querySelector('#setupForm')) renderLoginBody(cloud.conn ? 'login' : 'setup', true);
  var m = document.getElementById('loginMsg') || document.getElementById('setupMsg');
  if (m) { m.className = 'lf-msg' + (ok ? ' ok' : ''); m.textContent = text; }
}

/* ---- 사용자 표시 / 권한 적용 ---- */
function applyUserUi() {
  var me = cloud.me;
  var chip = document.getElementById('userChip');
  if (chip) chip.hidden = !me;
  if (!me) return;
  var av = document.getElementById('ucAv');
  if (av) av.textContent = initialOf(me.name || me.id);
  var nm = document.getElementById('ucName');
  if (nm) nm.textContent = me.name || me.id;
  var rl = document.getElementById('ucRole');
  if (rl) rl.textContent = roleLabel(me.role) + ' · ' + me.id;
}

function applyPermissions() {
  var editBtn = document.getElementById('editBtn');
  if (editBtn) editBtn.hidden = !can('edit');
  var accBtn = document.getElementById('accountsBtn');
  if (accBtn) accBtn.hidden = !acctCanOpen();
  var statsBtn = document.getElementById('statsBtn');
  if (statsBtn) statsBtn.hidden = !can('edit');
  var soundBtn = document.getElementById('soundBtn');
  if (soundBtn) soundBtn.hidden = !can('check');
  if (!can('edit')) { ui.editing = false; ui.layout = false; }
  renderEditPanel();
  renderSectionTitles();
  renderRoutine();
  renderStickers();
  updateOverall(true);
  renderSyncPill();
}

/* ---- 계정 관리 (계정 목록 · 코인 관리 · 스티커 관리) ---- */
var ACCT_TABS = [
  { id: 'list', label: '👥 계정 목록' },
  { id: 'coin', label: '🪙 코인 관리' },
  { id: 'sticker', label: '⭐ 스티커 관리' }
];

/* 관리자·보호자가 계정 창을 연다 (아이는 안 돼요) */
function acctCanOpen() {
  return can('accounts') || can('stickerManage');
}

function acctTabAllowed(id) {
  if (id === 'list') return can('accounts');
  if (id === 'coin') return can('edit') && !!(cloud.me && cloud.me.role !== 'child');
  if (id === 'sticker') return can('stickerManage');
  return false;
}

function acctTabsVisible() {
  var out = [];
  for (var i = 0; i < ACCT_TABS.length; i++) if (acctTabAllowed(ACCT_TABS[i].id)) out.push(ACCT_TABS[i]);
  return out;
}

function acctTabsHtml() {
  var list = acctTabsVisible();
  if (list.length < 2) return '';
  var h = '<div class="acct-tabs" role="tablist" aria-label="계정 관리 항목">';
  for (var i = 0; i < list.length; i++) {
    var on = (acct.tab === list[i].id);
    h += '<button type="button" class="acct-tab' + (on ? ' on' : '') + '" role="tab" data-act="acct-tab" data-tab="' + list[i].id +
      '" aria-selected="' + (on ? 'true' : 'false') + '">' + list[i].label + '</button>';
  }
  return h + '</div>';
}

function acctSumHtml() {
  var unit = state.sticker.unit || 1000;
  var earned = stickerTotal(), spent = spentCount(), left = remainStickers();
  return '<div class="acct-sum">' +
    '<span class="lchip">적립 <b>' + fmtNum(earned) + '개</b></span>' +
    '<span class="lchip use">사용 <b>' + fmtNum(spent) + '개</b></span>' +
    '<span class="lchip rem">남은 <b>' + fmtNum(left) + '개 · ' + fmtNum(left * unit) + '원</b></span>' +
    '</div>';
}

/* 🪙 코인 관리 — 전에 마이룸에 있던 + 주기 · - 빼기 · = 맞추기를 그대로 여기로 */
function acctCoinPaneHtml() {
  return '<h3 class="acct-pane-title" id="allowTitle">' + coinSvg() + ' 코인 용돈 조절</h3>' +
    '<div id="allowBody"></div>';
}

/* ⭐ 스티커 관리 — 여러 개 붙이기 · 쓰기 · 기록 */
function acctStickerPaneHtml() {
  var h = '<div class="acct-sum-wrap">' + acctSumHtml() + '</div>';
  h += '<div class="acct-sub"><h4>＋ 여러 개 붙이기</h4><div id="bulkBody"></div></div>';
  h += '<div class="acct-sub"><h4>🎁 스티커 쓰기</h4><div id="spendBody"></div></div>';
  h += '<div class="acct-tools">' +
    '<button type="button" class="ghost-btn" data-act="stats-open">📊 기록·통계</button>' +
    '<button type="button" class="ghost-btn" data-act="sticker-clear">스티커 판 비우기</button>' +
    (isAdmin() ? '<button type="button" class="ghost-btn danger" data-act="stickers-reset-logs">🧹 기록 초기화</button>' : '') +
    '</div>';
  h += '<p class="lf-note">여러 개 붙이기와 쓰기는 여기서, 한 개씩 붙이는 건 <b>칭찬 스티커 판</b>에서 바로 할 수 있어요.</p>';
  return h;
}

function openAccounts(tab) {
  if (!acctCanOpen()) return;
  acct.pwFor = '';
  acct.msg = '';
  acct.link = '';
  if (tab && acctTabAllowed(tab)) acct.tab = tab;
  if (!acctTabAllowed(acct.tab)) acct.tab = (acctTabsVisible()[0] || { id: 'coin' }).id;
  renderAccounts();
  var m = document.getElementById('acctModal');
  if (m) m.hidden = false;
  raiseModal('acctModal');
  lockScroll();
}

function closeAccounts() {
  var m = document.getElementById('acctModal');
  if (m) m.hidden = true;
  if (isOnlyModal('acctModal')) unlockScroll();
}

function acctShowTab(id) {
  if (!acctTabAllowed(id)) return;
  acct.tab = id;
  acct.pwFor = '';
  acct.msg = '';
  renderAccounts();
  var m = document.getElementById('acctModal');
  if (m) m.hidden = false;
}

/* 계정 창 안 특정 칸으로 스크롤 (여러 개 붙이기·쓰기 바로가기) */
function acctScrollTo(id) {
  var el = document.getElementById(id);
  if (!el || !el.scrollIntoView) return;
  try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) { /* 무시 */ }
}

/* 스티커를 붙이거나 쓴 뒤 — 계정 창의 요약·미리보기 숫자를 바로 맞춰요 */
function refreshAcctStickerPane() {
  var sum = document.querySelector('#acctPane-sticker .acct-sum-wrap');
  if (sum) sum.innerHTML = acctSumHtml();
  var bpv = document.getElementById('bulkPreview');
  if (bpv) bpv.innerHTML = bulkPreviewText();
  var left = remainStickers();
  var cnt = document.getElementById('spendCount');
  if (cnt) {
    cnt.disabled = left < 1;
    cnt.setAttribute('max', String(Math.max(1, left)));
  }
  var spv = document.getElementById('spendPreview');
  if (spv) spv.innerHTML = spendPreviewHtml();
  var sbtn = document.querySelector('#spendForm button[type="submit"]');
  if (sbtn) sbtn.disabled = left < 1;
}

function acctCountAdmins() {
  var users = (cloud.users && cloud.users.users) || [];
  var n = 0;
  for (var i = 0; i < users.length; i++) if (users[i].role === 'admin') n++;
  return n;
}

function accountsHtml() {
  var tab = acctTabAllowed(acct.tab) ? acct.tab : (acctTabsVisible()[0] || { id: 'list' }).id;
  acct.tab = tab;
  var h = acctTabsHtml();
  if (can('accounts')) {
    h += '<div class="acct-pane" id="acctPane-list"' + (tab === 'list' ? '' : ' hidden') + '>' + accountsListHtml() + '</div>';
  }
  h += '<div class="acct-pane" id="acctPane-coin"' + (tab === 'coin' ? '' : ' hidden') + '>' + acctCoinPaneHtml() + '</div>';
  h += '<div class="acct-pane" id="acctPane-sticker"' + (tab === 'sticker' ? '' : ' hidden') + '>' + acctStickerPaneHtml() + '</div>';
  return h;
}

function accountsListHtml() {
  var users = (cloud.users && cloud.users.users) || [];
  var h = '<p class="acct-note">계정과 권한은 비공개 저장소의 <b>config/users.json</b>에 저장돼요. 비밀번호는 솔트가 붙은 SHA-256 해시로만 보관합니다.</p>';
  h += '<div class="acct-connect">' +
    '<div class="acct-connect-head"><b>🔗 새 기기 연결</b><span>가족 기기에서 토큰 입력 없이 바로 로그인 화면만 열리게 하는 링크예요.</span></div>' +
    '<button class="lf-btn" type="button" data-act="acct-connect-link">🔗 새 기기 연결 링크 복사</button>' +
    (acct.link ? '<div class="acct-linkbox"><p>자동 복사가 막혀 있어요. 아래 링크를 길게 눌러 복사해 주세요.</p><input type="text" id="acctLinkInput" readonly data-act="acct-link-select" value="' + esc(acct.link) + '"></div>' : '') +
    '</div>';
  h += '<div class="acct-list">';
  for (var i = 0; i < users.length; i++) {
    var u = users[i];
    var self = cloud.me && u.id === cloud.me.id;
    h += '<div class="acct-row">' +
      '<span class="uc-av">' + esc(initialOf(u.name || u.id)) + '</span>' +
      '<div class="acct-id"><b>' + esc(u.name || u.id) + '</b><span>' + esc(u.id) + (self ? ' · 나' : '') + '</span></div>' +
      '<select data-act="acct-role" data-id="' + esc(u.id) + '" aria-label="' + esc(u.id) + ' 권한">' + roleOptions(u.role) + '</select>' +
      '<button class="ghost-btn" type="button" data-act="acct-pw" data-id="' + esc(u.id) + '">비밀번호 변경</button>' +
      (self ? '' : '<button class="del-btn" type="button" data-act="acct-del" data-id="' + esc(u.id) + '">삭제</button>') +
      (acct.pwFor === u.id ?
        '<form class="acct-pw" id="acctPwForm" data-id="' + esc(u.id) + '">' +
          '<input type="password" id="acctPwNew" placeholder="새 비밀번호 (4자 이상)" maxlength="64" autocomplete="new-password">' +
          '<button class="lf-btn" type="submit">저장</button>' +
          '<button class="ghost-btn" type="button" data-act="acct-pw-cancel">취소</button>' +
        '</form>' : '') +
      '</div>';
  }
  h += '</div>';
  h += '<div class="acct-role-note">관리자: 모든 기능 · 보호자: 루틴·스티커·편집·기록 · 아이: 루틴·스티커·기록 · 보기 전용: 화면과 기록만</div>';
  h += '<form class="acct-add" id="acctAddForm" autocomplete="off">' +
    '<label>아이디<input id="acctNewId" maxlength="20" placeholder="예: jiwu" spellcheck="false"></label>' +
    '<label>이름<input id="acctNewName" maxlength="20" placeholder="예: 지우"></label>' +
    '<label>권한<select id="acctNewRole">' + roleOptions('child') + '</select></label>' +
    '<label>비밀번호<input id="acctNewPw" type="password" maxlength="64" placeholder="4자 이상" autocomplete="new-password"></label>' +
    '<div class="full"><button class="lf-btn" type="submit">계정 추가</button></div>' +
    '</form>';
  h += '<p class="lf-msg" id="acctMsg">' + esc(acct.msg || '') + '</p>';
  return h;
}

function renderAccounts() {
  var body = document.getElementById('acctBody');
  if (!body) return;
  body.innerHTML = accountsHtml();
  if (acct.tab === 'coin') {
    if (!allowUi.to) allowUi.to = defaultAllowTarget();
    renderAllowance();
    loadAllowBalance();
  } else if (acct.tab === 'sticker') {
    renderBulkStickers();
    renderSpend();
  }
}

function acctFail(msg) {
  acct.msg = msg;
  renderAccounts();
}

async function persistUsers(message) {
  cloud.users.version = 1;
  cloud.users.updatedAt = new Date().toISOString();
  var res = await ghPut('config/users.json', cloud.users, message || '계정 업데이트');
  if (res.ok) saveUsersCache(cloud.users);
  return res;
}

async function addAccount() {
  if (!can('accounts') || !cloud.users) return;
  var id = fieldVal('acctNewId').trim().toLowerCase();
  var name = fieldVal('acctNewName').trim();
  var role = fieldVal('acctNewRole');
  var pw = fieldVal('acctNewPw');
  if (!/^[a-z0-9_-]{2,20}$/.test(id)) return acctFail('아이디는 영문 소문자·숫자·_·- 로 2~20자로 정해 주세요.');
  if (pw.length < 4) return acctFail('비밀번호는 4자 이상으로 정해 주세요.');
  if (!ROLES[role]) role = 'child';
  var users = cloud.users.users;
  for (var i = 0; i < users.length; i++) if (String(users[i].id).toLowerCase() === id) return acctFail('이미 쓰고 있는 아이디예요.');
  acct.msg = '저장하는 중…';
  renderAccounts();
  var salt = randomHex(16);
  var u = { id: id, name: name || id, role: role, salt: salt, hash: await hashPassword(pw, salt), createdAt: new Date().toISOString() };
  users.push(u);
  var res = await persistUsers('계정 추가: ' + id);
  if (!res.ok) {
    users.pop();
    return acctFail('저장하지 못했어요. (' + (res.error || '오프라인') + ')');
  }
  acct.msg = id + ' 계정을 추가했어요.';
  renderAccounts();
}

async function changeRole(id, role) {
  if (!can('accounts') || !cloud.users) return;
  if (!ROLES[role]) return;
  var users = cloud.users.users;
  var target = null;
  for (var i = 0; i < users.length; i++) if (users[i].id === id) { target = users[i]; break; }
  if (!target) return;
  var prev = target.role;
  if (prev === 'admin' && role !== 'admin' && acctCountAdmins() <= 1) {
    return acctFail('관리자는 최소 한 명이 있어야 해요.');
  }
  target.role = role;
  var res = await persistUsers('권한 변경: ' + id + ' → ' + role);
  if (!res.ok) {
    target.role = prev;
    return acctFail('권한을 바꾸지 못했어요. (' + (res.error || '오프라인') + ')');
  }
  if (cloud.me && cloud.me.id === id) {
    cloud.me.role = role;
    saveSession(cloud.me, !!(cloud.session && cloud.session.store === 'local'), cloud.session);
  }
  acct.msg = id + ' 권한을 ' + roleLabel(role) + '(으)로 바꿨어요.';
  renderAccounts();
  applyUserUi();
  applyPermissions();
}

async function deleteAccount(id) {
  if (!can('accounts') || !cloud.users) return;
  if (cloud.me && cloud.me.id === id) return acctFail('지금 로그인한 계정은 지울 수 없어요.');
  var users = cloud.users.users;
  var idx = -1;
  for (var i = 0; i < users.length; i++) if (users[i].id === id) { idx = i; break; }
  if (idx < 0) return;
  if (users[idx].role === 'admin' && acctCountAdmins() <= 1) return acctFail('관리자는 최소 한 명이 있어야 해요.');
  if (!window.confirm('"' + (users[idx].name || id) + '" 계정을 지울까요? 지금 화면은 그대로지만, 다음에 그 계정으로는 로그인할 수 없게 돼요.')) return;
  var removed = users.splice(idx, 1)[0];
  var res = await persistUsers('계정 삭제: ' + id);
  if (!res.ok) {
    users.splice(idx, 0, removed);
    return acctFail('삭제하지 못했어요. (' + (res.error || '오프라인') + ')');
  }
  acct.msg = id + ' 계정을 지웠어요.';
  renderAccounts();
}

async function saveAccountPassword() {
  if (!can('accounts') || !cloud.users) return;
  var form = document.getElementById('acctPwForm');
  if (!form) return;
  var id = form.getAttribute('data-id');
  var pw = fieldVal('acctPwNew');
  if (pw.length < 4) return acctFail('비밀번호는 4자 이상으로 정해 주세요.');
  var users = cloud.users.users;
  var target = null;
  for (var i = 0; i < users.length; i++) if (users[i].id === id) { target = users[i]; break; }
  if (!target) return;
  var oldSalt = target.salt, oldHash = target.hash;
  var salt = randomHex(16);
  target.salt = salt;
  target.hash = await hashPassword(pw, salt);
  var res = await persistUsers('비밀번호 변경: ' + id);
  if (!res.ok) {
    target.salt = oldSalt;
    target.hash = oldHash;
    return acctFail('비밀번호를 바꾸지 못했어요. (' + (res.error || '오프라인') + ')');
  }
  acct.pwFor = '';
  acct.msg = id + ' 비밀번호를 바꿨어요.';
  renderAccounts();
}
