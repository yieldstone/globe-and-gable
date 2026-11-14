import { queryOptions } from "@tanstack/react-query";
import { getSubmittedListing, getSubmittedListings } from "./listings.functions";
import { getProperty } from "./properties";

export const submittedListingsQuery = () =>
  queryOptions({
    queryKey: ["listings"],
    queryFn: () => getSubmittedListings(),
    staleTime: 30_000,
  });

export const propertyQuery = (id: string) =>
  queryOptions({
    queryKey: ["listing", id],
    queryFn: async () => getProperty(id) ?? (await getSubmittedListing({ data: { id } })),
    staleTime: 30_000,
  });
