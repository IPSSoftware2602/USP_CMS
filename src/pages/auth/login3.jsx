import React from "react";
import { Link } from "react-router-dom";
import LoginForm from "./common/login-form";
import useDarkMode from "@/hooks/useDarkMode";
import Logo from "@/assets/images/logo/logo.png";

const login = () => {
  const [isDark] = useDarkMode();
  return (
    <div className="loginwrapper">
      <div className="lg-inner-column">
        <div className="left-column relative z-[1]">
          <div className="max-w-[100%] pt-72 rtl:pr-20">
            <Link to="/">
              <img src={Logo} alt="USPizza Logo" className="mx-auto"/>
            </Link>
          </div>
        </div>
        <div className="right-column relative">
          <div className="inner-content h-full flex flex-col bg-white dark:bg-slate-800">
            <div className="auth-box h-full flex flex-col justify-center">
              <div className="mobile-logo text-center mb-6 lg:hidden block">
                <Link to="/">
                  <img
                    src={Logo}
                    alt=""
                    className="mx-auto w-32 h-32"
                  />
                </Link>
              </div>
              <div className="text-center 2xl:mb-10 mb-4">
                <h4 className="font-medium">Sign in</h4>
                <div className="text-slate-500 text-base">
                  Sign in to your account to start using US Pizza
                </div>
              </div>
              <LoginForm />
            </div>
            <div className="auth-footer text-center">
              <div className="site-footer px-6 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300 py-4">
                  <div className="grid-cols-1 md:gap-5 text-center">
                    <div className=" text-[10px] whitespace-nowrap">
                      &copy; COPYRIGHT 2025 US PIZZA Malaysia. MY US PIZZA SDN.BHD. 
                      <span className="text-[8px]"> 199701028700 (444199-P) </span>
                      <p>| All rights Reserved |</p> Developed by <a href="https://welcome.ips.com.my/" target="_blank" 
                      rel="noopener noreferrer" className="hover:underline">IPS SOFTWARE SDN.BHD.</a>
                      <span className="text-[8px]"> 202001024359 (1380679-X)</span>
                    </div>
                  </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default login;
