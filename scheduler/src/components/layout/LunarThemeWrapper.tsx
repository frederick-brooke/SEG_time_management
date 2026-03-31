/**
 * Global theme wrapper component.
 */
import { StarField } from "@/components/landing/HeroSection";

/**
 * Wraps the application content in the standard Lunar visual theme.
 * @param {Object} props - Component properties.
 * @param {React.ReactNode} props.children - The child components or pages to be rendered above the background.
 * @returns {JSX.Element} The themed application wrapper.
 */
export default function LunarThemeWrapper({ children } : { children: React.ReactNode }) {
    return (
        <div className="relative min-h-screen bg-[#030712] text-white/90 overflow-x-hidden selection:bg-blue-500/30 z-10">
            {/* The Background Layer */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <StarField />
                {/* Nebula Glow */}
                <div
                    className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] opacity-20"
                    style = {{
                        background: "radial-gradient(circle, rgba(90, 150, 255, 0.1) 0%, transparent 70%)",
                    }}
                /> 
            </div>

            {/* Content Layer */}
            <div className="relative z-20">
                {children}
            </div>
        </div> 
    );
}