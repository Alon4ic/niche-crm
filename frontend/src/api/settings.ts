import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';

export interface Settings {
    returnWindowDays: number;
}

export function useSettings() {
    return useQuery({
        queryKey: ['settings'],
        queryFn: () => apiClient.get<Settings>('/settings',)
    });
}

export function useUpdateSettings() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn:(payload: Partial<Settings>) => apiClient.patch<Settings>('/settings', payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['settings'] });
            queryClient.invalidateQueries({ queryKey: ['deals'] });
        },
     });
}