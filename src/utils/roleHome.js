export const AIRBNB_HOME_PATH = "/report/unique_qr";
export const DEFAULT_HOME_PATH = "/dashboard";

export const normalizeRole = (role) => String(role || "").trim().toLowerCase();

export const isAirbnbRole = (role) => normalizeRole(role) === "airbnb";

export const getRoleHomePath = (role) =>
  isAirbnbRole(role) ? AIRBNB_HOME_PATH : DEFAULT_HOME_PATH;

export const getStoredUserRole = () => {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return "";
    const parsed = JSON.parse(raw);
    return parsed?.user?.role || "";
  } catch (error) {
    return "";
  }
};
