
export enum Country {
  USA = 'USA',
  Australia = 'Australia',
  Canada = 'Canada',
  UK = 'UK',
  Japan = 'Japan',
  Korea = 'Korea'
}

export type PaymentStatus = 'pending' | 'reviewing' | 'paid';

export enum ApplicationStatus {
  Lead = 'Lead',
  Applied = 'Applied',
  OfferReceived = 'Offer Received',
  VisaGranted = 'Visa Granted',
  VisaRejected = 'Visa Rejected',
  Alumni = 'Alumni',
  Discontinued = 'Discontinued'
}

export enum NocStatus {
  NotApplied = 'Not Applied',
  Applied = 'Applied',
  VoucherReceived = 'Voucher Received',
  Verified = 'Verified',
  Issued = 'Issued'
}

export interface NocMetadata {
    appliedDate?: number;
    voucherNumber?: string;
    nocNumber?: string;
    approvedDate?: number;
    notes?: string;
}

export interface DocumentItem {
  name: string;
  checked: boolean;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'Student' | 'Agent';
  timestamp: number;
}

export type DocumentStatus = 'Pending' | 'Uploaded' | 'NotRequired';

export interface StoredFile {
    key: string;
    filename: string;
    url: string;
    size: number;
    mimeType: string;
    uploadedAt: number;
    uploadedBy: string;
}

export interface Branch {
    id: string;
    name: string;
    location: string;
}

export interface AcademicRecord {
    level: string;
    institution: string;
    board: string;
    passedYear: string;
    score: string;
}

export interface TestScoreBreakdown {
    listening: string;
    reading: string;
    writing: string;
    speaking: string;
    overall: string;
    date?: number; 
}

export interface SponsorRecord {
    name: string;
    relationship: string;
    occupation: string;
    annualIncome: string;
}

export type NoteType = 'General' | 'Counselling' | 'FollowUp' | 'Warning' | 'Financial';

export interface NoteEntry {
    id: string;
    text: string;
    type: NoteType;
    timestamp: number;
    createdBy: string;
    isPinned?: boolean;
}

export interface AuditFinding {
    type: 'Critical' | 'Warning' | 'Verified';
    message: string;
    category: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  targetCountry: Country;
  status: ApplicationStatus;
  nocStatus: NocStatus;
  nocDetails?: NocMetadata;
  documents: Record<string, DocumentStatus>; 
  documentFiles?: Record<string, StoredFile>; 
  documentDependencies?: Record<string, string[]>; 
  notes: string; 
  noteEntries?: NoteEntry[];
  createdAt: number;
  blockedBy?: string[]; 
  branchId?: string;
  intakeMonth?: string;
  intakeYear?: string;
  portalPassword?: string; 
  messages?: ChatMessage[];
  passportNumber?: string;
  dateOfBirth?: string; 
  nationality?: string;
  address?: string;
  gender?: 'Male' | 'Female' | 'Other';
  ocrConfidence?: number;
  highestQualification?: string;
  academics?: AcademicRecord[];
  educationHistory?: string;
  gpa?: string;
  testType?: 'IELTS' | 'PTE' | 'TOEFL' | 'None';
  testScoreBreakdown?: TestScoreBreakdown;
  testScore?: string;
  targetScore?: string;
  sponsors?: SponsorRecord[];
  financialCap?: 'Low' | 'Medium' | 'Satisfactory' | 'High';
  annualTuition?: number; 
  age?: number;
  educationGap?: number; 
  workExperience?: number; 
  previousRefusals?: boolean;
  borderDetails?: string;
  riskAnalysis?: {
      date: number;
      result: string;
  };
  documentAudit?: {
      date: number;
      findings: AuditFinding[];
  };
  testPrep?: {
      enrolled: boolean;
      batch?: string;
      studyMode?: 'Physical' | 'Online';
      materialsIssued?: 'Not Issued' | 'Issued' | 'Partially Issued';
      instructorName?: string;
      enrollmentDate?: number;
      examDate?: number;
      bookingStatus?: 'Pending' | 'Booked' | 'Completed';
      portalUsername?: string;
      portalPassword?: string;
      examVenue?: string;
      examFeeStatus?: 'Paid' | 'Unpaid';
      feeStatus?: 'Paid' | 'Unpaid' | 'Partial';
      mockScores?: TestScoreBreakdown; 
      mockTestHistory?: TestScoreBreakdown[]; 
      attendance?: Record<string, 'Present' | 'Absent' | 'Late'>;
  };
  source?: string;
  referralPartnerId?: string; 
  assignedPartnerId?: string; 
  assignedPartnerName?: string; 
  commissionAmount?: number; 
  commissionStatus?: 'Pending' | 'Claimed' | 'Received'; 
  courseInterest?: string; 
  courseInterests?: string[];
}

