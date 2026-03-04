import Link from "next/link";

export function UpcomingExams({ exams }) {
    const upcoming = exams
        .filter((exam) => {
            const daysLeft = Math.ceil((new Date(exam.examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            return daysLeft >= 0 && daysLeft <= 14;
        })
        .sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime());

        if (upcoming.length === 0) return null;

        return (
            <div className="space-y-4">
                <h2 className="text-xl font-bold tracking-tight">Exams Approaching</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {upcoming.map((exam) => (
                        <Link key={exam.id} href={`/exam-planner/${exam.id}`}>
                            <div className="group rounded-xl border bg-card p-4 hover:shadow-md transition-all border-l-4 border-l-indigo-500">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-bold text-indigo-900">{exam.title}</h3>
                                    <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-bold">
                                        {new Date(exam.examDate).toLocaleDateString('en-GB')}
                                    </span>                                            
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {exam.tasks?.length || 0} Tasks remaining in your study plan
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        );
}