import { VITE_API_BASE_URL } from "@/constant/config";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { setExpired } from "@/store/api/auth/authSlice";

const baseQuery = fetchBaseQuery({
  baseUrl: `${VITE_API_BASE_URL}`,
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.user?.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    headers.set('content-type', 'application/json');
    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions);

  if (result?.error?.status === 401) {
    // Check if the request was for login or register to avoid showing "Session Expired"
    const rawUrl = typeof args === 'string' ? args : args.url;
    const urlPath = rawUrl ? rawUrl.split('?')[0].split('#')[0] : '';
    const isAuthUrl = urlPath === 'login' || urlPath === 'users' || urlPath.endsWith('/login') || urlPath.endsWith('/users');
    
    if (!isAuthUrl) {
      api.dispatch(setExpired());
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User'],
  endpoints: (builder) => ({}),
});