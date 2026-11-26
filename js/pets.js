/* ============================================================================
   Jaden's Today v2 — js/pets.js
   내 펫 · 몬스터 도감 · 부화 · 진화 · 먹이
   · 원본 index.html(운영본)의 같은 코드를 기능별로 나눈 파일입니다. 동작은 원본과 같아요.
   · 모듈끼리 같은 전역 스코프를 써요. index.html 에서 core → sync → ... 순서로 불러옵니다.
   ============================================================================ */
'use strict';

/* ---------------- 펫 (계정 프로필 기반) ---------------- */
function petState() {
  var p = prof();
  if (!p.pet || typeof p.pet !== 'object') p.pet = defaultProfile().pet;
  return p.pet;
}

/* ======================================================================
   여러 마리 펫 — 알 뽑기(30코인) · 내 펫 목록 · 키울 친구 고르기
   - prof().pet        : 지금 키우는 친구 (그림·도감·케어가 모두 이 친구를 봐요)
   - prof().pets[]     : 아직 키우지 않는 알·친구들 (각자 stage·exp·종족을 가져요)
   - prof().activePetId: 지금 키우는 친구의 id
   ====================================================================== */
var PET_DRAW_COST = 30;      /* 랜덤 알 뽑기 1회 */

function petNewId() {
  return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/* currentEgg↔speciesId, exp↔xp 를 같이 맞춰 둬요 (예전 기록·새 기록 모두 읽을 수 있게) */
function petAlias(p) {
  if (!p || typeof p !== 'object') return p;
  if (typeof p.currentEgg === 'string') p.speciesId = p.currentEgg;
  else if (typeof p.speciesId === 'string') p.currentEgg = p.speciesId;
  p.xp = Number(p.exp) || 0;
  return p;
}

/* 저장용(목록용) 친구 기록 — 자리마다 필요한 값만 담아요 (도감·그림은 지금 키우는 친구가 가져요) */
function petSpecific(src) {
  var sp = String((src && (src.currentEgg || src.speciesId)) || PET_SPECIES[0].id);
  var st = parseInt(src && src.stage, 10);
  if (isNaN(st) || st < 0) st = 0;
  if (st > 3) st = 3;
  var ex = parseInt(src && (src.exp != null ? src.exp : src.xp), 10);
  if (isNaN(ex) || ex < 0) ex = 0;
  if (st >= 3) ex = 0;
  if (ex > EXP_MAX) ex = EXP_MAX;
  return {
    id: (src && typeof src.id === 'string' && src.id) ? src.id : petNewId(),
    currentEgg: sp, speciesId: sp,
    stage: st, exp: ex, xp: ex,
    hatchAt: (st === 0 && src && Number(src.hatchAt)) ? Number(src.hatchAt) : 0,
    hatchedAt: (src && Number(src.hatchedAt)) ? Number(src.hatchedAt) : 0,
    gotAt: (src && Number(src.gotAt)) ? Number(src.gotAt) : 0,
    from: (src && typeof src.from === 'string') ? src.from.slice(0, 12) : ''
  };
}

/* 저장된 기록 하나를 안전하게 다듬어요 (종족이 없거나 이상하면 버려요) */
function petCleanInstance(raw) {
  if (!raw || typeof raw !== 'object') return null;
  var sp = (typeof raw.currentEgg === 'string') ? raw.currentEgg : ((typeof raw.speciesId === 'string') ? raw.speciesId : '');
  if (!sp || speciesById(sp).id !== sp) return null;
  return petSpecific(raw);
}

function petEnsureList(q) {
  q = q || prof();
  if (!q.pet || typeof q.pet !== 'object') q.pet = defaultProfile().pet;
  if (Object.prototype.toString.call(q.pets) !== '[object Array]') q.pets = [];
  if (typeof q.pet.id !== 'string' || !q.pet.id) q.pet.id = petNewId();
  var dirty = false;
  for (var i = 0; i < q.pets.length; i++) {
    var one = q.pets[i];
    if (!one || typeof one !== 'object' || typeof one.id !== 'string' || !one.id ||
        one.speciesId !== one.currentEgg || Number(one.xp) !== Number(one.exp)) { dirty = true; break; }
  }
  if (dirty) {
    var out = [];
    var seen = {};
    seen[q.pet.id] = 1;
    for (var j = 0; j < q.pets.length; j++) {
      var c = petCleanInstance(q.pets[j]);
      if (!c || seen[c.id]) continue;
      seen[c.id] = 1;
      out.push(c);
    }
    q.pets = out;
  }
  petAlias(q.pet);
  q.activePetId = q.pet.id;
  return q;
}

function petLeftMs(one) {
  if (!one || Number(one.stage) !== 0 || !one.hatchAt) return 0;
  return Math.max(0, Number(one.hatchAt) - Date.now());
}

/* 지금 키우는 친구를 앞에 두고, 가진 알·친구를 모두 돌려줘요 */
function petOwnedList(q) {
  q = petEnsureList(q || prof());
  var out = [];
  var act = petSpecific(q.pet);
  act.active = true;
  out.push(act);
  for (var i = 0; i < q.pets.length; i++) {
    var one = petSpecific(q.pets[i]);
    one.active = false;
    out.push(one);
  }
  return out;
}

/* 마이룸 '함께 놀 친구'는 종족으로만 불러요 — 그 종족이 지금 실제로 몇 단계인지 찾아요
   · 지금 키우는 친구(q.pet)와 가진 알·친구(q.pets) 중 같은 종족의 부화한 단계(1~3)를 모아 가장 높은 단계
   · 예전에 다 자란 기록만 도감(q.pet.collection)에 남아 있으면 3단계로 봐요 */
function petStageForSpecies(q, speciesId) {
  q = petEnsureList(q || prof());
  var sp = String(speciesId || '');
  if (!sp) return 3;
  var best = 0;
  var cur = petSpecific(q.pet);
  if (cur.currentEgg === sp && cur.stage >= 1) best = Math.max(best, Math.min(3, cur.stage));
  for (var i = 0; i < q.pets.length; i++) {
    var one = petSpecific(q.pets[i]);
    if (one.currentEgg === sp && one.stage >= 1) best = Math.max(best, Math.min(3, one.stage));
  }
  return best || 3;
}

/* 예전에 키우던 친구는 목록에 그대로 두고, 고른 친구를 '지금 키우는' 자리로 올려요 */
function petMakeActive(q, target) {
  var next = petSpecific(target);
  var cur = petSpecific(q.pet);
  var keep = [];
  for (var i = 0; i < q.pets.length; i++) {
    var one = q.pets[i];
    if (!one || one.id === next.id) continue;
    keep.push(petSpecific(one));
  }
  keep.push(cur);
  /* 도감·그림·오늘 받은 기록은 한 벌만 있어요 — 새로 키우는 친구가 이어받아요 */
  next.collection = (Object.prototype.toString.call(q.pet.collection) === '[object Array]') ? q.pet.collection : [];
  next.art = (q.pet.art && typeof q.pet.art === 'object') ? q.pet.art : {};
  next.awarded = (q.pet.awarded && typeof q.pet.awarded === 'object') ? q.pet.awarded : {};
  next.clearedAt = Number(q.pet.clearedAt) || 0;
  next.updatedAt = q.pet.updatedAt || '';
  q.pets = keep;
  q.pet = next;
  q.activePetId = next.id;
  return q.pet;
}

/* 🥚 랜덤 알 뽑기 — 30코인이면 언제든지 (다 자라기를 기다리지 않아요) */
function petDrawEgg() {
  var q = petEnsureList(prof());
  if (q.coins < PET_DRAW_COST) {
    snd('uncheck');
    showToast(coinSvg() + ' 코인이 ' + fmtNum(PET_DRAW_COST - q.coins) + '개 모자라요. 루틴을 체크해서 모아 보세요!', true);
    return null;
  }
  q.coins -= PET_DRAW_COST;
  q.updatedAt = new Date().toISOString();
  var sp = PET_SPECIES[Math.floor(Math.random() * PET_SPECIES.length)];
  var egg = petSpecific({
    id: petNewId(), currentEgg: sp.id, stage: 0, exp: 0,
    hatchAt: Date.now() + HATCH_MS, hatchedAt: 0, gotAt: Date.now(), from: 'gacha'
  });
  q.pets.push(egg);
  saveState();
  renderCoinBadge(-PET_DRAW_COST);
  renderPet();
  renderPetHomeExtra();
  var sm = document.getElementById('shopModal');
  if (sm && !sm.hidden) renderShop();
  confetti(40, document.getElementById('petVisual') || document.getElementById('petBar'));
  snd('win');
  showToast('🥚 새 알을 뽑았어요! ‘내 펫’에서 골라 키워 보세요.');
  return egg;
}

/* ‘이 펫 키우기’ — 고른 알·친구에게 먹이(EXP)와 진화가 가요 */
function petSelect(id) {
  var q = petEnsureList(prof());
  if (!id || id === q.pet.id) return false;
  var target = null;
  for (var i = 0; i < q.pets.length; i++) if (q.pets[i].id === id) target = q.pets[i];
  if (!target) return false;
  var sp = speciesById(target.currentEgg);
  petMakeActive(q, target);
  /* 고른 알의 부화 시간이 이미 지났으면 바로 부화해요 */
  if (q.pet.stage === 0 && q.pet.hatchAt && Date.now() >= q.pet.hatchAt) petTryHatch(false);
  saveState();
  renderPet();
  renderPetHomeExtra();
  if (!document.getElementById('careModal').hidden) renderCare();
  if (!document.getElementById('roomModal').hidden) renderRoom();
  try { renderRoutineTargets(); } catch (e) { /* 무시 */ }
  snd('check');
  var nm = (q.pet.stage === 0) ? '수수께끼 알' : sp.names[Math.max(0, q.pet.stage - 1)];
  showToast('🐾 ' + josa(nm, '을', '를') + ' 키우기 시작해요!');
  return true;
}

/* ---- 🏃 목표 시간 바에서 달릴 친구 고르기 ---- */
function petRunnerPick(q) {
  q = petEnsureList(q || prof());
  var id = (typeof q.runnerPetId === 'string') ? q.runnerPetId : '';
  if (id && id !== q.pet.id) {
    for (var i = 0; i < q.pets.length; i++) if (q.pets[i].id === id) return petSpecific(q.pets[i]);
  }
  /* 고른 적이 없거나 그 친구가 지금 키우는 친구가 되었으면 지금 키우는 친구가 달려요 */
  return petSpecific(q.pet);
}

function petSetRunner(id) {
  var q = petEnsureList(prof());
  q.runnerPetId = (typeof id === 'string') ? id : '';
  saveState();
  renderPetHomeExtra();
  try { renderRoutineTargets(); } catch (e) { /* 무시 */ }
  try { renderTargetBars(); } catch (e) { /* 무시 */ }
  snd('check');
  var pick = petRunnerPick(q);
  var sp = speciesById(pick.currentEgg);
  var nm = pick.stage === 0 ? '수수께끼 알' : sp.names[Math.max(0, pick.stage - 1)];
  showToast('🏃 목표 시간 바에서 ' + josa(nm, '이', '가') + ' 달려요!');
}

function petRunnerRowHtml() {
  var list = petOwnedList(prof());
  var chosen = petRunnerPick(prof());
  var h = '<h3 class="pet-sec-title">🏃 목표 시간 달리기 펫</h3>';
  h += '<div class="runner-grid">';
  for (var i = 0; i < list.length; i++) {
    var one = list[i];
    var sp = speciesById(one.currentEgg);
    var nm = one.stage === 0 ? '수수께끼 알' : sp.names[Math.max(0, one.stage - 1)];
    var on = (one.id === chosen.id);
    h += '<button type="button" class="runner-card' + (on ? ' on' : '') + '" data-act="pet-runner" data-id="' + esc(one.id) + '" aria-pressed="' + (on ? 'true' : 'false') + '">' +
      '<span class="rc-art">' + petArt(sp, one.stage, 0) + '</span>' +
      '<b>' + esc(nm) + '</b>' +
      '<small>' + (on ? '달리는 중' : (one.stage === 0 ? '알' : PET_STAGE_LABEL[one.stage])) + '</small>' +
      '</button>';
  }
  h += '</div>';
  h += '<p class="lf-note">고른 친구가 목표 시간 바에서 결승선까지 달려요. 고르지 않으면 지금 키우는 친구가 달려요.</p>';
  return h;
}

/* 목록에 있지만 아직 고르지 않은 알도 24시간이 지나면 부화해요 */
function petHatchInactiveDue() {
  var q = prof();
  if (Object.prototype.toString.call(q.pets) !== '[object Array]') return false;
  var changed = false;
  for (var i = 0; i < q.pets.length; i++) {
    var one = q.pets[i];
    if (!one || Number(one.stage) !== 0 || !one.hatchAt) continue;
    if (Date.now() < Number(one.hatchAt)) continue;
    one.stage = 1;
    one.hatchAt = 0;
    one.hatchedAt = Date.now();
    one.exp = 0;
    one.xp = 0;
    bumpProgress('pet', 1);
    changed = true;
  }
  if (!changed) return false;
  saveState();
  renderPet();
  renderPetHomeExtra();
  return true;
}

/* ---- 🥚 내 펫 화면: 알 뽑기 버튼 + 가진 알·친구 목록 ---- */
function petMineRowHtml(one, idx) {
  var sp = speciesById(one.currentEgg);
  var stage = Number(one.stage) || 0;
  var need = petNeed(stage);
  var pct = need ? Math.min(100, Math.round((one.exp || 0) / need * 100)) : 100;
  var name;
  var sub;
  if (stage === 0) {
    name = '수수께끼 알';
    sub = one.hatchAt ? ('부화까지 ' + fmtLeft(petLeftMs(one)) + ' · 먹이로도 부화') : '먹이를 주면 부화해요';
  } else if (stage >= 3) {
    name = sp.names[2];
    sub = '2차 진화 완성 · 마이룸에서 함께 놀아요';
  } else {
    name = sp.names[stage - 1];
    sub = 'EXP ' + (one.exp || 0) + ' / ' + need + ' · ' + PET_STAGE_LABEL[stage + 1] + '까지 ' + Math.max(0, need - (one.exp || 0));
  }
  var art = petArt(sp, stage, (one.exp || 0) / Math.max(1, need));
  var right = one.active
    ? '<span class="pm-now">키우는 중</span>'
    : '<button type="button" class="pill-btn warm" data-act="pet-select" data-id="' + esc(one.id) + '">이 펫 키우기</button>';
  return '<div class="pet-mine' + (one.active ? ' now' : '') + '" data-pet="' + esc(one.id) + '">' +
    '<span class="pm-art">' + art + '</span>' +
    '<span class="pm-meta">' +
      '<span class="pm-name">' + esc(name) + (one.active ? '' : '<small class="pm-no">' + (idx + 1) + '번째</small>') +
        (stage === 0 ? '<span class="egg-badge">알</span>' : typeBadgeHtml(sp) + rarityBadgeHtml(sp)) + '</span>' +
      '<span class="pm-sub">' + esc(sub) + '</span>' +
      (stage < 3 ? '<span class="pm-gauge"><i style="width:' + pct + '%"></i></span>' : '') +
    '</span>' +
    right +
  '</div>';
}

/* 🍖 먹이 바로가기 — '내 펫'에서 먹이를 못 찾지 않게 가방 개수와 주기 버튼을 함께 보여 줘요 */
function petFoodInfo() {
  var all = shopAll(), n = 0, first = '', gain = 0;
  for (var i = 0; i < all.length; i++) {
    var it = all[i];
    if (!it || it.cat !== 'pet' || it.hidden) continue;
    if (isLegacyPetItem(it) || it.kind !== 'exp') continue;
    var c = bagCount(it.id);
    if (c <= 0) continue;
    n += c;
    if (!first) { first = it.id; gain = parseInt(it.n, 10) || 10; }
  }
  return { n: n, first: first, gain: gain };
}

function petFeedBarHtml() {
  var f = petFoodInfo();
  var p = petState();
  var line, btn;
  if (p.stage >= 3) {
    line = '2차 진화 완성! 새 알을 뽑아 다시 키워 보세요';
    btn = '<button type="button" class="pill-btn warm" data-act="pet-new-egg">🥚 새 알 받기</button>';
  } else if (f.n > 0) {
    line = '가방에 먹이 <b>' + f.n + '</b>개 · 하나 주면 +' + f.gain + ' EXP';
    btn = '<button type="button" class="pill-btn warm" data-act="feed" data-id="' + esc(f.first) + '">🍖 먹이 주기</button>';
  } else {
    line = '가방이 비었어요 · 상점에서 먹이를 사면 여기서 바로 줄 수 있어요';
    btn = '<button type="button" class="pill-btn warm" data-act="shop-open" data-shop-tab="pet">🛒 먹이 사러 가기</button>';
  }
  return '<div class="pet-feedbar">' +
    '<span class="pf-ic" aria-hidden="true">🍖</span>' +
    '<span class="pf-txt"><b>먹이 주기</b><small>' + line + '</small></span>' +
    btn +
    '</div>';
}

function petHomeExtraHtml() {
  var q = petEnsureList(prof());
  var list = petOwnedList(q);
  var eggs = 0;
  for (var i = 0; i < list.length; i++) if (list[i].stage === 0) eggs++;
  var h = petFeedBarHtml() + '<div class="pet-gacha">' +
    '<span class="pg-txt"><b>🥚 랜덤 알 뽑기</b><small>' + fmtNum(PET_DRAW_COST) + '코인 · ' + PET_TYPES.length + '속성 ' + PET_SPECIES.length + '종 중 하나가 나와요</small></span>' +
    '<button type="button" class="pill-btn warm" data-act="pet-gacha">🥚 알 뽑기 (' + fmtNum(PET_DRAW_COST) + '코인)</button>' +
    '</div>';
  h += '<h3 class="pet-sec-title">🐾 내 펫 <b>' + list.length + '</b>마리' + (eggs ? ' · 알 ' + eggs + '개' : '') + '</h3>';
  h += '<div class="pet-mine-list">';
  for (var j = 0; j < list.length; j++) h += petMineRowHtml(list[j], j);
  h += '</div>';
  h += petRunnerRowHtml();
  h += '<p class="lf-note">키울 친구를 고르면 먹이(🍖)와 진화가 그 친구에게 가요. 30코인으로 새 알을 언제든 뽑을 수 있어요!</p>';
  return h;
}

function renderPetHomeExtra() {
  var box = document.getElementById('petHomeExtra');
  if (!box) return;
  var m = document.getElementById('petHomeModal');
  if (m && m.hidden) return;
  box.innerHTML = petHomeExtraHtml();
}
function petNeed(stage) { return stage >= 0 && stage < 3 ? EXP_MAX : 0; }

function petHatchLeft() {
  var p = petState();
  if (p.stage !== 0) return 0;
  return Math.max(0, (p.hatchAt || 0) - Date.now());
}

function fmtLeft(ms) {
  if (ms <= 0) return '0분';
  var m = Math.ceil(ms / 60000);
  var h = Math.floor(m / 60);
  var mm = m % 60;
  if (h >= 24) {
    var dd = Math.floor(h / 24);
    var hh = h % 24;
    return dd + '일' + (hh ? ' ' + hh + '시간' : '');
  }
  if (h > 0) return h + '시간 ' + (mm ? mm + '분' : '');
  return mm + '분';
}

function petPop(n, unit) {
  var vis = document.getElementById('petVisual');
  if (!vis || !n) return;
  var el = document.createElement('span');
  el.className = 'pet-pop';
  el.textContent = (n > 0 ? '+' + n : String(n)) + ' ' + (unit || 'EXP');
  vis.appendChild(el);
  window.setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 1100);
}

