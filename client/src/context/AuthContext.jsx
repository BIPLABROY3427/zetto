import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../services/apiClient';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = () => {
            const storedUser = localStorage.getItem('getway_user');
            if (storedUser) {
                try {
                    setUser(JSON.parse(storedUser));
                } catch (error) {
                    console.error('Failed to parse user from local storage:', error);
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
