import { Outlet } from "react-router-dom";
import { MimoDataProvider } from "@/contexts/MimoDataContext";
import { LocationProvider } from "@/contexts/LocationContext";
import { LocationGate } from "@/components/mimo/location/LocationGate";

export function MimoRootLayout() {
  return (
    <div className="mimo-theme min-h-full bg-background">
      <LocationProvider>
        <MimoDataProvider>
          <div className="mx-auto min-h-full w-full max-w-md bg-background md:max-w-lg">
            <LocationGate>
              <Outlet />
            </LocationGate>
          </div>
        </MimoDataProvider>
      </LocationProvider>
    </div>
  );
}
