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
  validate: () => Promise<void>
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

const STORAGE_KEY = 'shophub_cart_v1'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()

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
  const hasValidated = useRef(false)

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

  // ── FIX 6: Drop any items whose product no longer exists in the DB. ──────
  const validate = useCallback(async () => {
    setItems((current) => {
      if (current.length === 0) return current

      const productIds = current.map((it) => it.productId)

      fetch('/api/products/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds })
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { validIds?: string[] } | null) => {
          if (!data?.validIds) return
          const validSet = new Set(data.validIds)
          setItems((prev) => {
            const cleaned = prev.filter((p) => validSet.has(p.productId))
            return cleaned.length === prev.length ? prev : cleaned
          })
        })
        .catch(() => {
          // Network hiccup — don't wipe the cart over a failed check
        })

      return current
    })
  }, [])

  // ── FIX 3: Sync from server when logged in ──────────────────────────────────
  const syncFromServer = useCallback(async () => {
    // ✅ Only sync if session exists and is authenticated
    if (!session || status !== 'authenticated') {
      console.log('🛒 Skipping cart sync - user not authenticated')
      return
    }

    try {
      console.log('🛒 Syncing cart from server...')
      const res = await fetch('/api/cart')
      
      // ✅ Handle 401 Unauthorized gracefully
      if (res.status === 401) {
        console.log('🛒 Session expired or invalid, keeping local cart')
        return
      }
      
      if (!res.ok) {
        console.error('🛒 Failed to sync cart:', res.status)
        return
      }
      
      const data = await res.json() as { items: CartItemResponse[] }
      const serverItems: CartItem[] = (data.items || []).map((it: CartItemResponse) => ({
        productId: it.productId,
        quantity: it.quantity
      }))
      
      console.log(`🛒 Synced ${serverItems.length} items from server`)
      setItems(serverItems)
    } catch (error) {
      console.error('🛒 Error syncing cart from server:', error)
      // Keep local cart on error
    }
  }, [session, status])

  // ── FIX 4: Sync when session changes ─────────────────────────────────────────
  useEffect(() => {
    // ✅ Only sync when session is fully authenticated and not loading
    if (status === 'authenticated' && session && !hasSyncedSession.current && isInitialized) {
      hasSyncedSession.current = true
      syncFromServer()
    }
    
    // ✅ Reset sync flag when session status changes to unauthenticated
    if (status === 'unauthenticated') {
      hasSyncedSession.current = false
    }
  }, [session?.user?.id, status, isInitialized, syncFromServer])

  // ── FIX 7: Validate once on mount ──────────────────────────────────────────
  useEffect(() => {
    if (!isInitialized || hasValidated.current) return
    hasValidated.current = true
    validate()
  }, [isInitialized, validate])

  const add = useCallback(async (productId: string, quantity = 1) => {
    if (status === 'authenticated' && session) {
      try {
        const res = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId, quantity })
        })
        
        // ✅ Handle 401 Unauthorized
        if (res.status === 401) {
          console.log('🛒 Session expired, adding to local cart instead')
          // Fall through to local cart
        } else if (res.ok) {
          await syncFromServer()
          return
        }
      } catch {
        // Fallback to local
        console.log('🛒 Network error, adding to local cart')
      }
    }

    // Local cart update (guest or fallback)
    setItems((prev) => {
      const found = prev.find((p) => p.productId === productId)
      if (found) {
        return prev.map((p) =>
          p.productId === productId ? { ...p, quantity: p.quantity + quantity } : p
        )
      }
      return [...prev, { productId, quantity }]
    })
  }, [session, status, syncFromServer])

  const remove = useCallback(async (productId: string) => {
    if (status === 'authenticated' && session) {
      try {
        const res = await fetch('/api/cart', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId })
        })
        
        // ✅ Handle 401 Unauthorized
        if (res.status === 401) {
          console.log('🛒 Session expired, removing from local cart instead')
          // Fall through to local cart
        } else if (res.ok) {
          await syncFromServer()
          return
        }
      } catch {
        // Fallback to local
        console.log('🛒 Network error, removing from local cart')
      }
    }

    // Local cart update (guest or fallback)
    setItems((prev) => prev.filter((p) => p.productId !== productId))
  }, [session, status, syncFromServer])

  const update = useCallback(async (productId: string, quantity: number) => {
    if (status === 'authenticated' && session) {
      try {
        const res = await fetch('/api/cart', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId, quantity })
        })
        
        // ✅ Handle 401 Unauthorized
        if (res.status === 401) {
          console.log('🛒 Session expired, updating local cart instead')
          // Fall through to local cart
        } else if (res.ok) {
          await syncFromServer()
          return
        }
      } catch {
        // Fallback to local
        console.log('🛒 Network error, updating local cart')
      }
    }

    // Local cart update (guest or fallback)
    setItems((prev) =>
      prev.map((p) => p.productId === productId ? { ...p, quantity } : p)
         .filter((p) => p.quantity > 0)
    )
  }, [session, status, syncFromServer])

  const clear = useCallback(async () => {
    setItems([])
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
    
    if (status === 'authenticated' && session) {
      try {
        const res = await fetch('/api/cart', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        })
        
        // ✅ Handle 401 silently - cart is already cleared locally
        if (res.status === 401) {
          console.log('🛒 Session expired, cart cleared locally only')
        }
      } catch {
        // ignore
      }
    }
  }, [session, status])

  const count = items.reduce((s, it) => s + it.quantity, 0)

  const value: CartContextValue = {
    items,
    count,
    add,
    remove,
    update,
    clear,
    validate,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

export default CartContext