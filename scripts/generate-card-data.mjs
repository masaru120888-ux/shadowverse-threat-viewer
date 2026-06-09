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
  const specificById = new Map();
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
      const specificIds = (relation.specific_effect_card_ids || []).map(String);
      if (specificIds.length > 0) {
        relatedById.set(String(cardId), [
          ...(relatedById.get(String(cardId)) || []),
          ...specificIds,
        ]);
      }
    }

    for (const [effectId, effect] of Object.entries(data.specific_effect_card_info || {})) {
      specificById.set(String(effectId), {
        card_id: Number(effectId),
        name: "Crest / Specific Effect",
        skill_text: effect.skill_text || "",
        card_image_hash: "",
        cost: effect.cost || 0,
        atk: 0,
        life: 0,
        type: effect.specific_effect_type || 4,
        is_specific_effect: true,
      });
    }

    for (const [cardId, detail] of Object.entries(data.card_details || {})) {
      if (!detail?.common) continue;
      detail.common.evo_skill_text = detail.evo?.skill_text || "";
      byId.set(String(cardId), detail.common);
    }

    for (const cardId of data.sort_card_id_list) {
      const detail = data.card_details[String(cardId)];
      if (!detail?.common) continue;
      detail.common.evo_skill_text = detail.evo?.skill_text || "";
      byId.set(String(cardId), detail.common);
    }

    offset += data.sort_card_id_list.length || 30;
  }

  return { byId, mainIds, relatedById, specificById };
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

function repeatedSegments(text) {
  return [...text.matchAll(/Do this (\d+) times:\s*"([^"]+)"/gi)].map((match) => ({
    count: Number(match[1]),
    text: match[2],
  }));
}

function removeSuperEvolveText(text) {
  return text
    .replace(/Super-Evolve:.*$/gi, "")
    .replace(/【超進化時】.*$/g, "");
}

