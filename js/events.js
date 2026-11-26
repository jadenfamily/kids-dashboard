/* ============================================================================
   Jaden's Today v2 — js/events.js
   전역 이벤트 위임 · 시계 · 날짜 넘김 · 전체화면
   · 원본 index.html(운영본)의 같은 코드를 기능별로 나눈 파일입니다. 동작은 원본과 같아요.
   · 모듈끼리 같은 전역 스코프를 써요. index.html 에서 core → sync → ... 순서로 불러옵니다.
   ============================================================================ */
'use strict';

/* ============ 이벤트 ============ */
/* 편집 팝업: 바깥을 누르거나 Esc 를 누르면 닫혀요 */
document.addEventListener('click', function (e) {
  var sheet = document.getElementById('editSheet');
  if (!sheet || sheet.hidden) return;
  if (e.target === sheet) closeEditSheet();
});
document.addEventListener('keydown', function (e) {
  if (e.key !== 'Escape' && e.key !== 'Esc') return;
  var sheet = document.getElementById('editSheet');
  if (sheet && !sheet.hidden) { closeEditSheet(); }
});

document.addEventListener('click', function (e) {
  var el = (e.target && e.target.closest) ? e.target.closest('[data-act]') : null;
  if (!el) return;
  var act = el.getAttribute('data-act');

  if (act === 'logout') { doLogout(); return; }
  if (act === 'gate-direct') { renderLoginBody(el.getAttribute('data-mode') || (cloud.conn ? 'login' : 'setup'), true); return; }
  if (act === 'accounts-open') { openAccounts(); return; }
  if (act === 'accounts-close') { closeAccounts(); return; }
  if (act === 'acct-tab') { acctShowTab(el.getAttribute('data-tab') || ''); return; }
  if (act === 'acct-pw') { acct.pwFor = el.getAttribute('data-id') || ''; acct.msg = ''; renderAccounts(); return; }
  if (act === 'acct-pw-cancel') { acct.pwFor = ''; renderAccounts(); return; }
  if (act === 'acct-del') { deleteAccount(el.getAttribute('data-id')); return; }
  if (act === 'acct-connect-link') { copyConnectLink(); return; }
  if (act === 'acct-link-select') { try { el.focus(); el.select(); } catch (e) { /* 무시 */ } return; }
  if (act === 'relink') { renderLoginBody('setup', true); return; }
  if (act === 'relink-cancel') { renderLoginBody(cloud.conn ? 'login' : 'setup', true); return; }

  if (act === 'req-open') { openRequest(); return; }
  if (act === 'req-close') { closeRequest(); return; }
  if (act === 'req-kind') { reqUi.kind = el.getAttribute('data-k') || '불편'; renderReqKinds(); return; }
  if (act === 'req-send') { sendRequest(); return; }

  if (act === 'toggle-check' && !can('check')) return;
  if (act === 'wb-item-open' && !can('check')) return;
  if ((act === 'sticker-add' || act === 'sticker-undo' || act === 'sticker-new' || act === 'sticker-new-direct' || act === 'sticker-clear') && !can('sticker')) return;
  if ((act === 'sticker-undo' || act === 'sticker-new' || act === 'sticker-clear') && !can('stickerManage')) return;
  if ((act === 'sticker-bulk-open' || act === 'sticker-bulk-close' || act === 'bulk-count' || act === 'bulk-save') && !can('stickerManage')) return;
  if ((act === 'edit-toggle' || act === 'settings-open' || act === 'layout-toggle' || act === 'add-item' || act === 'del-item' || act === 'add-event' || act === 'del-event' ||
       act === 'cat-add' || act === 'cat-del' || act === 'cat-left' || act === 'cat-right' || act === 'cat-color' || act === 'cat-target-clear' ||
       act === 'cat-day' || act === 'cat-day-preset' || act === 'item-up' || act === 'item-down') && !can('edit')) return;
  if (act === 'reset-all' && !can('reset')) return;
  if (act.indexOf('diy-') === 0 && !can('edit')) return;
  if ((act === 'msn-check' || act === 'rcl-toggle') && !can('check')) return;
  if (act.indexOf('msn-') === 0 && act !== 'msn-check' && act !== 'msn-win-close' && !can('edit')) return;
  if (act.indexOf('rcl-') === 0 && act !== 'rcl-toggle' && !can('edit')) return;
  if ((act === 'nb-edit' || act === 'nb-save') && !can('edit')) return;
  if ((act === 'pet-art-apply' || act === 'pet-art-reset') && !canPetArt()) return;
  if (act === 'stickers-reset-logs' && !isAdmin()) return;
  if ((act === 'ach-add' || act === 'ach-edit' || act === 'ach-save' || act === 'ach-del') && !can('edit')) return;
  if (act === 'ach-manual' && !can('check')) return;

  if (act === 'toggle-check') { onToggleCheck(el); return; }
  if (act === 'wb-item-open') { openWbForItem(el); return; }
  if (act === 'add-item') { onAddItem(el.getAttribute('data-cat')); return; }
  if (act === 'del-item') { onDelItem(el); return; }
  if (act === 'item-up') { moveItem(el.getAttribute('data-cat'), el.getAttribute('data-item'), -1); return; }
  if (act === 'item-down') { moveItem(el.getAttribute('data-cat'), el.getAttribute('data-item'), 1); return; }
  if (act === 'target-alert-ok') { closeTargetAlert(); return; }
  if (act === 'target-alert-sound') {
    /* 브라우저가 자동재생을 막았을 때 — 누른 그 순간 바로 소리를 켜요 */
    unlockAudio();
    playTargetMelody(true, 0);
    updateSoundUi();
    return;
  }
  if (act === 'alert-mute') { stopAlertSoundByUser(); return; }
  if (act === 'target-sound-test') { toggleAlertSoundTest(); return; }
  if (act === 'alert-sound-pick') { pickAlertSound(el.getAttribute('data-sound')); return; }
  if (act === 'alert-sound-test') { toggleAlertSoundTest(); return; }
  if (act === 'alert-sound-del') { deleteAlertSound(el.getAttribute('data-sound')); return; }
  if (act === 'alert-sound-url-add') { addAlertSoundFromUrl(); return; }
  if (act === 'sticker-add') { openReason(); return; }
  if (act === 'sticker-bulk-open') { openBulkStickers(); return; }
  if (act === 'sticker-bulk-close') { closeBulkStickers(); return; }
  if (act === 'bulk-count') { bulkPickCount(el.getAttribute('data-n')); return; }
  if (act === 'bulk-save') { saveBulkStickers(); return; }
  if (act === 'sticker-undo') { undoSticker(parseInt(el.getAttribute('data-i'), 10)); return; }
  if (act === 'sticker-new') { newBoard(); return; }
  if (act === 'sticker-new-direct') {
    /* 판이 꽉 찼을 때(또는 관리자)만 확인 없이 새 판 시작 — 적립·사용 기록은 그대로 */
    if (state.sticker.stickers.length < state.sticker.slots && !can('stickerManage')) return;
    closeGoal();
    newBoard(true);
    return;
  }
  if (act === 'sticker-clear') { clearBoard(); return; }
  if (act === 'stickers-reset-logs') { clearStickerHistory(); return; }
  if (act === 'sticker-slot-add') { openReason(); return; }
  if (act === 'sticker-reason-add') { addStickerReason(el); return; }
  if (act === 'sticker-reason-del') { delStickerReason(el); return; }
  if (act === 'pet-art-apply') { applyPetArtUrl(); return; }
  if (act === 'pet-art-reset') { resetPetArt(); return; }
  if (act === 'pet-open') { openPet(); return; }
  if (act === 'pet-gacha') { petDrawEgg(); return; }
  if (act === 'pet-select') { petSelect(el.getAttribute('data-id')); return; }
  if (act === 'pet-runner') { petSetRunner(el.getAttribute('data-id')); return; }
  if (act === 'pet-filter') { petFilter = el.getAttribute('data-t') || ''; renderPetDex(); return; }
  if (act === 'pet-close') { closePet(); return; }
  if (act === 'pet-new-egg') { petNewEgg(); return; }
  if (act === 'evo-close') { closeEvo(); return; }
  if (act === 'evo-dex') { closeEvo(); openPet(); return; }
  if (act === 'evo-new') { closeEvo(); petNewEgg(); return; }
  if (act === 'edit-toggle') { toggleEdit(); return; }
  if (act === 'settings-open') { toggleEdit(); return; }
  if (act === 'settings-close') { if (ui.editing) toggleEdit(); return; }
  if (act === 'layout-toggle') { toggleLayoutMode(); return; }
  if (act === 'edit-open') { if (!can('edit')) return; openEditSheet(el.getAttribute('data-tab') || 'groups'); return; }
  if (act === 'sheet-save') {
    saveAndPush();
    closeEditSheet();
    showToast('💾 저장했어요. 가족 기기에도 바로 보여요.');
    return;
  }
  if (act === 'edit-sheet-close') { closeEditSheet(); return; }
  if (act === 'sec-detail') { if (!can('edit')) return; openEditSheet('sections', el.getAttribute('data-sec') || ''); return; }
  if (act === 'sec-inline') { if (!can('edit')) return; toggleInlineSec(el.getAttribute('data-sec') || ''); return; }
  if (act === 'sec-inline-done') { closeInlineSec(); return; }
  if (act === 'sec-blk-add') { if (!can('edit')) return; openEditSheet('sections', el.getAttribute('data-sec') || ''); return; }
  if (act === 'sec-size-reset') { resetSectionSize(el.getAttribute('data-sec') || ''); return; }
  if (act === 'vars-reset') { resetVars(); return; }
  if (act === 'alert-toggle') { toggleTargetAlertOn(); return; }
  if (act === 'sound-toggle') { toggleSound(); return; }
  if (act === 'fullscreen-toggle') { toggleFullscreen(); return; }
  if (act === 'weather-refresh') { loadWeather(); return; }
  if (act === 'add-event') { addEvent(el.getAttribute('data-day')); return; }
  if (act === 'del-event') { delEvent(el.getAttribute('data-day'), el.getAttribute('data-id')); return; }
  if (act === 'notify-toggle') { toggleScheduleNotify(); return; }
  if (act === 'notify-test') { testScheduleNotify(); return; }
  if (act === 'history-open') { openHistory(); return; }
  if (act === 'stats-open') { openStats(); return; }
  if (act === 'stats-close') { closeStats(); return; }
  if (act === 'reason-close') { closeReason(); return; }
  if (act === 'reason-pick') { pickReason(el.getAttribute('data-r') || ''); return; }
  if (act === 'reason-shape') { pickStickerShape(el.getAttribute('data-id') || ''); return; }
  if (act === 'shape-add') { shapeAddOpen(el.getAttribute('data-prefix') || 'reason'); return; }
  if (act === 'shape-save') { shapeSave(el.getAttribute('data-prefix') || 'panel'); return; }
  if (act === 'shape-del') { shapeDel(el.getAttribute('data-id') || ''); return; }
  if (act === 'reason-custom') { reasonState.custom = true; renderReason(); return; }
  if (act === 'reason-save') {
    var rv2 = fieldVal('reasonInput').trim();
    if (!rv2) { reasonState.msg = '이유를 적어 주세요.'; renderReason(); return; }
    pickReason(rv2.slice(0, 20));
    return;
  }
  if (act === 'spend-open') { openSpend(); return; }
  if (act === 'spend-close') { closeSpend(); return; }
  if (act === 'spend-del') { deleteSpend(el.getAttribute('data-id')); return; }
  if (act === 'wb-open') { openWb(); return; }
  if (act === 'wb-close') { closeWb(); return; }
  if (act === 'wb-toggle') { toggleWbDone(el.getAttribute('data-id')); return; }
  if (act === 'wb-pick') {
    var wid2 = el.getAttribute('data-id');
    var at = wbState.sel.indexOf(wid2);
    if (at >= 0) wbState.sel.splice(at, 1); else wbState.sel.push(wid2);
    renderWb();
    return;
  }
  if (act === 'wb-save') { saveWbPick(); return; }
  if (act === 'win-close') { closeWin(); return; }
  if (act === 'sec-up') { moveSection(el.getAttribute('data-sec'), -1); return; }
  if (act === 'sec-down') { moveSection(el.getAttribute('data-sec'), 1); return; }
  /* ---------- DIY 섹션·블록 조립 ---------- */
  if (act === 'diy-sec-add') { addSection(); return; }
  if (act === 'diy-sec-del') { deleteSection(el.getAttribute('data-sec')); return; }
  if (act === 'diy-sec-hide') { toggleSectionHidden(el.getAttribute('data-sec')); return; }
  if (act === 'diy-sec-up') { moveSection(el.getAttribute('data-sec'), -1); return; }
  if (act === 'diy-sec-down') { moveSection(el.getAttribute('data-sec'), 1); return; }
  if (act === 'diy-blk-add') { addBlock(el.getAttribute('data-sec'), el.getAttribute('data-type')); return; }
  if (act === 'diy-blk-del') { deleteBlock(el.getAttribute('data-blk')); return; }
  if (act === 'diy-blk-up') { moveBlock(el.getAttribute('data-blk'), -1); return; }
  if (act === 'diy-blk-down') { moveBlock(el.getAttribute('data-blk'), 1); return; }
  if (act === 'nb-edit') { noticeUi.open = el.getAttribute('data-blk') || ''; renderNoticeBlocks(); return; }
  if (act === 'nb-cancel') { noticeUi.open = ''; renderNoticeBlocks(); return; }
  if (act === 'nb-save') {
    saveAndPush();
    noticeUi.open = '';
    renderNoticeBlocks();
    renderEditPanel();
    showToast('💾 한마디를 저장했어요.');
    return;
  }
  /* ---------- 🎯 특별 미션 · ⚡ 역할 체크리스트 ---------- */
  if (act === 'msn-check') { onMissionCheck(el.getAttribute('data-blk'), el.getAttribute('data-mission'), el.getAttribute('data-date')); return; }
  if (act === 'msn-edit') { openMissionEditor(el.getAttribute('data-blk'), el.getAttribute('data-mission') || ''); return; }
  if (act === 'msn-add') { openMissionEditor(el.getAttribute('data-blk'), ''); return; }
  if (act === 'msn-close') { closeMissionEditor(); return; }
  if (act === 'msn-save') { saveMissionEditor(); return; }
  if (act === 'msn-del') { deleteMissionEditor(); return; }
  if (act === 'msn-win-close') { closeMilestoneWin(); return; }
  if (act === 'msn-pick-emoji') { if (msnEdit.d) { msnEdit.d.emoji = el.getAttribute('data-e') || '🎯'; renderMissionEditor(); } return; }
  if (act === 'msn-days-minus' || act === 'msn-days-plus') {
    if (msnEdit.d) { msnEdit.d.days = clampInt(msnEdit.d.days + (act === 'msn-days-plus' ? 1 : -1), 1, MSN_DAYS_MAX, 1); renderMissionEditor(); }
    return;
  }
  if (act === 'msn-reward-minus' || act === 'msn-reward-plus') {
    if (msnEdit.d) { msnEdit.d.reward = clampInt(msnEdit.d.reward + (act === 'msn-reward-plus' ? 1 : -1), 0, MSN_REWARD_MAX, 0); renderMissionEditor(); }
    return;
  }
  if (act === 'rcl-toggle') { onRoleToggle(el.getAttribute('data-blk'), el.getAttribute('data-role'), el.getAttribute('data-item')); return; }
  if (act === 'rcl-edit') { openRoleEditor(el.getAttribute('data-blk'), el.getAttribute('data-role') || ''); return; }
  if (act === 'rcl-add') { openRoleEditor(el.getAttribute('data-blk'), ''); return; }
  if (act === 'rcl-close') { closeRoleEditor(); return; }
  if (act === 'rcl-save') { saveRoleEditor(); return; }
  if (act === 'rcl-del') { deleteRoleEditor(); return; }
  if (act === 'rcl-pick-emoji') { if (rclEdit.d) { rclEdit.d.emoji = el.getAttribute('data-e') || '⚡'; renderRoleEditor(); } return; }
  if (act === 'rcl-cycle') { if (rclEdit.d) { rclEdit.d.cycle = normCycle(el.getAttribute('data-c')); renderRoleEditor(); } return; }
  if (act === 'rcl-reward-minus' || act === 'rcl-reward-plus') {
    if (rclEdit.d) { rclEdit.d.reward = clampInt(rclEdit.d.reward + (act === 'rcl-reward-plus' ? 1 : -1), 0, MSN_REWARD_MAX, 0); renderRoleEditor(); }
    return;
  }
  if (act === 'rcl-item-add') {
    if (rclEdit.d && rclEdit.d.items.length < RCL_ITEM_MAX) {
      rclEdit.d.items.push({ id: 'ri-' + uid(''), text: '' });
      renderRoleEditor();
      var newInp = document.querySelector('#rclEditBody [data-ritem="' + (rclEdit.d.items.length - 1) + '"]');
      if (newInp) { try { newInp.focus(); } catch (e0) { /* 무시 */ } }
    }
    return;
  }
  if (act === 'rcl-item-del') {
    if (rclEdit.d) {
      var di2 = parseInt(el.getAttribute('data-i'), 10);
      if (!isNaN(di2) && di2 >= 0 && di2 < rclEdit.d.items.length) rclEdit.d.items.splice(di2, 1);
      renderRoleEditor();
    }
    return;
  }
  if (act === 'routine-view-toggle') { toggleRoutineView(); return; }
  if (act === 'routine-jump') { jumpToCategory(el.getAttribute('data-cat')); return; }
  if (act === 'cat-add') { addCategory(); return; }
  if (act === 'cat-del') { delCategory(el.getAttribute('data-cat')); return; }
  if (act === 'cat-left') { moveCategory(el.getAttribute('data-cat'), -1); return; }
  if (act === 'cat-right') { moveCategory(el.getAttribute('data-cat'), 1); return; }
  if (act === 'cat-target-clear') { clearCatTarget(el.getAttribute('data-cat')); return; }
  if (act === 'cat-alert-test') { if (!can('edit')) return; previewCatAlertSound(el.getAttribute('data-cat')); return; }
  if (act === 'cat-day') { setCatDays(el.getAttribute('data-cat'), parseInt(el.getAttribute('data-d'), 10), ''); return; }
  if (act === 'cat-day-preset') { setCatDays(el.getAttribute('data-cat'), 0, el.getAttribute('data-p') || ''); return; }
  if (act === 'cat-color') {
    setCategoryColor(el.getAttribute('data-cat'), el.getAttribute('data-c'), el.getAttribute('data-t'));
    return;
  }
  if (act === 'wb-add') {
    if (!can('edit')) return;
    state.workbooks.push({ id: uid('wb'), name: '새 문제지' });
    saveState();
    renderEditPanel();
    renderRoutine();
    return;
  }
  if (act === 'wb-del') {
    if (!can('edit')) return;
    var delId = el.getAttribute('data-id');
    for (var di = 0; di < state.workbooks.length; di++) {
      if (state.workbooks[di].id === delId) {
        if (!window.confirm('"' + (state.workbooks[di].name || '문제지') + '" 를 목록에서 지울까요?')) return;
        state.workbooks.splice(di, 1);
        break;
      }
    }
    saveState();
    renderEditPanel();
    renderRoutine();
    return;
  }
  if (act === 'history-close') { closeHistory(); return; }
  if (act === 'hist-prev') { histNav(-1); return; }
  if (act === 'hist-next') { histNav(1); return; }
  if (act === 'hist-day') { histSelect(el.getAttribute('data-key')); return; }
  if (act === 'hist-backup') { saveBackup(); return; }
  if (act === 'hist-import') { pickBackup(); return; }
  if (act === 'reset-all') { resetAll(); return; }

  /* ---------- Phase 2: 상점 · 케어 · 마이룸 · 아바타 ---------- */
  /* ---------- 🏆 업적 도감 ---------- */
  if (act === 'ach-open') { openAch(); return; }
  if (act === 'ach-close') { closeAch(); return; }
  if (act === 'ach-add') { achEditOpen(''); return; }
  if (act === 'ach-edit') { achEditOpen(el.getAttribute('data-id')); return; }
  if (act === 'ach-cancel') { achUi.edit = null; renderAch(); return; }
  if (act === 'ach-save') { achSave(); return; }
  if (act === 'ach-del') { achDelete(el.getAttribute('data-id')); return; }
  if (act === 'ach-manual') { achManualToggle(el.getAttribute('data-id')); return; }
  if (act === 'ach-emoji' && achUi.edit) { achUi.edit.emoji = el.getAttribute('data-e') || '🏆'; renderAch(); return; }
  if (act === 'ach-kind' && achUi.edit) { achEditSyncFields(); achUi.edit.kind = el.getAttribute('data-kind') || 'routine'; renderAch(); return; }
  if (act === 'shop-open') { openShop(el.getAttribute('data-shop-tab') || undefined); return; }
  if (act === 'shop-close') { closeShop(); return; }
  if (act === 'shop-tab') { shopUi.tab = el.getAttribute('data-tab') || 'pet'; shopUi.msg = ''; renderShop(); return; }
  if (act === 'shop-buy') { buyItem(el.getAttribute('data-id')); return; }
  if (act === 'shop-admin') { if (!can('edit')) return; shopUi.admin = !shopUi.admin; renderShop(); return; }
  if (act === 'shop-hide') { if (!can('edit')) return; toggleShopHidden(el.getAttribute('data-id')); return; }
  if (act === 'shop-del') { if (!can('edit')) return; deleteShopItem(el.getAttribute('data-id')); return; }
  if (act === 'shop-add-open') { shopUi.addOpen = true; shopUi.draft = { cat: 'pet' }; renderShop(); return; }
  if (act === 'shop-add-cancel') { shopUi.addOpen = false; shopUi.draft = {}; renderShop(); return; }
  if (act === 'shop-add') { if (!can('edit')) return; addShopItem(); return; }
  if (act === 'care-open') { openCare(); return; }
  if (act === 'care-close') { closeCare(); return; }
  if (act === 'feed') { feedItem(el.getAttribute('data-id')); return; }
  if (act === 'room-open') { openRoom(); return; }
  if (act === 'pethome-open') { openPetHome(); return; }
  if (act === 'pethome-close') { closePetHome(); return; }
  if (act === 'room-close') { closeRoom(); return; }
  if (act === 'room-back') { roomUi.panel = 'main'; roomUi.msg = ''; renderRoom(); return; }
  if (act === 'room-studio') {
    if (roomUi.panel === 'studio') { roomUi.panel = 'main'; }
    else { roomUi.panel = 'studio'; if (!roomUi.studio) roomUi.studio = 'wall'; }
    renderRoom();
    return;
  }
  if (act === 'room-studio-tab') { roomUi.panel = 'studio'; roomUi.studio = el.getAttribute('data-tab') || 'wall'; renderRoom(); return; }
  if (act === 'room-wall') { roomUi.panel = 'studio'; roomUi.studio = 'wall'; renderRoom(); return; }
  if (act === 'room-decor') { roomUi.panel = 'studio'; roomUi.studio = 'decor'; renderRoom(); return; }
  if (act === 'room-theme') { roomUi.panel = 'studio'; roomUi.studio = 'theme'; renderRoom(); return; }
  if (act === 'room-size') { roomUi.panel = (roomUi.panel === 'size' ? 'main' : 'size'); renderRoom(); return; }
  if (act === 'room-floor') { roomGoFloor(el.getAttribute('data-n')); return; }
  /* 바닥을 눌렀을 때는 층을 바꾸지 않아요 — installRoomDrag 가 아바타만 그 자리로 걸어가게 해요 */
  if (act === 'room-floor-tap') { return; }
  if (act === 'room-floor-add') { roomAddFloor(); return; }
  if (act === 'room-theme-set') { setRoomTheme(el.getAttribute('data-id')); return; }
  if (act === 'room-size-up') { roomSizeUp(); return; }
  if (act === 'room-decor-place') { roomPlaceDecor(el.getAttribute('data-id')); return; }
  if (act === 'room-decor-remove') { roomDecorRemoveSel(); return; }
  if (act === 'room-decor-select') { roomUi.dsel = el.getAttribute('data-u'); roomUi.sel = ''; renderRoom(); return; }
  if (act === 'room-storage') { roomUi.panel = (roomUi.panel === 'storage' ? 'main' : 'storage'); renderRoom(); return; }
  if (act === 'room-pets') { roomUi.panel = (roomUi.panel === 'pets' ? 'main' : 'pets'); renderRoom(); return; }
  if (act === 'room-place') { roomAddFromStorage(el.getAttribute('data-id')); return; }
  if (act === 'room-move') { roomUi.moving = roomUi.moving ? '' : roomUi.sel; renderRoom(); return; }
  if (act === 'room-remove') { roomRemoveSel(); return; }
  if (act === 'room-deselect') { roomUi.sel = ''; roomUi.dsel = ''; roomUi.moving = ''; renderRoom(); return; }
  if (act === 'room-item') {
    var ru = el.getAttribute('data-u');
    roomUi.dsel = '';
    roomUi.sel = (roomUi.sel === ru && !roomUi.moving) ? '' : ru;
    renderRoom();
    return;
  }
  if (act === 'room-wall-set') { setRoomWall(el.getAttribute('data-id')); return; }
  if (act === 'room-pet-toggle') { toggleRoomPet(el.getAttribute('data-id')); return; }
  if (act === 'avatar-open') { openAvatar(); return; }
  if (act === 'avatar-close') { closeAvatar(); return; }
  if (act === 'av-slot') { avatarUi.slot = el.getAttribute('data-slot') || 'hair'; avatarUi.salon = false; renderAvatar(); return; }
  if (act === 'av-salon') { avatarUi.salon = !avatarUi.salon; renderAvatar(); return; }
  if (act === 'av-wear') {
    var avId = el.getAttribute('data-id');
    var avIt = shopItem(avId);
    if (!avIt) return;
    if (!isOwned(avId) && avIt.price > 0) { buyItem(avId); return; }
    equipAvatar(avIt.slot, avId);
    return;
  }
  if (act === 'av-off') {
    var offSlot = el.getAttribute('data-slot') || 'acc';
    var offD = avatarDraftAv();
    offD[offSlot] = '';
    /* 동작(영웅 포즈)이 그리는 등 뒤 망토도 '없음'을 누르면 함께 벗겨요 */
    var capeGone = false;
    if (offSlot === 'acc') {
      var poseIt = offD.pose ? avItem(offD.pose) : null;
      if (poseIt && poseIt.style === 'hero') { offD.pose = 'av_pose_stand'; capeGone = true; }
    }
    renderAvatar(true);
    showToast(capeGone
      ? '🧥 등 뒤 망토까지 같이 벗겼어요!'
      : (offSlot === 'hat' ? '🧢 모자를 뺐어요!' : '🕶 안경·소품을 모두 뺐어요!'));
    return;
  }
  if (act === 'av-gender') { setAvatarGender(el.getAttribute('data-id')); return; }
  if (act === 'av-dye') { dyePick(el.getAttribute('data-id')); return; }
  if (act === 'av-apply') { applyAvatarDraft(); return; }
  if (act === 'av-revert') { revertAvatarDraft(); return; }
  if (act === 'av-reset') { resetAvatarDraft(); return; }
  if (act === 'av-skin') { setAvatarSkin(el.getAttribute('data-id')); return; }
  if (act === 'av-haircolor') { setAvatarHairColor(el.getAttribute('data-id')); return; }
  if (act === 'allow-open') { openAllowance(); return; }
  if (act === 'allow-close') { closeAllowance(); return; }
  if (act === 'allow-mode') { setAllowMode(el.getAttribute('data-mode') || (el.getAttribute('data-minus') === '1' ? 'sub' : 'add')); return; }
  if (act === 'allow-quick') { allowUi.amount = allowAmountOf(el.getAttribute('data-n')); allowUi.msg = ''; renderAllowance(); return; }
  if (act === 'allow-refresh') { loadAllowBalance(true); return; }
  if (act === 'allow-send') { sendAllowance(); return; }
  if (act === 'allow-accept') { acceptAllowance(); return; }
  if (act === 'close-goal') { closeGoal(); return; }
});

