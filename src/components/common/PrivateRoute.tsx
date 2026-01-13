import { Navigate, Outlet } from 'react-router-dom';

export default function PrivateRoute() {
    const storedUser = sessionStorage.getItem('user');

    // Kiểm tra xem user có tồn tại và đã login không
    const isAuthenticated = storedUser && JSON.parse(storedUser).isLoggedIn;

    // Nếu chưa đăng nhập, chuyển hướng về trang Login
    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
