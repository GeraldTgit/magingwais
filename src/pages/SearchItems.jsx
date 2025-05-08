import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaListUl } from "react-icons/fa";
import supabase from '../lib/supabaseClient';
import "./SearchItems.css";
import AddItemModal from "../components/AddItemModal";
import ItemInfoModal from "../components/ItemInfoModal";
import BurgerMenu from "../components/BurgerMenu";
import DummyImage from "../images/dummy-item.png";
import ListedImage from "../images/added.png";

export default function SearchItems() {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchName, setSearchName] = useState("");
  const [searchBrand, setSearchBrand] = useState("");
  const [searchDesc, setSearchDesc] = useState("");
  const [sortOption, setSortOption] = useState("");
  const [userLists, setUserLists] = useState([]);
  const [selectedList, setSelectedList] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalItem, setModalItem] = useState(null);
  const [splashItemId, setSplashItemId] = useState(null);
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [viewPublic, setViewPublic] = useState(false);
  const [newItem, setNewItem] = useState({
    item_name: "",
    brand: "",
    description: "",
    specification: "",
    srp: "",
    is_public: false
  });

  useEffect(() => {
    fetchItems();
    fetchUserLists();
  }, [viewPublic]);

  const fetchUserLists = async () => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return;

    const userInfo = JSON.parse(storedUser);

    const { data, error } = await supabase
      .from("shopping_lists")
      .select("*")
      .eq("user_id", userInfo.google_id);

    if (error) console.error("Error fetching lists:", error);
    else setUserLists(data);
  };

  const fetchItems = async () => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return;
    
    const user = JSON.parse(storedUser);
    
    let query = supabase.from("items").select("*");
    
    if (viewPublic) {
      query = query.eq("is_public", true);
    } else {
      query = query.eq("added_by", user.google_id);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("Error fetching items:", error);
    } else {
      setItems(data);
      setFilteredItems(data);
    }
  };  

  useEffect(() => {
    let temp = [...items];
    setCurrentPage(1); // reset to page 1 on any filter change

    if (searchName.trim()) {
      temp = temp.filter(item =>
        item.name.toLowerCase().includes(searchName.toLowerCase())
      );
    }
    if (searchBrand.trim()) {
      temp = temp.filter(item =>
        (item.brand || "N/A").toLowerCase().includes(searchBrand.toLowerCase())
      );
    }
    if (searchDesc.trim()) {
      temp = temp.filter(item =>
        (item.description || "").toLowerCase().includes(searchDesc.toLowerCase())
      );
    }

    if (sortOption === "price-low") {
      temp.sort((a, b) => a.average_price - b.average_price);
    } else if (sortOption === "price-high") {
      temp.sort((a, b) => b.average_price - a.average_price);
    } else if (sortOption === "srp-low") {
      temp.sort((a, b) => a.srp - b.srp);
    } else if (sortOption === "srp-high") {
      temp.sort((a, b) => b.srp - a.srp);
    }

    setFilteredItems(temp);
  }, [searchName, searchBrand, searchDesc, sortOption, items]);

  const handleOpenModal = (item) => {
    setModalItem(item);
    setShowModal(true);
  };

  const handleAddToList = async (item) => {
    if (!selectedList) {
      alert("Please select a shopping list first.");
      return;
    }

    setSplashItemId(item.id); // show splash
    setTimeout(() => setSplashItemId(null), 1200); // auto-hide

    // Step 1: Check if item already exists in list
    const { data: existing, error: selectError } = await supabase
    .from("list_items")
    .select("*")
    .eq("list_id", selectedList)
    .eq("item_name", item.name)
    .single();

    if (selectError && selectError.code !== "PGRST116") {
    console.error("Error checking item:", selectError);
    return;
    }

    if (existing) {
    // Step 2: Update quantity
    const { error: updateError } = await supabase
      .from("list_items")
      .update({ quantity: existing.quantity + 1 })
      .eq("id", existing.id);
    
    if (updateError) {
      console.error("Error updating quantity:", updateError);
    }
    } else {
    // Step 3: Insert new item with quantity = 1
    const { error: insertError } = await supabase.from("list_items").insert({
      list_id: selectedList,
      item_name: item.name,
      brand: item.brand || "N/A",
      description: item.description || "",
      specification: item.specification || "",
      average_price: item.average_price,
      srp: item.srp,
      actual_price: null,
      quantity: 1
    });

    if (insertError) {
      console.error("Error inserting item:", insertError);
    }
    }
  };
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  return (
    <div className="page-container" style={{ position: "relative" }}>
      
      {/* View item info Modal */}
      {showModal && modalItem && (
        <ItemInfoModal
          item={modalItem}
          onClose={() => setShowModal(false)}
          currentUserId={JSON.parse(localStorage.getItem("user"))?.google_id}
        />
      )}


      {/* AddItemModal goes here */}
      <AddItemModal
        newItem={newItem}
        setNewItem={setNewItem}
        showAddModal={showAddItemModal}
        setShowAddModal={setShowAddItemModal}
      />
      
      <div className="search-items-card-container">
        {/* Options */}
        <BurgerMenu currentPage="search-items" />

        <h1 className="page-title">Search Items</h1>

        {/* Filters and Sort */}
        <div className="filters">
          <input
            type="text"
            placeholder="Search by Item Name"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="filter-input"
          />
          <input
            type="text"
            placeholder="Search by Brand"
            value={searchBrand}
            onChange={(e) => setSearchBrand(e.target.value)}
            className="filter-input"
          />
          <input
            type="text"
            placeholder="Search by Description"
            value={searchDesc}
            onChange={(e) => setSearchDesc(e.target.value)}
            className="filter-input"
          />
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="filter-select"
          >
            <option value="">Sort by</option>
            <option value="price-low">Price: Low ➔ High</option>
            <option value="price-high">Price: High ➔ Low</option>
            <option value="srp-low">SRP: Low ➔ High</option>
            <option value="srp-high">SRP: High ➔ Low</option>
          </select>

          <select
            value={selectedList}
            onChange={(e) => setSelectedList(e.target.value)}
            className="filter-select"
          >
            <option value="">Select Shopping List 🧾</option>
            {userLists.map(list => (
              <option key={list.id} value={list.id}>{list.name} 🧾</option>
            ))}
          </select>
        <div className="floating-btn-container">
          <button
            className="floating-go-btn"
            onClick={() => navigate("/search-lists")}
          >
            <FaListUl className="btn-icon" />
            Go to MyList
            <span className="badge">!</span>
          </button>
        </div>
      </div>

        {/**Items viewing options */}
        <div className="toggle-buttons">
          <button
            onClick={() => setViewPublic(false)}
            className={`toggle-button ${!viewPublic ? "active" : ""}`}
          >
            My Items
          </button>
          <button
            onClick={() => setViewPublic(true)}
            className={`toggle-button ${viewPublic ? "active" : ""}`}
          >
            Public Items
          </button>
        </div>

        {/* Items List */}
        {filteredItems.length === 0 ? (
          <div className="no-lists-container">
            <p className="no-lists-text">No items found.</p>
          </div>
        ) : (
          <ul className="item-grid">
            {currentItems.map((item) => (
              <li key={item.id} className="item-card">
                <img src={DummyImage} alt="Item" className="item-image" onClick={() => handleOpenModal(item)} />
                <div className="item-info" onClick={() => handleOpenModal(item)}>
                  <div className="item-top">
                    <div className="item-name-brand">
                      {item.name} {item.brand && ` ${item.brand}`}
                    </div>
                    <div className="item-price">
                      Ave Price: ₱{item.average_price != null ? item.average_price.toLocaleString() : "N/A"}
                    </div>
                  </div>
                  <div className="item-bottom">
                    <div className="item-spec">
                      {item.description == null
                        ? item.specification
                        : (
                            <>
                              {item.description}
                              <br />
                              {item.specification}
                            </>
                          )
                      }
                    </div>
                    <div className="item-srp">
                      SRP: ₱{item.srp != null ? item.srp.toLocaleString() : "N/A"}
                    </div>
                  </div>
                </div>
                <button
                  className="add-to-list-button"
                  onClick={() => handleAddToList(item)}
                >
                  Add to List
                </button>
                {item.id === splashItemId && (
                <img src={ListedImage} alt="Listed" className="listed-splash" />)}
              </li>
            ))}
          </ul>
        )}
        <div className="add-new-item-container">
          <button className="add-new-item-btn" onClick={() => setShowAddItemModal(true)}>
            + Add New Item
          </button>
        </div> 
        <div className="pagination">
          <button onClick={goToPrevPage} disabled={currentPage === 1}>
            Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button onClick={goToNextPage} disabled={currentPage === totalPages}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
