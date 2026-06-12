import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import MobileTopbar from "@/components/MobileTopbar";
import { createClient } from "@/lib/supabase/server";
import { getActiveBrand } from "@/lib/brands-server";

export const metadata: Metadata = { title: "Vantage Studio" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const brand = await getActiveBrand();
  const { data } = await supabase
    .from("snapshots")
    .select("created_at")
    .order("created_at", { ascending: false })
    .limit(1);
  const updatedAt = data?.[0]
    ? new Date(data[0].created_at).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <html lang="es">
      <body className="bg-background text-foreground">
        <MobileTopbar brand={brand} />
        <div className="flex">
          <div className="hidden md:block">
            <Sidebar updatedAt={updatedAt} brand={brand} />
          </div>
          <main className="flex-1 p-4 pt-16 md:p-6">{children}</main>
        </div>
        {process.env.DEMO_MODE === "1" && process.env.NODE_ENV === "development" && (
          <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 text-[10px] tracking-widest bg-warn/15 border border-warn/50 text-warn rounded-full px-3 py-1 backdrop-blur">
            ◉ MODO DEMO LOCAL — SIN SESIÓN
          </div>
        )}
      </body>
    </html>
  );
}