function directLeaderDamage(text, includeYourLeader = false) {
  const leaderPatterns = [
    /enemy leader[^.。"]*?(\d+) damage/gi,
    /(\d+) damage to a random enemy(?! follower)/gi,
    /Deal (\d+) damage to all enemies/gi,
    /Deal (\d+) damage split between all enemies/gi,
    /相手のリーダーに(\d+)ダメージ/g,
    /相手の場のフォロワーか相手のリーダーからランダム\d*枚に(\d+)ダメージ/g,
    /相手すべてに(\d+)ダメージ/g,
    /相手すべてに(?:割りふって)?(\d+)ダメージ/g,
  ];
  if (includeYourLeader) {
    leaderPatterns.push(/your leader[^.。"]*?(\d+) damage/gi);
    leaderPatterns.push(/自分のリーダーに(\d+)ダメージ/g);
  }

  const fixedDamage = Math.max(0, ...leaderPatterns.map((pattern) => maxNumber(pattern, text)));
  const crestVariableDamage =
    /Deal X damage split between all enemies[\s\S]{0,180}X is the number of crests you have/i.test(text) ||
    /相手すべてにXダメージ[\s\S]{0,180}Xは自分のクレストの数/.test(text)
      ? 1
      : 0;

  return Math.max(fixedDamage, crestVariableDamage);
}

function givesOpponentCrest(text) {
  return (
    /give your opponent[^.。]*Crest/i.test(text) ||
    /opponent[^.。]*Crest/i.test(text) ||
    /相手[^。]*クレスト/.test(text)
  );
}

function crestRequiresEvolve(text) {
  return (
    /(?:Evolve|Super-Evolve)[^.。]*Crest/i.test(text) ||
    /if this follower is (?:super-)?evolved[^.。]*Crest/i.test(text) ||
    /(?:進化時|超進化時|進化後)[^。]*クレスト/.test(text)
  );
}

function attackMultiplier(text) {
  return Math.max(
    1,
    firstNumber(/Can attack (\d+) times per turn/i, text),
    firstNumber(/1ターンに(\d+)回攻撃できる/, text),
  );
}

function givesStormToSummonedCards(text) {
  return (
    /Summon [^.。]* and give (?:it|them) [^.。]*Storm/i.test(text) ||
    /場に出す。それは[^。]*疾走/.test(text)
  );
}

function inferThreat(card, enText, jaText, options = {}) {
  const text = `${enText} ${jaText}`;
  const baseCost = Number(card.cost || 0);
  const atk = Number(card.atk || 0);
  const isFollower = Number(card.type) === 1;
  const combo = comboTurn(text);
  const enhance = enhanceCost(text);
  const superEvolve = /Super-Evolve|超進化時/.test(text);
  const superSkyboundArt = /Super Skybound Art|解放奥義/.test(text);
  const rally = /Rally\s*\((\d+)\)|連携[_\s]*(\d+)/i.test(text);

  let unlockTurn = Math.max(1, baseCost, combo);
  if (superEvolve) unlockTurn = Math.max(unlockTurn, 6);
  if (superSkyboundArt) unlockTurn = Math.max(unlockTurn, 10);
  if (rally) unlockTurn = Math.max(unlockTurn, 5);

  let effectiveCost = baseCost;
  if (enhance > 0 && /leader|リーダー|Storm|疾走|damage|ダメージ/i.test(text)) {
    effectiveCost = Math.max(effectiveCost, enhance);
  }

  let burnDamage = directLeaderDamage(text, options.includeYourLeader);
  for (const segment of repeatedSegments(text)) {
    burnDamage = Math.max(
      burnDamage,
      segment.count * directLeaderDamage(segment.text, options.includeYourLeader),
    );
  }
  if (burnDamage > 0 && /instead|ではなく/.test(text)) {
    burnDamage = Math.max(
      burnDamage,
      maxNumber(/(\d+) damage/gi, text),
      maxNumber(/(\d+)ダメージ/g, text),
    );
  }

  const selfPing = Math.max(
    maxNumber(/whenever this follower takes damage[^.]*?deal (\d+) damage to the enemy leader/gi, text),
    maxNumber(/これがダメージを受けた.*?相手のリーダーに(\d+)ダメージ/g, text),
  );
  if (selfPing > 0) {
    const selfDamageCount = repeatedSegments(text)
      .filter((segment) => /all followers|フォロワーすべて/.test(segment.text))
      .reduce((total, segment) => total + segment.count, 0);
    burnDamage = Math.max(burnDamage, selfDamageCount * selfPing);
  }

  const hasStorm = /Storm|疾走/.test(text) && !givesStormToSummonedCards(text);
  const stormDamage = hasStorm && isFollower ? atk * attackMultiplier(text) : 0;

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
    hasStorm,
    effectiveCost,
    unlockTurn,
    condition: [
      combo ? `Combo ${combo}` : "",
      enhance ? `Enhance ${enhance}` : "",
      superEvolve ? "Super-evolve" : "",
      superSkyboundArt ? "Super Skybound Art" : "",
      rally ? "Rally" : "",
      hasStorm ? "Storm" : "",
    ].filter(Boolean).join(" / ") || "Base",
  };
}

function summonedStormThreat(enText, jaText, enRelated = [], jaRelated = []) {
  const text = `${enText} ${jaText}`;
  if (!givesStormToSummonedCards(text)) {
    return { leaderDamage: 0, stormDamage: 0, displayCard: null, condition: "" };
  }

  for (const [index, related] of enRelated.entries()) {
    const relatedJa = jaRelated[index] || related;
    const enName = stripMarkup(related.name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const jaName = stripMarkup(relatedJa.name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const count = Math.max(
      firstNumber(new RegExp(`Summon (\\d+) copies of ${enName}[^.。]*give them[^.。]*Storm`, "i"), text),
      firstNumber(new RegExp(`『${jaName}』(\\d+)枚[^。]*場に出す。それは[^。]*疾走`), text),
    );
    if (count > 0 && Number(related.type) === 1) {
      const damage = count * Number(related.atk || 0);
      return {
        leaderDamage: damage,
        stormDamage: damage,
        displayCard: {
          ja: {
            name: stripMarkup(relatedJa.name),
            imageHash: relatedJa.card_image_hash,
          },
          en: {
            name: stripMarkup(related.name),
            imageHash: related.card_image_hash,
          },
        },
        condition: `Summons ${count} Storm ${stripMarkup(related.name)}`,
      };
    }
  }

  return { leaderDamage: 0, stormDamage: 0, displayCard: null, condition: "" };
}

function buildCard(classKey, id, ja, en, jaRelated = [], enRelated = []) {
  const jaText = stripMarkup(ja.skill_text);
  const enText = stripMarkup(en.skill_text);
  const jaEvoText = stripMarkup(ja.evo_skill_text);
  const enEvoText = stripMarkup(en.evo_skill_text);
  const inferred = inferThreat(en, removeSuperEvolveText(enText), removeSuperEvolveText(jaText));
  const evoInferred = inferThreat(en, enEvoText, jaEvoText);
  const parentText = `${enText} ${jaText}`;
  const superEvolveGrantsStorm = /Super-Evolve[\s\S]*Storm|超進化時[\s\S]*疾走/.test(`${enText} ${jaText}`);
  const evolveEffectLeaderDamage =
    evoInferred.leaderDamage + (superEvolveGrantsStorm && evoInferred.hasStorm ? 3 : 0);
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
      ...inferThreat(related, relatedEnText, relatedJaText, {
        includeYourLeader: Boolean(related.is_specific_effect && givesOpponentCrest(parentText)),
      }),
    };
  });
  const bestRelatedLeader = relatedThreats.reduce(
    (best, related) => (related.leaderDamage > best.leaderDamage ? related : best),
    { leaderDamage: 0, stormDamage: 0, burnDamage: 0, tokenDamage: 0, condition: "" },
  );
  const bestRelatedToken = relatedThreats.reduce(
    (best, related) => (related.tokenDamage > best.tokenDamage ? related : best),
    { tokenDamage: 0 },
  );
  const summonedStorm = summonedStormThreat(enText, jaText, enRelated, jaRelated);
  const leaderDamage = Math.max(
    inferred.leaderDamage,
    bestRelatedLeader.leaderDamage,
    summonedStorm.leaderDamage,
  );
  const relatedRequiresEvolve =
    bestRelatedLeader.leaderDamage > inferred.leaderDamage &&
    crestRequiresEvolve(parentText);
  const directRequiresEvolve =
    inferred.leaderDamage === 0 &&
    evoInferred.leaderDamage > inferred.leaderDamage &&
    /Evolve|進化時|Super-Evolve|超進化時/.test(`${enEvoText} ${jaEvoText} ${enText} ${jaText}`);
  const relatedCondition =
    bestRelatedLeader.leaderDamage > inferred.leaderDamage
      ? `${relatedRequiresEvolve ? "Evolve / " : ""}Creates ${bestRelatedLeader.name}`
      : bestRelatedToken.tokenDamage > 0
        ? `Creates ${bestRelatedToken.name}`
        : "";
  const summonedStormCondition =
    summonedStorm.leaderDamage > Math.max(inferred.leaderDamage, bestRelatedLeader.leaderDamage)
      ? summonedStorm.condition
      : "";
  const displayCard =
    summonedStorm.leaderDamage > Math.max(inferred.leaderDamage, bestRelatedLeader.leaderDamage)
      ? summonedStorm.displayCard
      : bestRelatedLeader.leaderDamage > inferred.leaderDamage
        ? {
          ja: bestRelatedLeader.ja,
          en: bestRelatedLeader.en,
        }
        : bestRelatedToken.tokenDamage > 0
          ? {
            ja: bestRelatedToken.ja,
            en: bestRelatedToken.en,
          }
          : null;
  const stormDamage = Math.max(inferred.stormDamage, bestRelatedLeader.stormDamage, summonedStorm.stormDamage);

  return {
    id,
    classKey,
    cost: Number(en.cost || ja.cost || 0),
    isRotation: Boolean(en.is_include_rotation || ja.is_include_rotation),
    effectiveCost: inferred.effectiveCost,
    unlockTurn: inferred.unlockTurn,
    requiresEvolve: relatedRequiresEvolve || directRequiresEvolve,
    evolveLeaderBonus: stormDamage > 0 ? 2 : 0,
    evolveEffectLeaderDamage,
    tokenDamage: Math.max(inferred.tokenDamage, bestRelatedLeader.tokenDamage, bestRelatedToken.tokenDamage),
    leaderDamage,
    stormDamage,
    burnDamage: Math.max(inferred.burnDamage, bestRelatedLeader.burnDamage),
    condition: [inferred.condition, relatedCondition, summonedStormCondition].filter(Boolean).join(" / "),
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
    const jaRelated = filteredRelatedIds
      .map((relatedId) => jaCards.byId.get(relatedId) || jaCards.specificById.get(relatedId))
      .filter(Boolean);
    const enRelated = filteredRelatedIds
      .map((relatedId) => enCards.byId.get(relatedId) || enCards.specificById.get(relatedId))
      .filter(Boolean);
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
