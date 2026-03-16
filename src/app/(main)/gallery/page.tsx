import { redirect } from "next/navigation";

export default function GalleryRedirect() {
  redirect("/album?tab=photos");
}
