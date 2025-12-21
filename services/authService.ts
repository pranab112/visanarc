
import { User, AgencySettings, Country } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { saveSettings } from './storageService';

let currentUserCache: User | null = null;

export const login = async (email: string, password: string): Promise<User | null> => {
    // 1. Force Local Mode logic if Supabase is disabled
    if (!isSupabaseConfigured) {
        console.log("[AUTH] Running in Local Mock Mode");
        
        // Owner Demo
        if (email === 'admin@demo.com' && password === 'password') {
            const mockAdmin: User = {
                id: 'mock-admin-id',
                name: 'System Administrator',
                email: 'admin@demo.com',
                role: 'Owner',
                agencyId: 'local-dev-agency'
            };
            currentUserCache = mockAdmin;
            localStorage.setItem('sag_current_user', JSON.stringify(mockAdmin));
            return mockAdmin;
        } 
        
        // Staff Demo
        if (email === 'staff@demo.com' && password === 'password') {
             const mockStaff: User = {
                id: 'mock-staff-id',
                name: 'Lead Counsellor',
                email: 'staff@demo.com',
                role: 'Counsellor',
                agencyId: 'local-dev-agency'
            };
            currentUserCache = mockStaff;
            localStorage.setItem('sag_current_user', JSON.stringify(mockStaff));
            return mockStaff;
        }

        // Student Demo (General fallback for testing Student Portal)
        if (email === 'student@demo.com' && password === 'password') {
             const mockStudent: User = {
                id: '1', // Matches first mock student "Ram Karki"
                name: 'Ram Karki',
                email: 'student@demo.com',
                role: 'Student',
                agencyId: 'local-dev-agency'
            };
            currentUserCache = mockStudent;
            localStorage.setItem('sag_current_user', JSON.stringify(mockStudent));
            return mockStudent;
        }

        throw new Error("Invalid Demo Credentials. Try admin@demo.com / password");
    }

    // 2. Cloud Authenticate (Skipped in Local Mode)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);

    if (data.user) {
        const metadata = data.user.user_metadata;
        const user: User = {
            id: data.user.id,
            name: metadata.name || 'User',
            email: data.user.email || '',
            role: metadata.role || 'Viewer',
            agencyId: metadata.agencyId || 'default_agency'
        };
        currentUserCache = user;
        localStorage.setItem('sag_current_user', JSON.stringify(user));
        return user;
    }
    return null;
};

export const registerAgency = async (name: string, email: string, agencyName: string, activationKey?: string): Promise<User> => {
    // Determine Plan based on Key (Simulation)
    const isProKey = activationKey === 'PRO-2025-GENIUS' || activationKey === 'SMM84-PRO';
    const isEnterpriseKey = activationKey === 'ENT-GTSDEVS-84' || activationKey === 'SMM84-ADMIN';
    
    const plan = isEnterpriseKey ? 'Enterprise' : isProKey ? 'Pro' : 'Free';
    const agencyId = `agency_${Date.now()}`;

    if (!isSupabaseConfigured) {
        // Allow local "registration" for testing
        const mockUser: User = {
            id: `local_${Date.now()}`,
            name,
            email,
            role: 'Owner',
            agencyId
        };
        
        // Initialize settings for the new agency
        const defaultSettings: AgencySettings = {
            agencyName: agencyName,
            email: email,
            phone: '',
            address: '',
            defaultCountry: Country.Australia,
            currency: 'NPR',
            notifications: { emailOnVisa: true, dailyReminders: true },
            subscription: { 
                plan: plan,
                expiryDate: plan !== 'Free' ? Date.now() + (365 * 24 * 60 * 60 * 1000) : undefined
            },
            testPrepBatches: ['Morning (7-8 AM)', 'Day (12-1 PM)', 'Evening (5-6 PM)'],
            branches: [{id: 'main', name: 'Head Office', location: 'Main'}]
        };
        
        // We use a specific storage key for this new agency's settings
        localStorage.setItem(`sag_settings_${agencyId}`, JSON.stringify(defaultSettings));
        
        currentUserCache = mockUser;
        localStorage.setItem('sag_current_user', JSON.stringify(mockUser));
        return mockUser;
    }

    // Cloud Registration (Standard logic but passing plan in metadata)
    const { data, error } = await supabase.auth.signUp({
        email,
        password: 'password123',
        options: { data: { name, role: 'Owner', agencyId, prePaidPlan: plan } }
    });

    if (error) throw new Error(error.message);
    if (data.user) {
        const user: User = { id: data.user.id, name, email, role: 'Owner', agencyId };
        currentUserCache = user;
        localStorage.setItem('sag_current_user', JSON.stringify(user));
        return user;
    }
    throw new Error("Registration failed");
};

export const logout = async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut();
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
    if (!isSupabaseConfigured) {
        callback(getCurrentUser());
        return () => {};
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
            const u = session.user;
            const user: User = { id: u.id, name: u.user_metadata.name, email: u.email || '', role: u.user_metadata.role, agencyId: u.user_metadata.agencyId };
            currentUserCache = user;
            callback(user);
        } else {
            callback(getCurrentUser());
        }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
            const u = session.user;
            const user: User = { id: u.id, name: u.user_metadata.name, email: u.email || '', role: u.user_metadata.role, agencyId: u.user_metadata.agencyId };
            currentUserCache = user;
            callback(user);
        } else if (_event === 'SIGNED_OUT') {
            currentUserCache = null;
            callback(null);
        }
    });
    return () => subscription.unsubscribe();
};
