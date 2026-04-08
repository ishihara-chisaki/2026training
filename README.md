# MeshiLog — 社内飲食店共有プラットフォーム

社員がランチ・会食先の飲食店情報を投稿・発見できる社内向け Web アプリ。  
外部 API と連携して店舗情報を自動取得し、社員のレビューを蓄積することで社内独自の飲食店データベースを構築する。  
ランチや会食先の選定にかかる時間・手間の削減を目的とする。

---

## 主要機能

| 優先度 | 機能 | 概要 |
|--------|------|------|
| 必須 | 認証 | メールアドレス＋パスワードによるログイン・新規登録 |
| 必須 | 飲食店検索・一覧 | エリア・ジャンル・用途・評価順での絞り込み検索 |
| 必須 | 店舗情報取得 | ホットペッパーグルメ API 連携による基本情報の自動取得 |
| 必須 | レビュー投稿 | 星評価（項目別）＋テキストコメントの投稿・編集 |
| 必須 | 地図表示 | 店舗位置を OpenStreetMap 上にピン表示 |
| 必須 | お気に入り | 店舗のお気に入り登録・一覧表示 |
| 推奨 | 写真アップロード | レビューへの画像添付（Supabase Storage） |
| 推奨 | 用途タグ | 「ランチ向き」「会食向き」等のタグ付け・絞り込み |
| 管理 | 管理者削除 | 不適切なレビューの管理者による削除 |

---

## 技術スタック

