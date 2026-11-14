import { describe, expect, it } from "vitest";
import { filterProperties, properties } from "./properties";

describe("property filters", () => {
  it("filters by listing type", () => {
    const rent = filterProperties(properties, { type: "rent" });
    expect(rent.length).toBeGreaterThan(0);
    expect(rent.every((p) => p.listing === "rent")).toBe(true);
  });

  it("filters by country and city", () => {
    const r = filterProperties(properties, { country: "United States", city: "New York" });
    expect(r.map((p) => p.id)).toEqual(["tribeca-skyline-penthouse"]);
  });

  it("applies price range and minimum size together", () => {
    const r = filterProperties(properties, { minPrice: 2_000_000, maxPrice: 4_000_000, minSize: 300 });
    expect(r.every((p) => p.priceUsd >= 2_000_000 && p.priceUsd <= 4_000_000 && p.sizeM2 >= 300)).toBe(true);
    expect(r.map((p) => p.id).sort()).toEqual(["marbella-golden-mile-villa", "mosman-harbour-family-home"]);
  });
});
