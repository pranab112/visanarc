import React, { useState, useEffect, useRef } from 'react';
import { Save, Building, Mail, Phone, MapPin, Globe, Bell, Download, Trash2, CheckCircle2, RotateCw, Upload, Crown, Check, CreditCard, ShieldCheck, Star, Wallet, Loader2, MessageCircle, FileText, Magnet, GraduationCap, Network, Plus, X, Settings2, Lock, Sparkles, ArrowRight, UserCheck, Key, Copy, ClipboardCheck, Cloud, CloudOff, Activity, Activity as Pulse, PlayCircle, AlertTriangle, ShieldAlert, Zap, History, Database } from 'lucide-react';
import { AgencySettings, Country, SubscriptionPlan, Branch, User } from '../../types';
import { fetchSettings, saveSettings, fetchAllData, importData, testSupabaseConnection } from '../../services/storageService';
import { getCurrentUser, registerBranchUser } from '../../services/authService';
import { LeadFormBuilder } from './LeadFormBuilder';
import { isSupabaseConfigured, AGENCY_URL, gtdevsHQ } from '../../services/supabaseClient';

interface SettingsProps {
    onOpenPublicForm?: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onOpenPublicForm }) => {
    const [activeTab, setActiveTab] = useState<'general' | 'branches' | 'leads' | 'security'>('general');
    const [settings, setSettings] = useState<AgencySettings | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Connectivity Test State
    const [isTestingConn, setIsTestingConn] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [lastHandshake, setLastHandshake] = useState<string | null>(localStorage.getItem('sag_last_handshake'));
    const [onboardingData, setOnboardingData] = useState<any>(null);
    const [isCheckingRegistry, setIsCheckingRegistry] = useState(false);

    // Payment Modal State
    const [showUpgradeModal, setShowUpgradeModal] = useState<SubscriptionPlan | null>(null);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    // Branch Form State
    const [newBranchName, setNewBranchName] = useState('');
    const [newBranchLoc, setNewBranchLoc] = useState('');
    const [newBranchAdminName, setNewBranchAdminName] = useState('');
    const [newBranchAdminEmail, setNewBranchAdminEmail] = useState('');
    const [newBranchAdminPass, setNewBranchAdminPass] = useState('branch123');
    const [isCreatingBranch, setIsCreatingBranch] = useState(false);
    
    const [createdCredentials, setCreatedCredentials] = useState<{ email: string, pass: string, branch: string } | null>(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const [s, u] = await Promise.all([
                fetchSettings(),
                Promise.resolve(getCurrentUser())
            ]);
            setSettings(s);
            setUser(u);
            setLoading(false);
        };
        load();

        const handleSecurityPass = () => {
            setLastHandshake(localStorage.getItem('sag_last_handshake'));
        };
        window.addEventListener('security_check_passed', handleSecurityPass);
        return () => window.removeEventListener('security_check_passed', handleSecurityPass);
    }, []);

    const checkOnboardingRegistry = async () => {
        setIsCheckingRegistry(true);
        try {
            const { data, error } = await gtdevsHQ
                .from('master_onboarding')
                .select('*')
                .eq('database_url', AGENCY_URL)
                .maybeSingle();
            
            if (data) setOnboardingData(data);
            else setOnboardingData({ error: 'No record found. Re-onboarding may be required.' });
        } catch (e) {
            setOnboardingData({ error: 'Master Registry Connection Failed.' });
        } finally {
            setIsCheckingRegistry(false);
        }
    };

    const handleRunDiagnostic = async () => {
        setIsTestingConn(true);
        setTestResult(null);
        const result = await testSupabaseConnection();
        setTestResult(result);
        if (result.success) {
             const now = new Date().toISOString();
             localStorage.setItem('sag_last_handshake', now);
             setLastHandshake(now);
        }
        setIsTestingConn(false);
    };

    const handleSave = async () => {
        if (!settings) return;
        setIsSaving(true);
        await saveSettings(settings);
        setIsSaving(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
    };

    const handleAddBranch = async () => {
        if(!newBranchName || !newBranchAdminEmail || !settings) return;
        setIsCreatingBranch(true);
        try {
            const branchId = 'br_' + Date.now();
            const newBranch: Branch = { id: branchId, name: newBranchName, location: newBranchLoc || newBranchName };
            await registerBranchUser(newBranchAdminName || `${newBranchName} Manager`, newBranchAdminEmail, branchId, user?.agencyId || 'local-dev-agency', newBranchAdminPass);
            const updated = { ...settings, branches: [...(settings.branches || []), newBranch] };
            setSettings(updated);
            await saveSettings(updated);
            setCreatedCredentials({ email: newBranchAdminEmail, pass: newBranchAdminPass, branch: newBranchName });
            setNewBranchName(''); setNewBranchLoc(''); setNewBranchAdminName(''); setNewBranchAdminEmail('');
        } catch (e: any) { alert("Failed: " + e.message); } finally { setIsCreatingBranch(false); }
    };

    const handleExport = async () => {
        const data = await fetchAllData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `visa_in_arc_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleImportClick = () => fileInputRef.current?.click();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            if (importData(content)) { alert("Data imported successfully."); window.location.reload(); }
            else { alert("Failed to import data."); }
        };
        reader.readAsText(file);
    };

    if (loading || !settings) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;

    const currentPlan = settings.subscription?.plan || 'Free';

    const PlanCard = ({ title, price, features, recommended, type }: any) => {
        const isActive = currentPlan === type;
        return (
            <div className={`relative p-6 rounded-2xl border flex flex-col ${isActive ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500' : 'bg-white border-slate-200'}`}>
                {recommended && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">Most Popular</span>}
                <div className="mb-4">
                    <h3 className="font-bold text-lg text-slate-800">{title}</h3>
                    <div className="flex items-baseline mt-2"><span className="text-3xl font-bold text-slate-900">{price}</span></div>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                    {features.map((f: string, i: number) => (
                        <li key={i} className="flex items-start text-sm text-slate-600">
                            <Check size={16} className="text-emerald-500 mr-2 flex-shrink-0 mt-0.5" />
                            <span>{f}</span>
                        </li>
                    ))}
                </ul>
                <button onClick={() => !isActive && setShowUpgradeModal(type)} disabled={isActive} className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all ${isActive ? 'bg-emerald-100 text-emerald-700 cursor-default' : 'bg-slate-900 text-white hover:bg-indigo-600 shadow-md'}`}>{isActive ? 'Current Plan' : `Upgrade`}</button>
            </div>
        )
    };

    return (
        <div className="h-full bg-slate-50 overflow-y-auto p-8 relative">
            <div className="max-w-6xl mx-auto space-y-6">
                
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Agency Settings</h1>
                        <p className="text-slate-500 mt-1">Manage agency profile and infrastructure integrity.</p>
                    </div>
                    {activeTab !== 'security' && (
                        <button onClick={handleSave} disabled={isSaving} className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl font-bold transition-all shadow-md ${saveSuccess ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white hover:bg-indigo-600'}`}>
                            {isSaving ? <RotateCw className="animate-spin" size={18} /> : saveSuccess ? <CheckCircle2 size={18} /> : <Save size={18} />}
                            <span>{isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Changes'}</span>
                        </button>
                    )}
                </div>

                <div className="flex space-x-4 border-b border-slate-200">
                     {['general', 'leads', 'branches', 'security'].map(t => (
                         <button key={t} onClick={() => setActiveTab(t as any)} className={`pb-4 px-2 font-medium text-sm transition-colors relative capitalize ${activeTab === t ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'}`}>
                             {t === 'security' ? <span className="flex items-center text-indigo-600"><ShieldCheck size={14} className="mr-1.5"/> Security & Audit</span> : t}
                             {activeTab === t && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></div>}
                         </button>
                     ))}
                </div>

                {activeTab === 'security' ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl space-y-8 pb-20">
                         {/* Infrastructure Pulse Section */}
                         <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                             <div className="relative z-10 space-y-6">
                                <div className="flex items-center space-x-4">
                                    <div className="p-4 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-500/20"><ShieldCheck size={32} /></div>
                                    <div>
                                        <h2 className="text-2xl font-black uppercase tracking-tight">Security Handshake</h2>
                                        <p className="text-indigo-300 font-medium">Automatic Licensing & Registry Sync</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                    <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Master Connection</p>
                                        <div className="flex items-center space-x-2">
                                            <div className={`w-2 h-2 rounded-full animate-pulse ${lastHandshake ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                                            <span className="text-sm font-bold">{lastHandshake ? 'Secure Link Active' : 'Link Pending'}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 mt-2 font-mono uppercase truncate">DB: {AGENCY_URL}</p>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Code Integrity</p>
                                        <div className="flex items-center space-x-2"><ShieldCheck className="text-indigo-400" size={16} /><span className="text-sm font-bold">Lockdown Enabled</span></div>
                                        <p className="text-[10px] text-slate-500 mt-2 font-mono uppercase">Status: PROTECTED</p>
                                    </div>
                                </div>
                             </div>
                             <ShieldAlert size={300} className="absolute -bottom-20 -right-20 text-white/5 pointer-events-none" />
                         </div>

                         {/* Onboarding Diagnostic Tool */}
                         <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm">
                             <div className="flex justify-between items-start mb-8">
                                 <div>
                                     <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center">
                                         <History size={24} className="mr-3 text-indigo-600" /> Onboarding Registry Check
                                     </h3>
                                     <p className="text-sm text-slate-500 mt-1">Verify your agency's permanent record in the Master Sales Database.</p>
                                 </div>
                                 <button 
                                    onClick={checkOnboardingRegistry}
                                    disabled={isCheckingRegistry}
                                    className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all flex items-center"
                                 >
                                     {isCheckingRegistry ? <Loader2 size={14} className="animate-spin mr-2"/> : <RotateCw size={14} className="mr-2"/>}
                                     Fetch Records
                                 </button>
                             </div>

                             {onboardingData ? (
                                 onboardingData.error ? (
                                     <div className="p-6 bg-rose-50 border border-rose-100 rounded-3xl flex items-center space-x-4 text-rose-700 animate-in slide-in-from-top-2">
                                         <AlertTriangle size={24} />
                                         <div>
                                             <p className="text-sm font-bold">No Onboarding Record Found</p>
                                             <p className="text-xs opacity-80">This usually means the initial registration failed or was bypassed.</p>
                                         </div>
                                     </div>
                                 ) : (
                                     <div className="space-y-4 animate-in slide-in-from-top-2">
                                         <div className="grid grid-cols-2 gap-4">
                                             <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                                 <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Agency Name in Registry</p>
                                                 <p className="text-sm font-bold text-slate-800">{onboardingData.agency_name}</p>
                                             </div>
                                             <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                                 <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Onboarding Timestamp</p>
                                                 <p className="text-sm font-bold text-slate-800">{new Date(onboardingData.timestamp).toLocaleString()}</p>
                                             </div>
                                         </div>
                                         <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between">
                                             <div className="flex items-center space-x-3">
                                                 <CheckCircle2 className="text-emerald-600" size={20} />
                                                 <span className="text-sm font-bold text-emerald-800">Master Record Verified Successfully</span>
                                             </div>
                                             <p className="text-[10px] font-mono font-bold text-emerald-600">ID: {onboardingData.agency_id}</p>
                                         </div>
                                     </div>
                                 )
                             ) : (
                                 <div className="py-12 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center text-slate-300">
                                     <Database size={40} className="mb-3 opacity-20" />
                                     <p className="text-xs font-bold uppercase tracking-widest">Click 'Fetch Records' to verify registry status</p>
                                 </div>
                             )}
                         </div>

                         {/* Diagnostic Panel */}
                         <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                             <h3 className="font-bold text-slate-800 mb-6 flex items-center border-b border-slate-100 pb-4"><Activity size={18} className="mr-2 text-indigo-600"/> Heartbeat Diagnostic</h3>
                             <div className="space-y-4">
                                 {testResult && (
                                     <div className={`p-4 rounded-2xl border flex items-center space-x-3 animate-in slide-in-from-top-2 ${testResult.success ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
                                         {testResult.success ? <CheckCircle2 size={18}/> : <AlertTriangle size={18}/>}
                                         <span className="text-sm font-bold">{testResult.message}</span>
                                     </div>
                                 )}
                                 <button onClick={handleRunDiagnostic} disabled={isTestingConn} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl flex items-center justify-center disabled:opacity-50">
                                     {isTestingConn ? <Loader2 className="animate-spin mr-2" size={16}/> : <RotateCw className="mr-2" size={16}/>}
                                     {isTestingConn ? 'Scanning...' : 'Ping Master Integrity'}
                                 </button>
                             </div>
                         </div>
                    </div>
                ) : activeTab === 'branches' ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl space-y-6">
                        {createdCredentials && (
                            <div className="bg-emerald-600 text-white rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-4"><div className="flex items-center"><div className="bg-white/20 p-2 rounded-xl mr-3"><UserCheck size={24} /></div><h3 className="font-black text-lg">Branch Deployed</h3></div><button onClick={() => setCreatedCredentials(null)} className="p-1 hover:bg-white/10 rounded-lg"><X size={20}/></button></div>
                                    <div className="bg-white/10 p-4 rounded-xl border border-white/20 backdrop-blur-sm space-y-3">
                                        <div className="flex justify-between items-center"><p className="text-xs text-emerald-100 uppercase font-black">Email</p><span className="font-mono text-sm">{createdCredentials.email}</span></div>
                                        <div className="flex justify-between items-center"><p className="text-xs text-emerald-100 uppercase font-black">Password</p><span className="font-mono text-sm font-bold">{createdCredentials.pass}</span></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-6">
                            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center border-b border-slate-100 pb-4"><Plus className="mr-2 text-indigo-600" size={20}/> Deploy New Branch</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <input className="w-full p-3.5 border border-slate-200 rounded-2xl bg-white" placeholder="Branch Name" value={newBranchName} onChange={e => setNewBranchName(e.target.value)} />
                                <input className="w-full p-3.5 border border-slate-200 rounded-2xl bg-white" placeholder="Email" value={newBranchAdminEmail} onChange={e => setNewBranchAdminEmail(e.target.value)} />
                            </div>
                            <button onClick={handleAddBranch} disabled={!newBranchName || isCreatingBranch} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center">{isCreatingBranch ? <Loader2 className="animate-spin mr-2" size={18}/> : <Plus className="mr-2" size={18}/>} Confirm Activation</button>
                        </div>
                    </div>
                ) : activeTab === 'leads' ? (
                    <LeadFormBuilder onPreview={onOpenPublicForm || (() => {})} />
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                                <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center border-b border-slate-100 pb-4"><Building className="mr-2 text-indigo-600" size={20}/> Profile</h2>
                                <div className="space-y-4">
                                    <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-800" value={settings.agencyName} onChange={(e) => setSettings({...settings, agencyName: e.target.value})} />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={settings.email} onChange={(e) => setSettings({...settings, email: e.target.value})} />
                                        <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={settings.phone} onChange={(e) => setSettings({...settings, phone: e.target.value})} />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                                <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center border-b border-slate-100 pb-4"><Crown className="mr-2 text-indigo-600" size={20}/> Plans</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <PlanCard type="Free" title="Free" price="Free" features={['10 Students']} />
                                    <PlanCard type="Pro" title="Pro" price="Rs. 5,000" recommended={true} features={['50 Students', 'AI Tools']} />
                                    <PlanCard type="Enterprise" title="Enterprise" price="Custom" features={['Unlimited']} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};