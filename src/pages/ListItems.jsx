import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "../styles/ListItems.css";
import { FaHome, FaList, FaUser, FaSignOutAlt, FaEdit, FaTrash, FaCopy, FaShareAlt } from "react-icons/fa";
import ListItemInfoModal from '../components/ListItemInfoModal';
import Navigation from '../components/Navigation';

const ListItems = () => {
  const { listId } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredItems, setFilteredItems] = useState([]);
  const [listName, setListName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [userId, setUserId] = useState(null);
  const [listOwnerId, setListOwnerId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isPublic, setIsPublic] = useState(false);
  const [creatorInfo, setCreatorInfo] = useState(null);
  const [budget, setBudget] = useState(0);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userInfo = JSON.parse(storedUser);
      setUserId(userInfo.google_id);
    } else {
      navigate("/signup");
    }
  }, [navigate]);

  useEffect(() => {
    if (!listId) {
      setError("Invalid list ID");
      setLoading(false);
      return;
    }
    fetchListDetails();
    fetchListItems();
  }, [listId]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredItems(items);
    } else {
      const filtered = items.filter(item =>
        item.item_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredItems(filtered);
    }
  }, [searchTerm, items]);

  const fetchListDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("shopping_lists")
        .select(`
          name,
          is_public,
          user_id,
          creator:users!shopping_lists_user_id_fkey (
            nickname,
            name
          )
        `)
        .eq("id", listId)
        .single();

      if (error) throw error;
      setListName(data.name);
      setIsPublic(data.is_public);
      setListOwnerId(data.user_id);
      setCreatorInfo(data.creator);
    } catch (err) {
      console.error("Error fetching list details:", err);
    }
  };

  const fetchListItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("list_items")
        .select("*")
        .eq("list_id", listId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      setItems(data || []);
      setFilteredItems(data || []);
    } catch (err) {
      setError("Failed to load items.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBought = async (itemId, currentStatus) => {
    if (userId !== listOwnerId) return;
    try {
      await supabase
        .from("list_items")
        .update({ isbought: !currentStatus })
        .eq("id", itemId);

      setItems(items => items.map(i => i.id === itemId ? { ...i, isbought: !currentStatus } : i));
    } catch (err) {
      alert("Error toggling bought status");
    }
  };

  const handleUpdateActualPrice = async (itemId, newPrice) => {
    if (userId !== listOwnerId) return;
    try {
      await supabase
        .from("list_items")
        .update({ actual_price: newPrice })
        .eq("id", itemId);
      setItems(items => items.map(i => i.id === itemId ? { ...i, actual_price: newPrice } : i));
    } catch (err) {
      alert("Failed to update price");
    }
  };

  const handleQuantityChange = async (itemId, quantity) => {
    if (userId !== listOwnerId || quantity < 1) return;
    try {
      await supabase
        .from("list_items")
        .update({ quantity })
        .eq("id", itemId);
      setItems(items => items.map(i => i.id === itemId ? { ...i, quantity } : i));
    } catch {
      alert("Failed to update quantity");
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm("Delete item?")) return;
    try {
      await supabase.from("list_items").delete().eq("id", itemId);
      setItems(items => items.filter(i => i.id !== itemId));
    } catch {
      alert("Error deleting item");
    }
  };

  const handleTogglePrivacy = async () => {
    if (userId !== listOwnerId) return;
    try {
      await supabase.from("shopping_lists").update({ is_public: !isPublic }).eq("id", listId);
      setIsPublic(!isPublic);
    } catch {
      alert("Failed to toggle privacy");
    }
  };

  const handleDuplicateList = async () => {
    try {
      const { data: originalList } = await supabase
        .from("shopping_lists")
        .select("*")
        .eq("id", listId)
        .single();

      const { data: newList } = await supabase
        .from("shopping_lists")
        .insert([{ name: `${originalList.name} (Copy)`, user_id: userId, is_public: false }])
        .select()
        .single();

      const copiedItems = items.map(({ item_name, description, specification, quantity, srp, actual_price, isbought }) => ({
        item_name,
        description,
        specification,
        quantity,
        srp,
        actual_price,
        isbought,
        list_id: newList.id,
      }));

      await supabase.from("list_items").insert(copiedItems);
      navigate(`/list/${newList.id}`);
    } catch {
      alert("Failed to duplicate list");
    }
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/list/${listId}`)
      .then(() => alert("Share link copied!"))
      .catch(() => alert("Failed to copy link"));
  };

  const total = items.reduce((sum, i) => sum + ((i.actual_price || i.srp || 0) * (i.quantity || 1)), 0);
  const change = budget ? budget - total : 0;
  const isOwner = userId === listOwnerId;

  if (loading) return <div className="loading-state">Loading...</div>;
  if (error) return <div className="error-state">{error}</div>;

  return (
    <div className="list-items-container">
      <div className="list-header">
        {isEditingName ? (
          <input value={editedName} onChange={e => setEditedName(e.target.value)}
                 onBlur={() => setIsEditingName(false)} autoFocus className="title-edit-input" />
        ) : (
          <h1 className="page-title-li" onClick={() => isOwner && (setIsEditingName(true), setEditedName(listName))}>
            {listName} {isOwner && <FaEdit className="edit-icon" />}
            <button className="page-button back" onClick={() => navigate("/search-lists")}>
            Back to Lists
            </button> 
          </h1>
        )}
        {creatorInfo && <div className="creator-info-li">By: {creatorInfo.nickname || creatorInfo.name}</div>}
        {isOwner && (
          <div className="list-privacy-controls">
            <button className={`privacy-toggle ${isPublic ? 'public' : 'private'}`} onClick={handleTogglePrivacy}>
              {isPublic ? "Public" : "Private"}
            </button>
            {isPublic && <button className="share-link-button" onClick={handleCopyShareLink}><FaShareAlt /> Share</button>}
          </div>
        )}
      </div>

      <input className="search-input" placeholder="Search items..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />

      <div className="items-list">
        {filteredItems.map(item => {
          const unitPrice = item.actual_price || item.srp || 0;
          return (
            <div className={`list-item-card${item.isbought ? " bought" : ""}`} key={item.id}>
              <div className="item-content">
                <div className="item-checkbox">
                  <input
                    type="checkbox"
                    checked={item.isbought || false}
                    onChange={() => handleToggleBought(item.id, item.isbought)}
                  />
                </div>
                <div className="item-name" onClick={() => !item.isbought && setSelectedItem(item)}>{item.item_name}</div>
                <div className="quantity-control">
                  <button onClick={() => handleQuantityChange(item.id, item.quantity - 1)} disabled={!isOwner || item.isbought}>−</button>
                  <span>x{item.quantity}</span>
                  <button onClick={() => handleQuantityChange(item.id, item.quantity + 1)} disabled={!isOwner || item.isbought}>+</button>
                </div>
              </div>
              <div className="second-part">
                <span className="price-label">SRP: ₱{item.srp?.toLocaleString() || 0}</span>
                <div className="price-input">
                  <input style={{ maxWidth: 'fit-content' }} type="text" value={item.actual_price ?? ""} onChange={e => {
                    const val = e.target.value.replace(/[^\d.]/g, "");
                    handleUpdateActualPrice(item.id, val === "" ? null : parseFloat(val));
                  }} disabled={!isOwner || item.isbought} />
                  <span className="amount">= ₱{(unitPrice * (item.quantity || 1)).toLocaleString()}
                  {isOwner && !item.isbought && (
                    <span className="item-actions-li">
                      <button className="edit-button" onClick={() => setSelectedItem(item)}><FaEdit /></button>
                      <button className="delete-button" onClick={() => handleDeleteItem(item.id)}><FaTrash /></button>
                    </span>
                  )}
                  </span>
                </div>
                      
              </div>
            </div>
          );
        })}
      </div>

      <div className="list-footer">
        <div className="total-section">
          {isOwner && <button className="duplicate-list-button" onClick={handleDuplicateList}><FaCopy /> Duplicate List</button>}
          <div>
            <div className="total-label">Total: ₱{total.toLocaleString()}</div>
          </div>
        </div>
        <div className="budget-section" style={{ marginTop: '1rem' }}>
          <label htmlFor="budget">Budget: <input id="budget" type="number" value={budget} onChange={e => setBudget(Number(e.target.value))}/></label>
          <div className="change-display" style={{ marginTop: '0.5rem' }}>
            Change: ₱{change.toLocaleString()}
          </div>
        </div>
      </div>

      {selectedItem && <ListItemInfoModal item={selectedItem} onClose={() => setSelectedItem(null)} isOwner={isOwner} />}
    </div>
  );
};

export default ListItems;