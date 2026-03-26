// Shared data importable anywhere — no 'use server'

// ── Types ────────────────────────────────────────────────────────────────────

export type AvatarKey =
  | "astronaut-pioneer"
  | "nebula-witch"
  | "solar-guardian"
  | "void-spectre"
  | "aurora-sage"
  | "galaxy-emperor"
  | "pulsar-ranger"
  | "event-horizon-god";

export type Rarity = "common" | "rare" | "epic" | "legendary";

export type ShopItem = {
  name: string;
  description: string;
  type: "AVATAR";
  price: number;
  value: AvatarKey;
  icon: string;
  rarity: Rarity;
};

// ── Avatar SVGs ───────────────────────────────────────────────────────────────

const STAR_FIELD = [
  `%3Ccircle cx='22' cy='20' r='2' fill='%23ffffff' opacity='0.8'/%3E`,
  `%3Ccircle cx='78' cy='15' r='1.5' fill='%23ffffff' opacity='0.6'/%3E`,
  `%3Ccircle cx='85' cy='70' r='1' fill='%23ffffff' opacity='0.5'/%3E`,
  `%3Ccircle cx='12' cy='65' r='1.5' fill='%23ffffff' opacity='0.7'/%3E`,
].join("");

const svgDataUri = (content: string) =>
  `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E${content}%3C/svg%3E`;

const radialGradientBg = (id: string, innerColor: string, outerColor: string, cx = "50%25", cy = "50%25") =>
  `%3Cdefs%3E%3CradialGradient id='${id}' cx='${cx}' cy='${cy}' r='60%25'%3E%3Cstop offset='0%25' stop-color='${innerColor}'/%3E%3Cstop offset='100%25' stop-color='${outerColor}'/%3E%3C/radialGradient%3E%3C/defs%3E%3Ccircle cx='50' cy='50' r='50' fill='url(%23${id})'/%3E`;

