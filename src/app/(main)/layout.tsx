import { Header } from "@/components/layout/header";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background paper-grid">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-8">{children}</main>
    </div>
  );
}
