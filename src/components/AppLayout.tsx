import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  Receipt,
  Repeat,
  CalendarDays,
  Settings,
  Moon,
  Sun,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/transactions", label: "Transakcje", icon: Receipt },
  { to: "/subscriptions", label: "Subskrypcje", icon: Repeat },
  { to: "/calendar", label: "Kalendarz płatności", icon: CalendarDays },
  { to: "/settings", label: "Ustawienia", icon: Settings },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {links.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-2 rounded-md px-3 py-2 text-sm transition ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent hover:text-accent-foreground"
            }`
          }
        >
          <Icon size={18} /> {label}
        </NavLink>
      ))}
    </nav>
  );
}

export default function AppLayout() {
  const { resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const dark = resolvedTheme === "dark";

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card p-4 text-card-foreground md:block">
        <h1 className="mb-6 text-xl font-bold">Dorado</h1>
        <NavLinks />
      </aside>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 p-4">
          <SheetHeader className="p-0">
            <SheetTitle>Dorado</SheetTitle>
            <SheetDescription className="sr-only">Nawigacja</SheetDescription>
          </SheetHeader>
          <NavLinks onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border p-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen(true)}
            aria-label="Menu"
          >
            <Menu size={20} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto"
            onClick={() => setTheme(dark ? "light" : "dark")}
            aria-label="Zmień motyw"
          >
            {dark ? <Sun size={20} /> : <Moon size={20} />}
          </Button>
        </header>
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}