"use client";
import Link from "next/link";
import LogoImage from "@/components/LogoImage";
import { useActionState, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { resetPasswordAction } from "@/app/actions/password";
import { AlertCircle, KeyRound, Eye, EyeOff, ArrowLeft, CheckCircle } from "lucide-react";

function ResetForm() {
  const searchParams = useSearchParams();
  const emailFromUrl = searchParams.get("email") ?? "";

  const [state, formAction, pending] = useActionState(resetPasswordAction, null);
  const [showPass, setShowPass] = useState(false);
  const [showKonfirmasi, setShowKonfirmasi] = useState(false);

  if (state === null && searchParams.get("reset") === "success") {
    // Redirected here after successful reset — this won't normally show
    // because the action redirects to /login?reset=success
  }

  return (
    <div className="bg-white dark:bg-[#150f2d] rounded-2xl shadow-2xl shadow-purple-950/60 border border-purple-100 dark:border-purple-800/50 p-8">
      <div className="mb-6">
        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/40 rounded-xl flex items-center justify-center mb-4">
          <KeyRound size={22} className="text-purple-700 dark:text-purple-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-purple-50">
          Reset Password
        </h1>
        <p className="text-gray-500 dark:text-purple-400 text-sm mt-1">
          Masukkan kode OTP dari email dan password baru kamu.
        </p>
      </div>

      {state?.error && (
        <div className="mb-4 flex items-start gap-2.5 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl text-red-700 dark:text-red-300 text-sm">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          {state.error}
        </div>
      )}

      <form action={formAction} className="flex flex-col gap-4">
        {/* Email (pre-filled if came from lupa-password) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-purple-300 mb-1.5">
            Email
          </label>
          <input
            type="email"
            name="email"
            required
            defaultValue={emailFromUrl}
            placeholder="email@kamu.com"
            className="w-full border border-gray-300 dark:border-purple-700 bg-white dark:bg-[#1e1640] text-gray-900 dark:text-purple-50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400 dark:placeholder-purple-600 transition"
          />
        </div>

        {/* OTP */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-purple-300 mb-1.5">
            Kode OTP (6 digit)
          </label>
          <input
            type="text"
            name="otp"
            required
            maxLength={6}
            pattern="\d{6}"
            placeholder="123456"
            className="w-full border border-gray-300 dark:border-purple-700 bg-white dark:bg-[#1e1640] text-gray-900 dark:text-purple-50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400 dark:placeholder-purple-600 transition font-mono tracking-widest text-center text-lg"
          />
        </div>

        {/* New password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-purple-300 mb-1.5">
            Password Baru
          </label>
          <div className="relative">
            <input
              type={showPass ? "text" : "password"}
              name="password"
              required
              minLength={6}
              placeholder="Min. 6 karakter"
              className="w-full border border-gray-300 dark:border-purple-700 bg-white dark:bg-[#1e1640] text-gray-900 dark:text-purple-50 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-purple-500">
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Confirm */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-purple-300 mb-1.5">
            Konfirmasi Password Baru
          </label>
          <div className="relative">
            <input
              type={showKonfirmasi ? "text" : "password"}
              name="konfirmasi"
              required
              placeholder="Ulangi password baru"
              className="w-full border border-gray-300 dark:border-purple-700 bg-white dark:bg-[#1e1640] text-gray-900 dark:text-purple-50 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            />
            <button type="button" onClick={() => setShowKonfirmasi(!showKonfirmasi)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-purple-500">
              {showKonfirmasi ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="mt-1 w-full flex items-center justify-center gap-2 bg-purple-800 hover:bg-purple-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
        >
          {pending ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <KeyRound size={16} />
          )}
          {pending ? "Memproses..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-[#1a0d3d] to-[#0c0a1e] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-amber-600 overflow-hidden flex items-center justify-center shadow-lg">
            <LogoImage size={48} />
          </div>
          <div>
            <p className="text-purple-300 text-xs font-medium uppercase tracking-widest">Dewan Ambalan</p>
            <p className="text-white text-lg font-bold">SMK Al Furqon</p>
          </div>
        </Link>

        <Suspense fallback={<div className="bg-white dark:bg-[#150f2d] rounded-2xl p-8 text-center text-purple-400">Memuat...</div>}>
          <ResetForm />
        </Suspense>

        <div className="text-center mt-6">
          <Link href="/lupa-password" className="text-purple-400 hover:text-purple-200 text-sm flex items-center justify-center gap-1">
            <ArrowLeft size={14} /> Minta kode OTP baru
          </Link>
        </div>
      </div>
    </div>
  );
}
