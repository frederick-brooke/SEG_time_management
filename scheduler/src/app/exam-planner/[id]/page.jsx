"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ToDoList } from "@/src/components/to-do-list";
import { getExamById, generateExamPlan, updateExamUnavailableDays } from "@/src/app/actions/examActions";
import { SiteHeader } from "@/src/components/site-header";

import { AppSidebar } from "@/src/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/src/components/ui/sidebar";
import { Button } from "components/ui/button";

import { Calendar } from "@/src/components/ui/calendar";

export default function ExamDetailPage() {
    const { id } = useParams();
    const [exam, setExam] = useState(null);
    const [syllabusText, setSyllabusText] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        async function loadExam() {
            const data = await getExamById(id);
            setExam(data);
        }
        if (id) loadExam()
    }, [id]);

    const handleUpdateUnavailableDays = async (days) => {
        const updated = await updateExamUnavailableDays(id, days);
        setExam(updated);
    };

    if (!exam) return <p className="p-10">Loading exam hub</p>;

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const topics = syllabusText.split('\n')
                .filter(line => line.trim() !== "")
                .map(line => ({ title: line.trim(), duration: 30}))
        
            await generateExamPlan(exam.id, topics);
            window.location.reload();
        } catch (error) {
            console.error("Failed to generate plan:", error);
        } finally {
            setIsGenerating(false);
        }
    };

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
                    <main className="flex-1 p-6 space-y-6">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-4xl font-extrabold tracking-tight">{exam.title} Hub</h1>
                            <p className="text-muted-foreground">
                                Target Goal: {exam.maxTimePerDay} mins/day | Exam Date: {new Date(exam.examDate).toLocaleDateString()}
                            </p>
                        </div>

                        {/* Exam Plan Generator */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white p-6 border rounded-2xl shadow-sm">
                                <h2 className="text-xl font-bold mb-2">1. Paste Syllabus</h2>
                                <p className="text-sm text-muted-foreground mb-4">One topic per line</p>
                                <textarea
                                    className="w-full p-4 border rounded-xl mb-4 h-40 text-sm"
                                    placeholder="e.g. Data Structures\nAlgorithms"
                                    value={syllabusText}
                                    onChange={(e) => setSyllabusText(e.target.value)}
                                />

                                <Button
                                    onClick={handleGenerate}
                                    className="w-full py-6 text-lg font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                                    disabled={!syllabusText.trim()}
                                >
                                    {isGenerating ? "Generating..." : "Generate Study Plan"}
                                </Button>
                            </div>

                            <div className="bg-white p-6 border rounded-2xl shadow-sm">
                                <h2 className="text-xl font-bold mb-2">2. Busy Days</h2>
                                <p className="text-sm text-muted-foreground mb-4">These dates will be skipped in the revision plan</p>
                                <div className="p-4 border border-dashed rounded-xl text-center text-muted-foreground">
                                    <Calendar
                                        mode="multiple"
                                        selected={exam.unavailableDays}
                                        onSelect={(days) => handleUpdateUnavailableDays(days)}
                                        className="rounded-md border shadow"
                                    />
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {exam.unavailableDays?.length > 0 ? (
                                        exam.unavailableDays?.map((date, i) => (
                                            <span key={i} className="text-[10px] bg-slate-100 px-2 py-1 rounded border">
                                                {new Date(date).toLocaleDateString()}
                                            </span>
                                        ))
                                    ) : (
                                        <p className="text-xs text-muted-foregorund">No busy days set</p>
                                    )}
                                </div>
                            </div>
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