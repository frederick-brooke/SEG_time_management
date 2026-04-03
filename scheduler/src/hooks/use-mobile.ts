import * as React from "react";

const MOBILE_BREAKPOINT = 768;

/**
 * Custom React hook to detect whether the current viewport
 * matches a mobile device width.
 *
 * Uses a `matchMedia` listener to track screen width changes
 * and updates state when crossing the mobile breakpoint.
 *
 * @returns {boolean} true if viewport width is below the mobile breakpoint, otherwise false
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    mql.addEventListener("change", onChange);

    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);

    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}