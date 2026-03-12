# 設計書：統計チャートに月別表示を追加

## 1. アプローチ

各チャートコンポーネント内に週別/月別の切替stateを追加し、月別時はカレンダーグリッドを表示する。

## 2. 平熱算出ロジック（IQR方式）

```typescript
// src/lib/temperature.ts に追加

function calcNormalTemperature(records: TemperatureRecord[]): number | null {
  const temps = records.map(r => r.temperature).sort((a, b) => a - b);
  if (temps.length < 5) return null; // データ不足

  const q1 = percentile(temps, 25);
  const q3 = percentile(temps, 75);
  const iqr = q3 - q1;
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;

  const filtered = temps.filter(t => t >= lower && t <= upper);
  if (filtered.length === 0) return null;

  const avg = filtered.reduce((sum, t) => sum + t, 0) / filtered.length;
  return Math.round(avg * 10) / 10; // 小数第1位に丸め
}

function percentile(sorted: number[], p: number): number {
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}
```

## 3. カレンダーグリッド共通構造

3つのチャートで共通のカレンダー日付配列を生成する。

```typescript
// 月の1日から末日まで、月曜始まりで埋めた配列を返す
// 前月・翌月の余白日は null
function buildCalendarDays(year: number, month: number): (string | null)[][] {
  // 週ごとの配列を返す（最大6週）
  // 各要素は "YYYY-MM-DD" | null
}
```

## 4. 月別 体温チャート

```
体温の推移          平熱 36.5℃
[週別] [月別]      ‹ 2026年3月 ›

 月  火  水  木  金  土  日
          1   2   3   4   5
         🟢  🟢  🟡  ー  🟢
  6   7   8   9  10  11  12
 🟢  🟢  🔴  🟢  🟡  ー  🟢
 ...
```

- セル: 日付(上) + 色ドット(下)
- ドットの色: その日の最高体温に基づく（緑/黄/赤/青）
- 記録なし: 「ー」
- タップ: ポップオーバーで時間帯別の体温一覧

## 5. 月別 睡眠チャート

```
睡眠時間の推移
[週別] [月別]      ‹ 2026年3月 ›

 月  火  水  木  金  土  日
          1   2   3   4   5
         ██  ██  ██  ー  ██
 ...

平均 10.2時間  最長 12.5時間
```

- セル: 日付(上) + 積み上げバー(下)
- バー: 下=日中(amber)、上=夜間(indigo)
- 高さ: 合計時間に比例（最大値基準で正規化、max-height 32px程度）
- 記録なし: 「ー」
- サマリー: グリッド下に平均・最長を表示

## 6. 月別 食事チャート

```
食事量の推移
[週別] [月別]      ‹ 2026年3月 ›

 月  火  水  木  金  土  日
          1   2   3   4   5
        ◎○△ ○○○ ◎○△×  ー ○○○
 ...
```

- セル: 日付(上) + 朝昼夕おやつのミニアイコン横並び(下)
- アイコン: text-[10px] で ◎○△× を色付きで横並び
- 記録なし: 「ー」
- 順序: 朝食→昼食→夕食→おやつ（固定順）

## 7. 変更対象ファイル

### 新規作成
| ファイル | 内容 |
|---------|------|
| `src/lib/calendar.ts` | カレンダーグリッド生成ユーティリティ |

### 変更
| ファイル | 変更内容 |
|---------|---------|
| `src/lib/temperature.ts` | `calcNormalTemperature`, `percentile` 関数追加 |
| `src/components/stats/temperature-chart.tsx` | 週別/月別タブ + 月別カレンダーグリッド + 平熱表示 |
| `src/components/stats/sleep-chart.tsx` | 週別/月別タブ + 月別カレンダーグリッド + サマリー |
| `src/components/stats/meal-chart.tsx` | 週別/月別タブ + 月別カレンダーグリッド |

### テスト追加
| ファイル | 内容 |
|---------|------|
| `__tests__/lib/calendar.test.ts` | カレンダーグリッド生成テスト |
| `__tests__/lib/temperature.test.ts` | `calcNormalTemperature` テスト追加 |
