
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { fetchStudents, saveStudents, fetchTasks, saveTasks, fetchPartners, fetchSettings } from '../../services/storageService';
import { Student, ApplicationStatus, NocStatus, Country, Task, Partner, NocMetadata, UserRole, AgencySettings } from '../../types';
import { UNIVERSAL_DOCS, COUNTRY_SPECIFIC_DOCS } from '../../constants';
import { generateGoogleCalendarLink, generateWhatsAppLink } from '../../services/communicationService';
// Added Users icon to the lucide-react imports
import { Search, Clock, AlertCircle, Filter, Trash2, Phone, Mail, DollarSign, CheckCircle2, Lock, X, Plus, Calendar, Loader2, CalendarPlus, Save, Check, ExternalLink, Bell, BellRing, BellOff, Trophy, Sparkles, MessageCircle, PhoneCall, Building, GraduationCap, ArrowRight, ClipboardCheck, FileText, Landmark, User, Users, Hash, Globe, ChevronRight, ListTodo, CircleCheck, Info, CalendarDays, PartyPopper, Ban, ArrowLeftRight, HelpCircle, Network, TrendingUp, Zap } from 'lucide-react';
import { runStatusAutomation } from '../../services/workflowService';
import { supabase, isSupabaseConfigured } from '../../services/supabaseClient';
import { getCurrentUser } from '../../services/authService';

interface OperationsProps {
  onTabChange?: (tab: string) => void;
}

