import { queryOptions } from "@tanstack/react-query";
import { getProperties, getPropertyById } from "./properties.functions";

export const propertiesQuery = () =>
  queryOptions({
    queryKey: ["properties"],
    queryFn: () => getProperties(),
    staleTime: 30_000,
  });

export const propertyQuery = (id: string) =>
  queryOptions({
    queryKey: ["property", id],
    queryFn: () => getPropertyById({ data: { id } }),
    staleTime: 30_000,
  });
