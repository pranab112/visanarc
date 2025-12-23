
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Plus, Search, User, FileText, Check, UploadCloud, Trash2, Loader2, AlertCircle, MapPin, Phone, Mail, FolderOpen, BookOpen, Receipt, Globe, X, Send, MessageCircle, Link, Lock, CheckCircle2, DollarSign, Wallet, Trophy, Activity, ArrowLeft, ScanFace, CreditCard, Sparkles, Key, Calculator, Calendar, MessageSquare, Download, Clock, Ban, Package, Share2, Clipboard, GraduationCap, Building, Pencil, Save, History, Briefcase, GraduationCap as AcademicIcon, Landmark, Eye, FileCheck, ShieldAlert, ShieldCheck, ChevronRight, Pin, StickyNote, Info, TriangleAlert, UserCheck, Printer, Landmark as Bank, Network, BrainCircuit, RefreshCcw, TrendingUp, AlertTriangle, Zap, SearchCode } from 'lucide-react';
import { Student, Country, ApplicationStatus, NocStatus, Invoice, AgencySettings, UserRole, DocumentStatus, ChangeRecord, Partner, StoredFile, NoteEntry, NoteType, AuditFinding } from '../../types';
import { fetchStudents, saveStudents, fetchInvoices, saveInvoices, fetchSettings, fetchPartners } from '../../services/storageService';
import { getCurrentUser } from '../../services/authService';
import { uploadFile, deleteFile } from '../../services/fileStorageService';
import { DocRequirement } from '../../constants';
import { simulateSendEmail, generateWhatsAppLink, fillTemplate } from '../../services/communicationService';
import { logActivity } from '../../services/auditService';
import { runStatusAutomation } from '../../services/workflowService';
import { generatePartnerBundle } from '../../services/bundleService';
import { getRequiredDocuments, generateReceipt } from '../../services/documentService';
import { supabase, isSupabaseConfigured } from '../../services/supabaseClient';
import { analyzeVisaRisk, extractPassportData, auditStudentCompliance } from '../../services/geminiService';

/**
 * Optimized Student Card Component
 */
const StudentCard = React.memo(({ student, onClick }: { student: Student, onClick: (id: string) => void }) => (
  <div 
    onClick={() => onClick(student.id)} 
    className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between h-[192px] group relative"
  >
      <div>
          <div className="flex justify-between mb-3">
            <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform">
              {student.name.charAt(0)}
            </div>
            <span className="text-[10px] px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold uppercase mr-2">
              {student.status}
            </span>
          </div>
          <h3 className="font-bold text-lg truncate text-slate-800 pr-6">{student.name}</h3>
          <p className="text-xs text-slate-400">{student.phone || 'No phone recorded'}</p>
      </div>
      <div className="pt-4 border-t flex justify-between items-center text-xs text-slate-500">
          <span className="flex items-center font-bold text-indigo-600"><Globe size={12} className="mr-1"/> {student.targetCountry}</span> 
          <span className="bg-slate-100 px-2 py-0.5 rounded uppercase font-bold text-[9px]">{student.testType || 'N/A'}</span>
      </div>
  </div>
));

/**
 * Loading Skeleton Component
 */
const StudentSkeleton = () => (
  <div className="bg-white p-5 rounded-2xl border border-slate-100 h-[192px] animate-pulse">
    <div className="flex justify-between mb-3">
      <div className="h-10 w-10 rounded-full bg-slate-100"></div>
      <div className="h-5 w-16 bg-slate-50 rounded-full"></div>
    </div>
    <div className="h-5 w-3/4 bg-slate-100 rounded mb-2"></div>
    <div className="h-3 w-1/2 bg-slate-50 rounded mb-4"></div>
    <div className="pt-4 border-t flex justify-between">
      <div className="h-3 w-20 bg-slate-50 rounded"></div>
      <div className="h-3 w-10 bg-slate-50 rounded"></div>
    </div>
  </div>
);

