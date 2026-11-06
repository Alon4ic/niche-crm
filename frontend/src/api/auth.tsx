import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import { useAuthStore } from '../stores/authStore';

export interface Profile {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: 'OWNER' | 'ADMIN' | 'MEMBER';
    tenant: {id: string; name: string };
}

export function useMe() {
    const accessToken = useAuthStore((state) => state.accessToken);
    return useQuery({
        queryKey: ['me'],
        queryFn: () => apiClient.get<Profile>('/auth/me'),
        enabled: !!accessToken,
        staleTime: 5 * 60 * 1000,
    })
}