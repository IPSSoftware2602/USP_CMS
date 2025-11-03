import React, { useRef, useEffect, useState } from "react";
import SidebarLogo from "./Logo";
import Navmenu from "./Navmenu";
import { menuItems } from "@/constant/data";
import SimpleBar from "simplebar-react";
import useSidebar from "@/hooks/useSidebar";
import useSemiDark from "@/hooks/useSemiDark";
import useSkin from "@/hooks/useSkin";
import svgRabitImage from "@/assets/images/svg/rabit.svg";
import UserService from "@/store/api/userService";

const Sidebar = () => {
  const scrollableNodeRef = useRef();
  const [scroll, setScroll] = useState(false);
  const [filteredMenu, setFilteredMenu] = useState(menuItems);
  const [collapsed, setMenuCollapsed] = useSidebar();
  const [menuHover, setMenuHover] = useState(false);
  const [isSemiDark] = useSemiDark();
  const [skin] = useSkin();

  useEffect(() => {
    const handleScroll = () => {
      if (scrollableNodeRef.current.scrollTop > 0) {
        setScroll(true);
      } else {
        setScroll(false);
      }
    };
    scrollableNodeRef.current.addEventListener("scroll", handleScroll);
  }, [scrollableNodeRef]);

  useEffect(() => {
    const fetchAndFilterMenu = async () => {
      try {
        const userStr = localStorage.getItem("user");
        if (!userStr) return;
        const userObj = JSON.parse(userStr);
        const userId = userObj?.user.user_id;
        if (!userId) return;


        const userDataRes = await UserService.getUser(userId);
        const userData = userDataRes?.data;
        if (!userData) return;

        if (userData.role && userData.role.toLowerCase() === "admin") {
          setFilteredMenu(menuItems);
          return;
        }


        let permissions = {};
        if (userData.user_permissions) {
          try {
            permissions = JSON.parse(userData.user_permissions);
            console.log("User permissions:", permissions); 
          } catch (e) {
            console.error("Error parsing user permissions:", e);
            permissions = {};
          }
        }
        const filterMenu = (items) => {
          return items
            .map((item) => {

              if (item.isHeadr) return item;
              

              if (item.title === "Dashboard" || item.title === "Logout") {

                if (item.child) {
                  const filteredChild = filterChildMenu(item.child, permissions);
                  return { ...item, child: filteredChild };
                }
                return item;
              }
              
              const permKey = item.permissionKey || item.title?.replace(/\s/g, "");
              

              if (permKey && permissions[permKey]) {
                const perm = permissions[permKey];
                
                if (item.child) {

                  if (typeof perm.read === "boolean" && !perm.read) {

                    return null;
                  }
                } else {
                  if (typeof perm.read === "boolean" && !perm.read) {
                    return null;
                  }
                }
              } else if (!permKey) {
                console.warn(`No permission key found for menu item: ${item.title}`);
              } else {

                return null;
              }
              
              if (item.child) {
                const filteredChild = filterChildMenu(item.child, permissions);
                return { ...item, child: filteredChild };
              }

              return item;
            })
            .filter(Boolean);
        };

        const filterChildMenu = (children, permissions) => {
          return children
            .map((childItem) => {

              const childTitle = childItem.childtitle || childItem.title;
              

              const permKey = childItem.permissionKey || childTitle?.replace(/\s/g, "");
              
              if (!permKey) {
                console.warn(`No permission key found for child menu item: ${childTitle}`);
                return childItem; 
              }
              
              if (permissions[permKey]) {
                const perm = permissions[permKey];
                
                if (typeof perm.read === "boolean" && !perm.read) {
                  return null;
                }
              } else {

                const parentKey = Object.keys(permissions).find(key => 
                  permissions[key]?.subItems && permissions[key].subItems[permKey]
                );
                
                if (parentKey && permissions[parentKey]?.subItems?.[permKey]) {
                  const subItemPerm = permissions[parentKey].subItems[permKey];
                  if (typeof subItemPerm.read === "boolean" && !subItemPerm.read) {
                    return null;
                  }
                } else {

                  return null;
                }
              }
              
              return childItem;
            })
            .filter(Boolean);
        };

        const finalFilteredMenu = filterMenu(menuItems);
        console.log("Final filtered menu:", finalFilteredMenu); // Debug
        setFilteredMenu(finalFilteredMenu);
      } catch (err) {
        console.error("Error filtering menu:", err);
        // fallback: show all menu
        setFilteredMenu(menuItems);
      }
    };

    fetchAndFilterMenu();
  }, []);

  return (
    <div className={isSemiDark ? "dark" : ""}>
      <div
        className={`sidebar-wrapper bg-white dark:bg-slate-800     ${
          collapsed ? "w-[72px] close_sidebar" : "w-[248px]"
        }
      ${menuHover ? "sidebar-hovered" : ""}
      ${
        skin === "bordered"
          ? "border-r border-slate-200 dark:border-slate-700"
          : "shadow-base"
      }
      `}
        onMouseEnter={() => {
          setMenuHover(true);
        }}
        onMouseLeave={() => {
          setMenuHover(false);
        }}
      >
        <SidebarLogo menuHover={menuHover} />
        <div
          className={`h-[60px]  absolute top-[80px] nav-shadow z-[1] w-full transition-all duration-200 pointer-events-none ${
            scroll ? " opacity-100" : " opacity-0"
          }`}
        ></div>

        <SimpleBar
          className="sidebar-menu px-4 h-[calc(100%-80px)]"
          scrollableNodeProps={{ ref: scrollableNodeRef }}
        >
          <Navmenu menus={filteredMenu} />
        </SimpleBar>
      </div>
    </div>
  );
};

export default Sidebar;