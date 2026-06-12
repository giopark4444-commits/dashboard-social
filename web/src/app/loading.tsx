export default function Loading() {
  return (
    <div className="max-w-5xl">
      <div className="skeleton h-3 w-48 bg-surface-2 rounded mb-2" />
      <div className="skeleton h-8 w-72 bg-surface-2 rounded mb-6" />
      <div className="flex gap-3 mb-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton flex-1 h-32 bg-surface border border-border rounded-xl" />
        ))}
      </div>
      <div className="skeleton h-40 bg-surface border border-border rounded-xl" />
    </div>
  );
}
