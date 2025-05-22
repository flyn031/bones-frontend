// src/context/AuthContext.tsx (Restored Original Logic)

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from '../utils/api'; // Assuming apiClient is correctly set up

// Define the User interface matching your data structure from the backend
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
  companyName?: string | null;
  companyAddress?: string | null;
  companyPhone?: string | null;
  companyEmail?: string | null;
  companyWebsite?: string | null;
  companyVatNumber?: string | null;
  companyLogo?: string | null;
  useCompanyDetailsOnQuotes?: boolean;
}

// Define the shape of the context value
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (newUserData: Partial<User>) => void;
  fetchUserProfile: () => Promise<void>;
  loading: boolean;
}

// Provide a default value that matches the shape
const defaultAuthContextValue: AuthContextType = {
    isAuthenticated: false,
    user: null,
    login: () => { console.warn("Login function called before AuthProvider mounted"); },
    logout: () => { console.warn("Logout function called before AuthProvider mounted"); },
    updateUser: () => { console.warn("UpdateUser function called before AuthProvider mounted"); },
    fetchUserProfile: async () => { console.warn("FetchUserProfile function called before AuthProvider mounted"); },
    loading: true, // Start as true, effect will manage it
};

// Create the context
const AuthContext = createContext<AuthContextType>(defaultAuthContextValue);

// Create the Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Start as true

  // --- Logout Function ---
  const logout = useCallback(() => {
    console.log("AuthContext: Logging out user.");
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    setLoading(false); // Ensure loading is false after logout
  }, []); // No dependencies needed

  // --- Fetch User Profile Function ---
  const fetchUserProfile = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.log("AuthContext: No token found, ensuring logged out state.");
        if (isAuthenticated || user) { // Check necessary to prevent infinite state updates if already logged out
             logout();
        }
        setLoading(false); // Mark loading as false if no token
        return;
    }

    console.log("AuthContext: Token found, attempting to fetch user profile...");
    // setLoading(true); // Optional: set loading true specifically for fetch duration if needed elsewhere
    try {
        const response = await apiClient.get<User>('/auth/profile');
        const fetchedUser = response.data;
        console.log("AuthContext: User profile fetched successfully via token:", JSON.stringify(fetchedUser, null, 2));

        setUser(fetchedUser);
        localStorage.setItem('user', JSON.stringify(fetchedUser));
        setIsAuthenticated(true);
        setLoading(false); // Profile fetched, loading complete

    } catch (error: any) {
        console.error('AuthContext: Failed to fetch user profile (token might be invalid/expired):', error.response?.data || error.message);
        logout(); // Logout if profile fetch fails (bad token)
        setLoading(false); // Ensure loading is false on error
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logout]); // Dependencies adjusted - relying on logout stability. Re-add isAuthenticated/user if needed but watch for loops.

  // --- Effect for Initial Authentication Check ---
  // VVVV --- THIS BLOCK IS NOW UNCOMMENTED --- VVVV
  useEffect(() => {
    const checkAuthOnMount = async () => {
      console.log("AuthContext: Initial mount check...");
      setLoading(true); // Start loading

      try {
          // Attempt to fetch the profile directly using the token from storage
          await fetchUserProfile();
      } catch (error) {
          console.error("AuthContext: Error during initial auth check wrapper:", error);
          // fetchUserProfile should handle logout on error, setLoading is handled within it
      } finally {
          // setLoading(false) is now handled within fetchUserProfile
          console.log("AuthContext: Initial mount check flow complete.");
      }
    };
    checkAuthOnMount();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // <<< KEEP dependency array empty [] to ensure it runs only ONCE!
  // ^^^^ --- END OF RESTORED BLOCK --- ^^^^


  // --- Login Function ---
  const login = useCallback(async (token: string, userData: User) => {
    console.log("AuthContext: login function called with user:", userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
    setLoading(false); // Set loading false, as login is complete
  }, []); // No dependencies needed

  // --- Update User Function ---
  const updateUser = useCallback((newUserData: Partial<User>) => {
    setUser(currentUser => {
        if (!currentUser) {
             console.warn("AuthContext: updateUser called, but no current user exists in state.");
             return null;
        }
        const updatedUser = { ...currentUser, ...newUserData };
        console.log("AuthContext: Updating user state:", JSON.stringify(updatedUser, null, 2));
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return updatedUser;
    });
  }, []); // No dependencies needed

  // --- Provide Context Value ---
  const contextValue: AuthContextType = {
    isAuthenticated,
    user,
    login,
    logout,
    updateUser,
    fetchUserProfile,
    loading,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// --- Custom Hook to Use Context ---
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}