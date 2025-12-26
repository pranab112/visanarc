import React, { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { fetchStudents, fetchInvoices, saveInvoices, fetchSettings, fetchExpenses, saveExpenses, saveStudents } from '../../services/storageService';
import { Student, ApplicationStatus, Invoice, AgencySettings, Expense, ExpenseCategory } from '../../types';
import { DollarSign, TrendingUp, CreditCard, Activity, Loader2, Zap, Target, Search, Save, X, RotateCw, HandCoins, Receipt, ChevronRight } from 'lucide-react';
import { getCurrentUser } from '../../services/authService';

const STATUS_COLORS: Record<string, string> = {
  [ApplicationStatus.Lead]: '#94a3b8',
  [ApplicationStatus.Applied]: '#6366f1',
  [ApplicationStatus.OfferReceived]: '#f59e0b',
  [ApplicationStatus.VisaGranted]: '#10b981',
  [ApplicationStatus.VisaRejected]: '#ef4444',
  [ApplicationStatus.Alumni]: '#0f172a',
};

export const AnalyticsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'financials' | 'pipeline'>('overview');
  const [students, setStudents] = useState<Student[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<AgencySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [pipelineSearch, setPipelineSearch] = useState('');
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

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(ApplicationStatus).forEach(s => counts[s] = 0);
    filteredStudents.forEach(s => { if(counts[s.status] !== undefined) counts[s.status]++; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
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
          </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Realized Revenue" value={realizedRevenue} currency={currency} icon={<Zap size={22}/>} color="emerald" label="Cash in Hand" trend="+12%" />
          <StatCard title="Pipeline Potential" value={outstandingRevenue} currency={currency} icon={<HandCoins size={22}/>} color="indigo" label="Pending Claims" trend="+8.4%" />
          <StatCard title="Burn Rate" value={totalExpenses} currency={currency} icon={<CreditCard size={22}/>} color="rose" label="Operational Costs" trend="-2.1%" />
          <StatCard title="Conversion" value={conversionRate} unit="%" icon={<TrendingUp size={22}/>} color="amber" label="Visa Success Rate" trend="+3.2%" />
      </div>

      {activeTab === 'overview' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-in fade-in duration-700">
              <div className="xl:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
                  <h3 className="text-xl font-bold text-slate-800 mb-8">Growth Projection</h3>
                  <div className="h-[350px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={trendData}>
                              <defs>
                                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontStyle: 'bold', fill: '#94a3b8'}} />
                              <Tooltip />
                              <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fill="url(#colorRev)" />
                          </AreaChart>
                      </ResponsiveContainer>
                  </div>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col justify-center items-center">
                  <div className="h-[250px] w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                              <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value">
                                  {statusData.map((entry, index) => (<Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#cbd5e1'} stroke="none" />))}
                              </Pie>
                          </PieChart>
                      </ResponsiveContainer>
                  </div>
                  <div className="w-full space-y-2 mt-6">
                      {statusData.filter(d => d.value > 0).map((d, i) => (
                          <div key={i} className="flex justify-between items-center px-4 py-2 bg-slate-50 rounded-xl">
                              <span className="text-[10px] font-bold text-slate-600 uppercase">{d.name}</span>
                              <span className="text-xs font-black text-slate-900">{d.value}</span>
                          </div>
                      ))}
                  </div>
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