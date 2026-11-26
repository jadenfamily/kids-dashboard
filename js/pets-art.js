/* ============================================================================
   Jaden's Today v2 — js/pets-art.js
   몬스터 종족 데이터 · 18속성 그림 · 그림 팩
   · 원본 index.html(운영본)의 같은 코드를 기능별로 나눈 파일입니다. 동작은 원본과 같아요.
   · 모듈끼리 같은 전역 스코프를 써요. index.html 에서 core → sync → ... 순서로 불러옵니다.
   ============================================================================ */
'use strict';

/* 18속성 × 3종 = 54종 (각 3단계 진화 → 162가지 모습). 이름은 모두 우리가 지은 것. */
var SPECIES_SEED = {
  normal: [['몽글', '몽글이', '몽글룡'], ['모찌햄찌', '황금볼햄찌', '왕관햄찌'], ['구름', '구름이', '구름제왕']],
  fire: [['콩이', '불콩', '화르르'], ['숯돌', '숯돌이', '용암룡'], ['홍염', '홍염아', '불새왕']],
  water: [['방울', '물방울', '파도링'], ['조개', '조개미', '진주룡'], ['심해', '심해룡', '해룡왕']],
  grass: [['새싹', '잎새', '나무룡'], ['풀잎', '풀잎이', '덩굴룡'], ['꽃망', '꽃망울', '꽃제왕']],
  electric: [['찌릿', '번쩍', '뇌룡'], ['건전지', '건전이', '발전룡'], ['번개', '번개날', '뇌전왕']],
  ice: [['고드름', '얼음이', '빙룡'], ['눈송', '눈송이', '설인룡'], ['한파', '한파아', '빙하왕']],
  fighting: [['주먹이', '힘센손', '투혼룡'], ['꼬마킥', '돌려차기', '격투왕'], ['장갑', '철권이', '무투룡']],
  poison: [['방긋', '독방울', '맹독룡'], ['버섯', '버섯이', '포자룡'], ['독니', '독니아', '맹독왕']],
  ground: [['흙돌이', '모래언덕', '대지룡'], ['두더지', '두더룡', '땅굴왕'], ['사막', '사막이', '황야룡']],
  flying: [['솜깃', '날개콩', '천공룡'], ['참새', '참새콩', '하늘날개'], ['바람', '바람이', '폭풍룡']],
  psychic: [['반짝', '눈빛이', '초능룡'], ['꿈돌', '꿈돌이', '몽환룡'], ['별눈', '별눈이', '초월룡']],
  bug: [['꼬물', '꼬물이', '갑옷룡'], ['애벌', '애벌레', '나비룡'], ['딱정', '딱정이', '왕벌레']],
  rock: [['돌멩', '바위콩', '암석룡'], ['자갈', '자갈이', '화강룡'], ['수정', '수정이', '보석룡']],
  ghost: [['깜깜', '그림자', '유령룡'], ['촛불', '촛불이', '저승룡'], ['망령', '망령이', '사신룡']],
  dragon: [['꼬리', '비늘콩', '용왕룡'], ['알룡', '날개룡', '비룡'], ['황금', '황금룡', '신룡왕']],
  dark: [['심술', '까칠이', '암흑룡'], ['그늘', '그늘이', '밤그림자'], ['월식', '월식아', '암야왕']],
  steel: [['나사', '철컥이', '강철룡'], ['톱니', '톱니바퀴', '기계룡'], ['합금', '합금이', '철갑왕']],
  fairy: [['별사탕', '요정이', '페어룡'], ['솜사탕', '솜사탕이', '마법룡'], ['달빛', '달빛이', '여왕룡']]
};

PET_SPECIES = (function () {
  var out = [];
  for (var i = 0; i < PET_TYPES.length; i++) {
    var t = PET_TYPES[i];
    var seeds = SPECIES_SEED[t.id] || [];
    for (var k = 0; k < 3; k++) {
      var names = seeds[k] || [(t.label + (k + 1)), (t.label + (k + 1) + '이'), (t.label + '왕')];
      var c = t.color;
      if (k === 1) c = mixHex(t.color, '#ffffff', 0.24);
      if (k === 2) c = mixHex(t.color, '#33254f', 0.18);
      var isHamster = (t.id === 'normal' && k === 1);
      if (isHamster) { c = '#f2c98f'; }   /* 모찌햄찌는 포근한 황금빛 */
      out.push({
        id: k === 0 ? t.id : (t.id + '_' + (k + 1)),
        type: t.id, typeLabel: t.label, kind: t.label,
        c: c,
        d: isHamster ? '#c99a5e' : shadeColor(c, k === 2 ? -0.42 : -0.32),
        l: isHamster ? '#fff0d6' : shadeColor(c, k === 2 ? 0.56 : 0.78),
        accent: isHamster ? '#ffd166' : (k === 2 ? mixHex(t.color, '#ffd93d', 0.62) : shadeColor(t.color, 0.3)),
        face: isHamster ? 'hamster' : '',
        names: names,
        rarity: k,
        rarityLabel: RARITY[k].label,
        rarityColor: RARITY[k].color,
        shape: (i + k) % 3,     /* 둥근 · 길쭉 · 넓적 */
        pat: (i + k * 2) % 3,   /* 점 · 줄무늬 · 배 무늬 */
        no: i * 3 + k + 1,      /* 도감 번호 */
        desc: t.label + ' 친구'
      });
    }
  }
  return out;
})();

/* ---------------- 포켓몬 12종 ----------------
   이름·속성·희귀도만 화면에 두고, 그림(PNG 36개)은 로그인한 기기만 비공개 저장소의
   그림 팩(assets/pokemon/sprites.json)에서 받아 와 기기에 캐시해요.
   기존 54종(18속성 × 3종)은 그대로 두고 뒤에 이어 붙입니다. */
