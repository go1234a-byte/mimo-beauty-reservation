import { Outlet } from "react-router-dom";
import { MerchantDataProvider } from "@/contexts/MerchantDataContext";

export function MerchantRootLayout() {
  return (
    <div className="mimo-theme min-h-full bg-background">
      <MerchantDataProvider>
        <div className="mx-auto min-h-full w-full max-w-md bg-background md:max-w-lg">
          <Outlet />
        </div>
      </MerchantDataProvider>
    </div>
  );
}