function petCollectNow(p) {
  var sp = speciesById(p.currentEgg);
  for (var i = 0; i < p.collection.length; i++) if (p.collection[i].id === sp.id) return;
  p.collection.push({ id: sp.id, at: Date.now() });
}

/* 알 부화: 100 EXP를 채우거나 24시간 타이머가 끝나면 부화 */
function petTryHatch(loud) {
  var p = petState();
  if (p.stage !== 0) return false;
  var byExp = p.exp >= EXP_MAX;
  var byTime = p.hatchAt && Date.now() >= p.hatchAt;
  if (!byExp && !byTime) return false;
  p.stage = 1;
  p.exp = 0;
  p.hatchAt = 0;
  p.hatchedAt = Date.now();
  bumpProgress('pet', 1);
  var spNow = speciesById(p.currentEgg);
  var roomAdded = roomAutoPlacePet(spNow.id);
  p.updatedAt = new Date().toISOString();
  saveState();
  if (loud) {
    renderPet();
    var vis = document.getElementById('petVisual');
    if (vis) { vis.classList.remove('wiggle'); void vis.offsetWidth; vis.classList.add('wiggle'); }
    confetti(52, vis || document.getElementById('petBar'));
    snd('win');
    if (roomAdded) showToast('🏡 ' + spNow.names[0] + '이가 마이룸에 놀러 왔어요!');
    window.setTimeout(function () { showEvo(1); }, 320);
  }
  return true;
}

/* 부화한 친구를 마이룸에 바로 풀어 놓기 (방 넓이에 따라 한 층에 4·6·8명) */
function roomAutoPlacePet(spId) {
  if (!spId) return false;
  var p = prof();
  if (!p.room || typeof p.room !== 'object' || Object.prototype.toString.call(p.room.floors) !== '[object Array]' || !p.room.floors.length) p.room = defaultRoom();
  var f = curFloor(p.room);
  if (Object.prototype.toString.call(f.pets) !== '[object Array]') f.pets = [];
  var all = [];
  for (var i = 0; i < p.room.floors.length; i++) all = all.concat(p.room.floors[i].pets || []);
  if (all.indexOf(spId) >= 0) return false;
  if (f.pets.length >= roomPetMax(f.size)) return false;
  f.pets.push(spId);
  roomMirror();
  return true;
}

function petAddExp(n, opts) {
  opts = opts || {};
  var p = petState();
  if (!n) return p.exp;
  if (p.stage >= 3) {
    showToast('🌟 2차 진화를 완성했어요! 다른 친구를 골라 키우거나 새 알을 뽑아 보세요!');
    return p.exp;
  }
  if (!opts.quiet) petPop(n, 'EXP');
  var reached = -1;
  if (p.stage === 0) {
    p.exp = Math.min(EXP_MAX, p.exp + n);
    if (p.exp >= EXP_MAX) {
      p.exp = 0;
      p.stage = 1;
      p.hatchAt = 0;
      p.hatchedAt = Date.now();
      reached = 1;
      bumpProgress('pet', 1);
      var spHatch = speciesById(p.currentEgg);
      if (roomAutoPlacePet(spHatch.id) && !opts.quiet) {
        showToast('🏡 ' + spHatch.names[0] + '이가 마이룸에 놀러 왔어요!');
      }
    }
  } else {
    p.exp += n;
    while (p.stage < 3 && p.exp >= EXP_MAX) {
      p.exp -= EXP_MAX;
      p.stage += 1;
      reached = p.stage;
      if (p.stage >= 3) { p.exp = 0; petCollectNow(p); }
    }
  }
  p.updatedAt = new Date().toISOString();
  saveState();
  renderPet();
  if (!document.getElementById('roomModal').hidden) renderRoom();
  if (!document.getElementById('careModal').hidden) renderCare();

  if (reached >= 0 && !opts.quiet) {
    var vis = document.getElementById('petVisual');
    if (vis) { vis.classList.remove('wiggle'); void vis.offsetWidth; vis.classList.add('wiggle'); }
    confetti(reached >= 3 ? 80 : 46, vis || document.getElementById('petBar'));
    snd('win');
    window.setTimeout(function () { showEvo(reached); }, 320);
  }
  return p.exp;
}

/* 예전 코드 호환 — 이제 체크로는 EXP가 오르지 않고 코인만 올라요 */
function petGainExp(n, opts) { return petAddExp(n, opts); }
function petAward() { return false; }
function petEnsure() {
  var p = petState();
  if (p.stage >= 3) petCollectNow(p);
}

/* 다른 기기의 프로필을 처음 받을 때만 쓰는 병합 */
function petMergeFrom(d) {
  if (!d || typeof d !== 'object') return;
  var p = petState();
  var rawCol = (Object.prototype.toString.call(d.collection) === '[object Array]') ? d.collection : [];
  for (var j = 0; j < rawCol.length; j++) {
    var cc = rawCol[j] || {};
    var cid = (typeof cc === 'string') ? cc : cc.id;
    if (typeof cid !== 'string' || speciesById(cid).id !== cid) continue;
    var has = false;
    for (var k = 0; k < p.collection.length; k++) if (p.collection[k].id === cid) has = true;
    if (!has) p.collection.push({ id: cid, at: Number(cc.at) || Date.now() });
  }
  var rs = parseInt(d.stage, 10);
  if (!isNaN(rs) && rs > p.stage && rs <= 3) { p.stage = rs; p.exp = 0; p.hatchAt = 0; }
  if (typeof d.currentEgg === 'string' && speciesById(d.currentEgg).id === d.currentEgg) p.currentEgg = d.currentEgg;
  saveLocalOnly();
  renderPet();
}

function petNewEgg() {
  var q = petEnsureList(prof());
  var p = q.pet;
  if (p.stage < 3) { showToast('2차 진화를 완성하면 새 알을 받을 수 있어요!'); return; }
  var sp = petNextEgg(p);
  var egg = petSpecific({
    id: petNewId(), currentEgg: sp, stage: 0, exp: 0,
    hatchAt: Date.now() + HATCH_MS, hatchedAt: 0, gotAt: Date.now(), from: 'free'
  });
  petMakeActive(q, egg);
  saveState();
  renderPet();
  renderPetHomeExtra();
  if (!document.getElementById('careModal').hidden) renderCare();
  snd('win');
  showToast('🥚 새 알이 도착했어요! 24시간 뒤에 부화해요. 다 자란 친구는 ‘내 펫’에 그대로 있어요.');
}

/* ---------------- 그림 ---------------- */

/* ---------------- 그림 ---------------- */

  /* ---------------- 그림 ---------------- */

  /* ---------------- 그림 ---------------- */

  /* ---------------- 그림 ---------------- */

/* 손그림풍 친구 그림 — 18속성 × 3단계(54종)
   · 1단계(아기): 머리가 크고 몸은 통통, 눈이 크고 순수한 아기 모습. 날개 없음.
   · 2단계(소년): 키가 자라고 속성 개성이 뚜렷해져요. 날 수 있는 속성만 작은 날개싹.
   · 3단계(청소년): 자신감 있는 히어로 모습 + 속성 기운(오라). 날 수 있는 속성만 큰 날개.
   날개는 비행·드래곤·페어리·벌레만! (불·물·땅·바위·격투·강철·독·노멀·풀·얼음·전기·악은 날개 없음) */

var PET_WING_TYPES = { flying: 1, dragon: 1, fairy: 1, bug: 1 };
function petCanFly(type) { return !!PET_WING_TYPES[String(type || '')]; }

/* 단계별 몸 비율 — 아기는 머리 大·몸 小, 자랄수록 몸이 길쭉해져요 */
function petGeo(stage) {
  if (stage <= 1) return { headY: 34.4, headR: 26.4, earR: 10.6, earY: 16.2, earX: 27.4,
    bodyY: 73.8, bodyRX: 17.4, bodyRY: 13.2, armX: 29.0, armY: 72.8, footY: 88.6, footRX: 5.9,
    eyeR: 5.5, eyeDX: 9.3, eyeDY: -0.8, browY: 26.8, mouthY: 45.4, k: 0.9 };
  if (stage === 2) return { headY: 38.2, headR: 22.6, earR: 8.4, earY: 21.4, earX: 31.8,
    bodyY: 74.2, bodyRX: 20.0, bodyRY: 16.2, armX: 27.4, armY: 70.4, footY: 91.0, footRX: 6.5,
    eyeR: 3.8, eyeDX: 8.4, eyeDY: -0.7, browY: 31.2, mouthY: 48.0, k: 0.97 };
  return { headY: 36.8, headR: 20.4, earR: 7.4, earY: 22.6, earX: 33.6,
    bodyY: 71.2, bodyRX: 21.4, bodyRY: 18.4, armX: 26.2, armY: 66.0, footY: 92.2, footRX: 6.8,
    eyeR: 3.2, eyeDX: 8.2, eyeDY: -0.4, browY: 29.8, mouthY: 46.6, k: 1 };
}

/* 속성별 몸매 — 통통·날씬·단단 */
function petBodyShape(type, g) {
  var rx = g.bodyRX, ry = g.bodyRY;
  if (type === 'rock' || type === 'steel' || type === 'ground') { rx += 1.3; ry -= 0.5; }
  else if (type === 'fighting') { rx += 0.8; ry += 0.5; }
  else if (type === 'flying' || type === 'fairy' || type === 'electric') { rx -= 1.2; ry += 0.7; }
  else if (type === 'water' || type === 'ice') { ry += 0.6; }
  return { rx: rx, ry: ry };
}