document.addEventListener('click', function (e) {
  var m = document.getElementById('histModal');
  if (m && !m.hidden && e.target === m) closeHistory();
  var a = document.getElementById('acctModal');
  if (a && !a.hidden && e.target === a) closeAccounts();
  var r = document.getElementById('reasonModal');
  if (r && !r.hidden && e.target === r) closeReason();
  var sp = document.getElementById('spendModal');
  if (sp && !sp.hidden && e.target === sp) closeSpend();
  var st = document.getElementById('statsModal');
  if (st && !st.hidden && e.target === st) closeStats();
  var wb = document.getElementById('wbModal');
  if (wb && !wb.hidden && e.target === wb) closeWb();
  var pm = document.getElementById('petModal');
  if (pm && !pm.hidden && e.target === pm) closePet();
  var em = document.getElementById('evoModal');
  if (em && !em.hidden && e.target === em) closeEvo();
  var rm = document.getElementById('roomModal');
  if (rm && !rm.hidden && e.target === rm) closeRoom();
  var phm = document.getElementById('petHomeModal');
  if (phm && !phm.hidden && e.target === phm) closePetHome();
  var avm = document.getElementById('avatarModal');
  if (avm && !avm.hidden && e.target === avm) closeAvatar();
  var shm = document.getElementById('shopModal');
  if (shm && !shm.hidden && e.target === shm) closeShop();
  var cm = document.getElementById('careModal');
  if (cm && !cm.hidden && e.target === cm) closeCare();
  var alm = document.getElementById('allowModal');
  if (alm && !alm.hidden && e.target === alm) closeAllowance();
  var anm = document.getElementById('allowNoticeModal');
  if (anm && !anm.hidden && e.target === anm) acceptAllowance();
});

