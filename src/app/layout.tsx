import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { DemoStoreProvider } from "@/context/DemoStoreProvider";
import { DemoSwitcher } from "@/components/DemoSwitcher";
import { SaboreaCulinaryConcierge } from "@/components/SaboreaCulinaryConcierge";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SABOREA — A little joy in every bite.",
  description: "SABOREA Restaurant — Customer Ordering, Cashier POS, and Admin Dashboard Prototype",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-[#FAF6EE] text-[#231F1E] antialiased selection:bg-[#E7D4AD] selection:text-[#231F1E]">
        <DemoStoreProvider>
          {children}
          <SaboreaCulinaryConcierge />
          <DemoSwitcher />
        </DemoStoreProvider>
      </body>
    </html>
  );
}
