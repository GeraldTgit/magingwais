import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import SearchLists from "./pages/SearchLists";
import SearchItems from "./pages/SearchItems";
import CreateList from "./pages/CreateList";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Signup />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/search-lists" element={<SearchLists />} />
        <Route path="/search-items" element={<SearchItems />} />
        <Route path="/create-list" element={<CreateList />} />
      </Routes>
    </Router>
  );
}
