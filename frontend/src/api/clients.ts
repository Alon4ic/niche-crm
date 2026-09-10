import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";

export interface Client {
  id: string;
  name: string;
  industry: string | null;
  notes: string | null;
  createdAt: string;
}

export interface CreateClientPayload {
  name: string;
  industry?: string;
  notes?: string;
}

export function useClients() {
  return useQuery({
    queryKey: ["clients"],
    queryFn: () => apiClient.get<Client[]>("/clients"),
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateClientPayload) =>
      apiClient.post<Client>("/clients", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}
