// テーマ・言語の設定はブラウザの localStorage に保存し、再訪・ページ遷移でも維持する。
const SETTINGS_KEYS = { theme: "svtv-theme", lang: "svtv-lang" };

function loadSetting(key, allowed, fallback) {
  try {
    const value = localStorage.getItem(key);
    if (allowed.includes(value)) return value;
  } catch (e) {}
  return fallback;
}

function saveSetting(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {}
}

function preferredTheme() {
  try {
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
      return "light";
    }
  } catch (e) {}
  return "dark";
}

function applyThemeClass() {
  document.documentElement.classList.toggle("light-mode", theme === "light");
}

let lang = loadSetting(SETTINGS_KEYS.lang, ["ja", "en"], "ja");
let theme = loadSetting(SETTINGS_KEYS.theme, ["dark", "light"], preferredTheme());
applyThemeClass();
let enemyClass = null;
let format = "rotation";
let damageMode = "single";
let turnsPlayed = 1;
let currentHealth = 20;
let evolvePoints = 2;

const cardData = window.SHADOWVERSE_CARD_DATA || { classes: {}, cards: [] };

for (const ov of window.SHADOWVERSE_CARD_OVERRIDES || []) {
  const c = cardData.cards.find((c) => c.id === ov.id);
  if (c) Object.assign(c, ov);
}

// displayCard名 → そのカードが有効になる最低PP（カードデータのeffectiveCostより優先）
const displayCardPPOverride = new Map([
  ["イクシードアーティファクトΩ", 10],
  ["Masterwork Artifact Ω", 10],
]);

const ui = {
  ja: {
    title: "逆リーサルチェッカー",
    classControl: "相手クラス",
    formatControl: "フォーマット",
    formatHelp: "ローテーションまたはアンリミテッドで絞り込みます。",
    rotation: "ローテーション",
    unlimited: "アンリミテッド",
    damageModeControl: "ダメージ表示",
    damageModeHelp: "単体カードまたはPP内の複数カード最大打点を表示します。",
    single: "単体カード",
    combo: "複数カード",
    turnControl: "現在のターン数",
    turnHelp: "コスト内で脅威となるカードを探します。EXPPがある場合は+1",
    healthControl: "自分の体力",
    healthHelp: "相手のリーダー打点がこの体力以上ならリーサル候補として表示します。",
    evolveControl: "相手の進化権",
    evolveHelp: "進化が必要なカードと疾走フォロワーの進化後打点に使います。",
    stormDamage: "相手の疾走/攻撃打点",
    burnDamage: "相手のバーン打点",
    maxThreat: "最大リーダー打点",
    enemyLethal: "相手リーサル候補",
    enemyThreatPreview: "リーダー打点カード",
    comboCards: "カード枚数",
    accumulatedDamage: "累積打点",
    damageBreakdown: "超進化/進化/通常",
    damageBreakdownNoSuper: "進化/通常",
    killBreakdown: "除去込み/素打点",
    cost: "コスト",
    condition: "条件",
    damage: "ダメージ",
    leaderDamage: "リーダー打点",
    noThreats: "この条件で表示できるリーダー打点カードはありません。",
    none: "なし",
    lethal: "リーサル",
    themeButton: "☀️",
    languageButton: "English",
    introEyebrow: "相手リーサル確認",
    introBody: "相手が使えるPPと条件に合わせた脅威カードを提示します。リーサルカードは赤く表示されます。",
    classHelp: "表示する相手クラスを切り替えます。",
    tabLethal: "リーサルチェッカー",
    tabHeal: "ヒールチェッカー",
    tabBoard: "盤面脅威チェッカー",
    tabSoon: "近日登場",
    experimental: "実験的",
    swipeToResults: "結果へスワイプ",
    swipeBackToInput: "入力へ戻る",
  },
  en: {
    introEyebrow: "Enemy lethal check",
    title: "Leader Damage Cards",
    introBody: "Shows threat cards matching the available PP and conditions. Lethal candidates are highlighted in red.",
    turnsPlayed: "Turns Played",
    enemyClass: "Enemy Class",
    enemyMaxPp: "Enemy Max PP",
    visibleThreats: "Visible Damage",
    classControl: "Enemy Class",
    classHelp: "Switch which opponent class is shown.",
    formatControl: "Format",
    formatHelp: "Filter by Rotation or Unlimited.",
    rotation: "Rotation",
    unlimited: "Unlimited",
    damageModeControl: "Damage Mode",
    damageModeHelp: "Show individual cards or the best multi-card damage within PP.",
    single: "Single Cards",
    combo: "Combinations",
    turnControl: "Adjust Turns Played",
    turnHelp: "Cards are evaluated against the PP and conditions reachable by this turn.",
    healthControl: "Your Health",
    healthHelp: "If enemy leader damage meets or exceeds this health, it is shown as a lethal out.",
    evolveControl: "Enemy Evolves",
    evolveHelp: "Used for cards that require evolve and for evolved Storm follower damage.",
    stormDamage: "Enemy Storm/Attack",
    burnDamage: "Enemy Burn",
    maxThreat: "Highest Leader Damage",
    enemyLethal: "Enemy Lethal Outs",
    enemyThreatPreview: "Leader Damage Cards",
    comboCards: "Cards",
    accumulatedDamage: "Running damage",
    damageBreakdown: "Super/Evolve/Base",
    damageBreakdownNoSuper: "Evolve/Base",
    killBreakdown: "w/ kill / base",
    cost: "Cost",
    condition: "Condition",
    damage: "damage",
    leaderDamage: "Leader damage",
    noThreats: "No leader-damage cards are visible for this condition.",
    none: "None",
    lethal: "Lethal",
    themeButton: "🌙",
    languageButton: "日本語",
    tabLethal: "Lethal Checker",
    tabHeal: "Heal Checker",
    tabBoard: "Board Threats",
    tabSoon: "Coming Soon",
    experimental: "Experimental",
    swipeToResults: "Swipe to results",
    swipeBackToInput: "Back to input",
  },
};

