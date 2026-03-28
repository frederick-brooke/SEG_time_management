/**
 * Shop domain types and configuration.
 * Defines item contracts, rarity system, and UI theme mappings
 * used across the Cosmic Avatar Shop feature.
 */

import { ShopItemType } from "@prisma/client";

// Type Definitions 
export type ItemRarity = "common" | "rare" | "epic" | "legendary";

/**
 * Defines the styling schema applied to item cards based on their rarity.
 */
export interface RarityTheme {
  label: string;
  bg: string;
  text: string;
  border: string;
  glow: string;
  ring: string;
}

// Data Interfaces

/**
 * Represents a single purchasable item in the cosmic shop.
 * Blends static catalogue data from the backend with dynamic, user-specific state.
 *
 * @property {string} id - The unique database identifier of the item.
 * @property {string} name - The human-readable display name.
 * @property {string} description - A brief explanation of the item's visual theme.
 * @property {ShopItemType} type - The database category of the item (e.g., "AVATAR").
 * @property {number} price - The cost of the item in cosmic coins.
 * @property {string} value - The underlying asset reference key (e.g., "avatar1") mapped to `AVATAR_IMAGES`.
 * @property {string} icon - An emoji or icon identifier used as a fallback visual.
 * @property {ItemRarity} rarity - The scarcity tier governing the item's visual frame.
 * @property {boolean} owned - Indicates whether the authenticated user has already purchased this item.
 * @property {boolean} canAfford - Indicates if the user's current coin balance meets or exceeds the price.
 */
export interface ShopItem {
  id: string;
  name: string;
  description: string;
  type: ShopItemType;
  price: number;
  value: string;
  icon: string;
  rarity: ItemRarity; 
  owned: boolean;
  canAfford: boolean;
}

/**
 * The aggregated payload delivered by the server to initialize the shop view.
 *
 * @property {ShopItem[]} items - The complete array of items available in the shop.
 * @property {number} points - The current user's available purchasing currency.
 * @property {string | null} equippedAvatar - The `value` string of the user's currently active avatar, if any.
 */
export interface ShopData {
  items: ShopItem[];
  points: number;
  equippedAvatar: string | null;
}


// Configuration Constants

/**
 * The master configuration dictionary for rarity styling.
 * Mapped strictly to the `ItemRarity` type to guarantee all tiers are accounted for.
 */
export const RARITY_CONFIG: Record<ItemRarity, RarityTheme> = {
  common: { 
    label: "Common", 
    bg: "bg-white/5", 
    text: "text-white/50", 
    border: "border-white/10", 
    glow: "", 
    ring: "ring-white/20" 
  },
  rare: { 
    label: "Rare", 
    bg: "bg-blue-500/10", 
    text: "text-blue-400", 
    border: "border-blue-500/30", 
    glow: "hover:shadow-blue-500/10", 
    ring: "ring-blue-400" 
  },
  epic: { 
    label: "Epic", 
    bg: "bg-purple-500/10", 
    text: "text-purple-400", 
    border: "border-purple-500/30", 
    glow: "hover:shadow-purple-500/10", 
    ring: "ring-purple-500" 
  },
  legendary: { 
    label: "Legendary", 
    bg: "bg-yellow-500/10", 
    text: "text-yellow-400", 
    border: "border-yellow-500/30", 
    glow: "hover:shadow-yellow-500/10", 
    ring: "ring-yellow-400" 
  },
};

