
import React, { useState, useEffect } from 'react';
import { AgencySettings } from '../../types';
import { fetchSettings, saveSettings } from '../../services/storageService';
import { Loader2, Save, ExternalLink, Code, Copy, Eye, CheckCircle2, RotateCw } from 'lucide-react';

interface LeadFormBuilderProps {
    onPreview: () => void;
}

export const LeadFormBuilder: React.FC<LeadFormBuilderProps> = ({ onPreview }) => {
    const [settings, setSettings] = useState<AgencySettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

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
        const code = `<iframe src="${window.location.origin}?mode=public-form" width="100%" height="600" frameborder="0"></iframe>`;
        navigator.clipboard.writeText(code);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-indigo-600"/></div>;

    const leadForm = settings?.leadForm || getDefaultLeadForm();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-indigo-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-xl font-bold flex items-center">
                            <ExternalLink className="mr-2" /> Public Intake Form
                        </h2>
                        <p className="text-indigo-200 text-sm mt-1">Capture leads directly from your website or social media.</p>
                    </div>
                    <div className="flex space-x-3">
                        <button 
                            onClick={onPreview}
                            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center"
                        >
                            <Eye size={16} className="mr-2"/> View Form
                        </button>
                        <button 
                            onClick={copyEmbedCode}
                            className="bg-white text-indigo-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-50 transition-colors flex items-center shadow-lg"
                        >
                            {copySuccess ? <CheckCircle2 size={16} className="mr-2 text-green-600"/> : <Code size={16} className="mr-2"/>}
                            {copySuccess ? 'Copied!' : 'Copy Embed Code'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Configuration Panel */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">Form Configuration</h3>
                    
                    <div className="space-y-5">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-bold text-slate-700">Enable Public Form</label>
                            <div 
                                className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${leadForm.enabled ? 'bg-indigo-600' : 'bg-slate-200'}`}
                                onClick={() => updateConfig('enabled', !leadForm.enabled)}
                            >
                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${leadForm.enabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Form Title</label>
                            <input 
                                className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                                value={leadForm.title}
                                onChange={(e) => updateConfig('title', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Subtitle / Description</label>
                            <textarea 
                                className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none h-24"
                                value={leadForm.description}
                                onChange={(e) => updateConfig('description', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Active Fields</label>
                            <div className="space-y-2">
                                <label className="flex items-center space-x-2 p-3 border border-slate-100 rounded-lg hover:bg-slate-50 cursor-pointer">
                                    <input type="checkbox" checked={leadForm.fields.phone} onChange={(e) => updateField('phone', e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                                    <span className="text-sm text-slate-700">Phone Number</span>
                                </label>
                                <label className="flex items-center space-x-2 p-3 border border-slate-100 rounded-lg hover:bg-slate-50 cursor-pointer">
                                    <input type="checkbox" checked={leadForm.fields.targetCountry} onChange={(e) => updateField('targetCountry', e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                                    <span className="text-sm text-slate-700">Target Country</span>
                                </label>
                                <label className="flex items-center space-x-2 p-3 border border-slate-100 rounded-lg hover:bg-slate-50 cursor-pointer">
                                    <input type="checkbox" checked={leadForm.fields.courseInterest} onChange={(e) => updateField('courseInterest', e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                                    <span className="text-sm text-slate-700">Course Interest</span>
                                </label>
                                <label className="flex items-center space-x-2 p-3 border border-slate-100 rounded-lg hover:bg-slate-50 cursor-pointer">
                                    <input type="checkbox" checked={leadForm.fields.educationHistory} onChange={(e) => updateField('educationHistory', e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                                    <span className="text-sm text-slate-700">Previous Education History</span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Theme Color</label>
                            <div className="flex space-x-3 mt-2">
                                {['#4f46e5', '#059669', '#dc2626', '#d97706', '#7c3aed'].map(color => (
                                    <button 
                                        key={color}
                                        onClick={() => updateConfig('themeColor', color)}
                                        className={`w-8 h-8 rounded-full border-2 transition-all ${leadForm.themeColor === color ? 'border-slate-900 scale-110' : 'border-transparent'}`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="pt-4">
                            <button 
                                onClick={handleSave}
                                disabled={saving}
                                className={`w-full py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center ${
                                    saveSuccess 
                                    ? 'bg-emerald-600 text-white' 
                                    : 'bg-slate-900 text-white hover:bg-indigo-600'
                                }`}
                            >
                                {saving ? <RotateCw className="animate-spin mr-2" /> : saveSuccess ? <CheckCircle2 className="mr-2" size={18} /> : <Save className="mr-2" size={18} />}
                                {saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Configuration'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Live Preview (Simulated) */}
                <div className="border-[10px] border-slate-900 rounded-3xl overflow-hidden bg-slate-100 h-[700px] relative shadow-2xl">
                    <div className="absolute top-0 left-0 right-0 h-6 bg-slate-800 flex items-center justify-center space-x-1">
                        <div className="w-16 h-1 bg-slate-700 rounded-full"></div>
                    </div>
                    <div className="h-full pt-8 overflow-y-auto bg-white p-6">
                        <div className="text-center mb-8">
                            <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center text-white font-bold text-xl" style={{ backgroundColor: leadForm.themeColor }}>
                                {settings?.agencyName?.charAt(0) || 'A'}
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">{leadForm.title}</h2>
                            <p className="text-slate-500 text-sm mt-2">{leadForm.description}</p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
                                <input disabled className="w-full p-3 border border-slate-200 rounded-lg bg-slate-50" placeholder="John Doe" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Email Address</label>
                                <input disabled className="w-full p-3 border border-slate-200 rounded-lg bg-slate-50" placeholder="john@example.com" />
                            </div>
                            {leadForm.fields.phone && (
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Phone Number</label>
                                    <input disabled className="w-full p-3 border border-slate-200 rounded-lg bg-slate-50" placeholder="+977 9800000000" />
                                </div>
                            )}
                            {leadForm.fields.targetCountry && (
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Target Country</label>
                                    <div className="w-full p-3 border border-slate-200 rounded-lg bg-slate-50 text-slate-400">Select Country</div>
                                </div>
                            )}
                            {leadForm.fields.courseInterest && (
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Course Interest</label>
                                    <input disabled className="w-full p-3 border border-slate-200 rounded-lg bg-slate-50" placeholder="e.g. Nursing, IT" />
                                </div>
                            )}
                            {leadForm.fields.educationHistory && (
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Education History</label>
                                    <textarea disabled className="w-full p-3 border border-slate-200 rounded-lg bg-slate-50 h-20" placeholder="Briefly describe your background..." />
                                </div>
                            )}
                            <button 
                                disabled
                                className="w-full text-white py-3 rounded-xl font-bold mt-4 opacity-50 cursor-not-allowed"
                                style={{ backgroundColor: leadForm.themeColor }}
                            >
                                Submit Application
                            </button>
                        </div>
                        <div className="mt-8 text-center text-[10px] text-slate-300">
                            Powered by StudyAbroad Genius
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