document.addEventListener('keydown', function (e) {
  if (e.key !== 'Escape' && e.key !== 'Esc') return;
  var anm2 = document.getElementById('allowNoticeModal');
  if (anm2 && !anm2.hidden) { acceptAllowance(); return; }
  var alm2 = document.getElementById('allowModal');
  if (alm2 && !alm2.hidden) { closeAllowance(); return; }
  var e1 = document.getElementById('evoModal');
  if (e1 && !e1.hidden) { closeEvo(); return; }
  var rm1 = document.getElementById('roomModal');
  if (rm1 && !rm1.hidden) { closeRoom(); return; }
  var av1 = document.getElementById('avatarModal');
  if (av1 && !av1.hidden) { closeAvatar(); return; }
  var sh1 = document.getElementById('shopModal');
  if (sh1 && !sh1.hidden) { closeShop(); return; }
  var ca1 = document.getElementById('careModal');
  if (ca1 && !ca1.hidden) { closeCare(); return; }
  var p1 = document.getElementById('petModal');
  if (p1 && !p1.hidden) { closePet(); return; }
  var w2 = document.getElementById('winModal');
  if (w2 && !w2.hidden) { closeWin(); return; }
  var s2 = document.getElementById('statsModal');
  if (s2 && !s2.hidden) { closeStats(); return; }
  var w1 = document.getElementById('wbModal');
  if (w1 && !w1.hidden) { closeWb(); return; }
  var sp1 = document.getElementById('spendModal');
  if (sp1 && !sp1.hidden) { closeSpend(); return; }
  var r1 = document.getElementById('reasonModal');
  if (r1 && !r1.hidden) { closeReason(); return; }
  var bk1 = document.getElementById('bulkModal');
  if (bk1 && !bk1.hidden) { closeBulkStickers(); return; }
  var a = document.getElementById('acctModal');
  if (a && !a.hidden) { closeAccounts(); return; }
  var m = document.getElementById('histModal');
  if (m && !m.hidden) { closeHistory(); return; }
  var tam = document.getElementById('targetAlertModal');
  if (tam && !tam.hidden) { closeTargetAlert(); return; }
  var g = document.getElementById('goalModal');
  if (g && !g.hidden) closeGoal();
});

