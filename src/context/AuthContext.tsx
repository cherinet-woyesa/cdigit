import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface User {
    id: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
    branchId?: string;
    assignedWindow?: Window | null;
}

interface Window {
    id: string;
    windowNumber: number;
    branchId: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (jwtToken: string) => void;
    logout: () => void;
    loading: boolean;
    updateAssignedWindow: (window: Window | null) => void;
    phone: string | null;
    setPhone: (phone: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [phone, setPhone] = useState<string | null>(null);

    // Load user from local storage on initial mount
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setToken(storedToken);
                setUser(parsedUser);
            } catch (e) {
                console.error("Failed to parse user from local storage", e);
                localStorage.clear();
            }
        }
        setLoading(false);
    }, []);

    const login = (jwtToken: string) => {
        const base64Url = jwtToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const decodedPayload = JSON.parse(window.atob(base64));

        console.log('Decoded JWT Payload:', decodedPayload); // Log the decoded payload

        const [firstName, lastName] = (decodedPayload.unique_name || ' ').split(' ');
        let userRole = decodedPayload.role;

        const userPayload: User = {
            id: decodedPayload.nameid,
            email: decodedPayload.email,
            role: userRole,
            firstName: firstName,
            lastName: lastName,
            branchId: decodedPayload.BranchId ? decodedPayload.BranchId : undefined,
            assignedWindow: null
        };

        localStorage.setItem('token', jwtToken);
        localStorage.setItem('user', JSON.stringify(userPayload));
        setToken(jwtToken);
        setUser(userPayload);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    const updateAssignedWindow = (window: Window | null) => {
        setUser(prevUser => {
            if (!prevUser) return null;
            const updatedUser = { ...prevUser, assignedWindow: window };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            return updatedUser;
        });
    };

    const value = {
        user,
        token,
        isAuthenticated: !!user,
        login,
        logout,
        loading,
        updateAssignedWindow,
        phone,
        setPhone
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};