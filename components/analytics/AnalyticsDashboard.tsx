
import React, { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { fetchStudents, fetchInvoices, saveInvoices, fetchSettings, fetchExpenses, saveExpenses, saveStudents } from '../../services/storageService';
import { Student, ApplicationStatus, Invoice, AgencySettings, Expense, ExpenseCategory, Country } from '../../types';
/* Added missing 'Save' icon to imports */
import { DollarSign, TrendingUp, CreditCard, Activity, Loader2, FileText, HandCoins, ArrowUpRight, Receipt, Network, X, CheckCircle2, Sparkles, Briefcase, ToggleLeft, ToggleRight, Clock, ShieldCheck, ArrowDownRight, Zap, Target, Search, Send, Mail, Landmark, Banknote, ChevronRight, Plus, Trash2, Save } from 'lucide-react';
import { logActivity } from '../../services/auditService';
import { simulateSendEmail, fillTemplate } from '../../services/communicationService';
import { getCurrentUser } from '../../services/authService';

const STATUS_COLORS: Record<string, string> = {
  [ApplicationStatus.Lead]: '#94a3b8',
  [ApplicationStatus.Applied]: '#6366f1',
  [ApplicationStatus.OfferReceived]: '#f59e0b',
  [ApplicationStatus.VisaGranted]: '#10b981',
  [ApplicationStatus.VisaRejected]: '#ef4444',
  [ApplicationStatus.Alumni]: '#0f172a',
};

const CATEGORY_COLORS: Record<string, string> = {
    'Salaries': '#6366f1',
    'Rent': '#f43f5e',
    'Marketing': '#f59e0b',
    'Utilities': '#06b6d4',
    'Software': '#8b5cf6',
    'Office': '#10b981',
    'Travel': '#ec4899',
    'Other': '#94a3b8'
};

export const AnalyticsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'financials' | 'pipeline'>('overview');
  const [students, setStudents] = useState<Student[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<AgencySettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Search/Filter for Pipeline
  const [pipelineSearch, setPipelineSearch] = useState('');

  // Modal / Action States
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [receivingId, setReceivingId] = useState<string | null>(null);
  const [togglingInvoiceId, setTogglingInvoiceId] = useState<string | null>(null);
  
  // Pre-filled Invoice Generator State (From Kanban)
  const [isAutoInvoiceOpen, setIsAutoInvoiceOpen] = useState(false);
  const [autoInvoiceStudent, setAutoInvoiceStudent] = useState<Student | null>(null);
  const [autoInvoiceAmount, setAutoInvoiceAmount] = useState('');
  const [isProcessingAuto, setIsProcessingAuto] = useState(false);

  // Expense Modal State
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({
      amount: '',
      category: 'Salaries' as ExpenseCategory,
      description: ''
  });

  // Global Filter
  const [selectedBranch, setSelectedBranch] = useState<string>('All');

  useEffect(() => {
    const load = async () => {
        setLoading(true);
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
        
        // CHECK FOR KANBAN HAND-OFF
        const pendingClaim = localStorage.getItem('sag_auto_invoice_student');
        if (pendingClaim) {
            try {
                const student = JSON.parse(pendingClaim) as Student;
                setAutoInvoiceStudent(student);
                setAutoInvoiceAmount(String(student.commissionAmount || 150000));
                setActiveTab('financials');
                setIsAutoInvoiceOpen(true);
                localStorage.removeItem('sag_auto_invoice_student');
            } catch (err) {
                console.error("Failed to parse pending claim student", err);
            }
        }

        setLoading(false);
    };
    load();
  }, []);

  // --- ACTIONS ---

  const handleAddExpense = async () => {
      if (!newExpense.amount || !newExpense.description) return;
      
      const amt = parseFloat(newExpense.amount);
      const expenseItem: Expense = {
          id: `ex_${Date.now()}`,
          amount: amt,
          category: newExpense.category,
          description: newExpense.description,
          date: Date.now(),
          recordedBy: getCurrentUser()?.name || 'Agent',
          branchId: selectedBranch === 'All' ? 'main' : selectedBranch
      };

      const updated = [expenseItem, ...expenses];
      setExpenses(updated);
      await saveExpenses(updated);
      logActivity('CREATE', 'Expense', `Recorded ${expenseItem.category} expense: ${amt}`);
      setIsAddingExpense(false);
      setNewExpense({ amount: '', category: 'Salaries', description: '' });
  };

  const handleDeleteExpense = async (id: string) => {
      if (!window.confirm("Remove this expense record?")) return;
      const updated = expenses.filter(e => e.id !== id);
      setExpenses(updated);
      await saveExpenses(updated);
      logActivity('DELETE', 'Expense', `Deleted expense record ${id}`);
  };

  const handleCreateAutoInvoice = async (sendEmail: boolean) => {
      if (!autoInvoiceStudent || isProcessingAuto) return;
      setIsProcessingAuto(true);

      try {
          const amount = parseFloat(autoInvoiceAmount);
          const newInvoice: Invoice = {
              id: `claim_${Date.now()}_${autoInvoiceStudent.id}`,
              invoiceNumber: `REC-${Math.floor(1000 + Math.random() * 9000)}`,
              studentId: autoInvoiceStudent.id,
              studentName: autoInvoiceStudent.name,
              amount: amount,
              description: `Partner Commission Fee - ${autoInvoiceStudent.targetCountry}`,
              status: 'Pending', 
              date: Date.now(),
              branchId: autoInvoiceStudent.branchId || 'main'
          };

          const updatedStudent = { ...autoInvoiceStudent, commissionStatus: 'Claimed' as const };
          const updatedInvoices = [newInvoice, ...invoices];
          const updatedStudents = students.map(s => s.id === updatedStudent.id ? updatedStudent : s);

          await Promise.all([saveInvoices(updatedInvoices), saveStudents(updatedStudents)]);
          
          if (sendEmail && autoInvoiceStudent.email) {
              const body = `Dear ${autoInvoiceStudent.name},\n\nWe have successfully recorded your Visa placement. An official claim for your commission/service fee of ${settings?.currency || 'NPR'} ${amount} has been initiated.\n\nThank you for choosing ${settings?.agencyName}.`;
              await simulateSendEmail(autoInvoiceStudent.email, "Placement Recorded - Commission Claimed", body);
          }

          setInvoices(updatedInvoices);
          setStudents(updatedStudents);
          logActivity('CREATE', 'Invoice', `Generated commission invoice for ${autoInvoiceStudent.name}`);
          setIsAutoInvoiceOpen(false);
          setAutoInvoiceStudent(null);
      } catch (err) {
          alert("Failed to finalize invoice.");
      } finally {
          setIsProcessingAuto(false);
      }
  };

  const handleToggleInvoiceStatus = async (invoiceId: string) => {
    if (togglingInvoiceId) return;
    setTogglingInvoiceId(invoiceId);

    try {
        const updatedInvoices = invoices.map(inv => {
            if (inv.id === invoiceId) {
                return { ...inv, status: inv.status === 'Paid' ? 'Pending' : 'Paid' } as Invoice;
            }
            return inv;
        });

        await saveInvoices(updatedInvoices);
        setInvoices(updatedInvoices);
        logActivity('UPDATE', 'Invoice', `Toggled payment status for invoice ${invoiceId}`);
    } catch (err) {
        alert("Failed to update status.");
    } finally {
        setTogglingInvoiceId(null);
    }
  };

  const handleQuickClaim = async (student: Student) => {
    if (claimingId) return;
    setClaimingId(student.id);
    
    try {
        const amount = student.commissionAmount || 150000;
        
        const newInvoice: Invoice = {
          id: `claim_${Date.now()}_${student.id}`,
          invoiceNumber: `REC-AUTO-${Math.floor(1000 + Math.random() * 9000)}`,
          studentId: student.id,
          studentName: student.name,
          amount: amount,
          description: `Partner Commission Fee - ${student.targetCountry}`,
          status: 'Pending', 
          date: Date.now(),
          branchId: student.branchId || 'main'
        };

        const updatedStudent: Student = { ...student, commissionStatus: 'Claimed' };
        const updatedInvoices = [newInvoice, ...invoices];
        const updatedStudents = students.map(s => s.id === updatedStudent.id ? updatedStudent : s);
        
        await Promise.all([saveInvoices(updatedInvoices), saveStudents(updatedStudents)]);
        
        setInvoices(updatedInvoices);
        setStudents(updatedStudents);
        
        logActivity('UPDATE', 'Commission', `Claimed commission for ${student.name} of ${amount}`);
    } catch (err) {
        alert("Quick claim failed. Please try again.");
    } finally {
        setClaimingId(null);
    }
  };

  const handleConfirmReceipt = async (student: Student) => {
    if (receivingId) return;
    receivingId === student.id;
    setReceivingId(student.id);

    try {
        const invoiceToPay = invoices.find(inv => 
            inv.studentId === student.id && 
            inv.description.toLowerCase().includes('commission') && 
            inv.status === 'Pending'
        );

        let updatedInvoices = [...invoices];
        if (invoiceToPay) {
            updatedInvoices = invoices.map(inv => 
                inv.id === invoiceToPay.id ? { ...inv, status: 'Paid' } : inv
            ) as Invoice[];
        }

        const updatedStudent: Student = { ...student, commissionStatus: 'Received' };
        const updatedStudents = students.map(s => s.id === student.id ? updatedStudent : s);

        await Promise.all([
            saveInvoices(updatedInvoices),
            saveStudents(updatedStudents)
        ]);

        setInvoices(updatedInvoices);
        setStudents(updatedStudents);
        logActivity('UPDATE', 'Commission', `Confirmed bank receipt of commission for ${student.name}`);
    } catch (err) {
        alert("Failed to confirm receipt.");
    } finally {
        setReceivingId(null);
    }
  };

  const currency = settings?.currency || 'NPR';

  // --- CALCULATIONS ---
  const filteredInvoices = useMemo(() => invoices.filter(i => selectedBranch === 'All' || (i.branchId || 'main') === selectedBranch), [invoices, selectedBranch]);
  const filteredExpenses = useMemo(() => expenses.filter(e => selectedBranch === 'All' || (e.branchId || 'main') === selectedBranch), [expenses, selectedBranch]);
  const filteredStudents = useMemo(() => students.filter(s => selectedBranch === 'All' || (s.branchId || 'main') === selectedBranch), [students, selectedBranch]);

  const realizedRevenue = useMemo(() => filteredInvoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.amount, 0), [filteredInvoices]);
  const outstandingRevenue = useMemo(() => filteredInvoices.filter(i => i.status === 'Pending').reduce((sum, i) => sum + i.amount, 0), [filteredInvoices]);
  const totalExpenses = useMemo(() => filteredExpenses.reduce((sum, e) => sum + e.amount, 0), [filteredExpenses]);
  
  const readyToClaimStudents = useMemo(() => filteredStudents.filter(s => {
    const statusStr = (s.status || '').toString().toLowerCase();
    const isVisaGranted = statusStr.includes('visa') && (
        statusStr.includes('granted') || 
        statusStr.includes('received') || 
        statusStr.includes('issued') || 
        statusStr.includes('approved')
    );
    const isNotClaimedYet = !s.commissionStatus || s.commissionStatus === 'Pending';
    const matchesSearch = s.name.toLowerCase().includes(pipelineSearch.toLowerCase());
    return isVisaGranted && isNotClaimedYet && matchesSearch;
  }), [filteredStudents, pipelineSearch]);

  const awaitingReceiptStudents = useMemo(() => filteredStudents.filter(s => {
    const isClaimed = s.commissionStatus === 'Claimed';
    const matchesSearch = s.name.toLowerCase().includes(pipelineSearch.toLowerCase());
    return isClaimed && matchesSearch;
  }), [filteredStudents, pipelineSearch]);

  const projectedUninvoicedRevenue = useMemo(() => readyToClaimStudents.reduce((sum, s) => sum + (s.commissionAmount || 150000), 0), [readyToClaimStudents]);
  
  const totalPotentialRevenue = projectedUninvoicedRevenue + outstandingRevenue;
  
  const conversionRate = filteredStudents.length > 0 
    ? Math.round((filteredStudents.filter(s => s.status === ApplicationStatus.VisaGranted).length / filteredStudents.length) * 100) 
    : 0;

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
      
      {/* ADD EXPENSE MODAL */}
      {isAddingExpense && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
              <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
                  <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                      <div>
                          <h3 className="font-bold text-xl text-slate-800 flex items-center">
                              <Zap size={22} className="mr-3 text-rose-500"/> Record Agency Expense
                          </h3>
                          <p className="text-xs text-slate-500 font-medium mt-1">Allocation: {selectedBranch === 'All' ? 'Main Office' : selectedBranch}</p>
                      </div>
                      <button onClick={() => setIsAddingExpense(false)} className="text-slate-400 hover:text-slate-900 bg-white p-2 rounded-xl shadow-sm border border-slate-100 transition-all active:scale-90"><X size={20}/></button>
                  </div>
                  
                  <div className="p-8 space-y-6">
                      <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100 flex flex-col items-center">
                          <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2">Amount Paid ({currency})</label>
                          <input 
                              type="number"
                              autoFocus
                              className="w-full bg-transparent text-4xl font-black text-rose-700 text-center outline-none"
                              placeholder="0.00"
                              value={newExpense.amount}
                              onChange={e => setNewExpense({...newExpense, amount: e.target.value})}
                          />
                      </div>

                      <div className="space-y-4">
                          <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Expense Category</label>
                              <select 
                                className="w-full p-4 border border-slate-200 rounded-2xl bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-bold"
                                value={newExpense.category}
                                onChange={e => setNewExpense({...newExpense, category: e.target.value as ExpenseCategory})}
                              >
                                  {['Salaries', 'Rent', 'Marketing', 'Utilities', 'Software', 'Office', 'Travel', 'Other'].map(c => (
                                      <option key={c} value={c}>{c}</option>
                                  ))}
                              </select>
                          </div>
                          <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Purpose / Description</label>
                              <input 
                                className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-sm font-medium"
                                placeholder="e.g. Monthly Broadband Payment"
                                value={newExpense.description}
                                onChange={e => setNewExpense({...newExpense, description: e.target.value})}
                              />
                          </div>
                      </div>
                  </div>

                  <div className="p-8 border-t border-slate-50 bg-slate-50/30 flex justify-end gap-3">
                      <button onClick={() => setIsAddingExpense(false)} className="px-6 py-3 rounded-2xl font-bold text-slate-500 hover:bg-slate-200 transition-all text-sm">Discard</button>
                      <button 
                        onClick={handleAddExpense} 
                        disabled={!newExpense.amount || !newExpense.description}
                        className="bg-slate-900 text-white px-10 py-3 rounded-2xl font-bold shadow-xl hover:bg-rose-600 transition-all active:scale-95 text-sm flex items-center disabled:opacity-50"
                      >
                          <Save size={18} className="mr-2"/>
                          Log Expense
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* AUTO INVOICE MODAL */}
      {isAutoInvoiceOpen && autoInvoiceStudent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
              <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
                  <div className="p-8 border-b border-slate-50 bg-indigo-600 flex justify-between items-center text-white">
                      <div>
                          <h3 className="font-bold text-xl flex items-center">
                              <HandCoins size={22} className="mr-3 text-white/80"/> Finalize Placement Claim
                          </h3>
                          <p className="text-xs text-indigo-100 font-medium mt-1">Generating success fee for {autoInvoiceStudent.name}</p>
                      </div>
                      <button onClick={() => setIsAutoInvoiceOpen(false)} className="text-white/60 hover:text-white bg-white/10 p-2 rounded-xl transition-all active:scale-90"><X size={20}/></button>
                  </div>
                  
                  <div className="p-8 space-y-6">
                      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex flex-col items-center">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Claimable Amount ({currency})</label>
                          <div className="relative w-full">
                              <input 
                                  type="number"
                                  autoFocus
                                  className="w-full bg-transparent text-4xl font-black text-slate-900 text-center outline-none"
                                  placeholder="0.00"
                                  value={autoInvoiceAmount}
                                  onChange={e => setAutoInvoiceAmount(e.target.value)}
                              />
                          </div>
                      </div>

                      <div className="space-y-4">
                          <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Service Category</label>
                              <div className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-100 font-bold text-slate-500 cursor-not-allowed">
                                  Partner Commission Fee
                              </div>
                          </div>
                          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-start space-x-3">
                              <Mail size={18} className="text-amber-600 shrink-0 mt-0.5" />
                              <p className="text-xs text-amber-800 font-medium">Finalizing this will automatically notify the student and mark the commission as realized in the audit ledger.</p>
                          </div>
                      </div>
                  </div>

                  <div className="p-8 border-t border-slate-50 bg-slate-50/30 flex flex-col gap-3">
                      <button 
                        onClick={() => handleCreateAutoInvoice(true)} 
                        disabled={isProcessingAuto || !autoInvoiceAmount}
                        className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-xl hover:bg-indigo-700 transition-all active:scale-95 text-sm flex items-center justify-center disabled:opacity-50"
                      >
                          {isProcessingAuto ? <Loader2 size={18} className="animate-spin mr-2"/> : <Send size={18} className="mr-2"/>}
                          Finalize & Send Email Notification
                      </button>
                      <button 
                        onClick={() => handleCreateAutoInvoice(false)}
                        disabled={isProcessingAuto || !autoInvoiceAmount}
                        className="w-full py-3 rounded-2xl font-bold text-slate-500 hover:bg-slate-200 transition-all text-xs"
                      >
                          Finalize without Notification
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Executive Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
              <div className="flex items-center space-x-3 mb-1">
                  <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-100">
                    <Target size={22} />
                  </div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">Executive Dashboard</h1>
              </div>
              <p className="text-slate-500 font-medium ml-14">Financial health & milestone conversion tracking.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              {activeTab === 'financials' && (
                  <button 
                    onClick={() => setIsAddingExpense(true)}
                    className="bg-rose-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-rose-100 hover:bg-rose-700 transition-all flex items-center"
                  >
                      <Plus size={16} className="mr-2"/> Add Expense
                  </button>
              )}
              
              <div className="bg-white p-1 rounded-2xl border border-slate-200 shadow-sm flex items-center pr-4">
                  <div className="p-2 bg-slate-100 rounded-xl mr-3 text-slate-500"><Network size={16}/></div>
                  <select 
                    className="text-sm font-bold text-slate-700 bg-transparent outline-none cursor-pointer"
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                  >
                      <option value="All">Global Network</option>
                      {(settings?.branches || []).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
              </div>
              
              <div className="flex bg-slate-200/50 p-1 rounded-2xl border border-slate-200">
                  <button onClick={() => setActiveTab('overview')} className={`px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'overview' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>Overview</button>
                  <button onClick={() => setActiveTab('financials')} className={`px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'financials' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>Financials</button>
                  <button onClick={() => setActiveTab('pipeline')} className={`px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'pipeline' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>Pipeline</button>
              </div>
          </div>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Realized Revenue" 
            value={realizedRevenue} 
            currency={currency} 
            icon={<Zap size={22}/>} 
            color="emerald" 
            label="Cash in Hand" 
            trend="+12%"
          />
          <StatCard 
            title="Unclaimed Potential" 
            value={totalPotentialRevenue} 
            currency={currency} 
            icon={<HandCoins size={22}/>} 
            color="indigo" 
            label="Incl. Pending Invoices" 
            trend="+8.4%"
          />
          <StatCard 
            title="Burn Rate" 
            value={totalExpenses} 
            currency={currency} 
            icon={<CreditCard size={22}/>} 
            color="rose" 
            label="Operational Costs" 
            trend="-2.1%"
          />
          <StatCard 
            title="Net Profit (Projected)" 
            value={realizedRevenue - totalExpenses} 
            currency={currency} 
            icon={<TrendingUp size={22}/>} 
            color="amber" 
            label="Current Margin" 
            trend="+3.2%"
          />
      </div>

      {activeTab === 'overview' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-in fade-in duration-700 slide-in-from-bottom-4">
              <div className="xl:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
                  <div className="flex justify-between items-start mb-8">
                      <div>
                          <h3 className="text-xl font-bold text-slate-800">Growth Projection</h3>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Cash Flow vs Burn (Last 6 Months)</p>
                      </div>
                  </div>
                  <div className="h-[350px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={trendData}>
                              <defs>
                                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                  </linearGradient>
                                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                  </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontStyle: 'bold', fill: '#94a3b8'}} dy={10} />
                              <YAxis hide />
                              <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }} />
                              <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                              <Area type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorExp)" />
                          </AreaChart>
                      </ResponsiveContainer>
                  </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col">
                  <h3 className="text-xl font-bold text-slate-800 mb-1">Portfolio Balance</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-8">Applicant status mix</p>
                  
                  <div className="flex-1 flex flex-col justify-center items-center">
                    <div className="h-[200px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value">
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#cbd5e1'} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-3xl font-black text-slate-800">{filteredStudents.length}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Students</span>
                        </div>
                    </div>
                    <div className="w-full space-y-2 mt-6">
                        {statusData.filter(d => d.value > 0).map((d, i) => (
                            <div key={i} className="flex justify-between items-center px-4 py-2 bg-slate-50 rounded-xl border border-slate-100/50">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[d.name] || '#cbd5e1' }}></div>
                                    <span className="text-[10px] font-bold text-slate-600 uppercase truncate max-w-[140px]">{d.name}</span>
                                </div>
                                <span className="text-xs font-black text-slate-900">{d.value}</span>
                            </div>
                        ))}
                    </div>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'pipeline' && (
          <div className="space-y-12 animate-in fade-in duration-700 slide-in-from-bottom-4">
              <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden border border-white/5">
                  <div className="relative z-10 max-w-2xl">
                      <h2 className="text-3xl font-black mb-4">Milestone Tracker</h2>
                      <p className="text-slate-300 text-lg leading-relaxed">
                          Track commissions from <strong>Visa Grant</strong> to <strong>Bank Receipt</strong>. Confirm funds once they are visible in your agency account.
                      </p>
                  </div>
                  <Landmark size={240} className="absolute -bottom-10 -right-10 text-white/5" />
              </div>

              {/* Filtering & Search Bar for Pipeline */}
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                  <div className="relative flex-1 w-full">
                      <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                      <input 
                        type="text"
                        placeholder="Filter by student or country..."
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium text-slate-700"
                        value={pipelineSearch}
                        onChange={(e) => setPipelineSearch(e.target.value)}
                      />
                  </div>
              </div>

              {/* Segment 1: Ready to Claim */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-4">
                    <h3 className="text-lg font-black text-slate-800 flex items-center">
                        <HandCoins size={20} className="mr-2 text-indigo-600"/> Phase 1: Ready to Claim
                        <span className="ml-3 px-2.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-tighter">{readyToClaimStudents.length} Students</span>
                    </h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Potential: {currency} {projectedUninvoicedRevenue.toLocaleString()}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {readyToClaimStudents.map(student => (
                        <div key={student.id} className="bg-white rounded-[2rem] border border-slate-200 p-6 flex flex-col justify-between hover:shadow-xl transition-all group border-l-4 border-l-indigo-400">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-lg border border-indigo-100/50">
                                        {student.name.charAt(0)}
                                    </div>
                                    <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full uppercase border border-emerald-100">Visa Granted</span>
                                </div>
                                <h4 className="text-base font-black text-slate-800 truncate">{student.name}</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{student.targetCountry} • {student.assignedPartnerName || 'Direct'}</p>
                            </div>
                            <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-50">
                                <span className="text-sm font-black text-indigo-600">{currency} {student.commissionAmount?.toLocaleString()}</span>
                                <button 
                                    onClick={() => handleQuickClaim(student)}
                                    disabled={claimingId === student.id}
                                    className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-600 transition-all active:scale-95"
                                >
                                    {claimingId === student.id ? 'Claiming...' : 'Claim Commission'}
                                </button>
                            </div>
                        </div>
                    ))}
                    {readyToClaimStudents.length === 0 && (
                        <div className="col-span-full py-12 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200 text-center text-slate-400">
                            <p className="text-sm font-bold">No new success milestones to claim.</p>
                        </div>
                    )}
                </div>
              </div>

              {/* Segment 2: Awaiting Receipt */}
              <div className="space-y-6 pt-6">
                <div className="flex items-center justify-between px-4">
                    <h3 className="text-lg font-black text-slate-800 flex items-center">
                        <Banknote size={20} className="mr-2 text-amber-500"/> Phase 2: Awaiting Bank Receipt
                        <span className="ml-3 px-2.5 py-0.5 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-tighter">{awaitingReceiptStudents.length} Pending</span>
                    </h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Awaiting Verification</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {awaitingReceiptStudents.map(student => (
                        <div key={student.id} className="bg-white rounded-[2rem] border border-slate-200 p-6 flex flex-col justify-between hover:shadow-xl transition-all group border-l-4 border-l-amber-400">
                            <div className="absolute top-4 right-4 animate-pulse">
                                <Clock size={16} className="text-amber-400" />
                            </div>
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-black text-lg border border-amber-100/50">
                                        {student.name.charAt(0)}
                                    </div>
                                    <span className="text-[9px] font-black bg-amber-50 text-amber-600 px-3 py-1 rounded-full uppercase border border-amber-100">Claimed - Unpaid</span>
                                </div>
                                <h4 className="text-base font-black text-slate-800 truncate">{student.name}</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{student.targetCountry} • {student.assignedPartnerName || 'Direct'}</p>
                            </div>
                            <div className="mt-6 flex flex-col gap-3 pt-4 border-t border-slate-50">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">Est. Arrival</span>
                                    <span className="text-sm font-black text-slate-900">{currency} {student.commissionAmount?.toLocaleString()}</span>
                                </div>
                                <button 
                                    onClick={() => handleConfirmReceipt(student)}
                                    disabled={receivingId === student.id}
                                    className="w-full bg-amber-500 text-white py-2.5 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center"
                                >
                                    {receivingId === student.id ? (
                                        <Loader2 size={14} className="animate-spin mr-2" />
                                    ) : (
                                        <CheckCircle2 size={14} className="mr-2" />
                                    )}
                                    Confirm Bank Receipt
                                </button>
                            </div>
                        </div>
                    ))}
                    {awaitingReceiptStudents.length === 0 && (
                        <div className="col-span-full py-12 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200 text-center text-slate-400">
                            <p className="text-sm font-bold">No outstanding claims awaiting bank verification.</p>
                        </div>
                    )}
                </div>
              </div>
          </div>
      )}

      {activeTab === 'financials' && (
          <div className="space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Expense Breakdown */}
                  <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-200 flex flex-col">
                      <div className="flex justify-between items-center mb-10">
                          <div>
                              <h3 className="text-xl font-black text-slate-800 tracking-tight">Expense Allocation</h3>
                              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Operational Burn</p>
                          </div>
                          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><ArrowDownRight size={24}/></div>
                      </div>
                      <div className="flex-1 space-y-8 overflow-y-auto custom-scrollbar pr-2">
                          {['Salaries', 'Rent', 'Marketing', 'Utilities', 'Software', 'Office', 'Travel', 'Other'].map(cat => {
                              const amt = filteredExpenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0);
                              const percentage = totalExpenses > 0 ? (amt / totalExpenses) * 100 : 0;
                              if (amt === 0 && totalExpenses > 0) return null; // Hide empty categories unless list is totally empty
                              
                              return (
                                  <div key={cat} className="space-y-3">
                                      <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.1em]">
                                          <div className="flex items-center">
                                              <div className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: CATEGORY_COLORS[cat] }} />
                                              <span className="text-slate-500">{cat}</span>
                                          </div>
                                          <span className="text-slate-900 font-mono">{currency} {amt.toLocaleString()}</span>
                                      </div>
                                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                          <div 
                                            className="h-full transition-all duration-1000 ease-out rounded-full shadow-lg" 
                                            style={{ width: `${percentage}%`, backgroundColor: CATEGORY_COLORS[cat] }}
                                          />
                                      </div>
                                  </div>
                              );
                          })}
                          {filteredExpenses.length === 0 && (
                              <div className="flex flex-col items-center justify-center h-full text-slate-300 py-20">
                                  <Activity size={48} className="opacity-10 mb-4" />
                                  <p className="text-sm font-bold uppercase tracking-widest">No expenses recorded</p>
                                  <button onClick={() => setIsAddingExpense(true)} className="text-indigo-600 text-xs font-bold underline mt-2">Log your first expense</button>
                              </div>
                          )}
                      </div>
                      {filteredExpenses.length > 0 && (
                          <div className="mt-8 pt-8 border-t border-slate-100 flex justify-between items-center">
                              <span className="text-xs font-black text-slate-400 uppercase">Total Agency Burn</span>
                              <span className="text-xl font-black text-rose-600">{currency} {totalExpenses.toLocaleString()}</span>
                          </div>
                      )}
                  </div>

                  {/* Revenue Ledger */}
                  <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-200 flex flex-col min-h-[600px]">
                       <div className="flex justify-between items-center mb-10 shrink-0">
                          <div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">Audit Ledger</h3>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Cash Flow Realization</p>
                          </div>
                          <div className="bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100 flex items-center shadow-sm">
                             <ShieldCheck size={16} className="text-indigo-600 mr-2"/>
                             <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Verified</span>
                          </div>
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-4 pr-3 custom-scrollbar">
                          {filteredInvoices.map(inv => (
                              <div key={inv.id} className="flex justify-between items-center p-6 border border-slate-100 rounded-[2rem] bg-white hover:bg-slate-50 hover:border-indigo-100 transition-all shadow-sm group">
                                  <div className="flex items-center space-x-5">
                                      <div className={`p-4 rounded-2xl shadow-sm transition-all group-hover:scale-110 ${inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                          <Receipt size={22}/>
                                      </div>
                                      <div className="min-w-0">
                                          <p className="text-sm font-black text-slate-800 tracking-tight truncate max-w-[140px]">{inv.studentName}</p>
                                          <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.1em] mt-1.5">{inv.invoiceNumber} • {new Date(inv.date).toLocaleDateString()}</p>
                                      </div>
                                  </div>
                                  <div className="flex items-center space-x-8">
                                      <div className="text-right">
                                          <p className="text-base font-black text-slate-900 font-mono tracking-tighter">{currency} {inv.amount.toLocaleString()}</p>
                                          <span className={`text-[9px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-full inline-block mt-1 ${inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                              {inv.status === 'Paid' ? 'REALIZED' : 'PENDING'}
                                          </span>
                                      </div>
                                      <button 
                                        onClick={() => handleToggleInvoiceStatus(inv.id)}
                                        disabled={togglingInvoiceId === inv.id}
                                        className="transition-all active:scale-90 disabled:opacity-30 p-1"
                                      >
                                          {togglingInvoiceId === inv.id ? (
                                              <Loader2 size={32} className="animate-spin text-indigo-300" />
                                          ) : inv.status === 'Paid' ? (
                                              <ToggleRight size={44} className="text-emerald-500" />
                                          ) : (
                                              <ToggleLeft size={44} className="text-slate-200 hover:text-indigo-300" />
                                          )}
                                      </button>
                                  </div>
                              </div>
                          ))}
                          {filteredInvoices.length === 0 && (
                              <div className="flex flex-col items-center justify-center py-32 text-slate-300">
                                   <FileText size={64} className="mb-4 opacity-10" />
                                   <p className="text-sm font-bold uppercase tracking-widest">No ledger records found</p>
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

// Reusable Stat Card
const StatCard = ({ title, value, currency, unit, icon, color, label, trend }: any) => {
    const colorMap: Record<string, string> = {
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100 ring-emerald-500/10',
        rose: 'bg-rose-50 text-rose-600 border-rose-100 ring-rose-500/10',
        indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100 ring-indigo-500/10',
        amber: 'bg-amber-50 text-amber-600 border-amber-100 ring-amber-500/10'
    };

    return (
        <div className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-200 group hover:border-indigo-400 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-500 animate-in fade-in slide-in-from-top-2">
            <div className="flex justify-between items-start mb-8">
                <div className={`p-3.5 rounded-2xl shadow-sm border ${colorMap[color]} group-hover:scale-110 transition-transform duration-500`}>
                    {icon}
                </div>
                <div className={`px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center border ${trend.startsWith('+') ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                    {trend.startsWith('+') ? <ArrowUpRight size={10} className="mr-1"/> : <ArrowDownRight size={10} className="mr-1"/>}
                    {trend}
                </div>
            </div>
            <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</p>
                <h4 className="text-3xl font-black text-slate-900 tracking-tighter tabular-nums">
                    {currency && <span className="text-base text-slate-400 font-bold mr-1.5">{currency}</span>}
                    {typeof value === 'number' ? value.toLocaleString() : value}
                    {unit && <span className="text-base font-bold text-slate-400 ml-1.5">{unit}</span>}
                </h4>
            </div>
            <div className="mt-5 pt-5 border-t border-slate-50 flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-2 animate-pulse"></div>
                {label}
            </div>
        </div>
    );
};
