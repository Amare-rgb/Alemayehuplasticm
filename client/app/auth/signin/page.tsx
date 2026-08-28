"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
      <path
        d="m3 3 18 18"
        strokeLinecap="round"
      />
      <path
        d="M10.6 5.1A10 10 0 0 1 12 5c6 0 9.5 7 9.5 7a17 17 0 0 1-3.2 3.9M6.2 6.2C3.8 7.9 2.5 12 2.5 12s3.5 6 9.5 6c1.2 0 2.3-.2 3.3-.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" strokeLinecap="round" />
    </svg>
  );
}

export default function SignInPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    // Clear previous errors
    setError(null);
    
    // Get form data
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // Basic validation
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);

    try {
      // Get the base URL for the API
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      
      console.log("🔐 Login attempt to:", `${apiBaseUrl}/api/auth/login`);
      console.log("📧 Email:", email);

      // Call the auth login route
      const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password,
        }),
      });

      console.log("📡 Response status:", response.status);
      
      // Get response text first to handle non-JSON responses
      const responseText = await response.text();
      console.log("📦 Raw response:", responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse JSON:", parseError);
        throw new Error("Server returned invalid response. Please check backend is running.");
      }

      if (!response.ok) {
        // Handle different error status codes
        if (response.status === 401) {
          throw new Error(data.error || "Invalid credentials. Please check your email and password.");
        } else if (response.status === 400) {
          throw new Error(data.error || "Email and password are required.");
        } else if (response.status === 403) {
          throw new Error(data.error || "Access denied. Admin privileges required.");
        } else if (response.status === 404) {
          throw new Error(data.error || "User not found. Please check your email.");
        } else {
          throw new Error(data.error || data.message || `Login failed (Status: ${response.status}).`);
        }
      }

      // Check if login was successful
      if (!data.success) {
        throw new Error(data.error || "Login failed. Please try again.");
      }

      // Success - handle authentication
      console.log("✅ Login successful:", data);
      console.log("🔍 Token received:", data.token ? "Yes" : "No");
      console.log("🔍 User role:", data.user?.role);

      // ============================================
      // FIXED: Store authentication data
      // ============================================
      
      // Store token
      if (data.token) {
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("token", data.token);
        sessionStorage.setItem("authToken", data.token);
        sessionStorage.setItem("token", data.token);
        console.log("✅ Token stored");
      }
      
      // Store user data
      if (data.user) {
        const userData = data.user;
        localStorage.setItem("user", JSON.stringify(userData));
        sessionStorage.setItem("user", JSON.stringify(userData));
        
        // Store role separately for quick access (ensure uppercase)
        if (userData.role) {
          const roleUpper = userData.role.toUpperCase();
          localStorage.setItem("userRole", roleUpper);
          sessionStorage.setItem("userRole", roleUpper);
          console.log("👤 User role stored:", roleUpper);
        }
      }

      // Notify any active context listeners
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("auth-change"));

      // ============================================
      // FIXED: Redirect logic with immediate execution
      // ============================================
      
      // Get role from stored data
      const userRole = data.user?.role?.toUpperCase() || 
                       localStorage.getItem("userRole") || 
                       "USER";
      
      console.log("🔄 Redirecting with role:", userRole);

      // Determine redirect URL
      let redirectUrl = '/shop';
      if (userRole === 'ADMIN') {
        redirectUrl = '/admin/dashboard';
      } else if (userRole === 'SELLER' || userRole === 'FARMER') {
        redirectUrl = '/seller/dashboard';
      }
      
      console.log("🚀 Redirecting to:", redirectUrl);

      // Use window.location.replace for immediate redirect (prevents back button issues)
      // Small delay to ensure storage is complete
      setTimeout(() => {
        window.location.replace(redirectUrl);
      }, 200);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred. Please try again.";
      setError(errorMessage);
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-[var(--cream)]">
      {/* Decorative background */}
      <div
        className="pointer-events-none absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-[#b9d873]/20 blur-3xl"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute -bottom-48 -right-40 h-[32rem] w-[32rem] rounded-full bg-[#28633e]/10 blur-3xl"
        aria-hidden="true"
      />

      {/* Left visual panel */}
      <section className="relative hidden min-h-screen w-[48%] overflow-hidden bg-[#123523] lg:flex">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1800&q=85')",
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-br from-[#0b2419]/95 via-[#123523]/75 to-[#123523]/25" />

        <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">
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

          <div className="max-w-lg pb-8">
            <div className="mb-6 flex items-center gap-2 text-[#b9d873]">
              <span className="h-px w-10 bg-[#b9d873]" />
              <span className="text-xs font-bold uppercase tracking-[0.22em]">
                Farm to family
              </span>
            </div>

            <h1 className="font-serif-heading text-5xl font-medium leading-[1.02] tracking-[-0.04em] text-[#f6f3e9] xl:text-6xl">
              Fresh food,
              <br />
              <span className="text-[#b9d873]">closer to you.</span>
            </h1>

            <p className="mt-7 max-w-md text-base leading-7 text-[#f6f3e9]/70">
              Shop quality agricultural products directly from the source,
              without unnecessary middlemen and inflated prices.
            </p>
          </div>

          <div className="flex items-center gap-4 text-sm text-[#f6f3e9]/55">
            <span className="h-2 w-2 rounded-full bg-[#b9d873]" />
            Fresh produce. Fair prices. Direct from the farm.
          </div>
        </div>
      </section>

      {/* Form panel */}
      <section className="relative flex min-h-screen flex-1 items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-10 flex justify-center lg:hidden">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#123523]">
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

          <div className="rounded-[2rem] border border-[rgba(20,33,25,.09)] bg-white p-7 shadow-[0_25px_70px_rgba(18,53,35,.10)] sm:p-9">
            <div className="mb-8">
              <div className="mb-3 inline-flex rounded-full bg-[#f6f3e9] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#28633e]">
                Welcome back
              </div>

              <h2 className="font-serif-heading text-4xl font-medium tracking-[-0.035em] text-[#123523]">
                Sign in
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#69736b]">
                Access your Genesis Agro-business account and continue
                shopping fresh.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-[#123523]"
                >
                  Email
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@example.com"
                  required
                  disabled={isLoading}
                  className="h-14 w-full rounded-2xl border border-[#19472d]/10 bg-[#f6f3e9]/60 px-4 text-sm text-[#142119] outline-none transition placeholder:text-[#69736b]/60 focus:border-[#28633e] focus:bg-white focus:ring-4 focus:ring-[#b9d873]/20 disabled:opacity-60"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-[#123523]"
                  >
                    Password
                  </label>

                  <Link
                    href="/forgot-password"
                    className="text-xs font-semibold text-[#28633e] transition-colors hover:text-[#123523]"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    required
                    disabled={isLoading}
                    className="h-14 w-full rounded-2xl border border-[#19472d]/10 bg-[#f6f3e9]/60 px-4 pr-12 text-sm text-[#142119] outline-none transition placeholder:text-[#69736b]/60 focus:border-[#28633e] focus:bg-white focus:ring-4 focus:ring-[#b9d873]/20 disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    disabled={isLoading}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#69736b] transition-colors hover:text-[#123523] disabled:opacity-50"
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  disabled={isLoading}
                  className="h-4 w-4 rounded border-[#19472d]/20 accent-[#28633e] disabled:opacity-50"
                />

                <span className="text-sm text-[#69736b]">
                  Remember me
                </span>
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="flex h-14 w-full items-center justify-center rounded-2xl bg-[#123523] px-5 text-sm font-bold text-[#f6f3e9] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#19472d] hover:shadow-lg disabled:opacity-70 disabled:hover:-translate-y-0 disabled:hover:shadow-none"
              >
                {isLoading ? (
                  <>
                    <svg className="mr-2 h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  "Sign in to your account"
                )}
              </button>
            </form>

            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-[#19472d]/10" />
              <span className="text-xs text-[#69736b]">OR</span>
              <div className="h-px flex-1 bg-[#19472d]/10" />
            </div>

            <p className="text-center text-sm text-[#69736b]">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/register"
                className="font-bold text-[#28633e] hover:text-[#123523]"
              >
                Create one
              </Link>
            </p>
          </div>

          <p className="mt-6 text-center text-xs leading-5 text-[#69736b]">
            By continuing, you agree to our{" "}
            <Link
              href="/terms"
              className="font-semibold text-[#28633e] hover:text-[#123523]"
            >
              Terms
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="font-semibold text-[#28633e] hover:text-[#123523]"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
}