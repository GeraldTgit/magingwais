import React, { useState } from "react";
import supabase from '../lib/supabaseClient';
import "./ItemInfoModal.css";

const ItemInfoModal = ({ item, onClose, currentUserId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedItem, setEditedItem] = useState({ ...item });
  const [loading, setLoading] = useState(false);
  const isOwnedByUser = item.added_by === currentUserId;

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
        description: editedItem.description,
        specification: editedItem.specification,
        srp: editedItem.srp,
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
        <h2 className="modal-title" ><strong>Edit Item: </strong>
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

        <div className="modal-body">
  
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
