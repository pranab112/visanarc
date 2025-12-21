
import React, { useState, useEffect } from 'react';
/* Added missing MapPin icon to imports from lucide-react */
import { BookOpen, Download, ExternalLink, FileText, GraduationCap, Plus, X, UploadCloud, Save, Loader2, Link, Users, Clock, Calendar, Filter, Search, CheckCircle2, XCircle, CalendarCheck, ClipboardList, Trash2, File, FolderArchive, Image as ImageIcon, MoreVertical, UserPlus, CreditCard, Key, Landmark, ShieldCheck, Check, Timer, Pencil, Globe, ArrowRight, Info, ChevronRight, LayoutGrid, List, Trophy, Target, BarChart, TrendingUp, History, ChevronDown, ChevronUp, ArrowLeft, UserCircle, Briefcase, DollarSign, MonitorPlay, Book, Ticket, MapPin } from 'lucide-react';
import { TEST_PREP_LINKS } from '../../constants';
import { fetchStudents, saveStudents, fetchSettings, saveSettings } from '../../services/storageService';
import { Student, AgencySettings, ApplicationStatus, NocStatus, Country, TestScoreBreakdown } from '../../types';

interface Resource {
    id: string;
    title: string;
    category: 'IELTS' | 'PTE' | 'TOEFL' | 'General';
    module?: 'Listening' | 'Reading' | 'Writing' | 'Speaking' | 'All';
    type: string;
    size: string;
    addedBy?: string;
}

const DEFAULT_BATCHES = ['Morning (7-8 AM)', 'Day (12-1 PM)', 'Evening (5-6 PM)'];
const MOCK_INSTRUCTORS = ['Ms. Anjali Sharma', 'Mr. David Rai', 'Mrs. Sunita Thapa', 'Mr. Robert Wilson'];

const INITIAL_RESOURCES: Resource[] = [
    { id: '1', title: 'IELTS Band 9 Speaking Guide', category: 'IELTS', module: 'Speaking', type: 'PDF', size: '2.4 MB' },
    { id: '2', title: 'PTE 79+ Template Collection', category: 'PTE', module: 'Writing', type: 'ZIP', size: '5.1 MB' },
    { id: '3', title: 'TOEFL Writing Samples', category: 'TOEFL', module: 'Writing', type: 'PDF', size: '1.2 MB' },
    { id: '4', title: 'Common Visa Interview Questions', category: 'General', module: 'Speaking', type: 'PDF', size: '0.8 MB' },
    { id: '5', title: 'IELTS Cambridge Book 18', category: 'IELTS', module: 'All', type: 'PDF', size: '145 MB' },
    { id: '6', title: 'PTE Real Exam Questions 2024', category: 'PTE', module: 'Reading', type: 'DOCX', size: '3.5 MB' },
    { id: '7', title: '500 Essential Vocabulary List', category: 'General', module: 'All', type: 'PDF', size: '1.1 MB' },
];

