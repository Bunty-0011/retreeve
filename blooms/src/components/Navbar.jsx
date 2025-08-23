import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import logo from "../assets/logo.png";


export default function Navbar() {
  const authStatus = useSelector((s) => s.user.isLoggedIn);
  const user = useSelector((s) => s.user.user);

  const navigate = useNavigate();
  const { pathname } = useLocation();
  

  

  

  const navItems = [
    { name: "Home", slug: "/", active: !authStatus },
    { name: "Features", slug: "/", active: !authStatus },
    { name: "How it Works", slug: "/", active: !authStatus },
    { name: "Contact Us", slug: "/", active: !authStatus },
    
  ];

  const showSearch =
    authStatus &&
    (pathname.startsWith("/dashboard") || pathname.startsWith("/mytopics"));

  return (
    <nav className="bg-[#f6f2ec] shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-24">
        
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

          </ul>
        </div>
      </div>
    </nav>
  );
}
