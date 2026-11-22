import { queryOptions } from "@tanstack/react-query";
import { getAgencyProfiles } from "./agencies.functions";

export const agencyProfilesQuery = () => queryOptions({
  queryKey: ["agency-profiles"], queryFn: () => getAgencyProfiles(), staleTime: 30_000,
});