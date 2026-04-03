import * as React from "react";

export interface SidebarProviderProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
  animateOnHover?: boolean;
  containerClassName?: string;
  transition?: Record<string, unknown>;
}

export interface SidebarTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
}

export interface SidebarRailProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
}

export interface SidebarInsetProps extends React.HTMLAttributes<HTMLElement> {
  className?: string;
}

export interface SidebarInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  type?: string;
}

export interface SidebarHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export interface SidebarFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export interface SidebarSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export interface SidebarContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export interface SidebarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export interface SidebarGroupLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  asChild?: boolean;
}

export interface SidebarGroupActionProps extends React.HTMLAttributes<HTMLElement> {
  className?: string;
  asChild?: boolean;
}

export interface SidebarGroupContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export interface SidebarMenuProps extends React.HTMLAttributes<HTMLUListElement> {
  className?: string;
}

export interface SidebarMenuItemProps extends React.HTMLAttributes<HTMLLIElement> {
  className?: string;
}

export type SidebarMenuButtonSize = "default" | "sm" | "lg";
export type SidebarMenuButtonVariant = "default" | "outline";

export interface SidebarMenuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  isActive?: boolean;
  variant?: SidebarMenuButtonVariant;
  size?: SidebarMenuButtonSize;
  tooltip?: string | Record<string, unknown>;
  className?: string;
}

export interface SidebarMenuActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  asChild?: boolean;
  showOnHover?: boolean;
}

export interface SidebarMenuBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export interface SidebarMenuSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  showIcon?: boolean;
}

export interface SidebarMenuSubProps extends React.HTMLAttributes<HTMLUListElement> {
  className?: string;
}

export interface SidebarMenuSubItemProps extends React.HTMLAttributes<HTMLLIElement> {
  className?: string;
}

export type SidebarMenuSubButtonSize = "sm" | "md";

export interface SidebarMenuSubButtonProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  asChild?: boolean;
  size?: SidebarMenuSubButtonSize;
  isActive?: boolean;
  className?: string;
}

export interface SidebarContextValue {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  isMobile: boolean;
  openMobile: boolean;
  setOpenMobile: React.Dispatch<React.SetStateAction<boolean>>;
  toggleSidebar: () => void;
}
