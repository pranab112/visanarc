
import React, { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend, ComposedChart, Line } from 'recharts';
import { fetchStudents, fetchInvoices, saveInvoices, fetchSettings, fetchExpenses, saveExpenses } from '../../services/storageService';
import { Student, ApplicationStatus, Invoice, AgencySettings, Expense, ExpenseCategory, Country } from '../../types';
/* Added missing RefreshCcw import to fix error on line 428 */
import { DollarSign, TrendingUp, CreditCard, Activity, Loader2, Zap, Target, Search, Save, X, RotateCw, HandCoins, Receipt, ChevronRight, ArrowUpRight, ArrowDownRight, PieChart as PieChartIcon, BarChart3, List, Layers, Globe, Filter, Calendar, Users, RefreshCcw } from 'lucide-react';
import { getCurrentUser } from '../../services/authService';

const STATUS_COLORS: Record<string, string> = {
  [ApplicationStatus.Lead]: '#94a3b8',
  [ApplicationStatus.Applied]: '#6366f1',
  [ApplicationStatus.OfferReceived]: '#f59e0b',
  [ApplicationStatus.VisaGranted]: '#10b981',
  [ApplicationStatus.VisaRejected]: '#ef4444',
  [ApplicationStatus.Alumni]: '#0f172a',
};

const EXPENSE_COLORS: Record<string, string> = {
  'Rent': '#6366f1',
  'Salaries': '#8b5cf6',
  'Marketing': '#ec4899',
  'Utilities': '#06b6d4',
  'Software': '#10b981',
  'Office': '#f59e0b',
  'Travel': '#f43f5e',
  'Other': '#64748b'
};

