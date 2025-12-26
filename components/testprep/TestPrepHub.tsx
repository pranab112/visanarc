
import React, { useState, useEffect, useMemo } from 'react';
/* Updated icons list */
import { BookOpen, Download, ExternalLink, FileText, GraduationCap, Plus, X, UploadCloud, Save, Loader2, Link, Users, Clock, Calendar, Filter, Search, CheckCircle2, XCircle, CalendarCheck, ClipboardList, Trash2, File, FolderArchive, Image as ImageIcon, MoreVertical, UserPlus, CreditCard, Key, Landmark, ShieldCheck, Check, Timer, Pencil, Globe, ArrowRight, Info, ChevronRight, LayoutGrid, List, Trophy, Target, BarChart, TrendingUp, History, ChevronDown, ChevronUp, ArrowLeft, UserCircle, Briefcase, DollarSign, MonitorPlay, Book, Ticket, MapPin, Activity, Play, TicketCheck } from 'lucide-react';
import { TEST_PREP_LINKS } from '../../constants';
import { fetchStudents, saveStudents, fetchSettings, saveSettings } from '../../services/storageService';
import { Student, AgencySettings, ApplicationStatus, NocStatus, Country, TestScoreBreakdown } from '../../types';

export const TestPrepHub: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'resources' | 'attendance' | 'mock-tests'>('dashboard');
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState<Student[]>([]);
    const [settings, setSettings] = useState<AgencySettings | null>(null);
    const [viewingBatch, setViewingBatch] = useState<string | null>(null);
    const [selectedStudentForMock, setSelectedStudentForMock] = useState<Student | null>(null);
    const [mockScores, setMockScores] = useState<TestScoreBreakdown>({ listening: '', reading: '', writing: '', speaking: '', overall: '', date: Date.now() });
    const [isRecordingMock, setIsRecordingMock] = useState(false);

    // Attendance State
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedBatchForAttendance, setSelectedBatchForAttendance] = useState<string>('');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const [st, se] = await Promise.all([fetchStudents(), fetchSettings()]);
            setStudents(st);
            setSettings(se);
            if (se?.testPrepBatches && se.testPrepBatches.length > 0) {
                setSelectedBatchForAttendance(se.testPrepBatches[0]);
            }
            setLoading(false);
        };
        load();
    }, []);

    const enrolledStudents = students.filter(s => s.testPrep?.enrolled);
    const availableBatches = settings?.testPrepBatches || ['Morning (7-8 AM)', 'Day (12-1 PM)', 'Evening (5-6 PM)'];

    const handleSaveMockRecord = async () => {
        if (!selectedStudentForMock) return;
        const newRecord = { ...mockScores, date: Date.now() };
        const updatedStudents = students.map(s => {
            if (s.id === selectedStudentForMock.id) {
                const history = s.testPrep?.mockTestHistory || [];
                return { ...s, testPrep: { ...s.testPrep!, mockScores: newRecord, mockTestHistory: [...history, newRecord] } };
            }
            return s;
        });
        setStudents(updatedStudents);
        await saveStudents(updatedStudents);
        setIsRecordingMock(false);
        setSelectedStudentForMock(null);
    };

    const handleUpdateAttendance = async (studentId: string, status: 'Present' | 'Absent' | 'Late') => {
        const updatedStudents = students.map(s => {
            if (s.id === studentId) {
                const attendance = { ...(s.testPrep?.attendance || {}), [attendanceDate]: status };
                return { ...s, testPrep: { ...s.testPrep!, attendance } };
            }
            return s;
        });
        setStudents(updatedStudents);
        await saveStudents(updatedStudents);
    };

    if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;

    return (
        <div className="h-full bg-slate-50 flex flex-col overflow-hidden">
            <header className="bg-white border-b border-slate-200 px-8 py-6 shrink-0 z-10 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center"><GraduationCap className="mr-3 text-indigo-600" size={28} />Prep Centre Intelligence</h1>
                        <p className="text-slate-400 text-sm font-medium mt-0.5">Language excellence and mock cycle tracking.</p>
                    </div>
                </div>
                <nav className="flex space-x-8">
                    {[{ id: 'dashboard', label: 'Streams', icon: LayoutGrid }, { id: 'mock-tests', label: 'Score Registry', icon: BarChart }, { id: 'resources', label: 'Asset Library', icon: BookOpen }, { id: 'attendance', label: 'Attendance', icon: CalendarCheck }].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center space-x-2 pb-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
                            <tab.icon size={16} /><span>{tab.label}</span>
                            {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-600 rounded-t-full shadow-lg"></div>}
                        </button>
                    ))}
                </nav>
            </header>

            <main className="flex-1 overflow-y-auto custom-scrollbar p-8">
                {activeTab === 'dashboard' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <section>
                            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center"><TrendingUp size={14} className="mr-2"/> Live Batch Enrollment</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {availableBatches.map(batch => {
                                    const count = enrolledStudents.filter(s => s.testPrep?.batch === batch).length;
                                    return (
                                        <div key={batch} onClick={() => setViewingBatch(batch)} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:border-indigo-400 hover:shadow-xl transition-all group cursor-pointer active:scale-95">
                                            <p className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">{batch}</p>
                                            <div className="flex items-end justify-between">
                                                <div><h3 className="text-4xl font-black text-slate-800">{count}</h3><p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Active Students</p></div>
                                                <div className="p-3 bg-slate-50 text-slate-300 group-hover:bg-indigo-600 group-hover:text-white rounded-2xl transition-all shadow-sm"><ArrowRight size={20} /></div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </section>
                        {viewingBatch && (
                            <section className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
                                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center"><h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">{viewingBatch} Stream Members</h3><button onClick={() => setViewingBatch(null)}><X size={20} className="text-slate-400"/></button></div>
                                <div className="p-6 space-y-4">
                                    {enrolledStudents.filter(s => s.testPrep?.batch === viewingBatch).map(s => (
                                        <div key={s.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all">
                                            <div className="flex items-center space-x-4"><div className="h-10 w-10 rounded-full bg-slate-900 flex items-center justify-center text-white font-black text-xs">{s.name.charAt(0)}</div><div><p className="font-bold text-slate-800 text-sm">{s.name}</p><p className="text-[10px] font-black text-indigo-500 uppercase">{s.testType} • Target: {(s.testPrep as any)?.targetScore || 'N/A'}</p></div></div>
                                            <button onClick={() => { setSelectedStudentForMock(s); setMockScores({ listening: '', reading: '', writing: '', speaking: '', overall: '', date: Date.now() }); setIsRecordingMock(true); }} className="bg-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 hover:bg-slate-900 hover:text-white transition-all shadow-sm">Record Mock</button>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}

                {activeTab === 'mock-tests' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <div><h2 className="text-xl font-black text-slate-800 tracking-tight">Performance Score Registry</h2><p className="text-xs text-slate-500 font-medium">Historical band score progression for all applicants.</p></div>
                                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-slate-400"><Activity size={14}/><span>Audited Cycles Only</span></div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                        <tr><th className="px-8 py-5">Applicant Detail</th><th className="px-8 py-5">Attempts</th><th className="px-8 py-5">Band Overview (L|R|W|S)</th><th className="px-8 py-5 text-right">Latest Overall</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {enrolledStudents.map(student => {
                                            const history = student.testPrep?.mockTestHistory || [];
                                            const latest = history[history.length - 1];
                                            return (
                                                <tr key={student.id} className="hover:bg-indigo-50/20 transition-all cursor-pointer group">
                                                    <td className="px-8 py-6"><p className="font-bold text-slate-800">{student.name}</p><p className="text-[10px] font-black text-slate-400 uppercase mt-1">{student.testType} • {student.testPrep?.batch}</p></td>
                                                    <td className="px-8 py-6"><span className="bg-slate-100 px-3 py-1 rounded-lg text-[10px] font-black text-slate-600 shadow-inner">{history.length} Cycles</span></td>
                                                    <td className="px-8 py-6">
                                                        {latest ? (
                                                            <div className="flex space-x-1">
                                                                {[latest.listening, latest.reading, latest.writing, latest.speaking].map((score, i) => (
                                                                    <div key={i} className="h-8 w-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-[10px] font-black text-slate-800 shadow-sm">{score}</div>
                                                                ))}
                                                            </div>
                                                        ) : <span className="text-slate-300 italic text-[10px] font-bold uppercase">No records generated</span>}
                                                    </td>
                                                    <td className="px-8 py-6 text-right"><span className="text-2xl font-black text-indigo-600 tracking-tighter">{latest?.overall || '--'}</span></td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'resources' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
                                <div>
                                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl w-fit mb-4"><Link size={20}/></div>
                                    <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-2">Result Portals</h3>
                                    <p className="text-xs text-slate-500">Access student scores directly.</p>
                                </div>
                                <div className="mt-6 space-y-2">
                                    {TEST_PREP_LINKS.map(link => (
                                        <a key={link.name} href={link.resultsUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-[10px] font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-100">
                                            <span>{link.name} Results</span>
                                            <ExternalLink size={12}/>
                                        </a>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
                                <div>
                                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl w-fit mb-4"><FileText size={20}/></div>
                                    <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-2">Mock Papers</h3>
                                    <p className="text-xs text-slate-500">Practice tests for all modules.</p>
                                </div>
                                <div className="mt-6 space-y-2">
                                    {['IELTS Full Mock 01', 'PTE Sample Test V2', 'TOEFL Speaking Prep'].map(doc => (
                                        <div key={doc} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-[10px] font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 transition-all border border-slate-100 cursor-pointer">
                                            <span>{doc}</span>
                                            <Download size={12}/>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
                                <div>
                                    <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl w-fit mb-4"><Book size={20}/></div>
                                    <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-2">Vocabulary Bank</h3>
                                    <p className="text-xs text-slate-500">High-scoring academic word lists.</p>
                                </div>
                                <div className="mt-6 space-y-2">
                                    {['Scientific Context', 'Collocations Guide', 'Idiomatic Expressions'].map(doc => (
                                        <div key={doc} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-[10px] font-bold text-slate-600 hover:bg-amber-50 hover:text-amber-600 transition-all border border-slate-100 cursor-pointer">
                                            <span>{doc}</span>
                                            <Download size={12}/>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Updated Section: Booking Command Center */}
                            <div className="bg-slate-900 p-6 rounded-3xl shadow-xl flex flex-col justify-between relative overflow-hidden group">
                                <div className="relative z-10">
                                    <div className="p-3 bg-indigo-500 text-white rounded-2xl w-fit mb-4"><TicketCheck size={20}/></div>
                                    <h3 className="font-black text-white uppercase tracking-widest text-xs mb-2">Booking Command Center</h3>
                                    <p className="text-xs text-slate-400">Direct landing to test booking portals.</p>
                                </div>
                                <div className="mt-6 relative z-10 space-y-2">
                                    {TEST_PREP_LINKS.filter(l => l.name !== 'ETS (TOEFL)').map(link => (
                                        <button 
                                            key={link.name}
                                            onClick={() => window.open(link.bookingUrl, '_blank')}
                                            className="w-full py-3 bg-white/10 hover:bg-indigo-600 border border-white/10 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-between px-4"
                                        >
                                            <span>Book {link.name.split(' (')[0]}</span>
                                            <ArrowRight size={14}/>
                                        </button>
                                    ))}
                                    <button 
                                        onClick={() => window.open('https://www.pearsonpte.com/book-now', '_blank')}
                                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg transition-all flex items-center justify-between px-4"
                                    >
                                        <span>Pearson PTE Booking</span>
                                        <ArrowRight size={14}/>
                                    </button>
                                </div>
                                <Globe size={100} className="absolute -bottom-10 -right-10 text-white/5 group-hover:scale-110 transition-transform" />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'attendance' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                            <div className="flex items-center space-x-6 w-full md:w-auto">
                                <div className="relative flex-1 md:flex-none">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 block">Selected Batch</label>
                                    <select 
                                        className="w-full md:w-64 p-3.5 border border-slate-200 rounded-xl bg-slate-50 font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                        value={selectedBatchForAttendance}
                                        onChange={e => setSelectedBatchForAttendance(e.target.value)}
                                    >
                                        {availableBatches.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                </div>
                                <div className="relative flex-1 md:flex-none">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 block">Date Selector</label>
                                    <input 
                                        type="date" 
                                        className="w-full md:w-48 p-3.5 border border-slate-200 rounded-xl bg-slate-50 font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                        value={attendanceDate}
                                        onChange={e => setAttendanceDate(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex space-x-2">
                                <div className="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center">
                                    {enrolledStudents.filter(s => s.testPrep?.batch === selectedBatchForAttendance).length} Students
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                        <tr>
                                            <th className="px-8 py-5">Student Information</th>
                                            <th className="px-8 py-5">Current Status</th>
                                            <th className="px-8 py-5 text-right">Attendance Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {enrolledStudents.filter(s => s.testPrep?.batch === selectedBatchForAttendance).map(student => {
                                            const status = student.testPrep?.attendance?.[attendanceDate] || 'Unmarked';
                                            return (
                                                <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-400">{student.name.charAt(0)}</div>
                                                            <div>
                                                                <p className="font-bold text-slate-800">{student.name}</p>
                                                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1">{student.testType}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                                                            status === 'Present' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                            status === 'Absent' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                            status === 'Late' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                            'bg-slate-50 text-slate-400 border-slate-100'
                                                        }`}>
                                                            {status}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <div className="flex justify-end bg-slate-100 p-1 rounded-xl w-fit ml-auto">
                                                            <button onClick={() => handleUpdateAttendance(student.id, 'Present')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${status === 'Present' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>P</button>
                                                            <button onClick={() => handleUpdateAttendance(student.id, 'Absent')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${status === 'Absent' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>A</button>
                                                            <button onClick={() => handleUpdateAttendance(student.id, 'Late')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${status === 'Late' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>L</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {enrolledStudents.filter(s => s.testPrep?.batch === selectedBatchForAttendance).length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="px-8 py-20 text-center text-slate-300">
                                                    <Users size={48} className="mx-auto mb-4 opacity-10" />
                                                    <p className="font-bold">No students enrolled in this batch.</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {isRecordingMock && selectedStudentForMock && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
                        <div className="p-8 bg-indigo-600 text-white flex justify-between items-center"><h3 className="text-xl font-black">Record Mock Cycle</h3><button onClick={() => setIsRecordingMock(false)}><X size={24}/></button></div>
                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                {['listening', 'reading', 'writing', 'speaking'].map(m => (
                                    <div key={m}><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">{m}</label><input className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white transition-all font-black text-center" placeholder="0.0" value={(mockScores as any)[m]} onChange={e => setMockScores({...mockScores, [m]: e.target.value})} /></div>
                                ))}
                            </div>
                            <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Overall Band</label><input className="w-full p-4 bg-indigo-50 border border-indigo-200 rounded-2xl font-black text-indigo-700 text-center text-xl" placeholder="6.5" value={mockScores.overall} onChange={e => setMockScores({...mockScores, overall: e.target.value})} /></div>
                            <button onClick={handleSaveMockRecord} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-600 transition-all">Persist Score Record</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
