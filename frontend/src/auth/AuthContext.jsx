// src/auth/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté au chargement
    const initAuth = () => {
      try {
        if (authService.isAuthenticated()) {
          const currentUser = authService.getCurrentUser();
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de l\'authentification:', error);
        authService.logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const token = await authService.login(email, password);
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
      return token;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
  setLoading(true);
  try {
    // 1. Enregistrement de l'utilisateur
    const registeredUser = await authService.register(userData);
    
    // 2. Mise à jour de l'état (sans nécessairement se connecter)
    setUser(registeredUser);
    
    return registeredUser;
  } catch (error) {
    console.error('Registration error:', error);
    // Renvoyer l'erreur originale pour une meilleure gestion dans le composant
    throw error;
  } finally {
    setLoading(false);
  }
};

  const loginWithGoogle = async (googleToken) => {
    setLoading(true);
    try {
      const token = await authService.loginWithGoogle(googleToken);
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
      return token;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };
  const registerWithGoogle = async () => {
    setLoading(true);
    try {
      const googleToken = await authService.getGoogleToken(); // à adapter selon ton implémentation
      const token = await authService.registerWithGoogle(googleToken);
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
      return token;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };


  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    registerWithGoogle,
    loginWithGoogle,
    logout,
    loading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};