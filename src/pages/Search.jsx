import { useState } from "react";
import axios from "axios";

export default function Search() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([
    { name: "Milk", price: 2.5, unit: "liter" },
    { name: "Bread", price: 1.2, unit: "loaf" },
    { name: "Rice", price: 1.0, unit: "kg" },
  ]);

  const handleAddToCart = async (item) => {
    const token = localStorage.getItem("token");
    try {
      await axios.post(
        "http://localhost:4000/api/cart-items/add",
        {
          item_name: item.name,
          price_per_unit: item.price,
          unit: item.unit,
          quantity: 1,
          cart_id: "YOUR-CURRENT-CART-ID", // TEMPORARY for now
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Item added to cart!");
    } catch (err) {
      console.error("Failed to add item", err);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Search Items</h1>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="border rounded p-2 mb-4 w-full"
        placeholder="Search for items..."
      />

      <div className="space-y-4">
        {items
          .filter((item) =>
            item.name.toLowerCase().includes(query.toLowerCase())
          )
          .map((item, idx) => (
            <div
              key={idx}
              className="p-4 border rounded flex justify-between items-center"
            >
              <div>
                <div className="font-semibold">{item.name}</div>
                <div className="text-gray-500">
                  ${item.price.toFixed(2)} per {item.unit}
                </div>
              </div>
              <button
                onClick={() => handleAddToCart(item)}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Add to Cart
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}
