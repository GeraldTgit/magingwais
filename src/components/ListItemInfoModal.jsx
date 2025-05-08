import React, { useState } from "react";
import supabase from '../lib/supabaseClient';
import "./ListItemInfoModal.css";

const ListItemInfoModal = ({ item, onClose, onItemUpdated, onItemDeleted, isOwner }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedItem, setEditedItem] = useState({ ...item });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedItem((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!isOwner) return;
    
    setLoading(true);
    const { error } = await supabase
      .from("list_items")
      .update({
        item_name: editedItem.item_name,
        description: editedItem.description,
        specification: editedItem.specification,
        srp: editedItem.srp,
        actual_price: editedItem.actual_price,
        quantity: editedItem.quantity
      })
      .eq("id", item.id);

    setLoading(false);

    if (error) {
      console.error("Error updating item:", error);
      alert("Failed to update item.");
    } else {
      alert("Item updated successfully.");
      setIsEditing(false);
      onItemUpdated(editedItem);
    }
  };

  const handleDelete = async () => {
    if (!isOwner) return;
    
    const confirm = window.confirm("Are you sure you want to delete this item from the list?");
    if (!confirm) return;

    setLoading(true);
    const { error } = await supabase
      .from("list_items")
      .delete()
      .eq("id", item.id);

    setLoading(false);

    if (error) {
      console.error("Error deleting item:", error);
      alert("Failed to delete item.");
    } else {
      alert("Item deleted from list.");
      onItemDeleted(item.id);
      onClose();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <h2 className="modal-title">
          <strong>Item Details</strong>
        </h2>

        <div className="modal-body">
          <p className="modal-text">
            <strong>Name: </strong>
            {isEditing && isOwner ? (
              <input
                name="item_name"
                value={editedItem.item_name}
                onChange={handleInputChange}
                className="modal-input"
              />
            ) : (
              item.item_name
            )}
          </p>

          <p className="modal-text">
            <strong>Description: </strong>
            {isEditing && isOwner ? (
              <input
                name="description"
                value={editedItem.description || ""}
                onChange={handleInputChange}
                className="modal-input"
              />
            ) : (
              item.description || "N/A"
            )}
          </p>

          <p className="modal-text">
            <strong>Specification: </strong>
            {isEditing && isOwner ? (
              <input
                name="specification"
                value={editedItem.specification || ""}
                onChange={handleInputChange}
                className="modal-input"
              />
            ) : (
              item.specification || "N/A"
            )}
          </p>

          <p className="modal-text">
            <strong>SRP: </strong>₱
            {isEditing && isOwner ? (
              <input
                type="number"
                name="srp"
                value={editedItem.srp || ""}
                onChange={handleInputChange}
                className="modal-input"
              />
            ) : (
              item.srp != null ? item.srp.toLocaleString() : "N/A"
            )}
          </p>

          <p className="modal-text">
            <strong>Actual Price: </strong>₱
            {isEditing && isOwner ? (
              <input
                type="number"
                name="actual_price"
                value={editedItem.actual_price || ""}
                onChange={handleInputChange}
                className="modal-input"
              />
            ) : (
              item.actual_price != null ? item.actual_price.toLocaleString() : "N/A"
            )}
          </p>

          <p className="modal-text">
            <strong>Quantity: </strong>
            {isEditing && isOwner ? (
              <input
                type="number"
                name="quantity"
                value={editedItem.quantity || 1}
                onChange={handleInputChange}
                className="modal-input"
                min="1"
              />
            ) : (
              item.quantity || 1
            )}
          </p>

          <p className="modal-text">
            <strong>Subtotal: </strong>₱
            {(item.actual_price != null ? item.actual_price : item.srp || 0) * (item.quantity || 1).toLocaleString()}
          </p>
        </div>

        <div className="modal-actions">
          {isEditing ? (
            <>
              <button
                className="modal-button save"
                onClick={handleSave}
                disabled={loading || !isOwner}
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
              {isOwner && (
                <>
                  <button
                    className="modal-button edit"
                    onClick={() => setIsEditing(true)}
                    disabled={loading}
                  >
                    Edit
                  </button>
                  <button
                    className="modal-button delete"
                    onClick={handleDelete}
                    disabled={loading}
                  >
                    Delete
                  </button>
                </>
              )}
            </>
          )}
          <button
            className="modal-button close"
            onClick={onClose}
            disabled={loading}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ListItemInfoModal; 