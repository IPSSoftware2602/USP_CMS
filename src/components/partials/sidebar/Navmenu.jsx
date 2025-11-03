import React, { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Collapse } from "react-collapse";
import Icon from "@/components/ui/Icon";
// import { toggleActiveChat } from "@/pages/app/chat/store";
import { useDispatch } from "react-redux";
import useMobileMenu from "@/hooks/useMobileMenu";
import Submenu from "./Submenu";
import useLogout from "@/components/logout";

const Navmenu = ({ menus }) => {
  const [activeSubmenu, setActiveSubmenu] = useState(null);

  const toggleSubmenu = (i) => {
    if (activeSubmenu === i) {
      setActiveSubmenu(null);
    } else {
      setActiveSubmenu(i);
    }
  };

  const location = useLocation();
  const locationName = location.pathname.replace("/", "");
  const [mobileMenu, setMobileMenu] = useMobileMenu();
  const [activeMultiMenu, setMultiMenu] = useState(null);
  const dispatch = useDispatch();

  const toggleMultiMenu = (j) => {
    if (activeMultiMenu === j) {
      setMultiMenu(null);
    } else {
      setMultiMenu(j);
    }
  };

  const isLocationMatch = (targetLocation) => {
    return (
      locationName === targetLocation ||
      locationName.startsWith(`${targetLocation}/`)
    );
  };

  const handleLogout = useLogout();

  useEffect(() => {
    let submenuIndex = null;
    let multiMenuIndex = null;
    menus.forEach((item, i) => {
      if (isLocationMatch(item.link)) {
        submenuIndex = i;
      }

      if (item.child) {
        item.child.forEach((childItem, j) => {
          if (isLocationMatch(childItem.childlink)) {
            submenuIndex = i;
          }

          if (childItem.multi_menu) {
            childItem.multi_menu.forEach((nestedItem) => {
              if (isLocationMatch(nestedItem.multiLink)) {
                submenuIndex = i;
                multiMenuIndex = j;
              }
            });
          }
        });
      }
    });
    
    // Extract just the last part of the path for the document title
    const pathParts = locationName.split('/');
    const lastPathPart = pathParts[pathParts.length - 1];
    
    // Format the last path part to be more readable (capitalize first letter, replace underscores with spaces)
    const formattedPathPart = lastPathPart
      .replace(/_/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
    
    document.title = `US Pizza | ${formattedPathPart}`;

    setActiveSubmenu(submenuIndex);
    setMultiMenu(multiMenuIndex);
    // dispatch(toggleActiveChat(false));
    if (mobileMenu) {
      setMobileMenu(false);
    }
  }, [location]);

  return (
    <>
      <ul>
        {menus.map((item, i) => (
          <li
            key={i}
            className={` single-sidebar-menu 
              ${item.child ? "item-has-children" : ""}
              ${activeSubmenu === i ? "open" : ""}
              ${locationName === item.link ? "menu-item-active" : ""}`}
          >
            {/* single menu with no childred*/}
            {!item.child && !item.isHeadr && (
              item.action === "logout" ? (
                <button className="menu-link w-full text-left" onClick={() => handleLogout(item)}>
                  <span className="menu-icon flex-grow-0">
                    <Icon icon={item.icon} />
                  </span>
                  <div className="text-box flex-grow">{item.title}</div>
                  {item.badge && <span className="menu-badge">{item.badge}</span>}
                </button>
              ) : (
                <NavLink className="menu-link" to={item.link}>
                  <span className="menu-icon flex-grow-0">
                    <Icon icon={item.icon} />
                  </span>
                  <div className="text-box flex-grow">{item.title}</div>
                  {item.badge && <span className="menu-badge">{item.badge}</span>}
                </NavLink>
              )
            )}
            {/* only for menulabel
            {item.isHeadr && !item.child && (
              <div className="menulabel">{item.title}</div>
            )} */}
            {/*    !!sub menu parent   */}
            {item.child && (
              <div
                className={`menu-link ${
                  activeSubmenu === i
                    ? "parent_active not-collapsed"
                    : "collapsed"
                }`}
                onClick={() => toggleSubmenu(i)}
              >
                <div className="flex-1 flex items-start">
                  <span className="menu-icon">
                    <Icon icon={item.icon} />
                  </span>
                  <div className="text-box">{item.title}</div>
                </div>
                <div className="flex-0">
                  <div
                    className={`menu-arrow transform transition-all duration-300 ${
                      activeSubmenu === i ? " rotate-90" : ""
                    }`}
                  >
                    <Icon icon="heroicons-outline:chevron-right" />
                  </div>
                </div>
              </div>
            )}

           {item.child && activeSubmenu === i && <Submenu items={item.child} />}

          </li>
        ))}
      </ul>
    </>
  );
};

export default Navmenu;