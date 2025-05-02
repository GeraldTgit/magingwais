import React from "react";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      window.location.href = "/signup";
    }
  }, []);

  if (!user) return <div>Loading...</div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Welcome, {user.name}!</h1>
        <img
          src={user.picture_url}
          alt="Profile"
          className="w-24 h-24 rounded-full mx-auto mb-4"
        />
        <p className="text-gray-600 mb-2">Email: {user.email}</p>
        <p className="text-gray-600 mb-2">
          Email Verified: {user.email_verified ? "✅ Yes" : "❌ No"}
        </p>

        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = "/signup";
          }}
          className="mt-6 px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
