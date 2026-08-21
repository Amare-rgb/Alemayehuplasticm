"use client"
import { useEffect } from 'react'

export default function QuantitySync() {
  useEffect(() => {
    const sel = document.getElementById('quantity') as HTMLSelectElement | null
    const hid = document.getElementById('checkout-quantity') as HTMLInputElement | null
    if (!sel || !hid) return
    const handler = () => { hid.value = sel.value }
    sel.addEventListener('change', handler)
    // initialize
    handler()
    return () => sel.removeEventListener('change', handler)
  }, [])

  return null
}
