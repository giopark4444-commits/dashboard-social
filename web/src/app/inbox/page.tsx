import PageHeader from "@/components/PageHeader";
import InboxList from "@/components/InboxList";

export default function InboxPage() {
  return (
    <div className="max-w-3xl">
      <PageHeader kicker="CENTRO" title="INBOX" demo />
      <p className="text-xs text-dim mb-5">
        Comentarios, DMs y menciones de todos tus canales en una sola bandeja, con respuesta sugerida lista para aprobar.
      </p>
      <InboxList />
    </div>
  );
}
