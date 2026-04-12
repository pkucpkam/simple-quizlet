import { Navigate, Outlet } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useEffect } from 'react';

export default function AdminRoute() {
    const storedUser = sessionStorage.getItem('user');
    const userData = storedUser ? JSON.parse(storedUser) : null;
    
    const isAuthenticated = userData && userData.isLoggedIn;
    const isAdmin = userData && userData.role === 'ADMIN';

    useEffect(() => {
        if (isAuthenticated && !isAdmin) {
            toast.error('Bạn không có quyền truy cập vào khu vực này');
        }
    }, [isAuthenticated, isAdmin]);

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}
