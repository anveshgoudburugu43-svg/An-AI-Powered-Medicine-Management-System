import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "PharmAide - Pharmacy Inventory",
  description: "Your Pharmacy Inventory, On Autopilot.",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={figtree.variable}>
      <body
        className="antialiased"
        style={{ fontFamily: 'var(--font-figtree), system-ui, -apple-system, sans-serif' }}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
