import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ClientLayout from "@/components/client-layout";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "关键词分析师 - 智能关键词分析工具",
  description: "智能关键词分析平台，帮助您发现热门关键词和分析竞争对手策略，制胜数字营销",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${inter.variable} antialiased font-sans`}
        suppressHydrationWarning={true}
      >
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
