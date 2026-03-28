import {
  AVATAR_IMAGES,
  SHOP_CATALOGUE,
  FRAME_STYLES,
  type AvatarKey,
  type Rarity,
  type ShopItem,
} from "../shop-catalogue";

// ── Helpers ────────

const AVATAR_KEYS: AvatarKey[] = [
  "astronaut-pioneer",
  "nebula-witch",
  "solar-guardian",
  "void-spectre",
  "aurora-sage",
  "galaxy-emperor",
  "pulsar-ranger",
  "event-horizon-god",
];

const VALID_RARITIES: Rarity[] = ["common", "rare", "epic", "legendary"];

const isValidDataUri = (value: string) =>
  value.startsWith("data:image/svg+xml,");

const isSvgDataUri = (value: string) =>
  isValidDataUri(value) &&
  value.includes("%3Csvg") &&   // <svg
  value.includes("%3C/svg%3E"); // </svg>

// ── AVATAR_IMAGES ──

describe("AVATAR_IMAGES", () => {
  it("contains an entry for every AvatarKey", () => {
    for (const key of AVATAR_KEYS) {
      expect(AVATAR_IMAGES).toHaveProperty(key);
    }
  });

  it("contains no extra keys beyond the defined AvatarKey union", () => {
    expect(Object.keys(AVATAR_IMAGES)).toEqual(AVATAR_KEYS);
  });

  it("every value is a valid SVG data URI", () => {
    for (const [key, value] of Object.entries(AVATAR_IMAGES)) {
      expect(isSvgDataUri(value)).toBe(true); // fails with key name if broken
    }
  });

  it("every SVG contains a viewBox attribute", () => {
    for (const [key, value] of Object.entries(AVATAR_IMAGES)) {
      expect(value).toContain("viewBox='0 0 100 100'");
    }
  });

  it("every SVG contains a background circle", () => {
    for (const [key, value] of Object.entries(AVATAR_IMAGES)) {
      expect(value).toContain("cx='50' cy='50' r='50'");
    }
  });

  it("every SVG contains a radial gradient definition", () => {
    for (const [key, value] of Object.entries(AVATAR_IMAGES)) {
      expect(value).toContain("radialGradient");
    }
  });

  it("all SVG data URIs are unique (no two avatars share the same image)", () => {
    const values = Object.values(AVATAR_IMAGES);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });

  it("astronaut-pioneer includes star field elements", () => {
    // The STAR_FIELD constant adds white circles at known coordinates
    expect(AVATAR_IMAGES["astronaut-pioneer"]).toContain("cx='22' cy='20'");
    expect(AVATAR_IMAGES["astronaut-pioneer"]).toContain("cx='78' cy='15'");
  });
});

// ── SHOP_CATALOGUE ─

