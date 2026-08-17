import { cn } from "@/lib/utils";
import type { MimoService } from "@/types/mimo";

interface ServiceSelectorProps {
  services: MimoService[];
  selected: MimoService | null;
  onSelect: (service: MimoService) => void;
}

export function ServiceSelector({ services, selected, onSelect }: ServiceSelectorProps) {
  return (
    <div className="space-y-2">
      {services.map((service) => {
        const active = selected?.name === service.name;
        return (
          <button
            key={service.name}
            type="button"
            onClick={() => onSelect(service)}
            className={cn(
              "flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-colors",
              active ? "border-primary bg-primary/5" : "border-border bg-card",
            )}
          >
            <div>
              <p className="text-sm font-semibold text-foreground">{service.name}</p>
              <p className="text-xs text-muted-foreground">예상 소요시간 {service.duration}분</p>
            </div>
            <span className={cn("text-sm font-bold", active ? "text-primary" : "text-foreground")}>
              ₩{service.price.toLocaleString()}
            </span>
          </button>
        );
      })}
    </div>
  );
}
