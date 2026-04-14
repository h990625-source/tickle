import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomTabBar from "@/components/BottomTabBar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DeepFlow - 딥워크 집중 타이머",
  description: "진짜 몰입한 시간을 보여주는 타이머",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-50 selection:bg-blue-500 selection:text-white">
        {children}
        <BottomTabBar />
      </body>
    </html>
  );
}
