import {create } from 'zustand';
import { apiClient } from '../lib/apiClient';

interface AuthResponse {
    accessToken: string;
    refreshToken: string;
}

interface RegisterPayload {
    email: string;
    password: string;
    tenantName: string;
    firstName?: string;
    lastName?: string;
}

interface AuthState {
    accessToken: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (data: RegisterPayload) => Promise<void>;
    logout: () => Promise<void>;
    refreshAccessToken: () => Promise<boolean>;
    hydrate: () => Promise<void>;
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export const useAuthStore = create<AuthState>((set, get) => ({
    accessToken: null,

    login: async(email, password) => {
        const data = await apiClient.post<AuthResponse>('/auth/login', { email, password});
        localStorage.setItem('refreshToken', data.refreshToken);
        set({ accessToken: data.accessToken });
    },

    register: async (payload) => {
        const data = await apiClient.post<AuthResponse>('/auth/register', payload);
        set ({ accessToken: data. accessToken });
    },

    logout: async () => {
        const refreshToken = localStorage.getItem('refreshToken');
        localStorage.removeItem('refreshToken');
        set({ accessToken: null });
        if (refreshToken) {
            fetch(`${API_BASE_URL}/auth/logout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
            }).catch(() => {});
        }
    },

    refreshAccessToken: async () => {
        const refreshToken = localStorage.getItem('refreshToken');
        if(!refreshToken) return false;

        try {
            const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken}),
            });
            if (!response.ok) return false;

            const data: AuthResponse = await response.json();
            localStorage.setItem('refreshToken', data.refreshToken);
            set({ accessToken: data.accessToken });
            return true;
        } catch {
            return false;
        }
    },
    hydrate: async () => {
        await get().refreshAccessToken();
    }
}))