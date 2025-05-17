import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import supabase from "../lib/supabaseClient";
import DummyImage from "../images/dummy-item.png";
import "../styles/ItemInfoPage.css";

const ItemInfoPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [currentUserId, setUserID] = useState(null);
  const [item, setItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedItem, setEditedItem] = useState({});
  const [loading, setLoading] = useState(false);
  const [creatorInfo, setCreatorInfo] = useState(null);
  const [isPublic, setIsPublic] = useState(false);

  // ✅ Fetch current user ID from localStorage once
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user?.google_id) {
      setUserID(user.google_id);
    }
  }, []);

  // ✅ Fetch the item by ID
  useEffect(() => {
    const fetchItem = async () => {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("id", id)
        .single();

      if (!error) {
        setItem(data);
        setEditedItem(data);
      } else {
        console.error("Error fetching item:", error.message);
      }
    };

    fetchItem();
  }, [id]);

  // ✅ Fetch creator info when item is loaded
  useEffect(() => {
    const fetchCreatorInfo = async () => {
      if (!item?.added_by) return;

      const { data, error } = await supabase
        .from("users")
        .select("nickname, name")
        .eq("google_id", item.added_by)
        .single();

      if (!error) setCreatorInfo(data);
    };

    fetchCreatorInfo();
  }, [item?.added_by]);

  const isOwnedByUser = item?.added_by === currentUserId;

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
        is_public: editedItem.is_public,
      })
      .eq("id", item.id);

    setLoading(false);

    if (error) {
      alert("Update failed.");
    } else {
      setItem(editedItem);
      setIsEditing(false);
      alert("Item updated.");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this item?")) return;

    setLoading(true);
    const { error } = await supabase.from("items").delete().eq("id", item.id);
    setLoading(false);

    if (!error) {
      alert("Item deleted.");
      navigate("/items");
    }
  };

  const handleTogglePrivacy = async () => {
    const newPrivacy = isEditing ? !editedItem.is_public : !item.is_public;

    if (isEditing) {
      setEditedItem((prev) => ({ ...prev, is_public: newPrivacy }));
    } else {
      const { error } = await supabase
        .from("items")
        .update({ is_public: newPrivacy })
        .eq("id", item.id);

      if (!error) {
        setItem((prev) => ({ ...prev, is_public: newPrivacy }));
      }
    }
    setIsPublic(!isPublic);
  };

  const handleCopyShareLink = () => {
    navigator.clipboard
      .writeText(`${window.location.origin}/item/${item.id}`)
      .then(() => alert("Share link copied!"))
      .catch((err) => alert("Failed to copy link."));
  };

  if (!item) return <p>Loading item...</p>;

  return (
    <div className="item-page">
      <h2 className="item-title">
        {isEditing ? (
          <input
            name="name"
            value={editedItem.name}
            onChange={handleInputChange}
            className="input"
          />
        ) : (
          item.name
        )}
      </h2>

      {creatorInfo && (
        <p className="creator-info">
          Created by: {creatorInfo.nickname || creatorInfo.name}
        </p>
      )}

      <div className="item-controls-ii">
        {isOwnedByUser && (
          <>
            <button className={`privacy-toggle-ii ${isPublic ? 'public' : 'private'}`} onClick={handleTogglePrivacy}>
              {isEditing
                ? editedItem.is_public
                  ? "Public"
                  : "Private"
                : item.is_public
                ? "Public"
                : "Private"}
            </button>
            {(isEditing ? editedItem.is_public : item.is_public) && (
              <button className="share-link-button" onClick={handleCopyShareLink}>Share Link</button>
            )}
          </>
        )}
        <button className="page-button back" onClick={() => navigate("/search-items")}>
            Back to Items
          </button> 
      </div>

      <img
        src={item.image_url || DummyImage}
        alt={item.name}
        className="item-image"
      />

      <div className="item-details">
        <p>
          <strong>Brand:</strong>{" "}
          {isEditing ? (
            <input
              name="brand"
              value={editedItem.brand}
              onChange={handleInputChange}
            />
          ) : (
            item.brand || "N/A"
          )}
        </p>

        <p>
          <strong>Description:</strong>{" "}
          {isEditing ? (
            <input
              name="description"
              value={editedItem.description}
              onChange={handleInputChange}
            />
          ) : (
            item.description || "N/A"
          )}
        </p>

        <p>
          <strong>Specification:</strong>{" "}
          {isEditing ? (
            <input
              name="specification"
              value={editedItem.specification}
              onChange={handleInputChange}
            />
          ) : (
            item.specification || "N/A"
          )}
        </p>

        {!isEditing && (
          <p>
            <strong>Average Price:</strong> ₱
            {item.average_price?.toLocaleString() || "N/A"}
          </p>
        )}

        <p>
          <strong>SRP:</strong> ₱
          {isEditing ? (
            <input
              name="srp"
              type="number"
              value={editedItem.srp}
              onChange={handleInputChange}
            />
          ) : (
            item.srp?.toLocaleString() || "N/A"
          )}
        </p>
      </div>

      <div className="item-actions">
        {isOwnedByUser &&
          (isEditing ? (
            <>
              <button class="save" onClick={handleSave} disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </button>
              <button class="cancel" onClick={() => setIsEditing(false)} disabled={loading}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <button class="edit" onClick={() => setIsEditing(true)}>Edit</button>
              <button class="delete" onClick={handleDelete} disabled={loading}>
                Delete
              </button>
            </>
          ))}
      </div>
    </div>
  );
};

export default ItemInfoPage;
