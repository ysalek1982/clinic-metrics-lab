import { useQuery } from "@tanstack/react-query";
import { getFormulaCatalog, getMeasurementCatalog, getScreeningCatalog } from "@/services/catalogService";

export function useFormulaCatalog() {
  return useQuery({
    queryKey: ["catalog", "formulas"],
    queryFn: getFormulaCatalog,
    staleTime: 60_000,
    retry: 1,
  });
}

export function useScreeningCatalog() {
  return useQuery({
    queryKey: ["catalog", "screenings"],
    queryFn: getScreeningCatalog,
    staleTime: 60_000,
    retry: 1,
  });
}

export function useMeasurementCatalog() {
  return useQuery({
    queryKey: ["catalog", "measurements"],
    queryFn: getMeasurementCatalog,
    staleTime: 60_000,
    retry: 1,
  });
}
