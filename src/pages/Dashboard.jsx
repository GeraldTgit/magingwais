import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaListUl, FaSearch, FaPlus, FaEdit } from "react-icons/fa";
import supabase from '../lib/supabaseClient';
import BurgerMenu from '../components/BurgerMenu';
import "./Dashboard.css";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalLists: 0,
    totalItems: 0,
    publicLists: 0
  });
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [newNickname, setNewNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userInfo = JSON.parse(storedUser);
      setUser(userInfo);
      setNewNickname(userInfo.nickname || "");
      fetchUserStats(userInfo.google_id);
    } else {
      navigate("/signup");
    }
  }, [navigate]);

  const fetchUserStats = async (userId) => {
    try {
      // Fetch total lists
      const { count: totalLists } = await supabase
        .from("shopping_lists")
        .select("*", { count: "exact" })
        .eq("user_id", userId);

      // Fetch public lists
      const { count: publicLists } = await supabase
        .from("shopping_lists")
        .select("*", { count: "exact" })
        .eq("user_id", userId)
        .eq("is_public", true);

      // Fetch total items
      const { count: totalItems } = await supabase
        .from("list_items")
        .select("*", { count: "exact" })
        .eq("user_id", userId);

      setStats({
        totalLists: totalLists || 0,
        totalItems: totalItems || 0,
        publicLists: publicLists || 0
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
    }
  };

  const handleUpdateNickname = async () => {
    if (!newNickname.trim()) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ nickname: newNickname.trim() })
        .eq('google_id', user.google_id);

      if (error) throw error;

      // Update local storage and state
      const updatedUser = { ...user, nickname: newNickname.trim() };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setIsEditingNickname(false);
    } catch (error) {
      console.error("Error updating nickname:", error);
      alert("Failed to update nickname. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="loading-screen">Loading...</div>;

  return (
    <div className="dashboard-page" style={{ position: "relative" }}>
      <div className="dashboard-container">
        {/* Burger Menu */}
        <BurgerMenu currentPage="dashboard" />

        <div className="profile-section">
          <img
            src={user.picture_url}
            alt="Profile"
            className="profile-image"
          />
          <div className="profile-info">
            <h2 className="profile-name">{user.name}</h2>
            {isEditingNickname ? (
              <div className="nickname-edit">
                <input
                  type="text"
                  value={newNickname}
                  onChange={(e) => setNewNickname(e.target.value)}
                  placeholder="Enter nickname"
                  className="nickname-input"
                  maxLength={30}
                />
                <div className="nickname-actions">
                  <button 
                    className="action-button save"
                    onClick={handleUpdateNickname}
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save"}
                  </button>
                  <button 
                    className="action-button cancel"
                    onClick={() => {
                      setIsEditingNickname(false);
                      setNewNickname(user.nickname || "");
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="nickname-display">
                <p className="profile-nickname">
                  {user.nickname || "No nickname set"}
                </p>
                <button 
                  className="edit-nickname-button"
                  onClick={() => setIsEditingNickname(true)}
                >
                  <FaEdit />
                </button>
              </div>
            )}
            <p className="profile-email">{user.email}</p>
            <div className={`verification-badge ${user.email_verified ? "verified" : "unverified"}`}>
              {user.email_verified ? "✓ Email Verified" : "✗ Email Not Verified"}
            </div>
          </div>
        </div>

        <div className="stats-section">
          <div className="stat-card">
            <div className="stat-value">{stats.totalLists}</div>
            <div className="stat-label">Total Lists</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.totalItems}</div>
            <div className="stat-label">Total Items</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.publicLists}</div>
            <div className="stat-label">Public Lists</div>
          </div>
        </div>

        <div className="quick-actions">
          <button 
            className="action-button primary"
            onClick={() => navigate("/search-lists")}
          >
            <FaListUl />
            My Lists
          </button>
          <button 
            className="action-button"
            onClick={() => navigate("/search-items")}
          >
            <FaSearch />
            Search Items
          </button>
          <button 
            className="action-button"
            onClick={() => navigate("/create-list")}
          >
            <FaPlus />
            Create List
          </button>
        </div>
      </div>
    </div>
  );
}
