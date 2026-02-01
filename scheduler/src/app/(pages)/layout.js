import { AppSidebar } from "@/src/components/app-sidebar";
import {
  SidebarProvider,
  SidebarInset,
} from "@/src/components/ui/sidebar";

export default function PagesLayout({ children }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-muted/40 p-6">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
