"use client";

 /**
  * Client-side Tasks page.
  * Loads and renders user exams/tasks with session-based fetching,
  */

import { Suspense, useEffect, useState } from "react";
import { ToDoList } from "@/components/tasks/ToDoList";
import { useSession } from "next-auth/react";
import { getMyExams } from "@/app/actions/examActions";
import { useSearchParams } from "next/navigation";
import StarField from "@/components/effects/StarField"
import LunarThemeWrapper from "@/components/layout/LunarThemeWrapper";

function TasksContent() {
  const { data: session, status } = useSession();
  const [exams, setExams] = useState([]);
  const searchParams = useSearchParams();
  const [highlightId, setHighlightId] = useState(null);

  useEffect(() => {
    const id = searchParams.get("highlight");
    if (id) {
      setHighlightId(id);
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

  if (status === "loading") {
    return (
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <p>Loading...</p>
      </div>
    );
  }

  if (!session || !session.user) {
    return (
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <p>Please log in to view your tasks.</p>
      </div>
    );
  }

  return (
    <LunarThemeWrapper>
      <div className="absolute inset-0 z-0 pointer-events-none">
        <StarField />
        <div className="absolute inset-0 opacity-20 bg-[url('/stars.png')] bg-repeat" />
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h=[50%] bg-blue-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 flex flex-col gap-6 p-6 md:p-12 max-w-[1600px] mx-auto">
        <div className="mt-4">
          <ToDoList 
            userId={session.user.id} 
            exams={exams} 
            highlightId={highlightId}
          />
        </div>
      </div>
    </LunarThemeWrapper>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading tasks...</div>}>
      <TasksContent />
    </Suspense>
  );
}