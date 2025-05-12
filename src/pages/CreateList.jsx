import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "../styles/CreateList.css";

export default function CreateList() {
  const [listName, setListName] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCreateList = async () => {
    if (!listName.trim()) {
      alert("Please enter a list name!");
      return;
    }

    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      alert("User not logged in.");
      return;
    }

    const user = JSON.parse(storedUser);

    setLoading(true);

    const { error } = await supabase.from("shopping_lists").insert({
      name: listName,
      user_id: user.google_id, // Ensure correct linking
      is_public: isPublic,
    });

    setLoading(false);

    if (error) {
      console.error("Error creating list:", error);
      alert("Failed to create list.");
    } else {
      navigate("/search-lists");
    }
  };

  return (
    <div className="create-list-page">
      <div className="create-list-card">
        <h1 className="create-list-title">Create New Shopping List</h1>

        <input
          type="text"
          placeholder="List Name"
          value={listName}
          onChange={(e) => setListName(e.target.value)}
          className="create-list-input"
        />

        <label className="checkbox-container">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={() => setIsPublic(!isPublic)}
          />
          Make Public
        </label>

        <div className="button-container">
          <button
            onClick={handleCreateList}
            className="create-list-button"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create List"}
          </button>
          <button
            onClick={() => navigate("/search-lists")}
            className="cancel-list-button"
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

