import { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { MimoService } from "@/types/mimo";

interface MimoManagerServiceEditorProps {
  services: MimoService[];
  onChange: (services: MimoService[]) => void;
}

/** 매장의 시술 메뉴(이름/가격/소요시간)를 추가·삭제하는 편집기. */
export function MimoManagerServiceEditor({ services, onChange }: MimoManagerServiceEditorProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");

  const addService = () => {
    const trimmedName = name.trim();
    const priceNum = Number(price);
    const durationNum = Number(duration);
    if (!trimmedName || !Number.isFinite(priceNum) || priceNum <= 0 || !Number.isFinite(durationNum) || durationNum <= 0) {
      return;
    }
    onChange([...services, { name: trimmedName, price: priceNum, duration: durationNum }]);
    setName("");
    setPrice("");
    setDuration("");
  };

  const removeService = (index: number) => {
    onChange(services.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {services.length > 0 && (
        <div className="space-y-2">
          {services.map((service, index) => (
            <div
              key={`${service.name}-${index}`}
              className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{service.name}</p>
                <p className="text-xs text-muted-foreground">
                  {service.price.toLocaleString("ko-KR")}원 · {service.duration}분
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeService(index)}
                aria-label={`${service.name} 삭제`}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2 rounded-xl border border-dashed border-border p-3">
        <p className="text-xs font-medium text-muted-foreground">새 시술 메뉴 추가</p>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="시술명 (예: 젤네일)" className="h-9 text-sm" />
        <div className="flex items-center gap-1.5">
          <Input
            value={price}
            onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="가격(원)"
            inputMode="numeric"
            className="h-9 flex-1 text-sm"
          />
          <Input
            value={duration}
            onChange={(e) => setDuration(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="소요시간(분)"
            inputMode="numeric"
            className="h-9 flex-1 text-sm"
          />
          <Button type="button" variant="outline" size="sm" className="h-9 shrink-0 gap-1" onClick={addService}>
            <Plus className="h-3.5 w-3.5" />
            추가
          </Button>
        </div>
      </div>
    </div>
  );
}
