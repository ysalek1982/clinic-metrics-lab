import { useQuery } from "@tanstack/react-query";
import { getIdentityContext } from "@/services/identityService";

export function useIdentity() {
  return useQuery({
    queryKey: ["identity-context"],
    queryFn: getIdentityContext,
    staleTime: 30_000,
    retry: 1,
  });
}
