// 手動修正オーバーライド。card-data.js が再生成されても維持される。
// Object.assign でカードデータに上書き適用される。
window.SHADOWVERSE_CARD_OVERRIDES = [
  // カミシラ — 超進化3バーン + 除去1
  { id: "10674110", requiresEvolve: true, evolveEffectLeaderDamage: 3, superEvolveKillDamage: 1, condition: "超進化" },
  // シャクドウ — 超進化17 / 進化16 / 通常8
  { id: "10554120", evolveEffectLeaderDamage: 16, superEvolveKillDamage: 1, stormBreakdownMax: [17, 16, 8], condition: "超進化" },
  // クルーエルウォー・ラウラ — 自身疾走不可、他フォロワーに疾走付与(X) + 除去1
  { id: "10253110", xDamage: true, leaderDamage: 0, burnDamage: 0, evolveEffectLeaderDamage: 0, superEvolveKillDamage: 1, requiresEvolve: true, condition: "超進化" },
  // ノクターンジェネラル・エクセラ — 能力による攻撃力変動 8/7/4〜4/3/1
  { id: "10253120", stormBreakdownMax: [8, 7, 4], stormBreakdownMin: [4, 3, 1] },
  // デッドプレゼンター・マクミラン — ネクロ10最大6点 + 除去1
  { id: "10754120", leaderDamage: 3, burnDamage: 3, evolveEffectLeaderDamage: 6, superEvolveKillDamage: 1, condition: "ネクロ10 / 超進化" },
  // カルギデンスラ — 天晶の深淵は打点未知数
  { id: "10634120", xDamage: true },
  // アラ — スペルブースト後0コスト。壮麗なる隼最大4点
  { id: "10534120", effectiveCost: 0, unlockTurn: 0, condition: "スペルブースト後0コスト" },
  // ラブリーマスターピース — 超進化コピー込み最大6点 + 除去1 = 7
  { id: "10734120", evolveEffectLeaderDamage: 6, superEvolveKillDamage: 1, condition: "ラストワード / 超進化" },
  // カリオストロ — アルス・マグナで2点
  { id: "10434120", leaderDamage: 2, burnDamage: 2 },
  // イランツァ — 超進化 + 除去1
  { id: "10544110", superEvolveKillDamage: 1, condition: "超進化" },
  // マーウィン — 進化でクレスト付与、最大5点
  { id: "10364120", leaderDamage: 5, burnDamage: 5, crestBreakdown: "5/4/3/2/1" },
];
