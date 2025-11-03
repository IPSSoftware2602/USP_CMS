import React, { useState } from "react";
import { Collapse } from "react-collapse";
import { NavLink } from "react-router-dom";
import Icon from "@/components/ui/Icon";

const Submenu = ({ items }) => {
  const [openIndex, setOpenIndex] = useState(null);

  const handleToggle = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  if (!items) return null;

  return (
    <ul className="sub-menu space-y-4">
      {items.map((subItem, j) => (
        <li key={j} className="block pl-4 pr-1 first:pt-4 last:pb-4">
          {subItem.child ? (
            <>
              <div
                onClick={() => handleToggle(j)}
                className={`${
                  openIndex === j
                    ? "text-black dark:text-white font-medium"
                    : "text-slate-600 dark:text-slate-300"
                } text-sm flex space-x-3 items-center transition-all duration-150 cursor-pointer rtl:space-x-reverse`}
              >
                <span
                  className={`${
                    openIndex === j
                      ? "bg-slate-900 dark:bg-slate-300 ring-4 ring-opacity-[15%] ring-black-500 dark:ring-slate-300 dark:ring-opacity-20"
                      : ""
                  } h-2 w-2 rounded-full border border-slate-600 dark:border-white inline-block flex-none`}
                ></span>
                <span className="flex-1">{subItem.childtitle || subItem.title}</span>
                <span className="flex-none">
                  <span
                    className={`menu-arrow transform transition-all duration-300 ${
                      openIndex === j ? "rotate-90" : ""
                    }`}
                  >
                    <Icon icon="ph:caret-right" />
                  </span>
                </span>
              </div>
              <Collapse isOpened={openIndex === j}>
                <Submenu items={subItem.child} />
              </Collapse>
            </>
          ) : (
            <NavLink to={subItem.childlink || subItem.link}>
              {({ isActive }) => (
                <span
                  className={`${
                    isActive
                      ? "text-black dark:text-white font-medium"
                      : "text-slate-600 dark:text-slate-300"
                  } text-sm flex space-x-3 items-center transition-all duration-150 rtl:space-x-reverse`}
                >
                  <span
                    className={`${
                      isActive
                        ? "bg-slate-900 dark:bg-slate-300 ring-4 ring-opacity-[15%] ring-black-500 dark:ring-slate-300 dark:ring-opacity-20"
                        : ""
                    } h-2 w-2 rounded-full border border-slate-600 dark:border-white inline-block flex-none`}
                  ></span>
                  <span className="flex-1">{subItem.childtitle || subItem.title}</span>
                </span>
              )}
            </NavLink>
          )}
        </li>
      ))}
    </ul>
  );
};

export default Submenu;
