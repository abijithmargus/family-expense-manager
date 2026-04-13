import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginWithGoogle } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);        // This will hold the JWT access_token
  const [isLoading, setIsLoading] = useState(true);

  // Load saved auth data on app start
  useEffect(() => {
    const savedToken = localStorage.getItem('access_token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (googleIdToken) => {
    try {
      const response = await loginWithGoogle(googleIdToken);

      const { access_token, user: userData } = response.data;   // ← Fixed here

      setToken(access_token);
      setUser(userData);

      // Save to localStorage
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));

      console.log("Login successful - JWT stored");
    } catch (err) {
      console.error("Google login failed:", err.response?.data || err.message);
      throw err;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    console.log("User logged out");
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      isLoading, 
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);