# Daily Visual Planner

**日本語** | [English below](#english)

macOS 向けのデスクトップアプリです。1日のタスクをタイムラインにブロックとして配置し、確定後はコンパクト表示や PNG 出力、Google Calendar / Slack 連携に対応します。

## 必要環境

- **Node.js** 20 以上（推奨: 22）
- **macOS**（開発・パッケージング想定。`npm run build` 自体は Linux CI でも実行可能）

## セットアップ

```bash
git clone https://github.com/YOUR_USERNAME/ScheduleBlocker.git
cd ScheduleBlocker
npm ci
```

> `YOUR_USERNAME` はご自身の GitHub ユーザー名または組織名に置き換えてください。

## 開発

```bash
npm run dev
```

## ビルド

型チェック + レンダラー／Electron メイン・プリロードのビルド:

```bash
npm run build
```

macOS アプリ（`.app`）を `release/` に出力:

```bash
npm run pack
```

## データとセキュリティ

- 開発時、プランと設定の JSON はリポジトリ直下の **`data/`** に保存されます（`.gitignore` で除外済み）。
- **OAuth Client Secret、Slack Bot Token、リフレッシュトークン等はリポジトリに含めないでください。**
- 本番パッケージでは `userData` 配下に保存されます。

## アイコン（macOS）

`build/icon.icns` を使っています。再生成する場合は `build/generate-icon.mjs` と `iconutil`（macOS）を利用できます（詳細は `build/` 内スクリプト参照）。

## GitHub に公開する手順

1. GitHub で **新しい空のリポジトリ** を作成（README は作らないとコンフリクトしにくいです）。
2. このリポジトリ内の **`YOUR_USERNAME`** を実際のユーザー名または組織名に置き換える:
   - `README.md` の `git clone` URL
   - `package.json` の `repository.url`
3. （任意）`git config user.name` / `user.email` を公開用に設定。
4. プッシュ:

```bash
git remote add origin https://github.com/YOUR_USERNAME/ScheduleBlocker.git
git push -u origin main
```

5. GitHub の **Settings → Secrets and variables → Actions** は、現状の CI では不要です（ビルドのみ）。

**公開前の確認:** `git status` で `data/` や `.env` が含まれていないこと、`npm run build` が通ることを確認してください。

## ライセンス

[MIT](LICENSE)

---

## English

Daily **Electron + React + TypeScript** app for planning your day on a timeline. Features optional **Google Calendar / Tasks** import-export and **Slack** image sharing, **Japanese/English** UI, and privacy options for exports.

### Setup

```bash
git clone https://github.com/YOUR_USERNAME/ScheduleBlocker.git
cd ScheduleBlocker
npm ci
npm run dev
```

### Build

```bash
npm run build   # typecheck + Vite bundle
npm run pack    # macOS .app via electron-builder → release/
```

Do **not** commit `data/` or any API secrets; they stay local or in app `userData`.

### License

MIT — see [LICENSE](LICENSE).
