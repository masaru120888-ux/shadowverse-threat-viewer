let lang = "ja";
let enemyClass = "forest";
let format = "rotation";
let turnsPlayed = 4;
let currentHealth = 20;

const cardData = window.SHADOWVERSE_CARD_DATA || { classes: {}, cards: [] };

const ui = {
  ja: {
    introEyebrow: "相手リーサル確認",
    title: "リーダー打点カード",
    introBody:
      "公式カード一覧から、相手リーダーへダメージを出せるカードだけを表示します。経過ターン数と自分の体力で候補が変わります。",
    turnsPlayed: "経過ターン",
    enemyClass: "相手クラス",
    enemyMaxPp: "相手の最大PP",
    visibleThreats: "表示中の打点",
    classControl: "相手クラス",
    classHelp: "表示する相手クラスを切り替えます。",
    formatControl: "フォーマット",
    formatHelp: "ローテーションまたはアンリミテッドで絞り込みます。",
    rotation: "ローテーション",
    unlimited: "アンリミテッド",
    turnControl: "経過ターンを調整",
    turnHelp: "このターン数までに相手が到達したPPと条件で判定します。",
    healthControl: "自分の体力",
    healthHelp: "相手のリーダー打点がこの体力以上ならリーサル候補として表示します。",
    stormDamage: "相手の疾走/攻撃打点",
    burnDamage: "相手のバーン打点",
    maxThreat: "最大リーダー打点",
    enemyLethal: "相手リーサル候補",
    enemyThreatPreview: "リーダー打点カード",
    cost: "コスト",
    condition: "条件",
    damage: "ダメージ",
    leaderDamage: "リーダー打点",
    noThreats: "この条件で表示できるリーダー打点カードはありません。",
    none: "なし",
    lethal: "リーサル",
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
    turnControl: "Adjust Turns Played",
    turnHelp: "Cards are evaluated against the PP and conditions reachable by this turn.",
    healthControl: "Your Health",
    healthHelp: "If enemy leader damage meets or exceeds this health, it is shown as a lethal out.",
    stormDamage: "Enemy Storm/Attack",
    burnDamage: "Enemy Burn",
    maxThreat: "Highest Leader Damage",
    enemyLethal: "Enemy Lethal Outs",
    enemyThreatPreview: "Leader Damage Cards",
    cost: "Cost",
    condition: "Condition",
    damage: "damage",
    leaderDamage: "Leader damage",
    noThreats: "No leader-damage cards are visible for this condition.",
    none: "None",
    lethal: "Lethal",
    languageButton: "日本語",
  },
};

const fields = {
  language: document.querySelector("#language-button"),
  turnNumber: document.querySelector("#turn-number"),
  turnInput: document.querySelector("#turn-input"),
  turnOutput: document.querySelector("#turn-output"),
  healthInput: document.querySelector("#health-input"),
  healthOutput: document.querySelector("#health-output"),
  classButtons: document.querySelector("#class-buttons"),
  formatButtons: document.querySelector("#format-buttons"),
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
    cardData.cards.some((card) => card.classKey === key && card.leaderDamage > 0 && formatAllows(card)),
  );
}

function formatAllows(card) {
  return format === "unlimited" || card.isRotation;
}

function availableThreats() {
  const enemyMaxPp = Math.min(10, turnsPlayed);
  return cardData.cards
    .filter((card) => card.classKey === enemyClass || card.classKey === "neutral")
    .filter(formatAllows)
    .filter((card) => card.leaderDamage > 0)
    .filter((card) => card.effectiveCost <= enemyMaxPp && card.unlockTurn <= turnsPlayed)
    .sort((a, b) => {
      if (b.leaderDamage !== a.leaderDamage) return b.leaderDamage - a.leaderDamage;
      if (a.effectiveCost !== b.effectiveCost) return a.effectiveCost - b.effectiveCost;
      if (a.cost !== b.cost) return a.cost - b.cost;
      return a[lang].name.localeCompare(b[lang].name);
    });
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

function renderThreatCard(card) {
  const selectedCard = card[lang];
  const imageLabel = card.displayCard?.[lang]?.name || selectedCard.name;
  return `
    <article class="threat-card ${card.leaderDamage >= currentHealth ? "is-lethal" : ""}">
      <img class="threat-art" src="${cardImageUrl(card)}" alt="${imageLabel}" loading="lazy" />
      <div class="threat-copy">
        <strong>${selectedCard.name}</strong>
        <p>${selectedCard.effect}</p>
        <div class="threat-meta">
          <span>${ui[lang].cost}: ${card.cost}</span>
          <span>${ui[lang].condition}: ${card.condition}</span>
        </div>
      </div>
      <div class="threat-damage" aria-label="${ui[lang].leaderDamage} ${card.leaderDamage}">
        <span class="damage-line leader"><small>${ui[lang].leaderDamage}</small>${formatDamage(card.leaderDamage)}</span>
      </div>
    </article>
  `;
}

function ensureSelectedClassHasCards() {
  const visibleClasses = classEntries();
  if (!visibleClasses.some(([key]) => key === enemyClass) && visibleClasses.length > 0) {
    enemyClass = visibleClasses[0][0];
  }
}

function render() {
  ensureSelectedClassHasCards();
  const text = ui[lang];
  const threats = availableThreats();
  const enemyMaxPp = Math.min(10, turnsPlayed);
  const stormDamage = Math.max(0, ...threats.map((card) => card.stormDamage));
  const burnDamage = Math.max(0, ...threats.map((card) => card.burnDamage));
  const visibleLeaderDamage = Math.max(0, ...threats.map((card) => card.leaderDamage));

  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = text[node.dataset.i18n];
  });

  fields.language.textContent = text.languageButton;
  fields.turnNumber.textContent = turnsPlayed;
  fields.turnInput.value = String(turnsPlayed);
  fields.turnOutput.textContent = turnsPlayed;
  fields.healthInput.value = String(currentHealth);
  fields.healthOutput.textContent = currentHealth;
  fields.enemyClass.textContent = cardData.classes[enemyClass]?.[lang] || "-";
  fields.pp.textContent = enemyMaxPp;
  fields.visibleThreatCount.textContent = threats.length;
  fields.stormDamage.textContent = formatDamage(stormDamage);
  fields.burnDamage.textContent = formatDamage(burnDamage);
  fields.maxThreat.textContent = formatDamage(visibleLeaderDamage);
  fields.enemyLethal.textContent =
    visibleLeaderDamage >= currentHealth ? `${text.lethal}: ${formatDamage(visibleLeaderDamage)}` : text.none;
  fields.enemyThreatTotal.textContent = `${text.leaderDamage}: ${formatDamage(visibleLeaderDamage)} / HP ${currentHealth}`;
  fields.enemyThreats.innerHTML =
    threats.length > 0 ? threats.map(renderThreatCard).join("") : `<p class="empty-threat">${text.noThreats}</p>`;

  renderClassButtons();
  renderFormatButtons();
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

fields.language.addEventListener("click", () => {
  lang = lang === "ja" ? "en" : "ja";
  render();
});

render();
