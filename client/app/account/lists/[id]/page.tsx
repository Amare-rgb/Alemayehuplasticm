"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface ListItem {
  id: string;
  title: string;
  description: string;
  itemCount: number;
}

export default function ListDetailsPage() {
  const params = useParams();
  const router = useRouter();
  
  const listId = params.id as string;

  // ── FIX: Initialize state lazily from localStorage to avoid cascading renders ──
  const [allLists] = useState<ListItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const savedLists = localStorage.getItem("userLists");
      if (savedLists) {
        return JSON.parse(savedLists) as ListItem[];
      }
    } catch (error) {
      console.error("Error fetching list details:", error);
    }
    return [];
  });

  const [loading] = useState(false);

  // ── Use useMemo to find the specific list ─────────────────────────────
  const list = useMemo(() => {
    return allLists.find((l) => l.id === listId) || null;
  }, [allLists, listId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 animate-pulse font-medium">Loading items...</p>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">List Not Found</h2>
        <p className="text-gray-500 mb-6">The list you are trying to view does not exist or has been deleted.</p>
        <Link href="/account/lists" className="px-4 py-2 bg-emerald-600 text-white rounded-xl shadow">
          Back to Your Lists
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border p-6 md:p-8">
        
        <button 
          onClick={() => router.back()} 
          className="text-sm text-emerald-600 hover:text-emerald-700 font-medium mb-6 inline-flex items-center gap-1"
        >
          ← Back to Dashboard
        </button>

        <header className="border-b pb-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">{list.title}</h1>
          {list.description && <p className="text-gray-600 mt-2 text-base">{list.description}</p>}
        </header>

        <div className="py-8 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
          <div className="text-5xl mb-3">🛍️</div>
          <h3 className="text-lg font-semibold text-gray-700">Items inside this collection</h3>
          <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
            You currently have {list.itemCount} item(s) mapped out in this dashboard segment.
          </p>
        </div>

      </div>
    </div>
  );
}