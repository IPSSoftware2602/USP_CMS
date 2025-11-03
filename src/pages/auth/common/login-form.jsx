import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

import { useLoginMutation } from "@/store/api/auth/authApiSlice";
import { useSessionManager } from "@/hooks/useSessionManager";
import Button from "@/components/ui/Button";
import Textinput from "@/components/ui/Textinput";
import { Icon } from "@iconify/react";

const schema = yup.object({
  username: yup.string().required("Username is Required"),
  password: yup.string().required("Password is Required"),
});

const LoginForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuth } = useSelector(state => state.auth);
  const [login, { isLoading: apiLoading }] = useLoginMutation();
  const [showPassword, setShowPassword] = useState(false);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState("");
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { initSession, checkAutoLogin, handleSessionExpiry } = useSessionManager();

  const {
    register,
    formState: { errors },
    handleSubmit,
    reset,
    setValue,
  } = useForm({
    resolver: yupResolver(schema),
    mode: "all",
  });

  useEffect(() => {
  const usernameInput = document.querySelector('input[name="username"]');
  const passwordInput = document.querySelector('input[name="password"]');

  if (usernameInput?.value) {
    setValue("username", usernameInput.value, { shouldValidate: true });
  }
  if (passwordInput?.value) {
    setValue("password", passwordInput.value, { shouldValidate: true });
  }
}, [setValue]);


  useEffect(() => {
    if (autoLoginAttempted) return;

    const urlParams = new URLSearchParams(location.search);
    const sessionExpired = urlParams.get('sessionExpired');
    const returnUrl = urlParams.get('returnUrl');

    if (sessionExpired === 'true') {
      setSessionExpiredMessage("Your session has expired. Please log in again to continue.");
      toast.warn("Session expired. Please log in again.", {
        position: "top-right",
        autoClose: 4000,
      });
      
      handleSessionExpiry();
      sessionStorage.clear();
      localStorage.removeItem('user');
      dispatch(logOut());
      navigate('/login', { replace: true , state: { sessionExpired: true } });
      return;
    }

    const autoLoginSuccess = checkAutoLogin();
    setAutoLoginAttempted(true);

    if (autoLoginSuccess) {
      toast.success("Welcome back! Session restored.", {
        position: "top-right",
        autoClose: 2000,
      });
      
      const redirectUrl = returnUrl || '/dashboard';
      navigate(redirectUrl, { replace: true });
    }
  }, [location.search, navigate, checkAutoLogin, autoLoginAttempted]);

  useEffect(() => {
    if (isAuth && autoLoginAttempted) {
      const urlParams = new URLSearchParams(location.search);
      const returnUrl = urlParams.get('returnUrl') || '/dashboard';
      navigate(returnUrl, { replace: true });
    }
  }, [isAuth, navigate, location.search, autoLoginAttempted]);

  const handleInputChange = () => {
    if (sessionExpiredMessage) {
      setSessionExpiredMessage("");
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    
    try {
      // const loadingToast = toast.loading("Signing in...", {
      //   position: "top-right",
      // });

      const response = await login({
        username: data.username,
        password: data.password,
      }).unwrap();

      // toast.dismiss(loadingToast);

      if (response.token && response.userData) {
        const userDataToStore = {
          token: response.token,
          user: response.userData,
          username: response.userData.username || data.username,
          loginTime: new Date().toISOString(),
        };
        
        initSession(userDataToStore);
        
        setSessionExpiredMessage("");
        
        toast.success(response.message || "Login Successful", {
          position: "top-right",
          autoClose: 2000,
        });

        const urlParams = new URLSearchParams(location.search);
        const returnUrl = urlParams.get('returnUrl') || '/dashboard';

        reset();
        
        navigate(returnUrl, { replace: true });

      } else {
        throw new Error("Invalid response format: Missing token or user data");
      }
    } catch (error) {
      console.error("Login error:", error);
      
      let errorMessage = "Login failed. Please try again.";
      
      if (error.status === 400) {
        errorMessage = "Invalid username or password";
      } else if (error.status === 401) {
        errorMessage = "Invalid credentials. Please check your username and password.";
      } else if (error.status === 403) {
        errorMessage = "Account access denied. Please contact administrator.";
      } else if (error.status === 404) {
        errorMessage = "User account not found";
      } else if (error.status === 422) {
        errorMessage = "Invalid input. Please check your credentials.";
      } else if (error.status === 429) {
        errorMessage = "Too many login attempts. Please try again later.";
      } else if (error.status >= 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (error.data?.message) {
        errorMessage = error.data.message;
      } else if (error.data?.error) {
        errorMessage = error.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      sessionStorage.clear();
      localStorage.removeItem('user');
      
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 4000,
      });
      
      setValue('password', '');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuth && autoLoginAttempted) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-center">
          <Icon icon="eos-icons:loading" className="w-8 h-8 mx-auto mb-4 text-slate-600" />
          <p className="text-slate-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  const isCurrentlyLoading = isSubmitting || apiLoading;

  return (
    <div className="space-y-4">
      {sessionExpiredMessage && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
          <div className="flex">
            <Icon icon="heroicons:exclamation-triangle" className="w-5 h-5 text-yellow-400 mt-0.5 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Session Expired</h3>
              <p className="text-sm text-yellow-700 mt-1">{sessionExpiredMessage}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Textinput
          autoComplete="username"
          name="username"
          label="Username"
          placeholder="Enter your username"
          type="text"
          register={register}
          error={errors?.username}
          className="h-[48px]"
          onInput={(e) => setValue("username", e.target.value, { shouldValidate: true })}
        />
        
        <Textinput
          autoComplete="current-password"
          name="password"
          label="Password"
          placeholder="Enter your password"
          type={showPassword ? "text" : "password"}
          register={register}
          error={errors?.password}
          className="h-[48px]"
          onInput={(e) => setValue("password", e.target.value, { shouldValidate: true })}
          suffix={
            <Icon
              icon={showPassword ? "heroicons:eye" : "heroicons:eye-slash"}
              className="w-4 h-4 cursor-pointer text-slate-400 hover:text-slate-600"
              onClick={() => setShowPassword(!showPassword)}
            />
          }
        />

        <Button
          type="submit"
          text={isCurrentlyLoading ? "Signing in..." : "Sign in"}
          className="btn btn-dark block w-full text-center"
          isLoading={isCurrentlyLoading}
          disabled={isCurrentlyLoading}
        />
      </form>
    </div>
  );
};

export default LoginForm;