import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MimoPrimaryButton } from "@/components/mimo/ui/MimoPrimaryButton";
import { formatDistanceLabel } from "@/lib/mimoGeo";
import type { MimoSalon } from "@/types/mimo";

interface SalonListCardProps {
  salon: MimoSalon;
}

export function SalonListCard({ salon }: SalonListCardProps) {
  const mainService = salon.services[0];

  return (
    <Card className="overflow-hidden rounded-2xl border-border shadow-mimo-sm">
      <CardContent className="flex gap-3 p-3">
        <Link to={`/mimo/salon/${salon.id}`} className="shrink-0">
          <img
            src={salon.photos[0]}
            alt={salon.name}
            crossOrigin="anonymous"
            className="h-20 w-20 rounded-xl object-cover"
          />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <Link to={`/mimo/salon/${salon.id}`} className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Badge className="bg-primary/10 text-primary hover:bg-primary/10">지금 가능</Badge>
              <span className="flex items-center gap-0.5 text-xs font-medium text-muted-foreground">
                <Star className="h-3 w-3 fill-warning text-warning" />
                {salon.rating.toFixed(1)}
              </span>
            </div>
            <h3 className="truncate text-sm font-semibold text-foreground">{salon.name}</h3>
            <p className="text-xs text-muted-foreground">{formatDistanceLabel(salon)}</p>
            {mainService && <p className="text-xs text-muted-foreground">{mainService.name}</p>}
          </Link>
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm font-bold text-foreground">
              ₩{(mainService?.price ?? 0).toLocaleString()}
            </span>
            <Link to={`/mimo/salon/${salon.id}`}>
              <MimoPrimaryButton className="h-8 w-auto rounded-full px-3 text-xs shadow-none">
                예약하기
              </MimoPrimaryButton>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
