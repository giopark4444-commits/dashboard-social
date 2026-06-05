export default function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2)
    return <div className="h-8 flex items-center text-xs text-stone-400">acumulando datos…</div>;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values
    .map((v, i) => `${(i / (values.length - 1)) * 100},${30 - ((v - min) / range) * 28}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 32" className="w-full h-8" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="2"
        className="text-emerald-600" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