export const StudentManager: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [settings, setSettings] = useState<AgencySettings | null>(null);
  
  const [userRole, setUserRole] = useState<UserRole>('Viewer');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'documents' | 'notes' | 'profile' | 'financials' | 'risk'>('documents');
  
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [analyzingRisk, setAnalyzingRisk] = useState(false);
  const [isBundling, setIsBundling] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);

  // Financial States
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [newInvoiceAmount, setNewInvoiceAmount] = useState('');
  const [newInvoiceDesc, setNewInvoiceDesc] = useState('Service Fee');

  // Virtualization State
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(800);

  // Toast State
  const [toast, setToast] = useState<{ show: boolean, msg: string, type: 'success' | 'error' } | null>(null);

  // Notes Extension State
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteType, setNewNoteType] = useState<NoteType>('General');
  const [noteFilter, setNoteFilter] = useState<NoteType | 'All'>('All');

  const [editFormData, setEditFormData] = useState<Partial<Student>>({});
  const prevSelectedId = useRef<string | null>(null);

  // --- DETAILED ADD STUDENT FIELDS ---
  const [newStudentData, setNewStudentData] = useState<Partial<Student>>({
      name: '',
      email: '',
      phone: '',
      targetCountry: Country.Australia,
      gender: 'Male',
      dateOfBirth: '',
      passportNumber: '',
      nationality: 'Nepalese',
      highestQualification: 'Undergraduate (+2)',
      gpa: '',
      testType: 'None',
      testScore: '',
      intakeMonth: 'September',
      intakeYear: '2025',
      annualTuition: 0,
      educationGap: 0,
      previousRefusals: false,
      borderDetails: '',
      source: 'Walk-in',
      branchId: 'main',
      ocrConfidence: undefined
  });
  
  const [scanningPassport, setScanningPassport] = useState(false);

  useEffect(() => {
    const init = async () => {
        setLoading(true);
        try {
            const currentUser = getCurrentUser();
            setUserRole(currentUser?.role || 'Viewer');

            const [s, i, set, p] = await Promise.all([
                fetchStudents(),
                fetchInvoices(),
                fetchSettings(),
                fetchPartners()
            ]);
            setStudents(s);
            setInvoices(i);
            setSettings(set);
            setPartners(p);
            if (set) {
                setNewStudentData(prev => ({ ...prev, targetCountry: set.defaultCountry }));
            }
        } catch (error) {
            console.error("Failed to load data", error);
        } finally {
            setTimeout(() => setLoading(false), 800);
        }
    };
    init();
  }, []);

  // Update container height on resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [loading, selectedStudentId]);

  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const selectedStudent = useMemo(() => students.find(s => s.id === selectedStudentId), [students, selectedStudentId]);
  const studentInvoices = useMemo(() => invoices.filter(inv => inv.studentId === selectedStudentId), [invoices, selectedStudentId]);

  useEffect(() => {
    if (selectedStudent) {
        if (prevSelectedId.current !== selectedStudentId) {
            setEditFormData({ ...selectedStudent });
            prevSelectedId.current = selectedStudentId;
        }
    } else {
        prevSelectedId.current = null;
    }
  }, [selectedStudentId, selectedStudent]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleAsyncUpdate = async (updatedStudents: Student[]) => {
      setSyncing(true);
      try {
          await saveStudents(updatedStudents);
          setStudents(updatedStudents);
      } finally {
          setSyncing(false);
      }
  };

  const handlePartnerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pId = e.target.value;
    if (!pId) {
        setEditFormData({
            ...editFormData,
            assignedPartnerId: undefined,
            assignedPartnerName: undefined,
            commissionAmount: undefined
        });
        return;
    }
    const partner = partners.find(p => p.id === pId);
    if (partner) {
        const tuition = editFormData.annualTuition || 0;
        const comm = (tuition * partner.commissionRate) / 100;
        setEditFormData({
            ...editFormData,
            assignedPartnerId: partner.id,
            assignedPartnerName: partner.name,
            commissionAmount: comm
        });
    }
  };

  const handleCreateInvoice = async () => {
      if (!selectedStudent || !newInvoiceAmount) return;
      
      const amt = parseFloat(newInvoiceAmount);
      if (isNaN(amt) || amt <= 0) {
          showToast("Please enter a valid amount.", "error");
          return;
      }

      setIsSaving(true);
      try {
          const timestamp = Date.now();
          const newInvoice: Invoice = {
              id: `inv_${timestamp}`,
              invoiceNumber: `INV-${selectedStudent.name.substring(0,3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
              studentId: selectedStudent.id,
              studentName: selectedStudent.name,
              amount: amt,
              description: newInvoiceDesc,
              status: 'Pending',
              date: timestamp,
              branchId: selectedStudent.branchId || 'main'
          };

          const updatedInvoices = [newInvoice, ...invoices];
          await saveInvoices(updatedInvoices);
          setInvoices(updatedInvoices);
          
          logActivity('CREATE', 'Invoice', `Generated invoice ${newInvoice.invoiceNumber} for ${selectedStudent.name}`);
          showToast(`Invoice ${newInvoice.invoiceNumber} generated.`);
          
          setIsCreatingInvoice(false);
          setNewInvoiceAmount('');
          setNewInvoiceDesc('Service Fee');
      } catch (err) {
          showToast("Failed to create invoice.", "error");
      } finally {
          setIsSaving(false);
      }
  };

  const handleToggleInvoiceStatus = async (invoiceId: string) => {
      const updated = invoices.map(inv => {
          if (inv.id === invoiceId) {
              return { ...inv, status: (inv.status === 'Paid' ? 'Pending' : 'Paid') as 'Paid' | 'Pending' };
          }
          return inv;
      });
      setInvoices(updated);
      await saveInvoices(updated);
      showToast("Payment status updated.");
  };

  const handleSaveProfile = async () => {
      if (!selectedStudent || isSaving) return;
      setIsSaving(true);
      try {
          const updatedStudent = { ...selectedStudent, ...editFormData } as Student;
          const updatedList = students.map(s => s.id === updatedStudent.id ? updatedStudent : s);
          await saveStudents(updatedList);
          setStudents(updatedList);
          logActivity('UPDATE', 'Student', `Updated profile for ${selectedStudent.name}`);
          showToast("Student profile updated successfully!");
      } catch (err: any) {
          showToast("Failed to save changes. Please check your connection.", "error");
      } finally {
          setIsSaving(false);
      }
  };

  const handleRunRiskAnalysis = async () => {
    if (!selectedStudent || analyzingRisk) return;
    setAnalyzingRisk(true);
    try {
        const profile = `
            Name: ${selectedStudent.name}
            Target Country: ${selectedStudent.targetCountry}
            GPA: ${selectedStudent.gpa || 'N/A'}
            English Level: ${selectedStudent.testType} ${selectedStudent.testScore}
            Gap: ${selectedStudent.educationGap || 0} years
            Experience: ${selectedStudent.workExperience || 0} years
            Previous Refusals: ${selectedStudent.previousRefusals ? 'Yes' : 'No'}
            Refusal Details: ${selectedStudent.borderDetails || 'None'}
            Financial Budget: ${selectedStudent.financialCap || 'Medium'}
        `;
        const result = await analyzeVisaRisk(profile, selectedStudent.targetCountry);
        
        const updatedStudent = {
            ...selectedStudent,
            riskAnalysis: {
                date: Date.now(),
                result: result
            }
        };
        
        const updatedList = students.map(s => s.id === updatedStudent.id ? updatedStudent : s);
        setStudents(updatedList);
        await saveStudents(updatedList);
        showToast("Visa Risk Report Generated Successfully");
    } catch (err) {
        showToast("Failed to analyze visa risk", "error");
    } finally {
        setAnalyzingRisk(false);
    }
  };

  const handleRunDocumentAudit = async () => {
    if (!selectedStudent || isAuditing) return;
    setIsAuditing(true);
    try {
        const profile = `Name: ${selectedStudent.name}, Country: ${selectedStudent.targetCountry}, Gap: ${selectedStudent.educationGap}, Refusals: ${selectedStudent.previousRefusals}, English: ${selectedStudent.testType} ${selectedStudent.testScore}`;
        const uploadedDocs = Object.entries(selectedStudent.documents)
            .filter(([_, status]) => status === 'Uploaded')
            .map(([name]) => name);

        const findings = await auditStudentCompliance(profile, uploadedDocs);
        
        const updatedStudent = {
            ...selectedStudent,
            documentAudit: {
                date: Date.now(),
                findings: findings
            }
        };

        const updatedList = students.map(s => s.id === updatedStudent.id ? updatedStudent : s);
        await saveStudents(updatedList);
        setStudents(updatedList);
        showToast("AI Compliance Audit Finished.");
    } catch (err) {
        showToast("AI Audit Failed.", "error");
    } finally {
        setIsAuditing(false);
    }
  };

  const parsedRiskReport = useMemo(() => {
    if (!selectedStudent?.riskAnalysis?.result) return null;
    try {
        const data = JSON.parse(selectedStudent.riskAnalysis.result);
        return {
            score: data.riskScore || 'N/A',
            probability: data.approvalProbability || 'N/A',
            strengths: Array.isArray(data.keyStrengths) ? data.keyStrengths : [],
            factors: Array.isArray(data.riskFactors) ? data.riskFactors : [],
            recommendations: Array.isArray(data.recommendations) ? data.recommendations : []
        };
    } catch (e) {
        console.error("Failed to parse risk report JSON", e);
        return null;
    }
  }, [selectedStudent]);

  const handleAddStudent = async () => {
    if (!newStudentData.name || !newStudentData.branchId || !newStudentData.intakeMonth || !newStudentData.highestQualification) {
        showToast("Please fill all mandatory fields (marked with *)", "error");
        return;
    }
    const newStudent: Student = {
      id: Date.now().toString(),
      name: newStudentData.name || '',
      email: newStudentData.email || '',
      phone: newStudentData.phone || '',
      targetCountry: newStudentData.targetCountry || Country.Australia,
      status: ApplicationStatus.Lead,
      nocStatus: NocStatus.NotApplied,
      documents: {},
      notes: '',
      noteEntries: [],
      createdAt: Date.now(),
      branchId: newStudentData.branchId,
      source: newStudentData.source || 'Walk-in',
      intakeMonth: newStudentData.intakeMonth,
      intakeYear: newStudentData.intakeYear,
      annualTuition: newStudentData.annualTuition,
      highestQualification: newStudentData.highestQualification,
      // Detailed fields
      gender: newStudentData.gender,
      dateOfBirth: newStudentData.dateOfBirth,
      passportNumber: newStudentData.passportNumber,
      nationality: newStudentData.nationality,
      gpa: newStudentData.gpa,
      testType: newStudentData.testType as any,
      testScore: newStudentData.testScore,
      educationGap: newStudentData.educationGap,
      previousRefusals: newStudentData.previousRefusals,
      borderDetails: newStudentData.borderDetails,
      ocrConfidence: newStudentData.ocrConfidence
    };
    
    const updated = [newStudent, ...students];
    await handleAsyncUpdate(updated);
    logActivity('CREATE', 'Student', `Created detailed profile for: ${newStudent.name}`);
    setIsAdding(false);
    // Reset form
    setNewStudentData({
        name: '', email: '', phone: '', targetCountry: settings?.defaultCountry || Country.Australia,
        gender: 'Male', dateOfBirth: '', passportNumber: '', nationality: 'Nepalese',
        highestQualification: 'Undergraduate (+2)', gpa: '', testType: 'None', testScore: '',
        intakeMonth: 'September', intakeYear: '2025', annualTuition: 0,
        educationGap: 0, previousRefusals: false, borderDetails: '', source: 'Walk-in',
        branchId: 'main',
        ocrConfidence: undefined
    });
    setSelectedStudentId(newStudent.id);
    showToast("Student profile created.");
  };

  const handleScanPassport = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setScanningPassport(true);
      try {
          const reader = new FileReader();
          reader.onload = async (event) => {
              const base64Data = (event.target?.result as string).split(',')[1];
              const result = await extractPassportData(base64Data, file.type);
              if (result) {
                  setNewStudentData(prev => ({
                      ...prev,
                      name: result.name || prev.name,
                      passportNumber: result.passportNumber || prev.passportNumber,
                      dateOfBirth: result.dateOfBirth || prev.dateOfBirth,
                      nationality: result.nationality || prev.nationality,
                      gender: result.gender as any || prev.gender,
                      ocrConfidence: result.confidenceScore
                  }));
                  const confPct = Math.round((result.confidenceScore || 0) * 100);
                  showToast(`✅ AI Scan successful! (${confPct}% Confidence)`);
              }
          };
          reader.readAsDataURL(file);
      } catch (err: any) {
          showToast("OCR Error: Could not read passport image.", "error");
      } finally {
          setScanningPassport(false);
          e.target.value = '';
      }
  };

  const handleDeleteDocument = async (docName: string) => {
    if (!selectedStudent || !window.confirm(`Are you sure you want to delete ${docName}?`)) return;
    
    try {
        const file = selectedStudent.documentFiles?.[docName];
        if (file) {
            await deleteFile(file.key);
        }

        const updatedDocs = { ...selectedStudent.documents };
        delete updatedDocs[docName];
        
        const updatedFiles = { ...(selectedStudent.documentFiles || {}) };
        delete updatedFiles[docName];

        const updated = { ...selectedStudent, documents: updatedDocs, documentFiles: updatedFiles };
        await handleAsyncUpdate(students.map(s => s.id === updated.id ? updated : s));
        logActivity('DELETE', 'File', `Deleted document: ${docName} for ${selectedStudent.name}`);
        showToast(`Removed ${docName}.`);
    } catch (err: any) {
        showToast("Error deleting document.", "error");
    }
  };

  const handleAddNote = async () => {
      if (!selectedStudent || !newNoteText.trim()) return;
      
      const newEntry: NoteEntry = {
          id: Date.now().toString(),
          text: newNoteText,
          type: newNoteType,
          timestamp: Date.now(),
          createdBy: getCurrentUser()?.name || 'Agent',
          isPinned: false
      };

      const updatedEntries = [newEntry, ...(selectedStudent.noteEntries || [])];
      const updated = { ...selectedStudent, noteEntries: updatedEntries };
      await handleAsyncUpdate(students.map(s => s.id === updated.id ? updated : s));
      
      setNewNoteText('');
      showToast("Note added to timeline.");
  };

  const togglePinNote = async (noteId: string) => {
      if (!selectedStudent) return;
      const updatedEntries = (selectedStudent.noteEntries || []).map(n => 
          n.id === noteId ? { ...n, isPinned: !n.isPinned } : n
      );
      const updated = { ...selectedStudent, noteEntries: updatedEntries };
      await handleAsyncUpdate(students.map(s => s.id === updated.id ? updated : s));
  };

  const deleteNote = async (noteId: string) => {
      if (!selectedStudent || !window.confirm("Remove this note permanently?")) return;
      const updatedEntries = (selectedStudent.noteEntries || []).filter(n => n.id !== noteId);
      const updated = { ...selectedStudent, noteEntries: updatedEntries };
      await handleAsyncUpdate(students.map(s => s.id === updated.id ? updated : s));
  };

  const handleDownloadBundle = async () => {
      if (!selectedStudent || isBundling) return;
      setIsBundling(true);
      try {
          const zipContent = await generatePartnerBundle(selectedStudent, settings?.agencyName || 'Agency Pro');
          const url = URL.createObjectURL(zipContent);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${selectedStudent.name.replace(/\s+/g, '_')}_Application_Pack.zip`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          logActivity('EXPORT', 'File', `Generated and downloaded application bundle for ${selectedStudent.name}`);
          showToast("Application bundle downloaded successfully!");
      } catch (err) {
          showToast("Bundle generation failed. Please check network.", "error");
      } finally {
          setIsBundling(false);
      }
  };

  const renderDocumentItem = (doc: DocRequirement, isCountrySpecific: boolean = false) => {
    if(!selectedStudent) return null;
    const status = selectedStudent.documents[doc.name] || 'Pending';
    const storedFile = selectedStudent.documentFiles?.[doc.name];
    const isUploaded = status === 'Uploaded';
    
    return (
        <div key={doc.name} className={`group p-4 flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-50 last:border-0 gap-4 transition-all ${isUploaded ? 'bg-white' : 'bg-slate-50/30'}`}>
            <div className="flex items-start space-x-3 flex-1">
                <div className={`p-2.5 rounded-xl mt-0.5 transition-colors ${isUploaded ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500'}`}>
                    {isUploaded ? <FileCheck size={20} /> : <FileText size={20} />}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center flex-wrap gap-2">
                         <p className={`text-sm font-bold truncate ${isUploaded ? 'text-slate-800' : 'text-slate-500'}`}>{doc.name}</p>
                         {isCountrySpecific && (
                             <span className="text-[9px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">Required for {selectedStudent.targetCountry}</span>
                         )}
                    </div>
                    {doc.condition && <p className="text-[10px] text-amber-600 font-bold mt-0.5 uppercase tracking-wide">⚠️ {doc.condition}</p>}
                    {storedFile ? (
                        <p className="text-[10px] text-indigo-600 font-mono mt-1 flex items-center">
                            <span className="truncate max-w-[200px]">{storedFile.filename}</span>
                            <span className="mx-1">•</span>
                            <span>{(storedFile.size / 1024).toFixed(1)} KB</span>
                        </p>
                    ) : (
                        <p className="text-[10px] text-slate-400 mt-1 italic">Waiting for upload...</p>
                    )}
                </div>
            </div>
            <div className="flex items-center space-x-2">
                {isUploaded && (
                    <>
                        <button 
                            onClick={() => window.open(storedFile?.url, '_blank')}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="View Document"
                        >
                            <Eye size={18} />
                        </button>
                        <button 
                            onClick={() => handleDeleteDocument(doc.name)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete Document"
                        >
                            <Trash2 size={18} />
                        </button>
                    </>
                )}
                <label className={`cursor-pointer p-2 rounded-xl transition-all shadow-sm ${isUploaded ? 'bg-slate-100 text-slate-500 hover:bg-indigo-100 hover:text-indigo-600' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'}`}>
                    {uploadingDoc === doc.name ? <Loader2 size={18} className="animate-spin" /> : <UploadCloud size={18} />}
                    <input type="file" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadingDoc(doc.name);
                        try {
                            const sf = await uploadFile(file, `students/${selectedStudent.id}`, getCurrentUser()?.name || 'Unknown');
                            const updatedFiles = { ...(selectedStudent.documentFiles || {}), [doc.name]: sf };
                            const updatedDocs = { ...selectedStudent.documents, [doc.name]: 'Uploaded' as DocumentStatus };
                            const updated = { ...selectedStudent, documentFiles: updatedFiles, documents: updatedDocs };
                            await handleAsyncUpdate(students.map(s => s.id === updated.id ? updated : s));
                            showToast(`Uploaded ${doc.name} successfully.`);
                        } catch (err: any) { 
                            showToast(err.message || "Failed to upload document.", "error");
                        } finally { setUploadingDoc(null); }
                    }} />
                </label>
            </div>
        </div>
    );
  };

  const filteredStudents = useMemo(() => students.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.phone.includes(searchTerm);
      const matchStatus = statusFilter === 'All' || s.status === statusFilter;
      return matchSearch && matchStatus;
  }), [students, searchTerm, statusFilter]);

  // Virtualization constants
  const CARD_HEIGHT = 192;
  const GAP = 24;
  const ITEM_FULL_HEIGHT = CARD_HEIGHT + GAP;
  
  const itemsPerRow = useMemo(() => {
    if (typeof window === 'undefined') return 3;
    if (window.innerWidth >= 1024) return 3;
    if (window.innerWidth >= 768) return 2;
    return 1;
  }, [loading, selectedStudentId]);

  const virtualItems = useMemo(() => {
    const rowCount = Math.ceil(filteredStudents.length / itemsPerRow);
    const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_FULL_HEIGHT) - 2);
    const endIndex = Math.min(rowCount, Math.ceil((scrollTop + containerHeight) / ITEM_FULL_HEIGHT) + 2);
    
    return {
      rows: Array.from({ length: endIndex - startIndex }, (_, i) => startIndex + i),
      totalHeight: rowCount * ITEM_FULL_HEIGHT,
      offset: startIndex * ITEM_FULL_HEIGHT
    };
  }, [filteredStudents, scrollTop, containerHeight, itemsPerRow]);

  const allSelectedDocs = selectedStudent ? getRequiredDocuments(selectedStudent) : [];
  const categories = Array.from(new Set(allSelectedDocs.map(d => d.category)));
  const completedDocsCount = useMemo(() => selectedStudent ? allSelectedDocs.filter(d => selectedStudent.documents[d.name] === 'Uploaded').length : 0, [selectedStudent, allSelectedDocs]);
  const isFullyDocumented = useMemo(() => selectedStudent && allSelectedDocs.length > 0 && completedDocsCount === allSelectedDocs.length, [selectedStudent, allSelectedDocs, completedDocsCount]);

  const getNoteTypeStyles = (type: NoteType) => {
    switch(type) {
      case 'Counselling': return { bg: 'bg-indigo-50', text: 'text-indigo-700', icon: <MessageSquare size={14}/> };
      case 'FollowUp': return { bg: 'bg-blue-50', text: 'text-blue-700', icon: <Calendar size={14}/> };
      case 'Warning': return { bg: 'bg-rose-50', text: 'text-rose-700', icon: <TriangleAlert size={14}/> };
      case 'Financial': return { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: <DollarSign size={14}/> };
      default: return { bg: 'bg-slate-50', text: 'text-slate-700', icon: <StickyNote size={14}/> };
    }
  };

  const currencySymbol = settings?.currency || 'NPR';

  return (
    <div className="flex h-full bg-slate-50 relative">
      
      {/* Premium Toast Implementation */}
      {toast && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 duration-300">
              <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 border ${
                  toast.type === 'error' ? 'bg-rose-600 border-rose-500 text-white' : 'bg-emerald-600 border-emerald-500 text-white'
              }`}>
                  <div className="bg-white/20 p-1.5 rounded-lg">
                      {toast.type === 'error' ? <ShieldAlert size={20} /> : <CheckCircle2 size={20} />}
                  </div>
                  <p className="font-bold text-sm tracking-tight">{toast.msg}</p>
                  <button onClick={() => setToast(null)} className="ml-4 opacity-50 hover:opacity-100 transition-opacity">
                      <X size={18} />
                  </button>
              </div>
          </div>
      )}

      {/* List View */}
      <div className={`w-full flex flex-col bg-white ${selectedStudentId ? 'hidden' : 'flex'}`}>
        <div className="p-6 border-b border-slate-100 space-y-4 max-w-7xl mx-auto w-full">
          <div className="flex justify-between items-center">
             <h1 className="text-2xl font-bold text-slate-900">Student Manager</h1>
             <button onClick={() => setIsAdding(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center shadow-md transition-all active:scale-95"><Plus size={18} className="mr-2" /> Add Student</button>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
             <div className="relative flex-1">
               <Search className="absolute left-3 top-3 text-slate-400" size={18} />
               <input 
                type="text" 
                placeholder="Search students by name or phone..." 
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
               />
             </div>
             <div className="flex gap-2">
                <select 
                  className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">All Statuses</option>
                  {Object.values(ApplicationStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
             </div>
          </div>
        </div>

        {/* Scrollable Container with Virtualization */}
        <div 
          ref={containerRef}
          onScroll={onScroll}
          className="flex-1 overflow-y-auto p-6 bg-slate-50 relative custom-scrollbar"
        >
          {loading ? (
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 9 }).map((_, i) => <StudentSkeleton key={i} />)}
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <User size={48} className="mb-2 opacity-20" />
              <p className="font-bold">No students found</p>
              <p className="text-sm">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto" style={{ height: virtualItems.totalHeight, position: 'relative' }}>
              <div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                style={{ transform: `translateY(${virtualItems.offset}px)` }}
              >
                {virtualItems.rows.map(rowIndex => {
                  const rowItems = filteredStudents.slice(rowIndex * itemsPerRow, (rowIndex + 1) * itemsPerRow);
                  return rowItems.map(student => (
                    <StudentCard 
                      key={student.id} 
                      student={student} 
                      onClick={setSelectedStudentId} 
                    />
                  ));
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detailed View */}
      {selectedStudent && (
          <div className={`w-full flex flex-col bg-slate-50 ${selectedStudentId ? 'flex' : 'hidden'}`}>
             <div className="bg-white border-b p-6 flex justify-between items-center sticky top-0 z-30 shadow-sm">
                 <div className="flex items-center">
                    <button onClick={() => setSelectedStudentId(null)} className="mr-4 p-2 hover:bg-slate-100 rounded-full transition-colors"><ArrowLeft size={24}/></button>
                    <div><h2 className="text-xl font-bold text-slate-900">{selectedStudent.name}</h2><p className="text-xs text-slate-500">{selectedStudent.email || 'No email'}</p></div>
                 </div>
                 <div className="flex items-center space-x-3">
                    {activeTab === 'financials' && (
                        <button 
                            onClick={() => setIsCreatingInvoice(true)}
                            className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold flex items-center shadow-lg hover:bg-emerald-700 active:scale-95 transition-all"
                        >
                            <Plus size={18} className="mr-2"/> Create Invoice
                        </button>
                    )}
                    <button className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold flex items-center shadow-lg hover:bg-indigo-700 active:scale-95" onClick={handleSaveProfile} disabled={isSaving}>
                        {isSaving ? <Loader2 size={18} className="animate-spin mr-2"/> : <Save size={18} className="mr-2"/>} Save Profile
                    </button>
                 </div>
             </div>
             <div className="bg-white border-b px-6 flex space-x-6">
                 {['documents', 'profile', 'risk', 'financials', 'notes'].map(tab => (
                     <button key={tab} onClick={() => setActiveTab(tab as any)} className={`py-4 border-b-2 text-sm font-bold uppercase transition-colors ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>{tab}</button>
                 ))}
             </div>
             <div className="flex-1 overflow-y-auto">
                 {activeTab === 'profile' && (
                     <div className="p-8 overflow-y-auto bg-slate-50 min-h-full">
                         <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                             <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-200 space-y-8">
                                 <div>
                                     <h3 className="text-xl font-bold text-slate-800">Student Profile Information</h3>
                                     <p className="text-sm text-slate-500 mt-1">Manage core applicant identity, academics, and risk factors.</p>
                                 </div>
                                 
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                     <div className="space-y-1">
                                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                         <input className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" value={editFormData.email || ''} onChange={e => setEditFormData({...editFormData, email: e.target.value})} />
                                     </div>
                                     <div className="space-y-1">
                                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                                         <input className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" value={editFormData.phone || ''} onChange={e => setEditFormData({...editFormData, phone: e.target.value})} />
                                     </div>
                                     <div className="space-y-1">
                                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Passport Number</label>
                                         <input className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" value={editFormData.passportNumber || ''} onChange={e => setEditFormData({...editFormData, passportNumber: e.target.value})} />
                                     </div>
                                     <div className="space-y-1">
                                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Date of Birth</label>
                                         <input type="date" className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" value={editFormData.dateOfBirth || ''} onChange={e => setEditFormData({...editFormData, dateOfBirth: e.target.value})} />
                                     </div>

                                     <div className="space-y-1">
                                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Cumulative GPA / Score</label>
                                         <input type="text" placeholder="e.g. 3.65 or 80%" className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-bold" value={editFormData.gpa || ''} onChange={e => setEditFormData({...editFormData, gpa: e.target.value})} />
                                     </div>
                                     <div className="space-y-1">
                                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Education Gap (Years)</label>
                                         <input type="number" className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" value={editFormData.educationGap || ''} onChange={e => setEditFormData({...editFormData, educationGap: parseInt(e.target.value) || 0})} />
                                     </div>

                                     <div className="space-y-1">
                                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">English Test Type</label>
                                         <select className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" value={editFormData.testType || 'None'} onChange={e => setEditFormData({...editFormData, testType: e.target.value as any})}>
                                             <option value="None">None</option>
                                             <option value="IELTS">IELTS</option>
                                             <option value="PTE">PTE</option>
                                             <option value="TOEFL">TOEFL</option>
                                         </select>
                                     </div>
                                     <div className="space-y-1">
                                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Target Score</label>
                                         <input className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" placeholder="e.g. 7.5 or 79" value={editFormData.targetScore || ''} onChange={e => setEditFormData({...editFormData, targetScore: e.target.value})} />
                                     </div>

                                     <div className="space-y-1">
                                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Financial Capacity</label>
                                         <select 
                                            className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-bold" 
                                            value={editFormData.financialCap || 'Medium'} 
                                            onChange={e => setEditFormData({...editFormData, financialCap: e.target.value as any})}
                                         >
                                             <option value="Low">Low (Budget Friendly)</option>
                                             <option value="Medium">Medium (Standard)</option>
                                             <option value="Satisfactory">Satisfactory (Standard)</option>
                                             <option value="High">High (Strong)</option>
                                         </select>
                                     </div>

                                     <div className="space-y-1">
                                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Previous Visa Refusals?</label>
                                         <select className={`w-full p-4 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-bold ${editFormData.previousRefusals ? 'bg-red-50 text-red-600' : 'bg-slate-50'}`} value={editFormData.previousRefusals ? 'Yes' : 'No'} onChange={e => setEditFormData({...editFormData, previousRefusals: e.target.value === 'Yes'})}>
                                             <option value="No">No (Clean History)</option>
                                             <option value="Yes">Yes (Has Refusals)</option>
                                         </select>
                                     </div>

                                     {editFormData.previousRefusals && (
                                         <div className="md:col-span-2 space-y-1 animate-in fade-in slide-in-from-top-2">
                                             <label className="text-[10px] font-bold text-rose-500 uppercase tracking-widest ml-1 flex items-center">
                                                 <TriangleAlert size={10} className="mr-1"/> Refusal Details (Required for Risk Assessment)
                                             </label>
                                             <textarea 
                                                 className="w-full p-4 border border-rose-200 rounded-2xl bg-rose-50/30 focus:bg-white focus:ring-2 focus:ring-rose-500/20 outline-none transition-all text-sm h-24"
                                                 placeholder="List countries, years, and specific reasons for previous refusals..."
                                                 value={editFormData.borderDetails || ''}
                                                 onChange={e => setEditFormData({...editFormData, borderDetails: e.target.value})}
                                             />
                                         </div>
                                     )}

                                     <div className="space-y-1">
                                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nationality</label>
                                         <input className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" value={editFormData.nationality || ''} onChange={e => setEditFormData({...editFormData, nationality: e.target.value})} />
                                     </div>

                                     <div className="space-y-1">
                                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Desired Country</label>
                                         <select 
                                            className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" 
                                            value={editFormData.targetCountry || Country.Australia} 
                                            onChange={e => setEditFormData({...editFormData, targetCountry: e.target.value as Country})}
                                         >
                                             {Object.values(Country).map(c => <option key={c} value={c}>{c}</option>)}
                                         </select>
                                     </div>
                                 </div>

                                 {/* Partner Assignment & Financials */}
                                 <div className="pt-8 border-t border-slate-100">
                                     <h4 className="flex items-center text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4"><Landmark size={16} className="mr-2"/> Partner & Financial Analysis</h4>
                                     <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200">
                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                             <div className="space-y-1">
                                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigned University / Partner</label>
                                                 <div className="relative">
                                                     <Building className="absolute left-4 top-4 text-slate-300" size={18} />
                                                     <select 
                                                        className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-2xl bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-bold text-slate-700"
                                                        value={editFormData.assignedPartnerId || ''}
                                                        onChange={handlePartnerChange}
                                                     >
                                                         <option value="">-- Select Partner --</option>
                                                         {partners.map(p => <option key={p.id} value={p.id}>{p.name} ({p.commissionRate}%)</option>)}
                                                     </select>
                                                 </div>
                                                 <p className="text-[10px] text-slate-400 mt-1 font-medium italic">Commission rates are configured in the Partners Hub.</p>
                                             </div>
                                             
                                             <div className="space-y-1">
                                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Est. Annual Tuition ({currencySymbol})</label>
                                                 <div className="relative">
                                                     <Bank className="absolute left-4 top-4 text-slate-300" size={18} />
                                                     <input 
                                                        type="number"
                                                        className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-2xl bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-black text-slate-800"
                                                        value={editFormData.annualTuition || 0}
                                                        onChange={e => {
                                                            const tuition = parseFloat(e.target.value) || 0;
                                                            const partner = partners.find(p => p.id === editFormData.assignedPartnerId);
                                                            const comm = partner ? (tuition * partner.commissionRate) / 100 : 0;
                                                            setEditFormData({ ...editFormData, annualTuition: tuition, commissionAmount: comm });
                                                        }}
                                                     />
                                                 </div>
                                             </div>
                                         </div>

                                         <div className="mt-8 pt-8 border-t border-slate-200/60 flex flex-col md:flex-row justify-between items-center gap-6">
                                              <div className="flex items-center space-x-4">
                                                  <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100">
                                                      <Sparkles size={20}/>
                                                  </div>
                                                  <div>
                                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Projected Success Revenue</p>
                                                      <p className="text-2xl font-black text-indigo-600 font-mono tracking-tight">
                                                          {currencySymbol} {editFormData.commissionAmount?.toLocaleString() || '0.00'}
                                                      </p>
                                                  </div>
                                              </div>
                                              <div className="text-right">
                                                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Real-time Calculation</span>
                                                  <p className="text-xs font-bold text-slate-400 mt-1">Based on {partners.find(p => p.id === editFormData.assignedPartnerId)?.commissionRate || 0}% Agency Agreement</p>
                                              </div>
                                         </div>
                                     </div>
                                 </div>

                                 {/* Government Clearances Integration */}
                                 <div className="pt-8 border-t border-slate-100">
                                     <h4 className="flex items-center text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4"><Landmark size={16} className="mr-2"/> Government Clearances</h4>
                                     <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                         <div className="flex items-center justify-between">
                                             <div>
                                                 <p className="text-sm font-bold text-slate-800">Applied for MoEST NOC?</p>
                                                 <p className="text-xs text-slate-500">Choosing 'NO' will flag this student in the Operations NOC Tracker for agency assistance.</p>
                                             </div>
                                             <div className="flex bg-white p-1 rounded-xl border border-slate-200">
                                                 <button 
                                                    onClick={() => setEditFormData({...editFormData, nocStatus: NocStatus.Applied})} 
                                                    className={`px-6 py-2 text-xs font-bold rounded-lg transition-all ${editFormData.nocStatus !== NocStatus.NotApplied ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                                                 >
                                                     YES
                                                 </button>
                                                 <button 
                                                    onClick={() => setEditFormData({...editFormData, nocStatus: NocStatus.NotApplied})} 
                                                    className={`px-6 py-2 text-xs font-bold rounded-lg transition-all ${editFormData.nocStatus === NocStatus.NotApplied ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                                                 >
                                                     NO
                                                 </button>
                                             </div>
                                         </div>
                                     </div>
                                 </div>

                                 <div className="pt-6 flex justify-end">
                                     <button className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center shadow-lg hover:bg-indigo-700 transition-all" onClick={handleSaveProfile} disabled={isSaving}>
                                         {isSaving ? <Loader2 size={18} className="animate-spin mr-2"/> : <Save size={18} className="mr-2"/>}
                                         Update Student Record
                                     </button>
                                 </div>
                             </div>
                         </div>
                     </div>
                 )}
                 {activeTab === 'risk' && (
                     <div className="p-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
                         <div className="flex justify-between items-end mb-8">
                             <div>
                                 <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center">
                                     <BrainCircuit className="mr-3 text-indigo-600" size={32} /> AI Risk Assessment
                                 </h2>
                                 <p className="text-slate-500 font-medium mt-1">Predictive analysis based on immigration data and student profile markers.</p>
                             </div>
                             {selectedStudent.riskAnalysis && (
                                 <button 
                                    onClick={handleRunRiskAnalysis}
                                    disabled={analyzingRisk}
                                    className="bg-white border border-slate-200 text-indigo-600 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center hover:bg-indigo-50 transition-all"
                                 >
                                     {analyzingRisk ? <Loader2 size={16} className="animate-spin mr-2"/> : <RefreshCcw size={16} className="mr-2"/>}
                                     Re-Analyze Profile
                                 </button>
                             )}
                         </div>

                         {!selectedStudent.riskAnalysis ? (
                             <div className="bg-white rounded-[3rem] p-12 shadow-sm border border-slate-200 flex flex-col items-center text-center">
                                 <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                                     <Sparkles size={48} className="text-indigo-600 animate-pulse" />
                                 </div>
                                 <h3 className="text-2xl font-black text-slate-800">No Assessment Data</h3>
                                 <p className="text-slate-500 mt-3 mb-10 max-w-lg leading-relaxed">
                                     Our AI has not yet audited this applicant's profile. Generate a report to see approval probability, identified red flags, and tailored document recommendations.
                                 </p>
                                 <button 
                                    onClick={handleRunRiskAnalysis}
                                    disabled={analyzingRisk}
                                    className="bg-slate-900 text-white px-12 py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-600 transition-all flex items-center active:scale-95 disabled:opacity-50"
                                 >
                                     {analyzingRisk ? <Loader2 size={20} className="animate-spin mr-3"/> : <BrainCircuit size={20} className="mr-3"/>}
                                     Start AI Profile Audit
                                 </button>
                             </div>
                         ) : (
                             <div className="space-y-8 pb-20">
                                 {/* Summary Grid */}
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                     <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-indigo-300 transition-all">
                                         <div>
                                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Assessment Status</p>
                                            <div className="flex items-center space-x-4">
                                                <div className={`p-4 rounded-3xl ${
                                                    parsedRiskReport?.score?.toLowerCase().includes('low') ? 'bg-emerald-50 text-emerald-600' :
                                                    parsedRiskReport?.score?.toLowerCase().includes('high') ? 'bg-rose-50 text-rose-600' :
                                                    'bg-amber-50 text-amber-600'
                                                }`}>
                                                    <ShieldCheck size={32} />
                                                </div>
                                                <div>
                                                    <h4 className="text-3xl font-black text-slate-900">{parsedRiskReport?.score}</h4>
                                                    <p className="text-xs font-bold text-slate-400 uppercase mt-1">Calculated Risk Level</p>
                                                </div>
                                            </div>
                                         </div>
                                         <div className="mt-8 pt-6 border-t border-slate-50 flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                             <Clock size={12} className="mr-2"/> Last Update: {new Date(selectedStudent.riskAnalysis.date).toLocaleDateString()}
                                         </div>
                                     </div>

                                     <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200 relative overflow-hidden">
                                         <div className="relative z-10">
                                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Approval Probability</p>
                                            <h4 className="text-6xl font-black tracking-tighter text-indigo-400">{parsedRiskReport?.probability}</h4>
                                            <div className="mt-6 h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.6)] transition-all duration-1000" 
                                                    style={{ width: parsedRiskReport?.probability || '0%' }}
                                                />
                                            </div>
                                            <p className="text-[10px] mt-4 font-bold uppercase tracking-tighter text-slate-500">Based on {selectedStudent.targetCountry} immigration flow v2.4</p>
                                         </div>
                                         <TrendingUp size={200} className="absolute -bottom-10 -right-10 text-white/5 pointer-events-none" />
                                     </div>
                                 </div>

                                 {/* Detailed Breakdown */}
                                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                     <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                                         <div className="flex items-center space-x-2 mb-6">
                                             <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><Trophy size={18}/></div>
                                             <h5 className="font-black text-slate-800 text-sm uppercase tracking-widest">Key Strengths</h5>
                                         </div>
                                         <ul className="space-y-4">
                                             {parsedRiskReport?.strengths.map((s, i) => (
                                                 <li key={i} className="flex items-start text-sm text-slate-600 font-medium">
                                                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 mr-3 shrink-0" />
                                                     {s}
                                                 </li>
                                             ))}
                                             {parsedRiskReport?.strengths.length === 0 && <p className="text-xs text-slate-400 italic">No significant strengths identified.</p>}
                                         </ul>
                                     </div>

                                     <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                                         <div className="flex items-center space-x-2 mb-6">
                                             <div className="p-2 bg-rose-50 text-rose-600 rounded-xl"><AlertTriangle size={18}/></div>
                                             <h5 className="font-black text-slate-800 text-sm uppercase tracking-widest">Risk Factors</h5>
                                         </div>
                                         <ul className="space-y-4">
                                             {parsedRiskReport?.factors.map((f, i) => (
                                                 <li key={i} className="flex items-start text-sm text-slate-600 font-medium">
                                                     <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 mr-3 shrink-0" />
                                                     {f}
                                                 </li>
                                             ))}
                                             {parsedRiskReport?.factors.length === 0 && <p className="text-xs text-slate-400 italic">No major red flags detected.</p>}
                                         </ul>
                                     </div>

                                     <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm bg-indigo-50/20">
                                         <div className="flex items-center space-x-2 mb-6">
                                             <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl"><Pencil size={18}/></div>
                                             <h5 className="font-black text-slate-800 text-sm uppercase tracking-widest">Recommendations</h5>
                                         </div>
                                         <ul className="space-y-4">
                                             {parsedRiskReport?.recommendations.map((r, i) => (
                                                 <li key={i} className="flex items-start text-sm text-slate-800 font-bold bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm">
                                                     <ChevronRight size={16} className="mr-2 mt-0.5 text-indigo-500 shrink-0" />
                                                     {r}
                                                 </li>
                                             ))}
                                         </ul>
                                     </div>
                                 </div>

                                 <div className="p-6 bg-slate-900/5 rounded-3xl border border-dashed border-slate-200 text-center">
                                     <p className="text-[11px] text-slate-400 font-bold italic">Disclaimer: AI output is for advisory purposes only. Final decisions rest with embassy case officers.</p>
                                 </div>
                             </div>
                         )}
                     </div>
                 )}
                 {activeTab === 'documents' && (
                    <div className="p-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
                        {/* Stats Dashboard */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                             <div className="bg-indigo-600 text-white p-6 rounded-3xl shadow-xl shadow-indigo-100 flex flex-col justify-between">
                                 <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Total Requirements</p>
                                 <h2 className="text-4xl font-black mt-2">{allSelectedDocs.length}</h2>
                                 <div className="mt-4 flex items-center space-x-2 bg-white/10 p-2 rounded-xl">
                                     <ShieldCheck size={16} className="text-indigo-200"/>
                                     <span className="text-[10px] font-bold">Compliant for {selectedStudent.targetCountry}</span>
                                 </div>
                             </div>
                             <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Uploaded Files</p>
                                 <h2 className="text-4xl font-black mt-2 text-emerald-600">
                                     {completedDocsCount}
                                 </h2>
                                 <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
                                     <div 
                                        className="h-full bg-emerald-500 transition-all duration-1000" 
                                        style={{ width: `${(completedDocsCount / allSelectedDocs.length) * 100}%` }}
                                     ></div>
                                 </div>
                             </div>
                             <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Readiness Status</p>
                                 <h2 className={`text-4xl font-black mt-2 ${isFullyDocumented ? 'text-indigo-600' : 'text-slate-400'}`}>
                                     {Math.round((completedDocsCount / allSelectedDocs.length) * 100)}%
                                 </h2>
                                 <p className={`text-[10px] font-bold mt-4 uppercase ${isFullyDocumented ? 'text-indigo-600' : 'text-rose-400'}`}>
                                     {isFullyDocumented ? 'Application Launch Ready' : 'Submission Blocked'}
                                 </p>
                             </div>
                        </div>

                        {/* PREMIUM AUDIT & LAUNCH TOOLS */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                            {/* AI COMPLIANCE AUDITOR */}
                            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm group hover:border-indigo-400 transition-all">
                                <div className="flex items-center space-x-4 mb-4">
                                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                        <SearchCode size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-800">AI Compliance Auditor</h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Scan for Inconsistencies</p>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed mb-6">Runs a deep check across profile data and documents to find errors or missing context (e.g. gaps without proof).</p>
                                <button 
                                    onClick={handleRunDocumentAudit}
                                    disabled={isAuditing}
                                    className="w-full py-3 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-600 hover:text-white transition-all active:scale-95 flex items-center justify-center"
                                >
                                    {isAuditing ? <Loader2 size={14} className="animate-spin mr-2"/> : <BrainCircuit size={14} className="mr-2"/>}
                                    {isAuditing ? 'Auditing...' : 'Start Integrity Check'}
                                </button>
                            </div>

                            {/* BUNDLER */}
                            <div className={`p-8 rounded-[2.5rem] border transition-all duration-500 flex flex-col justify-between ${
                                isFullyDocumented 
                                ? 'bg-indigo-600 border-indigo-700 shadow-xl shadow-indigo-100 text-white' 
                                : 'bg-slate-50 border-slate-200 opacity-75'
                            }`}>
                                <div>
                                    <div className="flex items-center space-x-4 mb-4">
                                        <div className={`p-4 rounded-2xl shadow-sm ${isFullyDocumented ? 'bg-white/10 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                            <Package size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-black">Application Bundler</h3>
                                            <p className={`text-[10px] font-black uppercase tracking-widest ${isFullyDocumented ? 'text-indigo-200' : 'text-slate-400'}`}>Ready for Export</p>
                                        </div>
                                    </div>
                                    <p className={`text-xs leading-relaxed mb-6 ${isFullyDocumented ? 'text-indigo-100' : 'text-slate-400'}`}>Compiles all verified documents into a professional ZIP file for portal submission.</p>
                                </div>
                                
                                <button 
                                    onClick={handleDownloadBundle}
                                    disabled={!isFullyDocumented || isBundling}
                                    className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center ${
                                        isFullyDocumented 
                                        ? 'bg-white text-indigo-900 hover:bg-indigo-50 shadow-lg' 
                                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    }`}
                                >
                                    {isBundling ? <Loader2 size={14} className="animate-spin mr-2" /> : <Download size={14} className="mr-2" />}
                                    {isBundling ? 'Compiling...' : 'Export ZIP Bundle'}
                                </button>
                            </div>
                        </div>

                        {/* AI Audit Findings Display */}
                        {selectedStudent.documentAudit && (
                            <div className="animate-in slide-in-from-top-4 duration-500 mb-10">
                                <div className="flex items-center justify-between px-2 mb-4">
                                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-[0.1em] flex items-center">
                                        <ShieldCheck className="mr-2 text-indigo-600" size={18}/> Compliance Findings Report
                                    </h4>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Last Run: {new Date(selectedStudent.documentAudit.date).toLocaleTimeString()}</span>
                                </div>
                                <div className="bg-slate-900 rounded-[2.5rem] p-8 space-y-4 shadow-xl">
                                    {selectedStudent.documentAudit.findings.map((finding, i) => (
                                        <div key={i} className={`flex items-start space-x-4 p-4 rounded-2xl border ${
                                            finding.type === 'Critical' ? 'bg-rose-500/10 border-rose-500/20 text-rose-200' :
                                            finding.type === 'Warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-200' :
                                            'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
                                        }`}>
                                            <div className="shrink-0 mt-0.5">
                                                {finding.type === 'Critical' ? <AlertTriangle size={18}/> : finding.type === 'Warning' ? <Info size={18}/> : <CheckCircle2 size={18}/>}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{finding.category}</p>
                                                <p className="text-sm font-medium mt-1">{finding.message}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {selectedStudent.documentAudit.findings.length === 0 && (
                                        <div className="py-8 text-center text-slate-500 italic">
                                            No compliance issues found. The file looks perfect!
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Document Categories */}
                        <div className="space-y-8 pb-20">
                            {categories.map(cat => {
                                const catDocs = allSelectedDocs.filter(d => d.category === cat);
                                return (
                                    <div key={cat} className="space-y-4">
                                        <div className="flex items-center space-x-2 px-2">
                                            <div className="w-1 h-4 bg-indigo-600 rounded-full"></div>
                                            <h3 className="font-black text-slate-800 text-xs uppercase tracking-[0.2em]">{cat}</h3>
                                            <span className="text-[10px] font-bold text-slate-400">({catDocs.length})</span>
                                        </div>
                                        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                                            <div className="divide-y divide-slate-100">
                                                {catDocs.map(doc => renderDocumentItem(doc, (doc as any).isCountrySpecific))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                 )}
                 {activeTab === 'financials' && (
                    <div className="p-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-2 space-y-8">
                         {/* Student Financial Summary */}
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Receipt size={20}/></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Billed</span>
                                </div>
                                <h4 className="text-2xl font-black text-slate-900">{currencySymbol} {studentInvoices.reduce((sum, inv) => sum + inv.amount, 0).toLocaleString()}</h4>
                                <p className="text-xs text-slate-400 mt-1">{studentInvoices.length} Invoices generated</p>
                            </div>
                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><CheckCircle2 size={20}/></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Collected</span>
                                </div>
                                <h4 className="text-2xl font-black text-emerald-600">{currencySymbol} {studentInvoices.filter(i => i.status === 'Paid').reduce((sum, inv) => sum + inv.amount, 0).toLocaleString()}</h4>
                                <p className="text-xs text-slate-400 mt-1">Realized revenue</p>
                            </div>
                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><Clock size={20}/></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Outstanding</span>
                                </div>
                                <h4 className="text-2xl font-black text-amber-600">{currencySymbol} {studentInvoices.filter(i => i.status === 'Pending').reduce((sum, inv) => sum + inv.amount, 0).toLocaleString()}</h4>
                                <p className="text-xs text-slate-400 mt-1">Waiting for payment</p>
                            </div>
                         </div>

                         {/* Invoice Ledger for Student */}
                         <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                             <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                 <h3 className="font-bold text-slate-800 text-lg flex items-center"><DollarSign size={20} className="mr-2 text-indigo-600"/> Ledger & Claims</h3>
                                 <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Audit Verified</span>
                             </div>
                             <div className="overflow-x-auto">
                                 <table className="w-full text-left">
                                     <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                         <tr>
                                             <th className="px-8 py-4">Invoice #</th>
                                             <th className="px-8 py-4">Description</th>
                                             <th className="px-8 py-4">Amount</th>
                                             <th className="px-8 py-4">Date</th>
                                             <th className="px-8 py-4">Status</th>
                                             <th className="px-8 py-4 text-right">Actions</th>
                                         </tr>
                                     </thead>
                                     <tbody className="divide-y divide-slate-50">
                                         {studentInvoices.map(inv => (
                                             <tr key={inv.id} className="hover:bg-indigo-50/20 transition-colors">
                                                 <td className="px-8 py-5 font-mono text-xs font-bold text-indigo-600">{inv.invoiceNumber}</td>
                                                 <td className="px-8 py-5 text-sm font-medium text-slate-700">{inv.description}</td>
                                                 <td className="px-8 py-5 text-sm font-black text-slate-900">{currencySymbol} {inv.amount.toLocaleString()}</td>
                                                 <td className="px-8 py-5 text-xs text-slate-400 font-medium">{new Date(inv.date).toLocaleDateString()}</td>
                                                 <td className="px-8 py-5">
                                                     <button 
                                                        onClick={() => handleToggleInvoiceStatus(inv.id)}
                                                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border transition-all ${
                                                            inv.status === 'Paid' 
                                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                                            : 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100'
                                                        }`}
                                                     >
                                                         {inv.status}
                                                     </button>
                                                 </td>
                                                 <td className="px-8 py-5 text-right space-x-2">
                                                     <button 
                                                        onClick={() => generateReceipt(inv, settings)}
                                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                                        title="Print Receipt"
                                                     >
                                                         <Printer size={18}/>
                                                     </button>
                                                 </td>
                                             </tr>
                                         ))}
                                         {studentInvoices.length === 0 && (
                                             <tr>
                                                 <td colSpan={6} className="px-8 py-20 text-center text-slate-300">
                                                     <Receipt size={48} className="mx-auto mb-2 opacity-10"/>
                                                     <p className="font-bold">No invoices generated for this student.</p>
                                                     <button 
                                                        onClick={() => setIsCreatingInvoice(true)}
                                                        className="text-indigo-600 text-xs font-bold underline mt-2"
                                                     >
                                                         Create the first one
                                                     </button>
                                                 </td>
                                             </tr>
                                         )}
                                     </tbody>
                                 </table>
                             </div>
                         </div>
                    </div>
                 )}
                 {activeTab === 'notes' && (
                    <div className="p-8 max-w-5xl mx-auto flex flex-col h-full space-y-8 animate-in fade-in slide-in-from-bottom-2">
                        {/* Note Input Section */}
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                                    <StickyNote className="mr-2 text-indigo-600" size={20}/> Internal Log Entry
                                </h3>
                                <div className="flex space-x-2">
                                    {(['General', 'Counselling', 'FollowUp', 'Warning', 'Financial'] as NoteType[]).map(type => {
                                        const styles = getNoteTypeStyles(type);
                                        return (
                                            <button 
                                                key={type}
                                                onClick={() => setNewNoteType(type)}
                                                className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all flex items-center space-x-1 ${
                                                    newNoteType === type 
                                                    ? `${styles.bg} ${styles.text} ring-2 ring-indigo-500/20` 
                                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                                }`}
                                            >
                                                {styles.icon}
                                                <span>{type}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            
                            <div className="relative">
                                <textarea 
                                    className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-slate-700 min-h-[120px] placeholder:text-slate-400 text-sm leading-relaxed"
                                    placeholder={`Type your ${newNoteType.toLowerCase()} note here...`}
                                    value={newNoteText}
                                    onChange={e => setNewNoteText(e.target.value)}
                                />
                                <div className="absolute bottom-4 right-4">
                                    <button 
                                        disabled={!newNoteText.trim()}
                                        onClick={handleAddNote}
                                        className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center"
                                    >
                                        <Send size={16} className="mr-2"/> Post Note
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Filter & Search */}
                        <div className="flex justify-between items-center px-2">
                            <div className="flex space-x-2 overflow-x-auto pb-1">
                                {(['All', 'General', 'Counselling', 'FollowUp', 'Warning', 'Financial'] as const).map(f => (
                                    <button 
                                        key={f} 
                                        onClick={() => setNoteFilter(f)}
                                        className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition-all border ${
                                            noteFilter === f 
                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                                            : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300'
                                        }`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Note Timeline */}
                        <div className="relative pl-8 space-y-6">
                            <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-slate-200"></div>
                            
                            {(selectedStudent.noteEntries || [])
                                .filter(n => noteFilter === 'All' || n.type === noteFilter)
                                .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || b.timestamp - a.timestamp)
                                .map(note => {
                                    const styles = getNoteTypeStyles(note.type);
                                    return (
                                        <div key={note.id} className={`relative group animate-in slide-in-from-left-4 duration-300 ${note.isPinned ? 'z-10' : ''}`}>
                                            {/* Timeline Node */}
                                            <div className={`absolute -left-[25px] top-4 w-4 h-4 rounded-full border-2 border-white shadow-sm ring-4 ring-slate-50 ${note.isPinned ? 'bg-amber-400' : 'bg-slate-300'}`}></div>
                                            
                                            <div className={`p-6 rounded-3xl shadow-sm border transition-all ${
                                                note.isPinned 
                                                ? 'bg-amber-50 border-amber-200 shadow-amber-100 ring-2 ring-amber-500/10' 
                                                : 'bg-white border-slate-100 hover:border-indigo-200'
                                            }`}>
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex items-center space-x-3">
                                                        <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase flex items-center space-x-1 ${styles.bg} ${styles.text}`}>
                                                            {styles.icon}
                                                            <span>{note.type}</span>
                                                        </div>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">• By {note.createdBy}</span>
                                                        <span className="text-[10px] font-medium text-slate-300">• {new Date(note.timestamp).toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-all">
                                                        <button 
                                                            onClick={() => togglePinNote(note.id)}
                                                            className={`p-2 rounded-lg transition-colors ${note.isPinned ? 'text-amber-500 bg-amber-100' : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'}`}
                                                            title={note.isPinned ? "Unpin" : "Pin Note"}
                                                        >
                                                            <Pin size={16} fill={note.isPinned ? "currentColor" : "none"}/>
                                                        </button>
                                                        <button 
                                                            onClick={() => deleteNote(note.id)}
                                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete Entry"
                                                        >
                                                            <Trash2 size={16}/>
                                                        </button>
                                                    </div>
                                                </div>
                                                
                                                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                                    {note.text}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}

                            {!(selectedStudent.noteEntries || []).length && (
                                <div className="py-20 text-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
                                    <Info size={48} className="mx-auto mb-4 opacity-20"/>
                                    <p className="font-bold">No entries in timeline yet.</p>
                                    <p className="text-xs">Notes are private to consultants and will not be seen by students.</p>
                                </div>
                            )}
                        </div>
                    </div>
                 )}
             </div>
          </div>
      )}

      {/* CREATE INVOICE MODAL */}
      {isCreatingInvoice && selectedStudent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
              <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-md overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
                  <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                      <div>
                          <h3 className="font-bold text-xl text-slate-800 flex items-center">
                              <DollarSign size={22} className="mr-3 text-indigo-600"/> Generate Invoice
                          </h3>
                          <p className="text-xs text-slate-500 font-medium mt-1">Applicant: {selectedStudent.name}</p>
                      </div>
                      <button onClick={() => setIsCreatingInvoice(false)} className="text-slate-400 hover:text-slate-900 bg-white p-2 rounded-xl shadow-sm border border-slate-100 transition-all active:scale-90"><X size={20}/></button>
                  </div>
                  
                  <div className="p-8 space-y-6">
                      <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 flex flex-col items-center">
                          <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Payable Amount ({currencySymbol})</label>
                          <div className="relative w-full">
                              <input 
                                  type="number"
                                  autoFocus
                                  className="w-full bg-transparent text-4xl font-black text-indigo-700 text-center outline-none"
                                  placeholder="0.00"
                                  value={newInvoiceAmount}
                                  onChange={e => setNewInvoiceAmount(e.target.value)}
                              />
                          </div>
                      </div>

                      <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Service Description</label>
                          <select 
                              className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-bold text-slate-700"
                              value={newInvoiceDesc}
                              onChange={e => setNewInvoiceDesc(e.target.value)}
                          >
                              <option value="Consultation Fee">Consultation Fee</option>
                              <option value="Service Fee">Service Fee</option>
                              <option value="Visa Processing Fee">Visa Processing Fee</option>
                              <option value="Language Test Training">Language Test Training</option>
                              <option value="Mock Test Fee">Mock Test Fee</option>
                              <option value="Courier/Admin Charges">Courier/Admin Charges</option>
                              <option value="Other / Misc">Other / Misc</option>
                          </select>
                      </div>
                      
                      {newInvoiceDesc === 'Other / Misc' && (
                          <input 
                            className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white text-sm" 
                            placeholder="Specify other service..." 
                            onChange={e => setNewInvoiceDesc(e.target.value)}
                          />
                      )}
                  </div>

                  <div className="p-8 border-t border-slate-50 bg-slate-50/30 flex justify-end gap-3">
                      <button onClick={() => setIsCreatingInvoice(false)} className="px-6 py-3 rounded-2xl font-bold text-slate-500 hover:bg-slate-200 transition-all text-sm">Discard</button>
                      <button 
                        onClick={handleCreateInvoice} 
                        disabled={isSaving || !newInvoiceAmount}
                        className="bg-slate-900 text-white px-10 py-3 rounded-2xl font-bold shadow-xl hover:bg-indigo-600 transition-all active:scale-95 text-sm flex items-center disabled:opacity-50"
                      >
                          {isSaving ? <Loader2 size={18} className="animate-spin mr-2"/> : <Receipt size={18} className="mr-2"/>}
                          Finalize Invoice
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* DETAILED ADD STUDENT MODAL */}
      {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-[2.5rem] w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-white/20 animate-in zoom-in-95 duration-200">
                  <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
                      <div>
                          <h3 className="text-2xl font-bold text-slate-800 flex items-center">
                             <UserCheck className="mr-2 text-indigo-600" size={24}/> New Applicant Intake
                          </h3>
                          <p className="text-xs text-slate-500 font-medium">Build a detailed profile for professional counseling.</p>
                      </div>
                      <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"><X size={24}/></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                      {/* AI & Branch Assignment */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <section>
                            <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 h-full flex flex-col justify-center">
                                <div className="flex items-center space-x-4 mb-4">
                                    <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100"><ScanFace size={24}/></div>
                                    <div>
                                        <p className="text-base font-bold text-slate-800">Quick AI Passport Scan</p>
                                        <p className="text-xs text-slate-500 font-medium">Auto-populate identity details instantly.</p>
                                    </div>
                                </div>
                                <label className={`flex items-center justify-center space-x-2 px-6 py-4 rounded-xl text-sm font-bold transition-all cursor-pointer shadow-md w-full ${scanningPassport ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-900 text-white hover:bg-indigo-600 shadow-slate-200'}`}>
                                    {scanningPassport ? <Loader2 size={18} className="animate-spin" /> : <UploadCloud size={18} />}
                                    <span>{scanningPassport ? 'Analyzing Image...' : 'Upload Passport Image'}</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleScanPassport} disabled={scanningPassport} />
                                </label>
                            </div>
                        </section>

                        <section className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                            <div className="flex items-center space-x-2">
                                <Network size={20} className="text-indigo-600" />
                                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Office Assignment *</h4>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Branch / Location</label>
                                <select 
                                    className="w-full p-4 border border-slate-200 rounded-2xl bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-bold"
                                    value={newStudentData.branchId}
                                    onChange={e => setNewStudentData({...newStudentData, branchId: e.target.value})}
                                >
                                    {(settings?.branches || []).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </div>
                        </section>
                      </div>

                      {/* Section: Basic Identity */}
                      <section className="space-y-6">
                          <h4 className="flex items-center text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]"><User size={16} className="mr-2"/> Identity & Contact</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name *</label>
                                  <input className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-bold" value={newStudentData.name} onChange={e => setNewStudentData({...newStudentData, name: e.target.value})} placeholder="e.g. Ram Prasad Sharma" />
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                                  <input className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" value={newStudentData.email} onChange={e => setNewStudentData({...newStudentData, email: e.target.value})} placeholder="ram@example.com" />
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Phone Number</label>
                                  <input className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" value={newStudentData.phone} onChange={e => setNewStudentData({...newStudentData, phone: e.target.value})} placeholder="+977 98XXXXXXXX" />
                              </div>
                          </div>
                      </section>

                      {/* Section: Intake Timeline & Tuition */}
                      <section className="space-y-6">
                          <h4 className="flex items-center text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]"><Clock size={16} className="mr-2"/> Intake & Financials</h4>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                              <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Intended Intake *</label>
                                  <select className="w-full p-4 border border-slate-200 rounded-2xl bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-bold" value={newStudentData.intakeMonth} onChange={e => setNewStudentData({...newStudentData, intakeMonth: e.target.value})}>
                                      <option value="January">January</option><option value="February">February</option><option value="March">March</option><option value="April">April</option><option value="May">May</option><option value="June">June</option><option value="July">July</option><option value="August">August</option><option value="September">September</option><option value="October">October</option><option value="November">November</option><option value="December">December</option>
                                  </select>
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Intake Year *</label>
                                  <select className="w-full p-4 border border-slate-200 rounded-2xl bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-bold" value={newStudentData.intakeYear} onChange={e => setNewStudentData({...newStudentData, intakeYear: e.target.value})}>
                                      <option value="2025">2025</option><option value="2026">2026</option><option value="2027">2027</option>
                                  </select>
                              </div>
                              <div className="space-y-1 md:col-span-2">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Est. Annual Tuition ({currencySymbol}) *</label>
                                  <div className="relative">
                                      <Bank className="absolute left-4 top-4 text-slate-300" size={18} />
                                      <input type="number" className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-2xl bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-black text-indigo-600" value={newStudentData.annualTuition} onChange={e => setNewStudentData({...newStudentData, annualTuition: parseFloat(e.target.value) || 0})} />
                                  </div>
                              </div>
                          </div>
                      </section>

                      {/* Section: Academic Background */}
                      <section className="space-y-6">
                          <h4 className="flex items-center text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]"><AcademicIcon size={16} className="mr-2"/> Academic & English</h4>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                              <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Highest Level *</label>
                                  <select className="w-full p-4 border border-slate-200 rounded-2xl bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-bold" value={newStudentData.highestQualification} onChange={e => setNewStudentData({...newStudentData, highestQualification: e.target.value})}>
                                      <option value="Undergraduate (+2)">Undergraduate (+2)</option>
                                      <option value="Bachelors Degree">Bachelors Degree</option>
                                      <option value="Masters Degree">Masters Degree</option>
                                      <option value="PhD / Doctorate">PhD / Doctorate</option>
                                      <option value="Diploma / Trade">Diploma / Trade</option>
                                  </select>
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Last GPA / Score</label>
                                  <input className="w-full p-4 border border-slate-200 rounded-2xl bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" value={newStudentData.gpa} onChange={e => setNewStudentData({...newStudentData, gpa: e.target.value})} placeholder="e.g. 3.4 or 75%" />
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">English Test</label>
                                  <select className="w-full p-4 border border-slate-200 rounded-2xl bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" value={newStudentData.testType} onChange={e => setNewStudentData({...newStudentData, testType: e.target.value as any})}>
                                      <option value="None">None / PTE Academic</option>
                                      <option value="IELTS">IELTS</option>
                                      <option value="PTE">PTE</option>
                                      <option value="TOEFL">TOEFL</option>
                                  </select>
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Current Score</label>
                                  <input className="w-full p-4 border border-slate-200 rounded-2xl bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-bold" value={newStudentData.testScore} onChange={e => setNewStudentData({...newStudentData, testScore: e.target.value})} placeholder="e.g. 7.0 or 65" />
                              </div>
                          </div>
                      </section>

                      {/* Section: Passport & Target */}
                      <section className="space-y-6">
                          <h4 className="flex items-center text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]"><Globe size={16} className="mr-2"/> Passport & Target</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Passport Number</label>
                                  <input className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-mono uppercase" value={newStudentData.passportNumber} onChange={e => setNewStudentData({...newStudentData, passportNumber: e.target.value})} placeholder="X0000000" />
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Desired Country</label>
                                  <select className="w-full p-4 border border-slate-200 rounded-2xl bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-bold" value={newStudentData.targetCountry} onChange={e => setNewStudentData({...newStudentData, targetCountry: e.target.value as Country})}>
                                      {Object.values(Country).map(c => <option key={c} value={c}>{c}</option>)}
                                  </select>
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Lead Source</label>
                                  <select className="w-full p-4 border border-slate-200 rounded-2xl bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" value={newStudentData.source} onChange={e => setNewStudentData({...newStudentData, source: e.target.value})}>
                                      <option value="Walk-in">Walk-in</option>
                                      <option value="Referral">Referral</option>
                                      <option value="Facebook Ads">Facebook Ads</option>
                                      <option value="Instagram">Instagram</option>
                                      <option value="Website">Website Form</option>
                                  </select>
                              </div>
                          </div>
                      </section>
                  </div>

                  <div className="p-8 border-t bg-slate-50/50 flex justify-between items-center">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Confidential applicant intake data entry</p>
                      <div className="flex gap-3">
                          <button onClick={() => setIsAdding(false)} className="px-8 py-3.5 rounded-2xl font-bold text-slate-500 hover:bg-slate-200 transition-all text-sm">Discard</button>
                          <button onClick={handleAddStudent} className="bg-indigo-600 text-white px-12 py-3.5 rounded-2xl font-bold shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 text-sm flex items-center">
                              <Save size={18} className="mr-2"/> Finalize Enrollment
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