export interface Partner {
  id: string;
  name: string;
  type: 'University' | 'Aggregator' | 'College' | 'Consultancy' | 'B2B Agent';
  commissionRate: number; 
  portalUrl: string;
}

export interface CommissionClaim {
    id: string;
    studentId: string;
    studentName: string;
    partnerId: string;
    partnerName: string;
    amount: number;
    currency: string;
    status: 'Unclaimed' | 'Invoiced' | 'Received';
    invoiceDate: number;
    dueDate?: number;
    notes?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  studentId: string;
  studentName: string;
  amount: number;
  description: string;
  status: 'Pending' | 'Paid';
  date: number;
  branchId?: string;
}

export type ExpenseCategory = 'Rent' | 'Salaries' | 'Marketing' | 'Utilities' | 'Software' | 'Office' | 'Travel' | 'Other';

export interface Expense {
  id: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  date: number;
  recordedBy: string;
  branchId?: string;
}

export interface PRPointsCriteria {
  age: number;
  englishLevel: 'Superior' | 'Proficient' | 'Competent';
  education: 'Doctorate' | 'Master/Bachelor' | 'Diploma' | 'Trade';
  experienceYears: number;
  australianStudy: boolean;
  regionalStudy: boolean;
  partnerSkills: boolean;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  priority: 'High' | 'Medium' | 'Low';
  dueTime: string; 
  createdAt: number;
  day: string; 
}

export type SubscriptionPlan = 'Free' | 'Pro' | 'Enterprise';

export interface LeadFormFieldConfig {
    phone: boolean;
    targetCountry: boolean;
    courseInterest: boolean;
    educationHistory: boolean;
}

export interface LeadFormConfig {
    enabled: boolean;
    title: string;
    description: string;
    themeColor: string;
    fields: LeadFormFieldConfig;
}

export interface AgencySettings {
  agencyName: string;
  email: string;
  phone: string;
  address: string;
  defaultCountry: Country;
  currency: string;
  paymentStatus: PaymentStatus;
  notifications: {
    emailOnVisa: boolean;
    dailyReminders: boolean;
  };
  subscription: {
    plan: SubscriptionPlan;
    expiryDate?: number;
  };
  templates?: {
    emailVisaGranted: string;
    whatsappUpdate: string;
  };
  testPrepBatches?: string[]; 
  branches?: Branch[]; 
  leadForm?: LeadFormConfig;
}

export type UserRole = 'Owner' | 'Counsellor' | 'Viewer' | 'Student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  agencyId: string; 
  avatarUrl?: string;
  branchId?: string; 
  paymentStatus?: PaymentStatus;
}

export interface AuthSession {
  user: User;
  token: string;
}

export interface ActivityLog {
    id: string;
    userId: string;
    userName: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'EXPORT';
    entityType: 'Student' | 'Invoice' | 'Settings' | 'File' | 'Auth' | 'Commission' | 'Expense';
    details: string;
    timestamp: number;
    changes?: Record<string, ChangeRecord>; 
}

export interface ChangeRecord {
    old: any;
    new: any;
}
