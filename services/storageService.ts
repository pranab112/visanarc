
import { Student, Partner, Invoice, Task, AgencySettings, CommissionClaim, Expense, Country, SubscriptionPlan, ApplicationStatus } from '../types';
import { getCurrentUser } from './authService';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { MOCK_STUDENTS_INITIAL, MOCK_PARTNERS_INITIAL, MOCK_EXPENSES_INITIAL } from '../constants';
import { uploadFile } from './fileStorageService';

const getAgencyId = () => {
    const user = getCurrentUser();
    return user ? user.agencyId : 'local-dev-agency';
};

export const submitPaymentReceipt = async (file: File): Promise<void> => {
    const user = getCurrentUser();
    if (!user) throw new Error("Not logged in");

    try {
        // 1. Upload the receipt file
        const storedFile = await uploadFile(file, 'system/receipts', user.name);

        if (isSupabaseConfigured) {
            // 2. Update Agency Status
            await supabase
                .from('agencies')
                .update({ payment_status: 'reviewing' })
                .eq('id', user.agencyId);

            // 3. Send Notification to Admin (You)
            await supabase
                .from('notifications')
                .insert([{
                    type: 'PAYMENT_REVIEW',
                    agency_id: user.agencyId,
                    message: `New payment receipt submitted by ${user.name} for agency ID ${user.agencyId}.`,
                    metadata: { receipt_url: storedFile.url, agency_name: user.name }
                }]);
        } else {
            localStorage.setItem(`sag_payment_${user.agencyId}`, 'reviewing');
        }
        
        // Update Local Session
        const updatedUser = { ...user, paymentStatus: 'reviewing' };
        localStorage.setItem('sag_current_user', JSON.stringify(updatedUser));
    } catch (err: any) {
        throw new Error("Failed to submit receipt: " + err.message);
    }
};

export const testSupabaseConnection = async (): Promise<{ success: boolean; message: string }> => {
    if (!isSupabaseConfigured) return { success: false, message: "Local Mode: Keys missing." };
    try {
        const { error } = await supabase.from('agency_settings').select('agency_id').limit(1);
        if (error) {
            if (error.code === 'PGRST116') return { success: true, message: "Connected (Empty)" };
            if (error.code === '42P01') return { success: false, message: "Tables not created yet." };
            throw error;
        }
        return { success: true, message: "Cloud Sync Active" };
    } catch (err: any) {
        return { success: false, message: err.message || "Connection Error" };
    }
};

export const getPlanLimit = (plan: SubscriptionPlan): number => {
    switch (plan) {
        case 'Free': return 10;
        case 'Pro': return 50;
        case 'Enterprise': return Infinity;
        default: return 10;
    }
};

const fetchTable = async <T>(tableName: string, mapper: (row: any) => T, mockData?: any[]): Promise<T[]> => {
    const agencyId = getAgencyId();
    const key = `sag_${tableName}_${agencyId}`;
    const localData = localStorage.getItem(key);
    
    if (!isSupabaseConfigured) {
        return localData ? JSON.parse(localData) : (mockData || []);
    }

    try {
        let query = supabase.from(tableName).select('*').eq('agency_id', agencyId);
        const { data, error } = await query;
        if (error) throw error;
        if (data && data.length > 0) return data.map(mapper);
        return localData ? JSON.parse(localData) : (mockData || []);
    } catch (err: any) {
        console.error(`Fetch error ${tableName}:`, err);
        return localData ? JSON.parse(localData) : (mockData || []);
    }
};

const saveTable = async (tableName: string, items: any[], rowMapper: (item: any, agencyId: string) => any) => {
    const agencyId = getAgencyId();
    const key = `sag_${tableName}_${agencyId}`;
    localStorage.setItem(key, JSON.stringify(items));
    
    if (!isSupabaseConfigured) return;

    try {
        const rows = items.map(item => rowMapper(item, agencyId));
        if (rows.length > 0) {
            await supabase.from(tableName).upsert(rows, { onConflict: 'id' });
        }
    } catch (err: any) {
        console.error(`Save error ${tableName}:`, err);
    }
};

export const fetchStudents = async (): Promise<Student[]> => 
    fetchTable('students', (row) => ({ ...row.data, id: row.id, branchId: row.branch_id }), MOCK_STUDENTS_INITIAL);

export const saveStudents = async (students: Student[]): Promise<void> => {
    await saveTable('students', students, (s, aid) => ({
        id: s.id, agency_id: aid, branch_id: s.branchId || 'main', name: s.name, email: s.email, phone: s.phone, target_country: s.targetCountry, status: s.status, noc_status: s.nocStatus, data: s
    }));
};

export const fetchPartners = async (): Promise<Partner[]> => 
    fetchTable('partners', (r) => ({ ...r, commissionRate: r.commission_rate, portalUrl: r.portal_url }), MOCK_PARTNERS_INITIAL);

