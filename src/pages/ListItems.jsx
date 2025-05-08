import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import supabase from '../lib/supabaseClient';
import { FiShare2, FiArrowLeft, FiCopy } from "react-icons/fi";
import ListItemInfoModal from '../components/ListItemInfoModal';
import BurgerMenu from '../components/BurgerMenu';
import "./ListItems.css";

const ListItems = () => {
  const { listId } = useParams();
  const navigate = useNavigate();
  const [listItems, setListItems] = useState([]);
  const [listName, setListName] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [listOwnerId, setListOwnerId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [duplicating, setDuplicating] = useState(false);
  const [creator, setCreator] = useState(null);

  const fetchListItems = async () => {
    setLoading(true);

    const { data: listData, error: listError } = await supabase
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

    if (!listError && listData) {
      setListName(listData.name);
      setIsPublic(listData.is_public);
      setListOwnerId(listData.user_id);
      setCreator(listData.creator);
    }

    const { data, error } = await supabase
      .from("list_items")
      .select("id, item_name, description, specification, quantity, srp, actual_price, isbought")
      .eq("list_id", listId);

    if (error) {
      console.error("Error fetching list items:", error);
    } else {
      setListItems(data);
    }

    setLoading(false);
  };

  const handleDuplicate = async () => {
    if (!userId) {
      alert("Please sign in to duplicate a list.");
      return;
    }

    setDuplicating(true);
    try {
      // Create new shopping list
      const { data: newList, error: listError } = await supabase
        .from("shopping_lists")
        .insert({
          name: `${listName} (Copy)`,
          user_id: userId,
          is_public: false
        })
        .select()
        .single();

      if (listError) throw listError;

      // Duplicate all items
      const itemsToInsert = listItems.map(item => ({
        list_id: newList.id,
        item_name: item.item_name,
        description: item.description,
        specification: item.specification,
        quantity: item.quantity,
        srp: item.srp,
        actual_price: item.actual_price,
        isbought: false
      }));

      const { error: itemsError } = await supabase
        .from("list_items")
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      alert("List duplicated successfully!");
      navigate(`/list/${newList.id}`);
    } catch (error) {
      console.error("Error duplicating list:", error);
      alert("Failed to duplicate list.");
    } finally {
      setDuplicating(false);
    }
  };

  const updateQuantity = async (itemId, newQty) => {
    if (newQty < 1 || userId !== listOwnerId) return;
  
    const { error } = await supabase
      .from("list_items")
      .update({ quantity: newQty })
      .eq("id", itemId);
  
    if (!error) {
      setListItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId ? { ...item, quantity: newQty } : item
        )
      );
    } else {
      console.error("Failed to update quantity:", error);
    }
  };

  const handleShare = () => {
    const shareLink = `${window.location.origin}/shared-list/${listId}`;
    navigator.clipboard.writeText(shareLink);
    alert("Shareable link copied to clipboard!");
  };

  const handleItemUpdated = (updatedItem) => {
    setListItems((prevItems) =>
      prevItems.map((item) =>
        item.id === updatedItem.id ? updatedItem : item
      )
    );
  };

  const handleItemDeleted = (deletedItemId) => {
    setListItems((prevItems) =>
      prevItems.filter((item) => item.id !== deletedItemId)
    );
  };

  useEffect(() => {
    if (listId) {
      fetchListItems();
    }
  }, [listId]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userInfo = JSON.parse(storedUser);
      setUserId(userInfo.google_id);
    } else {
      navigate("/signup");
    }
  }, [navigate]);

  const totalPrice = listItems.reduce((sum, item) => {
    const unitPrice = item.actual_price != null ? item.actual_price : item.srp || 0;
    return sum + unitPrice * (item.quantity || 1);
  }, 0);

  const isOwner = userId === listOwnerId;

  return (
    <div className="list-items-page" style={{ position: "relative" }}>
      <div className="list-items-container" >
        {/* Burger Menu */}
        <BurgerMenu currentPage="list" />
        
        {/* Header */}
        <div className="list-header">
          <button className="back-button" onClick={() => navigate(-1)}>
            <FiArrowLeft size={24} />
          </button>
          <div className="list-title-section">
            <input
              type="text"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              onBlur={async () => {
                if (isOwner) {
                  await supabase
                    .from("shopping_lists")
                    .update({ name: listName })
                    .eq("id", listId);
                }
              }}
              className="list-title-input"
              placeholder="List Name"
              disabled={!isOwner}
            />
            {creator && (
              <div className="creator-info">
                Created by: {creator.nickname || "no nickname yet"}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="loading-state">Loading...</div>
        ) : listItems.length === 0 ? (
          <div className="empty-state">No items found in this list.</div>
        ) : (
          <>
            <div className="items-container">
              {listItems.map((item) => {
                const unitPrice = item.actual_price != null ? item.actual_price : item.srp || 0;
                const subtotal = unitPrice * (item.quantity || 1);
                return (
                  <div 
                    key={item.id} 
                    className="item-card"
                    onClick={() => setSelectedItem(item)}
                  >
                    <div className="item-content">
                      <div className="item-checkbox">
                        <input
                          type="checkbox"
                          checked={item.isbought || false}
                          onChange={async (e) => {
                            e.stopPropagation();
                            if (!isOwner) return;
                            const checked = e.target.checked;
                            await supabase
                              .from("list_items")
                              .update({ isbought: checked })
                              .eq("id", item.id);
                            setListItems((prev) =>
                              prev.map((i) => (i.id === item.id ? { ...i, isbought: checked } : i))
                            );
                          }}
                          disabled={!isOwner}
                        />
                      </div>
                      <h3 className="item-name" title={`${item.description} ${item.specification}`}>
                        {item.item_name}
                      </h3>
                      <div className="quantity-control">
                        <button
                          className="quantity-btn minus"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQuantity(item.id, item.quantity - 1);
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
                            updateQuantity(item.id, item.quantity + 1);
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
                          onChange={async (e) => {
                            e.stopPropagation();
                            if (!isOwner) return;
                            const raw = e.target.value.replace(/[^\d.]/g, "");
                            const value = raw === "" ? null : parseFloat(raw);
                            await supabase
                              .from("list_items")
                              .update({ actual_price: value })
                              .eq("id", item.id);
                            setListItems((prev) =>
                              prev.map((i) => (i.id === item.id ? { ...i, actual_price: value } : i))
                            );
                          }}
                          onClick={(e) => e.stopPropagation()}
                          disabled={!isOwner}
                        />
                      </div>
                      <div className="subtotal">
                        <span className="amount">₱{subtotal.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="list-footer">
              <div className="footer-left">
                {isOwner && (
                  <label className="public-toggle">
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={async (e) => {
                        const newVal = e.target.checked;
                        setIsPublic(newVal);
                        await supabase
                          .from("shopping_lists")
                          .update({ is_public: newVal })
                          .eq("id", listId);
                      }}
                    />
                    <span>Public List</span>
                    <span className="tooltip" title="If checked, anyone can see this List.">🛈</span>
                  </label>
                )}

                {isPublic && (
                  <button className="share-button" onClick={handleShare}>
                    <FiShare2 size={18} />
                    <span>Share</span>
                  </button>
                )}
              </div>

              <div className="total-section">
                <span className="total-label">Total:</span>
                <span className="total-amount">₱{totalPrice.toLocaleString()}</span>
              </div>
            </div>

            <div className="duplicate-section">
              <button 
                className="duplicate-button"
                onClick={handleDuplicate}
                disabled={duplicating}
              >
                <FiCopy size={18} />
                <span>{duplicating ? "Duplicating..." : "Duplicate List"}</span>
              </button>
            </div>
          </>
        )}
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