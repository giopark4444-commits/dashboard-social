import { cookies } from "next/headers";
import { BRAND_COOKIE, getBrand, resolveBrandId, type Brand } from "@/lib/brands";

/** Marca activa según cookie; personal por defecto. Solo server components/routes. */
export async function getActiveBrand(): Promise<Brand> {
  const store = await cookies();
  return getBrand(resolveBrandId(store.get(BRAND_COOKIE)?.value));
}
