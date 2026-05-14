"use client";

import { useState } from "react";
import { Cookie, ShieldCheck, X } from "lucide-react";

const CONSENT_COOKIE = "da_cookie_consent";

function hasConsentCookie() {
  return document.cookie
    .split(";")
    .some((item) => item.trim().startsWith(`${CONSENT_COOKIE}=`));
}

function setConsent(value) {
  const maxAge = 60 * 60 * 24 * 180;
  document.cookie = `${CONSENT_COOKIE}=${value}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(() => {
    if (typeof document === "undefined") return false;
    return !hasConsentCookie();
  });

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] px-4 pb-4">
      <div className="mx-auto max-w-4xl rounded-xl border border-emerald-200 bg-white p-4 shadow-2xl shadow-slate-900/20 dark:border-emerald-800/50 dark:bg-[#111827]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            <Cookie size={20} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              Persetujuan cookies
            </p>
            <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              Situs ini memakai cookies penting untuk sesi login dan preferensi.
              Data non-esensial hanya dipakai setelah kamu setuju.
            </p>
          </div>
          <div className="flex flex-shrink-0 gap-2">
            <button
              type="button"
              onClick={() => {
                setConsent("essential");
                setVisible(false);
              }}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              aria-label="Gunakan cookies penting saja"
            >
              <X size={16} />
            </button>
            <button
              type="button"
              onClick={() => {
                setConsent("accepted");
                setVisible(false);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
            >
              <ShieldCheck size={16} />
              Setuju
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