document.addEventListener('input', function (e) {
  var el = e.target;
  if (el && el.id === 'bulkCount') {
    bulkState.count = Math.max(1, Math.min(20, parseInt(el.value, 10) || 1));
    var bpv = document.getElementById('bulkPreview');
    if (bpv) bpv.innerHTML = bulkPreviewText();
    return;
  }
  if (el && el.id === 'bulkReason') {
    bulkState.reason = String(el.value || '').slice(0, 20);
    return;
  }
  if (!el || el.id !== 'spendCount') return;
  var n = parseInt(el.value, 10);
  spendState.count = (isNaN(n) || n < 1) ? 1 : n;
  var pv = document.getElementById('spendPreview');
  if (pv) pv.innerHTML = spendPreviewHtml();
});

document.addEventListener('submit', function (e) {
  var f = e.target;
  if (!f || !f.id) return;
  if (f.id === 'spendForm') { e.preventDefault(); saveSpend(); return; }
  if (f.id === 'loginForm') { e.preventDefault(); doLogin(); return; }
  if (f.id === 'setupForm') { e.preventDefault(); doSetup(); return; }
  if (f.id === 'acctAddForm') { e.preventDefault(); addAccount(); return; }
  if (f.id === 'acctPwForm') { e.preventDefault(); saveAccountPassword(); return; }
});

