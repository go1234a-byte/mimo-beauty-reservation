-- MIMO — Priority 4~7 구현을 위한 스키마 마이그레이션
-- Supabase SQL Editor에서 실행하세요. 기존 mimo_salons / mimo_users / mimo_reservations
-- 데이터는 건드리지 않고 컬럼/테이블만 추가합니다 (하위 호환).
--
-- 주의: 아래 RLS 정책은 기존 anon-key 기반 클라이언트 접근 패턴(mimo_salons/mimo_users와 동일한
-- 수준의 개방형 정책)을 그대로 따르는 MVP용입니다. 프로덕션 전환 시에는 반드시
-- owner_uid = auth.uid() / is_admin 검증 등 실제 권한 체크로 좁혀야 합니다.

-- 1) mimo_salons: 소유자(사장님) & 승인 상태 & 전화번호(길찾기/전화하기 액션용)
alter table mimo_salons
  add column if not exists owner_uid text null,
  add column if not exists phone text null,
  add column if not exists approval_status text not null default 'approved'
    check (approval_status in ('pending', 'approved', 'rejected'));

create index if not exists idx_mimo_salons_owner_uid on mimo_salons (owner_uid);

-- 2) mimo_users: 관리자 플래그
alter table mimo_users
  add column if not exists is_admin boolean not null default false;

-- 3) mimo_notifications: 알림 구조 (Priority 7)
create table if not exists mimo_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  type text not null check (
    type in ('reservation_complete', 'reservation_reminder', 'reservation_cancelled', 'merchant_turned_on')
  ),
  title text not null,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_mimo_notifications_user_id on mimo_notifications (user_id, created_at desc);

alter table mimo_notifications enable row level security;

create policy if not exists "mimo_notifications_select_all" on mimo_notifications
  for select using (true);
create policy if not exists "mimo_notifications_insert_all" on mimo_notifications
  for insert with check (true);
create policy if not exists "mimo_notifications_update_all" on mimo_notifications
  for update using (true);

-- 4) mimo_reviews (Priority 5 — 관리자 리뷰 관리)
create table if not exists mimo_reviews (
  id uuid primary key default gen_random_uuid(),
  salon_id text not null,
  user_id text not null,
  rating numeric not null check (rating >= 0 and rating <= 5),
  comment text not null default '',
  created_at timestamptz not null default now()
);

alter table mimo_reviews enable row level security;

create policy if not exists "mimo_reviews_select_all" on mimo_reviews
  for select using (true);
create policy if not exists "mimo_reviews_insert_all" on mimo_reviews
  for insert with check (true);
create policy if not exists "mimo_reviews_delete_all" on mimo_reviews
  for delete using (true);

-- 5) mimo_reports (Priority 5 — 관리자 신고 관리)
create table if not exists mimo_reports (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('salon', 'user', 'review')),
  target_id text not null,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now()
);

alter table mimo_reports enable row level security;

create policy if not exists "mimo_reports_select_all" on mimo_reports
  for select using (true);
create policy if not exists "mimo_reports_insert_all" on mimo_reports
  for insert with check (true);
create policy if not exists "mimo_reports_update_all" on mimo_reports
  for update using (true);

-- 6) mimo_salons에 owner_uid/approval_status 관련 정책이 이미 있다면 아래는 생략 가능.
-- 기존 정책이 앱 전체에 대해 개방형(anon 허용)이라면 별도 추가 없이도 동작합니다.