const fields = {
  language: document.querySelector("#language-button"),
  theme: document.querySelector("#theme-button"),
  turnInput: document.querySelector("#turn-input"),
  turnOutput: document.querySelector("#turn-output"),
  healthInput: document.querySelector("#health-input"),
  healthOutput: document.querySelector("#health-output"),
  classButtons: document.querySelector("#class-buttons"),
  formatButtons: document.querySelector("#format-buttons"),
  damageModeButtons: document.querySelector("#damage-mode-buttons"),
  stormDamage: document.querySelector("#storm-damage"),
  burnDamage: document.querySelector("#burn-damage"),
  maxThreat: document.querySelector("#max-threat"),
  enemyLethal: document.querySelector("#enemy-lethal"),
  enemyThreatTotal: document.querySelector("#enemy-threat-total"),
  enemyThreats: document.querySelector("#enemy-threats"),
};

function classEntries() {
  return Object.entries(cardData.classes).filter(([key]) => key !== "neutral").filter(([key]) =>
    cardData.cards.some((card) => card.classKey === key && hasLeaderDamage(card) && formatAllows(card)),
  );
}

function formatAllows(card) {
  return format === "unlimited" || card.isRotation;
}

function hasLeaderDamage(card) {
  return card.leaderDamage > 0 || card.evolveEffectLeaderDamage > 0 || !!card.xDamage;
}

function baseThreats() {
  if (turnsPlayed == null) return [];
  const enemyMaxPp = Math.min(11, turnsPlayed);
  return cardData.cards
    .filter((card) => card.classKey === enemyClass || card.classKey === "neutral")
    .filter(formatAllows)
    .filter(hasLeaderDamage)
    .filter((card) => {
      if (card.unlockTurn > turnsPlayed) return false;
      const displayName = card.displayCard?.ja?.name || card.displayCard?.en?.name;
      const requiredPP = displayName ? (displayCardPPOverride.get(displayName) ?? card.effectiveCost) : card.effectiveCost;
      return requiredPP <= enemyMaxPp;
    });
}