/* 속성별 귀 모양 */
function petEars(type, g, c, d, inner) {
  var x = g.earX, y = g.earY, r = g.earR;
  function pair(one) {
    return one + '<g transform="translate(100,0) scale(-1,1)">' + one + '</g>';
  }
  var s = '';
  if (type === 'ghost') return '';
  if (type === 'bug') {
    s += pair('<circle cx="' + x + '" cy="' + y + 3 + '" r="' + (r * 0.52) + '" fill="' + c + '" stroke="' + d + '" stroke-width="1.8"/>');
    return s;
  }
  if (type === 'ground' || type === 'rock' || type === 'steel') {
    s += pair('<rect x="' + (x - r * 0.62) + '" y="' + (y - r * 0.5) + '" width="' + (r * 1.24) + '" height="' + (r * 0.95) + '" rx="' + (r * 0.26) + '" fill="' + c + '" stroke="' + d + '" stroke-width="2"/>' +
      '<rect x="' + (x - r * 0.26) + '" y="' + (y - r * 0.24) + '" width="' + (r * 0.52) + '" height="' + (r * 0.44) + '" rx="' + (r * 0.12) + '" fill="' + inner + '" opacity=".35"/>');
    return s;
  }
  if (type === 'fire' || type === 'electric' || type === 'ice' || type === 'dragon' || type === 'dark') {
    var pt = '<path d="M' + (x - r * 0.82) + ' ' + (y + r * 0.5) + 'L' + x + ' ' + (y - r * 1.32) + 'L' + (x + r * 0.82) + ' ' + (y + r * 0.5) + 'Z" fill="' + c + '" stroke="' + d + '" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="M' + (x - r * 0.3) + ' ' + (y + r * 0.22) + 'L' + x + ' ' + (y - r * 0.52) + 'L' + (x + r * 0.3) + ' ' + (y + r * 0.22) + 'Z" fill="' + inner + '" opacity=".8"/>';
    if (type === 'electric') pt += '<path d="M' + x + ' ' + (y - r * 1.3) + 'l' + (r * 0.5) + ' ' + (r * 0.9) + '" stroke="' + d + '" stroke-width="1.6" stroke-linecap="round" opacity=".55"/>';
    s += pair(pt);
    return s;
  }
  if (type === 'grass') {
    s += pair('<ellipse cx="' + (x - r * 0.1) + '" cy="' + y + '" rx="' + (r * 0.62) + '" ry="' + (r * 1.1) + '" fill="' + c + '" stroke="' + d + '" stroke-width="2" transform="rotate(-26 ' + (x - r * 0.1) + ' ' + y + ')"/>' +
      '<path d="M' + (x - r * 0.4) + ' ' + (y + r * 0.2) + 'q' + (r * 0.4) + ' ' + (-r * 0.7) + ' ' + (r * 0.8) + ' ' + (-r * 0.2) + '" fill="none" stroke="' + d + '" stroke-width="1" opacity=".45"/>');
    return s;
  }
  if (type === 'water') {
    s += pair('<path d="M' + (x - r * 0.9) + ' ' + (y + r * 0.55) + 'q' + (r * 0.1) + ' ' + (-r * 1.5) + ' ' + (r * 1.7) + ' ' + (-r * 0.5) + 'q' + (-r * 0.5) + ' ' + (r * 0.5) + ' ' + (-r * 1.7) + ' ' + (r * 0.5) + 'Z" fill="' + c + '" stroke="' + d + '" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="M' + (x - r * 0.4) + ' ' + (y + r * 0.1) + 'q' + (r * 0.3) + ' ' + (-r * 0.55) + ' ' + (r * 0.8) + ' ' + (-r * 0.35) + '" fill="none" stroke="#dff3ff" stroke-width="1.4" opacity=".9"/>');
    return s;
  }
  /* normal · fighting · poison · flying · psychic · fairy — 보송보송 동글 귀 */
  s += pair('<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + c + '" stroke="' + d + '" stroke-width="2.2"/>' +
    '<circle cx="' + x + '" cy="' + y + '" r="' + (r * 0.46) + '" fill="' + inner + '" opacity=".9"/>');
  return s;
}

/* 18속성 얼굴 개성 — 눈매·눈썹·입 */
var PET_LOOK = {
  normal:   { eyes: 'round',   brows: 'calm',       mouth: 'omega' },
  fire:     { eyes: 'sharp',   brows: 'angry',      mouth: 'grin' },
  water:    { eyes: 'calm',    brows: 'calm',       mouth: 'small' },
  grass:    { eyes: 'round',   brows: 'calm',       mouth: 'smile' },
  electric: { eyes: 'sharp',   brows: 'angry',      mouth: 'grin' },
  ice:      { eyes: 'narrow',  brows: 'calm',       mouth: 'small' },
  fighting: { eyes: 'sharp',   brows: 'determined', mouth: 'grin' },
  poison:   { eyes: 'sly',     brows: 'calm',       mouth: 'bubble' },
  ground:   { eyes: 'calm',    brows: 'stoic',      mouth: 'straight' },
  flying:   { eyes: 'round',   brows: 'calm',       mouth: 'smile' },
  psychic:  { eyes: 'star',    brows: 'calm',       mouth: 'small' },
  bug:      { eyes: 'bug',     brows: 'calm',       mouth: 'smile' },
  rock:     { eyes: 'narrow',  brows: 'stoic',      mouth: 'straight' },
  ghost:    { eyes: 'sleepy',  brows: 'raised',     mouth: 'wavy' },
  dragon:   { eyes: 'sharp',   brows: 'determined', mouth: 'fang' },
  dark:     { eyes: 'sly',     brows: 'raised',     mouth: 'smirk' },
  steel:    { eyes: 'narrow',  brows: 'stoic',      mouth: 'straight' },
  fairy:    { eyes: 'sparkle', brows: 'calm',       mouth: 'smile' }
};

/* 반짝 별 하나 */
function petStar(cx, cy, r, col, op) {
  var k = r * 0.34;
  return '<path d="M' + cx + ' ' + (cy - r) + 'L' + (cx + k) + ' ' + (cy - k) + 'L' + (cx + r) + ' ' + cy +
    'L' + (cx + k) + ' ' + (cy + k) + 'L' + cx + ' ' + (cy + r) + 'L' + (cx - k) + ' ' + (cy + k) +
    'L' + (cx - r) + ' ' + cy + 'L' + (cx - k) + ' ' + (cy - k) + 'Z" fill="' + col + '" opacity="' + (op || 1) + '"/>';
}

function petNum(n) { return (Math.round(n * 10) / 10); }

/* 눈 두 개 — 속성마다 눈매가 달라요 */
function petEyes(mode, g, d) {
  var ex1 = 50 - g.eyeDX, ex2 = 50 + g.eyeDX, ey = g.headY + g.eyeDY, r = g.eyeR;
  function ball(cx, rr) {
    return '<circle cx="' + petNum(cx) + '" cy="' + petNum(ey) + '" r="' + petNum(rr) + '" fill="#2c2440"/>' +
      '<circle cx="' + petNum(cx + rr * 0.34) + '" cy="' + petNum(ey - rr * 0.36) + '" r="' + petNum(rr * 0.38) + '" fill="#fff"/>';
  }
  var s = '';
  if (mode === 'round') {
    s += ball(ex1, r) + ball(ex2, r);
    if (r >= 4.6) {   /* 아기 눈은 반짝이 한 점 더 */
      s += '<circle cx="' + petNum(ex1 - r * 0.34) + '" cy="' + petNum(ey + r * 0.32) + '" r="' + petNum(r * 0.22) + '" fill="#fff" opacity=".85"/>';
      s += '<circle cx="' + petNum(ex2 - r * 0.34) + '" cy="' + petNum(ey + r * 0.32) + '" r="' + petNum(r * 0.22) + '" fill="#fff" opacity=".85"/>';
    }
  } else if (mode === 'sharp') {
    var rx = r * 1.2, ry = r * 0.9;
    s += '<ellipse cx="' + petNum(ex1) + '" cy="' + petNum(ey) + '" rx="' + petNum(rx) + '" ry="' + petNum(ry) + '" fill="#2c2440"/>';
    s += '<ellipse cx="' + petNum(ex2) + '" cy="' + petNum(ey) + '" rx="' + petNum(rx) + '" ry="' + petNum(ry) + '" fill="#2c2440"/>';
    s += '<circle cx="' + petNum(ex1 + r * 0.36) + '" cy="' + petNum(ey - r * 0.3) + '" r="' + petNum(r * 0.34) + '" fill="#fff"/>';
    s += '<circle cx="' + petNum(ex2 + r * 0.36) + '" cy="' + petNum(ey - r * 0.3) + '" r="' + petNum(r * 0.34) + '" fill="#fff"/>';
    /* 눈꼬리를 올린 진지한 눈 */
    s += '<path d="M' + petNum(ex1 - rx) + ' ' + petNum(ey - ry * 0.9) + 'L' + petNum(ex1 + rx) + ' ' + petNum(ey - ry * 1.25) + '" stroke="' + d + '" stroke-width="1.6" stroke-linecap="round" opacity=".75"/>';
    s += '<path d="M' + petNum(ex2 - rx) + ' ' + petNum(ey - ry * 1.25) + 'L' + petNum(ex2 + rx) + ' ' + petNum(ey - ry * 0.9) + '" stroke="' + d + '" stroke-width="1.6" stroke-linecap="round" opacity=".75"/>';
  } else if (mode === 'calm') {
    s += '<ellipse cx="' + petNum(ex1) + '" cy="' + petNum(ey) + '" rx="' + petNum(r * 1.05) + '" ry="' + petNum(r * 0.92) + '" fill="#2c2440"/>';
    s += '<ellipse cx="' + petNum(ex2) + '" cy="' + petNum(ey) + '" rx="' + petNum(r * 1.05) + '" ry="' + petNum(r * 0.92) + '" fill="#2c2440"/>';
    s += '<circle cx="' + petNum(ex1 + r * 0.3) + '" cy="' + petNum(ey - r * 0.32) + '" r="' + petNum(r * 0.36) + '" fill="#fff"/>';
    s += '<circle cx="' + petNum(ex2 + r * 0.3) + '" cy="' + petNum(ey - r * 0.32) + '" r="' + petNum(r * 0.36) + '" fill="#fff"/>';
    /* 살며시 내려온 눈꺼풀 */
    s += '<path d="M' + petNum(ex1 - r * 1.1) + ' ' + petNum(ey - r * 0.5) + 'q' + petNum(r * 1.1) + ' ' + petNum(-r * 0.35) + ' ' + petNum(r * 2.2) + ' 0" fill="none" stroke="' + d + '" stroke-width="1.3" stroke-linecap="round" opacity=".5"/>';
    s += '<path d="M' + petNum(ex2 - r * 1.1) + ' ' + petNum(ey - r * 0.5) + 'q' + petNum(r * 1.1) + ' ' + petNum(-r * 0.35) + ' ' + petNum(r * 2.2) + ' 0" fill="none" stroke="' + d + '" stroke-width="1.3" stroke-linecap="round" opacity=".5"/>';
  } else if (mode === 'narrow') {
    s += '<ellipse cx="' + petNum(ex1) + '" cy="' + petNum(ey) + '" rx="' + petNum(r * 1.15) + '" ry="' + petNum(r * 0.62) + '" fill="#2c2440"/>';
    s += '<ellipse cx="' + petNum(ex2) + '" cy="' + petNum(ey) + '" rx="' + petNum(r * 1.15) + '" ry="' + petNum(r * 0.62) + '" fill="#2c2440"/>';
    s += '<circle cx="' + petNum(ex1 + r * 0.4) + '" cy="' + petNum(ey - r * 0.14) + '" r="' + petNum(r * 0.26) + '" fill="#fff"/>';
    s += '<circle cx="' + petNum(ex2 + r * 0.4) + '" cy="' + petNum(ey - r * 0.14) + '" r="' + petNum(r * 0.26) + '" fill="#fff"/>';
  } else if (mode === 'sly') {
    s += '<path d="M' + petNum(ex1 - r) + ' ' + petNum(ey) + 'q' + petNum(r) + ' ' + petNum(r * 1.05) + ' ' + petNum(r * 2) + ' ' + petNum(-r * 0.15) + '" fill="none" stroke="#2c2440" stroke-width="' + petNum(r * 0.8) + '" stroke-linecap="round"/>';
    s += '<path d="M' + petNum(ex2 - r) + ' ' + petNum(ey - r * 0.15) + 'q' + petNum(r) + ' ' + petNum(r * 1.2) + ' ' + petNum(r * 2) + ' 0" fill="none" stroke="#2c2440" stroke-width="' + petNum(r * 0.8) + '" stroke-linecap="round"/>';
  } else if (mode === 'sparkle') {
    s += ball(ex1, r * 0.95) + ball(ex2, r * 0.95);
    s += petStar(ex1 + r * 0.1, ey - r * 0.1, r * 0.72, '#fff', 0.95);
    s += petStar(ex2 + r * 0.1, ey - r * 0.1, r * 0.72, '#fff', 0.95);
  } else if (mode === 'star') {
    s += ball(ex1, r * 0.95) + ball(ex2, r * 0.95);
    s += petStar(ex1, ey - r * 0.15, r * 0.6, '#ffe9a8', 0.9);
    s += petStar(ex2, ey - r * 0.15, r * 0.6, '#ffe9a8', 0.9);
  } else if (mode === 'bug') {
    s += '<ellipse cx="' + petNum(ex1) + '" cy="' + petNum(ey) + '" rx="' + petNum(r * 1.3) + '" ry="' + petNum(r * 1.2) + '" fill="#2c2440"/>';
    s += '<ellipse cx="' + petNum(ex2) + '" cy="' + petNum(ey) + '" rx="' + petNum(r * 1.3) + '" ry="' + petNum(r * 1.2) + '" fill="#2c2440"/>';
    s += '<circle cx="' + petNum(ex1 + r * 0.45) + '" cy="' + petNum(ey - r * 0.45) + '" r="' + petNum(r * 0.4) + '" fill="#fff" opacity=".9"/>';
    s += '<circle cx="' + petNum(ex2 + r * 0.45) + '" cy="' + petNum(ey - r * 0.45) + '" r="' + petNum(r * 0.4) + '" fill="#fff" opacity=".9"/>';
    s += '<circle cx="' + petNum(ex1 - r * 0.4) + '" cy="' + petNum(ey + r * 0.35) + '" r="' + petNum(r * 0.2) + '" fill="#fff" opacity=".7"/>';
    s += '<circle cx="' + petNum(ex2 - r * 0.4) + '" cy="' + petNum(ey + r * 0.35) + '" r="' + petNum(r * 0.2) + '" fill="#fff" opacity=".7"/>';
  } else if (mode === 'sleepy') {
    s += '<path d="M' + petNum(ex1 - r) + ' ' + petNum(ey + r * 0.2) + 'q' + petNum(r) + ' ' + petNum(-r * 0.9) + ' ' + petNum(r * 2) + ' 0" fill="none" stroke="#2c2440" stroke-width="' + petNum(r * 0.62) + '" stroke-linecap="round"/>';
    s += '<path d="M' + petNum(ex2 - r) + ' ' + petNum(ey + r * 0.2) + 'q' + petNum(r) + ' ' + petNum(-r * 0.9) + ' ' + petNum(r * 2) + ' 0" fill="none" stroke="#2c2440" stroke-width="' + petNum(r * 0.62) + '" stroke-linecap="round"/>';
  } else {   /* happy — 웃는 눈 */
    s += '<path d="M' + petNum(ex1 - r) + ' ' + petNum(ey + r * 0.35) + 'q' + petNum(r) + ' ' + petNum(-r * 1.1) + ' ' + petNum(r * 2) + ' 0" fill="none" stroke="#2c2440" stroke-width="2.2" stroke-linecap="round"/>';
    s += '<path d="M' + petNum(ex2 - r) + ' ' + petNum(ey + r * 0.35) + 'q' + petNum(r) + ' ' + petNum(-r * 1.1) + ' ' + petNum(r * 2) + ' 0" fill="none" stroke="#2c2440" stroke-width="2.2" stroke-linecap="round"/>';
  }
  return s;
}

