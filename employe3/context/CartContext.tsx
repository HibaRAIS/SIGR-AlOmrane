"use client"

import { createContext, useContext, useState, ReactNode } from "react"

export interface CartItem {
  id: number
  name: string
  reference: string
  categoryLabel: string
  description: string
  quantity: number
}

interface CartContextType {
  cart: CartItem[]
  addToCart: (product: Omit<CartItem, "quantity">, quantity?: number) => void
  removeFromCart: (id: number) => void
  updateQuantity: (id: number, quantity: number) => void
  isInCart: (id: number) => boolean
  cartCount: number
  clearCart: () => void
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])

  const addToCart = (product: Omit<CartItem, "quantity">, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id)
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
        )
      }
      return [...prev, { ...product, quantity }]
    })
  }

  const removeFromCart = (id: number) =>
    setCart((prev) => prev.filter((i) => i.id !== id))

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) return removeFromCart(id)
    setCart((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity } : i))
    )
  }

  const isInCart = (id: number) => cart.some((i) => i.id === id)
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0)
  const clearCart = () => setCart([])

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, isInCart, cartCount, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used inside CartProvider")
  return ctx
}