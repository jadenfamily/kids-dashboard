/* ============================================================================
   Jaden's Today v2 — js/sync.js
   GitHub 비공개 저장소(kids-dashboard-data) 불러오기 · 저장 · 병합 · 날씨 · 로그인/기기 연결
   · 원본 index.html(운영본)의 같은 코드를 기능별로 나눈 파일입니다. 동작은 원본과 같아요.
   · 모듈끼리 같은 전역 스코프를 써요. index.html 에서 core → sync → ... 순서로 불러옵니다.
   ============================================================================ */
'use strict';

/* ============ 날씨 ============ */
function cityOptions(selected) {
  var h = '';
  for (var i = 0; i < CITIES.length; i++) {
    var c = CITIES[i];
    h += '<option value="' + c.id + '"' + (c.id === selected ? ' selected' : '') + '>' + esc(c.name) + '</option>';
  }
  return h;
}

function weatherInfo(code) {
  var map = {
    0: ['☀️', '맑음'],
    1: ['🌤️', '대체로 맑음'],
    2: ['⛅', '구름 조금'],
    3: ['☁️', '흐림'],
    45: ['🌫️', '안개'],
    48: ['🌫️', '안개'],
    51: ['🌦️', '약한 이슬비'],
    53: ['🌦️', '이슬비'],
    55: ['🌧️', '이슬비'],
    56: ['🌧️', '어는 이슬비'],
    57: ['🌧️', '어는 이슬비'],
    61: ['🌦️', '약한 비'],
    63: ['🌧️', '비'],
    65: ['🌧️', '강한 비'],
    66: ['🌨️', '어는 비'],
    67: ['🌨️', '어는 비'],
    71: ['🌨️', '약한 눈'],
    73: ['❄️', '눈'],
    75: ['❄️', '많은 눈'],
    77: ['🌨️', '눈 알갱이'],
    80: ['🌦️', '소나기'],
    81: ['🌧️', '소나기'],
    82: ['⛈️', '강한 소나기'],
    85: ['🌨️', '눈 소나기'],
    86: ['🌨️', '많은 눈 소나기'],
    95: ['⛈️', '천둥번개'],
    96: ['⛈️', '천둥번개·우박'],
    99: ['⛈️', '천둥번개·우박']
  };
  var e = map[code] || ['🌡️', '오늘 날씨'];
  var rain = (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95;
  var snow = (code >= 71 && code <= 77) || code === 85 || code === 86;
  return { icon: e[0], label: e[1], rain: rain, snow: snow };
}

function outfitTip(d) {
  var t = (d.feels != null) ? d.feels : d.temp;
  if (t == null) return { icon: '👕', text: '날씨에 맞는 옷 챙기기' };
  if (t >= 28) return { icon: '🩳', text: '반팔·반바지가 좋아요' };
  if (t >= 24) return { icon: '👕', text: '반팔에 얇은 겉옷 챙기기' };
  if (t >= 20) return { icon: '👕', text: '긴팔 티셔츠가 딱 좋아요' };
  if (t >= 17) return { icon: '🧥', text: '얇은 겉옷 챙기기' };
  if (t >= 12) return { icon: '🧥', text: '겉옷 꼭 챙기기' };
  if (t >= 8) return { icon: '🧣', text: '코트나 두꺼운 겉옷 챙기기' };
  if (t >= 3) return { icon: '🧣', text: '패딩에 목도리까지 챙기기' };
  return { icon: '🧤', text: '두꺼운 패딩·장갑·목도리 챙기기' };
}

function rainAlert(d, info) {
  var pop = (d.pop == null) ? null : Math.round(d.pop);
  if (info.snow) return { icon: '☃️', text: '눈이 와요! 미끄러지지 않게 조심', cls: 'snow' };
  var willRain = info.rain || (pop != null && pop >= 50) || (d.rainAmt != null && d.rainAmt >= 1);
  if (willRain) {
    var t = '우산 챙기세요!';
    if (pop != null) t += ' (비 올 확률 ' + pop + '%)';
    return { icon: '☔', text: t, cls: 'rain' };
  }
  return { icon: '🌂', text: '오늘은 우산 없어도 돼요', cls: 'clear' };
}

function renderWeather() {
  var el = document.getElementById('weather');
  if (!el) return;
  var city = cityById(state.settings.city);
  var sel = can('edit')
    ? '<span class="w-city-wrap">📍<select class="w-city" data-field="city" aria-label="동네 선택">' + cityOptions(city.id) + '</select></span>'
    : '<span class="w-city-wrap">📍 ' + esc(city.name) + '</span>';
  var d = weather.data;

  if (d && (d.code != null || d.temp != null)) {
    var info = weatherInfo(d.code);
    var tip = outfitTip(d);
    var alert = rainAlert(d, info);
    var night = (d.isDay === 0 && d.code <= 1);
    var icon = night ? '🌙' : info.icon;
    var tempTxt = (d.temp == null ? '--' : d.temp);
    var feelTxt = '';
    if (d.feels != null && d.temp != null && Math.abs(d.feels - d.temp) >= 2) {
      feelTxt = ' · 체감 ' + d.feels + '°';
    }
    var updated = (weather.at ? fmtShort(weather.at) : '') + (weather.stale ? ' (지난번 날씨)' : ' 기준');

    var gap = '';
    if (d.max != null && d.min != null && (d.max - d.min) >= 10) {
      gap = '<span class="w-chip warm">🧣 아침저녁 일교차가 커요</span>';
    }

    el.innerHTML =
      '<div class="w-head">' +
        '<span class="w-icon" aria-hidden="true">' + icon + '</span>' +
        '<div class="w-main">' +
          '<div class="w-temp">' + tempTxt + '<small>°</small></div>' +
          '<div class="w-desc">' + esc(info.label + feelTxt) + '</div>' +
        '</div>' +
        '<div class="w-side">' +
          '<div class="w-range">최저 <b>' + (d.min == null ? '-' : d.min) + '°</b> · 최고 <b>' + (d.max == null ? '-' : d.max) + '°</b></div>' +
          '<div class="w-cityline">' + esc(city.name) + ' · ' + esc(updated) + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="w-chips">' +
        '<span class="w-chip ' + alert.cls + '">' + alert.icon + ' ' + esc(alert.text) + '</span>' +
        '<span class="w-chip">' + tip.icon + ' ' + esc(tip.text) + '</span>' +
        gap +
      '</div>' +
      '<div class="w-foot">' + sel +
        '<button class="w-refresh" data-act="weather-refresh" aria-label="날씨 새로고침" title="새로고침">↻</button>' +
      '</div>';
    el.classList.remove('is-error');
    return;
  }

  var msg = '날씨를 불러오는 중…';
  var icon2 = '🌤️';
  var retry = '';
  if (weather.status === 'error' || weather.status === 'ok') {
    icon2 = '🌧️';
    msg = (weather.status === 'error') ? '날씨를 불러오지 못했어요' : '날씨 정보가 없어요';
    retry = '<button class="w-retry" data-act="weather-refresh">다시 시도</button>';
  }
  el.innerHTML =
    '<div class="w-head">' +
      '<span class="w-icon" aria-hidden="true">' + icon2 + '</span>' +
      '<div class="w-main">' +
        '<div class="w-temp">--<small>°</small></div>' +
        '<div class="w-desc">' + esc(msg) + '</div>' +
      '</div>' +
      '<div class="w-side"><div class="w-range">최저 -° · 최고 -°</div>' +
      '<div class="w-cityline">' + esc(city.name) + '</div></div>' +
    '</div>' +
    '<div class="w-foot">' + sel + retry +
      '<button class="w-refresh" data-act="weather-refresh" aria-label="날씨 새로고침" title="새로고침">↻</button>' +
    '</div>';
  el.classList.toggle('is-error', weather.status === 'error');
}

function parseWeather(j) {
  var cur = (j && j.current) ? j.current : {};
  var daily = (j && j.daily) ? j.daily : {};
  function first(a) { return (a && a.length) ? a[0] : null; }
  return {
    temp: r1(cur.temperature_2m),
    feels: r1(cur.apparent_temperature),
    isDay: (cur.is_day == null ? 1 : cur.is_day),
    code: (cur.weather_code != null) ? cur.weather_code : first(daily.weather_code),
    max: r1(first(daily.temperature_2m_max)),
    min: r1(first(daily.temperature_2m_min)),
    pop: first(daily.precipitation_probability_max),
    rainAmt: first(daily.precipitation_sum)
  };
}

function loadWeather() {
  var city = cityById(state.settings.city);
  weather.status = 'loading';
  weather.error = '';
  renderWeather();

  var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + city.lat +
    '&longitude=' + city.lon +
    '&current=temperature_2m,apparent_temperature,weather_code,is_day' +
    '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum' +
    '&timezone=Asia%2FSeoul&forecast_days=1';

  var finished = false;
  var timer = window.setTimeout(function () {
    if (finished) return;
    finished = true;
    onWeatherFail('시간이 너무 오래 걸려요');
  }, 9000);

  if (typeof window.fetch !== 'function') {
    onWeatherFail('이 브라우저에서는 날씨를 볼 수 없어요');
    window.clearTimeout(timer);
    return;
  }

  try {
    window.fetch(url, { cache: 'no-store' }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    }).then(function (json) {
      if (finished) return;
      finished = true;
      window.clearTimeout(timer);
      var parsed = parseWeather(json);
      weather.data = parsed;
      weather.status = 'ok';
      weather.at = Date.now();
      weather.fetchedAt = Date.now();
      weather.stale = false;
      try {
        window.localStorage.setItem(WEATHER_KEY, JSON.stringify({
          city: city.id, at: weather.at, data: parsed
        }));
      } catch (e) { /* 저장 못 해도 괜찮아요 */ }
      renderWeather();
      try { saveWeatherToCloud(parsed, city.id); } catch (e2) { /* 무시 */ }
    }).catch(function () {
      if (finished) return;
      finished = true;
      window.clearTimeout(timer);
      onWeatherFail('인터넷 연결을 확인해 주세요');
    });
  } catch (e) {
    onWeatherFail('인터넷 연결을 확인해 주세요');
  }
}

/* 성공한 기기에서 오늘 날씨를 저장해 두면, open-meteo가 막히는 기기(구형 안드로이드)가 이걸 대신 읽어요 */
var WEATHER_CLOUD_PATH = 'data/weather.json';
var weatherCloudAt = 0;
function saveWeatherToCloud(d, cityId) {
  if (!d || !cloud.me || !cloud.conn) return;
  if (Date.now() - weatherCloudAt < 15 * 60 * 1000) return;
  weatherCloudAt = Date.now();
  var info = weatherInfo(d.code);
  var c = cityById(cityId || state.settings.city);
  try {
    /* 예전부터 쓰던 파일 모양(city 이름·lat·lon)도 그대로 지켜서, 1시간 자동 업데이트와 같이 써요 */
    ghPut(WEATHER_CLOUD_PATH, {
      version: 1,
      city: c.name || state.settings.city,
      cityId: c.id || state.settings.city,
      lat: c.lat, lon: c.lon,
      temp: d.temp, hi: d.max, lo: d.min,
      code: d.code,
      desc: info.label, icon: info.icon,
      feels: (d.feels == null ? null : d.feels),
      isDay: (d.isDay == null ? 1 : d.isDay),
      updatedAt: new Date().toISOString()
    }, '오늘 날씨 저장');
  } catch (e) { /* 저장 못 해도 괜찮아요 */ }
}

/* open-meteo가 안 되는 기기에서 가족이 저장해 둔 날씨를 대신 보여 줘요 (깃허브는 구형 태블릿에서도 열려요) */
async function applyWeatherFromCloud() {
  if (!cloud.me || !cloud.conn) return false;
  try {
    var res = await ghGet(WEATHER_CLOUD_PATH);
    if (!res || !res.ok || !res.data) return false;
    var w = res.data;
    if (!w || (w.code == null && w.temp == null)) return false;
    /* city는 이름('서울')로도, id('seoul')로도 저장될 수 있어요 (1시간 자동 업데이트와 모양이 같아요) */
    var myCity = cityById(state.settings.city);
    if (w.city && w.city !== state.settings.city && w.city !== myCity.name) return false;
    var upd = Date.parse(w.updatedAt || '') || 0;
    if (upd && (Date.now() - upd) > 12 * 3600 * 1000) return false;   /* 너무 오래된 날씨는 안 보여요 */
    weather.data = {
      temp: (w.temp == null ? null : Number(w.temp)),
      max: (w.hi == null ? null : Number(w.hi)),
      min: (w.lo == null ? null : Number(w.lo)),
      code: (w.code == null ? null : Number(w.code)),
      feels: (w.feels == null ? null : Number(w.feels)),
      isDay: (w.isDay == null ? 1 : Number(w.isDay)),
      pop: null, rainAmt: null
    };
    weather.status = 'cache';
    weather.at = upd || Date.now();
    weather.stale = !upd || (Date.now() - upd) > 30 * 60 * 1000;
    renderWeather();
    return true;
  } catch (e) { return false; }
}

