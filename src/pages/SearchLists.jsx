import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaTrash } from "react-icons/fa";
import CreateNewListImg from "../images/CreateNewList.png";
import "./SearchLists.css";
import supabase from '../lib/supabaseClient';

export default function SearchLists() {
  const [user, setUser] = useState(null);
  const [lists, setLists] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredLists, setFilteredLists] = useState([]);
  const [viewPublic, setViewPublic] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedListId, setSelectedListId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userInfo = JSON.parse(storedUser);
      setUser(userInfo);
      fetchShoppingLists(userInfo, viewPublic);
    } else {
      window.location.href = "/signup";
    }
  }, [viewPublic]);

  const fetchShoppingLists = async (userInfo, publicView) => {
    let query = supabase.from("shopping_lists").select("*");

    if (publicView) {
      query = query.eq("is_public", true);
    } else {
      query = query.eq("user_id", userInfo.google_id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching shopping lists:", error);
      return;
    }

    setLists(data);
    setFilteredLists(data);
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (!value.trim()) {
      setFilteredLists(lists);
      return;
    }

    const filtered = lists.filter((list) =>
      list.name?.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredLists(filtered);
  };

  const handleCreateNewList = () => {
    navigate("/create-list");
  };

  const openDeleteModal = (id) => {
    setSelectedListId(id);
    setShowModal(true);
  };

  const confirmDeleteList = async () => {
    const { error } = await supabase.from("shopping_lists").delete().eq("id", selectedListId);

    if (error) {
      console.error("Error deleting list:", error);
      alert("Failed to delete list.");
    } else {
      fetchShoppingLists(user, viewPublic);
      setShowModal(false);
      setSelectedListId(null);
    }
  };

  if (!user) return <div className="loading-screen">Loading...</div>;

  return (
    <div className="page-container">
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h2 className="modal-title">Confirm Deletion</h2>
            <p className="modal-text">
              Are you sure you want to delete this list? This action is irrevocable.
            </p>
            <div className="modal-buttons">
              <button className="modal-cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="modal-delete" onClick={confirmDeleteList}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className="card-container">
        <h1 className="page-title">Your Shopping Lists</h1>

        <div className="toggle-buttons">
          <button
            onClick={() => setViewPublic(false)}
            className={`toggle-button ${!viewPublic ? "active" : ""}`}
          >
            My Lists
          </button>
          <button
            onClick={() => setViewPublic(true)}
            className={`toggle-button ${viewPublic ? "active" : ""}`}
          >
            Public Lists
          </button>
        </div>

        <div className="search-bar">
          <input
            type="text"
            placeholder="Search shopping lists..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
        </div>

        {filteredLists.length === 0 ? (
          <div className="no-lists-container">
            <p className="no-lists-text">No shopping lists found.</p>
          </div>
        ) : (
          <ul className="list-grid">
            {filteredLists.map((list) => (
              <li
                key={list.id}
                className="list-item"
              >
                <div className="list-item-header">
                  <span>{list.name || "(Unnamed List)"}</span>
                  {!viewPublic && (
                    <div className="icon-buttons">
                      <FaEdit className="edit-icon" />
                      <FaTrash
                        className="delete-icon"
                        onClick={() => openDeleteModal(list.id)}
                      />
                    </div>
                  )}
                </div>
                {list.is_public && (
                  <span className="public-badge">Public</span>
                )}
              </li>
            ))}
          </ul>
        )}

        {!viewPublic && (
          <div className="create-new-container">
            <button
              onClick={handleCreateNewList}
              className="create-new-button enhanced-hover"
            >
              <img src={CreateNewListImg} alt="Create New List" className="create-new-image" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
