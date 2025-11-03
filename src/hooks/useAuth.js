// hooks/useAuth.js
import { useState, useEffect, createContext, useContext } from 'react';
import categoryService from '../api/categoryService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is already logged in (token in localStorage)
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    
    if (token && userData) {
      categoryService.setToken(token);
      setUser(JSON.parse(userData));
      setIsAuthenticated(true);
    }
    
    setLoading(false);
  }, []);

  const login = async (username, passwordHash) => {
    try {
      const response = await categoryService.login(username, passwordHash);
      
      if (response.token) {
        // Store token and user data
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('user_data', JSON.stringify(response.user || { username }));
        
        setUser(response.user || { username });
        setIsAuthenticated(true);
        
        return { success: true, data: response };
      } else {
        throw new Error('No token received');
      }
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    categoryService.setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    isAuthenticated,
    loading,
    user,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for category operations
export const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await categoryService.getCategories();
      setCategories(response.data || []);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (categoryData, imageFile) => {
    try {
      setError(null);
      const response = await categoryService.createCategory(categoryData, imageFile);
      
      // Refresh categories list
      await fetchCategories();
      
      return { success: true, data: response };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const updateCategory = async (id, categoryData, imageFile) => {
    try {
      setError(null);
      const response = await categoryService.updateCategory(id, categoryData, imageFile);
      
      // Refresh categories list
      await fetchCategories();
      
      return { success: true, data: response };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const deleteCategory = async (id) => {
    try {
      setError(null);
      const response = await categoryService.deleteCategory(id);
      
      // Remove from local state
      setCategories(prev => prev.filter(cat => cat.id !== id));
      
      return { success: true, data: response };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const getCategory = async (id) => {
    try {
      setError(null);
      const response = await categoryService.getCategory(id);
      return { success: true, data: response };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  return {
    categories,
    loading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategory
  };
};