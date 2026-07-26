import { Outlet } from "react-router-dom";
import { MimoManagerProvider } from "@/contexts/MimoManagerContext";

/** /mimo/manager 이하 모든 경로(로그인/가입 포함)에 매장 관리자 인증 컨텍스트를 제공한다. */
export function MimoManagerProviderLayout() {
  return (
    <MimoManagerProvider>
      <Outlet />
    </MimoManagerProvider>
  );
}
