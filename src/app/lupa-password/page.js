"use client";
import Link from "next/link";
import LogoImage from "@/components/LogoImage";
import { useActionState, useState } from "react";
import { requestOtpAction } from "@/app/actions/password";
import { AlertCircle, Mail, ArrowLeft, CheckCircle } from "lucide-react";

export default function LupaPasswordPage() {
  const [state, formAction, pending] = useActionState(requestOtpAction, null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-[#1a0d3d] to-[#0c0a1e] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-amber-600 overflow-hidden flex items-center justify-center shadow-lg">
            <LogoImage size={48} />
          </div>
          <div>
            <p className="text-purple-300 text-xs font-medium uppercase tracking-widest">Dewan Ambalan</p>
            <p className="text-white text-lg font-bold">SMK Al Furqon</p>
          </div>
        </Link>

        <div className="bg-white dark:bg-[#150f2d] rounded-2xl shadow-2xl shadow-purple-950/60 border border-purple-100 dark:border-purple-800/50 p-8">

          {/* Success state: OTP sudah dikirim */}
          {state?.success ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-xl font-bold text-gray-800 dark:text-purple-50 mb-2">
                Email Terkirim!
              </h1>
              <p className="text-gray-500 dark:text-purple-400 text-sm mb-6">
                {state.message}
              </p>
              <Link
                href={`/reset-password?email=${encodeURIComponent(state.email ?? "")}`}
                className="w-full inline-flex items-center justify-center gap-2 bg-purple-800 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
              >
                Masukkan Kode OTP &rarr;
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/40 rounded-xl flex items-center justify-center mb-4">
                  <Mail size={22} className="text-purple-700 dark:text-purple-400" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-purple-50">
                  Lupa Password?
                </h1>
                <p className="text-gray-500 dark:text-purple-400 text-sm mt-1">
                  Masukkan email akunmu. Kami akan kirim kode OTP untuk reset password.
                </p>
              </div>

              {state?.error && (
                <div className="mb-4 flex items-start gap-2.5 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl text-red-700 dark:text-red-300 text-sm">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  {state.error}
                </div>
              )}

              <form action={formAction} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-purple-300 mb-1.5">
                    Alamat Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="email@kamu.com"
                    className="w-full border border-gray-300 dark:border-purple-700 bg-white dark:bg-[#1e1640] text-gray-900 dark:text-purple-50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400 dark:placeholder-purple-600 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={pending}
                  className="w-full flex items-center justify-center gap-2 bg-purple-800 hover:bg-purple-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
                >
                  {pending ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Mail size={16} />
                  )}
                  {pending ? "Mengirim..." : "Kirim Kode OTP"}
                </button>
              </form>
            </>
          )}
        </div>

        <div className="text-center mt-6 flex items-center justify-center gap-4 text-sm">
          <Link href="/login" className="text-purple-400 hover:text-purple-200 flex items-center gap-1">
            <ArrowLeft size={14} /> Kembali ke Login
          </Link>
          <span className="text-purple-700">·</span>
          <Link href="/reset-password" className="text-amber-400 hover:text-amber-300">
            Sudah punya kode OTP?
          </Link>
        </div>
      </div>
    </div>
  );
}
