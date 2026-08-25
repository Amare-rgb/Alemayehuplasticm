"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

function LeafMark() {
  return (
    <div className="brand-mark" aria-hidden="true">
      <span className="leaf leaf-one" />
      <span className="leaf leaf-two" />
      <span className="stem" />
    </div>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path
          d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="m3 3 18 18" strokeLinecap="round" />
      <path
        d="M10.6 5.1A10 10 0 0 1 12 5c6 0 9.5 7 9.5 7a17 17 0 0 1-3.2 3.9M6.2 6.2C3.8 7.9 2.5 12 2.5 12s3.5 6 9.5 6c1.2 0 2.3-.2 3.3-.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const passwordsMatch =
    form.confirmPassword.length === 0 ||
    form.password === form.confirmPassword;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (form.password !== form.confirmPassword) {
      return;
    }

    // Connect your registration API / authentication logic here.
    console.log("Registration submitted", form);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--cream)]">
      {/* Background decoration */}
      <div
        className="pointer-events-none absolute -left-40 -top-32 h-80 w-80 rounded-full bg-[#b9d873]/20 blur-3xl"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute -bottom-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-[#28633e]/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-5 py-10 sm:px-8 lg:px-10">
        <div className="grid w-full overflow-hidden rounded-[2.5rem] border border-[#19472d]/10 bg-white shadow-[0_30px_100px_rgba(18,53,35,.12)] lg:grid-cols-[0.82fr_1.18fr]">
          {/* Brand panel */}
          <section className="relative hidden overflow-hidden bg-[#123523] lg:block">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1499529112087-3cb3b73cec95?auto=format&fit=crop&w=1500&q=85')",
              }}
            />

            <div className="absolute inset-0 bg-gradient-to-br from-[#0b2419]/95 via-[#123523]/80 to-[#123523]/35" />

            <div className="relative z-10 flex h-full min-h-[760px] flex-col justify-between p-10 xl:p-12">
              <Link href="/" className="inline-flex items-center gap-3">
                <LeafMark />

                <div>
                  <div className="font-serif-heading text-2xl font-semibold tracking-tight text-[#f6f3e9]">
                    Genesis
                  </div>

                  <div className="-mt-1 text-[9px] font-bold uppercase tracking-[0.28em] text-[#b9d873]">
                    Agro-business
                  </div>
                </div>
              </Link>

              <div>
                <div className="mb-5 inline-flex rounded-full bg-[#f6f3e9]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#b9d873] backdrop-blur-sm">
                  Join Genesis
                </div>

                <h1 className="max-w-md font-serif-heading text-5xl font-medium leading-[1.02] tracking-[-0.04em] text-[#f6f3e9]">
                  Better food starts
                  <br />
                  <span className="text-[#b9d873]">with better connections.</span>
                </h1>

                <p className="mt-6 max-w-md text-sm leading-7 text-[#f6f3e9]/70">
                  Create your account and enjoy direct access to fresh,
                  quality agricultural products from Genesis Agro-business.
                </p>

                <div className="mt-8 space-y-4">
                  {[
                    "Fresh produce directly from farms",
                    "Competitive prices without reseller markups",
                    "Simple and transparent buying",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 text-sm text-[#f6f3e9]/80"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#b9d873] text-[#123523]">
                        <CheckIcon />
                      </span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-xs text-[#f6f3e9]/45">
                Genesis Agro-business · Farm to family
              </p>
            </div>
          </section>

          {/* Form */}
          <section className="flex items-center justify-center p-6 sm:p-10 lg:p-12">
            <div className="w-full max-w-xl">
              {/* Mobile brand */}
              <div className="mb-8 flex justify-center lg:hidden">
                <Link href="/" className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#123523]">
                    <LeafMark />
                  </div>

                  <div>
                    <div className="font-serif-heading text-2xl font-semibold text-[#123523]">
                      Genesis
                    </div>

                    <div className="-mt-1 text-[9px] font-bold uppercase tracking-[0.28em] text-[#28633e]">
                      Agro-business
                    </div>
                  </div>
                </Link>
              </div>

              <div className="mb-8">
                <div className="mb-3 inline-flex rounded-full bg-[#f6f3e9] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#28633e]">
                  Create account
                </div>

                <h2 className="font-serif-heading text-4xl font-medium leading-tight tracking-[-0.035em] text-[#123523] sm:text-[2.8rem]">
                  Welcome to Genesis.
                </h2>

                <p className="mt-3 max-w-lg text-sm leading-6 text-[#69736b]">
                  Create your account in a few simple steps and start getting
                  fresh food closer to the farm.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-semibold text-[#123523]"
                  >
                    Full name
                  </label>

                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Enter your full name"
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    required
                    className="h-14 w-full rounded-2xl border border-[#19472d]/10 bg-[#f6f3e9]/60 px-4 text-sm text-[#142119] outline-none transition placeholder:text-[#69736b]/60 focus:border-[#28633e] focus:bg-white focus:ring-4 focus:ring-[#b9d873]/20"
                  />
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#123523]"
                  >
                    Email
                    <span className="rounded-full bg-[#f6f3e9] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#69736b]">
                      Optional
                    </span>
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    className="h-14 w-full rounded-2xl border border-[#19472d]/10 bg-[#f6f3e9]/60 px-4 text-sm text-[#142119] outline-none transition placeholder:text-[#69736b]/60 focus:border-[#28633e] focus:bg-white focus:ring-4 focus:ring-[#b9d873]/20"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label
                    htmlFor="phone"
                    className="mb-2 block text-sm font-semibold text-[#123523]"
                  >
                    Phone number
                  </label>

                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+251 9XX XXX XXX"
                    value={form.phone}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                    required
                    className="h-14 w-full rounded-2xl border border-[#19472d]/10 bg-[#f6f3e9]/60 px-4 text-sm text-[#142119] outline-none transition placeholder:text-[#69736b]/60 focus:border-[#28633e] focus:bg-white focus:ring-4 focus:ring-[#b9d873]/20"
                  />
                </div>

                {/* Passwords */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="password"
                      className="mb-2 block text-sm font-semibold text-[#123523]"
                    >
                      Password
                    </label>

                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Create a password"
                        value={form.password}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            password: event.target.value,
                          }))
                        }
                        required
                        minLength={8}
                        className="h-14 w-full rounded-2xl border border-[#19472d]/10 bg-[#f6f3e9]/60 px-4 pr-12 text-sm text-[#142119] outline-none transition placeholder:text-[#69736b]/60 focus:border-[#28633e] focus:bg-white focus:ring-4 focus:ring-[#b9d873]/20"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#69736b] hover:text-[#123523]"
                      >
                        <EyeIcon open={showPassword} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="mb-2 block text-sm font-semibold text-[#123523]"
                    >
                      Confirm password
                    </label>

                    <div className="relative">
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Repeat password"
                        value={form.confirmPassword}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            confirmPassword: event.target.value,
                          }))
                        }
                        required
                        minLength={8}
                        aria-invalid={!passwordsMatch}
                        className={`h-14 w-full rounded-2xl border bg-[#f6f3e9]/60 px-4 pr-12 text-sm text-[#142119] outline-none transition placeholder:text-[#69736b]/60 focus:bg-white focus:ring-4 focus:ring-[#b9d873]/20 ${
                          passwordsMatch
                            ? "border-[#19472d]/10 focus:border-[#28633e]"
                            : "border-red-400 focus:border-red-400"
                        }`}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword((value) => !value)
                        }
                        aria-label={
                          showConfirmPassword
                            ? "Hide confirm password"
                            : "Show confirm password"
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#69736b] hover:text-[#123523]"
                      >
                        <EyeIcon open={showConfirmPassword} />
                      </button>
                    </div>

                    {!passwordsMatch && (
                      <p className="mt-2 text-xs font-medium text-red-500">
                        Passwords do not match.
                      </p>
                    )}
                  </div>
                </div>

                {/* Password requirement */}
                <div className="rounded-2xl bg-[#f6f3e9] p-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-[#28633e]">
                    Password requirements
                  </p>

                  <div className="grid gap-2 text-xs text-[#69736b] sm:grid-cols-2">
                    <span
                      className={
                        form.password.length >= 8 ? "text-[#28633e]" : ""
                      }
                    >
                      • At least 8 characters
                    </span>

                    <span
                      className={
                        /[0-9]/.test(form.password) ? "text-[#28633e]" : ""
                      }
                    >
                      • At least one number
                    </span>
                  </div>
                </div>

                {/* Terms */}
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    required
                    className="mt-0.5 h-4 w-4 rounded border-[#19472d]/20 accent-[#28633e]"
                  />

                  <span className="text-xs leading-5 text-[#69736b]">
                    I agree to Genesis Agro-business&apos;s{" "}
                    <Link
                      href="/terms"
                      className="font-semibold text-[#28633e] hover:text-[#123523]"
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/privacy"
                      className="font-semibold text-[#28633e] hover:text-[#123523]"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={!passwordsMatch}
                  className="flex h-14 w-full items-center justify-center rounded-2xl bg-[#123523] px-5 text-sm font-bold text-[#f6f3e9] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#19472d] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Create my account
                </button>
              </form>

              <p className="mt-7 text-center text-sm text-[#69736b]">
                Already have an account?{" "}
                <Link
                  href="/auth/signin"
                  className="font-bold text-[#28633e] hover:text-[#123523]"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}