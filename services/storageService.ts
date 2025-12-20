
import { Student, Partner, Invoice, Task, AgencySettings, CommissionClaim, Expense, Country } from '../types';
import { getCurrentUser } from './authService';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { MOCK_STUDENTS_INITIAL, MOCK_PARTNERS_INITIAL, MOCK_EXPENSES_INITIAL } from '../constants';

const getAgencyId = () => {
    const user = getCurrentUser();
    return user ? user.agencyId : 'local-dev-agency';
};

// Generic Fetcher
const fetchTable = async <T>(tableName: string, mapper: (row: any) => T, mockData?: any[]): Promise<T[]> => {
    const agencyId = getAgencyId();
    const key = `sag_${tableName}_${agencyId}`;
    
    // Artificial delay for local testing
    await new Promise(resolve => setTimeout(resolve, 300));

    // In Local Mode, always prioritize localStorage
    if (!isSupabaseConfigured) {
        const stored = localStorage.getItem(key);
        if (stored) return JSON.parse(stored);
        
        // Initial Mock Data Seeding
        if (mockData && mockData.length > 0) {
            console.log(`[STORAGE] Seeding ${tableName} with initial data`);
            localStorage.setItem(key, JSON.stringify(mockData));
            return mockData;
        }
        return [];
    }

    try {
        const { data, error } = await supabase.from(tableName).select('*').eq('agency_id', agencyId);
        if (error) throw error;
        if (!data || data.length === 0) return (agencyId === 'mock-agency-id' || agencyId === 'local-dev-agency') ? (mockData || []) : [];
        return data.map(mapper);
    } catch (err) {
        console.error(`Supabase fetch error [${tableName}]:`, err);
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : (mockData || []);
    }
};

// Generic Saver
const saveTable = async (tableName: string, items: any[], rowMapper: (item: any, agencyId: string) => any) => {
    const agencyId = getAgencyId();
    const key = `sag_${tableName}_${agencyId}`;

    // 1. Save to Local Storage (Primary Source in Local Mode)
    localStorage.setItem(key, JSON.stringify(items));
    
    // Artificial delay for local testing
    await new Promise(resolve => setTimeout(resolve, 500));

    // 2. Network Sync (Skipped in Local Mode)
    if (!isSupabaseConfigured) {
        console.log(`[STORAGE] Persisted ${items.length} items to ${key} (Local Mode)`);
        return;
    }

    try {
        const rows = items.map(item => rowMapper(item, agencyId));
        const keepIds = items.map(i => i.id);

        if (keepIds.length > 0) {
            await supabase.from(tableName).delete().eq('agency_id', agencyId).not('id', 'in', `(${keepIds.join(',')})`);
        } else {
             await supabase.from(tableName).delete().eq('agency_id', agencyId);
        }

        if (rows.length > 0) {
            const { error } = await supabase.from(tableName).upsert(rows);
            if (error) throw error;
        }
    } catch (err) {
        console.error(`Supabase save error [${tableName}]:`, err);
    }
};

// --- MAPPERS ---
const mapStudentToRow = (s: Student, agencyId: string) => ({
    id: s.id, agency_id: agencyId, name: s.name, email: s.email, phone: s.phone,
    target_country: s.targetCountry, status: s.status, noc_status: s.nocStatus, data: s
});
const mapRowToStudent = (row: any): Student => ({ ...row.data, id: row.id });

// --- EXPORTS ---

export const fetchStudents = async (): Promise<Student[]> => 
    fetchTable('students', mapRowToStudent, MOCK_STUDENTS_INITIAL);

export const saveStudents = async (students: Student[]): Promise<void> => 
    saveTable('students', students, mapStudentToRow);

export const fetchPartners = async (): Promise<Partner[]> => 
    fetchTable('partners', (r) => ({ ...r, commissionRate: r.commission_rate, portalUrl: r.portal_url }), MOCK_PARTNERS_INITIAL);

export const savePartners = async (partners: Partner[]): Promise<void> => {
    saveTable('partners', partners, (p: Partner, agencyId: string) => ({
        id: p.id, agency_id: agencyId, name: p.name, type: p.type, commission_rate: p.commissionRate, portal_url: p.portalUrl
    }));
};

export const fetchInvoices = async (): Promise<Invoice[]> => 
    fetchTable('invoices', (row: any): Invoice => ({
        id: row.id, invoiceNumber: row.invoice_number, studentId: row.student_id, studentName: row.data.studentName,
        amount: row.amount, description: row.data.description, status: row.status, date: row.data.date, branchId: row.data.branchId
    }), []);

