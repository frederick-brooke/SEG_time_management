"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

import { AppSidebar } from "@/src/components/app-sidebar";
import { SiteHeader } from "@/src/components/site-header";
import { SidebarInset, SidebarProvider } from "@/src/components/ui/sidebar";
import { getMyExams } from "@/src/app/actions/examActions";
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
                                exams.map((exam) => (
                                    <div key={exam.id} className="p-6 border rounded-2xl bg-card shadow-sm">
                                        <h2 className="text-xl font-bold">{exam.title}</h2>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Exam Date: {new Date(exam.examDate).toLocaleDateString()}
                                        </p>
                                        <p className="text-sm font-medium mt-1">
                                            Daily Goal: {exam.maxTimePerDay} mins
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full py-20 border-2 border-dashed rounded-2xl text-center">
                                    <p className="text-muted-foreground">No exams found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </SidebarInset>
        </SidebarProvider>
    )
}