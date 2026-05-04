import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scan Menu Dashboard",
  description: "Multilingual restaurant operations dashboard"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" data-scroll-behavior="smooth">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
