import { Outlet } from "react-router-dom";
import { AdminDataProvider } from "@/contexts/AdminDataContext";
import { AdminPasscodeGate } from "@/components/admin/AdminPasscodeGate";

export function AdminRootLayout() {
  return (
    <div className="mimo-theme min-h-full bg-background">
      <div className="mx-auto min-h-full w-full max-w-2xl bg-background">
        <AdminPasscodeGate>
          <AdminDataProvider>
            <Outlet />
          </AdminDataProvider>
        </AdminPasscodeGate>
      </div>
    </div>
  );
}
