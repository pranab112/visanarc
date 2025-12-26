
import { User, Country, PaymentStatus } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

let currentUserCache: User | null = null;

const getLocalUserRegistry = (): User[] => {
    const stored = localStorage.getItem('sag_mock_user_registry');
    return stored ? JSON.parse(stored) : [];
};

const saveToLocalUserRegistry = (user: User) => {
    const registry = getLocalUserRegistry();
    localStorage.setItem('sag_mock_user_registry', JSON.stringify([...registry, user]));
};

export const fetchAgencyPaymentStatus = async (agencyId: string): Promise<PaymentStatus> => {
    if (!isSupabaseConfigured) {
        const stored = localStorage.getItem(`sag_payment_${agencyId}`);
        return (stored as PaymentStatus) || 'pending';
    }
    try {
        const { data, error } = await supabase
            .from('agencies')
            .select('payment_status')
            .eq('id', agencyId)
            .maybeSingle();
        
        if (error || !data) return 'pending';
        return data.payment_status as PaymentStatus;
    } catch (e) {
        return 'pending';
    }
};

export const login = async (email: string, password: string): Promise<User | null> => {
    const lowerEmail = email.toLowerCase();
    
    if (isSupabaseConfigured) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (!error && data.user) {
                const metadata = data.user.user_metadata;
                const agencyId = metadata.agencyId || 'default_agency';
                const pStatus = await fetchAgencyPaymentStatus(agencyId);
                
                const user: User = {
                    id: data.user.id,
                    name: metadata.name || 'User',
                    email: data.user.email || '',
                    role: metadata.role || 'Viewer',
                    agencyId: agencyId,
                    branchId: metadata.branchId,
                    paymentStatus: pStatus
                };
                currentUserCache = user;
                localStorage.setItem('sag_current_user', JSON.stringify(user));
                return user;
            }
        } catch (err) {
            console.error("[AUTH] Login Error:", err);
        }
    }

    // Fallback to local registry for development/offline
    const registry = getLocalUserRegistry();
    const foundUser = registry.find(u => u.email === lowerEmail);
    if (foundUser) {
        const expectedPassword = (foundUser as any).mockPassword || 'staff123';
        if (password === expectedPassword || password === 'password123') {
            const pStatus = await fetchAgencyPaymentStatus(foundUser.agencyId);
            foundUser.paymentStatus = pStatus;
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

    if (!isSupabaseConfigured) {
        const ownerUser: User = { id: `owner_${Date.now()}`, name, email, role: 'Owner', agencyId, paymentStatus: 'pending' };
        const staffUser: User = { id: `staff_${Date.now()}`, name: 'Default Staff', email: staffEmail, role: 'Counsellor', agencyId, paymentStatus: 'pending' };
        
        localStorage.setItem(`sag_settings_${agencyId}`, JSON.stringify({
            agencyName, email, phone: '', address: '', defaultCountry: Country.Australia, currency: 'NPR', paymentStatus: 'pending',
            notifications: { emailOnVisa: true, dailyReminders: true },
            subscription: { plan: 'Enterprise' },
            branches: [{id: 'main', name: 'Head Office', location: 'Main'}]
        }));
        saveToLocalUserRegistry(ownerUser);
        saveToLocalUserRegistry(staffUser);

        return { owner: ownerUser, staff: { email: staffEmail, pass: staffPass } };
    }

    // 1. Create the Auth User
    const { data, error } = await supabase.auth.signUp({
        email,
        password: 'password123',
        options: { 
            data: { name, role: 'Owner', agencyId } 
        }
    });

    if (error) throw new Error(error.message);
    
    // 2. Create the Agency Record in the Database immediately
    if (data.user) {
        const { error: agencyError } = await supabase.from('agencies').insert([{
            id: agencyId,
            name: agencyName,
            payment_status: 'pending',
            owner_id: data.user.id
        }]);

        if (agencyError) {
            console.error("Critical: Could not create agency record in DB", agencyError);
        }

        const user: User = { 
            id: data.user.id, 
            name, 
            email, 
            role: 'Owner', 
            agencyId, 
            paymentStatus: 'pending' 
        };
        return { owner: user, staff: { email: staffEmail, pass: staffPass } };
    }
    
    throw new Error("Registration failed - no user returned.");
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
            const u = session.user;
            const agencyId = u.user_metadata.agencyId;
            const pStatus = await fetchAgencyPaymentStatus(agencyId);
            
            const user: User = { 
                id: u.id, 
                name: u.user_metadata.name, 
                email: u.email || '', 
                role: u.user_metadata.role, 
                agencyId: agencyId, 
                branchId: u.user_metadata.branchId,
                paymentStatus: pStatus
            };
            currentUserCache = user;
            callback(user);
        } else {
            currentUserCache = null;
            callback(null);
        }
    });
    return () => subscription.unsubscribe();
};
