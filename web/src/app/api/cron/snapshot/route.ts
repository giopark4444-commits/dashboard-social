import { NextRequest, NextResponse } from "next/server";
import { runSnapshot } from "@/lib/snapshots";

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const result = await runSnapshot();
  return NextResponse.json(result, { status: result.failed.length ? 207 : 200 });
}