document.addEventListener('change', function (e) {
  var el = e.target;
  if (el && el.id === 'petArtFile') {
    if (el.files && el.files.length) readPetArtFile(el.files[0]);
    el.value = '';
    return;
  }
  if (!el || el.id !== 'histFile' || !el.files || !el.files.length) return;
  var file = el.files[0];
  if (file.size > 8 * 1024 * 1024) {
    setHistNote('파일이 너무 커요. 대시보드 백업 파일(JSON)을 골라 주세요.');
    el.value = '';
    return;
  }
  if (typeof window.FileReader !== 'function') {
    setHistNote('이 브라우저에서는 파일을 불러올 수 없어요.');
    el.value = '';
    return;
  }
  var reader = new window.FileReader();
  reader.onload = function () {
    applyBackup(String(reader.result || ''));
    el.value = '';
  };
  reader.onerror = function () {
    setHistNote('파일을 읽지 못했어요. 다시 시도해 주세요.');
    el.value = '';
  };
  reader.readAsText(file);
});

document.addEventListener('keydown', function (e) {
  if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
  var t = e.target;
  if (!t || !t.getAttribute) return;
  var tag = t.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON') return;
  if (t.getAttribute('data-act') === 'toggle-check' && can('check')) {
    e.preventDefault();
    onToggleCheck(t);
  }
  if (t.getAttribute('data-act') === 'wb-item-open' && can('check')) {
    e.preventDefault();
    openWbForItem(t);
  }
});

