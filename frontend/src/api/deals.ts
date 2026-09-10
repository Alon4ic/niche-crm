import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";

export interface Client {
  id: string;
  name: string;
}

export type DealStage =
  | "LEAD"
  | "QUALIFIED"
  | "PROPOSAL"
  | "NEGOTIATION"
  | "WON"
  | "LOST";

export interface Deal {
  id: string;
  title: string;
  stage: DealStage;
  value: string;
  currency: string;
  createdAt: string;
  client: Client;
}

export interface CreateDealPayload {
  title: string;
  clientId: string;
  value: number;
  currency?: string;
}

export interface StockItemRef {
    id: string;
    sku: string;
    name: string;
}

export interface DealBomItem {
    id: string;
    quantity: string;
    unitCostSnapshot: string;
    stockItem: StockItemRef;
}

export interface DealDetail extends Deal {
    bomItems: DealBomItem[];
}

export interface AddBomItemPayload {
    stockItemId: string;
    quantity: number;
}

export interface DealCost {
    dealId: string;
    itemsCount: number;
    totalCost: number;
}

export function fetchDeals(): Promise<Deal[]> {
  return apiClient.get<Deal[]>("/deals");
}

export function useDeals() {
  return useQuery({
    queryKey: ["deals"],
    queryFn: fetchDeals,
  });
}

export function useDeal(dealId: string) {
    return useQuery({
        queryKey: ['deals', dealId],
        queryFn: () => apiClient.get<DealDetail>(`/deals/${dealId}`),
    });
}


export function useCreateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateDealPayload) =>
      apiClient.post<Deal>("/deals", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
    },
  });
}

export function useDealCost(dealId: string) {
    return useQuery({
        queryKey: ['deals', dealId, 'cost'],
        queryFn: () => apiClient.get<DealCost>(`/deals/${dealId}/cost`),
    });
}

export function useAddBomItem(dealId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: AddBomItemPayload) => 
            apiClient.post(`/deals/${dealId}/bom-items`, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['deals', dealId] });
            queryClient.invalidateQueries({ queryKey: ['deals', dealId, 'cost'] });
        },
    });
}

export function useReserveStock(dealId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => apiClient.post(`/deals/${dealId}/reserve`),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['deals', dealId] });
            queryClient.invalidateQueries({ queryKey: ['stockItems'] });
        },
    });
}