import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaTrash, FaListUl, FaHome, FaList, FaUser, FaSignOutAlt } from "react-icons/fa";
import CreateNewListImg from "../images/CreateNewList.png";
import "../styles/SearchLists.css";
import supabase from '../lib/supabaseClient';
import Navigation from '../components/Navigation';

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
    let query = supabase
      .from("shopping_lists")
      .select(`
        *,
        creator:users!shopping_lists_user_id_fkey (
          nickname,
          name
        )
      `);

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

  const handleViewItems = (listId) => {
    navigate(`/list/${listId}`);
  };

  const handleItemsUpdated = () => {
    fetchShoppingLists(user, viewPublic);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/signup");
  };

  if (!user) return <div className="loading-screen">Loading...</div>;

  return (
    <div className="page-container-sl">
      {/**Confirm delete a List Modal */}
      {showModal && (
        <div className="modal-overlay-sl">
          <div className="modal-container-sl">
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

      <div className="card-container-sl">
        <h1 className="page-title-sl">Shopping Lists 🧾</h1>

        <div className="search-container">
          <input
            type="text"
            placeholder="Search lists..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
        </div>

        <div className="view-toggle">
          <button
            className={`toggle-btn ${!viewPublic ? 'active' : ''}`}
            onClick={() => setViewPublic(false)}
          >
            My Lists
          </button>
          <button
            className={`toggle-btn ${viewPublic ? 'active' : ''}`}
            onClick={() => setViewPublic(true)}
          >
            Public Lists
          </button>
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
                      <FaEdit 
                        className="edit-icon"
                        onClick={() => navigate(`/list/${list.id}`)}
                      />
                      <FaTrash
                        className="delete-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteModal(list.id);
                        }}
                      />
                    </div>
                  )}
                </div>
                <div className="list-item-info">
                  {list.is_public && (
                    <span className="public-badge">Public</span>
                  )}
                  {viewPublic && list.creator && (
                    <span className="creator-badge">
                      By: {list.creator.nickname || "no nickname yet"}
                    </span>
                  )}
                </div>
                <div className="list-item-actions">
                  <button
                    className="view-items-btn"
                    onClick={() => handleViewItems(list.id)}
                  >
                    <FaListUl className="view-items-icon" />
                    View Items
                  </button>
                </div>
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
