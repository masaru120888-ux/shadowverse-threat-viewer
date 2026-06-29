// One-off debug dump: fetch raw card info for a given set prefix (default set 8)
// and write it to dump-cards-raw.json so damage can be judged by hand.
// Not part of the build; safe to delete after use.
const API = "https://shadowverse-wb.com/web/CardList/cardList";
const CLASS_IDS = [0, 1, 2, 3, 4, 5, 6, 7];
const COSTS = "0,1,2,3,4,5,6,7,8,9,10";
const LANGS = ["ja", "en"];
const SET = process.env.SET || "8";

function stripMarkup(value) {
  return String(value || "")
    .replace(/<hr>/g, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchPage(classId, lang, offset) {
  const params = new URLSearchParams({ class: String(classId), cost: COSTS, offset: String(offset) });
  const response = await fetch(`${API}?${params}`, { headers: { Lang: lang } });
  if (!response.ok) throw new Error(`Failed ${lang} class ${classId} offset ${offset}: ${response.status}`);
  return response.json();
}

async function fetchClass(classId, lang) {
  const byId = new Map();
  const specificById = new Map();
  let offset = 0;
  let count = Infinity;
  while (offset < count) {
    const payload = await fetchPage(classId, lang, offset);
    const data = payload.data;
    count = data.count;
    for (const [effectId, effect] of Object.entries(data.specific_effect_card_info || {})) {
      specificById.set(String(effectId), { skill_text: effect.skill_text || "", cost: effect.cost || 0 });
    }
    for (const [cardId, detail] of Object.entries(data.card_details || {})) {
      if (!detail?.common) continue;
      detail.common.evo_skill_text = detail.evo?.skill_text || "";
      detail.common.related = (data.cards?.[cardId]?.related_card_ids || []).map(String);
      detail.common.specific = (data.cards?.[cardId]?.specific_effect_card_ids || []).map(String);
      byId.set(String(cardId), detail.common);
    }
    offset += data.sort_card_id_list.length || 30;
  }
  return { byId, specificById };
}

const result = [];
for (const classId of CLASS_IDS) {
  const [ja, en] = await Promise.all(LANGS.map((lang) => fetchClass(classId, lang)));
  for (const [id, card] of ja.byId) {
    if (id[2] !== SET) continue;
    const enCard = en.byId.get(id) || {};
    const related = (card.related || []).map((rid) => {
      const r = ja.byId.get(rid) || ja.specificById.get(rid) || {};
      return { id: rid, name: stripMarkup(r.name), atk: r.atk, life: r.life, cost: r.cost,
        text: stripMarkup(r.skill_text), evo: stripMarkup(r.evo_skill_text) };
    });
    const crests = (card.specific || []).map((sid) => {
      const s = ja.specificById.get(sid) || {};
      return { id: sid, cost: s.cost, text: stripMarkup(s.skill_text) };
    });
    result.push({
      id, cost: card.cost, atk: card.atk, life: card.life, type: card.type,
      name: stripMarkup(card.name),
      text: stripMarkup(card.skill_text),
      evo: stripMarkup(card.evo_skill_text),
      en_name: stripMarkup(enCard.name),
      related,
      crests,
    });
  }
}
result.sort((a, b) => a.id.localeCompare(b.id));
await import("node:fs/promises").then((fs) => fs.writeFile("dump-cards-raw.json", JSON.stringify(result, null, 1)));
console.log(`Dumped ${result.length} cards for set ${SET}`);
