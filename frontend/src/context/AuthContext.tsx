import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import type { ReactNode } from "react";


//  Authentication Context

interface User {
  id: number;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}


// #Authentication Provider

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);


export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("chirp_token")
  );

  const [user, setUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);


//    Fetch Current User

  const fetchUser = async (accessToken: string) => {
    const response = await fetch(
      "http://localhost:8000/auth/me",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Invalid authentication token");
    }

    const userData = await response.json();

    setUser(userData);
  };


//    Login

  const login = async (accessToken: string) => {
    localStorage.setItem(
      "chirp_token",
      accessToken
    );

    setToken(accessToken);

    await fetchUser(accessToken);
  };


//    Logout

  const logout = () => {
    localStorage.removeItem("chirp_token");

    setToken(null);
    setUser(null);
  };


//    Restore Authentication

  useEffect(() => {
    const restoreAuthentication = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        await fetchUser(token);
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };

    restoreAuthentication();
  }, []);


  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


//  Authentication Hook

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}