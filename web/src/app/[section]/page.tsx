import { notFound } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav";

export default async function SectionPage({ params }:
  { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const item = NAV_ITEMS.find((i) => i.slug === section);
  if (!item) notFound();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="text-5xl mb-3 text-accent">{item.icon}</div>
      <h1 className="text-2xl font-bold text-bright tracking-wider">{item.label}</h1>
      <p className="text-muted mt-1">
        {item.phase ? `Próximamente — llega en la Fase ${item.phase}.` : "Próximamente."}
      </p>
    </div>
  );
}
