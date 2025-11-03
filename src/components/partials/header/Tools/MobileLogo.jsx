import React from "react";
import { Link } from "react-router-dom";
import useDarkMode from "@/hooks/useDarkMode";

import MainLogo from "@/assets/images/logo/logo.png";
const MobileLogo = () => {
  const [isDark] = useDarkMode();
  return (
    <Link to="/">
      <img src={MainLogo} alt="" />
    </Link>
  );
};

export default MobileLogo;
