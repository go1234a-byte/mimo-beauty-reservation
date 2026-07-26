import { NavLink } from "react-router-dom";
import { LayoutDashboard, CalendarCheck, Store, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/mimo/manager", label: "홈", icon: LayoutDashboard, end: true },
  { to: "/mimo/manager/reservations", label: "예약관리", icon: CalendarCheck, end: false },
  { to: "/mimo/manager/salon", label: "매장관리", icon: Store, end: false },
  { to: "/mimo/manager/mypage", label: "마이페이지", icon: UserRound, end: false },
];

export function MimoManagerBottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md border-t border-border bg-card/95 backdrop-blur md:max-w-lg">
      <div className="grid grid-cols-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground",
                )
              }
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
