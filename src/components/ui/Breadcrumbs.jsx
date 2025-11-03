import React from "react";
import { useLocation, NavLink } from "react-router-dom";
import { menuItems } from "@/constant/data";
import Icon from "@/components/ui/Icon";

const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  const isDynamicSegment = (segment) => {

    return /^\d+$/.test(segment) || /^[0-9a-fA-F-]{24,36}$/.test(segment);

    // const numericMatch = /^\d+$/.test(segment);
    // const uuidMatch = /^[0-9a-fA-F-]{24,36}$/.test(segment);

    // return {
    //   isDynamic: numericMatch || uuidMatch,
    //   param: numericMatch || uuidMatch ? segment : null,
    // };
  };

  // Function to get menu item details from path
  const getMenuDetails = (path) => {
    const mainItem = menuItems.find((item) => item.link === path);
    if (mainItem) {
      return {
        title: mainItem.title || path.replace(/_/g, ' '),
        isHide: false,
        foundInmenu: true
      };
    }

    const parentItem = menuItems.find((item) =>
      item.child?.some((child) => child.childlink === path)
    );

    if (parentItem) {
      const childItem = parentItem.child.find((child) => child.childlink === path);
      return {
        title: childItem.childtitle || path.replace(/_/g, ' '),
        parentTitle: parentItem.title,
        isHide: false,
        foundInmenu: true
      };
    }

    return {
      title: path.replace(/_/g, ' ').replace(/-/g, ' '),
      isHide: false,
      foundInmenu: false
    };
  };

  const breadcrumbItems = pathnames.map((path, index) => {
    const routeTo = `/${pathnames.slice(0, index + 1).join("/")}`;
    const details = getMenuDetails(path);

    if (index === pathnames.length - 1) {
      return {
        path,
        routeTo,
        title: details.title,
        isCurrent: true,
        isHide: isDynamicSegment(path) || details.isHide,
        notInMenu: !details.foundInmenu
      };
    }

    return {
      path,
      routeTo,
      title: details.title,
      isCurrent: false,
      isHide: isDynamicSegment(path) || details.isHide,
      notInMenu: !details.foundInmenu
    };
  });

  return (
    <div className="md:mb-6 mb-4 flex space-x-3 rtl:space-x-reverse">
      <ul className="breadcrumbs">
        <li className="text-indigo-900">
          <NavLink to="/dashboard" className="text-lg">
            <Icon icon="heroicons-outline:home" />
          </NavLink>
          <span className="breadcrumbs-icon rtl:transform rtl:rotate-180">
            <Icon icon="heroicons:chevron-right" />
          </span>
        </li>

        {/* Map through breadcrumb items */}
        {breadcrumbItems.filter(item => !item.isHide)
          .map((item, index) => (
            <li key={item.path} className={item.isCurrent ? "capitalize text-slate-500 dark:text-slate-400" : "text-indigo-900"}>
              {item.isCurrent || item.notInMenu ? (
                <>
                  <span className="capitalize text-slate-500 dark:text-slate-400">
                    {item.title}
                  </span>
                  <span className="breadcrumbs-icon rtl:transform rtl:rotate-180">
                    <Icon icon="heroicons:chevron-right" />
                  </span>
                </>
              ) : (
                <>
                  <NavLink to={item.routeTo} className="capitalize">
                    {item.title}
                  </NavLink>
                  <span className="breadcrumbs-icon rtl:transform rtl:rotate-180">
                    <Icon icon="heroicons:chevron-right" />
                  </span>
                </>
              )}
            </li>
          ))}
      </ul>
    </div>
  );
};

export default Breadcrumbs;