import { redirect } from "next/navigation";

export default function WeeklyRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  // searchParams is async in Next.js 16 but we only need sync redirect
  // Default to weekly tab; if ?tab=monthly, redirect to monthly tab
  void searchParams;
  redirect("/logs?tab=weekly");
}
