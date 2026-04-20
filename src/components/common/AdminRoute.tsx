import { Navigate, Outlet } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import LoadingScreen from './LoadingScreen';

export default function AdminRoute() {
    const { user, loading } = useAuth();
    
    const isAuthenticated = user && user.isLoggedIn;
    const isAdmin = user && user.role === 'ADMIN';

    useEffect(() => {
        if (!loading && isAuthenticated && !isAdmin) {
            toast.error('Bạn không có quyền truy cập vào khu vực này');
        }
    }, [loading, isAuthenticated, isAdmin]);

    if (loading) {
        return <LoadingScreen />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}
