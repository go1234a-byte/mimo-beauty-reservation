import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { MimoCoordinates } from "@/types/mimo";
import { MIMO_FALLBACK_COORDS } from "@/lib/mimoGeo";

export type MimoLocationStatus = "idle" | "requesting" | "granted" | "denied" | "unsupported";

interface LocationContextValue {
  status: MimoLocationStatus;
  coords: MimoCoordinates | null;
  /** coords가 준비되기 전까지 화면이 즉시 그릴 수 있도록 하는 폴백 좌표 (실제 위치 아님) */
  displayCoords: MimoCoordinates;
  error: string | null;
  requestLocation: () => void;
}

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<MimoLocationStatus>("idle");
  const [coords, setCoords] = useState<MimoCoordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const requestLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unsupported");
      setError("이 브라우저에서는 위치 서비스를 사용할 수 없습니다.");
      return;
    }

    setStatus("requesting");
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setStatus("granted");

        // 위치가 바뀌면 지도/거리도 부드럽게 갱신되도록 워치 등록
        if (watchIdRef.current === null) {
          watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => {
              /* watch 중 실패는 무시 — 마지막으로 알려진 좌표를 계속 사용 */
            },
            { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 },
          );
        }
      },
      (err) => {
        setStatus("denied");
        setError(
          err.code === err.PERMISSION_DENIED
            ? "위치 접근이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요."
            : "현재 위치를 가져오지 못했습니다.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }, []);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const value: LocationContextValue = {
    status,
    coords,
    displayCoords: coords ?? MIMO_FALLBACK_COORDS,
    error,
    requestLocation,
  };

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useMimoLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useMimoLocation must be used within LocationProvider");
  return ctx;
}