| 領域 | 技術 |
|------|------|
| フロントエンド | [Next.js 14](https://nextjs.org/) (App Router) + [TypeScript](https://www.typescriptlang.org/) |
| スタイリング | [Tailwind CSS](https://tailwindcss.com/) |
| バックエンド / DB | [Supabase](https://supabase.com/) (PostgreSQL + Auth + Storage + Realtime) |
| 飲食店検索 API | [ホットペッパーグルメ Webサービス](https://webservice.recruit.co.jp/doc/hotpepper/reference.html) |
| 地図表示 | [Leaflet](https://leafletjs.com/) + [OpenStreetMap](https://www.openstreetmap.org/) (`react-leaflet`) |
| デプロイ | [Vercel](https://vercel.com/) |
| パッケージマネージャー | npm |

---

## 画面構成

| 画面名 | ルート | 認証 | 役割 |
|--------|--------|------|------|
| ログイン | `/login` | 不要 | メール＋パスワード認証 |
| 新規登録 | `/register` | 不要 | アカウント作成 |
| 検索・一覧 | `/search` | 必要 | 条件指定での飲食店検索・一覧表示 |
| 地図表示 | `/map` | 必要 | 検索結果を地図上にピン表示 |
| 店舗詳細 | `/restaurants/[id]` | 必要 | 基本情報・レビュー一覧・お気に入り |
| レビュー投稿 | `/restaurants/[id]/review` | 必要 | 評価・コメント・写真・タグの入力 |
| お気に入り | `/favorites` | 必要 | お気に入り登録した店舗の一覧 |
| マイページ | `/mypage` | 必要 | 投稿レビュー一覧・アカウント設定 |
| 管理者 | `/admin` | 必要（管理者のみ） | レビューの検索・削除 |

UI モックは [`mock/`](./mock/) ディレクトリに HTML ファイルとして収録されている。

---

## データ構造

### `profiles`（ユーザープロフィール）

Supabase Auth の `auth.users` と 1 対 1 で連携する。

| カラム | 型 | 制約 | 説明 |
|--------|----|------|------|
| `id` | uuid | PK | `auth.users.id` と一致 |
| `name` | text | NOT NULL | 氏名 |
| `department` | text | | 部署名 |
| `is_admin` | boolean | DEFAULT false | 管理者フラグ |
| `created_at` | timestamptz | | 登録日時 |

### `restaurants`（飲食店）

ホットペッパー API から取得した情報をキャッシュする。

| カラム | 型 | 制約 | 説明 |
|--------|----|------|------|
| `id` | uuid | PK | |
| `hotpepper_id` | text | UNIQUE | ホットペッパーの店舗 ID |
| `name` | text | NOT NULL | 店名 |
| `genre` | text | | ジャンル |
| `address` | text | | 住所 |
| `access` | text | | アクセス情報 |
| `lat` | numeric | | 緯度 |
| `lng` | numeric | | 経度 |
| `budget_lunch` | text | | ランチ予算 |
| `budget_dinner` | text | | ディナー予算 |
| `hours` | text | | 営業時間 |
| `closed_days` | text | | 定休日 |
| `image_url` | text | | 代表画像 URL |
| `created_at` | timestamptz | | |

### `reviews`（レビュー）

| カラム | 型 | 制約 | 説明 |
|--------|----|------|------|
| `id` | uuid | PK | |
| `restaurant_id` | uuid | FK → restaurants.id | |
| `user_id` | uuid | FK → profiles.id | |
| `rating_overall` | smallint | NOT NULL | 総合評価 1〜5 |
| `rating_food` | smallint | | 料理・味 1〜5 |
| `rating_service` | smallint | | サービス 1〜5 |
| `rating_cost` | smallint | | コスパ 1〜5 |
| `rating_atmosphere` | smallint | | 雰囲気 1〜5 |
| `comment` | text | NOT NULL | コメント本文 |
| `created_at` | timestamptz | | |
| `updated_at` | timestamptz | | |

### `review_tags`（レビュータグ）

| カラム | 型 | 制約 | 説明 |
|--------|----|------|------|
| `id` | uuid | PK | |
| `review_id` | uuid | FK → reviews.id | |
| `tag_name` | text | NOT NULL | タグ名 |

利用可能タグ: `ランチ向き` / `会食向き` / `接待向き` / `大人数OK` / `個室あり` / `テラスあり` / `コスパ良し`

### `review_photos`（レビュー写真）

| カラム | 型 | 制約 | 説明 |
|--------|----|------|------|
| `id` | uuid | PK | |
| `review_id` | uuid | FK → reviews.id | |
| `storage_path` | text | NOT NULL | Supabase Storage のパス |
| `created_at` | timestamptz | | |

### `favorites`（お気に入り）

| カラム | 型 | 制約 | 説明 |
|--------|----|------|------|
| `id` | uuid | PK | |
| `user_id` | uuid | FK → profiles.id | |
| `restaurant_id` | uuid | FK → restaurants.id | |
| `created_at` | timestamptz | | |

`(user_id, restaurant_id)` に複合ユニーク制約を付与する。

---

## セットアップ手順

### 前提条件

- Node.js 18 以上
- npm
- [Supabase](https://supabase.com/) アカウントとプロジェクト
- [ホットペッパーグルメ API キー](https://webservice.recruit.co.jp/)

### 1. リポジトリのクローン

```bash
git clone https://github.com/ishihara-chisaki/2026training.git
cd 2026training
```

### 2. 依存パッケージのインストール

```bash
npm install
```

### 3. 環境変数の設定

プロジェクトルートに `.env.local` を作成し、後述の「環境変数一覧」を参考に値を設定する。

### 4. Supabase のセットアップ

Supabase ダッシュボードで以下を実施する。

1. 新規プロジェクトを作成する
2. **Authentication → Email** を有効化する
3. 「データ構造」セクションのテーブルを SQL エディタで作成する
4. **Storage** に `review-photos` バケットを作成し、認証済みユーザーのみアップロード可能に設定する
5. `profiles` テーブルへの **Row Level Security (RLS)** を設定する

### 5. ローカル起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開く。

---

## 環境変数一覧

`.env.local` に以下を設定する（`.env.local` は Git 管理外）。

```env
# ── Supabase ──────────────────────────────────────────
# Supabase ダッシュボード → Settings → API で確認
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# サーバーサイド限定（クライアントに露出させない）
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ── ホットペッパーグルメ API ───────────────────────────
# サーバーサイド限定（/api/hotpepper Route Handler 経由で使用）
HOTPEPPER_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ── アプリ設定 ─────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **注意**: `NEXT_PUBLIC_` プレフィックスが付いた変数はブラウザに公開される。シークレット情報には付けない。

---

## 非機能要件

| 項目 | 内容 |
|------|------|
| 利用規模 | 同時接続を考慮した 300 名規模 |
| レスポンス | 検索・一覧表示は 3 秒以内 |
| セキュリティ | 社内利用限定・認証必須・パスワードは Supabase Auth でハッシュ管理 |
| デバイス対応 | PC ブラウザ必須、スマートフォン対応（レスポンシブ）推奨 |
| 可用性 | 業務時間帯（平日 9〜18 時）を中心に安定稼働 |

---

## ライセンス

社内利用限定。外部への公開・配布は禁止。
