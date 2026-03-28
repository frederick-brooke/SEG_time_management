'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import type { ComponentProps } from 'react';
import {
  TooltipProvider as TooltipProviderPrimitive,
  Tooltip as TooltipPrimitive,
  TooltipTrigger as TooltipTriggerPrimitive,
  TooltipContent as TooltipContentPrimitive,
  TooltipArrow as TooltipArrowPrimitive,
} from 'components/animate-ui/primitives/animate/tooltip';
import { cn } from 'lib/utils';

type TooltipProviderProps = {
  children: React.ReactNode;
  id?: string;
  openDelay?: number;
};

type TooltipProps = ComponentProps<typeof TooltipPrimitive>;
type TooltipTriggerProps = ComponentProps<typeof TooltipTriggerPrimitive>;

type TooltipContentProps = Omit<ComponentProps<typeof TooltipContentPrimitive>, 'children'> & {
  children?: React.ReactNode;
  className?: string;
  layout?: boolean | 'position' | 'size' | 'preserve-aspect' | 'x' | 'y';
};

function TooltipProvider({ openDelay = 0, children, id, ...props }: TooltipProviderProps) {
  return (
    <TooltipProviderPrimitive openDelay={openDelay} id={id} {...props}>
      {children}
    </TooltipProviderPrimitive>
  );
}

function Tooltip({ sideOffset = 10, ...props }: TooltipProps) {
  return <TooltipPrimitive sideOffset={sideOffset} {...props} />;
}

function TooltipTrigger(props: TooltipTriggerProps) {
  return <TooltipTriggerPrimitive {...props} />;
}

function TooltipContent({
  className,
  children,
  layout = 'preserve-aspect',
  ...props
}: TooltipContentProps) {
  return (
    <TooltipContentPrimitive
      className={cn('z-50 w-fit bg-primary text-primary-foreground rounded-md', className)}
      {...props}
    >
      <motion.div className="overflow-hidden px-3 py-1.5 text-xs text-balance">
        <motion.div layout={layout}>{children}</motion.div>
      </motion.div>
      <TooltipArrowPrimitive
        className="fill-primary size-3 data-[side='bottom']:translate-y-[1px] data-[side='right']:translate-x-[1px] data-[side='left']:translate-x-[-1px] data-[side='top']:translate-y-[-1px]"
        tipRadius={2}
      />
    </TooltipContentPrimitive>
  );
}

export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent };
