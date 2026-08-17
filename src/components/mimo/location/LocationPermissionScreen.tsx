import { motion } from "framer-motion";
import { MapPin, LocateFixed } from "lucide-react";
import { MimoPrimaryButton } from "@/components/mimo/ui/MimoPrimaryButton";
import { useMimoLocation } from "@/contexts/LocationContext";

interface LocationPermissionScreenProps {
  onContinueWithoutLocation?: () => void;
}

export function LocationPermissionScreen({ onContinueWithoutLocation }: LocationPermissionScreenProps) {
  const { status, error, requestLocation } = useMimoLocation();
  const isRequesting = status === "requesting";
  const isDenied = status === "denied";
  const isUnsupported = status === "unsupported";

  return (
    <div className="fixed inset-0 z-[150] flex flex-col items-center justify-between bg-background px-6 pb-10 pt-16">
      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="relative flex h-24 w-24 items-center justify-center rounded-full bg-primary/10"
        >
          <span className="absolute inset-0 -m-3 animate-ping rounded-full bg-primary/10" />
          <MapPin className="h-11 w-11 text-primary" strokeWidth={1.75} />
        </motion.div>

        <div className="space-y-2 px-2">
          <h1 className="text-xl font-bold text-foreground">지금 내 주변을 확인할게요</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            MIMO는 지금 이 순간 예약 가능한 뷰티 서비스를 보여드려요.
            <br />
            정확한 위치 접근이 필요합니다.
          </p>
        </div>

        {isDenied && error && (
          <div className="w-full rounded-2xl bg-destructive/10 px-4 py-3 text-xs font-medium text-destructive">
            {error}
          </div>
        )}
      </div>

      <div className="w-full space-y-2.5">
        <MimoPrimaryButton onClick={requestLocation} disabled={isRequesting}>
          <LocateFixed className="mr-1.5 h-4 w-4" />
          {isRequesting ? "위치 확인 중..." : isDenied ? "다시 시도" : "위치 접근 허용하기"}
        </MimoPrimaryButton>

        {(isDenied || isUnsupported) && onContinueWithoutLocation && (
          <button
            type="button"
            onClick={onContinueWithoutLocation}
            className="w-full py-2 text-center text-xs font-medium text-muted-foreground underline underline-offset-2"
          >
            나중에 설정하고 우선 둘러보기
          </button>
        )}
      </div>
    </div>
  );
}
