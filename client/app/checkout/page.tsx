// app/checkout/page.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
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
  Building2,
  Smartphone,
  Coins,
  Sparkles,
  Loader2,
  Upload,
  X,
  FileText,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/app/providers";
import { checkoutApi } from "@/lib/api";
import toast from "react-hot-toast";

// ============================================
// TYPES
// ============================================

type PaymentMethodId = "telebirr" | "bank" | "cash";

interface PaymentOption {
  id: PaymentMethodId;
  name: string;
  badge?: string;
  icon: React.ReactNode;
  tagline: string;
  instructions: string;
  details?: { label: string; value: string }[];
}

interface Address {
  id: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

interface Order {
  id: string;
  orderNumber: number;
  userId: string;
  addressId: string;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  paymentRef?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface CheckoutSummaryItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string | null;
  stock: number;
}

interface CreateCheckoutResponse {
  success: boolean;
  message: string;
  data: {
    order: Order;
    items?: CheckoutSummaryItem[];
    isGuest?: boolean;
  };
}

interface CheckoutPayload {
  paymentMethod: PaymentMethodId;
  notes: string;
  addressId?: string;
  paymentRef?: string;
  paymentProof?: {
    fileName: string;
    mimeType: string;
    base64: string;
  } | null;
  guestInfo?: {
    name: string;
    phone: string;
    email?: string;
    address: string;
    city?: string;
  };
  items?: Array<{
    productId: string;
    name?: string;
    price: number;
    quantity: number;
    image?: string | null;
  }>;
}

interface CheckoutSummaryResponse {
  success: boolean;
  data?: {
    addresses: Address[];
    items?: CheckoutSummaryItem[];
    subtotal?: number;
    tax?: number;
    taxRate?: number;
    total?: number;
    paymentMethods?: string[];
    cartEmpty?: boolean;
  };
}

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  image: string;
  slug?: string;
}

// ============================================
// PAYMENT OPTIONS
// ============================================

const paymentOptions: PaymentOption[] = [
  {
    id: "telebirr",
    name: "Telebirr Mobile Money",
    badge: "Most Popular",
    icon: <Smartphone className="h-5 w-5 text-[#28633e]" />,
    tagline: "Instant mobile transfer via Telebirr SuperApp or USSD (*127#)",
    instructions:
      "Transfer to our official Telebirr merchant account upon order confirmation.",
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
    instructions:
      "Direct bank transfer. You can upload or SMS the transaction reference number.",
    details: [
      { label: "CBE Account", value: "1000 4567 8901 2345 (Genesis Agri PLC)" },
      { label: "Awash Bank", value: "0132 0891 2345 00 (Genesis Agri PLC)" },
      { label: "Branch", value: "Bole Central, Addis Ababa" },
    ],
  },
  {
    id: "cash",
    name: "Cash on Delivery",
    badge: "Pay at Doorstep",
    icon: <Coins className="h-5 w-5 text-[#28633e]" />,
    tagline: "Inspect fresh produce and pay cash directly to the dispatch driver",
    instructions:
      "Available for deliveries within Addis Ababa and surrounding agricultural zones.",
    details: [
      { label: "Inspection", value: "100% Quality verification before payment" },
      { label: "Exact Change", value: "Drivers carry change up to 1,000 ETB" },
    ],
  },
];

// ============================================
// HELPERS
// ============================================

const MAX_FILE_SIZE_MB = 5;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        resolve(result.split(",")[1] ?? "");
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// ============================================
// COMPONENT
// ============================================

