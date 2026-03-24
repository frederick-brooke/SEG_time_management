"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ToDoList } from "@/src/components/to-do-list";
import { getExamById, generateExamPlan, updateExamUnavailableDays } from "@/src/app/actions/examActions";
import { Button } from "@/src/components/ui/button";
import { Calendar } from "@/src/components/ui/calendar";
import LunarThemeWrapper from "@/src/components/layout/LunarThemeWrapper";

/**
 * Exam Hub interface for a specific exam.
 * Allows users to define topics, block out unavailable dates
 * and trigger the automated study plan generator.
 */
export default function ExamDetailPage() {
    const { id } = useParams();
    const examId = id as string;
    const [exam, setExam] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [topics, setTopics] = useState([{ title: "", duration: 45, url: ""}]);

    /**
     * Topic management logic
     */
    const addTopic = () => setTopics([...topics, { title: "", duration: 45, url: ""}]);

    const updateTopic = (index, field, value) => {
        const newTopics = [...topics];
        newTopics[index][field] = value;
        setTopics(newTopics);
    };

    const removeTopic = (index) => {
        setTopics(topics.filter((_, i) => i !== index));
    };

    useEffect(() => {
        async function loadExam() {
            const data = await getExamById(examId);
            setExam(data);
        }
        if (examId) loadExam()
    }, [examId]);

    /**
     * Database syncing handlers
     */
    const handleUpdateUnavailableDays = async (days) => {
        const updated = await updateExamUnavailableDays(examId, days);
        setExam(updated);
    };

    if (!exam) return <p className="p-10 text-white/50 animate-pulse uppercase font-black tracking-widest text-xs">Loading exam hub</p>;

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            await generateExamPlan(exam.id, topics);
            window.location.reload();
        } catch (error) {
            console.error("Failed to generate plan:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <LunarThemeWrapper>
            <main className="relative z-10 flex-1 p-8 space-y-12 max-w-7xl mx-auto w-full text-white">
                <div className="flex flex-col gap-4 border-b border-white/10 pb-10">
                    <h1 className="lunar-page-title">{exam.title} Hub</h1>
                    <p className="lunar-page-subtitle">
                        Target Goal: {exam.maxTimePerDay} mins/day | Exam Date: {new Date(exam.examDate).toLocaleDateString()}
                    </p>
                </div>

                {/* Exam Plan Generator */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-[#111629]/60 p-6 border rounded-2xl shadow-sm flex flex-col">
                        <h2 className="lunar-header mb-2">1. Build Syllabus</h2>
                        <p className="text-sm text-muted-foreground mb-4">Specify time and materials for each topic.</p>
                        <div className="space-y-4 mb-4 max-h-[400px] overflow-y-auto pr-2">
                            {topics.map((topic, index) => (
                                <div key={index} className="flex flex-col gap-2 p-3 border rounded-xl bg-[#111629]/60 relative">
                                    <div className="flex gap-2">
                                        <input
                                            className="flex-1 lunar-input"
                                            placeholder="Topic Name"
                                            value={topic.title}
                                            onChange={(e) => updateTopic(index, 'title', e.target.value)}
                                        />

                                        <div className="flex items-center gap-1 bg-[#111629]/60 border rounded-lg px-2">
                                            <input
                                                type="number"
                                                className="w-10 lunar-input"
                                                min="1"
                                                onKeyDown={(e) => {
                                                    if (e.key === '-' || e.key === 'e') {
                                                        e.preventDefault();
                                                    }
                                                }}
                                                value={topic.duration}
                                                onChange={(e) => updateTopic(index, 'duration', parseInt(e.target.value) || 0)}
                                            />
                                            <span className="text-[10px] text-muted-foreground font-bold">MINS</span>
                                        </div>
                                    </div>
                        
                                    <input
                                        className="w-full lunar-input"
                                        placeholder="Resource URL(Optional"
                                        value={topic.url}
                                        onChange={(e) => updateTopic(index, 'url', e.target.value)}
                                    />

                                    {/* Circular X button to delete a topic */}
                                    {topics.length > 1 && (
                                        <button 
                                            onClick={() => removeTopic(index)}
                                            className="flex items-center justify-center shrink-0 w-6 h-6 rouded-full bg-red-100 text-red-600 hover:bg-red-500 hover:text-white transition-colors text-[10px]"
                                        >
                                            x
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <Button variant="outline" onClick={addTopic} 
                                className="mb-6 w-full py-4 border-2 border-dashed rounded-2xl transition-all font-black uppercase text-[10px] tracking-widest text-blue-400 border-blue-500/30 bg-white/5">
                            + Add Topic
                        </Button>

                        <Button
                            onClick={handleGenerate}
                            className="w-full py-6 text-lg font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                            disabled={isGenerating || topics.some(t => !t.title.trim())}
                        >
                            {isGenerating ? "Generating..." : "Generate Study Plan"}
                        </Button>
                    </div>

                    <div className="bg-[#111629]/60 p-6 border rounded-2xl shadow-sm">
                        <h2 className="lunar-header mb-2">2. Busy Days</h2>
                        <p className="text-sm text-muted-foreground mb-4">These dates will be skipped in the revision plan</p>
                        <div className="p-6 bg-black/40 border border-white rounded-[2rem] flex justify-center background-blur-md [color-scheme:dark]">
                            <Calendar
                                mode="multiple"
                                selected={exam.unavailableDays as Date[]}
                                onSelect={(days: Date[] | undefined) => handleUpdateUnavailableDays(days)}
                                className="rounded-md border-none text-white bg-transparent"
                                classNames={{}}
                                formatters={{}}
                                components={{}}
                            />
                        </div>
                    </div>
                </div>
            
                {/* Filtered Task Board */}
                <div className="mt-20 pt-20 border-t border-white/10 relative z-30">
                    <div className="mt-8">
                        <h2 className="lunar-page-title">Revision</h2>
                    </div>

                    {exam && (
                        <div className="relative">
                            <ToDoList 
                                userId={exam.userId} 
                                exams={[exam]} 
                                filterExamId={examId} 
                            />
                        </div>
                    )}
                </div>
            </main>
        </LunarThemeWrapper>

    );
}