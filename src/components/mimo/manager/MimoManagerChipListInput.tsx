import { useState } from "react";
import { X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MimoManagerChipListInputProps {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

/** 카테고리 태그/사진 URL처럼 "직접 입력해서 추가하고 x로 제거"하는 목록 입력창. */
export function MimoManagerChipListInput({ values, onChange, placeholder }: MimoManagerChipListInputProps) {
  const [draft, setDraft] = useState("");

  const addValue = () => {
    const trimmed = draft.trim();
    if (!trimmed || values.includes(trimmed)) return;
    onChange([...values, trimmed]);
    setDraft("");
  };

  const removeValue = (value: string) => {
    onChange(values.filter((v) => v !== value));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addValue();
            }
          }}
          placeholder={placeholder}
          className="h-9 flex-1 text-sm"
        />
        <Button type="button" variant="outline" size="sm" className="h-9 gap-1" onClick={addValue}>
          <Plus className="h-3.5 w-3.5" />
          추가
        </Button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {values.map((v) => (
            <Badge key={v} variant="secondary" className="gap-1 pr-1 text-[11px]">
              <span className="max-w-[180px] truncate">{v}</span>
              <button type="button" onClick={() => removeValue(v)} aria-label={`${v} 제거`}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
