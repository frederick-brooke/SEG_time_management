import { ShoppingBag, User, Zap } from "lucide-react";

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  type: "AVATAR" | "FUNCTIONAL";
  price: number;
  value: string;
  icon: string;
  rarity: string;
  owned: boolean;
  canAfford: boolean;
}

export interface ShopData {
  items: ShopItem[];
  points: number;
  equippedAvatar: string | null;
  xpBoostExpires: string | Date | null;
  streakShields: number;
}

export const RARITY_CONFIG: Record<string, {
  label: string; bg: string; text: string; border: string; glow: string; ring: string;
}> = {
  common:    { label: "Common",    bg: "bg-white/5",    text: "text-white/50",   border: "border-white/10",  glow: "",                             ring: "ring-white/20"   },
  rare:      { label: "Rare",      bg: "bg-blue-500/10",  text: "text-blue-400",   border: "border-blue-500/30",  glow: "hover:shadow-blue-500/10",   ring: "ring-blue-400"   },
  epic:      { label: "Epic",      bg: "bg-purple-500/10",text: "text-purple-400", border: "border-purple-500/30",glow: "hover:shadow-purple-500/10", ring: "ring-purple-500" },
  legendary: { label: "Legendary", bg: "bg-yellow-500/10",text: "text-yellow-400", border: "border-yellow-500/30",glow: "hover:shadow-yellow-500/10", ring: "ring-yellow-400" },
};

export const TYPE_TABS = [
  { key: "ALL",        label: "All Items", icon: ShoppingBag },
  { key: "AVATAR",     label: "Avatars",   icon: User        },
  { key: "FUNCTIONAL", label: "Power-Ups", icon: Zap         },
];