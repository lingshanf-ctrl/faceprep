import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { Onboarding } from "@/components/onboarding";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 md:ml-64 min-h-screen">
        <main className="pb-20 md:pb-0">{children}</main>
      </div>
      <MobileNav />
      <Onboarding />
    </div>
  );
}