var POKE_RARITY_IDX = { common: 0, rare: 1, legend: 2, legendary: 2 };
var POKE_LIST = [
  { id: 'pk_pikachu', type: 'electric', rarity: 'rare', names: ['피츄', '피카츄', '라이츄'] },
  { id: 'pk_charmander', type: 'fire', rarity: 'rare', names: ['파이리', '리자드', '리자몽'] },
  { id: 'pk_squirtle', type: 'water', rarity: 'rare', names: ['꼬부기', '어니부기', '거북왕'] },
  { id: 'pk_bulbasaur', type: 'grass', rarity: 'rare', names: ['이상해씨', '이상해풀', '이상해꽃'] },
  { id: 'pk_dratini', type: 'dragon', rarity: 'legend', names: ['미뇽', '신뇽', '망나뇽'] },
  { id: 'pk_gastly', type: 'ghost', rarity: 'common', names: ['고오스', '고우스트', '팬텀'] },
  { id: 'pk_ralts', type: 'psychic', rarity: 'rare', names: ['랄토스', '킬리아', '가디안'] },
  { id: 'pk_sprigatito', type: 'grass', rarity: 'rare', names: ['냐오하', '나로테', '마스카나'] },
  { id: 'pk_fuecoco', type: 'fire', rarity: 'rare', names: ['뜨아거', '악뜨거', '라우드본'] },
  { id: 'pk_mudkip', type: 'water', rarity: 'rare', names: ['물짱이', '늪짱이', '대짱이'] },
  { id: 'pk_piplup', type: 'water', rarity: 'rare', names: ['팽도리', '팽태자', '엠페르트'] },
  { id: 'pk_pidgey', type: 'flying', rarity: 'common', names: ['구구', '피죤', '피죤투'] }
];
(function () {
  for (var pi = 0; pi < POKE_LIST.length; pi++) {
    var pk = POKE_LIST[pi];
    var pt = petTypeInfo(pk.type);
    var prk = POKE_RARITY_IDX[String(pk.rarity || 'rare')];
    if (typeof prk !== 'number') prk = 1;
    var pcl = pt.color;
    PET_SPECIES.push({
      id: pk.id, type: pk.type, typeLabel: pt.label, kind: pt.label,
      c: pcl, d: shadeColor(pcl, -0.32), l: shadeColor(pcl, 0.78), accent: shadeColor(pcl, 0.3),
      names: pk.names.slice(0, 3),
      rarity: prk, rarityLabel: RARITY[prk].label, rarityColor: RARITY[prk].color,
      shape: pi % 3, pat: (pi * 2) % 3,
      no: PET_SPECIES.length + 1,
      poke: 1,
      desc: '포켓몬 친구'
    });
  }
})();

/* ---------------- 포켓몬 그림 팩 (비공개 저장소 → 기기 캐시) ---------------- */
var POKE_KEY = 'kidsDashboard.pokePack.v1';
var POKE_TTL = 12 * 60 * 60 * 1000;   /* 하루 두 번 새로 받아 와요 */
var pokePack = { imgs: null, at: 0, loading: false };

function pokeImg(spId, stage) {
  var id = String(spId || '');
  if (id.indexOf('pk_') !== 0 || !pokePack.imgs) return '';
  var u = pokePack.imgs[id + ':' + Math.max(1, Math.min(3, Number(stage) || 1))];
  return (typeof u === 'string' && u) ? u : '';
}

function loadPokeCache() {
  try {
    var j = JSON.parse(lsGet(POKE_KEY) || 'null');
    if (j && j.imgs && typeof j.imgs === 'object') {
      pokePack.imgs = j.imgs;
      pokePack.at = Number(j.at) || 0;
      return true;
    }
  } catch (e) { /* 무시 */ }
  return false;
}

function savePokeCache(imgs) {
  try {
    lsSet(POKE_KEY, JSON.stringify({ v: 1, at: Date.now(), imgs: imgs }));
    return true;
  } catch (e) {
    /* 기기 저장 공간이 모자라면 이번에 켠 동안만 그림을 쓰고 넘어가요 */
    return false;
  }
}

