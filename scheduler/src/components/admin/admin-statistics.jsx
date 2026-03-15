import { useAdminStats } from "@/hooks/useAdminStats";

export default function AdminStatistics(){
    const { totalUsers, totalReports, totalAppeals } = useAdminStats();

    return(
        <section className="bg-white shadow rounded p-6 mb-4">
            <h2 className="text-2xl font-semibold mb-4">
                Statistics
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-400 p-4 rounded text-center">
                    <p className="text-xl font-bold">
                    {totalUsers}
                    </p>
                    <p>Total Users</p>
                </div>

                <div className="bg-red-400 p-4 rounded text-center">
                    <p className="text-xl font-bold">
                        {totalReports}
                    </p>

                    <p>Total Reports</p>
                </div>
                
                <div className="bg-yellow-400 p-4 rounded text-center">
                    <p className="text-xl font-bold">
                        {totalAppeals}
                    </p>
                    <p>Total Appeals</p>
                </div>
            </div>
      </section>



    )
}