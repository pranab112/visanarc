
import React, { useState, useEffect, useMemo } from 'react';
import { AgencySettings, Student, ApplicationStatus, NocStatus, Country } from '../../types';
import { fetchSettings, fetchStudents, saveStudents, getPlanLimit } from '../../services/storageService';
import { Loader2, CheckCircle2, Globe, Send, ArrowLeft, ShieldAlert } from 'lucide-react';

interface PublicLeadFormProps {
    onClose?: () => void;
}

export const PublicLeadForm: React.FC<PublicLeadFormProps> = ({ onClose }) => {
    const [settings, setSettings] = useState<AgencySettings | null>(null);
    const [currentStudents, setCurrentStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [completed, setCompleted] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        targetCountry: Country.Australia,
        courseInterest: '',
        educationHistory: ''
    });

    useEffect(() => {
        const load = async () => {
            const [s, st] = await Promise.all([fetchSettings(), fetchStudents()]);
            setSettings(s);
            setCurrentStudents(st);
            setLoading(false);
        };
        load();
    }, []);

    const planLimit = useMemo(() => settings ? getPlanLimit(settings.subscription.plan) : 0, [settings]);
    const isQuotaFull = useMemo(() => currentStudents.length >= planLimit, [currentStudents, planLimit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Quota safety check
        if (isQuotaFull) {
            alert("This agency has reached its student intake capacity. Please contact them directly.");
            return;
        }

        setSubmitting(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        try {
            const newStudent: Student = {
                id: Date.now().toString(),
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                targetCountry: formData.targetCountry,
                status: ApplicationStatus.Lead,
                nocStatus: NocStatus.NotApplied,
                documents: {},
                notes: `Captured via Public Web Form.\n\nCourse Interest: ${formData.courseInterest}\nHistory: ${formData.educationHistory}`,
                createdAt: Date.now(),
                source: 'Web Form',
                courseInterest: formData.courseInterest,
                educationHistory: formData.educationHistory
            };
            
            await saveStudents([newStudent, ...currentStudents]);
            setCompleted(true);
        } catch (err) {
            console.error(err);
            alert("Failed to submit. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;
    
    // Safety check if settings missing or form disabled
    if (!settings || !settings.leadForm?.enabled) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
                    <Globe size={48} className="mx-auto text-slate-300 mb-4" />
                    <h1 className="text-xl font-bold text-slate-800">Form Unavailable</h1>
                    <p className="text-slate-500 mt-2">This intake form is currently disabled or does not exist.</p>
                </div>
            </div>
        );
    }

    // Quota Full View
    if (isQuotaFull) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl text-center max-w-lg border border-slate-100">
                    <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-rose-600 shadow-inner">
                        <ShieldAlert size={40} />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Intake Temporarily Suspended</h1>
                    <p className="text-slate-500 mb-8 leading-relaxed">We have reached our maximum applicant capacity for the current term. Please try again later or contact our Head Office directly for priority processing.</p>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Agency Contact</p>
                        <p className="text-sm font-bold text-slate-700 mt-1">{settings.email} • {settings.phone}</p>
                    </div>
                    {onClose && (
                        <button onClick={onClose} className="text-sm font-bold text-indigo-600 hover:underline">Return to Dashboard</button>
                    )}
                </div>
            </div>
        );
    }

    const { leadForm } = settings;
    const themeColor = leadForm.themeColor || '#4f46e5';

    if (completed) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-500">
                <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full border-t-4" style={{ borderColor: themeColor }}>
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={32} className="text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Application Received!</h1>
                    <p className="text-slate-500 mb-6">Thank you, {formData.name}. Our counsellors at {settings.agencyName} will review your profile and contact you shortly.</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="text-sm font-bold underline hover:text-indigo-600 transition-colors"
                    >
                        Submit another response
                    </button>
                    {onClose && (
                        <div className="mt-8 pt-4 border-t border-slate-100">
                            <button onClick={onClose} className="text-sm text-slate-400 hover:text-slate-600 flex items-center justify-center w-full">
                                <ArrowLeft size={14} className="mr-1"/> Return to Dashboard
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 md:p-8">
            {onClose && (
                <button 
                    onClick={onClose}
                    className="fixed top-4 left-4 bg-white p-2 rounded-full shadow-md text-slate-500 hover:text-slate-800 transition-colors z-50"
                >
                    <ArrowLeft size={20} />
                </button>
            )}

            <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
                {/* Header */}
                <div className="p-8 text-white text-center relative overflow-hidden" style={{ backgroundColor: themeColor }}>
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl font-bold backdrop-blur-sm">
                            {settings.agencyName.charAt(0)}
                        </div>
                        <h1 className="text-2xl font-bold mb-2">{leadForm.title}</h1>
                        <p className="text-white/80 text-sm leading-relaxed max-w-xs mx-auto">{leadForm.description}</p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase ml-1">Full Name</label>
                        <input 
                            required
                            className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-opacity-50 outline-none transition-all"
                            style={{ ['--tw-ring-color' as any]: themeColor }}
                            placeholder="e.g. Ram Sharma"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase ml-1">Email Address</label>
                        <input 
                            required
                            type="email"
                            className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-opacity-50 outline-none transition-all"
                            style={{ ['--tw-ring-color' as any]: themeColor }}
                            placeholder="name@example.com"
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                        />
                    </div>

                    {leadForm.fields.phone && (
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-slate-500 uppercase ml-1">Phone Number</label>
                            <input 
                                required
                                type="tel"
                                className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-opacity-50 outline-none transition-all"
                                style={{ ['--tw-ring-color' as any]: themeColor }}
                                placeholder="+977 9800000000"
                                value={formData.phone}
                                onChange={e => setFormData({...formData, phone: e.target.value})}
                            />
                        </div>
                    )}

                    {leadForm.fields.targetCountry && (
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-slate-500 uppercase ml-1">Target Country</label>
                            <select 
                                className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-opacity-50 outline-none transition-all appearance-none"
                                style={{ ['--tw-ring-color' as any]: themeColor }}
                                value={formData.targetCountry}
                                onChange={e => setFormData({...formData, targetCountry: e.target.value as Country})}
                            >
                                {Object.values(Country).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    )}

                    {leadForm.fields.courseInterest && (
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-slate-500 uppercase ml-1">Interested Course</label>
                            <input 
                                className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-opacity-50 outline-none transition-all"
                                style={{ ['--tw-ring-color' as any]: themeColor }}
                                placeholder="e.g. Nursing, BIT, MBA"
                                value={formData.courseInterest}
                                onChange={e => setFormData({...formData, courseInterest: e.target.value})}
                            />
                        </div>
                    )}

                    {leadForm.fields.educationHistory && (
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-slate-500 uppercase ml-1">Education History</label>
                            <textarea 
                                className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-opacity-50 outline-none transition-all h-24 resize-none"
                                style={{ ['--tw-ring-color' as any]: themeColor }}
                                placeholder="Briefly describe your last qualification..."
                                value={formData.educationHistory}
                                onChange={e => setFormData({...formData, educationHistory: e.target.value})}
                            />
                        </div>
                    )}

                    <button 
                        type="submit"
                        disabled={submitting}
                        className="w-full text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center mt-4"
                        style={{ backgroundColor: themeColor }}
                    >
                        {submitting ? <Loader2 className="animate-spin" /> : (
                            <>
                                <span>Submit Application</span>
                                <Send size={20} className="ml-2" />
                            </>
                        )}
                    </button>
                    
                    <p className="text-center text-xs text-slate-400 pt-4">
                        By submitting, you agree to be contacted by {settings.agencyName}.
                    </p>
                </form>
            </div>
            
            <div className="mt-8 text-center">
                <p className="text-slate-400 text-xs font-medium">Powered by Visa In Arc</p>
            </div>
        </div>
    );
};