function onWeatherFail(reason) {
  weather.status = 'error';
  weather.error = reason || '';
  if (weather.data) weather.stale = true;
  renderWeather();
  try { applyWeatherFromCloud(); } catch (e) { /* 무시 */ }
}

function loadWeatherCache() {
  var raw = null;
  try { raw = window.localStorage.getItem(WEATHER_KEY); } catch (e) { raw = null; }
  if (!raw) return;
  try {
    var c = JSON.parse(raw);
    if (!c || !c.data) return;
    if (c.city && c.city !== state.settings.city) return;
    if (!c.at || (Date.now() - c.at) > 36 * 3600 * 1000) return;
    weather.data = c.data;
    weather.at = c.at || 0;
    weather.status = 'cache';
    weather.stale = true;
  } catch (e) { /* 무시 */ }
}

/* ---------------- 프로필 저장 / 클라우드 ---------------- */
var legacyPet = null;
var lastProfileSig = '';
var cloudClearedAt = 0;   /* 구름(설정/프로필)에서 온 초기화 시각 */

function profileSignature() {
  var p = prof();
  return JSON.stringify({
    c: p.coins, pt: p.pet, pe: p.pets, ap: p.activePetId, rp: p.runnerPetId,
    b: p.bag, o: p.owned, r: p.room, a: p.avatar, al: p.allowanceNotices,
    sc: p.stickerCoin || null,
    xp: p.xp, lv: p.level, pg: p.progress, ach: p.ach
  });
}

function profilePayload() {
  var p = prof();
  roomMirror();
  return {
    version: 1,
    userId: (cloud.me && cloud.me.id) || '',
    name: (cloud.me && cloud.me.name) || '',
    clearedAt: Number(p.clearedAt) || 0,
    updatedAt: p.updatedAt || new Date().toISOString(),
    coins: p.coins,
    pet: p.pet,
    pets: p.pets,
    activePetId: p.activePetId,
    runnerPetId: p.runnerPetId || '',
    bag: p.bag,
    owned: p.owned,
    room: p.room,
    avatar: p.avatar,
    xp: Math.max(0, parseInt(p.xp, 10) || 0),
    level: Math.max(1, parseInt(p.level, 10) || 1),
    progress: p.progress || null,
    ach: p.ach || null,
    allowanceNotices: p.allowanceNotices || [],
    award: p.award,
    stickerCoin: p.stickerCoin || null
  };
}

function saveProfileLocal() {
  if (!cloud.me) return;
  writeProfileCache(cloud.me.id, prof());
}

function applyLegacyPet(raw) {
  if (!raw || typeof raw !== 'object') return;
  var p = petState();
  var rawCol = (Object.prototype.toString.call(raw.collection) === '[object Array]') ? raw.collection : [];
  for (var i = 0; i < rawCol.length; i++) {
    var cc = rawCol[i];
    var id = (typeof cc === 'string') ? cc : (cc && cc.id);
    if (typeof id !== 'string' || speciesById(id).id !== id) continue;
    var has = false;
    for (var j = 0; j < p.collection.length; j++) if (p.collection[j].id === id) has = true;
    if (!has) p.collection.push({ id: id, at: (cc && Number(cc.at)) || Date.now() });
  }
  var st = parseInt(raw.stage, 10);
  if (!isNaN(st) && st > p.stage && st <= 3) {
    p.stage = st;
    p.exp = 0;
    p.hatchAt = 0;
    if (typeof raw.currentEgg === 'string' && speciesById(raw.currentEgg).id === raw.currentEgg) p.currentEgg = raw.currentEgg;
  } else if (!isNaN(st) && st === p.stage) {
    var ex = parseInt(raw.exp, 10);
    if (!isNaN(ex) && ex > p.exp) p.exp = Math.min(EXP_MAX, ex * 10);
  }
  if (raw.art && typeof raw.art === 'object' && (!p.art || !Object.keys(p.art).length)) p.art = raw.art;
}

async function loadProfile() {
  if (!cloud.me) return;
  var id = cloud.me.id;
  var local = readProfileCache(id);
  var res = await ghGet(profilePath(id));
  var remote = (res.ok && res.data && typeof res.data === 'object' && res.data.pet) ? res.data : null;
  var remoteClear = Math.max(Number(remote && remote.clearedAt) || 0, Number(cloudClearedAt) || 0);
  var localClear = Number(local && local.clearedAt) || 0;
  var localUpd = local ? (Date.parse(local.updatedAt || '') || 0) : 0;
  var remoteUpd = remote ? (Date.parse(remote.updatedAt || '') || 0) : 0;

  /* 구름에서 초기화했으면(clearedAt) 이 기기의 옛 기록은 절대 되살리지 않아요 */
  var wiped = !!remoteClear && (remoteClear > localClear || (localUpd && localUpd < remoteClear));

  var pick = null;
  var needPush = false;
  if (remote) {
    if (wiped) {
      pick = remote;
      needPush = true;
    } else if (local && localUpd > remoteUpd) {
      pick = local;
      needPush = true;
    } else {
      pick = remote;
    }
    if (local && !wiped && pick && pick.pet) {
      /* 초기화가 아니면 도감은 합집합으로 (다른 기기에서 모은 친구를 잃지 않게) */
      var other = (pick === remote) ? local : remote;
      var a = pick.pet.collection || [];
      var bcol = (other && other.pet && other.pet.collection) || [];
      for (var i = 0; i < bcol.length; i++) {
        var bid = bcol[i] && bcol[i].id;
        if (!bid) continue;
        var has = false;
        for (var j = 0; j < a.length; j++) if (a[j] && a[j].id === bid) has = true;
        if (!has) a.push(bcol[i]);
      }
      pick.pet.collection = a;
      /* 여러 마리 펫 목록도 합쳐요 — 다른 기기에서 뽑아 둔 알을 잃지 않게 */
      var ap = (Object.prototype.toString.call(pick.pets) === '[object Array]') ? pick.pets : (pick.pets = []);
      var bp = (other && Object.prototype.toString.call(other.pets) === '[object Array]') ? other.pets : [];
      for (var pui = 0; pui < bp.length; pui++) {
        var puid = bp[pui] && bp[pui].id;
        if (!puid || puid === (pick.pet && pick.pet.id)) continue;
        var havePut = false;
        for (var puj = 0; puj < ap.length; puj++) if (ap[puj] && ap[puj].id === puid) havePut = true;
        if (!havePut) ap.push(bp[pui]);
      }
      if (!pick.runnerPetId && other && other.runnerPetId) pick.runnerPetId = other.runnerPetId;
    }
  } else if (local && !wiped) {
    pick = local;
    needPush = true;
  } else if (local && wiped) {
    pick = null;      /* 구름이 초기화됨 · 이 기기 캐시는 버림 */
    needPush = true;
  } else {
    needPush = true;
  }

  state.profile = normalizeProfile(pick || defaultProfile(), id);
  if (!pick) {
    if (wiped) {
      var fresh = defaultProfile();
      fresh.coins = 0;
      fresh.pet.hatchAt = Date.now() + HATCH_MS;
      fresh.clearedAt = remoteClear;
      state.profile = normalizeProfile(fresh, id);
    } else {
      applyLegacyPet(legacyPet || legacyPetSeed);
    }
  }
  if (wiped) {
    state.profile.clearedAt = Math.max(Number(state.profile.clearedAt) || 0, remoteClear);
    if (!remote) {
      /* 프로필 파일이 없는데 초기화 표시만 있으면 깨끗한 상태로 시작 */
      state.profile.coins = 0;
      state.profile.bag = {};
      state.profile.pet.collection = [];
      state.profile.pet.stage = 0;
      state.profile.pet.exp = 0;
      state.profile.pet.hatchedAt = 0;
      state.profile.pets = [];
      state.profile.runnerPetId = '';
    }
  }
  if (!pick && !wiped) state.profile.updatedAt = new Date().toISOString();
  writeProfileCache(id, state.profile);
  cloud.dirty.profile = needPush;
  lastProfileSig = profileSignature();
  cloud.lastProfileSig = lastProfileSig;
  cloud.profileReady = true;
  renderCoinBadge();
  renderPet();
  /* 이 프로필에 아직 안 들어온 스티커(다른 기기에서 붙인 것)의 코인을 채워요 */
  try { creditStickerLogCoins(true); } catch (e0) { /* 무시 */ }
  if (needPush) scheduleSync('profile');
}

/* 저장 직전에 구름의 초기화 표시를 한 번 더 확인해요 (다른 기기에서 초기화한 경우 대비) */
var lastProfileCheck = 0;
async function guardProfileReset() {
  if (!cloud.me) return false;
  var now = Date.now();
  if (now - lastProfileCheck < 45000) return false;
  lastProfileCheck = now;
  var res = await ghGet(profilePath(cloud.me.id));
  if (!res.ok || !res.data || typeof res.data !== 'object') return false;
  var rc = Math.max(Number(res.data.clearedAt) || 0, Number(cloudClearedAt) || 0);
  var pc = Number(prof().clearedAt) || 0;
  if (rc > pc) {
    cloud.dirty.profile = false;
    await loadProfile();
    renderAll();
    return true;
  }
  return false;
}

function onProfileChanged() {
  var p = prof();
  roomMirror();
  var sig = profileSignature();
  if (sig === lastProfileSig) return;
  lastProfileSig = sig;
  cloud.lastProfileSig = sig;
  p.updatedAt = new Date().toISOString();
  if (cloud.me) {
    writeProfileCache(cloud.me.id, p);
    scheduleSync('profile');
  }
}

/* ============ 로그인 / 계정 / 클라우드 저장 ============ */

function lsGet(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { window.localStorage.setItem(k, v); return true; } catch (e) { return false; } }
function lsDel(k) { try { window.localStorage.removeItem(k); } catch (e) { /* 무시 */ } }
function fieldVal(id) { var el = document.getElementById(id); return el ? String(el.value == null ? '' : el.value) : ''; }

function roleLabel(role) { return (ROLES[role] && ROLES[role].label) || '보기 전용'; }
function roleOptions(sel) {
  var out = '';
  for (var key in ROLES) {
    if (!Object.prototype.hasOwnProperty.call(ROLES, key)) continue;
    out += '<option value="' + key + '"' + (key === sel ? ' selected' : '') + '>' + ROLES[key].label + '</option>';
  }
  return out;
}
function initialOf(name) {
  var s = String(name || '').trim();
  return s ? s.slice(0, 1) : '·';
}

function randomHex(n) {
  var bytes = new Uint8Array(n);
  if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(bytes);
  else for (var i = 0; i < n; i++) bytes[i] = Math.floor(Math.random() * 256);
  return bytesToHex(bytes);
}
function bytesToHex(bytes) {
  var s = '';
  for (var i = 0; i < bytes.length; i++) s += ('0' + bytes[i].toString(16)).slice(-2);
  return s;
}
async function sha256Hex(text) {
  if (!(window.crypto && window.crypto.subtle && window.crypto.subtle.digest)) {
    throw new Error('이 브라우저에서는 암호화 기능을 쓸 수 없어요. Safari/Chrome을 최신 버전으로 올려 주세요.');
  }
  var buf = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(text)));
  return bytesToHex(new Uint8Array(buf));
}
function hashPassword(pw, salt) { return sha256Hex(String(salt) + ':' + String(pw)); }

/* ---- 기기 연결 정보 / 캐시 ---- */
function loadDevice() {
  try {
    var j = JSON.parse(lsGet(DEVICE_KEY) || 'null');
    if (j && j.owner && j.repo && j.token) return { owner: j.owner, repo: j.repo, token: j.token, branch: j.branch || 'main', at: j.at || 0 };
  } catch (e) { /* 무시 */ }
  return null;
}
function saveDevice(c) { if (c) lsSet(DEVICE_KEY, JSON.stringify(c)); else lsDel(DEVICE_KEY); }