function availableThreats() {
  const seenNames = new Set();
  return baseThreats()
    .map(resolveThreatDamage)
    .filter(Boolean)
    .sort((a, b) => {
      const aL = !a.xDamage && a.leaderDamage >= currentHealth;
      const bL = !b.xDamage && b.leaderDamage >= currentHealth;
      if (bL !== aL) return (bL ? 1 : 0) - (aL ? 1 : 0);
      if (!!b.xDamage !== !!a.xDamage) return (b.xDamage ? 1 : 0) - (a.xDamage ? 1 : 0);
      if (b.leaderDamage !== a.leaderDamage) return b.leaderDamage - a.leaderDamage;
      if (a.effectiveCost !== b.effectiveCost) return a.effectiveCost - b.effectiveCost;
      if (a.cost !== b.cost) return a.cost - b.cost;
      return a[lang].name.localeCompare(b[lang].name);
    })
    .filter((card) => {
      const dcHasImage = card.displayCard?.ja?.imageHash || card.displayCard?.en?.imageHash;
      const name = dcHasImage
        ? (card.displayCard?.[lang]?.name || card.displayCard?.en?.name)
        : (card[lang]?.name || card.en?.name) || "";
      if (seenNames.has(name)) return false;
      seenNames.add(name);
      return true;
    });
}

function resolveThreatDamage(card) {
  return threatVariants(card).sort((a, b) => b.leaderDamage - a.leaderDamage)[0] || null;
}

function canSuperEvolve() {
  return turnsPlayed >= 6 && evolvePoints > 0;
}

function stormDamageBreakdown(card) {
  if (card.stormBreakdownMax) {
    return {
      superEvolve: card.stormBreakdownMax[0],
      evolve: card.stormBreakdownMax[1],
      base: card.stormBreakdownMax[2],
      min: card.stormBreakdownMin,
    };
  }
  if (card.stormDamage <= 0) return null;
  const base = card.baseLeaderDamage ?? card.leaderDamage;
  return {
    base,
    evolve: base + 2,
    superEvolve: base + 3,
  };
}

function variantCondition(card, label) {
  const parts = (card.condition ? card.condition.split(" / ") : []).concat(label || []);
  return [...new Set(parts)].join(" / ");
}

function threatVariants(card) {
  const variants = [];
  const requiresSuper = !!card.requiresSuperEvolve;
  // 打点が超進化前提のカードは、超進化できないターン（6未満）では表示しない
  if (requiresSuper && !canSuperEvolve()) return [];
  if (!card.requiresEvolve) {
    variants.push({ ...card, baseLeaderDamage: card.leaderDamage, evolveCost: 0, variant: "base" });
  }

  const evolveBonus = card.evolveLeaderBonus || 0;
  const evolveEffectDamage = card.evolveEffectLeaderDamage || 0;
  const hasEvolveDamage = card.requiresEvolve || evolveBonus > 0 || evolveEffectDamage > 0;

  if (evolvePoints > 0 && hasEvolveDamage) {
    // 超進化フォロワーの破壊時打点は超進化できるターンのみ加算
    const killBonus = canSuperEvolve() ? (card.superEvolveKillDamage || 0) : 0;
    const confirmedDamage = Math.max(card.leaderDamage + evolveBonus, evolveEffectDamage);
    const evolveLabel = requiresSuper
      ? (lang === "ja" ? "超進化" : "Super-evolve")
      : (lang === "ja" ? "進化" : "Evolve");
    variants.push({
      ...card,
      baseLeaderDamage: card.leaderDamage,
      evolveCost: 1,
      variant: requiresSuper ? "super-evolve" : "evolve",
      leaderDamage: confirmedDamage + killBonus,
      killDamage: killBonus,
      stormDamage: card.stormDamage + evolveBonus,
      burnDamage: card.stormDamage > 0 ? card.burnDamage : Math.max(card.burnDamage, evolveEffectDamage),
      condition: variantCondition(card, evolveLabel),
    });
  }

  const stormBreakdown = stormDamageBreakdown(card);
  if (canSuperEvolve() && stormBreakdown) {
    variants.push({
      ...card,
      baseLeaderDamage: card.leaderDamage,
      evolveCost: 1,
      variant: "super-evolve",
      leaderDamage: stormBreakdown.superEvolve,
      stormDamage: card.stormDamage + 3,
      burnDamage: card.burnDamage,
      condition: variantCondition(card, lang === "ja" ? "超進化" : "Super-evolve"),
    });
  }

  return variants.filter((variant) => variant.leaderDamage > 0);
}

