/**
 * src/pages/admin/AdminGuard.jsx
 * Wraps protected admin routes — redirects to login if not authenticated.
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAdminLoggedIn } from './AdminLogin';

export default function AdminGuard({ children }) {
    const navigate = useNavigate();
    useEffect(() => {
        if (!isAdminLoggedIn()) navigate('/admin', { replace: true });
    }, []);
    if (!isAdminLoggedIn()) return null;
    return children;
}