function takePokePack(data) {
  if (!data || typeof data !== 'object' || !data.images || typeof data.images !== 'object') return 0;
  /* 팩에 적힌 이름과 화면 이름이 다를 수 있으니, 팩 기준으로 이름을 맞춰 둬요 */
  if (Object.prototype.toString.call(data.species) === '[object Array]') {
    for (var si = 0; si < data.species.length; si++) {
      var ps = data.species[si];
      if (!ps || !ps.id || Object.prototype.toString.call(ps.names) !== '[object Array]' || ps.names.length < 3) continue;
      for (var qi = 0; qi < PET_SPECIES.length; qi++) {
        if (PET_SPECIES[qi].id !== ps.id) continue;
        PET_SPECIES[qi].names = [String(ps.names[0]), String(ps.names[1]), String(ps.names[2])];
        break;
      }
    }
  }
  var imgs = {}, n = 0;
  for (var k in data.images) {
    if (!Object.prototype.hasOwnProperty.call(data.images, k)) continue;
    var u = data.images[k];
    if (typeof u !== 'string' || !/^data:image\//.test(u)) continue;
    imgs[k] = u;
    n++;
  }
  if (!n) return 0;
  pokePack.imgs = imgs;
  pokePack.at = Date.now();
  return n;
}

/* 그림을 다 받으면 그림을 쓰는 자리(내 펫·도감·마이룸·목표 바)만 다시 그려요 */
function refreshPokeArt() {
  try { renderPet(); } catch (e) { /* 무시 */ }
  try { renderRoutineTargets(); } catch (e) { /* 무시 */ }
  try { renderTargetBars(); } catch (e) { /* 무시 */ }
  try { renderPetHomeExtra(); } catch (e) { /* 무시 */ }
  try { var rm = document.getElementById('roomModal'); if (rm && !rm.hidden) renderRoom(); } catch (e) { /* 무시 */ }
  try { var pm = document.getElementById('petModal'); if (pm && !pm.hidden) renderPetDex(); } catch (e) { /* 무시 */ }
  try { var sm = document.getElementById('shopModal'); if (sm && !sm.hidden) renderShop(); } catch (e) { /* 무시 */ }
}

async function loadPokePack(force) {
  if (!cloud.conn || pokePack.loading) return false;
  if (!force && pokePack.at && (Date.now() - pokePack.at) < POKE_TTL) return false;
  pokePack.loading = true;
  try {
    var r = await ghGet('assets/pokemon/sprites.json');
    if (r && r.ok && r.data) {
      var n = takePokePack(r.data);
      if (n) {
        savePokeCache(pokePack.imgs);
        refreshPokeArt();
        return true;
      }
    }
  } catch (e) { /* 무시 */ }
  finally { pokePack.loading = false; }
  return false;
}

function speciesById(id) {
  for (var i = 0; i < PET_SPECIES.length; i++) if (PET_SPECIES[i].id === id) return PET_SPECIES[i];
  return PET_SPECIES[0];
}
var SPECIES_MAX = PET_SPECIES.length;

/* ============ 오늘의 친구 (몬스터 키우기) ============ */
function petState() {
  if (!state.pet || typeof state.pet !== 'object') state.pet = defaultPet();
  return state.pet;
}

/* ---- 친구 도감 필터 ---- */
var petFilter = '';

function typeBadgeHtml(sp) {
  var t = petTypeInfo(sp.type);
  return '<span class="type-badge" style="--tc:' + t.color + '">' + esc(t.label) + '</span>';
}

function petSpecies(id) {
  for (var i = 0; i < PET_SPECIES.length; i++) if (PET_SPECIES[i].id === id) return PET_SPECIES[i];
  return PET_SPECIES[0];
}

function petNeed(stage) {
  return (stage >= 0 && stage < 3) ? PET_NEED[stage] : 0;
}

/* ---- 친구 그림(선택): 보호자·관리자가 직접 올린 그림으로 바꿀 수 있어요 ---- */
function petArtUrl(spId, stage) {
  var p = petState();
  if (!p.art || typeof p.art !== 'object') return '';
  var box = p.art[spId];
  if (!box || typeof box !== 'object') return '';
  var u = box[String(stage)];
  return (typeof u === 'string' && u) ? u : '';
}

function petArtSet(spId, stage, url) {
  var p = petState();
  if (!p.art || typeof p.art !== 'object') p.art = {};
  if (!p.art[spId] || typeof p.art[spId] !== 'object') p.art[spId] = {};
  if (url) p.art[spId][String(stage)] = String(url).slice(0, 300000);
  else delete p.art[spId][String(stage)];
}

function petArtOk(u) {
  u = String(u || '');
  if (!u || u.length > 300000) return false;
  return /^https?:\/\//i.test(u) || /^data:image\//i.test(u);
}

function petArt(sp, stage, ratio) {
  var custom = petArtUrl(sp.id, stage);
  if (custom) {
    return '<img class="pet-img" src="' + esc(custom) + '" alt="' + esc(stage === 0 ? '알' : sp.names[stage - 1]) + '" loading="lazy">';
  }
  if (stage === 0) return eggSvgHtml(sp.c, ratio || 0);
  /* 포켓몬 친구는 비공개 그림 팩의 PNG를 그대로 써요 (팩을 아직 못 받았으면 손그림으로) */
  var pim = pokeImg(sp.id, stage);
  if (pim) {
    return '<img class="pet-img poke-img" src="' + esc(pim) + '" alt="' + esc(sp.names[stage - 1] || '') + '" loading="lazy">';
  }
  return monSvg(sp, stage);
}

function petNextEgg(p) {
  var have = {};
  for (var i = 0; i < p.collection.length; i++) have[p.collection[i].id] = 1;
  var left = [];
  for (var j = 0; j < PET_SPECIES.length; j++) if (!have[PET_SPECIES[j].id]) left.push(PET_SPECIES[j].id);
  if (!left.length) left = PET_SPECIES.map(function (s) { return s.id; });
  return left[Math.floor(Math.random() * left.length)];
}

/* ---- 그림 (직접 그린 SVG 캐릭터) ---- */
function eggSvgHtml(color, ratio) {
  var spots = '';
  var pts = [[34, 48, 7], [62, 40, 5.5], [48, 72, 8], [70, 78, 5], [26, 88, 4.5], [54, 22, 4]];
  for (var i = 0; i < pts.length; i++) {
    spots += '<circle cx="' + pts[i][0] + '" cy="' + pts[i][1] + '" r="' + pts[i][2] + '" fill="' + color + '" opacity=".62"/>';
  }
  var crack = '';
  if (ratio > 0.5) {
    crack += '<path d="M32 44 L42 55 L35 65 L46 74" fill="none" stroke="#c9a97c" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" opacity=".8"/>';
  }
  if (ratio > 0.8) {
    crack += '<path d="M70 56 L61 66 L68 74" fill="none" stroke="#c9a97c" stroke-width="2.2" stroke-linecap="round" opacity=".7"/>';
  }
  return '<svg class="egg-svg" viewBox="0 0 100 124" aria-hidden="true">' +
    '<circle cx="50" cy="64" r="45" fill="' + color + '" opacity=".10"/>' +
    '<ellipse cx="50" cy="116" rx="27" ry="6" fill="' + color + '" opacity=".22"/>' +
    '<path d="M50 5C75 5 92 43 92 73c0 26-18 41-42 41S8 99 8 73C8 43 25 5 50 5Z" fill="#fff4e0" stroke="' + color + '" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M24 62c0-24 12-46 26-46 6 0 11 5 15 12-10 3-20 16-24 34Z" fill="#ffffff" opacity=".8"/>' +
    spots + crack + '</svg>';
}

/* 속성 장식 (머리 위) — 18가지 타입별로 다르게 */
function petGlyph(sp) {
  var a = sp.accent, d = sp.d, t = sp.type;
  if (t === 'fire') {
    return '<path d="M50 8C56 17 63 22 58 32C55 28 52 28 50 31C46 27 41 22 50 8Z" fill="' + a + '" stroke="' + d + '" stroke-width="1.6"/>' +
      '<path d="M50 17C53 22 55 25 53 29C51 27 49 27 47 29C45 25 47 21 50 17Z" fill="#fff3b0"/>';
  }
  if (t === 'water') {
    return '<path d="M50 6C57 17 64 23 64 30C64 37 58 41 50 41C42 41 36 37 36 30C36 23 43 17 50 6Z" fill="' + a + '" stroke="' + d + '" stroke-width="1.6"/>' +
      '<ellipse cx="45" cy="29" rx="3.2" ry="5" fill="#fff" opacity=".65"/>';
  }
  if (t === 'grass') {
    return '<path d="M50 36L50 15" stroke="' + d + '" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M50 23C40 23 33 17 33 8C43 8 50 14 50 23Z" fill="' + a + '" stroke="' + d + '" stroke-width="1.4"/>' +
      '<path d="M50 27C60 27 67 21 67 12C57 12 50 18 50 27Z" fill="' + a + '" stroke="' + d + '" stroke-width="1.4"/>';
  }
  if (t === 'electric') {
    return '<path d="M53 6L65 26L54 26L60 44L41 23L52 23Z" fill="' + a + '" stroke="' + d + '" stroke-width="1.6"/>';
  }
  if (t === 'ice') {
    return '<path d="M50 5L61 20L50 35L39 20Z" fill="' + a + '" stroke="' + d + '" stroke-width="1.6"/>' +
      '<path d="M50 11L55 20L50 27L45 20Z" fill="#fff" opacity=".6"/>';
  }
  if (t === 'normal') {
    return '<circle cx="50" cy="24" r="12" fill="' + a + '" stroke="' + d + '" stroke-width="1.8"/>' +
      '<circle cx="45" cy="20" r="3.4" fill="#fff" opacity=".65"/>';
  }
  if (t === 'fighting') {
    return '<rect x="38" y="12" width="24" height="21" rx="8" fill="' + a + '" stroke="' + d + '" stroke-width="1.6"/>' +
      '<path d="M45 21v7M50 21v7M55 21v7" stroke="' + d + '" stroke-width="1.8" stroke-linecap="round"/>';
  }
  if (t === 'poison') {
    return '<path d="M50 8c7 9 13 14 13 21a13 13 0 0 1-26 0c0-7 6-12 13-21Z" fill="' + a + '" stroke="' + d + '" stroke-width="1.6"/>' +
      '<circle cx="44" cy="26" r="3.2" fill="#fff" opacity=".6"/>' +
      '<circle cx="57" cy="19" r="2.4" fill="#fff" opacity=".5"/>';
  }
  if (t === 'ground') {
    return '<path d="M31 35l8-15 7 9 6-12 8 18Z" fill="' + a + '" stroke="' + d + '" stroke-width="1.6"/>' +
      '<path d="M38 41h24" stroke="' + d + '" stroke-width="2.4" stroke-linecap="round" opacity=".6"/>';
  }
  if (t === 'flying') {
    return '<path d="M50 22c-8-11-19-9-21 0 6-2 13 1 21 7Z" fill="' + a + '" stroke="' + d + '" stroke-width="1.5"/>' +
      '<path d="M50 22c8-11 19-9 21 0-6-2-13 1-21 7Z" fill="' + a + '" stroke="' + d + '" stroke-width="1.5"/>';
  }
  if (t === 'psychic') {
    return '<ellipse cx="50" cy="22" rx="13" ry="10" fill="#fff" stroke="' + d + '" stroke-width="1.6"/>' +
      '<circle cx="50" cy="22" r="5" fill="' + a + '"/><circle cx="50" cy="22" r="2" fill="' + d + '"/>';
  }
  if (t === 'bug') {
    return '<path d="M44 28c-6-8-10-11-14-11" fill="none" stroke="' + d + '" stroke-width="2.2" stroke-linecap="round"/>' +
      '<path d="M56 28c6-8 10-11 14-11" fill="none" stroke="' + d + '" stroke-width="2.2" stroke-linecap="round"/>' +
      '<circle cx="30" cy="16" r="3.4" fill="' + a + '"/><circle cx="70" cy="16" r="3.4" fill="' + a + '"/>';
  }
  if (t === 'rock') {
    return '<path d="M33 33l5-14 9 4 6-10 12 11-4 12Z" fill="' + a + '" stroke="' + d + '" stroke-width="1.6"/>' +
      '<path d="M42 23l3 6 4-4" fill="none" stroke="' + d + '" stroke-width="1.6" stroke-linecap="round"/>';
  }
  if (t === 'ghost') {
    return '<path d="M50 6c9 0 15 7 15 15v11c-3-3-6-3-9 0-3-3-6-3-9 0V21C34 13 41 6 50 6Z" fill="' + a + '" stroke="' + d + '" stroke-width="1.6"/>' +
      '<circle cx="45" cy="20" r="2.2" fill="#2c2440"/><circle cx="55" cy="20" r="2.2" fill="#2c2440"/>';
  }
  if (t === 'dragon') {
    return '<path d="M50 4l8 14-8 7-8-7Z" fill="' + a + '" stroke="' + d + '" stroke-width="1.5"/>' +
      '<path d="M37 24l7-7 4 9Z" fill="' + a + '" opacity=".8"/><path d="M63 24l-7-7-4 9Z" fill="' + a + '" opacity=".8"/>';
  }
  if (t === 'dark') {
    return '<path d="M34 32C31 16 44 5 60 7c-9 5-13 12-11 20 2 8-9 12-15 5Z" fill="' + a + '" stroke="' + d + '" stroke-width="1.5"/>' +
      '<circle cx="52" cy="16" r="2" fill="' + d + '"/>';
  }
  if (t === 'steel') {
    return '<circle cx="50" cy="22" r="9" fill="' + a + '" stroke="' + d + '" stroke-width="1.8"/>' +
      '<path d="M50 7v5M50 32v5M35 22h5M60 22h5" stroke="' + d + '" stroke-width="2.8" stroke-linecap="round"/>';
  }
  /* fairy */
  return '<path d="M50 6l3.6 10.8L64 20l-10.4 3.6L50 34l-3.6-10.4L36 20l10.4-3.2Z" fill="' + a + '" stroke="' + d + '" stroke-width="1.3"/>' +
    '<circle cx="32" cy="14" r="2.2" fill="' + a + '"/><circle cx="68" cy="16" r="2" fill="' + a + '"/>';
}

/* stage: 1 아기, 2 1차 진화, 3 2차 진화 */
function monSvg(sp, stage) {
  var c = sp.c, d = sp.d, l = sp.l, a = sp.accent;
  stage = Math.max(1, Math.min(3, stage || 1));
  var rx = stage === 1 ? 21 : (stage === 2 ? 25 : 27);
  var ry = stage === 1 ? 19 : (stage === 2 ? 23 : 25);
  var cy = stage === 1 ? 63 : (stage === 2 ? 61 : 59);
  var s = '<svg viewBox="0 0 100 100" class="mon-svg" aria-hidden="true">';
  s += '<ellipse cx="50" cy="90" rx="' + (rx - 1) + '" ry="4.5" fill="#000" opacity=".08"/>';
  if (stage === 3) {
    s += '<circle cx="50" cy="' + cy + '" r="41" fill="' + a + '" opacity=".14"/>';
    s += '<path d="M18 22l2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" fill="#ffd93d" opacity=".9"/>';
    s += '<path d="M84 34l1.6 4.8 4.8 1.6-4.8 1.6-1.6 4.8-1.6-4.8-4.8-1.6 4.8-1.6Z" fill="#fff3b0"/>';
  }
  if (stage >= 2) {
    s += '<ellipse cx="' + (50 - rx - 3) + '" cy="' + (cy - 2) + '" rx="12" ry="7" fill="' + l + '" stroke="' + d + '" stroke-width="1.6" transform="rotate(-24 ' + (50 - rx - 3) + ' ' + (cy - 2) + ')"/>';
    s += '<ellipse cx="' + (50 + rx + 3) + '" cy="' + (cy - 2) + '" rx="12" ry="7" fill="' + l + '" stroke="' + d + '" stroke-width="1.6" transform="rotate(24 ' + (50 + rx + 3) + ' ' + (cy - 2) + ')"/>';
    s += '<path d="M' + (50 + rx - 5) + ' ' + (cy + ry - 9) + 'q16 6 10 16q-3 5-8 1" fill="none" stroke="' + d + '" stroke-width="4" stroke-linecap="round"/>';
  }
  s += '<ellipse cx="' + (50 - rx * 0.42) + '" cy="' + (cy + ry - 1) + '" rx="7.5" ry="4.2" fill="' + d + '"/>';
  s += '<ellipse cx="' + (50 + rx * 0.42) + '" cy="' + (cy + ry - 1) + '" rx="7.5" ry="4.2" fill="' + d + '"/>';
  s += '<ellipse cx="50" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="' + c + '" stroke="' + d + '" stroke-width="2.6"/>';
  s += '<ellipse cx="50" cy="' + (cy + ry * 0.42) + '" rx="' + (rx * 0.58) + '" ry="' + (ry * 0.4) + '" fill="' + l + '" opacity=".9"/>';
  var ey = cy - 3;
  s += '<ellipse cx="' + (50 - rx * 0.36) + '" cy="' + ey + '" rx="4.3" ry="5" fill="#2c2440"/>';
  s += '<ellipse cx="' + (50 + rx * 0.36) + '" cy="' + ey + '" rx="4.3" ry="5" fill="#2c2440"/>';
  s += '<circle cx="' + (50 - rx * 0.36 + 1.5) + '" cy="' + (ey - 1.8) + '" r="1.6" fill="#fff"/>';
  s += '<circle cx="' + (50 + rx * 0.36 + 1.5) + '" cy="' + (ey - 1.8) + '" r="1.6" fill="#fff"/>';
  s += '<ellipse cx="' + (50 - rx * 0.7) + '" cy="' + (ey + 6) + '" rx="4" ry="2.5" fill="#ff9db4" opacity=".7"/>';
  s += '<ellipse cx="' + (50 + rx * 0.7) + '" cy="' + (ey + 6) + '" rx="4" ry="2.5" fill="#ff9db4" opacity=".7"/>';
  if (stage === 3) {
    s += '<path d="M44 ' + (ey + 6) + 'q6 8 12 0q-6 4-12 0Z" fill="#7a3b2e"/>';
  } else {
    s += '<path d="M45 ' + (ey + 7) + 'q5 5 10 0" fill="none" stroke="#7a3b2e" stroke-width="2.2" stroke-linecap="round"/>';
  }
  if (stage === 3) {
    s += '<path d="M40 ' + (cy - ry - 1) + 'l4-10 6 7 6-7 4 10Z" fill="' + a + '" stroke="' + d + '" stroke-width="1.6"/>';
  } else if (stage === 2) {
    s += '<path d="M' + (50 - rx * 0.62) + ' ' + (cy - ry + 2) + 'l-5-11 9 5Z" fill="' + a + '"/>';
    s += '<path d="M' + (50 + rx * 0.62) + ' ' + (cy - ry + 2) + 'l5-11-9 5Z" fill="' + a + '"/>';
  }
  s += '<g transform="translate(0,10)">' + petGlyph(sp) + '</g>';
  s += '</svg>';
  return s;
}

/* ---- 기운(EXP) 쌓기 & 진화 ---- */
function petPop(n) {
  var vis = document.getElementById('petVisual');
  if (!vis || !n) return;
  var el = document.createElement('span');
  el.className = 'pet-pop';
  el.textContent = (n > 0 ? '+' + n : String(n)) + ' 기운';
  vis.appendChild(el);
  window.setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 1100);
}

