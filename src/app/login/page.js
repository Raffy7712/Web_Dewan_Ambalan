"use client";
import Link from "next/link";
import LogoImage from "@/components/LogoImage";
import { useActionState, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { loginAction } from "@/app/actions/auth";
import { AlertCircle, LogIn, Eye, EyeOff, CheckCircle } from "lucide-react";

function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, null);
  const [showPass, setShowPass] = useState(false);
  const searchParams = useSearchParams();
  const resetSuccess = searchParams.get("reset") === "success";
  const nextPath = searchParams.get("next") ?? "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-[#1a0d3d] to-[#0c0a1e] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center justify-center gap-3 mb-8 group"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-600 overflow-hidden flex items-center justify-center shadow-lg">
            <LogoImage size={48} />
          </div>
          <div>
            <p className="text-purple-300 text-xs font-medium uppercase tracking-widest">
              Dewan Ambalan
            </p>
            <p className="text-white text-lg font-bold">SMK Al Furqon</p>
          </div>
        </Link>

        {/* Card */}
        <div className="bg-white dark:bg-[#150f2d] rounded-2xl shadow-2xl shadow-purple-950/60 border border-purple-100 dark:border-purple-800/50 p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-purple-50">
              Selamat Datang!
            </h1>
            <p className="text-gray-500 dark:text-purple-400 text-sm mt-1">
              Masuk ke portal Dewan Ambalan
            </p>
          </div>

          {/* Reset success banner */}
          {resetSuccess && (
            <div className="mb-4 flex items-start gap-2.5 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-xl text-green-700 dark:text-green-300 text-sm">
              <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
              Password berhasil direset! Silakan login dengan password baru
              kamu.
            </div>
          )}

          {/* Error */}
          {state?.error && (
            <div className="mb-4 flex items-start gap-2.5 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg text-red-700 dark:text-red-300 text-sm">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              {state.error}
            </div>
          )}

          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="next" value={nextPath} />
            {/* Username or email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-purple-300 mb-1.5">
                Username atau email
              </label>
              <input
                type="text"
                name="username"
                required
                autoComplete="username"
                placeholder="username_kamu atau email"
                className="w-full border border-gray-300 dark:border-purple-700 bg-white dark:bg-[#1e1640] text-gray-900 dark:text-purple-50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400 dark:placeholder-purple-600 transition"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-purple-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  name="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full border border-gray-300 dark:border-purple-700 bg-white dark:bg-[#1e1640] text-gray-900 dark:text-purple-50 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400 dark:placeholder-purple-600 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-purple-500 hover:text-gray-600 dark:hover:text-purple-300"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={pending}
              className="mt-1 w-full flex items-center justify-center gap-2 bg-purple-800 hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-sm"
            >
              {pending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  Masuk
                </>
              )}
            </button>
          </form>

          <div className="mt-4 flex flex-col gap-2 text-center text-sm">
            <Link
              href="/lupa-password"
              className="text-purple-600 dark:text-purple-400 hover:underline text-xs"
            >
              Lupa password? Klik di sini
            </Link>
            <p className="text-gray-500 dark:text-purple-400">
              Belum punya akun?{" "}
              <Link
                href={
                  nextPath
                    ? `/register?next=${encodeURIComponent(nextPath)}`
                    : "/register"
                }
                className="text-amber-600 dark:text-amber-400 font-semibold hover:underline"
              >
                Daftar di sini
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-sm text-purple-400 hover:text-purple-200 transition-colors"
          >
            &larr; Kembali ke Halaman Utama
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
