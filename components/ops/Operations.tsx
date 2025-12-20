
import React, { useState, useEffect, useRef } from 'react';
import { fetchStudents, saveStudents, fetchTasks, saveTasks, fetchPartners } from '../../services/storageService';
import { Student, ApplicationStatus, NocStatus, Country, Task, Partner, NocMetadata } from '../../types';
import { UNIVERSAL_DOCS, COUNTRY_SPECIFIC_DOCS } from '../../constants';
import { generateGoogleCalendarLink, generateWhatsAppLink } from '../../services/communicationService';
import { Search, Clock, AlertCircle, Filter, Trash2, Phone, Mail, DollarSign, CheckCircle2, Lock, X, Plus, Calendar, Loader2, CalendarPlus, Save, Check, ExternalLink, Bell, BellRing, BellOff, Trophy, Sparkles, MessageCircle, PhoneCall, Building, GraduationCap, ArrowRight, ClipboardCheck, FileText, Landmark, User, Hash, Globe, ChevronRight, ListTodo, CircleCheck, Info, CalendarDays, PartyPopper } from 'lucide-react';
import { runStatusAutomation } from '../../services/workflowService';
import { supabase, isSupabaseConfigured } from '../../services/supabaseClient';

interface OperationsProps {
  onTabChange?: (tab: string) => void;
}