function petCollectNow(p) {
  var sp = petSpecies(p.currentEgg);
  var dup = false;
  for (var i = 0; i < p.collection.length; i++) if (p.collection[i].id === sp.id) dup = true;
  if (!dup) p.collection.push({ id: sp.id, at: Date.now() });
}

function petGainExp(n, opts) {
  opts = opts || {};
  var p = petState();
  if (!n) return p.exp;
  if (p.stage >= 3) {
    if (!opts.quiet) showToast('🥚 새 알을 받으면 다시 기운을 모을 수 있어요!');
    return p.exp;
  }
  if (!opts.quiet) petPop(n);
  p.exp += n;
  var reached = -1;
  while (p.stage < 3 && p.exp >= PET_NEED[p.stage]) {
    p.exp -= PET_NEED[p.stage];
    p.stage += 1;
    reached = p.stage;
  }
  if (p.stage === 1 && !p.hatchedAt) p.hatchedAt = Date.now();
  if (p.stage >= 3) {
    p.exp = 0;
    petCollectNow(p);
  }
  saveState();
  renderPet();

  if (reached >= 0 && !opts.quiet) {
    var vis = document.getElementById('petVisual');
    if (vis) { vis.classList.remove('wiggle'); void vis.offsetWidth; vis.classList.add('wiggle'); }
    confetti(reached >= 3 ? 80 : 46, vis || document.getElementById('petBar'));
    snd('win');
    window.setTimeout(function () { showEvo(reached); }, 320);
  }
  return p.exp;
}

