/* ============================================================================
   Jaden's Today v2 — js/boot.js
   앱 시작 — 상태 초기화 · 첫 렌더 · 알림/날씨/동기화 타이머
   · 원본 index.html(운영본)의 같은 코드를 기능별로 나눈 파일입니다. 동작은 원본과 같아요.
   · 모듈끼리 같은 전역 스코프를 써요. index.html 에서 core → sync → ... 순서로 불러옵니다.
   ============================================================================ */
'use strict';

/* ============ 상태 ============ */
var state = loadState();
var ui = { editing: false, layout: false, inlineEditSecId: '' };
var weather = { status: 'idle', data: null, at: 0, error: '', fetchedAt: 0, stale: false };
var currentKey = dateKey();
var freshIdx = -1;
var audioCtx = null;

/* ============ 시작 ============ */
installAudioUnlock();
installRoomDrag();
installSectionResize();
installSectionMove();
loadWeatherCache();
/* 첫 화면을 그리기 전에, 이 기기에 저장해 둔 코인·펫을 먼저 붙여요.
   (안 붙이면 새로고침 직후 새 계정 기본 코인 120이 잠깐 비쳐요) */
try {
  var bootUid = lsGet(LAST_ID_KEY);
  var bootProf = bootUid ? readProfileCache(bootUid) : null;
  if (bootProf) state.profile = normalizeProfile(bootProf, bootUid);
} catch (eBoot) { /* 무시 */ }
renderAll();
startNotifyLoop();
/* 소리가 울리는 동안 🔇 알림 끄기 버튼·🎵 버튼 상태를 맞춰 둬요 */
window.setInterval(function () { try { updateSoundUi(); } catch (e) { /* 무시 */ } }, 1000);
window.setTimeout(function () { try { checkTargetAlerts(); } catch (e) { /* 무시 */ } }, 2500);
loadWeather();
initAuth();
try { syncFullscreenBtn(); } catch (e) { /* 무시 */ }
document.addEventListener('fullscreenchange', function () { try { syncFullscreenBtn(); } catch (e) { /* 무시 */ } });
document.addEventListener('webkitfullscreenchange', function () { try { syncFullscreenBtn(); } catch (e) { /* 무시 */ } });

var routineResizeTimer = 0;
window.addEventListener('resize', function () {
  if (routineResizeTimer) window.clearTimeout(routineResizeTimer);
  routineResizeTimer = window.setTimeout(function () {
    routineResizeTimer = 0;
    applyRoutineView();
    applyLayoutOrder();
    try { renderStickers(); } catch (e9) { /* 무시 */ }
  }, 180);
});

window.addEventListener('online', function () {
  if (cloud.me && (cloud.dirty.day || cloud.dirty.settings || cloud.dirty.stickers || cloud.dirty.profile)) flushSync();
});
window.setInterval(function () {
  if (cloud.me && (cloud.dirty.day || cloud.dirty.settings || cloud.dirty.stickers) && navigator.onLine !== false) flushSync();
}, 15000);
/* 다른 기기에서 붙인 스티커·코인을 열어 둔 화면에도 1분 안에 보여 줘요 */
window.setInterval(function () { try { refreshStickersFromCloud(false); } catch (e) { /* 무시 */ } }, 30000);
window.setInterval(function () { try { refreshProgressFromCloud(); } catch (e) { /* 무시 */ } }, 60000);
window.addEventListener('focus', function () { try { refreshStickersFromCloud(false); } catch (e) { /* 무시 */ } });
document.addEventListener('visibilitychange', function () {
  if (!document.hidden) { try { refreshStickersFromCloud(false); } catch (e) { /* 무시 */ } }
});

if (!storageAvailable()) {
  var note = document.getElementById('footerNote');
  if (note) {
    note.textContent = '이 브라우저에서는 저장이 막혀 있어요. 화면을 닫으면 체크한 내용이 사라져요.';
    note.style.color = '#c6415a';
  }
}
window.setInterval(tick, 1000);
/* 자정 넘김·잠금 해제·탭 복귀 대비: 30초마다 날짜 확인 */
window.setInterval(function () { try { checkDayRollover(); } catch (e) { /* 무시 */ } }, 30 * 1000);
document.addEventListener('visibilitychange', function () {
  if (!document.hidden) { try { checkDayRollover(); } catch (e) { /* 무시 */ } }
});
window.addEventListener('focus', function () { try { checkDayRollover(); } catch (e) { /* 무시 */ } });
window.addEventListener('pageshow', function () { try { checkDayRollover(); } catch (e) { /* 무시 */ } });
window.setInterval(function () { loadWeather(); }, 30 * 60 * 1000);

window.addEventListener('online', function () {
  if (weather.status !== 'ok') loadWeather();
});

document.addEventListener('visibilitychange', function () {
  if (!document.hidden && Date.now() - weather.fetchedAt > 20 * 60 * 1000) loadWeather();
});
