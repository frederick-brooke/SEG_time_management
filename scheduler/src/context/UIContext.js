"use client";
//instantiate global states that can be shared across different pages

import { createContext, useContext, useState } from "react";

const UIContext = createContext();

export function UIProvider({ children }) {
  const [wellbeingOpen, setWellbeingOpen] = useState(false);        //for the entire wellbeing panel being opened

  return (
    <UIContext.Provider value={{ wellbeingOpen, setWellbeingOpen }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  return useContext(UIContext);
}
