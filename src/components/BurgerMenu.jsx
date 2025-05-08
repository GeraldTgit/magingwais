import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./BurgerMenu.css";

export default function BurgerMenu({ currentPage }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleNavigate = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  const menuItems = [
    { label: "Dashboard", path: "/dashboard", key: "dashboard" },
    { label: "Search Lists", path: "/search-lists", key: "search-lists" },
    { label: "Search Items", path: "/search-items", key: "search-items" },
  ];

  const filteredItems = menuItems.filter(item => item.key !== currentPage);

  return (
    <div className="burger-wrapper">
      <button
        className="burger-button"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        ☰
      </button>
      {menuOpen && (
        <div className={`burger-dropdown ${window.innerWidth < 768 ? "mobile" : ""}`}>
          {filteredItems.map((item) => (
            <button key={item.key} onClick={() => handleNavigate(item.path)}>
              {item.label}
            </button>
          ))}
          <button onClick={() => {
            localStorage.clear();
            navigate("/signup");
          }}>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
