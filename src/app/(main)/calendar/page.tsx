import { redirect } from "next/navigation";

export default function CalendarRedirect() {
  redirect("/diary?view=calendar");
}
