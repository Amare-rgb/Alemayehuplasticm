// components/layout/Footer.tsx
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSettings } from "@/hooks/useSettings";

function BrandMark() {
  return (
    <span className="brand-mark shrink-0" aria-hidden="true">
      <span className="leaf leaf-one" />
      <span className="leaf leaf-two" />
      <span className="stem" />
    </span>
  );
}

export const Footer = () => {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin") || false;
  const { settings, loading } = useSettings(true);

  if (isAdminRoute) {
    return null;
  }

  // Use settings values with fallbacks
  const contactEmail = settings?.contactEmail || 'info@genesisagrobusiness.com';
  const contactPhone = settings?.contactPhone || '+251 900 000 000';
  const contactAddress = settings?.contactAddress || 'Ethiopia';
  const siteName = settings?.siteName || 'GENESIS';

  return (
    <footer className="bg-[#081b12] text-white">
      <div className="mx-auto grid w-[min(1180px,calc(100%-48px))] grid-cols-[2fr_1fr_1.4fr_1fr] gap-11 py-16 max-lg:grid-cols-3 max-sm:grid-cols-2">
        <div className="max-sm:col-span-2">
          <Link href="/" className="mb-5 flex items-center gap-3">
            <BrandMark />

            <span className="grid gap-[5px] leading-none">
              <strong className="text-[18px] tracking-[0.16em]">
                {siteName.toUpperCase()}
              </strong>

              <small className="text-[8px] tracking-[0.22em] opacity-75">
                AGRO-BUSINESS
              </small>
            </span>
          </Link>

          <p className="text-[11px] leading-[1.8] text-white/40">
            Fresh agriculture. Fair prices.
            <br />
            A shorter journey from farm to table.
          </p>
        </div>

        <div className="grid content-start gap-2">
          <h4 className="mb-2 text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--lime)]">
            Explore
          </h4>

          <Link
            href="/#products"
            className="text-[11px] text-white/60 transition hover:text-white"
          >
            Our Products
          </Link>

          <Link
            href="/#tana-farm"
            className="text-[11px] text-white/60 transition hover:text-white"
          >
            Tana Farm
          </Link>

          <Link
            href="/about"
            className="text-[11px] text-white/60 transition hover:text-white"
          >
            About Us
          </Link>

          <Link
            href="/blog"
            className="text-[11px] text-white/60 transition hover:text-white"
          >
            Our Blogs
          </Link>
        </div>

        <div className="grid content-start gap-2">
          <h4 className="mb-2 text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--lime)]">
            Contact
          </h4>

          <a
            href={`mailto:${contactEmail}`}
            className="text-[11px] text-white/60 transition hover:text-white break-all"
          >
            {contactEmail}
          </a>

          <a
            href={`tel:${contactPhone.replace(/\s/g, '')}`}
            className="text-[11px] text-white/60 transition hover:text-white"
          >
            {contactPhone}
          </a>

          <span className="text-[11px] text-white/60">
            {contactAddress}
          </span>
        </div>

        <div className="grid content-start gap-2">
          <h4 className="mb-2 text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--lime)]">
            Follow
          </h4>

          <a
            href="#"
            className="text-[11px] text-white/60 transition hover:text-white"
          >
            Facebook ↗
          </a>

          <a
            href="#"
            className="text-[11px] text-white/60 transition hover:text-white"
          >
            Instagram ↗
          </a>

          <a
            href="#"
            className="text-[11px] text-white/60 transition hover:text-white"
          >
            Telegram ↗
          </a>
        </div>
      </div>

      <div className="mx-auto flex w-[min(1180px,calc(100%-48px))] justify-between border-t border-white/10 py-5 text-[9px] text-white/30 max-sm:flex-col max-sm:gap-2">
        <span>
          © {new Date().getFullYear()} Genesis Agro-business. All rights
          reserved.
        </span>

        <span>Built around the farm-to-table idea.</span>
      </div>
    </footer>
  );
};

export default Footer;