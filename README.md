# Daily Visual Planner

**日本語** | [English below](#english)

macOS 向けのデスクトップアプリです。1日のタスクをタイムラインにブロックとして配置し、確定後はコンパクト表示や PNG 出力、Google Calendar / Slack 連携に対応します。

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
