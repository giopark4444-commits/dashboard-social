import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { runSnapshot } from "@/lib/snapshots";

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  // Fail-closed: sin secreto configurado, nadie pasa.
  if (!secret)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const auth = request.headers.get("authorization") ?? "";
  if (!safeEqual(auth, `Bearer ${secret}`))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const result = await runSnapshot();
  return NextResponse.json(result, { status: result.failed.length ? 207 : 200 });
}
