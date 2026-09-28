import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";


export default function App() {
  const { token } = useAuth();

  return (
    <Routes>

      <Route
        path="/login"
        element={
          token
            ? <Navigate to="/chat" replace />
            : <Login />
        }
      />

      <Route
        path="/register"
        element={
          token
            ? <Navigate to="/chat" replace />
            : <Register />
        }
      />

      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        }
      />

      <Route
        path="*"
        element={
          <Navigate
            to={
              token
                ? "/chat"
                : "/login"
            }
            replace
          />
        }
      />

    </Routes>
  );
}