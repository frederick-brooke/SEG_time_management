import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/src/components/app-sidebar";
import {
  SidebarProvider,
  SidebarInset,
} from "@/src/components/ui/sidebar";

export default function PagesLayout({ children }) {
  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      }}
    >
      <AppSidebar variant="inset"  />
      <SidebarInset className="bg-muted/40 p-6">
        <SiteHeader/>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