/* ---- 로그인 유지 세션 (30일) ---- */
function ssGet(k) { try { return window.sessionStorage.getItem(k); } catch (e) { return null; } }
function ssSet(k, v) { try { window.sessionStorage.setItem(k, v); return true; } catch (e) { return false; } }
function ssDel(k) { try { window.sessionStorage.removeItem(k); } catch (e) { /* 무시 */ } }

function clearSession() {
  lsDel(SESSION_KEY);
  ssDel(SESSION_KEY);
  cloud.session = null;
}

function loadSession() {
  var raw = lsGet(SESSION_KEY);
  var store = 'local';
  if (!raw) { raw = ssGet(SESSION_KEY); store = 'session'; }
  if (!raw) return null;
  var j = null;
  try { j = JSON.parse(raw); } catch (e) { j = null; }
  if (!j || !j.id) { clearSession(); return null; }
  var exp = Number(j.expiresAt) || 0;
  if (store === 'local' && (!exp || exp <= Date.now())) { clearSession(); return null; } /* 30일 만료 */
  return {
    id: String(j.id),
    name: String(j.name || j.id),
    role: ROLES[j.role] ? j.role : 'viewer',
    store: store,
    issuedAt: Number(j.issuedAt) || 0,
    expiresAt: exp
  };
}

function saveSession(me, remember, prev) {
  if (!me || !me.id) return null;
  var now = Date.now();
  var keepExp = (prev && prev.store === 'local' && prev.expiresAt > now) ? prev.expiresAt : 0;
  var s = {
    version: 1,
    id: me.id,
    name: me.name || me.id,
    role: ROLES[me.role] ? me.role : 'viewer',
    store: remember ? 'local' : 'session',
    issuedAt: (prev && prev.issuedAt) || now,
    expiresAt: remember ? (keepExp || (now + SESSION_MS)) : 0
  };
  clearSession();
  var ok = remember ? lsSet(SESSION_KEY, JSON.stringify(s)) : ssSet(SESSION_KEY, JSON.stringify(s));
  if (!ok) return null;
  cloud.session = s;
  return s;
}
function loadUsersCache() { try { return JSON.parse(lsGet(USERS_CACHE_KEY) || 'null'); } catch (e) { return null; } }
function saveUsersCache(u) { if (u) lsSet(USERS_CACHE_KEY, JSON.stringify(u)); }
function loadShaCache() { try { return JSON.parse(lsGet(SHA_KEY) || '{}') || {}; } catch (e) { return {}; } }
function rememberSha(p, sha) { if (!p || !sha) return; cloud.sha[p] = sha; lsSet(SHA_KEY, JSON.stringify(cloud.sha || {})); }

/* ---- GitHub Contents API ---- */
function ghHeaders(token) {
  return {
    'Authorization': 'Bearer ' + (token || (cloud.conn && cloud.conn.token) || ''),
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  };
}
function ghBase() { return API_BASE + '/repos/' + encodeURIComponent(cloud.conn.owner) + '/' + encodeURIComponent(cloud.conn.repo); }
function b64encodeUtf8(str) {
  var bytes = new TextEncoder().encode(String(str));
  var bin = '';
  for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return window.btoa(bin);
}
function b64decodeUtf8(b64) {
  var bin = window.atob(String(b64 || '').replace(/\s/g, ''));
  var bytes = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  if (window.TextDecoder) return new TextDecoder('utf-8').decode(bytes);
  return decodeURIComponent(escape(bin));
}

async function ghGet(path) {
  var branch = (cloud.conn && cloud.conn.branch) || 'main';
  var url = ghBase() + '/contents/' + path + '?ref=' + encodeURIComponent(branch) + '&_=' + Date.now();
  try {
    var res = await window.fetch(url, { headers: ghHeaders(), cache: 'no-store' });
    if (res.status === 404) return { ok: true, missing: true };
    if (res.status === 401) return { ok: false, status: 401, error: '토큰이 올바르지 않아요' };
    if (res.status === 403) return { ok: false, status: 403, error: '권한이 없어요 (Contents: Read and write)' };
    if (!res.ok) return { ok: false, status: res.status, error: 'HTTP ' + res.status };
    var j = await res.json();
    if (Object.prototype.toString.call(j) === '[object Array]') return { ok: true, list: j };
    var text = j && j.content ? b64decodeUtf8(j.content) : '';
    var data = null;
    if (text) { try { data = JSON.parse(text); } catch (e) { data = null; } }
    rememberSha(path, j && j.sha);
    return { ok: true, data: data, sha: j && j.sha, raw: text };
  } catch (e) {
    return { ok: false, status: 0, error: '네트워크에 연결하지 못했어요' };
  }
}

async function ghPut(path, obj, message) {
  var payload = {
    message: message || ('기록 업데이트: ' + path),
    content: b64encodeUtf8(JSON.stringify(obj, null, 2)),
    branch: (cloud.conn && cloud.conn.branch) || 'main'
  };
  if (cloud.sha[path]) payload.sha = cloud.sha[path];
  for (var attempt = 0; attempt < 3; attempt++) {
    try {
      var res = await window.fetch(ghBase() + '/contents/' + path, {
        method: 'PUT', headers: ghHeaders(), body: JSON.stringify(payload)
      });
      if (res.ok) {
        var j = await res.json();
        rememberSha(path, j && j.content && j.content.sha);
        return { ok: true };
      }
      if (res.status === 409 || res.status === 422 || res.status === 404) {
        var cur = await ghGet(path);
        if (!cur.ok) return { ok: false, status: cur.status, error: cur.error };
        if (cur.missing) delete payload.sha;
        else payload.sha = cur.sha;
        continue;
      }
      if (res.status === 401) return { ok: false, status: 401, error: '토큰이 올바르지 않아요' };
      if (res.status === 403) return { ok: false, status: 403, error: '쓰기 권한이 없어요 (Contents: Read and write)' };
      return { ok: false, status: res.status, error: 'HTTP ' + res.status };
    } catch (e) {
      return { ok: false, status: 0, error: '네트워크에 연결하지 못했어요' };
    }
  }
  return { ok: false, status: 409, error: '다른 기기에서 먼저 저장했어요' };
}

/* ---- 동기화 상태 ---- */
function setSync(status) { cloud.status = status; cloud.statusAt = Date.now(); renderSyncPill(); }

function renderSyncPill() {
  var el = document.getElementById('syncPill');
  if (!el) return;
  if (!cloud.conn) { el.className = 'sync-pill'; el.textContent = '☁️ 연결 전'; return; }
  if (!cloud.me) { el.className = 'sync-pill'; el.textContent = '🔐 로그인 전'; return; }
  if (cloud.dirty.day || cloud.dirty.settings || cloud.dirty.stickers || cloud.dirty.profile) {
    el.className = 'sync-pill sync';
    el.textContent = cloud.saving ? '☁️ 저장 중…' : '☁️ 저장 대기';
    return;
  }
  if (cloud.status === 'offline') { el.className = 'sync-pill off'; el.textContent = '📴 오프라인 · 기기에 저장됨'; return; }
  if (cloud.status === 'error') { el.className = 'sync-pill err'; el.textContent = '⚠️ 동기화 오류'; return; }
  if (cloud.status === 'syncing') { el.className = 'sync-pill sync'; el.textContent = '☁️ 저장 중…'; return; }
  if (cloud.status === 'ok') {
    el.className = 'sync-pill ok';
    var d = new Date(cloud.statusAt || Date.now());
    el.textContent = '☁️ 저장됨 ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
    return;
  }
  el.className = 'sync-pill';
  el.textContent = '☁️ 준비';
}

function settingsSignature() {
  return JSON.stringify({
    s: state.settings,
    c: state.categories,
    sc: state.schedule,
    st: { slots: state.sticker.slots, goal: state.sticker.goal, unit: state.sticker.unit, reasons: state.sticker.reasons },
    wb: state.workbooks,
    lo: state.layoutOrder,
    sh: state.shop
  });
}

function scheduleSync(kind) {
  if (!cloud.conn || !cloud.me) return;
  if (kind === 'settings') cloud.dirty.settings = true;
  if (kind === 'day') cloud.dirty.day = true;
  if (kind === 'stickers') cloud.dirty.stickers = true;
  if (kind === 'profile') cloud.dirty.profile = true;
  if (cloud.timer) window.clearTimeout(cloud.timer);
  cloud.timer = window.setTimeout(function () { cloud.timer = 0; flushSync(); }, 900);
  renderSyncPill();
}

function settingsPayload() {
  return {
    version: 1,
    clearedAt: Number(state.settingsClearedAt) || 0,
    updatedAt: new Date().toISOString(),
    settings: state.settings,
    categories: state.categories,
    schedule: state.schedule,
    sticker: { slots: state.sticker.slots, goal: state.sticker.goal, unit: state.sticker.unit, reasons: state.sticker.reasons, reasonsUpdatedAt: Number(state.sticker.reasonsUpdatedAt) || 0, clearedAt: state.sticker.clearedAt || 0,
      /* 붙인 모양(칸별 id) · 직접 만든 모양 목록 — 다른 기기에도 같이 가요 */
      icons: (state.sticker.icons || []).slice(0), shapes: (state.sticker.shapes || []).slice(0),
      shapesUpdatedAt: Number(state.sticker.shapesUpdatedAt) || 0, shapeId: state.sticker.shapeId || '',
      boardUpdatedAt: Number(state.sticker.boardUpdatedAt) || 0 },
    workbooks: state.workbooks,
    layoutOrder: state.layoutOrder,
    clearedAt: state.sticker.clearedAt || 0,
    shop: state.shop,
    stats: { stickersTotal: stickerTotal() }
  };
}

/* ============ 스티커 사용 내역 — 겹침·삭제 정리 ============
   기기마다 이름표(id)가 달라도 시각·개수·내용이 같으면 같은 사용 기록이에요.
   통계 창이 날짜 파일을 읽으며 임시 이름표를 새로 붙이던 바람에, 새로고침하면
   같은 기록이 둘로 보이던 문제를 이 열쇠 하나로 막아요. */
function spendSig(s) {
  s = s || {};
  var n = parseInt(s.count, 10);
  if (isNaN(n) || n < 1) n = 1;
  return (Number(s.t) || 0) + '|' + n + '|' + String(s.item || '');
}

/* 이름표가 없는 예전 기록에도 늘 같은 이름표를 붙여요 (읽을 때마다 새로 만들지 않음) */
function spendFixedId(t, count) {
  var n = parseInt(count, 10);
  if (isNaN(n) || n < 1) n = 1;
  return 's' + (Number(t) || 0) + '-' + n;
}

/* 삭제 표시는 이름표와 내용 열쇠 둘 다 남겨요 — 다른 기기가 다른 이름표를 갖고 있어도 지워지게 */
function spendDeleteKeys(s) {
  var keys = [];
  if (s && typeof s.id === 'string' && s.id) keys.push('id:' + s.id);
  keys.push('sig:' + spendSig(s));
  return keys;
}

function spendDeleted(s, del) {
  if (!s) return false;
  del = del || state.deletedSpends || {};
  var keys = spendDeleteKeys(s);
  var t = Number(s.t) || 0;
  for (var i = 0; i < keys.length; i++) {
    var at = Number(del[keys[i]]);
    /* 지운 뒤에 새로 쓴 기록(t가 더 큼)은 남겨요 */
    if (at && t <= at) return true;
  }
  return false;
}

function pruneSpendDeletions() {
  if (!state.deletedSpends || typeof state.deletedSpends !== 'object') state.deletedSpends = {};
  var keepUntil = Date.now() - 45 * 86400000;
  var pairs = [];
  for (var k in state.deletedSpends) {
    if (!Object.prototype.hasOwnProperty.call(state.deletedSpends, k)) continue;
    var at = Number(state.deletedSpends[k]) || 0;
    if (!at || at < keepUntil) continue;
    pairs.push([k, at]);
  }
  /* 너무 많이 쌓이지 않게 최근 400개만 남겨요 */
  if (pairs.length > 400) {
    pairs.sort(function (a, b) { return b[1] - a[1]; });
    pairs = pairs.slice(0, 400);
  }
  var out = {};
  for (var i = 0; i < pairs.length; i++) out[pairs[i][0]] = pairs[i][1];
  state.deletedSpends = out;
}

