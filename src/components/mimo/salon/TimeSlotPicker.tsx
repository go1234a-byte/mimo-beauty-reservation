import { cn } from "@/lib/utils";

interface TimeSlotPickerProps {
  slots: string[];
  selected: string | null;
  disabledSlots: string[];
  onSelect: (slot: string) => void;
}

export function TimeSlotPicker({ slots, selected, disabledSlots, onSelect }: TimeSlotPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {slots.map((slot) => {
        const isNow = slot === "now";
        const disabled = disabledSlots.includes(slot);
        const active = selected === slot;
        return (
          <button
            key={slot}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(slot)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground",
              isNow && !active && "border-primary/40 text-primary",
            )}
          >
            {isNow ? "지금 가능" : slot}
          </button>
        );
      })}
    </div>
  );
}
