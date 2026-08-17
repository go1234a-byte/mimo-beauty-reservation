import { useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { MimoPrimaryButton } from "@/components/mimo/ui/MimoPrimaryButton";
import { cn } from "@/lib/utils";
import { submitMimoReview } from "@/lib/mimoReviews";

interface ReviewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salonId: string;
  salonName: string;
  userId: string;
  onSubmitted?: () => void;
}

export function ReviewSheet({ open, onOpenChange, salonId, salonName, userId, onSubmitted }: ReviewSheetProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    const ok = await submitMimoReview(salonId, userId, rating, comment.trim());
    setSubmitting(false);
    if (ok) {
      toast.success("리뷰가 등록됐어요. 감사합니다!");
      onOpenChange(false);
      onSubmitted?.();
    } else {
      toast.error("리뷰 등록에 실패했어요.");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl border-none px-6 pb-8 pt-6">
        <SheetHeader className="text-left">
          <SheetTitle className="text-lg font-bold">{salonName}, 어떠셨나요?</SheetTitle>
          <SheetDescription>별점과 한줄 후기만 남겨주세요. 선택사항이에요.</SheetDescription>
        </SheetHeader>

        <div className="mt-5 flex justify-center gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setRating(n)} aria-label={`별점 ${n}점`}>
              <Star className={cn("h-9 w-9", n <= rating ? "fill-warning text-warning" : "text-border")} />
            </button>
          ))}
        </div>

        <input
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, 60))}
          placeholder="한줄로 남겨주세요 (선택)"
          maxLength={60}
          className="mt-5 h-[52px] w-full rounded-xl border border-border bg-card px-4 text-sm outline-none focus:border-primary"
        />

        <div className="mt-5 space-y-2">
          <MimoPrimaryButton onClick={handleSubmit} disabled={submitting}>
            {submitting ? "등록 중..." : "리뷰 남기기"}
          </MimoPrimaryButton>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full py-2 text-center text-xs font-medium text-muted-foreground underline underline-offset-2"
          >
            다음에 할게요
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