export const savePartners = async (partners: Partner[]): Promise<void> => {
    saveTable('partners', partners, (p, aid) => ({
        id: p.id, agency_id: aid, name: p.name, type: p.type, commission_rate: p.commissionRate, portal_url: p.portalUrl
    }));
};

export const fetchInvoices = async (): Promise<Invoice[]> => 
    fetchTable('invoices', (row: any): Invoice => ({
        id: row.id, invoiceNumber: row.invoice_number, studentId: row.student_id, studentName: row.data.studentName,
        amount: row.amount, description: row.data.description, status: row.status, date: row.data.date, branchId: row.data.branchId
    }), []);

export const saveInvoices = async (invoices: Invoice[]): Promise<void> => {
    saveTable('invoices', invoices, (inv: Invoice, aid) => ({
        id: inv.id, agency_id: aid, invoice_number: inv.invoiceNumber, student_id: inv.studentId, amount: inv.amount, status: inv.status, data: inv
    }));
};

export const fetchExpenses = async (): Promise<Expense[]> => 
    fetchTable('expenses', (row: any): Expense => ({
        id: row.id, category: row.category, amount: row.amount, description: row.description, date: row.date, recordedBy: row.recorded_by, branchId: row.branch_id || 'main'
    }), MOCK_EXPENSES_INITIAL);

export const saveExpenses = async (expenses: Expense[]): Promise<void> => {
    saveTable('expenses', expenses, (ex: Expense, aid) => ({
        id: ex.id, agency_id: aid, branch_id: ex.branchId || 'main', category: ex.category, amount: ex.amount, description: ex.description, date: ex.date, recorded_by: ex.recordedBy
    }));
};

export const fetchTasks = async (): Promise<Task[]> => 
    fetchTable('tasks', (row: any): Task => ({
        id: row.id, text: row.text, priority: row.priority, dueTime: row.due_time, day: row.day, completed: row.completed, createdAt: row.created_at
    }), []);

export const saveTasks = async (tasks: Task[]): Promise<void> => {
    saveTable('tasks', tasks, (t, aid) => ({
        id: t.id, agency_id: aid, text: t.text, priority: t.priority, due_time: t.dueTime, day: t.day, completed: t.completed, created_at: t.createdAt
    }));
};

export const fetchSettings = async (): Promise<AgencySettings> => {
    const aid = getAgencyId();
    const key = `sag_settings_${aid}`;
    const local = localStorage.getItem(key);

    if (isSupabaseConfigured) {
        try {
            const { data, error } = await supabase.from('agency_settings').select('settings').eq('agency_id', aid).single();
            if (!error && data) return data.settings;
        } catch (e) {}
    }

    if (local) return JSON.parse(local);

    const defaultSettings: AgencySettings = {
        agencyName: 'Visa In Arc', email: 'dev@local.host', phone: '9800000000', address: 'Main Office', defaultCountry: Country.Australia, currency: 'NPR', paymentStatus: 'pending',
        notifications: { emailOnVisa: true, dailyReminders: true },
        subscription: { plan: 'Enterprise' },
        testPrepBatches: ['Morning (7-8 AM)', 'Day (12-1 PM)', 'Evening (5-6 PM)'],
        branches: [{id: 'main', name: 'Head Office', location: 'Main'}],
        leadForm: { enabled: true, title: 'Apply Now', description: 'Start your study abroad journey today.', themeColor: '#4f46e5', fields: { phone: true, targetCountry: true, courseInterest: true, educationHistory: true } }
    };
    localStorage.setItem(key, JSON.stringify(defaultSettings));
    return defaultSettings;
};

export const saveSettings = async (settings: AgencySettings): Promise<void> => {
    const aid = getAgencyId();
    localStorage.setItem(`sag_settings_${aid}`, JSON.stringify(settings));
    if (isSupabaseConfigured) {
        try {
            await supabase.from('agency_settings').upsert({ agency_id: aid, settings: settings });
        } catch (e) {}
    }
};

export const fetchAllData = async () => {
    const [students, partners, invoices, expenses, tasks, settings] = await Promise.all([
        fetchStudents(), fetchPartners(), fetchInvoices(), fetchExpenses(), fetchTasks(), fetchSettings()
    ]);
    return { students, partners, invoices, expenses, tasks, settings, exportedAt: new Date().toISOString() };
};

export const importData = async (jsonString: string): Promise<boolean> => {
    try {
        const data = JSON.parse(jsonString);
        if (data.students) await saveStudents(data.students);
        if (data.partners) await savePartners(data.partners);
        if (data.invoices) await saveInvoices(data.invoices);
        if (data.expenses) await saveExpenses(data.expenses);
        if (data.tasks) await saveTasks(data.tasks);
        if (data.settings) await saveSettings(data.settings);
        return true;
    } catch (e) { return false; }
};
