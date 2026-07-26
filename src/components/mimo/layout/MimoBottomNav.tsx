import { NavLink } from "react-router-dom";
import { Home, CalendarClock, Heart, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/mimo", label: "홈", icon: Home, end: true },
  { to: "/mimo/bookings", label: "대기내역", icon: CalendarClock, end: false },
  { to: "/mimo/favorites", label: "즐겨찾기", icon: Heart, end: false },
  { to: "/mimo/mypage", label: "마이페이지", icon: UserRound, end: false },
];

export function MimoBottomNav() {
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
