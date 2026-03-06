import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
    _id: string;
    name: string;
    email: string;
    role: 'INTERN' | 'MENTOR' | 'ADMIN';
    cohortId?: string;
    token: string;
}

interface AuthContextType {
    user: User | null;
    login: (userData: User) => void;
    logout: () => void;
    updateUser: (updates: Partial<User>) => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    login: () => { },
    logout: () => { },
    updateUser: () => { },
    isLoading: true
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('cohort-pulse-user');
        const storedToken = localStorage.getItem('cohort-pulse-token');
        if (storedUser && storedToken) {
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    const login = (userData: User) => {
        setUser(userData);
        localStorage.setItem('cohort-pulse-user', JSON.stringify(userData));
        localStorage.setItem('cohort-pulse-token', userData.token);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('cohort-pulse-user');
        localStorage.removeItem('cohort-pulse-token');
    };

    const updateUser = (updates: Partial<User>) => {
        if (!user) return;
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        localStorage.setItem('cohort-pulse-user', JSON.stringify(updatedUser));
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, updateUser, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
