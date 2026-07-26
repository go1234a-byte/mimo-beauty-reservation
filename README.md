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

`src/integrations/supabase/client.ts`에서 ALL BLUE와 **동일한 Enter Cloud Managed Supabase 프로젝트**를 그대로 사용합니다.
사용 테이블: `mimo_users`, `mimo_salons`, `mimo_reservations` (ALL BLUE의 테이블과는 완전히 분리되어 있어 서로 영향 없음).

완전히 별도의 백엔드로 분리하고 싶다면 새 Supabase 프로젝트를 만들고 아래 스키마를 적용한 뒤,
`client.ts`의 `SUPABASE_URL`/`SUPABASE_PUBLISHABLE_KEY`만 교체하면 됩니다.

```sql
create table public.mimo_users (
  uid text primary key,
  name text not null,
  phone text,
  favorites text[] not null default '{}',
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
create policy mimo_reservations_public_all on public.mimo_reservations for all using (true) with check (true);
```

## 배포

`npm run build`로 생성되는 `dist/` 폴더를 Netlify, Vercel 등 정적 호스팅에 그대로 업로드하면 됩니다.

## 참고

- 로그인(Apple/Google/Kakao)은 실제 OAuth 없이 클릭 시 즉시 임시 사용자로 로그인 처리되는 데모 시뮬레이션입니다.
- 지도는 실제 지도 API 없이 CSS/SVG 목업 지도입니다.
