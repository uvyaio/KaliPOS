// Holds the "current order" while a cashier is building it up on the POS
// screen, so the cart survives navigating from POS Checkout -> M-Pesa
// payment screen -> waiting screen -> success screen.
import { createContext, useContext, useMemo, useState } from "react";

const CartContext = createContext(null);

const VAT_RATE = 0.16;
const CATERING_LEVY_RATE = 0.02;

export function CartProvider({ children }) {
  const [items, setItems] = useState([]); // [{ menuItemId, name, unitPrice, quantity, notes }]
  const [orderId, setOrderId] = useState(null);
  const [orderNumber, setOrderNumber] = useState(null);

  const addItem = (menuItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.menuItemId === menuItem.id);
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === menuItem.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          menuItemId: menuItem.id,
          name: menuItem.name,
          unitPrice: Number(menuItem.price),
          quantity: 1,
          notes: "",
        },
      ];
    });
  };

  const changeQuantity = (menuItemId, delta) => {
    setItems((prev) =>
      prev
        .map((i) => (i.menuItemId === menuItemId ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const removeItem = (menuItemId) => {
    setItems((prev) => prev.filter((i) => i.menuItemId !== menuItemId));
  };

  const clearCart = () => {
    setItems([]);
    setOrderId(null);
    setOrderNumber(null);
  };

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    const vat = subtotal * VAT_RATE;
    const cateringLevy = subtotal * CATERING_LEVY_RATE;
    const total = subtotal + vat + cateringLevy;
    return { subtotal, vat, cateringLevy, total };
  }, [items]);

  const value = {
    items,
    addItem,
    changeQuantity,
    removeItem,
    clearCart,
    totals,
    orderId,
    setOrderId,
    orderNumber,
    setOrderNumber,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside a CartProvider");
  return ctx;
}
