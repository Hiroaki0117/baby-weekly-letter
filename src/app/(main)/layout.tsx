import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background paper-grid">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-4 pb-24 md:py-8 md:pb-8">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
