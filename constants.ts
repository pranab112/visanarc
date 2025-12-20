
import { Country, DocumentItem, Expense } from './types';

export interface DocRequirement {
  name: string;
  category: string;
  condition?: string;
}

export const UNIVERSAL_DOCS: DocRequirement[] = [
  { name: 'Valid International Passport (6mo+)', category: 'Identity' },
  { name: 'Academic Transcripts', category: 'Academics' },
  { name: 'Degree Certificates / Diplomas', category: 'Academics' },
  { name: 'Standardized English Score (IELTS/PTE/TOEFL)', category: 'Tests' },
  { name: 'Statement of Purpose (SOP)', category: 'Academics' },
  { name: 'Letters of Recommendation (LOR)', category: 'Academics' },
  { name: 'Curriculum Vitae (CV) / Resume', category: 'Academics' },
  { name: 'Proof of Funds (Bank Statements)', category: 'Finance' },
  { name: 'Passport Sized Photographs', category: 'Identity' }
];

export const COUNTRY_SPECIFIC_DOCS: Record<Country, DocRequirement[]> = {
  [Country.USA]: [
    { name: 'Form I-20', category: 'Visa' },
    { name: 'SEVIS I-901 Fee Receipt', category: 'Visa' },
    { name: 'DS-160 Confirmation Page', category: 'Visa' },
    { name: 'SAT / ACT Scores', category: 'Tests', condition: 'Undergrad' },
    { name: 'GRE / GMAT Scores', category: 'Tests', condition: 'Graduate' }
  ],
  [Country.Australia]: [
    { name: 'Genuine Student (GS) Statement', category: 'Visa', condition: 'Replaced GTE Mar 2024' },
    { name: 'Confirmation of Enrolment (CoE)', category: 'Visa' },
    { name: 'Overseas Student Health Cover (OSHC)', category: 'Health' },
    { name: 'Welfare Arrangements', category: 'Legal', condition: 'Under 18' }
  ],
  [Country.Canada]: [
    { name: 'Provincial Attestation Letter (PAL)', category: 'Visa', condition: 'New 2024/25 Req' },
    { name: 'Guaranteed Investment Certificate (GIC)', category: 'Finance', condition: '$20,635 CAD' },
    { name: 'Certificat d’acceptation du Québec (CAQ)', category: 'Visa', condition: 'Quebec Only' },
    { name: 'Letter of Explanation (LOE)', category: 'Visa' }
  ],
  [Country.UK]: [
    { name: 'Confirmation of Acceptance for Studies (CAS)', category: 'Visa' },
    { name: 'Tuberculosis (TB) Test Certificate', category: 'Health' },
    { name: 'ATAS Certificate', category: 'Academics', condition: 'Sensitive Subjects' },
    { name: 'Immigration Health Surcharge (IHS)', category: 'Health' }
  ],
  [Country.Japan]: [
    { name: 'Certificate of Eligibility (CoE)', category: 'Visa' },
    { name: 'EJU Results', category: 'Tests', condition: 'Japanese Track' },
    { name: 'JLPT Certificate', category: 'Tests' },
    { name: 'Certified Japanese Translations', category: 'Legal' }
  ],
  [Country.Korea]: [
    { name: 'Apostilled / Legalized Degrees', category: 'Legal' },
    { name: 'Certificate of Admission (CoA)', category: 'Visa' },
    { name: 'Family Relation Certificate', category: 'Identity', condition: 'For Sponsors' },
    { name: 'TOPIK Scores', category: 'Tests', condition: 'Korean Track' },
    { name: 'TB Test Report', category: 'Health' }
  ]
};

