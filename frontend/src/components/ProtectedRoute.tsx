import { Navigate } from "react-router-dom";

import type { ReactNode } from "react";

import { useAuth } from "../context/AuthContext";


/* Protected Route */

interface ProtectedRouteProps {
  children: ReactNode;
}


function ProtectedRoute({
  children,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;