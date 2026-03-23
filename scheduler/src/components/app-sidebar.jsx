"use client";
import * as React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { checkUpcomingDeadlines } from "../app/actions/examActions";
import { getNotifications } from "../app/actions/notifications";
import { ToastContainer } from "./ToastContainer"; // adjust path if needed
import { checkUpcomingEventNotifications } from "@/src/app/actions/calendar/calendarNotifications";

import {
  IconCamera,
  IconDashboard,
  IconMessages,
  IconFileAi,
  IconFileDescription,
  IconListDetails,
  IconTrophy,
  IconUser,
  IconSearch,
  IconSettings,
  IconUserCog,
  IconBook,
  IconBell,
  IconCalendar,
  IconUsersGroup,
  IconShoppingCart,
  IconDeviceGamepad2

} from "@tabler/icons-react";

import { GraduationCap, Map } from "lucide-react";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import SearchPanel from "@/components/search-page/search-panel";
import NotificationModal from "../app/components/NotificationModal";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Search",
      action: "search",
      icon: IconSearch,
    },
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Messages",
      url: "/messages",
      icon: IconMessages,
    },
    {
      title: "Tasks",
      url: "/tasks",
      icon: IconListDetails,
    },
    {
      title: "Calendar",
      url: "/calendar",
      icon: IconCalendar,
    },
    {
      title: "Exam Planner",
      url: "/exam-planner",
      icon: GraduationCap,
    },
    {
      title: "Profile",
      url: "/profile",
      icon: IconUser,
    },
    {
      title: "Map",
      url: "/map",
      icon: Map,
    },
    {
      title: "Leaderboard",
      url: "/leaderboard",
      icon: IconTrophy,
    },
    {
      title: "Modules",
      url: "/modules",
      icon: IconBook,
    },
    {
      title: "Groups",
      url: "/groups",
      icon: IconUsersGroup,
    },
    {
      title: "Admin",
      url: "/admin",
      icon: IconUserCog,
      role: "SUPERUSER"
    },
    {
      title: "Notifications",
      action: "notifications",
      icon: IconBell,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: IconSettings, 
    },
    {
      title: "Shop",
      url: "/shop",
      icon: IconShoppingCart, 
    },
    {
      title: "Minigames",
      url: "/games",
      icon: IconDeviceGamepad2, 
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: IconCamera,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: IconFileDescription,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: IconFileAi,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    
  ],
};

export function AppSidebar({ onSearchClick, ...props }) {
  const [searchOpen,setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [toasts, setToasts] = useState([]);
  const prevCountRef = useRef(0);
  const prevIdsRef = useRef(new Set());
  const { data: session } = useSession();

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pollNotifications = useCallback(async () => {
    try {
      const data = await getNotifications();
      if (!data.notifications) return;

      const notifications = data.notifications;
      const count = notifications.length;

      // Find any notifications we haven't seen before
      const newNotifs = notifications.filter(
        (n) => !prevIdsRef.current.has(n.id)
      );

      // Show a toast for each new notification 
      if (prevIdsRef.current.size > 0 && newNotifs.length > 0) {
        const toShow = newNotifs.slice(0, 3);
        setToasts((prev) => [
          ...prev,
          ...toShow.map((n) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            type: n.type,
          })),
        ]);
      }

      // Update the set of known notification IDs
      prevIdsRef.current = new Set(notifications.map((n) => n.id));
      prevCountRef.current = count;
      setUnreadCount(count);
    } catch (err) {
      console.error("Failed to poll notifications:", err);
    }
  }, []);

  const pollUnreadMessages = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      if (!res.ok) return;
      const convs = await res.json();
      if (!Array.isArray(convs)) return;
      setUnreadMessageCount(convs.filter((c) => c.hasUnread).length);
    } catch (err) {
      console.error("Failed to poll unread messages:", err);
    }
  }, []);

React.useEffect(() => {
  setMounted(true);
}, []);

React.useEffect(() => {
  if (session?.user?.id) {
    checkUpcomingDeadlines(session.user.id);
    // Check for event notifications then immediately poll 
    checkUpcomingEventNotifications(session.user.id).then(() => {
      pollNotifications();
    });
  }
}, [session]);

React.useEffect(() => {
  if (!session?.user?.id) return;
  const interval = setInterval(() => {
    checkUpcomingEventNotifications(session.user.id).then(() => {
      pollNotifications(); 
    });
  }, 3 * 60 * 1000);
  return () => clearInterval(interval);
}, [session]);

// Poll for new notifications every 30 seconds (updates badge + toasts)
useEffect(() => {
  pollNotifications();
  const interval = setInterval(pollNotifications, 30_000);
  return () => clearInterval(interval);
}, [pollNotifications]);
  
useEffect(() => {
  const run = async () => { await pollUnreadMessages(); };
  run();
  const interval = setInterval(run, 30_000);
  return () => clearInterval(interval);
}, [pollUnreadMessages]);

  const handleOpenNotifications = () => {
    setNotifOpen(true);
    setUnreadCount(0); 
  };

  return (
    <>
      <Sidebar collapsible="offcanvas" className="!bg-transparent !border-none !shadow-none"{...props}>
        <div className="lunar-sidebar-ink">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  className="data-[slot=sidebar-menu-button]:!p-1.5"
                >
                  <a href="#">
                    <GraduationCap className="text-blue-400 !size-7 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
                    <span className="lunar-header text-xl">Lunar</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>

          <SidebarContent className="lunar-scroll px-2">
            <NavMain items={data.navMain} label="" onNotifClick={handleOpenNotifications} unreadCount={unreadCount} unreadMessageCount={unreadMessageCount} onSearchClick={() => setSearchOpen(true)} />
            <NavSecondary items={data.navSecondary} className="mt-auto" onSearchClick={onSearchClick}/>
          </SidebarContent>
          <SidebarFooter>
            <NavUser user={data.user} />
          </SidebarFooter>
        </div>
      </Sidebar>

      {/* Toast pop-ups — bottom right, auto-dismiss after 5s */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      {/* Notification Modal */}
      {mounted && (
        <NotificationModal
          isOpen={notifOpen}
          handleShowModal={() => setNotifOpen(false)}
        />
      )}

      {mounted && (
        <SearchPanel 
        open={searchOpen} 
        onClose={() => setSearchOpen(false)} 
        />
      )}
    </>
    
  );
}