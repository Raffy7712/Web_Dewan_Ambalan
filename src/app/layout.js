import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: "Verifikasi Keaslian Dokumen | Dewan Ambalan",
  description:
    "Portal verifikasi keaslian dokumen (sertifikat, piagam, surat, voucher) Dewan Ambalan Pramuka Penegak SMK Al Furqon Bantarkawung.",
  icons: [
    { rel: "icon", url: "/logo.png" },
    { rel: "apple-touch-icon", url: "/logo.png" },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={geistSans.variable} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col antialiased">{children}</body>
    </html>
  );
}
