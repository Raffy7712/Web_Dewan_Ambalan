import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getSession } from "@/lib/auth-session";

export default async function DashboardLayout({ children }) {
  const session = await getSession();
  const isAdmin = session?.role === "admin";

  return (
    <div className="flex flex-col min-h-screen bg-[var(--surface-app)] text-[var(--text-primary)]">
      <Navbar isAdmin={isAdmin} />
      <main className="flex-1 bg-[var(--surface-app)]">{children}</main>
      <Footer />
    </div>
  );
}
