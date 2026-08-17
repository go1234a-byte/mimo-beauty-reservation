# MIMO 개발 노트 (이번 작업 요약)

이 문서는 이번에 적용한 변경 사항, 실행 전 준비물, 그리고 프로덕션 전 반드시 짚어야 할
한계점을 정리합니다. 처음에 전달받은 개발 지침은 Flutter 앱 기준이었지만 실제 코드베이스는
React + TypeScript + Vite 웹 앱이었기 때문에, 기존 아키텍처(React Router, Supabase,
shadcn/ui 디자인 토큰)를 유지한 채로 7개 우선순위를 웹 환경에 맞게 구현했습니다.

## 실행 전 준비

1. `npm install`
2. `.env.example`을 `.env`로 복사하고 값 채우기
   - `VITE_GOOGLE_MAPS_API_KEY`: Google Cloud Console에서 Maps JavaScript API를 활성화한 브라우저 키
   - `VITE_GOOGLE_MAPS_MAP_ID`: (선택) 커스텀 지도 스타일용 Map ID. 비워두면 Google 데모 Map ID로 동작
   - `VITE_ADMIN_PASSCODE`: `/admin` 진입용 임시 패스코드 (기본값 `mimo-admin`)
3. `MIMO_SCHEMA_MIGRATION.sql`을 Supabase SQL Editor에서 실행 (owner_uid/approval_status 컬럼,
   mimo_notifications/mimo_reviews/mimo_reports 테이블 추가). 실행 전에도 기존 소비자 앱은
   정상 동작하도록 모든 신규 컬럼/테이블 접근에 방어 코드를 넣어뒀습니다.

## Priority별 구현 내용

- **P1 지도**: `MockMapView` → `GoogleMapView`(`@vis.gl/react-google-maps`)로 교체. 현재 위치는
  펄스 애니메이션 점, 매장은 알약형 마커로 표시하고 `status && approval_status==='approved'`인
  매장만 노출. `panTo`로 부드러운 카메라 이동.
- **P2 위치 권한**: `LocationContext` + `LocationGate`가 Splash → 위치 권한 화면 → Home 순서를
  강제. 이미 브라우저 권한이 허용된 사용자는 재요청 화면을 건너뜁니다.
- **P3 홈 카드**: "지금 예약 가능" 배지를 카드 최상단에 배치하고 거리 표시를 실제 위치 기반으로
  변경. 매장 목록은 거리순 정렬.
- **P4 사장님(Merchant) 앱**: `/merchant`. ON/OFF 토글 하나와 들어온 예약 목록, "예약 완료 처리"
  버튼만 존재. 매장 소유는 데모 목적상 소유자가 없는 매장을 "등록하기"로 연결하는 방식(MVP) —
  실제 서비스에서는 사업자 인증 플로우로 교체 필요.
- **P5 관리자 대시보드**: `/admin` (패스코드 게이트). 매장 승인/거절, 예약 취소, 사용자
  관리자 지정, 리뷰 삭제, 신고 처리를 탭으로 구성.
- **P6 예약 자동화**: 결제 확정(`confirmReservation`) 시 매장이 자동 OFF, 예약 취소 시 자동 ON,
  사장님이 "예약 완료 처리"를 누르면 다시 ON — 이게 "NOW" 정체성을 기술적으로 보장하는
  핵심 로직입니다 (기존 코드에는 전혀 없었습니다).
- **P7 알림 구조**: `mimo_notifications` 테이블 + 인앱 알림 시트(종 아이콘). 예약 확정/취소,
  사장님 매장 오픈(찜한 유저 대상) 시점에 알림 행을 생성합니다. 실제 브라우저 푸시(Web Push +
  서비스워커 + VAPID)는 백엔드 인프라 결정이 필요해 이번 범위에는 포함하지 않았고, 인앱 알림
  구조만 먼저 마련했습니다.

## 성능

- 라우트 단위 코드 스플리팅 적용 (`React.lazy` + `Suspense`) — 소비자가 거의 쓰지 않는
  `/merchant`, `/admin`, 그리고 상세/체크아웃 등 2차 화면을 별도 청크로 분리해 초기 로드에서
  제외했습니다.
- 메인 번들(Home 진입에 필요한 부분)은 여전히 ~250KB(gzip) 수준으로, Google Maps 래퍼와
  framer-motion이 큰 비중을 차지합니다. 추후 스플래시/성공 화면의 framer-motion을 CSS
  애니메이션으로 교체하면 더 줄일 수 있습니다.

## 프로덕션 전 반드시 확인해야 할 것 (정직하게 남깁니다)

