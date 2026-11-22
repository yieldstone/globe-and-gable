import { describe, expect, it } from "vitest";
import { convertFromUsd, convertToUsd } from "./currency";
import { formatArea, toSquareMeters } from "./units";
import { filterProperties, parseFilters, regionFor, sortProperties, type Property } from "./properties";
import { whatsappLink } from "./whatsapp";
import { calculateMortgage, calculateRentalRoi } from "./mortgage";

const property: Property = {
  id: "usa", title: "Ocean Penthouse", kind: "Penthouse", listing: "buy", country: "United States", city: "Miami",
  neighborhood: "Beach", lat: null, lng: null, priceUsd: 500_000, sizeM2: 200, beds: 3, baths: 2,
  yearBuilt: 2020, images: [], description: "Home", features: ["Private pool", "Sea view", "Gym", "Fully furnished"],
  agent: { name: "Agent" }, userId: null,
};
const dubai: Property = { ...property, id: "dubai", kind: "Villa", country: "United Arab Emirates", city: "Dubai" };
const abuDhabi: Property = { ...dubai, id: "abu", kind: "Townhouse", city: "Abu Dhabi", beds: 2, features: [] };

describe("marketplace rules", () => {
  it("converts USD to AED and back at the dirham reference rate", () => {
    expect(convertFromUsd(1000, "AED")).toBe(3672.5);
    expect(convertToUsd(3672.5, "AED")).toBe(1000);
  });
  it("keeps USD prices unchanged", () => expect(convertFromUsd(500_000, "USD")).toBe(500_000));
  it("displays comma-formatted square feet", () => expect(formatArea(200)).toBe("2,153 sq ft"));
  it("converts square-foot size filters back to stored square meters", () => {
    expect(filterProperties([property], { minSize: toSquareMeters(2000) })).toHaveLength(1);
    expect(filterProperties([property], { minSize: toSquareMeters(3000) })).toHaveLength(0);
  });
  it("identifies USA, Dubai and Abu Dhabi separately", () => {
    expect([property, dubai, abuDhabi].map(regionFor)).toEqual(["USA", "Dubai", "Abu Dhabi"]);
    for (const [region, id] of [["USA", "usa"], ["Dubai", "dubai"], ["Abu Dhabi", "abu"]] as const) {
      expect(filterProperties([property, dubai, abuDhabi], { region }).map((p) => p.id)).toEqual([id]);
    }
  });
  it("supports Penthouse and Townhouse URL filters", () => {
    expect(filterProperties([property, dubai, abuDhabi], parseFilters({ kind: "Penthouse" })).map((p) => p.id)).toEqual(["usa"]);
    expect(filterProperties([property, dubai, abuDhabi], parseFilters({ kind: "Townhouse" })).map((p) => p.id)).toEqual(["abu"]);
  });
  it("uses minimum bedroom count", () => expect(filterProperties([dubai, abuDhabi], { bedrooms: 3 }).map((p) => p.id)).toEqual(["dubai"]));
  for (const amenity of ["Pool", "Sea View", "Gym", "Furnished"] as const) {
    it(`filters by ${amenity}`, () => expect(filterProperties([dubai, abuDhabi], { amenities: [amenity] }).map((p) => p.id)).toEqual(["dubai"]));
  }
  it("requires all selected amenities and rejects negative features", () => {
    expect(filterProperties([{ ...dubai, features: ["Pool", "Unfurnished"] }], { amenities: ["Pool", "Furnished"] })).toHaveLength(0);
  });
  it("retains amenity selections in shared search URLs", () => expect(parseFilters({ amenities: "Pool,Gym,Invalid" }).amenities).toEqual(["Pool", "Gym"]));
  it("always keeps Featured first regardless of selected sort", () => {
    const featured = { ...property, id: "featured", featured: true, priceUsd: 1_000_000, sizeM2: 1 };
    for (const sort of ["featured", "price-asc", "price-desc", "size-desc"] as const) {
      expect(sortProperties([property, featured, { ...dubai, priceUsd: 2_000_000 }], sort)[0]?.id).toBe("featured");
    }
  });
  it("does not infer verified status from agency affiliation", () => expect({ ...property, agencyId: "gulf-prime" }.verifiedAgent).toBeUndefined());
  it("keeps price sorting within the Featured and ordinary groups", () => {
    expect(sortProperties([{ ...property, id: "a", featured: true, priceUsd: 10 }, { ...property, id: "b", featured: true, priceUsd: 5 }, { ...property, id: "c", priceUsd: 1 }], "price-asc").map((p) => p.id)).toEqual(["b", "a", "c"]);
  });
  it("does not expose WhatsApp without an authorized international phone", () => {
    expect(whatsappLink(null, property.title, "https://example.com/properties/usa")).toBeNull();
    expect(whatsappLink("0501234567", property.title, "https://example.com/properties/usa")).toBeNull();
  });
  it("prefills WhatsApp with the property title and link", () => {
    const link = whatsappLink("+971 50 123 4567", property.title, "https://example.com/properties/usa");
    expect(link?.startsWith("https://wa.me/971501234567?")).toBe(true);
    const text = new URL(link ?? "https://example.com").searchParams.get("text");
    expect(text).toContain("Ocean Penthouse");
    expect(text).toContain("https://example.com/properties/usa");
  });
  it("recalculates monthly payment after changing down payment, rate and term", () => {
    const initial = calculateMortgage({ homePrice: 500_000, downPayment: 100_000, annualRatePct: 6, years: 30 });
    expect(initial.monthlyPI).toBeCloseTo(2398.20, 2);
    const adjusted = calculateMortgage({ homePrice: 500_000, downPayment: 200_000, annualRatePct: 0, years: 25 });
    expect(adjusted.monthlyPI).toBe(1000);
  });
  it("calculates rental yield and cash-on-cash using operating costs and debt", () => {
    const roi = calculateRentalRoi({ purchasePrice: 500_000, downPayment: 100_000, monthlyRent: 4000, annualExpenses: 6000, monthlyMortgage: 2000 });
    expect(roi.grossYield).toBeCloseTo(9.6);
    expect(roi.netYield).toBeCloseTo(8.4);
    expect(roi.monthlyCashFlow).toBe(1500);
    expect(roi.cashOnCash).toBe(18);
  });
  it("does not divide by zero when the down payment is zero", () => expect(calculateRentalRoi({ purchasePrice: 500_000, downPayment: 0, monthlyRent: 4000, annualExpenses: 0, monthlyMortgage: 2000 }).cashOnCash).toBeNull());
});