import { redirect } from "next/navigation";

export default function WeeklyRedirectPage() {
  redirect("/album?tab=weekly");
}
