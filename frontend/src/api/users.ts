import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from '../lib/apiClient';

export interface AppUser {
    id: string;
    email: string;
    role: 'OWNER' | 'ADMIN' | 'MEMBER';
    firstName: string | null;
    lastName: string | null;
    createdAt: string;
}

export interface CreateUserPayload {
    email: string;
    password: string;
    role: 'ADMIN' | 'MEMBER';
    firstName?: string;
    lastName?: string;
}

export function useUsers() {
    return useQuery({
        queryKey: ['users'],
        queryFn: () => apiClient.get<AppUser[]>('/users'),
    });
}

export function useCreateUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: CreateUserPayload) => apiClient.post<AppUser>('/users', payload),
        meta: {conflictMessage: 'users.emailExists' },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });
}