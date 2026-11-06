import type { ReactNode } from 'react';
import { useCurrentRole } from '../hooks/useCurrentRole';

interface RoleGateProps {
    roles: string[];
    children: ReactNode;
}

export function RoleGate({ roles, children }: RoleGateProps) {
    const role = useCurrentRole();
    if (!role || !roles.includes(role)) return null;
    return <>{children}</>;
}