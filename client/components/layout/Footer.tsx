// components/layout/Footer.tsx
"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSettings } from "@/hooks/useSettings";
import { useLanguage } from "@/context/LanguageContext";

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
  const { settings } = useSettings();
  const { t } = useLanguage();

  if (isAdminRoute) {
    return null;
  }

  const contactEmail = settings?.contactEmail || 'info@genesisagri.com';
  const contactPhone = settings?.contactPhone || '+251 900 000 000';
  const contactAddress = settings?.contactAddress || 'Addis Ababa, Ethiopia';
  const siteName = settings?.siteName || 'Genesis Agri Business';
  const logoUrl = settings?.logo || '';

  return (
    <footer className="bg-[#081b12] text-white">
      <div className="mx-auto grid w-[min(1180px,calc(100%-48px))] grid-cols-[2fr_1fr_1.4fr_1fr] gap-11 py-16 max-lg:grid-cols-3 max-sm:grid-cols-2">
        <div className="max-sm:col-span-2">
          <Link href="/" className="mb-5 flex items-center gap-3">
            {logoUrl ? (
              <div className="relative h-9 w-9 flex items-center justify-center">
                <Image
                  src={logoUrl}
                  alt={siteName}
                  width={36}
                  height={36}
                  className="object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = "none";
                  }}
                />
              </div>
            ) : (
              <BrandMark />
            )}

            <span className="grid gap-[3px] leading-none">
              <strong className="text-[16px] tracking-[0.12em] font-serif">
                {siteName.toUpperCase()}
              </strong>
              {settings?.siteDescription && (
                <small className="text-[8px] tracking-[0.18em] opacity-75 line-clamp-1">
                  {settings.siteDescription.toUpperCase()}
                </small>
              )}
            </span>
          </Link>

          <p className="text-[11px] leading-[1.8] text-white/40">
            {t("footer.tagline_1", "Fresh agriculture. Fair prices.")}
            <br />
            {t("footer.tagline_2", "A shorter journey from farm to table.")}
          </p>
        </div>

        <div className="grid content-start gap-2">
          <h4 className="mb-2 text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--lime)]">
            {t("footer.explore", "Explore")}
          </h4>

          <Link
            href="/#products"
            className="text-[11px] text-white/60 transition hover:text-white"
          >
            {t("footer.our_products", "Our Products")}
          </Link>

          <Link
            href="/#tana-farm"
            className="text-[11px] text-white/60 transition hover:text-white"
          >
            {t("footer.tana_farm", "Tana Farm")}
          </Link>

          <Link
            href="/about"
            className="text-[11px] text-white/60 transition hover:text-white"
          >
            {t("footer.about_us", "About Us")}
          </Link>

          <Link
            href="/blog"
            className="text-[11px] text-white/60 transition hover:text-white"
          >
            {t("footer.our_blogs", "Our Blogs")}
          </Link>
        </div>

        <div className="grid content-start gap-2">
          <h4 className="mb-2 text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--lime)]">
            {t("footer.contact", "Contact")}
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

          {settings?.enableWhatsApp && settings?.whatsAppNumber && (
            <a
              href={`https://wa.me/${settings.whatsAppNumber.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-[var(--lime)] transition hover:underline"
            >
              {t("footer.whatsapp_support", "WhatsApp Support ↗")}
            </a>
          )}

          <span className="text-[11px] text-white/60">
            {contactAddress}
          </span>
        </div>

        <div className="grid content-start gap-2">
          <h4 className="mb-2 text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--lime)]">
            {t("footer.follow", "Follow")}
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
          © {new Date().getFullYear()} {siteName}. {t("footer.all_rights_reserved", "All rights reserved.")}
        </span>

        <span>{t("footer.built_around", "Built around the farm-to-table idea.")}</span>
      </div>
    </footer>
  );
};

export default Footer;