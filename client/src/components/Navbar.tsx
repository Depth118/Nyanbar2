import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, Home, Heart } from "lucide-react";
import NotificationSystem from "./NotificationSystem";

const Navbar: React.FC = () => {
  const location = useLocation();
  const [customListCount, setCustomListCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [customList, setCustomList] = useState<any[]>([]);

  useEffect(() => {
    // Load custom list count from localStorage
    const savedList = localStorage.getItem("nyanbar-custom-anime-list");
    if (savedList) {
      try {
        const list = JSON.parse(savedList);
        setCustomListCount(list.length);
        setCustomList(list);
      } catch (error) {
        console.error("Error loading custom list count:", error);
      }
    }

    // Listen for storage changes
    const handleStorageChange = () => {
      const savedList = localStorage.getItem("nyanbar-custom-anime-list");
      if (savedList) {
        try {
          const list = JSON.parse(savedList);
          setCustomListCount(list.length);
          setCustomList(list);
        } catch (error) {
          setCustomListCount(0);
        }
      } else {
        setCustomListCount(0);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="bg-gray-900/20 backdrop-blur-md border-b border-gray-700/30 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link
            to="/"
            className="flex items-center space-x-2"
            onClick={closeMobileMenu}
          >
            <span
              className="text-3xl font-black text-white"
              style={{ fontFamily: "Gotham Black, sans-serif" }}
            >
              NyanBar
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                isActive("/")
                  ? "bg-emerald-600 text-white shadow-lg"
                  : "text-gray-300 hover:text-white hover:bg-gray-700/50"
              }`}
            >
              <Home size={20} />
              <span>Home</span>
            </Link>

            <Link
              to="/search"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                isActive("/search")
                  ? "bg-emerald-600 text-white shadow-lg"
                  : "text-gray-300 hover:text-white hover:bg-gray-700/50"
              }`}
            >
              <Search size={20} />
              <span>Search</span>
            </Link>

            <Link
              to="/custom"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 relative ${
                isActive("/custom")
                  ? "bg-emerald-600 text-white shadow-lg"
                  : "text-gray-300 hover:text-white hover:bg-gray-700/50"
              }`}
            >
              <Heart size={20} />
              <span>My List</span>
              {customListCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
                  {customListCount}
                </span>
              )}
            </Link>

            {/* Notification System */}
            <NotificationSystem customList={customList} />
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-3 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all duration-200 relative w-12 h-12 flex items-center justify-center"
          >
            <div className="hamburger-menu">
              <span
                className={`hamburger-line ${
                  isMobileMenuOpen ? "rotate-45" : ""
                }`}
              ></span>
              <span
                className={`hamburger-line ${
                  isMobileMenuOpen ? "opacity-0" : ""
                }`}
              ></span>
              <span
                className={`hamburger-line ${
                  isMobileMenuOpen ? "-rotate-45" : ""
                }`}
              ></span>
            </div>
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-700/30 bg-gray-900/20 backdrop-blur-md">
            <div className="px-6 py-4 space-y-2">
              <Link
                to="/"
                onClick={closeMobileMenu}
                className={`flex items-center space-x-4 px-4 py-4 rounded-lg transition-all duration-200 text-lg ${
                  isActive("/")
                    ? "bg-emerald-600 text-white shadow-lg"
                    : "text-gray-300 hover:text-white hover:bg-gray-700/50"
                }`}
              >
                <Home size={24} />
                <span className="font-medium">Home</span>
              </Link>

              <Link
                to="/search"
                onClick={closeMobileMenu}
                className={`flex items-center space-x-4 px-4 py-4 rounded-lg transition-all duration-200 text-lg ${
                  isActive("/search")
                    ? "bg-emerald-600 text-white shadow-lg"
                    : "text-gray-300 hover:text-white hover:bg-gray-700/50"
                }`}
              >
                <Search size={24} />
                <span className="font-medium">Search</span>
              </Link>

              <Link
                to="/custom"
                onClick={closeMobileMenu}
                className={`flex items-center space-x-4 px-4 py-4 rounded-lg transition-all duration-200 text-lg relative ${
                  isActive("/custom")
                    ? "bg-emerald-600 text-white shadow-lg"
                    : "text-gray-300 hover:text-white hover:bg-gray-700/50"
                }`}
              >
                <Heart size={24} />
                <span className="font-medium">My List</span>
                {customListCount > 0 && (
                  <span className="absolute top-3 right-4 bg-red-500 text-white text-sm rounded-full w-6 h-6 flex items-center justify-center shadow-lg font-semibold">
                    {customListCount}
                  </span>
                )}
              </Link>

              {/* Mobile Notification System */}
              <NotificationSystem customList={customList} />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
