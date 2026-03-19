"use client";
import * as React from "react";
import { useState } from "react";
import { useSession } from "next-auth/react";

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
  IconBook
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
      title: "Admin",
      url: "/admin",
      icon: IconUserCog,
      role: "SUPERUSER"
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
  const { data: session } = useSession();

  const navMain = data.navMain.filter((item) => {
    if (item.title === "Admin") {
      return session?.user?.role === "SUPERUSER";
    }
    return true;
  });

  return (
    <>
      <Sidebar collapsible="offcanvas" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className="data-[slot=sidebar-menu-button]:!p-1.5"
              >
                <a href="#">
                  <GraduationCap className="!size-5" />
                  <span className="text-base font-semibold">Scheduler</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <NavSecondary items={data.navSecondary} onSearchClick={onSearchClick}/> 

          <NavMain items={navMain} label="Main" />

          <SearchPanel
            open={searchOpen}
            onClose={() => setSearchOpen(false)}
          />
                   
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={data.user} />
        </SidebarFooter>
      </Sidebar>
    </> 
  );
}