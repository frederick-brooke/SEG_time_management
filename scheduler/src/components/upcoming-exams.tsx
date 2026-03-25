import Link from "next/link";
import * as React from "react";

/**
 * Component for the dashboard which displays exams occurring within the next 14 days.
 * Automatically sorts by proximity in date and provides direct link to the specific Exam Planner page.
 * @param {Object} props 
 * @param {Array} props.exams Array of Exam objects, including subtasks.
 * @returns {JSX.Element | null} The rendered list of exams coming up, or null if no exams in the near future.
 */
export function UpcomingExams({ exams }) {
    // Logic to filter for exams within a 14 day window and sort by date
    const upcoming = exams
        .filter((exam) => {
            const daysLeft = Math.ceil((new Date(exam.examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            return daysLeft >= 0 && daysLeft <= 14;
        })
        .sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime());

        if (upcoming.length === 0) return null;

        return (
            <div className="space-y-6">
                <h2 className="text-xl font-black tracking-widest text-white uppercase drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">Exams Approaching</h2>
                <div className="lunar-scroll-area transition-all space-y-4" style={{ maxHeight: "350px" }}>
                    {upcoming.map((exam) => (
                        <Link key={exam.id} href={`/exam-planner/${exam.id}`} className="block mb-4 last:mb-0">
                            <div className="group relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-5 backdrop-blur-xl transition-all hover:border-indigo-400 hover:shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:-translate-y-1">
                                <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-purple-500/10 blur-2xl group-hover:bg-purple-500/20 transition-colors" />
                                    <div className="flex justify-between items-start relative z-10">
                                        <div className="space-y-1">
                                            <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">{exam.title}</h3>
                                            <p className="text-xs font-medium text-indigo-200/60">
                                                {exam.tasks?.length || 0} Tasks remaining in your study plan
                                            </p>    
                                        </div>     

                                        <div className="flex flex-col items-end gap-2">
                                            <span className="text-[10px] bg-indigo-500 text-white px-3 py-1 rounded-full font-black tracking-lighter shadow-lg shadow-indigo-500/40">
                                                {new Date(exam.examDate).toLocaleDateString('en-GB')}
                                            </span>
                                        </div>                            
                                    </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        );
}