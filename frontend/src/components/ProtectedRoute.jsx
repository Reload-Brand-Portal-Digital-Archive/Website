import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute({ requireAdmin }) {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (requireAdmin && user.role !== 'admin') {
        alert('Akses Ditolak! Anda bukan Admin.');
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}