import { useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ChevronLeft, Heart, Share2, Star } from "lucide-react";
import { toast } from "sonner";
import { SalonGallery } from "@/components/mimo/salon/SalonGallery";
import { ServiceSelector } from "@/components/mimo/salon/ServiceSelector";
import { TimeSlotPicker } from "@/components/mimo/salon/TimeSlotPicker";
import { AuthGateModal } from "@/components/mimo/auth/AuthGateModal";
import { MimoPrimaryButton } from "@/components/mimo/ui/MimoPrimaryButton";
import { useMimoData } from "@/contexts/MimoDataContext";
import { formatDistanceLabel } from "@/lib/mimoGeo";
import type { MimoService } from "@/types/mimo";

const TIME_SLOTS = ["now", "12:00", "13:00", "14:00", "15:00"];

function resolveStartTime(slot: string): string {
  const now = new Date();
  if (slot === "now") {
    return now.toISOString();
  }
  const [hour, minute] = slot.split(":").map(Number);
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
  return date.toISOString();
}

export default function MimoSalonDetail() {
  const { salonId } = useParams<{ salonId: string }>();
  const navigate = useNavigate();
  const { getSalonById, currentUser, isFavorite, toggleFavorite, hasActiveReservation, isSlotTaken } =
    useMimoData();
  const salon = salonId ? getSalonById(salonId) : undefined;

  const [selectedService, setSelectedService] = useState<MimoService | null>(salon?.services[0] ?? null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>("now");
  const [authOpen, setAuthOpen] = useState(false);

  const disabledSlots = useMemo(() => {
    if (!salon) return [];
    return TIME_SLOTS.filter((slot) => slot !== "now" && isSlotTaken(salon.id, resolveStartTime(slot)));
  }, [salon, isSlotTaken]);

  if (!salon) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-muted-foreground">매장 정보를 찾을 수 없습니다.</p>
        <Link to="/mimo" className="text-sm font-semibold text-primary">
          홈으로 돌아가기
        </Link>
      </div>
    );
  }

  const favorited = isFavorite(salon.id);

  const proceedToCheckout = () => {
    if (!selectedService || !selectedSlot) return;
    navigate(`/mimo/checkout/${salon.id}`, {
      state: {
        serviceName: selectedService.name,
        price: selectedService.price,
        startTime: resolveStartTime(selectedSlot),
      },
    });
  };

  const handleReserveClick = () => {
    if (!selectedService || !selectedSlot) return;
    if (!currentUser) {
      setAuthOpen(true);
      return;
    }
    if (hasActiveReservation) {
      toast.error("이미 진행 중인 예약이 있어요. 한 번에 하나의 예약만 가능합니다.");
      return;
    }
    proceedToCheckout();
  };

  return (
    <div className="min-h-full bg-background pb-28">
      <div className="relative">
        <SalonGallery salon={salon} />
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-background/85 backdrop-blur"
          aria-label="뒤로가기"
        >
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </button>
        <div className="absolute right-4 top-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => (currentUser ? toggleFavorite(salon.id) : setAuthOpen(true))}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-background/85 backdrop-blur"
            aria-label="즐겨찾기"
          >
            <Heart className={favorited ? "h-4.5 w-4.5 fill-primary text-primary" : "h-4.5 w-4.5 text-foreground"} />
          </button>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-background/85 backdrop-blur"
            aria-label="공유"
          >
            <Share2 className="h-4.5 w-4.5 text-foreground" />
          </button>
        </div>
      </div>

      <div className="space-y-6 px-6 pt-5">
        <div className="space-y-1.5">
          <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
            지금 가능
          </span>
          <h1 className="text-xl font-bold text-foreground">{salon.name}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{formatDistanceLabel(salon)}</span>
            <span className="flex items-center gap-1 font-medium text-foreground">
              <Star className="h-3.5 w-3.5 fill-warning text-warning" />
              {salon.rating.toFixed(1)}
            </span>
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">서비스</h2>
          <ServiceSelector services={salon.services} selected={selectedService} onSelect={setSelectedService} />
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">예약 가능 시간</h2>
          <TimeSlotPicker
            slots={TIME_SLOTS}
            selected={selectedSlot}
            disabledSlots={disabledSlots}
            onSelect={setSelectedSlot}
          />
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-md border-t border-border bg-card p-4 md:max-w-lg">
        <MimoPrimaryButton disabled={!selectedService || !selectedSlot} onClick={handleReserveClick}>
          예약하기
        </MimoPrimaryButton>
      </div>

      <AuthGateModal open={authOpen} onOpenChange={setAuthOpen} onAuthenticated={proceedToCheckout} />
    </div>
  );
}