/* 구름의 삭제 표시를 이 기기에도 합쳐요 */
function mergeSpendDeletions(incoming) {
  if (!incoming || typeof incoming !== 'object' || Object.prototype.toString.call(incoming) === '[object Array]') return false;
  if (!state.deletedSpends || typeof state.deletedSpends !== 'object') state.deletedSpends = {};
  var changed = false;
  var n = 0;
  for (var k in incoming) {
    if (!Object.prototype.hasOwnProperty.call(incoming, k)) continue;
    if (n++ > 2000) break;
    var at = Number(incoming[k]) || 0;
    if (!at || !/^(id|sig):/.test(k) || k.length > 80) continue;
    if (!state.deletedSpends[k]) { state.deletedSpends[k] = at; changed = true; }
  }
  if (changed) pruneSpendDeletions();
  return changed;
}

/* 이름표만 달라 겹쳐 들어간 같은 기록을 하나로 — 구름에 있는 원래 이름표를 남겨요 */
function dedupeSpends(cloudIds) {
  var order = [], bySig = {}, changed = false;
  for (var i = 0; i < state.stickerSpends.length; i++) {
    var s = state.stickerSpends[i];
    var sig = spendSig(s);
    if (!bySig[sig]) { bySig[sig] = s; order.push(sig); continue; }
    changed = true;
    var kept = bySig[sig];
    if (cloudIds && !cloudIds[kept.id] && cloudIds[s.id]) bySig[sig] = s;
  }
  if (changed) {
    var out = [];
    for (var k = 0; k < order.length; k++) out.push(bySig[order[k]]);
    state.stickerSpends = out;
  }
  return changed;
}

function spendsSignature() {
  var parts = [];
  for (var i = 0; i < state.stickerSpends.length && i < 400; i++) parts.push(spendSig(state.stickerSpends[i]) + '#' + state.stickerSpends[i].id);
  return parts.join(',');
}

function stickersPayload() {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    unit: state.sticker.unit || 1000,
    clearedAt: state.sticker.clearedAt || 0,
    reasons: state.sticker.reasons || [],
    reasonsUpdatedAt: Number(state.sticker.reasonsUpdatedAt) || 0,
    total: stickerTotal(),
    slots: Math.max(1, parseInt(state.sticker.slots, 10) || 10),
    board: state.sticker.stickers.slice(0),
    boardIcons: (state.sticker.icons || []).slice(0),
    shapes: (state.sticker.shapes || []).slice(0),
    shapesUpdatedAt: Number(state.sticker.shapesUpdatedAt) || 0,
    shapeId: state.sticker.shapeId || '',
    boardUpdatedAt: Number(state.sticker.boardUpdatedAt) || 0,
    log: state.stickerLog,
    boardLog: state.boardLog,
    spends: state.stickerSpends,
    deletedSpends: state.deletedSpends || {}
  };
}

function dayPath(key) {
  var p = String(key || '').split('-');
  if (p.length !== 3) return 'data/' + (key || '') + '.json';
  return 'data/' + p[0] + '/' + p[1] + '/' + p[2] + '.json';
}

function dayPayload(key) {
  var e = state.history[key] || null;
  var stickers = [];
  var boards = [];
  var spends = [];
  for (var i = 0; i < state.stickerLog.length; i++) {
    var s = state.stickerLog[i];
    if (s.d === key) stickers.push({ t: s.t, e: s.e, r: s.r || '' });
  }
  for (var b = 0; b < state.boardLog.length; b++) {
    var bd = state.boardLog[b];
    if (bd.d === key) boards.push({ t: bd.t, slots: bd.slots, goal: bd.goal });
  }
  for (var sp = 0; sp < state.stickerSpends.length; sp++) {
    var sd = state.stickerSpends[sp];
    if (sd.d === key) spends.push({ id: sd.id || '', t: sd.t, item: sd.item, count: sd.count, amount: sd.amount, by: sd.by });
  }
  return {
    version: 1,
    date: key,
    updatedAt: (state.dayUpdated && state.dayUpdated[key]) || new Date().toISOString(),
    by: cloud.me ? cloud.me.id : '',
    checks: state.checks[key] || {},
    d: e ? e.d : 0,
    t: e ? e.t : 0,
    pct: e ? e.pct : 0,
    cats: e ? e.cats : [],
    workbooks: cleanPick(state.workbookPicks ? state.workbookPicks[key] : null),
    wbItems: (state.workbookItemPicks && state.workbookItemPicks[key]) ? state.workbookItemPicks[key] : {},
    stickers: stickers,
    spends: spends,
    boards: boards,
    board: (key === currentKey) ? { stickers: state.sticker.stickers.slice(0), icons: (state.sticker.icons || []).slice(0), celebrated: !!state.sticker.celebrated } : null
  };
}

async function flushSync() {
  if (!cloud.conn || !cloud.me) return;
  if (cloud.saving) { cloud.again = true; return; }
  if (!cloud.dirty.day && !cloud.dirty.settings && !cloud.dirty.stickers && !cloud.dirty.profile) { renderSyncPill(); return; }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) { setSync('offline'); return; }
  cloud.saving = true;
  setSync('syncing');
  var ok = true;
  try {
    if (cloud.dirty.settings) {
      /* 보내는 동안 또 바뀔 수 있으니, 깃발은 먼저 내려 두고 실패하면 다시 올려요 */
      cloud.dirty.settings = false;
      var sres = await ghPut('config/settings.json', settingsPayload(), '대시보드 설정 업데이트');
      if (!sres.ok) { ok = false; cloud.dirty.settings = true; cloud.lastError = sres.error || ''; }
    }
    if (cloud.dirty.stickers) {
      cloud.dirty.stickers = false;
      /* 이 시점까지의 사용 내역이 저장소에 올라가요 — 구름에 없는 기록을 가려낼 때 씁니다 */
      var spendMark = Date.now();
      var kres = await ghPut('config/stickers.json', stickersPayload(), '스티커 원장 업데이트');
      if (!kres.ok) { ok = false; cloud.dirty.stickers = true; cloud.lastError = kres.error || ''; }
      else if ((Number(state.spendSyncAt) || 0) < spendMark) { state.spendSyncAt = spendMark; saveLocalOnly(); }
    }
    if (cloud.dirty.profile && cloud.me) {
      var blocked = false;
      try { blocked = await guardProfileReset(); } catch (e) { blocked = false; }
      if (!blocked) {
        cloud.dirty.profile = false;
        var pres = await ghPut(profilePath(cloud.me.id), profilePayload(), '내 프로필 저장 (' + cloud.me.id + ')');
        if (!pres.ok) { ok = false; cloud.dirty.profile = true; cloud.lastError = pres.error || ''; }
      }
    }
    if (cloud.dirty.day) {
      cloud.dirty.day = false;
      var dres = await ghPut(dayPath(currentKey), dayPayload(currentKey), '기록 ' + currentKey);
      if (!dres.ok) { ok = false; cloud.dirty.day = true; cloud.lastError = dres.error || ''; }
    }
  } finally {
    cloud.saving = false;
    setSync(ok ? 'ok' : (navigator.onLine === false ? 'offline' : 'error'));
    if (cloud.again) { cloud.again = false; scheduleSync(); }
  }
}

/* ---- 열어 둔 화면에도 다른 기기의 스티커를 곧 보여 줘요 ----
   내가 저장할 게 남아 있거나 저장 중이면 건너뛰고, 아니면 1분에 한 번만 조용히 확인해요. */
var stickerPullAt = 0;
var stickerPulling = false;
async function refreshStickersFromCloud(force) {
  if (!cloud.conn || !cloud.me || !cloud.profileReady) return false;
  if (stickerPulling || cloud.saving || cloud.again) return false;
  if (cloud.dirty.stickers || cloud.dirty.settings || cloud.dirty.day) return false;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return false;
  var now = Date.now();
  if (!force && now - stickerPullAt < 60000) return false;
  stickerPullAt = now;
  stickerPulling = true;
  try {
    var res = await ghGet('config/stickers.json');
    if (!res || !res.ok || !res.data) return false;
    if (cloud.dirty.stickers || cloud.saving) return false;
    var before = state.sticker.stickers.join('|') + '#' + (state.sticker.icons || []).join('|') + '#' + (Number(state.sticker.boardUpdatedAt) || 0) + '#' + state.stickerLog.length + '#' + spendsSignature() +
      '#' + (state.sticker.reasons || []).join('|') + '#' + (Number(state.sticker.reasonsUpdatedAt) || 0) + '#' + (state.sticker.shapes || []).length + '#' + (Number(state.sticker.shapesUpdatedAt) || 0);
    applyStickersPayload(res.data, { notify: true });
    var after = state.sticker.stickers.join('|') + '#' + (state.sticker.icons || []).join('|') + '#' + (Number(state.sticker.boardUpdatedAt) || 0) + '#' + state.stickerLog.length + '#' + spendsSignature() +
      '#' + (state.sticker.reasons || []).join('|') + '#' + (Number(state.sticker.reasonsUpdatedAt) || 0) + '#' + (state.sticker.shapes || []).length + '#' + (Number(state.sticker.shapesUpdatedAt) || 0);
    if (before !== after) saveLocalOnly();
    return before !== after;
  } catch (e) {
    return false;
  } finally {
    stickerPulling = false;
  }
}

/* ---- 칭찬 이유 목록은 '마지막으로 바뀐 시각'이 더 새로운 쪽을 따라요 ----
   같은 목록이 settings.json과 stickers.json 두 곳에 들어 있어요. 두 파일을 차례로 받아 오는
   사이에 오래된 쪽(stickers.json)이 방금 받은 새 목록을 덮어써서, 넣어 둔 이유가 사라지던
   문제를 막아요. */
function reasonsStamp(at, fileUpdatedAt) {
  var n = Number(at) || 0;
  if (n > 0) return n;
  /* 예전 파일에는 목록만 있고 시각이 없어요 — 파일이 저장된 시각으로 견줘요 */
  var t = Date.parse(String(fileUpdatedAt || ''));
  return isNaN(t) ? 0 : t;
}

/* 지금 갖고 있는 목록보다 새로울 때만 받고, 받은 시각도 함께 적어 둬요 */
function takeStickerReasons(list, stamp) {
  if (Object.prototype.toString.call(list) !== '[object Array]' || !list.length) return false;
  var cur = Number(state.sticker.reasonsUpdatedAt) || 0;
  if (stamp && cur && stamp <= cur) return false;
  /* 시각을 알 수 없는 목록으로는 이미 시각이 적힌 목록을 덮어쓰지 않아요 */
  if (!stamp && cur) return false;
  state.sticker.reasons = list;
  state.sticker.reasonsUpdatedAt = stamp || Date.now();
  return true;
}

/* ---- 클라우드 데이터 적용 ---- */
function applySettingsPayload(d) {
  if (!d || typeof d !== 'object') return false;
  var cAt = Math.max(Number(d.clearedAt) || 0, (d.pet && Number(d.pet.clearedAt)) || 0);
  if (cAt) {
    state.settingsClearedAt = Math.max(Number(state.settingsClearedAt) || 0, cAt);
    cloudClearedAt = Math.max(Number(cloudClearedAt) || 0, cAt);
  }
  var probe = normalize({
    settings: d.settings,
    categories: d.categories,
    schedule: d.schedule,
    sticker: d.sticker,
    checks: state.checks,
    history: state.history,
    dayUpdated: state.dayUpdated,
    stickerLog: state.stickerLog,
    boardLog: state.boardLog,
    workbooks: d.workbooks,
    layoutOrder: d.layoutOrder,
    shop: d.shop,
    stats: state.stats
  });
  state.settings = probe.settings;
  if (Object.prototype.toString.call(d.categories) === '[object Array]') state.categories = probe.categories;
  state.schedule = probe.schedule;
  state.sticker.slots = Math.max(probe.sticker.slots, state.sticker.stickers.length);
  state.sticker.goal = probe.sticker.goal;
  state.sticker.unit = probe.sticker.unit;
  /* 직접 만든 스티커 모양 — 시각(shapesUpdatedAt)이 있는 파일만 견줘요.
     옛 설정 파일(모양 정보 없음)이 새로 만든 모양을 지우지 않게 조심해요. */
  var dShapes = probe.sticker.shapes || [];
  var shAt = Number(d.sticker && d.sticker.shapesUpdatedAt) || 0;
  if (shAt && shAt >= (Number(state.sticker.shapesUpdatedAt) || 0)) {
    state.sticker.shapes = dShapes.slice(0);
    state.sticker.shapesUpdatedAt = Math.max(Number(state.sticker.shapesUpdatedAt) || 0, shAt);
    if (d.sticker && typeof d.sticker.shapeId === 'string') state.sticker.shapeId = d.sticker.shapeId.slice(0, 24);
  } else if (!shAt && dShapes.length && !(state.sticker.shapes || []).length) {
    /* 모양을 처음 받는 기기 — 옛 파일에 목록만 있으면 그대로 받아 둬요 */
    state.sticker.shapes = dShapes.slice(0);
    state.sticker.shapesUpdatedAt = Date.now();
  }
  /* 칸별 모양 id — 판(board)이 같은 판본일 때만 받아요 (판과 어긋나지 않게) */
  var sIcons = (d.sticker && Object.prototype.toString.call(d.sticker.icons) === '[object Array]') ? d.sticker.icons : null;
  var dBoardAt = Number(d.sticker && d.sticker.boardUpdatedAt) || 0;
  if (sIcons && dBoardAt && sIcons.length === state.sticker.stickers.length &&
      dBoardAt === (Number(state.sticker.boardUpdatedAt) || 0)) {
    var iconList = [];
    for (var siI = 0; siI < sIcons.length; siI++) iconList.push(typeof sIcons[siI] === 'string' ? sIcons[siI].slice(0, 24) : '');
    state.sticker.icons = iconList;
  }
  /* 목록의 시각(reasonsUpdatedAt)이 없던 예전 파일은 파일이 저장된 시각으로 견줘요 */
  takeStickerReasons(probe.sticker.reasons, reasonsStamp(d.sticker && d.sticker.reasonsUpdatedAt, d.updatedAt));
  if (Object.prototype.toString.call(d.workbooks) === '[object Array]') state.workbooks = probe.workbooks;
  if (Object.prototype.toString.call(d.layoutOrder) === '[object Array]') state.layoutOrder = probe.layoutOrder;
  if (d.shop && typeof d.shop === 'object' && Object.prototype.toString.call(d.shop.items) === '[object Array]' && d.shop.items.length) state.shop = probe.shop;
  if (d.pet && typeof d.pet === 'object') legacyPet = d.pet;
  var wipedBySettings = stickerWipeBefore(d.clearedAt);
  if (!wipedBySettings && d.stats && !isNaN(parseInt(d.stats.stickersTotal, 10))) {
    state.stats.stickersTotal = Math.max(stickerTotal(), parseInt(d.stats.stickersTotal, 10));
  }
  return true;
}