1. **인증이 진짜 인증이 아님**: 로그인은 OAuth 없이 localStorage uid를 생성하는 방식입니다.
   Merchant/Admin 접근 제어도 지금은 클라이언트 사이드 체크(uid 소유권, 패스코드)일 뿐이라
   개발자 도구로 우회 가능합니다. 프로덕션 전 Supabase Auth + RLS 기반 실제 인증으로
   교체해야 합니다.
2. **RLS 정책 미확인**: 이 세션에서는 Supabase DB에 직접 접근할 수 없어 실제 RLS 정책을
   확인하지 못했습니다. 마이그레이션의 정책은 기존 테이블과 동일한 개방형 정책을 가정한
   것이므로, 실제 프로덕션에서는 각 테이블 접근 권한을 반드시 재검토하세요.
3. **동시성**: 매장 ON/OFF 전환은 현재 클라이언트에서 순차 처리됩니다. 트래픽이 커지면
   동시에 두 사용자가 같은 매장을 결제 확정하는 경쟁 상태(race condition)가 가능하므로,
   Postgres 함수/트랜잭션으로 옮기는 것을 권장합니다.
4. **예약 리마인더**: 알림 타입은 준비돼 있지만 실제 "예약 시간 임박" 알림을 보내려면
   스케줄러(Supabase Edge Function + Cron 등)가 필요합니다. 이번 범위에는 포함하지 않았습니다.

## 2차 개선 (Final Version 지침 반영, `MIMO_REVIEW_AND_PLAN.md` 참고)

- **홈 레이아웃**: 지도를 화면 상단 38vh로 확대하고, 카드 리스트를 지도 위로 살짝 겹치는
  라운드 시트로 재구성 (Apple Maps 스타일). 완전한 드래그 제스처 바텀시트는 아니고 정적
  레이아웃이며, 실제 드래그 확장/축소는 추후 과제로 남겨둡니다.
- **카드 재설계**: "지금 가능" 배지를 최상단에 크게 배치, 사진은 56×56으로 축소, 시술
  소요시간과 도보/자동차 ETA를 함께 노출. 카드 본문 탭 = 지도 핀 선택(페이지 이동 없음),
  "예약하기" 버튼 탭 = 상세 페이지 이동으로 분리했습니다.
- **지도-카드 양방향 연동**: 핀 선택 → 카드 스크롤 강조, 카드 선택 → 핀으로 팬 이동. 지도를
  움직이면(`onBoundsChanged`) 현재 화면 안에 보이는 매장만 하단 리스트에 남도록 클라이언트
  사이드로 필터링합니다 (서버 재조회가 아니라 이미 불러온 활성 매장 중 뷰포트 필터).
- **실시간 동기화**: `MimoDataContext`에 Supabase Realtime(`postgres_changes`) 구독을 추가해
  다른 사용자의 결제 확정이나 사장님의 ON/OFF가 새로고침 없이 반영됩니다. Supabase 프로젝트에서
  Realtime이 비활성화돼 있으면 조용히 무시되고 최초 fetch 결과로만 동작합니다 — Database →
  Replication에서 `mimo_salons` 테이블의 Realtime이 켜져 있는지 확인해주세요.
- **예약완료 화면**: 길찾기(Google Maps 길찾기 새 탭), 전화하기(`tel:`), 예약취소 버튼 추가.
  이를 위해 `mimo_salons.phone` 컬럼을 마이그레이션에 추가했습니다(nullable, 값이 없으면
  전화하기 버튼은 비활성화).
- **리뷰**: 완료된 예약 화면(`/mimo/bookings`)에서 매장당 1회, 별점(1~5) + 60자 이내 한줄
  리뷰만 남길 수 있습니다. 긴 리뷰 작성 UI는 의도적으로 만들지 않았습니다.
- **이미지 최적화**: 카드/갤러리 이미지에 `loading="lazy"`(첫 갤러리 이미지만 eager) +
  `decoding="async"` 적용. 별도 CDN 캐싱 레이어는 붙이지 않았습니다(이미지가 외부 URL이라
  클라이언트에서 캐시 정책을 제어할 수 없음 — 브라우저 기본 캐시에 의존).
- **Admin 매장 관리 보강**: 승인된 매장도 "강제 OFF" / "매장 삭제"가 가능하도록 액션을
  추가했습니다 (기존에는 승인/거절만 가능했음).

`MIMO_SCHEMA_MIGRATION.sql`은 모두 `add column if not exists` / `create table if not exists`
방식이라, 이전에 이미 한 번 실행했더라도 다시 실행해도 안전합니다 (phone 컬럼만 새로 추가됨).
