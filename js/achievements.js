/* ============================================================================
   Jaden's Today v2 — js/achievements.js
   업적 도감
   · 원본 index.html(운영본)의 같은 코드를 기능별로 나눈 파일입니다. 동작은 원본과 같아요.
   · 모듈끼리 같은 전역 스코프를 써요. index.html 에서 core → sync → ... 순서로 불러옵니다.
   ============================================================================ */
'use strict';

/* ================= 🏆 업적 ================= */
function defaultAchievements() {
  return [
    { id: 'ach-routine-10', emoji: '🥇', name: '루틴 새싹', desc: '루틴을 10번 체크했어요', kind: 'routine', goal: 10, reward: 20 },
    { id: 'ach-routine-50', emoji: '🏅', name: '루틴 달인', desc: '루틴을 50번 체크했어요', kind: 'routine', goal: 50, reward: 35 },
    { id: 'ach-routine-100', emoji: '👑', name: '루틴 왕', desc: '루틴을 100번 체크했어요', kind: 'routine', goal: 100, reward: 50 },
    { id: 'ach-workbook-10', emoji: '📚', name: '문제지 첫걸음', desc: '문제지를 10번 마쳤어요', kind: 'workbook', goal: 10, reward: 20 },
    { id: 'ach-workbook-30', emoji: '🎓', name: '공부 대장', desc: '문제지를 30번 마쳤어요', kind: 'workbook', goal: 30, reward: 40 },
    { id: 'ach-sticker-10', emoji: '⭐', name: '칭찬 받는 날', desc: '칭찬 스티커를 10장 모았어요', kind: 'sticker', goal: 10, reward: 20 },
    { id: 'ach-sticker-30', emoji: '🌟', name: '스티커 부자', desc: '칭찬 스티커를 30장 모았어요', kind: 'sticker', goal: 30, reward: 40 },
    { id: 'ach-mission-1', emoji: '🎯', name: '첫 미션', desc: '특별 미션을 처음 해냈어요', kind: 'mission', goal: 1, reward: 20 },
    { id: 'ach-mission-5', emoji: '🏹', name: '미션 사냥꾼', desc: '특별 미션을 5번 해냈어요', kind: 'mission', goal: 5, reward: 35 },
    { id: 'ach-role-10', emoji: '⚡', name: '우리집 일꾼', desc: '역할 체크를 10번 했어요', kind: 'role', goal: 10, reward: 20 },
    { id: 'ach-role-30', emoji: '🔋', name: '역할 챔피언', desc: '역할 체크를 30번 했어요', kind: 'role', goal: 30, reward: 40 },
    { id: 'ach-level-3', emoji: '🚀', name: 'Lv.3 도전자', desc: '아바타가 Lv.3 이 되었어요', kind: 'level', goal: 3, reward: 25 },
    { id: 'ach-level-5', emoji: '🛸', name: 'Lv.5 대장', desc: '아바타가 Lv.5 이 되었어요', kind: 'level', goal: 5, reward: 40 },
    { id: 'ach-pet-1', emoji: '🐣', name: '첫 친구', desc: '펫을 처음 부화시켰어요', kind: 'pet', goal: 1, reward: 20 },
    { id: 'ach-pet-3', emoji: '🦄', name: '친구 부자', desc: '펫을 3마리 부화시켰어요', kind: 'pet', goal: 3, reward: 40 }
  ];
}
function normAchievement(raw, i) {
  if (!raw || typeof raw !== 'object') return null;
  var id = String(raw.id || '');
  if (!/^ach-[A-Za-z0-9_-]{1,32}$/.test(id)) id = 'ach-' + uid('');
  var kind = ACH_KIND_LABEL[raw.kind] ? raw.kind : 'routine';
  var nm = String(raw.name == null ? '' : raw.name).replace(/\s+/g, ' ').trim();
  if (!nm) return null;
  var dsc = String(raw.desc == null ? '' : raw.desc).replace(/\s+/g, ' ').trim();
  var em = String(raw.emoji == null ? '' : raw.emoji).trim();
  return {
    id: id,
    emoji: em ? fixEmoji(em.slice(0, 4)) : '🏆',
    name: nm.slice(0, ACH_NAME_MAX),
    desc: dsc.slice(0, ACH_DESC_MAX),
    kind: kind,
    goal: clampInt(raw.goal, 1, ACH_GOAL_MAX, 10),
    reward: clampInt(raw.reward, 0, ACH_REWARD_MAX, 20)
  };
}
function normAchievements(rawList) {
  var arr = (Object.prototype.toString.call(rawList) === '[object Array]') ? rawList : null;
  if (!arr) return defaultAchievements();
  var out = [], seen = {};
  for (var i = 0; i < arr.length && out.length < ACH_MAX; i++) {
    var one = normAchievement(arr[i], i);
    if (!one || seen[one.id]) continue;
    seen[one.id] = 1;
    out.push(one);
  }
  return out;
}
function achList() {
  if (!state.settings) state.settings = {};
  if (Object.prototype.toString.call(state.settings.achievements) !== '[object Array]') {
    state.settings.achievements = defaultAchievements();
  }
  return state.settings.achievements;
}
function achFind(id) {
  var list = achList();
  for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
  return null;
}
function achDone() {
  var p = prof();
  if (!p.ach || typeof p.ach !== 'object') p.ach = { done: {} };
  if (!p.ach.done || typeof p.ach.done !== 'object') p.ach.done = {};
  return p.ach.done;
}
function achValue(d) {
  if (!d) return 0;
  if (d.kind === 'manual') return achDone()[d.id] ? d.goal : 0;
  if (d.kind === 'level') return xpInfo().level;
  var p = prof();
  return Math.max(0, parseInt((p.progress || {})[d.kind], 10) || 0);
}
function achEarnedCount() {
  var list = achList(), done = achDone(), n = 0;
  for (var i = 0; i < list.length; i++) if (done[list[i].id]) n++;
  return n;
}
/* 조건을 채운 업적을 한 번만 달성 처리하고 보상 코인을 줘요 */
function checkAchievements() {
  var list = achList(), done = achDone(), got = [], changed = false;
  for (var i = 0; i < list.length; i++) {
    var d = list[i];
    if (!d || done[d.id]) continue;
    if (d.kind === 'manual') continue;
    if (achValue(d) < Math.max(1, d.goal)) continue;
    done[d.id] = { at: Date.now() };
    changed = true;
    got.push(d);
    if (d.reward > 0) coinAdd(d.reward);
  }
  if (!changed) return got;
  saveState();
  renderCoinBadge();
  try { snd('win'); confetti(18); } catch (e1) { /* 무시 */ }
  if (got.length === 1) {
    showToast('🏆 업적 달성! <b>' + esc((got[0].emoji || '🏆') + ' ' + got[0].name) + '</b>' +
      (got[0].reward > 0 ? ' ' + coinSvg() + ' +' + fmtNum(got[0].reward) : ''), true, 3800);
  } else {
    var names = [];
    for (var k = 0; k < got.length; k++) names.push(esc(got[k].name));
    showToast('🏆 업적 ' + got.length + '개 달성! <b>' + names.join(' · ') + '</b>', true, 4200);
  }
  if (document.getElementById('achModal') && !document.getElementById('achModal').hidden) renderAch();
  return got;
}
/* ---- 🏆 업적 도감 그리기 ---- */
var achUi = { edit: null };

