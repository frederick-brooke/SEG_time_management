"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

import { AppSidebar } from "@/src/components/app-sidebar";
import { SiteHeader } from "@/src/components/site-header";
import { SidebarInset, SidebarProvider } from "@/src/components/ui/sidebar";
import { getMyExams, deleteExam } from "@/src/app/actions/examActions";
import ExamFormDialog from "@/src/components/exams/exam-form-dialog";

import Link from "next/link";

import LunarThemeWrapper from "@/src/components/layout/LunarThemeWrapper";

export default function ExamPlannerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [exams, setExams] = useState([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    async function loadExams() {
      if (session?.user?.id) {
        const data = await getMyExams();
        setExams(data);
      }
    }
    loadExams();
  }, [session]);

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this exam entry?")) {
      try {
        await deleteExam(id);
        setExams(exams.filter((exam) => exam.id !== id));
      } catch (error) {
        console.error("Failed to delete:", error);
        alert("Could not delete exam");
      }
    }
  };

  if (status === "loading") return <p className="p-4">Loading session</p>;

  return (
    <LunarThemeWrapper>
      <div className="flex flex-1 flex-col p-8 gap-8 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#020617] to-[#020617] min-h-screen text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-bold tracking-tight uppercase">Exam Planner</h1>
            <p className="text-white/40 font-bold uppercase tracking-[0.3em] text-[12px] mt-2">Organise your revision</p>
          </div>
          <ExamFormDialog
            onExamAdded={(newExam) => setExams([...exams, newExam])}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {exams.length > 0 ? (
            exams.map((exam) => {
              const totalTasks = exam.tasks?.length || 0;
              const completedTasks =
                exam.tasks?.filter((t) => t.status === "completed").length || 0;
              const progress =
                totalTasks > 0
                  ? Math.round((completedTasks / totalTasks) * 100)
                  : 0;

              return (
                <div
                  key={exam.id}
                  className="group relative p-8 bg-[#111629]/60 border border-white/5 backdrop-blur-md rounded-[2rem] shadow-2xl flex flex-col gap-6 transition-all hover:bg-[#111629]/80 hover:border-blue-500/20"
                >
                  <div className="flex justify-between items-start">
                    <Link
                      href={`/exam-planner/${exam.id}`}
                      className="text-2xl font-black uppercase tracking-tighter text-white group-hover:text-blue-400 transition-colors"
                    >
                      <h2 className="text-xl font-bold">{exam.title}</h2>
                    </Link>
                    <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md border border-indigo-100 uppercase">
                      {totalTasks} {totalTasks === 1 ? "Task" : "Tasks"}
                    </span>
                  </div>

                  <p className="bg-white/5 border border-white/10 text-blue-400 px-4 py-1.5 rounded-full text-[11px] font-black tracking-widest shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                    Exam Date: {new Date(exam.examDate).toLocaleDateString()}
                  </p>
                  <p className="text-sm font-medium mt-1">
                    Daily Goal: {exam.maxTimePerDay} mins
                  </p>

                  <div className="space-y-2 py-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <span>Revision Progress</span>
                      <span>{progress}</span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 transition-all duration-500 ease-in-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end mt-4">
                    <ExamFormDialog
                      editingExam={exam}
                      onExamUpdated={(updated) => {
                        setExams(
                          exams.map((e) => (e.id === updated.id ? updated : e)),
                        );
                      }}
                    />
                    <button
                      onClick={() => handleDelete(exam.id)}
                      className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors px-2 py-1 rounded hover:bg-red-50"
                    >
                      Delete Exam
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-20 border-2 border-dashed rounded-2xl text-center">
              <p className="text-muted-foreground">No exams found</p>
            </div>
          )}
        </div>
      </div>
    </LunarThemeWrapper>
  );
}
