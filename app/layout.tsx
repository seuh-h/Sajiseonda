import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import AutoLogoutProvider from "@/components/AutoLogoutProvider";
import Footer from "@/components/Footer";
import { LanguageProvider } from "@/contexts/LanguageContext";

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
        <Script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.6.0/kakao.min.js"
          integrity="sha384-6MFdIr0zOira1CHQkedUqJVql0YtcZA1P0nbPrQYJXVJZUkTk/oX4U9GhUIs3/8"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <LanguageProvider>
          <AutoLogoutProvider>{children}</AutoLogoutProvider>
        </LanguageProvider>
        <Footer />
      </body>
    </html>
  );
}
