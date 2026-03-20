import WellbeingPage from "@/src/app/(pages)/wellbeing/page";

export default function WellbeingPanel({ open, onClose }) {
  return (
    <>
      {/* backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* drawer */}
      <div
        className={`fixed top-0 right-0 h-screen w-[500px] flex flex-col
        bg-white/5 backdrop-blur-xl border-l border-white/10
        shadow-[0_0_40px_rgba(99,102,241,0.35)]
        z-50 transform transition-transform duration-300 ease-out
        ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            Wellbeing
          </h2>

          <button
            onClick={onClose}
            className="text-white/60 hover:text-pink-300 transition"
          >
            ✕
          </button>
        </div>

        {/* content */}
        <div className="flex-1 overflow-y-auto p-6 lunar-scroll">
          <WellbeingPage />
        </div>
      </div>
    </>
  );
}