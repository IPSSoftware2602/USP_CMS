import { createSlice } from "@reduxjs/toolkit";

const storedUser = JSON.parse(localStorage.getItem("user"));

export const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: storedUser || null,
    isAuth: !!storedUser,
    expired: false, // Add expired flag
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuth = true;
      state.expired = false; // Reset expired flag on login
    },
    logOut: (state) => {
      state.user = null;
      state.isAuth = false;
      state.expired = false;
      sessionStorage.clear();
      localStorage.clear();
    },
    setExpired: (state) => {
      state.expired = true;
      state.isAuth = false;
    }
  },
});

export const { setUser, logOut, setExpired } = authSlice.actions;
export default authSlice.reducer;