/* 눈썹 — 성격이 여기서 보여요 */
function petBrows(mode, g, a, d) {
  var ex1 = 50 - g.eyeDX, ex2 = 50 + g.eyeDX;
  var y = g.browY, w = g.eyeR * 1.5, col = d;
  if (mode === 'angry') {
    return '<path d="M' + petNum(ex1 - w * 0.7) + ' ' + petNum(y - 1.4) + 'l' + petNum(w * 1.4) + ' ' + petNum(w * 0.55) + '" stroke="' + col + '" stroke-width="2.3" stroke-linecap="round"/>' +
      '<path d="M' + petNum(ex2 + w * 0.7) + ' ' + petNum(y - 1.4) + 'l' + petNum(-w * 1.4) + ' ' + petNum(w * 0.55) + '" stroke="' + col + '" stroke-width="2.3" stroke-linecap="round"/>';
  }
  if (mode === 'determined') {
    return '<path d="M' + petNum(ex1 - w * 0.75) + ' ' + petNum(y + 0.6) + 'l' + petNum(w * 1.5) + ' ' + petNum(w * 0.2) + '" stroke="' + col + '" stroke-width="2.4" stroke-linecap="round"/>' +
      '<path d="M' + petNum(ex2 + w * 0.75) + ' ' + petNum(y + 0.6) + 'l' + petNum(-w * 1.5) + ' ' + petNum(w * 0.2) + '" stroke="' + col + '" stroke-width="2.4" stroke-linecap="round"/>';
  }
  if (mode === 'stoic') {
    return '<path d="M' + petNum(ex1 - w * 0.7) + ' ' + petNum(y) + 'h' + petNum(w * 1.4) + '" stroke="' + col + '" stroke-width="2.8" stroke-linecap="round"/>' +
      '<path d="M' + petNum(ex2 - w * 0.7) + ' ' + petNum(y) + 'h' + petNum(w * 1.4) + '" stroke="' + col + '" stroke-width="2.8" stroke-linecap="round"/>';
  }
  if (mode === 'raised') {
    return '<path d="M' + petNum(ex1 - w * 0.6) + ' ' + petNum(y - 2.4) + 'q' + petNum(w * 0.7) + ' ' + petNum(-1.6) + ' ' + petNum(w * 1.3) + ' 0" fill="none" stroke="' + col + '" stroke-width="2.1" stroke-linecap="round"/>' +
      '<path d="M' + petNum(ex2 - w * 0.6) + ' ' + petNum(y + 0.4) + 'q' + petNum(w * 0.7) + ' ' + petNum(-1.4) + ' ' + petNum(w * 1.3) + ' 0" fill="none" stroke="' + col + '" stroke-width="2.1" stroke-linecap="round"/>';
  }
  if (mode === 'calm') {
    return '<path d="M' + petNum(ex1 - w * 0.55) + ' ' + petNum(y) + 'q' + petNum(w * 0.55) + ' ' + petNum(-1.5) + ' ' + petNum(w * 1.1) + ' 0" fill="none" stroke="' + col + '" stroke-width="1.8" stroke-linecap="round" opacity=".72"/>' +
      '<path d="M' + petNum(ex2 - w * 0.55) + ' ' + petNum(y) + 'q' + petNum(w * 0.55) + ' ' + petNum(-1.5) + ' ' + petNum(w * 1.1) + ' 0" fill="none" stroke="' + col + '" stroke-width="1.8" stroke-linecap="round" opacity=".72"/>';
  }
  return '';
}

/* 입 — 속성마다 표정이 달라요 */
function petMouth(mode, g, d, a) {
  var y = g.mouthY, big = g.eyeR >= 4.6 ? 1.15 : 1;
  if (mode === 'grin') {
    return '<path d="M' + petNum(50 - 8 * big) + ' ' + petNum(y - 1) + 'q' + petNum(8 * big) + ' ' + petNum(8 * big) + ' ' + petNum(16 * big) + ' 0" fill="' + a + '" stroke="#7a3b2e" stroke-width="1.4" stroke-linejoin="round"/>' +
      '<path d="M' + petNum(50 - 5 * big) + ' ' + petNum(y + 3.1 * big) + 'q' + petNum(5 * big) + ' ' + petNum(3.2 * big) + ' ' + petNum(10 * big) + ' 0" fill="#ff8fa8" opacity=".8"/>';
  }
  if (mode === 'smile') {
    return '<path d="M' + petNum(50 - 6.6 * big) + ' ' + petNum(y) + 'q' + petNum(6.6 * big) + ' ' + petNum(5.4 * big) + ' ' + petNum(13.2 * big) + ' 0" fill="none" stroke="#7a3b2e" stroke-width="2.3" stroke-linecap="round"/>';
  }
  if (mode === 'straight') {
    return '<path d="M' + petNum(50 - 5.4) + ' ' + petNum(y + 1) + 'h' + petNum(10.8) + '" stroke="#7a3b2e" stroke-width="2.4" stroke-linecap="round"/>';
  }
  if (mode === 'small') {
    return '<path d="M' + petNum(50 - 3.4) + ' ' + petNum(y) + 'q' + petNum(3.4) + ' ' + petNum(3.2) + ' ' + petNum(6.8) + ' 0" fill="none" stroke="#7a3b2e" stroke-width="2.1" stroke-linecap="round"/>';
  }
  if (mode === 'bubble') {
    return '<circle cx="50" cy="' + petNum(y + 1.6) + '" r="' + petNum(3.6 * big) + '" fill="' + a + '" stroke="#7a3b2e" stroke-width="1.3"/>' +
      '<circle cx="47.6" cy="' + petNum(y + 0.4) + '" r="1" fill="#fff" opacity=".85"/>' +
      '<circle cx="' + petNum(50 + 7.6) + '" cy="' + petNum(y - 4.6) + '" r="1.5" fill="' + a + '" opacity=".7"/>';
  }
  if (mode === 'fang') {
    return '<path d="M' + petNum(50 - 7.4) + ' ' + petNum(y - 0.6) + 'q' + petNum(7.4) + ' ' + petNum(6.4) + ' ' + petNum(14.8) + ' 0" fill="none" stroke="#7a3b2e" stroke-width="2.2" stroke-linecap="round"/>' +
      '<path d="M' + petNum(50 - 5.2) + ' ' + petNum(y + 2.4) + 'l1.6 3.4 1.6-3.4Z" fill="#fff" stroke="#7a3b2e" stroke-width=".8"/>' +
      '<path d="M' + petNum(50 + 2) + ' ' + petNum(y + 2.4) + 'l1.6 3.4 1.6-3.4Z" fill="#fff" stroke="#7a3b2e" stroke-width=".8"/>';
  }
  if (mode === 'wavy') {
    return '<path d="M' + petNum(50 - 6.4) + ' ' + petNum(y + 1) + 'q3.2 ' + petNum(-3.2) + ' 6.4 0q3.2 3.2 6.4 0" fill="none" stroke="#7a3b2e" stroke-width="2" stroke-linecap="round"/>';
  }
  if (mode === 'smirk') {
    return '<path d="M' + petNum(50 - 6) + ' ' + petNum(y + 2) + 'q6 ' + petNum(-4.2) + ' 12 ' + petNum(0.6) + '" fill="none" stroke="#7a3b2e" stroke-width="2.3" stroke-linecap="round"/>' +
      '<path d="M' + petNum(50 + 6.2) + ' ' + petNum(y + 1.4) + 'l2.2 1.4" stroke="#7a3b2e" stroke-width="1.6" stroke-linecap="round"/>';
  }
  /* omega — 아이 그림 그대로 두 개의 동그란 곡선 */
  return '<path d="M' + petNum(50 - 7.6) + ' ' + petNum(y - 1.4) + 'q3.8 ' + petNum(5.2 * big) + ' 7.6 0q3.8 ' + petNum(5.2 * big) + ' 7.6 0" fill="none" stroke="#7a3b2e" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>';
}

/* 날개 — 날 수 있는 속성만! 2단계는 작은 날개싹, 3단계는 큰 날개 */
function petWings(type, stage, a, d, l) {
  if (!petCanFly(type) || stage < 2) return '';
  if (stage === 2) {
    return '<g class="pet-wing-bud">' +
      '<ellipse cx="30.6" cy="70.4" rx="6.6" ry="4.3" fill="' + a + '" stroke="' + d + '" stroke-width="1.1" opacity=".92" transform="rotate(-26 30.6 70.4)"/>' +
      '<ellipse cx="69.4" cy="70.4" rx="6.6" ry="4.3" fill="' + a + '" stroke="' + d + '" stroke-width="1.1" opacity=".92" transform="rotate(26 69.4 70.4)"/>' +
      '<ellipse cx="30.6" cy="69.4" rx="2.6" ry="1.5" fill="' + l + '" opacity=".7" transform="rotate(-26 30.6 69.4)"/>' +
      '<ellipse cx="69.4" cy="69.4" rx="2.6" ry="1.5" fill="' + l + '" opacity=".7" transform="rotate(26 69.4 69.4)"/>' +
      '</g>';
  }
  var s = '<g class="pet-wing-full">';
  if (type === 'dragon') {
    var left = '<path d="M41 62C34 42 17 34 5 45c8 1 10 7 5 12 8-2 13 4 8 10 7-3 13 0 16 6Z" fill="' + a + '" stroke="' + d + '" stroke-width="1.2" opacity=".95"/>' +
      '<path d="M36 58C31 48 22 43 14 47" fill="none" stroke="' + d + '" stroke-width="1" opacity=".45"/>';
    s += left + '<g transform="translate(100,0) scale(-1,1)">' + left + '</g>';
  } else if (type === 'fairy') {
    [[30, 54, -38], [28, 70, 16]].forEach(function (w) {
      s += '<ellipse cx="' + w[0] + '" cy="' + w[1] + '" rx="14.5" ry="8.6" fill="' + l + '" stroke="' + d + '" stroke-width="1.1" opacity=".92" transform="rotate(' + w[2] + ' ' + w[0] + ' ' + w[1] + ')"/>';
      s += '<ellipse cx="' + (100 - w[0]) + '" cy="' + w[1] + '" rx="14.5" ry="8.6" fill="' + l + '" stroke="' + d + '" stroke-width="1.1" opacity=".92" transform="rotate(' + (-w[2]) + ' ' + (100 - w[0]) + ' ' + w[1] + ')"/>';
    });
    s += '<path d="M27 56q7 3 9 9M73 56q-7 3-9 9" fill="none" stroke="' + a + '" stroke-width="1.4" opacity=".7"/>';
  } else if (type === 'bug') {
    s += '<ellipse cx="29" cy="60" rx="12.4" ry="17.6" fill="' + l + '" stroke="' + d + '" stroke-width="1.1" opacity=".82" transform="rotate(-18 29 60)"/>';
    s += '<ellipse cx="71" cy="60" rx="12.4" ry="17.6" fill="' + l + '" stroke="' + d + '" stroke-width="1.1" opacity=".82" transform="rotate(18 71 60)"/>';
    s += '<path d="M29 50v20M71 50v20" stroke="' + d + '" stroke-width=".9" opacity=".28"/>';
  } else {   /* flying — 깃털 날개 */
    for (var i = 0; i < 3; i++) {
      var cx1 = 33 - i * 3.6, cy1 = 67 - i * 9.4;
      s += '<ellipse cx="' + cx1 + '" cy="' + cy1 + '" rx="14.6" ry="5.6" fill="' + (i === 1 ? l : a) + '" stroke="' + d + '" stroke-width=".95" opacity=".94" transform="rotate(' + (-22 - i * 9) + ' ' + cx1 + ' ' + cy1 + ')"/>';
      s += '<ellipse cx="' + (100 - cx1) + '" cy="' + cy1 + '" rx="14.6" ry="5.6" fill="' + (i === 1 ? l : a) + '" stroke="' + d + '" stroke-width=".95" opacity=".94" transform="rotate(' + (22 + i * 9) + ' ' + (100 - cx1) + ' ' + cy1 + ')"/>';
    }
  }
  s += '</g>';
  return s;
}

/* 속성별 꼬리 (2단계부터 뚜렷해져요) */
function petTail(type, stage, a, d) {
  if (stage < 2) return '';
  var big = stage >= 3 ? 1 : 0.75;
  if (type === 'fire') {
    return '<path d="M69 78c' + (9 * big) + ' -2 ' + (13 * big) + ' -8 ' + (11 * big) + ' -15 5 5 6 13 0 17-4 3-9 2-11-2Z" fill="' + a + '" stroke="' + d + '" stroke-width="1.3"/>';
  }
  if (type === 'water') {
    return '<path d="M71 79c' + (6 * big) + ' 1 ' + (10 * big) + ' -3 ' + (10 * big) + ' -8 4 5 3 12-2 13-3 .6-6-.6-8-3Z" fill="' + a + '" stroke="' + d + '" stroke-width="1.2"/>';
  }
  if (type === 'grass') {
    return '<path d="M70 80c' + (8 * big) + ' 1 ' + (12 * big) + ' -4 ' + (11 * big) + ' -10 3 6 1 12-4 14-4 1-6-1-7-4Z" fill="' + a + '" stroke="' + d + '" stroke-width="1.2"/>';
  }
  if (type === 'electric') {
    return '<path d="M72 76l-' + (4 * big) + ' ' + (10 * big) + 'h' + (5 * big) + 'l-' + (7 * big) + ' ' + (8 * big) + ' ' + (3 * big) + '-' + (10 * big) + 'h-' + (4 * big) + 'l' + (7 * big) + '-' + (8 * big) + 'Z" fill="' + a + '" stroke="' + d + '" stroke-width="1.1"/>';
  }
  if (type === 'ice') {
    return '<path d="M72 74l' + (4 * big) + ' ' + (7 * big) + '-' + (4 * big) + ' ' + (4 * big) + '-' + (4 * big) + '-' + (4 * big) + 'Z" fill="' + a + '" stroke="' + d + '" stroke-width="1.1"/>';
  }
  if (type === 'poison') {
    return '<circle cx="' + (77) + '" cy="' + (76) + '" r="' + (5 * big) + '" fill="' + a + '" stroke="' + d + '" stroke-width="1.1" opacity=".9"/>' +
      '<circle cx="' + (82) + '" cy="' + (68) + '" r="' + (3 * big) + '" fill="' + a + '" opacity=".75"/>';
  }
  if (type === 'ground' || type === 'rock') {
    return '<path d="M70 82l6-6 5 8-6 3Z" fill="' + a + '" stroke="' + d + '" stroke-width="1.1" opacity=".92"/>';
  }
  if (type === 'dragon') {
    return '<path d="M69 80c' + (8 * big) + ' 2 ' + (13 * big) + ' -3 ' + (12 * big) + ' -10 3 6 1 13-5 14-4 1-6-1-7-4Z" fill="' + a + '" stroke="' + d + '" stroke-width="1.2"/>';
  }
  if (type === 'ghost') {
    return '<path d="M66 80q8 6 16 1" fill="none" stroke="' + a + '" stroke-width="3" stroke-linecap="round" opacity=".55"/>';
  }
  if (type === 'steel') {
    return '<rect x="69" y="74" width="9" height="9" rx="2.4" fill="' + a + '" stroke="' + d + '" stroke-width="1.1" opacity=".9"/>';
  }
  if (type === 'psychic') {
    return '<circle cx="76" cy="76" r="' + (4.5 * big) + '" fill="' + a + '" opacity=".35"/>';
  }
  if (type === 'fairy' || type === 'flying' || type === 'bug') {
    return '<circle cx="76" cy="77" r="' + (4 * big) + '" fill="' + a + '" opacity=".38"/>';
  }
  if (type === 'fighting' || type === 'dark' || type === 'normal') {
    return '<path d="M70 80q6 4 9-2" fill="none" stroke="' + a + '" stroke-width="4" stroke-linecap="round" opacity=".55"/>';
  }
  return '';
}

