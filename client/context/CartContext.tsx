// context/CartContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
} from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/app/providers";

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  slug: string;
  price: number;
  discountPrice?: number | null;
  unit: string;
  image: string;
  quantity: number;
  stock: number;
  category?: string;
}

export interface CartProductInput {
  id: string;
  name: string;
  slug: string;
  price: number;
  discountPrice?: number | null;
  unit?: string;
  images?: string[];
  stock?: number;
  category?: string;
}

// Define the backend cart item type
interface BackendCartItem {
  id?: string;
  productId?: string;
  quantity?: number;
  product?: {
    id?: string;
    name?: string;
    slug?: string;
    price?: number;
    discountPrice?: number | null;
    unitOfMeasurement?: string;
    unit?: string;
    images?: string[];
    stock?: number;
    category?: string | { id?: string; name?: string; slug?: string; description?: string; image?: string; parentId?: string };
  };
}

// Define the backend cart response type
interface BackendCartResponse {
  items?: BackendCartItem[];
  data?: BackendCartItem[];
}

interface CartContextType {
  items: CartItem[];
  cartCount: number;
  totalUnits: number;
  cartTotal: number;
  isLoading: boolean;
  addToCart: (product: CartProductInput, quantity?: number, showToast?: boolean) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const GUEST_CART_STORAGE_KEY = "genesis_guest_cart";

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, status } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const getAuthHeaders = useCallback(() => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("token") || localStorage.getItem("authToken")
        : null;
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, []);

  // FIX: Properly typed mapBackendItemToCartItem function
  const mapBackendItemToCartItem = useCallback((item: BackendCartItem): CartItem => {
    const product = item.product || {};
    const priceNum = Number(product.price || 0);
    const discNum = product.discountPrice !== null && product.discountPrice !== undefined 
      ? Number(product.discountPrice) 
      : null;
    const effectivePrice = discNum !== null && discNum < priceNum ? discNum : priceNum;

    const images = Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : ["https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80"];

    const categoryName = typeof product.category === "string" 
      ? product.category 
      : product.category?.name;

    return {
      id: item.id || `item-${product.id || item.productId}`,
      productId: item.productId || product.id || "",
      name: product.name || "Produce Item",
      slug: product.slug || product.id || item.productId || "",
      price: effectivePrice,
      discountPrice: discNum,
      unit: product.unitOfMeasurement || product.unit || "kg",
      image: images[0],
      quantity: item.quantity || 1,
      stock: typeof product.stock === "number" ? product.stock : 999,
      category: categoryName,
    };
  }, []);

  // Helper to load guest cart from localStorage
  const loadGuestCart = useCallback((): CartItem[] => {
    try {
      const stored = localStorage.getItem(GUEST_CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Failed to load guest cart:", e);
    }
    return [];
  }, []);

  // Helper to save guest cart to localStorage
  const saveGuestCart = useCallback((cartItems: CartItem[]) => {
    try {
      localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (e) {
      console.warn("Failed to save guest cart:", e);
    }
  }, []);

  // Fetch backend cart for authenticated user
  const fetchBackendCart = useCallback(async (): Promise<CartItem[]> => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/cart`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch cart (Status ${res.status})`);
      }
      const data: BackendCartResponse = await res.json();
      if (data && Array.isArray(data.items)) {
        return data.items.map(mapBackendItemToCartItem);
      }
    } catch (err) {
      console.warn("Error fetching user cart from backend:", err);
    }
    return [];
  }, [apiBaseUrl, getAuthHeaders, mapBackendItemToCartItem]);

  // Sync / Switch Cart State on Auth State Changes
  useEffect(() => {
    const currentUserId = user?.id || null;

    // Check if user changed (Guest -> User, User A -> User B, or User -> Guest)
    if (prevUserIdRef.current !== currentUserId) {
      prevUserIdRef.current = currentUserId;

      const initCartForCurrentState = async () => {
        setIsLoading(true);

        if (status === "authenticated" && user?.id) {
          // Logged in: Check if there was an active guest cart to merge
          const guestItems = loadGuestCart();

          if (guestItems.length > 0) {
            // Upload guest items to the user's backend cart
            for (const gItem of guestItems) {
              try {
                await fetch(`${apiBaseUrl}/api/cart`, {
                  method: "POST",
                  headers: getAuthHeaders(),
                  body: JSON.stringify({
                    productId: gItem.productId,
                    quantity: gItem.quantity,
                  }),
                });
              } catch (e) {
                console.warn("Error merging guest item to backend cart:", e);
              }
            }
            // Clear guest cart once merged
            try {
              localStorage.removeItem(GUEST_CART_STORAGE_KEY);
            } catch {}
          }

          // Fetch fresh user cart from backend
          const backendItems = await fetchBackendCart();
          setItems(backendItems);
        } else if (status === "unauthenticated") {
          // Logged out / Guest: Load strictly guest cart from localStorage
          const guestItems = loadGuestCart();
          setItems(guestItems);
        }

        setIsLoading(false);
      };

      initCartForCurrentState();
    }
  }, [user?.id, status, loadGuestCart, fetchBackendCart, apiBaseUrl, getAuthHeaders]);

  // Listen to cross-tab storage changes (only for guest users)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (status === "unauthenticated" && e.key === GUEST_CART_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setItems(parsed);
          }
        } catch {}
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [status]);

  // Add Item to Cart
  const addToCart = async (
    product: CartProductInput,
    quantity: number = 1,
    showToast: boolean = true
  ) => {
    const qty = Math.max(1, quantity);
    const effectivePrice =
      product.discountPrice !== null && product.discountPrice !== undefined && product.discountPrice < product.price
        ? product.discountPrice
        : product.price;

    const unit = product.unit || "kg";
    const image =
      Array.isArray(product.images) && product.images.length > 0
        ? product.images[0]
        : "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80";

    const stock = typeof product.stock === "number" ? product.stock : 999;

    // 1. Optimistically update local React state
    let updatedItems: CartItem[] = [];
    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (item) => item.productId === product.id || item.slug === product.slug
      );

      if (existingIndex > -1) {
        const updated = [...prevItems];
        const newQty = Math.min(stock, updated[existingIndex].quantity + qty);
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          price: effectivePrice,
          unit,
          image,
          stock,
        };
        updatedItems = updated;
        return updated;
      } else {
        const newItem: CartItem = {
          id: `item-${Date.now()}-${product.id}`,
          productId: product.id,
          name: product.name,
          slug: product.slug || product.id,
          price: effectivePrice,
          discountPrice: product.discountPrice,
          unit,
          image,
          quantity: Math.min(stock, qty),
          stock,
          category: product.category,
        };
        updatedItems = [...prevItems, newItem];
        return updatedItems;
      }
    });

    // 2. Persist according to auth state
    if (status === "authenticated" && user?.id) {
      try {
        await fetch(`${apiBaseUrl}/api/cart`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            productId: product.id,
            quantity: qty,
          }),
        });
      } catch (err) {
        console.warn("Failed to sync add-to-cart to backend:", err);
      }
    } else {
      saveGuestCart(updatedItems);
    }

    if (showToast) {
      toast.success(`Added ${qty} ${unit} of ${product.name} to cart!`, {
        icon: "🛒",
        style: {
          borderRadius: "16px",
          background: "#071a11",
          color: "#fff",
          border: "1px solid #1e4d35",
          fontSize: "13px",
          fontWeight: 600,
        },
      });
    }
  };

  // Update Item Quantity
  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    let updatedItems: CartItem[] = [];
    setItems((prevItems) => {
      const updated = prevItems.map((item) => {
        if (item.productId === productId || item.id === productId || item.slug === productId) {
          const validQty = Math.min(item.stock > 0 ? item.stock : 9999, Math.max(1, quantity));
          return { ...item, quantity: validQty };
        }
        return item;
      });
      updatedItems = updated;
      return updated;
    });

    // Persist
    if (status === "authenticated" && user?.id) {
      try {
        await fetch(`${apiBaseUrl}/api/cart`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            productId,
            quantity,
          }),
        });
      } catch (err) {
        console.warn("Failed to update cart quantity on backend:", err);
      }
    } else {
      saveGuestCart(updatedItems);
    }
  };

  // Remove Item from Cart
  const removeFromCart = async (productId: string) => {
    let updatedItems: CartItem[] = [];
    setItems((prevItems) => {
      const updated = prevItems.filter(
        (item) => item.productId !== productId && item.id !== productId && item.slug !== productId
      );
      updatedItems = updated;
      return updated;
    });

    // Persist
    if (status === "authenticated" && user?.id) {
      try {
        await fetch(`${apiBaseUrl}/api/cart`, {
          method: "DELETE",
          headers: getAuthHeaders(),
          body: JSON.stringify({ productId }),
        });
      } catch (err) {
        console.warn("Failed to delete item from backend cart:", err);
      }
    } else {
      saveGuestCart(updatedItems);
    }

    toast("Item removed from cart", {
      icon: "🗑️",
      style: {
        borderRadius: "14px",
        background: "#071a11",
        color: "#fff",
        border: "1px solid #1e4d35",
        fontSize: "12px",
      },
    });
  };

  // Clear Entire Cart
  const clearCart = async () => {
    const currentItems = [...items];
    setItems([]);

    if (status === "authenticated" && user?.id) {
      try {
        for (const item of currentItems) {
          await fetch(`${apiBaseUrl}/api/cart`, {
            method: "DELETE",
            headers: getAuthHeaders(),
            body: JSON.stringify({ productId: item.productId }),
          });
        }
      } catch (err) {
        console.warn("Failed to clear backend cart:", err);
      }
    } else {
      try {
        localStorage.removeItem(GUEST_CART_STORAGE_KEY);
      } catch {}
    }
  };

  // Badge count: Counts the distinct items in the cart (not their quantity)
  const cartCount = useMemo(() => items.length, [items]);

  // Total quantity of all units in the cart
  const totalUnits = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  // Cart total in ETB
  const cartTotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const value = {
    items,
    cartCount,
    totalUnits,
    cartTotal,
    isLoading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}