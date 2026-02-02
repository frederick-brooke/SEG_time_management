'use client';
import { AppSidebar } from "components/app-sidebar";
import { ToDoList } from "components/to-do-list";
import { SectionCards } from "components/section-cards";
import { SiteHeader } from "components/site-header";
import { SidebarInset, SidebarProvider } from "components/ui/sidebar";

import { useSession, signIn, signOut } from "next-auth/react";

export default function Page() {
  const { data: session, status } = useSession();

  if (status === "loading") return <p className="p-4">Loading session...</p>;

const googleConnected = !!session?.user?.googleConnected;

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
                  onClick={async () => {
                    const result = await signIn("google", {
                      redirect: false, 
                      callbackUrl: "/dashboard",
                    });

                    if (result?.error) {
                      alert(
                        "Could not link Google account. Make sure you signed up with email first."
                      );
                    } else {
                      alert("Google account linked successfully!");
                      window.location.reload();
                    }
                  }}
                  className="rounded bg-blue-500 px-4 py-2 text-white"
                >
                  Connect Google
                </button>
              )}
              <button
                onClick={() => signOut()}
                className="rounded bg-gray-300 px-4 py-2"
              >
                Sign out
              </button>
            </div>
            </div>
          ) : (
            <p>Please sign in with your email/password on the login page.</p>
          )}
        </div>

        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards />
              <div className="px-4 lg:px-6">
                <ToDoList />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}