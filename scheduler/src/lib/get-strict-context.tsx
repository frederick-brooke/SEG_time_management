/**
 * getStrictContext utility
 *
 * Creates a typed React context with a required Provider guard,
 * ensuring hooks throw if used outside their provider.
 */

import * as React from "react";

export function getStrictContext<T>(name: string) {
  const Context = React.createContext<T | null>(null);

  function useStrictContext(): T {
    const context = React.useContext(Context);

    if (!context) {
      throw new Error(`${name} must be used within ${name}.Provider`);
    }

    return context;
  }

  return [Context.Provider, useStrictContext] as const;
}
