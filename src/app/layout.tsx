import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Painel pessoal",
  description: "Finanças e desempenho como dev num lugar só.",
  robots: { index: false, follow: false },
  applicationName: "Painel",
  appleWebApp: { capable: true, title: "Painel", statusBarStyle: "black-translucent" },
  icons: { apple: "/icones/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f6f7fb" }, { media: "(prefers-color-scheme: dark)", color: "#000000" }],
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} antialiased`}>{children}</body>
    </html>
  );
}