document.addEventListener('input', function (e) {
  var el = e.target;
  if (!el || !el.getAttribute) return;
  var field = el.getAttribute('data-field');
  if (!field) return;

  if (field === 'allowAmount' || field === 'allowReason') {
    if (field === 'allowAmount') allowUi.amount = allowAmountOf(el.value);
    else allowUi.reason = String(el.value || '').slice(0, 40);
    var apv = document.getElementById('allowPrev');
    if (apv) apv.innerHTML = allowPrevHtml();
    return;
  }

  if (field === 'childName') {
    state.settings.childName = el.value;
    saveState();
    renderHeader();
    return;
  }
  if (field === 'greeting') {
    state.settings.greeting = el.value;
    saveState();
    renderHeader();
    return;
  }
  if (field === 'stickerGoal') {
    state.sticker.goal = el.value.slice(0, 40);
    saveState();
    renderStickers();
    return;
  }
  if (field === 'stickerUnit') {
    var unitVal = parseInt(el.value, 10);
    if (!isNaN(unitVal) && unitVal >= 100 && unitVal <= 100000) {
      state.sticker.unit = unitVal;
      saveState();
      renderLedger();
    }
    return;
  }
  if (field === 'stickerReasons') {
    var parts = el.value.split(',');
    var reasonList = [];
    for (var rp = 0; rp < parts.length && reasonList.length < 12; rp++) {
      var rv = parts[rp].trim();
      if (rv) reasonList.push(rv.slice(0, 20));
    }
    state.sticker.reasons = reasonList;
    state.sticker.reasonsUpdatedAt = Date.now();
    saveState();
    if (cloud.me) scheduleSync('stickers');
    return;
  }
  if (field === 'wbName') {
    var wbId = el.getAttribute('data-id');
    for (var ww = 0; ww < state.workbooks.length; ww++) {
      if (state.workbooks[ww].id === wbId) { state.workbooks[ww].name = el.value.slice(0, 24); break; }
    }
    saveState();
    return;
  }
  if (field === 'secTitle') {
    setSectionTitle(el.getAttribute('data-sec'), el.value);
    return;
  }
  if (field === 'secEmoji' || field === 'diySecEmoji') {
    setSectionEmoji(el.getAttribute('data-sec'), el.value);
    return;
  }
  if (field === 'diySecTitle') {
    setSectionTitle(el.getAttribute('data-sec'), el.value);
    return;
  }
  if (field === 'diyBlkGroup') {
    setBlockGroup(el.getAttribute('data-blk'), el.value);
    return;
  }
  if (field === 'diyNbTitle' || field === 'nbTitle') { setNoticeField(el.getAttribute('data-blk'), 'title', el.value); return; }
  if (field === 'diyNbEmoji' || field === 'nbEmoji') { setNoticeField(el.getAttribute('data-blk'), 'emoji', el.value); return; }
  if (field === 'diyNbText' || field === 'nbText') { setNoticeField(el.getAttribute('data-blk'), 'text', el.value); return; }
  if (field === 'catTitle') {
    var c = findCat(el.getAttribute('data-cat'));
    if (c) {
      c.title = el.value.slice(0, 16);
      saveState();
      renderRoutineJump();
      syncCatHead(c.id);
    }
    return;
  }
  if (field === 'catTarget') { setCatTarget(el.getAttribute('data-cat'), el.value); return; }
  if (field === 'catSub') {
    var cs = findCat(el.getAttribute('data-cat'));
    if (cs) {
      cs.sub = el.value.slice(0, 50);
      saveState();
      syncCatHead(cs.id);
    }
    return;
  }
  if (field === 'itemText') {
    var cc = findCat(el.getAttribute('data-cat'));
    var id = el.getAttribute('data-item');
    if (cc) {
      for (var i = 0; i < cc.items.length; i++) {
        if (cc.items[i].id === id) {
          cc.items[i].text = el.value;
          break;
        }
      }
      saveState();
    }
    return;
  }

  if (field === 'shopPrice') {
    setShopPrice(el.getAttribute('data-id'), el.value);
    return;
  }
  if (field === 'newShopName' || field === 'newShopIcon' || field === 'newShopPrice' || field === 'newShopColor') {
    shopUi.draft = shopUi.draft || {};
    shopUi.draft[field.replace('newShop', '').toLowerCase()] = el.value;
    return;
  }
  if (field === 'evTimeStart' || field === 'evTimeEnd') { setEventTime(el); return; }
  if (field === 'evName' || field === 'evTime') {
    var day = el.getAttribute('data-day');
    var evId = el.getAttribute('data-id');
    var arr = state.schedule[day] || [];
    for (var j = 0; j < arr.length; j++) {
      if (arr[j].id === evId) {
        if (field === 'evName') arr[j].name = el.value;
        else arr[j].time = el.value;
        break;
      }
    }
    saveState();
    renderTodayAcademy();
    return;
  }
});

