import { ActivityLog, User, ChangeRecord } from '../types';
import { getCurrentUser } from './authService';

const LOGS_KEY_PREFIX = 'sag_logs_';

const getLogKey = (agencyId: string) => `${LOGS_KEY_PREFIX}${agencyId}`;

// Added 'Expense' to entityType to match ActivityLog interface and usage
export const logActivity = (
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'EXPORT',
    entityType: 'Student' | 'Invoice' | 'Settings' | 'File' | 'Auth' | 'Commission' | 'Expense',
    details: string,
    changes?: Record<string, ChangeRecord>
) => {
    const user = getCurrentUser();
    if (!user) return; // Should allow logging for failed logins in future, but for now requires user

    const newLog: ActivityLog = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        userId: user.id,
        userName: user.name,
        action,
        entityType,
        details,
        timestamp: Date.now(),
        changes
    };

    const key = getLogKey(user.agencyId);
    const existingLogsString = localStorage.getItem(key);
    const existingLogs: ActivityLog[] = existingLogsString ? JSON.parse(existingLogsString) : [];
    
    // Keep last 100 logs
    const updatedLogs = [newLog, ...existingLogs].slice(0, 100);
    localStorage.setItem(key, JSON.stringify(updatedLogs));
};

export const fetchLogs = async (): Promise<ActivityLog[]> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const user = getCurrentUser();
    if (!user) return [];

    const key = getLogKey(user.agencyId);
    const logs = localStorage.getItem(key);
    return logs ? JSON.parse(logs) : [];
};