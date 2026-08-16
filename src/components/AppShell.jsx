import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// This is the sidebar + header wrapper used by every screen once someone is
// signed in: Dashboard, Menu Management, POS Checkout, M-Pesa Transactions,
// and Inventory Detail all render inside this shell.

const OPERATE_ITEMS = [
  { to: "/app/dashboard", label: "Dashboard", icon: "grid_view" },
  { to: "/app/pos", label: "POS Checkout", icon: "shopping_cart" },
  { to: "/app/menu", label: "Menu", icon: "restaurant_menu" },
  { to: "/app/orders", label: "Orders", icon: "receipt_long" },
  { to: "/app/inventory", label: "Inventory", icon: "inventory_2" },
  { to: "/app/reports", label: "Reports", icon: "bar_chart" },
  { to: "/app/ai-assistant", label: "AI Assistant", icon: "auto_awesome" },
];

const MANAGE_ITEMS = [
  { to: "/app/customers", label: "Customers", icon: "group" },
  { to: "/app/staff", label: "Staff", icon: "badge" },
  { to: "/app/settings", label: "Settings", icon: "settings" },
];

function navLinkClasses({ isActive }) {
  return [
    "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors text-body-md",
    isActive ? "bg-white/10 text-white font-semibold" : "text-white/60 hover:bg-white/5 hover:text-white",
  ].join(" ");
}

export default function AppShell({ children, searchPlaceholder = "Search products, sales, customers..." }) {
  const { staffSession, ownerSession, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const restaurantName = staffSession?.branch_name || "KaliPOS";
  const personName = staffSession?.full_name || ownerSession?.user?.user_metadata?.restaurant_name || "Owner";
  const personRole = staffSession ? staffSession.role.toUpperCase() : "OWNER";

  return (
    <div className="min-h-screen bg-app-bg font-body-md text-on-surface flex">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-[260px]" : "w-0 overflow-hidden"
        } shrink-0 bg-brand-ink text-white flex flex-col transition-all duration-200`}
      >
        <div className="px-5 pt-6 pb-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[20px]">storefront</span>
          </div>
          <div className="min-w-0">
            <div className="font-headline-md text-body-md text-white truncate">{restaurantName}</div>
            <div className="text-[11px] text-white/50 truncate uppercase tracking-wide">
              {personName} · {personRole}
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 mt-2 space-y-6 overflow-y-auto">
          <div>
            <p className="px-4 mb-2 text-[11px] uppercase tracking-widest text-white/35 font-label-sm">Operate</p>
            <div className="space-y-1">
              {OPERATE_ITEMS.map((item) => (
                <NavLink key={item.to} to={item.to} className={navLinkClasses}>
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
          <div>
            <p className="px-4 mb-2 text-[11px] uppercase tracking-widest text-white/35 font-label-sm">Manage</p>
            <div className="space-y-1">
              {MANAGE_ITEMS.map((item) => (
                <NavLink key={item.to} to={item.to} className={navLinkClasses}>
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        </nav>

        <div className="p-4 mt-auto">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 text-white/70 text-[12px]">
            <span className="material-symbols-outlined text-[16px] text-brand-green-light">wifi</span>
            <div>
              <div className="text-white font-medium leading-tight">Online &amp; synced</div>
              <div className="text-white/40 leading-tight">All data live</div>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-white/50 hover:bg-white/5 hover:text-white transition-colors text-label-sm"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Header */}
        <header className="h-16 shrink-0 bg-white border-b border-outline-variant/20 px-6 flex items-center gap-4 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen((s) => !s)}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]">dock_to_right</span>
          </button>
          <div className="flex-1 max-w-md flex items-center bg-surface-container-low rounded-full px-4 h-10">
            <span className="material-symbols-outlined text-on-surface-variant text-[18px] mr-2">search</span>
            <input
              className="bg-transparent border-none outline-none text-body-md w-full text-on-surface placeholder:text-outline"
              placeholder={searchPlaceholder}
              type="text"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setDarkMode((d) => !d)}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">{darkMode ? "light_mode" : "dark_mode"}</span>
            </button>
            <button className="relative w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full ring-2 ring-white"></span>
            </button>
            <button
              onClick={signOut}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </header>

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
