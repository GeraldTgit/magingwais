import React, { useState, useEffect } from "react";
import supabase from "../lib/supabaseClient";
import "./AddItemModal.css";

export default function AddItemModal({
  newItem,
  setNewItem,
  showAddModal,
  setShowAddModal,
  onItemAdded // optional callback
}) {
  const [googleId, setGoogleId] = useState(null);

  useEffect(() => {
    // Get user data from localStorage when component mounts
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setGoogleId(user.google_id || user.id); // Try both common ID fields
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewItem((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!googleId) {
      alert("User not authenticated. Please log in again.");
      return;
    }

    try {
      const { error } = await supabase.from("items").insert([
        {
          brand: newItem.brand || "N/A",
          name: newItem.item_name || newItem.name,
          description: newItem.description,
          specification: newItem.specification,
          srp: parseFloat(newItem.srp),
          is_public: newItem.is_public,
          added_by: googleId,
        },
      ]);

      if (error) {
        console.error("Insert error:", error);
        alert("Failed to add item.");
      } else {
        alert("Item added successfully!");
        setShowAddModal(false);
        setNewItem({
          item_name: "",
          brand: "",
          description: "",
          specification: "",
          srp: "",
          is_public: false,
          added_by: googleId
        });
        if (onItemAdded) onItemAdded(); // optional: trigger refresh
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("An error occurred while adding the item.");
    }
  };

  if (!showAddModal) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-fade-in">
        <h1 className="page-title">Add New Item</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="brand"
            placeholder="Brand (optional)"
            value={newItem.brand}
            onChange={handleChange}
            className="input-field"
          />
          <input
            type="text"
            name="item_name"
            placeholder="Item Name"
            value={newItem.item_name}
            onChange={handleChange}
            required
            className="input-field"
          />
          <input
            type="text"
            name="description"
            placeholder="Description"
            value={newItem.description}
            onChange={handleChange}
            className="input-field"
          />
          <input
            type="text"
            name="specification"
            placeholder="Weight / Volume / Size"
            value={newItem.specification}
            onChange={handleChange}
            className="input-field"
          />
          <input
            type="number"
            name="srp"
            placeholder="SRP (₱)"
            value={newItem.srp}
            onChange={handleChange}
            step="0.01"
            required
            className="input-field"
          />
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="is_public"
              checked={newItem.is_public}
              onChange={handleChange}
              className="checkbox-custom"
            />
            <span className="ml-2 text-sm">Make it public</span>
            <span className="tooltip ml-2" title="If checked, anyone can see this item.">🛈</span>
          </label>
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="btn-cancel"
            >
              Cancel
            </button>
            <button type="submit" className="btn-submit">
              Add Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}