import { lazy, Suspense } from "react";
import { Navigate } from "react-router-dom";
import { MimoRootLayout } from "./components/mimo/layout/MimoRootLayout";
import MimoHome from "./pages/mimo/MimoHome";

// 소비자 앱의 첫 화면(MimoHome)만 즉시 로드하고, 나머지는 지연 로드해서
// 초기 번들 크기를 줄인다. Merchant/Admin은 완전히 별도의 앱이라 일반 소비자는
// 거의 다운로드할 일이 없으므로 특히 효과적이다.
const MimoSalonDetail = lazy(() => import("./pages/mimo/MimoSalonDetail"));
const MimoCheckout = lazy(() => import("./pages/mimo/MimoCheckout"));
const MimoSuccess = lazy(() => import("./pages/mimo/MimoSuccess"));
const MimoBookings = lazy(() => import("./pages/mimo/MimoBookings"));
const MimoFavorites = lazy(() => import("./pages/mimo/MimoFavorites"));
const MimoMyPage = lazy(() => import("./pages/mimo/MimoMyPage"));

const MerchantRootLayout = lazy(() =>
  import("./components/merchant/MerchantRootLayout").then((m) => ({ default: m.MerchantRootLayout })),
);
const MerchantHome = lazy(() => import("./pages/merchant/MerchantHome"));
const MerchantSalonEdit = lazy(() => import("./pages/merchant/MerchantSalonEdit"));
const MerchantSalonApply = lazy(() => import("./pages/merchant/MerchantSalonApply"));
const MerchantSalonRegister = lazy(() => import("./pages/merchant/MerchantSalonRegister"));
const MerchantSalonResubmit = lazy(() => import("./pages/merchant/MerchantSalonResubmit"));

const AdminRootLayout = lazy(() =>
  import("./components/admin/AdminRootLayout").then((m) => ({ default: m.AdminRootLayout })),
);
const AdminHome = lazy(() => import("./pages/admin/AdminHome"));

function RouteFallback() {
  return (
    <div className="flex min-h-full items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">불러오는 중...</p>
    </div>
  );
}

function withSuspense(element: React.ReactNode) {
  return <Suspense fallback={<RouteFallback />}>{element}</Suspense>;
}

export const routers = [
  {
    path: "/",
    element: <Navigate to="/mimo" replace />,
  },
  {
    path: "/mimo",
    element: <MimoRootLayout />,
    children: [
      { index: true, element: <MimoHome /> },
      { path: "salon/:salonId", element: withSuspense(<MimoSalonDetail />) },
      { path: "checkout/:salonId", element: withSuspense(<MimoCheckout />) },
      { path: "success", element: withSuspense(<MimoSuccess />) },
      { path: "bookings", element: withSuspense(<MimoBookings />) },
      { path: "favorites", element: withSuspense(<MimoFavorites />) },
      { path: "mypage", element: withSuspense(<MimoMyPage />) },
    ],
  },
  {
    // 사장님(merchant) 앱 — ON/OFF와 들어온 예약만 다루는 별도의 가벼운 화면
    path: "/merchant",
    element: withSuspense(<MerchantRootLayout />),
    children: [
      { index: true, element: withSuspense(<MerchantHome />) },
      { path: "edit/:salonId", element: withSuspense(<MerchantSalonEdit />) },
      { path: "apply/:salonId", element: withSuspense(<MerchantSalonApply />) },
      { path: "register", element: withSuspense(<MerchantSalonRegister />) },
      { path: "resubmit/:salonId", element: withSuspense(<MerchantSalonResubmit />) },
    ],
  },
  {
    // 운영자용 관리 대시보드
    path: "/admin",
    element: withSuspense(<AdminRootLayout />),
    children: [{ index: true, element: withSuspense(<AdminHome />) }],
  },
  {
    path: "*",
    element: <Navigate to="/mimo" replace />,
  },
];
