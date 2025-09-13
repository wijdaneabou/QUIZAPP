import { useAuth } from './AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Vérifier si l'utilisateur a les permissions requises
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Rediriger vers la page d'accueil si l'utilisateur n'a pas les bonnes permissions
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;