export const AVATAR_IMAGES: Record<AvatarKey, string> = {
  "astronaut-pioneer": svgDataUri(
    radialGradientBg("bg", "%231a1a2e", "%2316213e", "50%25", "40%25") +
    `%3Ccircle cx='50' cy='35' r='18' fill='%23c8d8e8' stroke='%23a0b4c8' stroke-width='2'/%3E` +
    `%3Crect x='32' y='52' width='36' height='28' rx='8' fill='%23e8f0f8' stroke='%23a0b4c8' stroke-width='2'/%3E` +
    `%3Crect x='36' y='30' width='28' height='20' rx='10' fill='%23d4e8ff' stroke='%2388aacc' stroke-width='1.5' opacity='0.9'/%3E` +
    `%3Ccircle cx='50' cy='38' r='9' fill='%23b8d4f0' stroke='%2366aadd' stroke-width='1' opacity='0.85'/%3E` +
    `%3Ccircle cx='47' cy='36' r='2.5' fill='%23ffffff' opacity='0.6'/%3E` +
    `%3Crect x='28' y='54' width='10' height='18' rx='5' fill='%23d0dce8' stroke='%23a0b4c8' stroke-width='1.5'/%3E` +
    `%3Crect x='62' y='54' width='10' height='18' rx='5' fill='%23d0dce8' stroke='%23a0b4c8' stroke-width='1.5'/%3E` +
    STAR_FIELD
  ),

  "nebula-witch": svgDataUri(
    radialGradientBg("bg", "%232d1b69", "%230f0a2e") +
    `%3Cellipse cx='50' cy='90' rx='35' ry='8' fill='%23a855f7' opacity='0.3'/%3E` +
    `%3Ccircle cx='50' cy='38' r='16' fill='%23f3d5b5'/%3E` +
    `%3Cpath d='M34 38 Q50 10 66 38' fill='%23581c87' stroke='%237c3aed' stroke-width='1'/%3E` +
    `%3Cpath d='M38 38 Q50 22 62 38' fill='%234c1d95'/%3E` +
    `%3Crect x='35' y='53' width='30' height='26' rx='6' fill='%236d28d9'/%3E` +
    `%3Cellipse cx='50' cy='34' rx='6' ry='4' fill='%23e879f9' opacity='0.4'/%3E` +
    `%3Ccircle cx='44' cy='37' r='2' fill='%231e1b4b'/%3E` +
    `%3Ccircle cx='56' cy='37' r='2' fill='%231e1b4b'/%3E` +
    `%3Cpath d='M46 42 Q50 45 54 42' stroke='%23c4b5fd' stroke-width='1.5' fill='none'/%3E` +
    `%3Ccircle cx='20' cy='25' r='2' fill='%23e879f9' opacity='0.7'/%3E` +
    `%3Ccircle cx='80' cy='30' r='1.5' fill='%23c084fc' opacity='0.8'/%3E` +
    `%3Ccircle cx='75' cy='15' r='1' fill='%23f0abfc' opacity='0.6'/%3E` +
    `%3Ccircle cx='15' cy='55' r='1' fill='%23e879f9' opacity='0.5'/%3E` +
    `%3Cpath d='M18 72 L25 68 L20 78 Z' fill='%23a855f7' opacity='0.5'/%3E`
  ),

  "solar-guardian": svgDataUri(
    radialGradientBg("bg", "%23422006", "%231c0a00", "50%25", "30%25") +
    `%3Ccircle cx='50' cy='50' r='35' fill='none' stroke='%23f97316' stroke-width='0.5' opacity='0.3'/%3E` +
    `%3Ccircle cx='50' cy='50' r='28' fill='none' stroke='%23fb923c' stroke-width='0.5' opacity='0.3'/%3E` +
    `%3Ccircle cx='50' cy='36' r='16' fill='%23fcd34d'/%3E` +
    `%3Crect x='34' y='51' width='32' height='26' rx='7' fill='%23f97316'/%3E` +
    `%3Cpath d='M42 51 L50 42 L58 51' fill='%23fb923c'/%3E` +
    `%3Ccircle cx='44' cy='35' r='2.5' fill='%23431407'/%3E` +
    `%3Ccircle cx='56' cy='35' r='2.5' fill='%23431407'/%3E` +
    `%3Cpath d='M44 42 Q50 46 56 42' stroke='%23431407' stroke-width='1.5' fill='none'/%3E` +
    `%3Crect x='28' y='53' width='8' height='16' rx='4' fill='%23f97316'/%3E` +
    `%3Crect x='64' y='53' width='8' height='16' rx='4' fill='%23f97316'/%3E` +
    `%3Cline x1='50' y1='20' x2='50' y2='14' stroke='%23fbbf24' stroke-width='2' stroke-linecap='round'/%3E` +
    `%3Cline x1='62' y1='24' x2='66' y2='19' stroke='%23fbbf24' stroke-width='2' stroke-linecap='round'/%3E` +
    `%3Cline x1='38' y1='24' x2='34' y2='19' stroke='%23fbbf24' stroke-width='2' stroke-linecap='round'/%3E`
  ),

  "void-spectre": svgDataUri(
    radialGradientBg("bg", "%23050510", "%23000005") +
    `%3Cellipse cx='50' cy='55' rx='22' ry='30' fill='%230f172a' stroke='%2338bdf8' stroke-width='1' opacity='0.9'/%3E` +
    `%3Ccircle cx='50' cy='34' r='16' fill='%230f172a' stroke='%2338bdf8' stroke-width='1'/%3E` +
    `%3Cellipse cx='50' cy='34' rx='16' ry='16' fill='none' stroke='%2338bdf8' stroke-width='0.5' opacity='0.5'/%3E` +
    `%3Ccircle cx='44' cy='33' r='3' fill='%2338bdf8' opacity='0.9'/%3E` +
    `%3Ccircle cx='56' cy='33' r='3' fill='%2338bdf8' opacity='0.9'/%3E` +
    `%3Ccircle cx='44' cy='33' r='1.5' fill='%23ffffff'/%3E` +
    `%3Ccircle cx='56' cy='33' r='1.5' fill='%23ffffff'/%3E` +
    `%3Cpath d='M44 40 Q50 38 56 40' stroke='%2338bdf8' stroke-width='1' fill='none' opacity='0.7'/%3E` +
    `%3Ccircle cx='18' cy='20' r='1' fill='%2338bdf8' opacity='0.6'/%3E` +
    `%3Ccircle cx='82' cy='18' r='1.5' fill='%2338bdf8' opacity='0.4'/%3E` +
    `%3Ccircle cx='88' cy='65' r='1' fill='%2338bdf8' opacity='0.5'/%3E` +
    `%3Ccircle cx='10' cy='72' r='1.5' fill='%2338bdf8' opacity='0.3'/%3E` +
    `%3Cpath d='M38 65 Q50 70 62 65' stroke='%2338bdf8' stroke-width='0.5' fill='none' opacity='0.4'/%3E`
  ),

  "aurora-sage": svgDataUri(
    radialGradientBg("bg", "%23064e3b", "%23022c22", "50%25", "40%25") +
    `%3Cpath d='M10 60 Q30 20 50 50 Q70 80 90 40' stroke='%2334d399' stroke-width='3' fill='none' opacity='0.4'/%3E` +
    `%3Cpath d='M5 50 Q25 15 50 45 Q75 75 95 35' stroke='%2310b981' stroke-width='2' fill='none' opacity='0.3'/%3E` +
    `%3Ccircle cx='50' cy='38' r='15' fill='%23d1fae5'/%3E` +
    `%3Crect x='35' y='52' width='30' height='25' rx='8' fill='%2334d399'/%3E` +
    `%3Ccircle cx='44' cy='37' r='2' fill='%23065f46'/%3E` +
    `%3Ccircle cx='56' cy='37' r='2' fill='%23065f46'/%3E` +
    `%3Cpath d='M45 43 Q50 46 55 43' stroke='%23065f46' stroke-width='1.5' fill='none'/%3E` +
    `%3Crect x='27' y='54' width='8' height='14' rx='4' fill='%2334d399'/%3E` +
    `%3Crect x='65' y='54' width='8' height='14' rx='4' fill='%2334d399'/%3E` +
    `%3Ccircle cx='20' cy='22' r='1.5' fill='%2334d399' opacity='0.7'/%3E` +
    `%3Ccircle cx='80' cy='18' r='1' fill='%236ee7b7' opacity='0.6'/%3E` +
    `%3Ccircle cx='85' cy='72' r='1.5' fill='%2334d399' opacity='0.5'/%3E`
  ),

  "galaxy-emperor": svgDataUri(
    `%3Cdefs%3E` +
    `%3CradialGradient id='bg' cx='50%25' cy='50%25' r='50%25'%3E%3Cstop offset='0%25' stop-color='%231e1b4b'/%3E%3Cstop offset='60%25' stop-color='%23312e81'/%3E%3Cstop offset='100%25' stop-color='%230f0e2a'/%3E%3C/radialGradient%3E` +
    `%3CradialGradient id='glow' cx='50%25' cy='50%25' r='40%25'%3E%3Cstop offset='0%25' stop-color='%23fbbf24' stop-opacity='0.3'/%3E%3Cstop offset='100%25' stop-color='%23fbbf24' stop-opacity='0'/%3E%3C/radialGradient%3E` +
    `%3C/defs%3E` +
    `%3Ccircle cx='50' cy='50' r='50' fill='url(%23bg)'/%3E` +
    `%3Ccircle cx='50' cy='50' r='35' fill='url(%23glow)'/%3E` +
    `%3Ccircle cx='50' cy='36' r='16' fill='%23fef3c7'/%3E` +
    `%3Cpath d='M40 28 L44 36 L50 24 L56 36 L60 28 L58 36 L42 36 Z' fill='%23fbbf24' stroke='%23f59e0b' stroke-width='0.5'/%3E` +
    `%3Crect x='34' y='51' width='32' height='26' rx='6' fill='%234338ca'/%3E` +
    `%3Ccircle cx='44' cy='37' r='2.5' fill='%231e1b4b'/%3E` +
    `%3Ccircle cx='56' cy='37' r='2.5' fill='%231e1b4b'/%3E` +
    `%3Cpath d='M44 43 Q50 47 56 43' stroke='%231e1b4b' stroke-width='1.5' fill='none'/%3E` +
    `%3Crect x='28' y='53' width='8' height='16' rx='4' fill='%234338ca'/%3E` +
    `%3Crect x='64' y='53' width='8' height='16' rx='4' fill='%234338ca'/%3E` +
    `%3Ccircle cx='18' cy='15' r='2' fill='%23fbbf24' opacity='0.8'/%3E` +
    `%3Ccircle cx='83' cy='20' r='1.5' fill='%23fbbf24' opacity='0.6'/%3E` +
    `%3Ccircle cx='90' cy='60' r='1' fill='%23c7d2fe' opacity='0.7'/%3E` +
    `%3Ccircle cx='8' cy='60' r='1.5' fill='%23c7d2fe' opacity='0.5'/%3E` +
    `%3Ccircle cx='75' cy='85' r='1' fill='%23fbbf24' opacity='0.4'/%3E`
  ),

  "pulsar-ranger": svgDataUri(
    radialGradientBg("bg", "%23164e63", "%230c2a38", "30%25", "30%25") +
    `%3Ccircle cx='50' cy='50' r='40' fill='none' stroke='%2306b6d4' stroke-width='0.5' opacity='0.2'/%3E` +
    `%3Ccircle cx='50' cy='50' r='30' fill='none' stroke='%2306b6d4' stroke-width='0.5' opacity='0.2'/%3E` +
    `%3Ccircle cx='50' cy='36' r='15' fill='%23cffafe'/%3E` +
    `%3Crect x='35' y='50' width='30' height='28' rx='6' fill='%230891b2'/%3E` +
    `%3Crect x='39' y='50' width='22' height='4' fill='%2306b6d4' opacity='0.7'/%3E` +
    `%3Ccircle cx='44' cy='35' r='2' fill='%230c4a6e'/%3E` +
    `%3Ccircle cx='56' cy='35' r='2' fill='%230c4a6e'/%3E` +
    `%3Cpath d='M45 41 Q50 44 55 41' stroke='%230c4a6e' stroke-width='1.5' fill='none'/%3E` +
    `%3Crect x='27' y='52' width='8' height='16' rx='4' fill='%230891b2'/%3E` +
    `%3Crect x='65' y='52' width='8' height='16' rx='4' fill='%230891b2'/%3E` +
    `%3Ccircle cx='15' cy='18' r='1.5' fill='%2322d3ee' opacity='0.7'/%3E` +
    `%3Ccircle cx='82' cy='14' r='1' fill='%2367e8f9' opacity='0.6'/%3E` +
    `%3Ccircle cx='88' cy='78' r='1.5' fill='%2322d3ee' opacity='0.5'/%3E`
  ),

  "event-horizon-god": svgDataUri(
    `%3Cdefs%3E` +
    `%3CradialGradient id='bg' cx='50%25' cy='50%25' r='50%25'%3E%3Cstop offset='0%25' stop-color='%23000000'/%3E%3Cstop offset='50%25' stop-color='%23050505'/%3E%3Cstop offset='100%25' stop-color='%23000000'/%3E%3C/radialGradient%3E` +
    `%3CradialGradient id='event' cx='50%25' cy='50%25' r='40%25'%3E%3Cstop offset='0%25' stop-color='%23000000'/%3E%3Cstop offset='70%25' stop-color='%23ff6600' stop-opacity='0.5'/%3E%3Cstop offset='100%25' stop-color='%23ffaa00' stop-opacity='0'/%3E%3C/radialGradient%3E` +
    `%3C/defs%3E` +
    `%3Ccircle cx='50' cy='50' r='50' fill='url(%23bg)'/%3E` +
    `%3Ccircle cx='50' cy='50' r='38' fill='url(%23event)'/%3E` +
    `%3Ccircle cx='50' cy='50' r='15' fill='%23000000'/%3E` +
    `%3Ccircle cx='50' cy='50' r='15' fill='none' stroke='%23ff6600' stroke-width='1' opacity='0.8'/%3E` +
    `%3Ccircle cx='50' cy='50' r='20' fill='none' stroke='%23ff8800' stroke-width='0.5' opacity='0.5'/%3E` +
    `%3Ccircle cx='50' cy='50' r='25' fill='none' stroke='%23ffaa00' stroke-width='0.3' opacity='0.3'/%3E` +
    `%3Ccircle cx='44' cy='48' r='2.5' fill='%23ff6600' opacity='0.9'/%3E` +
    `%3Ccircle cx='56' cy='48' r='2.5' fill='%23ff6600' opacity='0.9'/%3E` +
    `%3Cpath d='M44 54 Q50 58 56 54' stroke='%23ffaa00' stroke-width='1.5' fill='none'/%3E` +
    `%3Cpath d='M20 50 Q35 30 50 35 Q65 40 80 50' stroke='%23ff6600' stroke-width='1' fill='none' opacity='0.4'/%3E` +
    `%3Ccircle cx='15' cy='20' r='1' fill='%23ff8800' opacity='0.6'/%3E` +
    `%3Ccircle cx='85' cy='15' r='1.5' fill='%23ffaa00' opacity='0.5'/%3E` +
    `%3Ccircle cx='90' cy='80' r='1' fill='%23ff6600' opacity='0.4'/%3E`
  ),
};

