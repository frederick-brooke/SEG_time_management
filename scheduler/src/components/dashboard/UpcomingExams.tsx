/**
 * @file UpcomingExams.tsx
 * @description Displays exams due within 14 days. 
 * Uses midnight normalization and memoization to ensure accurate, 
 * high-performance date filtering and sorting.
 */
import Link from "next/link";
import { useMemo } from "react";

/**
 * Helper function to filter and sort exams by strict calendar days, ignoring time-of-day edge cases.
 * Separates business logic from presentation to satisfy V.2.3 (Pure Logic Unit).
 * * @param {Array} exams - Array of Exam objects to be filtered and sorted.
 * @param {number} [daysWindow=14] - The number of calendar days ahead to look for upcoming exams.
 * @returns {Array} A filtered and sorted array of upcoming Exam objects.
 */
export const getUpcomingExams = (exams, daysWindow = 14) => {
    const now = new Date();

    // Safely get local midnight timestamp
    const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());  
    // Safely add days handling DST transitions natively
    const msPerDay = 24 * 60 * 60 * 1000;
    const futureLimitUTC = todayUTC + (daysWindow * msPerDay);

    return exams.filter((exam) => {
        if (!exam.examDate) return false;
        const eDate = new Date(exam.examDate);
        const examDayUTC = Date.UTC(eDate.getUTCFullYear(), eDate.getUTCMonth(), eDate.getUTCDate());
        
        return examDayUTC >= todayUTC && examDayUTC <= futureLimitUTC;
    })
    .sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime());
};

/**
 * Component for the dashboard which displays exams occurring within the next 14 days.
 * Orchestrates the data flow and layout, maintaining Low Coupling (V.2.1).
 * Automatically sorts by proximity in date and provides direct link to the specific Exam Planner page.
 * * @param {Object} props - The component props.
 * @param {Array} props.exams - Array of Exam objects, including subtasks.
 * @returns {JSX.Element | null} The rendered list of exams coming up, or null if no exams in the near future.
 */
export function UpcomingExams({ exams = [] }) {
  // useMemo prevents heavy date recalculations on unrelated re-renders
  const upcoming = useMemo(() => getUpcomingExams(exams), [exams]);

  if (upcoming.length === 0) return null;

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-black tracking-widest text-white uppercase drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">
        Exams Approaching
      </h2>
      <div className="lunar-scroll-area space-y-4 overflow-y-auto pr-2" style={{ maxHeight: "350px" }}>
        {upcoming.map((exam) => (
          <ExamCard key={exam.id} exam={exam} />
        ))}
      </div>
    </section>
  );
}

/**
 * Sub-component that renders an individual exam link with "Lunar" styling.
 * Operates at one level of abstraction to keep nesting depth low (V.3.2).
 * * @param {Object} props - The component props.
 * @param {Object} props.exam - The specific Exam object to display.
 * @returns {JSX.Element} The rendered exam card element.
 */
function ExamCard({ exam }) {
  const taskCount = exam.tasks?.length || 0;
  const formattedDate = new Date(exam.examDate).toLocaleDateString("en-GB", {timeZone: 'UTC'});

  return (
    <Link href={`/exam-planner/${exam.id}`} className="block group transition-all hover:-translate-y-1">
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-5 backdrop-blur-xl hover:border-indigo-400 hover:shadow-[0_0_30px_rgba(99,102,241,0.3)]">
        <div className="flex justify-between items-start relative z-10">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
              {exam.title}
            </h3>
            <p className="text-xs text-indigo-200/60">{taskCount} Tasks remaining</p>
          </div>
          <span className="text-[10px] bg-indigo-500 text-white px-3 py-1 rounded-full font-black shadow-lg shadow-indigo-500/40">
            {formattedDate}
          </span>
        </div>
      </div>
    </Link>
  );
}