import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useMimoManager } from "@/contexts/MimoManagerContext";
import { MimoManagerBottomNav } from "@/components/mimo/manager/MimoManagerBottomNav";

/**
 * 로그인한 매장 관리자만 접근 가능한 화면들의 공통 레이아웃.
 * - 인증 로딩 중: 대기
 * - 비로그인: 로그인 페이지로 이동
 * - 로그인했지만 매장 미등록: 매장 등록 페이지로 이동(등록 페이지 자체는 예외)
 */
export function MimoManagerProtectedLayout() {
  const { authLoading, isManagerLoggedIn, mySalon, salonLoading } = useMimoManager();
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="flex min-h-full items-center justify-center py-24">
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      </div>
    );
  }

  if (!isManagerLoggedIn) {
    return <Navigate to="/mimo/manager/login" replace state={{ from: location.pathname }} />;
  }

  if (!salonLoading && !mySalon) {
    return <Navigate to="/mimo/manager/salon-setup" replace />;
  }

  return (
    <div className="min-h-full bg-background pb-24">
      <Outlet />
      <MimoManagerBottomNav />
    </div>
  );
}
