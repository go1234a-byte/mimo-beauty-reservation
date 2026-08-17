import { useEffect, useState, type ReactNode } from "react";
import { MimoSplashScreen } from "@/components/mimo/SplashScreen";
import { LocationPermissionScreen } from "@/components/mimo/location/LocationPermissionScreen";
import { useMimoLocation } from "@/contexts/LocationContext";

/**
 * 앱 진입 플로우: Splash → Location Permission → Current Location → Home(children)
 * MIMO는 위치 기반 서비스이므로 위치 권한 확보 전에는 홈 화면을 노출하지 않는다.
 */
export function LocationGate({ children }: { children: ReactNode }) {
  const [splashDone, setSplashDone] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const { status, requestLocation } = useMimoLocation();

  // 스플래시가 끝나면, 이미 브라우저 권한이 허용된 상태인지 조용히 확인해서
  // 이미 허용한 사용자에게는 재요청 화면을 보여주지 않는다.
  useEffect(() => {
    if (!splashDone || status !== "idle") return;
    const permissionsApi = typeof navigator !== "undefined" ? navigator.permissions : undefined;
    if (permissionsApi?.query) {
      permissionsApi
        .query({ name: "geolocation" as PermissionName })
        .then((result) => {
          if (result.state === "granted") requestLocation();
        })
        .catch(() => {
          /* Permissions API 미지원 브라우저는 사용자 액션으로 요청 */
        });
    }
  }, [splashDone, status, requestLocation]);

  if (!splashDone) {
    return <MimoSplashScreen onFinish={() => setSplashDone(true)} />;
  }

  const locationReady = status === "granted" || status === "unsupported" || skipped;

  if (!locationReady) {
    return <LocationPermissionScreen onContinueWithoutLocation={() => setSkipped(true)} />;
  }

  return <>{children}</>;
}
