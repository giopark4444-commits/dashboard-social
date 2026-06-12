export type Brand = { id: string; name: string; color: string };

// Debe coincidir con la tabla public.brands (migración 0002)
export const BRANDS: Brand[] = [
  { id: "personal", name: "Marca Personal", color: "#4f8cff" },
  { id: "vendalo",  name: "Vendalo",        color: "#25d366" },
  { id: "oriole",   name: "Oriole 1060",    color: "#f0b429" },
  { id: "bar1060",  name: "1060 Bar",       color: "#e4573d" },
  { id: "clientes", name: "Clientes",       color: "#a06bfa" },
];

export const DEFAULT_BRAND_ID = "personal";
export const BRAND_COOKIE = "vantage_brand";

/** valida un slug de marca; cae a personal si no existe */
export function resolveBrandId(raw: string | undefined | null): string {
  return BRANDS.some((b) => b.id === raw) ? (raw as string) : DEFAULT_BRAND_ID;
}

export function getBrand(id: string): Brand {
  return BRANDS.find((b) => b.id === id) ?? BRANDS[0];
}
