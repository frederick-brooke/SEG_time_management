"use client";
import { ToDoList } from "@/components/to-do-list";
import { useSession } from "next-auth/react";
import { getMyExams } from "@/app/actions/examActions";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { StarField } from "@/components/landing/HeroSection";
import LunarThemeWrapper from "@/components/layout/LunarThemeWrapper";

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
    <LunarThemeWrapper>
      {/* Space background elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <StarField />
        {/* Animated start field */}
        <div className="absolute inset-0 opacity-20 bg-[url('/stars.png')] bg-repeat" />
        {/* Glow orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h=[50%] bg-blue-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[120px] rounded-full" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col gap-6 p-6 md:p-12 max-w-[1600px] mx-auto">
        {/* To-Do List Component */}
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
