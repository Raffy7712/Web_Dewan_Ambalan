import { MapPin, Phone, Mail, Globe } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-muted-foreground border-t border-primary/30 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-center sm:text-left">
        <span className="flex items-center gap-1.5">
          <MapPin size={14} className="text-accent shrink-0" />
          Jl. Raya Bantarkawung, Brebes, Jawa Tengah 52274
        </span>
        <span className="flex items-center gap-1.5">
          <Phone size={14} className="text-accent shrink-0" />
          (0289) 123456
        </span>
        <span className="flex items-center gap-1.5">
          <Mail size={14} className="text-accent shrink-0" />
          <a href="mailto:praskaba7@gmail.com" className="hover:text-white transition-colors">
            praskaba7@gmail.com
          </a>
        </span>
        <span className="flex items-center gap-1.5">
          <Globe size={14} className="text-accent shrink-0" />
          <a href="https://da-alf.web.id" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
            da-alf.web.id
          </a>
        </span>
      </div>
    </footer>
  );
}
