# 設計書：家族ページの整理 + 睡眠入力UI改善

## 1. 家族ページから削除する要素

### 削除対象（体温・睡眠・食事）

| 種別 | 削除するもの |
|------|------------|
| インポート | `fetchTemperatureRecords`, `addTemperatureRecord`, `updateTemperatureRecord`, `deleteTemperatureRecord`, `classifyTempPeriod`, `fetchSleepRecords`, `addSleepRecord`, `updateSleepRecord`, `deleteSleepRecord`, `buildTimestamps`, `calcDurationMinutes`, `classifySleep`, `fetchMealRecords`, `addMealRecord`, `updateMealRecord`, `deleteMealRecord`, `TemperatureRecordForm`, `TemperatureRecordList`, `SleepRecordForm`, `SleepRecordList`, `MealRecordForm`, `MealRecordList` |
| 型 | `TemperatureRecord`, `SleepRecord`, `MealRecord`, `MealType`, `MealAmount` |
| State | `temperatureRecords`, `showTempForm`, `editingTempRecord`, `sleepRecords`, `showSleepForm`, `editingSleepRecord`, `mealRecords`, `showMealForm`, `editingMealRecord` |
| ハンドラ | `handleAddTemp`, `handleUpdateTemp`, `handleDeleteTemp`, `handleAddSleep`, `handleUpdateSleep`, `handleDeleteSleep`, `handleAddMeal`, `handleUpdateMeal`, `handleDeleteMeal` |
| useEffect内 | `tempMap`, `sleepMap`, `mealMap` の宣言・fetch・setState |
| JSX | 体温・睡眠・食事の各セクション（フォーム＋一覧） |

### 残すもの

- 家族名編集
- 子供情報管理（名前・性別・生年月日）
- 成長記録（入力＋チャート＋一覧）
- 家族メンバー一覧・招待

## 2. 睡眠手入力UIの改善

### 変更前（QuickSleepInput の手入力セクション）

```
手入力で記録
[2026-03-12]
[21:00] → [07:00] 10時間
                     [記録]
```

横並び・ラベルなし・コンパクトだが窮屈。

### 変更後

```
手入力で記録
日付
[2026-03-12        ]
就寝時刻
[21:00             ]
起床時刻
[07:00             ]
⏱ 10時間
              [記録]
```

- 各フィールドにラベル（`text-xs text-muted-foreground`）
- 縦積みレイアウト
- 入力フィールドは `w-full` で幅いっぱい
- 時間プレビューを独立行で表示

タイマー終了時の確認画面も同様のレイアウトに統一する。

## 3. 変更対象ファイル

| ファイル | 変更内容 |
|---------|---------|
| `src/app/(main)/family/page.tsx` | 体温・睡眠・食事セクション削除、不要なインポート・state・ハンドラ削除 |
| `src/components/sleep/quick-sleep-input.tsx` | 手入力セクション＋確認画面のレイアウト改善 |
