import { describe, expect, it } from "vitest";
import { filterProperties, type Property } from "./properties";

const base: Omit<Property, "id" | "listing" | "country" | "city" | "priceUsd" | "sizeM2"> = {
  title: "x", kind: "House", neighborhood: "n", lat: null, lng: null, beds: 1, baths: 1, yearBuilt: 2000,
  images: [], description: "d", features: [], agent: { name: "a" }, userId: null,
};
const list: Property[] = [
  { ...base, id: "ny", listing: "buy", country: "United States", city: "New York", priceUsd: 4_250_000, sizeM2: 210 },
  { ...base, id: "la", listing: "rent", country: "United States", city: "Los Angeles", priceUsd: 14_000, sizeM2: 380 },
  { ...base, id: "mb", listing: "buy", country: "Spain", city: "Marbella", priceUsd: 3_850_000, sizeM2: 520 },
  { ...base, id: "sy", listing: "buy", country: "Australia", city: "Sydney", priceUsd: 3_950_000, sizeM2: 340 },
];

describe("property filters", () => {
  it("filters by listing type", () => {
    expect(filterProperties(list, { type: "rent" }).map((p) => p.id)).toEqual(["la"]);
  });

  it("filters by country and city", () => {
    expect(filterProperties(list, { country: "United States", city: "New York" }).map((p) => p.id)).toEqual(["ny"]);
  });

  it("applies price range and minimum size together", () => {
    const r = filterProperties(list, { minPrice: 2_000_000, maxPrice: 4_000_000, minSize: 300 });
    expect(r.map((p) => p.id).sort()).toEqual(["mb", "sy"]);
  });
});
