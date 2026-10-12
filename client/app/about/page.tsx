// app/about/page.tsx
'use client';

import React, { useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Factory,
  ArrowRight,
  CheckCircle,
  HeartHandshake,
  ShieldCheck,
  Recycle,
} from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';
import { useLanguage } from '@/context/LanguageContext';

// ============================================================
// ✅ Hydration-safe "mounted" hook
//    Returns false on the server + first client render
//    Returns true after the component has hydrated
// ============================================================
const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function useMounted() {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}

// ─── Default fallback (must match between server and client) ───
const DEFAULT_SITE_NAME = 'Alemayehu Plastic Manufacturing';

export default function AboutPage() {
  const { settings } = useSettings();
  const { t } = useLanguage();
  const mounted = useMounted();

  // ✅ CRITICAL: On server + first client render → use the default.
  //    Only after mount → use the real settings value.
  //    This guarantees the server HTML matches the client's first render.
  const siteName = mounted
    ? settings?.siteName || DEFAULT_SITE_NAME
    : DEFAULT_SITE_NAME;

  const siteDescription = mounted ? settings?.siteDescription || '' : '';

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative min-h-[320px] md:min-h-[380px] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/banners/carplastik.jpg)',
            backgroundColor: '#1a1410',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a1410]/95 via-[#1a1410]/80 to-[#2a1f18]/90" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center text-white py-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 leading-tight font-serif">
            {t('about.hero_title_prefix', 'About')}{' '}
            <span className="text-yellow-400">{siteName}</span>
          </h1>
          <p className="text-sm md:text-base text-yellow-100 max-w-2xl mx-auto leading-relaxed">
            {siteDescription ||
              t(
                'about.hero_subtitle',
                'Manufacturing durable, high-quality plastic products for homes, businesses and industries — engineered with precision and built to last.'
              )}
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Story Content */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-yellow-700 uppercase tracking-wider bg-yellow-100 px-2.5 py-1 rounded-full">
                <Factory size={12} />
                {t('about.heritage_badge', 'Our Heritage')}
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                {t(
                  'about.story_title',
                  'Engineering Reliable Plastic Solutions for Modern Ethiopia'
                )}
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                {t(
                  'about.story_p1_before',
                  'Founded with a commitment to quality craftsmanship,'
                )}{' '}
                <strong>{siteName}</strong>{' '}
                {t(
                  'about.story_p1_after',
                  'has grown from a small local workshop into a trusted national plastic manufacturer.'
                )}
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
                {t(
                  'about.story_p2',
                  'We combine modern manufacturing technology with carefully selected raw materials. From durable containers to precision industrial components, we produce plastic products that serve Ethiopian homes, businesses and industries reliably.'
                )}
              </p>

              <div className="space-y-2 pt-1">
                {[
                  t(
                    'about.feature_1',
                    '100% Quality-Tested Plastic Products'
                  ),
                  t(
                    'about.feature_2',
                    'Recyclable & Eco-Friendly Manufacturing'
                  ),
                  t(
                    'about.feature_3',
                    'Nationwide Distribution & Delivery Support'
                  ),
                  t(
                    'about.feature_4',
                    'Fair Pricing & Direct Business Partnerships'
                  ),
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <CheckCircle
                      className="text-yellow-500 flex-shrink-0"
                      size={14}
                    />
                    <span className="text-xs font-semibold text-gray-800">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual Image */}
            <div className="relative">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl border-4 border-white">
                <Image
                  src="/banners/carplastik.jpg"
                  alt={`${siteName} factory floor`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-12 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {t('about.values_title', 'Our Core Principles')}
            </h2>
            <p className="text-sm text-gray-500">
              {t(
                'about.values_subtitle_prefix',
                'The guiding values that drive'
              )}{' '}
              {siteName} {t('about.values_subtitle_suffix', 'every day')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-yellow-50/60 border border-yellow-100 text-center space-y-3 hover:shadow-lg transition-shadow">
              <div className="w-11 h-11 rounded-2xl bg-yellow-500 text-white flex items-center justify-center mx-auto shadow-md">
                <ShieldCheck size={22} />
              </div>
              <h3 className="text-base font-bold text-gray-900">
                {t('about.value_quality_title', 'Uncompromising Quality')}
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                {t(
                  'about.value_quality_desc',
                  'Every plastic product is thoroughly tested to guarantee durability, safety and consistency.'
                )}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-yellow-50/60 border border-yellow-100 text-center space-y-3 hover:shadow-lg transition-shadow">
              <div className="w-11 h-11 rounded-2xl bg-yellow-500 text-white flex items-center justify-center mx-auto shadow-md">
                <Recycle size={22} />
              </div>
              <h3 className="text-base font-bold text-gray-900">
                {t('about.value_global_title', 'Industrial Standards')}
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                {t(
                  'about.value_global_desc',
                  'We adhere to modern manufacturing standards, serving domestic buyers and industrial partners.'
                )}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-yellow-50/60 border border-yellow-100 text-center space-y-3 hover:shadow-lg transition-shadow">
              <div className="w-11 h-11 rounded-2xl bg-yellow-500 text-white flex items-center justify-center mx-auto shadow-md">
                <HeartHandshake size={22} />
              </div>
              <h3 className="text-base font-bold text-gray-900">
                {t(
                  'about.value_customer_title',
                  'Customer-First Commitment'
                )}
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                {t(
                  'about.value_customer_desc',
                  'Our team provides full customer support and technical guidance to ensure your business succeeds.'
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-14 bg-gradient-to-r from-[#1a1410] via-[#2a1f18] to-[#3a2a1e] text-white">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-5">
          <h2 className="text-2xl sm:text-3xl font-bold">
            {t(
              'about.cta_title',
              'Ready to Source Quality Plastic Products?'
            )}
          </h2>
          <p className="text-yellow-100 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            {t(
              'about.cta_subtitle',
              'Explore our catalog of plastic containers, household items, industrial parts and custom-manufactured products.'
            )}
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-1">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 bg-yellow-500 text-[#1a1410] font-bold px-6 py-3 rounded-xl hover:bg-yellow-400 transition-all shadow-lg hover:scale-105 text-sm"
            >
              {t('about.cta_explore', 'Explore Products')}
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur text-white font-bold px-6 py-3 rounded-xl hover:bg-white/20 border border-yellow-400/40 transition-all text-sm"
            >
              {t('about.cta_contact', 'Contact Us')}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}