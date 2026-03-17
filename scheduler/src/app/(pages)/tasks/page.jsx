"use client";
import { ToDoList } from "@/src/components/to-do-list";
import { useSession } from "next-auth/react";
import { getMyExams } from "@/src/app/actions/examActions";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function TasksPage() {
  const { data: session, status } = useSession();
  const [exams, setExams] = useState([]);
  const searchParams = useSearchParams();
  const [highlightId, setHighlightId] = useState(null);

  useEffect(() => {
    const id = searchParams.get("highlight");
    if (id) {
      setHighlightId(id);;
      const timer = setTimeout(() => setHighlightId(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  useEffect(() => {
    async function loadExams() {
      if (session?.user?.id) {
        const data = await getMyExams();
        setExams(data);
      }
    }
    loadExams();
  }, [session]);

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <p>Loading...</p>
      </div>
    );
  }

  // Redirect or show message if not authenticated
  if (!session || !session.user) {
    return (
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <p>Please log in to view your tasks.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      {/* To-Do List Component */}
      <ToDoList 
        userId={session.user.id} 
        exams={exams} 
        highlightId={highlightId}
      />
    </div>
  );
}
