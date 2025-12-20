import React, { useEffect, useState, useMemo } from 'react';
import { ActivityLog, ChangeRecord } from '../../types';
import { fetchLogs } from '../../services/auditService';
import { 
  History, User, Calendar, ShieldCheck, Activity, Loader2, 
  ChevronDown, ChevronRight, ArrowRight, Search, Filter, 
  Download, Trash2, FileText, UserPlus, CreditCard, 
  Settings, Key, Briefcase, Zap, Globe, Clock, RefreshCcw
} from 'lucide-react';

export const ActivityLogs: React.FC = () => {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [entityFilter, setEntityFilter] = useState<string>('All');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const data = await fetchLogs();
            setLogs(data);
            setLoading(false);
        };
        load();
    }, []);

    const getActionStyles = (action: string) => {
        switch (action) {
            case 'CREATE': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'DELETE': return 'bg-rose-50 text-rose-700 border-rose-100';
            case 'UPDATE': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'LOGIN': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
            case 'EXPORT': return 'bg-blue-50 text-blue-700 border-blue-100';
            default: return 'bg-slate-50 text-slate-700 border-slate-100';
        }
    };

    const getEntityIcon = (type: string) => {
        switch (type) {
            case 'Student': return <UserPlus size={16} />;
            case 'Invoice': return <CreditCard size={16} />;
            case 'Settings': return <Settings size={16} />;
            case 'File': return <FileText size={16} />;
            case 'Auth': return <Key size={16} />;
            case 'Commission': return <Briefcase size={16} />;
            case 'Expense': return <Zap size={16} />;
            default: return <Activity size={16} />;
        }
    };

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const matchesSearch = log.details.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                log.userName.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesEntity = entityFilter === 'All' || log.entityType === entityFilter;
            return matchesSearch && matchesEntity;
        });
    }, [logs, searchTerm, entityFilter]);

    const entityTypes = useMemo(() => {
        const types = new Set(logs.map(l => l.entityType));
        return ['All', ...Array.from(types)];
    }, [logs]);

    const toggleExpand = (id: string) => {
        setExpandedLogId(expandedLogId === id ? null : id);
    };

    if (loading) return <div className="h-full flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-indigo-500" size={40} /></div>;

    return (
        <div className="h-full p-6 md:p-10 bg-slate-50 overflow-y-auto custom-scrollbar">
            <div className="max-w-6xl mx-auto space-y-8 pb-20">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center space-x-3 mb-1">
                            <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-100">
                                <History size={24} />
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Audit Trail</h1>
                        </div>
                        <p className="text-slate-500 font-medium ml-14">Security monitoring and system change history.</p>
                    </div>

                    <div className="flex items-center space-x-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="px-4 py-1.5 border-r border-slate-100 text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Events</p>
                            <p className="text-lg font-black text-slate-800 leading-tight">{logs.length}</p>
                        </div>
                        <div className="px-4 py-1.5 text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logged Since</p>
                            <p className="text-lg font-black text-slate-800 leading-tight">
                                {logs.length > 0 ? new Date(logs[logs.length-1].timestamp).toLocaleDateString() : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                        <input 
                            type="text" 
                            placeholder="Search by user or description..." 
                            className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-[1.25rem] shadow-sm outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all font-medium text-slate-700"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex space-x-3">
                        <div className="relative">
                            <Filter className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                            <select 
                                className="pl-10 pr-8 py-3.5 bg-white border border-slate-200 rounded-[1.25rem] shadow-sm outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all font-bold text-sm text-slate-600 appearance-none cursor-pointer min-w-[160px]"
                                value={entityFilter}
                                onChange={(e) => setEntityFilter(e.target.value)}
                            >
                                {entityTypes.map(type => (
                                    <option key={type} value={type}>{type === 'All' ? 'All Entities' : type}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3.5 top-4 text-slate-400 pointer-events-none" size={16} />
                        </div>
                        <button 
                            onClick={() => window.location.reload()}
                            className="p-3.5 bg-white border border-slate-200 rounded-[1.25rem] shadow-sm text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all active:scale-95"
                        >
                            <RefreshCcw size={20} />
                        </button>
                    </div>
                </div>

                {/* Log List */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden relative">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                            <ShieldCheck size={20} className="text-emerald-500"/>
                            <span className="text-xs font-black text-slate-700 uppercase tracking-widest">Encrypted Immutable Audit Storage</span>
                        </div>
                        <div className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest space-x-1">
                            <Clock size={12} />
                            <span>GMT+5:45 (Nepal Standard Time)</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                <tr>
                                    <th className="px-8 py-4 w-10"></th>
                                    <th className="px-8 py-4">Security Event</th>
                                    <th className="px-8 py-4">Involved User</th>
                                    <th className="px-8 py-4">Action</th>
                                    <th className="px-8 py-4 text-right">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredLogs.length > 0 ? filteredLogs.map((log) => {
                                    const hasChanges = log.changes && Object.keys(log.changes).length > 0;
                                    const isExpanded = expandedLogId === log.id;
                                    
                                    return (
                                        <React.Fragment key={log.id}>
                                            <tr 
                                                className={`group hover:bg-indigo-50/20 transition-all cursor-pointer ${isExpanded ? 'bg-indigo-50/30' : ''}`}
                                                onClick={() => hasChanges && toggleExpand(log.id)}
                                            >
                                                <td className="px-8 py-6">
                                                    {hasChanges ? (
                                                        <div className={`p-1.5 rounded-lg transition-all ${isExpanded ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-300 group-hover:text-indigo-400'}`}>
                                                            {isExpanded ? <ChevronDown size={18}/> : <ChevronRight size={18}/>}
                                                        </div>
                                                    ) : (
                                                        <div className="w-6" />
                                                    )}
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center space-x-4">
                                                        <div className={`p-3 rounded-2xl transition-all shadow-sm ${isExpanded ? 'bg-white text-indigo-600' : 'bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-indigo-500'}`}>
                                                            {getEntityIcon(log.entityType)}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-slate-800 tracking-tight">{log.details}</p>
                                                            <div className="flex items-center space-x-2 mt-1">
                                                                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{log.entityType}</span>
                                                                {hasChanges && <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-tighter">Delta Tracked</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-black text-slate-600 shadow-inner group-hover:border-indigo-200 transition-colors">
                                                            {log.userName.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-700">{log.userName}</p>
                                                            <p className="text-[10px] text-slate-400 font-medium">ID: {log.userId.substring(0,8)}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border tracking-widest shadow-sm ${getActionStyles(log.action)}`}>
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <p className="text-xs font-black text-slate-700 tracking-tighter">
                                                        {new Date(log.timestamp).toLocaleDateString()}
                                                    </p>
                                                    <p className="text-[10px] font-mono text-slate-400 mt-1">
                                                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                    </p>
                                                </td>
                                            </tr>
                                            {isExpanded && hasChanges && (
                                                <tr className="bg-slate-50/50">
                                                    <td colSpan={5} className="px-8 py-8">
                                                        <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-xl animate-in slide-in-from-top-4 duration-300">
                                                            <div className="flex items-center justify-between mb-8">
                                                                <div>
                                                                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center">
                                                                        <Zap size={16} className="mr-2 text-amber-500" /> System Property Delta
                                                                    </h4>
                                                                    <p className="text-xs text-slate-400 mt-1 font-medium">Comparison of field states before and after update.</p>
                                                                </div>
                                                                <div className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 flex items-center space-x-6">
                                                                    <div className="flex items-center space-x-2">
                                                                        <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                                                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Previous State</span>
                                                                    </div>
                                                                    <ArrowRight size={14} className="text-slate-300" />
                                                                    <div className="flex items-center space-x-2">
                                                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                                                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Current State</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                {Object.entries(log.changes || {}).map(([field, change]) => {
                                                                    const record = change as ChangeRecord;
                                                                    return (
                                                                        <div key={field} className="group/item flex flex-col border border-slate-100 rounded-2xl overflow-hidden hover:border-indigo-200 transition-colors">
                                                                            <div className="bg-slate-50/50 px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                                                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{field.replace(/([A-Z])/g, ' $1').trim()}</span>
                                                                                <Globe size={12} className="text-slate-300 group-hover/item:text-indigo-400 transition-colors" />
                                                                            </div>
                                                                            <div className="flex h-20">
                                                                                <div className="flex-1 p-3 bg-rose-50/30 flex items-center border-r border-slate-100">
                                                                                    <p className="text-xs font-bold text-rose-700 line-through opacity-60 truncate">
                                                                                        {record.old !== null && record.old !== undefined ? String(record.old) : 'UNDEFINED'}
                                                                                    </p>
                                                                                </div>
                                                                                <div className="w-10 bg-white flex items-center justify-center">
                                                                                    <ArrowRight size={16} className="text-slate-300" />
                                                                                </div>
                                                                                <div className="flex-1 p-3 bg-emerald-50/30 flex items-center">
                                                                                    <p className="text-xs font-black text-emerald-700 truncate">
                                                                                        {record.new !== null && record.new !== undefined ? String(record.new) : 'NULLIFIED'}
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-32 text-center text-slate-400">
                                            <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                                                <Activity size={48} className="opacity-10"/>
                                            </div>
                                            <h3 className="text-xl font-black text-slate-800 tracking-tight">No Events Recorded</h3>
                                            <p className="text-sm font-medium mt-2">Adjust your filters or initiate system activities to see logs here.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {filteredLogs.length > 0 && (
                        <div className="p-8 border-t border-slate-100 bg-slate-50/30 flex justify-between items-center">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Security compliance level: ISO 27001 SIMULATED</p>
                            <button 
                                className="bg-white border border-slate-200 text-slate-600 px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all flex items-center shadow-sm"
                                onClick={() => alert("Audit log export is only available in Enterprise plan.")}
                            >
                                <Download size={14} className="mr-2" /> Export PDF Log
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};