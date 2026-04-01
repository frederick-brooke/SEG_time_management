'use client';
import { Button } from "@/components/ui/Button";

import * as React from 'react';
import { motion, isMotionComponent } from 'motion/react';
import { cn } from 'lib/utils';

// mergeRefs

function mergeRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  return (node: T | null) => {
    refs.forEach((ref) => {
      if (!ref) return;
      if (typeof ref === 'function') {
        ref(node);
      } else {
        (ref as React.RefObject<T | null>).current = node;
      }
    });
  };
}

// mergeProps

type AnyProps = Record<string, unknown> & {
  className?: string;
  style?: React.CSSProperties;
};

function mergeProps(childProps: AnyProps, slotProps: AnyProps): AnyProps {
  const merged: AnyProps = { ...childProps, ...slotProps };

  if (childProps.className || slotProps.className) {
    merged.className = cn(childProps.className, slotProps.className);
  }

  if (childProps.style || slotProps.style) {
    merged.style = {
      ...(childProps.style as React.CSSProperties),
      ...(slotProps.style as React.CSSProperties),
    };
  }

  return merged;
}

// Slot

type SlotProps = {
  children: React.ReactElement<AnyProps & { ref?: React.Ref<unknown> }>;
  ref?: React.Ref<unknown>;
  [key: string]: unknown;
};

function Slot({ children, ref, ...props }: SlotProps) {
  if (!React.isValidElement(children)) return null;

  const childProps = children.props as AnyProps & { ref?: React.Ref<unknown> };
  const { ref: childRef, ...restChildProps } = childProps;

  const isAlreadyMotion =
    typeof children.type === 'object' &&
    children.type !== null &&
    isMotionComponent(children.type as Parameters<typeof isMotionComponent>[0]);

  const Base = React.useMemo(
    () =>
      isAlreadyMotion
        ? (children.type as React.ElementType)
        : motion.create(children.type as React.ElementType),
    [isAlreadyMotion, children.type],
  );

  const mergedProps = mergeProps(restChildProps, props as AnyProps);

  return <Base {...mergedProps} ref={mergeRefs(childRef, ref)} />;
}

export { Slot };
