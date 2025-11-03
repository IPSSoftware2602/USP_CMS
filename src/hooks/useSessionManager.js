import { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { setUser, logOut, setExpired } from '../store/api/auth/authSlice';

const SESSION_TIMEOUT = 24 * 60 * 60 * 1000;
const WARNING_TIME = 5 * 60 * 1000;

export const useSessionManager = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuth } = useSelector(state => state.auth);
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  // ...existing code...
const { expired } = useSelector(state => state.auth);

const checkSession = useCallback(() => {
  let expireAt = parseInt(sessionStorage.getItem('expireAt'), 10);
  const token = sessionStorage.getItem('token');
  const now = Date.now();

  if (!expireAt) {
    expireAt = parseInt(localStorage.getItem('expireAt'), 10);
    if (expireAt) {
      sessionStorage.setItem('expireAt', expireAt.toString());
      sessionStorage.setItem('expireAtDate', new Date(expireAt).toISOString());
    }
  }

  if (!token || !expireAt || now > expireAt) {
    if (!expired) dispatch(setExpired());
    return { isValid: false, timeLeft: 0 };
  }

  const timeLeft = expireAt - now;
  return {
    isValid: true,
    timeLeft,
    shouldWarn: timeLeft <= WARNING_TIME && timeLeft > 0
  };
}, [dispatch, expired]);
// ...existing code...

  const initSession = useCallback((userData = null) => {
    const now = Date.now();
    const expireAt = now + SESSION_TIMEOUT;
    
    localStorage.setItem('expireAt', expireAt.toString());
    localStorage.setItem('expireAtDate', new Date(expireAt).toISOString());
    sessionStorage.setItem('expireAt', expireAt.toString());
    sessionStorage.setItem('expireAtDate', new Date(expireAt).toISOString());
    sessionStorage.setItem('lastActive', now.toString());
    sessionStorage.setItem('lastActiveDate', new Date(now).toISOString());
    
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
      sessionStorage.setItem('token', userData.token);
      sessionStorage.setItem('user', JSON.stringify(userData));
      dispatch(setUser(userData));
    }

    setShowWarning(false);
    setDismissed(false);
    setIsInitialized(true);
  }, [dispatch]);

  const updateActivity = useCallback(() => {
    if (isAuth) {
      const now = Date.now();
      const expireAt = now + SESSION_TIMEOUT;
      
      localStorage.setItem('expireAt', expireAt.toString());
      localStorage.setItem('expireAtDate', new Date(expireAt).toISOString());
      sessionStorage.setItem('expireAt', expireAt.toString());
      sessionStorage.setItem('expireAtDate', new Date(expireAt).toISOString());
      sessionStorage.setItem('lastActive', now.toString());
      sessionStorage.setItem('lastActiveDate', new Date(now).toISOString());
      
      if (showWarning) {
        setShowWarning(false);
        setDismissed(false);
      }
    }
  }, [isAuth, showWarning]);

