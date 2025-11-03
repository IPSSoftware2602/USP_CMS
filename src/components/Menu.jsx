import React from "react";
import { useDispatch } from "react-redux";
import { logOut } from "@/store/api/auth/authSlice";
import { menuItems } from "@/constant/data";

const Menu = () => {
  const dispatch = useDispatch();

  const handleMenuClick = (item) => {
    if (item.action === "logout") {
      localStorage.removeItem("user");
      dispatch(logOut());
    } else if (item.link) {
      window.location.href = item.link;
    }
  };

  return (
    <ul>
      {menuItems.map((item, index) => (
        <li key={index}>
          <span>{item.icon}</span>
          <button onClick={() => handleMenuClick(item)}>{item.title}</button>
        </li>
      ))}
    </ul>
  );
};

export default Menu;