import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import logo from "../assets/logo.png";
import LogoutBtn from "./LogoutBtn";
import {
  getUserNotifications,
  subscribeToNotifications,
  markAsRead,
} from "../appwrite/notification_service";
import { setTopicQuery } from "../features/searchSlice"; // ✅ import action


export default function Navbar() {
  const authStatus = useSelector((s) => s.user.isLoggedIn);
  const user = useSelector((s) => s.user.user);

  const navigate = useNavigate();
  const { pathname } = useLocation();
  const dispatch = useDispatch(); // ✅ setup dispatch
  const [search, setSearch] = useState("");

  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef();

  // ✅ Fetch initial notifications & subscribe
  useEffect(() => {
    if (!authStatus || !user) return;

    let unsubscribe = null;

    (async () => {
      try {
        const initial = await getUserNotifications(user.$id); // service auto-filters by current user
        setNotifications(initial || []);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }

      unsubscribe = subscribeToNotifications(user.$id, (doc) => {
        setNotifications((prev) => [doc, ...prev]);
      });
    })();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [authStatus, user]);

  // ✅ Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotif(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.$id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // ✅ Updated search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmed = search.trim();
    if (trimmed) {
      dispatch(setTopicQuery(trimmed)); // ✅ store in redux
      navigate(`/search?q=${encodeURIComponent(trimmed)}`); // ✅ push to URL
      setSearch(""); // ✅ clear input
    }
  };

  const navItems = [
    { name: "Home", slug: "/", active: !authStatus },
    { name: "Features", slug: "/", active: !authStatus },
    { name: "How it Works", slug: "/", active: !authStatus },
    { name: "Contact Us", slug: "/", active: !authStatus },
    { name: "Sign In", slug: "/signin", active: !authStatus },
    { name: "Sign Up", slug: "/signup", active: !authStatus },
    { name: "Dashboard", slug: "/dashboard", active: authStatus },
    { name: "My Topics", slug: "/mytopics", active: authStatus },
  ];

  const showSearch =
    authStatus &&
    (pathname.startsWith("/dashboard") || pathname.startsWith("/mytopics"));

  return (
    <nav className="bg-[#f6f2ec] shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-24">
          {/* Logo */}
          <Link to="/">
            <img
              src={logo}
              alt="Logo"
              className="h-16 md:h-20 lg:h-24 w-auto"
            />
          </Link>

          <ul className="flex items-center gap-4 relative">
            {navItems.map(
              (i) =>
                i.active && (
                  <li key={i.name}>
                    <button
                      onClick={() => navigate(i.slug)}
                      className="px-4 py-2 duration-200 hover:bg-gray-200 rounded-full text-gray-700"
                    >
                      {i.name}
                    </button>
                  </li>
                )
            )}

            {/* 🔔 Notification Bell */}
            {authStatus && (
              <li className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotif((prev) => !prev)}
                  className="relative px-4 py-2 duration-200 hover:bg-gray-200 rounded-full text-gray-700"
                >
                  🔔
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Popup */}
                {showNotif && (
                  <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-lg z-50">
                    <h3 className="font-semibold p-3 border-b">Notifications</h3>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length ? (
                        notifications.map((n) => (
                          <div
                            key={n.$id}
                            className={`p-3 border-b flex justify-between items-center ${
                              n.isRead ? "bg-gray-50" : "bg-white"
                            }`}
                          >
                            <div>
                              <p
                                className={`${
                                  n.isRead ? "text-gray-500" : "font-semibold"
                                }`}
                              >
                                {n.message || "New notification"}
                              </p>
                              <p className="text-xs text-gray-400">
                                {new Date(n.$createdAt).toLocaleString()}
                              </p>
                            </div>
                            {!n.isRead && (
                              <button
                                onClick={() => handleMarkAsRead(n.$id)}
                                className="text-blue-500 text-xs hover:underline ml-2"
                              >
                                Mark read
                              </button>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="p-3 text-gray-500">No notifications</p>
                      )}
                    </div>
                  </div>
                )}
              </li>
            )}

            {/* Search Bar */}
            {showSearch && (
              <li>
                <form
                  onSubmit={handleSearchSubmit}
                  className="flex items-center"
                >
                  <input
                    type="text"
                    placeholder="Search topics..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="px-3 py-1 rounded border border-gray-300 text-black"
                  />
                </form>
              </li>
            )}

            {/* + Add Topic */}
            {authStatus && (
              <Link
                to="/add-topic"
                className="bg-yellow-400 text-black px-5 py-2 rounded-full font-semibold shadow-lg hover:bg-yellow-500 transition-all duration-200"
              >
                + Add Topic
              </Link>
            )}

            {/* Logout */}
            {authStatus && (
              <li>
                <LogoutBtn />
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
