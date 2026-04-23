import React, { createContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const useCartStore = create((set, get) => ({
  items: [],

  loadCart: async () => {
    try {
      const stored = await AsyncStorage.getItem('@pepe_cart');
      if (stored) set({ items: JSON.parse(stored) });
    } catch {}
  },

  _persist: async (items) => {
    try {
      await AsyncStorage.setItem('@pepe_cart', JSON.stringify(items));
    } catch {}
  },

  addItem: (product, size, extras, quantity = 1) => {
    const key = `${product._id}_${size?.label || 'default'}_${extras.map((e) => e.name).join('+')}`;
    const unitPrice =
      product.price +
      (size?.priceModifier || 0) +
      extras.reduce((sum, e) => sum + e.price, 0);

    set((state) => {
      const existing = state.items.find((i) => i.key === key);
      const newItems = existing
        ? state.items.map((i) =>
            i.key === key ? { ...i, quantity: i.quantity + quantity } : i
          )
        : [...state.items, { key, product, size, extras, quantity, unitPrice }];
      get()._persist(newItems);
      return { items: newItems };
    });
  },

  removeItem: (key) => {
    set((state) => {
      const newItems = state.items.filter((i) => i.key !== key);
      get()._persist(newItems);
      return { items: newItems };
    });
  },

  updateQuantity: (key, quantity) => {
    set((state) => {
      const newItems =
        quantity <= 0
          ? state.items.filter((i) => i.key !== key)
          : state.items.map((i) => (i.key === key ? { ...i, quantity } : i));
      get()._persist(newItems);
      return { items: newItems };
    });
  },

  clearCart: () => {
    AsyncStorage.removeItem('@pepe_cart');
    set({ items: [] });
  },
}));

export const useCart = () => {
  const store = useCartStore();
  const total = store.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const itemCount = store.items.reduce((sum, i) => sum + i.quantity, 0);
  return { ...store, total, itemCount };
};

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const loadCart = useCartStore((s) => s.loadCart);

  useEffect(() => {
    loadCart();
  }, []);

  return <CartContext.Provider value={null}>{children}</CartContext.Provider>;
}
