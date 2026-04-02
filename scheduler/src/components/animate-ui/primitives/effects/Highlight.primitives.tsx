'use client';

import { Button } from "@/components/ui/Button";

import * as React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Transition } from 'motion/react';
import { cn } from 'lib/utils';
import { HighlightContext } from './Highlight.context';
import type { HighlightMode, BoundsOffset, Bounds } from './Highlight.context';

// Types 

export type HighlightProps = {
  ref?: React.Ref<HTMLElement>;
  as?: React.ElementType;
  children?: React.ReactNode;
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  className?: string;
  style?: React.CSSProperties;
  transition?: Transition;
  hover?: boolean;
  click?: boolean;
  enabled?: boolean;
  controlledItems?: boolean;
  disabled?: boolean;
  exitDelay?: number;
  mode?: HighlightMode;
  boundsOffset?: BoundsOffset;
  containerClassName?: string;
  itemsClassName?: string;
  forceUpdateBounds?: boolean;
};

const DEFAULT_BOUNDS_OFFSET: Required<BoundsOffset> = {
  top: 0,
  left: 0,
  width: 0,
  height: 0,
};

// Highlight

export function Highlight({ ref, ...props }: HighlightProps) {
  const {
    as: Component = 'div',
    children,
    value,
    defaultValue,
    onValueChange,
    className,
    style,
    transition = { type: 'spring', stiffness: 350, damping: 35 },
    hover = false,
    click = true,
    enabled = true,
    controlledItems,
    disabled = false,
    exitDelay = 200,
    mode = 'children',
    boundsOffset: propsBoundsOffset,
    containerClassName,
    itemsClassName,
    forceUpdateBounds,
  } = props;

  const localRef = React.useRef<HTMLElement | null>(null);
  React.useImperativeHandle(ref, () => localRef.current as HTMLElement);

  const boundsOffset = propsBoundsOffset ?? DEFAULT_BOUNDS_OFFSET;
  const boundsOffsetTop = boundsOffset.top ?? 0;
  const boundsOffsetLeft = boundsOffset.left ?? 0;
  const boundsOffsetWidth = boundsOffset.width ?? 0;
  const boundsOffsetHeight = boundsOffset.height ?? 0;

  const boundsOffsetRef = React.useRef({
    top: boundsOffsetTop,
    left: boundsOffsetLeft,
    width: boundsOffsetWidth,
    height: boundsOffsetHeight,
  });

  React.useEffect(() => {
    boundsOffsetRef.current = {
      top: boundsOffsetTop,
      left: boundsOffsetLeft,
      width: boundsOffsetWidth,
      height: boundsOffsetHeight,
    };
  }, [boundsOffsetTop, boundsOffsetLeft, boundsOffsetWidth, boundsOffsetHeight]);

  const [activeValue, setActiveValue] = React.useState<string | null>(
    value ?? defaultValue ?? null,
  );
  const [boundsState, setBoundsState] = React.useState<Bounds | null>(null);
  const [activeClassNameState, setActiveClassNameState] = React.useState('');

  const safeSetActiveValue = (id: string | null) => {
    setActiveValue((prev) => {
      if (prev !== id) {
        onValueChange?.(id);
        return id;
      }
      return prev;
    });
  };

  const safeSetBoundsRef = React.useRef<((bounds: DOMRect) => void) | undefined>(undefined);

  React.useEffect(() => {
    safeSetBoundsRef.current = (bounds: DOMRect) => {
      if (!localRef.current) return;
      const containerRect = localRef.current.getBoundingClientRect();
      const offset = boundsOffsetRef.current;
      const newBounds: Bounds = {
        top: bounds.top - containerRect.top + offset.top,
        left: bounds.left - containerRect.left + offset.left,
        width: bounds.width + offset.width,
        height: bounds.height + offset.height,
      };
      setBoundsState((prev) => {
        if (
          prev &&
          prev.top === newBounds.top &&
          prev.left === newBounds.left &&
          prev.width === newBounds.width &&
          prev.height === newBounds.height
        ) {
          return prev;
        }
        return newBounds;
      });
    };
  });

  const safeSetBounds = (bounds: DOMRect) => {
    safeSetBoundsRef.current?.(bounds);
  };

  const clearBounds = React.useCallback(() => {
    setBoundsState((prev) => (prev === null ? prev : null));
  }, []);

  React.useEffect(() => {
    if (value !== undefined) setActiveValue(value ?? null);
    else if (defaultValue !== undefined) setActiveValue(defaultValue ?? null);
  }, [value, defaultValue]);

  const id = React.useId();

  React.useEffect(() => {
    if (mode !== 'parent') return;
    const container = localRef.current;
    if (!container) return;
    const onScroll = () => {
      if (!activeValue) return;
      const activeEl = container.querySelector(
        `[data-value="${activeValue}"][data-highlight="true"]`,
      );
      if (activeEl) safeSetBoundsRef.current?.(activeEl.getBoundingClientRect());
    };
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, [mode, activeValue]);

  const render = (renderedChildren: React.ReactNode) => {
    if (mode === 'parent') {
      return (
        <Component
          ref={localRef}
          data-slot="motion-highlight-container"
          style={{ position: 'relative', zIndex: 1 }}
          className={containerClassName}
        >
          <AnimatePresence initial={false} mode="wait">
            {boundsState && (
              <motion.div
                data-slot="motion-highlight"
                animate={{
                  top: boundsState.top,
                  left: boundsState.left,
                  width: boundsState.width,
                  height: boundsState.height,
                  opacity: 1,
                }}
                initial={{
                  top: boundsState.top,
                  left: boundsState.left,
                  width: boundsState.width,
                  height: boundsState.height,
                  opacity: 0,
                }}
                exit={{
                  opacity: 0,
                  transition: {
                    ...transition,
                    delay: ((transition as { delay?: number })?.delay ?? 0) + (exitDelay ?? 0) / 1000,
                  },
                }}
                transition={transition}
                style={{ position: 'absolute', zIndex: 0, ...style }}
                className={cn(className, activeClassNameState)}
              />
            )}
          </AnimatePresence>
          {renderedChildren}
        </Component>
      );
    }
    return renderedChildren;
  };

  return (
    <HighlightContext.Provider
      value={{
        mode,
        activeValue,
        setActiveValue: safeSetActiveValue,
        id,
        hover,
        click,
        className,
        style,
        transition,
        disabled,
        enabled,
        exitDelay,
        setBounds: safeSetBounds,
        clearBounds,
        activeClassName: activeClassNameState,
        setActiveClassName: setActiveClassNameState,
        forceUpdateBounds,
      }}
    >
      {enabled
        ? controlledItems
          ? render(children)
          : render(
              React.Children.map(children, (child, index) => (
                <HighlightItemWrapper key={index} className={itemsClassName}>
                  {child}
                </HighlightItemWrapper>
              )),
            )
        : children}
    </HighlightContext.Provider>
  );
}


function HighlightItemWrapper({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div data-slot="motion-highlight-item-wrapper" className={className}>
      {children}
    </div>
  );
}