function applyStickersPayload(d, opts) {
  if (!d || typeof d !== 'object') return false;
  opts = opts || {};
  stickerWipeBefore(d.clearedAt);
  var clr = Number(state.sticker.clearedAt) || 0;
  var unit = parseInt(d.unit, 10);
  if (!isNaN(unit) && unit >= 100 && unit <= 100000) state.sticker.unit = unit;
  var slotsRaw = parseInt(d.slots, 10);
  if (!isNaN(slotsRaw) && slotsRaw >= 3 && slotsRaw <= 30 && slotsRaw > state.sticker.stickers.length) {
    state.sticker.slots = Math.max(state.sticker.slots, slotsRaw);
  }
  if (Object.prototype.toString.call(d.reasons) === '[object Array]') {
    var rs = [];
    for (var i = 0; i < d.reasons.length && rs.length < 12; i++) {
      if (typeof d.reasons[i] === 'string' && d.reasons[i].trim()) rs.push(d.reasons[i].trim().slice(0, 20));
    }
    if (rs.length) {
      var rsStamp = reasonsStamp(d.reasonsUpdatedAt, d.updatedAt);
      var tookReasons = takeStickerReasons(migrateStickerReasons(rs), rsStamp);
      /* 구름 스티커 파일이 더 오래된 목록을 들고 있으면, 새 목록으로 다시 올려 두 파일을 맞춰요 */
      if (!tookReasons && (Number(state.sticker.reasonsUpdatedAt) || 0) > rsStamp) {
        cloud.dirty.stickers = true;
        if (cloud.me && cloud.conn) scheduleSync('stickers');
      }
    }
  }

  /* 직접 만든 스티커 모양도 이 파일에 들어 있어요 — 더 새로울 때만 받아요 */
  if (Object.prototype.toString.call(d.shapes) === '[object Array]') {
    var shAt3 = Number(d.shapesUpdatedAt) || 0;
    if (shAt3 && shAt3 > (Number(state.sticker.shapesUpdatedAt) || 0)) {
      var gotShapes = [];
      for (var sIn = 0; sIn < d.shapes.length && gotShapes.length < STICKER_SHAPE_MAX; sIn++) {
        var sn3 = normalizeStickerShape(d.shapes[sIn]);
        if (sn3) gotShapes.push(sn3);
      }
      state.sticker.shapes = gotShapes;
      state.sticker.shapesUpdatedAt = shAt3;
      if (typeof d.shapeId === 'string' && stickerShapeById(d.shapeId)) state.sticker.shapeId = d.shapeId;
    }
  }

  /* 지금 판(10칸)도 같이 맞춰요 — 아내 폰에서 붙인 스티커가 아이 화면에도 보이게 */
  var boardTouched = false;
  if (Object.prototype.toString.call(d.board) === '[object Array]') {
    var bAt = Number(d.boardUpdatedAt) || 0;
    var myAt = Number(state.sticker.boardUpdatedAt) || 0;
    var blist = [];
    var cilist = [];
    var rIcons = (Object.prototype.toString.call(d.boardIcons) === '[object Array]') ? d.boardIcons : [];
    for (var b0 = 0; b0 < d.board.length && b0 < 30; b0++) {
      if (typeof d.board[b0] === 'string') {
        blist.push(d.board[b0]);
        cilist.push(typeof rIcons[b0] === 'string' ? rIcons[b0].slice(0, 24) : '');
      }
    }
    /* 구름 판이 더 새로울 때만 (내 기기에서 방금 붙인 판을 덮어쓰지 않게) */
    var takeBoard = bAt > clr && bAt > myAt;
    if (!takeBoard && !bAt && !myAt && blist.length && !state.sticker.stickers.length) takeBoard = true;
    if (takeBoard) {
      state.sticker.stickers = blist;
      state.sticker.icons = cilist;
      state.sticker.boardUpdatedAt = bAt || Date.now();
      if (blist.length > state.sticker.slots) state.sticker.slots = Math.min(30, blist.length);
      freshIdx = -1;
      boardTouched = true;
    }
  }

  var seen = {};
  for (var a = 0; a < state.stickerLog.length; a++) {
    var e0 = state.stickerLog[a];
    seen[e0.t + '|' + (e0.e || '') + '|' + (e0.r || '')] = true;
  }
  var merged = state.stickerLog.slice(0);
  var logAdded = 0;
  if (Object.prototype.toString.call(d.log) === '[object Array]') {
    for (var j = 0; j < d.log.length && j < 4000; j++) {
      var le = d.log[j] || {};
      if (!le.t) continue;
      if (Number(le.t) <= clr) continue;
      var kk = le.t + '|' + (le.e || '') + '|' + (le.r || '');
      if (seen[kk]) continue;
      seen[kk] = true;
      merged.push({
        d: (typeof le.d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(le.d)) ? le.d : dateKey(new Date(Number(le.t))),
        t: Number(le.t), e: le.e || '⭐️', r: le.r || '', s: (typeof le.s === 'string') ? le.s.slice(0, 24) : ''
      });
      logAdded += 1;
    }
  }
  merged.sort(function (x, y) { return x.t - y.t; });
  state.stickerLog = merged;

  /* 판을 다 채워 새 판으로 넘어간 기록도 같이 받아요 */
  if (Object.prototype.toString.call(d.boardLog) === '[object Array]') {
    var bseen = {};
    for (var x = 0; x < state.boardLog.length; x++) {
      var bx = state.boardLog[x];
      bseen[(Number(bx.t) || 0) + '|' + (parseInt(bx.slots, 10) || 0)] = true;
    }
    for (var y = 0; y < d.boardLog.length && y < 500; y++) {
      if (state.boardLog.length >= 2000) break;
      var be = d.boardLog[y] || {};
      var bbt = Number(be.t) || 0;
      if (!bbt || bbt <= clr) continue;
      var bkey = bbt + '|' + (parseInt(be.slots, 10) || 0);
      if (bseen[bkey]) continue;
      bseen[bkey] = true;
      state.boardLog.push({
        d: (typeof be.d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(be.d)) ? be.d : dateKey(new Date(bbt)),
        t: bbt,
        slots: Math.max(0, parseInt(be.slots, 10) || 0),
        goal: (typeof be.goal === 'string') ? be.goal : ''
      });
      boardTouched = true;
    }
    if (boardTouched) state.boardLog.sort(function (q, w) { return q.t - w.t; });
  }

  /* ---- 스티커 사용 내역: 겹침 정리 · 삭제 반영 ---- */
  var spendsChanged = false;
  if (!state.deletedSpends || typeof state.deletedSpends !== 'object') state.deletedSpends = {};
  if (mergeSpendDeletions(d.deletedSpends)) spendsChanged = true;

  var cloudSpends = [];
  var isCloudList = (Object.prototype.toString.call(d.spends) === '[object Array]');
  if (isCloudList) {
    for (var c = 0; c < d.spends.length && c < 2000; c++) {
      var se = d.spends[c] || {};
      if (!se.t || !se.count) continue;
      if (Number(se.t) <= clr) continue;
      var sid = (typeof se.id === 'string' && se.id) ? se.id : spendFixedId(se.t, se.count);
      cloudSpends.push({
        id: sid,
        d: (typeof se.d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(se.d)) ? se.d : dateKey(new Date(Number(se.t))),
        t: Number(se.t),
        item: (typeof se.item === 'string' ? se.item : '').slice(0, 40),
        count: Math.max(1, parseInt(se.count, 10) || 1),
        amount: Math.max(0, parseInt(se.amount, 10) || 0),
        by: (typeof se.by === 'string') ? se.by : ''
      });
    }
  }
  var cloudIds = {}, cloudSigs = {}, cloudBySig = {};
  for (var cc = 0; cc < cloudSpends.length; cc++) {
    var csig = spendSig(cloudSpends[cc]);
    cloudIds[cloudSpends[cc].id] = true;
    cloudSigs[csig] = true;
    if (!cloudBySig[csig]) cloudBySig[csig] = cloudSpends[cc];
  }

  /* 1) 다른 기기에서 지운 기록은 여기서도 지워요 */
  var keptSpends = [];
  for (var p0 = 0; p0 < state.stickerSpends.length; p0++) {
    if (spendDeleted(state.stickerSpends[p0], state.deletedSpends)) { spendsChanged = true; continue; }
    /* 같은 기록인데 이름표만 다르면 구름의 원래 이름표로 맞춰요 */
    var psig = spendSig(state.stickerSpends[p0]);
    var pmatch = cloudBySig[psig];
    if (pmatch && pmatch.id && pmatch.id !== state.stickerSpends[p0].id && !cloudIds[state.stickerSpends[p0].id]) {
      state.stickerSpends[p0].id = pmatch.id;
      spendsChanged = true;
    }
    keptSpends.push(state.stickerSpends[p0]);
  }
  state.stickerSpends = keptSpends;

  /* 2) 이름표만 달라 겹친 같은 기록은 하나로 (구름의 원래 이름표를 남김) */
  if (dedupeSpends(cloudIds)) spendsChanged = true;

  /* 3) 구름에 있는 기록 중 이 기기에 없는 것은 더해요 */
  var hasId = {}, hasSig = {};
  for (var hs = 0; hs < state.stickerSpends.length; hs++) {
    hasId[state.stickerSpends[hs].id] = true;
    hasSig[spendSig(state.stickerSpends[hs])] = true;
  }
  for (var ca = 0; ca < cloudSpends.length; ca++) {
    var ce = cloudSpends[ca];
    if (hasId[ce.id] || hasSig[spendSig(ce)]) continue;
    if (spendDeleted(ce, state.deletedSpends)) continue;
    state.stickerSpends.push(ce);
    hasId[ce.id] = true;
    hasSig[spendSig(ce)] = true;
    spendsChanged = true;
  }

  /* 4) 이 기기에서 이미 저장소에 올렸던 기록이 구름에서 사라졌으면(다른 기기에서 삭제)
        이 기기에서도 지워요. 아직 올린 적 없는 기록은 건드리지 않아요. */
  var syncedAt = Number(state.spendSyncAt) || 0;
  if (isCloudList && syncedAt && !(cloud && cloud.dirty && cloud.dirty.stickers)) {
    var leftSpends = [];
    for (var rs = 0; rs < state.stickerSpends.length; rs++) {
      var rsp = state.stickerSpends[rs];
      if (!cloudSigs[spendSig(rsp)] && (Number(rsp.t) || 0) < syncedAt) { spendsChanged = true; continue; }
      leftSpends.push(rsp);
    }
    state.stickerSpends = leftSpends;
  }
  if (spendsChanged) {
    try { renderStickers(); } catch (e7) { /* 무시 */ }
    try { refreshAcctStickerPane(); } catch (e8) { /* 무시 */ }
    try {
      var stm = document.getElementById('statsModal');
      if (stm && !stm.hidden) renderStats();
    } catch (e9) { /* 무시 */ }
  }
  if (d.total != null) {
    var tt = parseInt(d.total, 10);
    if (!isNaN(tt)) state.stats.stickersTotal = Math.max(stickerTotal(), tt, state.stickerLog.length);
  }

  /* 다른 기기에서 붙인 스티커의 코인을 이 계정에도 (한 장에 한 번) */
  if (logAdded) {
    try { creditStickerLogCoins(opts.notify !== true); } catch (e) { /* 무시 */ }
  }
  if (boardTouched) {
    try { renderStickers(); } catch (e5) { /* 무시 */ }
    try { refreshAcctStickerPane(); } catch (e6) { /* 무시 */ }
  }
  return true;
}

