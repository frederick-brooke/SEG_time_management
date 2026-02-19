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
                setExams(exams.filter(exam => exam.id !== id));
            } catch (error) {
                console.error("Failed to delete:", error);
                alert("Could not delete exam");
            }
        }
    };

    if (status === "loading") return <p className="p-4">Loading session</p>

    return (
        <SidebarProvider
            style={{
                "--sidebar-width": "calc(var(--spacing) * 72)",
                "--header-height": "calc(var(--spacing) * 12)", 
            }}
        >
            <AppSidebar variant="inset" />
                <SidebarInset>
                    <SiteHeader />

                    <div className="flex flex-1 flex-col p-6 gap-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">Exam Planner</h1>
                                <p className="text-muted-foreground">Organsie your revision</p>
                            </div>
                            <ExamFormDialog onExamAdded={(newExam) => setExams([...exams, newExam])} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {exams.length > 0 ? (
                                exams.map((exam) => {
                                    const totalTasks = exam.tasks?.length || 0;
                                    const completedTasks = exam.tasks?.filter(t => t.status === "completed").length || 0;
                                    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                                    return (
                                        <div key={exam.id} className="p-6 border rounded-2xl bg-card shadow-sm flex flex-col gap-4">
                                            <div className="flex justify-between items-start">
                                                <h2 className="text-xl font-bold">{exam.title}</h2>

                                                {/* Task Counter */}
                                                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md border border-indigo-100 uppercase">
                                                    {totalTasks} {totalTasks === 1 ? 'Task' : 'Tasks'}
                                                </span>

                                            </div>

                                            <p className="text-sm text-muted-foreground mt-2">
                                                Exam Date: {new Date(exam.examDate).toLocaleDateString()}
                                            </p>
                                            <p className="text-sm font-medium mt-1">
                                                Daily Goal: {exam.maxTimePerDay} mins
                                            </p>

                                        {/* Progress Bar */}
                                        <div className="space-y-2 py-2">
                                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                <span>Revision Proress</span>
                                                <span>{progress}</span>
                                            </div>
                                            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-500 transition-all duration-500 ease-in-out"
                                                    style={{ width: `${progress}%`}}
                                                />                                    
                                            </div>
                                        </div>


                                        <div className="flex justify-end mt-4">
                                            <button
                                                onClick={() => handleDelete(exam.id)}
                                                className="text-xs font-bold text-red-500 hove:text-red-700 transition-colors px-2 py-1 rounded hover:bg-red-50"
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
            </SidebarInset>
        </SidebarProvider>
    );
}