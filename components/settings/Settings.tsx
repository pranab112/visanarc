
import React, { useState, useEffect, useRef } from 'react';
import { Save, Building, Mail, Phone, CheckCircle2, RotateCw, Crown, Check, Loader2, Plus, X, Settings2, Trash2, Download } from 'lucide-react';
import { AgencySettings, SubscriptionPlan, Branch, User } from '../../types';
// Fix: Removed testSupabaseConnection as it is not exported from the storageService module
import { fetchSettings, saveSettings, fetchAllData, importData } from '../../services/storageService';
import { getCurrentUser, registerBranchUser } from '../../services/authService';
import { LeadFormBuilder } from './LeadFormBuilder';

interface SettingsProps {
    onOpenPublicForm?: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onOpenPublicForm }) => {
    const [activeTab, setActiveTab] = useState<'general' | 'branches' | 'leads'>('general');
    const [settings, setSettings] = useState<AgencySettings | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [newBranchName, setNewBranchName] = useState('');
    const [newBranchLoc, setNewBranchLoc] = useState('');
    const [newBranchAdminEmail, setNewBranchAdminEmail] = useState('');
    const [isCreatingBranch, setIsCreatingBranch] = useState(false);
    
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
    }, []);

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
            await registerBranchUser(`${newBranchName} Manager`, newBranchAdminEmail, branchId, user?.agencyId || 'local-dev-agency', 'branch123');
            const updated = { ...settings, branches: [...(settings.branches || []), newBranch] };
            setSettings(updated);
            await saveSettings(updated);
            setNewBranchName(''); setNewBranchLoc(''); setNewBranchAdminEmail('');
        } catch (e: any) { alert("Failed: " + e.message); } finally { setIsCreatingBranch(false); }
    };

    if (loading || !settings) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;

    const PlanCard = ({ title, price, features, recommended, type }: any) => {
        const isActive = (settings.subscription?.plan || 'Free') === type;
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
                <button disabled={isActive} className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all ${isActive ? 'bg-emerald-100 text-emerald-700 cursor-default' : 'bg-slate-900 text-white hover:bg-indigo-600 shadow-md'}`}>{isActive ? 'Current Plan' : `Upgrade`}</button>
            </div>
        )
    };

    return (
        <div className="h-full bg-slate-50 overflow-y-auto p-8 relative">
            <div className="max-w-6xl mx-auto space-y-6">
                
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Agency Settings</h1>
                        <p className="text-slate-500 mt-1">Manage agency profile and infrastructure configuration.</p>
                    </div>
                    <button onClick={handleSave} disabled={isSaving} className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl font-bold transition-all shadow-md ${saveSuccess ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white hover:bg-indigo-600'}`}>
                        {isSaving ? <RotateCw className="animate-spin" size={18} /> : saveSuccess ? <CheckCircle2 size={18} /> : <Save size={18} />}
                        <span>{isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Changes'}</span>
                    </button>
                </div>

                <div className="flex space-x-4 border-b border-slate-200">
                     {['general', 'leads', 'branches'].map(t => (
                         <button key={t} onClick={() => setActiveTab(t as any)} className={`pb-4 px-2 font-medium text-sm transition-colors relative capitalize ${activeTab === t ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'}`}>
                             {t}
                             {activeTab === t && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></div>}
                         </button>
                     ))}
                </div>

                {activeTab === 'branches' ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-6">
                            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center border-b border-slate-100 pb-4"><Plus className="mr-2 text-indigo-600" size={20}/> Deploy New Branch</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <input className="w-full p-3.5 border border-slate-200 rounded-2xl bg-white" placeholder="Branch Name" value={newBranchName} onChange={e => setNewBranchName(e.target.value)} />
                                <input className="w-full p-3.5 border border-slate-200 rounded-2xl bg-white" placeholder="Admin Email" value={newBranchAdminEmail} onChange={e => setNewBranchAdminEmail(e.target.value)} />
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
                                <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center border-b border-slate-100 pb-4"><Building className="mr-2 text-indigo-600" size={20}/> Agency Profile</h2>
                                <div className="space-y-4">
                                    <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-800" value={settings.agencyName} onChange={(e) => setSettings({...settings, agencyName: e.target.value})} />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={settings.email} onChange={(e) => setSettings({...settings, email: e.target.value})} />
                                        <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={settings.phone} onChange={(e) => setSettings({...settings, phone: e.target.value})} />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                                <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center border-b border-slate-100 pb-4"><Crown className="mr-2 text-indigo-600" size={20}/> Subscription Plans</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <PlanCard type="Free" title="Free" price="Free" features={['10 Students']} />
                                    <PlanCard type="Pro" title="Pro" price="Rs. 5,000" recommended={true} features={['50 Students', 'AI Tools']} />
                                    <PlanCard type="Enterprise" title="Enterprise" price="Custom" features={['Unlimited Students']} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
