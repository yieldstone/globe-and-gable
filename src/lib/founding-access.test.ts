import { describe, expect, it } from "vitest";
import { canPublishForFree, foundingAccess } from "./founding-access";

describe("founding partner access", () => {
  it("charges zero for publishing property listings", () => expect(foundingAccess.listingFeeUsd).toBe(0));
  it("charges zero for agency profile creation", () => expect(foundingAccess.agencyProfileFeeUsd).toBe(0));
  it("requires no subscription", () => expect(foundingAccess.requiresSubscription).toBe(false));
  it("removes the three-listing pricing cap", () => expect(foundingAccess.listingLimit).toBeNull());
  it("lets registered users publish for free", () => expect(canPublishForFree(true)).toBe(true));
  it("still requires sign-in", () => expect(canPublishForFree(false)).toBe(false));
});