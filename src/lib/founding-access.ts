// Temporary launch access: account authentication is the only publishing gate.
export const foundingAccess = {
  listingFeeUsd: 0,
  agencyProfileFeeUsd: 0,
  requiresSubscription: false,
  listingLimit: null,
} as const;

export function canPublishForFree(signedIn: boolean) {
  return signedIn && foundingAccess.listingFeeUsd === 0 && !foundingAccess.requiresSubscription;
}