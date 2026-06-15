# Shadowverse Threat Viewer（逆リーサルチェッカー）

「Shadowverse: Worlds Beyond」向けの**非公式**ファンツール。相手のPP（経過ターン）と
条件から、相手が出せるリーダー打点・リーサル候補カードを一覧表示します。

> ⚠️ 本ツールは非公式・非公認です。株式会社Cygames および「Shadowverse: Worlds Beyond」
> 公式とは一切関係がありません。Shadowverse: Worlds Beyond™ およびカード名・画像・
> テキスト等の著作権は © Cygames, Inc. に帰属します。

## 構成

静的サイト（ビルド不要）。主なファイル:

| ファイル | 役割 |
| --- | --- |
| `index.html` | メインアプリ（公式カード画像版） |
| `official.html` | 比較・ロールバック用の別版（`noindex`） |
| `legal.html` | 利用規約・プライバシーポリシー |
| `contact.html` / `contact.js` | お問い合わせ（mailto 方式） |
| `404.html` | Not Found ページ |
| `styles.css` | 全ページ共通スタイル |
| `app.js` | アプリ本体のロジック・描画 |
| `card-data.js` | カードデータ（自動生成。`window.SHADOWVERSE_CARD_DATA`） |
| `card-overrides.js` | 自動検出できない打点の手動補正 |
| `class-icons.js` | クラス紋章の SVG |
| `scripts/generate-card-data.mjs` | 公式カードリストから `card-data.js` を生成 |

## ローカルでの動作確認

任意の静的サーバーで配信します（Node 18+ 推奨）。

```bash
python3 -m http.server 8000
# → http://localhost:8000/ を開く
```

## カードデータの更新

`card-data.js` は公式のカードリストAPIから生成したスナップショットです。
新カードや調整が入ったら再生成します。**リポジトリのルートで**実行してください。

```bash
npm run generate
# = node scripts/generate-card-data.mjs
```

GitHub Actions の `Refresh card data` ワークフローからも実行できます
（`Actions` タブ → 手動の `Run workflow`）。差分があれば自動コミットされます。
**規約面の配慮から、定期スケジュール（cron）は設定していません**（手動実行のみ）。

## デプロイ

Vercel（静的ホスティング）。本番URL: <https://shadowverse-threat-viewer.vercel.app/>

## ライセンス / 権利表記

- コード: 個人利用の非公式ツール。
- ゲーム関連の名称・画像・テキスト等の権利は © Cygames, Inc. に帰属します。
- 公式の[利用規約](https://shadowverse-wb.com/ja/terms/)・
  [ガイドライン](https://shadowverse-wb.com/ja/guideline/)に従って利用してください。
