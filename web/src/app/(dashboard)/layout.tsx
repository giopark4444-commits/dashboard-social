import Sidebar from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("snapshots")
    .select("created_at")
    .order("created_at", { ascending: false })
    .limit(1);
  const updatedAt = data?.[0]
    ? new Date(data[0].created_at).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="flex">
      <Sidebar updatedAt={updatedAt} />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
