"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ToDoList } from "@/src/components/to-do-list";
import {
  getExamById,
  generateExamPlan,
  updateExamUnavailableDays,
} from "@/src/app/actions/examActions";

import { AppSidebar } from "@/src/components/app-sidebar";
import {
} from "@/src/components/animate-ui/components/radix/sidebar";
import { Button } from "@/src/components/ui/button";

import { Calendar } from "@/src/components/ui/calendar";

export default function ExamDetailPage() {
  const { id } = useParams();
  const [exam, setExam] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const [topics, setTopics] = useState([{ title: "", duration: 45, url: "" }]);
  const addTopic = () =>
    setTopics([...topics, { title: "", duration: 45, url: "" }]);

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
      const data = await getExamById(id);
      setExam(data);
    }
    if (id) loadExam();
  }, [id]);

  const handleUpdateUnavailableDays = async (days) => {
    const updated = await updateExamUnavailableDays(id, days);
    setExam(updated);
  };

  if (!exam) return <p className="p-10">Loading exam hub</p>;

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

  const handleUpdateSettings = async (newData) => {
    const updated = await updateExamSettings(id, newData);
    setExam(updated);
  };

  return (
          <main className="flex-1 p-6 space-y-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-extrabold tracking-tight">
              {exam.title} Hub
            </h1>
            <p className="text-muted-foreground">
              Target Goal: {exam.maxTimePerDay} mins/day | Exam Date:{" "}
              {new Date(exam.examDate).toLocaleDateString()}
            </p>
          </div>

          {/* Exam Plan Generator */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 border rounded-2xl shadow-sm flex flex-col">
              <h2 className="text-xl font-bold mb-2">1. Build Syllabus</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Specify time and materials for each topic.
              </p>
              <div className="space-y-4 mb-4 max-h-[400px] overflow-y-auto pr-2">
                {topics.map((topic, index) => (
                  <div
                    key={index}
                    className="flex flex-col gap-2 p-3 border rounded-xl bg-slate-50 relative"
                  >
                    <div className="flex gap-2">
                      <input
                        className="flex-1 p-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Topic Name"
                        values={topics.title}
                        onChange={(e) =>
                          updateTopic(index, "title", e.target.value)
                        }
                      />

                      <div className="flex items-center gap-1 bg-white border rounded-lg px-2">
                        <input
                          type="number"
                          className="w-10 text-sm outline-none"
                          value={topics.duration}
                          onChange={(e) =>
                            updateTopic(
                              index,
                              "duration",
                              parseInt(e.target.value) || 0,
                            )
                          }
                        />
                        <span className="text-[10px] text-muted-foreground font-bold">
                          MINS
                        </span>
                      </div>
                    </div>

                    <input
                      className="w-full p-2 text-[11px] border rounded-lg outline-none bg-white"
                      placeholder="Resource URL(Optional"
                      value={topic.url}
                      onChange={(e) =>
                        updateTopic(index, "url", e.target.value)
                      }
                    />

                    {topics.length > 1 && (
                      <button
                        onClick={() => removeTopic(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-[10px] flex items-center justify center"
                      >
                        x
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                onClick={addTopic}
                className="mb-4 border-dashed border-2"
              >
                + Add Topic
              </Button>

              <Button
                onClick={handleGenerate}
                className="w-full py-6 text-lg font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={isGenerating || topics.some((t) => !t.title.trim())}
              >
                {isGenerating ? "Generating..." : "Generate Study Plan"}
              </Button>
            </div>

            <div className="bg-white p-6 border rounded-2xl shadow-sm">
              <h2 className="text-xl font-bold mb-2">2. Busy Days</h2>
              <p className="text-sm text-muted-foreground mb-4">
                These dates will be skipped in the revision plan
              </p>
              <div className="p-4 border border-dashed rounded-xl text-center text-muted-foreground">
                <Calendar
                  mode="multiple"
                  selected={exam.unavailableDays}
                  onSelect={(days) => handleUpdateUnavailableDays(days)}
                  className="rounded-md border shadow"
                />
              </div>
            </div>
          </div>

          {/* Filtered Task Board */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Revision Task Board</h2>
            <ToDoList userId={exam.userId} exams={[exam]} filterExamId={id} />
          </div>
        </main>
  );
}
