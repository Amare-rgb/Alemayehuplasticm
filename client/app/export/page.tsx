import React from 'react'
import Link from 'next/link'
import { Globe, Plane, Ship, ShieldCheck, ArrowRight, CheckCircle } from 'lucide-react'

export const metadata = {
  title: 'Global Export | Genesis Agri Business',
  description: 'International export of certified agricultural products, seeds, grains, and organic fertilizers.',
}

export default function ExportPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-green-900 via-emerald-900 to-green-950 text-white rounded-3xl p-8 sm:p-14 mb-12 shadow-sm">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/20 backdrop-blur rounded-full text-xs font-bold uppercase tracking-wider mb-4 text-green-300">
              <Globe size={14} /> International Agricultural Trade
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Genesis Agri Global Export Operations</h1>
            <p className="text-green-100 text-base sm:text-lg leading-relaxed">
              Supplying certified organic grains, non-GMO seed varieties, specialized crop nutrition, and sustainable fertilizers to agricultural partners worldwide across 25+ countries.
            </p>
          </div>
        </div>

        {/* Export Strengths */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-green-100 text-green-700 flex items-center justify-center">
              <Ship size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Maritime & Bulk Freight</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Bulk container shipping solutions with strict phytosanitary certifications and moisture-controlled packaging.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-green-100 text-green-700 flex items-center justify-center">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Certified Phytosanitary Standards</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Full compliance with international agricultural quarantine, seed purity, and non-GMO certification protocols.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-green-100 text-green-700 flex items-center justify-center">
              <Plane size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Express Agronomy Shipments</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Air-freight expedited delivery for seasonal specialty crop seeds, biological cultures, and farm technology.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-white rounded-2xl p-8 sm:p-12 border border-gray-200 shadow-sm text-center max-w-3xl mx-auto space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Request an International Export Quote</h2>
          <p className="text-gray-600 text-sm max-w-xl mx-auto">
            Contact our international trade desk with your volume requirements, destination ports, and product specifications.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm transition-all shadow-md"
          >
            Contact Export Desk <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </main>
  )
}
