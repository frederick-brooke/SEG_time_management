'use client';

import { Button } from "@/components/ui/Button";

import * as React from 'react';
import { motion } from 'motion/react';

import { Slot } from '@/components/animate-ui/primitives/animate/Slot';
import { useGlobalTooltip, useTooltip } from './Tooltip.context';
import {
  TooltipProvider,
  TooltipPortal,
  TooltipArrow,
  LocalTooltipProvider,
  shallowEqualWithoutChildren,
} from './Tooltip.primitives';
import type { Side, Align } from './Tooltip.context';

// Tooltip 

type TooltipProps = {
  children: React.ReactNode;
  side?: Side;
  sideOffset?: number;
  align?: Align;
  alignOffset?: number;
};

function Tooltip({
  children,
  side = 'top',
  sideOffset = 0,
  align = 'center',
  alignOffset = 0,
}: TooltipProps) {
  const id = React.useId();
  const [props, setProps] = React.useState<Record<string, unknown>>({});
  const [asChild, setAsChild] = React.useState(false);

  return (
    <LocalTooltipProvider
      value={{ props, setProps, asChild, setAsChild, side, sideOffset, align, alignOffset, id }}
    >
      {children}
    </LocalTooltipProvider>
  );
}

// TooltipContent

type TooltipContentProps = {
  asChild?: boolean;
  [key: string]: unknown;
};

function TooltipContent({ asChild = false, ...props }: TooltipContentProps) {
  const { setProps, setAsChild } = useTooltip();
  const lastPropsRef = React.useRef<Record<string, unknown> | undefined>(undefined);

  React.useEffect(() => {
    if (!shallowEqualWithoutChildren(lastPropsRef.current, props)) {
      lastPropsRef.current = props;
      setProps(props);
    }
  }, [props, setProps]);

  React.useEffect(() => {
    setAsChild(asChild);
  }, [asChild, setAsChild]);

  return null;
}

// TooltipTrigger 

type SlotChild = React.ReactElement<Record<string, unknown> & { ref?: React.Ref<unknown> }>;

type TooltipTriggerProps = {
  ref?: React.Ref<HTMLDivElement>;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseLeave?: (e: React.MouseEvent) => void;
  onFocus?: (e: React.FocusEvent) => void;
  onBlur?: (e: React.FocusEvent) => void;
  onPointerDown?: (e: React.PointerEvent) => void;
  asChild?: boolean;
  children?: React.ReactNode;
  [key: string]: unknown;
};

function TooltipTrigger({
  ref,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  onPointerDown,
  asChild = false,
  children,
  ...props
}: TooltipTriggerProps) {
  const {
    props: contentProps,
    asChild: contentAsChild,
    side,
    sideOffset,
    align,
    alignOffset,
    id,
  } = useTooltip();
  const { showTooltip, hideTooltip, hideImmediate, currentTooltip, setReferenceEl } =
    useGlobalTooltip();

  const triggerRef = React.useRef<HTMLDivElement | null>(null);
  React.useImperativeHandle(ref, () => triggerRef.current as HTMLDivElement);

  const suppressNextFocusRef = React.useRef(false);

  const handleOpen = React.useCallback(() => {
    if (!triggerRef.current) return;
    setReferenceEl(triggerRef.current);
    const rect = triggerRef.current.getBoundingClientRect();
    showTooltip({ contentProps, contentAsChild, rect, side, sideOffset, align, alignOffset, id });
  }, [showTooltip, setReferenceEl, contentProps, contentAsChild, side, sideOffset, align, alignOffset, id]);

  const handlePointerDown = React.useCallback(
    (e: React.PointerEvent) => {
      onPointerDown?.(e);
      if (currentTooltip?.id === id) {
        suppressNextFocusRef.current = true;
        hideImmediate();
        Promise.resolve().then(() => { suppressNextFocusRef.current = false; });
      }
    },
    [onPointerDown, currentTooltip?.id, id, hideImmediate],
  );

  const handleMouseEnter = React.useCallback(
    (e: React.MouseEvent) => { onMouseEnter?.(e); handleOpen(); },
    [handleOpen, onMouseEnter],
  );

  const handleMouseLeave = React.useCallback(
    (e: React.MouseEvent) => { onMouseLeave?.(e); hideTooltip(); },
    [hideTooltip, onMouseLeave],
  );

  const handleFocus = React.useCallback(
    (e: React.FocusEvent) => {
      onFocus?.(e);
      if (suppressNextFocusRef.current) return;
      handleOpen();
    },
    [handleOpen, onFocus],
  );

  const handleBlur = React.useCallback(
    (e: React.FocusEvent) => { onBlur?.(e); hideTooltip(); },
    [hideTooltip, onBlur],
  );

  const sharedProps = {
    onPointerDown: handlePointerDown,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onFocus: handleFocus,
    onBlur: handleBlur,
    'data-slot': 'tooltip-trigger',
    'data-side': side,
    'data-align': align,
    'data-state': currentTooltip?.id === id ? 'open' : 'closed',
    ...props,
  };

  if (asChild) {
    if (!React.isValidElement(children)) {
      console.warn('TooltipTrigger: asChild requires a single ReactElement child.');
      return null;
    }
    return (
      <Slot ref={triggerRef} {...sharedProps}>
        {children as SlotChild}
      </Slot>
    );
  }

  return (
    <motion.div ref={triggerRef} {...sharedProps}>
      {children}
    </motion.div>
  );
}

// Exports 

export {
  TooltipProvider,
  TooltipPortal,
  TooltipArrow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
};
export { useGlobalTooltip, useTooltip } from './Tooltip.context';