export const AnalyticsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'financials' | 'pipeline'>('overview');
  const [students, setStudents] = useState<Student[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<AgencySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({
      amount: '',
      category: 'Salaries' as ExpenseCategory,
      description: ''
  });

  const [selectedBranch, setSelectedBranch] = useState<string>('All');

  useEffect(() => {
    const load = async () => {
        setLoading(true);
        const user = getCurrentUser();
        setCurrentUser(user);
        
        const [s, i, e, set] = await Promise.all([
            fetchStudents(),
            fetchInvoices(),
            fetchExpenses(),
            fetchSettings()
        ]);
        setStudents(s);
        setInvoices(i);
        setExpenses(e);
        setSettings(set);
        setLoading(false);
    };
    load();
  }, []);

  const handleAddExpense = async () => {
      if (!newExpense.amount || !newExpense.description) return;
      const amt = parseFloat(newExpense.amount);
      const expenseItem: Expense = {
          id: `ex_${Date.now()}`,
          amount: amt,
          category: newExpense.category,
          description: newExpense.description,
          date: Date.now(),
          recordedBy: currentUser?.name || 'Agent',
          branchId: selectedBranch === 'All' ? 'main' : selectedBranch
      };
      const updated = [expenseItem, ...expenses];
      setExpenses(updated);
      await saveExpenses(updated);
      setIsAddingExpense(false);
      setNewExpense({ amount: '', category: 'Salaries', description: '' });
  };

  const currency = settings?.currency || 'NPR';

  const filteredInvoices = useMemo(() => invoices.filter(i => selectedBranch === 'All' || (i.branchId || 'main') === selectedBranch), [invoices, selectedBranch]);
  const filteredExpenses = useMemo(() => expenses.filter(e => selectedBranch === 'All' || (e.branchId || 'main') === selectedBranch), [expenses, selectedBranch]);
  const filteredStudents = useMemo(() => students.filter(s => selectedBranch === 'All' || (s.branchId || 'main') === selectedBranch), [students, selectedBranch]);

  const realizedRevenue = useMemo(() => filteredInvoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.amount, 0), [filteredInvoices]);
  const outstandingRevenue = useMemo(() => filteredInvoices.filter(i => i.status === 'Pending').reduce((sum, i) => sum + i.amount, 0), [filteredInvoices]);
  const totalExpenses = useMemo(() => filteredExpenses.reduce((sum, e) => sum + e.amount, 0), [filteredExpenses]);
  
  const conversionRate = useMemo(() => {
    if (filteredStudents.length === 0) return 0;
    const granted = filteredStudents.filter(s => s.status === ApplicationStatus.VisaGranted).length;
    return Math.round((granted / filteredStudents.length) * 100);
  }, [filteredStudents]);

  const trendData = useMemo(() => {
    const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
    return months.map((m, i) => ({
      name: m,
      revenue: realizedRevenue * (0.6 + (i * 0.08)),
      expense: totalExpenses * (0.7 + (Math.random() * 0.3)),
    }));
  }, [realizedRevenue, totalExpenses]);

  const expenseCategoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredExpenses.forEach(e => {
        counts[e.category] = (counts[e.category] || 0) + e.amount;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredExpenses]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(ApplicationStatus).forEach(s => counts[s] = 0);
    filteredStudents.forEach(s => { if(counts[s.status] !== undefined) counts[s.status]++; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredStudents]);

  const countryData = useMemo(() => {
      const counts: Record<string, number> = {};
      filteredStudents.forEach(s => {
          counts[s.targetCountry] = (counts[s.targetCountry] || 0) + 1;
      });
      return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredStudents]);

  const pipelineRevenue = useMemo(() => {
      return filteredStudents
        .filter(s => s.status === ApplicationStatus.Applied || s.status === ApplicationStatus.OfferReceived)
        .reduce((sum, s) => sum + (s.commissionAmount || 150000), 0);
  }, [filteredStudents]);

  if (loading) return <div className="h-full flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-indigo-500" size={40} /></div>;

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-6 md:p-10 space-y-10 pb-32 custom-scrollbar relative">
      
      {isAddingExpense && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
              <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 border border-slate-100">
                  <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                      <div><h3 className="font-bold text-xl text-slate-800 flex items-center"><Zap size={22} className="mr-3 text-rose-500"/> Record Expense</h3></div>
                      <button onClick={() => setIsAddingExpense(false)} className="text-slate-400 hover:text-slate-900 bg-white p-2 rounded-xl transition-all active:scale-90"><X size={20}/></button>
                  </div>
                  <div className="p-8 space-y-6">
                      <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100 flex flex-col items-center">
                          <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2">Amount Paid ({currency})</label>
                          <input type="number" autoFocus className="w-full bg-transparent text-4xl font-black text-rose-700 text-center outline-none" placeholder="0.00" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} />
                      </div>
                      <div className="space-y-4">
                          <select className="w-full p-4 border border-slate-200 rounded-2xl bg-white font-bold" value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value as ExpenseCategory})}>
                              {['Salaries', 'Rent', 'Marketing', 'Utilities', 'Software', 'Office', 'Travel', 'Other'].map(c => (<option key={c} value={c}>{c}</option>))}
                          </select>
                          <input className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 outline-none text-sm font-medium" placeholder="Description" value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} />
                      </div>
                  </div>
                  <div className="p-8 border-t border-slate-50 bg-slate-50/30 flex justify-end gap-3">
                      <button onClick={() => setIsAddingExpense(false)} className="px-6 py-3 rounded-2xl font-bold text-slate-500 text-sm">Discard</button>
                      <button onClick={handleAddExpense} disabled={!newExpense.amount} className="bg-slate-900 text-white px-10 py-3 rounded-2xl font-bold shadow-xl hover:bg-rose-600 transition-all text-sm flex items-center"><Save size={18} className="mr-2"/>Log Expense</button>
                  </div>
              </div>
          </div>
      )}

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
              <div className="flex items-center space-x-3 mb-1">
                  <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-xl">
                    <Target size={22} />
                  </div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">Executive Dashboard</h1>
              </div>
              <p className="text-slate-500 font-medium ml-14">Monitoring agency performance across the network.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
              <div className="flex bg-slate-200/50 p-1 rounded-2xl border border-slate-200">
                  {['overview', 'financials', 'pipeline'].map(t => (
                      <button key={t} onClick={() => setActiveTab(t as any)} className={`px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === t ? 'bg-white shadow-md text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>{t}</button>
                  ))}
              </div>
              {activeTab === 'financials' && (
                  <button 
                    onClick={() => setIsAddingExpense(true)}
                    className="bg-rose-600 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg flex items-center"
                  >
                      <Zap size={14} className="mr-2"/> Log Expense
                  </button>
              )}
          </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Realized Revenue" value={realizedRevenue} currency={currency} icon={<Zap size={22}/>} color="emerald" label="Cash in Hand" trend="+12%" />
          <StatCard title="Pipeline Potential" value={pipelineRevenue} currency={currency} icon={<HandCoins size={22}/>} color="indigo" label="Unrealized Yield" trend="+8.4%" />
          <StatCard title="Burn Rate" value={totalExpenses} currency={currency} icon={<CreditCard size={22}/>} color="rose" label="Operational Costs" trend="-2.1%" />
          <StatCard title="Conversion" value={conversionRate} unit="%" icon={<TrendingUp size={22}/>} color="amber" label="Visa Success Rate" trend="+3.2%" />
      </div>

      {activeTab === 'overview' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-in fade-in duration-700">
              <div className="xl:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center"><BarChart3 size={20} className="mr-2 text-indigo-600"/> Growth Projection</h3>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last 6 Months</span>
                  </div>
                  <div className="h-[350px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={trendData}>
                              <defs>
                                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
                              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
                              <Tooltip 
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                              />
                              <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fill="url(#colorRev)" />
                              <Line type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={2} strokeDasharray="5 5" />
                          </ComposedChart>
                      </ResponsiveContainer>
                  </div>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col">
                  <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center"><Layers size={20} className="mr-2 text-indigo-600"/> Application Funnel</h3>
                  <p className="text-xs text-slate-400 mb-8 font-medium">Distribution of applicants by workflow stage.</p>
                  <div className="h-[250px] w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                              <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value">
                                  {statusData.map((entry, index) => (<Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#cbd5e1'} stroke="none" />))}
                              </Pie>
                          </PieChart>
                      </ResponsiveContainer>
                  </div>
                  <div className="w-full space-y-2 mt-6 overflow-y-auto max-h-[200px] custom-scrollbar">
                      {statusData.filter(d => d.value > 0).map((d, i) => (
                          <div key={i} className="flex justify-between items-center px-4 py-2.5 bg-slate-50 rounded-xl group hover:bg-indigo-50 transition-colors">
                              <div className="flex items-center">
                                  <div className="w-2 h-2 rounded-full mr-3" style={{ backgroundColor: STATUS_COLORS[d.name] }} />
                                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight">{d.name}</span>
                              </div>
                              <span className="text-xs font-black text-slate-900">{d.value}</span>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'financials' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Expense Breakdown */}
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                      <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center"><PieChartIcon size={20} className="mr-2 text-rose-500"/> Expense Allocation</h3>
                      <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                  <Pie data={expenseCategoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value">
                                      {expenseCategoryData.map((entry, index) => (<Cell key={`cell-${index}`} fill={EXPENSE_COLORS[entry.name] || '#cbd5e1'} stroke="none" />))}
                                  </Pie>
                                  <Tooltip />
                              </PieChart>
                          </ResponsiveContainer>
                      </div>
                      <div className="mt-6 grid grid-cols-2 gap-2">
                          {expenseCategoryData.map((d, i) => (
                              <div key={i} className="flex items-center p-2 rounded-lg bg-slate-50">
                                  <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: EXPENSE_COLORS[d.name] }} />
                                  <span className="text-[9px] font-bold text-slate-500 uppercase truncate">{d.name}</span>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* Transaction Ledger */}
                  <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                          <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest flex items-center"><List size={20} className="mr-2 text-indigo-600"/> Master Ledger</h3>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Stream</span>
                      </div>
                      <div className="flex-1 overflow-y-auto max-h-[500px] custom-scrollbar">
                          <table className="w-full text-left">
                              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 sticky top-0 z-10">
                                  <tr>
                                      <th className="px-8 py-4">Transaction</th>
                                      <th className="px-8 py-4">Category</th>
                                      <th className="px-8 py-4 text-right">Amount</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                  {/* Interleave Invoices and Expenses by date */}
                                  {[
                                      ...filteredInvoices.filter(i => i.status === 'Paid').map(i => ({ type: 'Income', name: i.studentName, desc: i.description, amount: i.amount, date: i.date, category: 'Revenue' })),
                                      ...filteredExpenses.map(e => ({ type: 'Expense', name: e.recordedBy, desc: e.description, amount: -e.amount, date: e.date, category: e.category }))
                                  ].sort((a, b) => b.date - a.date).map((tx, idx) => (
                                      <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                                          <td className="px-8 py-5">
                                              <div className="flex items-center space-x-3">
                                                  <div className={`p-2 rounded-lg ${tx.type === 'Income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                      {tx.type === 'Income' ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
                                                  </div>
                                                  <div>
                                                      <p className="text-xs font-black text-slate-800 tracking-tight">{tx.desc}</p>
                                                      <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{new Date(tx.date).toLocaleDateString()} • {tx.name}</p>
                                                  </div>
                                              </div>
                                          </td>
                                          <td className="px-8 py-5">
                                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter border ${tx.type === 'Income' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>{tx.category}</span>
                                          </td>
                                          <td className={`px-8 py-5 text-right font-mono text-xs font-black ${tx.amount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                              {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'pipeline' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Country Breakdown */}
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col">
                      <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center"><Globe size={20} className="mr-2 text-indigo-600"/> Destination Yield</h3>
                      <div className="flex-1 space-y-4">
                          {countryData.map((c, i) => (
                              <div key={i} className="group">
                                  <div className="flex justify-between items-center mb-1.5">
                                      <span className="text-[11px] font-black text-slate-600 uppercase tracking-tight">{c.name}</span>
                                      <span className="text-xs font-black text-indigo-600">{c.value} Students</span>
                                  </div>
                                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-indigo-500 transition-all duration-1000 group-hover:bg-indigo-400" 
                                        style={{ width: `${(c.value / filteredStudents.length) * 100}%` }}
                                      />
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* Future Intake Volume */}
                  <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                      <div className="flex justify-between items-center mb-8">
                          <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest flex items-center"><Calendar size={20} className="mr-2 text-indigo-600"/> Future Intake Forecast</h3>
                          <div className="flex items-center space-x-2 text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full">
                              <TrendingUp size={12}/>
                              <span className="text-[10px] font-black uppercase">Projected Load</span>
                          </div>
                      </div>
                      <div className="h-72 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={[
                                  { name: 'Feb 2025', count: filteredStudents.filter(s => s.intakeMonth === 'February' && s.intakeYear === '2025').length },
                                  { name: 'July 2025', count: filteredStudents.filter(s => s.intakeMonth === 'July' && s.intakeYear === '2025').length },
                                  { name: 'Sep 2025', count: filteredStudents.filter(s => s.intakeMonth === 'September' && s.intakeYear === '2025').length },
                                  { name: 'Feb 2026', count: filteredStudents.filter(s => s.intakeMonth === 'February' && s.intakeYear === '2026').length }
                              ]}>
                                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
                                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                  <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} />
                              </BarChart>
                          </ResponsiveContainer>
                      </div>
                  </div>
              </div>

              {/* Recruitment Stream Quality */}
              <div className="bg-slate-900 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden text-white border border-slate-800">
                  <div className="relative z-10 grid grid-cols-1 lg:grid-cols-4 gap-10">
                      <div className="lg:col-span-1">
                          <div className="p-4 bg-indigo-500 rounded-3xl w-fit mb-6 shadow-xl shadow-indigo-500/20">
                              <Activity size={32}/>
                          </div>
                          <h4 className="text-3xl font-black tracking-tight mb-2">Recruitment Pipeline Health</h4>
                          <p className="text-slate-400 font-medium leading-relaxed">Cross-network analysis of applicant quality and counselor efficiency.</p>
                      </div>
                      
                      <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 group hover:bg-white/[0.08] transition-all">
                              <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Lead Velocity</p>
                              <div className="flex items-baseline space-x-2">
                                  <h5 className="text-4xl font-black tabular-nums">4.2</h5>
                                  <span className="text-xs font-bold text-slate-500">leads/day</span>
                              </div>
                              <div className="mt-4 pt-4 border-t border-white/5 flex items-center text-emerald-400">
                                  <ArrowUpRight size={14} className="mr-1"/>
                                  <span className="text-[10px] font-black uppercase">+18% vs prev period</span>
                              </div>
                          </div>
                          
                          <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 group hover:bg-white/[0.08] transition-all">
                              <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Pipeline ROI</p>
                              <div className="flex items-baseline space-x-2">
                                  <h5 className="text-4xl font-black tabular-nums">9.4x</h5>
                                  <span className="text-xs font-bold text-slate-500">multiple</span>
                              </div>
                              <div className="mt-4 pt-4 border-t border-white/5 flex items-center text-indigo-400">
                                  <Users size={14} className="mr-1"/>
                                  <span className="text-[10px] font-black uppercase">Based on ad-spend</span>
                              </div>
                          </div>

                          <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 group hover:bg-white/[0.08] transition-all">
                              <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Branch Load</p>
                              <div className="flex items-baseline space-x-2">
                                  <h5 className="text-4xl font-black tabular-nums">68%</h5>
                                  <span className="text-xs font-bold text-slate-500">capacity</span>
                              </div>
                              <div className="mt-4 pt-4 border-t border-white/5 flex items-center text-amber-400">
                                  <RefreshCcw size={14} className="mr-1"/>
                                  <span className="text-[10px] font-black uppercase">Optimal staff ratio</span>
                              </div>
                          </div>
                      </div>
                  </div>
                  <Globe size={400} className="absolute -bottom-40 -right-40 text-white/5 pointer-events-none group-hover:scale-105 transition-transform duration-1000" />
              </div>
          </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, currency, unit, icon, color, label, trend }: any) => {
    const colors: any = { emerald: 'bg-emerald-50 text-emerald-600', indigo: 'bg-indigo-50 text-indigo-600', rose: 'bg-rose-50 text-rose-600', amber: 'bg-amber-50 text-amber-600' };
    return (
        <div className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-200 group hover:border-indigo-400 transition-all duration-500">
            <div className="flex justify-between items-start mb-8">
                <div className={`p-3.5 rounded-2xl border ${colors[color]}`}>{icon}</div>
                <div className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-100">{trend}</div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
            <h4 className="text-3xl font-black text-slate-900 tracking-tighter tabular-nums mt-1">{currency && <span className="text-base text-slate-400 font-bold mr-1.5">{currency}</span>}{typeof value === 'number' ? value.toLocaleString() : value}{unit}</h4>
            <div className="mt-5 pt-5 border-t border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-2 animate-pulse"></div>{label}
            </div>
        </div>
    );
};
