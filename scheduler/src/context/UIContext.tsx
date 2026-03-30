"use client";

/**
 * UIContext
 *
 * Global UI state provider for shared interface controls,
 * such as the wellbeing panel toggle.
 */

import { createContext, useContext, useState } from "react";

interface UIContextType {
  wellbeingOpen: boolean;
  setWellbeingOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const UIContext = createContext<UIContextType | null>(null);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [wellbeingOpen, setWellbeingOpen] = useState(false);

  return (
    <UIContext.Provider value={{ wellbeingOpen, setWellbeingOpen }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI(): UIContextType {
  const context = useContext(UIContext);
  if (!context) throw new Error("useUI must be used within a UIProvider");  // ← narrows null away
  return context;
}