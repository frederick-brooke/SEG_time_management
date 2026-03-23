"use client";
import * as React from "react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "components/ui/sidebar"

export function NavSecondary({
  items,
  onSearchClick,
  ...props
}) {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isSearch = item.title === "Search";

            return (
              <SidebarMenuItem key={item.title}>
                {isSearch ? (
                  <SidebarMenuButton
                    onClick={onSearchClick}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                ) : (
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
