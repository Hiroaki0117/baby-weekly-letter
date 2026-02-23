# 家族グループ機能 — タスクリスト

## フェーズ 1: データ基盤

### 1-1. マイグレーション作成
- [ ] `supabase/migrations/20260223000000_add_family_group.sql` 作成
  - [ ] `families` テーブル作成
  - [ ] `family_members` テーブル作成（UNIQUE(user_id)）
  - [ ] `children` テーブル作成
  - [ ] `family_invitations` テーブル作成
  - [ ] `my_family_id()` ヘルパー関数作成
  - [ ] 既存ユーザーのデータ移行（1人家族の自動作成）
  - [ ] `daily_logs` 変更（user_id → author_id + family_id 追加）
  - [ ] `weekly_reports` 変更（user_id → family_id）
  - [ ] `monthly_reports` 変更（user_id → family_id）
  - [ ] `profiles` 変更（child_name/child_birth_date 削除、display_name 追加）
  - [ ] 旧 RLS ポリシー DROP
  - [ ] 新 RLS ポリシー CREATE（全テーブル）
  - [ ] Storage ポリシー更新（userId → familyId）
  - [ ] インデックス再作成

### 1-2. 型定義更新
- [ ] `src/types/database.ts` — 全テーブル型の更新
  - [ ] families, family_members, children, family_invitations 追加
  - [ ] daily_logs: user_id → family_id + author_id
  - [ ] weekly_reports, monthly_reports: user_id → family_id
  - [ ] profiles: child_name/child_birth_date 削除、display_name 追加
- [ ] `src/types/index.ts` — Family, FamilyMember, Child, FamilyInvitation エクスポート

### 1-3. バリデーションスキーマ
- [ ] `src/schemas/family.ts` — 家族作成、招待受諾のスキーマ
- [ ] `src/schemas/profile.ts` — child_name/child_birth_date 削除、display_name 追加

## フェーズ 2: 共通ロジック

### 2-1. family_id 取得ヘルパー
- [ ] `src/lib/supabase/family.ts` — `getMyFamilyId()` 関数

### 2-2. 既存 API ルートの family_id 対応
- [ ] `src/app/api/weekly-report/generate/route.ts`
  - [ ] user_id → family_id でログ取得
  - [ ] user_id → family_id で upsert
  - [ ] children テーブルから子ども情報取得
- [ ] `src/app/api/monthly-report/generate/route.ts`
  - [ ] 同上の変更

### 2-3. プロンプト変更
- [ ] `src/lib/weekly-report/prompt.ts` — PromptContext に合わせた取得元変更（影響は API 側）
- [ ] `src/lib/monthly-report/prompt.ts` — 同上

## フェーズ 3: 認証・オンボーディング

### 3-1. middleware 変更
- [ ] `src/middleware.ts`
  - [ ] 家族未所属 → `/onboarding` リダイレクト
  - [ ] 家族所属済み + `/onboarding` → `/` リダイレクト
  - [ ] `/invite/[token]` を認証不要パスに追加

### 3-2. 家族作成 API
- [ ] `src/app/api/family/create/route.ts`
  - [ ] families INSERT
  - [ ] family_members INSERT (owner)
  - [ ] children INSERT
  - [ ] profiles UPSERT (display_name)

### 3-3. オンボーディング画面
- [ ] `src/app/(auth)/onboarding/page.tsx`
  - [ ] ステップ1: 家族名入力
  - [ ] ステップ2: あなたの表示名
  - [ ] ステップ3: お子さま情報（名前・生年月日）
  - [ ] 家族作成 API 呼び出し → ホームへ遷移

### 3-4. 招待リンク API
- [ ] `src/app/api/family/invite/route.ts`
  - [ ] owner 権限チェック
  - [ ] トークン生成（crypto.randomUUID）
  - [ ] family_invitations INSERT
  - [ ] 招待URL返却

### 3-5. 招待受諾 API
- [ ] `src/app/api/family/join/route.ts`
  - [ ] トークン検証（有効期限・未使用）
  - [ ] 家族メンバー数チェック（上限5人）
  - [ ] 既に家族所属の場合はエラー
  - [ ] family_members INSERT (member)
  - [ ] invitation UPDATE (used_by, used_at)
  - [ ] profiles UPSERT

### 3-6. 招待受諾画面
- [ ] `src/app/invite/[token]/page.tsx`
  - [ ] トークンから家族名を表示
  - [ ] 未ログイン → サインアップ/ログインへ誘導（token をクエリパラメータで維持）
  - [ ] ログイン済み → 「参加する」ボタン → API 呼び出し → ホームへ