function petAward(key, n, opts) {
  var p = petState();
  var k = currentKey + '|' + key;
  if (p.awarded[k]) return false;
  p.awarded[k] = 1;
  petGainExp(n, opts);
  return true;
}

function petEnsure() {
  var p = petState();
  if (p.stage >= 3) petCollectNow(p);
}

/* 다른 기기(구름 저장)의 친구 기록을 합칩니다 — 더 많이 자란 쪽을 따라가요 */
function petMergeFrom(d) {
  if (!d || typeof d !== 'object') return;
  var p = petState();
  var spIds = [];
  for (var i = 0; i < PET_SPECIES.length; i++) spIds.push(PET_SPECIES[i].id);
  var rawCol = (Object.prototype.toString.call(d.collection) === '[object Array]') ? d.collection : [];
  for (var j = 0; j < rawCol.length; j++) {
    var cc = rawCol[j] || {};
    var cid = (typeof cc === 'string') ? cc : cc.id;
    if (spIds.indexOf(cid) < 0) continue;
    var has = false;
    for (var k = 0; k < p.collection.length; k++) if (p.collection[k].id === cid) has = true;
    if (!has) p.collection.push({ id: cid, at: Number(cc.at) || Date.now() });
  }
  var rs = parseInt(d.stage, 10);
  if (isNaN(rs) || rs < 0) rs = 0;
  if (rs > 3) rs = 3;
  var re = parseInt(d.exp, 10);
  if (isNaN(re) || re < 0) re = 0;
  if (rs > p.stage || (rs === p.stage && re > p.exp)) {
    if (rs !== p.stage && spIds.indexOf(d.currentEgg) >= 0) p.currentEgg = d.currentEgg;
    p.stage = rs;
    p.exp = Math.min(re, petNeed(rs));
  }
  if (d.art && typeof d.art === 'object') {
    for (var sid in d.art) {
      if (!Object.prototype.hasOwnProperty.call(d.art, sid) || spIds.indexOf(sid) < 0) continue;
      var box = d.art[sid];
      if (!box || typeof box !== 'object') continue;
      for (var st in box) {
        if (!Object.prototype.hasOwnProperty.call(box, st)) continue;
        if (!/^[0-3]$/.test(st)) continue;
        var u = String(box[st] || '');
        if (!petArtUrl(sid, st) && petArtOk(u)) petArtSet(sid, st, u);
      }
    }
  }
  saveLocalOnly();
  renderPet();
}