/* 머리 위 장식 — 속성의 얼굴이에요 */
function petHead(type, stage, g, a, d, l) {
  var s3 = stage >= 3, s2 = stage >= 2;
  var top = g.headY - g.headR + 1.4;         /* 머리 꼭대기 */
  var k = s3 ? 1 : (s2 ? 0.78 : 0.62);
  var s = '';
  if (type === 'fire') {
    s += '<path d="M50 ' + petNum(top - 17 * k) + 'C' + petNum(50 + 7 * k) + ' ' + petNum(top - 7 * k) + ' ' + petNum(50 + 9.4 * k) + ' ' + petNum(top + 2 * k) + ' 50 ' + petNum(top + 6 * k) +
      'C' + petNum(50 - 9.4 * k) + ' ' + petNum(top + 2 * k) + ' ' + petNum(50 - 7 * k) + ' ' + petNum(top - 7 * k) + ' 50 ' + petNum(top - 17 * k) + 'Z" fill="' + a + '" stroke="' + d + '" stroke-width="1.5" stroke-linejoin="round" transform="translate(0 -3)"/>';
    s += '<path d="M50 ' + petNum(top - 8 * k) + 'C' + petNum(50 + 3.6 * k) + ' ' + petNum(top - 2 * k) + ' ' + petNum(50 + 4.6 * k) + ' ' + petNum(top + 2 * k) + ' 50 ' + petNum(top + 4.4 * k) +
      'C' + petNum(50 - 4.6 * k) + ' ' + petNum(top + 2 * k) + ' ' + petNum(50 - 3.6 * k) + ' ' + petNum(top - 2 * k) + ' 50 ' + petNum(top - 8 * k) + 'Z" fill="' + l + '" opacity=".9"/>';
    if (s3) s += petCrown('#ff5a2b');
  } else if (type === 'water') {
    s += '<path d="M50 ' + petNum(top - 15 * k) + 'C' + petNum(50 + 8 * k) + ' ' + petNum(top - 4 * k) + ' ' + petNum(50 + 9 * k) + ' ' + petNum(top + 1 * k) + ' 50 ' + petNum(top + 3.6 * k) +
      'C' + petNum(50 - 9 * k) + ' ' + petNum(top + 1 * k) + ' ' + petNum(50 - 8 * k) + ' ' + petNum(top - 4 * k) + ' 50 ' + petNum(top - 15 * k) + 'Z" fill="' + a + '" stroke="' + d + '" stroke-width="1.3" opacity=".95"/>' +
      '<ellipse cx="' + petNum(50 - 2.2) + '" cy="' + petNum(top - 4.2 * k) + '" rx="' + petNum(1.4 * k) + '" ry="' + petNum(2.2 * k) + '" fill="#fff" opacity=".75"/>';
    if (s3) s += '<path d="M41 ' + petNum(top + 5.4 * k) + 'q9 3.4 18 0" fill="none" stroke="#ffd34d" stroke-width="2" stroke-linecap="round" opacity=".4"/>';
  } else if (type === 'grass') {
    s += '<path d="M50 ' + petNum(top + 2) + 'V' + petNum(top - 7 * k) + '" stroke="' + d + '" stroke-width="2.4" stroke-linecap="round"/>' +
      '<path d="M50 ' + petNum(top - 3 * k) + 'c-' + petNum(6.4 * k) + ' 0-' + petNum(10.6 * k) + '-' + petNum(4 * k) + '-' + petNum(10.6 * k) + '-' + petNum(10 * k) + ' ' + petNum(6.4 * k) + ' 0 ' + petNum(10.6 * k) + ' ' + petNum(4 * k) + ' ' + petNum(10.6 * k) + ' ' + petNum(10 * k) + 'Z" fill="' + a + '" stroke="' + d + '" stroke-width="1.2"/>' +
      '<path d="M50 ' + petNum(top - 2 * k) + 'c' + petNum(6 * k) + ' 0 ' + petNum(10 * k) + '-' + petNum(3.6 * k) + ' ' + petNum(10 * k) + '-' + petNum(9 * k) + '-' + petNum(6 * k) + ' 0-' + petNum(10 * k) + ' ' + petNum(3.6 * k) + '-' + petNum(10 * k) + ' ' + petNum(9 * k) + 'Z" fill="' + a + '" stroke="' + d + '" stroke-width="1.2"/>';
    if (s3) s += '<circle cx="50" cy="' + petNum(top - 9 * k) + '" r="3.8" fill="#ff9ec4" stroke="#e4638f" stroke-width="1"/><circle cx="50" cy="' + petNum(top - 9 * k) + '" r="1.4" fill="#fff3b0"/>';
  } else if (type === 'electric') {
    s += '<path d="M52 ' + petNum(top - 12 * k) + 'L' + petNum(50 + 9 * k) + ' ' + petNum(top + 1) + 'h-' + petNum(6.4 * k) + 'l' + petNum(3.4 * k) + ' ' + petNum(9 * k) + 'L' + petNum(50 - 8 * k) + ' ' + petNum(top - 2) + 'h' + petNum(6 * k) + 'l-' + petNum(3 * k) + '-' + petNum(10 * k) + 'Z" fill="' + a + '" stroke="' + d + '" stroke-width="1.3" stroke-linejoin="round"/>';
    if (s3) s += petCrown('#fff3b0');
  } else if (type === 'ice') {
    s += '<path d="M50 ' + petNum(top - 12 * k) + 'l' + petNum(5.6 * k) + ' ' + petNum(9 * k) + '-' + petNum(5.6 * k) + ' ' + petNum(8 * k) + '-' + petNum(5.6 * k) + '-' + petNum(8 * k) + 'Z" fill="' + a + '" stroke="' + d + '" stroke-width="1.3"/>' +
      '<path d="M39 ' + petNum(top + 2) + 'l-' + petNum(5 * k) + '-' + petNum(9 * k) + ' ' + petNum(5 * k) + ' ' + petNum(2.4 * k) + ' ' + petNum(2.4 * k) + '-' + petNum(5.6 * k) + 'Z" fill="' + a + '" stroke="' + d + '" stroke-width="1.1"/>' +
      '<path d="M61 ' + petNum(top + 2) + 'l' + petNum(5 * k) + '-' + petNum(9 * k) + '-' + petNum(5 * k) + ' ' + petNum(2.4 * k) + '-' + petNum(2.4 * k) + '-' + petNum(5.6 * k) + 'Z" fill="' + a + '" stroke="' + d + '" stroke-width="1.1"/>';
  } else if (type === 'fighting') {
    s += '<path d="M' + petNum(50 - 19 * k) + ' ' + petNum(top + 5) + 'q' + petNum(19 * k) + '-' + petNum(7 * k) + ' ' + petNum(38 * k) + ' 0" fill="none" stroke="' + d + '" stroke-width="5.4" stroke-linecap="round"/>' +
      '<path d="M' + petNum(50 - 19 * k) + ' ' + petNum(top + 5) + 'q' + petNum(19 * k) + '-' + petNum(7 * k) + ' ' + petNum(38 * k) + ' 0" fill="none" stroke="#e8443d" stroke-width="3.2" stroke-linecap="round"/>';
    if (s3) s += '<path d="M' + petNum(50 + 17 * k) + ' ' + petNum(top + 4) + 'l6-6 4 8-4 2Z" fill="#e8443d" stroke="' + d + '" stroke-width=".9"/>';
  } else if (type === 'poison') {
    s += '<path d="M' + petNum(50 - 17 * k) + ' ' + petNum(top + 4) + 'c0-' + petNum(8 * k) + ' ' + petNum(7.6 * k) + '-' + petNum(10 * k) + ' ' + petNum(17 * k) + '-' + petNum(10 * k) + 's' + petNum(17 * k) + ' ' + petNum(2 * k) + ' ' + petNum(17 * k) + ' ' + petNum(10 * k) + 'Z" fill="' + a + '" stroke="' + d + '" stroke-width="1.4" stroke-linejoin="round"/>' +
      '<circle cx="' + petNum(42) + '" cy="' + petNum(top - 3 * k) + '" r="' + petNum(2.8 * k) + '" fill="#fff" opacity=".7"/>' +
      '<circle cx="' + petNum(55) + '" cy="' + petNum(top - 5 * k) + '" r="' + petNum(2.2 * k) + '" fill="#fff" opacity=".6"/>';
    if (s3) s += '<circle cx="' + petNum(64) + '" cy="' + petNum(top - 8 * k) + '" r="' + petNum(2.6 * k) + '" fill="' + a + '" opacity=".55"/>';
  } else if (type === 'ground') {
    s += '<path d="M' + petNum(50 - 15 * k) + ' ' + petNum(top + 3) + 'l' + petNum(5 * k) + '-' + petNum(11 * k) + ' ' + petNum(5 * k) + ' ' + petNum(6.4 * k) + ' ' + petNum(5 * k) + '-' + petNum(8.4 * k) + ' ' + petNum(5 * k) + ' ' + petNum(8.4 * k) + ' ' + petNum(5 * k) + '-' + petNum(6.4 * k) + ' ' + petNum(5 * k) + ' ' + petNum(11 * k) + 'Z" fill="' + a + '" stroke="' + d + '" stroke-width="1.4" stroke-linejoin="round"/>';
  } else if (type === 'flying') {
    s += '<path d="M50 ' + petNum(top) + 'l3.4 ' + petNum(6.6 * k) + ' ' + petNum(6.6 * k) + '-' + petNum(1.6 * k) + 'l-' + petNum(3.2 * k) + ' ' + petNum(6.4 * k) + ' ' + petNum(2.8 * k) + ' ' + petNum(5 * k) + '-' + petNum(9.6 * k) + '-' + petNum(3.6 * k) + '-' + petNum(9.6 * k) + ' ' + petNum(3.6 * k) + ' ' + petNum(2.8 * k) + '-' + petNum(5 * k) + 'l-' + petNum(3.2 * k) + '-' + petNum(6.4 * k) + ' ' + petNum(6.6 * k) + ' ' + petNum(1.6 * k) + 'Z" fill="' + a + '" stroke="' + d + '" stroke-width="1.1" stroke-linejoin="round"/>';
  } else if (type === 'psychic') {
    if (s3 || true) {
      s += '<ellipse cx="50" cy="' + petNum(top - 5 * k) + '" rx="' + petNum(13 * k) + '" ry="' + petNum(4 * k) + '" fill="' + a + '" stroke="#ffd34d" stroke-width="1.5" opacity=".9"/>' +
        '<ellipse cx="50" cy="' + petNum(top - 5 * k) + '" rx="' + petNum(7.4 * k) + '" ry="' + petNum(2 * k) + '" fill="#fff" opacity=".55"/>';
    }
    s += '<circle cx="50" cy="' + petNum(g.headY - 8) + '" r="2.2" fill="' + a + '" opacity=".95"/>';
  } else if (type === 'bug') {
    s += '<path d="M' + petNum(50 - 8) + ' ' + petNum(top + 2) + 'c-' + petNum(3 * k) + '-' + petNum(8 * k) + '-' + petNum(7 * k) + '-' + petNum(11 * k) + '-' + petNum(11 * k) + '-' + petNum(11 * k) + '" fill="none" stroke="' + d + '" stroke-width="1.9" stroke-linecap="round"/>' +
      '<path d="M' + petNum(50 + 8) + ' ' + petNum(top + 2) + 'c' + petNum(3 * k) + '-' + petNum(8 * k) + ' ' + petNum(7 * k) + '-' + petNum(11 * k) + ' ' + petNum(11 * k) + '-' + petNum(11 * k) + '" fill="none" stroke="' + d + '" stroke-width="1.9" stroke-linecap="round"/>' +
      '<circle cx="' + petNum(50 - 19 * k) + '" cy="' + petNum(top - 9 * k) + '" r="' + petNum(2.8 * k) + '" fill="' + a + '" stroke="' + d + '" stroke-width=".8"/>' +
      '<circle cx="' + petNum(50 + 19 * k) + '" cy="' + petNum(top - 9 * k) + '" r="' + petNum(2.8 * k) + '" fill="' + a + '" stroke="' + d + '" stroke-width=".8"/>';
  } else if (type === 'rock') {
    s += '<path d="M' + petNum(50 - 14 * k) + ' ' + petNum(top + 3) + 'l' + petNum(4.4 * k) + '-' + petNum(12 * k) + ' ' + petNum(5.4 * k) + ' ' + petNum(5.4 * k) + ' ' + petNum(5.2 * k) + '-' + petNum(8.4 * k) + ' ' + petNum(5.2 * k) + ' ' + petNum(8.4 * k) + ' ' + petNum(5.4 * k) + '-' + petNum(5.4 * k) + ' ' + petNum(4.4 * k) + ' ' + petNum(12 * k) + 'Z" fill="' + a + '" stroke="' + d + '" stroke-width="1.4" stroke-linejoin="round"/>' +
      '<path d="M' + petNum(50 - 3) + ' ' + petNum(top - 5 * k) + 'l2.6 4.4 2.6-3.4" fill="none" stroke="#fff" stroke-width="1" opacity=".6"/>';
  } else if (type === 'ghost') {
    s += '<path d="M50 ' + petNum(top - 10 * k) + 'c' + petNum(8 * k) + ' 0 ' + petNum(12.4 * k) + ' ' + petNum(5.4 * k) + ' ' + petNum(10.6 * k) + ' ' + petNum(11.6 * k) +
      '-' + petNum(1.8 * k) + '-' + petNum(2.8 * k) + '-' + petNum(4.4 * k) + '-' + petNum(2.8 * k) + '-' + petNum(6.2 * k) + ' 0-' + petNum(1.8 * k) + '-' + petNum(2.8 * k) + '-' + petNum(4.4 * k) + '-' + petNum(2.8 * k) + '-' + petNum(6.2 * k) + ' 0-' + petNum(1.8 * k) + '-' + petNum(2.8 * k) + '-' + petNum(4.4 * k) + '-' + petNum(2.8 * k) + '-' + petNum(6.2 * k) + ' 0-' + petNum(1.8 * k) + '-' + petNum(6.2 * k) + '-' + petNum(11.6 * k) + ' ' + petNum(2.6 * k) + '-' + petNum(11.6 * k) + 'Z" fill="' + a + '" stroke="' + d + '" stroke-width="1.3" opacity=".95"/>';
  } else if (type === 'dragon') {
    s += '<path d="M' + petNum(50 - 13 * k) + ' ' + petNum(top + 3) + 'l' + petNum(3 * k) + '-' + petNum(13 * k) + ' ' + petNum(6 * k) + ' ' + petNum(8 * k) + '-' + petNum(3 * k) + ' ' + petNum(6 * k) + 'Z" fill="' + a + '" stroke="' + d + '" stroke-width="1.2"/>' +
      '<path d="M' + petNum(50 + 13 * k) + ' ' + petNum(top + 3) + 'l-' + petNum(3 * k) + '-' + petNum(13 * k) + '-' + petNum(6 * k) + ' ' + petNum(8 * k) + ' ' + petNum(3 * k) + ' ' + petNum(6 * k) + 'Z" fill="' + a + '" stroke="' + d + '" stroke-width="1.2"/>';
    if (s3) s += petCrown('#4b5ae0');
  } else if (type === 'dark') {
    s += '<path d="M' + petNum(50 - 12 * k) + ' ' + petNum(top + 5) + 'c-' + petNum(4 * k) + '-' + petNum(8 * k) + ' ' + petNum(1 * k) + '-' + petNum(13 * k) + ' ' + petNum(8 * k) + '-' + petNum(15 * k) + '-' + petNum(3 * k) + ' ' + petNum(4 * k) + '-' + petNum(3.4 * k) + ' ' + petNum(8 * k) + '-' + petNum(1 * k) + ' ' + petNum(12 * k) + ' ' + petNum(1.6 * k) + ' ' + petNum(3 * k) + '-' + petNum(3 * k) + ' ' + petNum(6 * k) + '-' + petNum(7 * k) + ' ' + petNum(4 * k) + 'Z" fill="' + a + '" stroke="' + d + '" stroke-width="1.3"/>' +
      '<path d="M' + petNum(50 + 12 * k) + ' ' + petNum(top + 5) + 'c' + petNum(4 * k) + '-' + petNum(8 * k) + '-' + petNum(1 * k) + '-' + petNum(13 * k) + '-' + petNum(8 * k) + '-' + petNum(15 * k) + ' ' + petNum(3 * k) + ' ' + petNum(4 * k) + ' ' + petNum(3.4 * k) + ' ' + petNum(8 * k) + ' ' + petNum(1 * k) + ' ' + petNum(12 * k) + '-' + petNum(1.6 * k) + ' ' + petNum(3 * k) + ' ' + petNum(3 * k) + ' ' + petNum(6 * k) + ' ' + petNum(7 * k) + ' ' + petNum(4 * k) + 'Z" fill="' + a + '" stroke="' + d + '" stroke-width="1.3"/>';
  } else if (type === 'steel') {
    s += '<circle cx="50" cy="' + petNum(top - 4 * k) + '" r="' + petNum(6 * k) + '" fill="' + a + '" stroke="' + d + '" stroke-width="1.4"/>' +
      '<path d="M50 ' + petNum(top - 4 * k - 8 * k) + 'v' + petNum(3 * k) + 'M50 ' + petNum(top - 4 * k + 8 * k) + 'v-' + petNum(3 * k) +
      'M' + petNum(50 - 8 * k) + ' ' + petNum(top - 4 * k) + 'h' + petNum(3 * k) + 'M' + petNum(50 + 5 * k) + ' ' + petNum(top - 4 * k) + 'h' + petNum(3 * k) +
      '" stroke="' + d + '" stroke-width="2.2" stroke-linecap="round"/>' +
      '<circle cx="50" cy="' + petNum(top - 4 * k) + '" r="' + petNum(2.2 * k) + '" fill="' + d + '" opacity=".5"/>';
    if (s3) s += petCrown('#8fa3ad');
  } else if (type === 'fairy') {
    s += '<path d="M50 ' + petNum(top - 12 * k) + 'l' + petNum(3.2 * k) + ' ' + petNum(8 * k) + ' ' + petNum(8.4 * k) + '-' + petNum(1.6 * k) + 'l-' + petNum(5.6 * k) + ' ' + petNum(6.2 * k) + ' ' + petNum(2.4 * k) + ' ' + petNum(5.6 * k) +
      '-' + petNum(8.4 * k) + '-' + petNum(4 * k) + '-' + petNum(8.4 * k) + ' ' + petNum(4 * k) + ' ' + petNum(2.4 * k) + '-' + petNum(5.6 * k) + 'l-' + petNum(5.6 * k) + '-' + petNum(6.2 * k) + ' ' + petNum(8.4 * k) + ' ' + petNum(1.6 * k) + 'Z" fill="' + a + '" stroke="' + d + '" stroke-width="1.1" stroke-linejoin="round"/>' +
      '<circle cx="50" cy="' + petNum(top - 4 * k) + '" r="' + petNum(1.9 * k) + '" fill="#fff3b0"/>';
  } else {   /* normal — 보송 귀 + 리본 */
    s += '<ellipse cx="' + petNum(50 - 15 * k) + '" cy="' + petNum(top + 2) + '" rx="' + petNum(6.4 * k) + '" ry="' + petNum(9 * k) + '" fill="' + l + '" stroke="' + d + '" stroke-width="1.2" transform="rotate(-22 ' + petNum(50 - 15 * k) + ' ' + petNum(top + 2) + ')"/>' +
      '<ellipse cx="' + petNum(50 + 15 * k) + '" cy="' + petNum(top + 2) + '" rx="' + petNum(6.4 * k) + '" ry="' + petNum(9 * k) + '" fill="' + l + '" stroke="' + d + '" stroke-width="1.2" transform="rotate(22 ' + petNum(50 + 15 * k) + ' ' + petNum(top + 2) + ')"/>';
    if (s3) s += petCrown('#9aa0a6');
  }
  return s;
}

