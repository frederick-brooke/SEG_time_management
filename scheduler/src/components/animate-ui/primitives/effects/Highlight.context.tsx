'use client';

import { Button } from "@/components/ui/Button";

import * as React from 'react';
import type { Transition } from 'motion/react';

// Types 

export type HighlightMode = 'children' | 'parent';

export type BoundsOffset = {
  top?: number;
  left?: number;
  width?: number;
  height?: number;
};

export type Bounds = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export type HighlightContextValue = {
  mode: HighlightMode;
  activeValue: string | null;
  setActiveValue: (id: string | null) => void;
  id: string;
  hover: boolean;
  click: boolean;
  className?: string;
  style?: React.CSSProperties;
  transition?: Transition;
  disabled: boolean;
  enabled: boolean;
  exitDelay?: number;
  setBounds: (bounds: DOMRect) => void;
  clearBounds: () => void;
  activeClassName: string;
  setActiveClassName: (className: string) => void;
  forceUpdateBounds?: boolean;
};

// Context 

export const HighlightContext = React.createContext<HighlightContextValue | undefined>(undefined);

export function useHighlight(): HighlightContextValue {
  const context = React.useContext(HighlightContext);
  if (!context) {
    throw new Error('useHighlight must be used within a HighlightProvider');
  }
  return context;
}