export default function CheckoutPage() {
  const router = useRouter();
  const { user, status } = useAuth();
  const { items, cartCount, totalUnits, cartTotal, clearCart } = useCart();

  // State
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [checkoutAddresses, setCheckoutAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");

  const [manualAddress, setManualAddress] = useState<string>("");
  const [manualCity, setManualCity] = useState<string>("Addis Ababa - Bole");

  // Guest Form State
  const [guestName, setGuestName] = useState<string>("");
  const [guestPhone, setGuestPhone] = useState<string>("");
  const [guestEmail, setGuestEmail] = useState<string>("");
  const [deliveryAddress, setDeliveryAddress] = useState<string>("");
  const [citySubcity, setCitySubcity] = useState<string>("Addis Ababa - Bole");
  const [orderNotes, setOrderNotes] = useState<string>("");

  // Payment Selection — default to Telebirr
  const [selectedPayment, setSelectedPayment] =
    useState<PaymentMethodId>("telebirr");

  // Upload / reference state (only used when bank is selected)
  const [paymentRef, setPaymentRef] = useState<string>("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [proofError, setProofError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Order success state
  const [orderCreated, setOrderCreated] = useState<boolean>(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  const isAuthenticated = status === "authenticated" && !!user;

  // Only show the upload form when Commercial Bank Transfer is selected
  const showUploadForm = selectedPayment === "bank";

  // Fetch user's addresses if authenticated
  useEffect(() => {
    const fetchAddresses = async (): Promise<void> => {
      if (!isAuthenticated) return;
      try {
        setLoading(true);
        const response =
          (await checkoutApi.getSummary()) as CheckoutSummaryResponse;
        if (response.success && response.data?.addresses) {
          setCheckoutAddresses(response.data.addresses);
          const defaultAddress = response.data.addresses.find(
            (a: Address) => a.isDefault
          );
          if (defaultAddress) {
            setSelectedAddressId(defaultAddress.id);
          } else if (response.data.addresses.length > 0) {
            setSelectedAddressId(response.data.addresses[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch addresses:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAddresses();
  }, [isAuthenticated]);

  // ============================================
  // PAYMENT METHOD HANDLER
  // ============================================
  const handleSelectPayment = (method: PaymentMethodId): void => {
    setSelectedPayment(method);

    // If the user switches away from Bank Transfer, clear any proof/ref data
    if (method !== "bank") {
      setPaymentRef("");
      setProofFile(null);
      if (proofPreview) URL.revokeObjectURL(proofPreview);
      setProofPreview(null);
      setProofError("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ============================================
  // FILE HANDLERS
  // ============================================
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setProofError("");
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
      "application/pdf",
    ];
    if (!allowed.includes(file.type)) {
      setProofError("Only PNG, JPG, WEBP, or PDF files are allowed.");
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setProofError(`File must be smaller than ${MAX_FILE_SIZE_MB} MB.`);
      return;
    }

    if (proofPreview) URL.revokeObjectURL(proofPreview);

    setProofFile(file);
    if (file.type.startsWith("image/")) {
      setProofPreview(URL.createObjectURL(file));
    } else {
      setProofPreview(null);
    }
  };

  const clearProofFile = (): void => {
    if (proofPreview) URL.revokeObjectURL(proofPreview);
    setProofFile(null);
    setProofPreview(null);
    setProofError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ============================================
  // SUBMIT
  // ============================================
  const handlePlaceOrder = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (items.length === 0) {
      toast.error("Your cart is empty! Add products before checking out.");
      return;
    }

    if (!isAuthenticated) {
      if (!guestName.trim()) {
        toast.error("Please enter your full name.");
        return;
      }
      if (!guestPhone.trim() || guestPhone.trim().length < 9) {
        toast.error("Please provide a valid Ethiopian phone number.");
        return;
      }
      if (!deliveryAddress.trim()) {
        toast.error("Please provide your delivery address.");
        return;
      }
    } else {
      if (checkoutAddresses.length === 0) {
        if (!manualAddress.trim()) {
          toast.error("Please enter your delivery address.");
          return;
        }
      } else if (!selectedAddressId) {
        toast.error("Please select a delivery address.");
        return;
      }
    }

    if (showUploadForm && !paymentRef.trim() && !proofFile) {
      toast.error(
        "Please enter the transaction reference OR upload a payment screenshot/receipt."
      );
      return;
    }

    try {
      setSubmitting(true);

      const cartItems = items.map((item: CartItem) => {
        const productId = item.productId || item.id;
        return {
          productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image || null,
        };
      });

      let paymentProof: CheckoutPayload["paymentProof"] = null;
      if (showUploadForm && proofFile) {
        const base64 = await fileToBase64(proofFile);
        paymentProof = {
          fileName: proofFile.name,
          mimeType: proofFile.type,
          base64,
        };
      }

      const payload: CheckoutPayload = {
        paymentMethod: selectedPayment,
        notes: orderNotes,
        items: cartItems,
        paymentRef: showUploadForm ? paymentRef.trim() || undefined : undefined,
        paymentProof,
      };

      if (isAuthenticated) {
        if (checkoutAddresses.length > 0 && selectedAddressId) {
          payload.addressId = selectedAddressId;
        } else {
          payload.guestInfo = {
            name: user?.name || "Valued Customer",
            phone: user?.phone || "N/A",
            email: user?.email || undefined,
            address: manualAddress,
            city: manualCity,
          };
        }
      } else {
        payload.guestInfo = {
          name: guestName,
          phone: guestPhone,
          email: guestEmail || undefined,
          address: deliveryAddress,
          city: citySubcity,
        };
      }

      console.log("📦 Checkout payload:", {
        ...payload,
        paymentProof: paymentProof
          ? {
              fileName: paymentProof.fileName,
              mimeType: paymentProof.mimeType,
              base64Length: paymentProof.base64.length,
            }
          : null,
      });

      const response =
        (await checkoutApi.createCheckout(payload)) as CreateCheckoutResponse;

      if (response.success) {
        setOrderCreated(true);
        setCreatedOrder(response.data.order);
        clearCart();
        toast.success("Order created successfully!");

        // ✅ Redirect to the orders LIST page, highlighting the new order.
        //    The previous /orders/${id} route did not exist → 404.
        const newOrderId = response.data.order.id;
        setTimeout(() => {
          router.push(`/orders?highlight=${newOrderId}`);
        }, 2000);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      interface AxiosErrorWithResponse {
        response?: { data?: { error?: string; message?: string } };
      }
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as AxiosErrorWithResponse;
        toast.error(
          axiosError.response?.data?.error ||
            axiosError.response?.data?.message ||
            "Failed to create order. Please try again."
        );
      } else {
        toast.error("Failed to create order. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================
  // SUCCESS SCREEN
  // ============================================
  if (orderCreated && createdOrder) {
    return (
      <main className="min-h-screen bg-[var(--cream)] pt-28 sm:pt-32 flex items-center justify-center">
        <div className="mx-auto max-w-2xl px-4">
          <div className="rounded-[2.5rem] border border-[rgba(20,33,25,.09)] bg-white p-8 sm:p-12 text-center shadow-[0_15px_45px_rgba(18,53,35,.06)]">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="font-serif-heading text-2xl sm:text-3xl font-bold text-[#123523]">
              Order Placed Successfully!
            </h2>
            <p className="mt-3 text-sm text-[#69736b]">
              {/* ✅ Show the sequential orderNumber, not the raw cuid */}
              Your order #{createdOrder.orderNumber} has been created.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={`/orders?highlight=${createdOrder.id}`}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#123523] px-8 py-3 text-sm font-bold text-white shadow-lg hover:bg-[#19472d] transition"
              >
                View My Orders
              </Link>
              <Link
                href="/shop"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#123523] px-8 py-3 text-sm font-bold text-[#123523] hover:bg-[#f6f3e9] transition"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--cream)] pb-24 pt-28 sm:pt-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#28633e] hover:text-[#123523] transition"
          >
            <ArrowLeft size={14} />
            Back to Shopping Cart
          </Link>
          <h1 className="mt-2 font-serif-heading text-3xl sm:text-4xl font-bold tracking-tight text-[#123523]">
            Checkout & Farm Dispatch
          </h1>
        </div>

        {items.length === 0 ? (
          <div className="rounded-[2.5rem] border border-[rgba(20,33,25,.09)] bg-white p-12 sm:p-16 text-center shadow-[0_15px_45px_rgba(18,53,35,.06)]">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#f6f3e9] text-[#28633e]">
              <ShoppingBag size={38} />
            </div>
            <h2 className="font-serif-heading text-2xl sm:text-3xl font-bold text-[#123523]">
              Your cart is empty
            </h2>
            <Link
              href="/shop"
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-[#123523] px-8 py-4 text-sm font-bold text-white shadow-lg hover:bg-[#19472d] transition"
            >
              Browse Fresh Produce Marketplace
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handlePlaceOrder}
            className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start"
          >
            {/* LEFT COLUMN */}
            <div className="lg:col-span-7 space-y-7">
              {/* 1. Customer & Delivery Information */}
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
                      Guest Checkout
                    </span>
                  )}
                </div>

                {isAuthenticated ? (
                  <div className="space-y-4">
                    {loading ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-[#28633e]" />
                      </div>
                    ) : checkoutAddresses.length > 0 ? (
                      <>
                        <div className="space-y-3">
                          <label className="block text-xs font-bold uppercase tracking-wider text-[#123523] mb-1.5">
                            Select Delivery Address{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          {checkoutAddresses.map((address) => (
                            <label
                              key={address.id}
                              className={`flex items-start gap-3 rounded-xl border-2 p-3 cursor-pointer transition ${
                                selectedAddressId === address.id
                                  ? "border-[#28633e] bg-[#f6f3e9]/50"
                                  : "border-gray-200 hover:border-[#28633e]/40"
                              }`}
                            >
                              <input
                                type="radio"
                                name="address"
                                value={address.id}
                                checked={selectedAddressId === address.id}
                                onChange={() => setSelectedAddressId(address.id)}
                                className="mt-1"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-[#123523]">
                                    {address.fullName}
                                  </span>
                                  {address.isDefault && (
                                    <span className="text-[10px] font-bold uppercase bg-[#28633e]/10 text-[#28633e] px-2 py-0.5 rounded">
                                      Default
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-[#69736b]">
                                  {address.phone}
                                </p>
                                <p className="text-xs text-[#69736b]">
                                  {address.street}, {address.city},{" "}
                                  {address.state}, {address.country}
                                </p>
                              </div>
                            </label>
                          ))}
                        </div>

                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                          </div>
                          <div className="relative flex justify-center text-xs">
                            <span className="bg-white px-2 text-gray-400">
                              OR
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-[#69736b] mb-1.5">
                            Enter New Address
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <select
                                value={manualCity}
                                onChange={(e) => setManualCity(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-xs font-medium text-[#123523] outline-none transition focus:border-[#28633e] focus:bg-white focus:ring-2 focus:ring-[#b9d873]/30"
                              >
                                <option value="Addis Ababa - Bole">
                                  Addis Ababa — Bole
                                </option>
                                <option value="Addis Ababa - Kirkos">
                                  Addis Ababa — Kirkos
                                </option>
                                <option value="Addis Ababa - Yeka">
                                  Addis Ababa — Yeka
                                </option>
                                <option value="Addis Ababa - Nifas Silk">
                                  Addis Ababa — Nifas Silk
                                </option>
                                <option value="Addis Ababa - Arada">
                                  Addis Ababa — Arada
                                </option>
                                <option value="Addis Ababa - Gulele">
                                  Addis Ababa — Gulele
                                </option>
                                <option value="Addis Ababa - Akaki Kality">
                                  Addis Ababa — Akaki Kality
                                </option>
                                <option value="Oromia - Bishoftu / Mojo">
                                  Oromia — Bishoftu / Mojo
                                </option>
                                <option value="Oromia - Sebeta / Burayu">
                                  Oromia — Sebeta / Burayu
                                </option>
                                <option value="Amhara - Bahir Dar">
                                  Amhara — Bahir Dar
                                </option>
                                <option value="Other Agricultural Region">
                                  Other Agricultural Region
                                </option>
                              </select>
                            </div>
                            <div>
                              <input
                                type="text"
                                value={manualAddress}
                                onChange={(e) => setManualAddress(e.target.value)}
                                placeholder="Street, House #, Landmark"
                                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-xs font-medium text-[#123523] outline-none transition focus:border-[#28633e] focus:bg-white focus:ring-2 focus:ring-[#b9d873]/30"
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200">
                          You dont have any saved addresses. Please enter your
                          delivery address below.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-[#123523] mb-1.5">
                              City & Subcity{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={manualCity}
                              onChange={(e) => setManualCity(e.target.value)}
                              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-xs font-medium text-[#123523] outline-none transition focus:border-[#28633e] focus:bg-white focus:ring-2 focus:ring-[#b9d873]/30"
                            >
                              <option value="Addis Ababa - Bole">
                                Addis Ababa — Bole
                              </option>
                              <option value="Addis Ababa - Kirkos">
                                Addis Ababa — Kirkos
                              </option>
                              <option value="Addis Ababa - Yeka">
                                Addis Ababa — Yeka
                              </option>
                              <option value="Addis Ababa - Nifas Silk">
                                Addis Ababa — Nifas Silk
                              </option>
                              <option value="Addis Ababa - Arada">
                                Addis Ababa — Arada
                              </option>
                              <option value="Addis Ababa - Gulele">
                                Addis Ababa — Gulele
                              </option>
                              <option value="Addis Ababa - Akaki Kality">
                                Addis Ababa — Akaki Kality
                              </option>
                              <option value="Oromia - Bishoftu / Mojo">
                                Oromia — Bishoftu / Mojo
                              </option>
                              <option value="Oromia - Sebeta / Burayu">
                                Oromia — Sebeta / Burayu
                              </option>
                              <option value="Amhara - Bahir Dar">
                                Amhara — Bahir Dar
                              </option>
                              <option value="Other Agricultural Region">
                                Other Agricultural Region
                              </option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-[#123523] mb-1.5">
                              Street / Landmark / House #{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={manualAddress}
                              onChange={(e) => setManualAddress(e.target.value)}
                              placeholder="e.g. Near Medhanialem Church, House 142"
                              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-xs font-medium text-[#123523] outline-none transition focus:border-[#28633e] focus:bg-white focus:ring-2 focus:ring-[#b9d873]/30"
                            />
                          </div>
                        </div>
                        <Link
                          href="/profile/addresses"
                          className="inline-block text-xs text-[#28633e] font-bold hover:underline"
                        >
                          + Add address to your account →
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
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
                          Phone Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          value={guestPhone}
                          onChange={(e) => setGuestPhone(e.target.value)}
                          placeholder="e.g. 0911 234 567"
                          className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-xs font-medium text-[#123523] outline-none transition focus:border-[#28633e] focus:bg-white focus:ring-2 focus:ring-[#b9d873]/30"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#123523] mb-1.5">
                        Email Address{" "}
                        <span className="text-gray-400 font-normal">
                          (Optional)
                        </span>
                      </label>
                      <input
                        type="email"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        placeholder="e.g. abebe@example.com"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-xs font-medium text-[#123523] outline-none transition focus:border-[#28633e] focus:bg-white focus:ring-2 focus:ring-[#b9d873]/30"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#123523] mb-1.5">
                          City & Subcity{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={citySubcity}
                          onChange={(e) => setCitySubcity(e.target.value)}
                          className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-xs font-medium text-[#123523] outline-none transition focus:border-[#28633e] focus:bg-white focus:ring-2 focus:ring-[#b9d873]/30"
                        >
                          <option value="Addis Ababa - Bole">
                            Addis Ababa — Bole
                          </option>
                          <option value="Addis Ababa - Kirkos">
                            Addis Ababa — Kirkos
                          </option>
                          <option value="Addis Ababa - Yeka">
                            Addis Ababa — Yeka
                          </option>
                          <option value="Addis Ababa - Nifas Silk">
                            Addis Ababa — Nifas Silk
                          </option>
                          <option value="Addis Ababa - Arada">
                            Addis Ababa — Arada
                          </option>
                          <option value="Addis Ababa - Gulele">
                            Addis Ababa — Gulele
                          </option>
                          <option value="Addis Ababa - Akaki Kality">
                            Addis Ababa — Akaki Kality
                          </option>
                          <option value="Oromia - Bishoftu / Mojo">
                            Oromia — Bishoftu / Mojo
                          </option>
                          <option value="Oromia - Sebeta / Burayu">
                            Oromia — Sebeta / Burayu
                          </option>
                          <option value="Amhara - Bahir Dar">
                            Amhara — Bahir Dar
                          </option>
                          <option value="Other Agricultural Region">
                            Other Agricultural Region
                          </option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#123523] mb-1.5">
                          Street / Landmark / House #{" "}
                          <span className="text-red-500">*</span>
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
                  </div>
                )}

                <div className="space-y-4 mt-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#123523] mb-1.5">
                      Order / Delivery Instructions{" "}
                      <span className="text-gray-400 font-normal">
                        (Optional)
                      </span>
                    </label>
                    <textarea
                      rows={2}
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="e.g. Please deliver in the morning."
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-xs font-medium text-[#123523] outline-none transition focus:border-[#28633e] focus:bg-white focus:ring-2 focus:ring-[#b9d873]/30 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Payment Method Selection */}
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

                <div className="space-y-3.5">
                  {paymentOptions.map((opt) => {
                    const isSelected = selectedPayment === opt.id;

                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleSelectPayment(opt.id)}
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
                                isSelected
                                  ? "bg-[#123523] text-[var(--lime)]"
                                  : "bg-[#f6f3e9] text-[#28633e]"
                              }`}
                            >
                              {opt.icon}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-sm text-[#123523]">
                                  {opt.name}
                                </h3>
                                {opt.badge && (
                                  <span className="rounded-md bg-[#28633e]/10 border border-[#28633e]/20 px-2 py-0.5 text-[9px] font-bold uppercase text-[#28633e]">
                                    {opt.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#69736b] mt-0.5">
                                {opt.tagline}
                              </p>
                            </div>
                          </div>

                          <div
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
                              isSelected
                                ? "border-[#28633e] bg-[#28633e] text-white"
                                : "border-gray-300 bg-white"
                            }`}
                          >
                            {isSelected && (
                              <div className="h-2 w-2 rounded-full bg-white" />
                            )}
                          </div>
                        </div>

                        {isSelected && (
                          <div className="mt-4 pt-3.5 border-t border-[#19472d]/10 space-y-2 text-xs">
                            <p className="text-[#28633e] font-semibold">
                              {opt.instructions}
                            </p>
                            {opt.details && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 bg-white/80 p-3 rounded-xl border border-[#19472d]/10">
                                {opt.details.map((d, idx) => (
                                  <div key={idx} className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-[#69736b]">
                                      {d.label}
                                    </span>
                                    <span className="font-bold text-[#123523]">
                                      {d.value}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {showUploadForm && (
                              <div className="mt-4 rounded-xl border border-[#28633e]/25 bg-white p-4 space-y-4">
                                <div className="flex items-center gap-2">
                                  <Upload
                                    size={16}
                                    className="text-[#28633e]"
                                  />
                                  <h4 className="font-bold text-sm text-[#123523]">
                                    Upload Payment Proof
                                  </h4>
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#123523] mb-1.5">
                                    Transaction Reference Number{" "}
                                    <span className="text-gray-400 font-normal">
                                      (Optional if you upload)
                                    </span>
                                  </label>
                                  <input
                                    type="text"
                                    value={paymentRef}
                                    onChange={(e) =>
                                      setPaymentRef(e.target.value)
                                    }
                                    placeholder="e.g. FT2309123456 or CBE-8891234"
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-xs font-medium text-[#123523] outline-none transition focus:border-[#28633e] focus:bg-white focus:ring-2 focus:ring-[#b9d873]/30"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#123523] mb-1.5">
                                    Receipt / Screenshot{" "}
                                    <span className="text-gray-400 font-normal">
                                      (PNG, JPG, WEBP, PDF — max {MAX_FILE_SIZE_MB} MB)
                                    </span>
                                  </label>

                                  {!proofFile ? (
                                    <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#28633e]/40 bg-[#f6f3e9]/40 px-4 py-6 cursor-pointer hover:bg-[#f6f3e9]/70 transition">
                                      <Upload
                                        size={22}
                                        className="text-[#28633e]"
                                      />
                                      <span className="text-xs font-bold text-[#123523]">
                                        Click to upload receipt
                                      </span>
                                      <span className="text-[10px] text-[#69736b]">
                                        or drag and drop — max {MAX_FILE_SIZE_MB} MB
                                      </span>
                                      <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                                        onChange={handleFileChange}
                                        className="hidden"
                                      />
                                    </label>
                                  ) : (
                                    <div className="flex items-center gap-3 rounded-xl border border-[#28633e]/30 bg-[#f6f3e9]/50 p-3">
                                      {proofPreview ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                          src={proofPreview}
                                          alt="Proof preview"
                                          className="h-12 w-12 rounded-lg object-cover border border-[#28633e]/20"
                                        />
                                      ) : (
                                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#123523] text-[var(--lime)]">
                                          <FileText size={20} />
                                        </div>
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-[#123523] truncate">
                                          {proofFile.name}
                                        </p>
                                        <p className="text-[10px] text-[#69736b]">
                                          {(proofFile.size / 1024).toFixed(0)} KB
                                        </p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={clearProofFile}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-300 transition"
                                        aria-label="Remove file"
                                      >
                                        <X size={14} />
                                      </button>
                                    </div>
                                  )}

                                  {proofError && (
                                    <p className="mt-2 text-[11px] font-semibold text-red-600">
                                      {proofError}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Company Info */}
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
                    <MapPin
                      size={16}
                      className="text-[#28633e] shrink-0 mt-0.5"
                    />
                    <div>
                      <span className="font-bold text-[#123523] block">
                        Central Dispatch Hub
                      </span>
                      <span className="text-[#69736b]">
                        Bole Subcity, Agri Logistics Center, Addis Ababa
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 rounded-xl bg-[#f6f3e9]/60 p-3">
                    <Phone
                      size={16}
                      className="text-[#28633e] shrink-0 mt-0.5"
                    />
                    <div>
                      <span className="font-bold text-[#123523] block">
                        Support Hotlines
                      </span>
                      <span className="text-[#69736b]">
                        +251 911 234 567 / +251 922 345 678
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 rounded-xl bg-[#f6f3e9]/60 p-3">
                    <Mail
                      size={16}
                      className="text-[#28633e] shrink-0 mt-0.5"
                    />
                    <div>
                      <span className="font-bold text-[#123523] block">
                        Official Email
                      </span>
                      <span className="text-[#69736b]">
                        orders@genesisagri.com
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 rounded-xl bg-[#f6f3e9]/60 p-3">
                    <Truck
                      size={16}
                      className="text-[#28633e] shrink-0 mt-0.5"
                    />
                    <div>
                      <span className="font-bold text-[#123523] block">
                        Dispatch Hours
                      </span>
                      <span className="text-[#69736b]">
                        Mon – Sat: 7:00 AM – 7:00 PM
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Order Summary */}
            <div className="lg:col-span-5 sticky top-28 space-y-4">
              <div className="rounded-[2.5rem] border border-[rgba(20,33,25,.09)] bg-white p-6 sm:p-7 shadow-[0_15px_45px_rgba(18,53,35,.07)]">
                <h2 className="font-serif-heading text-2xl font-bold text-[#123523] pb-4 border-b border-gray-100">
                  Order Summary ({cartCount} items)
                </h2>

                <div className="mt-4 max-h-[300px] overflow-y-auto space-y-3 pr-1 divide-y divide-gray-100">
                  {items.map((item: CartItem) => (
                    <div
                      key={item.id}
                      className="pt-3 first:pt-0 flex items-center gap-3"
                    >
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#0b2419] border border-[#16412c]/20 relative">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="56px"
                          className="object-cover"
                          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                            e.currentTarget.src =
                              "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80";
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs text-[#123523] truncate">
                          {item.name}
                        </h4>
                        <span className="text-[11px] text-[#69736b]">
                          {item.quantity} {item.unit} × ETB{" "}
                          {item.price.toLocaleString()}
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

                <div className="mt-6 pt-4 border-t border-gray-100 space-y-3 text-xs text-[#69736b]">
                  <div className="flex justify-between items-center">
                    <span>Produce Subtotal ({totalUnits} units)</span>
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
                    <span className="font-bold text-[#28633e]">
                      Free Local Dispatch
                    </span>
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

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#123523] px-6 text-sm font-bold text-white shadow-lg transition-all duration-200 hover:bg-[#19472d] hover:text-[var(--lime)] hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Processing Order...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Confirm & Place Order</span>
                      <span className="font-bold text-base">→</span>
                    </>
                  )}
                </button>

                <p className="mt-3 text-center text-[11px] text-[#69736b]">
                  🔒 Secured checkout • Official agricultural distribution
                </p>
              </div>

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
    </main>
  );
}