export const Operations: React.FC<OperationsProps> = ({ onTabChange }) => {
  const [activeTab, setActiveTab] = useState<'kanban' | 'noc' | 'schedule'>('kanban');
  const [isTaskModalOpen, setTaskModalOpen] = useState(false);
  
  const [plannerDay, setPlannerDay] = useState<string>('Monday');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  const [permission, setPermission] = useState<NotificationPermission>('default');
  const notifiedTasksRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const todayIdx = new Date().getDay(); 
    const adjustedIdx = todayIdx === 0 ? 6 : todayIdx - 1;
    setPlannerDay(DAYS[adjustedIdx]);
  }, []);

  useEffect(() => {
      const load = async () => {
          setLoadingTasks(true);
          const loaded = await fetchTasks();
          const migrated = loaded.map(t => t.day ? t : { ...t, day: 'Monday' });
          setTasks(migrated);
          setLoadingTasks(false);
      };
      load();
  }, []);

  useEffect(() => {
      if ('Notification' in window) {
          setPermission(Notification.permission);
      }
  }, []);

  useEffect(() => {
      if (permission !== 'granted') return;

      const checkUpcomingTasks = () => {
          const now = new Date();
          const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const currentDayName = DAYS[now.getDay()];

          tasks.forEach(task => {
              if (task.completed || task.day !== currentDayName || !task.dueTime) return;
              if (notifiedTasksRef.current.has(task.id)) return;

              const [hours, minutes] = task.dueTime.split(':').map(Number);
              const taskTime = new Date(now);
              taskTime.setHours(hours, minutes, 0, 0);

              const diffMs = taskTime.getTime() - now.getTime();
              const diffMins = diffMs / (1000 * 60);

              if (diffMins <= 15 && diffMins > -1) {
                  new Notification(`Upcoming Task: ${task.text}`, {
                      body: `Due at ${task.dueTime} (${task.priority} Priority)`,
                  });
                  notifiedTasksRef.current.add(task.id);
              }
          });
      };

      checkUpcomingTasks();
      const intervalId = setInterval(checkUpcomingTasks, 60000);
      return () => clearInterval(intervalId);
  }, [tasks, permission]);

  const requestNotificationPermission = async () => {
      if (!('Notification' in window)) return;
      const p = await Notification.requestPermission();
      setPermission(p);
  };

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

  return (
    <div className="h-full flex flex-col relative">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg w-full sm:w-fit overflow-x-auto">
            <button 
              onClick={() => setActiveTab('kanban')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap flex items-center space-x-2 ${activeTab === 'kanban' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <LayoutDashboard size={16}/>
              <span>Kanban Board</span>
            </button>
            <button 
              onClick={() => setActiveTab('noc')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap flex items-center space-x-2 ${activeTab === 'noc' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <ClipboardCheck size={16}/>
              <span>NOC Tracker</span>
            </button>
            <button 
              onClick={() => setActiveTab('schedule')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap flex items-center space-x-2 ${activeTab === 'schedule' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <CalendarDays size={16}/>
              <span>Weekly Planner</span>
            </button>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
            {activeTab === 'schedule' && (
                <button
                    onClick={requestNotificationPermission}
                    className={`p-2.5 rounded-lg transition-colors border ${
                        permission === 'granted' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
                    }`}
                >
                    {permission === 'granted' ? <BellRing size={18} /> : <BellOff size={18} />}
                </button>
            )}
            <button onClick={() => setTaskModalOpen(true)} className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg shadow-md hover:bg-indigo-700 transition-colors font-bold text-sm">
                <Plus size={18} />
                <span>New Task</span>
            </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        {activeTab === 'kanban' && <KanbanBoard onTabChange={onTabChange} />}
        {activeTab === 'noc' && <NocTracker />}
        {activeTab === 'schedule' && (
            <WeeklyPlanner 
                tasks={tasks}
                loading={loadingTasks}
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

const KanbanBoard: React.FC<OperationsProps> = ({ onTabChange }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState<Country | 'All'>('All');
  const [draggedStudentId, setDraggedStudentId] = useState<string | null>(null);
  const [visaSuccessStudent, setVisaSuccessStudent] = useState<Student | null>(null);
  
  // Validation State for Partners
  const [partnerRequest, setPartnerRequest] = useState<{ studentId: string, targetStatus: ApplicationStatus } | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');

  useEffect(() => {
    const load = async () => {
        setLoading(true);
        const [sData, pData] = await Promise.all([fetchStudents(), fetchPartners()]);
        setStudents(sData);
        setPartners(pData);
        setLoading(false);
    };
    load();
  }, []);

  const moveStudent = async (studentId: string, newStatus: ApplicationStatus, overridePartnerId?: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    // RULE: Must have assigned partner for Applied or Visa Granted
    if (!overridePartnerId && !student.assignedPartnerId && (newStatus === ApplicationStatus.Applied || newStatus === ApplicationStatus.VisaGranted)) {
        setPartnerRequest({ studentId, targetStatus: newStatus });
        return;
    }

    let updatedStudent = { ...student, status: newStatus };
    
    // FORCE UPDATE: Set commissionStatus to Pending if moved to Visa Granted
    if (newStatus === ApplicationStatus.VisaGranted) {
        updatedStudent.commissionStatus = 'Pending';
    }

    // Apply Partner if overridden via modal
    if (overridePartnerId) {
        const partner = partners.find(p => p.id === overridePartnerId);
        if (partner) {
            updatedStudent.assignedPartnerId = partner.id;
            updatedStudent.assignedPartnerName = partner.name;
            // Recalculate commission if tuition exists
            if (student.annualTuition) {
                updatedStudent.commissionAmount = (student.annualTuition * partner.commissionRate) / 100;
            }
        }
    }

    // DB MAPPING (SNAKE_CASE)
    const updates = {
        name: updatedStudent.name,
        email: updatedStudent.email,
        phone: updatedStudent.phone,
        target_country: updatedStudent.targetCountry,
        status: updatedStudent.status,
        noc_status: updatedStudent.nocStatus,
        branch_id: updatedStudent.branchId || 'main',
        data: updatedStudent, 
    };

    // PERSIST
    if (isSupabaseConfigured) {
        await supabase.from('students').update(updates).eq('id', studentId);
    }

    const updatedStudents = students.map(s => s.id === studentId ? updatedStudent : s);
    
    // This is critical: Await the save to local storage
    await saveStudents(updatedStudents);
    
    // Update local React UI
    setStudents(updatedStudents); 
    
    // Trigger automations
    await runStatusAutomation(updatedStudent, newStatus);

    // Trigger Success Modal if dropped in Visa Granted
    if (newStatus === ApplicationStatus.VisaGranted) {
      setVisaSuccessStudent(updatedStudent);
    }
    
    setPartnerRequest(null);
    setSelectedPartnerId('');
  };

  const handleDrop = (e: React.DragEvent, status: ApplicationStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (id) {
      moveStudent(id, status);
      setDraggedStudentId(null);
    }
  };

  const handleClaimCommission = () => {
    if (!visaSuccessStudent) return;
    localStorage.setItem('sag_auto_invoice_student', JSON.stringify(visaSuccessStudent));
    if (onTabChange) onTabChange('analytics');
    setVisaSuccessStudent(null);
  };

  const columns = Object.values(ApplicationStatus);
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCountry = countryFilter === 'All' || s.targetCountry === countryFilter;
    return matchesSearch && matchesCountry;
  });

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;

  const getColumnHeaderStyles = (status: ApplicationStatus) => {
      switch(status) {
          case ApplicationStatus.VisaGranted: return 'bg-emerald-50 text-emerald-900';
          case ApplicationStatus.Alumni: return 'bg-slate-900 text-white';
          case ApplicationStatus.VisaRejected: return 'bg-rose-50 text-rose-900';
          default: return 'bg-slate-100 text-slate-700';
      }
  };

  const getColumnIcon = (status: ApplicationStatus) => {
      switch(status) {
          case ApplicationStatus.Alumni: return <PartyPopper size={16} className="text-amber-400" />;
          default: return null;
      }
  };

  return (
    <div className="h-full flex flex-col relative">
      {/* Kanban Filter Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 px-1 gap-4">
        <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-lg p-1 overflow-x-auto">
            <Filter size={14} className="ml-2 text-slate-400 shrink-0"/>
            {['All', ...Object.values(Country)].map((c) => (
                <button
                    key={c}
                    onClick={() => setCountryFilter(c as any)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${countryFilter === c ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                    {c}
                </button>
            ))}
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search students..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-2">
        <div className="flex space-x-4 h-full min-w-max">
          {columns.map(status => {
            const colStudents = filteredStudents.filter(s => s.status === status);
            return (
            <div 
              key={status} 
              className={`w-80 flex flex-col rounded-xl border transition-all duration-200 ${draggedStudentId ? 'bg-slate-50/50 border-indigo-200 border-dashed' : 'bg-slate-100 border-slate-200'}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, status)}
            >
              <div className={`p-3 border-b border-slate-200/60 font-semibold text-sm flex justify-between items-center rounded-t-xl ${getColumnHeaderStyles(status)}`}>
                <div className="flex items-center space-x-2">
                    {getColumnIcon(status)}
                    <span>{status}</span>
                </div>
                <span className={`${status === ApplicationStatus.Alumni ? 'bg-slate-800 text-white border-slate-700' : 'bg-white text-slate-600 border-slate-100'} px-2 py-0.5 rounded-full text-xs font-bold shadow-sm border`}>{colStudents.length}</span>
              </div>

              <div className="flex-1 p-2 space-y-3 overflow-y-auto">
                {colStudents.map(student => (
                  <div 
                    key={student.id} 
                    draggable
                    onDragStart={(e) => {
                        setDraggedStudentId(student.id);
                        e.dataTransfer.setData('text/plain', student.id);
                    }}
                    className={`bg-white p-4 rounded-lg shadow-sm border border-slate-200 group hover:border-indigo-300 transition-all cursor-move`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600 uppercase">{student.targetCountry}</span>
                      <div className="p-1 text-slate-300 hover:text-indigo-500 transition-colors">
                        <Building size={14} />
                      </div>
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm">{student.name}</h4>
                    {student.assignedPartnerName ? (
                        <p className="text-[10px] text-indigo-600 font-bold mt-1 uppercase flex items-center">
                            <GraduationCap size={10} className="mr-1"/> {student.assignedPartnerName}
                        </p>
                    ) : (
                        <p className="text-[10px] text-slate-400 mt-1 italic">No partner assigned</p>
                    )}
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">{student.email}</p>
                    {status === ApplicationStatus.Alumni && (
                        <div className="mt-3 pt-3 border-t border-slate-50">
                            <button className="w-full py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center">
                                <MessageCircle size={10} className="mr-1"/> Get Testimonial
                            </button>
                        </div>
                    )}
                  </div>
                ))}
                {colStudents.length === 0 && (
                    <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-xs bg-slate-50/50">
                        <p>No Students</p>
                        <p className="opacity-50 mt-1">Drag items here</p>
                    </div>
                )}
              </div>
            </div>
            );
          })}
        </div>
      </div>

      {/* Partner Assignment Modal (Intercept) */}
      {partnerRequest && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
             <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                 <h3 className="font-bold text-slate-800 flex items-center"><Building size={20} className="mr-2 text-indigo-600"/> Select Partner</h3>
                 <button onClick={() => setPartnerRequest(null)}><X size={20} className="text-slate-400"/></button>
             </div>
             <div className="p-8 space-y-4">
                 <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-start space-x-3">
                     <AlertCircle size={20} className="text-amber-500 shrink-0 mt-0.5"/>
                     <p className="text-xs text-amber-800 font-medium leading-relaxed">
                        To track commissions accurately, you must assign a <strong>University or Aggregator</strong> before moving this student to <em>{partnerRequest.targetStatus}</em>.
                     </p>
                 </div>
                 
                 <div>
                     <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Assigned Portal / University</label>
                     <select 
                        className="w-full p-4 border border-slate-200 rounded-xl text-sm font-bold bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        value={selectedPartnerId}
                        onChange={(e) => setSelectedPartnerId(e.target.value)}
                     >
                         <option value="">-- Choose Partner --</option>
                         {partners.map(p => <option key={p.id} value={p.id}>{p.name} ({p.commissionRate}%)</option>)}
                     </select>
                 </div>

                 <button 
                    disabled={!selectedPartnerId}
                    onClick={() => moveStudent(partnerRequest.studentId, partnerRequest.targetStatus, selectedPartnerId)}
                    className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold flex items-center justify-center space-x-2 shadow-lg hover:bg-indigo-600 disabled:opacity-50 transition-all"
                 >
                    <span>Save & Move to {partnerRequest.targetStatus}</span>
                    <ArrowRight size={18}/>
                 </button>
             </div>
          </div>
        </div>
      )}

      {/* Visa Success Confirmation Modal */}
      {visaSuccessStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-8 text-center">
                 <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600 animate-bounce">
                    <Trophy size={32} />
                 </div>
                 <h3 className="text-2xl font-bold text-slate-900 mb-1">Visa Success!</h3>
                 <p className="text-slate-500 mb-6 text-sm">Congratulations on a successful visa grant.</p>
                 
                 {/* Student Contact Profile */}
                 <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100 text-left">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Applicant Profile</h4>
                    <div className="flex items-center space-x-4 mb-4">
                        <div className="h-12 w-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm">
                            {visaSuccessStudent.name.charAt(0)}
                        </div>
                        <div>
                            <p className="font-bold text-slate-800 text-lg">{visaSuccessStudent.name}</p>
                            <p className="text-indigo-600 font-bold text-sm font-mono">{visaSuccessStudent.phone || '+977-9800000000'}</p>
                        </div>
                    </div>
                    
                    {visaSuccessStudent.assignedPartnerName && (
                        <div className="mb-4 flex items-center text-xs font-bold text-slate-600 bg-white p-2 rounded-lg border border-slate-100">
                            <Building size={14} className="mr-2 text-indigo-600"/>
                            Partner: {visaSuccessStudent.assignedPartnerName}
                        </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        <a 
                            href={`tel:${visaSuccessStudent.phone || '9800000000'}`}
                            className="flex items-center justify-center space-x-2 bg-white border border-slate-200 p-2.5 rounded-xl text-slate-700 font-bold text-xs hover:bg-slate-100 transition-all shadow-sm"
                        >
                            <PhoneCall size={14} className="text-indigo-600"/>
                            <span>Call Now</span>
                        </a>
                        <button 
                            onClick={() => window.open(generateWhatsAppLink(visaSuccessStudent.phone || '9800000000', `Congratulations ${visaSuccessStudent.name}! Your visa for ${visaSuccessStudent.targetCountry} has been granted!`), '_blank')}
                            className="flex items-center justify-center space-x-2 bg-white border border-slate-200 p-2.5 rounded-xl text-slate-700 font-bold text-xs hover:bg-slate-100 transition-all shadow-sm"
                        >
                            <MessageCircle size={14} className="text-green-500"/>
                            <span>WhatsApp</span>
                        </button>
                    </div>
                 </div>
                 
                 <div className="space-y-3">
                    <button 
                      onClick={handleClaimCommission}
                      className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center space-x-2"
                    >
                      <DollarSign size={20}/>
                      <span>Claim Commission & Invoice</span>
                    </button>
                    <button 
                      onClick={() => setVisaSuccessStudent(null)}
                      className="w-full bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all"
                    >
                      Close
                    </button>
                 </div>
              </div>
              <div className="bg-slate-900 p-4 text-[10px] text-center text-slate-400 flex items-center justify-center font-bold tracking-tight">
                 <Sparkles size={12} className="mr-2 text-amber-400" /> SYSTEM NOTIFICATION: INVOICE GENERATOR PRE-FILLING ENABLED
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const WeeklyPlanner: React.FC<any> = ({ tasks, loading, selectedDay, onDayChange, onToggle, onDelete, onCreate }) => {
    const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    const dayTasks = tasks.filter((t: any) => t.day === selectedDay);
    const pendingTasks = dayTasks.filter((t: any) => !t.completed).sort((a: any, b: any) => a.dueTime.localeCompare(b.dueTime));
    const completedTasks = dayTasks.filter((t: any) => t.completed);

    const getPriorityStyles = (priority: string) => {
        switch(priority) {
            case 'High': return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'Medium': return 'bg-amber-100 text-amber-700 border-amber-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500">
            {/* Day Selector Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2 flex space-x-1 overflow-x-auto scrollbar-hide">
                {DAYS.map(d => {
                    const dayTasksCount = tasks.filter((t: any) => t.day === d && !t.completed).length;
                    return (
                        <button 
                            key={d} 
                            onClick={() => onDayChange(d)}
                            className={`flex-1 min-w-[100px] py-3 rounded-xl transition-all relative group ${
                                selectedDay === d 
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                                : 'hover:bg-slate-50 text-slate-500'
                            }`}
                        >
                            <span className="text-xs font-bold uppercase tracking-widest">{d.substring(0, 3)}</span>
                            {dayTasksCount > 0 && (
                                <span className={`absolute top-2 right-2 w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center border-2 ${
                                    selectedDay === d ? 'bg-white text-indigo-600 border-indigo-500' : 'bg-rose-500 text-white border-white'
                                }`}>
                                    {dayTasksCount}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-0">
                {/* Pending Tasks Section */}
                <div className="lg:col-span-2 flex flex-col min-h-0 space-y-4">
                    <div className="flex justify-between items-center px-2">
                        <div className="flex items-center space-x-2 text-slate-800">
                            <ListTodo className="text-indigo-600" size={20}/>
                            <h2 className="font-bold text-lg">Active Tasks</h2>
                            <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{pendingTasks.length}</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                        {pendingTasks.map((t: any) => (
                            <div 
                                key={t.id} 
                                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-all group flex items-start space-x-4"
                            >
                                <button 
                                    onClick={() => onToggle(t.id)}
                                    className="mt-1 w-6 h-6 rounded-lg border-2 border-slate-200 flex items-center justify-center hover:border-indigo-500 hover:bg-indigo-50 transition-all shrink-0"
                                >
                                    <div className="w-2 h-2 bg-indigo-500 rounded-sm opacity-0 group-hover:opacity-20"></div>
                                </button>
                                
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${getPriorityStyles(t.priority)}`}>
                                            {t.priority}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-400 flex items-center">
                                            <Clock size={10} className="mr-1"/> {t.dueTime}
                                        </span>
                                    </div>
                                    <p className="text-slate-800 font-medium leading-relaxed">{t.text}</p>
                                </div>

                                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-all">
                                    <button 
                                        onClick={() => window.open(generateGoogleCalendarLink(t), '_blank')}
                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                        title="Add to Google Calendar"
                                    >
                                        <CalendarPlus size={18}/>
                                    </button>
                                    <button 
                                        onClick={() => onDelete(t.id)}
                                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                        title="Delete Task"
                                    >
                                        <Trash2 size={18}/>
                                    </button>
                                </div>
                            </div>
                        ))}

                        {pendingTasks.length === 0 && (
                            <div className="h-48 flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-100 text-slate-300">
                                <CircleCheck size={48} className="mb-3 opacity-10"/>
                                <p className="font-bold">Day looks clear!</p>
                                <p className="text-xs">No pending tasks for {selectedDay}.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar: Completed Tasks & Stats */}
                <div className="flex flex-col min-h-0 space-y-6">
                    {/* Progress Card */}
                    <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2">Daily Progress</p>
                            <h3 className="text-3xl font-black">{dayTasks.length > 0 ? Math.round((completedTasks.length / dayTasks.length) * 100) : 0}%</h3>
                            <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-white transition-all duration-1000" 
                                    style={{ width: `${dayTasks.length > 0 ? (completedTasks.length / dayTasks.length) * 100 : 0}%` }}
                                ></div>
                            </div>
                            <p className="text-[10px] mt-4 font-bold uppercase tracking-tighter opacity-80 flex items-center">
                                <Info size={12} className="mr-1"/> {completedTasks.length} out of {dayTasks.length} items completed
                            </p>
                        </div>
                        <Sparkles className="absolute -bottom-4 -right-4 text-white/10" size={120}/>
                    </div>

                    {/* Completed List */}
                    <div className="flex-1 bg-slate-50/50 rounded-3xl border border-slate-200 flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-slate-200 bg-white/50 flex items-center space-x-2">
                            <CircleCheck className="text-emerald-500" size={18}/>
                            <h3 className="font-bold text-slate-800 text-sm">Recently Completed</h3>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                            {completedTasks.map((t: any) => (
                                <div key={t.id} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between group">
                                    <div className="flex items-center space-x-3 min-w-0">
                                        <button onClick={() => onToggle(t.id)} className="w-5 h-5 bg-emerald-500 text-white rounded-md flex items-center justify-center transition-all">
                                            <Check size={14}/>
                                        </button>
                                        <span className="text-xs font-medium text-slate-400 line-through truncate">{t.text}</span>
                                    </div>
                                    <button 
                                        onClick={() => onDelete(t.id)}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-rose-500 transition-all"
                                    >
                                        <X size={14}/>
                                    </button>
                                </div>
                            ))}
                            {completedTasks.length === 0 && (
                                <div className="py-12 text-center text-slate-400">
                                    <p className="text-[10px] font-bold uppercase tracking-widest">Nothing finished yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AddTaskModal: React.FC<any> = ({ onClose, onAdd, defaultDay }) => {
    const [text, setText] = useState('');
    const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
    const [time, setTime] = useState('10:00');
    const [day, setDay] = useState(defaultDay);

    const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const handleSave = () => {
        if (!text.trim()) return;
        onAdd({
            id: Date.now().toString(),
            text: text.trim(),
            completed: false,
            priority,
            dueTime: time,
            createdAt: Date.now(),
            day
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
                <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-xl text-slate-800 flex items-center">
                            <Plus size={22} className="mr-3 text-indigo-600"/> Create Schedule Task
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-1">Add a new item to your agency workflow.</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-900 bg-white p-2 rounded-xl shadow-sm border border-slate-100 transition-all active:scale-90"><X size={20}/></button>
                </div>
                
                <div className="p-8 space-y-6">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Task Description *</label>
                        <textarea 
                            autoFocus
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm min-h-[100px] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all font-medium leading-relaxed"
                            placeholder="e.g. Follow up with Ram regarding OSHC payment..."
                            value={text}
                            onChange={e => setText(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Assign Day</label>
                            <select 
                                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold bg-white focus:ring-2 focus:ring-indigo-500/20"
                                value={day}
                                onChange={e => setDay(e.target.value)}
                            >
                                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Due Time</label>
                            <input 
                                type="time"
                                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20"
                                value={time}
                                onChange={e => setTime(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Priority Level</label>
                        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                            {(['Low', 'Medium', 'High'] as const).map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPriority(p)}
                                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                                        priority === p 
                                        ? p === 'High' ? 'bg-rose-500 text-white shadow-lg' : 
                                          p === 'Medium' ? 'bg-amber-500 text-white shadow-lg' : 'bg-indigo-500 text-white shadow-lg'
                                        : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-8 border-t border-slate-50 bg-slate-50/30 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-3 rounded-2xl font-bold text-slate-500 hover:bg-slate-200 transition-all text-sm">Discard</button>
                    <button 
                        onClick={handleSave} 
                        disabled={!text.trim()}
                        className="bg-indigo-600 text-white px-10 py-3 rounded-2xl font-bold shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 text-sm flex items-center disabled:opacity-50"
                    >
                        <Save size={18} className="mr-2"/> Schedule Task
                    </button>
                </div>
            </div>
        </div>
    );
};

const NocTracker = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<NocStatus | 'All'>('All');
    
    // Update Modal State
    const [editingNoc, setEditingNoc] = useState<Student | null>(null);
    const [nocData, setNocData] = useState<Partial<Student & { nocDetails: NocMetadata }>>({});

    useEffect(() => { 
        setLoading(true);
        fetchStudents().then(s => {
            setStudents(s);
            setLoading(false);
        }); 
    }, []);

    const handleUpdateNoc = async () => {
        if (!editingNoc) return;
        
        const updatedStudent = { 
            ...editingNoc, 
            nocStatus: nocData.nocStatus || editingNoc.nocStatus,
            nocDetails: {
                ...(editingNoc.nocDetails || {}),
                ...(nocData.nocDetails || {})
            }
        } as Student;

        const updatedList = students.map(s => s.id === updatedStudent.id ? updatedStudent : s);
        setStudents(updatedList);
        await saveStudents(updatedList);
        setEditingNoc(null);
    };

    const filteredStudents = students.filter(s => {
        const matchesStatus = statusFilter === 'All' || s.nocStatus === statusFilter;
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || (s.passportNumber && s.passportNumber.toLowerCase().includes(searchTerm.toLowerCase()));
        
        // ELIGIBILITY: Show students if they are past the Lead phase OR if they are specifically flagged as needing an NOC (Not Applied).
        const isEligible = s.status !== ApplicationStatus.Lead || s.nocStatus === NocStatus.NotApplied;
        
        return matchesStatus && matchesSearch && isEligible;
    });

    const getStatusColor = (status: NocStatus) => {
        switch(status) {
            case NocStatus.Issued: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case NocStatus.Verified: return 'bg-blue-100 text-blue-700 border-blue-200';
            case NocStatus.VoucherReceived: return 'bg-amber-100 text-amber-700 border-amber-200';
            case NocStatus.Applied: return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            default: return 'bg-slate-100 text-slate-500 border-slate-200';
        }
    };

    if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;

    return (
        <div className="h-full flex flex-col bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-500">
            {/* Header / Filter Bar */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center">
                        <ClipboardCheck className="mr-2 text-indigo-600" size={24}/> MoEST NOC Tracker
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">Manage No Objection Certificate approvals for study abroad applicants.</p>
                </div>
                <div className="flex items-center space-x-3 w-full md:w-auto">
                    {/* Direct Portal Link */}
                    <a 
                        href="https://noc.moest.gov.np/" 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-md active:scale-95 whitespace-nowrap"
                    >
                        <ExternalLink size={14} className="mr-1.5"/> MoEST Portal
                    </a>
                    
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search name or passport..."
                            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select 
                        className="p-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl bg-white focus:outline-none"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                    >
                        <option value="All">All Status</option>
                        {Object.values(NocStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            {/* List Table */}
            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-4">Applicant Detail</th>
                            <th className="px-6 py-4">Institution & Country</th>
                            <th className="px-6 py-4">Voucher / NOC No.</th>
                            <th className="px-6 py-4">Dates</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredStudents.map(student => (
                            <tr key={student.id} className="hover:bg-indigo-50/30 transition-colors group">
                                <td className="px-6 py-5">
                                    <div className="flex items-center space-x-3">
                                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                            {student.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">{student.name}</p>
                                            <p className="text-[10px] font-mono text-slate-400 flex items-center mt-0.5">
                                                <FileText size={10} className="mr-1"/> {student.passportNumber || 'PASSPORT PENDING'}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <p className="text-xs font-bold text-slate-700">{student.assignedPartnerName || 'UNASSIGNED'}</p>
                                    <p className="text-[10px] text-indigo-600 font-bold uppercase mt-1 flex items-center">
                                        <Globe size={10} className="mr-1"/> {student.targetCountry}
                                    </p>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="space-y-1">
                                        {student.nocDetails?.voucherNumber ? (
                                            <p className="text-[10px] font-medium text-slate-600 flex items-center">
                                                <Landmark size={10} className="mr-1 text-slate-400"/> V: {student.nocDetails.voucherNumber}
                                            </p>
                                        ) : (
                                            <p className="text-[10px] text-slate-300 italic">Voucher Pending</p>
                                        )}
                                        {student.nocDetails?.nocNumber ? (
                                            <p className="text-[10px] font-black text-indigo-600 flex items-center">
                                                <Hash size={10} className="mr-1 text-indigo-400"/> NOC: {student.nocDetails.nocNumber}
                                            </p>
                                        ) : null}
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="space-y-0.5">
                                        {student.nocDetails?.appliedDate && (
                                            <p className="text-[10px] text-slate-400">Applied: <span className="text-slate-600 font-medium">{new Date(student.nocDetails.appliedDate).toLocaleDateString()}</span></p>
                                        )}
                                        {student.nocDetails?.approvedDate && (
                                            <p className="text-[10px] text-slate-400">Issued: <span className="text-emerald-600 font-bold">{new Date(student.nocDetails.approvedDate).toLocaleDateString()}</span></p>
                                        )}
                                        {!student.nocDetails?.appliedDate && <p className="text-[10px] text-slate-300 italic">Not tracked</p>}
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border shadow-sm ${getStatusColor(student.nocStatus)}`}>
                                        {student.nocStatus}
                                    </span>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <button 
                                        onClick={() => {
                                            setEditingNoc(student);
                                            setNocData({ 
                                                nocStatus: student.nocStatus, 
                                                nocDetails: student.nocDetails || {} 
                                            });
                                        }}
                                        className="p-2 bg-slate-100 text-slate-500 hover:bg-indigo-600 hover:text-white rounded-xl transition-all shadow-sm active:scale-95"
                                    >
                                        <Plus size={18}/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredStudents.length === 0 && (
                    <div className="py-20 text-center text-slate-300">
                        <ClipboardCheck size={64} className="mx-auto mb-4 opacity-10" />
                        <p className="font-medium">No applicants found for NOC processing.</p>
                        <p className="text-xs">Adjust your filters or ensure students have moved past the Lead phase.</p>
                    </div>
                )}
            </div>

            {/* NOC UPDATE MODAL */}
            {editingNoc && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
                        <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-xl text-slate-800 flex items-center">
                                    <ClipboardCheck size={22} className="mr-3 text-indigo-600"/> Update NOC Details
                                </h3>
                                <p className="text-xs text-slate-500 font-medium mt-1">Applicant: {editingNoc.name}</p>
                            </div>
                            <button onClick={() => setEditingNoc(null)} className="text-slate-400 hover:text-slate-900 bg-white p-2 rounded-xl shadow-sm border border-slate-100 transition-all active:scale-90"><X size={20}/></button>
                        </div>
                        
                        <div className="p-8 space-y-6">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Process Stage</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.values(NocStatus).map(stage => (
                                        <button 
                                            key={stage}
                                            onClick={() => setNocData({ ...nocData, nocStatus: stage })}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${
                                                nocData.nocStatus === stage 
                                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' 
                                                : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-indigo-200'
                                            }`}
                                        >
                                            {stage}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Application Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-3 text-slate-300" size={16}/>
                                        <input 
                                            type="date"
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                            value={nocData.nocDetails?.appliedDate ? new Date(nocData.nocDetails.appliedDate).toISOString().split('T')[0] : ''}
                                            onChange={e => setNocData({ ...nocData, nocDetails: { ...nocData.nocDetails, appliedDate: new Date(e.target.value).getTime() } })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Issue Date (Optional)</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-3 text-slate-300" size={16}/>
                                        <input 
                                            type="date"
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                            value={nocData.nocDetails?.approvedDate ? new Date(nocData.nocDetails.approvedDate).toISOString().split('T')[0] : ''}
                                            onChange={e => setNocData({ ...nocData, nocDetails: { ...nocData.nocDetails, approvedDate: new Date(e.target.value).getTime() } })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Bank Voucher No.</label>
                                    <div className="relative">
                                        <Landmark className="absolute left-3 top-3 text-slate-300" size={16}/>
                                        <input 
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-mono placeholder:font-sans focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                            placeholder="Bank Ref#"
                                            value={nocData.nocDetails?.voucherNumber || ''}
                                            onChange={e => setNocData({ ...nocData, nocDetails: { ...nocData.nocDetails, voucherNumber: e.target.value } })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Final NOC Number</label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-3 text-slate-300" size={16}/>
                                        <input 
                                            className="w-full pl-10 pr-4 py-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-sm font-black text-indigo-700 placeholder:font-normal focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                            placeholder="MoEST ID"
                                            value={nocData.nocDetails?.nocNumber || ''}
                                            onChange={e => setNocData({ ...nocData, nocDetails: { ...nocData.nocDetails, nocNumber: e.target.value } })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Internal Remarks</label>
                                <textarea 
                                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs h-20 resize-none outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    placeholder="Add any specific notes regarding the MoEST visit or verification..."
                                    value={nocData.nocDetails?.notes || ''}
                                    onChange={e => setNocData({ ...nocData, nocDetails: { ...nocData.nocDetails, notes: e.target.value } })}
                                />
                            </div>
                        </div>

                        <div className="p-8 border-t border-slate-50 bg-slate-50/30 flex justify-end gap-3">
                            <button onClick={() => setEditingNoc(null)} className="px-6 py-3 rounded-2xl font-bold text-slate-500 hover:bg-slate-200 transition-all text-sm">Discard</button>
                            <button onClick={handleUpdateNoc} className="bg-indigo-600 text-white px-10 py-3 rounded-2xl font-bold shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 text-sm flex items-center">
                                <Save size={18} className="mr-2"/> Save Status
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