function petNewEgg() {
  var p = petState();
  if (p.stage < 3) return;
  p.currentEgg = petNextEgg(p);
  p.stage = 0;
  p.exp = 0;
  p.hatchedAt = 0;
  saveState();
  renderPet();
  showToast('🥚 새 알이 도착했어요! 무엇이 나올까요?');
}

/* ---- 화면 ---- */
function renderPet() {
  petEnsure();
  var p = petState();
  var sp = petSpecies(p.currentEgg);
  var stage = p.stage;

  var runner = document.getElementById('overallRocket');
  if (runner) runner.innerHTML = petArt(sp, stage, p.exp / Math.max(1, petNeed(stage)));

  var bar = document.getElementById('petBar');
  if (!bar) return;

  var need = petNeed(stage);
  var pct = need ? Math.min(100, Math.round(p.exp / need * 100)) : 100;
  var art = petArt(sp, stage, p.exp / Math.max(1, need));
  var title = stage === 0 ? '수수께끼 알' : sp.names[stage - 1];
  var sub;
  if (stage === 0) {
    sub = '알이 부화하려면 기운 <b>' + need + '</b>개가 필요해요';
  } else if (stage === 1) {
    sub = sp.kind + ' · 1차 진화까지 <b>' + Math.max(0, need - p.exp) + '</b>번 더!';
  } else if (stage === 2) {
    sub = sp.kind + ' · 2차 진화까지 <b>' + Math.max(0, need - p.exp) + '</b>번 더!';
  } else {
    sub = '🎉 2차 진화 완성! 도감에 저장됐어요';
  }

  var nextMini = '';
  if (stage < 3) {
    nextMini = '<span class="pet-next">다음' + petArt(sp, stage + 1, 0) + '</span>';
  }

  var actions = stage >= 3
    ? '<button class="pet-go warm" data-act="pet-new-egg">🥚 새 알 받기</button>'
    : '<button class="pet-go" data-act="pet-open" aria-haspopup="dialog">🐾 도감 <b>' + p.collection.length + '</b>/' + PET_SPECIES.length + '</button>';

  bar.style.setProperty('--pet-c', sp.c);
  bar.style.setProperty('--pet-t', sp.l);
  bar.innerHTML =
    '<div class="pet-visual" id="petVisual">' + art + '</div>' +
    '<div class="pet-meta">' +
      '<div class="pet-name">' + esc(title) + '<span class="pet-stage">' + PET_STAGE_LABEL[stage] + '</span>' + typeBadgeHtml(sp) + '</div>' +
      '<div class="pet-sub">' + sub + '</div>' +
    '</div>' +
    '<div class="pet-grow">' +
      '<div class="pet-gauge"><i style="width:' + pct + '%"></i></div>' +
      '<div class="pet-growline"><span>EXP <b>' + p.exp + '</b> / ' + (need || 'MAX') + '</span>' + (nextMini || '<span>✨ MAX</span>') + '</div>' +
    '</div>' +
    actions;

  var modal = document.getElementById('petModal');
  if (modal && !modal.hidden) renderPetDex();
}

