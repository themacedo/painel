import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Inter_Tight } from "next/font/google";
import "./globals.css";

const inter = Inter_Tight({ subsets: ["latin"], variable: "--font-inter" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono-num" });

export const metadata: Metadata = {
  title: "Painel pessoal",
  description: "Finanças e desempenho como dev num lugar só.",
  robots: { index: false, follow: false },
  applicationName: "Painel",
  appleWebApp: { capable: true, title: "Painel", statusBarStyle: "black-translucent" },
  icons: { apple: "/icones/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f4f5f7" }, { media: "(prefers-color-scheme: dark)", color: "#0d0e11" }],
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} ${mono.variable} antialiased`}>{children}</body>
    </html>
  );
}
