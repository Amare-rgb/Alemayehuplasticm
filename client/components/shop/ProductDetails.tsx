"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Product } from "@/data/products";

type ProductDetailsProps = {
  product: Product;
};

function ArrowLeft() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="m15 18-6-6 6-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="m5 12 4 4L19 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path
        d="M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        d="M3 4h2l1.7 10.2a2 2 0 0 0 2 1.8h7.8a2 2 0 0 0 2-1.6L20 7H6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="20" r="1.2" fill="currentColor" />
      <circle cx="17" cy="20" r="1.2" fill="currentColor" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        d="M3 6h11v10H3zM14 10h3l4 4v2h-7z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="7" cy="18" r="1.5" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="18" cy="18" r="1.5" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        d="M7 3h2l1.2 4-2 1.5a15 15 0 0 0 7.3 7.3L17 13.8 21 15v2c0 1.1-.9 2-2 2C10.2 19 5 13.8 5 5c0-1.1.9-2 2-2Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ProductDetails({
  product,
}: ProductDetailsProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState("cash");

  const total = useMemo(
    () => product.price * quantity,
    [product.price, quantity]
  );

  const paymentMethods = [
    {
      id: "cash",
      title: "Cash on Delivery",
      description: "Pay when your order arrives.",
    },
    {
      id: "telebirr",
      title: "Telebirr",
      description: "Fast and convenient mobile payment.",
    },
    {
      id: "bank",
      title: "Bank Transfer",
      description: "Transfer directly to our account.",
    },
  ];

  const decreaseQuantity = () => {
    setQuantity((current) => Math.max(1, current - 1));
  };

  const increaseQuantity = () => {
    setQuantity((current) => Math.min(product.stock, current + 1));
  };

  return (
    <main className="min-h-screen bg-[var(--cream)]">
      {/* Top navigation */}
      <div className="border-b border-[#19472d]/10 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-4 sm:px-8 lg:px-12">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#28633e] transition hover:text-[#123523]"
          >
            <ArrowLeft />
            Back to products
          </Link>
        </div>
      </div>

      <section className="px-5 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            {/* Image Gallery */}
            <div>
              <div className="relative overflow-hidden rounded-[2rem] bg-white shadow-[0_20px_65px_rgba(18,53,35,.09)]">
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={product.images[selectedImage]}
                    alt={product.name}
                    className="h-full w-full object-cover transition-all duration-500"
                  />

                  {product.badge && (
                    <span className="absolute left-6 top-6 rounded-full bg-[#f6f3e9]/95 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#28633e] shadow-sm backdrop-blur">
                      {product.badge}
                    </span>
                  )}
                </div>
              </div>

              {/* Thumbnails */}
              {product.images.length > 1 && (
                <div className="mt-4 grid grid-cols-4 gap-3">
                  {product.images.map((image, index) => {
                    const active = selectedImage === index;

                    return (
                      <button
                        key={image}
                        type="button"
                        onClick={() => setSelectedImage(index)}
                        className={`relative aspect-square overflow-hidden rounded-2xl border-2 transition-all ${
                          active
                            ? "border-[#28633e] shadow-md"
                            : "border-transparent opacity-70 hover:opacity-100"
                        }`}
                        aria-label={`View image ${index + 1}`}
                      >
                        <img
                          src={image}
                          alt={`${product.name} ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Product Information */}
            <div className="flex flex-col justify-center">
              <div className="mb-4 flex items-center gap-3">
                <span className="rounded-full bg-[#123523] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[#f6f3e9]">
                  {product.category}
                </span>

                <span className="text-xs font-medium text-[#69736b]">
                  Direct from farm
                </span>
              </div>

              <h1 className="font-serif-heading text-5xl font-medium leading-[0.98] tracking-[-0.045em] text-[#123523] sm:text-6xl">
                {product.name}
              </h1>

              <p className="mt-6 text-base leading-7 text-[#69736b]">
                {product.description}
              </p>

              <div className="my-7 h-px bg-[#19472d]/10" />

              {/* Price */}
              <div>
                <span className="font-serif-heading text-4xl font-semibold tracking-[-0.035em] text-[#123523]">
                  ETB {product.price.toLocaleString()}
                </span>

                <span className="ml-2 text-sm text-[#69736b]">
                  per {product.unit}
                </span>
              </div>

              {/* Stock */}
              <div className="mt-3 flex items-center gap-2 text-sm">
                <span
                  className={`h-2 w-2 rounded-full ${
                    product.stock > 0 ? "bg-[#72a84d]" : "bg-red-500"
                  }`}
                />

                <span className="text-[#69736b]">
                  {product.stock > 0
                    ? `${product.stock} ${product.unit}s currently available`
                    : "Currently out of stock"}
                </span>
              </div>

              {/* Quantity */}
              <div className="mt-8">
                <label className="mb-3 block text-xs font-bold uppercase tracking-[0.15em] text-[#28633e]">
                  Quantity
                </label>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center rounded-2xl border border-[#19472d]/10 bg-white p-1">
                    <button
                      type="button"
                      onClick={decreaseQuantity}
                      disabled={quantity <= 1}
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-[#123523] transition hover:bg-[#f6f3e9] disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <MinusIcon />
                    </button>

                    <span className="flex h-11 w-14 items-center justify-center text-sm font-bold text-[#123523]">
                      {quantity}
                    </span>

                    <button
                      type="button"
                      onClick={increaseQuantity}
                      disabled={quantity >= product.stock}
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-[#123523] transition hover:bg-[#f6f3e9] disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <PlusIcon />
                    </button>
                  </div>

                  <div className="text-right">
                    <span className="block text-xs uppercase tracking-[0.12em] text-[#69736b]">
                      Total
                    </span>

                    <span className="font-serif-heading text-2xl font-semibold text-[#123523]">
                      ETB {total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Add to cart */}
              <button
                type="button"
                disabled={product.stock <= 0}
                className="mt-7 flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#123523] px-6 text-sm font-bold text-[#f6f3e9] shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#19472d] hover:shadow-xl disabled:cursor-not-allowed disabled:bg-[#69736b]"
              >
                <CartIcon />
                Add {quantity} {product.unit}
                {quantity !== 1 ? "s" : ""} to cart
              </button>

              {/* Benefits */}
              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white p-4">
                  <TruckIcon />
                  <p className="mt-3 text-xs font-bold uppercase tracking-wider text-[#123523]">
                    Farm Fresh
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#69736b]">
                    Freshly sourced.
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-4">
                  <CheckIcon />
                  <p className="mt-3 text-xs font-bold uppercase tracking-wider text-[#123523]">
                    Fair Price
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#69736b]">
                    No reseller markup.
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-4">
                  <PhoneIcon />
                  <p className="mt-3 text-xs font-bold uppercase tracking-wider text-[#123523]">
                    Support
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#69736b]">
                    We're here to help.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment / Order section */}
          <section className="mt-16 grid gap-8 lg:grid-cols-[1fr_0.9fr]">
            {/* Payment methods */}
            <div className="rounded-[2rem] border border-[#19472d]/10 bg-white p-6 shadow-[0_15px_50px_rgba(18,53,35,.06)] sm:p-8">
              <div className="mb-7">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#28633e]">
                  Payment
                </span>

                <h2 className="mt-2 font-serif-heading text-3xl tracking-[-0.03em] text-[#123523]">
                  Choose how you&apos;d like to pay
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#69736b]">
                  Select your preferred payment method. You&apos;ll confirm
                  payment during checkout.
                </p>
              </div>

              <div className="space-y-3">
                {paymentMethods.map((method) => {
                  const selected = selectedPayment === method.id;

                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setSelectedPayment(method.id)}
                      className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all ${
                        selected
                          ? "border-[#28633e] bg-[#f6f3e9]"
                          : "border-[#19472d]/10 bg-white hover:border-[#28633e]/30"
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                          selected
                            ? "border-[#28633e]"
                            : "border-[#69736b]/30"
                        }`}
                      >
                        {selected && (
                          <span className="h-2.5 w-2.5 rounded-full bg-[#28633e]" />
                        )}
                      </span>

                      <span className="flex-1">
                        <span className="block text-sm font-bold text-[#123523]">
                          {method.title}
                        </span>

                        <span className="mt-1 block text-xs text-[#69736b]">
                          {method.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Order summary */}
            <div className="rounded-[2rem] bg-[#123523] p-6 text-[#f6f3e9] shadow-[0_20px_60px_rgba(18,53,35,.16)] sm:p-8">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#b9d873]">
                Order summary
              </span>

              <div className="mt-6 flex items-start justify-between gap-5">
                <div>
                  <h3 className="font-serif-heading text-2xl">
                    {product.name}
                  </h3>

                  <p className="mt-1 text-sm text-[#f6f3e9]/55">
                    {quantity} {product.unit}
                    {quantity !== 1 ? "s" : ""}
                  </p>
                </div>

                <span className="text-sm font-semibold">
                  ETB {total.toLocaleString()}
                </span>
              </div>

              <div className="my-6 h-px bg-white/10" />

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#f6f3e9]/55">Subtotal</span>
                  <span>ETB {total.toLocaleString()}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#f6f3e9]/55">Delivery</span>
                  <span>Calculated at checkout</span>
                </div>
              </div>

              <div className="my-6 h-px bg-white/10" />

              <div className="flex items-end justify-between">
                <span className="text-sm text-[#f6f3e9]/55">Estimated total</span>

                <span className="font-serif-heading text-3xl text-[#b9d873]">
                  ETB {total.toLocaleString()}
                </span>
              </div>

              <button
                type="button"
                className="mt-7 flex h-14 w-full items-center justify-center rounded-2xl bg-[#b9d873] px-6 text-sm font-bold text-[#123523] transition-all hover:-translate-y-0.5 hover:bg-[#c8e68b]"
              >
                Continue to checkout
              </button>

              <p className="mt-4 text-center text-xs leading-5 text-[#f6f3e9]/40">
                Your selected payment method:{" "}
                <span className="font-semibold text-[#f6f3e9]/70">
                  {
                    paymentMethods.find(
                      (method) => method.id === selectedPayment
                    )?.title
                  }
                </span>
              </p>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}