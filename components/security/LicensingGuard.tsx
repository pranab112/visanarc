
import React, { useState, useEffect } from 'react';
import { gtdevsHQ, AGENCY_URL } from '../../services/supabaseClient';
import { getCurrentUser } from '../../services/authService';
import { ShieldAlert, Loader2, ShieldCheck, Zap, Lock } from 'lucide-react';

const SALT = 'GT-VIBE-2025';

async function generateRequestId(hostname: string) {
    const msgUint8 = new TextEncoder().encode(hostname + SALT);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16).toUpperCase();
}

export const LicensingGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [status, setStatus] = useState<'checking' | 'active' | 'deactivated'>('checking');
    const [requestId, setRequestId] = useState('');
    const [isVerified, setIsVerified] = useState(false);

    useEffect(() => {
        const verifyLicense = async () => {
            const host = window.location.hostname;
            const rid = await generateRequestId(host);
            setRequestId(rid);
            
            const currentUser = getCurrentUser();

            try {
                // 1. Telemetry Ping
                await gtdevsHQ.from('master_telemetry').insert([{
                    hostname: host,
                    agency_id: currentUser?.agencyId || 'GUEST',
                    database_url: AGENCY_URL,
                    last_seen: new Date().toISOString()
                }]);

                // 2. Kill-Switch Check
                const { data } = await gtdevsHQ
                    .from('master_license')
                    .select('is_active')
                    .eq('database_url', AGENCY_URL)
                    .maybeSingle();

                if (data && data.is_active === false) {
                    setStatus('deactivated');
                } else {
                    // 3. Update Master Heartbeat
                    const now = new Date().toISOString();
                    await gtdevsHQ.from('master_license').upsert([{
                        database_url: AGENCY_URL,
                        request_id: rid,
                        app_type: 'EDU_CRM_V3',
                        last_heartbeat: now,
                        is_active: true
                    }], { onConflict: 'database_url' });
                    
                    // SYNC KEYS: settings.tsx looks for 'sag_last_handshake'
                    localStorage.setItem('sag_last_handshake', now);
                    localStorage.setItem('sag_master_link', 'active');
                    
                    setIsVerified(true);
                    setStatus('active');
                    
                    // Dispatch event so Settings page knows to refresh if it's open
                    window.dispatchEvent(new Event('security_check_passed'));
                }
            } catch (err) {
                // Fail-safe to active for UX stability during dev/network issues
                setStatus('active');
            }
        };

        verifyLicense();
    }, []);

    if (status === 'checking') {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                    <Loader2 className="animate-spin text-indigo-500 w-16 h-16" />
                    <ShieldCheck className="absolute inset-0 m-auto text-indigo-200 w-6 h-6" />
                </div>
                <div className="text-center">
                    <p className="text-indigo-400 font-mono text-[10px] uppercase tracking-[0.3em]">Infrastructure Integrity Audit</p>
                    <p className="text-slate-500 text-xs mt-2 italic">Optimizing for hardware limits...</p>
                </div>
            </div>
        );
    }

    if (status === 'deactivated') {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 pointer-events-none"></div>
                <div className="max-w-lg w-full bg-white/5 backdrop-blur-2xl rounded-[3rem] border border-white/10 p-12 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-700">
                    <div className="relative z-10 text-center">
                        <div className="w-20 h-20 bg-rose-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-rose-500/30">
                            <ShieldAlert size={40} className="text-rose-500 animate-pulse" />
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight uppercase">License Revoked</h1>
                        <p className="text-slate-400 mt-4 leading-relaxed">
                            Access to this node has been <span className="text-indigo-400 font-bold">Terminated</span> by the developer. Please contact SMM84 support.
                        </p>
                        <div className="mt-6 p-4 bg-white/5 rounded-2xl border border-white/10 font-mono text-[10px] text-slate-500">
                            SID: {requestId}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            {isVerified && (
                <div className="fixed bottom-4 right-4 z-[9999] pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-1000">
                    <div className="bg-slate-900/90 backdrop-blur-xl border border-emerald-500/30 px-4 py-2 rounded-2xl flex items-center space-x-3 shadow-2xl ring-1 ring-white/10">
                        <div className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-white uppercase tracking-widest leading-none">Security Verified</span>
                            <span className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">Master Link v3.2</span>
                        </div>
                        <Lock size={12} className="text-slate-500 ml-1" />
                    </div>
                </div>
            )}
            {children}
        </>
    );
};