/* ⭐ 칭찬 이유 칸에서 엔터를 치면 바로 넣어요 (한글 조합 중의 엔터는 무시) */
document.addEventListener('keydown', function (e) {
  if (e.key !== 'Enter' || e.isComposing || e.keyCode === 229) return;
  var el = e.target;
  if (!el || !el.getAttribute || !el.hasAttribute('data-sre-inp')) return;
  e.preventDefault();
  addStickerReason(el);
});

document.addEventListener('change', function (e) {
  var el = e.target;
  if (!el || !el.getAttribute) return;
  if (el.getAttribute('data-act') === 'acct-role') {
    changeRole(el.getAttribute('data-id'), el.value);
    return;
  }
  var field = el.getAttribute('data-field');

  if (field === 'catShowWb') {
    setCatShowWb(el.getAttribute('data-cat') || '', !!el.checked);
    return;
  }

  if (field === 'newShopCat' || field === 'newShopEffect') {
    shopUi.draft = shopUi.draft || {};
    if (field === 'newShopCat') shopUi.draft.cat = el.value;
    else shopUi.draft.effect = el.value;
    return;
  }
  if (field === 'petArtSp') { artEdit.sp = el.value; renderArtHosts(); return; }
  if (field === 'petArtStage') { artEdit.stage = el.value; renderArtHosts(); return; }
  if (field === 'allowTarget') {
    allowUi.to = el.value;
    allowUi.msg = '';
    allowUi.bal = null;
    allowUi.balFor = '';
    allowUi.balErr = '';
    renderAllowance();
    loadAllowBalance();
    return;
  }

  if (field === 'city') {
    state.settings.city = el.value;
    saveState();
    weather.data = null;
    weather.at = 0;
    weather.status = 'loading';
    weather.stale = false;
    loadWeatherCache();
    loadWeather();
    return;
  }

  if (field === 'catEmoji') {
    var ce = findCat(el.getAttribute('data-cat'));
    if (ce) {
      ce.emoji = String(el.value || '✅');
      saveState();
      renderRoutine();
    }
    return;
  }
  if (field === 'diySecWidth') {
    setSectionWidth(el.getAttribute('data-sec'), el.value);
    return;
  }
  if (field === 'diyBlkGroup') {
    setBlockGroup(el.getAttribute('data-blk'), el.value);
    return;
  }
  if (field === 'diySecEmoji' || field === 'secEmoji') {
    setSectionEmoji(el.getAttribute('data-sec'), el.value);
    return;
  }
  if (field === 'evTimeStart' || field === 'evTimeEnd') { setEventTime(el); return; }
  if (field === 'catTarget') { setCatTarget(el.getAttribute('data-cat'), el.value); return; }
  if (field === 'catAlertSound') { setCatAlertSound(el.getAttribute('data-cat'), el.value); return; }
  if (field === 'varNum') { setVarValue(el.getAttribute('data-var') || '', el.value); return; }
  if (field === 'stickerSlots') {
    var n = parseInt(el.value, 10);
    if (isNaN(n) || n < 3) n = 10;
    if (n < state.sticker.stickers.length) n = state.sticker.stickers.length;
    state.sticker.slots = n;
    state.sticker.celebrated = state.sticker.stickers.length >= n;
    saveState();
    el.value = String(n);
    renderStickers();
    return;
  }
});