// ── Shop catalogue ────────────────────────────────────────────────────────────

export const SHOP_CATALOGUE: ShopItem[] = [
  {
    name: "Astronaut Pioneer",
    description: "A classic space explorer ready to boldly go where no one has gone before.",
    type: "AVATAR",
    price: 150,
    value: "astronaut-pioneer",
    icon: "👨‍🚀",
    rarity: "common",
  },
  {
    name: "Nebula Witch",
    description: "A mysterious cosmic sorceress who commands the power of dying stars.",
    type: "AVATAR",
    price: 300,
    value: "nebula-witch",
    icon: "🔮",
    rarity: "rare",
  },
  {
    name: "Solar Guardian",
    description: "Forged in the heart of a sun, this guardian radiates pure stellar energy.",
    type: "AVATAR",
    price: 300,
    value: "solar-guardian",
    icon: "☀️",
    rarity: "rare",
  },
  {
    name: "Void Spectre",
    description: "A being of pure dark matter, visible only by the light it bends.",
    type: "AVATAR",
    price: 500,
    value: "void-spectre",
    icon: "👁️",
    rarity: "epic",
  },
  {
    name: "Aurora Sage",
    description: "Attuned to the magnetic fields of planets, a healer of the cosmos.",
    type: "AVATAR",
    price: 500,
    value: "aurora-sage",
    icon: "🌌",
    rarity: "epic",
  },
  {
    name: "Pulsar Ranger",
    description: "Navigates deep space using precision pulsar timing. Reliable. Relentless.",
    type: "AVATAR",
    price: 750,
    value: "pulsar-ranger",
    icon: "📡",
    rarity: "epic",
  },
  {
    name: "Galaxy Emperor",
    description: "Rules an entire spiral galaxy. The crown is real.",
    type: "AVATAR",
    price: 1500,
    value: "galaxy-emperor",
    icon: "👑",
    rarity: "legendary",
  },
  {
    name: "Event Horizon God",
    description: "Transcended matter itself. Exists at the edge of everything. Unmatched.",
    type: "AVATAR",
    price: 2500,
    value: "event-horizon-god",
    icon: "🕳️",
    rarity: "legendary",
  },
];

// ── Avatar frame styles ───────────────────────────────────────────────────────

export const FRAME_STYLES: Record<string, string> = {
  "solar-flare":   "ring-4 ring-yellow-400 ring-offset-2 shadow-[0_0_20px_4px_rgba(250,204,21,0.6)]",
  "nebula-glow":   "ring-4 ring-purple-500 ring-offset-2 shadow-[0_0_20px_4px_rgba(168,85,247,0.6)]",
  "aurora-ring":   "ring-4 ring-offset-2 shadow-lg ring-cyan-400 shadow-[0_0_20px_4px_rgba(34,211,238,0.5)]",
  "event-horizon": "ring-4 ring-gray-900 ring-offset-2 shadow-[0_0_30px_8px_rgba(0,0,0,0.9)]",
};