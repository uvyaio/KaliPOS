import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import { supabase } from "../lib/supabaseClient";
import { formatKsh } from "../lib/format";

export default function InventoryList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("inventory_items")
      .select("*")
      .order("current_stock", { ascending: true })
      .then(({ data }) => {
        setItems(data ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <AppShell searchPlaceholder="Search inventory...">
      <div className="px-8 py-8 max-w-[1400px] mx-auto flex flex-col gap-6">
        <div>
          <h1 className="font-display-lg text-[28px] font-bold text-on-surface mb-1">Inventory</h1>
          <p className="text-on-surface-variant text-body-md">Stock levels across all your ingredients.</p>
        </div>

        {loading ? (
          <p className="text-on-surface-variant">Loading...</p>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/20 p-12 text-center text-on-surface-variant">
            No inventory items yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => {
              const isLow = Number(item.current_stock) <= Number(item.reorder_point);
              return (
                <Link
                  key={item.id}
                  to={`/app/inventory/${item.id}`}
                  className="bg-white rounded-2xl shadow-sm border border-outline-variant/20 p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-full bg-brand-green-soft flex items-center justify-center">
                      <span className="material-symbols-outlined text-brand-green text-[20px]">
                        {item.icon || "inventory_2"}
                      </span>
                    </div>
                    {isLow && (
                      <span className="px-2 py-1 rounded-full bg-error-container/30 text-on-error-container text-[10px] font-semibold uppercase">
                        Low stock
                      </span>
                    )}
                  </div>
                  <h3 className="font-headline-md text-body-md text-on-surface mb-1">{item.name}</h3>
                  <p className={`text-[13px] ${isLow ? "text-error" : "text-on-surface-variant"}`}>
                    {item.current_stock} {item.unit} remaining
                  </p>
                  <p className="text-[12px] text-on-surface-variant mt-2 pt-2 border-t border-outline-variant/20">
                    Value: {formatKsh(Number(item.current_stock) * Number(item.unit_cost))}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
