import * as SidebarExports from "../Sidebar"; 

describe("Sidebar Barrel Exports", () => {
  it("should successfully export all expected components and hooks", () => {
    const expectedExports = [
      "Sidebar",
      "SidebarContent",
      "SidebarFooter",
      "SidebarGroup",
      "SidebarGroupAction",
      "SidebarGroupContent",
      "SidebarGroupLabel",
      "SidebarHeader",
      "SidebarInput",
      "SidebarInset",
      "SidebarMenu",
      "SidebarMenuAction",
      "SidebarMenuBadge",
      "SidebarMenuButton",
      "SidebarMenuItem",
      "SidebarMenuSkeleton",
      "SidebarMenuSub",
      "SidebarMenuSubButton",
      "SidebarMenuSubItem",
      "SidebarProvider",
      "SidebarRail",
      "SidebarSeparator",
      "SidebarTrigger",
      "useSidebar",
    ];

    // Verify that every expected export actually exists and is not undefined
    expectedExports.forEach((exportName) => {
      expect(SidebarExports[exportName as keyof typeof SidebarExports]).toBeDefined();
    });

    expect(Object.keys(SidebarExports).length).toBe(expectedExports.length);
  });
});