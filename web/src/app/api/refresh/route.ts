import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runSnapshot } from "@/lib/snapshots";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.email !== process.env.ALLOWED_EMAIL)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const result = await runSnapshot();
  return NextResponse.json(result);
}
