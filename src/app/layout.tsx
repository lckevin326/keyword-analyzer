import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ClientLayout from "@/components/client-layout";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "关键词分析师 - 智能关键词分析工具",
  description: "基于DataForSEO API的专业关键词分析平台，帮助您发现热门关键词和分析竞争对手策略",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
