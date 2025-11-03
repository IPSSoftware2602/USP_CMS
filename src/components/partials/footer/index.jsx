import React from "react";
import useFooterType from "@/hooks/useFooterType";

const Footer = ({ className = "custom-class" }) => {
  const [footerType] = useFooterType();
  const footerclassName = () => {
    switch (footerType) {
      case "sticky":
        return "sticky bottom-0 z-[999]";
      case "static":
        return "static";
      case "hidden":
        return "hidden";
    }
  };
  return (
    <footer className={className + " " + footerclassName()}>
      <div className="site-footer px-6 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300 py-4">
        <div className="grid md:grid-cols-2 grid-cols-1 md:gap-5">
          <div className="text-center text-[11px] ltr:md:text-start rtl:md:text-right max-lg:text-[9px] max-md:text-[7px] whitespace-nowrap">
            &copy; COPYRIGHT 2025 US PIZZA Malaysia. MY US PIZZA SDN.BHD. 
            <span className="text-[8px]"> 199701028700 (444199-P) </span>
            | All rights Reserved | Developed by <a href="https://welcome.ips.com.my/" target="_blank" 
            rel="noopener noreferrer" className="hover:underline">IPS SOFTWARE SDN.BHD.</a>
            <span className="text-[8px] max-lg:text-[6px] max-md:text-[5px]"> 202001024359 (1380679-X)</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
