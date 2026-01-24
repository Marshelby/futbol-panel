export default function BotTemplate({
  categorias,
  categoriaActiva,
  setCategoriaActiva,
  plantillasFiltradas,
  onSelectPlantilla,
}) {
  return (
    <>
      {/* TABS DE CATEGORÍAS */}
      <div className="flex gap-2 p-4 border-b border-black">
        {categorias.map((cat) => (
          <button
            key={cat}
            onClick={() =>
              setCategoriaActiva(cat === categoriaActiva ? null : cat)
            }
            className={`px-4 py-2 rounded-full text-sm border font-semibold transition ${
              categoriaActiva === cat
                ? "bg-black text-white"
                : "bg-white hover:bg-gray-100"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* BOTONES DE PLANTILLAS */}
      {categoriaActiva && (
        <div className="p-4 border-b border-black bg-gray-50 grid grid-cols-2 gap-2">
          {plantillasFiltradas.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelectPlantilla(p)}
              className="
                bg-[#1E3A8A]
                text-white
                font-extrabold
                rounded-lg
                px-4
                py-3
                text-sm
                border
                border-black
                transition
                hover:bg-[#1E40AF]
                active:scale-[0.98]
              "
            >
              {p.titulo}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
