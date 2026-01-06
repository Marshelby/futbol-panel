export default function StatCard({ title, value, accent = false }) {
  return (
    <div className="relative bg-white rounded-xl p-5 shadow-sm border border-zinc-200">
      {/* Accent line */}
      <div
        className={`absolute bottom-0 left-0 h-1 w-full rounded-b-xl ${
          accent ? "bg-amber-500" : "bg-zinc-200"
        }`}
      />

      <p className="text-sm text-zinc-500 tracking-wide uppercase">
        {title}
      </p>

      <p className="mt-2 text-2xl font-semibold text-zinc-900">
        {value}
      </p>
    </div>
  );
}
