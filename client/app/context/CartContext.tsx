"use client"
import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'

type CartItem = { 
  productId: string; 
  quantity: number 
}

type CartItemResponse = {
  productId: string
  quantity: number
}

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
  
  // ── FIX: Initialize state lazily from localStorage to avoid cascading renders ──
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        return JSON.parse(raw) as CartItem[]
      }
    } catch {
      // ignore
    }
    return []
  })

  const [isInitialized] = useState(true)
  const isFirstRender = useRef(true)
  const hasSyncedSession = useRef(false)

  // ── FIX 2: Persist guest cart to localStorage ──────────────────────────────
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    
    if (!isInitialized) return
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // ignore
    }
  }, [items, isInitialized])

  // ── FIX 3: Sync from server when logged in ──────────────────────────────────
  const syncFromServer = useCallback(async () => {
    if (!session) return
    try {
      const res = await fetch('/api/cart')
      if (!res.ok) return
      const data = await res.json() as { items: CartItemResponse[] }
      const serverItems: CartItem[] = (data.items || []).map((it: CartItemResponse) => ({
        productId: it.productId,
        quantity: it.quantity
      }))
      setItems(serverItems)
    } catch {
      // ignore
    }
  }, [session])

  // ── FIX 4: Sync when session changes ─────────────────────────────────────────
  useEffect(() => {
    if (session && !hasSyncedSession.current && isInitialized) {
      hasSyncedSession.current = true
      syncFromServer()
    }
  }, [session?.user?.id, isInitialized, syncFromServer])

  // ── FIX 5: Reset session sync flag when user logs out ──────────────────────
  useEffect(() => {
    if (!session) {
      hasSyncedSession.current = false
    }
  }, [session])

  const add = useCallback(async (productId: string, quantity = 1) => {
    if (session) {
      try {
        await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId, quantity })
        })
        await syncFromServer()
        return
      } catch {
        // fallback to local
      }
    }

    setItems((prev) => {
      const found = prev.find((p) => p.productId === productId)
      if (found) {
        return prev.map((p) =>
          p.productId === productId ? { ...p, quantity: p.quantity + quantity } : p
        )
      }
      return [...prev, { productId, quantity }]
    })
  }, [session, syncFromServer])

  const remove = useCallback(async (productId: string) => {
    if (session) {
      try {
        await fetch('/api/cart', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId })
        })
        await syncFromServer()
        return
      } catch {
        // fallback to local
      }
    }
    setItems((prev) => prev.filter((p) => p.productId !== productId))
  }, [session, syncFromServer])

  const update = useCallback(async (productId: string, quantity: number) => {
    if (session) {
      try {
        await fetch('/api/cart', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId, quantity })
        })
        await syncFromServer()
        return
      } catch {
        // fallback to local
      }
    }
    setItems((prev) =>
      prev.map((p) => p.productId === productId ? { ...p, quantity } : p)
         .filter((p) => p.quantity > 0)
    )
  }, [session, syncFromServer])

  const clear = useCallback(async () => {
    setItems([])
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
    if (session) {
      try {
        await fetch('/api/cart', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        })
      } catch {
        // ignore
      }
    }
  }, [session])

  const count = items.reduce((s, it) => s + it.quantity, 0)

  const value: CartContextValue = {
    items,
    count,
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