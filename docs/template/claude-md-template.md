# CLAUDE.md テンプレート

> このファイルはCLAUDE.mdの汎用テンプレートです。
> 新しいプロジェクトを始める際、以下の手順で使用してください：
>
> 1. このファイルの内容（テンプレート本体）をプロジェクトルートに `CLAUDE.md` としてコピー
> 2. `{{...}}` のプレースホルダーをプロジェクト固有の値に置き換え
> 3. 初回セットアップ手順に従って `docs/` を作成
> 4. ステップ3で CLAUDE.md にプロジェクト固有情報を追記

---

## テンプレート本体

```markdown
# CLAUDE.md

## 概要

{{プロジェクト名}} - {{プロジェクトの1〜2行の説明}}

## docs 参照ガイド

作業内容に応じて、以下の `docs/` ファイルを参照すること。

| 作業 | 参照すべきファイル |
|------|-------------------|
| 実装全般（コーディング・テスト・コミット） | `docs/development-guidelines.md` |
| 新機能の設計・既存機能の仕様確認 | `docs/functional-design.md` |
| 技術選定・アーキテクチャの確認 | `docs/architecture.md` |
| ファイル配置・ディレクトリ構造 | `docs/repository-structure.md` |
| 用語・命名の確認 | `docs/glossary.md` |
| プロダクトの目的・要件の確認 | `docs/product-requirements.md` |

**実装作業では `docs/development-guidelines.md` を必ず読むこと。** 開発コマンド、作業完了時のルール（品質チェック → commit → push）、テスト規約、コーディング規約が記載されている。

## プロジェクト構造

### ドキュメントの分類

#### 1. 永続的ドキュメント（`docs/`）

アプリケーション全体の「**何を作るか**」「**どう作るか**」を定義する恒久的なドキュメント。
アプリケーションの基本設計や方針が変わらない限り更新されません。

- **product-requirements.md** - プロダクト要求定義書
- **functional-design.md** - 機能設計書
- **architecture.md** - 技術仕様書
- **repository-structure.md** - リポジトリ構造定義書
- **development-guidelines.md** - 開発ガイドライン
- **glossary.md** - ユビキタス言語定義

#### 2. 作業単位のドキュメント（`.steering/[YYYYMMDD]-[開発タイトル]/`）

特定の開発作業における「**今回何をするか**」を定義する一時的なステアリングファイル。
作業完了後は参照用として保持されますが、新しい作業では新しいディレクトリを作成します。

- **requirements.md** - 今回の作業の要求内容
- **design.md** - 変更内容の設計
- **tasklist.md** - タスクリスト

### ステアリングディレクトリの命名規則

```
.steering/[YYYYMMDD]-[開発タイトル]/
```

## 開発プロセス

### 初回セットアップ時の手順

#### 1. フォルダ作成

```bash
mkdir -p docs
mkdir -p .steering
```

#### 2. 永続的ドキュメント作成（`docs/`）

アプリケーション全体の設計を定義します。
各ドキュメントを作成後、必ず確認・承認を得てから次に進みます。

1. `docs/product-requirements.md` - プロダクト要求定義書（テンプレート: `docs/template/product-requirements-template.md`）
2. `docs/functional-design.md` - 機能設計書（テンプレート: `docs/template/functional-design-template.md`）
3. `docs/architecture.md` - 技術仕様書（テンプレート: `docs/template/architecture-template.md`）
4. `docs/repository-structure.md` - リポジトリ構造定義書（テンプレート: `docs/template/repository-structure-template.md`）
5. `docs/development-guidelines.md` - 開発ガイドライン（テンプレート: `docs/template/development-guidelines-template.md`）
6. `docs/glossary.md` - ユビキタス言語定義（テンプレート: `docs/template/glossary-template.md`）

**重要：** 1ファイルごとに作成後、必ず確認・承認を得てから次のファイル作成を行う
**テンプレートがあるファイルは、テンプレートの構成をベースに作成すること。**

#### 3. CLAUDE.md にプロジェクト固有情報を追記

永続的ドキュメントの作成完了後、以下をCLAUDE.mdに記載する：

- 「概要」セクションにプロジェクトの説明を記載
- 「開発用の一時変更」セクションに一時的な設定変更があれば記載
- プロジェクト固有の注意事項があれば追記

#### 4. 初回実装用のステアリングファイル作成

初回実装用のディレクトリを作成し、実装に必要なドキュメントを配置します。

```bash
mkdir -p .steering/[YYYYMMDD]-initial-implementation
```

作成するドキュメント：

1. `.steering/[YYYYMMDD]-initial-implementation/requirements.md` - 初回実装の要求
2. `.steering/[YYYYMMDD]-initial-implementation/design.md` - 実装設計
3. `.steering/[YYYYMMDD]-initial-implementation/tasklist.md` - 実装タスク

#### 5. 環境セットアップ

#### 6. 実装開始

1. `docs/development-guidelines.md` を読み込む
2. `.steering/[YYYYMMDD]-initial-implementation/tasklist.md` に基づいて実装を進める

#### 7. 品質チェック

```bash
{{品質チェックコマンド（例: pnpm lint && pnpm type-check && pnpm test）}}
```
エラーがあれば修正し、commit → push まで行う。詳細は `docs/development-guidelines.md` の「作業完了時のルール」を参照。

### 機能追加・修正時の手順

#### 1. 方針決定（新機能の場合）

新しい機能を追加する場合、ステアリング資料を作成する前に `AskUserQuestion` ツールの選択式UIを使って方針を固める。技術選定・UIの方向性・仕様の分岐点など、決めるべき項目を1問ずつ選択肢で提示し、ユーザーの判断を仰ぐ。各選択肢には推奨を明示し（ラベル末尾に「（推奨）」を付ける）、推奨理由も description に含めること。

#### 2. 影響分析

- 永続的ドキュメント（`docs/`）への影響を確認
- 変更が基本設計に影響する場合は `docs/` を更新

#### 3. ステアリングディレクトリ作成

新しい作業用のディレクトリを作成します。

```bash
mkdir -p .steering/[YYYYMMDD]-[開発タイトル]
```

#### 4. 作業ドキュメント作成

作業単位のドキュメントを作成します。
各ドキュメント作成後、必ず確認・承認を得てから次に進みます。

1. `.steering/[YYYYMMDD]-[開発タイトル]/requirements.md` - 要求内容
2. `.steering/[YYYYMMDD]-[開発タイトル]/design.md` - 設計
3. `.steering/[YYYYMMDD]-[開発タイトル]/tasklist.md` - タスクリスト

**重要：** 1ファイルごとに作成後、必ず確認・承認を得てから次のファイル作成を行う

#### 5. 永続的ドキュメント更新（必要な場合のみ）

変更が基本設計に影響する場合、該当する `docs/` 内のドキュメントを更新します。

#### 6. 実装開始

1. `docs/development-guidelines.md` を読み込む
2. `.steering/[YYYYMMDD]-[開発タイトル]/tasklist.md` に基づいて実装を進める

#### 7. 品質チェック

```bash
{{品質チェックコマンド（例: pnpm lint && pnpm type-check && pnpm test）}}
```
エラーがあれば修正し、commit → push まで行う。詳細は `docs/development-guidelines.md` の「作業完了時のルール」を参照。

## ドキュメント管理の原則

### 永続的ドキュメント（`docs/`）

- アプリケーションの基本設計を記述
- 頻繁に更新されない
- 大きな設計変更時のみ更新
- プロジェクト全体の「北極星」として機能

### 作業単位のドキュメント（`.steering/`）

- 特定の作業・変更に特化
- 作業ごとに新しいディレクトリを作成
- 作業完了後は履歴として保持
- 変更の意図と経緯を記録

## 図表・ダイアグラムの記載ルール

### 記載場所

設計図やダイアグラムは、関連する永続的ドキュメント内に直接記載します。
独立したdiagramsフォルダは作成せず、手間を最小限に抑えます。

**配置例：**

- ER図、データモデル図 → `functional-design.md` 内に記載
- ユースケース図 → `functional-design.md` または `product-requirements.md` 内に記載
- 画面遷移図、ワイヤフレーム → `functional-design.md` 内に記載
- システム構成図 → `functional-design.md` または `architecture.md` 内に記載

### 記述形式

1. **Mermaid記法（推奨）** - Markdownに直接埋め込め、バージョン管理が容易
2. **ASCII アート** - シンプルな図表に使用
3. **画像ファイル（必要な場合のみ）** - `docs/images/` フォルダに配置、PNG または SVG 形式を推奨

図表は必要最小限に留め、設計変更時は対応する図表も同時に更新すること。

## 開発用の一時変更（本番リリース前に戻すこと）

{{一時的な設定変更をここに記載。なければこのセクションは空でよい}}
```