function applyDayPayload(d, key) {
  if (!d || !d.date) return false;
  key = d.date;
  if (d.checks && typeof d.checks === 'object') state.checks[key] = d.checks;
  var entry = null;
  if (d.pct != null) entry = cleanHistEntry({ d: d.d, t: d.t, pct: d.pct, cats: d.cats });
  if (entry) state.history[key] = entry;
  else if (state.checks[key]) { snapshotDay(key); }
  if (entry && typeof d.updatedAt === 'string') {
    if (!state.dayUpdated) state.dayUpdated = {};
    state.dayUpdated[key] = d.updatedAt;
  }
  if (Object.prototype.toString.call(d.stickers) === '[object Array]') {
    var keep = [];
    for (var i = 0; i < state.stickerLog.length; i++) if (state.stickerLog[i].d !== key) keep.push(state.stickerLog[i]);
    for (var j = 0; j < d.stickers.length && j < 200; j++) {
      var s = d.stickers[j] || {};
      if (!s.t) continue;
      if (Number(s.t) <= (Number(state.sticker.clearedAt) || 0)) continue;
      keep.push({ d: key, t: Number(s.t), e: (typeof s.e === 'string' && s.e) ? s.e : '⭐️', r: (typeof s.r === 'string') ? s.r.slice(0, 20) : '' });
    }
    state.stickerLog = keep;
  }
  if (Object.prototype.toString.call(d.boards) === '[object Array]') {
    var kb = [];
    for (var b = 0; b < state.boardLog.length; b++) if (state.boardLog[b].d !== key) kb.push(state.boardLog[b]);
    for (var n = 0; n < d.boards.length && n < 50; n++) {
      var bd = d.boards[n] || {};
      if (!bd.t) continue;
      if (Number(bd.t) <= (Number(state.sticker.clearedAt) || 0)) continue;
      kb.push({ d: key, t: Number(bd.t), slots: parseInt(bd.slots, 10) || 0, goal: typeof bd.goal === 'string' ? bd.goal : '' });
    }
    state.boardLog = kb;
  }
  if (d.workbooks && typeof d.workbooks === 'object') {
    state.workbookPicks[key] = cleanPick(d.workbooks);
  }
  if (d.wbItems && typeof d.wbItems === 'object') {
    var itemMap = {};
    for (var iwk in d.wbItems) {
      if (!Object.prototype.hasOwnProperty.call(d.wbItems, iwk)) continue;
      if (typeof iwk !== 'string' || !iwk) continue;
      itemMap[iwk.slice(0, 64)] = cleanPick(d.wbItems[iwk]);
      if (Object.keys(itemMap).length >= 40) break;
    }
    if (!state.workbookItemPicks) state.workbookItemPicks = {};
    state.workbookItemPicks[key] = itemMap;
  }
  if (Object.prototype.toString.call(d.spends) === '[object Array]') {
    var ks = [];
    for (var ss = 0; ss < state.stickerSpends.length; ss++) if (state.stickerSpends[ss].d !== key) ks.push(state.stickerSpends[ss]);
    /* 이 기기에 이미 있는 같은 기록의 이름표를 다시 쓸 수 있게 미리 모아 둬요 */
    var sigId = {};
    for (var s0 = 0; s0 < state.stickerSpends.length; s0++) {
      var lk = spendSig(state.stickerSpends[s0]);
      if (!sigId[lk] && state.stickerSpends[s0].id) sigId[lk] = state.stickerSpends[s0].id;
    }
    var daySeen = {};
    for (var sn = 0; sn < d.spends.length && sn < 200; sn++) {
      var sp = d.spends[sn] || {};
      if (!sp.t || !sp.count) continue;
      if (Number(sp.t) <= (Number(state.sticker.clearedAt) || 0)) continue;
      var one = {
        id: (typeof sp.id === 'string' && sp.id) ? sp.id : '',
        d: key, t: Number(sp.t),
        item: (typeof sp.item === 'string' ? sp.item : '').slice(0, 40),
        count: Math.max(1, parseInt(sp.count, 10) || 1),
        amount: Math.max(0, parseInt(sp.amount, 10) || 0),
        by: (typeof sp.by === 'string') ? sp.by : ''
      };
      var osig = spendSig(one);
      if (daySeen[osig]) continue;
      daySeen[osig] = true;
      /* 날짜 파일에 이름표가 없으면(예전 기록) 고정 이름표 — 이 기기의 이름표가 있으면 그걸 그대로 */
      if (!one.id) one.id = sigId[osig] || spendFixedId(one.t, one.count);
      if (spendDeleted(one, state.deletedSpends)) continue;
      ks.push(one);
    }
    /* 방금 이 기기에서 쓴 기록이 아직 날짜 파일에 안 올라갔으면 지우지 않아요 */
    var dayAtMs = Date.parse(d.updatedAt || '') || 0;
    if (dayAtMs) {
      for (var sl = 0; sl < state.stickerSpends.length; sl++) {
        var loc = state.stickerSpends[sl];
        if (loc.d !== key) continue;
        var lsig = spendSig(loc);
        if (daySeen[lsig]) continue;
        if ((Number(loc.t) || 0) <= dayAtMs) continue;
        if (spendDeleted(loc, state.deletedSpends)) continue;
        daySeen[lsig] = true;
        ks.push(loc);
      }
    }
    state.stickerSpends = ks;
  }
  var dayAt = Date.parse(d.updatedAt || '');
  var wipedAt = Number(state.sticker.clearedAt) || 0;
  var boardAt = Number(state.sticker.boardUpdatedAt) || 0;
  /* 이 날짜 파일의 판이 지금 판보다 오래됐으면(스티커 원장에서 이미 받은 판) 건드리지 않아요 */
  if (key === currentKey && d.board && Object.prototype.toString.call(d.board.stickers) === '[object Array]' &&
      !(wipedAt && dayAt && dayAt < wipedAt) && !(boardAt && (!dayAt || dayAt < boardAt))) {
    var list = [];
    for (var m = 0; m < d.board.stickers.length && m < 30; m++) {
      if (typeof d.board.stickers[m] === 'string') list.push(d.board.stickers[m]);
    }
    state.sticker.stickers = list;
    state.sticker.celebrated = d.board.celebrated === true;
    if (list.length > state.sticker.slots) state.sticker.slots = list.length;
    state.sticker.boardUpdatedAt = dayAt || Date.now();
    freshIdx = -1;
  }
  return true;
}

/* ---- 월간 기록 불러오기 ---- */
async function loadMonth(y, m, force) {
  if (!cloud.conn || !cloud.me) return;
  var mkey = y + '-' + pad2(m + 1);
  if (cloud.months[mkey] && !force) return;
  if (cloud.monthLoading === mkey) return;
  cloud.monthLoading = mkey;
  renderHistory(false);
  var dir = 'data/' + y + '/' + pad2(m + 1);
  var listing = await ghGet(dir);
  if (!listing.ok) {
    cloud.monthLoading = '';
    renderHistory(false);
    setSync(navigator.onLine === false ? 'offline' : 'error');
    return;
  }
  if (listing.missing) {
    cloud.months[mkey] = true;
    cloud.monthLoading = '';
    renderHistory(false);
    return;
  }
  var names = [];
  var list = listing.list || [];
  for (var i = 0; i < list.length; i++) {
    var f = list[i] || {};
    if (f.type === 'file' && /^\d{2}\.json$/.test(f.name || '')) names.push(f.name);
  }
  for (var b = 0; b < names.length; b += 6) {
    var batch = names.slice(b, b + 6);
    var results = await Promise.all(batch.map(function (nm) { return ghGet(dir + '/' + nm); }));
    for (var r = 0; r < results.length; r++) {
      var one = results[r];
      if (one && one.ok && one.data && one.data.date) applyDayPayload(one.data, one.data.date);
    }
  }
  pruneHistory(state);
  cloud.months[mkey] = true;
  cloud.monthLoading = '';
  saveLocalOnly();
  renderHistory(false);
  renderAll();
  var stEl = document.getElementById('statsModal');
  if (stEl && !stEl.hidden) renderStats();
}

/* ---- 로그인 화면 ---- */
function showLogin(mode) {
  var login = document.getElementById('loginScreen');
  var app = document.getElementById('appRoot');
  var lock = document.getElementById('lockScreen');
  splash.on = false;
  if (splash.timer) { window.clearTimeout(splash.timer); splash.timer = 0; }
  if (lock) lock.hidden = true;
  if (login) login.hidden = false;
  if (app) app.hidden = true;
  unlockScroll();
  renderLoginBody(mode || (cloud.conn ? 'login' : 'setup'));
  renderSyncPill();
}

/* 문은 가족 허브(../../home/)예요. 이 화면은 허브로 보내고, 필요하면 여기서 바로 로그인할 수 있어요. */
function gateHtml(mode) {
  var setup = (mode === 'setup');
  return '<div class="lf">' +
    '<p class="lf-note">' + (setup
      ? '아직 이 기기가 저장소에 연결되지 않았어요. 가족 허브에서 한 번만 연결하면 여기서도 바로 이어서 쓸 수 있어요.'
      : '로그인이 필요해요. 가족 허브에서 로그인하면 여기서도 바로 이어서 볼 수 있어요.') + '</p>' +
    '<a class="lf-btn gate-go" href="../home/">🏠 가족 허브로 가기</a>' +
    '<p class="lf-msg" id="loginMsg"></p>' +
    '<button class="lf-link" type="button" data-act="gate-direct" data-mode="' + (setup ? 'setup' : 'login') + '">' +
      (setup ? '이 기기에서 직접 연결하기' : '이 기기에서 바로 로그인') + '</button>' +
    '</div>';
}

function renderLoginBody(mode, direct) {
  var body = document.getElementById('loginBody');
  if (!body) return;
  mode = mode || (cloud.conn ? 'login' : 'setup');
  body.innerHTML = direct ? ((mode === 'setup') ? setupHtml() : loginHtml()) : gateHtml(mode);
  var first = body.querySelector('input');
  if (first) { try { first.focus(); } catch (e) { /* 무시 */ } }
}

function showLoginForm(mode) {
  mode = mode || (cloud.conn ? 'login' : 'setup');
  showLogin(mode);
  renderLoginBody(mode, true);
}

function setupHtml() {
  var c = cloud.conn || connectPrefill || {};
  return '<form class="lf" id="setupForm" autocomplete="off">' +
    '<p class="lf-note">처음 한 번만: 이 기기를 <b>비공개 GitHub 저장소</b>에 연결해요. 토큰은 이 기기 브라우저에만 저장되고 대시보드 파일에는 들어가지 않아요.</p>' +
    '<label>GitHub 아이디<input id="setupOwner" value="' + esc(c.owner || DEFAULT_OWNER) + '" maxlength="39" spellcheck="false"></label>' +
    '<label>데이터 저장소 이름<input id="setupRepo" value="' + esc(c.repo || DEFAULT_REPO) + '" maxlength="100" spellcheck="false"></label>' +
    '<label>GitHub 토큰 (Contents: Read and write)<input id="setupToken" type="password" placeholder="github_pat_…" autocomplete="off" spellcheck="false"></label>' +
    '<div class="lf-row"><label>관리자 비밀번호<input id="setupPw" type="password" maxlength="64" autocomplete="new-password"></label>' +
    '<label>비밀번호 확인<input id="setupPw2" type="password" maxlength="64" autocomplete="new-password"></label></div>' +
    '<p class="lf-hint">저장소에 계정 파일이 없으면 이 비밀번호로 <b>admin(관리자)</b> 계정을 만들어요. 이미 있으면 그냥 로그인 화면으로 넘어가요.</p>' +
    '<button class="lf-btn" id="setupBtn" type="submit">기기 연결하고 시작</button>' +
    '<p class="lf-msg" id="setupMsg"></p>' +
    (cloud.conn ? '<button class="lf-link" type="button" data-act="relink-cancel">로그인 화면으로</button>' : '') +
    '<p class="lf-foot">저장소가 없다면 GitHub에서 비공개 저장소를 만들고, Fine-grained 토큰에 그 저장소의 Contents 권한을 Read and write로 주세요.</p>' +
    '</form>';
}

