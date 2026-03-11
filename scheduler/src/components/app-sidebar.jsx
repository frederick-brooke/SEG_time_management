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
  IconUserCog,
  IconBook
} from "@tabler/icons-react";
import { GraduationCap } from "lucide-react";
import { NavMain } from "components/nav-main";
import { NavSecondary } from "components/nav-secondary";
import { NavUser } from "components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "components/ui/sidebar";

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
          <NavMain items={data.navMain} label="Main" />
          <NavSecondary items={data.navSecondary} className="mt-auto" onSearchClick={onSearchClick}/>
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={data.user} />
        </SidebarFooter>
      </Sidebar>
    

      <SearchPanel
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </>
    
  );
}
