import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Receipt,
  Repeat,
  CalendarDays,
  Settings,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "../hooks/useTheme";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/transactions", label: "Transakcje", icon: Receipt },
  { to: "/subscriptions", label: "Subskrypcje", icon: Repeat },
  { to: "/calendar", label: "Kalendarz płatności", icon: CalendarDays },
  { to: "/settings", label: "Ustawienia", icon: Settings },
];

export default function AppLayout() {
  const { dark, toggle } = useTheme();

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <aside className="w-64 shrink-0 border-r border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <h1 className="mb-6 text-xl font-bold">Dorado</h1>
        <nav className="flex flex-col gap-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-md px-3 py-2 text-sm transition ${
                  isActive
                    ? "bg-indigo-600 text-white"
                    : "hover:bg-slate-100 dark:hover:bg-slate-700"
                }`
              }
            >
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex justify-end border-b border-slate-200 p-4 dark:border-slate-700">
          <button
            onClick={toggle}
            className="rounded-md p-2 hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label="Zmień motyw"
          >
            {dark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}