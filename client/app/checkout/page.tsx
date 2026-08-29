// app/checkout/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ShoppingBag,
  Truck,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Building2,
  CreditCard,
  Smartphone,
  Wallet,
  Coins,
  Sparkles,
  X,
  ExternalLink,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/app/providers";
import toast from "react-hot-toast";

type PaymentMethodId = "telebirr" | "bank" | "chapa" | "cash";

interface PaymentOption {
  id: PaymentMethodId;
  name: string;
  badge?: string;
  icon: React.ReactNode;
  tagline: string;
  instructions: string;
  details?: { label: string; value: string }[];
}

// ── FIX: Define proper types ──────────────────────────────────────────────
interface OrderInfo {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  address: string;
  notes: string;
  paymentMethod: string;
  totalAmount: number;
  itemCount: number;
  units: number;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  image: string;
}

const paymentOptions: PaymentOption[] = [
  {
    id: "telebirr",
    name: "Telebirr Mobile Money",
    badge: "Most Popular",
    icon: <Smartphone className="h-5 w-5 text-[#28633e]" />,
    tagline: "Instant mobile transfer via Telebirr SuperApp or USSD (*127#)",
    instructions: "Transfer to our official Telebirr merchant account upon order confirmation.",
    details: [
      { label: "Merchant Name", value: "Genesis Agri Enterprise" },
      { label: "Merchant / Phone ID", value: "+251 911 234 567" },
      { label: "Till / Short Code", value: "889922" },
    ],
  },
  {
    id: "bank",
    name: "Commercial Bank Transfer",
    badge: "Direct Account",
    icon: <Building2 className="h-5 w-5 text-[#28633e]" />,
    tagline: "Deposit or mobile banking transfer via CBE, Awash, or Dashen",
    instructions: "Direct bank transfer. You can upload or SMS the transaction reference number.",
    details: [
      { label: "CBE Account", value: "1000 4567 8901 2345 (Genesis Agri PLC)" },
      { label: "Awash Bank", value: "0132 0891 2345 00 (Genesis Agri PLC)" },
      { label: "Branch", value: "Bole Central, Addis Ababa" },
    ],
  },
  {
    id: "chapa",
    name: "Chapa Payment Gateway",
    badge: "Cards & Digital Wallets",
    icon: <CreditCard className="h-5 w-5 text-[#28633e]" />,
    tagline: "Pay with local debit cards, CBE Birr, or international Mastercard/Visa",
    instructions: "Seamless card and multi-wallet checkout powered by Chapa Ethiopia.",
    details: [
      { label: "Supported", value: "Telebirr, CBE Birr, AwashBirr, Visa & Mastercard" },
      { label: "Security", value: "256-bit Encrypted SSL Gateway" },
    ],
  },
  {
    id: "cash",
    name: "Cash on Delivery",
    badge: "Pay at Doorstep",
    icon: <Coins className="h-5 w-5 text-[#28633e]" />,
    tagline: "Inspect fresh produce and pay cash directly to the dispatch driver",
    instructions: "Available for deliveries within Addis Ababa and surrounding agricultural zones.",
    details: [
      { label: "Inspection", value: "100% Quality verification before payment" },
      { label: "Exact Change", value: "Drivers carry change up to 1,000 ETB" },
    ],
  },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { user, status } = useAuth();
  const { items, cartCount, totalUnits, cartTotal } = useCart();

  // Guest Form State
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [citySubcity, setCitySubcity] = useState("Addis Ababa - Bole");
  const [orderNotes, setOrderNotes] = useState("");

  // Payment Selection
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethodId>("telebirr");

  // Coming Soon Modal State
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [submittedOrderInfo, setSubmittedOrderInfo] = useState<OrderInfo | null>(null);

  const isAuthenticated = status === "authenticated" && !!user;

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      toast.error("Your cart is empty! Add products before checking out.");
      return;
    }

    // Validate Guest Inputs if not logged in
    if (!isAuthenticated) {
      if (!guestName.trim()) {
        toast.error("Please enter your full name.");
        return;
      }
      if (!guestPhone.trim() || guestPhone.trim().length < 9) {
        toast.error("Please provide a valid Ethiopian phone number (e.g. +251 9... or 09...).");
        return;
      }
      if (!deliveryAddress.trim()) {
        toast.error("Please provide your delivery address.");
        return;
      }
    } else {
      if (!deliveryAddress.trim()) {
        toast.error("Please enter your delivery address / landmark.");
        return;
      }
    }

    const orderSummaryPayload: OrderInfo = {
      customerName: isAuthenticated ? user?.name || "" : guestName,
      customerPhone: isAuthenticated ? user?.phone || "On File" : guestPhone,
      customerEmail: isAuthenticated ? user?.email || "" : guestEmail || "Not provided",
      address: `${citySubcity}, ${deliveryAddress}`,
      notes: orderNotes || "None",
      paymentMethod: paymentOptions.find((p) => p.id === selectedPayment)?.name || selectedPayment,
      totalAmount: cartTotal,
      itemCount: cartCount,
      units: totalUnits,
    };

    setSubmittedOrderInfo(orderSummaryPayload);
    setShowComingSoonModal(true);
  };

  return (
    <main className="min-h-screen bg-[var(--cream)] pb-24 pt-28 sm:pt-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-8">
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#28633e] hover:text-[#123523] transition"
          >
            <ArrowLeft size={14} />
            Back to Shopping Cart
          </Link>
          <div className="mt-2 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
            <h1 className="font-serif-heading text-3xl sm:text-4xl font-bold tracking-tight text-[#123523]">
              Checkout & Farm Dispatch
            </h1>
          </div>
        </div>

        {items.length === 0 ? (
          /* Empty Cart State */
          <div className="rounded-[2.5rem] border border-[rgba(20,33,25,.09)] bg-white p-12 sm:p-16 text-center shadow-[0_15px_45px_rgba(18,53,35,.06)]">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#f6f3e9] text-[#28633e]">
              <ShoppingBag size={38} />
            </div>
            <h2 className="font-serif-heading text-2xl sm:text-3xl font-bold text-[#123523]">
              Your cart is empty
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-[#69736b]">
              Please add fresh produce to your cart before proceeding to checkout.
            </p>
            <Link
              href="/shop"
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-[#123523] px-8 py-4 text-sm font-bold text-white shadow-lg hover:bg-[#19472d] transition"
            >
              Browse Fresh Produce Marketplace
            </Link>
          </div>
        ) : (
          /* Checkout Two-Column Layout */
          <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
            {/* Left Column: Customer Form & Payment Methods (7 Cols) */}
            <div className="lg:col-span-7 space-y-7">
              {/* 1. Customer & Delivery Information Card */}
              <div className="rounded-[2rem] border border-[rgba(20,33,25,.09)] bg-white p-6 sm:p-8 shadow-[0_10px_35px_rgba(18,53,35,.05)]">
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#123523] text-[var(--lime)] font-bold text-xs">
                      1
                    </span>
                    <h2 className="font-serif-heading text-xl font-bold text-[#123523]">
                      Customer & Delivery Details
                    </h2>
                  </div>

                  {isAuthenticated ? (
                    <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[11px] font-bold text-emerald-700">
                      ✓ Logged In Account
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-[11px] font-bold text-amber-800">
                      Guest Checkout (No Login Needed)
                    </span>
                  )}
                </div>

                {isAuthenticated ? (
                  /* Logged-In User Information Display */
                  <div className="mb-6 rounded-2xl bg-[#f6f3e9] p-4 border border-[#19472d]/10">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--lime)] text-[var(--green-950)] font-bold text-sm">
                        {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#123523] truncate">
                            {user?.name}
                          </span>
                          <span className="rounded-md bg-[#123523] px-2 py-0.5 text-[9px] font-bold uppercase text-[var(--lime)]">
                            {user?.role || "BUYER"}
                          </span>
                        </div>
                        <p className="text-xs text-[#69736b] truncate">{user?.email}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Guest Information Input Fields */
                  <div className="space-y-4 mb-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#123523] mb-1.5">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          placeholder="e.g. Abebe Kebede"
                          className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-xs font-medium text-[#123523] outline-none transition focus:border-[#28633e] focus:bg-white focus:ring-2 focus:ring-[#b9d873]/30"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#123523] mb-1.5">
                          Phone Number (Telebirr/SMS) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          value={guestPhone}
                          onChange={(e) => setGuestPhone(e.target.value)}
                          placeholder="e.g. 0911 234 567 or +251 9..."
                          className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-xs font-medium text-[#123523] outline-none transition focus:border-[#28633e] focus:bg-white focus:ring-2 focus:ring-[#b9d873]/30"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#123523] mb-1.5">
                        Email Address <span className="text-gray-400 font-normal">(Optional, for receipt)</span>
                      </label>
                      <input
                        type="email"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        placeholder="e.g. abebe@example.com"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-xs font-medium text-[#123523] outline-none transition focus:border-[#28633e] focus:bg-white focus:ring-2 focus:ring-[#b9d873]/30"
                      />
                    </div>
                  </div>
                )}

                {/* Delivery Location Section */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#123523] mb-1.5">
                        City & Subcity / Zone <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={citySubcity}
                        onChange={(e) => setCitySubcity(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-xs font-medium text-[#123523] outline-none transition focus:border-[#28633e] focus:bg-white focus:ring-2 focus:ring-[#b9d873]/30"
                      >
                        <option value="Addis Ababa - Bole">Addis Ababa — Bole</option>
                        <option value="Addis Ababa - Kirkos">Addis Ababa — Kirkos</option>
                        <option value="Addis Ababa - Yeka">Addis Ababa — Yeka</option>
                        <option value="Addis Ababa - Nifas Silk">Addis Ababa — Nifas Silk</option>
                        <option value="Addis Ababa - Arada">Addis Ababa — Arada</option>
                        <option value="Addis Ababa - Gulele">Addis Ababa — Gulele</option>
                        <option value="Addis Ababa - Akaki Kality">Addis Ababa — Akaki Kality</option>
                        <option value="Oromia - Bishoftu / Mojo">Oromia — Bishoftu / Mojo</option>
                        <option value="Oromia - Sebeta / Burayu">Oromia — Sebeta / Burayu</option>
                        <option value="Amhara - Bahir Dar">Amhara — Bahir Dar</option>
                        <option value="Other Agricultural Region">Other Agricultural Region</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#123523] mb-1.5">
                        Specific Street / Landmark / House # <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="e.g. Near Medhanialem Church, House 142"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-xs font-medium text-[#123523] outline-none transition focus:border-[#28633e] focus:bg-white focus:ring-2 focus:ring-[#b9d873]/30"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#123523] mb-1.5">
                      Order / Delivery Instructions <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="e.g. Please deliver in the morning, call upon arrival at the gate."
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-xs font-medium text-[#123523] outline-none transition focus:border-[#28633e] focus:bg-white focus:ring-2 focus:ring-[#b9d873]/30 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Payment Method Selection Card */}
              <div className="rounded-[2rem] border border-[rgba(20,33,25,.09)] bg-white p-6 sm:p-8 shadow-[0_10px_35px_rgba(18,53,35,.05)]">
                <div className="flex items-center gap-3 pb-4 mb-5 border-b border-gray-100">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#123523] text-[var(--lime)] font-bold text-xs">
                    2
                  </span>
                  <div>
                    <h2 className="font-serif-heading text-xl font-bold text-[#123523]">
                      Choose Payment Method
                    </h2>
                    <p className="text-xs text-[#69736b]">
                      Select how you would like to pay for your harvest produce
                    </p>
                  </div>
                </div>

                {/* Payment Options Accordion/Selector */}
                <div className="space-y-3.5">
                  {paymentOptions.map((opt) => {
                    const isSelected = selectedPayment === opt.id;

                    return (
                      <div
                        key={opt.id}
                        onClick={() => setSelectedPayment(opt.id)}
                        className={`cursor-pointer rounded-2xl border-2 p-4 transition-all ${
                          isSelected
                            ? "border-[#28633e] bg-[#f6f3e9]/70 shadow-md"
                            : "border-gray-200/80 bg-white hover:border-[#28633e]/40 hover:bg-gray-50/50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                                isSelected ? "bg-[#123523] text-[var(--lime)]" : "bg-[#f6f3e9] text-[#28633e]"
                              }`}
                            >
                              {opt.icon}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-sm text-[#123523]">{opt.name}</h3>
                                {opt.badge && (
                                  <span className="rounded-md bg-[#28633e]/10 border border-[#28633e]/20 px-2 py-0.5 text-[9px] font-bold uppercase text-[#28633e]">
                                    {opt.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#69736b] mt-0.5">{opt.tagline}</p>
                            </div>
                          </div>

                          <div
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
                              isSelected ? "border-[#28633e] bg-[#28633e] text-white" : "border-gray-300 bg-white"
                            }`}
                          >
                            {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                          </div>
                        </div>

                        {/* Selected Payment Details */}
                        {isSelected && (
                          <div className="mt-4 pt-3.5 border-t border-[#19472d]/10 space-y-2 text-xs">
                            <p className="text-[#28633e] font-semibold">{opt.instructions}</p>
                            {opt.details && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 bg-white/80 p-3 rounded-xl border border-[#19472d]/10">
                                {opt.details.map((d, idx) => (
                                  <div key={idx} className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-[#69736b]">
                                      {d.label}
                                    </span>
                                    <span className="font-bold text-[#123523]">{d.value}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Company & Warehouse Information Card */}
              <div className="rounded-[2rem] border border-[rgba(20,33,25,.09)] bg-white p-6 sm:p-7 shadow-[0_10px_35px_rgba(18,53,35,.04)]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--lime)] text-[var(--green-950)] font-bold">
                    <Building2 size={16} />
                  </div>
                  <div>
                    <h3 className="font-serif-heading text-lg font-bold text-[#123523]">
                      Genesis Agri Enterprises PLC
                    </h3>
                    <p className="text-xs text-[#69736b]">
                      Registered agricultural cooperative & fresh produce hub
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-start gap-2.5 rounded-xl bg-[#f6f3e9]/60 p-3">
                    <MapPin size={16} className="text-[#28633e] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-[#123523] block">Central Dispatch Hub</span>
                      <span className="text-[#69736b]">Bole Subcity, Agri Logistics Center, Addis Ababa, Ethiopia</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 rounded-xl bg-[#f6f3e9]/60 p-3">
                    <Phone size={16} className="text-[#28633e] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-[#123523] block">Direct Support Hotlines</span>
                      <span className="text-[#69736b]">+251 911 234 567 / +251 922 345 678</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 rounded-xl bg-[#f6f3e9]/60 p-3">
                    <Mail size={16} className="text-[#28633e] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-[#123523] block">Official Email</span>
                      <span className="text-[#69736b]">orders@genesisagri.com</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 rounded-xl bg-[#f6f3e9]/60 p-3">
                    <Truck size={16} className="text-[#28633e] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-[#123523] block">Dispatch Hours</span>
                      <span className="text-[#69736b]">Monday – Saturday: 7:00 AM – 7:00 PM</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Order Summary & Place Order (5 Cols) */}
            <div className="lg:col-span-5 sticky top-28 space-y-4">
              <div className="rounded-[2.5rem] border border-[rgba(20,33,25,.09)] bg-white p-6 sm:p-7 shadow-[0_15px_45px_rgba(18,53,35,.07)]">
                <h2 className="font-serif-heading text-2xl font-bold text-[#123523] pb-4 border-b border-gray-100">
                  Order Summary ({cartCount} produce items)
                </h2>

                {/* Item List Scroll Area */}
                <div className="mt-4 max-h-[300px] overflow-y-auto space-y-3 pr-1 divide-y divide-gray-100">
                  {(items as CartItem[]).map((item) => (
                    <div key={item.id} className="pt-3 first:pt-0 flex items-center gap-3">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#0b2419] border border-[#16412c]/20">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80";
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs text-[#123523] truncate">{item.name}</h4>
                        <span className="text-[11px] text-[#69736b]">
                          {item.quantity} {item.unit} × ETB {item.price.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-serif-heading text-sm font-bold text-[#123523]">
                          ETB {(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Calculation Breakdown */}
                <div className="mt-6 pt-4 border-t border-gray-100 space-y-3 text-xs text-[#69736b]">
                  <div className="flex justify-between items-center">
                    <span>Produce Subtotal ({totalUnits} total units)</span>
                    <span className="font-bold text-[#123523] text-sm">
                      ETB {cartTotal.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span>Farm Packaging & Cold Storage</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      Included Free
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span>Farm Direct Dispatch</span>
                    <span className="font-bold text-[#28633e]">Free Local Dispatch</span>
                  </div>

                  <div className="my-2 h-px bg-gray-100" />

                  <div className="flex justify-between items-baseline pt-1">
                    <span className="font-serif-heading text-base font-bold text-[#123523]">
                      Total Due
                    </span>
                    <span className="font-serif-heading text-2xl font-bold text-[#123523]">
                      ETB {cartTotal.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Primary Place Order CTA */}
                <button
                  type="submit"
                  className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#123523] px-6 text-sm font-bold text-white shadow-lg transition-all duration-200 hover:bg-[#19472d] hover:text-[var(--lime)] hover:shadow-xl hover:-translate-y-0.5"
                >
                  <Sparkles size={16} />
                  <span>Confirm & Place Order</span>
                  <span className="font-bold text-base">→</span>
                </button>

                <p className="mt-3 text-center text-[11px] text-[#69736b]">
                  🔒 Secured checkout • Official agricultural distribution
                </p>
              </div>

              {/* Guarantees Box */}
              <div className="rounded-2xl bg-white p-4 border border-[rgba(20,33,25,.07)] space-y-2.5 text-xs">
                <div className="flex items-center gap-2.5 text-[#123523] font-semibold">
                  <ShieldCheck size={16} className="text-[#28633e]" />
                  <span>100% Quality & Freshness Guarantee</span>
                </div>
                <div className="flex items-center gap-2.5 text-[#123523] font-semibold">
                  <Truck size={16} className="text-[#28633e]" />
                  <span>Fast Delivery within 24 Hours of Harvest</span>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* =====================================================
          COMING SOON MODAL / ALERT DIALOG
      ====================================================== */}
      {showComingSoonModal && submittedOrderInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] border border-[#1e4d35] bg-[#071a11] p-6 sm:p-8 text-white shadow-[0_25px_70px_rgba(0,0,0,0.9)] animate-scale-in">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowComingSoonModal(false)}
              className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            {/* Header Badge */}
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--lime)] mb-3">
              <Sparkles size={16} />
              <span>Feature In Development</span>
            </div>

            <h3 className="font-serif-heading text-2xl sm:text-3xl font-bold text-white leading-tight">
              Online Automated Checkout Coming Soon!
            </h3>

            <p className="mt-3 text-xs sm:text-sm leading-relaxed text-white/70">
              Thank you for exploring our agricultural marketplace! Automated online payment verification for Telebirr, CBE Bank & Chapa is currently in final testing and will be enabled soon.
            </p>

            {/* Order Review Box */}
            <div className="my-5 rounded-2xl bg-[#0b2419] p-4 border border-[#16412c] text-xs space-y-2">
              <h4 className="font-bold text-[var(--lime)] uppercase tracking-wider text-[11px] mb-2">
                📋 Your Order Preview Summary:
              </h4>
              <div className="flex justify-between text-white/80">
                <span>Customer:</span>
                <span className="font-bold text-white">{submittedOrderInfo.customerName}</span>
              </div>
              <div className="flex justify-between text-white/80">
                <span>Contact Phone:</span>
                <span className="font-bold text-white">{submittedOrderInfo.customerPhone}</span>
              </div>
              <div className="flex justify-between text-white/80">
                <span>Delivery Address:</span>
                <span className="font-bold text-white text-right max-w-[200px] truncate">
                  {submittedOrderInfo.address}
                </span>
              </div>
              <div className="flex justify-between text-white/80">
                <span>Payment Preference:</span>
                <span className="font-bold text-[var(--lime)]">{submittedOrderInfo.paymentMethod}</span>
              </div>
              <div className="pt-2 border-t border-[#16412c] flex justify-between font-bold text-sm text-white">
                <span>Total Amount:</span>
                <span className="font-serif-heading text-lg text-[var(--lime)]">
                  ETB {submittedOrderInfo.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-white/5 p-3.5 border border-white/10 text-[11px] text-white/70 flex items-start gap-2.5">
              <Phone size={15} className="text-[var(--lime)] shrink-0 mt-0.5" />
              <span>
                Need direct dispatch now? Call our farm logistics team at{" "}
                <strong className="text-white">+251 911 234 567</strong> or contact us via WhatsApp for instant processing.
              </span>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowComingSoonModal(false);
                  router.push("/shop");
                }}
                className="flex-1 flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--lime)] text-[var(--green-950)] font-bold text-xs uppercase tracking-wider hover:bg-[#c9e883] transition shadow-md"
              >
                <span>Continue Shopping</span>
              </button>

              <button
                type="button"
                onClick={() => setShowComingSoonModal(false)}
                className="flex h-12 items-center justify-center rounded-xl border border-white/20 bg-white/5 px-6 font-bold text-xs uppercase tracking-wider text-white hover:bg-white/10 transition"
              >
                Back to Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}