/* 최종 진화 왕관 */
function petCrown(inner) {
  return '<path d="M37.5 22.6l3.6-12 8.9 7.3 8.9-7.3 3.6 12Z" fill="#ffd34d" stroke="#e0a800" stroke-width="1.5" stroke-linejoin="round"/>' +
    '<circle cx="50" cy="8.4" r="2.3" fill="' + (inner || '#ff6b8a') + '" stroke="#e0a800" stroke-width=".8"/>' +
    '<circle cx="42.6" cy="11.8" r="1.5" fill="#fff8d8"/><circle cx="57.4" cy="11.8" r="1.5" fill="#fff8d8"/>';
}

/* 배 위 속성 무늬 */
function petBellyMark(type, stage, a, d) {
  var s = '';
  if (type === 'fire') {
    s = '<path d="M50 71c0-3 3-5 3-8 3 4 4 7 1 10-1.6 1.6-4 1-4-2Z" fill="' + a + '" opacity=".55"/>';
  } else if (type === 'water') {
    s = '<path d="M50 68c2 3 3.4 4.6 3.4 6.4 0 1.8-1.6 3-3.4 3s-3.4-1.2-3.4-3c0-1.8 1.4-3.4 3.4-6.4Z" fill="' + a + '" opacity=".5"/>';
  } else if (type === 'grass') {
    s = '<path d="M53 71c0-3-2.4-4.6-5-4.6 3.6-.6 6.2 1 6.4 3.8.2 2.2-1.4 3.8-3.6 4 1.6-1 2.2-1.8 2.2-3.2Z" fill="' + a + '" opacity=".45"/>';
  } else if (type === 'electric') {
    s = '<path d="M52 68l-5 7h4.2l-2.6 5.8 7.4-9h-4.4l2.6-3.8Z" fill="' + a + '" opacity=".55"/>';
  } else if (type === 'ice') {
    s = '<path d="M50 67v11M45 69.6l10 5.4M55 69.6l-10 5.4" stroke="' + a + '" stroke-width="1.7" stroke-linecap="round" opacity=".55"/>';
  } else if (type === 'poison') {
    s = '<circle cx="45" cy="71" r="2.4" fill="' + a + '" opacity=".45"/><circle cx="55" cy="75" r="1.9" fill="' + a + '" opacity=".4"/><circle cx="53" cy="68" r="1.3" fill="' + a + '" opacity=".35"/>';
  } else if (type === 'ground' || type === 'rock') {
    s = '<path d="M43 73l3.6-3.6 3.4 3.6M51 77l3.4-3.4 3.4 3.4" fill="none" stroke="' + d + '" stroke-width="1.5" stroke-linecap="round" opacity=".28"/>';
  } else if (type === 'flying') {
    s = '<path d="M45 73q5-3.6 10 0" fill="none" stroke="' + a + '" stroke-width="2" stroke-linecap="round" opacity=".5"/>';
  } else if (type === 'psychic') {
    s = '<circle cx="50" cy="73" r="3.2" fill="#fff" opacity=".5"/><circle cx="50" cy="73" r="1.7" fill="' + a + '"/>';
  } else if (type === 'bug') {
    s = '<path d="M42 70h16M42 75.4h16" stroke="' + d + '" stroke-width="1.7" stroke-linecap="round" opacity=".22"/>';
  } else if (type === 'ghost') {
    s = '<path d="M50 68v9" stroke="' + a + '" stroke-width="2" stroke-linecap="round" opacity=".35"/>';
  } else if (type === 'dragon') {
    s = '<path d="M43 71l3 3 3-3 3 3 3-3" fill="none" stroke="' + a + '" stroke-width="1.7" stroke-linecap="round" opacity=".45"/>';
  } else if (type === 'dark') {
    s = '<path d="M44 72l5 4 5-4" fill="none" stroke="' + a + '" stroke-width="1.7" stroke-linecap="round" opacity=".45"/>';
  } else if (type === 'steel') {
    s = '<circle cx="45" cy="70" r="1.2" fill="' + d + '" opacity=".3"/><circle cx="55" cy="70" r="1.2" fill="' + d + '" opacity=".3"/><circle cx="44" cy="77" r="1.2" fill="' + d + '" opacity=".3"/><circle cx="56" cy="77" r="1.2" fill="' + d + '" opacity=".3"/>';
  } else if (type === 'fairy') {
    s = '<path d="M47 71l1.6 3.2 3.4-2.6-3.4-1.6Z" fill="' + a + '" opacity=".5"/>';
  } else {
    s = '<circle cx="50" cy="73" r="4.4" fill="' + a + '" opacity=".22"/>';
  }
  if (stage >= 3) {
    s += '<circle cx="50" cy="73" r="9.4" fill="none" stroke="' + a + '" stroke-width="1.1" opacity=".3"/>';
  }
  return s;
}

/* 3단계 속성 기운(오라) — 각 속성마다 다른 반짝임 */
function petAura(type, a, l) {
  var s = '';
  if (type === 'fire') {
    s += '<path d="M20 34c3 4 1 6-1 9-2-3-3-6 1-9Z" fill="' + a + '" opacity=".6"/>' +
      '<path d="M80 30c3 4 1 6-1 9-2-3-3-6 1-9Z" fill="' + a + '" opacity=".45"/>' +
      '<path d="M76 20c2 3 0.6 4.4-0.8 6.6-1.4-2.2-2.2-4.4 0.8-6.6Z" fill="' + l + '" opacity=".6"/>';
  } else if (type === 'water') {
    s += '<circle cx="19" cy="40" r="2.6" fill="' + a + '" opacity=".45"/><circle cx="82" cy="34" r="3.4" fill="' + a + '" opacity=".4"/>' +
      '<circle cx="77" cy="56" r="2" fill="' + a + '" opacity=".35"/><circle cx="23" cy="62" r="1.7" fill="' + a + '" opacity=".35"/>';
  } else if (type === 'grass') {
    s += '<ellipse cx="19" cy="42" rx="3.4" ry="2" fill="' + a + '" opacity=".5" transform="rotate(-30 19 42)"/>' +
      '<ellipse cx="81" cy="38" rx="3" ry="1.8" fill="' + a + '" opacity=".45" transform="rotate(28 81 38)"/>' +
      '<circle cx="76" cy="62" r="1.8" fill="#ff9ec4" opacity=".7"/>';
  } else if (type === 'electric') {
    s += '<path d="M18 36l4 6h-3l2 5-5-6h3l-1-5Z" fill="' + a + '" opacity=".7"/>' +
      '<path d="M82 30l4 6h-3l2 5-5-6h3l-1-5Z" fill="' + a + '" opacity=".55"/>';
  } else if (type === 'ice') {
    s += petStar(18, 40, 3.4, '#dff3ff', .9) + petStar(82, 34, 2.6, '#dff3ff', .85) +
      petStar(78, 58, 2.2, '#fff', .8);
  } else if (type === 'fighting') {
    s += '<path d="M16 46l4-2 1 4.4-4.4.6Z" fill="' + a + '" opacity=".6"/>' +
      '<path d="M84 40l4 2-1 4.4-4.4-.6Z" fill="' + a + '" opacity=".55"/>';
  } else if (type === 'poison') {
    s += '<circle cx="18" cy="44" r="4" fill="none" stroke="' + a + '" stroke-width="1.6" opacity=".55"/>' +
      '<circle cx="82" cy="36" r="2.6" fill="' + a + '" opacity=".45"/><circle cx="78" cy="56" r="1.8" fill="' + a + '" opacity=".4"/>';
  } else if (type === 'ground') {
    s += '<circle cx="19" cy="52" r="1.6" fill="' + a + '" opacity=".5"/><circle cx="26" cy="40" r="1.2" fill="' + a + '" opacity=".45"/>' +
      '<circle cx="80" cy="48" r="1.6" fill="' + a + '" opacity=".5"/>';
  } else if (type === 'flying') {
    s += '<path d="M14 52q8-7 16 0" fill="none" stroke="' + a + '" stroke-width="2.2" stroke-linecap="round" opacity=".5"/>' +
      '<path d="M70 30q8-7 16 0" fill="none" stroke="' + a + '" stroke-width="2.2" stroke-linecap="round" opacity=".45"/>';
  } else if (type === 'psychic') {
    s += petStar(50, 14, 5.4, '#fff3b0', .9) + petStar(17, 44, 3.2, '#ffe9f4', .8) + petStar(84, 50, 2.6, '#ffe9f4', .75);
  } else if (type === 'bug') {
    s += '<circle cx="18" cy="46" r="1.8" fill="' + a + '" opacity=".55"/><circle cx="83" cy="40" r="1.6" fill="' + a + '" opacity=".5"/>' +
      '<circle cx="77" cy="58" r="1.3" fill="#fff3b0" opacity=".7"/>';
  } else if (type === 'rock') {
    s += '<path d="M17 50l4-3 2 4-4 2Z" fill="' + a + '" opacity=".5"/><path d="M80 40l4 2-2 4-4-2Z" fill="' + a + '" opacity=".45"/>';
  } else if (type === 'ghost') {
    s += '<circle cx="19" cy="48" r="3.6" fill="' + a + '" opacity=".3"/><circle cx="81" cy="42" r="2.8" fill="' + a + '" opacity=".28"/>' +
      '<circle cx="76" cy="60" r="2" fill="#fff" opacity=".5"/>';
  } else if (type === 'dragon') {
    s += '<path d="M16 44l4 2-2 4-4-2Z" fill="' + a + '" opacity=".55"/><path d="M84 38l-4 2 2 4 4-2Z" fill="' + a + '" opacity=".5"/>' +
      petStar(78, 22, 2.6, '#fff3b0', .8);
  } else if (type === 'dark') {
    s += '<circle cx="18" cy="44" r="3.4" fill="' + a + '" opacity=".4"/><circle cx="82" cy="36" r="2.6" fill="' + a + '" opacity=".4"/>' +
      '<path d="M74 60l2.4 4 4 1-3 3" stroke="' + a + '" stroke-width="1.6" fill="none" opacity=".5"/>';
  } else if (type === 'steel') {
    s += '<path d="M18 48l4-2 1 4-4 2Z" fill="' + l + '" stroke="' + a + '" stroke-width="1.2" opacity=".8"/>' +
      '<path d="M81 36l4 2-1 4-4-2Z" fill="' + l + '" stroke="' + a + '" stroke-width="1.2" opacity=".7"/>';
  } else if (type === 'fairy') {
    s += petStar(18, 42, 3.6, '#fff3b0', .9) + petStar(83, 36, 2.8, '#ffe9f4', .85) + petStar(77, 58, 2.2, '#fff', .8);
  } else {
    s += petStar(18, 42, 3, '#fff3b0', .8) + petStar(83, 38, 2.4, '#fff', .75);
  }
  return s;
}

