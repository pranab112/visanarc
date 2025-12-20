import { Student, ApplicationStatus, Task, Invoice } from '../types';
import { fetchTasks, saveTasks, fetchInvoices, saveInvoices } from './storageService';
import { logActivity } from './auditService';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const getTargetDayName = (daysFromNow: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return DAYS[date.getDay()];
};

export const runStatusAutomation = async (student: Student, newStatus: ApplicationStatus) => {
    const existingTasks = await fetchTasks();
    const newTasks: Task[] = [];
    
    const createTask = (text: string, priority: 'High' | 'Medium' | 'Low', daysFromNow: number, time: string = '10:00') => {
        const task: Task = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            text: text,
            completed: false,
            priority: priority,
            dueTime: time,
            createdAt: Date.now(),
            day: getTargetDayName(daysFromNow)
        };
        newTasks.push(task);
    };

    // --- WORKFLOW RULES ---

    if (newStatus === ApplicationStatus.Applied) {
        createTask(`Check Offer Status: ${student.name} (${student.targetCountry})`, 'Low', 7, '11:00');
    }

    else if (newStatus === ApplicationStatus.OfferReceived) {
        createTask(`Collect Tuition Fee & GTE Docs: ${student.name}`, 'High', 1, '14:00');
        if ((student.targetCountry as string) !== 'India') {
            createTask(`Verify NOC Status for ${student.name}`, 'Medium', 2, '12:00');
        }
    }

    else if (newStatus === ApplicationStatus.VisaGranted) {
        createTask(`Conduct Pre-Departure Briefing: ${student.name}`, 'High', 1, '15:00');
        createTask(`Archive Student File: ${student.name}`, 'Low', 5, '17:00');

        // --- STUDENT SUCCESS FEE INVOICE ---
        try {
            const existingInvoices = await fetchInvoices();
            const hasSuccessInvoice = existingInvoices.some(i => 
                i.studentId === student.id && i.description.includes('Visa Success')
            );

            if (!hasSuccessInvoice) {
                const autoInvoice: Invoice = {
                    id: Date.now().toString() + '_auto',
                    invoiceNumber: `INV-SUCCESS-${Math.floor(1000 + Math.random() * 9000)}`,
                    studentId: student.id,
                    studentName: student.name,
                    amount: 20000, 
                    description: `Visa Success Fee - ${student.targetCountry}`,
                    status: 'Pending',
                    date: Date.now(),
                    branchId: student.branchId || 'main'
                };
                await saveInvoices([autoInvoice, ...existingInvoices]);
                logActivity('CREATE', 'Invoice', `Auto-generated Visa Success Invoice for ${student.name}`);
            }
        } catch (e) {
            console.error("Student invoice automation failed", e);
        }
    }

    if (newTasks.length > 0) {
        const updatedTasks = [...newTasks, ...existingTasks];
        await saveTasks(updatedTasks);
        logActivity('CREATE', 'Settings', `Workflow Engine created ${newTasks.length} tasks for ${student.name}`);
        return newTasks.length;
    }
    
    return 0;
};