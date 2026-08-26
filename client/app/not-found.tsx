"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, Home, ShoppingBag, BookOpen, Info, Phone } from "lucide-react";

/* ─── Brand mark (leaf logo) — mirrors the one in Navbar/Footer ─── */
function BrandMark({ size = 1 }: { size?: number }) {
  const w = 28 * size;
  const h = 32 * size;
  return (
    <span
      className="brand-mark shrink-0"
      aria-hidden="true"
      style={{ width: w, height: h }}
    >
      <span className="leaf leaf-one" style={{ width: 15 * size, height: 22 * size }} />
      <span className="leaf leaf-two" style={{ width: 15 * size, height: 22 * size }} />
      <span className="stem" style={{ height: 26 * size, left: 13 * size, top: 5 * size }} />
    </span>
  );
}

/* ─── Floating leaf SVG decoration ─── */
function FloatingLeaf({
  className,
  delay = 0,
  size = 60,
  opacity = 0.08,
}: {
  className?: string;
  delay?: number;
  size?: number;
  opacity?: number;
}) {
  return (
    <span
      className={`pointer-events-none absolute ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 60 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ opacity }}
      >
        <ellipse
          cx="22"
          cy="18"
          rx="18"
          ry="28"
          fill="#b9d873"
          transform="rotate(-25 22 18)"
        />
        <ellipse
          cx="38"
          cy="28"
          rx="15"
          ry="22"
          fill="#b9d873"
          transform="rotate(45 38 28)"
          style={{ opacity: 0.7 }}
        />
        <rect x="29" y="10" width="2.5" height="36" rx="1.25" fill="#b9d873" transform="rotate(20 29 10)" />
      </svg>
    </span>
  );
}

/* ─── Quick-link cards ─── */
const quickLinks = [
  { href: "/", label: "Home", desc: "Back to where it all begins", icon: Home },
  { href: "/shop", label: "Shop Fresh", desc: "Browse all produce & crops", icon: ShoppingBag },
  { href: "/about", label: "About Us", desc: "Our story & mission", icon: Info },
  { href: "/blog", label: "Blog", desc: "Agri-insights & farm news", icon: BookOpen },
  { href: "/contact", label: "Contact", desc: "Get in touch with us", icon: Phone },
];

export default function NotFound() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main
      className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-6 py-24"
      style={{ background: "var(--cream)" }}
    >
      {/* ── Decorative floating leaves ─────────────────────────── */}
      <FloatingLeaf className="left-[5%] top-[8%] animate-[floatA_9s_ease-in-out_infinite]" size={90} opacity={0.09} delay={0} />
      <FloatingLeaf className="right-[7%] top-[14%] animate-[floatB_11s_ease-in-out_infinite]" size={64} opacity={0.06} delay={1.5} />
      <FloatingLeaf className="left-[12%] bottom-[10%] animate-[floatB_13s_ease-in-out_infinite]" size={50} opacity={0.07} delay={3} />
      <FloatingLeaf className="right-[4%] bottom-[18%] animate-[floatA_10s_ease-in-out_infinite]" size={78} opacity={0.05} delay={0.8} />
      <FloatingLeaf className="left-[38%] top-[3%] animate-[floatB_8s_ease-in-out_infinite]" size={36} opacity={0.08} delay={2} />

      {/* ── Large decorative "404" background text ─────────────── */}
      <span
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none font-serif text-[clamp(160px,28vw,360px)] font-black leading-none tracking-[-0.05em]"
        style={{ color: "var(--green-950)", opacity: 0.04 }}
        aria-hidden="true"
      >
        404
      </span>

      {/* ── Main card ──────────────────────────────────────────── */}
      <div
        className={`relative z-10 flex flex-col items-center text-center transition-all duration-700 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        {/* Brand logo */}
        <Link href="/" className="group mb-8 flex items-center gap-3 no-underline">
          <BrandMark size={1.5} />
          <span className="grid gap-[5px] leading-none">
            <strong
              className="text-[22px] tracking-[0.16em]"
              style={{ color: "var(--green-900)", fontFamily: "var(--sans)" }}
            >
              GENESIS
            </strong>
            <small
              className="text-[8px] tracking-[0.22em]"
              style={{ color: "var(--muted)" }}
            >
              AGRO-BUSINESS
            </small>
          </span>
        </Link>

        {/* Error badge */}
        <span
          className="mb-5 inline-block rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em]"
          style={{
            background: "var(--green-950)",
            color: "var(--lime)",
          }}
        >
          Error 404 — Page Not Found
        </span>

        {/* Heading */}
        <h1
          className="mb-4 text-[clamp(40px,7vw,72px)] font-normal leading-[1.05] tracking-[-0.025em]"
          style={{ fontFamily: "var(--serif)", color: "var(--ink)" }}
        >
          Lost in the fields?
        </h1>

        {/* Sub-copy */}
        <p
          className="mb-10 max-w-[480px] text-[15px] leading-relaxed"
          style={{ color: "var(--muted)" }}
        >
          The page you&apos;re looking for has wandered off — it may have been
          moved, harvested, or never planted here. Let&rsquo;s get you back on
          the right path.
        </p>

        {/* Primary CTAs */}
        <div className="mb-16 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            id="not-found-home-cta"
            className="group flex items-center gap-3 rounded-full px-7 py-3.5 text-sm font-bold uppercase tracking-[0.08em] text-white shadow-lg transition-all duration-300 hover:scale-[1.03] hover:shadow-xl"
            style={{ background: "var(--green-900)" }}
          >
            Go Home
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full transition-transform duration-300 group-hover:rotate-45"
              style={{ background: "var(--lime)", color: "var(--green-950)" }}
            >
              <ArrowUpRight size={14} strokeWidth={2.5} />
            </span>
          </Link>

          <Link
            href="/shop"
            id="not-found-shop-cta"
            className="flex items-center gap-2 rounded-full border px-7 py-3.5 text-sm font-semibold transition-all duration-300 hover:scale-[1.03] hover:shadow-md"
            style={{
              borderColor: "var(--green-700)",
              color: "var(--green-800)",
            }}
          >
            Shop Fresh
          </Link>
        </div>

        {/* Divider */}
        <div className="mb-8 flex w-full max-w-[640px] items-center gap-4">
          <span className="h-px flex-1" style={{ background: "var(--line)" }} />
          <span
            className="text-[10px] font-bold uppercase tracking-[0.2em]"
            style={{ color: "var(--muted)" }}
          >
            Or explore
          </span>
          <span className="h-px flex-1" style={{ background: "var(--line)" }} />
        </div>

        {/* Quick-links grid */}
        <div className="grid w-full max-w-[640px] grid-cols-2 gap-3 sm:grid-cols-3">
          {quickLinks.map(({ href, label, desc, icon: Icon }, i) => (
            <Link
              key={href}
              href={href}
              id={`not-found-link-${label.toLowerCase().replace(/\s+/g, "-")}`}
              className="group flex flex-col gap-2.5 rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
              style={{
                borderColor: "var(--line)",
                background: "white",
                transitionDelay: `${i * 60}ms`,
              }}
            >
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: "var(--cream-dark)" }}
              >
                <Icon
                  size={17}
                  style={{ color: "var(--green-800)" }}
                  className="transition-transform duration-300 group-hover:scale-110"
                />
              </span>
              <span>
                <strong
                  className="block text-[13px] font-semibold leading-snug"
                  style={{ color: "var(--ink)" }}
                >
                  {label}
                </strong>
                <span className="text-[11px] leading-snug" style={{ color: "var(--muted)" }}>
                  {desc}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Keyframe animations ────────────────────────────────── */}
      <style>{`
        @keyframes floatA {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33%       { transform: translateY(-18px) rotate(6deg); }
          66%       { transform: translateY(-8px) rotate(-4deg); }
        }
        @keyframes floatB {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          40%       { transform: translateY(-14px) rotate(-8deg); }
          70%       { transform: translateY(-22px) rotate(3deg); }
        }
      `}</style>
    </main>
  );
}
