# MIMO — 위치 기반 뷰티샵 즉시예약 앱 (독립 프로젝트)

ALL BLUE(스쿠버다이빙 투어) 프로젝트에서 분리된 독립 Vite + React + TypeScript 프로젝트입니다.

## 실행 방법

```bash
npm install
npm run dev      # 개발 서버 (기본 포트 8080)
npm run build    # 배포용 빌드 (dist/ 생성)
npm run check    # 타입 체크
```

## 백엔드(Supabase)

`src/integrations/supabase/client.ts`에서 MIMO 전용 독립 Supabase 프로젝트(`mimo-beauty-reservation-v2`,
id `htqdooiejervjtebehgo`, org `smafjegynqgvbhupyenc`)를 사용합니다. ALL BLUE의 Enter Cloud Managed
Supabase(구 백엔드)와는 완전히 분리되어 있습니다 — 2026-08-17에 이전(이유는 아래 참고).

사용 테이블: `mimo_users`, `mimo_salons`(`owner_uid`/`phone`/`approval_status` 포함),
`mimo_reservations`, `mimo_notifications`, `mimo_reviews`, `mimo_reports`. 전체 스키마는
`MIMO_SCHEMA_MIGRATION.sql` + 아래 base 스키마를 합친 내용이며, 새 프로젝트에는 이미 전부 적용되어 있습니다.

```sql
create table public.mimo_users (
  uid text primary key,
  name text not null,
  phone text,
  favorites text[] not null default '{}',
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.mimo_salons (
  id text primary key,
  name text not null,
  address text not null,
  lat double precision not null,
  lng double precision not null,
  status boolean not null default true,
  categories text[] not null default '{}',
  photos text[] not null default '{}',
  services jsonb not null default '[]',
  rating numeric not null default 0,
  owner_uid text null,
  phone text null,
  approval_status text not null default 'approved'
    check (approval_status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create table public.mimo_reservations (
  reservation_id uuid primary key default gen_random_uuid(),
  user_id text not null references public.mimo_users(uid),
  salon_id text not null references public.mimo_salons(id),
  service_name text not null,
  price numeric not null,
  start_time timestamptz not null,
  status text not null default 'pending' check (status in ('pending','confirmed','completed','cancelled')),
  payment_method text,
  payment_status text not null default 'unpaid',
  created_at timestamptz not null default now()
);

alter table public.mimo_users enable row level security;
alter table public.mimo_salons enable row level security;
alter table public.mimo_reservations enable row level security;
create policy mimo_users_public_all on public.mimo_users for all using (true) with check (true);
create policy mimo_salons_public_select on public.mimo_salons for select using (true);
create policy mimo_salons_public_update on public.mimo_salons for update using (true) with check (true);
create policy mimo_salons_public_delete on public.mimo_salons for delete using (true);
create policy mimo_reservations_public_all on public.mimo_reservations for all using (true) with check (true);
```

`mimo_notifications`/`mimo_reviews`/`mimo_reports` 테이블 및 관련 정책은 `MIMO_SCHEMA_MIGRATION.sql` 참고.

**이전 사유:** 구 백엔드(Enter Cloud Managed Supabase, `spb-t4ni8g9fz54lu3cz.supabase.opentrust.net`)는
대시보드/SQL Editor 접근 경로를 잃어버려 마이그레이션을 실행할 수 없었고, 실제로 `mimo_salons`에
UPDATE/DELETE RLS 정책이 아예 없어서 사장님 ON/OFF, 결제확정 자동화(P6), 관리자 승인 등 쓰기 기능이
전부 조용히 실패하던 상태였습니다(2026-08-17 실기능 테스트로 발견). 새 프로젝트는 위 스키마 그대로
+ 누락됐던 쓰기 정책까지 처음부터 포함해서 만들었습니다. 기존 시드 매장 6곳/유저/예약 데이터는 그대로
이전했습니다(사진 URL은 `cdn.enter.pro`를 그대로 재사용).

## 배포

`npm run build`로 생성되는 `dist/` 폴더를 Netlify, Vercel 등 정적 호스팅에 그대로 업로드하면 됩니다.

## 참고

- 로그인(Apple/Google/Kakao)은 실제 OAuth 없이 클릭 시 즉시 임시 사용자로 로그인 처리되는 데모 시뮬레이션입니다.
- 지도는 실제 지도 API 없이 CSS/SVG 목업 지도입니다.
