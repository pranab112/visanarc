
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
    
    // Default admin fallback for fresh installs
    if (email === 'admin@agency.com' && password === 'admin123') {
        const admin: User = { id: 'admin_1', name: 'System Admin', email: 'admin@agency.com', role: 'Owner', agencyId: 'default_agency', paymentStatus: 'paid' };
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
    const staffPass = 'staff123';

    const ownerUser: User = { id: `owner_${Date.now()}`, name, email, role: 'Owner', agencyId, paymentStatus: 'paid' };
    const staffUser: User = { id: `staff_${Date.now()}`, name: 'Default Staff', email: staffEmail, role: 'Counsellor', agencyId, paymentStatus: 'paid' };
    
    localStorage.setItem(`sag_settings_${agencyId}`, JSON.stringify({
        agencyName, email, phone: '', address: '', defaultCountry: Country.Australia, currency: 'NPR', paymentStatus: 'paid',
        notifications: { emailOnVisa: true, dailyReminders: true },
        subscription: { plan: 'Enterprise' },
        branches: [{id: 'main', name: 'Head Office', location: 'Main'}]
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
