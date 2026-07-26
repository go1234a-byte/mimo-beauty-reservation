import { useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import type { MimoSalon } from "@/types/mimo";

interface SalonGalleryProps {
  salon: MimoSalon;
}

export function SalonGallery({ salon }: SalonGalleryProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => setCurrent(api.selectedScrollSnap()));
  }, [api]);

  return (
    <div className="relative">
      <Carousel setApi={setApi} className="w-full">
        <CarouselContent className="ml-0">
          {salon.photos.map((photo, idx) => (
            <CarouselItem key={idx} className="pl-0">
              <div className="aspect-[4/3] w-full">
                <img
                  src={photo}
                  alt={`${salon.name} 사진 ${idx + 1}`}
                  crossOrigin="anonymous"
                  className="h-full w-full object-cover"
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      <div className="absolute bottom-3 right-3 rounded-full bg-foreground/60 px-2 py-0.5 text-xs font-medium text-background">
        {current + 1}/{salon.photos.length}
      </div>
    </div>
  );
}
