import PageHeader from "@/components/PageHeader";
import CarruselEditor from "@/components/CarruselEditor";

export default function CarruselPage() {
  return (
    <div className="max-w-4xl">
      <PageHeader kicker="CONTENIDO" title="CARRUSEL STUDIO" demo />
      <p className="text-xs text-dim mb-5">Diseña carruseles con preview 4:5 listo para Instagram.</p>
      <CarruselEditor />
    </div>
  );
}
