export default function AdminStats({ totalUsers, reports }){
  return(
      <section className="bg-white shadow rounded p-6 mb-4">
        <h2 className="text-2xl font-semibold mb-4">Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-100 p-4 rounded text-center">
            <p className="text-xl font-bold">
              {totalUsers}
            </p>
            <p>Total Users</p>
          </div>
          <div className="bg-yellow-100 p-4 rounded text-center">
            <p className="text-xl font-bold">
              {reports.filter(report => report.status === "PENDING").length}
            </p>
            <p>Active Reports</p>
          </div>
          <div className="bg-red-100 p-4 rounded text-center">
            <p className="text-xl font-bold">
              {reports.length}
            </p>
            <p>Total Reports</p>
          </div>
        </div>
      </section>
  )
}