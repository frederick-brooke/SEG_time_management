"use client";
import * as React from "react";

import { useState } from "react";

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
      title: "Friends Map",
      url: "/friend-map",
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
      title: "Admin",
      url: "/admin",
      icon: IconUserCog,
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
    {
      title: "Search",
      action: "search",
      icon: IconSearch,
    },
  ],
};

export function AppSidebar({ onSearchClick, ...props }) {
  const [searchOpen,setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <Sidebar collapsible="offcanvas" 
                className="!bg-transparent !border-none !shadow-none"
                {...props}>
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
            <NavMain items={data.navMain} label="" onNotifClick={() => setNotifOpen(true)} />
            <NavSecondary items={data.navSecondary} className="mt-auto" onSearchClick={onSearchClick}/>
          </SidebarContent>
          <SidebarFooter>
            <NavUser user={data.user} />
          </SidebarFooter>
        </div>
      </Sidebar>

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