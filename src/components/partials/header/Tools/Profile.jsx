import React from "react";
import Dropdown from "@/components/ui/Dropdown";
import Icon from "@/components/ui/Icon";
import { Menu, Transition } from "@headlessui/react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logOut } from "@/store/api/auth/authSlice";

 const profileLabel = (user) => (
  <div className="flex items-center">
    <div className="flex-none text-slate-600 dark:text-white text-sm font-normal items-center lg:flex hidden overflow-hidden text-ellipsis whitespace-nowrap">
      <span className="overflow-hidden text-ellipsis whitespace-nowrap w-[85px] block">
        {user?.name || user?.username || "User"}
      </span>
      <span className="text-base inline-block ltr:ml-[10px] rtl:mr-[10px]">
        <Icon icon="heroicons-outline:chevron-down"></Icon>
      </span>
    </div>
  </div>
);

const Profile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const handleLogout = () => {
    dispatch(logOut());
  };

  const ProfileMenu = [
    {
      label: "Logout",
      icon: "heroicons-outline:arrow-right-on-rectangle",
      action: () => {
        dispatch(handleLogout);
      },
    },
  ];

  return (
      <Dropdown label={profileLabel(user)} classMenuItems="w-[250px] top-[58px]">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center">
            <div className="flex flex-col">
              <span className="text-slate-800 dark:text-white font-medium">
                {user?.name || user?.username || "User"}
            </span>
            <span className="text-slate-500 dark:text-slate-300 text-sm">
                {user?.email || ""}
              </span>
            </div>
          </div>
        </div>
        {ProfileMenu.map((item, index) => (
          <Menu.Item key={index}>
            {({ active }) => (
              <div
                onClick={() => item.action()}
                className={`${
                  active
                    ? "bg-slate-100 text-slate-900 dark:bg-slate-600 dark:text-slate-300 dark:bg-opacity-50"
                    : "text-slate-600 dark:text-slate-300"
                } block     ${
                  item.hasDivider
                    ? "border-t border-slate-100 dark:border-slate-700"
                    : ""
                }`}
              >
                <div className={`block cursor-pointer px-4 py-3`}>
                  <div className="flex items-center">
                    <span className="block text-xl ltr:mr-3 rtl:ml-3">
                      <Icon icon={item.icon} />
                    </span>
                    <span className="block text-sm">{item.label}</span>
                  </div>
                </div>
              </div>
            )}
          </Menu.Item>
        ))}
      </Dropdown>
  );
};

export default Profile;