export const Operations: React.FC<OperationsProps> = ({ onTabChange }) => {
  const [activeTab, setActiveTab] = useState<'kanban' | 'noc' | 'schedule'>('kanban');
  const [isTaskModalOpen, setTaskModalOpen] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [plannerDay, setPlannerDay] = useState<string>('Monday');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
        setLoading(true);
        const [s, t] = await Promise.all([fetchStudents(), fetchTasks()]);
        setStudents(s);
        setTasks(t);
        setLoading(false);
    };
    load();
    
    const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const todayIdx = new Date().getDay(); 
    const adjustedIdx = todayIdx === 0 ? 6 : todayIdx - 1;
    setPlannerDay(DAYS[adjustedIdx]);
  }, []);

  const stats = useMemo(() => {
      const active = students.filter(s => s.status !== ApplicationStatus.Discontinued && s.status !== ApplicationStatus.Alumni);
      const pendingNoc = students.filter(s => s.nocStatus === NocStatus.NotApplied && s.status !== ApplicationStatus.Lead).length;
      const visaSuccess = students.filter(s => s.status === ApplicationStatus.VisaGranted).length;
      return { active: active.length, pendingNoc, visaSuccess };
  }, [students]);

  const handleCreateTask = (newTask: Task) => {
      const updated = [newTask, ...tasks];
      setTasks(updated);
      saveTasks(updated);
      setTaskModalOpen(false);
  };

  const handleToggleTask = (taskId: string) => {
      const updated = tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
      setTasks(updated);
      saveTasks(updated);
  };

  const handleDeleteTask = (taskId: string) => {
      const updated = tasks.filter(t => t.id !== taskId);
      setTasks(updated);
      saveTasks(updated);
  };

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;

  return (
    <div className="h-full flex flex-col relative p-6 bg-slate-50 overflow-hidden">
      
      {/* KPI RIBBON - Executive Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4 group hover:border-indigo-300 transition-all">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all"><Users size={20}/></div>
              <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Pipeline</p>
                  <p className="text-xl font-black text-slate-800">{stats.active} Students</p>
              </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4 group hover:border-amber-300 transition-all">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-all"><ClipboardCheck size={20}/></div>
              <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending NOCs</p>
                  <p className="text-xl font-black text-slate-800">{stats.pendingNoc} Required</p>
              </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4 group hover:border-emerald-300 transition-all">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-all"><Trophy size={20}/></div>
              <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Visa Success</p>
                  <p className="text-xl font-black text-slate-800">{stats.visaSuccess} Granted</p>
              </div>
          </div>
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-xl flex items-center space-x-4 group hover:bg-indigo-950 transition-all">
              <div className="p-3 bg-indigo-500 text-white rounded-xl"><Zap size={20}/></div>
              <div className="flex-1">
                  <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Quick Action</p>
                  <button onClick={() => setTaskModalOpen(true)} className="text-sm font-bold text-white flex items-center">Record New Task <ChevronRight size={14} className="ml-1"/></button>
              </div>
          </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 shrink-0">
        <div className="flex space-x-1 bg-slate-200/50 p-1 rounded-xl w-full sm:w-fit">
            {[
                { id: 'kanban', label: 'Workflows', icon: LayoutDashboard },
                { id: 'noc', label: 'NOC Portal', icon: ClipboardCheck },
                { id: 'schedule', label: 'Weekly Plan', icon: CalendarDays }
            ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all flex items-center space-x-2 ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  <tab.icon size={14}/>
                  <span>{tab.label}</span>
                </button>
            ))}
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        {activeTab === 'kanban' && <KanbanBoard onTabChange={onTabChange} students={students} setStudents={setStudents} />}
        {activeTab === 'noc' && <NocTracker students={students} setStudents={setStudents} />}
        {activeTab === 'schedule' && (
            <WeeklyPlanner 
                tasks={tasks}
                loading={false}
                selectedDay={plannerDay}
                onDayChange={setPlannerDay}
                onToggle={handleToggleTask}
                onDelete={handleDeleteTask}
                onCreate={handleCreateTask}
            />
        )}
      </div>

      {isTaskModalOpen && <AddTaskModal onClose={() => setTaskModalOpen(false)} onAdd={handleCreateTask} defaultDay={plannerDay} />}
    </div>
  );
};

const LayoutDashboard = ({ size, className }: { size?: number, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
);

const KanbanBoard = ({ onTabChange, students, setStudents }: any) => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [settings, setSettings] = useState<AgencySettings | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState<Country | 'All'>('All');
  const [branchFilter, setBranchFilter] = useState<string>('All');
  const [draggedStudentId, setDraggedStudentId] = useState<string | null>(null);
  const [visaSuccessStudent, setVisaSuccessStudent] = useState<Student | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('Viewer');
  const [partnerRequest, setPartnerRequest] = useState<{ studentId: string, targetStatus: ApplicationStatus } | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [pendingMove, setPendingMove] = useState<{ studentId: string, newStatus: ApplicationStatus } | null>(null);

  useEffect(() => {
    const load = async () => {
        const user = getCurrentUser();
        setUserRole(user?.role || 'Viewer');
        if (user?.role === 'Counsellor' && user.branchId) setBranchFilter(user.branchId);
        const [pData, set] = await Promise.all([fetchPartners(), fetchSettings()]);
        setPartners(pData);
        setSettings(set);
    };
    load();
  }, []);

  const moveStudent = async (studentId: string, newStatus: ApplicationStatus, overridePartnerId?: string) => {
    const student = students.find((s: Student) => s.id === studentId);
    if (!student) return;
    setPendingMove(null);

    if (!overridePartnerId && !student.assignedPartnerId && (newStatus === ApplicationStatus.Applied || newStatus === ApplicationStatus.VisaGranted)) {
        setPartnerRequest({ studentId, targetStatus: newStatus });
        return;
    }

    let updatedStudent = { ...student, status: newStatus };
    if (newStatus === ApplicationStatus.VisaGranted) updatedStudent.commissionStatus = 'Pending';

    if (overridePartnerId) {
        const partner = partners.find(p => p.id === overridePartnerId);
        if (partner) {
            updatedStudent.assignedPartnerId = partner.id;
            updatedStudent.assignedPartnerName = partner.name;
            if (student.annualTuition) updatedStudent.commissionAmount = (student.annualTuition * partner.commissionRate) / 100;
        }
    }

    if (isSupabaseConfigured) {
        await supabase.from('students').update({ 
            status: updatedStudent.status, 
            data: updatedStudent 
        }).eq('id', studentId);
    }

    const updatedStudents = students.map((s: Student) => s.id === studentId ? updatedStudent : s);
    await saveStudents(updatedStudents);
    setStudents(updatedStudents); 
    await runStatusAutomation(updatedStudent, newStatus);
    if (newStatus === ApplicationStatus.VisaGranted) setVisaSuccessStudent(updatedStudent);
    setPartnerRequest(null);
    setSelectedPartnerId('');
  };

  const handleDrop = (e: React.DragEvent, status: ApplicationStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (id) {
      const student = students.find((s: Student) => s.id === id);
      if (student && student.status !== status) setPendingMove({ studentId: id, newStatus: status });
      setDraggedStudentId(null);
    }
  };

  const filteredStudents = useMemo(() => students.filter((s: Student) => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCountry = countryFilter === 'All' || s.targetCountry === countryFilter;
    const matchesBranch = branchFilter === 'All' || (s.branchId || 'main') === branchFilter;
    return matchesSearch && matchesCountry && matchesBranch;
  }), [students, searchTerm, countryFilter, branchFilter]);

  const columns = Object.values(ApplicationStatus);

  return (
    <div className="h-full flex flex-col relative animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 px-1 gap-4">
        <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-xl p-1 overflow-x-auto w-full md:w-auto">
            {userRole === 'Owner' && (
                <div className="flex items-center px-3 border-r border-slate-200 mr-2 shrink-0">
                    <Network size={14} className="text-indigo-600 mr-2"/>
                    <select className="text-[10px] font-black uppercase tracking-widest text-slate-700 bg-transparent outline-none cursor-pointer" value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
                        <option value="All">All Offices</option>
                        <option value="main">Head Office</option>
                        {(settings?.branches || []).filter(b => b.id !== 'main').map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                </div>
            )}
            <Filter size={14} className="ml-2 text-slate-400 shrink-0"/>
            {['All', ...Object.values(Country)].map((c) => (
                <button key={c} onClick={() => setCountryFilter(c as any)} className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap ${countryFilter === c ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-slate-500 hover:bg-slate-50'}`}>{c}</button>
            ))}
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
          <input type="text" placeholder="Search applicant workflow..." className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <div className="flex space-x-5 h-full min-w-max px-1">
          {columns.map(status => {
            const colStudents = filteredStudents.filter((s: Student) => s.status === status);
            return (
            <div key={status} className={`w-80 flex flex-col rounded-[2rem] border transition-all duration-300 ${draggedStudentId ? 'bg-indigo-50/50 border-indigo-200 border-dashed scale-[0.98]' : 'bg-slate-200/50 border-transparent'}`} onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, status)}>
              <div className="p-5 flex justify-between items-center shrink-0">
                <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                    <span className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-600">{status}</span>
                </div>
                <span className="bg-white px-2.5 py-0.5 rounded-lg text-[10px] font-black text-slate-400 border border-slate-200 shadow-sm">{colStudents.length}</span>
              </div>
              <div className="flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar">
                {colStudents.map((student: any) => (
                  <div key={student.id} draggable onDragStart={(e) => { setDraggedStudentId(student.id); e.dataTransfer.setData('text/plain', student.id); }} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 group hover:border-indigo-400 hover:shadow-xl transition-all cursor-grab active:cursor-grabbing">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex flex-col">
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-black bg-indigo-50 text-indigo-600 uppercase w-fit tracking-tighter">{student.targetCountry}</span>
                      </div>
                      <div className="flex -space-x-2">
                         {student.testType !== 'None' && <div className="h-6 w-6 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center text-[8px] font-black text-white" title={`English: ${student.testType}`}>E</div>}
                         <div className="h-6 w-6 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center text-[8px] font-black text-white" title="Branch Assignment">{student.branchId === 'main' ? 'H' : 'B'}</div>
                      </div>
                    </div>
                    <h4 className="font-black text-slate-800 text-sm tracking-tight truncate">{student.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-1 font-medium truncate">{student.assignedPartnerName || 'Unassigned University'}</p>
                    <div className="mt-4 flex justify-between items-center">
                        <div className="flex items-center space-x-1.5">
                            <Clock size={12} className="text-slate-300"/>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">{Math.floor((Date.now() - student.createdAt) / 86400000)}d in queue</span>
                        </div>
                        <div className={`h-1.5 w-1.5 rounded-full ${student.nocStatus === NocStatus.Issued ? 'bg-emerald-500' : 'bg-rose-400'}`} title={`NOC: ${student.nocStatus}`}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            );
          })}
        </div>
      </div>

      {pendingMove && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
              <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
                  <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                      <h3 className="font-bold text-xl text-slate-800 flex items-center"><HelpCircle size={22} className="mr-3 text-indigo-600"/> Confirm Status Move</h3>
                      <button onClick={() => setPendingMove(null)} className="text-slate-400 hover:text-slate-900"><X size={20}/></button>
                  </div>
                  <div className="p-8 space-y-6 text-center">
                      <p className="text-sm text-slate-500">Relocate applicant to <strong>{pendingMove.newStatus}</strong>?</p>
                      <div className="flex items-center justify-center space-x-6 py-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <p className="text-xs font-bold text-slate-700">{students.find((s: Student) => s.id === pendingMove.studentId)?.name}</p>
                      </div>
                      <div className="flex gap-3">
                          <button onClick={() => setPendingMove(null)} className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100">Cancel</button>
                          <button onClick={() => moveStudent(pendingMove.studentId, pendingMove.newStatus)} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-700">Confirm Move</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {partnerRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
             <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                 <h3 className="font-bold text-slate-800 flex items-center"><Building size={20} className="mr-2 text-indigo-600"/> Assign Partner</h3>
                 <button onClick={() => setPartnerRequest(null)}><X size={20} className="text-slate-400"/></button>
             </div>
             <div className="p-8 space-y-6">
                 <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-start space-x-3 text-xs text-amber-800 font-medium">
                     <AlertCircle size={20} className="text-amber-500 shrink-0 mt-0.5"/>
                     <p>To track revenue, you must select a University or Aggregator portal before finalizing this move.</p>
                 </div>
                 <select className="w-full p-4 border border-slate-200 rounded-xl text-sm font-bold bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none" value={selectedPartnerId} onChange={(e) => setSelectedPartnerId(e.target.value)}>
                     <option value="">-- Choose Partner --</option>
                     {partners.map(p => <option key={p.id} value={p.id}>{p.name} ({p.commissionRate}%)</option>)}
                 </select>
                 <button disabled={!selectedPartnerId} onClick={() => moveStudent(partnerRequest.studentId, partnerRequest.targetStatus, selectedPartnerId)} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold flex items-center justify-center space-x-2 shadow-lg hover:bg-indigo-600 disabled:opacity-50 transition-all">
                    <span>Finalize Status Move</span>
                    <ArrowRight size={18}/>
                 </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const WeeklyPlanner = ({ tasks, selectedDay, onDayChange, onToggle, onDelete, onCreate }: any) => {
    const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const dayTasks = tasks.filter((t: any) => t.day === selectedDay);
    const pendingTasks = dayTasks.filter((t: any) => !t.completed).sort((a: any, b: any) => a.dueTime.localeCompare(b.dueTime));
    const completedTasks = dayTasks.filter((t: any) => t.completed);

    return (
        <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2 flex space-x-1 overflow-x-auto scrollbar-hide shrink-0">
                {DAYS.map(d => {
                    const dayTasksCount = tasks.filter((t: any) => t.day === d && !t.completed).length;
                    return (
                        <button key={d} onClick={() => onDayChange(d)} className={`flex-1 min-w-[100px] py-3 rounded-xl transition-all relative group ${selectedDay === d ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'hover:bg-slate-50 text-slate-500'}`}>
                            <span className="text-[10px] font-black uppercase tracking-widest">{d.substring(0, 3)}</span>
                            {dayTasksCount > 0 && <span className={`absolute top-2 right-2 w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center border-2 ${selectedDay === d ? 'bg-white text-indigo-600 border-indigo-500' : 'bg-rose-500 text-white border-white'}`}>{dayTasksCount}</span>}
                        </button>
                    );
                })}
            </div>
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-0">
                <div className="lg:col-span-2 flex flex-col min-h-0 space-y-4">
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                        {pendingTasks.map((t: any) => (
                            <div key={t.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-400 transition-all group flex items-start space-x-4">
                                <button onClick={() => onToggle(t.id)} className="mt-1 w-6 h-6 rounded-lg border-2 border-slate-200 flex items-center justify-center hover:border-indigo-50 transition-all shrink-0">
                                    <div className="w-2 h-2 bg-indigo-500 rounded-sm opacity-0 group-hover:opacity-20"></div>
                                </button>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-3 mb-1">
                                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${t.priority === 'High' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>{t.priority} Priority</span>
                                        <span className="text-[10px] font-bold text-slate-400 flex items-center"><Clock size={10} className="mr-1"/> {t.dueTime}</span>
                                    </div>
                                    <p className="text-slate-800 font-bold leading-relaxed">{t.text}</p>
                                </div>
                                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-all">
                                    <button onClick={() => window.open(generateGoogleCalendarLink(t), '_blank')} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><CalendarPlus size={18}/></button>
                                    <button onClick={() => onDelete(t.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={18}/></button>
                                </div>
                            </div>
                        ))}
                        {pendingTasks.length === 0 && <div className="h-48 flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-100 text-slate-300"><CircleCheck size={48} className="mb-3 opacity-10"/><p className="font-bold">No items for {selectedDay}</p></div>}
                    </div>
                </div>
                <div className="flex flex-col min-h-0 space-y-6">
                    <div className="bg-indigo-600 rounded-[2rem] p-6 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Completion Rate</p>
                        <h3 className="text-3xl font-black">{dayTasks.length > 0 ? Math.round((completedTasks.length / dayTasks.length) * 100) : 0}%</h3>
                        <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden"><div className="h-full bg-white transition-all duration-1000" style={{ width: `${dayTasks.length > 0 ? (completedTasks.length / dayTasks.length) * 100 : 0}%` }}></div></div>
                        <Sparkles className="absolute -bottom-4 -right-4 text-white/10" size={120}/>
                    </div>
                    <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center space-x-2"><CircleCheck className="text-emerald-500" size={18}/><h3 className="font-bold text-slate-800 text-sm">Recently Completed</h3></div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                            {completedTasks.map((t: any) => (
                                <div key={t.id} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between group">
                                    <div className="flex items-center space-x-3 min-w-0">
                                        <button onClick={() => onToggle(t.id)} className="w-5 h-5 bg-emerald-500 text-white rounded-md flex items-center justify-center"><Check size={14}/></button>
                                        <span className="text-xs font-medium text-slate-400 line-through truncate">{t.text}</span>
                                    </div>
                                    <button onClick={() => onDelete(t.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-rose-500"><X size={14}/></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AddTaskModal = ({ onClose, onAdd, defaultDay }: any) => {
    const [text, setText] = useState('');
    const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
    const [time, setTime] = useState('10:00');
    const [day, setDay] = useState(defaultDay);
    const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const handleSave = () => {
        if (!text.trim()) return;
        onAdd({ id: Date.now().toString(), text: text.trim(), completed: false, priority, dueTime: time, createdAt: Date.now(), day });
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
                <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                    <h3 className="font-bold text-xl text-slate-800 flex items-center"><Plus size={22} className="mr-3 text-indigo-600"/> Create Schedule Task</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-900 bg-white p-2 rounded-xl shadow-sm border border-slate-100 transition-all active:scale-90"><X size={20}/></button>
                </div>
                <div className="p-8 space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Task Content *</label>
                        <textarea autoFocus className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm min-h-[100px] outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all font-bold" placeholder="Follow up with Flinders University regarding offer letter..." value={text} onChange={e => setText(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Assign Day</label>
                            <select className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold bg-white" value={day} onChange={e => setDay(e.target.value)}>
                                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Time</label>
                            <input type="time" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={time} onChange={e => setTime(e.target.value)} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Priority</label>
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            {(['Low', 'Medium', 'High'] as const).map(p => (
                                <button key={p} onClick={() => setPriority(p)} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${priority === p ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>{p}</button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="p-8 border-t border-slate-50 bg-slate-50/30 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-3 rounded-2xl font-bold text-slate-400 text-sm">Discard</button>
                    <button onClick={handleSave} disabled={!text.trim()} className="bg-slate-900 text-white px-10 py-3 rounded-2xl font-bold shadow-xl hover:bg-indigo-600 transition-all active:scale-95 text-sm flex items-center">Save Task</button>
                </div>
            </div>
        </div>
    );
};

const NocTracker = ({ students, setStudents }: any) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [editingNoc, setEditingNoc] = useState<Student | null>(null);
    const [nocData, setNocData] = useState<Partial<Student & { nocDetails: NocMetadata }>>({});

    const handleUpdateNoc = async () => {
        if (!editingNoc) return;
        const updatedStudent = { ...editingNoc, nocStatus: nocData.nocStatus || editingNoc.nocStatus, nocDetails: { ...(editingNoc.nocDetails || {}), ...(nocData.nocDetails || {}) } } as Student;
        const updatedList = students.map((s: Student) => s.id === updatedStudent.id ? updatedStudent : s);
        setStudents(updatedList);
        await saveStudents(updatedList);
        setEditingNoc(null);
    };

    const filteredStudents = students.filter((s: Student) => s.name.toLowerCase().includes(searchTerm.toLowerCase()) && (s.status !== ApplicationStatus.Lead || s.nocStatus === NocStatus.NotApplied));

    return (
        <div className="h-full flex flex-col bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm animate-in fade-in duration-500">
            <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center shrink-0">
                <div className="flex items-center space-x-3">
                    <div className="p-3 bg-indigo-600 text-white rounded-2xl"><ClipboardCheck size={20}/></div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">MoEST NOC Workflow</h2>
                </div>
                <div className="relative w-80">
                    <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
                    <input placeholder="Filter NOC applicants..." className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
            </div>
            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 sticky top-0">
                        <tr>
                            <th className="px-8 py-4">Applicant Detail</th>
                            <th className="px-8 py-4">Passport / NOC Info</th>
                            <th className="px-8 py-4">Status</th>
                            <th className="px-8 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredStudents.map((student: Student) => (
                            <tr key={student.id} className="hover:bg-indigo-50/20 transition-colors">
                                <td className="px-8 py-5">
                                    <p className="font-bold text-slate-800 text-sm">{student.name}</p>
                                    <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest mt-1">{student.targetCountry}</p>
                                </td>
                                <td className="px-8 py-5">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-mono text-slate-500">P: {student.passportNumber || 'PASSPORT PENDING'}</p>
                                        {student.nocDetails?.nocNumber && <p className="text-[10px] font-black text-emerald-600 uppercase">ID: {student.nocDetails.nocNumber}</p>}
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border tracking-widest shadow-sm ${student.nocStatus === NocStatus.Issued ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>{student.nocStatus}</span>
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <button onClick={() => { setEditingNoc(student); setNocData({ nocStatus: student.nocStatus, nocDetails: student.nocDetails || {} }); }} className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-indigo-600 transition-all"><Plus size={18}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {editingNoc && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
                        <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center text-slate-800">
                            <h3 className="font-bold text-xl">NOC Intake Record</h3>
                            <button onClick={() => setEditingNoc(null)}><X size={24}/></button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Process Stage</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.values(NocStatus).map(stage => (
                                        <button key={stage} onClick={() => setNocData({ ...nocData, nocStatus: stage })} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${nocData.nocStatus === stage ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-indigo-200'}`}>{stage}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Application Date</label><input type="date" className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 text-xs font-bold" value={nocData.nocDetails?.appliedDate ? new Date(nocData.nocDetails.appliedDate).toISOString().split('T')[0] : ''} onChange={e => setNocData({ ...nocData, nocDetails: { ...nocData.nocDetails, appliedDate: new Date(e.target.value).getTime() } })} /></div>
                                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Issued NOC ID</label><input className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 text-xs font-black uppercase" placeholder="Enter NOC ID" value={nocData.nocDetails?.nocNumber || ''} onChange={e => setNocData({ ...nocData, nocDetails: { ...nocData.nocDetails, nocNumber: e.target.value } })} /></div>
                            </div>
                            <button onClick={handleUpdateNoc} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-600 transition-all">Update Registry</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
