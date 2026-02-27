# ユビキタス言語定義

## 1. ドメイン用語

| 日本語 | 英語 | コード上の名前 | 定義 |
|--------|------|---------------|------|
| 日次ログ | Daily Log | `DailyLog` / `daily_logs` | 特定の子供について1件ずつ登録する育児の記録。フリーテキスト・気分・カテゴリ・写真で構成される |
| 週次通信 | Weekly Report | `WeeklyReport` / `weekly_reports` | 1週間分の日次ログをもとにAIが子供ごとに生成する「ちょい感動系」の振り返り文章 |
| 月次まとめ | Monthly Report | `MonthlyReport` / `monthly_reports` | 1ヶ月分の週次通信をもとにAIが子供ごとに生成する月単位の振り返り文章 |
| 家族 | Family | `Family` / `families` | 複数の親が子供の育児ログを共有するグループ単位 |
| 家族メンバー | Family Member | `FamilyMember` / `family_members` | 家族グループに所属するユーザー。owner / member のロールを持つ |
| 子供 | Child | `Child` / `children` | 家族に登録された子供。各ログ・通信は特定の子供に紐づく。1家族に複数人登録可能 |
| ログ対象日 | Log Date | `logDate` / `log_date` | 日次ログが記録する対象の日付 |
| 気分スタンプ | Mood | `mood` | ログに付与する感情の指標。moved / happy / neutral / tired / sad の5種類 |
| カテゴリ | Category | `categories` | ログの分類タグ。食事・睡眠・遊び・ことば・運動・体調・成長・パパ/ママの気持ち |
| 週の開始日 | Week Start | `weekStart` / `week_start` | 週次通信の対象期間の開始日（月曜日） |
| 週の終了日 | Week End | `weekEnd` / `week_end` | 週次通信の対象期間の終了日（日曜日） |
| 生成 | Generate | `generate` | AIを使って週次通信を作成すること |
| 再生成 | Regenerate | `regenerate` | 同一週の週次通信を再度AIで生成し上書きすること |
| リアクション | Reaction | `LogReaction` / `log_reactions` | 日次ログに対して家族メンバーが残すスタンプ。固定5種（❤️👏😊💪✨） |
| リアクションスタンプ | Reaction Stamp | `REACTION_STAMPS` | リアクションに使用する絵文字とラベルの定義 |
| 写真ギャラリー | Photo Gallery | `/gallery` | 記録に添付された写真を月別グリッドで一覧表示する画面 |
| 統計ダッシュボード | Stats Dashboard | `/stats` | 記録の傾向をグラフで可視化する画面 |
| 過去の振り返り | Memories | `memories` | ○年前の同月同日の記録をホーム画面に表示する機能 |
| エクスポート | Export | `export` | 週次・月次通信をPNG/PDFで出力する機能 |
| オンボーディング | Onboarding | `onboarding` | 初回ログイン後の家族・子供の初期設定画面 |
| 招待リンク | Invite Link | `invite` | 家族グループに新メンバーを招待するためのURL |
| 記録ストリーク | Streak | `streak` | 連続記録日数 |
| 成長記録 | Growth Record | `GrowthRecord` / `growth_records` | 子供の身長・体重の定量データ記録（v3） |
| 成長曲線 | Growth Curve | - | 身長・体重の推移を母子手帳の標準曲線と重ねて表示するグラフ（v3） |
| マイルストーン | Milestone | `Milestone` / `milestones` | 子供の「初めて○○した」等の成長の節目イベント（v3） |
| 成長タイムライン | Growth Timeline | - | マイルストーンを時系列で表示する画面（v3） |
| 家族コメント | Family Comment | `LogComment` / `log_comments` | 日次ログに対して家族メンバーが残す短文コメント（v3） |
| リマインダー | Reminder | - | その日に記録がない場合に21時に送るプッシュ通知（v3） |

---

## 2. 気分スタンプの定義

| 表示 | 値（DB/コード） | 意味 |
|------|----------------|------|
| 🥰 | `moved` | 感動した・胸がいっぱい |
| 🙂 | `happy` | いい日・嬉しいことがあった |
| 😐 | `neutral` | 普通・特に変わりなし |
| 😴 | `tired` | 疲れた・眠い |
| 😭 | `sad` | 大変だった・辛いことがあった |

---

## 3. カテゴリの定義

| 日本語 | 値（DB/コード） | 説明 |
|--------|----------------|------|
| 食事 | `meal` | 授乳・離乳食・ミルクなど |
| 睡眠 | `sleep` | 昼寝・夜の睡眠・寝かしつけなど |
| 遊び | `play` | 遊びの内容・おもちゃなど |
| ことば | `word` | 発語・喃語・コミュニケーションなど |
| 運動 | `motor` | 寝返り・ハイハイ・つかまり立ちなど |
| 体調 | `health` | 体温・病気・通院など |
| 成長 | `growth` | 発達の節目・新しくできたことなど |
| パパ/ママの気持ち | `parent_feeling` | 親自身の感想・気持ち |

---

## 4. 技術用語

| 用語 | 説明 |
|------|------|
| RLS (Row Level Security) | Supabase/PostgreSQL の行レベルセキュリティ。ユーザーごとにアクセス制御を行う仕組み |
| Route Handler | Next.js App Router のサーバーサイド API エンドポイント |
| CSR (Client Side Rendering) | クライアント側でレンダリングする方式 |
| upsert | INSERT + UPDATE。レコードが存在すれば更新、なければ挿入する操作 |

---

## 5. 画面名の定義

| 日本語 | コード上のパス | 説明 |
|--------|---------------|------|
| ログイン画面 | `(auth)/login` | メール+パスワード / Google OAuth でのログイン |
| アカウント登録画面 | `(auth)/signup` | 新規ユーザー登録 |
| ホーム画面 | `(main)/page` | 今日のログ入力 + 当日のログ一覧 + 全子供の月齢表示 |
| カレンダー画面 | `(main)/calendar` | 月カレンダーでログを日付単位で閲覧・編集 |
| 記録一覧画面 | `(main)/logs` | 過去のログを日付順に一覧表示（子供フィルター対応） |
| 通信一覧画面 | `(main)/weekly` | 週次通信・月次まとめを一覧表示（子供タブで切り替え） |
| 週次通信詳細画面 | `(main)/weekly/[id]` | 週次通信の本文 + その週の写真一覧 |
| 月次まとめ詳細画面 | `(main)/weekly/monthly/[id]` | 月次まとめの本文 + その月の写真一覧 |
| 写真ギャラリー画面 | `(main)/gallery` | 記録写真を月別グリッドで一覧表示 |
| 統計ダッシュボード画面 | `(main)/stats` | 記録数・気分・カテゴリのグラフ表示 |
| 家族画面 | `(main)/family` | 家族メンバー管理 + 子供の追加・編集 |
| 設定画面 | `(main)/settings` | プロフィール編集・ログアウト |
| オンボーディング画面 | `(auth)/onboarding` | 初回ログイン後の家族・子供初期設定 |
| 招待受け入れ画面 | `invite/[token]` | 家族招待リンクからの参加 |
