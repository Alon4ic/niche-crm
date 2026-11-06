import {create } from 'zustand';
import { apiClient } from '../lib/apiClient';
import { queryClient } from '../lib/queryClient';

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
const REFRESH_KEY = "refreshToken";
const SESSION_USER_KEY = "sessionUserId";

function userIdFromToken(token: string): string {
    try {
        return JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).sub;
    } catch {
        return "";
    }
}

function saveSession(data: AuthResponse) {
    localStorage.setItem(REFRESH_KEY, data.refreshToken);
    localStorage.setItem(SESSION_USER_KEY, userIdFromToken(data.accessToken));
}

let refreshPromise: Promise<boolean> | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
    accessToken: null,

    login: async(email, password) => {
        const data = await apiClient.post<AuthResponse>('/auth/login', { email, password});
        queryClient.clear();
        saveSession(data);
        set({ accessToken: data.accessToken });
    },

    register: async (payload) => {
        const data = await apiClient.post<AuthResponse>('/auth/register', payload);
        queryClient.clear();
        saveSession(data);
        set ({ accessToken: data. accessToken });
    },

    logout: async () => {
        const refreshToken = localStorage.getItem(REFRESH_KEY);
        localStorage.removeItem(REFRESH_KEY);
        localStorage.removeItem(SESSION_USER_KEY);
        set({ accessToken: null });
        if (refreshToken) {
            fetch(`${API_BASE_URL}/auth/logout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
            }).catch(() => {});
        }
    },

    refreshAccessToken: () => {
        if(!refreshPromise) {
            refreshPromise = (async () => {
                const refreshToken = localStorage.getItem(REFRESH_KEY);
                if (!refreshToken) return false;
                try {
                    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json"},
                        body: JSON.stringify({ refreshToken }),
                    });
                    if (!response.ok) return false;
                    const data: AuthResponse = await response.json();
                    saveSession(data);
                    set({ accessToken: data.accessToken });
                    return true;
                } catch {
                    return false;
                }
            })().finally(() => {
                refreshPromise = null;
            });
        }
        return refreshPromise;
    },

    hydrate: async () => {
        await get().refreshAccessToken();
    }
}));

window.addEventListener("storage", (e) => {
    if (e.key === SESSION_USER_KEY) {
        queryClient.clear();
        window.location.reload();
    }
});