import React from "react";
// ek common button bna lo and usse khi bhi use kkar lo 
export default function Button({
    children,
    type = "button",  // ye default value de denge 
    bgColor = "bg-blue-600",
    textColor = "text-white",
    className = "",
    ...props  // agar user ne or bhi properties pass ki h to unko spread kar denge
}) {
    return (
        <button className={`px-4 py-2 rounded-lg ${bgColor} ${textColor} ${className}`} {...props}>
            {children}
        </button>
    );
}