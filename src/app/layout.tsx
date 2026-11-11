import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TGI Ascenseurs | ERP",
  description: "Gestion de Technique Général Installation — Casablanca"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
