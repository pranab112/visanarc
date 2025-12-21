
import React, { useState, useEffect } from 'react';
import { 
    Magnet, Users, Globe, ExternalLink, Code, Copy, Eye, 
    CheckCircle2, Save, Loader2, Phone, Mail, MapPin, 
    ArrowRight, Sparkles, Filter, Search, Trash2, Settings2,
    ToggleLeft, ToggleRight, Share2, Clipboard, TrendingUp, RotateCw
} from 'lucide-react';
import { AgencySettings, Student, ApplicationStatus, Country } from '../../types';
import { fetchSettings, saveSettings, fetchStudents, saveStudents } from '../../services/storageService';

interface LeadCaptureDashboardProps {
    onPreview: () => void;
}

export const LeadCaptureDashboard: React.FC<LeadCaptureDashboardProps> = ({ onPreview }) => {
    const [activeTab, setActiveTab] = useState<'inbox' | 'builder' | 'embed'>('inbox');
    const [settings, setSettings] = useState<AgencySettings | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const [s, st] = await Promise.all([fetchSettings(), fetchStudents()]);
            setSettings(s);
            setStudents(st);
            setLoading(false);
        };
        load();
    }, []);

    const handleSaveConfig = async () => {
        if (!settings) return;
        setSaving(true);
        await saveSettings(settings);
        setSaving(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
    };

    const getDefaultLeadForm = () => ({
        enabled: true,
        title: 'Apply Now',
        description: 'Start your study abroad journey today.',
        themeColor: '#4f46e5',
        fields: { phone: true, targetCountry: true, courseInterest: true, educationHistory: true }
    });

    const updateField = (field: string, value: boolean) => {
        if (!settings) return;
        const currentLeadForm = settings.leadForm || getDefaultLeadForm();
        setSettings({
            ...settings,
            leadForm: {
                ...currentLeadForm,
                fields: {
                    ...currentLeadForm.fields,
                    [field as keyof typeof currentLeadForm.fields]: value
                }
            }
        });
    };

    const updateConfig = (key: string, value: any) => {
        if (!settings) return;
        const currentLeadForm = settings.leadForm || getDefaultLeadForm();
        setSettings({
            ...settings,
            leadForm: {
                ...currentLeadForm,
                [key]: value
            }
        });
    };

    const copyEmbedCode = () => {
        const code = `<iframe src="${window.location.origin}?mode=public-form" width="100%" height="700" frameborder="0" style="border-radius: 12px; border: 1px solid #e2e8f0;"></iframe>`;
        navigator.clipboard.writeText(code);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    const copyDirectLink = () => {
        const link = `${window.location.origin}?mode=public-form`;
        navigator.clipboard.writeText(link);
        alert("Form link copied to clipboard!");
    };

    const deleteLead = async (id: string) => {
        if (!window.confirm("Remove this lead permanently?")) return;
        const updated = students.filter(s => s.id !== id);
        setStudents(updated);
        await saveStudents(updated);
    };

    if (loading || !settings) return <div className="h-full flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;

    const leads = students.filter(s => s.status === ApplicationStatus.Lead && s.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const leadForm = settings.leadForm || getDefaultLeadForm();

    return (
        <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
            {/* Header Section */}
            <header className="bg-white border-b border-slate-200 px-8 py-6 shrink-0 shadow-sm z-10">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
                            <Magnet className="mr-3 text-indigo-600" size={28} />
                            Lead Capture Intelligence
                        </h1>
                        <p className="text-slate-400 text-sm font-medium mt-0.5">Automate student inbound and streamline follow-ups.</p>
                    </div>
                    
                    <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
                        {[
                            { id: 'inbox', label: 'Leads Inbox', icon: Users },
                            { id: 'builder', label: 'Form Builder', icon: Settings2 },
                            { id: 'embed', label: 'Integration', icon: Code }
                        ].map(tab => (
                            <button 
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center space-x-2 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                    activeTab === tab.id ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                <tab.icon size={16} />
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto custom-scrollbar p-8">
                <div className="max-w-6xl mx-auto space-y-8">
                    
                    {activeTab === 'inbox' && (
                        <div className="animate-in fade-in duration-500 space-y-6">
                            {/* Summary Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-indigo-600 text-white p-6 rounded-3xl shadow-xl shadow-indigo-100 flex justify-between items-center relative overflow-hidden group">
                                    <div className="relative z-10">
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Total Inbox</p>
                                        <h2 className="text-4xl font-black mt-1">{leads.length}</h2>
                                        <p className="text-[10px] mt-2 font-bold bg-white/10 px-2 py-0.5 rounded-full inline-block">Awaiting Review</p>
                                    </div>
                                    <Users size={64} className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform" />
                                </div>
                                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex justify-between items-center relative overflow-hidden group">
                                    <div className="relative z-10">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Today</p>
                                        <h2 className="text-4xl font-black mt-1 text-slate-800">
                                            {leads.filter(l => l.createdAt > Date.now() - 86400000).length}
                                        </h2>
                                        <p className="text-[10px] mt-2 font-bold text-emerald-500 uppercase flex items-center">
                                            <TrendingUp size={10} className="mr-1"/> Increased Activity
                                        </p>
                                    </div>
                                    <Sparkles size={64} className="absolute -right-4 -bottom-4 text-slate-100 group-hover:text-indigo-50 transition-colors" />
                                </div>
                                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex justify-between items-center relative overflow-hidden group">
                                    <div className="relative z-10">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conversion Rate</p>
                                        <h2 className="text-4xl font-black mt-1 text-slate-800">14%</h2>
                                        <p className="text-[10px] mt-2 font-bold text-indigo-400 uppercase tracking-widest">Inbound to Applied</p>
                                    </div>
                                    <CheckCircle2 size={64} className="absolute -right-4 -bottom-4 text-slate-100 group-hover:text-indigo-50 transition-colors" />
                                </div>
                            </div>

                            {/* Inbox List */}
                            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
                                    <div className="relative w-full md:w-80">
                                        <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
                                        <input 
                                            placeholder="Search name, phone..." 
                                            className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none text-sm font-medium transition-all"
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex items-center space-x-3 w-full md:w-auto">
                                        <button onClick={onPreview} className="flex-1 md:flex-none flex items-center justify-center space-x-2 bg-indigo-50 text-indigo-600 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border border-indigo-100 hover:bg-indigo-100 transition-all">
                                            <Eye size={16}/>
                                            <span>Open Live Form</span>
                                        </button>
                                        <button onClick={copyDirectLink} className="flex-1 md:flex-none flex items-center justify-center space-x-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-indigo-600 transition-all">
                                            <Share2 size={16}/>
                                            <span>Copy Link</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                            <tr>
                                                <th className="px-8 py-5">Prospect Detail</th>
                                                <th className="px-8 py-5">Interest & Country</th>
                                                <th className="px-8 py-5">Source</th>
                                                <th className="px-8 py-5">Inbound Date</th>
                                                <th className="px-8 py-5 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {leads.map(lead => (
                                                <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center space-x-4">
                                                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                                {lead.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-800 tracking-tight">{lead.name}</p>
                                                                <div className="flex items-center space-x-3 mt-1">
                                                                    <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center"><Mail size={10} className="mr-1"/> {lead.email}</p>
                                                                    <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center"><Phone size={10} className="mr-1"/> {lead.phone}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <p className="text-xs font-bold text-slate-700">{lead.courseInterest || 'General Enquiry'}</p>
                                                        <p className="text-[10px] text-indigo-600 font-black uppercase mt-1.5 flex items-center"><Globe size={10} className="mr-1"/> {lead.targetCountry}</p>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border ${
                                                            lead.source === 'Web Form' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-slate-50 border-slate-100 text-slate-500'
                                                        }`}>
                                                            {lead.source || 'Manual'}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <p className="text-xs font-bold text-slate-600">{new Date(lead.createdAt).toLocaleDateString()}</p>
                                                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">{new Date(lead.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <div className="flex justify-end space-x-2">
                                                            <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="View Profile">
                                                                <ArrowRight size={18}/>
                                                            </button>
                                                            <button onClick={() => deleteLead(lead.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                                                <Trash2 size={18}/>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {leads.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="px-8 py-20 text-center text-slate-300">
                                                        <Magnet size={48} className="mx-auto mb-4 opacity-10" />
                                                        <p className="font-black text-[10px] uppercase tracking-widest">Leads Inbox is Empty</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'builder' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in duration-500 slide-in-from-bottom-4">
                            {/* Configuration Panel */}
                            <div className="lg:col-span-5 space-y-6">
                                <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-200">
                                    <div className="flex justify-between items-center mb-8">
                                        <h3 className="font-black text-slate-900 uppercase tracking-widest flex items-center">
                                            <Settings2 size={20} className="mr-2 text-indigo-600"/> Form Architect
                                        </h3>
                                        <div 
                                            className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-all ${leadForm.enabled ? 'bg-indigo-600' : 'bg-slate-200'}`}
                                            onClick={() => updateConfig('enabled', !leadForm.enabled)}
                                        >
                                            <div className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform ${leadForm.enabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Hero Title</label>
                                            <input 
                                                className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold"
                                                value={leadForm.title}
                                                onChange={(e) => updateConfig('title', e.target.value)}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Description Subtext</label>
                                            <textarea 
                                                className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all h-24 font-medium text-sm leading-relaxed"
                                                value={leadForm.description}
                                                onChange={(e) => updateConfig('description', e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Streamline Fields (Required)</label>
                                            {[
                                                { id: 'phone', label: 'Contact Phone / WhatsApp' },
                                                { id: 'targetCountry', label: 'Desired Study Country' },
                                                { id: 'courseInterest', label: 'Area of Interest (Major)' },
                                                { id: 'educationHistory', label: 'Last Academic Level' }
                                            ].map(field => (
                                                <button 
                                                    key={field.id}
                                                    onClick={() => updateField(field.id, !leadForm.fields[field.id as keyof typeof leadForm.fields])}
                                                    className={`w-full flex items-center justify-between p-4 border rounded-2xl transition-all ${
                                                        leadForm.fields[field.id as keyof typeof leadForm.fields] 
                                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                                                        : 'bg-white border-slate-200 text-slate-400'
                                                    }`}
                                                >
                                                    <span className="text-sm font-black uppercase tracking-tight">{field.label}</span>
                                                    {leadForm.fields[field.id as keyof typeof leadForm.fields] ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="pt-6">
                                            <button 
                                                onClick={handleSaveConfig}
                                                disabled={saving}
                                                className={`w-full py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] transition-all shadow-2xl flex items-center justify-center active:scale-95 ${
                                                    saveSuccess 
                                                    ? 'bg-emerald-600 text-white shadow-emerald-100' 
                                                    : 'bg-slate-900 text-white hover:bg-indigo-600 shadow-indigo-100'
                                                }`}
                                            >
                                                {saving ? <RotateCw className="animate-spin mr-2" /> : saveSuccess ? <CheckCircle2 className="mr-2" size={18} /> : <Save className="mr-2" size={18} />}
                                                {saving ? 'Processing...' : saveSuccess ? 'Saved Changes!' : 'Deploy Configuration'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Live Mobile View Preview */}
                            <div className="lg:col-span-7 flex flex-col items-center">
                                <div className="border-[12px] border-slate-900 rounded-[3rem] overflow-hidden bg-slate-100 h-[800px] w-full max-w-[380px] relative shadow-[0_50px_100px_-20px_rgba(0,0,0,0.25)] ring-1 ring-slate-800">
                                    <div className="absolute top-0 left-0 right-0 h-8 bg-slate-900 flex items-center justify-center z-20">
                                        <div className="w-20 h-1 bg-slate-800 rounded-full"></div>
                                    </div>
                                    <div className="h-full pt-8 overflow-y-auto bg-white p-0 relative custom-scrollbar">
                                        {/* Real Simulation of Form */}
                                        <div className="p-8 text-white text-center relative overflow-hidden" style={{ backgroundColor: leadForm.themeColor }}>
                                            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                                            <div className="relative z-10">
                                                <div className="w-16 h-16 bg-white/20 rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl font-bold backdrop-blur-sm">
                                                    {settings.agencyName.charAt(0)}
                                                </div>
                                                <h2 className="text-xl font-black mb-1">{leadForm.title}</h2>
                                                <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest max-w-xs mx-auto leading-relaxed">{leadForm.description}</p>
                                            </div>
                                        </div>

                                        <div className="p-8 space-y-6">
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                                <input disabled className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-xs font-bold" placeholder="Applicant Name" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                                <input disabled className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-xs font-bold" placeholder="Email" />
                                            </div>
                                            {leadForm.fields.phone && (
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                                                    <input disabled className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-xs font-bold" placeholder="+977" />
                                                </div>
                                            )}
                                            {leadForm.fields.targetCountry && (
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Study Destination</label>
                                                    <div className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-[10px] font-black text-slate-300 uppercase tracking-tighter">Select Country...</div>
                                                </div>
                                            )}
                                            {leadForm.fields.courseInterest && (
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Intended Major</label>
                                                    <input disabled className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-xs font-bold" placeholder="e.g. Nursing, IT" />
                                                </div>
                                            )}
                                            <button 
                                                disabled
                                                className="w-full text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] mt-4 shadow-xl opacity-80"
                                                style={{ backgroundColor: leadForm.themeColor }}
                                            >
                                                Start Application
                                            </button>
                                        </div>
                                        <div className="text-center py-6">
                                            <p className="text-[9px] font-black text-slate-200 uppercase tracking-widest">Powered by StudyAbroad Genius</p>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-6">Simulated Responsive Preview</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'embed' && (
                        <div className="animate-in fade-in duration-500 space-y-10">
                            <div className="bg-slate-900 text-white p-12 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                                <div className="relative z-10 max-w-3xl">
                                    <h2 className="text-4xl font-black mb-6 tracking-tight">Expand Your Digital Reach</h2>
                                    <p className="text-slate-400 text-xl leading-relaxed mb-10">
                                        Integrate your custom intake form into your agency website in seconds. Choose between a direct link for social media or an iframe embed for your website.
                                    </p>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 hover:bg-white/10 transition-all group/card">
                                            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-indigo-600/20">
                                                <Globe size={24}/>
                                            </div>
                                            <h4 className="font-black text-lg mb-2">Social Media Link</h4>
                                            <p className="text-slate-500 text-sm mb-6">Perfect for Instagram Bio, WhatsApp Status, or Facebook Posts.</p>
                                            <button onClick={copyDirectLink} className="w-full bg-white text-slate-900 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-400 transition-all flex items-center justify-center">
                                                <Share2 size={14} className="mr-2"/> Copy URL
                                            </button>
                                        </div>

                                        <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 hover:bg-white/10 transition-all group/card">
                                            <div className="w-12 h-12 bg-cyan-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-cyan-600/20">
                                                <Code size={24}/>
                                            </div>
                                            <h4 className="font-black text-lg mb-2">Website Embed</h4>
                                            <p className="text-slate-500 text-sm mb-6">Paste this code into your "Contact Us" page or "Apply Now" button.</p>
                                            <button onClick={copyEmbedCode} className="w-full bg-white text-slate-900 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-cyan-400 transition-all flex items-center justify-center">
                                                {copySuccess ? <CheckCircle2 size={14} className="mr-2 text-emerald-600"/> : <Clipboard size={14} className="mr-2"/>}
                                                {copySuccess ? 'Copied Code!' : 'Copy Iframe Code'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <Globe size={400} className="absolute -bottom-20 -right-20 text-white/5 pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                                    <h5 className="font-black text-slate-800 text-sm uppercase tracking-widest mb-6 flex items-center">
                                        <div className="w-1 h-4 bg-indigo-600 mr-3 rounded-full" /> Implementation Guide
                                    </h5>
                                    <ul className="space-y-6">
                                        <li className="flex items-start">
                                            <span className="w-6 h-6 bg-slate-100 text-slate-400 text-[10px] font-black flex items-center justify-center rounded-lg mr-4 mt-0.5 shrink-0">01</span>
                                            <p className="text-sm text-slate-600 font-medium">Customize your brand colors and fields in the <strong>Form Builder</strong> tab.</p>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="w-6 h-6 bg-slate-100 text-slate-400 text-[10px] font-black flex items-center justify-center rounded-lg mr-4 mt-0.5 shrink-0">02</span>
                                            <p className="text-sm text-slate-600 font-medium">Copy the <strong>Iframe Code</strong> and paste it into your website CMS (WordPress, Wix, etc).</p>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="w-6 h-6 bg-slate-100 text-slate-400 text-[10px] font-black flex items-center justify-center rounded-lg mr-4 mt-0.5 shrink-0">03</span>
                                            <p className="text-sm text-slate-600 font-medium">New entries will instantly appear in your <strong>Leads Inbox</strong> with a "Web Form" source tag.</p>
                                        </li>
                                    </ul>
                                </div>

                                <div className="bg-indigo-50 p-8 rounded-[2.5rem] border border-indigo-100 flex flex-col justify-center items-center text-center">
                                    <div className="p-4 bg-white rounded-3xl shadow-xl shadow-indigo-200/50 mb-6">
                                        <Sparkles size={32} className="text-indigo-600 animate-pulse" />
                                    </div>
                                    <h5 className="font-black text-indigo-900 text-lg mb-2">Automated Lead Tagging</h5>
                                    <p className="text-indigo-400 text-sm font-medium leading-relaxed max-w-xs">
                                        The system automatically categorizes web leads, allowing your counsellors to filter and prioritize online inquiries immediately.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};
