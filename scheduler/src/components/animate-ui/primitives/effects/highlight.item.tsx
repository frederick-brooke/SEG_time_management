'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Transition } from 'motion/react';
import { cn } from 'lib/utils';
import { useHighlight } from './highlight.context';

// Types 

export type HighlightItemProps = {
  ref?: React.Ref<HTMLElement>;
  as?: React.ElementType;
  children: React.ReactElement<Record<string, unknown>>;
  id?: string;
  value?: string;
  className?: string;
  style?: React.CSSProperties;
  transition?: Transition;
  disabled?: boolean;
  activeClassName?: string;
  exitDelay?: number;
  asChild?: boolean;
  forceUpdateBounds?: boolean;
  [key: string]: unknown;
};

// Helper 

function getNonOverridingDataAttributes(
  element: React.ReactElement<Record<string, unknown>>,
  dataAttributes: Record<string, unknown>,
): Record<string, unknown> {
  return Object.keys(dataAttributes).reduce<Record<string, unknown>>((acc, key) => {
    if (element.props[key] === undefined) {
      acc[key] = dataAttributes[key];
    }
    return acc;
  }, {});
}

// HighlightItem 

export function HighlightItem({
  ref,
  as,
  children,
  id,
  value,
  className,
  style,
  transition,
  disabled = false,
  activeClassName,
  exitDelay,
  asChild = false,
  forceUpdateBounds,
  ...props
}: HighlightItemProps) {
  const itemId = React.useId();
  const {
    activeValue,
    setActiveValue,
    mode,
    setBounds,
    clearBounds,
    hover,
    click,
    enabled,
    className: contextClassName,
    style: contextStyle,
    transition: contextTransition,
    id: contextId,
    disabled: contextDisabled,
    exitDelay: contextExitDelay,
    forceUpdateBounds: contextForceUpdateBounds,
    setActiveClassName,
  } = useHighlight();

  const Component: React.ElementType = as ?? 'div';
  const element = children;
  const childValue: string =
    id ?? value ?? (element.props?.['data-value'] as string) ?? (element.props?.id as string) ?? itemId;
  const isActive = activeValue === childValue;
  const isDisabled = disabled === undefined ? contextDisabled : disabled;
  const itemTransition = transition ?? contextTransition;

  const localRef = React.useRef<HTMLElement | null>(null);
  React.useImperativeHandle(ref, () => localRef.current as HTMLElement);

  const refCallback = React.useCallback((node: HTMLElement | null) => {
    localRef.current = node;
  }, []);

  React.useEffect(() => {
    if (mode !== 'parent') return;
    let rafId: number;
    let previousBounds: DOMRect | null = null;
    const shouldUpdateBounds =
      forceUpdateBounds === true ||
      (contextForceUpdateBounds && forceUpdateBounds !== false);

    const updateBounds = () => {
      if (!localRef.current) return;
      const bounds = localRef.current.getBoundingClientRect();
      if (shouldUpdateBounds) {
        if (
          previousBounds &&
          previousBounds.top === bounds.top &&
          previousBounds.left === bounds.left &&
          previousBounds.width === bounds.width &&
          previousBounds.height === bounds.height
        ) {
          rafId = requestAnimationFrame(updateBounds);
          return;
        }
        previousBounds = bounds;
        rafId = requestAnimationFrame(updateBounds);
      }
      setBounds(bounds);
    };

    if (isActive) {
      updateBounds();
      setActiveClassName(activeClassName ?? '');
    } else if (!activeValue) clearBounds();

    if (shouldUpdateBounds) return () => cancelAnimationFrame(rafId);
  }, [
    mode,
    isActive,
    activeValue,
    setBounds,
    clearBounds,
    activeClassName,
    setActiveClassName,
    forceUpdateBounds,
    contextForceUpdateBounds,
  ]);

  if (!React.isValidElement(children)) return children;

  const dataAttributes: Record<string, unknown> = {
    'data-active': isActive ? 'true' : 'false',
    'aria-selected': isActive,
    'data-disabled': isDisabled,
    'data-value': childValue,
    'data-highlight': true,
  };

  const commonHandlers = hover
    ? {
        onMouseEnter: (e: React.MouseEvent) => {
          setActiveValue(childValue);
          (element.props.onMouseEnter as ((e: React.MouseEvent) => void) | undefined)?.(e);
        },
        onMouseLeave: (e: React.MouseEvent) => {
          setActiveValue(null);
          (element.props.onMouseLeave as ((e: React.MouseEvent) => void) | undefined)?.(e);
        },
      }
    : click
      ? {
          onClick: (e: React.MouseEvent) => {
            setActiveValue(childValue);
            (element.props.onClick as ((e: React.MouseEvent) => void) | undefined)?.(e);
          },
        }
      : {};

  // asChild mode 

  if (asChild) {
    if (mode === 'children') {
      return React.cloneElement(element, {
        key: childValue,
        ref: refCallback,
        className: cn('relative', element.props.className as string | undefined),
        ...getNonOverridingDataAttributes(element, {
          ...dataAttributes,
          'data-slot': 'motion-highlight-item-container',
        }),
        ...commonHandlers,
        ...props,
      },
        <>
          <AnimatePresence initial={false} mode="wait">
            {isActive && !isDisabled && (
              <motion.div
                layoutId={`transition-background-${contextId}`}
                data-slot="motion-highlight"
                style={{ position: 'absolute', zIndex: 0, ...contextStyle, ...style }}
                className={cn(contextClassName, activeClassName)}
                transition={itemTransition}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{
                  opacity: 0,
                  transition: {
                    ...itemTransition,
                    delay:
                      ((itemTransition as { delay?: number })?.delay ?? 0) +
                      (exitDelay ?? contextExitDelay ?? 0) / 1000,
                  },
                }}
                {...dataAttributes}
              />
            )}
          </AnimatePresence>
          <Component
            data-slot="motion-highlight-item"
            style={{ position: 'relative', zIndex: 1 }}
            className={className}
            {...dataAttributes}
          >
            {children}
          </Component>
        </>,
      );
    }

    return React.cloneElement(element, {
      ref: refCallback,
      ...getNonOverridingDataAttributes(element, {
        ...dataAttributes,
        'data-slot': 'motion-highlight-item',
      }),
      ...commonHandlers,
    });
  }

  // default mode 

  return enabled ? (
    <Component
      key={childValue}
      ref={localRef}
      data-slot="motion-highlight-item-container"
      className={cn(mode === 'children' && 'relative', className)}
      {...dataAttributes}
      {...props}
      {...commonHandlers}
    >
      {mode === 'children' && (
        <AnimatePresence initial={false} mode="wait">
          {isActive && !isDisabled && (
            <motion.div
              layoutId={`transition-background-${contextId}`}
              data-slot="motion-highlight"
              style={{ position: 'absolute', zIndex: 0, ...contextStyle, ...style }}
              className={cn(contextClassName, activeClassName)}
              transition={itemTransition}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{
                opacity: 0,
                transition: {
                  ...itemTransition,
                  delay:
                    ((itemTransition as { delay?: number })?.delay ?? 0) +
                    (exitDelay ?? contextExitDelay ?? 0) / 1000,
                },
              }}
              {...dataAttributes}
            />
          )}
        </AnimatePresence>
      )}
      {React.cloneElement(element, {
        style: { position: 'relative', zIndex: 1 },
        className: element.props.className as string | undefined,
        ...getNonOverridingDataAttributes(element, {
          ...dataAttributes,
          'data-slot': 'motion-highlight-item',
        }),
      })}
    </Component>
  ) : (
    children
  );
}
