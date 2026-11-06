"use client";
import Link from "next/link";
import LogoImage from "@/components/LogoImage";
import { useActionState, useState } from "react";
import { requestOtpAction } from "@/app/actions/password";
import { AlertCircle, Mail, ArrowLeft, CheckCircle } from "lucide-react";

export default function LupaPasswordPage() {
  const [state, formAction, pending] = useActionState(requestOtpAction, null);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-secondary overflow-hidden flex items-center justify-center shadow-lg">
            <LogoImage size={48} />
          </div>
          <div>
            <p className="text-secondary text-xs font-medium uppercase tracking-widest">Dewan Ambalan</p>
            <p className="text-foreground text-lg font-bold">SMK Al Furqon</p>
          </div>
        </Link>

        <div className="bg-card border border-border rounded-2xl shadow-sm p-8">
          {state?.success ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-primary" />
              </div>
              <h1 className="text-xl font-bold text-foreground mb-2">Email Terkirim!</h1>
              <p className="text-muted-foreground text-sm mb-6">{state.message}</p>
              <Link
                href={`/reset-password?email=${encodeURIComponent(state.email ?? "")}`}
                className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
              >
                Masukkan Kode OTP &rarr;
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <Mail size={22} className="text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">Lupa Password?</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Masukkan email akunmu. Kami akan kirim kode OTP untuk reset password.
                </p>
              </div>

              {state?.error && (
                <div className="mb-4 flex items-start gap-2.5 p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  {state.error}
                </div>
              )}

              <form action={formAction} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Alamat Email</label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="email@kamu.com"
                    className="w-full border border-input bg-background text-foreground rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={pending}
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground font-semibold py-3 rounded-xl transition-colors text-sm"
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
          <Link href="/login" className="text-primary hover:text-primary/80 flex items-center gap-1">
            <ArrowLeft size={14} /> Kembali ke Login
          </Link>
          <span className="text-border">·</span>
          <Link href="/reset-password" className="text-secondary hover:underline">
            Sudah punya kode OTP?
          </Link>
        </div>
      </div>
    </div>
  );
}
