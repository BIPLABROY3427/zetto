import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../services/apiClient';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            const storedUser = localStorage.getItem('getway_user');
            if (storedUser) {
                try {
                    // Temporarily set user from local storage for fast render
                    setUser(JSON.parse(storedUser));
                    
                    // Fetch latest profile to update permissions in background
                    const response = await apiClient.get('/users/me');
                    if (response.data?.user) {
                        const fetchedUser = response.data.user;
                        const userRoleData = {
                            ...fetchedUser,
                            id: fetchedUser._id,
                            permissions: fetchedUser.customRole ? fetchedUser.customRole.permissions : null
                        };
                        setUser(userRoleData);
                        localStorage.setItem('getway_user', JSON.stringify(userRoleData));
                    }
                } catch (error) {
                    console.error('Failed to parse or fetch user:', error);
                }
            }
            setLoading(false);
        };
        
        loadUser();

        // Listen for token refresh events
        const handleTokenRefreshed = (e) => {
            console.log('Token refreshed automatically', e.detail.token);
        };

        // Listen for automatic logout events (e.g., when refresh token expires)
        const handleLogoutEvent = () => {
            setUser(null);
            // Optionally redirect to login page here if not handled by a router wrapper
            window.location.href = '/login';
        };

        window.addEventListener('auth:tokenRefreshed', handleTokenRefreshed);
        window.addEventListener('auth:logout', handleLogoutEvent);

        return () => {
            window.removeEventListener('auth:tokenRefreshed', handleTokenRefreshed);
            window.removeEventListener('auth:logout', handleLogoutEvent);
        };
    }, []);

    const login = (userData, token, refreshToken) => {
        setUser(userData);
        localStorage.setItem('getway_user', JSON.stringify(userData));
        localStorage.setItem('getway_token', token);
        if (refreshToken) {
            localStorage.setItem('getway_refresh_token_fallback', refreshToken);
        }
    };

    const logout = async () => {
        try {
            // Optional: Call logout endpoint if your backend supports it
            await apiClient.post('/auth/logout');
        } catch (error) {
            console.error('Logout request failed', error);
        } finally {
            setUser(null);
            localStorage.removeItem('getway_user');
            localStorage.removeItem('getway_token');
            localStorage.removeItem('getway_refresh_token_fallback');
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
