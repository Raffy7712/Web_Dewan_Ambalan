"use client";
import Image from "next/image";
import { useState } from "react";

/**
 * Logo wrapper that gracefully hides itself when /logo.png is missing.
 * Must be a Client Component because onError is an event handler.
 */
export default function LogoImage({ size = 32 }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <Image
      src="/logo.png"
      alt="Logo Dewan Ambalan"
      width={size}
      height={size}
      className="object-contain w-full h-full"
      onError={() => setFailed(true)}
      priority
    />
  );
}
