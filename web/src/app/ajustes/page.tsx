import PageHeader from "@/components/PageHeader";
import { BRANDS } from "@/lib/brands";

function Estado({ ok, okText, pendText }: { ok: boolean; okText: string; pendText: string }) {
  return ok
    ? <span className="text-[10px] border border-ok/50 text-ok rounded-full px-2 py-0.5">{okText}</span>
    : <span className="text-[10px] border border-warn/50 text-warn rounded-full px-2 py-0.5">{pendText}</span>;
}

function Fila({ nombre, nota, children }: { nombre: string; nota: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/40 last:border-0">
      <div className="flex-1">
        <div className="text-sm font-bold text-bright">{nombre}</div>
        <div className="text-xs text-dim">{nota}</div>
      </div>
      {children}
    </div>
  );
}

export default function AjustesPage() {
  const yt = Boolean(process.env.YOUTUBE_API_KEY && process.env.YOUTUBE_CHANNEL_ID);
  const anthropic = Boolean(process.env.ANTHROPIC_API_KEY);
  const serviceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  return (
    <div className="max-w-2xl">
      <PageHeader kicker="SISTEMA" title="AJUSTES" />

      <p className="text-[10px] tracking-widest text-dim mt-4 mb-2">✦ MARCAS</p>
      <div className="bg-surface border border-border rounded-xl px-4 py-1">
        {BRANDS.map((b) => (
          <Fila key={b.id} nombre={b.name} nota={`workspace ${b.id}`}>
            <span className="w-3 h-3 rounded-full border border-border" style={{ background: b.color }} />
          </Fila>
        ))}
      </div>

      <p className="text-[10px] tracking-widest text-dim mt-6 mb-2">✦ CONEXIONES</p>
      <div className="bg-surface border border-border rounded-xl px-4 py-1">
        <Fila nombre="YouTube" nota="métricas diarias vía Data API">
          <Estado ok={yt} okText="CONECTADO" pendText="LLAVES PENDIENTES" />
        </Fila>
        <Fila nombre="Instagram" nota="requiere app de Meta Developers">
          <Estado ok={false} okText="" pendText="FASE APIS" />
        </Fila>
        <Fila nombre="Meta Ads" nota="requiere app de Meta Developers">
          <Estado ok={false} okText="" pendText="FASE APIS" />
        </Fila>
        <Fila nombre="Bot WhatsApp" nota="corre en el runner local">
          <Estado ok={false} okText="" pendText="FASE RUNNER" />
        </Fila>
      </div>

      <p className="text-[10px] tracking-widest text-dim mt-6 mb-2">✦ INTELIGENCIA</p>
      <div className="bg-surface border border-border rounded-xl px-4 py-1">
        <Fila nombre="API de Claude" nota="el cerebro del CMO Agent y el HUD">
          <Estado ok={anthropic} okText="CONECTADO" pendText="LLAVE PENDIENTE" />
        </Fila>
        <Fila nombre="Presupuesto diario de IA" nota="tope de gasto en API por día">
          <span className="text-sm font-bold text-bright">${process.env.DAILY_BUDGET_USD ?? "1.50"}</span>
        </Fila>
        <Fila nombre="Service role de Supabase" nota="necesaria para los crons">
          <Estado ok={serviceRole} okText="CONECTADO" pendText="LLAVE PENDIENTE" />
        </Fila>
      </div>

      <p className="text-[10px] tracking-widest text-dim mt-6 mb-2">✦ CUENTA</p>
      <div className="bg-surface border border-border rounded-xl px-4 py-1">
        <Fila nombre="Operador" nota={process.env.ALLOWED_EMAIL ?? "sin configurar"}>
          <span className="text-[10px] border border-accent/50 text-accent rounded-full px-2 py-0.5">PRO</span>
        </Fila>
      </div>
    </div>
  );
}
