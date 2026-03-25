"use client";

export default function LunarDrawer({
  open,
  onClose,
  side = "left",
  width = "500px",
  title,
  children,
}) {
  const isLeft = side === "left";

  return (
    <>
      {/* backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-8000 bg-black/20 backdrop-blur-sm transition-opacity duration-300
          ${open ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
      />

      {/* drawer */}
      <div
        className={`fixed top-0 ${isLeft ? "left-0 border-r" : "right-0 border-l"} h-screen flex flex-col
        bg-gradient-to-b from-[#020408] via-indigo-950 to-[#1a0b2e]
        shadow-2xl z-9999 transform transition-transform duration-300 ease-out
        ${
          open
            ? "translate-x-0"
            : isLeft
            ? "-translate-x-full"
            : "translate-x-full"
        }`}
        style={{ width }}
      >
        {/* header */}
        <div className="p-5 border-b border-white/10 flex-shrink-0">
          <h2 className="lunar-header text-2xl font-semibold text-white tracking-wide">
            {title}
          </h2>
        </div>

        {/* content */}
        <div className="flex flex-1 flex-col p-4 min-h-0">
          {children}
        </div>
      </div>
    </>
  );
}