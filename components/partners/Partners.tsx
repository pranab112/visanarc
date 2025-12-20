import React, { useState, useEffect, useMemo } from 'react';
import { ExternalLink, DollarSign, Building, Plus, X, Save, Globe, Loader2, Pencil, Trash2, CheckCircle2, TrendingUp, Users, HandCoins, Calculator, Wallet, ArrowUpRight, Receipt, Sparkles, ToggleLeft, ToggleRight, BarChart3, PieChart, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { fetchPartners, savePartners, fetchSettings, fetchStudents, fetchInvoices, saveInvoices, saveStudents } from '../../services/storageService';
import { Partner, AgencySettings, Student, ApplicationStatus, Invoice } from '../../types';
import { logActivity } from '../../services/auditService';

export const Partners: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'directory' | 'commissions'>('directory');
    const [partners, setPartners] = useState<Partner[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [settings, setSettings] = useState<AgencySettings | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Revenue Estimator State
    const [estimatedTuition, setEstimatedTuition] = useState<string>('');

    // UI states
    const [isAdding, setIsAdding] = useState(false);
    const [newPartnerData, setNewPartnerData] = useState({ name: '', type: 'University', commissionRate: '', portalUrl: '' });
    const [claimingId, setClaimingId] = useState<string | null>(null);
    const [toast, setToast] = useState<{show: boolean, msg: string} | null>(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [p, s, st, inv] = await Promise.all([
                    fetchPartners(), 
                    fetchSettings(), 
                    fetchStudents(),
                    fetchInvoices()
                ]);
                setPartners(p);
                setSettings(s);
                setStudents(st);
                setInvoices(inv);
            } catch (error) {
                console.error("Failed to load partners data", error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const showToast = (msg: string) => {
        setToast({ show: true, msg });
        setTimeout(() => setToast(null), 4000);
    };

    const handleAddPartner = async () => {
        if (!newPartnerData.name) return;
        const newPartner: Partner = {
            id: Date.now().toString(),
            name: newPartnerData.name,
            type: newPartnerData.type as any,
            commissionRate: parseFloat(newPartnerData.commissionRate) || 0,
            portalUrl: newPartnerData.portalUrl || '#'
        };
        const updated = [...partners, newPartner];
        setPartners(updated);
        await savePartners(updated);
        logActivity('CREATE', 'Settings', `Added partner: ${newPartner.name}`);
        setIsAdding(false);
        setNewPartnerData({ name: '', type: 'University', commissionRate: '', portalUrl: '' });
    };

    const handleDeletePartner = async (id: string) => {
        if (window.confirm("Delete this partner?")) {
            const updated = partners.filter(p => p.id !== id);
            setPartners(updated);
            await savePartners(updated);
            logActivity('DELETE', 'Settings', `Deleted partner ID: ${id}`);
        }
    };

    const handleMarkClaimed = async (student: Student) => {
        if (claimingId) return;
        
        const amount = student.commissionAmount || 150000;
        const alreadyClaimed = student.commissionStatus === 'Claimed' || 
                             student.commissionStatus === 'Received';
        
        if (alreadyClaimed) {
            alert("This commission has already been recorded as claimed.");
            return;
        }

        setClaimingId(student.id);

        try {
            const newInvoice: Invoice = {
                id: `claim_${Date.now()}`,
                invoiceNumber: `REC-${Math.floor(1000 + Math.random() * 9000)}`,
                studentId: student.id,
                studentName: student.name,
                amount: amount,
                description: `Partner Commission: ${student.name} (${student.targetCountry})`,
                status: 'Paid', 
                date: Date.now(),
                branchId: student.branchId || 'main'
            };

            const updatedStudent: Student = { 
                ...student, 
                commissionStatus: 'Claimed' 
            };
            
            const updatedStudents = students.map(s => s.id === student.id ? updatedStudent : s);
            const updatedInvoices = [newInvoice, ...invoices];

            await Promise.all([
                saveInvoices(updatedInvoices),
                saveStudents(updatedStudents)
            ]);

            setInvoices(updatedInvoices);
            setStudents(updatedStudents);
            
            logActivity('UPDATE', 'Commission', `Claimed commission for ${student.name} of ${amount}`);
            showToast(`🎉 Success! Placement for ${student.name} marked as claimed.`);
        } catch (error) {
            console.error("Commission claim failed", error);
            alert("Failed to process claim. Please check your network.");
        } finally {
            setClaimingId(null);
        }
    };

    // Derived list for UI
    const visaGrantedStudents = useMemo(() => students.filter(s => {
        const isVisaStatus = s.status === ApplicationStatus.VisaGranted || (s.status as string) === 'Visa Granted' || (s.status as string) === 'Visa Received';
        const isNotClaimed = s.commissionStatus !== 'Claimed' && s.commissionStatus !== 'Received';
        return isVisaStatus && isNotClaimed;
    }), [students]);

    // Data for Chart
    const placementChartData = useMemo(() => {
        const successfulStudents = students.filter(s => s.status === ApplicationStatus.VisaGranted);
        const counts: Record<string, number> = {};
        
        successfulStudents.forEach(s => {
            const pName = s.assignedPartnerName || 'Direct/Unknown';
            counts[pName] = (counts[pName] || 0) + 1;
        });

        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
    }, [students]);
    
    const currency = settings?.currency || 'NPR';

    // Revenue Estimator Logic
    const tuitionValue = parseFloat(estimatedTuition) || 0;
    const estimatedCommissions = [...partners]
        .map(p => ({
            ...p,
            commission: (tuitionValue * p.commissionRate) / 100
        }))
        .sort((a, b) => b.commission - a.commission);

    if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;

    return (
        <div className="h-full flex flex-col p-8 bg-slate-50 overflow-hidden relative">
            
            {toast && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 duration-300">
                    <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 border border-slate-800">
                        <div className="bg-indigo-500 p-1.5 rounded-lg">
                            <Sparkles size={18} className="text-white" />
                        </div>
                        <p className="font-bold text-sm">{toast.msg}</p>
                        <button onClick={() => setToast(null)} className="ml-4 text-slate-400 hover:text-white transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                </div>
            )}

            <div className="mb-6 flex flex-col sm:flex-row justify-between items-end gap-4 shrink-0">
                <div>
                     <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Partner Relations</h1>
                     <p className="text-slate-500 mt-1 text-sm font-medium">Manage university portal access and track successful placements.</p>
                </div>
                <div className="flex bg-slate-200/50 p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                    <button onClick={() => setActiveTab('directory')} className={`px-5 py-2 text-xs font-bold rounded-xl transition-all ${activeTab === 'directory' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>University Portals</button>
                    <button onClick={() => setActiveTab('commissions')} className={`px-5 py-2 text-xs font-bold rounded-xl transition-all flex items-center ${activeTab === 'commissions' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
                        <HandCoins size={14} className="mr-2"/> Successful Placements
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row gap-8 min-h-0">
                {/* Main Content */}
                <div className="md:w-[65%] flex flex-col min-h-0 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    {activeTab === 'directory' ? (
                        <div className="flex flex-col h-full overflow-hidden">
                            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                                <h2 className="font-bold text-slate-800 text-xs uppercase tracking-widest">Global University Partners</h2>
                                <button onClick={() => setIsAdding(true)} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-600 flex items-center transition-all shadow-lg active:scale-95"><Plus size={16} className="mr-1.5"/> Add Partner</button>
                            </div>
                            <div className="overflow-y-auto p-5 space-y-4 flex-1 custom-scrollbar">
                                {partners.map(p => (
                                    <div key={p.id} className="flex justify-between items-center p-4 border border-slate-100 rounded-2xl hover:shadow-lg hover:shadow-indigo-500/5 bg-white transition-all group hover:border-indigo-200">
                                        <div className="flex items-center space-x-4">
                                            <div className="p-3 bg-slate-50 text-slate-400 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all border border-slate-100">
                                                <Building size={20}/>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-800 text-base">{p.name}</h3>
                                                <div className="flex space-x-2 mt-1">
                                                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full uppercase font-bold text-slate-500">{p.type}</span>
                                                    <span className="text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full uppercase font-bold text-emerald-600">{p.commissionRate}% Commission</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <a href={p.portalUrl} target="_blank" rel="noreferrer" className="p-2.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Open Partner Portal"><ExternalLink size={18}/></a>
                                            <button onClick={() => handleDeletePartner(p.id)} className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18}/></button>
                                        </div>
                                    </div>
                                ))}
                                {partners.length === 0 && (
                                    <div className="py-20 text-center text-slate-300">
                                        <Building size={64} className="mx-auto mb-4 opacity-10" />
                                        <p className="font-medium">Build your university network.</p>
                                        <p className="text-xs">No partners recorded in your directory yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full overflow-hidden">
                            {/* Performance Header & Stats */}
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h2 className="font-bold text-slate-800 text-lg">Placement Performance</h2>
                                        <p className="text-xs text-slate-500 font-medium">Visualization of successful visa grants per partner institution.</p>
                                    </div>
                                    <div className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center shadow-lg shadow-indigo-100">
                                        <Target size={18} className="mr-2" />
                                        <span className="text-xs font-bold uppercase tracking-wider">{placementChartData.reduce((acc, d) => acc + d.value, 0)} Total Visas</span>
                                    </div>
                                </div>

                                {/* Graph Area */}
                                <div className="h-48 w-full bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm mb-6">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={placementChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis 
                                                dataKey="name" 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{fontSize: 9, fontWeight: 700, fill: '#94a3b8'}} 
                                                interval={0}
                                                tickFormatter={(val) => val.length > 12 ? `${val.substring(0, 10)}...` : val}
                                            />
                                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 700, fill: '#94a3b8'}} />
                                            <Tooltip 
                                                cursor={{fill: '#f8fafc'}}
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={32}>
                                                {placementChartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366f1' : '#06b6d4'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Top Performer</p>
                                        <p className="text-xs font-bold text-indigo-600 truncate">{placementChartData[0]?.name || 'N/A'}</p>
                                    </div>
                                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Visa Success Rate</p>
                                        <p className="text-xs font-bold text-emerald-600">92% Average</p>
                                    </div>
                                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Pending Claims</p>
                                        <p className="text-xs font-bold text-amber-600">{visaGrantedStudents.length} Students</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                                {visaGrantedStudents.length === 0 ? (
                                    <div className="text-center py-20 text-slate-300 border-2 border-dashed rounded-3xl border-slate-100 m-4">
                                        <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <HandCoins size={40} className="opacity-20 text-slate-400"/>
                                        </div>
                                        <p className="font-bold text-slate-800">No Pending Placements</p>
                                        <p className="text-xs mt-1 font-medium">All eligible placements have been claimed or processed.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {visaGrantedStudents.map(student => (
                                            <div key={student.id} className="p-6 border border-slate-100 rounded-3xl flex flex-col lg:flex-row justify-between items-center bg-white shadow-sm hover:border-indigo-200 transition-all group">
                                                <div className="flex items-center space-x-5 mb-4 lg:mb-0">
                                                    <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm group-hover:scale-110 transition-transform"><CheckCircle2 size={24}/></div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-800 text-lg">{student.name}</h4>
                                                        <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">
                                                            {student.targetCountry} • {student.assignedPartnerName || 'NO PARTNER ASSIGNED'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-8">
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Commission Due</p>
                                                        <p className="text-xl font-bold text-indigo-600 font-mono tracking-tight">
                                                            {currency} {student.commissionAmount ? student.commissionAmount.toLocaleString() : '150,000'}
                                                        </p>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleMarkClaimed(student)}
                                                        disabled={claimingId === student.id}
                                                        className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-bold text-xs hover:bg-emerald-600 transition-all shadow-xl shadow-slate-900/10 flex items-center space-x-2 disabled:opacity-50 active:scale-95"
                                                    >
                                                        {claimingId === student.id ? <Loader2 size={16} className="animate-spin" /> : <Receipt size={16} />}
                                                        <span>Mark Claimed</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Estimator */}
                <div className="md:w-[35%] bg-slate-900 rounded-[2.5rem] flex flex-col overflow-hidden text-white shadow-2xl border border-slate-800">
                    <div className="p-8 border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-sm shrink-0">
                        <div className="flex items-center space-x-3 mb-8">
                            <div className="p-2.5 bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/20">
                                <Calculator size={20} className="text-white"/>
                            </div>
                            <h2 className="text-xl font-bold tracking-tight">Revenue Estimator</h2>
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">Tuition Fee (Annual)</label>
                            <div className="relative">
                                <DollarSign className="absolute left-4 top-4 text-slate-500" size={18} />
                                <input 
                                    type="number" 
                                    placeholder={`${currency} 1,00,000`}
                                    className="w-full bg-slate-800/50 border border-slate-700/50 p-4 pl-12 rounded-[1.25rem] text-xl font-bold text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-inner"
                                    value={estimatedTuition}
                                    onChange={(e) => setEstimatedTuition(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="p-5 px-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/30">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Real-time Projections</span>
                            <TrendingUp size={16} className="text-emerald-400" />
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-5 px-8 space-y-5 custom-scrollbar">
                            {estimatedCommissions.map((estimate) => (
                                <div key={estimate.id} className="flex justify-between items-center group transition-all">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-100 group-hover:text-white transition-colors">{estimate.name}</span>
                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{estimate.commissionRate}% Commission Rate</span>
                                    </div>
                                    <div className="text-right flex flex-col">
                                        <span className="text-base font-mono font-bold text-indigo-400 group-hover:text-indigo-300 transition-colors">
                                            {currency} {estimate.commission.toLocaleString()}
                                        </span>
                                        <span className="text-[9px] text-slate-600 font-bold uppercase">Estimated Yield</span>
                                    </div>
                                </div>
                            ))}
                            {partners.length === 0 && (
                                <div className="text-center py-16">
                                    <p className="text-slate-500 text-xs italic tracking-wide">Add partners to see revenue estimates</p>
                                </div>
                            )}
                        </div>

                        <div className="p-8 bg-slate-950/50 border-t border-slate-800 shrink-0">
                            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 rounded-3xl shadow-2xl relative overflow-hidden group">
                                <div className="relative z-10 flex justify-between items-center">
                                    <div>
                                        <p className="text-[11px] font-bold text-indigo-200 uppercase tracking-[0.2em] mb-2">Max Yield Potential</p>
                                        <p className="text-2xl font-bold font-mono tracking-tighter">
                                            {currency} {(estimatedCommissions[0]?.commission || 0).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="bg-white/10 p-3 rounded-2xl group-hover:scale-110 transition-transform">
                                        <ArrowUpRight size={24} className="text-indigo-100" />
                                    </div>
                                </div>
                                <div className="absolute -bottom-6 -right-6 opacity-10 pointer-events-none group-hover:scale-125 transition-transform duration-700">
                                    <TrendingUp size={140} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Partner Modal */}
            {isAdding && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
                        <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-xl text-slate-800 flex items-center tracking-tight">
                                    <Building size={22} className="mr-3 text-indigo-600"/> New University Partner
                                </h3>
                                <p className="text-xs text-slate-500 font-medium mt-1">Configure portal and commission details.</p>
                            </div>
                            <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-900 bg-white p-2 rounded-xl shadow-sm border border-slate-100 transition-all"><X size={20}/></button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Partner Name</label>
                                <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all font-medium" value={newPartnerData.name} onChange={e => setNewPartnerData({...newPartnerData, name: e.target.value})} placeholder="e.g. Flinders University" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Entity Type</label>
                                    <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl bg-white text-sm font-medium focus:ring-2 focus:ring-indigo-500/20" value={newPartnerData.type} onChange={e => setNewPartnerData({...newPartnerData, type: e.target.value})}>
                                        <option value="University">University</option><option value="College">College</option><option value="Aggregator">Aggregator</option><option value="Consultancy">Consultancy</option><option value="B2B Agent">B2B Agent</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Commission (%)</label>
                                    <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20" type="number" value={newPartnerData.commissionRate} onChange={e => setNewPartnerData({...newPartnerData, commissionRate: e.target.value})} placeholder="15" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Portal Access Link</label>
                                <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20" value={newPartnerData.portalUrl} onChange={e => setNewPartnerData({...newPartnerData, portalUrl: e.target.value})} placeholder="https://agent.portal.edu" />
                            </div>
                        </div>
                        <div className="p-8 border-t border-slate-50 bg-slate-50/30 flex justify-end gap-3">
                            <button onClick={() => setIsAdding(false)} className="px-6 py-3 rounded-2xl font-bold text-slate-500 hover:bg-slate-200 transition-all text-sm">Dismiss</button>
                            <button onClick={handleAddPartner} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all active:scale-95 text-sm">Save Partner</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};