function monSvg(sp, stage) {
  stage = Math.max(1, Math.min(3, stage || 1));
  /* 포켓몬 친구는 비공개 그림 팩의 PNG를 그대로 넣어요 (마이룸 방 안에서도 같은 둥실거림) */
  var pim = pokeImg(sp && sp.id, stage);
  if (pim) {
    return '<svg viewBox="0 0 100 100" class="mon-svg poke-svg" data-type="' + esc(String((sp && sp.type) || 'normal')) +
      '" data-stage="' + stage + '" data-species="' + esc(String((sp && sp.id) || '')) + '" aria-hidden="true">' +
      '<image href="' + esc(pim) + '" x="4" y="4" width="92" height="92" preserveAspectRatio="xMidYMid meet"/></svg>';
  }
  var g = petGeo(stage);
  var c = sp.c, d = sp.d, a = sp.accent, l = sp.l;
  var type = String(sp.type || 'normal');
  var look = PET_LOOK[type] || PET_LOOK.normal;
  var v = (Number(sp.no) || 0) % 3;          /* 같은 속성 3종은 무늬로 조금씩 달라요 */
  var s3 = stage >= 3, s2 = stage >= 2;
  var wingAttr = petCanFly(type) ? (s3 ? 'full' : (s2 ? 'bud' : 'none')) : 'none';

  var s = '<svg viewBox="0 0 100 100" class="mon-svg" data-type="' + esc(type) + '" data-stage="' + stage +
    '" data-wings="' + wingAttr + '" data-species="' + esc(sp.id) + '" aria-hidden="true">';

  /* 바닥 그림자 */
  s += '<ellipse cx="50" cy="94.6" rx="' + petNum(g.bodyRX + 6) + '" ry="3.8" fill="#000" opacity=".09"/>';

  /* 3단계 속성 기운 */
  if (s3) {
    s += '<circle class="pet-aura-ring" cx="50" cy="60" r="42" fill="' + a + '" opacity=".13"/>';
    s += '<g class="pet-aura">' + petAura(type, a, l) + '</g>';
  }

  s += '<g transform="translate(50 94.6) scale(' + g.k + ') translate(-50 -94.6)">';

  /* 뒤쪽: 날개 · 꼬리 · 고스트 기운 */
  s += petWings(type, stage, a, d, l);
  if (type === 'ghost') {
    s += '<circle cx="24" cy="62" r="' + (s3 ? 5 : 3.4) + '" fill="' + a + '" opacity=".28"/>' +
      '<circle cx="78" cy="70" r="' + (s3 ? 3.6 : 2.6) + '" fill="' + a + '" opacity=".24"/>';
  }
  if (type === 'rock' || type === 'steel') {   /* 단단한 등 딱지 */
    s += '<path d="M30 66q20-13 40 0l-4 13q-16 8-32 0Z" fill="' + l + '" stroke="' + d + '" stroke-width="1.4" opacity=".55"/>';
  }
  s += petTail(type, stage, a, d);

  /* 발 (고스트는 둥실 떠 있어요) */
  if (type !== 'ghost') {
    s += '<ellipse cx="' + petNum(50 - 8.4) + '" cy="' + petNum(g.footY) + '" rx="' + petNum(g.footRX) + '" ry="' + petNum(g.footRX * 0.7) + '" fill="' + d + '"/>';
    s += '<ellipse cx="' + petNum(50 + 8.4) + '" cy="' + petNum(g.footY) + '" rx="' + petNum(g.footRX) + '" ry="' + petNum(g.footRX * 0.7) + '" fill="' + d + '"/>';
  }

  /* 짧은 팔 */
  s += '<ellipse cx="' + petNum(g.armX) + '" cy="' + petNum(g.armY) + '" rx="6.8" ry="4.4" fill="' + c + '" stroke="' + d + '" stroke-width="2" transform="rotate(-14 ' + petNum(g.armX) + ' ' + petNum(g.armY) + ')"/>';
  s += '<ellipse cx="' + petNum(100 - g.armX) + '" cy="' + petNum(g.armY) + '" rx="6.8" ry="4.4" fill="' + c + '" stroke="' + d + '" stroke-width="2" transform="rotate(14 ' + petNum(100 - g.armX) + ' ' + petNum(g.armY) + ')"/>';

  /* 통통한 몸통 (속성에 따라 통통·날씬·단단) */
  var bs = petBodyShape(type, g);
  s += '<ellipse cx="50" cy="' + petNum(g.bodyY) + '" rx="' + petNum(bs.rx) + '" ry="' + petNum(bs.ry) + '" fill="' + c + '" stroke="' + d + '" stroke-width="2.6"/>';
  if (type === 'ghost') {
    s += '<path class="pet-wisp" d="M' + petNum(50 - bs.rx) + ' ' + petNum(g.bodyY + bs.ry * 0.4) + 'q' + petNum(bs.rx * 0.5) + ' ' + petNum(bs.ry * 0.85) + ' ' + petNum(bs.rx) + ' 0q' + petNum(bs.rx * 0.5) + ' ' + petNum(bs.ry * 0.85) + ' ' + petNum(bs.rx) + ' 0" fill="' + c + '" stroke="' + d + '" stroke-width="2" opacity=".9"/>';
  }
  /* 동그란 배 */
  var brx = v === 2 ? bs.rx * 0.6 : (v === 1 ? bs.rx * 0.68 : bs.rx * 0.64);
  var bry = v === 1 ? bs.ry * 0.78 : bs.ry * 0.7;
  s += '<ellipse cx="50" cy="' + petNum(g.bodyY + 3.4) + '" rx="' + petNum(brx) + '" ry="' + petNum(bry) + '" fill="' + l + '" stroke="' + d + '" stroke-width="1.2" opacity=".95"/>';
  s += petBellyMark(type, stage, a, d);
  if (v === 1) {
    s += '<circle cx="50" cy="' + petNum(g.bodyY + 1) + '" r="1.7" fill="' + d + '" opacity=".18"/>' +
      '<circle cx="45" cy="' + petNum(g.bodyY + 6) + '" r="1.2" fill="' + d + '" opacity=".15"/>' +
      '<circle cx="55" cy="' + petNum(g.bodyY + 6) + '" r="1.2" fill="' + d + '" opacity=".15"/>';
  }

  /* 귀 (속성마다 동글·뾰족·잎사귀·지느러미·돌귀) */
  var earInner = (type === 'ice') ? '#dff3ff' : (type === 'steel' || type === 'rock' || type === 'ground') ? d : '#ffc9d6';
  s += petEars(type, g, c, d, earInner);

  /* 동그란 머리 */
  s += '<circle cx="50" cy="' + petNum(g.headY) + '" r="' + petNum(g.headR) + '" fill="' + c + '" stroke="' + d + '" stroke-width="2.6"/>';

  /* 눈썹 → 눈 → 볼 → 입 */
  s += petBrows(look.brows, g, a, d);
  s += petEyes(look.eyes, g, d);
  /* 볼터치 (전기·불은 스파크, 강철·바위는 생략) */
  if (type === 'electric') {
    var cyb = g.headY + 11.4;
    s += '<path d="M31 ' + petNum(cyb) + 'l3 2-3 2" fill="none" stroke="' + a + '" stroke-width="1.9" stroke-linecap="round"/>' +
      '<path d="M69 ' + petNum(cyb) + 'l-3 2 3 2" fill="none" stroke="' + a + '" stroke-width="1.9" stroke-linecap="round"/>';
  } else if (type !== 'steel' && type !== 'rock') {
    var by = g.headY + 11.6;
    s += '<ellipse cx="' + petNum(50 - g.headR * 0.64) + '" cy="' + petNum(by) + '" rx="4.2" ry="2.6" fill="' + (type === 'ghost' ? a : '#ff9db4') + '" opacity="' + (s3 ? '.34' : '.42') + '"/>';
    s += '<ellipse cx="' + petNum(50 + g.headR * 0.64) + '" cy="' + petNum(by) + '" rx="4.2" ry="2.6" fill="' + (type === 'ghost' ? a : '#ff9db4') + '" opacity="' + (s3 ? '.34' : '.42') + '"/>';
  }
  s += petMouth(look.mouth, g, d, a);

  /* 앞쪽: 스카프 · 장갑 · 보석 같은 소품 */
  if (s2 && (type === 'normal' || type === 'fire' || type === 'water' || type === 'grass' || type === 'electric' ||
      type === 'ice' || type === 'flying' || type === 'psychic' || type === 'dragon' || type === 'dark' || type === 'fairy')) {
    s += '<path d="M' + petNum(50 - 14) + ' ' + petNum(g.headY + g.headR * 0.86) + 'q14 6.4 28 0" fill="none" stroke="' + d + '" stroke-width="6.4" stroke-linecap="round" opacity=".95"/>' +
      '<path d="M' + petNum(50 - 14) + ' ' + petNum(g.headY + g.headR * 0.86) + 'q14 6.4 28 0" fill="none" stroke="' + a + '" stroke-width="3.4" stroke-linecap="round"/>';
  }
  if (type === 'fighting' && s2) {
    s += '<circle cx="' + petNum(g.armX) + '" cy="' + petNum(g.armY) + '" r="6" fill="#e8443d" stroke="' + d + '" stroke-width="1.4"/>' +
      '<circle cx="' + petNum(100 - g.armX) + '" cy="' + petNum(g.armY) + '" r="6" fill="#e8443d" stroke="' + d + '" stroke-width="1.4"/>';
    if (s3) s += '<path d="M44 66h12" stroke="#ffd34d" stroke-width="4" stroke-linecap="round"/>';
  }
  if (type === 'steel' && s2) {
    s += '<rect x="41" y="' + petNum(g.bodyY - 5) + '" width="18" height="8" rx="2.6" fill="' + l + '" stroke="' + d + '" stroke-width="1.3" opacity=".95"/>' +
      '<circle cx="45" cy="' + petNum(g.bodyY - 1) + '" r=".9" fill="' + d + '" opacity=".5"/><circle cx="55" cy="' + petNum(g.bodyY - 1) + '" r=".9" fill="' + d + '" opacity=".5"/>';
  }
  if (type === 'poison' && s3) {
    s += '<circle cx="50" cy="' + petNum(g.bodyY + 9) + '" r="2.6" fill="' + a + '" opacity=".5"/>';
  }

  /* 머리 장식은 맨 위에 */
  s += petHead(type, stage, g, a, d, l);

  /* 3단계 별 반짝임 */
  if (s3) {
    s += petStar(26, 30, 3, '#fff3b0', .9) + petStar(74, 50, 2.2, '#fff', .8);
  } else if (stage === 2) {
    s += petStar(75, 34, 2, '#fff8d8', .7);
  }

  s += '</g></svg>';
  return s;
}

