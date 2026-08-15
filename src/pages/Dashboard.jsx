import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import { supabase } from "../lib/supabaseClient";
import { formatKsh, initials, relativeTime } from "../lib/format";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({ sales: 0, transactionCount: 0, itemsSold: 0 });
  const [recentTx, setRecentTx] = useState([]);
  const [lowStock, setLowStock] = useState([]);

  useEffect(() => {
    loadDashboard();
    // Refresh the M-Pesa feed every 15 seconds so it feels "live".
    const interval = setInterval(loadRecentTransactions, 15000);
    return () => clearInterval(interval);
  }, []);

  async function loadDashboard() {
    setLoading(true);
    await Promise.all([loadKpis(), loadRecentTransactions(), loadLowStock()]);
    setLoading(false);
  }

  async function loadKpis() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const { data: paidOrders } = await supabase
      .from("orders")
      .select("total")
      .eq("status", "paid")
      .gte("created_at", startOfToday.toISOString());

    const { count: itemsSoldCount } = await supabase
      .from("order_items")
      .select("id", { count: "exact", head: true });

    const sales = (paidOrders ?? []).reduce((sum, o) => sum + Number(o.total), 0);
    setKpis({
      sales,
      transactionCount: (paidOrders ?? []).length,
      itemsSold: itemsSoldCount ?? 0,
    });
  }

  async function loadRecentTransactions() {
    const { data } = await supabase
      .from("mpesa_transactions")
      .select("*")
      .eq("status", "success")
      .order("created_at", { ascending: false })
      .limit(4);
    setRecentTx(data ?? []);
  }

  async function loadLowStock() {
    const { data } = await supabase.from("inventory_items").select("*").order("current_stock", { ascending: true }).limit(4);
    setLowStock((data ?? []).filter((item) => Number(item.current_stock) <= Number(item.reorder_point)));
  }

  return (
    <AppShell>
      <div className="flex flex-col w-full px-container-padding pb-container-padding gap-container-padding">
        <div className="flex flex-col lg:flex-row gap-container-padding mt-4">
          <div className="flex-1">
            <h1 className="text-headline-lg font-headline-lg text-on-surface tracking-tight mb-2">Morning 👋</h1>
            <p className="text-body-md text-on-surface-variant max-w-2xl">
              Here's what's happening at your restaurant today.
            </p>
          </div>
          <div className="flex items-end gap-3 lg:justify-end">
            <Link
              to="/app/pos"
              className="h-10 px-4 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm flex items-center gap-2 hover:bg-primary-container transition-colors shadow-md"
            >
              <span className="material-symbols-outlined text-[18px]">point_of_sale</span>
              Open POS
            </Link>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-container-padding">
          <KpiCard icon="payments" label="Today's Sales" value={formatKsh(kpis.sales)} accent="primary" />
          <KpiCard icon="receipt_long" label="Transactions" value={String(kpis.transactionCount)} accent="secondary" />
          <KpiCard icon="restaurant_menu" label="Items Sold" value={String(kpis.itemsSold)} accent="primary" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-container-padding">
          {/* Low stock */}
          <div className="lg:col-span-8 bg-surface-container-lowest rounded-2xl shadow-sm p-6 relative">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-headline-md font-headline-md text-on-surface">Low Stock Alerts</h2>
                <p className="text-body-md text-on-surface-variant">Ingredients requiring immediate attention</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-error-container/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-error">warning</span>
              </div>
            </div>
            {lowStock.length === 0 ? (
              <p className="text-body-md text-on-surface-variant py-8 text-center">
                {loading ? "Loading..." : "Everything is well stocked. 🎉"}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {lowStock.map((item) => (
                  <Link
                    to={`/app/inventory/${item.id}`}
                    key={item.id}
                    className="bg-surface-container-low p-4 rounded-xl flex items-center justify-between group hover:bg-surface-variant transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-surface rounded-lg flex items-center justify-center shadow-sm overflow-hidden">
                        <span className="material-symbols-outlined text-on-surface-variant opacity-50 text-[24px]">
                          {item.icon || "inventory_2"}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-label-sm text-on-surface">{item.name}</h4>
                        <div className="text-[12px] text-error font-medium">
                          {item.current_stock} {item.unit} remaining
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* M-Pesa live feed */}
          <div className="lg:col-span-4 flex flex-col gap-container-padding">
            <div className="bg-surface-container-lowest rounded-2xl shadow-sm flex-1 flex flex-col overflow-hidden">
              <div className="p-5 flex items-center justify-between pb-3 bg-surface-container-lowest z-10 border-b border-outline-variant/30">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                  <h3 className="font-headline-md text-headline-md text-on-surface">M-Pesa Live Feed</h3>
                </div>
                <Link to="/app/transactions" className="text-primary text-label-sm font-semibold hover:underline">
                  View All
                </Link>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-2 space-y-1">
                {recentTx.length === 0 ? (
                  <p className="text-body-md text-on-surface-variant py-8 text-center">No payments yet today.</p>
                ) : (
                  recentTx.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between py-3 border-b border-outline-variant/20 hover:bg-surface-container-low transition-colors -mx-5 px-5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center text-primary font-bold text-[14px]">
                          {initials(tx.customer_name || tx.phone)}
                        </div>
                        <div>
                          <div className="font-label-sm text-on-surface">{tx.customer_name || tx.phone}</div>
                          <div className="text-[11px] text-on-surface-variant font-mono">{tx.mpesa_receipt || "—"}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-on-surface">{formatKsh(tx.amount)}</div>
                        <div className="text-[11px] text-primary">{relativeTime(tx.created_at)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function KpiCard({ icon, label, value, accent }) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm relative overflow-hidden group">
      <div
        className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl transition-colors duration-500 ${
          accent === "primary" ? "bg-primary/5 group-hover:bg-primary/10" : "bg-secondary/5 group-hover:bg-secondary/10"
        }`}
      ></div>
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            accent === "primary" ? "bg-primary/10" : "bg-secondary-container"
          }`}
        >
          <span className={`material-symbols-outlined text-[20px] ${accent === "primary" ? "text-primary" : "text-on-secondary-container"}`}>
            {icon}
          </span>
        </div>
      </div>
      <div className="relative z-10">
        <p className="text-label-sm text-on-surface-variant mb-1 uppercase tracking-wider">{label}</p>
        <h3 className="text-headline-lg font-headline-lg text-on-surface tracking-tight">{value}</h3>
      </div>
    </div>
  );
}