// Modify handleSessionExpiry to use setExpired
const handleSessionExpiry = useCallback(() => {
  sessionStorage.clear();
  localStorage.removeItem('user');
  localStorage.removeItem('expireAt');
  localStorage.removeItem('expireAtDate');
  
  dispatch(setExpired()); // Use setExpired instead of logOut
  setShowWarning(false);
  setDismissed(false);
  setIsInitialized(false);
  toast.error('Your session has expired. Please log in again.');
  navigate('/login');
}, [dispatch, navigate]);


  const checkAutoLogin = useCallback(() => {
    const storedUser = localStorage.getItem('user');
    let expireAt = parseInt(localStorage.getItem('expireAt'), 10);
    if (!expireAt) {
      expireAt = parseInt(sessionStorage.getItem('expireAt'), 10);
    }
    
    const now = Date.now();
    
    console.log('Auto login check:', {
      hasStoredUser: !!storedUser,
      expireAt,
      now,
      isExpired: expireAt ? now > expireAt : true,
      isAuth,
      isInitialized
    });

    if (isInitialized && isAuth) {
      return true;
    }
    
    if (storedUser) {
      if (expireAt && now < expireAt) {
        try {
          const userData = JSON.parse(storedUser);
          console.log('Auto login successful for user:', userData.username);

          const newExpireAt = now + SESSION_TIMEOUT;
          localStorage.setItem('expireAt', newExpireAt.toString());
          localStorage.setItem('expireAtDate', new Date(newExpireAt).toISOString());
          sessionStorage.setItem('expireAt', newExpireAt.toString());
          sessionStorage.setItem('expireAtDate', new Date(newExpireAt).toISOString());
          sessionStorage.setItem('lastActive', now.toString());
          sessionStorage.setItem('lastActiveDate', new Date(now).toISOString());
          sessionStorage.setItem('token', userData.token);
          sessionStorage.setItem('user', JSON.stringify(userData));
          
          dispatch(setUser(userData));
          setIsInitialized(true);
          return true;
        } catch (error) {
          console.error('Error parsing stored user data:', error);
          localStorage.removeItem('user');
          localStorage.removeItem('expireAt');
          localStorage.removeItem('expireAtDate');
          sessionStorage.clear();
          setIsInitialized(true);
          return false;
        }
      } else {
        console.log('Session expired or no expiration time, clearing storage');
        localStorage.removeItem('user');
        localStorage.removeItem('expireAt');
        localStorage.removeItem('expireAtDate');
        sessionStorage.clear();
      }
    }
    
    setIsInitialized(true);
    return false;
  }, [dispatch, isAuth, isInitialized]);

  const extendSession = useCallback(() => {
    if (isAuth) {
      const now = Date.now();
      const expireAt = now + SESSION_TIMEOUT;
      
      localStorage.setItem('expireAt', expireAt.toString());
      localStorage.setItem('expireAtDate', new Date(expireAt).toISOString());
      sessionStorage.setItem('expireAt', expireAt.toString());
      sessionStorage.setItem('expireAtDate', new Date(expireAt).toISOString());
      sessionStorage.setItem('lastActive', now.toString());
      sessionStorage.setItem('lastActiveDate', new Date(now).toISOString());
      
      toast.success('Session extended successfully!');
    }
  }, [dispatch, isAuth, isInitialized]);

  const handleLogout = useCallback(() => {
    sessionStorage.clear();
    localStorage.removeItem('user');
    localStorage.removeItem('expireAt');
    localStorage.removeItem('expireAtDate');
    localStorage.clear();
    
    dispatch(logOut());
    setShowWarning(false);
    setDismissed(false);
    setIsInitialized(false);
    toast.info('Logged out successfully');
    navigate('/login');
  }, [dispatch, navigate]);

  const dismissWarning = useCallback(() => {
    setDismissed(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) {
      checkAutoLogin();
    }
  }, [checkAutoLogin, isInitialized]);

  useEffect(() => {
    if (!isAuth || !isInitialized) return;

    const events = ['mousedown', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    const sessionInterval = setInterval(() => {
      const sessionStatus = checkSession();
      
      if (!sessionStatus.isValid) {
        handleSessionExpiry();
        return;
      }
      
      setTimeLeft(sessionStatus.timeLeft);
      
      if (sessionStatus.shouldWarn && !dismissed) {
        setShowWarning(true);
      } else if (!sessionStatus.shouldWarn) {
        setShowWarning(false);
        setDismissed(false);
      }
    }, 1000); 

    const sessionStatus = checkSession();
    setTimeLeft(sessionStatus.timeLeft);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
      clearInterval(sessionInterval);
    };
  }, [isAuth, isInitialized, updateActivity, checkSession, handleSessionExpiry, dismissed]);

  const formatTimeLeft = useCallback((milliseconds) => {
    const minutes = Math.floor(milliseconds / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const getExpirationInfo = useCallback(() => {
    let expireAt = parseInt(sessionStorage.getItem('expireAt'), 10);
    if (!expireAt) {
      expireAt = parseInt(localStorage.getItem('expireAt'), 10);
    }
    
    if (!expireAt) return null;
    
    const expireDate = new Date(expireAt);
    return {
      timestamp: expireAt,
      dateString: expireDate.toLocaleString(),
      isoString: expireDate.toISOString()
    };
  }, []);

  const isInWarningPeriod = useCallback(() => {
    return timeLeft <= WARNING_TIME && timeLeft > 0;
  }, [timeLeft]);

  const getSessionHealth = useCallback(() => {
    const totalTime = SESSION_TIMEOUT;
    const percentage = (timeLeft / totalTime) * 100;
    
    if (percentage > 80) return 'excellent';
    if (percentage > 60) return 'good';
    if (percentage > 40) return 'fair';
    if (percentage > 20) return 'warning';
    return 'critical';
  }, [timeLeft]);

  return {
    // State
    showWarning: showWarning && !dismissed,
    timeLeft,
    timeLeftFormatted: formatTimeLeft(timeLeft),
    timeLeftMs: timeLeft,
    dismissed,
    isInWarningPeriod: isInWarningPeriod(),
    sessionHealth: getSessionHealth(),
    expirationInfo: getExpirationInfo(),
    isInitialized,
    
    // Actions
    initSession,
    updateActivity,
    checkSession,
    checkAutoLogin,
    extendSession,
    handleLogout,
    handleSessionExpiry,
    dismissWarning,
    
    // Utilities
    formatTimeLeft,
    getExpirationInfo,
    isInWarningPeriod,
    getSessionHealth
  };
};