import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logOut } from "@/store/api/auth/authSlice";

const useLogout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logOut());
    sessionStorage.clear();
    localStorage.clear();
    navigate("/login");
  };

  return handleLogout;
};

export default useLogout;