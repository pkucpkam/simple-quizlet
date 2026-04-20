import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingScreen from './LoadingScreen';

export default function PrivateRoute() {
    const { user, loading } = useAuth();

    if (loading) {
        return <LoadingScreen />;
    }

    return user?.isLoggedIn ? <Outlet /> : <Navigate to="/login" replace />;
}
