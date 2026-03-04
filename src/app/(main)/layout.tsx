import { Navbar } from "@/components/navbar";
import { MobileNav } from "@/components/mobile-nav";
import { Onboarding } from "@/components/onboarding";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-20 md:pb-0">{children}</main>
      <MobileNav />
      <Onboarding />
    </div>
  );
}
