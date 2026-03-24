"use client";
// Instantiate global states that can be shared across different pages

import { createContext, useContext, useState } from "react";

interface UIContextType {
  wellbeingOpen: boolean;
  setWellbeingOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const UIContext = createContext<UIContextType | null>(null);  // ← typed with a default of null

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [wellbeingOpen, setWellbeingOpen] = useState(false);  // for the entire wellbeing panel being opened

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