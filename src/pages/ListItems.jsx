import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "../styles/ListItems.css";
import { FaHome, FaList, FaUser, FaSignOutAlt, FaEdit, FaTrash } from "react-icons/fa";
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
  const [showShareLink, setShowShareLink] = useState(false);
  const [creatorInfo, setCreatorInfo] = useState(null);

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
      setError(null);

      // First verify the list exists
      const { data: listData, error: listError } = await supabase
        .from("shopping_lists")
        .select("id")
        .eq("id", listId)
        .single();

      if (listError) {
        console.error("Error verifying list:", listError);
        throw new Error("List not found");
      }

      if (!listData) {
        throw new Error("List not found");
      }

      // Then fetch the items
      const { data, error } = await supabase
        .from("list_items")
        .select(`
          id,
          item_name,
          description,
          specification,
          quantity,
          srp,
          actual_price,
          isbought
        `)
        .eq("list_id", listId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error("Error fetching list items:", error);
        throw new Error(error.message || "Failed to load items");
      }

      setItems(data || []);
      setFilteredItems(data || []);
    } catch (err) {
      console.error("Error in fetchListItems:", err);
      setError(err.message || "Failed to load items. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity < 1 || userId !== listOwnerId) return;

    try {
      const { error } = await supabase
        .from("list_items")
        .update({ quantity: newQuantity })
        .eq("id", itemId);

      if (error) {
        console.error("Error updating quantity:", error);
        throw new Error(error.message);
      }

      setItems(prevItems =>
        prevItems.map(item =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
    } catch (err) {
      console.error("Error updating quantity:", err);
      alert(err.message || "Failed to update quantity. Please try again.");
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm("Are you sure you want to remove this item from the list?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("list_items")
        .delete()
        .eq("id", itemId);

      if (error) {
        console.error("Error deleting item:", error);
        throw new Error(error.message);
      }

      setItems(prevItems => prevItems.filter(item => item.id !== itemId));
    } catch (err) {
      console.error("Error deleting item:", err);
      alert(err.message || "Failed to delete item. Please try again.");
    }
  };

  const handleToggleBought = async (itemId, currentStatus) => {
    if (userId !== listOwnerId) return;

    try {
      const { error } = await supabase
        .from("list_items")
        .update({ isbought: !currentStatus })
        .eq("id", itemId);

      if (error) {
        console.error("Error updating item status:", error);
        throw new Error(error.message);
      }

      setItems(prevItems =>
        prevItems.map(item =>
          item.id === itemId ? { ...item, isbought: !currentStatus } : item
        )
      );
    } catch (err) {
      console.error("Error updating item status:", err);
      alert(err.message || "Failed to update item status. Please try again.");
    }
  };

  const handleUpdateActualPrice = async (itemId, newPrice) => {
    if (userId !== listOwnerId) return;

    try {
      const { error } = await supabase
        .from("list_items")
        .update({ actual_price: newPrice })
        .eq("id", itemId);

      if (error) {
        console.error("Error updating price:", error);
        throw new Error(error.message);
      }

      setItems(prevItems =>
        prevItems.map(item =>
          item.id === itemId ? { ...item, actual_price: newPrice } : item
        )
      );
    } catch (err) {
      console.error("Error updating price:", err);
      alert(err.message || "Failed to update price. Please try again.");
    }
  };

  const handleItemUpdated = (updatedItem) => {
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === updatedItem.id ? updatedItem : item
      )
    );
  };

  const handleItemDeleted = (deletedItemId) => {
    setItems(prevItems =>
      prevItems.filter(item => item.id !== deletedItemId)
    );
  };

  const totalPrice = items.reduce((sum, item) => {
    const unitPrice = item.actual_price != null ? item.actual_price : item.srp || 0;
    return sum + unitPrice * (item.quantity || 1);
  }, 0);

  const isOwner = userId === listOwnerId;

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/signup");
  };

  const handleNameEdit = async () => {
    if (!editedName.trim() || editedName === listName) {
      setIsEditingName(false);
      return;
    }

    try {
      const { error } = await supabase
        .from("shopping_lists")
        .update({ name: editedName.trim() })
        .eq("id", listId);

      if (error) throw error;

      setListName(editedName.trim());
      setIsEditingName(false);
    } catch (err) {
      console.error("Error updating list name:", err);
      alert("Failed to update list name. Please try again.");
    }
  };

  const handleTogglePrivacy = async () => {
    if (!isOwner) return;

    try {
      const { error } = await supabase
        .from("shopping_lists")
        .update({ is_public: !isPublic })
        .eq("id", listId);

      if (error) throw error;

      setIsPublic(!isPublic);
    } catch (err) {
      console.error("Error updating list privacy:", err);
      alert("Failed to update list privacy. Please try again.");
    }
  };

  const handleCopyShareLink = () => {
    const shareLink = `${window.location.origin}/list/${listId}`;
    navigator.clipboard.writeText(shareLink)
      .then(() => {
        alert("Share link copied to clipboard!");
      })
      .catch(err => {
        console.error("Failed to copy link:", err);
        alert("Failed to copy link. Please try again.");
      });
  };

  if (loading) {
    return (
      <div className="page-container">
        <Navigation />
        <div className="loading-state">Loading items...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <Navigation />
        <div className="error-state">{error}</div>
        <div className="page-actions">
          <button className="page-button retry" onClick={fetchListItems}>
            Retry
          </button>
          <button className="page-button back" onClick={() => navigate("/search-lists")}>
            Back to Lists
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="list-items-container">
        <div className="page-header-li">
          <div className="title-section">
            {isEditingName ? (
              <div className="title-edit-container">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onBlur={handleNameEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleNameEdit();
                    } else if (e.key === 'Escape') {
                      setIsEditingName(false);
                      setEditedName(listName);
                    }
                  }}
                  className="title-edit-input"
                  autoFocus
                />
              </div>
            ) : (
              <h1 
                className="page-title-li" 
                onClick={() => {
                  if (isOwner) {
                    setIsEditingName(true);
                    setEditedName(listName);
                  }
                }}
              >
                {listName}
                {isOwner && <span className="edit-icon">✎</span>}
              </h1>
            )}
            {creatorInfo && (
              <div className="creator-info">
                Created by: {creatorInfo.nickname || creatorInfo.name}
              </div>
            )}
            {isOwner && (
              <div className="list-privacy-controls">
                <button
                  className={`privacy-toggle ${isPublic ? 'public' : 'private'}`}
                  onClick={handleTogglePrivacy}
                >
                  {isPublic ? 'Public' : 'Private'}
                </button>
                {isPublic && (
                  <button
                    className="share-link-button"
                    onClick={handleCopyShareLink}
                  >
                    Share Link
                  </button>
                )}
              </div>
            )}
          </div>
          <button className="back-button" onClick={() => navigate("/search-lists")}>
            Back to Lists
          </button>
        </div>
        
        <div className="search-container">
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="items-list">
          {filteredItems.length === 0 ? (
            <div className="empty-state">
              <h1>No items found</h1>
              <button className="goto-items-button" onClick={() => navigate(`/search-items?listName=${encodeURIComponent(listName)}`)}>
                Go to Items
              </button>
            </div>
          ) : (
            filteredItems.map((item) => {
              const unitPrice = item.actual_price != null ? item.actual_price : item.srp || 0;
              const subtotal = unitPrice * (item.quantity || 1);
              return (
                <div key={item.id} className="list-item-card">
                  <div className="item-content">
                    <div className="item-checkbox">
                      <input
                        type="checkbox"
                        checked={item.isbought || false}
                        onChange={(e) => {
                          e.stopPropagation();
                          if (!isOwner) return;
                          handleToggleBought(item.id, item.isbought);
                        }}
                        disabled={!isOwner}
                      />
                    </div>
                    <h3 className="item-name" onClick={() => setSelectedItem(item)}>
                      {item.item_name}
                    </h3>
                    <div className="quantity-control">
                      <button
                        className="quantity-btn minus"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuantityChange(item.id, item.quantity - 1);
                        }}
                        disabled={!isOwner}
                      >
                        −
                      </button>
                      <span className="quantity-value">x{item.quantity}</span>
                      <button
                        className="quantity-btn plus"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuantityChange(item.id, item.quantity + 1);
                        }}
                        disabled={!isOwner}
                      >
                        +
                      </button>
                    </div>
                    <div className="price-input">
                      <div className={`price-label ${item.actual_price === null ? 'active' : ''}`}>
                        SRP: ₱{item.srp?.toLocaleString() || "0"}
                      </div>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="Enter actual price"
                        value={item.actual_price ?? ""}
                        onChange={(e) => {
                          e.stopPropagation();
                          if (!isOwner) return;
                          const raw = e.target.value.replace(/[^\d.]/g, "");
                          const value = raw === "" ? null : parseFloat(raw);
                          handleUpdateActualPrice(item.id, value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        disabled={!isOwner}
                      />
                    </div>
                    <div className="subtotal">
                      <span className="amount">₱{subtotal.toLocaleString()}</span>
                      {isOwner && (
                        <div className="item-actions">
                          <button
                            className="edit-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItem(item);
                            }}
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="delete-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteItem(item.id);
                            }}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="list-footer">
          <div className="total-section">
            <span className="total-label">Total:</span>
            <span className="total-amount">₱{totalPrice.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {selectedItem && (
        <ListItemInfoModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onItemUpdated={handleItemUpdated}
          onItemDeleted={handleItemDeleted}
          isOwner={isOwner}
        />
      )}
    </div>
  );
};

export default ListItems; 