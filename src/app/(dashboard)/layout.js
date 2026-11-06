import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getSession } from "@/lib/auth-session";

export default async function DashboardLayout({ children }) {
  const session = await getSession();
  const isAdmin = session?.role === "admin";

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar isAdmin={isAdmin} />
      <main className="flex-1 bg-background">{children}</main>
      <Footer />
    </div>
  );
}
