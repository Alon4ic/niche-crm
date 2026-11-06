import { useAuthStore } from '../stores/authStore';
import { decodeJwtPayload } from '../lib/jwt';

export function useCurrentRole(): string | null {
    const accessToken = useAuthStore((state) => state.accessToken);
    if (!accessToken) return null;
    return decodeJwtPayload(accessToken)?.role ?? null;
}