function comboThreats(cards) {
  if (turnsPlayed == null) return [];
  const maxPp = Math.min(11, turnsPlayed);
  const maxEvolve = Math.max(0, evolvePoints);
  const table = Array.from({ length: maxPp + 1 }, () =>
    Array.from({ length: maxEvolve + 1 }, () => []),
  );
  table[0][0] = [{ cards: [], cost: 0, evolveCost: 0, leaderDamage: 0, stormDamage: 0, burnDamage: 0 }];

  for (const card of cards) {
    const variants = threatVariants(card).filter((variant) => variant.effectiveCost > 0);
    for (let cost = maxPp; cost >= 0; cost -= 1) {
      for (let evo = maxEvolve; evo >= 0; evo -= 1) {
        for (const combo of table[cost][evo]) {
          for (const variant of variants) {
            const nextCost = cost + variant.effectiveCost;
            const nextEvo = evo + variant.evolveCost;
            if (nextCost > maxPp || nextEvo > maxEvolve) continue;
            table[nextCost][nextEvo].push({
              cards: [...combo.cards, variant],
              cost: combo.cost + variant.effectiveCost,
              evolveCost: combo.evolveCost + variant.evolveCost,
              leaderDamage: combo.leaderDamage + variant.leaderDamage,
              stormDamage: combo.stormDamage + variant.stormDamage,
              burnDamage: combo.burnDamage + variant.burnDamage,
            });
          }
        }
      }
    }
    for (let cost = 0; cost <= maxPp; cost += 1) {
      for (let evo = 0; evo <= maxEvolve; evo += 1) {
        table[cost][evo] = pruneCombos(table[cost][evo], 15);
      }
    }
  }

  return pruneCombos(table.flat(2).filter((combo) => combo.cards.length > 0), 15);
}

