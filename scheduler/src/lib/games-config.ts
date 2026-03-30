// No 'use server' here — plain shared constants, importable anywhere

export const DIFFICULTY_CONFIG = {
    easy:   { pairs: 4,  timeLimit: 60,  cost: 10,  label: "Easy"   },
    medium: { pairs: 8,  timeLimit: 90,  cost: 25,  label: "Medium" },
    hard:   { pairs: 12, timeLimit: 120, cost: 50,  label: "Hard"   },
  } as const;
  
  export type Difficulty = keyof typeof DIFFICULTY_CONFIG;