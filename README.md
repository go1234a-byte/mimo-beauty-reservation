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
```

**RLS는 2026-08-18에 실제 Supabase Auth 기반으로 전면 재작성했습니다** (기존 완전 개방형
`using (true)` 정책은 전부 제거). 조회(SELECT)는 비회원도 매장을 둘러볼 수 있도록 공개로 열어두고,
쓰기는 `auth.uid()` 기준 소유자/관리자로 스코프를 좁혔습니다 — 매장은 `owner_uid = auth.uid()`인
사람만, 프로필은 본인만, 관리자 액션(`mimo_users.is_admin = true`)은 `mimo_is_admin()` 함수로 판별.
전체 정책은 Supabase 대시보드의 Database → Policies에서 확인하거나 마이그레이션 히스토리 참고.

`mimo_notifications`/`mimo_reviews`/`mimo_reports` 테이블 및 관련 정책은 `MIMO_SCHEMA_MIGRATION.sql` 참고.

**이전 사유:** 구 백엔드(Enter Cloud Managed Supabase, `spb-t4ni8g9fz54lu3cz.supabase.opentrust.net`)는
대시보드/SQL Editor 접근 경로를 잃어버려 마이그레이션을 실행할 수 없었고, 실제로 `mimo_salons`에
UPDATE/DELETE RLS 정책이 아예 없어서 사장님 ON/OFF, 결제확정 자동화(P6), 관리자 승인 등 쓰기 기능이
전부 조용히 실패하던 상태였습니다(2026-08-17 실기능 테스트로 발견). 새 프로젝트는 위 스키마 그대로
+ 누락됐던 쓰기 정책까지 처음부터 포함해서 만들었습니다. 기존 시드 매장 6곳/유저/예약 데이터는 그대로
이전했습니다(사진 URL은 `cdn.enter.pro`를 그대로 재사용).

## 배포

**Live: https://mimo-beauty-reservation-v2.vercel.app**

Vercel 프로젝트 `mimo-beauty-reservation-v2` (team `go1234a-7714s-projects`), CLI로 직접 배포합니다
(`npx vercel deploy --prod --yes`). 이 저장소엔 `main`(옛 코드, 다른 백엔드)과 `mimo-full-featured`
(이 브랜치) 두 개가 갈라져 있어서, GitHub 연동 자동배포는 **의도적으로 껐습니다** — `main`에 뭔가
push되면 이 배포가 옛날 코드로 덮어써질 수 있기 때문입니다. 배포하려면 항상 로컬에서 CLI로 수동 실행.

SPA라 `vercel.json`의 rewrite 규칙이 꼭 필요합니다 (없으면 `/mimo/bookings` 같은 딥링크/새로고침이
전부 404). `npm run build`로 생성되는 `dist/`를 다른 정적 호스팅에 올릴 때도 동일한 rewrite/fallback
설정이 필요합니다.

## 참고

- 로그인은 이메일/비밀번호 기반 실제 Supabase Auth입니다 (소비자/사장님/관리자 공용 계정). Apple/Google/
  카카오 소셜 로그인은 각 플랫폼 개발자 콘솔에서 앱 등록 + client ID/secret 발급이 필요해 아직 미구현.
- 지도는 실제 Google Maps(`@vis.gl/react-google-maps`)입니다. `.env`에 `VITE_GOOGLE_MAPS_API_KEY`가
  없으면 지도 자리에 "지도를 표시할 수 없어요" 안내만 뜨고 앱 자체는 정상 동작합니다(`MockMapView`는
  더 이상 홈 화면에서 쓰지 않는 컴포넌트).
- 예약 시작 30분 전 알림은 Edge Function(`send-reservation-reminders`) + pg_cron(5분 간격)으로 자동
  발송됩니다.
