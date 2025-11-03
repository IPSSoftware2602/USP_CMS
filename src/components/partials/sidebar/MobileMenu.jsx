import React, { useRef, useEffect, useState } from "react";
import Navmenu from "./Navmenu";
import { menuItems } from "@/constant/data";
import SimpleBar from "simplebar-react";
import useSemiDark from "@/hooks/useSemiDark";
import useSkin from "@/hooks/useSkin";
import useDarkMode from "@/hooks/useDarkMode";
import { Link } from "react-router-dom";
import useMobileMenu from "@/hooks/useMobileMenu";
import Icon from "@/components/ui/Icon";
import UserService from "@/store/api/userService";

// import images
import MobileLogo from "@/assets/images/logo/logo.png";

const MobileMenu = ({ className = "custom-class" }) => {
  const scrollableNodeRef = useRef();
  const [scroll, setScroll] = useState(false);
  const [filteredMenu, setFilteredMenu] = useState(menuItems);
  const [isSemiDark] = useSemiDark();
  const [skin] = useSkin();
  const [isDark] = useDarkMode();
  const [mobileMenu, setMobileMenu] = useMobileMenu();

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
        // 1. Get user_id from localStorage
        const userStr = localStorage.getItem("user");
        if (!userStr) return;
        const userObj = JSON.parse(userStr);
        const userId = userObj?.user.user_id;
        if (!userId) return;

        // 2. Fetch user data
        const userDataRes = await UserService.getUser(userId);
        const userData = userDataRes?.data;
        if (!userData) return;

        // 3. Check if user is admin - if yes, show all menu items without filtering
        if (userData.role && userData.role.toLowerCase() === "admin") {
          setFilteredMenu(menuItems);
          return;
        }

        // 4. Parse user_permissions
        let permissions = {};
        if (userData.user_permissions) {
          try {
            permissions = JSON.parse(userData.user_permissions);
          } catch (e) {
            console.error("Error parsing user permissions:", e);
            permissions = {};
          }
        }

        // 5. Filter menuItems with proper parent/child handling
        const filterMenu = (items) => {
          return items
            .map((item) => {
              // If it's a header, always show
              if (item.isHeadr) return item;
              
              // Always show Dashboard and Logout regardless of permissions
              if (item.title === "Dashboard" || item.title === "Logout") {
                // If has children, filter them
                if (item.child) {
                  const filteredChild = filterChildMenu(item.child, permissions);
                  return { ...item, child: filteredChild };
                }
                return item;
              }
              
              // Get the permission key for this menu item
              const permKey = item.permissionKey || item.title?.replace(/\s/g, "");
              
              // Check if this specific menu item has permission data
              if (permKey && permissions[permKey]) {
                const perm = permissions[permKey];
                
                // For parent items with children, only check their own read permission
                if (item.child) {
                  // Parent menu items only need read permission to be shown
                  if (typeof perm.read === "boolean" && !perm.read) {
                    // Hide parent if it doesn't have read permission
                    return null;
                  }
                } else {
                  // Child/leaf menu items need read permission to be shown
                  if (typeof perm.read === "boolean" && !perm.read) {
                    return null;
                  }
                }
              } else if (!permKey) {
                // If no permission key found, show the item (for backward compatibility)
                console.warn(`No permission key found for menu item: ${item.title}`);
              } else {
                // If no permission data found for this key, hide the item
                return null;
              }
              
              // If has children, filter them
              if (item.child) {
                const filteredChild = filterChildMenu(item.child, permissions);
                return { ...item, child: filteredChild };
              }

              return item;
            })
            .filter(Boolean);
        };

        // 6. Special handling for child items
        const filterChildMenu = (children, permissions) => {
          return children
            .map((childItem) => {
              // Get the title for child items (could be childtitle or title)
              const childTitle = childItem.childtitle || childItem.title;
              
              // Get the permission key for this child menu item
              const permKey = childItem.permissionKey || childTitle?.replace(/\s/g, "");
              
              if (!permKey) {
                console.warn(`No permission key found for child menu item: ${childTitle}`);
                return childItem; // Show by default if no permission key
              }
              
              // Check if this specific child menu item has permission data
              if (permissions[permKey]) {
                const perm = permissions[permKey];
                
                // Child menu items need read permission to be shown
                if (typeof perm.read === "boolean" && !perm.read) {
                  return null;
                }
              } else {
                // If no permission data found for this key, check if it's a subItem
                // For subItems, we need to check the parent's subItems object
                const parentKey = Object.keys(permissions).find(key => 
                  permissions[key]?.subItems && permissions[key].subItems[permKey]
                );
                
                if (parentKey && permissions[parentKey]?.subItems?.[permKey]) {
                  const subItemPerm = permissions[parentKey].subItems[permKey];
                  if (typeof subItemPerm.read === "boolean" && !subItemPerm.read) {
                    return null;
                  }
                } else {
                  // If no permission data found at all, hide the item
                  return null;
                }
              }
              
              return childItem;
            })
            .filter(Boolean);
        };

        const finalFilteredMenu = filterMenu(menuItems);
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
    <div
      className={`${className} fixed  top-0 bg-white dark:bg-slate-800 shadow-lg  h-full   w-[248px]`}
    >
      <div className="logo-segment flex justify-between items-center bg-white dark:bg-slate-800 z-[9] h-[85px]  px-4 ">
        <Link to="/dashboard">
          <div className="flex items-center space-x-4">
            <div className="logo-icon">
                <img src={MobileLogo} alt="" className="w-8 h-8"/>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                US Pizza
              </h1>
            </div>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setMobileMenu(!mobileMenu)}
          className="cursor-pointer text-slate-900 dark:text-white text-2xl"
        >
          <Icon icon="heroicons:x-mark" />
        </button>
      </div>

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
  );
};

export default MobileMenu;