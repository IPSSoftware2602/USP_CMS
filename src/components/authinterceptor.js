import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logOut, setExpired } from '@/store/api/auth/authSlice';
import { resetAuthExpiredFlag } from '@/utils/authFetch';
import { toast } from 'react-toastify';

const AuthInterceptor = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { expired } = useSelector(state => state.auth);

  // Handle 'auth:expired' events fired by service classes on 401
  const handleAuthExpired = useCallback(() => {
    dispatch(setExpired());
  }, [dispatch]);

  useEffect(() => {
    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, [handleAuthExpired]);

  useEffect(() => {
    if (expired) {
      // 1. Show toast first to ensure it's registered
      toast.error('Your session has expired. Please log in again.', {
        toastId: 'session-expired', // strictly prevents duplicate toasts
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // 2. Clear Redux state and allow future triggers
      dispatch(logOut());
      resetAuthExpiredFlag(); 
      
      // 3. Redirect to login
      navigate('/');
    }
  }, [expired, dispatch, navigate]);

  return null; // This component doesn't render anything
};

export default AuthInterceptor;