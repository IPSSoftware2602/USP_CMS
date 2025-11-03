import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logOut } from '@/store/api/auth/authSlice';
import { toast } from 'react-toastify';

const AuthInterceptor = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { expired } = useSelector(state => state.auth);

  useEffect(() => {
    if (expired) {
      // Perform cleanup and redirect
      dispatch(logOut());
      toast.error('Your session has expired. Please log in again.', {
        autoClose: 5000,
        hideProgressBar: false,
      });
      navigate('/login');
    }
  }, [expired, dispatch, navigate]);

  return null; // This component doesn't render anything
};

export default AuthInterceptor;