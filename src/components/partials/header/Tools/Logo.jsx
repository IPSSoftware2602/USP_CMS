import React from "react";
import useDarkMode from "@/hooks/useDarkMode";
import { Link } from "react-router-dom";
import useWidth from "@/hooks/useWidth";

import MainLogo from "@/assets/images/logo/logo.png";
const Logo = () => {
  const [isDark] = useDarkMode();
  const { width, breakpoints } = useWidth();

  return (
    <div>
      <Link to="/dashboard">
        {width >= breakpoints.xl ? (
          <img src={MainLogo} alt="US Pizza Logo" />
        ) : (
          <img src={MainLogo} alt="US Pizza Logo" className="w-8 h-8" />
        )}
      </Link>
    </div>
  );
};

export default Logo;
