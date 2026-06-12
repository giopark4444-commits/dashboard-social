import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AGENTS, AUTONOMY_LEVELS, type Autonomy } from "@/lib/agents";
import { BRANDS } from "@/lib/brands";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "no auth" }, { status: 401 });

  const body = (await req.json()) as
    { agentId?: string; brandId?: string; autonomy?: Autonomy };
  const valid =
    AGENTS.some((a) => a.id === body.agentId) &&
    BRANDS.some((b) => b.id === body.brandId) &&
    AUTONOMY_LEVELS.includes(body.autonomy as Autonomy);
  if (!valid) return NextResponse.json({ error: "payload inválido" }, { status: 400 });

  const { error } = await supabase.from("agent_settings").upsert(
    {
      agent_id: body.agentId,
      brand_id: body.brandId,
      autonomy: body.autonomy,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "agent_id,brand_id" }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
