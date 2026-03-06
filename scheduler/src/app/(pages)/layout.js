import { AppSidebar } from "components/app-sidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "components/ui/sidebar";

export default function PagesLayout({ children }) {
  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      }}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <div className="p-2">
          <SidebarTrigger />
        </div>
        {children}
        <div id="modal-root"></div>
      </SidebarInset>
    </SidebarProvider>
  );
}
