# 設計: デプロイ後の自動バージョンチェック

## 仕組み

1. `next.config.ts` の `generateBuildId` でビルド時にランダムIDを生成
2. `NEXT_PUBLIC_BUILD_ID` 環境変数は使わず、Next.js の `.next/BUILD_ID` を活用
3. `/api/version` API Route がサーバー側の `BUILD_ID` を返す
4. クライアント側は `NEXT_PUBLIC_BUILD_ID` にビルド時のIDを持ち、APIレスポンスと比較

## ファイル構成

### 新規作成
- `src/app/api/version/route.ts` — GET で `{ buildId }` を返す
- `src/components/layout/version-checker.tsx` — visibilitychange でチェック + トースト通知

### 変更
- `next.config.ts` — `generateBuildId` を追加、`env` に `NEXT_PUBLIC_BUILD_ID` を注入
- `src/app/(main)/layout.tsx` — `<VersionChecker />` を配置

## バージョンチェックのフロー

1. ビルド時: `generateBuildId()` → ランダムID生成 → `NEXT_PUBLIC_BUILD_ID` にも注入
2. API: `fs.readFileSync('.next/BUILD_ID')` or `process.env.NEXT_PUBLIC_BUILD_ID` → JSON返却
3. クライアント: `document.visibilityState === 'visible'` になったらfetch
4. クライアント側 `NEXT_PUBLIC_BUILD_ID` !== サーバー `buildId` → トースト表示
5. トースト内「更新する」ボタン → `window.location.reload()`

## 注意点
- fetch失敗はサイレントに無視（ネットワーク切断等への耐性）
- 短時間の連続チェックを防ぐため最低30秒のインターバルを設ける
- 一度通知したら再通知しない（dismiss されるまで待つ）
