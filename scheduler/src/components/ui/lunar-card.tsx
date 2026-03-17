export function LunarCard({ children, className = "", variant = "blue" }) {
    const variants = {
        blue: "border-indigo-500/30 bg-blue-950/20 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:border-indigo-400/50",
        purple: "border-indigo-500/30 bg-indigo-950/20 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:border-indigo-400/50",
    };

    return (
        <div className={`group relative overflow-hidden rounded-[2rem] border backdrop-blur-xl transition-all hover:-translate-y-1 ${variants[variant]} ${className}`}>
            {/* Nebula Glow */}
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-purple-500/10 blur-2xl group-hover:bg-purple-500/20 transition-colors pointers-events-none" />
            
            {/* Inner Content */}
            <div className="relative z-10">{children}</div>
        </div>
    );
}