"use client"
import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { usePathname } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import { ShoppingCart, Loader2 } from 'lucide-react'

export default function AddToCartButton({ productId, qty = 1, disabled = false }: { productId: string; qty?: number; disabled?: boolean }) {
  const [loading, setLoading] = useState(false)
  const pathname = usePathname() || '/'
  const cart = useCart()

  // Hide add-to-cart on the public homepage and user account pages
  if (pathname === '/' || pathname.startsWith('/account')) return null

  async function add() {
    setLoading(true)
    try {
      const sel = document.getElementById('quantity') as HTMLSelectElement | null
      const quantity = sel ? parseInt(sel.value || '1', 10) : qty

      // update local/guest cart immediately
      await cart.add(productId, quantity)

      // show feedback
      toast.success('Added to cart')
    } catch (err: any) {
      toast.error(err?.message || 'Could not add to cart')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button 
      onClick={add} 
      disabled={loading || disabled} 
      className="w-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-green-500 hover:from-yellow-500 hover:via-yellow-600 hover:to-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Adding...
        </>
      ) : (
        <>
          <ShoppingCart className="w-5 h-5" />
          Add to Cart
        </>
      )}
    </button>
  )
}