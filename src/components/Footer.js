import Link from "next/link";
import LogoImage from "./LogoImage";

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div>
          <Link href="/" className="flex items-center gap-2.5 mb-3 group w-fit">
            <div className="w-9 h-9 rounded-md overflow-hidden bg-primary/10 flex items-center justify-center flex-shrink-0">
              <LogoImage size={36} />
            </div>
            <div>
              <p className="text-primary text-[10px] font-semibold uppercase tracking-wider leading-tight">
                Gugus Depan Brebes 02.165 / 02.166
              </p>
              <p className="text-foreground font-bold text-sm leading-tight mt-1">
                Dewan Ambalan SMK Al Furqon Bantarkawung
              </p>
            </div>
          </Link>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Portal verifikasi keaslian dokumen pramuka penegak.
          </p>
        </div>
        <div>
          <h4 className="text-foreground font-semibold text-sm mb-3">Tautan</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/verify" className="text-muted-foreground hover:text-primary transition-colors">
                Verifikasi Dokumen
              </Link>
            </li>
            <li>
              <Link href="/admin" className="text-muted-foreground hover:text-primary transition-colors">
                Admin
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-4 px-4 text-center">
        <p className="text-muted-foreground text-xs">
          &copy; {new Date().getFullYear()} Dewan Ambalan SMK Al Furqon Bantarkawung. Semua hak dilindungi.
        </p>
      </div>
    </footer>
  );
}
