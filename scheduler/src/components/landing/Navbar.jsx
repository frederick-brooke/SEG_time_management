"use client";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-8 py-4 bg-transparent">
      <span className="text-xl font-bold">O Lunar</span>

      <div className="flex items-center gap-3">
        <button className="px-6 py-3 rounded-2xl bg-white/5 ring-1 ring-white/10 text-white/80 font-medium hover:bg-white/10 transition">
          Log In
        </button>

        <button className="px-6 py-3 rounded-2xl bg-blue-300 text-gray-950 font-semibold shadow-[0_0_30px_rgba(90,150,255,0.25)] hover:shadow-[0_0_50px_rgba(90,150,255,0.45)] transition">
          Get Started →
        </button>
      </div>
    </nav>
  );
}
