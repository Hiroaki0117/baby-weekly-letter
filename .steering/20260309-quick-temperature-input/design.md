# 体温クイック入力 + PWAショートカット - 設計

## 概要

今日ページのストリーク表示と日記フォームの間に折りたたみ式の体温クイック入力を追加する。あわせてPWAショートカットを設定する。

## UI設計

### 折りたたみバー（閉じた状態）

```
┌─────────────────────────────────┐
│ 🌡 体温を記録                  ▼ │
└─────────────────────────────────┘
```

- コンパクトな1行バー
- タップで展開/折りたたみ

### 展開した状態（子供2人の例）

```
┌─────────────────────────────────┐
│ 🌡 体温を記録                  ▲ │
│─────────────────────────────────│
│ たろう   [36.5] ℃  [記録]       │
│ はなこ   [36.8] ℃  [記録]       │
└─────────────────────────────────┘
```

- 子供ごとに名前 + 体温入力 + 記録ボタンを1行で表示
- 体温入力は number type、step=0.1、placeholder="36.5"
- 記録ボタン押下で即保存（measured_at は現在時刻を自動設定）
- 保存成功でトースト表示＋入力クリア
- 子供が1人の場合は名前省略も可能だが、統一性のため表示する

### 今日ページのレイアウト（変更後）

```
[ヘッダー: 日付、子供の年齢、記録数、ストリーク]
[リアクション通知]
[思い出]
[★ 体温クイック入力（新規）]  ← ここに追加
[日記入力フォーム]
[今日のログ一覧]
```

## 実装設計

### 新規コンポーネント

#### `src/components/temperature/quick-temperature-input.tsx`

Props:
```typescript
type Props = {
  children: Child[];
};
```

内部状態:
- `open: boolean` — 展開/折りたたみ
- `temperatures: Record<string, string>` — 子供IDごとの入力値
- `saving: Record<string, boolean>` — 子供IDごとの保存中フラグ

処理:
- 記録ボタン押下時に `addTemperatureRecord` を呼び出し
- `measured_at` は `new Date().toISOString()` を自動設定
- Supabaseクライアントはコンポーネント内で `createClient()` で取得

### 変更ファイル

#### `src/app/(main)/page.tsx`

- `QuickTemperatureInput` コンポーネントを import
- ストリーク表示（またはメモリーズ）の後、`<LogForm>` の前に配置
- `childrenList` をpropsとして渡す

#### `public/manifest.webmanifest`

- `shortcuts` フィールドを追加

```json
{
  "shortcuts": [
    {
      "name": "体温を記録",
      "short_name": "体温",
      "url": "/family",
      "icons": [{ "src": "/icon.svg", "sizes": "any" }]
    }
  ]
}
```

## 変更ファイル一覧

| ファイル | 変更内容 |
|----------|----------|
| `src/components/temperature/quick-temperature-input.tsx` | 新規: 折りたたみ式クイック入力 |
| `src/app/(main)/page.tsx` | QuickTemperatureInput を配置 |
| `public/manifest.webmanifest` | shortcuts 追加 |
