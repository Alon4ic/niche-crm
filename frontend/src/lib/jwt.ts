export interface DecodedToken {
    sub: string;
    tenantId: string;
    role: string;
    iat: number;
    exp: number;
}

export function decodeJwtPayload(token: string): DecodedToken | null {
    try {
        const payload = token.split('.')[1];
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(atob(base64));
    } catch {
        return null;
    }
}

export function userIdFromToken(token: string | null): string {
    if (!token) return '';
    return decodeJwtPayload(token)?.sub ?? '';
}