function petDexHtml() {
  var p = petState();
  var stage = p.stage;
  var spNow = petSpecies(p.currentEgg);
  var have = {};
  for (var i = 0; i < p.collection.length; i++) have[p.collection[i].id] = p.collection[i];

  var need = petNeed(stage);
  var pct = need ? Math.min(100, Math.round(p.exp / need * 100)) : 100;
  var nowArt = petArt(spNow, stage, p.exp / Math.max(1, need));
  var nowSub;
  if (stage === 0) nowSub = 'EXP ' + p.exp + ' / ' + need + ' — ' + Math.max(0, need - p.exp) + '번 더 모으면 부화!';
  else if (stage < 3) nowSub = 'EXP ' + p.exp + ' / ' + need + ' — ' + Math.max(0, need - p.exp) + '번 더 모으면 ' + PET_STAGE_LABEL[stage + 1] + '!';
  else nowSub = '2차 진화 완성! 새 알을 받으면 다시 키울 수 있어요.';

  var h = '<div class="pet-nowbox">' +
    '<div class="nw-head"><span class="nw-art">' + nowArt + '</span><span>' +
      (stage === 0 ? '지금 키우는 알' : '지금 키우는 ' + esc(spNow.names[stage - 1])) + '</span></div>' +
    '<div class="nw-sub">' + nowSub + '</div>' +
    '<div class="pet-gauge"><i style="width:' + pct + '%"></i></div>' +
    '</div>';

  h += '<h3 class="pet-sec-title">🐾 몬스터 도감 ' + p.collection.length + ' / ' + PET_SPECIES.length + '</h3>';
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
    var chain = '';
    if (got || isNow) {
      chain = '<div class="pc-chain">';
      for (var csi = 1; csi <= 3; csi++) {
        var haveStage = got ? true : (stage >= csi);
        chain += '<span class="pcs' + (haveStage ? '' : ' off') + '">' + (haveStage ? petArt(sp, csi, 0) : '?') + '</span>';
      }
      chain += '</div>';
    }
    h += '<div class="pet-card' + (got ? '' : ' locked') + (isNow ? ' now' : '') + '" style="--tc:' + petTypeInfo(sp.type).color + '">' +
      '<div class="pc-face">' + (got || isNow ? petArt(sp, got ? 3 : Math.max(1, stage)) : '❓') + '</div>' +
      '<div class="pc-name">' + (got || isNow ? esc(sp.names[0]) : '???') + '</div>' +
      '<div class="pc-type">' + typeBadgeHtml(sp) + '</div>' +
      chain +
      '<div class="pc-when">' + (got ? fmtShort(got.at) + ' 완성' : (isNow ? '키우는 중' : '아직 못 만났어요')) + '</div>' +
      '</div>';
  }
  if (!shown) h += '<p class="spend-empty">이 속성 친구는 아직 없어요.</p>';
  h += '</div>';

  h += '<p class="lf-note" style="margin-top:10px">루틴 체크 +1 · 그룹 완료 보너스 +3 · 칭찬 스티커 +3 으로 기운을 모아요. 알 → 아기 → 1차 진화 → 2차 진화 순서로 자라요!</p>';
  return h;
}

function renderPetDex() {
  var body = document.getElementById('petBody');
  if (body) body.innerHTML = petDexHtml();
}

function openPet() {
  renderPetDex();
  var m = document.getElementById('petModal');
  if (m) m.hidden = false;
  raiseModal('petModal');
  lockScroll();
}

function closePet() {
  var m = document.getElementById('petModal');
  if (m) m.hidden = true;
  if (isOnlyModal('petModal')) unlockScroll();
}

