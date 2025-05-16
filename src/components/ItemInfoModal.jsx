import React, { useState, useEffect } from "react";
import supabase from '../lib/supabaseClient';
import "../styles/ItemInfoModal.css";
import DummyImage from "../images/dummy-item.png";

const ItemInfoModal = ({ item, onClose, currentUserId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedItem, setEditedItem] = useState({ ...item });
  const [loading, setLoading] = useState(false);
  const [creatorInfo, setCreatorInfo] = useState(null);
  const isOwnedByUser = item.added_by === currentUserId;

  useEffect(() => {
    const fetchCreatorInfo = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('nickname, name')
          .eq('google_id', item.added_by)
          .single();

        if (error) throw error;
        setCreatorInfo(data);
      } catch (err) {
        console.error("Error fetching creator info:", err);
      }
    };

    if (item.added_by) {
      fetchCreatorInfo();
    }
  }, [item.added_by]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedItem((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("items")
      .update({
        name: editedItem.name,
        brand: editedItem.brand,
        description: editedItem.description,
        specification: editedItem.specification,
        srp: editedItem.srp,
        is_public: editedItem.is_public
      })
      .eq("id", item.id);
    setLoading(false);

    if (error) {
      console.error("Error updating item:", error);
      alert("Failed to update item.");
    } else {
      alert("Item updated successfully.");
      setIsEditing(false);
    }
  };

  const handleTogglePrivacy = async () => {
    if (!isOwnedByUser) return;

    if (isEditing) {
      setEditedItem(prev => ({ ...prev, is_public: !prev.is_public }));
    } else {
      try {
        const { error } = await supabase
          .from("items")
          .update({ is_public: !item.is_public })
          .eq("id", item.id);

        if (error) throw error;

        setEditedItem(prev => ({ ...prev, is_public: !item.is_public }));
      } catch (err) {
        console.error("Error updating item privacy:", err);
        alert("Failed to update item privacy. Please try again.");
      }
    }
  };

  const handleCopyShareLink = () => {
    const shareLink = `${window.location.origin}/item/${item.id}`;
    navigator.clipboard.writeText(shareLink)
      .then(() => {
        alert("Share link copied to clipboard!");
      })
      .catch(err => {
        console.error("Failed to copy link:", err);
        alert("Failed to copy link. Please try again.");
      });
  };

  const handleDelete = async () => {
    const confirm = window.confirm("Are you sure you want to delete this item?");
    if (!confirm) return;

    setLoading(true);
    const { error } = await supabase
      .from("items")
      .delete()
      .eq("id", item.id);
    setLoading(false);

    if (error) {
      console.error("Error deleting item:", error);
      alert("Failed to delete item.");
    } else {
      alert("Item deleted.");
      onClose();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <h2 className="modal-title">
          <strong>Item: </strong>
          {isEditing ? (
            <input
              name="name"
              value={editedItem.name}
              onChange={handleInputChange}
              className="modal-input"
            />
          ) : (
            item.name
          )}
        </h2>

        {creatorInfo && (
          <div className="creator-info">
            Created by: {creatorInfo.nickname || creatorInfo.name}
          </div>
        )}


        <div className="modal-body">
          <div className="modal-image-container">
            <img 
              src={item.image_url || DummyImage} 
              alt={item.name} 
              className="modal-item-image" 
            />
          </div>
  
          <p className="modal-text">
            <strong>Brand: </strong>
            {isEditing ? (
              <input
                type="text"
                name="brand"
                value={editedItem.brand}
                onChange={handleInputChange}
                className="modal-input"
              />
            ) : item.brand != null ? (
              item.brand
            ) : (
              "N/A"
            )}
          </p>

          <p className="modal-text">
            <strong>Description: </strong>
            {isEditing ? (
              <input
                type="text"
                name="description"
                value={editedItem.description}
                onChange={handleInputChange}
                className="modal-input"
              />
            ) : item.description != null ? (
              item.description.toLocaleString()
            ) : (
              "N/A"
            )}
          </p>

          <p className="modal-text">
            <strong>Specification: </strong>
            {isEditing ? (
              <input
                type="text"
                name="specification"
                value={editedItem.specification}
                onChange={handleInputChange}
                className="modal-input"
              />
            ) : item.specification != null ? (
              item.specification.toLocaleString()
            ) : (
              "N/A"
            )}
          </p>

          {!isEditing && (
            <p className="modal-text">
              <strong>Average Price: </strong>₱
              {item.average_price != null
                ? item.average_price.toLocaleString()
                : "N/A"}
            </p>
          )}

          <p className="modal-text">
            <strong>Amount or SRP: </strong>₱
            {isEditing ? (
              <input
                type="number"
                name="srp"
                value={editedItem.srp}
                onChange={handleInputChange}
                className="modal-input"
              />
            ) : item.srp != null ? (
              item.srp.toLocaleString()
            ) : (
              "N/A"
            )}
          </p>
        </div>

        <div className="modal-actions">
          <div className="ipc">
            {isOwnedByUser && (
            <div className="item-privacy-controls">
              <button
                className={`privacy-toggle ${isEditing ? editedItem.is_public : item.is_public ? 'public' : 'private'}`}
                onClick={handleTogglePrivacy}
              >
                {isEditing ? (editedItem.is_public ? 'Public' : 'Private') : (item.is_public ? 'Public' : 'Private')}
              </button>
              {(isEditing ? editedItem.is_public : item.is_public) && (
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

          {isOwnedByUser &&
            (isEditing ? (
              <>
                <button
                  className="modal-button save"
                  onClick={handleSave}
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save"}
                </button>
                <button
                  className="modal-button cancel"
                  onClick={() => setIsEditing(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button className="modal-button edit" onClick={() => setIsEditing(true)}>
                  Edit
                </button>
                <button className="modal-button delete" onClick={handleDelete} disabled={loading}>
                  Delete
                </button>
              </>
            ))}

          <button className="modal-button close" onClick={onClose} disabled={loading}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemInfoModal;
