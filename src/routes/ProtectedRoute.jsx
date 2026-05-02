import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function ProtectedRoute({ children, role }) {
  const { user, token } = useAuthStore();

  if (!token || !user) return <Navigate to="/login" replace />;

  if (role && user.role !== role) {
    const roleRoutes = {
      student: '/student/board',
      expert:  '/expert/dashboard',
      client:  '/client/overview',
      admin:   '/admin/dashboard',
    };
    return <Navigate to={roleRoutes[user.role] || '/login'} replace />;
  }

  return children;
}
