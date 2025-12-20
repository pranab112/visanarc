
import React, { useState, useEffect, useRef } from 'react';
import { Save, Building, Mail, Phone, MapPin, Globe, Bell, Download, Trash2, CheckCircle2, RotateCw, Upload, Crown, Check, CreditCard, ShieldCheck, Star, Wallet, Loader2, MessageCircle, FileText, Magnet, GraduationCap, Network, Plus, X } from 'lucide-react';
import { AgencySettings, Country, SubscriptionPlan, Branch } from '../../types';
import { fetchSettings, saveSettings, fetchAllData, clearAllData, importData } from '../../services/storageService';
import { LeadFormBuilder } from './LeadFormBuilder';

interface SettingsProps {
    onOpenPublicForm?: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onOpenPublicForm }) => {
    const [activeTab, setActiveTab] = useState<'general' | 'lead-form' | 'branches'>('general');
    const [settings, setSettings] = useState<AgencySettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Payment Modal State
    const [showUpgradeModal, setShowUpgradeModal] = useState<SubscriptionPlan | null>(null);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    // Branch Form
    const [newBranchName, setNewBranchName] = useState('');
    const [newBranchLoc, setNewBranchLoc] = useState('');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const s = await fetchSettings();
            setSettings(s);
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
        window.location.reload(); // Reload to reflect changes globally
    };

    const handleAddBranch = async () => {
        if(!newBranchName || !settings) return;
        const newBranch: Branch = {
            id: 'br_' + Date.now(),
            name: newBranchName,
            location: newBranchLoc || newBranchName
        };
        const updated = {
            ...settings,
            branches: [...(settings.branches || []), newBranch]
        };
        setSettings(updated);
        await saveSettings(updated);
        setNewBranchName('');
        setNewBranchLoc('');
    };

    const handleDeleteBranch = async (id: string) => {
        if(!settings || !window.confirm("Delete this branch?")) return;
        if(id === 'main') {
            alert("Cannot delete Head Office.");
            return;
        }
        const updated = {
            ...settings,
            branches: (settings.branches || []).filter(b => b.id !== id)
        };
        setSettings(updated);
        await saveSettings(updated);
    };

    const handleExport = async () => {
        const data = await fetchAllData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `studyabroad_genius_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            if (importData(content)) {
                alert("Data imported successfully. The application will now reload.");
                window.location.reload();
            } else {
                alert("Failed to import data. Invalid file format.");
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleReset = async () => {
        if (window.confirm("CRITICAL WARNING: This will delete ALL students, invoices, and partner data stored on this device. This action cannot be undone.\n\nAre you sure you want to reset the application?")) {
            if(window.confirm("Please confirm again. All data will be lost.")) {
                await clearAllData();
                window.location.reload();
            }
        }
    };

    const processUpgrade = (gateway: 'Khalti' | 'Esewa') => {
        if (!showUpgradeModal || !settings) return;
        setIsProcessingPayment(true);
        
        // Simulate API call to Gateway
        setTimeout(async () => {
            setIsProcessingPayment(false);
            const newSettings = {
                ...settings,
                subscription: {
                    plan: showUpgradeModal,
                    expiryDate: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
                }
            };
            setSettings(newSettings);
            await saveSettings(newSettings);
            
            setShowUpgradeModal(null);
            alert(`Payment Successful via ${gateway}! Plan upgraded to ${showUpgradeModal}.`);
            window.location.reload();
        }, 2000);
    };

    if (loading || !settings) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;

    const currentPlan = settings.subscription?.plan || 'Free';

    const PlanCard = ({ title, price, features, recommended, type }: { title: string, price: string, features: string[], recommended?: boolean, type: SubscriptionPlan }) => {
        const isActive = currentPlan === type;
        return (
            <div className={`relative p-6 rounded-2xl border flex flex-col ${isActive ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500' : 'bg-white border-slate-200'}`}>
                {recommended && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">Most Popular</span>}
                <div className="mb-4">
                    <h3 className="font-bold text-lg text-slate-800">{title}</h3>
                    <div className="flex items-baseline mt-2">
                        <span className="text-3xl font-bold text-slate-900">{price}</span>
                        {price !== 'Free' && <span className="text-sm text-slate-500 ml-1">/mo</span>}
                    </div>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                    {features.map((f, i) => (
                        <li key={i} className="flex items-start text-sm text-slate-600">
                            <Check size={16} className="text-emerald-500 mr-2 flex-shrink-0 mt-0.5" />
                            <span>{f}</span>
                        </li>
                    ))}
                </ul>
                <button 
                    onClick={() => {
                        if (isActive) return;
                        setShowUpgradeModal(type);
                    }}
                    disabled={isActive}
                    className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all ${
                        isActive 
                        ? 'bg-emerald-100 text-emerald-700 cursor-default' 
                        : 'bg-slate-900 text-white hover:bg-indigo-600 shadow-md'
                    }`}
                >
                    {isActive ? 'Current Plan' : `Upgrade to ${title}`}
                </button>
            </div>
        )
    };

    return (
        <div className="h-full bg-slate-50 overflow-y-auto p-8 relative">
            <div className="max-w-6xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Agency Settings</h1>
                        <p className="text-slate-500 mt-1">Manage your agency profile, preferences, and data.</p>
                    </div>
                    {activeTab === 'general' && (
                        <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl font-bold transition-all shadow-md ${
                                saveSuccess 
                                ? 'bg-emerald-600 text-white' 
                                : 'bg-slate-900 text-white hover:bg-indigo-600'
                            }`}
                        >
                            {isSaving ? <RotateCw className="animate-spin" size={18} /> : saveSuccess ? <CheckCircle2 size={18} /> : <Save size={18} />}
                            <span>{isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Changes'}</span>
                        </button>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex space-x-4 border-b border-slate-200">
                     <button 
                        onClick={() => setActiveTab('general')}
                        className={`pb-4 px-2 font-medium text-sm transition-colors relative ${activeTab === 'general' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
                     >
                         General Settings
                         {activeTab === 'general' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></div>}
                     </button>
                     <button 
                        onClick={() => setActiveTab('branches')}
                        className={`pb-4 px-2 font-medium text-sm transition-colors relative flex items-center ${activeTab === 'branches' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
                     >
                         <Network size={16} className="mr-2"/>
                         Branch Management
                         {activeTab === 'branches' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></div>}
                     </button>
                     <button 
                        onClick={() => setActiveTab('lead-form')}
                        className={`pb-4 px-2 font-medium text-sm transition-colors relative flex items-center ${activeTab === 'lead-form' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
                     >
                         <Magnet size={16} className="mr-2"/>
                         Lead Capture
                         {activeTab === 'lead-form' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></div>}
                     </button>
                </div>

                {activeTab === 'lead-form' ? (
                    <LeadFormBuilder onPreview={() => onOpenPublicForm && onOpenPublicForm()} />
                ) : activeTab === 'branches' ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
                            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center border-b border-slate-100 pb-4">
                                <Network className="mr-2 text-indigo-600" size={20}/> Enterprise Branch Management
                            </h2>
                            <p className="text-sm text-slate-500 mb-6">Create multiple branches to track performance, students, and financials separately. The Head Office can view data from all branches.</p>
                            
                            <div className="flex gap-4 items-end mb-8 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Branch Name</label>
                                    <input className="w-full p-3 border border-slate-200 rounded-lg text-sm bg-white" placeholder="e.g. Chitwan Branch" value={newBranchName} onChange={e => setNewBranchName(e.target.value)} />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Location</label>
                                    <input className="w-full p-3 border border-slate-200 rounded-lg text-sm bg-white" placeholder="e.g. Bharatpur-10" value={newBranchLoc} onChange={e => setNewBranchLoc(e.target.value)} />
                                </div>
                                <button onClick={handleAddBranch} disabled={!newBranchName} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center">
                                    <Plus size={16} className="mr-2"/> Add Branch
                                </button>
                            </div>

                            <div className="space-y-3">
                                {(settings.branches || []).map(branch => (
                                    <div key={branch.id} className="flex justify-between items-center p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors bg-white">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                                <Building size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800 text-sm">{branch.name}</h4>
                                                <p className="text-xs text-slate-500">{branch.location} • ID: {branch.id}</p>
                                            </div>
                                        </div>
                                        {branch.id !== 'main' && (
                                            <button onClick={() => handleDeleteBranch(branch.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                        {branch.id === 'main' && (
                                            <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded">Head Office</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    
                        {/* Left Column: Profile & System */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                                <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center border-b border-slate-100 pb-4">
                                    <Building className="mr-2 text-indigo-600" size={20}/> Agency Profile
                                </h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Agency Name</label>
                                        <div className="relative">
                                            <Building className="absolute left-3 top-3 text-slate-400" size={16}/>
                                            <input className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-medium text-slate-800" value={settings.agencyName} onChange={(e) => setSettings({...settings, agencyName: e.target.value})} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contact Email</label>
                                            <div className="relative"><Mail className="absolute left-3 top-3 text-slate-400" size={16}/><input className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-sm" value={settings.email} onChange={(e) => setSettings({...settings, email: e.target.value})} /></div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone Number</label>
                                            <div className="relative"><Phone className="absolute left-3 top-3 text-slate-400" size={16}/><input className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-sm" value={settings.phone} onChange={(e) => setSettings({...settings, phone: e.target.value})} /></div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Office Address</label>
                                        <div className="relative"><MapPin className="absolute left-3 top-3 text-slate-400" size={16}/><input className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-sm" value={settings.address} onChange={(e) => setSettings({...settings, address: e.target.value})} /></div>
                                    </div>
                                </div>
                            </div>

                            {/* Subscription Plans */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                                <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center border-b border-slate-100 pb-4">
                                    <Crown className="mr-2 text-indigo-600" size={20}/> Subscription & Billing
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <PlanCard 
                                        type="Free"
                                        title="Free Starter"
                                        price="Free"
                                        features={['1 User Account', 'Max 10 Students', 'Basic Document Checklist', 'No AI Tools']}
                                    />
                                    <PlanCard 
                                        type="Pro"
                                        title="Agency Pro"
                                        price="Rs. 5,000"
                                        recommended={true}
                                        features={['5 User Accounts', 'Unlimited Students', 'Full AI Tools Suite', 'Email Automation', 'Priority Support']}
                                    />
                                    <PlanCard 
                                        type="Enterprise"
                                        title="Enterprise"
                                        price="Custom"
                                        features={['Unlimited Users', 'Whitelabel Portal', 'Custom Domain', 'Dedicated Account Manager', 'API Access']}
                                    />
                                </div>
                            </div>

                            {/* Communication Templates */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                                <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center border-b border-slate-100 pb-4">
                                    <MessageCircle className="mr-2 text-indigo-600" size={20}/> Communication Templates
                                </h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Visa Granted Email Template</label>
                                        <textarea 
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-sm h-32" 
                                            value={settings.templates?.emailVisaGranted || ''} 
                                            onChange={(e) => setSettings({...settings, templates: { ...settings.templates!, emailVisaGranted: e.target.value }})}
                                        />
                                        <p className="text-[10px] text-slate-400 mt-1">Available variables: {'{student_name}'}, {'{country}'}, {'{agency_name}'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">WhatsApp Update Template</label>
                                        <textarea 
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-sm h-20" 
                                            value={settings.templates?.whatsappUpdate || ''} 
                                            onChange={(e) => setSettings({...settings, templates: { ...settings.templates!, whatsappUpdate: e.target.value }})}
                                        />
                                        <p className="text-[10px] text-slate-400 mt-1">Available variables: {'{student_name}'}, {'{country}'}, {'{status}'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* System Preferences */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                                <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center border-b border-slate-100 pb-4">
                                    <Globe className="mr-2 text-indigo-600" size={20}/> System Preferences
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Default Target Country</label>
                                        <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-sm" value={settings.defaultCountry} onChange={(e) => setSettings({...settings, defaultCountry: e.target.value as Country})}>
                                            {Object.values(Country).map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                        <p className="text-[10px] text-slate-400 mt-1">Pre-selected for new students.</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Currency</label>
                                        <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-sm" value={settings.currency} onChange={(e) => setSettings({...settings, currency: e.target.value})}>
                                            <option value="NPR">NPR (Nepalese Rupee)</option><option value="USD">USD (US Dollar)</option><option value="AUD">AUD (Australian Dollar)</option><option value="GBP">GBP (British Pound)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Data Management */}
                        <div className="space-y-6">
                            <div className="bg-indigo-900 text-white rounded-2xl shadow-xl p-6 relative overflow-hidden">
                                <div className="relative z-10">
                                    <h3 className="font-bold text-lg mb-2">Data Management</h3>
                                    <p className="text-indigo-200 text-sm mb-6">Backup or restore your data safely.</p>
                                    <div className="space-y-3">
                                        <button onClick={handleExport} className="w-full bg-white text-indigo-900 font-bold py-3 px-4 rounded-xl flex items-center justify-center hover:bg-indigo-50 transition-colors"><Download size={18} className="mr-2"/> Export Data</button>
                                        <button onClick={handleImportClick} className="w-full bg-indigo-800 text-white border border-indigo-700 font-bold py-3 px-4 rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-colors"><Upload size={18} className="mr-2"/> Import Data</button>
                                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
                                    </div>
                                </div>
                                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><Download size={120} /></div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6 relative overflow-hidden">
                                <h3 className="font-bold text-red-900 mb-2 flex items-center"><Trash2 size={18} className="mr-2"/> Danger Zone</h3>
                                <p className="text-slate-500 text-xs mb-6">Irreversible actions. Proceed with caution.</p>
                                <button onClick={handleReset} className="w-full bg-red-50 text-red-600 border border-red-100 font-bold py-3 px-4 rounded-xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all">Reset Application</button>
                            </div>

                            <div className="bg-slate-100 rounded-xl p-4 text-xs text-slate-500 text-center">
                                <p className="font-bold text-slate-600">StudyAbroad Genius</p>
                                <p>Version 3.0-I2 (Restore Point)</p>
                                <p className="mt-1">Licensed to: {settings.agencyName}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Payment Modal */}
            {showUpgradeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="font-bold text-xl text-slate-900">Upgrade to {showUpgradeModal}</h3>
                            <p className="text-slate-500 text-sm mt-1">Select your preferred payment method</p>
                        </div>
                        <div className="p-6 space-y-4">
                            {isProcessingPayment ? (
                                <div className="flex flex-col items-center justify-center py-8">
                                    <RotateCw className="animate-spin text-indigo-600 mb-4" size={48} />
                                    <p className="font-bold text-slate-800">Processing Payment...</p>
                                    <p className="text-xs text-slate-400">Please wait while we verify your transaction.</p>
                                </div>
                            ) : (
                                <>
                                    <button 
                                        onClick={() => processUpgrade('Esewa')}
                                        className="w-full bg-[#60BB46] text-white p-4 rounded-xl font-bold flex items-center justify-between hover:bg-[#54a33d] transition-colors shadow-sm group"
                                    >
                                        <div className="flex items-center">
                                            <div className="bg-white/20 p-2 rounded-lg mr-3">
                                                <Wallet size={24} />
                                            </div>
                                            <div className="text-left">
                                                <span className="block text-sm">Pay with</span>
                                                <span className="text-lg">eSewa</span>
                                            </div>
                                        </div>
                                        <ChevronRightIcon className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                    
                                    <button 
                                        onClick={() => processUpgrade('Khalti')}
                                        className="w-full bg-[#5C2D91] text-white p-4 rounded-xl font-bold flex items-center justify-between hover:bg-[#4b2475] transition-colors shadow-sm group"
                                    >
                                        <div className="flex items-center">
                                            <div className="bg-white/20 p-2 rounded-lg mr-3">
                                                <CreditCard size={24} />
                                            </div>
                                            <div className="text-left">
                                                <span className="block text-sm">Pay with</span>
                                                <span className="text-lg">Khalti</span>
                                            </div>
                                        </div>
                                        <ChevronRightIcon className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                </>
                            )}
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-center">
                             {!isProcessingPayment && (
                                <button onClick={() => setShowUpgradeModal(null)} className="text-slate-500 font-bold text-sm hover:text-slate-800">Cancel</button>
                             )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ChevronRightIcon = ({ className }: {className?: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 18 6-6-6-6"/></svg>
);