/* ---- 부화·진화 축하 팝업 ---- */
function showEvo(stage) {
  var p = petState();
  var sp = petSpecies(p.currentEgg);
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
    line.textContent = '기운을 모아 1차 진화에 도전해요!';
  } else if (stage === 2) {
    badge.textContent = '✨';
    title.textContent = '1차 진화!';
    nameEl.textContent = sp.names[0] + ' → ' + sp.names[1];
    line.textContent = '더 크고 멋져졌어요! 기운을 모아 2차 진화에 도전!';
  } else {
    badge.textContent = '🌟';
    title.textContent = '2차 진화 완성!';
    nameEl.textContent = sp.names[0] + ' → ' + sp.names[1] + ' → ' + sp.names[2];
    line.textContent = '도감에 저장했어요! 새 알을 받아 또 키워 볼까요?';
  }
  nameEl.innerHTML = esc(nameEl.textContent) + ' ' + typeBadgeHtml(sp);

  art.innerHTML = petArt(sp, Math.max(1, stage), 1);
  next.innerHTML = stage < 3
    ? '<span>다음 모습</span>' + petArt(sp, stage + 1, 0) + '<b>???</b>'
    : '<span>🐾 몬스터 도감에 저장됐어요!</span>';
  actions.innerHTML = stage < 3
    ? '<button class="modal-btn" data-act="evo-close">좋아, 더 모을래!</button>'
    : '<button class="modal-btn" data-act="evo-new">🥚 새 알 받기</button>' +
      '<button class="modal-btn sub" data-act="evo-dex">🐾 도감 보기</button>';

  m.hidden = false;
  lockScroll();
}

function closeEvo() {
  var m = document.getElementById('evoModal');
  if (m) m.hidden = true;
  if (isOnlyModal('evoModal')) unlockScroll();
}

/* ---- 친구 그림 바꾸기 (몬스터 도감 · 부모님·관리자 전용) ---- */
var artEdit = { sp: '', stage: '1' };

function canPetArt() {
  return !!(cloud.me && cloud.me.role !== 'child' && can('edit'));
}

/* 그림 바꾸기 칸이 보이는 곳(도감)을 다시 그려요 */
function renderArtHosts() {
  var pm = document.getElementById('petModal');
  if (pm && !pm.hidden) renderPetDex();
  renderEditPanel();
}

function petArtEditorHtml() {
  var p = petState();
  if (!artEdit.sp) { artEdit.sp = p.currentEgg; artEdit.stage = String(p.stage); }
  var sp = petSpecies(artEdit.sp);
  var cur = petArtUrl(sp.id, artEdit.stage);
  var spOpts = '';
  for (var i = 0; i < PET_SPECIES.length; i++) {
    var s = PET_SPECIES[i];
    spOpts += '<option value="' + esc(s.id) + '"' + (s.id === sp.id ? ' selected' : '') + '>' +
      esc(s.names[0]) + ' (' + esc(s.kind) + ')</option>';
  }
  var stOpts = '';
  for (var j = 0; j < 4; j++) {
    stOpts += '<option value="' + j + '"' + (String(j) === String(artEdit.stage) ? ' selected' : '') + '>' +
      PET_STAGE_LABEL[j] + '</option>';
  }
  return '<div class="art-edit">' +
    '<select class="inp inp-sm" data-field="petArtSp" aria-label="바꿀 친구">' + spOpts + '</select>' +
    '<select class="inp inp-sm" data-field="petArtStage" aria-label="바꿀 단계">' + stOpts + '</select>' +
    '<span class="art-preview">' + petArt(sp, Number(artEdit.stage), 0) + '</span>' +
    '<input class="inp inp-sm" id="petArtUrl" placeholder="https://… 그림 주소" value="' + esc(cur) + '">' +
    '<button type="button" class="pill-btn" data-act="pet-art-apply">주소로 바꾸기</button>' +
    '<label class="art-file">🖼 사진 올리기<input type="file" id="petArtFile" accept="image/*" hidden></label>' +
    '<button type="button" class="ghost-btn" data-act="pet-art-reset">기본 그림</button>' +
    '</div>';
}

function applyPetArtUrl() {
  var u = fieldVal('petArtUrl').trim();
  if (!u) { showToast('그림 주소를 붙여 넣어 주세요'); return; }
  if (!petArtOk(u)) { showToast('http(s) 주소나 올린 사진만 쓸 수 있어요'); return; }
  petArtSet(artEdit.sp, artEdit.stage, u);
  saveState();
  renderPet();
  renderArtHosts();
  showToast('그림을 바꿨어요! 🖼');
}

function resetPetArt() {
  petArtSet(artEdit.sp, artEdit.stage, '');
  saveState();
  renderPet();
  renderArtHosts();
  showToast('기본 그림으로 돌아갔어요');
}

function readPetArtFile(file) {
  if (!file) return;
  if (!/^image\//.test(file.type || '')) { showToast('그림 파일만 올릴 수 있어요'); return; }
  if (file.size > 4 * 1024 * 1024) { showToast('4MB 이하 그림을 골라 주세요'); return; }
  var reader = new FileReader();
  reader.onload = function () {
    var img = new Image();
    img.onload = function () {
      try {
        var max = 320;
        var k = Math.min(1, max / Math.max(img.width || 1, img.height || 1));
        var cv = document.createElement('canvas');
        cv.width = Math.max(1, Math.round((img.width || 1) * k));
        cv.height = Math.max(1, Math.round((img.height || 1) * k));
        var ctx = cv.getContext('2d');
        ctx.clearRect(0, 0, cv.width, cv.height);
        ctx.drawImage(img, 0, 0, cv.width, cv.height);
        var url = cv.toDataURL('image/png');
        if (url.length > 280000) { showToast('그림이 너무 커요. 더 작은 사진으로 해 주세요.'); return; }
        petArtSet(artEdit.sp, artEdit.stage, url);
        saveState();
        renderPet();
        renderArtHosts();
        showToast('그림을 바꿨어요! 🖼');
      } catch (e) {
        showToast('그림을 바꾸지 못했어요.');
      }
    };
    img.onerror = function () { showToast('그림을 읽지 못했어요.'); };
    img.src = String(reader.result || '');
  };
  reader.onerror = function () { showToast('파일을 읽지 못했어요.'); };
  reader.readAsDataURL(file);
}
