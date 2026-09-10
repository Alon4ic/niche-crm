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
}

export interface CreateStockItemPayload {
    sku: string;
    name: string;
    unit: string;
    unitCost: number;
    quantityOnHand?: number;
}

export function useStockItems() {
    return useQuery({
        queryKey: ['stockItems'],
        queryFn: () => apiClient.get<StockItem[]>('/stock-items'),
    });
}

export function useCreateStockItem() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: CreateStockItemPayload) =>
            apiClient.post<StockItem>('/stock-items', payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stockItems'] });
        },
    });
}