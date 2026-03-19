interface LunarCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "blue" |"purple";
  id?: string;
  onClick?: (e: React.MouseEvent) => void;
}

/**
 * The core container for the Lunar UI system.
 * Features a backdrop-blur and subtle border glow
 * to match the dark space aesthetic.
 * @param {string} className Additional tailwind classes for the layout.
 * @param {React.ReactNode} children The content of the card
 */
export function LunarCard({ children, className = "", variant = "blue", id, onClick}: LunarCardProps) {
    const variants = {
        blue: "border-indigo-500/30 bg-blue-950/20 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:border-indigo-400/50",
        purple: "border-indigo-500/30 bg-indigo-950/20 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:border-indigo-400/50",
    };

    return (
        <div id={id} onClick={onClick} className={`group relative overflow-hidden rounded-[2rem] border backdrop-blur-xl transition-all hover:-translate-y-1 ${variants[variant]} ${className}`}>
            {/* Nebula Glow - Top RIght */}
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-purple-500/10 blur-2xl group-hover:bg-purple-500/20 transition-colors pointer-events-none" />

            {/* Nebula Glow - Bottom Left */}
            <div className="absolute -left-4 -bottom-4 h-24 w-24 rounded-full bg-purple-500/10 blur-2xl group-hover:bg-purple-500/20 transition-colors pointer-events-none" />
            
            {/* Inner Content */}
            <div className="relative z-10">{children}</div>
        </div>
    );
}