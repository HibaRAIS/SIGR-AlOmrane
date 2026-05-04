//context/CartContext.tsx
"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export interface CartItem {
  id: number;
  name: string;
  reference: string;
  categoryLabel: string;
  description: string;
  quantity: number;
  categorieId?: number; 
  imageUrl?: string; 
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);

  const getStorageKey = (): string | null => {
    if (user?.loginLdap) {
      return `cart_${user.loginLdap}`;
    }
    return null;
  };

  useEffect(() => {
    const key = getStorageKey();
    if (key) {
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          setItems(JSON.parse(saved));
        } catch (e) {
          console.error("Erreur parsing panier", e);
        }
      } else {
        setItems([]);
      }
      if (localStorage.getItem('cart')) {
        localStorage.removeItem('cart');
      }
    } else {
      setItems([]);
    }
  }, [user]);

  useEffect(() => {
    const key = getStorageKey();
    if (key && items.length > 0) {
      localStorage.setItem(key, JSON.stringify(items));
    } else if (key && items.length === 0) {
      localStorage.removeItem(key);
    }
  }, [items, user]);

  const addItem = (product: Omit<CartItem, 'quantity'>, quantity = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i =>
          i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { ...product, quantity }];
    });
  };

  const removeItem = (id: number) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems(prev => prev.map(i => (i.id === id ? { ...i, quantity } : i)));
  };

  const clearCart = () => setItems([]);
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};