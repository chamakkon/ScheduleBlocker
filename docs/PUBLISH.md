# GitHub Release への公開手順

## 準備

- `package.json` の **`repository`** と **`build.publish`** の `owner` / `repo` が、実際の GitHub リポジトリと一致していること（現在: `chamakkon/ScheduleBlocker`）。
- バージョンは **`package.json` の `version`** と Git の **タグ**を揃える（例: `1.0.1` と `v1.0.1`）。

## 方法 A: GitHub Actions（推奨）

1. `package.json` の `version` を上げる（例: `1.0.1`）。
2. コミットして push。
3. タグを付けて push:

```bash
git tag v1.0.1
git push origin v1.0.1
```

`.github/workflows/release.yml` が動き、`npm run release` で **arm64 / x64** の **DMG・ZIP** と更新用メタデータが **GitHub Releases** に載ります。

## 方法 B: ローカルから公開

1. [GitHub の Fine-grained または classic PAT](https://github.com/settings/tokens) で **`repo`** 権限（リポジトリへの書き込み）を付与したトークンを作成。
2. ターミナルで:

```bash
export GH_TOKEN=ghp_xxxxxxxx   # 他人に見せない
npm version patch   # または package.json を手で編集
git push --follow-tags
# または version だけ上げたあと:
npm run release
```

`release` は `electron-builder --publish always` のため、**既存の Git タグ / Release と整合した version** にしておくこと。

## ローカルで成果物だけ作る（アップロードしない）

```bash
npm run dist
```

`release/` に DMG・ZIP が出力されます（`--publish never`）。

## 開発用の .app だけ（従来どおり）

```bash
npm run pack
```

## 自動更新（update.electronjs.org）

- パッケージ版起動時に `update-electron-app` が [update.electronjs.org](https://update.electronjs.org) を参照します。
- **公開リポジトリ**かつ **GitHub Releases に正しい成果物**があることが前提です。
- **macOS ではコード署名・公証**があるとユーザー環境でスムーズです。現状は `hardenedRuntime: false` の未署名寄り設定のため、Gatekeeper 警告が出る場合があります。Apple Developer Program で署名・公証する場合は `electron-builder` の `mac.identity` / notarize 設定を追加してください。

## トラブル

- **`GH_TOKEN` 無効** … 権限 `repo`、期限切れでないか確認。
- **Release はできたが更新が来ない** … `package.json` の `repository.url` が `owner/repo` と一致しているか、`version` が前回より上がっているか確認。