export const saveInvoices = async (invoices: Invoice[]): Promise<void> => {
    saveTable('invoices', invoices, (inv: Invoice, agencyId: string) => ({
        id: inv.id, agency_id: agencyId, invoice_number: inv.invoiceNumber, student_id: inv.studentId, amount: inv.amount, status: inv.status, data: inv
    }));
};

export const fetchExpenses = async (): Promise<Expense[]> => 
    fetchTable('expenses', (row: any): Expense => ({
        id: row.id, category: row.category, amount: row.amount, description: row.description, date: row.date, recordedBy: row.recorded_by, branchId: row.data?.branchId || 'main'
    }), MOCK_EXPENSES_INITIAL);

export const saveExpenses = async (expenses: Expense[]): Promise<void> => {
    saveTable('expenses', expenses, (ex: Expense, agencyId: string) => ({
        id: ex.id, agency_id: agencyId, category: ex.category, amount: ex.amount, description: ex.description, date: ex.date, recorded_by: ex.recordedBy, data: ex
    }));
};

export const fetchTasks = async (): Promise<Task[]> => 
    fetchTable('tasks', (row: any): Task => ({
        id: row.id, text: row.text, priority: row.priority, dueTime: row.due_time, day: row.day, completed: row.completed, createdAt: row.created_at
    }), []);

export const saveTasks = async (tasks: Task[]): Promise<void> => {
    saveTable('tasks', tasks, (t: Task, agencyId: string) => ({
        id: t.id, agency_id: agencyId, text: t.text, priority: t.priority, due_time: t.dueTime, day: t.day, completed: t.completed, created_at: t.createdAt
    }));
};

export const fetchClaims = async (): Promise<CommissionClaim[]> => 
    fetchTable('claims', (row: any): CommissionClaim => ({ ...row.data, id: row.id, status: row.status, amount: row.amount }), []);

export const saveClaims = async (claims: CommissionClaim[]): Promise<void> => {
    saveTable('claims', claims, (c: CommissionClaim, agencyId: string) => ({
        id: c.id, agency_id: agencyId, student_id: c.studentId, partner_id: c.partnerId, amount: c.amount, status: c.status, data: c
    }));
};

export const fetchSettings = async (): Promise<AgencySettings> => {
    const agencyId = getAgencyId();
    const key = `sag_settings_${agencyId}`;
    const local = localStorage.getItem(key);
    
    if (local) return JSON.parse(local);

    const defaultSettings: AgencySettings = {
        agencyName: 'StudyAbroad Genius (Local)',
        email: 'dev@local.host',
        phone: '9800000000',
        address: 'Local Development Environment',
        defaultCountry: Country.Australia,
        currency: 'NPR',
        notifications: { emailOnVisa: true, dailyReminders: true },
        subscription: { plan: 'Enterprise' },
        testPrepBatches: ['Morning (7-8 AM)', 'Day (12-1 PM)', 'Evening (5-6 PM)'],
        branches: [{id: 'main', name: 'Head Office', location: 'Main'}]
    };
    localStorage.setItem(key, JSON.stringify(defaultSettings));
    return defaultSettings;
};

export const saveSettings = async (settings: AgencySettings): Promise<void> => {
    const agencyId = getAgencyId();
    localStorage.setItem(`sag_settings_${agencyId}`, JSON.stringify(settings));
    if (isSupabaseConfigured) {
        try {
            await supabase.from('agency_settings').upsert({ agency_id: agencyId, settings: settings });
        } catch (e) { console.error("Supabase settings save failed", e); }
    }
};

export const fetchAllData = async () => {
    const [students, partners, invoices, expenses, tasks, claims, settings] = await Promise.all([
        fetchStudents(), fetchPartners(), fetchInvoices(), fetchExpenses(), fetchTasks(), fetchClaims(), fetchSettings()
    ]);
    return { students, partners, invoices, expenses, tasks, claims, settings, exportedAt: new Date().toISOString() };
};

export const importData = async (jsonString: string): Promise<boolean> => {
    try {
        const data = JSON.parse(jsonString);
        if (data.students) await saveStudents(data.students);
        if (data.partners) await savePartners(data.partners);
        if (data.invoices) await saveInvoices(data.invoices);
        if (data.expenses) await saveExpenses(data.expenses);
        if (data.tasks) await saveTasks(data.tasks);
        if (data.claims) await saveClaims(data.claims);
        if (data.settings) await saveSettings(data.settings);
        return true;
    } catch (e) { return false; }
};

export const clearAllData = async () => {
    const agencyId = getAgencyId();
    const collections = ['students', 'partners', 'invoices', 'expenses', 'tasks', 'claims', 'settings'];
    collections.forEach(col => localStorage.removeItem(`sag_${col}_${agencyId}`));
    console.log("[STORAGE] Local data cleared.");
};
