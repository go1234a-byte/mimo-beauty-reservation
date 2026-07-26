import { Outlet } from "react-router-dom";
import { MimoDataProvider } from "@/contexts/MimoDataContext";

export function MimoRootLayout() {
  return (
    <div className="mimo-theme min-h-full bg-background">
      <MimoDataProvider>
        <div className="mx-auto min-h-full w-full max-w-md bg-background md:max-w-lg">
          <Outlet />
        </div>
      </MimoDataProvider>
    </div>
  );
}
