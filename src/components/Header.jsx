import { useBarberia } from "../context/BarberiaContext";

export default function Header() {
  const { barberia } = useBarberia();

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-zinc-200">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          Barber<span className="text-zinc-500">Panel</span>
        </h1>
        <p className="text-sm text-zinc-500">
          {barberia?.nombre || "Panel del dueño"}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-zinc-600">Dueño</span>
        <div className="w-9 h-9 rounded-full bg-zinc-200 flex items-center justify-center text-sm font-medium">
          👤
        </div>
      </div>
    </header>
  );
}
