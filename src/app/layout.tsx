import type { Metadata } from "next";
import { M_PLUS_Rounded_1c, Lora } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { SwRegister } from "@/components/notification/sw-register";
import "./globals.css";

const mPlusRounded = M_PLUS_Rounded_1c({
  variable: "--font-rounded",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "すくすく日記",
  description:
    "日々の育児ログを簡単に残し、週1回AIで週次通信を自動生成するアプリ",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${mPlusRounded.variable} ${lora.variable} antialiased`}
      >
        {children}
        <Toaster />
        <SwRegister />
      </body>
    </html>
  );
}
