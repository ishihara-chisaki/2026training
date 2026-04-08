---
name: restaurant-review
description: 飲食店レビューアプリの開発コンテキスト。Next.js App Router + TypeScript + Tailwind CSS + Supabase + Vercelで構成されるプロジェクト。コーディングルール・技術スタック・ディレクトリ構成・API仕様を参照する際に自動ロード。「このプロジェクト」「アプリの実装」「コンポーネント作成」「Supabase」「ホットペッパー」「地図」などのキーワードが含まれる場合に使用。
user-invocable: false
---

# 飲食店レビューアプリ 開発コンテキスト

## アプリ概要

**アプリ名**: MeshiLog（社内飲食店共有プラットフォーム）  
**目的**: 社員（約300名）がランチ・会食先の飲食店情報を共有・発見できる社内Webアプリ  
**主機能**: ログイン認証 / 飲食店検索・一覧 / レビュー投稿 / お気に入り / 地図表示 / 管理者によるレビュー削除

---

## 技術スタック

| 領域 | 技術 |
|------|------|
| フロントエンド | Next.js 14（App Router）+ TypeScript + Tailwind CSS |
| バックエンド/DB | Supabase（PostgreSQL + Auth + Storage + Realtime） |
| 飲食店検索API | ホットペッパーグルメ Webサービス |
| 地図表示 | Leaflet + OpenStreetMap（`react-leaflet`） |
| デプロイ | Vercel（GitHubリポジトリ連携済み） |
| パッケージマネージャー | npm |

---

## ディレクトリ構成

```
src/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # 認証不要ルートグループ
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (main)/                 # 認証必須ルートグループ
│   │   ├── layout.tsx          # 共通ヘッダー
│   │   ├── search/page.tsx     # 検索・一覧
│   │   ├── map/page.tsx        # 地図表示
│   │   ├── restaurants/
│   │   │   └── [id]/
│   │   │       ├── page.tsx    # 店舗詳細
│   │   │       └── review/page.tsx  # レビュー投稿
│   │   ├── favorites/page.tsx  # お気に入り一覧
│   │   ├── mypage/page.tsx     # マイページ
│   │   └── admin/page.tsx      # 管理者画面
│   └── api/
│       └── hotpepper/route.ts  # ホットペッパーAPI Proxy
├── components/                 # 共通コンポーネント
│   ├── ui/                     # 汎用UIパーツ（Button, Card, StarRating等）
│   ├── restaurant/             # 店舗関連コンポーネント
│   ├── review/                 # レビュー関連コンポーネント
│   └── map/                    # 地図関連コンポーネント
├── lib/
│   ├── supabase.ts             # Supabaseクライアント（ここに集約）
│   └── hotpepper.ts            # ホットペッパーAPI クライアント
└── types/
    └── index.ts                # 型定義（anyは禁止）
```

---

## コーディングルール

### TypeScript
- **`any`型は禁止**。不明な型は`unknown`を使い型ガードで絞り込む
- 型定義は`src/types/index.ts`に集約する
- `interface`よりも`type`エイリアスを優先する

### コンポーネント
- `src/components/`配下に配置する
- Server ComponentとClient Componentを明示的に分ける（`"use client"`）
- データフェッチはServer Componentで行い、インタラクションのみClient Componentにする

### スタイリング
- **Tailwind CSSのみ**使用する（インラインstyle属性は禁止）
- クラスの並び順: レイアウト → サイジング → スペーシング → 色 → その他

### 環境変数
- `.env.local`で管理する
- ブラウザから参照する変数は`NEXT_PUBLIC_`プレフィックスを付ける
- サーバーサイドのみの変数（APIシークレット等）は`NEXT_PUBLIC_`を付けない

### Supabaseクライアント
- `src/lib/supabase.ts`に集約し、他のファイルから直接`createClient`しない
- Browserクライアントは`createBrowserClient()`、Serverクライアントは`createServerClient()`を使い分ける

---

## 環境変数一覧

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxx
SUPABASE_SERVICE_ROLE_KEY=xxxx   # サーバーサイドのみ

# ホットペッパーグルメAPI
HOTPEPPER_API_KEY=xxxx           # サーバーサイドのみ（Proxyルート経由）

# アプリ設定
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

---

## Supabaseテーブル設計

### `profiles`（ユーザープロフィール）
Supabase Authの`auth.users`と1対1で連携。

| カラム | 型 | 説明 |
|--------|-----|------|
| id | uuid (PK) | auth.users.idと一致 |
| name | text NOT NULL | 氏名 |
| department | text | 部署名 |
| is_admin | boolean DEFAULT false | 管理者フラグ |
| created_at | timestamptz | 登録日時 |

