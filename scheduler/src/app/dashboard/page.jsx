'use client';
import { AppSidebar } from "components/app-sidebar";
import { ToDoList } from "components/to-do-list";
import { SectionCards } from "components/section-cards";
import { SiteHeader } from "components/site-header";
import { SidebarInset, SidebarProvider } from "components/ui/sidebar";
"use client";

import { AppSidebar } from "@/src/components/app-sidebar";
import { SectionCards } from "@/src/components/section-cards";
import { SiteHeader } from "@/src/components/site-header";
import { SidebarInset, SidebarProvider } from "@/src/components/ui/sidebar";
import { ComingSoonCard } from "@/src/components/coming-up-soon";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function Page() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "GoogleAccountTaken" || error === "OAuthAccountNotLinked") {
      setErrorMessage("This Google Account is already linked to another user.");
      router.replace("/dashboard");
    }
  }, [searchParams, router]);

  if (status === "loading") return <p className="p-4">Loading session...</p>;

  const googleConnected = !!session?.user?.googleConnected;

  const handleLinkGoogle = async () => {
    await signIn("google", { 
      callbackUrl: "/dashboard",
      redirect: true
    });
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

        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 m-4 rounded relative">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{errorMessage}</span>
            <span 
              className="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer" 
              onClick={() => setErrorMessage("")}
            >
              <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <title>Close</title>
                <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
              </svg>
            </span>
          </div>
        )}

        <div className="p-4 border-b border-gray-200 mb-4">
          {session ? (
            <div className="flex flex-col gap-2">
              <p>Logged in as: {session.user?.email}</p>
              <p>
                Google connected: {googleConnected ? "Yes ✅" : "No ❌"}
              </p>

              <div className="flex gap-2 mt-2">
              {!googleConnected && (
                <button
                  onClick={handleLinkGoogle}
                  className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 transition"
                >
                  Connect Google Calendar
                </button>
              )}
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="rounded bg-gray-300 px-4 py-2 hover:bg-gray-400 transition"
              >
                Sign out
              </button>
            </div>
            </div>
          ) : (
            <p>Redirecting to login...</p>
          )}
        </div>

        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards />
            </div>
            <div>
              <ComingSoonCard />
            </div>
          </div>
        </div>

      </SidebarInset>
    </SidebarProvider>
  );
}