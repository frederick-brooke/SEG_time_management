'use client';

import * as React from 'react';
import { useFloating } from '@floating-ui/react';
import { getStrictContext } from 'lib/get-strict-context';

// Types 

export type Side = 'top' | 'bottom' | 'left' | 'right';
export type Align = 'center' | 'start' | 'end';

export type GlobalTooltipData = {
  contentProps: Record<string, unknown>;
  contentAsChild: boolean;
  rect: DOMRect;
  side: Side;
  sideOffset: number;
  align: Align;
  alignOffset: number;
  id: string;
};

// Global context 

export type GlobalTooltipContextValue = {
  showTooltip: (data: GlobalTooltipData) => void;
  hideTooltip: () => void;
  hideImmediate: () => void;
  currentTooltip: GlobalTooltipData | null;
  transition: object;
  globalId: string;
  setReferenceEl: (el: HTMLElement | null) => void;
  referenceElRef: React.RefObject<HTMLElement | null>;
};

export const [GlobalTooltipProvider, useGlobalTooltip] =
  getStrictContext<GlobalTooltipContextValue>('GlobalTooltipProvider');

// Local context 

export type LocalTooltipContextValue = {
  props: Record<string, unknown>;
  setProps: (props: Record<string, unknown>) => void;
  asChild: boolean;
  setAsChild: (v: boolean) => void;
  side: Side;
  sideOffset: number;
  align: Align;
  alignOffset: number;
  id: string;
};

export const [LocalTooltipProvider, useTooltip] =
  getStrictContext<LocalTooltipContextValue>('LocalTooltipProvider');

// Rendered tooltip context 

export type RenderedTooltipContextValue = {
  side: Side;
  align: Align;
  open: boolean;
};

export const [RenderedTooltipProvider, useRenderedTooltip] =
  getStrictContext<RenderedTooltipContextValue>('RenderedTooltipContext');

// Floating context 

export type FloatingContextValue = {
  context: ReturnType<typeof useFloating>['context'];
  arrowRef: React.RefObject<SVGSVGElement | null>;
};

export const [FloatingProvider, useFloatingContext] =
  getStrictContext<FloatingContextValue>('FloatingContext');
