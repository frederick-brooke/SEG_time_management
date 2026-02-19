"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ToDoList } from "@/src/components/to-do-list";
import { getExamById } from "@/src/app/actions/examActions";
import { SiteHeader } from "@/src/components/site-header";

import { AppSidebar } from "@/src/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/src/components/ui/sidebar";

export default function ExamDetailPage() {
    const { id } = useParams();
    const [exam, setExam] = useState(null);

    useEffect(() => {
        async function loadExam() {
            const data = await getExamById(id);
            setExam(data);
        }
        loadExam();
    }, [id]);

    if (!exam) return <p className="p-10">Loading exam hub</p>;

    return (
        <SidebarProvider 
            style={{
                "--sidebar-width": "calc(var(--spacing) * 72)",
                "--sidebar-height": "calc(var(--spacing) * 12)",
            }}
        >
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                    <main className="flex-1 p-6 space-y-6">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-4xl font-extrabold tracking-tight">{exam.title} Hub</h1>
                            <p className="text-muted-foreground">
                                Target Goal: {exam.maxTimePerDay} mins/day | Exam Date: {new Date(exam.examDate).toLocaleDateString()}
                            </p>
                        </div>
                    
                        {/* Filtered Task Board */}
                        <div className="mt-8">
                            <h2 className="text-2xl font-bold mb-4">Revision Task Board</h2>
                            <ToDoList userId={exam.userId} exams={[exam]} filterExamId={id} />
                        </div>
                    </main>
                </SidebarInset>
            </SidebarProvider>
    );
}