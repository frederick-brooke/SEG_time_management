"use client"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/src/components/ui/sidebar"
import Link from "next/link"

export function NavMain({ items, label, onNotifClick, unreadCount = 0, unreadMessageCount = 0, onSearchClick }) {
  return (
    <SidebarGroup>
      {label && <SidebarGroupLabel className="lunar-label !text-blue-400/80 mb-4 px-2 uppercase text-[10px]">{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild={item.title !== "Notifications"}
                className="lunar-sidebar-item"
                onClick={(e) => {
                  if (item.action === "notifications") {
                    e.preventDefault();
                    onNotifClick?.();
                  }

                  if (item.action === "search") {
                    e.preventDefault();
                    onSearchClick?.();
                  }
                }}
              >
                {item.title === "Notifications" ? (
                  <div className="flex items-center gap-3 w-full">
                    <div className="relative">
                      {item.icon && <item.icon className="!size-4 text-white/40 group-hover:text-blue-400" />}
                      {unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] font-black rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 group-hover:text-blue-400 transition-all">
                      {item.title}
                    </span>
                  </div>
                ) : (
                  <Link href={item.url || "#"} className="flex items-center gap-3 w-full">
                    <div className="relative">
                      {item.icon && <item.icon className="!size-4 text-white/40 group-hover:text-blue-400" />}
                      {item.title === "Messages" && unreadMessageCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] font-black rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5">
                          {unreadMessageCount > 9 ? "9+" : unreadMessageCount}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 group-hover:text-blue-400 transition-all">
                      {item.title}
                    </span>
                  </Link>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}