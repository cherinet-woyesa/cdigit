import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

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
    login: (jwtToken: string, userData?: Partial<User>) => void;
    logout: () => void;
    loading: boolean;
    updateAssignedWindow: (window: Window | null) => void;
    updateUserBranch: (branchId: string) => void;
    phone: string | null;
    setPhone: (newPhone: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [phone, setPhoneState] = useState<string | null>(null);

    const setPhone = (newPhone: string | null) => {
        if (newPhone) {
            localStorage.setItem('phone', newPhone);
        } else {
            localStorage.removeItem('phone');
        }
        setPhoneState(newPhone);
    };

    // Load user from local storage on initial mount
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        const storedPhone = localStorage.getItem('phone');

        if (storedToken && storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setToken(storedToken);
                setUser(parsedUser);
                if (storedPhone) {
                    setPhoneState(storedPhone);
                }
            } catch (e) {
                console.error("Failed to parse user from local storage", e);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('phone');
            }
        }
        setLoading(false);
    }, []);

    const login = (jwtToken: string, userData?: Partial<User>) => {
        const base64Url = jwtToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const decodedPayload = JSON.parse(window.atob(base64));

        console.log('Decoded JWT Payload:', decodedPayload);

        const [firstName, lastName] = (decodedPayload.unique_name || ' ').split(' ');
        const userRole = decodedPayload.role || userData?.role || 'Customer';
        const branchId = decodedPayload.BranchId || userData?.branchId;

        const userPayload: User = {
            id: decodedPayload.nameid || userData?.id || '',
            email: decodedPayload.email || userData?.email || '',
            role: userRole,
            firstName: firstName || userData?.firstName || '',
            lastName: lastName || userData?.lastName || '',
            branchId: branchId,
            assignedWindow: userData?.assignedWindow || null
        };

        localStorage.setItem('token', jwtToken);
        localStorage.setItem('user', JSON.stringify(userPayload));
        setToken(jwtToken);
        setUser(userPayload);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('phone');
        localStorage.removeItem('lastActiveBranchId');
        setUser(null);
        setToken(null);
        setPhoneState(null);
    };

    const updateAssignedWindow = (window: Window | null) => {
        if (user) {
            const updatedUser = { ...user, assignedWindow: window };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
        }
    };

    // Update user data when branch is selected
    const updateUserBranch = (branchId: string) => {
        if (user) {
            const updatedUser = { ...user, branchId };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            localStorage.setItem('lastActiveBranchId', branchId);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isAuthenticated: !!user,
            login,
            logout,
            loading,
            updateAssignedWindow,
            updateUserBranch,
            phone,
            setPhone
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};