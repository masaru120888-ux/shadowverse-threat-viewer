let lang = "ja";
let theme = "dark";
let enemyClass = null;
let format = "rotation";
let damageMode = "single";
let turnsPlayed = 1;
let currentHealth = 20;
let evolvePoints = 2;

const cardData = window.SHADOWVERSE_CARD_DATA || { classes: {}, cards: [] };

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
    turnControl: "相手が使えるPP",
    turnHelp: "コスト内で脅威となるカードを探します",
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
    cost: "コスト",
    condition: "条件",
    damage: "ダメージ",
    leaderDamage: "リーダー打点",
    noThreats: "この条件で表示できるリーダー打点カードはありません。",
    none: "なし",
    lethal: "リーサル",
    themeButton: "☀️",
    languageButton: "English",
  },
  en: {
    introEyebrow: "Enemy lethal check",
    title: "Leader Damage Cards",
    introBody:
      "Only cards inferred to damage the enemy leader are shown from the official card library. Turns played and your health change the visible candidates.",
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
    cost: "Cost",
    condition: "Condition",
    damage: "damage",
    leaderDamage: "Leader damage",
    noThreats: "No leader-damage cards are visible for this condition.",
    none: "None",
    lethal: "Lethal",
    themeButton: "🌙",
    languageButton: "日本語",
  },
};

const fields = {
  language: document.querySelector("#language-button"),
  theme: document.querySelector("#theme-button"),
  turnNumber: document.querySelector("#turn-number"),
  turnInput: document.querySelector("#turn-input"),
  turnOutput: document.querySelector("#turn-output"),
  healthInput: document.querySelector("#health-input"),
  healthOutput: document.querySelector("#health-output"),
  classButtons: document.querySelector("#class-buttons"),
  formatButtons: document.querySelector("#format-buttons"),
  damageModeButtons: document.querySelector("#damage-mode-buttons"),
  enemyClass: document.querySelector("#enemy-class"),
  pp: document.querySelector("#pp-display"),
  visibleThreatCount: document.querySelector("#visible-threat-count"),
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
  return card.leaderDamage > 0 || card.evolveEffectLeaderDamage > 0;
}

function baseThreats() {
  if (turnsPlayed == null) return [];
  const enemyMaxPp = Math.min(10, turnsPlayed);
  return cardData.cards
    .filter((card) => card.classKey === enemyClass || card.classKey === "neutral")
    .filter(formatAllows)
    .filter(hasLeaderDamage)
    .filter((card) => card.effectiveCost <= enemyMaxPp && card.unlockTurn <= turnsPlayed);
}

