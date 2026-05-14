"use client";
import Link from "next/link";
import LogoImage from "@/components/LogoImage";
import { useActionState, useState } from "react";
import {
  sendVerificationAction,
  verifyAndRegisterAction,
} from "@/app/actions/auth";
import {
  AlertCircle,
  UserPlus,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronLeft,
  Mail,
  ShieldCheck,
} from "lucide-react";

function StepBar({ step }) {
  const steps = ["Data Diri", "Password", "Verifikasi"];
  return (
    <div className="flex items-center gap-1 mb-6">
      {steps.map((label, i) => {
        const s = i + 1;
        const active = step >= s;
        return (
          <div key={label} className="flex items-center gap-1 flex-1">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
                active
                  ? "bg-purple-700 text-white"
                  : "bg-gray-200 dark:bg-purple-900/40 text-gray-400 dark:text-purple-600"
              }`}
            >
              {s}
            </div>
            <span
              className={`text-xs font-medium hidden sm:block ${active ? "text-purple-700 dark:text-purple-300" : "text-gray-400 dark:text-purple-600"}`}
            >
              {label}
            </span>
            {s < 3 && (
              <div
                className={`flex-1 h-0.5 rounded ${step > s ? "bg-purple-700" : "bg-gray-200 dark:bg-purple-900/40"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ErrorBox({ message }) {
  if (!message) return null;
  return (
    <div className="mb-4 flex items-start gap-2.5 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl text-red-700 dark:text-red-300 text-sm">
      <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
      {message}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-purple-300 mb-1.5">
        {label}
      </label>
      {children}
      {hint && (
        <p className="text-xs text-gray-400 dark:text-purple-500 mt-1">
          {hint}
        </p>
      )}
    </div>
  );
}

const inputCls =
  "w-full border border-gray-300 dark:border-purple-700 bg-white dark:bg-[#1e1640] text-gray-900 dark:text-purple-50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400 dark:placeholder-purple-600 transition";

export default function RegisterClient({ registrationEnabled, nextPath = "" }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    display_name: "",
    email: "",
    username: "",
    password: "",
    konfirmasi: "",
  });
  const [step1Err, setStep1Err] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showKonfirmasi, setShowKonfirmasi] = useState(false);
  const [otpState, otpAction, otpPending] = useActionState(sendVerificationAction, null);
  const [regState, regAction, regPending] = useActionState(verifyAndRegisterAction, null);

  if (!registrationEnabled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-950 via-[#1a0d3d] to-[#0c0a1e] flex flex-col items-center justify-center px-4 py-12 text-white">
        <div className="w-full max-w-md bg-[#150f2d] border border-purple-800/60 rounded-2xl p-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Pendaftaran Ditutup</h1>
          <p className="text-purple-300 text-sm mb-6">
            Admin sedang menutup pendaftaran akun baru. Silakan coba lagi nanti.
          </p>
          <Link href="/login" className="inline-flex justify-center w-full bg-amber-600 hover:bg-amber-500 text-white font-semibold py-3 rounded-xl transition-colors">
            Kembali ke Login
          </Link>
        </div>
      </div>
    );
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setStep1Err("");
  }

  function goNext1(e) {
    e.preventDefault();
    if (!form.display_name.trim()) return setStep1Err("Nama lengkap wajib diisi.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setStep1Err("Format email tidak valid.");
    if (form.username.length < 3) return setStep1Err("Username minimal 3 karakter.");
    if (!/^[a-z0-9_]+$/.test(form.username)) return setStep1Err("Username hanya huruf kecil, angka, underscore.");
    setStep1Err("");
    setStep(2);
  }

  if (otpState?.success && step === 2) setStep(3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-[#1a0d3d] to-[#0c0a1e] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-amber-600 overflow-hidden flex items-center justify-center shadow-lg">
            <LogoImage size={48} />
          </div>
        </Link>
        <div className="bg-white dark:bg-[#150f2d] rounded-2xl shadow-2xl shadow-purple-950/60 border border-purple-100 dark:border-purple-800/50 p-8">
          <div className="mb-5">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-purple-50">
              Buat akun portal pramuka
            </h1>
            <p className="text-gray-500 dark:text-purple-400 text-sm mt-1">
              Satu akun untuk berita, kegiatan, dan mengikuti seleksi calon pengurus ambalan
              jika kamu siap.
            </p>
          </div>
          <StepBar step={step} />
          {step === 1 && (
            <form onSubmit={goNext1} className="flex flex-col gap-4">
              <ErrorBox message={step1Err} />
              <Field label="Nama Lengkap"><input type="text" name="display_name" value={form.display_name} onChange={handleChange} placeholder="Nama lengkap kamu" className={inputCls} /></Field>
              <Field label="Alamat Email" hint="Dipakai untuk verifikasi dan recovery password"><input type="email" name="email" value={form.email} onChange={handleChange} placeholder="email@kamu.com" className={inputCls} /></Field>
              <Field label="Username" hint="Huruf kecil, angka, dan underscore saja"><input type="text" name="username" value={form.username} onChange={handleChange} placeholder="huruf_kecil_angka" className={inputCls} /></Field>
              <button type="submit" className="mt-1 w-full flex items-center justify-center gap-2 bg-purple-800 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm">Lanjut <ChevronRight size={16} /></button>
            </form>
          )}
          {step === 2 && (
            <form action={otpAction} className="flex flex-col gap-4">
              <input type="hidden" name="display_name" value={form.display_name} />
              <input type="hidden" name="email" value={form.email} />
              <input type="hidden" name="username" value={form.username} />
              <input type="hidden" name="password" value={form.password} />
              <input type="hidden" name="konfirmasi" value={form.konfirmasi} />
              <ErrorBox message={otpState?.error} />
              <Field label="Password"><div className="relative"><input type={showPass ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min. 8 karakter, huruf dan angka" className={`${inputCls} pr-10`} /><button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-purple-500">{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></Field>
              <Field label="Konfirmasi Password"><div className="relative"><input type={showKonfirmasi ? "text" : "password"} value={form.konfirmasi} onChange={(e) => setForm({ ...form, konfirmasi: e.target.value })} placeholder="Ulangi password" className={`${inputCls} pr-10`} /><button type="button" onClick={() => setShowKonfirmasi(!showKonfirmasi)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-purple-500">{showKonfirmasi ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></Field>
              <div className="flex gap-3 mt-1">
                <button type="button" onClick={() => setStep(1)} className="flex-none flex items-center gap-1.5 px-4 py-3 border border-gray-300 dark:border-purple-700 text-gray-600 dark:text-purple-300 rounded-xl hover:bg-gray-50 dark:hover:bg-purple-900/30 text-sm font-medium transition-colors"><ChevronLeft size={16} /> Kembali</button>
                <button type="submit" disabled={otpPending} className="flex-1 flex items-center justify-center gap-2 bg-purple-800 hover:bg-purple-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors text-sm">{otpPending ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Mail size={16} />}{otpPending ? "Mengirim OTP..." : "Kirim Kode OTP"}</button>
              </div>
            </form>
          )}
          {step === 3 && (
            <form action={regAction} className="flex flex-col gap-4">
              <input type="hidden" name="next" value={nextPath} />
              <input type="hidden" name="display_name" value={form.display_name} />
              <input type="hidden" name="email" value={form.email} />
              <input type="hidden" name="username" value={form.username} />
              <input type="hidden" name="password" value={form.password} />
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/40 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1"><ShieldCheck size={18} className="text-purple-600 dark:text-purple-400" /><p className="font-semibold text-gray-700 dark:text-purple-200 text-sm">Cek Email Kamu!</p></div>
                <p className="text-xs text-gray-500 dark:text-purple-400">Kode OTP 6 digit sudah dikirim ke <strong className="text-purple-700 dark:text-purple-300">{form.email}</strong>. Berlaku 15 menit.</p>
              </div>
              <ErrorBox message={regState?.error} />
              <Field label="Kode OTP (6 digit)"><input type="text" name="otp" required maxLength={6} pattern="\d{6}" placeholder="1 2 3 4 5 6" className={`${inputCls} font-mono tracking-[0.5em] text-center text-xl`} /></Field>
              <button type="submit" disabled={regPending} className="w-full flex items-center justify-center gap-2 bg-purple-800 hover:bg-purple-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors text-sm">{regPending ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <UserPlus size={16} />}{regPending ? "Membuat akun..." : "Verifikasi & Daftar"}</button>
              <button type="button" onClick={() => setStep(2)} className="text-xs text-center text-purple-500 dark:text-purple-400 hover:underline">Tidak dapat kode? Klik untuk kirim ulang OTP</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