describe("SHOP_CATALOGUE", () => {
  it("contains exactly 8 items", () => {
    expect(SHOP_CATALOGUE).toHaveLength(8);
  });

  it("every item has all required ShopItem fields", () => {
    const requiredKeys: (keyof ShopItem)[] = [
      "name",
      "description",
      "type",
      "price",
      "value",
      "icon",
      "rarity",
    ];
    for (const item of SHOP_CATALOGUE) {
      for (const key of requiredKeys) {
        expect(item).toHaveProperty(key);
      }
    }
  });

  it("every item has type AVATAR", () => {
    for (const item of SHOP_CATALOGUE) {
      expect(item.type).toBe("AVATAR");
    }
  });

  it("every item value is a recognised AvatarKey", () => {
    for (const item of SHOP_CATALOGUE) {
      expect(AVATAR_KEYS).toContain(item.value);
    }
  });

  it("every item value has a corresponding entry in AVATAR_IMAGES", () => {
    for (const item of SHOP_CATALOGUE) {
      expect(AVATAR_IMAGES).toHaveProperty(item.value);
    }
  });

  it("every item rarity is a valid Rarity value", () => {
    for (const item of SHOP_CATALOGUE) {
      expect(VALID_RARITIES).toContain(item.rarity);
    }
  });

  it("every item has a positive price", () => {
    for (const item of SHOP_CATALOGUE) {
      expect(item.price).toBeGreaterThan(0);
    }
  });

  it("every item has a non-empty name, description, and icon", () => {
    for (const item of SHOP_CATALOGUE) {
      expect(item.name.trim()).not.toBe("");
      expect(item.description.trim()).not.toBe("");
      expect(item.icon.trim()).not.toBe("");
    }
  });

  it("item values are unique (no duplicate avatars in the catalogue)", () => {
    const values = SHOP_CATALOGUE.map((item) => item.value);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });

  it("items are sorted by ascending price", () => {
    const prices = SHOP_CATALOGUE.map((item) => item.price);
    const sorted = [...prices].sort((a, b) => a - b);
    expect(prices).toEqual(sorted);
  });

  it("does not contain any functional items (XP Boost, Streak Shield)", () => {
    const names = SHOP_CATALOGUE.map((item) => item.name);
    expect(names).not.toContain("XP Boost");
    expect(names).not.toContain("Streak Shield");
  });

  it("legendary items are more expensive than epic items", () => {
    const epicPrices = SHOP_CATALOGUE
      .filter((i) => i.rarity === "epic")
      .map((i) => i.price);
    const legendaryPrices = SHOP_CATALOGUE
      .filter((i) => i.rarity === "legendary")
      .map((i) => i.price);

    const maxEpic = Math.max(...epicPrices);
    const minLegendary = Math.min(...legendaryPrices);
    expect(minLegendary).toBeGreaterThan(maxEpic);
  });

  it("has exactly one common, two rare, three epic, and two legendary items", () => {
    const countByRarity = (rarity: Rarity) =>
      SHOP_CATALOGUE.filter((i) => i.rarity === rarity).length;

    expect(countByRarity("common")).toBe(1);
    expect(countByRarity("rare")).toBe(2);
    expect(countByRarity("epic")).toBe(3);
    expect(countByRarity("legendary")).toBe(2);
  });

  describe("individual item spot-checks", () => {
    it("Astronaut Pioneer is the cheapest item at 150 coins", () => {
      const item = SHOP_CATALOGUE.find((i) => i.value === "astronaut-pioneer");
      expect(item?.price).toBe(150);
      expect(item?.rarity).toBe("common");
    });

    it("Event Horizon God is the most expensive item at 2500 coins", () => {
      const item = SHOP_CATALOGUE.find((i) => i.value === "event-horizon-god");
      expect(item?.price).toBe(2500);
      expect(item?.rarity).toBe("legendary");
    });

    it("Galaxy Emperor is priced at 1500 coins and is legendary", () => {
      const item = SHOP_CATALOGUE.find((i) => i.value === "galaxy-emperor");
      expect(item?.price).toBe(1500);
      expect(item?.rarity).toBe("legendary");
    });
  });
});

// ── FRAME_STYLES ───

describe("FRAME_STYLES", () => {
  const FRAME_KEYS = ["solar-flare", "nebula-glow", "aurora-ring", "event-horizon"];

  it("contains exactly 4 frame styles", () => {
    expect(Object.keys(FRAME_STYLES)).toHaveLength(4);
  });

  it("contains all expected frame keys", () => {
    for (const key of FRAME_KEYS) {
      expect(FRAME_STYLES).toHaveProperty(key);
    }
  });

  it("every frame style is a non-empty string", () => {
    for (const [key, value] of Object.entries(FRAME_STYLES)) {
      expect(value.trim()).not.toBe("");
    }
  });

  it("every frame style includes a ring utility class", () => {
    for (const [key, value] of Object.entries(FRAME_STYLES)) {
      expect(value).toMatch(/\bring-\d+\b/);
    }
  });

  it("every frame style includes a shadow utility class", () => {
    for (const [key, value] of Object.entries(FRAME_STYLES)) {
      expect(value).toContain("shadow");
    }
  });

  it("all frame styles are unique", () => {
    const values = Object.values(FRAME_STYLES);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });
});