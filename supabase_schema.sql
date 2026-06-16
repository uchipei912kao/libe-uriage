-- ============================================
-- リベ市場 売上管理アプリ  Supabase テーブル定義
-- 帰宅後、Supabaseの「SQL Editor」にこれを丸ごと貼って実行するだけ
-- ============================================

-- 在庫（商品マスタ）
create table if not exists stock_items (
  id          bigint generated always as identity primary key,
  name        text not null,
  sku         text,
  cost        integer default 0,   -- 仕入原価
  price       integer default 0,   -- 販売予定価格
  qty         integer default 0,   -- 在庫数
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- 売れたもの（販売履歴）
create table if not exists sold_items (
  id          bigint generated always as identity primary key,
  order_no    text,                -- 注文番号（重複取込防止のキー）
  name        text not null,
  date        timestamptz,
  price       integer default 0,   -- 販売価格
  cost        integer default 0,   -- 仕入原価
  shipping    integer default 0,
  point       integer default 0,
  qty         integer default 1,
  status      text,
  created_at  timestamptz default now()
);
-- 同じ注文番号＋商品名は1回だけ（拡張の重複取込を防ぐ）
create unique index if not exists uq_sold_order on sold_items (order_no, name);

-- 月別の手動入力（送料・手数料・経費など）
create table if not exists monthly_manual (
  period      text primary key,    -- 例: "2026-06"
  shipping    integer default 0,
  fee         integer default 0,
  point       integer default 0,
  other       integer default 0,
  refund      integer default 0,
  updated_at  timestamptz default now()
);

-- ============================================
-- RLS（行レベルセキュリティ）
-- 個人利用なので anon キーで読み書き許可（シンプル運用）
-- ※ 公開URLにDBキーが乗るので、機密データを扱う場合は後で認証を足す
-- ============================================
alter table stock_items     enable row level security;
alter table sold_items      enable row level security;
alter table monthly_manual  enable row level security;

create policy "allow all stock"   on stock_items    for all using (true) with check (true);
create policy "allow all sold"    on sold_items     for all using (true) with check (true);
create policy "allow all manual"  on monthly_manual for all using (true) with check (true);
