import { apiSlice } from "../apiSlice";
import CryptoJS from 'crypto-js';

const hashPassword = (password) => {
  return CryptoJS.MD5(password).toString();
};

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

    registerUser: builder.mutation({
      query: (userData) => ({
        url: "users",
        method: "POST",
        body: {
          username: userData.username,
          name: userData.name,
          password_hash: hashPassword(userData.password),
          role: userData.role || "user",
          status: userData.status || "active"
        },
      }),
      invalidatesTags: ['User'],
    }),
    
    // Login endpoint
    login: builder.mutation({
      query: (credentials) => ({
        url: "login",
        method: "POST",
        body: {
          username: credentials.username,
          password_hash: hashPassword(credentials.password)
        },
      }),
    }),

    // Logout endpoint
    logout: builder.mutation({
      query: () => ({
        url: "logout",
        method: "POST",
      }),
    }),
  }),
});

export const { 
  useRegisterUserMutation, 
  useLoginMutation,
  useLogoutMutation 
} = authApi;
