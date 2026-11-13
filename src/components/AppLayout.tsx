import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Receipt,
  Repeat,
  CalendarDays,
  Settings,
  Moon,
  Sun,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSyncSubscriptionPayments } from "@/hooks/useSyncSubscriptionPayments";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/transactions", label: "Transakcje", icon: Receipt },
  { to: "/subscriptions", label: "Subskrypcje", icon: Repeat },
  { to: "/calendar", label: "Kalendarz płatności", icon: CalendarDays },
  { to: "/settings", label: "Ustawienia", icon: Settings },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Menu główne" className="flex flex-col gap-1">
      {links.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              isActive
                ? "bg-indigo-600 text-white"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )
          }
        >
          <Icon size={18} aria-hidden="true" /> {label}
        </NavLink>
      ))}
    </nav>
  );
}

export default function AppLayout() {
  const { dark, toggle } = useTheme();
  useSyncSubscriptionPayments();
  const [menuOpen, setMenuOpen] = useState(false);

  // Esc zamyka menu na telefonie.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden w-64 shrink-0 border-r bg-card p-4 md:block">
        <h1 className="mb-6 text-xl font-bold">Dorado</h1>
        <NavLinks />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b bg-card px-4 py-3 md:justify-end">
          <div className="flex items-center gap-2 md:hidden">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? "Zamknij menu" : "Otwórz menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
            >
              {menuOpen ? <X /> : <Menu />}
            </Button>
            <span className="text-lg font-bold">Dorado</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label={dark ? "Przełącz na jasny motyw" : "Przełącz na ciemny motyw"}
          >
            {dark ? <Sun /> : <Moon />}
          </Button>
        </header>

        {menuOpen && (
          <div id="mobile-nav" className="border-b bg-card p-3 md:hidden">
            <NavLinks onNavigate={() => setMenuOpen(false)} />
          </div>
        )}

        <main className="min-w-0 flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
