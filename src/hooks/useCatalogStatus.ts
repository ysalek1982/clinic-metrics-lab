import { useQuery } from "@tanstack/react-query";
import { getCatalogStatus } from "@/services/catalogService";

export function useCatalogStatus() {
  return useQuery({
    queryKey: ["catalog-status"],
    queryFn: getCatalogStatus,
    staleTime: 60_000,
    retry: 1,
  });
}
