import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { supabase } from "../lib/supabaseClient";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { formatKsh } from "../lib/format";

export default function POSCheckout() {
  const navigate = useNavigate();
  const { items, addItem, changeQuantity, removeItem, totals, clearCart, setOrderId, setOrderNumber } = useCart();
  const { staffSession } = useAuth();

  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadMenu();
  }, []);

  async function loadMenu() {
    const [{ data: cats }, { data: mi }] = await Promise.all([
      supabase.from("categories").select("*").order("sort_order"),
      supabase.from("menu_items").select("*").eq("is_available", true).order("name"),
    ]);
    setCategories(cats ?? []);
    setMenuItems(mi ?? []);
  }

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory =
        activeCategory === "all" ||
        (activeCategory === "popular" && item.is_popular) ||
        item.category_id === activeCategory;
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, activeCategory, search]);

  async function handleSendToMpesa() {
    if (items.length === 0) return;
    setError("");
    setCreatingOrder(true);
    try {
      const orderNumber = "K-" + Math.floor(1000 + Math.random() * 9000);
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          status: "open",
          subtotal: totals.subtotal,
          vat: totals.vat,
          catering_levy: totals.cateringLevy,
          total: totals.total,
          created_by: staffSession?.id ?? null,
        })
        .select()
        .single();
      if (orderError) throw orderError;

      const orderItemsPayload = items.map((i) => ({
        order_id: order.id,
        menu_item_id: i.menuItemId,
        name_snapshot: i.name,
        unit_price: i.unitPrice,
        quantity: i.quantity,
        notes: i.notes || null,
      }));
      const { error: itemsError } = await supabase.from("order_items").insert(orderItemsPayload);
      if (itemsError) throw itemsError;

      setOrderId(order.id);
      setOrderNumber(order.order_number);
      navigate(`/app/checkout/${order.id}/mpesa`);
    } catch (err) {
      setError(err.message || "Could not create the order. Please try again.");
    } finally {
      setCreatingOrder(false);
    }
  }

  return (
    <AppShell searchPlaceholder="Search transactions, orders, or menu items...">
      <div className="flex flex-col w-full h-full min-h-[calc(100vh-64px)] font-body-md bg-background">
        <div className="flex flex-1 h-full overflow-hidden">
          {/* Left: menu */}
          <div className="flex-1 flex flex-col min-w-0 pr-gutter">
            <div className="flex items-center justify-between mb-4 mt-4 px-container-padding flex-wrap gap-4">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                <CategoryPill active={activeCategory === "all"} onClick={() => setActiveCategory("all")}>
                  All Items
                </CategoryPill>
                <CategoryPill active={activeCategory === "popular"} onClick={() => setActiveCategory("popular")}>
                  Popular
                </CategoryPill>
                {categories.map((cat) => (
                  <CategoryPill key={cat.id} active={activeCategory === cat.id} onClick={() => setActiveCategory(cat.id)}>
                    {cat.name}
                  </CategoryPill>
                ))}
              </div>
              <div className="relative w-64">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
                <input
                  className="w-full pl-9 pr-4 py-2 rounded-full bg-surface-container text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 text-body-md transition-shadow"
                  placeholder="Quick add (e.g. Burger)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-container-padding pb-container-padding">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-card-gap">
                {filteredItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => addItem(item)}
                    className="group flex flex-col text-left bg-surface-container-lowest rounded-xl shadow-sm hover:shadow-md transition-all active:scale-[0.98] overflow-hidden"
                  >
                    <div className="relative h-32 w-full flex items-center justify-center bg-surface-container-low text-primary/40 group-hover:bg-primary-container/20 transition-colors">
                      <span className="material-symbols-outlined text-[48px]">{item.icon || "restaurant"}</span>
                    </div>
                    <div className="p-3">
                      <h3 className="font-headline-md text-body-md text-on-surface line-clamp-1 group-hover:text-primary transition-colors">
                        {item.name}
                      </h3>
                      <div className="flex items-center justify-between mt-1">
                        <span className="font-label-sm text-label-sm text-primary">{formatKsh(item.price)}</span>
                        <span className="material-symbols-outlined text-outline-variant text-[18px] group-hover:text-primary transition-colors">
                          add_circle
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
                {filteredItems.length === 0 && (
                  <p className="col-span-full text-center text-on-surface-variant py-12">No menu items match.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right: cart */}
          <div className="w-[380px] flex-shrink-0 bg-surface-container-lowest flex flex-col shadow-[-4px_0_16px_rgba(0,0,0,0.04)] h-full">
            <div className="p-6 pb-4">
              <h2 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">shopping_bag</span>
                Current Order
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto px-6 space-y-5">
              {items.length === 0 ? (
                <p className="text-body-md text-on-surface-variant text-center py-12">Tap a menu item to add it to the order.</p>
              ) : (
                items.map((item) => (
                  <div className="flex items-start gap-3 group relative" key={item.menuItemId}>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="font-label-sm text-body-md text-on-surface truncate">{item.name}</h4>
                        <span className="font-label-sm text-body-md text-on-surface pl-2 whitespace-nowrap">
                          {formatKsh(item.unitPrice * item.quantity)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center bg-surface-container-low rounded-full px-2 py-1">
                          <button
                            onClick={() => changeQuantity(item.menuItemId, -1)}
                            className="w-6 h-6 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-variant transition-colors"
                          >
                            <span className="material-symbols-outlined text-[16px]">remove</span>
                          </button>
                          <span className="w-6 text-center font-label-sm text-label-sm text-on-surface">{item.quantity}</span>
                          <button
                            onClick={() => changeQuantity(item.menuItemId, 1)}
                            className="w-6 h-6 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-variant transition-colors"
                          >
                            <span className="material-symbols-outlined text-[16px]">add</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.menuItemId)}
                      className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity text-error/60 hover:text-error bg-surface-container-lowest"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="bg-surface-container-lowest p-6 pt-4 relative z-10 before:absolute before:top-0 before:left-6 before:right-6 before:h-px before:bg-outline-variant/30">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-body-md text-on-surface-variant">
                  <span>Subtotal</span>
                  <span>{formatKsh(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-body-md text-on-surface-variant">
                  <span>Tax (16% VAT)</span>
                  <span>{formatKsh(totals.vat)}</span>
                </div>
                <div className="flex justify-between text-body-md text-on-surface-variant">
                  <span>Catering Levy (2%)</span>
                  <span>{formatKsh(totals.cateringLevy)}</span>
                </div>
              </div>
              <div className="flex justify-between items-end mb-6">
                <span className="font-headline-md text-headline-md text-on-surface">Total</span>
                <span className="font-display-lg text-headline-lg text-primary tracking-tight">{formatKsh(totals.total)}</span>
              </div>
              {error && <div className="text-error text-label-sm bg-error-container/30 rounded-lg px-4 py-2 mb-3">{error}</div>}
              <button
                onClick={handleSendToMpesa}
                disabled={items.length === 0 || creatingOrder}
                className="w-full py-4 rounded-xl bg-primary text-on-primary font-headline-md text-headline-md hover:bg-primary/90 transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span className="material-symbols-outlined">phone_android</span>
                {creatingOrder ? "Creating order..." : "Pay with M-Pesa"}
              </button>
              {items.length > 0 && (
                <button onClick={clearCart} className="w-full mt-2 py-2 text-label-sm text-on-surface-variant hover:text-error transition-colors">
                  Clear order
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function CategoryPill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full font-label-sm text-label-sm whitespace-nowrap transition-all ${
        active ? "bg-primary text-on-primary shadow-sm" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
      }`}
    >
      {children}
    </button>
  );
}
