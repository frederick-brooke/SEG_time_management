interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function GlassCard({ children, className = "", onClick }: GlassCardProps) {
  return (
    <div
    onClick={onClick}
      className={`
        relative rounded-2xl 
        border border-white/10 
        bg-white/[0.04] 
        backdrop-blur-sm 
        hover:border-blue-300/30 
        hover:bg-white/[0.06]
        transition-all duration-500
        ${className}
      `}
    >
      {/* glow */}
      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-700 bg-[radial-gradient(circle_at_50%_0%,rgba(90,150,255,0.12),transparent_70%)]" />

      <div className="relative">{children}</div>
    </div>
  );
}