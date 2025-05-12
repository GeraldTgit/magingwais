import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { AuthProvider } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import SearchLists from "./pages/SearchLists";
import SearchItems from "./pages/SearchItems";
import CreateList from "./pages/CreateList";
import ListItems from "./pages/ListItems";
import './styles/App.css';

function AppContent() {
  const location = useLocation();
  const isSignupPage =
    location.pathname === "/" || location.pathname === "/signup";

  return (
    <div>
      <Routes>
        <Route path="/" element={<Signup />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Dashboard />} />
        <Route path="/search-lists" element={<SearchLists />} />
        <Route path="/search-items" element={<SearchItems />} />
        <Route path="/create-list" element={<CreateList />} />
        <Route path="/list/:listId" element={<ListItems />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Navigation />
        <AppContent />
      </AuthProvider>
    </Router>
  );
}