/* ============ 시계 / 날짜 넘김 ============ */
function tick() {
  var now = new Date();
  updateClock(now);
  try { phaseTick(); } catch (e) { /* 무시 */ }
  try { tickTargets(); } catch (e) { /* 무시 */ }
  try { targetAlertWarmup(); } catch (e) { /* 무시 */ }
  try { checkTargetAlerts(); } catch (e) { /* 무시 */ }
  try { checkDayRollover(); } catch (e) { /* 무시 */ }
}

function storageAvailable() {
  try {
    var k = '__kidsDashTest__';
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
    return true;
  } catch (e) {
    return false;
  }
}

/* ---- ⛶ 전체화면 (구형 안드로이드 크롬은 webkit 접두어를 써요) ---- */
/* 안드로이드 7 기본 글꼴에는 ⛶ 글자가 없어서 네모로 보여요 → 같은 모양을 SVG로 그려요 */
var FS_ICON_OUT = '<svg class="fs-ico" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M3.2 7V3.2H7M13 3.2h3.8V7M16.8 13v3.8H13M7 16.8H3.2V13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
var FS_ICON_IN = '<svg class="fs-ico" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M7 3.2V7H3.2M16.8 7H13V3.2M13 16.8V13h3.8M3.2 13H7v3.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
function fsFullElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement || null;
}
function syncFullscreenBtn() {
  var btn = document.getElementById('fsBtn');
  if (!btn) return;
  var standalone = false;
  try {
    standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      window.navigator.standalone === true;
  } catch (e) { standalone = false; }
  var el = document.documentElement;
  var supported = !!(el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen);
  /* 홈 화면에 추가해 이미 전체화면으로 열렸거나, 전체화면을 못 쓰는 브라우저면 숨겨요 */
  btn.hidden = standalone || !supported;
  var on = !!fsFullElement();
  btn.innerHTML = on ? FS_ICON_IN : FS_ICON_OUT;
  btn.setAttribute('aria-label', on ? '전체화면 끄기' : '전체화면');
  btn.title = on ? '전체화면 끄기' : '전체화면';
}
function toggleFullscreen() {
  var el = document.documentElement;
  try {
    if (fsFullElement()) {
      var ex = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
      if (ex) {
        var r = ex.call(document);
        if (r && r.catch) r.catch(function () { /* 무시 */ });
      }
    } else {
      var rq = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
      if (rq) {
        var r2 = rq.call(el);
        if (r2 && r2.catch) r2.catch(function () { /* 무시 */ });
      } else {
        showToast('이 브라우저에서는 전체화면을 쓸 수 없어요');
      }
    }
  } catch (e) {
    try { showToast('전체화면을 켜지 못했어요'); } catch (e2) { /* 무시 */ }
  }
  window.setTimeout(function () { try { syncFullscreenBtn(); } catch (e3) { /* 무시 */ } }, 120);
}