### `restaurants`（飲食店）
ホットペッパーAPIから取得した情報をキャッシュ。

| カラム | 型 | 説明 |
|--------|-----|------|
| id | uuid (PK) | |
| hotpepper_id | text UNIQUE | ホットペッパーの店舗ID |
| name | text NOT NULL | 店名 |
| genre | text | ジャンル |
| address | text | 住所 |
| access | text | アクセス情報 |
| lat | numeric | 緯度 |
| lng | numeric | 経度 |
| budget_lunch | text | ランチ予算 |
| budget_dinner | text | ディナー予算 |
| hours | text | 営業時間 |
| closed_days | text | 定休日 |
| image_url | text | 代表画像URL |
| created_at | timestamptz | |

### `reviews`（レビュー）

| カラム | 型 | 説明 |
|--------|-----|------|
| id | uuid (PK) | |
| restaurant_id | uuid FK → restaurants.id | |
| user_id | uuid FK → profiles.id | |
| rating_overall | smallint NOT NULL | 総合評価 1〜5 |
| rating_food | smallint | 料理・味 1〜5 |
| rating_service | smallint | サービス 1〜5 |
| rating_cost | smallint | コスパ 1〜5 |
| rating_atmosphere | smallint | 雰囲気 1〜5 |
| comment | text NOT NULL | コメント本文 |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `review_tags`（レビュータグ）

| カラム | 型 | 説明 |
|--------|-----|------|
| id | uuid (PK) | |
| review_id | uuid FK → reviews.id | |
| tag_name | text NOT NULL | タグ名（例: ランチ向き）|

利用可能タグ: `ランチ向き` / `会食向き` / `接待向き` / `大人数OK` / `個室あり` / `テラスあり` / `コスパ良し`

### `review_photos`（レビュー写真）

| カラム | 型 | 説明 |
|--------|-----|------|
| id | uuid (PK) | |
| review_id | uuid FK → reviews.id | |
| storage_path | text NOT NULL | Supabase Storageのパス |
| created_at | timestamptz | |

### `favorites`（お気に入り）

| カラム | 型 | 説明 |
|--------|-----|------|
| id | uuid (PK) | |
| user_id | uuid FK → profiles.id | |
| restaurant_id | uuid FK → restaurants.id | |
| created_at | timestamptz | |

**UNIQUE制約**: `(user_id, restaurant_id)` の複合ユニーク

---

## APIインテグレーション

### ホットペッパーグルメ API

**注意**: APIキーをクライアントに露出させないため、必ず`/api/hotpepper`のNext.js Route Handler経由で呼び出す。

```typescript
// src/app/api/hotpepper/route.ts の実装パターン
const BASE_URL = 'http://webservice.recruit.co.jp/hotpepper/gourmet/v1/'

// クエリパラメータ例
// keyword: キーワード検索
// lat/lng: 緯度経度
// range: 検索範囲（1〜5）
// genre: ジャンルコード
// count: 取得件数（最大100）
// format: json固定
```

### 地図表示（Leaflet + OpenStreetMap）

```typescript
// react-leaflet を使用。SSRを無効にしてインポートする
import dynamic from 'next/dynamic'
const MapComponent = dynamic(() => import('@/components/map/MapView'), { ssr: false })

// タイルURL
// https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
// attribution: © OpenStreetMap contributors
```

---

## 画面一覧と対応ルート

| 画面名 | ルート | 認証 |
|--------|--------|------|
| ログイン | `/login` | 不要 |
| 新規登録 | `/register` | 不要 |
| 検索・一覧 | `/search` | 必要 |
| 地図表示 | `/map` | 必要 |
| 店舗詳細 | `/restaurants/[id]` | 必要 |
| レビュー投稿 | `/restaurants/[id]/review` | 必要 |
| お気に入り | `/favorites` | 必要 |
| マイページ | `/mypage` | 必要 |
| 管理者画面 | `/admin` | 必要（管理者のみ） |

---

## デプロイ

- **Vercel**: GitHubリポジトリと連携済み。`main`ブランチへのpushで自動デプロイ
- 環境変数はVercelダッシュボードの「Environment Variables」で設定する
- Supabase Storageの`review-photos`バケットを作成し、認証済みユーザーのみアップロード可能にする

---

## モック参照

UIデザインのベースとなるHTMLモックは `mock/` ディレクトリに配置されている。
実装時はモックのレイアウト・UXを参考にしつつ、Tailwind CSSで再実装する。
