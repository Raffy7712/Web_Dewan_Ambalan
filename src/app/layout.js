import { Geist } from "next/font/google";
import CookieConsent from "@/components/CookieConsent";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: "SMK Al Furqon — Dewan Ambalan Penegak",
  description:
    "Portal Dewan Ambalan Pramuka Penegak: Gudep Brebes 02.165 / 02.166 · SMK Al Furqon Bantarkawung. Satyaku Kudarmakan, Darmaku Kubaktikan.",
  icons: [
    { rel: "icon", url: "/logo.png" },
    { rel: "apple-touch-icon", url: "/logo.png" },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={geistSans.variable} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col antialiased">
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
