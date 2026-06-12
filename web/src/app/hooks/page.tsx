import PageHeader from "@/components/PageHeader";
import HookGrid from "@/components/HookGrid";

export default function HooksPage() {
  return (
    <div className="max-w-4xl">
      <PageHeader kicker="CONTENIDO" title="HOOK BANK" demo />
      <p className="text-xs text-dim mb-5">
        Tu banco de ganchos con score. En la fase final, Hook Hunter (IA) generará variantes por marca y los clasificará solo.
      </p>
      <HookGrid />
    </div>
  );
}
