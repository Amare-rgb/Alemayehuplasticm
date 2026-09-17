"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { useSession } from "next-auth/react";

// ============================================
// TYPES
// ============================================

type CartItem = {
  productId: string;
  quantity: number;
};

type CartItemResponse = {
  productId: string;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  add: (productId: string, quantity?: number) => Promise<void>;
  remove: (productId: string) => Promise<void>;
  update: (productId: string, quantity: number) => Promise<void>;
  clear: () => Promise<void>;
  validate: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

const STORAGE_KEY = "shophub_cart_v1";

// ============================================
// HELPERS
// ============================================

function readStoredCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (it): it is CartItem =>
        it &&
        typeof it === "object" &&
        typeof it.productId === "string" &&
        typeof it.quantity === "number"
    );
  } catch {
    return [];
  }
}

// ============================================
// PROVIDER
// ============================================

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  const [items, setItems] = useState<CartItem[]>(() => readStoredCart());

  const isFirstRender = useRef(true);
  const hasSyncedSession = useRef(false);
  const hasValidated = useRef(false);

  // Persist to localStorage
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  // Validate: drop items whose products no longer exist
  const validate = useCallback(async () => {
    let productIds: string[] = [];
    setItems((current) => {
      productIds = current.map((it) => it.productId);
      return current;
    });

    if (productIds.length === 0) return;

    try {
      const res = await fetch("/api/products/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds }),
      });
      if (!res.ok) return;

      const data = (await res.json()) as { validIds?: string[] };
      if (!data?.validIds) return;

      const validSet = new Set(data.validIds);
      setItems((prev) => {
        const cleaned = prev.filter((p) => validSet.has(p.productId));
        return cleaned.length === prev.length ? prev : cleaned;
      });
    } catch {
      // Network hiccup
    }
  }, []);

  // Sync from server when authenticated
  const syncFromServer = useCallback(async () => {
    if (!session || status !== "authenticated") {
      console.log("🛒 Skipping cart sync - user not authenticated");
      return;
    }

    try {
      console.log("🛒 Syncing cart from server...");
      const res = await fetch("/api/cart");

      if (res.status === 401) {
        console.log("🛒 Session expired or invalid, keeping local cart");
        return;
      }

      if (!res.ok) {
        console.error("🛒 Failed to sync cart:", res.status);
        return;
      }

      const data = (await res.json()) as { items: CartItemResponse[] };
      const serverItems: CartItem[] = (data.items || []).map(
        (it: CartItemResponse) => ({
          productId: it.productId,
          quantity: it.quantity,
        })
      );

      console.log(`🛒 Synced ${serverItems.length} items from server`);
      setItems(serverItems);
    } catch (error) {
      console.error("🛒 Error syncing cart from server:", error);
    }
  }, [session, status]);

  // Sync once when session becomes authenticated
  useEffect(() => {
    if (status === "authenticated" && session && !hasSyncedSession.current) {
      hasSyncedSession.current = true;
      syncFromServer();
    }

    if (status === "unauthenticated") {
      hasSyncedSession.current = false;
    }
  }, [session, status, syncFromServer]);

  // Validate once on mount
  useEffect(() => {
    if (hasValidated.current) return;
    hasValidated.current = true;
    validate();
  }, [validate]);

  // Add
  const add = useCallback(
    async (productId: string, quantity = 1) => {
      if (status === "authenticated" && session) {
        try {
          const res = await fetch("/api/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId, quantity }),
          });

          if (res.status === 401) {
            console.log("🛒 Session expired, adding to local cart instead");
          } else if (res.ok) {
            await syncFromServer();
            return;
          }
        } catch {
          console.log("🛒 Network error, adding to local cart");
        }
      }

      setItems((prev) => {
        const found = prev.find((p) => p.productId === productId);
        if (found) {
          return prev.map((p) =>
            p.productId === productId
              ? { ...p, quantity: p.quantity + quantity }
              : p
          );
        }
        return [...prev, { productId, quantity }];
      });
    },
    [session, status, syncFromServer]
  );

  // Remove
  const remove = useCallback(
    async (productId: string) => {
      if (status === "authenticated" && session) {
        try {
          const res = await fetch("/api/cart", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId }),
          });

          if (res.status === 401) {
            console.log("🛒 Session expired, removing from local cart instead");
          } else if (res.ok) {
            await syncFromServer();
            return;
          }
        } catch {
          console.log("🛒 Network error, removing from local cart");
        }
      }

      setItems((prev) => prev.filter((p) => p.productId !== productId));
    },
    [session, status, syncFromServer]
  );

  // Update quantity
  const update = useCallback(
    async (productId: string, quantity: number) => {
      if (status === "authenticated" && session) {
        try {
          const res = await fetch("/api/cart", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId, quantity }),
          });

          if (res.status === 401) {
            console.log("🛒 Session expired, updating local cart instead");
          } else if (res.ok) {
            await syncFromServer();
            return;
          }
        } catch {
          console.log("🛒 Network error, updating local cart");
        }
      }

      setItems((prev) =>
        prev
          .map((p) => (p.productId === productId ? { ...p, quantity } : p))
          .filter((p) => p.quantity > 0)
      );
    },
    [session, status, syncFromServer]
  );

  // Clear
  const clear = useCallback(async () => {
    setItems([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }

    if (status === "authenticated" && session) {
      try {
        const res = await fetch("/api/cart", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });

        if (res.status === 401) {
          console.log("🛒 Session expired, cart cleared locally only");
        }
      } catch {
        // ignore
      }
    }
  }, [session, status]);

  const count = items.reduce((s, it) => s + it.quantity, 0);

  const value: CartContextValue = {
    items,
    count,
    add,
    remove,
    update,
    clear,
    validate,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// ============================================
// HOOK
// ============================================

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}