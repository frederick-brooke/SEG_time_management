'use client';

import * as React from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import {
  useFloating,
  autoUpdate,
  offset as floatingOffset,
  flip,
  shift,
  arrow as floatingArrow,
  FloatingPortal,
  FloatingArrow,
} from '@floating-ui/react';


import {
  GlobalTooltipProvider,
  useGlobalTooltip,
  LocalTooltipProvider,
  FloatingProvider,
  useFloatingContext,
  RenderedTooltipProvider,
  useRenderedTooltip,
} from './Tooltip.context';
import type { Side, Align, GlobalTooltipData } from './Tooltip.context';

// Helpers 

export function getResolvedSide(placement: string): Side {
  return (placement.includes('-') ? placement.split('-')[0] : placement) as Side;
}

export function initialFromSide(side: Side): { x?: number; y?: number } {
  if (side === 'top') return { y: 15 };
  if (side === 'bottom') return { y: -15 };
  if (side === 'left') return { x: 15 };
  return { x: -15 };
}

export function shallowEqualWithoutChildren(
  a: Record<string, unknown> | undefined,
  b: Record<string, unknown> | undefined,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  const keysA = Object.keys(a).filter((k) => k !== 'children');
  const keysB = Object.keys(b).filter((k) => k !== 'children');
  if (keysA.length !== keysB.length) return false;
  for (const k of keysA) {
    if ((a as Record<string, unknown>)[k] !== (b as Record<string, unknown>)[k]) return false;
  }
  return true;
}

// TooltipPortal 

export function TooltipPortal(props: React.ComponentProps<typeof FloatingPortal>) {
  return <FloatingPortal {...props} />;
}

// TooltipArrow 

const MotionTooltipArrow = motion.create(FloatingArrow);

type TooltipArrowProps = {
  ref?: React.Ref<SVGSVGElement>;
  withTransition?: boolean;
  [key: string]: unknown;
};

export function TooltipArrow({ ref, withTransition = true, ...props }: TooltipArrowProps) {
  const { side, align, open } = useRenderedTooltip();
  const { context, arrowRef } = useFloatingContext();
  const { transition, globalId } = useGlobalTooltip();
  React.useImperativeHandle(ref, () => arrowRef.current as SVGSVGElement);

  const deg = ({ top: 0, right: 90, bottom: 180, left: -90 } as Record<Side, number>)[side];

  return (
    <MotionTooltipArrow
      ref={arrowRef}
      context={context}
      data-state={open ? 'open' : 'closed'}
      data-side={side}
      data-align={align}
      data-slot="tooltip-arrow"
      style={{ rotate: deg }}
      layoutId={withTransition ? `tooltip-arrow-${globalId}` : undefined}
      transition={withTransition ? transition : undefined}
      {...props}
    />
  );
}

// TooltipOverlay

