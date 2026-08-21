"use client"

import React, { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"

// -----------------------------
// Types
// -----------------------------
interface SubItem {
  id: string
  title: string
  image: string
  link: string
}

interface MainCard {
  id: string // prefer slug when available
  headerTitle: string
  items: SubItem[]
}

// -----------------------------
// Helper: upsert sub-item into a main card (immutably)
// - Replaces item if id matches
// - Otherwise appends; if >4 items, removes oldest (first)
// -----------------------------
function upsertSubItem(mainCards: MainCard[], mainCardId: string, item: SubItem) {
  return mainCards.map((card) => {
    if (card.id !== mainCardId) return card

    const existing = card.items.findIndex((i) => i.id === item.id)
    let nextItems: SubItem[]

    if (existing !== -1) {
      nextItems = [...card.items]
      nextItems[existing] = { ...item }
    } else {
      // append and enforce 4-item limit
      if (card.items.length >= 4) {
        nextItems = [...card.items.slice(1), item]
      } else {
        nextItems = [...card.items, item]
      }
    }

    return { ...card, items: nextItems }
  })
}

// -----------------------------
// Fallback demo categories (used while API returns nothing)
// -----------------------------
const FALLBACK: MainCard[] = [
  {
    id: "electronics",
    headerTitle: "Electronics",
    items: [
      { id: "spk", title: "Portable Speakers", image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80", link: "/shop?category=electronics" },
      { id: "ear", title: "Earphones", image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80", link: "/shop?category=electronics" },
    ],
  },
  {
    id: "fashion",
    headerTitle: "Fashion",
    items: [
      { id: "mens", title: "Men's Wear", image: "https://images.unsplash.com/photo-1617137968427-85924c800b22?w=600&q=80", link: "/shop?category=fashion" },
    ],
  },
  {
    id: "home",
    headerTitle: "Home & Living",
    items: [
      { id: "fur", title: "Furniture", image: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=600&q=80", link: "/shop?category=home" },
    ],
  },
]

// -----------------------------
// Component
// -----------------------------
export default function CategoryGrid({
  initialData,
  fetchFromApi = true,
  className = "",
}: {
  initialData?: MainCard[]
  fetchFromApi?: boolean
  className?: string
}) {
  const [categories, setCategories] = useState<MainCard[]>(initialData ?? FALLBACK)

  // form state
  const [form, setForm] = useState({ categoryId: categories[0]?.id ?? "", title: "", image: "", link: "" })

  // Fetch live categories with children (mapped to our MainCard shape)
  useEffect(() => {
    if (!fetchFromApi) return

    let mounted = true

    ;(async () => {
      try {
        const res = await fetch("/api/categories?includeChildren=true&includeProducts=true")
        if (!res.ok) throw new Error("failed to fetch categories")
        const json = await res.json()

        if (!Array.isArray(json) || json.length === 0) return

        const mapped: MainCard[] = json.map((p: any) => {
          // prefer products returned from API (approved products), otherwise fall back to children categories
          const itemsFromProducts = (p.products || []).slice(0, 4).map((prod: any) => ({
            id: prod.slug || prod.id,
            title: prod.name,
            image: (prod.images && prod.images[0]) || `https://via.placeholder.com/300?text=${encodeURIComponent(prod.name)}`,
            link: `/shop/${encodeURIComponent(prod.slug || prod.id)}`,
          }))

          const itemsFromChildren = (p.children || []).slice(0, 4).map((c: any) => ({
            id: c.slug || c.id,
            title: c.name,
            image: c.image || `https://via.placeholder.com/300?text=${encodeURIComponent(c.name)}`,
            link: `/shop?category=${encodeURIComponent(c.slug || c.id)}`,
          }))

          return {
            id: p.slug || p.id,
            headerTitle: p.name,
            items: itemsFromProducts.length > 0 ? itemsFromProducts : itemsFromChildren,
          }
        })

        if (mounted && mapped.length > 0) {
          setCategories(mapped)
          setForm((s) => ({ ...s, categoryId: mapped[0].id }))
        }
      } catch (e) {
        // keep fallback
      }
    })()

    return () => {
      mounted = false
    }
  }, [fetchFromApi])

  // Handle form submit (adds or replaces sub-item immutably)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return

    const newItem: SubItem = {
      id: Date.now().toString(),
      title: form.title.trim(),
      image: form.image.trim() || "https://images.unsplash.com/photo-1543512214-318c7553f230?w=600&q=80",
      link: form.link.trim() || `/shop?category=${encodeURIComponent(form.categoryId)}`,
    }

    setCategories((prev) => upsertSubItem(prev, form.categoryId, newItem))

    // reset title/image/link but keep selected category
    setForm((s) => ({ ...s, title: "", image: "", link: "" }))
  }

  return (
    <div className={"bg-gray-100 py-6 " + className}>
      <div className="max-w-7xl mx-auto px-4">

      

        {/* Grid of main categories */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {categories.map((category) => (
            <div key={category.id} className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden flex flex-col">

              {/* Header */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900">{category.headerTitle}</h3>
              </div>

              {/* 2x2 Sub-items grid */}
              <div className="p-4 pt-0 flex-1">
                {category.items.length === 0 ? (
                  <div className="h-28 flex items-center justify-center text-sm text-gray-400 border border-dashed rounded">No items</div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {category.items.slice(0, 4).map((it) => {
                      const isExternal = /^https?:\/\//.test(it.link)
                      return (
                        <div key={it.id} className="group block">
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => {
                                // remove this item from the category (client-side)
                                setCategories((prev) => prev.map((card) => (card.id === category.id ? { ...card, items: card.items.filter((i) => i.id !== it.id) } : card)))
                              }}
                              aria-label={`Remove ${it.title}`}
                              className="absolute z-10 right-1 top-1 bg-white/80 rounded-full p-0.5 text-xs text-red-600 hover:bg-white"
                            >
                              ×
                            </button>

                            <div className="aspect-square relative overflow-hidden rounded bg-gray-50 flex items-center justify-center p-2">
                              {isExternal ? (
                                <a href={it.link} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                                  <Image src={it.image} alt={it.title} fill sizes="150px" className="object-contain transition-transform group-hover:scale-105" />
                                </a>
                              ) : (
                                <Link href={it.link} className="block w-full h-full">
                                  <Image src={it.image} alt={it.title} fill sizes="150px" className="object-contain transition-transform group-hover:scale-105" />
                                </Link>
                              )}
                            </div>

                          </div>

                          <div className="mt-2">
                            {isExternal ? (
                              <a href={it.link} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-700 line-clamp-2 hover:text-orange-600 transition-colors block">{it.title}</a>
                            ) : (
                              <Link href={it.link} className="text-xs text-gray-700 line-clamp-2 hover:text-orange-600 transition-colors block">{it.title}</Link>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-100">
                <Link href={`/shop?category=${encodeURIComponent(category.id)}`} className="text-sm font-medium text-teal-700 hover:text-orange-600 hover:underline inline-flex items-center gap-2">
                  Shop now <span aria-hidden>→</span>
                </Link>
              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
