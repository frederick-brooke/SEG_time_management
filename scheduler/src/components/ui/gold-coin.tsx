export function GoldCoin({ size = 20 }: { size?: number }) {
    return (
      <span
        style={{ width: size, height: size, fontSize: size * 0.55 }}
        className="inline-flex items-center justify-center rounded-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.2),inset_0_1px_2px_rgba(255,255,255,0.4)] border border-yellow-600 font-black text-yellow-900 leading-none flex-shrink-0"
      >
        $
      </span>
    );
  }