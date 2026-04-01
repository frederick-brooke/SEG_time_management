"use client";

/**
 * AppSidebar
 *
 * Primary application navigation sidebar. Renders nav sections, user footer,
 * notification bell, search panel, and polling for notifications and messages.
 * All polling is gated on an authenticated session to prevent unauthorised requests.
 */

import * as React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { checkUpcomingDeadlines } from "@/app/actions/examNotifications";
import { getNotifications } from "@/app/actions/notifications";
import { ToastContainer } from "../ui/ToastContainer";
import { checkUpcomingEventNotifications } from "@/app/actions/calendar/calendarNotifications";

import {
  IconDashboard,
  IconMessages,
  IconListDetails,
  IconTrophy,
  IconBook,
  IconBell,
  IconCalendar,
  IconUsersGroup,
  IconShoppingCart,
  IconDeviceGamepad2,
  IconUserCog,
  IconSettings,
  IconLogout,
  IconUser,
  IconSearch,
  IconDotsVertical,
} from "@tabler/icons-react";

import { GraduationCap, Map } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import Link from "next/link";
import SearchPanel from "@/components/search-page/SearchPanel";
import NotificationModal from "@/app/components/NotificationModal";
import { usePathname, useRouter } from "next/navigation";

const NAV_SECTIONS = [
  {
    label: "Workspace",
    items: [
      { title: "Dashboard",    url: "/dashboard",    icon: IconDashboard },
      { title: "Tasks",        url: "/tasks",        icon: IconListDetails },
      { title: "Calendar",     url: "/calendar",     icon: IconCalendar },
      { title: "Exam Planner", url: "/exam-planner", icon: GraduationCap },
      { title: "Modules",      url: "/modules",      icon: IconBook },
    ],
  },
  {
    label: "Social",
    items: [
      { title: "Messages",    url: "/messages",    icon: IconMessages },
      { title: "Leaderboard", url: "/leaderboard", icon: IconTrophy },
      { title: "Map",         url: "/map",         icon: Map },
      { title: "Groups",      url: "/groups",      icon: IconUsersGroup },
    ],
  },
  {
    label: "Extras",
    items: [
      { title: "Shop",      url: "/shop",  icon: IconShoppingCart },
      { title: "Minigames", url: "/games", icon: IconDeviceGamepad2 },
    ],
  },
];

const ADMIN_ITEM = { title: "Admin", url: "/admin", icon: IconUserCog };

/**
 * Renders a single navigation item as either a link or a button.
 *
 * @param {{ item: any; isActive?: boolean; badge?: number; onClick?: () => void }} props
 * @returns {JSX.Element} A styled nav item element
 */
