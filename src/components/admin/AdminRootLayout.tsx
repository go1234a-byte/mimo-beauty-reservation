import { Outlet } from "react-router-dom";
import { AdminDataProvider } from "@/contexts/AdminDataContext";
import { AdminAuthGate } from "@/components/admin/AdminAuthGate";

export function AdminRootLayout() {
  return (
    <div className="mimo-theme min-h-full bg-background">
      <div className="mx-auto min-h-full w-full max-w-2xl bg-background">
        <AdminAuthGate>
          <AdminDataProvider>
            <Outlet />
          </AdminDataProvider>
        </AdminAuthGate>
      </div>
    </div>
  );
}
