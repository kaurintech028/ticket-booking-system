import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <nav className={styles.nav}>
      <Link to="/" className={styles.logo}>🎟 TicketApp</Link>
      <div className={styles.links}>
        <Link to="/events">Events</Link>
        {user && <Link to="/my-bookings">My Bookings</Link>}
        {user && <Link to="/my-waitlist">Waitlist</Link>}
        {user?.role === "organiser" && <Link to="/organiser">Dashboard</Link>}
        {user?.role === "admin" && <Link to="/admin">Admin</Link>}
        {user ? (
          <button onClick={handleLogout} className="btn-outline" style={{ padding: "6px 14px" }}>
            Logout ({user.name})
          </button>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
