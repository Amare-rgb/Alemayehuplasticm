// app/cart/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Truck,
  Leaf,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/app/providers";
import toast from "react-hot-toast";

// Types
interface CartItem {
  id: string;
  productId: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  unit: string;
  image: string;
  stock: number;
  category?: string;
}

export default function CartPage() {
  const router = useRouter();
  const { user, status } = useAuth();
  const { items, cartCount, totalUnits, cartTotal, updateQuantity, removeFromCart, clearCart, isLoading } = useCart();
  const [isUpdating, setIsUpdating] = useState<Record<string, boolean>>({});
  const [isClearing, setIsClearing] = useState(false);

  const isAuthenticated = status === "authenticated" && !!user;

  const handleQuantityInputChange = (
    item: CartItem,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 1) {
      updateQuantity(item.productId, 1);
    } else if (item.stock > 0 && val > item.stock) {
      updateQuantity(item.productId, item.stock);
    } else {
      updateQuantity(item.productId, val);
    }
  };

  const handleUpdateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      await removeFromCart(productId);
      return;
    }
    
    setIsUpdating(prev => ({ ...prev, [productId]: true }));
    try {
      await updateQuantity(productId, newQuantity);
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error("Failed to update quantity");
    } finally {
      setIsUpdating(prev => ({ ...prev, [productId]: false }));
    }
  };

  const handleRemoveItem = async (productId: string, itemName: string) => {
    try {
      await removeFromCart(productId);
      toast.success(`${itemName} removed from cart`);
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("Failed to remove item");
    }
  };

  const handleClearCart = async () => {
    if (items.length === 0) return;
    
    if (!confirm("Are you sure you want to clear your entire cart?")) {
      return;
    }

    setIsClearing(true);
    try {
      await clearCart();
      toast.success("Cart cleared successfully");
    } catch (error) {
      console.error("Error clearing cart:", error);
      toast.error("Failed to clear cart");
    } finally {
      setIsClearing(false);
    }
  };

  const handleProceedToCheckout = () => {
    if (items.length === 0) {
      toast.error("Your cart is currently empty.");
      return;
    }
    router.push("/checkout");
  };

  // Loading state
  if (isLoading) {
    return (
      <main className="min-h-screen bg-[var(--cream)] pt-28 sm:pt-32 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#28633e] mx-auto" />
          <p className="mt-4 text-sm text-[#69736b]">Loading your cart...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--cream)] pb-20 pt-28 sm:pt-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header Breadcrumb */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link
              href="/shop"
              className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#28633e] hover:text-[#123523] transition"
            >
              <ArrowLeft size={14} />
              Continue Shopping Fresh Produce
            </Link>
            <h1 className="font-serif-heading text-3xl sm:text-4xl font-bold tracking-tight text-[#123523]">
              Your Shopping Cart
            </h1>
            <p className="mt-1 text-xs text-[#69736b]">
              Review your fresh harvest produce and manage quantities before checkout.
            </p>
          </div>

          {items.length > 0 && (
            <button
              type="button"
              onClick={handleClearCart}
              disabled={isClearing}
              className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-red-200 bg-red-50/80 px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 hover:border-red-300 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isClearing ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Trash2 size={14} />
              )}
              {isClearing ? "Clearing..." : "Clear Cart"}
            </button>
          )}
        </div>

        {items.length === 0 ? (
          /* Empty Cart State */
          <div className="rounded-[2.5rem] border border-[rgba(20,33,25,.09)] bg-white p-10 sm:p-16 text-center shadow-[0_15px_45px_rgba(18,53,35,.06)]">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#f6f3e9] text-[#28633e] shadow-inner">
              <ShoppingBag size={38} strokeWidth={1.8} />
            </div>

            <h2 className="font-serif-heading text-2xl sm:text-3xl font-bold text-[#123523]">
              Your cart is currently empty
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#69736b]">
              Explore our farm marketplace for crisp vegetables, sweet orchard fruits, and highland grains sourced directly from local growers.
            </p>

            <Link
              href="/shop"
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-[#123523] px-8 py-4 text-sm font-bold text-white shadow-lg transition-all duration-200 hover:bg-[#19472d] hover:text-[var(--lime)] hover:shadow-xl hover:-translate-y-0.5"
            >
              <Leaf size={16} />
              <span>Explore Fresh Marketplace</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          /* Active Cart Grid */
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
            {/* Items List (Left Side - 8 Cols) */}
            <div className="lg:col-span-8 space-y-4">
              <div className="rounded-2xl bg-white px-5 py-3 border border-[rgba(20,33,25,.08)] flex items-center justify-between text-xs font-semibold text-[#123523]">
                <span>
                  {cartCount} item{cartCount !== 1 ? "s" : ""} ({totalUnits} total unit{totalUnits !== 1 ? "s" : ""})
                </span>
                <span className="text-[#69736b] font-normal">
                  Prices in Ethiopian Birr (ETB)
                </span>
              </div>

              {items.map((item) => {
                const itemSubtotal = item.price * item.quantity;
                const isOutOfStock = item.stock > 0 && item.quantity > item.stock;
                const isUpdatingItem = isUpdating[item.productId] || false;

                return (
                  <div
                    key={item.id}
                    className="group overflow-hidden rounded-[2rem] border border-[rgba(20,33,25,.09)] bg-white p-5 sm:p-6 shadow-[0_10px_35px_rgba(18,53,35,.04)] transition-all hover:shadow-[0_15px_45px_rgba(18,53,35,.08)]"
                  >
                    <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                      {/* Product Image */}
                      <Link
                        href={`/shop/${encodeURIComponent(item.slug)}`}
                        className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-2xl bg-[#0b2419] border border-[#16412c]/20"
                      >
                        <Image
                          src={item.image || "/placeholder-product.jpg"}
                          alt={item.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 640px) 96px, 112px"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            target.src =
                              "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80";
                          }}
                        />
                      </Link>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {item.category && (
                            <span className="rounded-full bg-[#f6f3e9] px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#28633e]">
                              {item.category}
                            </span>
                          )}
                          <span className="text-[10px] text-[#69736b] font-medium">
                            Farm Harvest
                          </span>
                        </div>

                        <Link
                          href={`/shop/${encodeURIComponent(item.slug)}`}
                          className="block"
                        >
                          <h3 className="font-serif-heading text-lg sm:text-xl font-bold leading-tight text-[#123523] hover:text-[#28633e] transition-colors truncate">
                            {item.name}
                          </h3>
                        </Link>

                        <div className="mt-1 flex items-baseline gap-2 text-sm text-[#123523]">
                          <span className="font-bold">
                            ETB {item.price.toLocaleString()}
                          </span>
                          <span className="text-xs text-[#69736b]">
                            per {item.unit}
                          </span>
                        </div>

                        {isOutOfStock && (
                          <p className="mt-1 text-xs text-red-500 font-semibold">
                            Only {item.stock} {item.unit}s available in stock
                          </p>
                        )}
                      </div>

                      {/* Quantity Selector + Total + Remove */}
                      <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-5 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                        {/* Editable Quantity Box */}
                        <div className="flex items-center rounded-xl border border-[#19472d]/15 bg-[#f6f3e9]/60 p-1 focus-within:ring-2 focus-within:ring-[#b9d873]">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                            disabled={item.quantity <= 1 || isUpdatingItem}
                            aria-label="Decrease quantity"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#123523] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <Minus size={14} />
                          </button>

                          <input
                            type="number"
                            min={1}
                            max={item.stock > 0 ? item.stock : 9999}
                            value={item.quantity}
                            onChange={(e) => handleQuantityInputChange(item, e)}
                            disabled={isUpdatingItem}
                            className="h-8 w-14 text-center text-xs font-bold text-[#123523] bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50"
                          />

                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                            disabled={(item.stock > 0 && item.quantity >= item.stock) || isUpdatingItem}
                            aria-label="Increase quantity"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#123523] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            {isUpdatingItem ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Plus size={14} />
                            )}
                          </button>
                        </div>

                        {/* Item Subtotal */}
                        <div className="text-right min-w-[90px]">
                          <span className="font-serif-heading text-lg font-bold text-[#123523]">
                            ETB {itemSubtotal.toLocaleString()}
                          </span>
                        </div>

                        {/* Remove Item Button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.productId, item.name)}
                          disabled={isUpdatingItem}
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Remove produce"
                          title="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Guarantees Bar */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-3 rounded-2xl bg-white p-3.5 border border-[rgba(20,33,25,.07)]">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--lime)]/20 text-[#123523]">
                    <Truck size={17} />
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-[#123523]">
                      Direct Farm Delivery
                    </h4>
                    <p className="text-[10px] text-[#69736b]">
                      Freshly handled from harvest
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl bg-white p-3.5 border border-[rgba(20,33,25,.07)]">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--lime)]/20 text-[#123523]">
                    <ShieldCheck size={17} />
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-[#123523]">
                      100% Quality Checked
                    </h4>
                    <p className="text-[10px] text-[#69736b]">
                      Verified agricultural grade
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl bg-white p-3.5 border border-[rgba(20,33,25,.07)]">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--lime)]/20 text-[#123523]">
                    <CheckCircle2 size={17} />
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-[#123523]">
                      No Account Required
                    </h4>
                    <p className="text-[10px] text-[#69736b]">
                      Shop and buy as a guest
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary Card (Right Side - 4 Cols) */}
            <div className="lg:col-span-4 sticky top-28">
              <div className="rounded-[2.5rem] border border-[rgba(20,33,25,.09)] bg-white p-6 sm:p-7 shadow-[0_15px_45px_rgba(18,53,35,.07)]">
                <h2 className="font-serif-heading text-2xl font-bold text-[#123523] pb-4 border-b border-gray-100">
                  Order Summary
                </h2>

                <div className="mt-5 space-y-3.5 text-xs text-[#69736b]">
                  <div className="flex justify-between items-center">
                    <span>Produce Subtotal ({cartCount} items)</span>
                    <span className="font-bold text-[#123523] text-sm">
                      ETB {cartTotal.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span>Farm Logistics & Packaging</span>
                    <span className="font-medium text-[#28633e]">
                      Calculated at checkout
                    </span>
                  </div>

                  <div className="my-3 h-px bg-gray-100" />

                  <div className="flex justify-between items-baseline pt-1">
                    <span className="font-serif-heading text-base font-bold text-[#123523]">
                      Estimated Total
                    </span>
                    <span className="font-serif-heading text-2xl font-bold text-[#123523]">
                      ETB {cartTotal.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Checkout CTA Button */}
                <button
                  type="button"
                  onClick={handleProceedToCheckout}
                  className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#123523] px-6 text-sm font-bold text-white shadow-lg transition-all duration-200 hover:bg-[#19472d] hover:text-[var(--lime)] hover:shadow-xl hover:-translate-y-0.5"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight size={16} />
                </button>

                <p className="mt-3 text-center text-[11px] text-[#69736b]">
                  ✓ Quick checkout • Cash on Delivery & Telebirr available
                </p>

                <div className="mt-6 pt-5 border-t border-gray-100">
                  <Link
                    href="/shop"
                    className="block w-full text-center text-xs font-bold uppercase tracking-wider text-[#28633e] hover:text-[#123523] transition"
                  >
                    ← Browse More Produce
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}