function loginHtml() {
  var lastId = lsGet(LAST_ID_KEY);
  if (lastId === null || lastId === '') lastId = connectJustDone ? '' : 'admin';
  return '<form class="lf" id="loginForm" autocomplete="on">' +
    '<label>아이디<input id="loginId" name="username" autocomplete="username" value="' + esc(lastId) + '" maxlength="24" spellcheck="false"></label>' +
    '<label>비밀번호<input id="loginPw" name="password" type="password" autocomplete="current-password" maxlength="64"></label>' +
    '<label class="lf-check"><input type="checkbox" id="loginRemember"' + (lsGet(LAST_REMEMBER_KEY) === '0' ? '' : ' checked') + '><span>로그인 유지 (30일)</span></label>' +
    '<button class="lf-btn" id="loginBtn" type="submit">로그인</button>' +
    '<p class="lf-msg" id="loginMsg"></p>' +
    '<button class="lf-link" type="button" data-act="relink">기기 연결 다시 하기</button>' +
    '<p class="lf-foot">비밀번호를 잊었다면 관리자에게 물어봐 주세요.</p>' +
    '</form>';
}

/* ---- 기기 연결 ---- */
async function doSetup() {
  var owner = fieldVal('setupOwner').trim();
  var repo = fieldVal('setupRepo').trim();
  var token = fieldVal('setupToken').trim();
  var pw = fieldVal('setupPw');
  var pw2 = fieldVal('setupPw2');
  var msg = document.getElementById('setupMsg');
  function fail(t) { if (msg) { msg.className = 'lf-msg'; msg.textContent = t; } }

  if (!owner || !repo || !token) return fail('GitHub 아이디, 저장소 이름, 토큰을 모두 넣어 주세요.');
  if (!/^[A-Za-z0-9-]{1,39}$/.test(owner)) return fail('GitHub 아이디 형식을 확인해 주세요.');
  if (!/^[A-Za-z0-9._-]{1,100}$/.test(repo)) return fail('저장소 이름 형식을 확인해 주세요.');
  if (!/^(gh[pousr]_|github_pat_)/.test(token)) return fail('GitHub 토큰 형식이 아니에요. (github_pat_… 로 시작해요)');

  var btn = document.getElementById('setupBtn');
  if (btn) { btn.disabled = true; btn.textContent = '연결하는 중…'; }
  var prev = cloud.conn;
  cloud.conn = { owner: owner, repo: repo, token: token, branch: 'main', at: Date.now() };
  try {
    var res = await window.fetch(API_BASE + '/repos/' + owner + '/' + repo, { headers: ghHeaders(token), cache: 'no-store' });
    if (res.status === 401) { cloud.conn = prev; return fail('토큰이 올바르지 않아요. 다시 확인해 주세요.'); }
    if (res.status === 404) { cloud.conn = prev; return fail('저장소를 찾을 수 없어요. 아이디·저장소 이름과 토큰이 그 저장소를 포함하는지 확인해 주세요.'); }
    if (res.status === 403) { cloud.conn = prev; return fail('토큰에 저장소 접근 권한이 없어요. Fine-grained 토큰의 Contents를 Read and write로 주세요.'); }
    if (!res.ok) { cloud.conn = prev; return fail('저장소를 확인하지 못했어요. (HTTP ' + res.status + ')'); }
    var info = await res.json();
    if (info && info.private === false) { cloud.conn = prev; return fail('비공개(private) 저장소만 연결할 수 있어요. GitHub에서 저장소를 Private로 바꿔 주세요.'); }
    if (info && info.permissions && info.permissions.push === false) {
      cloud.conn = prev;
      return fail('이 토큰에는 쓰기 권한이 없어요. Contents 권한을 Read and write로 바꿔 주세요.');
    }

    cloud.sha = loadShaCache();
    cloud.months = {};
    var cur = await ghGet('config/users.json');
    if (!cur.ok && cur.status !== 404 && cur.missing !== true) { cloud.conn = prev; return fail('계정 파일을 확인하지 못했어요. (' + (cur.error || '') + ')'); }

    if (cur.ok && cur.data && Object.prototype.toString.call(cur.data.users) === '[object Array]') {
      cloud.users = cur.data;
      saveUsersCache(cur.data);
      if (!cur.data.users.length) {
        if (pw.length < 4) { cloud.conn = prev; return fail('관리자 비밀번호를 4자 이상으로 정해 주세요.'); }
        if (pw !== pw2) { cloud.conn = prev; return fail('비밀번호 확인이 맞지 않아요.'); }
        var salt0 = randomHex(16);
        var users0 = { version: 1, updatedAt: new Date().toISOString(), users: [{ id: 'admin', name: '관리자', role: 'admin', salt: salt0, hash: await hashPassword(pw, salt0), createdAt: new Date().toISOString() }] };
        var put0 = await ghPut('config/users.json', users0, '관리자 계정 만들기');
        if (!put0.ok) { cloud.conn = prev; return fail('계정 파일을 만들지 못했어요. (' + (put0.error || '') + ')'); }
        cloud.users = users0;
        saveUsersCache(users0);
      }
    } else if (cur.ok && cur.missing) {
      if (pw.length < 4) { cloud.conn = prev; return fail('관리자 비밀번호를 4자 이상으로 정해 주세요.'); }
      if (pw !== pw2) { cloud.conn = prev; return fail('비밀번호 확인이 맞지 않아요.'); }
      var salt = randomHex(16);
      var users = { version: 1, updatedAt: new Date().toISOString(), users: [{ id: 'admin', name: '관리자', role: 'admin', salt: salt, hash: await hashPassword(pw, salt), createdAt: new Date().toISOString() }] };
      var put = await ghPut('config/users.json', users, '관리자 계정 만들기');
      if (!put.ok) { cloud.conn = prev; return fail('계정 파일을 만들지 못했어요. (' + (put.error || '') + ')'); }
      cloud.users = users;
      saveUsersCache(users);

      var stRes = await ghGet('config/settings.json');
      if (stRes.ok && stRes.missing) await ghPut('config/settings.json', settingsPayload(), '대시보드 설정 만들기');
    }

    saveDevice(cloud.conn);
    clearSession(); /* 기기를 다시 연결했으면 다시 로그인 */
    cloud.lastSig = settingsSignature();
    setSync('ok');
    showLoginForm('login');
    var lm = document.getElementById('loginMsg');
    if (lm) { lm.className = 'lf-msg ok'; lm.textContent = '기기 연결 완료! 아이디와 비밀번호로 로그인해 주세요.'; }
  } catch (e) {
    cloud.conn = prev;
    fail('연결에 실패했어요. 인터넷 연결과 토큰을 확인해 주세요.');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '기기 연결하고 시작'; }
  }
}

/* ---- 로그인 ---- */
async function doLogin() {
  var id = fieldVal('loginId').trim().toLowerCase();
  var pw = fieldVal('loginPw');
  var rememberEl = document.getElementById('loginRemember');
  var remember = rememberEl ? !!rememberEl.checked : true;
  var msg = document.getElementById('loginMsg');
  function fail(t) { if (msg) { msg.className = 'lf-msg'; msg.textContent = t; } }
  if (!id || !pw) return fail('아이디와 비밀번호를 넣어 주세요.');
  if (!cloud.conn) { renderLoginBody('setup', true); return; }

  var btn = document.getElementById('loginBtn');
  if (btn) { btn.disabled = true; btn.textContent = '확인 중…'; }
  try {
    setSync('syncing');
    var fresh = await ghGet('config/users.json');
    if (fresh.ok && fresh.data && Object.prototype.toString.call(fresh.data.users) === '[object Array]') {
      cloud.users = fresh.data;
      saveUsersCache(fresh.data);
    } else if (!fresh.ok && fresh.status !== 404) {
      if (!cloud.users) {
        return fail(navigator.onLine === false ? '오프라인 상태예요. 인터넷에 연결한 뒤 다시 시도해 주세요.' : '계정 정보를 불러오지 못했어요. (' + (fresh.error || '') + ')');
      }
    }
    var users = (cloud.users && cloud.users.users) || [];
    var u = null;
    for (var i = 0; i < users.length; i++) {
      if (String(users[i].id).toLowerCase() === id) { u = users[i]; break; }
    }
    var ok = false;
    if (u && u.salt && u.hash) {
      var hash = await hashPassword(pw, u.salt);
      ok = (hash === u.hash);
    }
    if (!ok) { setSync(navigator.onLine === false ? 'offline' : 'ok'); return fail('아이디 또는 비밀번호가 맞지 않아요.'); }
    lsSet(LAST_ID_KEY, u.id);
    lsSet(LAST_REMEMBER_KEY, remember ? '1' : '0');
    cloud.me = { id: u.id, name: u.name || u.id, role: ROLES[u.role] ? u.role : 'viewer', dashboards: dashboardsFor(u) };
    state.profile = defaultProfile();
    cloud.profileReady = false;
    lastProfileSig = '';
    saveSession(cloud.me, remember, null);
    if (!dashAllowed(cloud.me)) { showLock(); return; }
    await enterDashboard({ splash: true });
  } catch (e) {
    fail('로그인 중 문제가 생겼어요. ' + (e && e.message ? e.message : ''));
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '로그인'; }
  }
}

async function enterDashboard(opts) {
  lsSet(HUB_LAST_KEY, 'kids'); /* 가족 허브(/home/)의 '최근 사용' 표시용 */
  var login = document.getElementById('loginScreen');
  var app = document.getElementById('appRoot');
  var lock = document.getElementById('lockScreen');
  if (lock) lock.hidden = true;
  /* 첫 데이터를 다 받을 때까지 🏠 Jaden's Today 화면을 그대로 보여 줘요
     (오프라인이거나 로컬 전용이면 기다리지 않고 바로 열어요) */
  var wantSplash = !!(opts && opts.splash) && !!cloud.conn && navigator.onLine !== false;
  if (wantSplash) {
    showSplash();
  } else {
    if (login) login.hidden = true;
    if (app) app.hidden = false;
  }
  /* 화면을 보여 주는 순간, 저장된 이름·코인으로 헤더를 먼저 그려요.
     (네트워크 응답을 기다리는 동안 정적 HTML의 '-'가 보이지 않게) */
  try {
    var cachedProf = readProfileCache(cloud.me && cloud.me.id);
    if (cachedProf) state.profile = normalizeProfile(cachedProf, cloud.me && cloud.me.id);
  } catch (e0) { /* 무시 */ }
  renderHeader();
  renderSyncPill();
  applyUserUi();
  setSync('syncing');
  cloud.months = {};
  cloud.profileReady = false;
  /* 이 기지가 이미 갖고 있던 스티커 — 새로 받아 온 스티커와 가르는 기준선이에요 */
  stickerCoinBootAt = 0;
  for (var bm = 0; bm < state.stickerLog.length; bm++) {
    var bt0 = Number(state.stickerLog[bm] && state.stickerLog[bm].t) || 0;
    if (bt0 > stickerCoinBootAt) stickerCoinBootAt = bt0;
  }

  var sres = await ghGet('config/settings.json');
  if (sres.ok && sres.data) {
    applySettingsPayload(sres.data);
    cloud.lastSig = settingsSignature();
    saveLocalOnly();
    /* 🎯 특별 미션·⚡ 역할 카드를 처음 넣은 기기는 가족 설정에도 바로 저장해요 */
    if (!(sres.data.settings && sres.data.settings.missionsSeeded === 1)) {
      try { scheduleSync('settings'); } catch (eMig) { /* 무시 */ }
    }
  }

  var kres = await ghGet('config/stickers.json');
  if (kres.ok && kres.data) applyStickersPayload(kres.data);

  var dres = await ghGet(dayPath(currentKey));
  if (dres.ok && dres.data && dres.data.date === currentKey) {
    var cloudAt = String(dres.data.updatedAt || '');
    var localAt = String((state.dayUpdated && state.dayUpdated[currentKey]) || '');
    var hasLocal = !!state.history[currentKey];
    if (hasLocal && localAt && (!cloudAt || localAt > cloudAt)) {
      cloud.dirty.day = true;
    } else {
      applyDayPayload(dres.data, currentKey);
    }
  } else if (dres.ok && dres.missing && state.history[currentKey]) {
    cloud.dirty.day = true;
  }

  await loadProfile();
  try { creditStickerLogCoins(true); } catch (e5) { /* 무시 */ }
  saveLocalOnly();
  renderAll();
  try { loadPokePack(); } catch (e6) { /* 포켓몬 그림 팩은 있어도 없어도 괜찮아요 */ }
  try { loadSoundPack(); } catch (e7) { /* 알림음 원본은 있어도 없어도 괜찮아요 */ }
  applyPermissions();
  setSync(navigator.onLine === false ? 'offline' : 'ok');
  if (cloud.dirty.day) scheduleSync('day');
  /* 로그인하면 구름에 날씨를 저장하거나 구름 날씨를 대신 읽을 수 있으니 한 번 더 확인해요 */
  try {
    if (weather.status !== 'ok' || !weatherCloudAt) loadWeather();
  } catch (e) { /* 무시 */ }
  /* 엄마·아빠가 보낸 코인 용돈이 있으면 축하 알림을 띄워요 */
  try { maybeAllowanceNotice(); } catch (e) { /* 무시 */ }
  if (wantSplash) endSplash();
}