function availableThreats() {
  const seenNames = new Set();
  return baseThreats()
    .map(resolveThreatDamage)
    .filter(Boolean)
    .sort((a, b) => {
      if (b.leaderDamage !== a.leaderDamage) return b.leaderDamage - a.leaderDamage;
      if (a.effectiveCost !== b.effectiveCost) return a.effectiveCost - b.effectiveCost;
      if (a.cost !== b.cost) return a.cost - b.cost;
      return a[lang].name.localeCompare(b[lang].name);
    })
    .filter((card) => {
      const name = card[lang]?.name || card.en?.name || "";
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
  if (card.stormDamage <= 0) return null;
  const base = card.baseLeaderDamage ?? card.leaderDamage;
  return {
    base,
    evolve: base + 2,
    superEvolve: base + 3,
  };
}

function variantCondition(card, label) {
  return [
    card.condition,
    label,
  ].filter(Boolean).join(" / ");
}

function threatVariants(card) {
  const variants = [];
  if (!card.requiresEvolve) {
    variants.push({ ...card, baseLeaderDamage: card.leaderDamage, evolveCost: 0, variant: "base" });
  }

  const evolveBonus = card.evolveLeaderBonus || 0;
  const evolveEffectDamage = card.evolveEffectLeaderDamage || 0;
  const hasEvolveDamage = card.requiresEvolve || evolveBonus > 0 || evolveEffectDamage > card.leaderDamage;

  if (evolvePoints > 0 && hasEvolveDamage) {
    variants.push({
      ...card,
      baseLeaderDamage: card.leaderDamage,
      evolveCost: 1,
      variant: "evolve",
      leaderDamage: Math.max(card.leaderDamage + evolveBonus, evolveEffectDamage),
      stormDamage: card.stormDamage + evolveBonus,
      burnDamage: Math.max(card.burnDamage, evolveEffectDamage),
      condition: variantCondition(card, lang === "ja" ? "進化" : "Evolve"),
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
  const maxPp = Math.min(10, turnsPlayed);
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
  const imageCard = card.displayCard || card;
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
  const values = [breakdown.superEvolve, breakdown.evolve, breakdown.base].join("/");
  return `<span class="damage-breakdown"><small>${ui[lang].damageBreakdown}</small>${values}</span>`;
}

function renderClassButtons() {
  fields.classButtons.innerHTML = classEntries()
    .map(([key, names]) => {
      const pressed = key === enemyClass ? "true" : "false";
      return `<button class="class-button" type="button" data-class="${key}" aria-pressed="${pressed}">${names[lang]}</button>`;
    })
    .join("");
}

function renderFormatButtons() {
  fields.formatButtons.innerHTML = ["rotation", "unlimited"]
    .map((key) => {
      const pressed = key === format ? "true" : "false";
      return `<button class="class-button" type="button" data-format="${key}" aria-pressed="${pressed}">${ui[lang][key]}</button>`;
    })
    .join("");
}

function renderDamageModeButtons() {
  fields.damageModeButtons.innerHTML = ["single", "combo"]
    .map((key) => {
      const pressed = key === damageMode ? "true" : "false";
      return `<button class="class-button" type="button" data-damage-mode="${key}" aria-pressed="${pressed}">${ui[lang][key]}</button>`;
    })
    .join("");
}

function renderThreatCard(card) {
  const selectedCard = card[lang];
  const displayName = card.displayCard?.[lang]?.name || selectedCard.name;
  const imageLabel = card.displayCard?.[lang]?.name || selectedCard.name;
  const damageBreakdown = renderDamageBreakdown(card);
  const isLethal = card.leaderDamage >= currentHealth;
  const crestDamageMarkup = isLethal && card.crestDamage
    ? `<span class="damage-line"><small>${lang === "ja" ? "クレスト" : "Crest"}</small>${formatDamage(card.crestDamage)}</span>`
    : "";
  const damageMarkup = damageBreakdown ||
    `<span class="damage-line leader"><small>${ui[lang].leaderDamage}</small>${formatDamage(card.leaderDamage)}</span>`;
  return `
    <article class="threat-card ${isLethal ? "is-lethal" : ""}">
      <img class="threat-art" src="${cardImageUrl(card)}" alt="${imageLabel}" loading="lazy" />
      <div class="threat-copy">
        <strong>${displayName}</strong>
        <p>${selectedCard.effect}</p>
        <div class="threat-meta">
          <span>${ui[lang].cost}: ${card.cost}</span>
          <span>${ui[lang].condition}: ${card.condition}</span>
        </div>
      </div>
      <div class="threat-damage" aria-label="${ui[lang].leaderDamage} ${card.leaderDamage}">
        ${damageMarkup}
        ${crestDamageMarkup}
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
    return `<img class="combo-art" src="${cardImageUrl(card)}" alt="${imageLabel}" loading="lazy" />`;
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
  const enemyMaxPp = inputComplete ? Math.min(10, turnsPlayed) : 0;
  const stormDamage = Math.max(0, ...threats.map((card) => card.stormDamage));
  const burnDamage = Math.max(0, ...threats.map((card) => card.burnDamage));
  const visibleLeaderDamage = Math.max(0, ...threats.map((card) => card.leaderDamage));

  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = text[node.dataset.i18n];
  });

  fields.language.textContent = text.languageButton;
  fields.theme.textContent = theme === "light" ? ui[lang].themeButton : "🌙";
  fields.turnNumber.textContent = inputComplete ? turnsPlayed : "";
  fields.turnInput.value = inputComplete ? String(turnsPlayed) : "";
  fields.turnOutput.textContent = inputComplete ? turnsPlayed : "";
  fields.healthInput.value = inputComplete ? String(currentHealth) : "";
  fields.healthOutput.textContent = inputComplete ? currentHealth : "";
  fields.enemyClass.textContent = enemyClass ? cardData.classes[enemyClass]?.[lang] || "" : "";
  fields.pp.textContent = inputComplete ? enemyMaxPp : "";
  fields.visibleThreatCount.textContent = inputComplete ? threats.length : "";
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
  render();
});

fields.theme.addEventListener("click", () => {
  theme = theme === "dark" ? "light" : "dark";
  if (theme === "light") {
    document.documentElement.classList.add("light-mode");
  } else {
    document.documentElement.classList.remove("light-mode");
  }
  fields.theme.textContent = theme === "light" ? ui[lang].themeButton : "🌙";
  render();
});

render();
