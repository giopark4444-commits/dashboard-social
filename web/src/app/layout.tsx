import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Dashboard Social" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-stone-50 text-stone-900">{children}</body>
    </html>
  );
}
