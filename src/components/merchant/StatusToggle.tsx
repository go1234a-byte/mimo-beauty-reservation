import { cn } from "@/lib/utils";

interface StatusToggleProps {
  isOn: boolean;
  onToggle: (next: boolean) => void;
  disabled?: boolean;
}

export function StatusToggle({ isOn, onToggle, disabled }: StatusToggleProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onToggle(!isOn)}
      className={cn(
        "flex w-full flex-col items-center gap-4 rounded-3xl border p-8 transition-colors",
        isOn ? "border-primary/30 bg-primary/5" : "border-border bg-secondary",
        disabled && "opacity-60",
      )}
    >
      <span
        className={cn(
          "relative flex h-16 w-28 items-center rounded-full p-1.5 transition-colors duration-300",
          isOn ? "bg-primary justify-end" : "bg-muted-foreground/30 justify-start",
        )}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-background text-xs font-bold shadow-mimo-sm transition-transform duration-300">
          {isOn ? "ON" : "OFF"}
        </span>
      </span>
      <div className="text-center">
        <p className={cn("text-lg font-bold", isOn ? "text-primary" : "text-foreground")}>
          {isOn ? "지금 예약 가능" : "영업 종료"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {isOn ? "탭하면 매장이 즉시 사라져요" : "탭하면 매장이 지금 바로 노출돼요"}
        </p>
      </div>
    </button>
  );
}
