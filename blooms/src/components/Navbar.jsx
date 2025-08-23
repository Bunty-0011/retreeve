import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import logo from "../assets/logo.png";
import LogoutBtn from "./LogoutBtn";
import { setTopicQuery } from "../features/searchSlice";

export default function Navbar() {
  const authStatus = useSelector((s) => s.user.isLoggedIn);
  const user = useSelector((s) => s.user.user);

  const navigate = useNavigate();
  const { pathname } = useLocation();
  const dispatch = useDispatch();
  const [search, setSearch] = useState("");

  // ✅ Search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmed = search.trim();
    if (trimmed) {
      dispatch(setTopicQuery(trimmed));
      navigate(`/search?q=${encodeURIComponent(trimmed)}`);
      setSearch("");
    }
  };

  // ✅ Smooth scroll to section
  const handleScroll = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const navItems = [
    { name: "Home", slug: "/", type: "link", active: !authStatus },
    { name: "Features", slug: "features", type: "scroll", active: !authStatus },
    { name: "How it Works", slug: "how-it-works", type: "scroll", active: !authStatus },
    { name: "Contact Us", slug: "contact", type: "scroll", active: !authStatus },
    { name: "Sign In", slug: "/signin", type: "link", active: !authStatus },
    { name: "Sign Up", slug: "/signup", type: "link", active: !authStatus },
    { name: "Dashboard", slug: "/dashboard", type: "link", active: authStatus },
    { name: "My Topics", slug: "/mytopics", type: "link", active: authStatus },
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
                    {i.type === "link" ? (
                      <button
                        onClick={() => navigate(i.slug)}
                        className="px-4 py-2 duration-200 hover:bg-gray-200 rounded-full text-gray-700"
                      >
                        {i.name}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleScroll(i.slug)}
                        className="px-4 py-2 duration-200 hover:bg-gray-200 rounded-full text-gray-700"
                      >
                        {i.name}
                      </button>
                    )}
                  </li>
                )
            )}

            {/* Search Bar */}
            {showSearch && (
              <li>
                <form onSubmit={handleSearchSubmit} className="flex items-center">
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