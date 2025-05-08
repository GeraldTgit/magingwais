import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import SearchLists from "./pages/SearchLists";
import SearchItems from "./pages/SearchItems";
import CreateList from "./pages/CreateList";
import ListItems from "./pages/ListItems";

function AppContent() {
  const location = useLocation();
  const isSignupPage =
    location.pathname === "/" || location.pathname === "/signup";

  return (
    <div>
      <Routes>
        <Route path="/" element={<Signup />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard showMenu={!isSignupPage} />} />
        <Route path="/search-lists" element={<SearchLists showMenu={!isSignupPage} />} />
        <Route path="/search-items" element={<SearchItems showMenu={!isSignupPage} />} />
        <Route path="/create-list" element={<CreateList showMenu={!isSignupPage} />} />
        <Route path="/list/:listId" element={<ListItems showMenu={!isSignupPage} />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
