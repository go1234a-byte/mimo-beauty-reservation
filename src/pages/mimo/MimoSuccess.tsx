import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { MimoPrimaryButton } from "@/components/mimo/ui/MimoPrimaryButton";
import { Button } from "@/components/ui/button";
import { MIMO_PAYMENT_METHODS, type MimoPaymentMethod } from "@/types/mimo";

interface SuccessState {
  salonName: string;
  serviceName: string;
  price: number;
  paymentMethod: MimoPaymentMethod;
}

export default function MimoSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as SuccessState | undefined;
  const paymentLabel = MIMO_PAYMENT_METHODS.find((m) => m.id === state?.paymentMethod)?.label;

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-8 bg-background px-6 pb-10">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 14 }}
        className="flex h-20 w-20 items-center justify-center rounded-full bg-primary"
      >
        <motion.div
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Check className="h-10 w-10 text-primary-foreground" strokeWidth={3} />
        </motion.div>
      </motion.div>

      <div className="space-y-1 text-center">
        <h1 className="text-xl font-bold text-foreground">예약 완료</h1>
        <p className="text-sm text-muted-foreground">예약이 성공적으로 확정되었습니다.</p>
      </div>

      {state && (
        <div className="w-full space-y-3 rounded-2xl bg-secondary p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">매장</span>
            <span className="font-semibold text-foreground">{state.salonName}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">서비스</span>
            <span className="font-semibold text-foreground">{state.serviceName}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">결제 수단</span>
            <span className="font-semibold text-foreground">{paymentLabel}</span>
          </div>
          <div className="h-px bg-border" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">결제 금액</span>
            <span className="text-lg font-bold text-primary">₩{state.price.toLocaleString()}</span>
          </div>
        </div>
      )}

      <div className="w-full space-y-2">
        <MimoPrimaryButton onClick={() => navigate("/mimo/bookings")}>예약 내역 보기</MimoPrimaryButton>
        <Button variant="ghost" className="h-[52px] w-full rounded-xl" onClick={() => navigate("/mimo")}>
          홈으로
        </Button>
      </div>
    </div>
  );
}