export const TestPrepHub: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'resources' | 'attendance' | 'mock-tests'>('dashboard');
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState<Student[]>([]);
    const [settings, setSettings] = useState<AgencySettings | null>(null);
    
    // UI States
    const [resourceFilter, setResourceFilter] = useState<'All' | 'IELTS' | 'PTE' | 'TOEFL' | 'General'>('All');
    const [resourceSearch, setResourceSearch] = useState('');
    const [viewingBatch, setViewingBatch] = useState<string | null>(null);
    
    // Enrollment
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [enrollSearch, setEnrollSearch] = useState('');
    const [enrollData, setEnrollData] = useState({
        studentId: '',
        name: '',
        batch: '',
        studyMode: 'Physical' as 'Physical' | 'Online',
        materialsIssued: 'Not Issued' as 'Not Issued' | 'Issued' | 'Partially Issued',
        testType: 'IELTS' as any,
        targetScore: '',
        instructorName: '',
        feeStatus: 'Unpaid' as 'Paid' | 'Unpaid' | 'Partial',
        enrollmentDate: new Date().toISOString().split('T')[0]
    });

    // Batch Management
    const [isAddingBatch, setIsAddingBatch] = useState(false);
    const [newBatchName, setNewBatchName] = useState('');
    const [isSavingBatch, setIsSavingBatch] = useState(false);

    // Mock Test State
    const [isRecordingMock, setIsRecordingMock] = useState(false);
    const [selectedStudentForMock, setSelectedStudentForMock] = useState<Student | null>(null);
    const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
    const [mockScores, setMockScores] = useState<TestScoreBreakdown>({
        listening: '', reading: '', writing: '', speaking: '', overall: '', date: Date.now()
    });

    // Test Booking State
    const [isBooking, setIsBooking] = useState(false);
    const [selectedStudentForBooking, setSelectedStudentForBooking] = useState<Student | null>(null);
    const [bookingData, setBookingData] = useState({
        examDate: '',
        examVenue: '',
        bookingStatus: 'Pending' as 'Pending' | 'Booked' | 'Completed',
        portalUsername: '',
        portalPassword: '',
        examFeeStatus: 'Unpaid' as 'Paid' | 'Unpaid'
    });

    // Attendance
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceBatch, setAttendanceBatch] = useState<string>('All');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const [st, se] = await Promise.all([fetchStudents(), fetchSettings()]);
            setStudents(st);
            setSettings(se);
            setLoading(false);
        };
        load();
    }, []);

    const availableBatches = settings?.testPrepBatches || DEFAULT_BATCHES;
    const enrolledStudents = students.filter(s => s.testPrep?.enrolled);

    // --- MOCK TEST ACTIONS ---
    const calculateOverall = (scores: Partial<TestScoreBreakdown>) => {
        const vals = [scores.listening, scores.reading, scores.writing, scores.speaking].map(v => parseFloat(v || '0'));
        const validVals = vals.filter(v => v > 0);
        if (validVals.length === 0) return '';
        const avg = validVals.reduce((a, b) => a + b, 0) / validVals.length;
        if (avg <= 9) return (Math.round(avg * 2) / 2).toFixed(1);
        return Math.round(avg).toString();
    };

    const handleUpdateMockScore = (field: keyof TestScoreBreakdown, value: string) => {
        const updated = { ...mockScores, [field]: value };
        const overall = calculateOverall(updated);
        setMockScores({ ...updated, overall });
    };

    const handleSaveMockRecord = async () => {
        if (!selectedStudentForMock) return;
        
        const newRecord = { ...mockScores, date: Date.now() };
        
        const updatedStudents = students.map(s => {
            if (s.id === selectedStudentForMock.id) {
                const history = s.testPrep?.mockTestHistory || [];
                const currentHistory = history.length === 0 && s.testPrep?.mockScores 
                    ? [{ ...s.testPrep.mockScores, date: s.createdAt }] 
                    : history;

                return {
                    ...s,
                    testPrep: {
                        ...s.testPrep!,
                        mockScores: newRecord,
                        mockTestHistory: [...currentHistory, newRecord]
                    }
                };
            }
            return s;
        });

        setStudents(updatedStudents);
        await saveStudents(updatedStudents);
        setIsRecordingMock(false);
        setSelectedStudentForMock(null);
        setMockScores({ listening: '', reading: '', writing: '', speaking: '', overall: '', date: Date.now() });
    };

    const handleSaveBooking = async () => {
        if (!selectedStudentForBooking) return;
        
        const updatedStudents = students.map(s => {
            if (s.id === selectedStudentForBooking.id) {
                return {
                    ...s,
                    testPrep: {
                        ...s.testPrep!,
                        examDate: bookingData.examDate ? new Date(bookingData.examDate).getTime() : undefined,
                        examVenue: bookingData.examVenue,
                        bookingStatus: bookingData.bookingStatus,
                        portalUsername: bookingData.portalUsername,
                        portalPassword: bookingData.portalPassword,
                        examFeeStatus: bookingData.examFeeStatus
                    }
                };
            }
            return s;
        });

        setStudents(updatedStudents);
        await saveStudents(updatedStudents);
        setIsBooking(false);
        setSelectedStudentForBooking(null);
    };

    const handleSaveBatch = async () => {
        if (!newBatchName.trim() || !settings) return;
        const currentBatches = settings.testPrepBatches || [...DEFAULT_BATCHES];
        if (currentBatches.includes(newBatchName.trim())) { alert("Batch already exists."); return; }
        setIsSavingBatch(true);
        const updatedSettings = { ...settings, testPrepBatches: [...currentBatches, newBatchName.trim()] };
        try { await saveSettings(updatedSettings); setSettings(updatedSettings); setNewBatchName(''); } catch (e) { alert("Failed to save batch."); } finally { setIsSavingBatch(false); }
    };

    const handleDeleteBatch = async (batchName: string) => {
        if (!settings || !window.confirm(`Permanently remove batch "${batchName}"?`)) return;
        const enrolledCount = enrolledStudents.filter(s => s.testPrep?.batch === batchName).length;
        if (enrolledCount > 0) { alert(`Cannot delete batch. ${enrolledCount} student(s) are currently enrolled in it.`); return; }
        const updatedBatches = (settings.testPrepBatches || [...DEFAULT_BATCHES]).filter(b => b !== batchName);
        const updatedSettings = { ...settings, testPrepBatches: updatedBatches };
        try { await saveSettings(updatedSettings); setSettings(updatedSettings); } catch (e) { alert("Failed to delete batch."); }
    };

    const handleEnrollStudent = async () => {
        if (!enrollData.studentId || !enrollData.batch || !enrollData.targetScore || !enrollData.instructorName) {
            alert("All marked fields are required.");
            return;
        }
        const student = students.find(s => s.id === enrollData.studentId);
        if (!student) return;
        
        const updatedStudent: Student = { 
            ...student, 
            testPrep: { 
                ...student.testPrep, 
                enrolled: true, 
                batch: enrollData.batch,
                studyMode: enrollData.studyMode,
                materialsIssued: enrollData.materialsIssued,
                targetScore: enrollData.targetScore,
                instructorName: enrollData.instructorName,
                feeStatus: enrollData.feeStatus,
                enrollmentDate: new Date(enrollData.enrollmentDate).getTime()
            }, 
            testType: enrollData.testType 
        };
        const updatedList = students.map(s => s.id === student.id ? updatedStudent : s);
        setStudents(updatedList);
        await saveStudents(updatedList);
        setIsEnrolling(false);
    };

    const updateAttendance = async (studentId: string, status: 'Present' | 'Absent' | 'Late') => {
        const updatedStudents = students.map(s => {
            if (s.id === studentId) {
                return { ...s, testPrep: { ...s.testPrep!, attendance: { ...(s.testPrep?.attendance || {}), [attendanceDate]: status } } };
            }
            return s;
        });
        setStudents(updatedStudents);
        await saveStudents(updatedStudents);
    };

    if (loading) return <div className="h-full flex items-center justify-center bg-white"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;

    return (
        <div className="h-full bg-slate-50/50 flex flex-col overflow-hidden">
            
            {/* Clean Professional Header */}
            <header className="bg-white border-b border-slate-200 px-8 py-6 shrink-0 shadow-sm z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
                            <GraduationCap className="mr-3 text-indigo-600" size={28} />
                            Test Preparation Center
                        </h1>
                        <p className="text-slate-400 text-sm font-medium mt-0.5">Streamlined management for language proficiency classes.</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button 
                            onClick={() => setIsEnrolling(true)}
                            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center active:scale-95"
                        >
                            <UserPlus size={18} className="mr-2" /> Enroll Student
                        </button>
                    </div>
                </div>

                <nav className="flex space-x-8 mt-6">
                    {[
                        { id: 'dashboard', label: 'Overview', icon: LayoutGrid },
                        { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
                        { id: 'mock-tests', label: 'Mock Tests', icon: Trophy },
                        { id: 'resources', label: 'Resources', icon: BookOpen }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id as any);
                                if (tab.id !== 'dashboard') setViewingBatch(null);
                            }}
                            className={`flex items-center space-x-2 pb-4 text-sm font-bold transition-all relative ${
                                activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            <tab.icon size={18} />
                            <span>{tab.label}</span>
                            {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-600 rounded-t-full shadow-lg shadow-indigo-200"></div>}
                        </button>
                    ))}
                </nav>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto custom-scrollbar p-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    
                    {activeTab === 'dashboard' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
                            {/* Left: Batches Grid or Detail View */}
                            <div className="lg:col-span-8 space-y-8">
                                {viewingBatch ? (
                                    <div className="animate-in slide-in-from-left-4 duration-300 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <button 
                                                onClick={() => setViewingBatch(null)}
                                                className="flex items-center text-xs font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
                                            >
                                                <ArrowLeft size={16} className="mr-2" /> Back to All Streams
                                            </button>
                                            <span className="text-xs font-black bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full uppercase tracking-tighter">
                                                Active Stream: {viewingBatch}
                                            </span>
                                        </div>

                                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                                            <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                                                <h3 className="font-black text-slate-800 tracking-tight">Enrolled Students ({enrolledStudents.filter(s => s.testPrep?.batch === viewingBatch).length})</h3>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left">
                                                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                                        <tr>
                                                            <th className="px-6 py-4">Applicant</th>
                                                            <th className="px-6 py-4">Mode</th>
                                                            <th className="px-6 py-4">Target Score</th>
                                                            <th className="px-6 py-4">Instructor</th>
                                                            <th className="px-6 py-4 text-right">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-50">
                                                        {enrolledStudents.filter(s => s.testPrep?.batch === viewingBatch).map(student => (
                                                            <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                                                                <td className="px-6 py-5">
                                                                    <div className="flex items-center space-x-3">
                                                                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xs">
                                                                            {student.name.charAt(0)}
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-bold text-slate-800 text-sm">{student.name}</p>
                                                                            <p className="text-[10px] text-slate-400 font-bold uppercase">{student.testType}</p>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-5">
                                                                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${student.testPrep?.studyMode === 'Online' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-slate-50 text-slate-600 border border-slate-100'}`}>
                                                                        {student.testPrep?.studyMode || 'Physical'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-5">
                                                                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-black uppercase">
                                                                        Target: {student.testPrep?.targetScore || 'N/A'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-5">
                                                                    <p className="text-xs font-bold text-slate-600">{student.testPrep?.instructorName || 'Unassigned'}</p>
                                                                </td>
                                                                <td className="px-6 py-5 text-right">
                                                                    <div className="flex justify-end space-x-2">
                                                                        <button 
                                                                            onClick={() => {
                                                                                // Redirect to IDP Booking Portal in new tab
                                                                                window.open("https://ielts.idp.com/book/IELTS?countryId=144&utm_source=google&utm_medium=cpc_MM&utm_campaign=IDP_&_IELTS&utm_term=ielts%20test%20booking%20idp&gad_source=1&gad_campaignid=20901448934&gbraid=0AAAAADPFTOSgBk1psWjLD3jO72A6F2SLQ&gclid=Cj0KCQiAjJTKBhCjARIsAIMC44-yh6hoLF4Pe2z019JN2BslsSuStcRaWYpZW6KsP07NfPaVuOMtO08aAnD0EALw_wcB", "_blank");
                                                                                
                                                                                // Simultaneously open internal modal to store details
                                                                                setSelectedStudentForBooking(student);
                                                                                setBookingData({
                                                                                    examDate: student.testPrep?.examDate ? new Date(student.testPrep.examDate).toISOString().split('T')[0] : '',
                                                                                    examVenue: student.testPrep?.examVenue || '',
                                                                                    bookingStatus: student.testPrep?.bookingStatus || 'Pending',
                                                                                    portalUsername: student.testPrep?.portalUsername || '',
                                                                                    portalPassword: student.testPrep?.portalPassword || '',
                                                                                    examFeeStatus: student.testPrep?.examFeeStatus || 'Unpaid'
                                                                                });
                                                                                setIsBooking(true);
                                                                            }}
                                                                            className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all shadow-sm flex items-center"
                                                                        >
                                                                            <Ticket size={14} className="mr-1.5"/> Book Test
                                                                        </button>
                                                                        <button 
                                                                            onClick={() => {
                                                                                setSelectedStudentForMock(student);
                                                                                setMockScores({ listening: '', reading: '', writing: '', speaking: '', overall: '', date: Date.now() });
                                                                                setIsRecordingMock(true);
                                                                            }}
                                                                            className="bg-slate-900 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase hover:bg-indigo-600 transition-all shadow-sm"
                                                                        >
                                                                            Record Mock
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {enrolledStudents.filter(s => s.testPrep?.batch === viewingBatch).length === 0 && (
                                                            <tr>
                                                                <td colSpan={5} className="px-6 py-12 text-center text-slate-300">
                                                                    <p className="text-xs font-bold uppercase tracking-widest">No Students Enrolled in this Stream</p>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <section>
                                            <div className="flex justify-between items-center mb-4">
                                                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center">
                                                    <Users size={14} className="mr-2" /> Current Active Streams
                                                </h2>
                                                <button onClick={() => setIsAddingBatch(true)} className="text-xs font-bold text-indigo-600 hover:underline">Manage Batches</button>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                                {availableBatches.map(batch => (
                                                    <div 
                                                        key={batch} 
                                                        onClick={() => setViewingBatch(batch)}
                                                        className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-all group cursor-pointer active:scale-95"
                                                    >
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1 truncate">{batch}</p>
                                                        <div className="flex items-end justify-between">
                                                            <h3 className="text-3xl font-black text-slate-800">
                                                                {enrolledStudents.filter(s => s.testPrep?.batch === batch).length}
                                                            </h3>
                                                            <div className="p-2 bg-slate-50 rounded-lg text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                                <ArrowRight size={16} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>

                                        <section className="bg-indigo-600 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-100">
                                            <div className="relative z-10">
                                                <h3 className="text-2xl font-black mb-2">Language Excellence Matrix</h3>
                                                <p className="text-indigo-100 opacity-80 text-sm max-w-md">Real-time performance tracking of all enrolled students across mock test cycles.</p>
                                                <div className="mt-8 flex gap-4">
                                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex-1">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Test Ready</p>
                                                        <p className="text-2xl font-black mt-1">{enrolledStudents.filter(s => parseFloat(s.testPrep?.mockScores?.overall || '0') >= 6.5).length}</p>
                                                    </div>
                                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex-1">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Avg. Growth</p>
                                                        <p className="text-2xl font-black mt-1">+0.5 <span className="text-xs font-normal text-indigo-300">Bands</span></p>
                                                    </div>
                                                </div>
                                            </div>
                                            <Globe size={200} className="absolute -bottom-10 -right-10 text-white/5" />
                                        </section>
                                    </>
                                )}
                            </div>

                            {/* Right: Portals & Upcoming */}
                            <div className="lg:col-span-4 space-y-8">
                                <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Official Portals</h3>
                                        <ShieldCheck size={14} className="text-emerald-500" />
                                    </div>
                                    <div className="p-5 space-y-3">
                                        {TEST_PREP_LINKS.filter(l => l.name.includes('British') || l.name.includes('IDP')).map(link => (
                                            <div key={link.name} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-100 group">
                                                <div>
                                                    <p className="text-sm font-black text-slate-800 tracking-tight">{link.name.split(' ')[0]} {link.name.split(' ')[1]}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Verification Page</p>
                                                </div>
                                                <a href={link.bookingUrl} target="_blank" rel="noreferrer" className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                    <ExternalLink size={16} />
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Upcoming Exams</h3>
                                    </div>
                                    <div className="p-5">
                                        <div className="space-y-4">
                                            {enrolledStudents.filter(s => s.testPrep?.examDate).slice(0, 3).map(student => (
                                                <div key={student.id} className="flex items-center space-x-3">
                                                    <div className="h-10 w-10 rounded-xl bg-red-50 text-red-600 flex flex-col items-center justify-center font-black">
                                                        <span className="text-[10px] uppercase leading-none">{new Date(student.testPrep!.examDate!).toLocaleString('default', { month: 'short' })}</span>
                                                        <span className="text-base leading-none mt-0.5">{new Date(student.testPrep!.examDate!).getDate()}</span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-slate-800 truncate">{student.name}</p>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase">{student.testType}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {enrolledStudents.filter(s => s.testPrep?.examDate).length === 0 && (
                                                <p className="text-center py-6 text-slate-300 text-[10px] font-black uppercase tracking-widest">No Bookings Found</p>
                                            )}
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>
                    )}

                    {activeTab === 'attendance' && (
                        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                            <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-50/30">
                                <div className="flex gap-4">
                                    <div className="relative">
                                        <Calendar className="absolute left-3.5 top-3 text-slate-400" size={18} />
                                        <input 
                                            type="date" 
                                            value={attendanceDate} 
                                            onChange={(e) => setAttendanceDate(e.target.value)}
                                            className="pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl font-bold text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none bg-white" 
                                        />
                                    </div>
                                    <select 
                                        value={attendanceBatch} 
                                        onChange={(e) => setAttendanceBatch(e.target.value)}
                                        className="px-4 py-2.5 border border-slate-200 rounded-xl font-bold text-sm bg-white outline-none focus:ring-4 focus:ring-indigo-500/10"
                                    >
                                        <option value="All">All Streams</option>
                                        {availableBatches.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                </div>
                                <div className="flex items-center space-x-6">
                                    <div className="text-center">
                                        <p className="text-[10px] font-black text-emerald-600 uppercase mb-0.5">Present</p>
                                        <p className="text-xl font-black text-slate-800">{enrolledStudents.filter(s => s.testPrep?.attendance?.[attendanceDate] === 'Present').length}</p>
                                    </div>
                                    <div className="w-px h-8 bg-slate-200"></div>
                                    <div className="text-center">
                                        <p className="text-[10px] font-black text-rose-500 uppercase mb-0.5">Absent</p>
                                        <p className="text-xl font-black text-slate-800">{enrolledStudents.filter(s => s.testPrep?.attendance?.[attendanceDate] === 'Absent').length}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                                        <tr>
                                            <th className="px-8 py-5">Full Applicant Name</th>
                                            <th className="px-8 py-5">Assigned Stream</th>
                                            <th className="px-8 py-5">Attendance Actions</th>
                                            <th className="px-8 py-5 text-right">Last Verified</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {enrolledStudents
                                            .filter(s => attendanceBatch === 'All' || s.testPrep?.batch === attendanceBatch)
                                            .map(student => {
                                                const status = student.testPrep?.attendance?.[attendanceDate];
                                                return (
                                                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors group">
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center space-x-4">
                                                                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner border border-white">
                                                                    {student.name.charAt(0)}
                                                                </div>
                                                                <p className="font-bold text-slate-800 tracking-tight">{student.name}</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{student.testPrep?.batch}</span>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex space-x-2">
                                                                {(['Present', 'Absent', 'Late'] as const).map(s => (
                                                                    <button 
                                                                        key={s}
                                                                        onClick={() => updateAttendance(student.id, s)}
                                                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all border ${
                                                                            status === s 
                                                                            ? s === 'Present' ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-200' :
                                                                              s === 'Absent' ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-200' :
                                                                              'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-200'
                                                                            : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-600'
                                                                        }`}
                                                                    >
                                                                        {s.charAt(0)}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 text-right">
                                                            <p className="text-[10px] font-black text-slate-300 uppercase italic">{status ? 'Recorded Today' : 'Unmarked'}</p>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'mock-tests' && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 flex items-center">
                                            <BarChart className="mr-2 text-indigo-600" size={24} /> Performance Registry
                                        </h2>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Track scores and multiple mock test attempts</p>
                                    </div>
                                    <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                                        <TrendingUp size={16} className="text-emerald-500" />
                                        <span className="text-xs font-black text-slate-600 uppercase">Class Average: 6.2</span>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                                            <tr>
                                                <th className="px-8 py-5">Applicant</th>
                                                <th className="px-6 py-5 text-center">Attempts</th>
                                                <th className="px-6 py-5">Latest (Overall)</th>
                                                <th className="px-8 py-5 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {enrolledStudents.map(student => {
                                                const history = student.testPrep?.mockTestHistory || [];
                                                const displayHistory = history.length === 0 && student.testPrep?.mockScores 
                                                    ? [{ ...student.testPrep.mockScores, date: student.createdAt }] 
                                                    : history;
                                                
                                                const latestScore = displayHistory[displayHistory.length - 1];
                                                const isExpanded = expandedHistoryId === student.id;

                                                return (
                                                    <React.Fragment key={student.id}>
                                                        <tr className="hover:bg-slate-50/50 transition-colors group">
                                                            <td className="px-8 py-5">
                                                                <p className="font-bold text-slate-800 tracking-tight">{student.name}</p>
                                                                <p className="text-[10px] font-black text-slate-400 uppercase">{student.testType} • {student.testPrep?.batch}</p>
                                                            </td>
                                                            <td className="px-6 py-5 text-center">
                                                                <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-600">
                                                                    {displayHistory.length} Record{displayHistory.length !== 1 ? 's' : ''}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-5">
                                                                {latestScore?.overall ? (
                                                                    <div className="flex items-center space-x-3">
                                                                        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg font-black text-sm border border-indigo-100 shadow-sm">
                                                                            {latestScore.overall}
                                                                        </span>
                                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                                                                            {latestScore.date ? new Date(latestScore.date).toLocaleDateString() : 'N/A'}
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-slate-300 text-xs italic font-medium">No results</span>
                                                                )}
                                                            </td>
                                                            <td className="px-8 py-5 text-right">
                                                                <div className="flex justify-end items-center space-x-2">
                                                                    {displayHistory.length > 0 && (
                                                                        <button 
                                                                            onClick={() => setExpandedHistoryId(isExpanded ? null : student.id)}
                                                                            className={`p-2 rounded-lg transition-all ${isExpanded ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                                                                            title="View History"
                                                                        >
                                                                            <History size={18} />
                                                                        </button>
                                                                    )}
                                                                    <button 
                                                                        onClick={() => {
                                                                            setSelectedStudentForMock(student);
                                                                            setMockScores({ listening: '', reading: '', writing: '', speaking: '', overall: '', date: Date.now() });
                                                                            setIsRecordingMock(true);
                                                                        }}
                                                                        className="p-2 text-white bg-slate-900 hover:bg-indigo-600 rounded-lg transition-all shadow-md"
                                                                        title="Add New Result"
                                                                    >
                                                                        <Plus size={18} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                        {isExpanded && (
                                                            <tr className="bg-slate-50/50">
                                                                <td colSpan={4} className="px-8 py-6">
                                                                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm animate-in slide-in-from-top-2 duration-300">
                                                                        <table className="w-full text-left text-xs">
                                                                            <thead className="bg-slate-50 border-b border-slate-100">
                                                                                <tr>
                                                                                    <th className="px-4 py-3 font-black text-slate-400 uppercase">Test Date</th>
                                                                                    <th className="px-4 py-3 font-black text-slate-400 uppercase">L</th>
                                                                                    <th className="px-4 py-3 font-black text-slate-400 uppercase">R</th>
                                                                                    <th className="px-4 py-3 font-black text-slate-400 uppercase">W</th>
                                                                                    <th className="px-4 py-3 font-black text-slate-400 uppercase">S</th>
                                                                                    <th className="px-4 py-3 font-black text-slate-400 uppercase text-right">Overall</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody className="divide-y divide-slate-50">
                                                                                {[...displayHistory].reverse().map((rec, i) => (
                                                                                    <tr key={i} className="hover:bg-indigo-50/10">
                                                                                        <td className="px-4 py-3 font-bold text-slate-600">{rec.date ? new Date(rec.date).toLocaleDateString() : `Mock ${displayHistory.length - i}`}</td>
                                                                                        <td className="px-4 py-3 text-slate-500">{rec.listening}</td>
                                                                                        <td className="px-4 py-3 text-slate-500">{rec.reading}</td>
                                                                                        <td className="px-4 py-3 text-slate-500">{rec.writing}</td>
                                                                                        <td className="px-4 py-3 text-slate-500">{rec.speaking}</td>
                                                                                        <td className="px-4 py-3 text-right">
                                                                                            <span className="font-black text-indigo-600">{rec.overall}</span>
                                                                                        </td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })}
                                            {enrolledStudents.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="px-8 py-20 text-center text-slate-300">
                                                        <Trophy size={48} className="mx-auto mb-4 opacity-10" />
                                                        <p className="font-black text-[10px] uppercase tracking-widest">No Enrolled Students to Track</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'resources' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                                <div className="flex-1 w-full md:max-w-md relative">
                                    <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                                    <input 
                                        placeholder="Search master guides, templates, audio..." 
                                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-indigo-500/10 outline-none font-medium transition-all"
                                        value={resourceSearch}
                                        onChange={(e) => setResourceSearch(e.target.value)}
                                    />
                                </div>
                                <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                                    {['All', 'IELTS', 'PTE', 'TOEFL'].map(f => (
                                        <button 
                                            key={f}
                                            onClick={() => setResourceFilter(f as any)}
                                            className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                                                resourceFilter === f ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
                                            }`}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {INITIAL_RESOURCES.filter(r => resourceFilter === 'All' || r.category === resourceFilter).map(item => (
                                    <div key={item.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all group">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="p-4 bg-slate-50 rounded-2xl text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                                                {item.type === 'PDF' ? <FileText size={24} /> : <FolderArchive size={24} />}
                                            </div>
                                            <span className="text-[10px] font-black bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full uppercase tracking-tighter">{item.category}</span>
                                        </div>
                                        <h4 className="font-black text-slate-800 mb-1 leading-tight">{item.title}</h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.module} Module • {item.size}</p>
                                        <button className="w-full mt-8 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center hover:bg-indigo-600 transition-all active:scale-95 shadow-lg shadow-slate-900/5">
                                            <Download size={14} className="mr-2" /> Download Asset
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* TEST BOOKING MODAL */}
            {isBooking && selectedStudentForBooking && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-indigo-600 text-white">
                            <div>
                                <h3 className="text-xl font-black flex items-center tracking-tighter">
                                    <Ticket size={22} className="mr-2 text-white/80" /> Exam Booking Management
                                </h3>
                                <p className="text-xs text-indigo-100 font-bold uppercase tracking-widest mt-1">Student: {selectedStudentForBooking.name}</p>
                            </div>
                            <button onClick={() => setIsBooking(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"><X size={24}/></button>
                        </div>
                        <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Exam Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-3.5 text-slate-300" size={18} />
                                        <input 
                                            type="date"
                                            className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-sm"
                                            value={bookingData.examDate}
                                            onChange={(e) => setBookingData({...bookingData, examDate: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Booking Status</label>
                                    <div className="relative">
                                        <ClipboardList className="absolute left-4 top-3.5 text-slate-300" size={18} />
                                        <select 
                                            className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-sm"
                                            value={bookingData.bookingStatus}
                                            onChange={(e) => setBookingData({...bookingData, bookingStatus: e.target.value as any})}
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="Booked">Booked</option>
                                            <option value="Completed">Completed</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Test Center / Venue</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-3.5 text-slate-300" size={18} />
                                    <input 
                                        className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-sm"
                                        placeholder="e.g. British Council, Kathmandu"
                                        value={bookingData.examVenue}
                                        onChange={(e) => setBookingData({...bookingData, examVenue: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="p-5 bg-slate-50 rounded-3xl border border-slate-200 space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                                    <Lock size={14} className="mr-2" /> Booking Portal Credentials
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">Portal Username</label>
                                        <input 
                                            className="w-full p-3 border border-slate-200 rounded-xl bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium text-sm"
                                            placeholder="User ID / Email"
                                            value={bookingData.portalUsername}
                                            onChange={(e) => setBookingData({...bookingData, portalUsername: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">Portal Password</label>
                                        <input 
                                            className="w-full p-3 border border-slate-200 rounded-xl bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium text-sm"
                                            placeholder="Password"
                                            value={bookingData.portalPassword}
                                            onChange={(e) => setBookingData({...bookingData, portalPassword: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Exam Fee Status</label>
                                <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                                    {(['Unpaid', 'Paid'] as const).map(s => (
                                        <button 
                                            key={s}
                                            onClick={() => setBookingData({...bookingData, examFeeStatus: s})}
                                            className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
                                                bookingData.examFeeStatus === s 
                                                ? 'bg-indigo-600 text-white shadow-lg' 
                                                : 'text-slate-400 hover:text-slate-600'
                                            }`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="p-8 border-t bg-slate-50/50 flex justify-end gap-3">
                            <button onClick={() => setIsBooking(false)} className="px-6 py-3 font-bold text-slate-400 hover:text-slate-600 transition-colors text-sm uppercase tracking-widest">Discard</button>
                            <button 
                                onClick={handleSaveBooking}
                                className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-600 transition-all"
                            >
                                Update Booking
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MOCK TEST RECORD MODAL */}
            {isRecordingMock && selectedStudentForMock && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-indigo-600 text-white">
                            <div>
                                <h3 className="text-xl font-black flex items-center tracking-tighter">
                                    <Target size={22} className="mr-2 text-white/80" /> Record Mock Score
                                </h3>
                                <p className="text-xs text-indigo-100 font-bold uppercase tracking-widest mt-1">Student: {selectedStudentForMock.name}</p>
                            </div>
                            <button onClick={() => setIsRecordingMock(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"><X size={24}/></button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Listening</label>
                                    <input 
                                        className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-lg text-center"
                                        placeholder="0.0"
                                        value={mockScores.listening}
                                        onChange={(e) => handleUpdateMockScore('listening', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Reading</label>
                                    <input 
                                        className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-lg text-center"
                                        placeholder="0.0"
                                        value={mockScores.reading}
                                        onChange={(e) => handleUpdateMockScore('reading', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Writing</label>
                                    <input 
                                        className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-lg text-center"
                                        placeholder="0.0"
                                        value={mockScores.writing}
                                        onChange={(e) => handleUpdateMockScore('writing', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Speaking</label>
                                    <input 
                                        className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-lg text-center"
                                        placeholder="0.0"
                                        value={mockScores.speaking}
                                        onChange={(e) => handleUpdateMockScore('speaking', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100 flex flex-col items-center">
                                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Calculated Overall</label>
                                <div className="text-4xl font-black text-indigo-600 bg-indigo-50 w-24 h-24 rounded-full flex items-center justify-center border-4 border-white shadow-xl">
                                    {mockScores.overall || '--'}
                                </div>
                            </div>
                        </div>
                        <div className="p-8 border-t bg-slate-50/50 flex justify-end">
                            <button 
                                onClick={handleSaveMockRecord}
                                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-600 transition-all active:scale-95"
                            >
                                Persist Record
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* BATCH MANAGEMENT MODAL */}
            {isAddingBatch && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 flex items-center tracking-tighter">
                                    <Users size={22} className="mr-2 text-indigo-600" /> Batch Management
                                </h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Add or remove test preparation streams</p>
                            </div>
                            <button onClick={() => setIsAddingBatch(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"><X size={24}/></button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-4">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Active Streams</label>
                                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                                    {availableBatches.map(batch => (
                                        <div key={batch} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                                            <span className="text-sm font-bold text-slate-700">{batch}</span>
                                            <button 
                                                onClick={() => handleDeleteBatch(batch)}
                                                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                <Trash2 size={16}/>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="pt-4 border-t border-slate-100">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Create New Batch</label>
                                <div className="flex gap-3">
                                    <input 
                                        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-sm"
                                        placeholder="e.g. Afternoon (2-3 PM)"
                                        value={newBatchName}
                                        onChange={(e) => setNewBatchName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveBatch()}
                                    />
                                    <button 
                                        onClick={handleSaveBatch}
                                        disabled={!newBatchName.trim() || isSavingBatch}
                                        className="bg-slate-900 text-white p-3 rounded-xl hover:bg-indigo-600 transition-all disabled:opacity-30"
                                    >
                                        {isSavingBatch ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20}/>}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="p-8 border-t bg-slate-50/50 flex justify-end">
                            <button 
                                onClick={() => setIsAddingBatch(false)}
                                className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-600 transition-all"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ENROLLMENT MODAL (Extended) */}
            {isEnrolling && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 flex items-center tracking-tighter">
                                    <UserPlus size={22} className="mr-2 text-indigo-600" /> Intensive Enrollment
                                </h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Configure full intake profile for the prep stream</p>
                            </div>
                            <button onClick={() => setIsEnrolling(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"><X size={24}/></button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="relative">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Student Registry Lookup *</label>
                                <div className="relative">
                                    <Search className="absolute left-4 top-3.5 text-slate-300" size={18} />
                                    <input 
                                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-sm"
                                        placeholder="Type name or scan CRM..."
                                        value={enrollSearch}
                                        onChange={(e) => setEnrollSearch(e.target.value)}
                                    />
                                    {enrollSearch && (
                                        <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-slate-200 rounded-2xl shadow-2xl z-20 max-h-48 overflow-y-auto p-2">
                                            {students.filter(s => s.name.toLowerCase().includes(enrollSearch.toLowerCase())).map(s => (
                                                <button 
                                                    key={s.id} 
                                                    onClick={() => { setEnrollData({...enrollData, studentId: s.id, name: s.name}); setEnrollSearch(''); }}
                                                    className="w-full text-left p-3 hover:bg-indigo-50 rounded-xl flex items-center space-x-3 transition-colors"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">{s.name.charAt(0)}</div>
                                                    <span className="text-sm font-bold text-slate-700">{s.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {enrollData.name && (
                                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center space-x-3">
                                    <CheckCircle2 size={20} className="text-emerald-600" />
                                    <div>
                                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-1">Target Applicant</p>
                                        <p className="text-sm font-black text-emerald-700">{enrollData.name}</p>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Stream / Batch *</label>
                                    <div className="relative">
                                        <Users className="absolute left-4 top-3.5 text-slate-300" size={18} />
                                        <select 
                                            className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-2xl bg-white text-sm font-bold outline-none"
                                            value={enrollData.batch}
                                            onChange={(e) => setEnrollData({...enrollData, batch: e.target.value})}
                                        >
                                            <option value="">Select Stream...</option>
                                            {availableBatches.map(b => <option key={b} value={b}>{b}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Study Mode *</label>
                                    <div className="relative">
                                        <MonitorPlay className="absolute left-4 top-3.5 text-slate-300" size={18} />
                                        <select 
                                            className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-2xl bg-white text-sm font-bold outline-none"
                                            value={enrollData.studyMode}
                                            onChange={(e) => setEnrollData({...enrollData, studyMode: e.target.value as any})}
                                        >
                                            <option value="Physical">Physical (On-Campus)</option>
                                            <option value="Online">Online (Remote)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Assigned Instructor *</label>
                                    <div className="relative">
                                        <Briefcase className="absolute left-4 top-3.5 text-slate-300" size={18} />
                                        <select 
                                            className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-2xl bg-white text-sm font-bold outline-none"
                                            value={enrollData.instructorName}
                                            onChange={(e) => setEnrollData({...enrollData, instructorName: e.target.value})}
                                        >
                                            <option value="">Select Instructor...</option>
                                            {MOCK_INSTRUCTORS.map(i => <option key={i} value={i}>{i}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Target Score *</label>
                                    <div className="relative">
                                        <Target className="absolute left-4 top-3.5 text-slate-300" size={18} />
                                        <input 
                                            className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-2xl bg-white text-sm font-bold outline-none"
                                            placeholder="e.g. 7.5 or 79"
                                            value={enrollData.targetScore}
                                            onChange={(e) => setEnrollData({...enrollData, targetScore: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col space-y-3">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-600">
                                            <Book size={18}/>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase">Materials Logistics</p>
                                            <p className="text-sm font-bold text-slate-800">Study Materials Status</p>
                                        </div>
                                    </div>
                                    <select 
                                        className="w-full p-2 border border-slate-200 rounded-xl bg-white text-sm font-bold"
                                        value={enrollData.materialsIssued}
                                        onChange={(e) => setEnrollData({...enrollData, materialsIssued: e.target.value as any})}
                                    >
                                        <option value="Not Issued">Not Issued</option>
                                        <option value="Partially Issued">Partially Issued</option>
                                        <option value="Issued">Fully Issued</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Initial Fee Status *</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-4 top-3.5 text-slate-300" size={18} />
                                        <select 
                                            className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-2xl bg-white text-sm font-bold outline-none"
                                            value={enrollData.feeStatus}
                                            onChange={(e) => setEnrollData({...enrollData, feeStatus: e.target.value as any})}
                                        >
                                            <option value="Unpaid">Unpaid</option>
                                            <option value="Partial">Partial Payment</option>
                                            <option value="Paid">Fully Paid</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Language Test *</label>
                                    <div className="relative">
                                        <Globe className="absolute left-4 top-3.5 text-slate-300" size={18} />
                                        <select 
                                            className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-2xl bg-white text-sm font-bold outline-none"
                                            value={enrollData.testType}
                                            onChange={(e) => setEnrollData({...enrollData, testType: e.target.value})}
                                        >
                                            <option value="IELTS">IELTS</option>
                                            <option value="PTE">PTE</option>
                                            <option value="TOEFL">TOEFL</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Enrollment Date *</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-3.5 text-slate-300" size={18} />
                                        <input 
                                            type="date"
                                            className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-2xl bg-white text-sm font-bold outline-none"
                                            value={enrollData.enrollmentDate}
                                            onChange={(e) => setEnrollData({...enrollData, enrollmentDate: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-8 border-t bg-slate-50/50 flex justify-end gap-3">
                            <button onClick={() => setIsEnrolling(false)} className="px-6 py-3 font-bold text-slate-400 hover:text-slate-600 transition-colors text-sm uppercase tracking-widest">Abort</button>
                            <button 
                                onClick={handleEnrollStudent}
                                disabled={!enrollData.studentId || !enrollData.batch || !enrollData.targetScore || !enrollData.instructorName}
                                className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-600 transition-all disabled:opacity-50"
                            >
                                Finalize Pipeline
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className="mt-8 text-center text-[10px] text-slate-300">
                Powered by Visa In Arc
            </div>
        </div>
    );
};
