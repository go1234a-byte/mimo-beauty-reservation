import { useState } from "react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MimoPrimaryButton } from "@/components/mimo/ui/MimoPrimaryButton";
import { submitInquiry } from "@/lib/mimoInquiries";

interface InquirySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onSubmitted: () => void;
}

export function InquirySheet({ open, onOpenChange, userId, onSubmitted }: InquirySheetProps) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) return;
    setSubmitting(true);
    const ok = await submitInquiry(userId, subject.trim(), message.trim());
    setSubmitting(false);
    if (ok) {
      toast.success("문의가 접수됐어요. 답변을 기다려주세요.");
      setSubject("");
      setMessage("");
      onOpenChange(false);
      onSubmitted();
    } else {
      toast.error("문의 접수에 실패했어요.");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl border-none px-6 pb-8 pt-6">
        <SheetHeader className="text-left">
          <SheetTitle className="text-lg font-bold">1:1 문의</SheetTitle>
          <SheetDescription>궁금한 점을 남겨주시면 확인 후 답변드릴게요.</SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="inquiry-subject">제목</Label>
            <Input id="inquiry-subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inquiry-message">내용</Label>
            <Textarea
              id="inquiry-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
            />
          </div>
        </div>

        <div className="mt-5">
          <MimoPrimaryButton onClick={handleSubmit} disabled={submitting || !subject.trim() || !message.trim()}>
            {submitting ? "접수 중..." : "문의하기"}
          </MimoPrimaryButton>
        </div>
      </SheetContent>
    </Sheet>
  );
}