function TooltipOverlay() {
  const { currentTooltip, transition, globalId, referenceElRef } = useGlobalTooltip();

  const [rendered, setRendered] = React.useState<{
    data: GlobalTooltipData | null;
    open: boolean;
  }>({ data: null, open: false });

  const arrowRef = React.useRef<SVGSVGElement | null>(null);

  const side: Side = rendered.data?.side ?? 'top';
  const align: Align = rendered.data?.align ?? 'center';

  const { refs, x, y, strategy, context, update } = useFloating({
    placement: align === 'center' ? side : `${side}-${align}`,
    whileElementsMounted: autoUpdate,
    middleware: [
      floatingOffset({
        mainAxis: rendered.data?.sideOffset ?? 0,
        crossAxis: rendered.data?.alignOffset ?? 0,
      }),
      flip(),
      shift({ padding: 8 }),
      floatingArrow({ element: arrowRef }),
    ],
  });

  React.useEffect(() => {
    if (currentTooltip) {
      setRendered({ data: currentTooltip, open: true });
    } else {
      setRendered((p) => (p.data ? { ...p, open: false } : p));
    }
  }, [currentTooltip]);

  React.useLayoutEffect(() => {
    if (referenceElRef.current) {
      refs.setReference(referenceElRef.current);
      update();
    }
  }, [referenceElRef, refs, update, rendered.data]);

  const ready = x != null && y != null;
  const resolvedSide = getResolvedSide(context.placement);
  const contentStyle = {
    position: 'relative' as const,
    ...((rendered.data?.contentProps?.style as object) || {}),
  };
  const contentProps = rendered.data?.contentProps as object | undefined;

  return (
    <AnimatePresence mode="wait">
      {rendered.data && ready && (
        <TooltipPortal>
          <div
            ref={refs.setFloating}
            data-slot="tooltip-overlay"
            data-side={resolvedSide}
            data-align={rendered.data.align}
            data-state={rendered.open ? 'open' : 'closed'}
            style={{
              position: strategy,
              top: 0,
              left: 0,
              zIndex: 50,
              transform: `translate3d(${x}px, ${y}px, 0)`,
            }}
          >
            <FloatingProvider value={{ context, arrowRef }}>
              <RenderedTooltipProvider
                value={{ side: resolvedSide, align: rendered.data.align, open: rendered.open }}
              >
                {rendered.data.contentAsChild ? (
                  <div
                    data-slot="tooltip-content"
                    data-side={resolvedSide}
                    data-align={rendered.data.align}
                    data-state={rendered.open ? 'open' : 'closed'}
                    style={contentStyle}
                    {...contentProps}
                  >
                    {(rendered.data.contentProps?.children as React.ReactNode) ?? null}
                  </div>
                ) : (
                  <motion.div
                    data-slot="tooltip-content"
                    data-side={resolvedSide}
                    data-align={rendered.data.align}
                    data-state={rendered.open ? 'open' : 'closed'}
                    layoutId={`tooltip-content-${globalId}`}
                    initial={{ opacity: 0, scale: 0, ...initialFromSide(rendered.data.side) }}
                    animate={
                      rendered.open
                        ? { opacity: 1, scale: 1, x: 0, y: 0 }
                        : { opacity: 0, scale: 0, ...initialFromSide(rendered.data.side) }
                    }
                    exit={{ opacity: 0, scale: 0, ...initialFromSide(rendered.data.side) }}
                    onAnimationComplete={() => {
                      if (!rendered.open) setRendered({ data: null, open: false });
                    }}
                    transition={transition as object}
                    style={contentStyle}
                    {...contentProps}
                  >
                    {(rendered.data.contentProps?.children as React.ReactNode) ?? null}
                  </motion.div>
                )}
              </RenderedTooltipProvider>
            </FloatingProvider>
          </div>
        </TooltipPortal>
      )}
    </AnimatePresence>
  );
}

// TooltipProvider 

type TooltipProviderProps = {
  children: React.ReactNode;
  id?: string;
  openDelay?: number;
  closeDelay?: number;
  transition?: object;
};

export function TooltipProvider({
  children,
  id,
  openDelay = 700,
  closeDelay = 300,
  transition = { type: 'spring', stiffness: 300, damping: 35 },
}: TooltipProviderProps) {
  const globalId = React.useId();
  const [currentTooltip, setCurrentTooltip] = React.useState<GlobalTooltipData | null>(null);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCloseTimeRef = React.useRef(0);
  const referenceElRef = React.useRef<HTMLElement | null>(null);

  const showTooltip = React.useCallback(
    (data: GlobalTooltipData) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (currentTooltip !== null) {
        setCurrentTooltip(data);
        return;
      }
      const now = Date.now();
      const delay = now - lastCloseTimeRef.current < closeDelay ? 0 : openDelay;
      timeoutRef.current = setTimeout(() => setCurrentTooltip(data), delay);
    },
    [openDelay, closeDelay, currentTooltip],
  );

  const hideTooltip = React.useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setCurrentTooltip(null);
      lastCloseTimeRef.current = Date.now();
    }, closeDelay);
  }, [closeDelay]);

  const hideImmediate = React.useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setCurrentTooltip(null);
    lastCloseTimeRef.current = Date.now();
  }, []);

  const setReferenceEl = React.useCallback((el: HTMLElement | null) => {
    referenceElRef.current = el;
  }, []);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hideImmediate();
    };
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('scroll', hideImmediate, true);
    window.addEventListener('resize', hideImmediate, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('scroll', hideImmediate, true);
      window.removeEventListener('resize', hideImmediate, true);
    };
  }, [hideImmediate]);

  return (
    <GlobalTooltipProvider
      value={{
        showTooltip,
        hideTooltip,
        hideImmediate,
        currentTooltip,
        transition,
        globalId: id ?? globalId,
        setReferenceEl,
        referenceElRef,
      }}
    >
      <LayoutGroup>{children}</LayoutGroup>
      <TooltipOverlay />
    </GlobalTooltipProvider>
  );
}

export { LocalTooltipProvider };
