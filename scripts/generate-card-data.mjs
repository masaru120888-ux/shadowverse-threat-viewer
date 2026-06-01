const API = "https://shadowverse-wb.com/web/CardList/cardList";
const CLASS_IDS = [0, 1, 2, 3, 4, 5, 6, 7];
const COSTS = "0,1,2,3,4,5,6,7,8,9,10";
const LANGS = ["ja", "en"];

const classKeys = {
  0: "neutral",
  1: "forest",
  2: "sword",
  3: "rune",
  4: "dragon",
  5: "nightmare",
  6: "bishop",
  7: "portal",
};

const classNames = {
  neutral: { ja: "ニュートラル", en: "Neutral" },
  forest: { ja: "エルフ", en: "Forestcraft" },
  sword: { ja: "ロイヤル", en: "Swordcraft" },
  rune: { ja: "ウィッチ", en: "Runecraft" },
  dragon: { ja: "ドラゴン", en: "Dragoncraft" },
  nightmare: { ja: "ナイトメア", en: "Nightmare" },
  bishop: { ja: "ビショップ", en: "Havencraft" },
  portal: { ja: "ネメシス", en: "Portalcraft" },
};

function stripMarkup(value) {
  return String(value || "")
    .replace(/<hr>/g, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchPage(classId, lang, offset) {
  const params = new URLSearchParams({
    class: String(classId),
    cost: COSTS,
    offset: String(offset),
  });
  const response = await fetch(`${API}?${params}`, { headers: { Lang: lang } });
  if (!response.ok) {
    throw new Error(`Failed ${lang} class ${classId} offset ${offset}: ${response.status}`);
  }
  return response.json();
}

async function fetchClass(classId, lang) {
  const byId = new Map();
  const mainIds = new Set();
  const relatedById = new Map();
  let offset = 0;
  let count = Infinity;

  while (offset < count) {
    const payload = await fetchPage(classId, lang, offset);
    const data = payload.data;
    count = data.count;

    for (const cardId of data.sort_card_id_list) {
      mainIds.add(String(cardId));
    }

    for (const [cardId, relation] of Object.entries(data.cards || {})) {
      relatedById.set(String(cardId), (relation.related_card_ids || []).map(String));
    }

    for (const [cardId, detail] of Object.entries(data.card_details || {})) {
      if (!detail?.common) continue;
      byId.set(String(cardId), detail.common);
    }

    for (const cardId of data.sort_card_id_list) {
      const detail = data.card_details[String(cardId)];
      if (!detail?.common) continue;
      byId.set(String(cardId), detail.common);
    }

    offset += data.sort_card_id_list.length || 30;
  }

  return { byId, mainIds, relatedById };
}

function firstNumber(pattern, text) {
  const match = text.match(pattern);
  return match ? Number(match[1]) : 0;
}

function maxNumber(pattern, text) {
  let max = 0;
  for (const match of text.matchAll(pattern)) {
    max = Math.max(max, Number(match[1]));
  }
  return max;
}

function comboTurn(text) {
  return Math.max(
    firstNumber(/Combo\s*\((\d+)\)/i, text),
    firstNumber(/コンボ[_\s]*(\d+)/, text),
  );
}

function enhanceCost(text) {
  return Math.max(
    firstNumber(/Enhance\s*\((\d+)\)/i, text),
    firstNumber(/エンハンス[_\s]*(\d+)/, text),
  );
}

function inferThreat(card, enText, jaText) {
  const text = `${enText} ${jaText}`;
  const baseCost = Number(card.cost || 0);
  const atk = Number(card.atk || 0);
  const isFollower = Number(card.type) === 1;
  const combo = comboTurn(text);
  const enhance = enhanceCost(text);
  const superEvolve = /Super-Evolve|超進化時/.test(text);
  const rally = /Rally\s*\((\d+)\)|連携[_\s]*(\d+)/i.test(text);

  let unlockTurn = Math.max(1, baseCost, combo);
  if (superEvolve) unlockTurn = Math.max(unlockTurn, 6);
  if (rally) unlockTurn = Math.max(unlockTurn, 5);

  let effectiveCost = baseCost;
  if (enhance > 0 && /leader|リーダー|Storm|疾走|damage|ダメージ/i.test(text)) {
    effectiveCost = Math.max(effectiveCost, enhance);
  }

  let burnDamage = Math.max(
    maxNumber(/enemy leader[^.。]*?(\d+) damage/gi, text),
    maxNumber(/相手のリーダーに(\d+)ダメージ/g, text),
  );
  if (burnDamage > 0 && /instead|ではなく/.test(text)) {
    burnDamage = Math.max(
      burnDamage,
      maxNumber(/(\d+) damage/gi, text),
      maxNumber(/(\d+)ダメージ/g, text),
    );
  }

  const hasStorm = /Storm|疾走/.test(text);
  let stormDamage = hasStorm && isFollower ? atk : 0;
  if (hasStorm && /all copies|すべて/.test(text)) {
    stormDamage = Math.max(stormDamage, atk * 2);
  }

  const tokenDamage = Math.max(
    maxNumber(/(\d+) damage to (?:a |an |the |random )?enemy follower/gi, text),
    maxNumber(/enemy follower[^.。]*?(\d+) damage/gi, text),
    maxNumber(/相手.*?フォロワー.*?(\d+)ダメージ/g, text),
  );

  const leaderDamage = Math.max(burnDamage, stormDamage);
  return {
    tokenDamage,
    leaderDamage,
    stormDamage,
    burnDamage,
    effectiveCost,
    unlockTurn,
    condition: [
      combo ? `Combo ${combo}` : "",
      enhance ? `Enhance ${enhance}` : "",
      superEvolve ? "Super-evolve" : "",
      rally ? "Rally" : "",
      hasStorm ? "Storm" : "",
    ].filter(Boolean).join(" / ") || "Base",
  };
}

function buildCard(classKey, id, ja, en, jaRelated = [], enRelated = []) {
  const jaText = stripMarkup(ja.skill_text);
  const enText = stripMarkup(en.skill_text);
  const inferred = inferThreat(en, enText, jaText);
  const relatedThreats = enRelated.map((related, index) => {
    const relatedJa = jaRelated[index] || related;
    const relatedJaText = stripMarkup(relatedJa.skill_text);
    const relatedEnText = stripMarkup(related.skill_text);
    return {
      ja: {
        name: stripMarkup(relatedJa.name),
        imageHash: relatedJa.card_image_hash,
      },
      en: {
        name: stripMarkup(related.name),
        imageHash: related.card_image_hash,
      },
      name: stripMarkup(related.name),
      ...inferThreat(related, relatedEnText, relatedJaText),
    };
  });
  const bestRelatedLeader = relatedThreats.reduce(
    (best, related) => (related.leaderDamage > best.leaderDamage ? related : best),
    { leaderDamage: 0, stormDamage: 0, burnDamage: 0, tokenDamage: 0, condition: "" },
  );
  const leaderDamage = Math.max(inferred.leaderDamage, bestRelatedLeader.leaderDamage);
  const relatedCondition =
    bestRelatedLeader.leaderDamage > inferred.leaderDamage
      ? `Creates ${bestRelatedLeader.name}`
      : "";
  const displayCard =
    bestRelatedLeader.leaderDamage > inferred.leaderDamage
      ? {
          ja: bestRelatedLeader.ja,
          en: bestRelatedLeader.en,
        }
      : null;

  return {
    id,
    classKey,
    cost: Number(en.cost || ja.cost || 0),
    isRotation: Boolean(en.is_include_rotation || ja.is_include_rotation),
    effectiveCost: inferred.effectiveCost,
    unlockTurn: inferred.unlockTurn,
    tokenDamage: Math.max(inferred.tokenDamage, bestRelatedLeader.tokenDamage),
    leaderDamage,
    stormDamage: Math.max(inferred.stormDamage, bestRelatedLeader.stormDamage),
    burnDamage: Math.max(inferred.burnDamage, bestRelatedLeader.burnDamage),
    condition: [inferred.condition, relatedCondition].filter(Boolean).join(" / "),
    displayCard,
    ja: {
      name: stripMarkup(ja.name),
      effect: jaText,
      imageHash: ja.card_image_hash,
    },
    en: {
      name: stripMarkup(en.name),
      effect: enText,
      imageHash: en.card_image_hash,
    },
  };
}

const allCards = [];

for (const classId of CLASS_IDS) {
  const [jaCards, enCards] = await Promise.all(
    LANGS.map((lang) => fetchClass(classId, lang)),
  );
  const classKey = classKeys[classId];

  for (const id of jaCards.mainIds) {
    const ja = jaCards.byId.get(id);
    const en = enCards.byId.get(id);
    if (!en) continue;
    const relatedIds = enCards.relatedById.get(id) || jaCards.relatedById.get(id) || [];
    const filteredRelatedIds = relatedIds.filter((relatedId) => relatedId !== id);
    const jaRelated = filteredRelatedIds.map((relatedId) => jaCards.byId.get(relatedId)).filter(Boolean);
    const enRelated = filteredRelatedIds.map((relatedId) => enCards.byId.get(relatedId)).filter(Boolean);
    allCards.push(buildCard(classKey, id, ja, en, jaRelated, enRelated));
  }
}

allCards.sort((a, b) => {
  if (a.classKey !== b.classKey) {
    return Object.keys(classNames).indexOf(a.classKey) - Object.keys(classNames).indexOf(b.classKey);
  }
  if (a.cost !== b.cost) return a.cost - b.cost;
  return Number(a.id) - Number(b.id);
});

const output = `window.SHADOWVERSE_CARD_DATA = ${JSON.stringify({
  generatedAt: new Date().toISOString(),
  classes: classNames,
  cards: allCards,
}, null, 2)};\n`;

await import("node:fs/promises").then((fs) => fs.writeFile("card-data.js", output));
console.log(`Generated ${allCards.length} cards in card-data.js`);
