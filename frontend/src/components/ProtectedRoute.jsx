import { Navigate, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ children, permission }) {
    const user = JSON.parse(localStorage.getItem("user"));
    const location = useLocation();

    // 1. Check Auth
    if (!user || !user.accessToken) {
        return <Navigate to="/login" replace />;
    }

    // 2. Check Permission (Skip for Admins)
    if (permission && user.role !== 'admin') {
        const userPerms = user.permissions || {};
        if (!userPerms[permission]) {
            // Prevent infinite loop if we are already at root
            if (location.pathname === '/' || location.pathname === '') {
                return (
                    <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400 space-y-4">
                        <h2 className="text-2xl font-bold text-white">Welcome, {user.name}</h2>
                        <p>You do not have access to the Dashboard Overview.</p>
                        <p className="text-sm">Please select an available module from the sidebar to continue.</p>
                    </div>
                );
            }
            // Otherwise, redirect to root which will now show the welcome message
            return <Navigate to="/" replace />;
        }
    }

    return children;
}
