import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/src/lib/prisma";
import { SettingsClient } from "./SettingsClient";
import { Settings } from "lucide-react";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch complete user data including preferences and accounts
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      username: true,
      passwordHash: true,
      preferences: true,
      accounts: {
        where: { provider: 'google' }
      }
    }
  });

  if (!user) redirect("/login");

  const hasGoogleConnected = user.accounts.length > 0;
  const hasPassword = !!user.passwordHash;

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 pt-0">
      <div className="max-w-4xl w-full mx-auto py-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-gray-100 p-4 rounded-full text-gray-700">
            <Settings size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
            <p className="text-gray-500">Manage your account details, security, and integrations.</p>
          </div>
        </div>
        
        <SettingsClient 
          user={{
            username: user.username,
            email: user.email,
            hasPassword,
            hasGoogleConnected,
            preferences: user.preferences
          }} 
        />
      </div>
    </div>
  );
}