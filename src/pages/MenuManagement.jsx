import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import { supabase } from "../lib/supabaseClient";
import { formatKsh } from "../lib/format";

const DAYS = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];

const todayKey = DAYS[(new Date().getDay() + 6) % 7].key; // getDay() is Sun=0, we want Mon=0

export default function MenuManagement() {
  const [activeDay, setActiveDay] = useState(todayKey);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadMenu();
  }, []);

  async function loadMenu() {
    setLoading(true);
    const [{ data: cats }, { data: menuItems }] = await Promise.all([
      supabase.from("categories").select("*").order("sort_order"),
      supabase.from("menu_items").select("*").order("created_at"),
    ]);
    setCategories(cats ?? []);
    setItems(menuItems ?? []);
    setLoading(false);
  }

  async function toggleAvailability(item) {
    const newValue = !item.is_available;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_available: newValue } : i)));
    await supabase.from("menu_items").update({ is_available: newValue }).eq("id", item.id);
  }

  const itemsForDay = items.filter((item) => (item.available_days ?? []).includes(activeDay));
  const itemsByCategory = categories
    .map((cat) => ({ ...cat, items: itemsForDay.filter((i) => i.category_id === cat.id) }))
    .filter((cat) => cat.items.length > 0);
  const uncategorized = itemsForDay.filter((i) => !i.category_id);

  return (
    <AppShell>
      <div className="flex flex-col w-full h-full p-container-padding gap-8">
        <div className="flex flex-row justify-between items-end flex-wrap gap-4">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Menu Schedule</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">Manage your weekly offerings and seasonal updates.</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm flex items-center gap-2 hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add Item
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-8 flex-1">
          {/* Day tabs */}
          <div className="flex items-center gap-2 p-1 bg-surface-container-low rounded-xl w-fit overflow-x-auto">
            {DAYS.map((day) => (
              <button
                key={day.key}
                onClick={() => setActiveDay(day.key)}
                className={`px-6 py-2.5 rounded-lg transition-all whitespace-nowrap ${
                  activeDay === day.key
                    ? "bg-primary text-on-primary font-semibold shadow-sm"
                    : "text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="text-body-md text-on-surface-variant">Loading menu...</p>
          ) : itemsForDay.length === 0 ? (
            <div className="flex-1 bg-surface-container-lowest/50 rounded-xl border border-dashed border-outline-variant flex flex-col items-center justify-center min-h-[200px] gap-2">
              <span className="material-symbols-outlined text-outline text-[32px]">restaurant_menu</span>
              <p className="text-body-md text-on-surface-variant">No items scheduled for this day yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {[...itemsByCategory, ...(uncategorized.length ? [{ id: "uncategorized", name: "Other", items: uncategorized }] : [])].map(
                (cat) => (
                  <section key={cat.id}>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-headline-md text-headline-md text-on-surface">{cat.name}</h2>
                      <div className="h-px flex-1 mx-4 bg-outline-variant/30"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {cat.items.map((item) => (
                        <MenuItemCard key={item.id} item={item} onToggle={() => toggleAvailability(item)} />
                      ))}
                    </div>
                  </section>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <AddItemModal
          categories={categories}
          onClose={() => setShowAddModal(false)}
          onSaved={() => {
            setShowAddModal(false);
            loadMenu();
          }}
        />
      )}
    </AppShell>
  );
}

function MenuItemCard({ item, onToggle }) {
  return (
    <div
      className={`bg-surface-container-lowest rounded-xl p-4 shadow-sm group hover:shadow-md transition-all flex flex-col gap-3 relative overflow-hidden border border-outline-variant/30 ${
        !item.is_available ? "opacity-60" : ""
      }`}
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="flex justify-between items-start">
        <span className="px-2 py-1 bg-secondary-container text-on-secondary-container rounded font-label-sm text-[10px] uppercase tracking-wider">
          {item.icon ? item.icon.replace(/_/g, " ") : "Item"}
        </span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input checked={item.is_available} onChange={onToggle} className="sr-only peer" type="checkbox" />
          <div className="w-9 h-5 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
        </label>
      </div>
      <div>
        <h3 className="font-headline-md text-[18px] leading-tight text-on-surface mb-1">{item.name}</h3>
        <p className="font-label-sm text-label-sm text-primary">{formatKsh(item.price)}</p>
      </div>
      {item.is_popular && (
        <div className="flex items-center gap-1 bg-surface-container p-2 rounded text-[10px] text-on-surface-variant">
          <span className="material-symbols-outlined text-[14px] text-primary">auto_awesome</span>
          Trending today
        </div>
      )}
    </div>
  );
}

function AddItemModal({ categories, onClose, onSaved }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [icon, setIcon] = useState("restaurant");
  const [days, setDays] = useState(DAYS.map((d) => d.key));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggleDay = (key) => {
    setDays((prev) => (prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name || !price) {
      setError("Name and price are required.");
      return;
    }
    setSaving(true);
    const { error: dbError } = await supabase.from("menu_items").insert({
      name,
      price: Number(price),
      category_id: categoryId || null,
      icon,
      available_days: days,
    });
    setSaving(false);
    if (dbError) {
      setError(dbError.message);
      return;
    }
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-md p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-headline-md text-headline-md text-on-surface">Add menu item</h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-label-sm text-label-sm text-on-surface">Name</label>
            <input
              className="h-11 px-3 rounded-lg bg-surface border border-outline-variant text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Grilled Tilapia"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-label-sm text-label-sm text-on-surface">Price (KSh)</label>
              <input
                type="number"
                className="h-11 px-3 rounded-lg bg-surface border border-outline-variant text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="1200"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-label-sm text-label-sm text-on-surface">Category</label>
              <select
                className="h-11 px-3 rounded-lg bg-surface border border-outline-variant text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">None</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-label-sm text-label-sm text-on-surface">Icon (Material Symbols name)</label>
            <input
              className="h-11 px-3 rounded-lg bg-surface border border-outline-variant text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="set_meal"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-label-sm text-label-sm text-on-surface">Available on</label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((d) => (
                <button
                  type="button"
                  key={d.key}
                  onClick={() => toggleDay(d.key)}
                  className={`px-3 py-1.5 rounded-full text-[12px] font-label-sm transition-colors ${
                    days.includes(d.key) ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"
                  }`}
                >
                  {d.label.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
          {error && <div className="text-error text-label-sm bg-error-container/30 rounded-lg px-4 py-2">{error}</div>}
          <button
            type="submit"
            disabled={saving}
            className="h-12 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm hover:bg-primary-container transition-colors disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save item"}
          </button>
        </form>
      </div>
    </div>
  );
}