async function doLogout(silent) {
  clearSession(); /* 새로고침해도 자동 로그인되지 않도록 즉시 세션 삭제 */
  try {
    if (!silent && cloud.conn && cloud.me && (cloud.dirty.day || cloud.dirty.settings || cloud.dirty.stickers || cloud.dirty.profile)) await flushSync();
  } catch (e) { /* 무시 */ }
  saveProfileLocal();
  cloud.me = null;
  cloud.dirty.day = false;
  cloud.dirty.settings = false;
  cloud.dirty.stickers = false;
  cloud.dirty.profile = false;
  state.profile = defaultProfile();
  cloud.profileReady = false;
  lastProfileSig = '';
  cloud.lastProfileSig = '';
  if (cloud.timer) { window.clearTimeout(cloud.timer); cloud.timer = 0; }
  ui.editing = false;
  closeHistory();
  closeAccounts();
  showLogin('login');
}

/* ---- 저장된 세션으로 자동 로그인 ---- */
function findUserById(id) {
  var users = (cloud.users && cloud.users.users) || [];
  var key = String(id || '').toLowerCase();
  for (var i = 0; i < users.length; i++) {
    if (String(users[i].id).toLowerCase() === key) return users[i];
  }
  return null;
}

/* ---- 새 기기 연결 링크 (#connect=…) ---- */
var connectPrefill = null;
var connectJustDone = false;

function b64urlEncodeUtf8(str) {
  return b64encodeUtf8(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlDecodeUtf8(s) {
  var t = String(s || '').replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '');
  while (t.length % 4) t += '=';
  return b64decodeUtf8(t);
}
/* 새 기기 연결 링크는 가족 허브(/home/)의 로그인 화면으로 보내요 */
function homePortalUrl() {
  try { return new URL('../../home/', window.location.href).href.replace(/[?#].*$/, ''); }
  catch (e) { return 'https://jadenfamily.github.io/home/'; }
}

function buildConnectLink() {
  var c = cloud.conn;
  if (!c || !c.owner || !c.repo || !c.token) return '';
  var payload = { owner: c.owner, repo: c.repo, token: c.token, branch: c.branch || 'main' };
  return homePortalUrl() + '#connect=' + b64urlEncodeUtf8(JSON.stringify(payload));
}

function showToast(text, asHtml, ms) {
  var el = document.getElementById('dashToast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'dashToast';
    el.className = 'toast';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  if (asHtml) el.innerHTML = text; else el.textContent = text;
  el.classList.add('show');
  if (showToast.timer) window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(function () { el.classList.remove('show'); }, ms || 2800);
}

function copyText(text) {
  return new Promise(function (resolve) {
    function legacy() {
      var ok = false;
      try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.top = '0';
        ta.style.left = '0';
        ta.style.width = '1px';
        ta.style.height = '1px';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        try { ta.setSelectionRange(0, text.length); } catch (e) { /* 무시 */ }
        try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
        document.body.removeChild(ta);
      } catch (e) { ok = false; }
      resolve(!!ok);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        navigator.clipboard.writeText(text).then(function () { resolve(true); }, legacy);
        return;
      } catch (e) { /* 아래 fallback */ }
    }
    legacy();
  });
}

async function copyConnectLink() {
  if (!can('accounts')) return;
  var link = buildConnectLink();
  if (!link) {
    acct.link = '';
    acct.msg = '이 기기의 연결 정보가 없어 링크를 만들 수 없어요. 기기를 다시 연결한 뒤 시도해 주세요.';
    renderAccounts();
    return;
  }
  var ok = await copyText(link);
  acct.msg = '';
  acct.link = ok ? '' : link;
  renderAccounts();
  if (ok) showToast('연결 링크를 복사했어요! 가족에게 보내주세요.');
  else showToast('자동 복사가 안 돼요. 아래 링크를 길게 눌러 복사해 주세요.');
}

function takeConnectHash() {
  var hash = String(window.location.hash || '');
  if (hash.indexOf('#connect=') !== 0) return null;
  var encoded = hash.slice(9);
  /* 주소창에서 토큰이 보이지 않도록 바로 지워요 */
  try {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  } catch (e) {
    try { window.location.hash = ''; } catch (e2) { /* 무시 */ }
  }
  return encoded;
}

function parseConnectPayload(encoded) {
  var tries = [String(encoded || '')];
  try {
    var dec = decodeURIComponent(tries[0]);
    if (dec !== tries[0]) tries.push(dec);
  } catch (e) { /* 무시 */ }
  for (var i = 0; i < tries.length; i++) {
    try {
      var obj = JSON.parse(b64urlDecodeUtf8(tries[i]));
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) return obj;
    } catch (e) { /* 다음 시도 */ }
  }
  return null;
}

function showConnectProgress(text) {
  var login = document.getElementById('loginScreen');
  var app = document.getElementById('appRoot');
  if (login) login.hidden = false;
  if (app) app.hidden = true;
  unlockScroll();
  var body = document.getElementById('loginBody');
  if (body) {
    body.innerHTML = '<div class="lf">' +
      '<p class="lf-note">🔗 새 기기를 연결하는 중이에요. 잠시만 기다려 주세요…</p>' +
      '<p class="lf-msg" id="connectMsg">' + esc(text || '') + '</p>' +
      '</div>';
  }
  renderSyncPill();
}

function connectFail(msg) {
  showLoginForm('setup');
  var m = document.getElementById('setupMsg');
  if (m) { m.className = 'lf-msg'; m.textContent = msg; }
}

async function applyConnectLink(encoded) {
  showConnectProgress();
  var data = parseConnectPayload(encoded);
  if (!data) return connectFail('연결 링크가 올바르지 않아요. 관리자 기기에서 링크를 다시 복사해 열어 주세요.');

  var owner = String(data.owner == null ? '' : data.owner).trim();
  var repo = String(data.repo == null ? '' : data.repo).trim();
  var token = String(data.token == null ? '' : data.token).trim();
  var branch = String(data.branch == null ? '' : data.branch).trim() || 'main';
  connectPrefill = { owner: owner, repo: repo };

  if (!owner || !repo || !token) return connectFail('연결 링크에 필요한 정보가 빠져 있어요. 관리자 기기에서 링크를 다시 복사해 주세요.');
  if (!/^[A-Za-z0-9-]{1,39}$/.test(owner)) return connectFail('연결 링크의 GitHub 아이디 형식이 올바르지 않아요. 링크를 다시 복사해 주세요.');
  if (!/^[A-Za-z0-9._-]{1,100}$/.test(repo)) return connectFail('연결 링크의 저장소 이름 형식이 올바르지 않아요. 링크를 다시 복사해 주세요.');
  if (!/^(gh[pousr]_|github_pat_)/.test(token)) return connectFail('연결 링크의 토큰 형식이 올바르지 않아요. 관리자 기기에서 링크를 다시 복사해 주세요.');
  if (!/^[A-Za-z0-9._\/-]{1,120}$/.test(branch)) branch = 'main';

  if (navigator.onLine === false) return connectFail('인터넷에 연결되어 있지 않아요. 연결한 뒤 링크를 다시 열어 주세요.');

  var prev = cloud.conn;
  cloud.conn = { owner: owner, repo: repo, token: token, branch: branch, at: Date.now() };
  try {
    var res = await window.fetch(API_BASE + '/repos/' + encodeURIComponent(owner) + '/' + encodeURIComponent(repo), { headers: ghHeaders(token), cache: 'no-store' });
    if (res.status === 401) { cloud.conn = prev; return connectFail('연결 링크의 토큰이 올바르지 않아요. 관리자에게 새 링크를 받아 주세요.'); }
    if (res.status === 404) { cloud.conn = prev; return connectFail('연결 링크의 저장소를 찾을 수 없어요. 관리자에게 새 링크를 받아 주세요.'); }
    if (res.status === 403) { cloud.conn = prev; return connectFail('연결 링크의 토큰에 저장소 접근 권한이 없어요. 관리자에게 새 링크를 받아 주세요.'); }
    if (!res.ok) { cloud.conn = prev; return connectFail('저장소를 확인하지 못했어요. (HTTP ' + res.status + ') 관리자에게 새 링크를 받아 주세요.'); }
    var info = await res.json();
    if (info && info.private === false) { cloud.conn = prev; return connectFail('연결 링크가 가리키는 저장소가 비공개가 아니에요. 관리자에게 새 링크를 받아 주세요.'); }
    if (info && info.permissions && info.permissions.push === false) { cloud.conn = prev; return connectFail('연결 링크의 토큰에 쓰기 권한이 없어요. 관리자에게 새 링크를 받아 주세요.'); }

    cloud.sha = loadShaCache() || {};
    cloud.months = {};
    var cur = await ghGet('config/users.json');
    if (!cur.ok) { cloud.conn = prev; return connectFail('계정 정보를 불러오지 못했어요. (' + (cur.error || '') + ') 관리자에게 새 링크를 받아 주세요.'); }
    if (!(cur.data && Object.prototype.toString.call(cur.data.users) === '[object Array]')) {
      cloud.conn = prev;
      return connectFail('이 저장소에는 아직 계정이 없어요. 관리자 기기에서 계정을 먼저 만든 뒤 새 링크를 받아 주세요.');
    }

    cloud.users = cur.data;
    saveUsersCache(cur.data);
    cloud.conn.at = Date.now();
    saveDevice(cloud.conn);
    clearSession(); /* 새로 연결했으면 이전 로그인은 지우고 아이디·비밀번호로 다시 받아요 */
    cloud.lastSig = settingsSignature();
    connectJustDone = true;
    setSync('ok');
    showLoginForm('login');
    var lm = document.getElementById('loginMsg');
    if (lm) { lm.className = 'lf-msg ok'; lm.textContent = '기기가 자동으로 연결됐어요! 아이디와 비밀번호로 로그인해 주세요.'; }
  } catch (e) {
    cloud.conn = prev;
    connectFail('연결하지 못했어요. 인터넷 연결을 확인한 뒤 링크를 다시 열어 주세요.');
  }
}

function initAuth() {
  cloud.conn = loadDevice();
  cloud.users = loadUsersCache();
  cloud.sha = loadShaCache() || {};
  cloud.lastSig = settingsSignature();
  loadPokeCache();   /* 지난번에 받아 둔 포켓몬 그림이 있으면 먼저 쓰고, 로그인 뒤에 새로 확인해요 */
  renderSyncPill();

  /* 새 기기 연결 링크(#connect=…)로 들어왔으면 토큰 입력 없이 바로 연결해요 */
  var connectPayload = takeConnectHash();
  if (connectPayload !== null) {
    applyConnectLink(connectPayload);
    return;
  }

  var sess = cloud.conn ? loadSession() : null;
  if (!cloud.conn) {
    clearSession();
    showLogin('setup');
    return;
  }
  if (!sess) {
    showLogin('login');
    return;
  }
  /* 유효한 세션이 있으면 로그인 화면 없이 바로 이어서 사용 */
  restoreSession(sess);
}
