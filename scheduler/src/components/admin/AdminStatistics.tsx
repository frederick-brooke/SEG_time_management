import { useAdminStats } from "@/hooks/useAdminStats";
//UI components
import GlassCard from "@/components/ui/glassCard";
import { motion } from "framer-motion";

/**
 * AdminStatistics component
 * 
 * Displays high-level platform metrics for admins, including:
 * - Total users
 * - Total reports
 * - Total appeals
 * 
 * Data is fetched via the useAdminStats hook and rendered in animated cards.
 * 
 * @returns {JSX.Element} Statistics dashboard section
 */
export default function AdminStatistics(){
    const { totalUsers, totalReports, totalAppeals } = useAdminStats();		// Fetch aggregated admin statistics from custom hook

    const stats = [		//structured stats array for each metric card
        { label: "Total Users", value: totalUsers },
        { label: "Total Reports", value: totalReports },
        { label: "Total Appeals", value: totalAppeals },
    ];

    return(
        <section className="mb-10">
            <h2 className="lunar-header text-2xl md:text-3xl font-semibold mb-6 text-white">
                Statistics
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
					<motion.div
						key={stat.label}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: i * 0.1 }}
					>
						<GlassCard className="text-center py-8">

						{/* number */}
						<p className="lunar-page-subtitle text-3xl md:text-4xl font-semibold text-white mb-2">
							{stat.value ?? "-"}
						</p>

						{/* label */}
						<p className="text-sm text-white/60 tracking-wide">
							{stat.label}
						</p>

						</GlassCard>
					</motion.div>
                ))}
            </div>
      </section>
    )
}