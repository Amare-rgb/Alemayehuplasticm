import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Sprout,
  Tractor,
  Award,
  Globe,
  Users,
  ShieldCheck,
  Leaf,
  ArrowRight,
  CheckCircle,
  Clock,
  HeartHandshake
} from 'lucide-react'

export const metadata = {
  title: 'About Us | Genesis Agri Business',
  description: 'Learn about Genesis Agri Business, producing quality crops and agricultural solutions for over 50 years.',
}

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative min-h-[420px] md:min-h-[500px] flex items-center justify-center overflow-hidden">
        {/* Background Image with Green Gradient */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/banners/hero-farmer.jpg)',
            backgroundColor: '#1b3c2a'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-green-950/90 via-black/70 to-green-950/80" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center text-white py-16">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-500/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider text-green-300 border border-green-400/30 mb-4">
            <Sprout size={14} /> Since 1976 • 50 Years of Excellence
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 leading-tight">
            About <span className="text-green-400">Genesis Agri Business</span>
          </h1>
          <p className="text-lg md:text-xl text-green-100 max-w-2xl mx-auto leading-relaxed">
            Empowering farmers and agricultural enterprises with high-yield seeds, premium crop nutrition, modern equipment, and sustainable farming solutions.
          </p>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white py-10 border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4">
              <div className="text-3xl sm:text-4xl font-extrabold text-green-700">50+</div>
              <div className="text-sm text-gray-500 mt-1 font-medium">Years in Agriculture</div>
            </div>
            <div className="p-4">
              <div className="text-3xl sm:text-4xl font-extrabold text-green-700">10,000+</div>
              <div className="text-sm text-gray-500 mt-1 font-medium">Farmers Supported</div>
            </div>
            <div className="p-4">
              <div className="text-3xl sm:text-4xl font-extrabold text-green-700">500+</div>
              <div className="text-sm text-gray-500 mt-1 font-medium">Certified Products</div>
            </div>
            <div className="p-4">
              <div className="text-3xl sm:text-4xl font-extrabold text-green-700">25+</div>
              <div className="text-sm text-gray-500 mt-1 font-medium">Export Destinations</div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Mission & Story */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Story Content */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-green-700 uppercase tracking-wider bg-green-100 px-3 py-1 rounded-full">
                <Leaf size={14} /> Our Heritage
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
                Pioneering Sustainable Agriculture for Half a Century
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Founded with a deep passion for the land and farming communities, <strong>Genesis Agri Business</strong> has grown from a humble regional crop producer into a trusted national and international agricultural supplier.
              </p>
              <p className="text-gray-600 leading-relaxed">
                We bridge the gap between traditional agricultural wisdom and modern agronomic science. From non-GMO certified seeds to precision organic fertilizers and heavy-duty farming machinery, we provide everything modern farmers need to maximize crop yields while preserving soil health.
              </p>

              <div className="space-y-3 pt-2">
                {[
                  '100% Quality-Tested Crop Seeds & Nutrition',
                  'Environmentally Friendly & Organic Certified Inputs',
                  'Dedicated Agronomy Support & Delivery Nationwide',
                  'Fair Pricing & Direct Farmer Partnerships'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <CheckCircle className="text-green-600 flex-shrink-0" size={18} />
                    <span className="text-sm font-semibold text-gray-800">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual Image Grid */}
            <div className="relative">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl border-4 border-white">
                <img
                  src="/banners/hero-farmer.jpg"
                  alt="Genesis Agri farmer examining crop seedlings"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-green-700 text-white p-6 rounded-2xl shadow-xl hidden sm:block max-w-xs">
                <p className="text-2xl font-bold">100% Organic</p>
                <p className="text-xs text-green-100 mt-1">
                  Dedicated to sustainable crop production and clean soil preservation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Our Core Principles</h2>
            <p className="text-gray-500">The guiding values that drive Genesis Agri Business every day</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-green-50/60 border border-green-100 text-center space-y-4 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-green-600 text-white flex items-center justify-center mx-auto shadow-md">
                <ShieldCheck size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Uncompromising Quality</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Every seed, fertilizer blend, and tool is thoroughly tested to guarantee high germination and reliability.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-green-50/60 border border-green-100 text-center space-y-4 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-green-600 text-white flex items-center justify-center mx-auto shadow-md">
                <Globe size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Global Standards</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                We adhere to international organic farming standards, serving domestic growers and international export partners.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-green-50/60 border border-green-100 text-center space-y-4 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-green-600 text-white flex items-center justify-center mx-auto shadow-md">
                <HeartHandshake size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Farmer-First Commitment</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Our team provides 24/7 customer support and agronomy consultation to ensure your farming journey succeeds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-green-800 via-emerald-800 to-green-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold">Ready to Elevate Your Farm Yields?</h2>
          <p className="text-green-100 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Explore our curated catalog of agricultural supplies, fertilizers, seeds, and equipment with direct farm delivery.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 bg-white text-green-800 font-bold px-8 py-3.5 rounded-xl hover:bg-green-50 transition-all shadow-lg hover:scale-105"
            >
              Explore Products
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-green-700/50 backdrop-blur text-white font-bold px-8 py-3.5 rounded-xl hover:bg-green-700/70 border border-green-500/30 transition-all"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
