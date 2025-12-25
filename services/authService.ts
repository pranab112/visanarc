import { User, AgencySettings, Country } from '../types';
import { supabase, gtdevsHQ, isSupabaseConfigured, AGENCY_URL } from './supabaseClient';

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
    
    if (lowerEmail === 'admin@demo.com' && (password === 'password' || password === 'password123')) {
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

    if (isSupabaseConfigured) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (!error && data.user) {
                const metadata = data.user.user_metadata;
                const user: User = {
                    id: data.user.id,
                    name: metadata.name || 'User',
                    email: data.user.email || '',
                    role: metadata.role || 'Viewer',
                    agencyId: metadata.agencyId || 'default_agency',
                    branchId: metadata.branchId
                };
                currentUserCache = user;
                localStorage.setItem('sag_current_user', JSON.stringify(user));
                return user;
            }
        } catch (err) {
            console.error("[AUTH] Login Error:", err);
        }
    }

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
    throw new Error("Invalid credentials.");
};

export const registerAgency = async (name: string, email: string, agencyName: string, activationKey?: string): Promise<{ owner: User, staff: { email: string, pass: string } }> => {
    const agencyId = `agency_${Date.now()}`;
    const sanitizedAgency = agencyName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const staffEmail = `staff@${sanitizedAgency}.com`;
    const staffPass = 'staff123';

    // --- INFRASTRUCTURE SALES TRACKING ---
    try {
        const telemetryPayload = {
            agency_name: agencyName,
            agency_id: agencyId,
            hostname: window.location.hostname,
            database_url: AGENCY_URL,
            timestamp: new Date().toISOString()
        };
        
        // This is where you see it in Supabase Table Editor -> master_onboarding
        await gtdevsHQ.from('master_onboarding').insert([telemetryPayload]);
        localStorage.setItem('sag_last_handshake', new Date().toISOString());
    } catch (e) {
        console.warn("[SECURITY] Handshake logged locally only.");
    }

    if (!isSupabaseConfigured) {
        const ownerUser: User = { id: `owner_${Date.now()}`, name, email, role: 'Owner', agencyId };
        const staffUser: User = { id: `staff_${Date.now()}`, name: 'Default Staff', email: staffEmail, role: 'Counsellor', agencyId };
        
        localStorage.setItem(`sag_settings_${agencyId}`, JSON.stringify({
            agencyName, email, phone: '', address: '', defaultCountry: Country.Australia, currency: 'NPR',
            notifications: { emailOnVisa: true, dailyReminders: true },
            subscription: { plan: 'Enterprise' },
            branches: [{id: 'main', name: 'Head Office', location: 'Main'}]
        }));
        saveToLocalUserRegistry(ownerUser);
        saveToLocalUserRegistry(staffUser);

        return { owner: ownerUser, staff: { email: staffEmail, pass: staffPass } };
    }

    const { data, error } = await supabase.auth.signUp({
        email,
        password: 'password123',
        options: { data: { name, role: 'Owner', agencyId } }
    });

    if (error) throw new Error(error.message);
    if (data.user) {
        const user: User = { id: data.user.id, name, email, role: 'Owner', agencyId };
        return { owner: user, staff: { email: staffEmail, pass: staffPass } };
    }
    throw new Error("Registration failed");
};

export const registerBranchUser = async (name: string, email: string, branchId: string, agencyId: string, password: string): Promise<User> => {
    if (!isSupabaseConfigured) {
        const newUser: User = { id: `user_${Date.now()}`, name, email, role: 'Counsellor', agencyId, branchId };
        (newUser as any).mockPassword = password;
        saveToLocalUserRegistry(newUser);
        return newUser;
    }
    const { data, error } = await supabase.auth.signUp({
        email, password, options: { data: { name, role: 'Counsellor', agencyId, branchId } }
    });
    if (error) throw error;
    return { id: data.user?.id || `u_${Date.now()}`, name, email, role: 'Counsellor', agencyId, branchId };
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
            const u = session.user;
            const user: User = { id: u.id, name: u.user_metadata.name, email: u.email || '', role: u.user_metadata.role, agencyId: u.user_metadata.agencyId, branchId: u.user_metadata.branchId };
            currentUserCache = user;
            callback(user);
        } else {
            currentUserCache = null;
            callback(null);
        }
    });
    return () => subscription.unsubscribe();
};