export const MOCK_STUDENTS_INITIAL = [
  {
    id: '1',
    name: 'Ram Karki',
    email: 'ram.k@example.com',
    phone: '9841000001',
    targetCountry: Country.Australia,
    status: 'Applied',
    nocStatus: 'Voucher Received',
    documents: { 'Valid International Passport (6mo+)': 'Uploaded', 'Academic Transcripts': 'Uploaded' },
    documentFiles: {},
    documentDependencies: {},
    notes: 'Waiting for offer letter from Flinders.',
    createdAt: Date.now() - 86400000 * 5,
    blockedBy: [],
    testType: 'IELTS',
    testScore: '7.5',
    gpa: '3.6',
    financialCap: 'Satisfactory',
    testPrep: { enrolled: false }
  },
  {
    id: '2',
    name: 'Sita Sharma',
    email: 'sita.s@example.com',
    phone: '9802000002',
    targetCountry: Country.USA,
    status: 'Lead',
    nocStatus: 'Not Applied',
    documents: {},
    documentFiles: {},
    documentDependencies: {},
    notes: 'Interested in Nursing programs. Needs to take PTE.',
    createdAt: Date.now() - 100000,
    blockedBy: [],
    testType: 'PTE',
    testScore: 'Pending',
    gpa: '3.2',
    financialCap: 'Medium',
    testPrep: {
        enrolled: true,
        batch: 'Morning (7-8 AM)',
        bookingStatus: 'Pending',
        mockScores: { listening: '60', reading: '58', writing: '62', speaking: '65', overall: '61' }
    }
  }
];

export const MOCK_EXPENSES_INITIAL: Expense[] = [
    { id: 'ex1', category: 'Rent', amount: 45000, description: 'Office Monthly Rent', date: Date.now() - 86400000 * 2, recordedBy: 'Admin', branchId: 'main' },
    { id: 'ex2', category: 'Salaries', amount: 120000, description: 'Staff Payroll - Jan', date: Date.now() - 86400000 * 5, recordedBy: 'Admin', branchId: 'main' },
    { id: 'ex3', category: 'Marketing', amount: 15000, description: 'Facebook Ads - Australia Campaign', date: Date.now() - 86400000 * 1, recordedBy: 'Admin', branchId: 'main' },
    { id: 'ex4', category: 'Utilities', amount: 8000, description: 'Internet & Electricity', date: Date.now() - 86400000 * 3, recordedBy: 'Admin', branchId: 'main' }
];

export const MOCK_PARTNERS_INITIAL = [
  { id: 'p1', name: 'Flinders University', type: 'University', commissionRate: 15, portalUrl: 'https://www.flinders.edu.au/agent' },
  { id: 'p2', name: 'ApplyBoard', type: 'Aggregator', commissionRate: 20, portalUrl: 'https://www.applyboard.com/login' },
  { id: 'p3', name: 'Torrens University', type: 'University', commissionRate: 12, portalUrl: 'https://agent.torrens.edu.au' },
  { id: 'p4', name: 'Excelsia College', type: 'College', commissionRate: 25, portalUrl: 'https://excelsia.edu.au/agents/' },
  { id: 'p5', name: 'Global Reach', type: 'Consultancy', commissionRate: 10, portalUrl: '#' }
];

export const TEST_PREP_LINKS = [
  { 
    name: 'British Council (IELTS)', 
    url: 'https://takeielts.britishcouncil.org/',
    bookingUrl: 'https://ieltsregistration.britishcouncil.org/',
    resultsUrl: 'https://ieltsregistration.britishcouncil.org/results'
  },
  { 
    name: 'IDP Nepal (IELTS)', 
    url: 'https://www.idp.com/nepal/ielts/',
    bookingUrl: 'https://ielts.idp.com/book',
    resultsUrl: 'https://ielts.idp.com/results'
  },
  { 
    name: 'Pearson (PTE)', 
    url: 'https://www.pearsonpte.com/',
    bookingUrl: 'https://www.pearsonpte.com/book-now',
    resultsUrl: 'https://www.pearsonpte.com/scoring/access-your-scores'
  },
  { 
    name: 'ETS (TOEFL)', 
    url: 'https://www.ets.org/toefl.html',
    bookingUrl: 'https://v2.ereg.ets.org/ereg/public/jump?_p=TEL',
    resultsUrl: 'https://www.ets.org/toefl/test-takers/ibt/scores/get-scores.html'
  }
];
