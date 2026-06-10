import { notFound } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav";

const PHASE_BY_SLUG: Record<string, string> = {
  posts: "Fase 6", constancia: "Fase 6", ideas: "Fase 7", asistente: "Fase 7",
  audiencia: "Fase 7", voz: "Fase 7", proximos: "Fase 8", calendario: "Fase 8",
  tendencias: "Fase 8", referentes: "Fase 8", campanas: "Fase 8",
  telegram: "Fase 2", discord: "Fase 3", ajustes: "Fase 4",
};

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const item = NAV_ITEMS.find((i) => i.slug === section);
  if (!item) notFound();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="text-5xl mb-3">{item.emoji}</div>
      <h1 className="text-2xl font-bold mb-1">{item.label}</h1>
      <p className="text-stone-500">Próximamente — llega en la {PHASE_BY_SLUG[section]}.</p>
    </div>
  );
}
