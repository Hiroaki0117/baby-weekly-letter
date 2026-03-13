# 設計: 体温・睡眠・食事記録の編集・削除機能

## アーキテクチャ

### データ更新の流れ
チャートコンポーネントは `records` を props で受け取っているため、
編集・削除後に stats ページ側でデータを再フェッチし、props を更新する。

各チャートに `onUpdate` / `onDelete` コールバックを追加。
stats ページ側でこれらを受け取り、Supabase のCRUD関数を呼んでから
該当レコード配列を再フェッチ → state 更新。

### 変更ファイル

#### 新規作成
- `src/components/stats/edit-sheet.tsx` — 編集用ボトムシート（体温・睡眠・食事共用）

#### 変更
- `src/components/stats/temperature-chart.tsx` — ポップオーバーに削除・編集操作を追加
- `src/components/stats/sleep-chart.tsx` — 同上
- `src/components/stats/meal-chart.tsx` — 同上
- `src/app/(main)/stats/page.tsx` — onUpdate / onDelete コールバックを渡す + 再フェッチ

## UI設計

### ポップオーバー内レコード行
```
[時刻] [値]  [✏️] [🗑]
```
- ✏️ タップ → ボトムシート表示
- 🗑 タップ → 確認 window.confirm → 削除

### ボトムシート
固定オーバーレイ + 下からスライドするパネル。
- ヘッダー: 「体温を編集」/「睡眠を編集」/「食事を編集」
- フォーム:
  - 体温: 体温 input[number] + 計測時刻 input[datetime-local]
  - 睡眠: 開始時刻 input[time] + 終了時刻 input[time]
  - 食事: 食事量 select (4択)
- フッター: キャンセル / 保存ボタン

## コールバック設計

```ts
// 各チャートの Props に追加
onUpdate?: () => void;  // 編集・削除完了後に親が再フェッチするためのコールバック
```

stats ページ側:
```ts
const handleBodyRecordChange = useCallback(async () => {
  // 該当子供のレコードを再フェッチ
}, [selectedChildId]);
```
