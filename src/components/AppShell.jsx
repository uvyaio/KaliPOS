import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// This component wraps every screen inside the app (after login): it draws
// the green sidebar on the left and the search/notifications header on top,
// then renders whatever page is active in the middle via `children`.
//
// It's used by: Dashboard, Menu Management, POS Checkout, M-Pesa Transactions,
// and Inventory Detail — all screens that share the same navigation.

const NAV_ITEMS = [
  { to: "/app/dashboard", label: "Dashboard", icon: "dashboard" },
  { to: "/app/pos", label: "POS Checkout", icon: "point_of_sale" },
  { to: "/app/orders", label: "Orders", icon: "receipt_long" },
  { to: "/app/menu", label: "Menu Management", icon: "menu_book" },
  { to: "/app/transactions", label: "M-Pesa", icon: "account_balance_wallet" },
  { to: "/app/settings", label: "Settings", icon: "settings" },
];

function navLinkClasses({ isActive }) {
  return [
    "flex items-center px-container-padding py-3 rounded-xl transition-all group",
    isActive
      ? "bg-secondary-container text-on-secondary-container font-semibold"
      : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface",
  ].join(" ");
}

export default function AppShell({ children, searchPlaceholder = "Search transactions, orders, or menu items..." }) {
  const { staffSession, ownerSession, signOut } = useAuth();

  const displayName = staffSession?.full_name || ownerSession?.user?.email || "Team member";
  const displayRole = staffSession
    ? staffSession.role.charAt(0).toUpperCase() + staffSession.role.slice(1)
    : "Owner / Manager";

  return (
    <div className="bg-background font-body-md text-on-surface min-h-screen">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-sidebar-width bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex flex-col pt-container-padding">
        <div className="px-container-padding mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary">restaurant</span>
          </div>
          <span className="font-headline-md text-headline-md tracking-tight text-primary">KaliPOS</span>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClasses}>
              <span className="material-symbols-outlined mr-3">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 mt-auto mb-4 mx-4 rounded-xl bg-primary-container/10 border border-outline-variant">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-primary text-[18px]">auto_awesome</span>
            <span className="font-label-sm text-label-sm text-primary uppercase">AI Insights</span>
          </div>
          <p className="text-[11px] text-on-surface-variant">Peak hours detected. Recommend 2 extra servers today.</p>
        </div>
        <button
          onClick={signOut}
          className="mx-4 mb-4 flex items-center gap-2 px-4 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-error transition-colors text-label-sm font-label-sm"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          Sign out
        </button>
      </aside>

      <div className="pl-sidebar-width">
        {/* Header */}
        <header className="fixed top-0 left-sidebar-width right-0 h-16 bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 px-container-padding flex items-center justify-between">
          <div className="flex items-center flex-1 max-w-md bg-surface-container-low rounded-full px-4 py-2 border border-outline-variant/30 transition-all focus-within:ring-2 focus-within:ring-primary/20">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px] mr-2">search</span>
            <input
              className="bg-transparent border-none outline-none text-body-md w-full text-on-surface placeholder:text-outline"
              placeholder={searchPlaceholder}
              type="text"
            />
          </div>
          <div className="flex items-center gap-6">
            <button className="relative p-2 rounded-full hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full ring-2 ring-surface"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-outline-variant">
              <div className="text-right hidden sm:block">
                <div className="font-label-sm text-label-sm text-on-surface">{displayName}</div>
                <div className="text-[11px] text-on-surface-variant">{displayRole}</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-sm cursor-pointer">
                <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
              </div>
            </div>
          </div>
        </header>

        <main className="relative pt-16 w-full min-h-screen">{children}</main>
      </div>
    </div>
  );
}
