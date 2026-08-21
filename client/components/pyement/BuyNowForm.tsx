"use client"
import React, { useState } from 'react'
import toast from 'react-hot-toast'

export default function BuyNowForm({ productId, defaultQuantity = 1 }: { productId: string; defaultQuantity?: number }) {
  const [loading, setLoading] = useState(false)
  const [quantity] = useState(defaultQuantity)

  const handleBuyNow = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity }),
      })
      const text = await res.text()
      let data: any = null
      try { data = text ? JSON.parse(text) : null } catch (_) { data = null }
      if (!res.ok) throw new Error((data && data.error) || res.statusText || 'Checkout failed')
      if (data?.url) {
        window.location.href = data.url
        return
      }
      throw new Error('No checkout URL returned')
    } catch (err: any) {
      console.error('Buy now error', err)
      toast.error(err?.message || 'Checkout failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleBuyNow} className="w-full">
      <button
        type="submit"
        className={`w-full py-3 rounded-lg font-semibold text-white transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-60 ${loading ? 'bg-emerald-500' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'}`}
        disabled={loading}
      >
        {loading ? 'Redirecting…' : 'Buy now'}
      </button>
    </form>
  )
}
