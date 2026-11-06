import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";
import type { DealStage } from "./deals";

export interface FunnelStageMetric {
  stage: DealStage;
  count: number;
  totalValue: number;
  avgDaysInStage: number | null;
}

export interface FunelAnalytics {
  stages: FunnelStageMetric[];
  totalDeals: number;
  wonCount: number;
  lostCount: number;
  winRatePercent: number | null;
}

export function useFunnelAnalistics() {
  return useQuery({
    queryKey: ["analytics", "funnel"],
    queryFn: () => apiClient.get<FunelAnalytics>("/deals/analytics/funnel"),
  });
}
