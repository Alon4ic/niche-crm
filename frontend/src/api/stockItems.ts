import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";

export interface StockItem {
  id: string;
  sku: string;
  name: string;
  unit: string;
  unitCost: string;
  quantityOnHand: string;
  quantityReserved: string;
  quantityAvailable: string;
}

export interface CreateStockItemPayload {
  sku: string;
  name: string;
  unit: string;
  unitCost: number;
  quantityOnHand?: number;
}

export interface UpdateStockItemPayload {
  sku?: string;
  name?: string;
  unit?: string;
  unitCost?: number;
  quantityOnHand?: number;
}

export function useStockItems() {
  return useQuery({
    queryKey: ["stockItems"],
    queryFn: () => apiClient.get<StockItem[]>("/stock-items"),
  });
}

export function useCreateStockItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStockItemPayload) =>
      apiClient.post<StockItem>("/stock-items", payload),
    meta: { conflictMessage: "stockItems.skuExists" },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stockItems"] });
    },
  });
}

export function useUpdateStockItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStockItemPayload }) =>
      apiClient.patch<StockItem>(`/stock-items/${id}`, data),
    meta: { conflictMessage: "stockItems.skuExists" },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stockItems"] });
    },
  });
}

export function useDeleteStockItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/stock-items/${id}`),
    meta: { conflictMessage: "stockItems.inUse" },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stockItems"] });
    },
  });
}
