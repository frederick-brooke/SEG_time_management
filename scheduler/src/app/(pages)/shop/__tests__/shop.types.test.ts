/**
 * Testing for shop types.
 */

import { RARITY_CONFIG, ItemRarity } from "../shop.types";

describe("Shop Types & Configuration", () => {
  it("contains styling configurations for all rarity tiers", () => {
    const expectedKeys: ItemRarity[] = ["common", "rare", "epic", "legendary"];
    
    expectedKeys.forEach((key) => {
      expect(RARITY_CONFIG).toHaveProperty(key);
      expect(RARITY_CONFIG[key]).toHaveProperty("bg");
      expect(RARITY_CONFIG[key]).toHaveProperty("text");
      expect(RARITY_CONFIG[key]).toHaveProperty("label");
    });
  });
});