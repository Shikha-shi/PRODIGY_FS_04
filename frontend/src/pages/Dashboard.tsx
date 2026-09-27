import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";


/* Dashboard */

function Dashboard() {
  const navigate = useNavigate();

  const { user, logout } = useAuth();


  /* Logout Handler */

  const handleLogout = () => {
    logout();
    navigate("/login");
  };


  return (
    <main className="dashboard">
      <h1>
        Welcome, {user?.username}
      </h1>

      <p>
        You're logged into Chirp.
      </p>

      <button onClick={handleLogout}>
        Logout
      </button>
    </main>
  );
}

export default Dashboard;