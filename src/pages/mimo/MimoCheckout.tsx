import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, CreditCard, MessageCircle, Smartphone, Apple } from "lucide-react";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { MimoPrimaryButton } from "@/components/mimo/ui/MimoPrimaryButton";
import { useMimoData } from "@/contexts/MimoDataContext";
import { MIMO_PAYMENT_METHODS, type MimoPaymentMethod, type MimoReservation } from "@/types/mimo";

interface CheckoutState {
  serviceName: string;
  price: number;
  startTime: string;
}

const PAYMENT_ICON: Record<MimoPaymentMethod, typeof CreditCard> = {
  kakaopay: MessageCircle,
  tosspay: Smartphone,
  card: CreditCard,
  applepay: Apple,
};

export default function MimoCheckout() {
  const { salonId } = useParams<{ salonId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as CheckoutState | undefined;
  const { getSalonById, createPendingReservation, confirmReservation, cancelReservation, hasActiveReservation } =
    useMimoData();

  const salon = salonId ? getSalonById(salonId) : undefined;
  const [paymentMethod, setPaymentMethod] = useState<MimoPaymentMethod>("kakaopay");
  const [pendingReservation, setPendingReservation] = useState<MimoReservation | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const createdRef = useRef(false);

  useEffect(() => {
    if (!salon || !state || createdRef.current) return;
    if (hasActiveReservation) {
      toast.error("이미 진행 중인 예약이 있어요.");
      navigate(-1);
      return;
    }
    createdRef.current = true;
    createPendingReservation({
      salonId: salon.id,
      serviceName: state.serviceName,
      price: state.price,
      startTime: state.startTime,
    }).then((reservation) => {
      if (reservation) {
        setPendingReservation(reservation);
      } else {
        toast.error("예약 생성에 실패했습니다.");
        navigate(-1);
      }
    });
  }, [salon, state, hasActiveReservation, createPendingReservation, navigate]);

  const handleBack = () => {
    if (pendingReservation) {
      cancelReservation(pendingReservation.reservationId);
    }
    navigate(-1);
  };

  const handlePay = async () => {
    if (!pendingReservation) return;
    setSubmitting(true);
    await confirmReservation(pendingReservation.reservationId, paymentMethod);
    setSubmitting(false);
    navigate("/mimo/success", {
      state: {
        salonName: salon?.name,
        serviceName: pendingReservation.serviceName,
        price: pendingReservation.price,
        paymentMethod,
      },
    });
  };

  if (!salon || !state) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-muted-foreground">결제 정보를 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background pb-28">
      <header className="flex items-center gap-3 px-4 pt-6">
        <button type="button" onClick={handleBack} aria-label="뒤로가기">
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-base font-bold text-foreground">결제하기</h1>
      </header>

      <div className="space-y-6 px-6 pt-6">
        <section className="space-y-2 rounded-2xl bg-secondary p-4">
          <p className="text-sm font-semibold text-foreground">{salon.name}</p>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{state.serviceName}</span>
            <span className="font-medium text-foreground">₩{state.price.toLocaleString()}</span>
          </div>
        </section>

        <section className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">결제 금액</span>
          <span className="text-lg font-bold text-foreground">₩{state.price.toLocaleString()}</span>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">결제 수단</h2>
          <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as MimoPaymentMethod)}>
            {MIMO_PAYMENT_METHODS.map((method) => {
              const Icon = PAYMENT_ICON[method.id];
              return (
                <Label
                  key={method.id}
                  htmlFor={method.id}
                  className="flex cursor-pointer items-center justify-between rounded-2xl border border-border bg-card p-4"
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Icon className="h-4.5 w-4.5 text-muted-foreground" />
                    {method.label}
                  </span>
                  <RadioGroupItem value={method.id} id={method.id} />
                </Label>
              );
            })}
          </RadioGroup>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-md border-t border-border bg-card p-4 md:max-w-lg">
        <MimoPrimaryButton disabled={!pendingReservation || submitting} onClick={handlePay}>
          {submitting ? "결제 처리 중..." : "결제하기"}
        </MimoPrimaryButton>
      </div>
    </div>
  );
}
