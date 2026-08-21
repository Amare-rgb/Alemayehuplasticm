"use client"
import React, { createContext, useContext, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

type CartItem = { productId: string; quantity: number }
type CartContextValue = {
  items: CartItem[]
  count: number
  add: (productId: string, quantity?: number) => Promise<void>
  remove: (productId: string) => Promise<void>
  update: (productId: string, quantity: number) => Promise<void>
  clear: () => Promise<void>
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

const STORAGE_KEY = 'shophub_cart_v1'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    // initialize from localStorage for guest users
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setItems(JSON.parse(raw))
    } catch (e) {
      setItems([])
    }
  }, [])

  useEffect(() => {
    // persist guest cart to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch (e) {
      // ignore
    }
  }, [items])

  // helper to sync from server when logged in
  const syncFromServer = async () => {
    if (!session) return
    try {
      const res = await fetch('/api/cart')
      if (!res.ok) return
      const data = await res.json()
      // convert server items to CartItem[]
      const serverItems: CartItem[] = (data.items || []).map((it: any) => ({ productId: it.productId, quantity: it.quantity }))
      setItems(serverItems)
    } catch (_) {
      // ignore
    }
  }

  useEffect(() => {
    // when user signs in, sync server cart
    if (session) syncFromServer()
  }, [session?.user?.id])

  const add = async (productId: string, quantity = 1) => {
    if (session) {
      try {
        await fetch('/api/cart', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId, quantity }) })
        await syncFromServer()
        return
      } catch (_) {
        // fallback to local
      }
    }

    setItems((prev) => {
      const found = prev.find((p) => p.productId === productId)
      if (found) return prev.map((p) => p.productId === productId ? { ...p, quantity: p.quantity + quantity } : p)
      return [...prev, { productId, quantity }]
    })
  }

  const remove = async (productId: string) => {
    if (session) {
      try {
        await fetch('/api/cart', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId }) })
        await syncFromServer()
        return
      } catch (_) {}
    }
    setItems((prev) => prev.filter((p) => p.productId !== productId))
  }

  const update = async (productId: string, quantity: number) => {
    if (session) {
      try {
        await fetch('/api/cart', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId, quantity }) })
        await syncFromServer()
        return
      } catch (_) {}
    }
    setItems((prev) => prev.map((p) => p.productId === productId ? { ...p, quantity } : p).filter(p => p.quantity > 0))
  }

  const clear = async () => {
    setItems([])
    try { localStorage.removeItem(STORAGE_KEY) } catch (_) {}
    if (session) {
      try { await fetch('/api/cart', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) }) } catch (_) {}
    }
  }

  const value: CartContextValue = {
    items,
    count: items.reduce((s, it) => s + it.quantity, 0),
    add,
    remove,
    update,
    clear,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

export default CartContext
