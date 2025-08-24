import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import logo from "../assets/logo.png";
import LogoutBtn from "./LogoutBtn";

import { setTopicQuery } from "../features/searchSlice"; // ✅ import action

export default function Navbar() {
  const authStatus = useSelector((s) => s.user.isLoggedIn);
  const user = useSelector((s) => s.user.user);

  const navigate = useNavigate();
  const { pathname } = useLocation();
  const dispatch = useDispatch(); // ✅ setup dispatch
  const [search, setSearch] = useState("");

  

  
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