
import React, { useState } from 'react';
import { Mail, Lock, Building, ArrowRight, Loader2, Globe, Key, ShieldCheck, CheckCircle2, User, Copy, ClipboardCheck, Sparkles, MessageCircle } from 'lucide-react';
import { login, registerAgency } from '../../services/authService';
import { User as UserType } from '../../types';

interface LoginPageProps {
    onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [agencyName, setAgencyName] = useState('');
    const [fullName, setFullName] = useState('');
    const [activationKey, setActivationKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Registration Success State
    const [regSuccess, setRegSuccess] = useState<{ owner: UserType, staff: { email: string, pass: string } } | null>(null);
    const [copied, setCopied] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (mode === 'login') {
                const user = await login(email, password);
                if (user) {
                    onLoginSuccess();
                } else {
                    setError('Invalid credentials. Please try again.');
                }
            } else {
                const result = await registerAgency(fullName, email, agencyName, activationKey);
                setRegSuccess(result);
            }
        } catch (err: any) {
            setError(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleProceedToApp = () => {
        if (!regSuccess) return;
        localStorage.setItem('sag_current_user', JSON.stringify(regSuccess.owner));
        onLoginSuccess();
    };

    if (regSuccess) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-500">
                    <div className="p-10 bg-indigo-600 text-white text-center relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                                <Sparkles size={32} className="text-white" />
                            </div>
                            <h2 className="text-3xl font-black tracking-tight">Agency Initialized!</h2>
                            <p className="text-indigo-100 mt-2 font-medium">Welcome to the Visa In Arc network.</p>
                        </div>
                        <Globe size={180} className="absolute -bottom-10 -right-10 text-white/5" />
                    </div>

                    <div className="p-10 space-y-8">
                        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-start space-x-3">
                            <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={20}/>
                            <p className="text-sm text-emerald-800 font-medium">Your workspace is ready. We've auto-created a staff account for your team.</p>
                        </div>

                        <div className="space-y-4">
                            {/* Owner Account */}
                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 relative group">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Admin Access (You)</p>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm font-bold text-slate-700">{regSuccess.owner.email}</p>
                                        <button onClick={() => copyToClipboard(regSuccess.owner.email, 'owner-e')} className="text-indigo-600 p-1.5 hover:bg-indigo-50 rounded-lg transition-all">
                                            {copied === 'owner-e' ? <ClipboardCheck size={16}/> : <Copy size={16}/>}
                                        </button>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-xs font-mono text-slate-400">Password: <span className="text-slate-900 font-bold">password</span></p>
                                        <p className="text-[10px] text-slate-400 italic">Default</p>
                                    </div>
                                </div>
                            </div>

                            {/* Staff Account */}
                            <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100 relative group">
                                <div className="flex justify-between items-center mb-3">
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Team Access (Staff)</p>
                                    <span className="text-[10px] font-black bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">AUTO-CREATED</span>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm font-bold text-indigo-700">{regSuccess.staff.email}</p>
                                        <button onClick={() => copyToClipboard(regSuccess.staff.email, 'staff-e')} className="text-indigo-600 p-1.5 hover:bg-white rounded-lg transition-all">
                                            {copied === 'staff-e' ? <ClipboardCheck size={16}/> : <Copy size={16}/>}
                                        </button>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-xs font-mono text-indigo-400">Password: <span className="text-indigo-900 font-black">{regSuccess.staff.pass}</span></p>
                                        <button onClick={() => copyToClipboard(regSuccess.staff.pass, 'staff-p')} className="text-indigo-600 p-1.5 hover:bg-white rounded-lg transition-all">
                                            {copied === 'staff-p' ? <ClipboardCheck size={16}/> : <Copy size={16}/>}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-2">
                             <button 
                                onClick={handleProceedToApp}
                                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-center active:scale-95"
                             >
                                 Proceed to Dashboard <ArrowRight size={18} className="ml-3" />
                             </button>
                             <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-6">Share these credentials with your counsellors.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="mb-8 text-center animate-in fade-in zoom-in duration-700">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 rounded-[2rem] shadow-2xl shadow-indigo-200 mb-6">
                    <Globe className="text-white w-10 h-10" />
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Visa In Arc</h1>
                <p className="text-slate-500 mt-2 font-medium">Enterprise CRM & Intelligence Platform</p>
            </div>

            <div className="bg-white w-full max-md rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-8 duration-700">
                <div className="flex border-b border-slate-100 bg-slate-50/50">
                    <button 
                        onClick={() => setMode('login')}
                        className={`flex-1 py-5 text-xs font-black uppercase tracking-widest transition-all ${mode === 'login' ? 'bg-white text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Portal Access
                    </button>
                    <button 
                        onClick={() => setMode('register')}
                        className={`flex-1 py-5 text-xs font-black uppercase tracking-widest transition-all ${mode === 'register' ? 'bg-white text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Agency Onboarding
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-6">
                    {mode === 'register' && (
                        <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                             <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 mb-6">
                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center">
                                    <ShieldCheck size={14} className="mr-2"/> Secure Registration
                                </p>
                                <p className="text-[11px] text-indigo-400 mt-1">Initialize your dedicated agency workspace.</p>
                             </div>

                             <div className="grid grid-cols-1 gap-5">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Principal Consultant Name</label>
                                    <input 
                                        className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-400 outline-none transition-all font-bold text-sm"
                                        placeholder="Full Name"
                                        value={fullName}
                                        onChange={e => setFullName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Legal Agency Name</label>
                                    <div className="relative">
                                        <Building className="absolute left-4 top-4 text-slate-300" size={18}/>
                                        <input 
                                            className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-2xl bg-slate-50 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-400 outline-none transition-all font-bold text-sm"
                                            placeholder="e.g. Global Education Pvt. Ltd."
                                            value={agencyName}
                                            onChange={e => setAgencyName(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                             </div>

                             <div className="pt-2">
                                <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5 ml-1 flex items-center">
                                    <Key size={12} className="mr-1.5"/> Pre-Paid Activation Key (Optional)
                                </label>
                                <input 
                                    className="w-full p-4 border border-indigo-100 rounded-2xl bg-indigo-50/30 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-400 outline-none transition-all font-mono text-xs uppercase placeholder:font-sans placeholder:text-slate-300"
                                    placeholder="Enter key if you have already paid"
                                    value={activationKey}
                                    onChange={e => setActivationKey(e.target.value.toUpperCase())}
                                />
                                {activationKey.length > 5 && (
                                    <p className="text-[9px] text-emerald-600 font-bold mt-2 flex items-center">
                                        <CheckCircle2 size={12} className="mr-1"/> Verification will occur during setup
                                    </p>
                                )}
                             </div>
                        </div>
                    )}

                    <div className="space-y-5">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Work Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-4 text-slate-300" size={18}/>
                                <input 
                                    type="email"
                                    className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-2xl bg-slate-50 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-400 outline-none transition-all font-bold text-sm"
                                    placeholder="admin@agency.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Portal Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-4 text-slate-300" size={18}/>
                                <input 
                                    type="password"
                                    className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-2xl bg-slate-50 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-400 outline-none transition-all font-bold text-sm"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-rose-50 text-rose-600 text-xs font-bold rounded-2xl flex items-start border border-rose-100">
                             <div className="w-1.5 h-1.5 bg-rose-500 rounded-full mr-3 mt-1.5 shrink-0"></div>
                             {error}
                        </div>
                    )}

                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-2xl shadow-indigo-100 flex items-center justify-center active:scale-95 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : (
                            <>
                                <span>{mode === 'login' ? 'Enter Workspace' : 'Initialize Agency'}</span>
                                <ArrowRight size={18} className="ml-3" />
                            </>
                        )}
                    </button>
                    
                    {mode === 'login' && (
                        <div className="text-center">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Authorized Access Only</p>
                        </div>
                    )}
                </form>
            </div>
            
            <div className="mt-12 text-center space-y-2 opacity-50">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">© 2025 GTSDevs. Built for SMM84 Excellence.</p>
                <div className="flex justify-center space-x-4">
                    <span className="text-[9px] text-slate-400 font-medium">Privacy Policy</span>
                    <span className="text-[9px] text-slate-400 font-medium">Terms of Service</span>
                    <span className="text-[9px] text-slate-400 font-medium">Cloud Status: Active</span>
                </div>
            </div>
        </div>
    );
};
