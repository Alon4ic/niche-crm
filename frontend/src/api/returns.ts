import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';

export type ReturnDisposition = 'RESTOCK' | 'WRITE_OFF';

export interface ReturnLine {
    stockItemId: string;
    sku: string;
    name: string;
    unit: string;
    delivered: string;
    returned: string;
    returnable: string;
}

export interface ReturnRecord {
    id: string;
    reason: string | null;
    createdAt: string;
    createdBy: { email: string | null };
    items: {
        id: string;
        quantity: string;
        disposition: ReturnDisposition;
        stockItem: { sku: string; name: string };
    }[];
}

export interface DealReturnsInfo {
    windowDays: number;
    deadline: string | null;
    eligible: boolean;
    blockedReason: string | null;
    lines: ReturnLine[];
    returns: ReturnRecord[];
}

export interface CreateReturnPayload {
    reason?: string;
    items: { stockItemId: string; quantity: number; disposition: ReturnDisposition }[];
}

export  function useDealReturns(dealId: string) {
    return useQuery({
        queryKey: ['deals', dealId, 'returns'],
        queryFn: () => apiClient.get<DealReturnsInfo>(`/deals/${dealId}/returns`),
    });
}

export function useCreateReturn(dealId: string ) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: CreateReturnPayload) => 
            apiClient.post(`/deals/${dealId}/returns`, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['deals', dealId] });
            queryClient.invalidateQueries({ queryKey: ['stockItems'] });
        },
    });
}