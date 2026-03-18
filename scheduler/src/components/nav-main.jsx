"use client"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "components/ui/sidebar"
import Link from "next/link"

export function NavMain({ items, label, onNotifClick }) {
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
                  if (item.title === "Notifications") {
                    e.preventDefault();
                    onNotifClick();
                  } 
                }}
            >
              {item.title === "Notifications" ? (
                <div className="flex items-center gap-3 w-full">
                  {item.icon && <item.icon className="!size-4 text-white/40 group-hover:text-blue-400" />}
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 group-hover:text-blue-400 transition-all">
                    {item.title}
                  </span>
                </div>
              ) : (
                <Link href={item.url || "#"} className="flex items-center gap-3 w-full">
                  {item.icon && <item.icon className="!size-4 text-white/40 group-hover:text-blue-400" />}
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
  )
}