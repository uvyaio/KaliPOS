import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import { supabase } from "../lib/supabaseClient";
import { formatDate, formatKsh } from "../lib/format";

export default function InventoryDetail() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [usageLog, setUsageLog] = useState([]);
  const [reorderPoint, setReorderPoint] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [itemId]);

  async function load() {
    setLoading(true);
    const [{ data: itemData }, { data: logData }] = await Promise.all([
      supabase.from("inventory_items").select("*").eq("id", itemId).single(),
      supabase
        .from("inventory_usage_log")
        .select("*")
        .eq("inventory_item_id", itemId)
        .order("used_on", { ascending: false })
        .limit(7),
    ]);
    setItem(itemData);
    setReorderPoint(itemData?.reorder_point ?? "");
    setUsageLog(logData ?? []);
    setLoading(false);
  }

  async function handleUpdateReorderPoint() {
    await supabase.from("inventory_items").update({ reorder_point: Number(reorderPoint) }).eq("id", itemId);
    load();
  }

  async function handleLogWaste() {
    const quantity = prompt("How many units are you writing off as waste?");
    if (!quantity || isNaN(Number(quantity))) return;
    await supabase.from("inventory_usage_log").insert({
      inventory_item_id: itemId,
      quantity_used: Number(quantity),
      reason: "waste_expired",
    });
    await supabase
      .from("inventory_items")
      .update({ current_stock: Math.max(0, Number(item.current_stock) - Number(quantity)) })
      .eq("id", itemId);
    load();
  }

  if (loading) {
    return (
      <AppShell>
        <div className="p-container-padding text-on-surface-variant">Loading...</div>
      </AppShell>
    );
  }

  if (!item) {
    return (
      <AppShell>
        <div className="p-container-padding text-on-surface-variant">Item not found.</div>
      </AppShell>
    );
  }

  const isLowStock = Number(item.current_stock) <= Number(item.reorder_point);
  const daysRemaining =
    item.avg_daily_usage > 0 ? (Number(item.current_stock) / Number(item.avg_daily_usage)).toFixed(1) : "—";
  const stockValue = Number(item.current_stock) * Number(item.unit_cost);

  return (
    <AppShell>
      <div className="flex flex-col w-full h-full p-container-padding bg-surface-container-lowest gap-8">
        <header className="flex flex-col gap-4">
          <nav className="flex items-center gap-2 text-label-sm font-label-sm text-on-surface-variant">
            <Link className="hover:text-primary transition-colors" to="/app/dashboard">
              Inventory
            </Link>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="text-on-surface">{item.name}</span>
          </nav>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-display-lg font-display-lg text-on-surface">{item.name}</h1>
              {isLowStock && (
                <span className="px-3 py-1 bg-error-container/20 text-on-error-container text-label-sm font-label-sm rounded-full flex items-center gap-1 shadow-sm">
                  <span className="material-symbols-outlined text-[16px]">warning</span> Low Stock
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={handleLogWaste}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-error-container text-on-error-container font-label-sm text-label-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">delete_sweep</span> Log Waste
              </button>
              <button
                onClick={() => navigate("/app/dashboard")}
                className="flex-1 sm:flex-none px-6 py-2 rounded-xl bg-primary text-on-primary font-label-sm text-label-sm hover:bg-primary-container transition-colors flex items-center justify-center gap-2 shadow-md"
              >
                <span className="material-symbols-outlined text-[18px]">shopping_cart</span> Order More
              </button>
            </div>
          </div>
        </header>

        {/* Stats */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-card-gap">
          <StatBox
            label="Current Stock"
            value={item.current_stock}
            unit={item.unit}
            valueColor={isLowStock ? "text-error" : "text-on-surface"}
            footer={
              <>
                Value: <strong className="text-on-surface">{formatKsh(stockValue)}</strong>
              </>
            }
          />
          <StatBox label="Average Usage" value={item.avg_daily_usage} unit={`${item.unit}/day`} footer="Based on last 7 days" />
          <div className="bg-surface p-6 rounded-xl shadow-sm border border-outline-variant/30 flex flex-col gap-2">
            <span className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Last Restocked</span>
            <span className="text-headline-md font-headline-md text-on-surface pt-2">
              {item.last_restocked_at ? formatDate(item.last_restocked_at) : "Never"}
            </span>
            <span className="text-label-sm text-on-surface-variant mt-auto pt-2 border-t border-outline-variant/30">
              {item.last_restocked_qty ? `${item.last_restocked_qty} ${item.unit} added` : "No record"}
            </span>
          </div>
          <div className="bg-primary-container/10 p-6 rounded-xl shadow-sm border border-primary/20 flex flex-col gap-2 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>
            <span className="text-label-sm font-label-sm text-primary uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">auto_awesome</span> AI Prediction
            </span>
            <div className="flex items-baseline gap-2 z-10">
              <span className="text-headline-lg font-headline-lg text-primary">{daysRemaining}</span>
              <span className="text-body-md text-primary">days remaining</span>
            </div>
            <span className="text-label-sm text-on-surface-variant mt-2 pt-2 border-t border-primary/20 z-10">
              Based on current usage rate
            </span>
          </div>
        </section>

        {/* Vendor + reorder settings */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-card-gap mt-4">
          <div className="lg:col-span-4 flex flex-col gap-card-gap">
            <section className="bg-surface rounded-xl shadow-sm border border-outline-variant/30 p-6 flex flex-col gap-4">
              <h3 className="text-headline-md font-headline-md text-on-surface">Vendor</h3>
              <div>
                <p className="text-body-md text-on-surface font-medium">{item.vendor_name || "No vendor set"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="flex flex-col gap-1">
                  <span className="text-label-sm text-on-surface-variant uppercase">Lead Time</span>
                  <span className="text-body-md text-on-surface font-medium">{item.vendor_lead_time_days ?? "—"} Days</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-label-sm text-on-surface-variant uppercase">Min. Order</span>
                  <span className="text-body-md text-on-surface font-medium">
                    {item.vendor_min_order ?? "—"} {item.unit}
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-outline-variant/30">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-body-md font-medium text-on-surface">Reorder Point</span>
                  <span className="text-label-sm px-2 py-0.5 bg-surface-container rounded text-on-surface-variant">Auto-alert</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    className="w-20 px-3 py-2 bg-surface border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    type="number"
                    value={reorderPoint}
                    onChange={(e) => setReorderPoint(e.target.value)}
                  />
                  <span className="text-body-md text-on-surface-variant">{item.unit}</span>
                  <button
                    onClick={handleUpdateReorderPoint}
                    className="ml-auto text-primary font-label-sm text-label-sm hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Update
                  </button>
                </div>
              </div>
            </section>
          </div>

          <div className="lg:col-span-8 flex flex-col gap-card-gap">
            <section className="bg-surface rounded-xl shadow-sm border border-outline-variant/30 p-6 flex flex-col gap-4">
              <h3 className="text-headline-md font-headline-md text-on-surface">Recent Usage</h3>
              {usageLog.length === 0 ? (
                <p className="text-body-md text-on-surface-variant py-4">No usage logged yet.</p>
              ) : (
                <div className="flex flex-col divide-y divide-outline-variant/20">
                  {usageLog.map((log) => (
                    <div key={log.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-body-md text-on-surface">{formatDate(log.used_on)}</p>
                        <p className="text-label-sm text-on-surface-variant capitalize">{log.reason.replace(/_/g, " ")}</p>
                      </div>
                      <span className="text-body-md text-on-surface font-medium">
                        -{log.quantity_used} {item.unit}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function StatBox({ label, value, unit, valueColor = "text-on-surface", footer }) {
  return (
    <div className="bg-surface p-6 rounded-xl shadow-sm border border-outline-variant/30 flex flex-col gap-2 relative overflow-hidden">
      <span className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className={`text-headline-lg font-headline-lg ${valueColor}`}>{value}</span>
        <span className="text-body-md text-on-surface-variant">{unit}</span>
      </div>
      <span className="text-label-sm text-on-surface-variant mt-2 block pt-2 border-t border-outline-variant/30">{footer}</span>
    </div>
  );
}
