import { useAdminStats } from "@/src/hooks/useAdminStats";
//UI components
import GlassCard from "@/components/ui/glassCard";
import { motion } from "framer-motion";

export default function AdminStatistics(){
    const { totalUsers, totalReports, totalAppeals } = useAdminStats();

    const stats = [
        { label: "Total Users", value: totalUsers },
        { label: "Total Reports", value: totalReports },
        { label: "Total Appeals", value: totalAppeals },
    ];

    console.log(totalUsers);

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