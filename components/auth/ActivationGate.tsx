
import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, UploadCloud, CheckCircle2, Loader2, Landmark, Wallet, Phone, Mail, LogOut, ArrowRight, Zap, RefreshCcw } from 'lucide-react';
import { logout } from '../../services/authService';
import { submitPaymentReceipt } from '../../services/storageService';

interface ActivationGateProps {
    status: 'pending' | 'reviewing';
    agencyName: string;
}

export const ActivationGate: React.FC<ActivationGateProps> = ({ status, agencyName }) => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        try {
            await submitPaymentReceipt(file);
            setSuccess(true);
            // In a real app, you'd trigger a reload or wait for real-time update
            setTimeout(() => window.location.reload(), 3000);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setUploading(false);
        }
    };

    if (status === 'reviewing' || success) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="max-w-lg w-full bg-white/5 backdrop-blur-2xl rounded-[3rem] border border-white/10 p-12 shadow-2xl text-center animate-in zoom-in-95 duration-700">
                    <div className="w-20 h-20 bg-indigo-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-indigo-500/30">
                        <RefreshCcw size={40} className="text-indigo-400 animate-spin-slow" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight uppercase">Verification in Progress</h1>
                    <p className="text-slate-400 mt-4 leading-relaxed">
                        We have received your payment receipt for <span className="text-indigo-400 font-bold">{agencyName}</span>. 
                        Our team is manually verifying the transaction with the bank.
                    </p>
                    <div className="mt-8 bg-indigo-500/10 p-6 rounded-2xl border border-indigo-500/20">
                        <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em]">Estimated Activation</p>
                        <p className="text-lg font-bold text-white mt-1">2 - 6 Business Hours</p>
                    </div>
                    <button onClick={logout} className="mt-10 text-slate-500 hover:text-white transition-colors flex items-center justify-center mx-auto space-x-2">
                        <LogOut size={16} />
                        <span className="text-sm font-bold">Sign Out</span>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 overflow-y-auto py-20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 pointer-events-none"></div>
            
            <div className="relative z-10 max-w-4xl w-full">
                <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-1000">
                    <div className="inline-flex p-4 bg-indigo-600 rounded-[2rem] shadow-2xl shadow-indigo-500/20 mb-6">
                        <ShieldCheck size={48} className="text-white" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                        Activation Required
                    </h1>
                    <p className="text-slate-400 mt-3 text-lg font-medium">Initialize your agency workspace in the Visa In Arc network.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    {/* Option 1: Nepal */}
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] hover:bg-white/[0.07] transition-all group">
                        <div className="flex items-center space-x-4 mb-6">
                            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl group-hover:scale-110 transition-transform">
                                <Wallet size={24} />
                            </div>
                            <h3 className="text-xl font-black text-white">Domestic (Nepal)</h3>
                        </div>
                        <ul className="space-y-4">
                            <li className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">eSewa / Khalti</span>
                                <span className="text-sm font-black text-emerald-400">9841000000</span>
                            </li>
                            <li className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Fonepay QR</p>
                                <div className="h-32 bg-slate-800 rounded-xl flex items-center justify-center border border-white/10">
                                    <span className="text-[10px] text-slate-600 font-mono italic">[QR IMAGE PLACEHOLDER]</span>
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* Option 2: International */}
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] hover:bg-white/[0.07] transition-all group">
                        <div className="flex items-center space-x-4 mb-6">
                            <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl group-hover:scale-110 transition-transform">
                                <Landmark size={24} />
                            </div>
                            <h3 className="text-xl font-black text-white">International</h3>
                        </div>
                        <ul className="space-y-4">
                            <li className="flex flex-col p-4 bg-white/5 rounded-2xl border border-white/5">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Payoneer / Wise</span>
                                <span className="text-sm font-black text-indigo-400">billing@visainarc.com</span>
                            </li>
                            <li className="flex flex-col p-4 bg-white/5 rounded-2xl border border-white/5">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Bank Transfer</span>
                                <span className="text-xs font-bold text-slate-300">A/C: 1234567890</span>
                                <span className="text-[10px] text-slate-500 mt-1 uppercase font-bold">Standard Chartered Bank</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Upload Section */}
                <div className="bg-indigo-600 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="text-center md:text-left">
                            <h2 className="text-2xl font-black text-white">Verify Payment</h2>
                            <p className="text-indigo-200 text-sm mt-1 max-w-xs font-medium">Upload a screenshot of your transaction for instant review.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                            <label className="w-full sm:w-auto cursor-pointer flex items-center justify-center space-x-3 px-8 py-4 bg-white/10 border border-white/20 rounded-2xl hover:bg-white/20 transition-all text-white font-bold">
                                <UploadCloud size={20} />
                                <span>{file ? 'Selected' : 'Choose Receipt'}</span>
                                <input type="file" className="hidden" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} />
                            </label>
                            <button 
                                onClick={handleUpload}
                                disabled={!file || uploading}
                                className={`w-full sm:w-auto px-10 py-4 bg-white text-indigo-900 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center ${(!file || uploading) ? 'opacity-50' : 'hover:scale-105 active:scale-95'}`}
                            >
                                {uploading ? <Loader2 size={18} className="animate-spin mr-2" /> : <Zap size={18} className="mr-2" />}
                                Submit to Admin
                            </button>
                        </div>
                    </div>
                    <Zap size={200} className="absolute -bottom-20 -right-20 text-white/5 pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
                </div>

                <div className="mt-12 flex justify-between items-center px-4">
                    <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">Secure Activation Layer v1.0</p>
                    <button onClick={logout} className="text-slate-500 hover:text-rose-400 font-bold text-sm transition-colors flex items-center space-x-2">
                        <LogOut size={16} />
                        <span>Cancel Onboarding</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
