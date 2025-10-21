import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface User {
    id: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
    token: string;
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

    // Enhanced JWT decoding function
    const decodeJWT = (jwtToken: string) => {
        try {
            const base64Url = jwtToken.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const decodedPayload = JSON.parse(window.atob(base64));
            return decodedPayload;
        } catch (error) {
            console.error('Failed to decode JWT token:', error);
            throw new Error('Invalid JWT token');
        }
    };

    // Enhanced role extraction function
    const extractUserRole = (decodedPayload: any): string => {
        // Try multiple possible role claim names
        const roles = decodedPayload.role || 
                     decodedPayload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
                     decodedPayload.roles ||
                     decodedPayload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role'];
        
        // Handle different role formats
        if (Array.isArray(roles)) {
            return roles[0] || 'Customer';
        } else if (typeof roles === 'string') {
            return roles;
        } else if (decodedPayload.roleName) {
            return decodedPayload.roleName;
        }
        
        // Default fallback
        return 'Customer';
    };

    // Enhanced branch ID extraction
    const extractBranchId = (decodedPayload: any): string | undefined => {
        return decodedPayload.BranchId || 
               decodedPayload.branchId || 
               decodedPayload.BranchID ||
               decodedPayload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/branch'];
    };

    // Enhanced user info extraction
    const extractUserInfo = (decodedPayload: any) => {
        const accountHolderName = decodedPayload.unique_name || 
                                decodedPayload.name || 
                                decodedPayload.preferred_username ||
                                'User';
        
        const [firstName, ...lastNameParts] = accountHolderName.split(' ');
        const lastName = lastNameParts.join(' ') || 'User';
        
        const userId = decodedPayload.nameid || 
                      decodedPayload.sub || 
                      decodedPayload.userId ||
                      `user_${Date.now()}`;
        
        const userEmail = decodedPayload.email || 
                         decodedPayload.unique_name || 
                         decodedPayload.preferred_username ||
                         `${userId}@cbe.et`;

        return { firstName, lastName, userId, userEmail };
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
                
                console.log('AuthContext: Loaded user from storage', {
                    role: parsedUser.role,
                    branchId: parsedUser.branchId,
                    isStaff: ['Maker', 'Admin', 'Manager', 'Auditor', 'Authorizer', 'Greeter'].includes(parsedUser.role)
                });
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
        try {
            const decodedPayload = decodeJWT(jwtToken);
            console.log('AuthContext: Decoded JWT Payload:', decodedPayload);

            // Extract user information
            const userRole = extractUserRole(decodedPayload);
            const branchId = extractBranchId(decodedPayload);
            const { firstName, lastName, userId, userEmail } = extractUserInfo(decodedPayload);

            // Log role detection for debugging
            console.log('AuthContext: Detected user role:', userRole);
            console.log('AuthContext: Detected branch ID:', branchId);
            console.log('AuthContext: Is staff user:', ['Maker', 'Admin', 'Manager', 'Auditor', 'Authorizer', 'Greeter'].includes(userRole));

            const userPayload: User = {
                id: userId,
                email: userEmail,
                role: userRole,
                token: jwtToken,
                firstName: firstName,
                lastName: lastName,
                branchId: branchId,
                assignedWindow: userData?.assignedWindow || null
            };

            console.log('AuthContext: Created User Payload:', userPayload);

            // Store in localStorage and state
            localStorage.setItem('token', jwtToken);
            localStorage.setItem('user', JSON.stringify(userPayload));
            setToken(jwtToken);
            setUser(userPayload);

            // Clear phone if this is a staff login (staff don't use phone-based auth)
            if (['Maker', 'Admin', 'Manager', 'Auditor', 'Authorizer', 'Greeter'].includes(userRole)) {
                setPhone(null);
                localStorage.removeItem('phone');
            }

        } catch (error) {
            console.error('AuthContext: Login failed:', error);
            throw error;
        }
    };

    const logout = () => {
        console.log('AuthContext: Logging out user');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('phone');
        localStorage.removeItem('lastActiveBranchId');
        localStorage.removeItem('selectedBranch');
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
        if (user && user.branchId !== branchId) {
            const updatedUser = { ...user, branchId };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            localStorage.setItem('lastActiveBranchId', branchId);
            
            console.log('AuthContext: Updated user branch to:', branchId);
        }
    };

    // Helper function to check if user is staff
    const isStaffUser = user?.role && ['Maker', 'Admin', 'Manager', 'Auditor', 'Authorizer', 'Greeter'].includes(user.role);

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

// FIXED: Make sure useAuth is properly exported
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};