import { useNavigate, useLocation } from "react-router-dom";
import { FaList, FaUser, FaSignOutAlt, FaListUl } from "react-icons/fa";
import "../styles/Navigation.css";

export default function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/signup");
  };

  const isListPage = location.pathname.startsWith('/list/');
  const isSearchListsPage = location.pathname === '/search-lists';

  return (
    <nav className="top-nav">
      <div className="nav-buttons">
        {isListPage || isSearchListsPage ? (
          <button onClick={() => navigate("/search-items")} className="nav-button">
            <FaListUl /> Items
          </button>
        ) : (
          <button onClick={() => navigate("/search-lists")} className="nav-button">
            <FaList /> Lists
          </button>
        )}
        <button onClick={() => navigate("/profile")} className="nav-button">
          <FaUser /> Profile
        </button>
        <button onClick={handleLogout} className="nav-button">
          <FaSignOutAlt /> Logout
        </button>
      </div>
    </nav>
  );
} 