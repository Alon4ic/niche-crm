import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';

export interface ContactClientRef {
    id: string;
    name: string;
}

export interface Contact {
    id: string;
    fullName: string;
    roleTitle: string | null;
    email: string | null;
    phone: string | null;
    clientId: string;
    client:ContactClientRef;
}

export interface CreateContactPayload {
    fullName: string;
    roleTitle?: string;
    email?: string;
    phone?: string;
    clientId: string;
}

export interface UpdateContactPayload {
    fullName?: string;
    roleTitle?: string;
    email?: string;
    phone?: string;
}

export function useContacts(clientId?: string) {
    return useQuery({
        queryKey: ['contacts', clientId ?? 'all'],
        queryFn: () => {
            const query = clientId ? `?clientId=${clientId}` : '';
            return apiClient.get<Contact[]>(`/contacts${query}`);
        },
    });
}

export function useCreateContact() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: CreateContactPayload) =>
            apiClient.post<Contact>('/contacts', payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
        },
    });
}

export function useUpdateContact() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateContactPayload }) =>
            apiClient.patch<Contact>(`/contacts/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
        },
    });
}

export function useDeleteContact() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => apiClient.delete(`/contacts/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
        },
    });
}