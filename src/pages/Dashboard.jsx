import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import AppShell from "../components/AppShell";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { formatKsh } from "../lib/format";

// We don't track cost-of-goods separately in the schema yet, so "profit" on
// this dashboard is an estimate — a simple percentage of sales. Swap this
// out once you're tracking ingredient costs per dish.
const ESTIMATED_PROFIT_MARGIN = 0.29;

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function Dashboard() {
  const { staffSession, ownerSession } = useAuth();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({ sales: 0, salesChangePct: null, transactions: 0, itemsSold: 0 });
  const [trend, setTrend] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [bestSeller, setBestSeller] = useState(null);

  const firstName = (staffSession?.full_name || ownerSession?.user?.user_metadata?.restaurant_name || "there").split(
    " "
  )[0];

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    await Promise.all([loadKpis(), loadTrend(), loadLowStock(), loadBestSeller()]);
    setLoading(false);
  }

  async function loadKpis() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    const [{ data: todayOrders }, { data: yesterdayOrders }, { count: itemsSoldCount }] = await Promise.all([
      supabase.from("orders").select("total").eq("status", "paid").gte("created_at", startOfToday.toISOString()),
      supabase
        .from("orders")
        .select("total")
        .eq("status", "paid")
        .gte("created_at", startOfYesterday.toISOString())
        .lt("created_at", startOfToday.toISOString()),
      supabase.from("order_items").select("id", { count: "exact", head: true }),
    ]);

    const todaySales = (todayOrders ?? []).reduce((sum, o) => sum + Number(o.total), 0);
    const yesterdaySales = (yesterdayOrders ?? []).reduce((sum, o) => sum + Number(o.total), 0);
    const changePct = yesterdaySales > 0 ? ((todaySales - yesterdaySales) / yesterdaySales) * 100 : null;

    setKpis({
      sales: todaySales,
      salesChangePct: changePct,
      transactions: (todayOrders ?? []).length,
      itemsSold: itemsSoldCount ?? 0,
    });
  }

  async function loadTrend() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from("orders")
      .select("total, created_at")
      .eq("status", "paid")
      .gte("created_at", sevenDaysAgo.toISOString());

    const byDay = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      byDay[d.toDateString()] = { label: DAY_LABELS[d.getDay() === 0 ? 6 : d.getDay() - 1], sales: 0 };
    }
    (data ?? []).forEach((order) => {
      const key = new Date(order.created_at).toDateString();
      if (byDay[key]) byDay[key].sales += Number(order.total);
    });

    setTrend(
      Object.values(byDay).map((d) => ({
        ...d,
        profit: Math.round(d.sales * ESTIMATED_PROFIT_MARGIN),
      }))
    );
  }

  async function loadLowStock() {
    const { data } = await supabase.from("inventory_items").select("*").order("current_stock", { ascending: true });
    setLowStock((data ?? []).filter((item) => Number(item.current_stock) <= Number(item.reorder_point)));
  }

  async function loadBestSeller() {
    const { data } = await supabase.from("order_items").select("name_snapshot, quantity");
    if (!data || data.length === 0) return;
    const totals = {};
    data.forEach((row) => {
      totals[row.name_snapshot] = (totals[row.name_snapshot] || 0) + row.quantity;
    });
    const [name, qty] = Object.entries(totals).sort((a, b) => b[1] - a[1])[0] ?? [];
    if (name) setBestSeller({ name, qty });
  }

  const salesChangeLabel =
    kpis.salesChangePct === null
      ? "No data for yesterday yet"
      : `${kpis.salesChangePct >= 0 ? "+" : ""}${kpis.salesChangePct.toFixed(1)}% vs yesterday`;

  return (
    <AppShell>
      <div className="px-8 py-8 max-w-[1400px] mx-auto flex flex-col gap-8">
        {/* Greeting */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-display-lg text-[32px] font-bold text-on-surface mb-1">Habari, {firstName} 👋</h1>
            <p className="text-on-surface-variant text-body-md">
              KaliPOS runs continuously — check back any time for the latest numbers.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-green-soft text-brand-green text-label-sm font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-green"></span>
              Live
            </span>
            <button className="px-4 py-1.5 rounded-full bg-surface-container-low text-on-surface text-label-sm font-semibold">
              Today
            </button>
          </div>
        </div>

        {/* AI report banner */}
        <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/20 p-6 flex items-center gap-5 flex-wrap">
          <div className="w-12 h-12 rounded-full bg-brand-green-soft flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-brand-green">auto_awesome</span>
          </div>
          <div className="flex-1 min-w-[240px]">
            <h3 className="font-headline-md text-body-md text-on-surface mb-1">Close-of-business AI report</h3>
            <p className="text-on-surface-variant text-[13px] leading-relaxed">
              Every evening the AI reconciles M-Pesa transactions, flags unpaid orders, ranks best-selling dishes, and
              drafts tomorrow's shopping list.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1.5 rounded-full bg-surface-container-low text-on-surface-variant text-label-sm">
              Next: 9:00 PM
            </span>
            <button className="px-4 py-1.5 rounded-full bg-on-surface text-white text-label-sm font-semibold">
              Preview report
            </button>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon="account_balance_wallet" label="Today's Sales" value={formatKsh(kpis.sales)} change={salesChangeLabel} />
          <KpiCard
            icon="trending_up"
            label="Profit (est.)"
            value={formatKsh(kpis.sales * ESTIMATED_PROFIT_MARGIN)}
            change={`~${Math.round(ESTIMATED_PROFIT_MARGIN * 100)}% margin`}
          />
          <KpiCard icon="receipt_long" label="Transactions" value={String(kpis.transactions)} change="Paid orders today" />
          <KpiCard icon="shopping_bag" label="Items Sold" value={String(kpis.itemsSold)} change="All time" />
        </div>

        {/* Trend chart + AI insights */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-outline-variant/20 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-headline-md text-body-md text-on-surface">Sales &amp; profit trend</h3>
                <p className="text-[12px] text-on-surface-variant">Last 7 days</p>
              </div>
              <div className="flex items-center gap-4 text-[12px] text-on-surface-variant">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-brand-ink"></span> Sales
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-brand-green-light"></span> Profit
                </span>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0c2016" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#0c2016" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4ade80" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#4ade80" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#8a8f98" }} />
                  <Tooltip formatter={(value) => formatKsh(value)} />
                  <Area type="monotone" dataKey="sales" stroke="#0c2016" strokeWidth={2} fill="url(#salesFill)" />
                  <Area type="monotone" dataKey="profit" stroke="#22a559" strokeWidth={2} fill="url(#profitFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-4 bg-white rounded-2xl shadow-sm border border-outline-variant/20 p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-full bg-brand-ink flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-[16px]">auto_awesome</span>
              </div>
              <div>
                <h3 className="font-headline-md text-body-md text-on-surface leading-tight">KaliPOS AI</h3>
                <p className="text-[11px] text-on-surface-variant">Today's smart insights</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 flex-1">
              {lowStock.length > 0 && (
                <InsightRow
                  emoji="⚠️"
                  title="Low ingredient alert"
                  body={`${lowStock
                    .slice(0, 2)
                    .map((i) => i.name)
                    .join(" and ")} will run out soon — reorder now.`}
                />
              )}
              {bestSeller && (
                <InsightRow
                  emoji="📈"
                  title="Best-selling dish"
                  body={`${bestSeller.name} is your top seller (${bestSeller.qty} sold) — consider a promo.`}
                />
              )}
              {lowStock.length === 0 && !bestSeller && !loading && (
                <p className="text-on-surface-variant text-[13px] py-6 text-center">
                  Insights will appear here once you have some sales and inventory data.
                </p>
              )}
            </div>

            <button className="mt-4 flex items-center justify-between text-brand-green font-semibold text-label-sm">
              Ask AI a question
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function KpiCard({ icon, label, value, change }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/20 p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-brand-green-soft flex items-center justify-center">
          <span className="material-symbols-outlined text-brand-green text-[16px]">{icon}</span>
        </div>
        <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-label-sm">{label}</span>
      </div>
      <div className="font-display-lg text-[24px] font-bold text-on-surface tracking-tight">{value}</div>
      <div className="text-[12px] text-brand-green mt-1">{change}</div>
    </div>
  );
}

function InsightRow({ emoji, title, body }) {
  return (
    <div className="p-3 rounded-xl bg-surface-container-low">
      <div className="flex items-start gap-2">
        <span className="text-[16px] leading-none mt-0.5">{emoji}</span>
        <div>
          <p className="text-[13px] font-semibold text-on-surface">{title}</p>
          <p className="text-[12px] text-on-surface-variant leading-snug mt-0.5">{body}</p>
        </div>
      </div>
    </div>
  );
}