function pruneCombos(combos, limit) {
  const seen = new Set();
  return combos
    .sort((a, b) => {
      if (b.leaderDamage !== a.leaderDamage) return b.leaderDamage - a.leaderDamage;
      if (a.cost !== b.cost) return a.cost - b.cost;
      return a.cards.length - b.cards.length;
    })
    .filter((combo) => {
      const key = combo.cards.map((card) => `${card.id}:${card.variant}:${card.leaderDamage}`).sort().join(",");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

function cardImageUrl(card) {
  const hasDisplayImage = card.displayCard?.ja?.imageHash || card.displayCard?.en?.imageHash;
  const imageCard = hasDisplayImage ? card.displayCard : card;
  const localized = imageCard[lang];
  const fallback = imageCard.en;
  const imageHash = localized.imageHash || fallback.imageHash;
  const languagePath = localized.imageHash ? (lang === "ja" ? "jpn" : "eng") : "eng";
  return `https://shadowverse-wb.com/uploads/card_image/${languagePath}/card/${imageHash}.png`;
}

function formatDamage(value) {
  return `${value} ${ui[lang].damage}`;
}

function renderDamageBreakdown(card) {
  const breakdown = stormDamageBreakdown(card);
  if (!breakdown) return "";
  // ターン6未満は超進化できないため、超進化打点(x)を除いた 進化/通常(y/z) のみ表示
  const withSuper = canSuperEvolve();
  const label = withSuper ? ui[lang].damageBreakdown : ui[lang].damageBreakdownNoSuper;
  const maxParts = withSuper
    ? [breakdown.superEvolve, breakdown.evolve, breakdown.base]
    : [breakdown.evolve, breakdown.base];
  const max = maxParts.join("/");
  if (breakdown.min) {
    const minStr = (withSuper ? breakdown.min : breakdown.min.slice(1)).join("/");
    return `<span class="damage-breakdown"><small>${label}</small>${max}~${minStr}</span>`;
  }
  return `<span class="damage-breakdown"><small>${label}</small>${max}</span>`;
}

function renderKillDamageBreakdown(card) {
  if (!card.killDamage) return "";
  const base = card.leaderDamage - card.killDamage;
  return `<span class="damage-breakdown"><small>${ui[lang].killBreakdown}</small>${card.leaderDamage}/${base}</span>`;
}

const classIcons = window.SHADOWVERSE_CLASS_ICONS || {};
// クリーン版（clean.html）では公式カード画像を一切読み込まず、自作のクラス紋章タイルで代替する。
const useGeneratedArt = window.NO_OFFICIAL_ART === true;

function classIconMarkup(key) {
  const svg = classIcons[key];
  return svg ? `<span class="class-icon" aria-hidden="true">${svg}</span>` : "";
}

function cardArtMarkup(card, label, variant) {
  const sizeClass = variant === "combo" ? "combo-art" : "threat-art";
  if (useGeneratedArt) {
    const cls = card.classKey || "neutral";
    return `<div class="${sizeClass} card-thumb" data-class="${cls}" role="img" aria-label="${label}">${classIconMarkup(cls)}</div>`;
  }
  return `<img class="${sizeClass}" src="${cardImageUrl(card)}" alt="${label}" loading="lazy" />`;
}

function renderClassButtons() {
  fields.classButtons.innerHTML = classEntries()
    .map(([key, names]) => {
      const pressed = key === enemyClass ? "true" : "false";
      return `<button class="class-button" type="button" data-class="${key}" aria-pressed="${pressed}">${classIconMarkup(key)}<span class="class-label">${names[lang]}</span></button>`;
    })
    .join("");
}

function renderFormatButtons() {
  fields.formatButtons.innerHTML = ["rotation", "unlimited"]
    .map((key) => {
      const pressed = key === format ? "true" : "false";
      return `<button class="class-button" type="button" data-format="${key}" aria-pressed="${pressed}">${classIconMarkup(key)}<span class="class-label">${ui[lang][key]}</span></button>`;
    })
    .join("");
}

function renderDamageModeButtons() {
  fields.damageModeButtons.innerHTML = ["single", "combo"]
    .map((key) => {
      const pressed = key === damageMode ? "true" : "false";
      const badge = key === "combo"
        ? ` <span class="mode-badge">${ui[lang].experimental}</span>`
        : "";
      return `<button class="class-button" type="button" data-damage-mode="${key}" aria-pressed="${pressed}">${ui[lang][key]}${badge}</button>`;
    })
    .join("");
}

function renderThreatCard(card) {
  const selectedCard = card[lang];
  const dcHasImage = card.displayCard?.ja?.imageHash || card.displayCard?.en?.imageHash;
  const displayName = dcHasImage ? (card.displayCard?.[lang]?.name || selectedCard.name) : selectedCard.name;
  const imageLabel = displayName;
  const isLethal = !card.xDamage && card.leaderDamage >= currentHealth;
  const primaryDamage = card.crestBreakdown
    ? `<span class="damage-breakdown"><small>${lang === "ja" ? "クレスト" : "Crest"}</small>${card.crestBreakdown}</span>`
    : card.stormBreakdownMax
      ? renderDamageBreakdown(card)
      : renderKillDamageBreakdown(card) || renderDamageBreakdown(card)
        || `<span class="damage-line leader"><small>${ui[lang].leaderDamage}</small>${formatDamage(card.leaderDamage)}</span>`;
  const xDamageMarkup = card.xDamage
    ? `<span class="damage-line leader"><small>${ui[lang].leaderDamage}</small>X${card.killDamage ? ` (+${card.killDamage})` : ""}</span>`
    : "";
  const damageMarkup = card.xDamage ? xDamageMarkup : primaryDamage;
  return `
    <article class="threat-card ${isLethal ? "is-lethal" : ""}">
      ${cardArtMarkup(card, imageLabel, "single")}
      <div class="threat-copy">
        <strong>${displayName}</strong>
        <p class="card-effect">${selectedCard.effect}</p>
        <button class="detail-button" type="button">${lang === "ja" ? "詳細" : "Details"}</button>
        <div class="threat-meta">
          <span>${ui[lang].cost}: ${card.cost}</span>
          <span>${ui[lang].condition}: ${card.condition}</span>
        </div>
      </div>
      <div class="threat-damage" aria-label="${ui[lang].leaderDamage} ${card.leaderDamage}">
        ${damageMarkup}
      </div>
    </article>
  `;
}

function renderCombo(combo) {
  const names = combo.cards.map((card) => card.displayCard?.[lang]?.name || card[lang].name).join(" + ");
  let runningDamage = 0;
  const runningRows = combo.cards.map((card) => {
    const cardName = card.displayCard?.[lang]?.name || card[lang].name;
    runningDamage += card.leaderDamage;
    const label = card.variant === "super-evolve"
      ? (lang === "ja" ? "超進化" : "SE")
      : card.variant === "evolve"
        ? (lang === "ja" ? "進化" : "EV")
        : "";
    return `<li><span>${cardName}${label ? ` (${label})` : ""}</span><strong>+${card.leaderDamage} = ${runningDamage}</strong></li>`;
  }).join("");
  const cardImages = combo.cards.map((card) => {
    const imageLabel = card.displayCard?.[lang]?.name || card[lang].name;
    return cardArtMarkup(card, imageLabel, "combo");
  }).join("");
  return `
    <article class="threat-card combo-card ${combo.leaderDamage >= currentHealth ? "is-lethal" : ""}">
      <div class="combo-art-strip" aria-label="${names}">
        ${cardImages}
      </div>
      <div class="threat-copy">
        <strong>${names}</strong>
        <p>${ui[lang].comboCards}: ${combo.cards.length}</p>
        <ol class="combo-damage-list" aria-label="${ui[lang].accumulatedDamage}">
          ${runningRows}
        </ol>
        <div class="threat-meta">
          <span>${ui[lang].cost}: ${combo.cost}</span>
        </div>
      </div>
      <div class="threat-damage" aria-label="${ui[lang].leaderDamage} ${combo.leaderDamage}">
        <span class="damage-line leader"><small>${ui[lang].leaderDamage}</small>${formatDamage(combo.leaderDamage)}</span>
      </div>
    </article>
  `;
}

function ensureSelectedClassHasCards() {
  const visibleClasses = classEntries();
  if (enemyClass != null && !visibleClasses.some(([key]) => key === enemyClass) && visibleClasses.length > 0) {
    enemyClass = visibleClasses[0][0];
  }
}

function render() {
  ensureSelectedClassHasCards();
  const text = ui[lang];
  const singleThreats = damageMode === "combo" ? baseThreats() : availableThreats();
  const threats = damageMode === "combo" ? comboThreats(singleThreats) : singleThreats;
  const inputComplete = turnsPlayed != null && currentHealth != null;
  const enemyMaxPp = inputComplete ? Math.min(11, turnsPlayed) : 0;
  const stormDamage = Math.max(0, ...threats.map((card) => card.stormDamage));
  const burnDamage = Math.max(0, ...threats.map((card) => card.burnDamage));
  const visibleLeaderDamage = Math.max(0, ...threats.map((card) => card.leaderDamage));

  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = text[node.dataset.i18n];
  });

  fields.language.textContent = text.languageButton;
  fields.theme.textContent = theme === "dark" ? "☀️" : "🌙";
  fields.turnInput.value = inputComplete ? String(turnsPlayed) : "";
  fields.turnOutput.textContent = inputComplete ? turnsPlayed : "";
  fields.healthInput.value = inputComplete ? String(currentHealth) : "";
  fields.healthOutput.textContent = inputComplete ? currentHealth : "";
  fields.stormDamage.textContent = inputComplete ? formatDamage(stormDamage) : "";
  fields.burnDamage.textContent = inputComplete ? formatDamage(burnDamage) : "";
  fields.maxThreat.textContent = inputComplete ? formatDamage(visibleLeaderDamage) : "";
  fields.enemyLethal.textContent = inputComplete
    ? visibleLeaderDamage >= currentHealth
      ? `${text.lethal}: ${formatDamage(visibleLeaderDamage)}`
      : text.none
    : "";
  
  const hasLethal = inputComplete && visibleLeaderDamage >= currentHealth;
  if (hasLethal) {
    fields.enemyLethal.parentElement.classList.add("is-lethal");
  } else {
    fields.enemyLethal.parentElement.classList.remove("is-lethal");
  }
  
  fields.enemyThreatTotal.textContent = inputComplete
    ? `${text.leaderDamage}: ${formatDamage(visibleLeaderDamage)} / HP ${currentHealth}`
    : "";
  fields.enemyThreats.innerHTML =
    threats.length > 0
      ? threats.map(damageMode === "combo" ? renderCombo : renderThreatCard).join("")
      : `<p class="empty-threat">${text.noThreats}</p>`;

  renderClassButtons();
  renderFormatButtons();
  renderDamageModeButtons();
}

fields.enemyThreats.addEventListener("click", (event) => {
  const btn = event.target.closest(".detail-button");
  if (!btn) return;
  const p = btn.previousElementSibling;
  if (!p) return;
  const expanded = p.classList.toggle("expanded");
  btn.textContent = expanded ? (lang === "ja" ? "閉じる" : "Close") : (lang === "ja" ? "詳細" : "Details");
});

fields.turnInput.addEventListener("input", (event) => {
  turnsPlayed = Number(event.target.value);
  render();
});

fields.healthInput.addEventListener("input", (event) => {
  currentHealth = Number(event.target.value);
  render();
});

fields.classButtons.addEventListener("click", (event) => {
  const button = event.target.closest("[data-class]");
  if (!button) return;
  enemyClass = button.dataset.class;
  render();
});

fields.formatButtons.addEventListener("click", (event) => {
  const button = event.target.closest("[data-format]");
  if (!button) return;
  format = button.dataset.format;
  render();
});

fields.damageModeButtons.addEventListener("click", (event) => {
  const button = event.target.closest("[data-damage-mode]");
  if (!button) return;
  damageMode = button.dataset.damageMode;
  render();
});

fields.language.addEventListener("click", () => {
  lang = lang === "ja" ? "en" : "ja";
  saveSetting(SETTINGS_KEYS.lang, lang);
  render();
});

// ── モバイル横スワイプページ（入力 ⇆ 結果） ──
// スマホ幅では入力欄と結果一覧を横並びの2ページにし、スワイプ/ボタンで切り替える。
// タッチを自前で処理し、画面幅の1/3以上のドラッグか明確なフリックのときだけ
// ページを移動する（標準スクロールスナップは感度が強すぎるため）。
// コンテナの高さは表示中ページに合わせて補間し、非表示ページ分の縦余白を消す。
const swipePages = document.querySelector("#swipe-pages");
const swipePageList = Array.from(document.querySelectorAll(".swipe-page"));
const swipeMq = window.matchMedia("(max-width: 760px)");
let swipeIndex = 0;

function swipeStep() {
  const gap = parseFloat(getComputedStyle(swipePages).columnGap) || 0;
  return swipePages.clientWidth + gap;
}

function applySwipeOffset(offset) {
  for (const page of swipePageList) page.style.transform = `translateX(${offset}px)`;
}

function swipeHeightAt(progress) {
  const [inputPage, resultPage] = swipePageList;
  const p = Math.min(1, Math.max(0, progress));
  return Math.ceil(inputPage.offsetHeight + (resultPage.offsetHeight - inputPage.offsetHeight) * p);
}

function settleSwipe(animate) {
  swipePages.classList.toggle("is-animating", animate);
  applySwipeOffset(-swipeIndex * swipeStep());
  swipePages.style.height = `${swipeHeightAt(swipeIndex)}px`;
}

function goToSwipePage(index) {
  swipeIndex = Math.min(swipePageList.length - 1, Math.max(0, index));
  settleSwipe(true);
}

function syncSwipeLayout() {
  if (!swipeMq.matches) {
    swipePages.classList.remove("is-animating");
    swipePages.style.height = "";
    for (const page of swipePageList) page.style.transform = "";
    return;
  }
  settleSwipe(false);
}

if (swipePages && swipePageList.length >= 2) {
  let touchState = null;

  swipePages.addEventListener("touchstart", (event) => {
    if (!swipeMq.matches || event.touches.length !== 1) return;
    // スライダーとその操作枠、横スクロールする子要素では自前処理しない
    if (event.target.closest('.turn-input-wrap, input[type="range"], .combo-art-strip')) return;
    touchState = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
      start: performance.now(),
      axis: null,
      dx: 0,
      // スライダー周辺（同じセクション内）はページ切替の感度を下げる
      nearSlider: !!event.target.closest(".turn-control"),
    };
    swipePages.classList.remove("is-animating");
  }, { passive: true });

  swipePages.addEventListener("touchmove", (event) => {
    if (!touchState) return;
    const dx = event.touches[0].clientX - touchState.x;
    const dy = event.touches[0].clientY - touchState.y;
    if (!touchState.axis) {
      const lockDistance = touchState.nearSlider ? 18 : 8;
      const horizontalBias = touchState.nearSlider ? 1.5 : 1;
      if (Math.abs(dx) < lockDistance && Math.abs(dy) < lockDistance) return;
      touchState.axis = Math.abs(dx) > Math.abs(dy) * horizontalBias ? "x" : "y";
    }
    if (touchState.axis !== "x") return;
    if (event.cancelable) event.preventDefault();
    touchState.dx = dx;
    const step = swipeStep();
    let offset = -swipeIndex * step + dx;
    const minOffset = -(swipePageList.length - 1) * step;
    // 端を越えるドラッグはゴムのように抵抗をつける
    if (offset > 0) offset *= 0.3;
    else if (offset < minOffset) offset = minOffset + (offset - minOffset) * 0.3;
    applySwipeOffset(offset);
    swipePages.style.height = `${swipeHeightAt(-offset / step)}px`;
  }, { passive: false });

  const endTouch = () => {
    if (!touchState) return;
    if (touchState.axis === "x") {
      const step = swipeStep();
      const elapsed = Math.max(1, performance.now() - touchState.start);
      const velocity = Math.abs(touchState.dx) / elapsed;
      const draggedFar = Math.abs(touchState.dx) > (touchState.nearSlider ? step / 2 : step / 3);
      const flicked = touchState.nearSlider
        ? velocity > 0.9 && Math.abs(touchState.dx) > 80
        : velocity > 0.6 && Math.abs(touchState.dx) > 48;
      if (draggedFar || flicked) {
        goToSwipePage(swipeIndex + (touchState.dx < 0 ? 1 : -1));
      } else {
        settleSwipe(true);
      }
    }
    touchState = null;
  };
  swipePages.addEventListener("touchend", endTouch);
  swipePages.addEventListener("touchcancel", endTouch);

  window.addEventListener("resize", syncSwipeLayout);
  swipeMq.addEventListener("change", syncSwipeLayout);
  const swipeResizeObserver = new ResizeObserver(() => {
    if (!touchState) syncSwipeLayout();
  });
  swipePageList.forEach((page) => swipeResizeObserver.observe(page));

  document.querySelector("#goto-results")?.addEventListener("click", () => {
    goToSwipePage(1);
    document.querySelector(".match")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  document.querySelector("#goto-input")?.addEventListener("click", () => {
    goToSwipePage(0);
  });
}

fields.theme.addEventListener("click", () => {
  theme = theme === "dark" ? "light" : "dark";
  applyThemeClass();
  saveSetting(SETTINGS_KEYS.theme, theme);
  render();
});

render();
