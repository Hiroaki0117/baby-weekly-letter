# 家族タブ分離 — 設計書

## 変更ファイル一覧

| ファイル | 変更種別 | 内容 |
|----------|----------|------|
| `src/components/layout/nav.tsx` | 修正 | 「家族」タブ追加 |
| `src/app/(main)/family/page.tsx` | 新規 | 家族ページ（家族名・子ども情報・メンバー・招待） |
| `src/app/(main)/settings/page.tsx` | 修正 | 子ども・家族セクション削除、プロフィールのみに簡素化 |

## 1. ナビゲーション変更

`src/components/layout/nav.tsx` の `navItems` に追加：

```ts
const navItems = [
  { href: "/", label: "きょう" },
  { href: "/calendar", label: "カレンダー" },
  { href: "/logs", label: "きろく" },
  { href: "/weekly", label: "通信" },
  { href: "/family", label: "家族" },  // 追加
];
```

5タブでモバイル表示が窮屈にならないよう、パディングを微調整（`px-3` → `px-2.5`）。

## 2. 家族ページ (`/family`)

### データ取得

設定ページから移植。初回ロードで以下を並列取得：
- `auth.getUser()` → ユーザーID
- `supabase.rpc("my_family_id")` → family_id
- `family_members` → role判定（owner/member）
- `families` → 家族名
- `children` → 子ども情報

### セクション構成

```
┌──────────────────────────────┐
│  Family                      │
│  家族                        │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ 家族名              [編集]│ │
│ │ 田中家                   │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ お子さまの情報           │ │
│ │ お名前: [         ]      │ │
│ │ 生年月日: [       ]      │ │
│ │ 月齢: 8ヶ月              │ │
│ │            [保存する]     │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ 家族メンバー             │ │
│ │ 👤 パパ (あなた) オーナー │ │
│ │ 👤 ママ         メンバー │ │
│ │                          │ │
│ │ パートナーを招待 (owner) │ │
│ │ [招待リンクを発行]       │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

### ロジック移植元

- 子ども情報フォーム: `settings/page.tsx` の `childForm` + `onSubmitChild`
- メンバー一覧: `<MemberList>` コンポーネント（そのまま再利用）
- 招待リンク: `<InviteLink>` コンポーネント（そのまま再利用）
- 家族名編集: 新規追加（`families` テーブルの `name` を更新）

### 家族名編集

- インライン編集方式（表示 → クリックで入力欄に切り替え → 保存）
- owner のみ編集可能
- `families` テーブルを `getMyFamilyId()` で取得した `family_id` で UPDATE

## 3. 設定ページ簡素化

子ども情報セクション・家族メンバーセクションを削除。残すもの：

- ページヘッダー（「設定」）
- あなたの情報（表示名フォーム）

不要になるインポート・state・関数を削除：
- `childFormSchema`, `ChildFormValues`, `calcAge`
- `MemberList`, `InviteLink`
- `savingChild`, `childId`, `familyId`, `isOwner`, `currentUserId`
- `onSubmitChild` 関数
- `children` / `family_members` の取得処理

## 4. 影響範囲

- ナビゲーション: 全ページに影響（Nav コンポーネント共通）
- 設定ページ: ページ内変更のみ
- 新規ページ: `/family` 追加
- API: 変更なし（既存の `/api/family/*` をそのまま利用）
- コンポーネント: `MemberList`, `InviteLink` は変更なし（移動先で再利用）
