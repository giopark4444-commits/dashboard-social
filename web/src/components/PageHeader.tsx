import DemoBadge from "@/components/DemoBadge";

export default function PageHeader({ kicker, title, demo, children }: {
  kicker: string; title: string; demo?: boolean; children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-1">
      <div>
        <p className="text-[10px] tracking-[0.25em] text-accent">✦ {kicker}</p>
        <h1 className="text-2xl font-extrabold text-bright tracking-wider">
          {title} {demo && <DemoBadge />}
        </h1>
      </div>
      {children}
    </div>
  );
}
