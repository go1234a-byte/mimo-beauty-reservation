import { Link, useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { MimoPrimaryButton } from "@/components/mimo/ui/MimoPrimaryButton";
import { useMimoData } from "@/contexts/MimoDataContext";
import { cn } from "@/lib/utils";
import { formatEtaLabel, formatServiceDurationLabel } from "@/lib/mimoGeo";
import type { MimoCoordinates, MimoSalon } from "@/types/mimo";

interface SalonListCardProps {
  salon: MimoSalon;
  currentLocation: MimoCoordinates;
  selected?: boolean;
  /** 카드를 탭하면 상세로 이동하지 않고 지도 핀만 강조한다 (Apple Maps 스타일) */
  onSelect?: (salonId: string) => void;
}

export function SalonListCard({ salon, currentLocation, selected, onSelect }: SalonListCardProps) {
  const navigate = useNavigate();
  const { currentUser, hasActiveReservation } = useMimoData();
  const mainService = salon.services[0];
  // 서비스가 1개뿐인 매장은 고를 게 없으니 상세 페이지 없이 바로 결제로 (3탭 목표).
  // 단, 비회원은 상세 페이지에서 둘러볼 수 있어야 하므로 로그인된 사용자에게만 적용한다.
  const onlyService = salon.services.length === 1 ? salon.services[0] : null;
  const canQuickReserve = !!onlyService && !!currentUser;

  const handleQuickReserve = () => {
    if (!onlyService) return;
    if (hasActiveReservation) {
      toast.error("이미 진행 중인 예약이 있어요. 한 번에 하나의 예약만 가능합니다.");
      return;
    }
    navigate(`/mimo/checkout/${salon.id}`, {
      state: { serviceName: onlyService.name, price: onlyService.price, startTime: new Date().toISOString() },
    });
  };

  return (
    <Card
      className={cn(
        "overflow-hidden rounded-2xl border shadow-mimo-sm transition-all",
        selected ? "border-primary ring-2 ring-primary/25" : "border-border",
      )}
    >
      <button type="button" className="block w-full text-left" onClick={() => onSelect?.(salon.id)}>
        <CardContent className="flex gap-3 p-3.5">
          <div className="min-w-0 flex-1 space-y-1.5">
            {/* "지금 가능"이 카드에서 가장 먼저 눈에 들어오는 요소여야 한다 */}
            <div className="flex items-center gap-1.5">
              <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                <span className="h-2 w-2 rounded-full bg-primary" />
                지금 가능
              </span>
              <span className="flex items-center gap-0.5 text-xs font-medium text-muted-foreground">
                <Star className="h-3 w-3 fill-warning text-warning" />
                {salon.rating.toFixed(1)}
              </span>
            </div>

            <h3 className="truncate text-[15px] font-semibold text-foreground">{salon.name}</h3>
            <p className="text-xs font-medium text-muted-foreground">{formatEtaLabel(salon, currentLocation)}</p>
            {mainService && (
              <p className="truncate text-xs text-muted-foreground">
                {mainService.name} · {formatServiceDurationLabel(mainService.duration)}
              </p>
            )}
          </div>

          <img
            src={salon.photos[0]}
            alt={salon.name}
            crossOrigin="anonymous"
            loading="lazy"
            decoding="async"
            className="h-14 w-14 shrink-0 rounded-xl object-cover"
          />
        </CardContent>
      </button>

      <div className="flex items-center justify-between border-t border-border/70 px-3.5 py-2.5">
        <span className="text-base font-bold text-foreground">₩{(mainService?.price ?? 0).toLocaleString()}</span>
        {canQuickReserve ? (
          <MimoPrimaryButton
            className="h-8 w-auto rounded-full px-4 text-xs shadow-none"
            onClick={(e) => {
              e.stopPropagation();
              handleQuickReserve();
            }}
          >
            예약하기
          </MimoPrimaryButton>
        ) : (
          <Link to={`/mimo/salon/${salon.id}`} onClick={(e) => e.stopPropagation()}>
            <MimoPrimaryButton className="h-8 w-auto rounded-full px-4 text-xs shadow-none">예약하기</MimoPrimaryButton>
          </Link>
        )}
      </div>
    </Card>
  );
}
