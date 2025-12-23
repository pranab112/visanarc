
import { User, AgencySettings, Country } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { saveSettings } from './storageService';

let currentUserCache: User | null = null;

/**
 * Registry for dynamically created users in local mock mode
 */
const getLocalUserRegistry = (): User[] => {
    const stored = localStorage.getItem('sag_mock_user_registry');
    return stored ? JSON.parse(stored) : [];
};

const saveToLocalUserRegistry = (user: User) => {
    const registry = getLocalUserRegistry();
    localStorage.setItem('sag_mock_user_registry', JSON.stringify([...registry, user]));
};

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

        // Student Demo
        if (email === 'student@demo.com' && password === 'password') {
             const mockStudent: User = {
                id: '1',
                name: 'Ram Karki',
                email: 'student@demo.com',
                role: 'Student',
                agencyId: 'local-dev-agency'
            };
            currentUserCache = mockStudent;
            localStorage.setItem('sag_current_user', JSON.stringify(mockStudent));
            return mockStudent;
        }

        // Check Dynamic Registry (Auto-created staff/owners)
        const registry = getLocalUserRegistry();
        const foundUser = registry.find(u => u.email === email);
        
        // In this mock, we assume password for all auto-created staff is 'staff123' 
        // and for owners it is whatever they entered (simulated as 'password123')
        if (foundUser) {
            const expectedPassword = foundUser.role === 'Owner' ? 'password' : 'staff123';
            if (password === expectedPassword || password === 'password123') {
                currentUserCache = foundUser;
                localStorage.setItem('sag_current_user', JSON.stringify(foundUser));
                return foundUser;
            }
        }

        throw new Error("Invalid credentials. Please check your email and password.");
    }

    // 2. Cloud Authenticate
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

export const registerAgency = async (name: string, email: string, agencyName: string, activationKey?: string): Promise<{ owner: User, staff: { email: string, pass: string } }> => {
    const plan = 'Enterprise'; // Defaulting to Enterprise as per recent logic
    const agencyId = `agency_${Date.now()}`;
    
    // Auto-generate staff credentials
    const sanitizedAgency = agencyName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const staffEmail = `staff@${sanitizedAgency}.com`;
    const staffPass = 'staff123';

    if (!isSupabaseConfigured) {
        const ownerUser: User = {
            id: `owner_${Date.now()}`,
            name,
            email,
            role: 'Owner',
            agencyId
        };

        const staffUser: User = {
            id: `staff_${Date.now()}`,
            name: 'Default Staff',
            email: staffEmail,
            role: 'Counsellor',
            agencyId
        };
        
        // Initialize settings
        const defaultSettings: AgencySettings = {
            agencyName: agencyName,
            email: email,
            phone: '',
            address: '',
            defaultCountry: Country.Australia,
            currency: 'NPR',
            notifications: { emailOnVisa: true, dailyReminders: true },
            subscription: { plan: 'Enterprise' },
            testPrepBatches: ['Morning (7-8 AM)', 'Day (12-1 PM)', 'Evening (5-6 PM)'],
            branches: [{id: 'main', name: 'Head Office', location: 'Main'}]
        };
        
        localStorage.setItem(`sag_settings_${agencyId}`, JSON.stringify(defaultSettings));
        
        // Save both to local registry
        saveToLocalUserRegistry(ownerUser);
        saveToLocalUserRegistry(staffUser);

        return { owner: ownerUser, staff: { email: staffEmail, pass: staffPass } };
    }

    // Cloud Registration (Standard logic)
    const { data, error } = await supabase.auth.signUp({
        email,
        password: 'password123',
        options: { data: { name, role: 'Owner', agencyId, prePaidPlan: plan } }
    });

    if (error) throw new Error(error.message);
    if (data.user) {
        const user: User = { id: data.user.id, name, email, role: 'Owner', agencyId };
        return { owner: user, staff: { email: staffEmail, pass: staffPass } };
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
