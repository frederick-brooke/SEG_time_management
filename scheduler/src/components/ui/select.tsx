"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import type {
  SelectContentProps as RadixSelectContentProps,
  SelectItemProps as RadixSelectItemProps,
} from "@radix-ui/react-select"

import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react"
import { cn } from "lib/utils"

/* Root */

export function Select(props: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

/* Group */

export function SelectGroup(props: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />
}

/* Value */

export function SelectValue(props: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

/* Trigger */

type SelectTriggerProps = React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "default" | "sm"
}

export function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: SelectTriggerProps) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "border-input data-[placeholder]:text-muted-foreground flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm shadow-xs outline-none",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="size-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

/* Content */

type SelectContentProps = RadixSelectContentProps & {
  position?: "item-aligned" | "popper"
  align?: "center" | "start" | "end"
}

export function SelectContent({
  className,
  children,
  position = "item-aligned",
  align = "center",
  ...props
}: SelectContentProps) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        position={position}
        align={align}
        className={cn(
          "bg-popover text-popover-foreground z-50 max-h-96 min-w-[8rem] overflow-y-auto rounded-md border shadow-md",
          className
        )}
        {...props}
      >
        <SelectScrollUpButton />

        <SelectPrimitive.Viewport className="p-1">
          {children}
        </SelectPrimitive.Viewport>

        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

/* Label */

export function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn("px-2 py-1.5 text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

/* Item */

export function SelectItem({
  className,
  children,
  ...props
}: RadixSelectItemProps) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-none",
        className
      )}
      {...props}
    >
      <span className="absolute right-2 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>

      <SelectPrimitive.ItemText>
        {children}
      </SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

/* Separator */

export function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("bg-border my-1 h-px", className)}
      {...props}
    />
  )
}

/* Scroll buttons */

export function SelectScrollUpButton(
  props: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>
) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className="flex items-center justify-center py-1"
      {...props}
    >
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  )
}

export function SelectScrollDownButton(
  props: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>
) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className="flex items-center justify-center py-1"
      {...props}
    >
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  )
}