import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL, apiClient } from "../lib/apiClient";
import { useAuthStore } from "../stores/authStore";

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

export interface DealContactRef {
  id: string;
  roleInDeal: string | null;
  contact: {
    id: string;
    fullName: string;
    roleTitle: string | null;
  };
}

export interface DealReservation {
  id: string;
  stockItemId: string;
  quantity: string;
  status: "RESERVED" | "RELEASED" | "FULFILLED";
}
export interface DealDetail extends Deal {
  bomItems: DealBomItem[];
  dealContacts: DealContactRef[];
  stockReservations: DealReservation[];
}

export function useUpdateDealStage(dealId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (stage: DealStage) =>
      apiClient.patch(`/deals/${dealId}/stage`, { stage }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      queryClient.invalidateQueries({ queryKey: ["deals", dealId] });
      queryClient.invalidateQueries({ queryKey: ["stockItems"] });
    },
  });
}

export function useAddDealContact(dealId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { contactId: string; roleInDeal?: string }) =>
      apiClient.post(`deals/${dealId}/contacts`, payload),
    meta: { conflictMessage: "deals.contactsSection.alreadyLinked" },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals", dealId] });
    },
  });
}

export function useRemoveDealContact(dealId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (contactId: string) =>
      apiClient.delete(`/deals/${dealId}/contacts/${contactId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals", dealId] });
    },
  });
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
    queryKey: ["deals", dealId],
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
    queryKey: ["deals", dealId, "cost"],
    queryFn: () => apiClient.get<DealCost>(`/deals/${dealId}/cost`),
  });
}

export function useAddBomItem(dealId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddBomItemPayload) =>
      apiClient.post(`/deals/${dealId}/bom-items`, payload),
    meta: { conflictMessage: "deals.bom.locked" },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals", dealId] });
      queryClient.invalidateQueries({ queryKey: ["deals", dealId, "cost"] });
    },
  });
}

export function useReserveStock(dealId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post(`/deals/${dealId}/reserve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals", dealId] });
      queryClient.invalidateQueries({ queryKey: ["stockItems"] });
    },
  });
}

export function useRemoveBomItem(dealId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) =>
      apiClient.delete(`/deals/${dealId}/bom-items/${itemId}`),
    meta: { conflictMessage: "deals.bom.locked" },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals", dealId] });
    },
  });
}

export function useReleaseReservation(dealId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post(`/deals/${dealId}/release`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals", dealId] });
      queryClient.invalidateQueries({ queryKey: ["stockItems"] });
    },
  });
}

export async function downloadQuotePdf(dealId: string, dealTitle: string) {
  const accessToken = useAuthStore.getState().accessToken;

  const response = await fetch(`${API_BASE_URL}/deals/${dealId}/quote`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });

  if (!response.ok) {
    throw new Error("Failed to download quote");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `quote-${dealTitle}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
