// components/layout/Footer.tsx
"use client";

import React, { useSyncExternalStore } from "react";
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


const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function useMounted() {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}

export const Footer = () => {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin") || false;
  const { settings, loading } = useSettings();
  const { t } = useLanguage();

  // Use consistent fallback values that match between server and client
  const DEFAULT_EMAIL = 'info@genesisagri.com';
  const DEFAULT_PHONE = '+251 900 000 000';
  const DEFAULT_ADDRESS = 'Addis Ababa, Ethiopia';
  const DEFAULT_SITE_NAME = 'Genesis Agri Business';
  const DEFAULT_SITE_DESCRIPTION = '';

  const mounted = useMounted();

  // Only use settings values after client-side mount
  const contactEmail = mounted ? (settings?.contactEmail || DEFAULT_EMAIL) : DEFAULT_EMAIL;
  const contactPhone = mounted ? (settings?.contactPhone || DEFAULT_PHONE) : DEFAULT_PHONE;
  const contactAddress = mounted ? (settings?.contactAddress || DEFAULT_ADDRESS) : DEFAULT_ADDRESS;
  const siteName = mounted ? (settings?.siteName || DEFAULT_SITE_NAME) : DEFAULT_SITE_NAME;
  const logoUrl = mounted ? (settings?.logo || '') : '';
  const siteDescription = mounted ? (settings?.siteDescription || DEFAULT_SITE_DESCRIPTION) : DEFAULT_SITE_DESCRIPTION;
  const enableWhatsApp = mounted ? (settings?.enableWhatsApp || false) : false;
  const whatsAppNumber = mounted ? (settings?.whatsAppNumber || '') : '';

  if (isAdminRoute) {
    return null;
  }

  // Use a static year to avoid hydration mismatch
  const currentYear = 2026;

  // Render content based on mounted state
  const renderContent = () => {
    // This ensures both server and client render the same HTML initially
    const showDescription = mounted && siteDescription;

    return (
      <footer className="bg-[#081b12] text-white">
        <div className="mx-auto grid w-[min(1180px,calc(100%-48px))] grid-cols-[2fr_1fr_1.4fr_1fr] gap-11 py-16 max-lg:grid-cols-3 max-sm:grid-cols-2">
          <div className="max-sm:col-span-2">
            <Link href="/" className="mb-5 flex items-center gap-3">
              <div className="relative h-10 w-10 rounded-full overflow-hidden flex items-center justify-center bg-[#0b2419] border border-white/10 shadow-sm flex-shrink-0">
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt={siteName}
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      // Show fallback brand mark on error
                      const parent = (e.currentTarget as HTMLElement).parentElement;
                      if (parent) {
                        const fallback = document.createElement('span');
                        fallback.className = 'brand-mark shrink-0';
                        fallback.innerHTML = '<span class="leaf leaf-one"></span><span class="leaf leaf-two"></span><span class="stem"></span>';
                        parent.appendChild(fallback);
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }
                    }}
                  />
                ) : (
                  <BrandMark />
                )}
              </div>

              <span className="grid gap-[3px] leading-none">
                <strong className="text-[16px] tracking-[0.12em] font-serif">
                  {siteName.toUpperCase()}
                </strong>
                {showDescription && (
                  <small className="text-[8px] tracking-[0.18em] opacity-75 line-clamp-1">
                    {siteDescription.toUpperCase()}
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

            {enableWhatsApp && whatsAppNumber && (
              <a
                href={`https://wa.me/${whatsAppNumber.replace(/[^0-9]/g, '')}`}
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
            © {currentYear} {siteName}. {t("footer.all_rights_reserved", "All rights reserved.")}
          </span>

          <span>{t("footer.built_around", "Built around the farm-to-table idea.")}</span>
        </div>
      </footer>
    );
  };

  return renderContent();
};

export default Footer;