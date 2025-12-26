
import { User, Country, PaymentStatus } from '../types';

let currentUserCache: User | null = null;

const getLocalUserRegistry = (): User[] => {
    const stored = localStorage.getItem('sag_mock_user_registry');
    return stored ? JSON.parse(stored) : [];
};

const saveToLocalUserRegistry = (user: User) => {
    const registry = getLocalUserRegistry();
    localStorage.setItem('sag_mock_user_registry', JSON.stringify([...registry, user]));
};

export const login = async (email: string, password: string): Promise<User | null> => {
    const lowerEmail = email.toLowerCase();
    const registry = getLocalUserRegistry();
    
    const foundUser = registry.find(u => u.email === lowerEmail);
    if (foundUser) {
        const expectedPassword = (foundUser as any).mockPassword || 'staff123';
        if (password === expectedPassword || password === 'password123') {
            currentUserCache = foundUser;
            localStorage.setItem('sag_current_user', JSON.stringify(foundUser));
            return foundUser;
        }
    }
    
    // Demo admin fallback for testing only
    if (email === 'demo@visainarc.com' && password === 'demo2024') {
        const admin: User = { id: 'demo_admin', name: 'Demo Admin', email: 'demo@visainarc.com', role: 'Owner', agencyId: 'demo_agency', paymentStatus: 'paid' };
        saveToLocalUserRegistry(admin);
        currentUserCache = admin;
        localStorage.setItem('sag_current_user', JSON.stringify(admin));
        return admin;
    }

    throw new Error("Invalid credentials.");
};

export const registerAgency = async (name: string, email: string, agencyName: string): Promise<{ owner: User, staff: { email: string, pass: string } }> => {
    const agencyId = `agency_${Date.now()}`;
    const sanitizedAgency = agencyName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const staffEmail = `staff@${sanitizedAgency}.com`;
    const staffPass = `${sanitizedAgency}2024`;

    const ownerUser: User = { id: `owner_${Date.now()}`, name, email, role: 'Owner', agencyId, paymentStatus: 'pending' };
    const staffUser: User = { id: `staff_${Date.now()}`, name: `${agencyName} Staff`, email: staffEmail, role: 'Counsellor', agencyId, paymentStatus: 'pending' };

    localStorage.setItem(`sag_settings_${agencyId}`, JSON.stringify({
        agencyName,
        email,
        phone: '',
        address: '',
        defaultCountry: Country.USA,
        currency: 'USD',
        paymentStatus: 'pending',
        notifications: { emailOnVisa: false, dailyReminders: false },
        subscription: { plan: 'Trial' },
        branches: [{id: 'main', name: agencyName, location: 'Primary Location'}]
    }));

    saveToLocalUserRegistry(ownerUser);
    saveToLocalUserRegistry(staffUser);

    return { owner: ownerUser, staff: { email: staffEmail, pass: staffPass } };
};

export const registerBranchUser = async (name: string, email: string, branchId: string, agencyId: string, password: string): Promise<User> => {
    const newUser: User = { id: `user_${Date.now()}`, name, email, role: 'Counsellor', agencyId, branchId };
    (newUser as any).mockPassword = password;
    saveToLocalUserRegistry(newUser);
    return newUser;
};

export const logout = async () => {
    currentUserCache = null;
    localStorage.removeItem('sag_current_user');
    window.location.reload();
};

export const getCurrentUser = (): User | null => {
    if (!currentUserCache) {
        const stored = localStorage.getItem('sag_current_user');
        currentUserCache = stored ? JSON.parse(stored) : null;
    }
    return currentUserCache;
};

export const initAuthListener = (callback: (user: User | null) => void) => {
    callback(getCurrentUser());
    return () => {};
};
