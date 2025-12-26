
import { Student, Partner, Invoice, Task, AgencySettings, Expense, Country, SubscriptionPlan } from '../types';
import { getCurrentUser } from './authService';
import { MOCK_STUDENTS_INITIAL, MOCK_PARTNERS_INITIAL, MOCK_EXPENSES_INITIAL } from '../constants';

const getAgencyId = () => {
    const user = getCurrentUser();
    return user ? user.agencyId : 'local-dev-agency';
};

export const getPlanLimit = (plan: SubscriptionPlan): number => {
    switch (plan) {
        case 'Free': return 10;
        case 'Pro': return 50;
        case 'Enterprise': return Infinity;
        default: return 10;
    }
};

const getLocalData = <T>(tableName: string, mockData?: T[]): T[] => {
    const agencyId = getAgencyId();
    const key = `sag_${tableName}_${agencyId}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : (mockData || []);
};

const saveLocalData = (tableName: string, items: any[]) => {
    const agencyId = getAgencyId();
    const key = `sag_${tableName}_${agencyId}`;
    localStorage.setItem(key, JSON.stringify(items));
};

// Fix: Added explicit generic and any cast to MOCK_STUDENTS_INITIAL because string literals for ApplicationStatus/NocStatus in mock data cause type errors in strict TS environments
export const fetchStudents = async (): Promise<Student[]> => getLocalData<Student>('students', MOCK_STUDENTS_INITIAL as any);
export const saveStudents = async (students: Student[]): Promise<void> => saveLocalData('students', students);

// Fix: Added explicit generic and any cast to MOCK_PARTNERS_INITIAL because literal union types for Partner['type'] in mock data cause inference mismatch errors
export const fetchPartners = async (): Promise<Partner[]> => getLocalData<Partner>('partners', MOCK_PARTNERS_INITIAL as any);
export const savePartners = async (partners: Partner[]): Promise<void> => saveLocalData('partners', partners);

export const fetchInvoices = async (): Promise<Invoice[]> => getLocalData('invoices', []);
export const saveInvoices = async (invoices: Invoice[]): Promise<void> => saveLocalData('invoices', invoices);

export const fetchExpenses = async (): Promise<Expense[]> => getLocalData('expenses', MOCK_EXPENSES_INITIAL);
export const saveExpenses = async (expenses: Expense[]): Promise<void> => saveLocalData('expenses', expenses);

export const fetchTasks = async (): Promise<Task[]> => getLocalData('tasks', []);
export const saveTasks = async (tasks: Task[]): Promise<void> => saveLocalData('tasks', tasks);

export const fetchSettings = async (): Promise<AgencySettings> => {
    const aid = getAgencyId();
    const key = `sag_settings_${aid}`;
    const local = localStorage.getItem(key);

    if (local) return JSON.parse(local);

    const defaultSettings: AgencySettings = {
        agencyName: 'Visa In Arc', email: 'dev@local.host', phone: '9800000000', address: 'Main Office', defaultCountry: Country.Australia, currency: 'NPR', paymentStatus: 'paid',
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

// Fix: Added missing submitPaymentReceipt function required by ActivationGate.tsx to handle user onboarding flow
export const submitPaymentReceipt = async (file: File): Promise<void> => {
    // Simulate API call delay for receipt submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log("Submitting payment receipt for manual review:", file.name);
};
