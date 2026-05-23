"use client";

import { useState, useEffect } from "react";
import { Cookie, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const CONSENT_COOKIE = "da_cookie_consent";

function hasConsentCookie() {
  return document.cookie
    .split(";")
    .some((item) => item.trim().startsWith(`${CONSENT_COOKIE}=`));
}

function setConsent(value) {
  const expires = new Date(Date.now() + 15552000000).toUTCString();
  document.cookie = `${CONSENT_COOKIE}=${value}; expires=${expires}; Path=/; SameSite=Lax; Secure`;
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(null);

  useEffect(() => {
    setVisible(!hasConsentCookie());
  }, []);

  if (visible === null) return null;
  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] px-4 pb-4">
      <div className="mx-auto max-w-4xl rounded-xl border border-primary/20 bg-card p-4 shadow-2xl shadow-foreground/10 dark:border-primary/20 dark:bg-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Cookie size={20} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">
              Persetujuan cookies
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Situs ini memakai cookies penting untuk sesi login dan preferensi.
              Data non-esensial hanya dipakai setelah kamu setuju.
            </p>
          </div>
          <div className="flex flex-shrink-0 gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => {
                setConsent("essential");
                setVisible(false);
              }}
              aria-label="Gunakan cookies penting saja"
            >
              <X size={16} />
            </Button>
            <Button
              type="button"
              onClick={() => {
                setConsent("accepted");
                setVisible(false);
              }}
            >
              <ShieldCheck size={16} />
              Setuju
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}