function NavItem({ item, isActive, badge, onClick }: {
  item: any;
  isActive?: boolean;
  badge?: number;
  onClick?: () => void;
}) {
  const Icon = item.icon;

  const inner = (
    <span className={`
      group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 w-full
      ${isActive
        ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
        : "text-white/55 hover:text-white/90 hover:bg-white/[0.06]"}
    `}>
      <Icon size={17} className={isActive ? "text-blue-400" : "text-white/40 group-hover:text-white/70"} />
      <span className="flex-1 tracking-wide uppercase text-[11px] font-semibold">{item.title}</span>
      {badge != null && badge > 0 && (
        <span className="text-[10px] font-bold bg-blue-500 text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </span>
  );

  if (onClick) return <button onClick={onClick} className="w-full text-left">{inner}</button>;
  return <Link href={item.url} className="w-full">{inner}</Link>;
}

/**
 * Renders a labelled group of navigation items.
 *
 * @param {{ label: string; children: React.ReactNode }} props
 * @returns {JSX.Element} A nav section with a heading and slotted items
 */
function NavSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">{label}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

/**
 * Renders the sidebar footer with user avatar, name, and a dropdown menu
 * containing profile, settings, and sign-out actions.
 *
 * @param {{ session: any; status: string }} props
 * @returns {JSX.Element} The user footer element
 */
function UserFooter({ session, status }: { session: any; status: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (status === "loading") {
    return (
      <div className="flex items-center gap-3 px-3 py-2.5">
        <div className="w-7 h-7 rounded-full bg-white/10 animate-pulse" />
        <div className="h-3 w-24 rounded bg-white/10 animate-pulse" />
      </div>
    );
  }

  const name    = session?.user?.name || session?.user?.username || "User";
  const email   = session?.user?.email || "";
  const pfp     = session?.user?.image || null;
  const initial = name[0]?.toUpperCase() ?? "U";

  return (
    <div ref={ref} className="relative">
      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-2 rounded-2xl border border-white/10 bg-gray-900/95 backdrop-blur-md overflow-hidden shadow-xl shadow-black/50">
          <div className="px-4 py-3 border-b border-white/[0.08] flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-300 text-sm font-bold flex-shrink-0 overflow-hidden">
              {pfp ? <img src={pfp} alt={name} className="w-full h-full object-cover" /> : initial}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white/90 truncate">{name}</p>
              <p className="text-xs text-white/35 truncate">{email}</p>
            </div>
          </div>

          <div className="p-1.5 space-y-0.5">
            <button
              onClick={() => { router.push("/profile"); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-white/60 hover:text-white/90 hover:bg-white/[0.06] transition-colors"
            >
              <IconUser size={15} className="text-white/40" />
              Profile
            </button>
            <button
              onClick={() => { router.push("/settings"); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-white/60 hover:text-white/90 hover:bg-white/[0.06] transition-colors"
            >
              <IconSettings size={15} className="text-white/40" />
              Settings
            </button>
            <div className="border-t border-white/[0.08] my-1" />
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-red-400/80 hover:text-red-300 hover:bg-red-500/[0.08] transition-colors"
            >
              <IconLogout size={15} className="text-red-400/60" />
              Log out
            </button>
          </div>
        </div>
      )}

      <div
        onClick={() => router.push("/profile")}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.06] transition-colors group cursor-pointer"
      >
        <div className="w-7 h-7 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-300 text-xs font-bold flex-shrink-0 overflow-hidden">
          {pfp ? <img src={pfp} alt={name} className="w-full h-full object-cover" /> : initial}
        </div>
        <span className="flex-1 text-[13.3px] font-semibold text-white/70 truncate group-hover:text-white/90 transition-colors">
          {name}
        </span>
        <button
          data-testid="user-menu-button"
          onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white/90 hover:bg-white/10 transition-all duration-150 flex-shrink-0 opacity-80 group-hover:opacity-100"
        >
          <IconDotsVertical size={14} />
        </button>
      </div>
    </div>
  );
}

/**
 * Renders the notification bell button with an unread count badge.
 *
 * @param {{ count: number; onClick: () => void }} props
 * @returns {JSX.Element} The bell button element
 */
function NotificationBell({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <button
      data-testid="bell-button"
      onClick={onClick}
      className="relative w-8 h-8 flex items-center justify-center rounded-xl text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition-colors"
    >
      <IconBell size={19} />
      {count > 0 && (
        <span className="absolute top-0.5 right-0.5 min-w-[16px] h-[16px] bg-blue-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}

/**
 * Main application sidebar component.
 * Polls notifications and unread messages only when the user is authenticated.
 *
 * @param {any} props - Sidebar and forwarded props
 * @returns {JSX.Element} The full sidebar with modals and toast container
 */
export function AppSidebar({ onSearchClick, ...props }: any) {
  const [searchOpen, setSearchOpen]           = useState(false);
  const [notifOpen, setNotifOpen]             = useState(false);
  const [mounted, setMounted]                 = useState(false);
  const [unreadCount, setUnreadCount]         = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [toasts, setToasts]                   = useState<any[]>([]);
  const prevIdsRef                            = useRef(new Set<string>());
  const { data: session, status }             = useSession();
  const pathname                              = usePathname();
  const isAuthenticated                       = status === "authenticated";

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pollNotifications = useCallback(async () => {
    const data = await getNotifications();
    if (!data.notifications) return;

    const notifications = data.notifications;
    const newNotifs = notifications.filter((n: any) => !prevIdsRef.current.has(n.id));

    if (prevIdsRef.current.size > 0 && newNotifs.length > 0) {
      setToasts((prev) => [
        ...prev,
        ...newNotifs.slice(0, 3).map((n: any) => ({
          id: n.id, title: n.title, message: n.message, type: n.type,
        })),
      ]);
    }

    prevIdsRef.current = new Set(notifications.map((n: any) => n.id));
    setUnreadCount(notifications.length);
  }, []);

  const pollUnreadMessages = useCallback(async () => {
    const res = await fetch("/api/conversations");
    if (!res.ok) return;
    const convs = await res.json();
    if (!Array.isArray(convs)) return;
    setUnreadMessageCount(convs.filter((c: any) => c.hasUnread).length);
  }, []);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!isAuthenticated || !session?.user?.id) return;
    checkUpcomingDeadlines(session.user.id);
    checkUpcomingEventNotifications(session.user.id).then(() => pollNotifications());
  }, [isAuthenticated, session?.user?.id]);

  useEffect(() => {
    if (!isAuthenticated || !session?.user?.id) return;
    const interval = setInterval(() => {
      checkUpcomingEventNotifications(session.user.id).then(() => pollNotifications());
    }, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated, session?.user?.id, pollNotifications]);

  useEffect(() => {
    if (!isAuthenticated) return;
    pollNotifications();
    const interval = setInterval(pollNotifications, 30_000);
    return () => clearInterval(interval);
  }, [isAuthenticated, pollNotifications]);

  useEffect(() => {
    if (!isAuthenticated) return;
    pollUnreadMessages();
    const interval = setInterval(pollUnreadMessages, 30_000);
    return () => clearInterval(interval);
  }, [isAuthenticated, pollUnreadMessages]);

  const handleBellClick = () => {
    setNotifOpen(true);
    setUnreadCount(0);
  };

  const isAdmin = session?.user?.role === "SUPERUSER";

  return (
    <>
      <Sidebar collapsible="offcanvas" className="!bg-transparent !border-none !shadow-none" {...props}>
        <div className="lunar-sidebar-ink flex flex-col h-full">

          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <div className="flex items-center justify-between px-1.5 py-1">
                  <Link href="/dashboard" className="flex items-center gap-2">
                    <GraduationCap className="text-blue-400 !size-7 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
                    <span className="lunar-header text-xl">Lunar</span>
                  </Link>
                  <NotificationBell count={unreadCount} onClick={handleBellClick} />
                </div>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>

          <SidebarContent className="lunar-scroll px-2 flex-1 overflow-y-auto">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2 mb-5 rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white/40 hover:text-white/70 transition-all text-[11px] font-semibold uppercase tracking-widest"
            >
              <IconSearch size={14} />
              <span>Search</span>
              <span className="ml-auto text-[10px] border border-white/10 rounded px-1.5 py-0.5 text-white/25">⌘K</span>
            </button>

            {NAV_SECTIONS.map((section) => (
              <NavSection key={section.label} label={section.label}>
                {section.items.map((item) => (
                  <NavItem
                    key={item.url}
                    item={item}
                    isActive={pathname === item.url}
                    badge={item.url === "/messages" ? unreadMessageCount : undefined}
                  />
                ))}
              </NavSection>
            ))}

            {isAdmin && (
              <NavSection label="Admin">
                <NavItem item={ADMIN_ITEM} isActive={pathname === "/admin"} />
              </NavSection>
            )}
          </SidebarContent>

          <SidebarFooter className="px-2 pb-3 pt-2 border-t border-white/[0.06]">
            <UserFooter session={session} status={status} />
          </SidebarFooter>

        </div>
      </Sidebar>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {mounted && (
        <NotificationModal isOpen={notifOpen} handleShowModal={() => setNotifOpen(false)} />
      )}
      {mounted && (
        <SearchPanel open={searchOpen} onClose={() => setSearchOpen(false)} />
      )}
    </>
  );
}