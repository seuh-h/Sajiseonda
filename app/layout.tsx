import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AutoLogoutProvider from "@/components/AutoLogoutProvider";
import Footer from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "사지선다 | Sajiseonda",
  description: "나를 알아가는 가장 재미있는 방법",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <AutoLogoutProvider>{children}</AutoLogoutProvider>
        <Footer />
      </body>
    </html>
  );
}
