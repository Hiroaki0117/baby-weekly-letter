# タスクリスト: カレンダービュー & 週次通信クオリティ改善

---

## フェーズ 1: データ基盤（profiles テーブル + 型定義）

- [ ] 1-1. `supabase/migrations/20260220000000_add_profiles.sql` 作成
  - profiles テーブル、RLS ポリシー、updated_at トリガー
- [ ] 1-2. `src/types/database.ts` に profiles テーブル型追加
- [ ] 1-3. `src/types/index.ts` に Profile 型エクスポート追加

## フェーズ 2: 週次通信クオリティ改善

- [ ] 2-1. `src/lib/gemini/client.ts` — モデルを `gemini-2.5-flash` に変更
- [ ] 2-2. `src/lib/date.ts` — `calcAge()` 月齢計算関数追加 + テスト
- [ ] 2-3. `src/lib/weekly-report/prompt.ts` — プロンプト全面改修
  - CoT 思考指示、自由構成ガイド、文体ガイドライン
  - profile（名前・月齢）注入対応
  - previousReport（前回通信の結び）注入対応
- [ ] 2-4. `src/lib/weekly-report/generate.ts` — 引数拡張（profile, previousReport）
- [ ] 2-5. `src/app/api/weekly-report/generate/route.ts` — 生成フロー拡張
  - profiles テーブルからプロフィール取得
  - 直近の weekly_reports から前回通信取得
  - buildPrompt に渡す

## フェーズ 3: 設定画面

- [ ] 3-1. `src/schemas/profile.ts` — プロフィールフォームスキーマ（Zod）
- [ ] 3-2. `src/app/(main)/settings/page.tsx` — 設定画面
  - 子どもの名前 + 生年月日フォーム
  - 初回は upsert で自動作成
  - 手帳と封筒デザイン統合
- [ ] 3-3. `src/components/layout/header.tsx` — 設定ボタン（⚙）追加

## フェーズ 4: カレンダービュー

- [ ] 4-1. `src/lib/date.ts` — カレンダー用ユーティリティ追加
  - `getCalendarDays(year, month)` — 月曜始まり42日グリッド生成
  - `getMonthRange(year, month)` — カレンダー表示範囲の開始日・終了日
- [ ] 4-2. `src/components/calendar/calendar-day-cell.tsx` — 日付セルコンポーネント
  - 気分 emoji 表示、ログ数バッジ、today/selected/other-month 状態
- [ ] 4-3. `src/components/calendar/calendar-grid.tsx` — 月次グリッドコンポーネント
  - 曜日ヘッダー（Mon〜Sun）、6行×7列グリッド
  - 前月/次月ナビゲーション
- [ ] 4-4. `src/app/(main)/calendar/page.tsx` — カレンダーページ
  - 月単位データフェッチ、日付ごとグループ化
  - 選択日のログ一覧展開（LogCard 再利用）
- [ ] 4-5. `src/components/layout/nav.tsx` — 「カレンダー」メニュー追加

## フェーズ 5: 品質チェック

- [ ] 5-1. `calcAge()` のユニットテスト追加
- [ ] 5-2. `getCalendarDays()` のユニットテスト追加
- [ ] 5-3. 型チェック (`pnpm type-check`)
- [ ] 5-4. リント (`pnpm lint`)
- [ ] 5-5. 既存テスト通過確認 (`pnpm test`)
- [ ] 5-6. ビルド確認 (`pnpm build`)
- [ ] 5-7. コミット & プッシュ

---

## 実装順序の理由

1. **フェーズ 1** → 2, 3 の前提（profiles テーブルが必要）
2. **フェーズ 2** → 通信改善はDB変更後すぐ着手可能、UIなしで完結
3. **フェーズ 3** → プロフィールを入力するUIが必要（2の効果を発揮するため）
4. **フェーズ 4** → 独立機能、他に依存しない
5. **フェーズ 5** → 全体の品質保証
