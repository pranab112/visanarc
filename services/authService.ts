import { User, AgencySettings, Country } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

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

export const registerAgency = async (name: string, email: string, agencyName: string): Promise<User> => {
    if (!isSupabaseConfigured) {
        // Allow local "registration" for testing
        const mockUser: User = {
            id: `local_${Date.now()}`,
            name,
            email,
            role: 'Owner',
            agencyId: `agency_${Date.now()}`
        };
        currentUserCache = mockUser;
        localStorage.setItem('sag_current_user', JSON.stringify(mockUser));
        return mockUser;
    }

    const agencyId = `agency_${Date.now()}`;
    const { data, error } = await supabase.auth.signUp({
        email,
        password: 'password123',
        options: { data: { name, role: 'Owner', agencyId } }
    });

    if (error) throw new Error(error.message);
    if (data.user) {
        const user: User = { id: data.user.id, name, email, role: 'Owner', agencyId };
        // Settings init would happen here in cloud
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