function openAch() {
  achUi.edit = null;
  renderAch();
  var m = document.getElementById('achModal');
  if (m) m.hidden = false;
  raiseModal('achModal');
  lockScroll();
}
function closeAch() {
  achUi.edit = null;
  var m = document.getElementById('achModal');
  if (m) m.hidden = true;
  if (isOnlyModal('achModal')) unlockScroll();
}
function renderAch() {
  var b = document.getElementById('achBody');
  if (!b) return;
  b.innerHTML = achBodyHtml();
  try { renderLevelBadges(); } catch (e0) { /* 무시 */ }
}
function achDateText(at) {
  if (!at) return '';
  var d = new Date(Number(at));
  if (!d || isNaN(d.getTime())) return '';
  return (d.getMonth() + 1) + '월 ' + d.getDate() + '일';
}
function achCardHtml(d, done, editable) {
  var val = achValue(d);
  var goal = Math.max(1, d.goal);
  var pct = Math.min(100, Math.round(val * 100 / goal));
  var manual = d.kind === 'manual';
  var h = '<article class="ach-card' + (done ? ' on' : '') + (manual ? ' manual' : '') + '" data-ach="' + esc(d.id) + '">';
  h += '<div class="ach-top"><span class="ach-emoji" aria-hidden="true">' + esc(d.emoji || '🏆') + '</span>' +
    '<div class="ach-meta"><b>' + esc(d.name) + '</b>' +
    '<small>' + esc(d.desc || (ACH_KIND_LABEL[d.kind] + ' ' + goal + (ACH_KIND_UNIT[d.kind] || ''))) + '</small></div>';
  if (editable) {
    h += '<button type="button" class="ach-edit" data-act="ach-edit" data-id="' + esc(d.id) + '" aria-label="업적 고치기" title="업적 고치기">✏️</button>';
  }
  h += '</div>';
  if (done) {
    h += '<p class="ach-done">🏆 획득! <span>' + esc(achDateText(done.at)) + '</span></p>';
  } else if (manual) {
    h += '<button type="button" class="ach-check" data-act="ach-manual" data-id="' + esc(d.id) + '">☑ 완료 체크</button>';
  } else {
    var leftTxt = d.kind === 'level' ? ('Lv.' + fmtNum(Math.min(val, goal))) : fmtNum(Math.min(val, goal));
    var rightTxt = d.kind === 'level' ? ('Lv.' + fmtNum(goal)) : (fmtNum(goal) + (ACH_KIND_UNIT[d.kind] || ''));
    h += '<div class="ach-bar" aria-hidden="true"><i style="width:' + pct + '%"></i></div>' +
      '<p class="ach-prog">' + leftTxt + ' / ' + rightTxt + ' · 🪙' + fmtNum(d.reward) + '</p>';
  }
  if (done && d.reward > 0) h += '<p class="ach-prog">보상 🪙' + fmtNum(d.reward) + '</p>';
  h += '</article>';
  return h;
}
function achEditorHtml() {
  var d = achUi.edit;
  if (!d) return '';
  var h = '<div class="ach-editor" id="achEditor">';
  h += '<div class="ae-head"><b>' + (d.isNew ? '＋ 새 업적 만들기' : '✏️ 업적 고치기') + '</b>' +
    '<button type="button" class="ghost-btn tiny" data-act="ach-cancel">닫기</button></div>';
  h += '<div class="ae-emoji">';
  for (var i = 0; i < ACH_EMOJI.length; i++) {
    h += '<button type="button" class="ae-em' + (d.emoji === ACH_EMOJI[i] ? ' on' : '') + '" data-act="ach-emoji" data-e="' + ACH_EMOJI[i] + '">' + ACH_EMOJI[i] + '</button>';
  }
  h += '</div>';
  h += '<label class="ae-field"><span>이름</span><input class="inp" id="achName" maxlength="' + ACH_NAME_MAX + '" value="' + esc(d.name) + '" placeholder="예: 수영 25m 성공"></label>';
  h += '<label class="ae-field"><span>설명</span><input class="inp" id="achDesc" maxlength="' + ACH_DESC_MAX + '" value="' + esc(d.desc) + '" placeholder="어떻게 얻는 업적인지 적어 주세요"></label>';
  h += '<div class="ae-field"><span>조건</span><div class="ae-kinds">';
  var kinds = ['routine', 'workbook', 'sticker', 'mission', 'role', 'level', 'pet', 'manual'];
  for (var k = 0; k < kinds.length; k++) {
    h += '<button type="button" class="ae-kind' + (d.kind === kinds[k] ? ' on' : '') + '" data-act="ach-kind" data-kind="' + kinds[k] + '">' + ACH_KIND_LABEL[kinds[k]] + '</button>';
  }
  h += '</div></div>';
  h += '<div class="ae-row">' +
    '<label class="ae-field"><span>목표 ' + (ACH_KIND_UNIT[d.kind] || '횟수') + '</span>' +
      '<input class="inp" id="achGoal" type="number" min="1" max="' + ACH_GOAL_MAX + '" step="1" value="' + d.goal + '"></label>' +
    '<label class="ae-field"><span>보상 코인</span>' +
      '<input class="inp" id="achReward" type="number" min="0" max="' + ACH_REWARD_MAX + '" step="5" value="' + d.reward + '"></label>' +
    '</div>';
  h += '<div class="ae-actions">' +
    '<button type="button" class="pill-btn" data-act="ach-save">💾 저장</button>' +
    (d.isNew ? '' : '<button type="button" class="ghost-btn danger" data-act="ach-del" data-id="' + esc(d.id) + '">🗑 지우기</button>') +
    '<button type="button" class="ghost-btn" data-act="ach-cancel">취소</button></div>';
  h += '<p class="lf-note">‘직접 완료’ 업적은 도감에서 완료 체크를 눌러 획득해요. 나머지는 조건을 채우면 저절로 획득해요.</p>';
  h += '</div>';
  return h;
}
function achBodyHtml() {
  var list = achList(), done = achDone(), editable = can('edit');
  var earned = 0, i;
  for (i = 0; i < list.length; i++) if (done[list[i].id]) earned++;
  var h = '<div class="ach-sum">' +
    '<div class="ach-sum-l"><b>🏆 업적 ' + earned + ' / ' + list.length + '</b>' +
    '<small>모은 뱃지 ' + earned + '개 · 아직 ' + (list.length - earned) + '개 남았어요</small></div>' +
    '<div class="ach-sum-r xpbar" data-xpbar>' + '' + '</div>' +
    '</div>';
  if (achUi.edit) h += achEditorHtml();
  var earnedList = [], todoList = [];
  for (i = 0; i < list.length; i++) (done[list[i].id] ? earnedList : todoList).push(list[i]);
  if (earnedList.length) {
    h += '<h3 class="ach-h">🏅 획득한 뱃지</h3><div class="ach-grid">';
    for (i = 0; i < earnedList.length; i++) h += achCardHtml(earnedList[i], done[earnedList[i].id], editable);
    h += '</div>';
  }
  h += '<h3 class="ach-h">🎯 도전 중인 업적</h3>';
  if (!todoList.length) h += '<p class="lf-note">모든 업적을 다 모았어요! 대단해요 🎉</p>';
  else {
    h += '<div class="ach-grid">';
    for (i = 0; i < todoList.length; i++) h += achCardHtml(todoList[i], null, editable);
    h += '</div>';
  }
  if (editable) {
    h += '<div class="ach-foot"><button type="button" class="pill-btn warm" data-act="ach-add">＋ 업적 추가</button>' +
      '<button type="button" class="ghost-btn" data-act="ach-close">닫기</button></div>';
  } else {
    h += '<div class="ach-foot"><button type="button" class="ghost-btn" data-act="ach-close">닫기</button></div>';
  }
  h += '<p class="lf-note">업적은 보호자·관리자가 만들고 고칠 수 있어요. 업적과 달성 기록은 가족 기기끼리 함께 저장돼요.</p>';
  return h;
}
function achEditOpen(id) {
  if (!can('edit')) return;
  var d = id ? achFind(id) : null;
  achUi.edit = d
    ? { id: d.id, emoji: d.emoji, name: d.name, desc: d.desc, kind: d.kind, goal: d.goal, reward: d.reward, isNew: false }
    : { id: '', emoji: '🏆', name: '', desc: '', kind: 'routine', goal: 10, reward: 20, isNew: true };
  renderAch();
  var el = document.getElementById('achEditor');
  if (el && el.scrollIntoView) { try { el.scrollIntoView({ block: 'start' }); } catch (e) { /* 무시 */ } }
}
function achEditSyncFields() {
  if (!achUi.edit) return;
  achUi.edit.name = fieldVal('achName').slice(0, ACH_NAME_MAX);
  achUi.edit.desc = fieldVal('achDesc').slice(0, ACH_DESC_MAX);
  var g = parseInt(fieldVal('achGoal'), 10);
  var r = parseInt(fieldVal('achReward'), 10);
  if (!isNaN(g)) achUi.edit.goal = clampInt(g, 1, ACH_GOAL_MAX, 10);
  if (!isNaN(r)) achUi.edit.reward = clampInt(r, 0, ACH_REWARD_MAX, 20);
}
function achSave() {
  if (!can('edit') || !achUi.edit) return;
  achEditSyncFields();
  var d = achUi.edit;
  var nm = String(d.name || '').replace(/\s+/g, ' ').trim();
  if (!nm) { showToast('업적 이름을 적어 주세요.'); return; }
  var list = achList();
  if (d.isNew) {
    if (list.length >= ACH_MAX) { showToast('업적은 ' + ACH_MAX + '개까지 만들 수 있어요.'); return; }
    list.push({ id: 'ach-' + uid(''), emoji: d.emoji, name: nm, desc: String(d.desc || '').trim(), kind: d.kind, goal: d.goal, reward: d.reward });
  } else {
    var cur = achFind(d.id);
    if (!cur) return;
    cur.emoji = d.emoji; cur.name = nm; cur.desc = String(d.desc || '').trim();
    cur.kind = d.kind; cur.goal = d.goal; cur.reward = d.reward;
  }
  achUi.edit = null;
  saveAndPush();
  renderAch();
  try { checkAchievements(); } catch (e0) { /* 무시 */ }
  showToast('🏆 업적을 저장했어요. 가족 기기에도 함께 보여요.');
}
function achDelete(id) {
  if (!can('edit')) return;
  var d = achFind(id);
  if (!d) return;
  if (!window.confirm('"' + d.name + '" 업적을 지울까요?\n모은 뱃지 기록도 함께 사라져요.')) return;
  var list = achList();
  for (var i = 0; i < list.length; i++) {
    if (list[i].id === id) { list.splice(i, 1); break; }
  }
  var done = achDone();
  if (done[id]) delete done[id];
  achUi.edit = null;
  saveAndPush();
  renderAch();
  showToast('🗑 업적을 지웠어요.');
}
/* 수동 완료 업적 — 도감에서 직접 체크 */
function achManualToggle(id) {
  if (!can('check')) return;
  var d = achFind(id);
  if (!d || d.kind !== 'manual') return;
  var done = achDone();
  if (done[id]) {
    delete done[id];
    snd('uncheck');
  } else {
    done[id] = { at: Date.now() };
    if (d.reward > 0) coinAdd(d.reward);
    snd('check');
    try { confetti(16); } catch (e0) { /* 무시 */ }
    showToast('🏆 <b>' + esc(d.name) + '</b> 완료!' + (d.reward > 0 ? ' ' + coinSvg() + ' +' + fmtNum(d.reward) : ''), true, 3200);
    renderCoinBadge();
  }
  saveState();
  renderAch();
}
