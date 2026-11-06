import { Navigate, Outlet } from 'react-router-dom';
import { useCurrentRole } from '../hooks/useCurrentRole';

export function RequireRole({ allowed }: { allowed: string[] }) {
    const role = useCurrentRole();
    if(!role || !allowed.includes(role)) {
        return <Navigate to="/deals" replace />;
    }
    return <Outlet />;
}

