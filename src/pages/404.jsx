import React from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";

import ErrorImage from "@/assets/images/all-img/404-2.svg";
import { logOut } from "@/store/api/auth/authSlice";
import { clearAllBrowserCookies } from "@/utils/sessionCleanup";

function Error() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleGoHome = () => {
    dispatch(logOut());
    clearAllBrowserCookies();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center text-center py-20 dark:bg-slate-900">
      <img src={ErrorImage} alt="" />
      <div className="max-w-[546px] mx-auto w-full mt-12">
        <h4 className="text-slate-900 mb-4">
          Page not found
        </h4>
        <div className="dark:text-white text-base font-normal mb-10">
          The page you are looking for might have been removed had its name
          changed or is temporarily unavailable.
        </div>
      </div>
      <div className="max-w-[300px] mx-auto w-full">
        <button
          type="button"
          onClick={handleGoHome}
          className="btn btn-dark dark:bg-slate-800 block text-center"
        >
          Go to homepage
        </button>
      </div>
    </div>
  );
}

export default Error;