### 3-7. サインアップ画面の招待対応
- [ ] `src/app/(auth)/signup/page.tsx` — `?invite=[token]` を auth callback に引き継ぎ
- [ ] `src/app/(auth)/login/page.tsx` — 同上
- [ ] `src/app/auth/callback/route.ts` — 招待トークン付きの場合 `/invite/[token]` にリダイレクト

## フェーズ 4: メンバー管理

### 4-1. メンバー管理 API
- [ ] `src/app/api/family/members/route.ts` — GET メンバー一覧
- [ ] `src/app/api/family/members/[userId]/route.ts` — DELETE メンバー削除（owner のみ）

### 4-2. 家族設定 UI
- [ ] `src/components/family/member-list.tsx` — メンバー一覧コンポーネント
- [ ] `src/components/family/invite-link.tsx` — 招待リンク発行・コピーUI
- [ ] `src/app/(main)/settings/page.tsx` に家族設定セクション追加
  - [ ] メンバー一覧表示
  - [ ] 招待リンク発行（owner のみ）
  - [ ] メンバー削除ボタン（owner のみ）

## フェーズ 5: 既存画面の family_id 対応

### 5-1. 設定画面
- [ ] `src/app/(main)/settings/page.tsx`
  - [ ] 「お子さまの情報」→ children テーブルからの読み書きに変更
  - [ ] 「あなたの情報」セクション追加（display_name 編集）

### 5-2. ホーム（日次ログ入力）
- [ ] `src/components/log/log-form.tsx`
  - [ ] ログ保存時に family_id + author_id をセット
- [ ] `src/app/(main)/page.tsx`
  - [ ] ログ取得を family_id ベースに変更（RLS で自動だが、表示名取得のため join が必要）
- [ ] `src/components/log/log-card.tsx`
  - [ ] パートナーのログに書き手バッジ表示
- [ ] `src/components/log/author-badge.tsx` — 書き手バッジコンポーネント作成

### 5-3. ログ一覧
- [ ] `src/app/(main)/logs/page.tsx`
  - [ ] 書き手バッジ表示追加

### 5-4. カレンダー
- [ ] `src/app/(main)/calendar/page.tsx`
  - [ ] 書き手バッジ表示追加（カレンダーセル内）

### 5-5. 通信ページ
- [ ] `src/app/(main)/weekly/page.tsx` — family_id ベース（RLS で自動的に対応）
- [ ] `src/app/(main)/weekly/[id]/page.tsx` — 変更なし（RLS 対応）
- [ ] `src/app/(main)/weekly/monthly/[id]/page.tsx` — 変更なし（RLS 対応）

### 5-6. 写真ギャラリー
- [ ] `src/components/weekly/photo-gallery.tsx` — Storage パス変更対応
- [ ] `src/components/monthly/monthly-photo-gallery.tsx` — 同上

## フェーズ 6: 品質チェック

### 6-1. テスト
- [ ] `my_family_id()` 関連のユニットテスト（必要に応じて）
- [ ] `getMyFamilyId()` ヘルパーのテスト
- [ ] 既存テスト通過確認 (`pnpm test`)

### 6-2. 静的解析
- [ ] 型チェック (`pnpm type-check`)
- [ ] リント (`pnpm lint`)
- [ ] ビルド確認 (`pnpm build`)

### 6-3. ドキュメント更新
- [ ] `docs/functional-design.md` — ER図・データモデル更新
- [ ] `docs/product-requirements.md` — 家族グループ機能追加
- [ ] `docs/glossary.md` — 家族・メンバー・ロール等の用語追加

### 6-4. コミット & プッシュ
- [ ] コミット
- [ ] プッシュ

---

## 実装順序の方針

**フェーズ 1 → 2 → 3 → 4 → 5 → 6** の順で進める。

- **フェーズ 1（データ基盤）** が最も重要。ここでテーブル構造と RLS が固まる
- **フェーズ 2（共通ロジック）** で既存機能が family_id ベースで動くようになる
- **フェーズ 3（認証・オンボーディング）** で新規ユーザーの導線が完成
- **フェーズ 4（メンバー管理）** で招待・管理UIが使えるようになる
- **フェーズ 5（既存画面対応）** で全画面が family 対応になる
- **フェーズ 6（品質チェック）** で最終確認

フェーズ 1〜2 完了時点で既存機能は「1人家族」として正常動作する状態を維持する。
