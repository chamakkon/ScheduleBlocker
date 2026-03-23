# Daily Visual Planner

**日本語** | [English below](#english)

macOS 向けのデスクトップアプリです。1日のタスクをタイムラインにブロックとして配置し、確定後はコンパクト表示や PNG 出力、Google Calendar / Slack 連携に対応します。

---

## 使い方（利用説明）

### 画面の構成

- **左（Tasks）**: その日使うタスク候補のリスト。ここからタイムラインへドラッグして配置します。
- **右（スケジュール）**: 07:00〜24:00 のタイムライン。ブロックの高さが時間の長さです。
- **上部バー**: 日付、保存、PNG 出力、確定／編集、設定、連携ボタン（設定で有効化した場合）など。

> **📷 挿入したい画像メモ:** アプリ全体のスクリーンショット（**編集モード**で、左タスク一覧＋右タイムラインが両方入る構図）。ファイル名例: `docs/screenshots/01-main-editing.png`

### 基本的な流れ

1. **タスクを追加**  
   **Tasks** 欄の「+ 新規」でタスクを作ります。タイトルをクリックして名前を入力し、色・所要時間（分）・サブタスク・メモは必要に応じて開いて編集します。
2. **タイムラインに配置**  
   タスク行をドラッグし、右のタイムライン上で離すと、その位置にブロックが置かれます。**一度置くとそのタスクはリストから消えます**（同じ内容を再度使う場合はタスクの「⊕」で複製）。
3. **ブロックの調整**  
   ブロックをドラッグして時刻を移動。上下端のつまみで開始・終了時刻を変更。ブロックの削除はブロック上の操作から行います。
4. **保存**  
   上部の **Save** でプランを保存します（自動保存ではありません）。
5. **確定（Finalize）**  
   **Finalize** で「今日のプラン」を確定すると、**表示がタイムライン中心のコンパクト表示**になり、ウィンドウ幅も狭くなります。**Edit** で再度編集モードに戻せます。

> **📷 挿入したい画像メモ:** 同じ画面の **確定後（コンパクト）** のスクリーンショット。タイムラインが主役になった状態が分かること。例: `docs/screenshots/02-compact-mode.png`  
> **🎬 動画メモ（任意）:** タスクをドラッグしてタイムラインにドロップするまでを **5〜15 秒** で録画した GIF または動画リンク。説明の直後に置くと分かりやすい。

### Google Calendar / Tasks（設定で有効化した場合）

- **GCal**: 当日の Google カレンダー予定を取り込み、**読み取り専用のブロック**として表示します（色はインポート時に近い色へマッピング）。
- **GTasks**: 未完了タスクをタスク候補として取り込みます。
- **→ GCal**（確定後など）: アプリ側のローカルブロックを Google カレンダーへ書き出します（仕様は設定・要件に従います）。

> **📷 挿入したい画像メモ:** **GCal 取り込み後**のタイムラインで、外部予定ブロック（低彩度・GCal 表示など）が分かるクローズアップ。個人情報はモザイク可。例: `docs/screenshots/03-gcal-blocks.png`

### Slack・PNG

- **PNG**: タイムライン表示を画像として保存します。
- **Slack**: 同じ表示を画像として Slack に投稿します（Bot 設定が必要）。

> **📷 挿入したい画像メモ:** 設定画面の **Slack / Google 連携セクション**が一覧で分かるスクショ（Client ID 等の秘密は隠す）。例: `docs/screenshots/04-settings-integrations.png`

### 設定（Settings）

- **言語**: 日本語 / English
- **プライバシー**: PNG / Slack 共有時に **Google カレンダー由来の予定タイトルを匿名化**するオプション
- **Google / Slack**: **Connect** を押すと **入力内容が保存されたうえで**接続フローが始まります（先に Save しなくてよい）。

> **📷 挿入したい画像メモ:** **言語＋プライバシー**のチェックボックスが写る設定画面上部。例: `docs/screenshots/05-settings-language-privacy.png`

### ヒント

- タイムラインには **現在時刻の赤いライン**が表示されます。
- テンプレート機能（**+ テンプレ**）でよく使うタスクをまとめて追加できます。

---

## メディア挿入メモ（後でスクショ・録画して埋め込む用）

以下を `docs/screenshots/` に保存し、上記の該当箇所に Markdown で貼り付けてください。

| # | 種類 | 内容 | 推奨ファイル名 |
|---|------|------|----------------|
| 1 | 画像 | 編集モード全体（左タスク＋右タイムライン） | `01-main-editing.png` |
| 2 | 画像 | 確定後コンパクト表示 | `02-compact-mode.png` |
| 3 | 画像 | GCal 取り込みブロックの見た目（個人情報はマスク） | `03-gcal-blocks.png` |
| 4 | 画像 | 設定の連携・言語・プライバシー周り | `04-settings-integrations.png` `05-settings-language-privacy.png` |
| 5 | 動画 or GIF | タスクをドラッグ＆ドロップで配置する操作 | `06-drag-to-timeline.gif` または外部ホストの動画 URL |

**埋め込み例（画像を追加したあと）:**

```markdown
![編集画面](docs/screenshots/01-main-editing.png)
```

**動画:** GitHub README では動画ファイルの直接埋め込みは弱いので、**GIF** にするか **YouTube / Loom 等のリンク**を置くのがおすすめです。

---

## 必要環境

- **Node.js** 20 以上（推奨: 22）
- **macOS**（開発・パッケージング想定。`npm run build` 自体は Linux CI でも実行可能）

## セットアップ

```bash
git clone https://github.com/chamakkon/ScheduleBlocker.git
cd ScheduleBlocker
npm ci
```

## 開発

```bash
npm run dev
```

## ビルド

型チェック + レンダラー／Electron メイン・プリロードのビルド:

```bash
npm run build
```

macOS アプリ（`.app` のみ、開発用）を `release/` に出力:

```bash
npm run pack
```

配布用 **DMG / ZIP**（アップロードなし）:

```bash
npm run dist
```

**GitHub Release へ公開**する手順は **[docs/PUBLISH.md](docs/PUBLISH.md)** を参照。  
タグ `v*` を push すると **GitHub Actions** で `npm run release` が走る設定です。

## データとセキュリティ

- 開発時、プランと設定の JSON はリポジトリ直下の **`data/`** に保存されます（`.gitignore` で除外済み）。
- **OAuth Client Secret、Slack Bot Token、リフレッシュトークン等はリポジトリに含めないでください。**
- 本番パッケージでは `userData` 配下に保存されます。

## アイコン（macOS）

`build/icon.icns` を使っています。再生成する場合は `build/generate-icon.mjs` と `iconutil`（macOS）を利用できます（詳細は `build/` 内スクリプト参照）。


## ライセンス

[MIT](LICENSE)

---

## English

Daily **Electron + React + TypeScript** app for planning your day on a timeline. Features optional **Google Calendar / Tasks** import-export and **Slack** image sharing, **Japanese/English** UI, and privacy options for exports.

### Setup

```bash
git clone https://github.com/chamakkon/ScheduleBlocker.git
cd ScheduleBlocker
npm ci
npm run dev
```

### Build

```bash
npm run build   # typecheck + Vite bundle
npm run pack    # macOS .app only → release/
npm run dist    # DMG + ZIP locally (no upload)
```

See [docs/PUBLISH.md](docs/PUBLISH.md) for GitHub Releases.

Do **not** commit `data/` or any API secrets; they stay local or in app `userData`.

### License

MIT — see [LICENSE](LICENSE).
