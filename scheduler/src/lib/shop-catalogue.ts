// No 'use server' here — this is plain shared data, importable anywhere

export const SHOP_CATALOGUE = [
    // TITLES
    { name: "Cosmic Cadet",   description: "Every legend starts somewhere.",                              type: "TITLE" as const,      price: 100,  value: "Cosmic Cadet",   icon: "🚀", rarity: "common"    },
    { name: "Nebula Scout",   description: "You've explored the edges of the known universe.",            type: "TITLE" as const,      price: 250,  value: "Nebula Scout",   icon: "🌌", rarity: "rare"      },
    { name: "Star Commander", description: "You command the stars.",                                      type: "TITLE" as const,      price: 500,  value: "Star Commander", icon: "⭐", rarity: "epic"      },
    { name: "Void Walker",    description: "You move through darkness others fear.",                      type: "TITLE" as const,      price: 750,  value: "Void Walker",    icon: "🌑", rarity: "epic"      },
    { name: "Galaxy Brain",   description: "Legendary status. Only the most productive minds earn this.", type: "TITLE" as const,      price: 1500, value: "Galaxy Brain",   icon: "🧠", rarity: "legendary" },
    // FRAMES
    { name: "Solar Flare",    description: "A blazing gold frame that radiates energy.",                  type: "FRAME" as const,      price: 200,  value: "solar-flare",    icon: "☀️", rarity: "common"    },
    { name: "Nebula Glow",    description: "A dreamy purple-pink cosmic glow.",                           type: "FRAME" as const,      price: 400,  value: "nebula-glow",    icon: "💜", rarity: "rare"      },
    { name: "Aurora Ring",    description: "Northern lights dancing around your profile.",                type: "FRAME" as const,      price: 600,  value: "aurora-ring",    icon: "🌈", rarity: "epic"      },
    { name: "Event Horizon",  description: "The legendary black hole frame.",                             type: "FRAME" as const,      price: 2000, value: "event-horizon",  icon: "🕳️", rarity: "legendary" },
    // FUNCTIONAL
    { name: "XP Boost",       description: "Double your points for the next 24 hours.",                  type: "FUNCTIONAL" as const, price: 300,  value: "xp-boost-24h",  icon: "⚡", rarity: "rare"      },
    { name: "Streak Shield",  description: "Miss a day without breaking your streak. One-time use.",     type: "FUNCTIONAL" as const, price: 150,  value: "streak-shield",  icon: "🛡️", rarity: "common"    },
  ]
  
  export const FRAME_STYLES: Record<string, string> = {
    "solar-flare":   "ring-4 ring-yellow-400 ring-offset-2 shadow-[0_0_20px_4px_rgba(250,204,21,0.6)]",
    "nebula-glow":   "ring-4 ring-purple-500 ring-offset-2 shadow-[0_0_20px_4px_rgba(168,85,247,0.6)]",
    "aurora-ring":   "ring-4 ring-offset-2 shadow-lg ring-cyan-400 shadow-[0_0_20px_4px_rgba(34,211,238,0.5)]",
    "event-horizon": "ring-4 ring-gray-900 ring-offset-2 shadow-[0_0_30px_8px_rgba(0,0,0,0.9)]",
  }
  