/* ---------------- 오늘의 친구 카드 ---------------- */
function renderPet() {
  var p = petState();
  var sp = speciesById(p.currentEgg);
  var stage = p.stage;
  var need = petNeed(stage);
  var pct = need ? Math.min(100, Math.round(p.exp / need * 100)) : 100;
  var art = petArt(sp, stage, p.exp / Math.max(1, need));

  var runner = document.getElementById('overallRocket');
  if (runner) runner.innerHTML = petArt(sp, stage, p.exp / Math.max(1, need));

  var bar = document.getElementById('petBar');
  if (!bar) return;

  var title = stage === 0 ? '수수께끼 알' : sp.names[stage - 1];
  var sub;
  if (stage === 0) {
    sub = '⏳ 부화까지 <b id="petTimer">' + fmtLeft(petHatchLeft()) + '</b> · 먹이로도 부화해요';
  } else if (stage === 1 || stage === 2) {
    sub = sp.kind + ' · 다음 진화까지 <b>' + Math.max(0, need - p.exp) + ' EXP</b> · 먹이를 주세요';
  } else {
    sub = '🎉 2차 진화 완성! 도감 ' + p.collection.length + '/' + SPECIES_MAX + ' · 새 알을 받아 보세요';
  }

  var nextMini = '';
  if (stage < 3) {
    /* 알일 때는 다음 모습도 수수께끼로 */
    nextMini = '<span class="pet-next">다음' + (stage === 0 ? '<b class="pn-q">?</b>' : petArt(sp, stage + 1, 0)) + '</span>';
  }

  var acts = stage >= 3
    ? '<button class="pet-go warm" data-act="pet-new-egg" aria-label="새 알 받기">🥚 새 알</button>'
    : '<button class="pet-go warm" data-act="care-open" aria-label="먹이 주기">🍖 먹이</button>';

  bar.style.setProperty('--pet-c', sp.c);
  bar.style.setProperty('--pet-t', sp.l);
  bar.innerHTML =
    '<div class="pet-visual" id="petVisual">' + art + '</div>' +
    '<div class="pet-meta">' +
      '<div class="pet-name">' + esc(stage === 0 ? title : title) + '<span class="pet-stage">' + PET_STAGE_LABEL[stage] + '</span>' +
        (stage === 0 ? '<span class="egg-badge">부화 중</span>' : typeBadgeHtml(sp) + rarityBadgeHtml(sp)) + '</div>' +
      '</div>' +
    '<div class="pet-sub">' + sub + '</div>' +
    '<div class="pet-grow">' +
      '<div class="pet-gauge"><i style="width:' + pct + '%"></i></div>' +
      '<div class="pet-growline"><span>EXP <b>' + p.exp + '</b> / ' + (need || 'MAX') + '</span>' + (nextMini || '<span>✨ MAX</span>') + '</div>' +
    '</div>' +
    '<div class="pet-acts">' + acts +
      '<button class="pet-go" data-act="pet-open" aria-haspopup="dialog">🐾 <b>' + p.collection.length + '</b>/' + SPECIES_MAX + '</button>' +
    '</div>';

  var modal = document.getElementById('petModal');
  if (modal && !modal.hidden) renderPetDex();
  renderPetHomeExtra();
}

function rarityBadgeHtml(sp) {
  return '<span class="rarity-badge" style="--rc:' + sp.rarityColor + '">' + sp.rarityLabel + '</span>';
}

/* ---------------- 도감 (54종) ---------------- */
function petDexHtml() {
  var p = petState();
  var stage = p.stage;
  var spNow = speciesById(p.currentEgg);
  var have = {};
  for (var i = 0; i < p.collection.length; i++) have[p.collection[i].id] = p.collection[i];

  var need = petNeed(stage);
  var pct = need ? Math.min(100, Math.round(p.exp / need * 100)) : 100;
  var nowArt = petArt(spNow, stage, p.exp / Math.max(1, need));
  var nowSub;
  if (stage === 0) nowSub = 'EXP ' + p.exp + ' / 100 · 부화까지 ' + fmtLeft(petHatchLeft());
  else if (stage < 3) nowSub = 'EXP ' + p.exp + ' / 100 · ' + Math.max(0, need - p.exp) + ' EXP 더 모으면 ' + PET_STAGE_LABEL[stage + 1] + '!';
  else nowSub = '2차 진화 완성! 새 알을 받으면 다시 키울 수 있어요.';

  var h = '<div class="pet-nowbox">' +
    '<div class="nw-head"><span class="nw-art">' + nowArt + '</span><span>' +
      (stage === 0 ? '지금 키우는 알' : '지금 키우는 ' + esc(spNow.names[stage - 1])) + '</span>' +
      '<span class="nw-count">' + p.collection.length + ' / ' + SPECIES_MAX + '</span></div>' +
    '<div class="nw-sub">' + nowSub + '</div>' +
    '<div class="pet-gauge"><i style="width:' + pct + '%"></i></div>' +
    '</div>';

  if (canPetArt()) {
    h += '<div class="dex-art" id="dexArt">' +
      '<h3>🖼️ 친구 그림 바꾸기<span class="art-tag">부모님·관리자</span></h3>' +
      petArtEditorHtml() +
      '<p class="lf-note">기본은 직접 그린 몬스터 그림이에요. 아이 사진이나 원하는 그림으로 바꾸면 카드·도감·진화 팝업에 바로 보여요.</p>' +
      '</div>';
  }

  h += '<h3 class="pet-sec-title">🐾 몬스터 도감 <b>' + p.collection.length + '</b> / ' + SPECIES_MAX + '</h3>';
  h += '<div class="dex-sum">';
  for (var r = 0; r < RARITY.length; r++) {
    var cnt = 0;
    for (var q = 0; q < PET_SPECIES.length; q++) if (PET_SPECIES[q].rarity === r && have[PET_SPECIES[q].id]) cnt++;
    h += '<span class="rarity-badge" style="--rc:' + RARITY[r].color + '">' + RARITY[r].label + ' ' + cnt + '</span>';
  }
  h += '</div>';
  h += '<div class="type-filter">' +
    '<button type="button" class="tchip' + (petFilter === '' ? ' on' : '') + '" data-act="pet-filter" data-t="">전체</button>';
  for (var ti = 0; ti < PET_TYPES.length; ti++) {
    var tt = PET_TYPES[ti];
    h += '<button type="button" class="tchip' + (petFilter === tt.id ? ' on' : '') + '" data-act="pet-filter" data-t="' + esc(tt.id) + '">' +
      '<i style="background:' + tt.color + '"></i>' + esc(tt.label) + '</button>';
  }
  h += '</div>';
  h += '<div class="pet-dex">';
  var shown = 0;
  for (var k = 0; k < PET_SPECIES.length; k++) {
    var sp = PET_SPECIES[k];
    if (petFilter && sp.type !== petFilter) continue;
    shown++;
    var got = have[sp.id];
    var isNow = p.currentEgg === sp.id;
    var unhatched = isNow && stage === 0;   /* 아직 부화 전 — 종족을 보여 주지 않아요 */
    var chain = '';
    if (got) {
      chain = '<div class="pc-chain">';
      for (var csi = 1; csi <= 3; csi++) chain += '<span class="pcs">' + petArt(sp, csi, 0) + '</span>';
      chain += '</div>';
    } else if (isNow && !unhatched) {
      chain = '<div class="pc-chain"><span class="pcs">' + petArt(sp, Math.max(1, stage), 0) + '</span></div>';
    }
    var face = unhatched
      ? petArt(sp, 0, p.exp / Math.max(1, need))
      : (got || isNow ? petArt(sp, got ? 3 : Math.max(1, stage)) : '❓');
    var nameTxt = unhatched ? '???' : (got || isNow ? esc(sp.names[0]) : '???');
    var badges = unhatched
      ? '<span class="egg-badge">🥚 부화 중</span>'
      : typeBadgeHtml(sp) + rarityBadgeHtml(sp);
    var whenTxt = unhatched ? '아직 알이 부화하지 않았어요'
      : (got ? fmtShort(got.at) + ' 완성' : (isNow ? '키우는 중' : '아직 못 만났어요'));
    h += '<div class="pet-card' + (got ? '' : ' locked') + (isNow ? ' now' : '') + (unhatched ? ' egg-now' : '') + '" style="--tc:' + petTypeInfo(sp.type).color + '">' +
      '<div class="pc-no">#' + pad2(sp.no) + '</div>' +
      '<div class="pc-face">' + face + '</div>' +
      '<div class="pc-name">' + nameTxt + '</div>' +
      '<div class="pc-type">' + badges + '</div>' +
      chain +
      '<div class="pc-when">' + whenTxt + '</div>' +
      '</div>';
  }
  if (!shown) h += '<p class="spend-empty">이 속성 친구는 아직 없어요.</p>';
  h += '</div>';

  h += '<p class="lf-note" style="margin-top:10px">루틴 체크로 코인을 모아 먹이를 주면 EXP가 올라요. 알 → 아기 → 1차 진화 → 2차 진화, 단계마다 100 EXP! 다 자란 친구는 도감에 저장되고 마이룸에서 뛰어놀 수 있어요.</p>';
  return h;
}

function showEvo(stage) {
  var p = petState();
  var sp = speciesById(p.currentEgg);
  var m = document.getElementById('evoModal');
  if (!m) return;
  var badge = document.getElementById('evoBadge');
  var title = document.getElementById('evoTitle');
  var art = document.getElementById('evoArt');
  var nameEl = document.getElementById('evoName');
  var line = document.getElementById('evoLine');
  var next = document.getElementById('evoNext');
  var actions = document.getElementById('evoActions');

  if (stage === 1) {
    badge.textContent = '🎉';
    title.textContent = '알이 부화했어요!';
    nameEl.textContent = sp.names[0] + ' 등장!';
    line.textContent = '이제 먹이를 줘서 1차 진화에 도전해요!';
  } else if (stage === 2) {
    badge.textContent = '✨';
    title.textContent = '1차 진화!';
    nameEl.textContent = sp.names[0] + ' → ' + sp.names[1];
    line.textContent = '더 크고 멋져졌어요! 2차 진화까지 100 EXP!';
  } else {
    badge.textContent = '🌟';
    title.textContent = '2차 진화 완성!';
    nameEl.textContent = sp.names[0] + ' → ' + sp.names[1] + ' → ' + sp.names[2];
    line.textContent = '도감에 저장했어요! 마이룸에서 함께 놀 수 있어요.';
  }
  nameEl.innerHTML = esc(nameEl.textContent) + ' ' + typeBadgeHtml(sp) + rarityBadgeHtml(sp);

  art.innerHTML = petArt(sp, Math.max(1, stage), 1);
  next.innerHTML = stage < 3
    ? '<span>다음 모습</span>' + petArt(sp, stage + 1, 0) + '<b>???</b>'
    : '<span>🐾 몬스터 도감에 저장됐어요!</span>';
  actions.innerHTML = stage < 3
    ? '<button class="modal-btn" data-act="evo-close">좋아, 더 키울래!</button>' +
      '<button class="modal-btn sub" data-act="evo-dex">🐾 도감 보기</button>'
    : '<button class="modal-btn" data-act="evo-new">🥚 새 알 받기</button>' +
      '<button class="modal-btn sub" data-act="evo-dex">🐾 도감 보기</button>';

  m.hidden = false;
  lockScroll();
}

/* ---------------- 펫 케어 (먹이 = 경험치 물약) ---------------- */
function openCare() {
  renderCare();
  var m = document.getElementById('careModal');
  if (m) m.hidden = false;
  raiseModal('careModal');
  lockScroll();
}
function closeCare() {
  var m = document.getElementById('careModal');
  if (m) m.hidden = true;
  if (isOnlyModal('careModal')) unlockScroll();
}

function careItems() {
  var out = [];
  var list = shopAll();
  for (var i = 0; i < list.length; i++) {
    var it = list[i];
    if (it.cat !== 'pet' || it.hidden) continue;
    if (isLegacyPetItem(it) || it.kind !== 'exp') continue;
    if (bagCount(it.id) > 0) out.push(it);
  }
  return out;
}

function careHtml() {
  var p = petState();
  var sp = speciesById(p.currentEgg);
  var need = petNeed(p.stage);
  var h = '<div class="care-top">' +
    '<div class="care-art">' + petArt(sp, p.stage, p.exp / Math.max(1, need)) + '</div>' +
    '<div class="care-meta">' +
      '<b>' + (p.stage === 0 ? '수수께끼 알' : esc(sp.names[p.stage - 1])) + '</b> ' + rarityBadgeHtml(sp) +
      '<div class="pet-gauge"><i style="width:' + (need ? Math.round(p.exp / need * 100) : 100) + '%"></i></div>' +
      '<div class="care-line">' + (p.stage === 0
        ? 'EXP ' + p.exp + ' / 100 · 부화까지 ' + fmtLeft(petHatchLeft())
        : (p.stage >= 3 ? '2차 진화 완성! 🌟' : 'EXP ' + p.exp + ' / 100 · 다음 진화까지 ' + Math.max(0, 100 - p.exp))) + '</div>' +
    '</div>' +
    '<span class="shop-coin">' + coinSvg() + ' <b>' + fmtNum(prof().coins) + '</b></span>' +
    '</div>';

  var items = careItems();
  h += '<h3 class="pet-sec-title">🎒 먹이 가방</h3>';
  if (!items.length) {
    h += '<p class="spend-empty">가방이 비었어요. 상점에서 먹이를 사면 여기서 먹일 수 있어요.</p>';
  } else {
    h += '<div class="care-list">';
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var dis = '';
      if (p.stage >= 3) dis = 'disabled';
      h += '<div class="care-row">' +
        '<span class="care-ic" style="--ic:' + esc(it.color || '#ffd9a0') + '">' + (it.icon || '🍖') + '</span>' +
        '<span class="care-nm"><b>' + esc(it.name) + '</b><small>' + esc(it.desc || '') + ' · ' + bagCount(it.id) + '개</small></span>' +
        '<button type="button" class="pill-btn warm" data-act="feed" data-id="' + esc(it.id) + '" ' + dis + '>먹이기</button>' +
        '</div>';
    }
    h += '</div>';
  }
  h += '<div class="care-actions">' +
    '<button type="button" class="pill-btn" data-act="shop-open" data-shop-tab="pet">🛒 상점에서 먹이 사기</button>' +
    '<button type="button" class="ghost-btn" data-act="care-close">닫기</button>' +
    '</div>';
  h += '<p class="lf-note">루틴 체크 +' + COIN_CHECK + '코인, 그룹 완료 +' + COIN_GROUP + '코인, 칭찬 스티커 +' + COIN_STICKER + '코인. 하루를 다 채우면 먹이 10개 = 100 EXP! ‘내 펫’에서 키울 친구를 바꿀 수 있어요.</p>';
  return h;
}

function renderCare() {
  var b = document.getElementById('careBody');
  if (b) b.innerHTML = careHtml();
}

function feedItem(id) {
  var it = shopItem(id);
  if (!it) return;
  var p = prof();
  if (bagCount(id) <= 0) { showToast('가방에 없어요.'); return; }
  var pet = petState();
  if (pet.stage >= 3) { showToast('이미 다 자랐어요! ‘내 펫’에서 다른 친구를 골라 주세요.'); return; }
  if (it.kind !== 'exp') { showToast('지금은 먹이(경험치 물약)만 줄 수 있어요.'); return; }
  /* 먹이 하나로 알은 부화 EXP를, 친구는 진화 EXP를 채워요 */
  var gain = parseInt(it.n, 10) || 10;
  p.bag[id] = bagCount(id) - 1;
  snd('check');
  saveState();
  renderCare();
  petAddExp(gain, {});
  if (!document.getElementById('careModal').hidden) renderCare();
  renderCoinBadge();
}


/* 🥚 내 펫 — 아바타처럼 따로 띄우는 창 */
function openPetHome() {
  var m = document.getElementById('petHomeModal');
  renderPet();
  if (m) m.hidden = false;
  renderPetHomeExtra();
  raiseModal('petHomeModal');
  lockScroll();
}
function closePetHome() {
  var m = document.getElementById('petHomeModal');
  if (m) m.hidden = true;
  if (isOnlyModal('petHomeModal')) unlockScroll();
}
