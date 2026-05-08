export default function BrandTitle() {
  return (
    <div className="flex flex-col items-center gap-3">
      <h1
        className="text-7xl md:text-8xl lg:text-9xl font-bold text-white tracking-tight leading-none animate-fade-in"
        style={{ animationDelay: "0.2s", opacity: 0 }}
      >
        사지선다
      </h1>
      <span
        className="text-sm md:text-base text-white/50 tracking-[0.4em] uppercase font-light animate-fade-in"
        style={{ animationDelay: "0.4s", opacity: 0 }}
      >
        Sajiseonda
      </span>
    </div>
  );
}
