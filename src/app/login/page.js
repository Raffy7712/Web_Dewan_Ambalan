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
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">Selamat Datang!</h1>
            <p className="text-muted-foreground text-sm mt-1">Masuk ke portal Dewan Ambalan</p>
          </div>

          {resetSuccess && (
            <div className="mb-4 flex items-start gap-2.5 p-3 bg-primary/10 border border-primary/30 rounded-xl text-primary text-sm">
              <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
              Password berhasil direset! Silakan login dengan password baru kamu.
            </div>
          )}

          {state?.error && (
            <div className="mb-4 flex items-start gap-2.5 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              {state.error}
            </div>
          )}

          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="next" value={nextPath} />
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Username atau email</label>
              <input
                type="text"
                name="username"
                required
                autoComplete="username"
                placeholder="username_kamu atau email"
                className="w-full border border-input bg-background text-foreground rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  name="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full border border-input bg-background text-foreground rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={pending}
              className="mt-1 w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-primary-foreground font-semibold py-3 rounded-xl transition-colors text-sm"
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
            <Link href="/lupa-password" className="text-primary hover:underline text-xs">
              Lupa password? Klik di sini
            </Link>
            <p className="text-muted-foreground">
              Belum punya akun?{" "}
              <Link
                href={nextPath ? `/register?next=${encodeURIComponent(nextPath)}` : "/register"}
                className="text-secondary font-semibold hover:underline"
              >
                Daftar di sini
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
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
