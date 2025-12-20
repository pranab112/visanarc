import React, { useState } from 'react';
import { Mic, PenTool, Calculator, Activity, Play, Square, Volume2, GraduationCap, MapPin, Wallet, Sparkles, Loader2, Landmark, Copy, CheckCircle2, RotateCw, ShieldAlert, TrendingUp, Info, ChevronRight, MessageSquare, Trash2 } from 'lucide-react';
import { generateSop, analyzeVisaRisk, getInterviewQuestion, recommendUniversities, UniRecommendation } from '../../services/geminiService';
import { PRPointsCriteria, Country } from '../../types';

export const AiTools: React.FC = () => {
  const [activeTool, setActiveTool] = useState<'sop' | 'interview' | 'pr' | 'risk' | 'uni-matcher'>('uni-matcher');

  const tools = [
    { id: 'uni-matcher', label: 'Uni Matcher', desc: 'Predict best-fit universities', icon: GraduationCap, color: 'indigo' },
    { id: 'sop', label: 'SOP Generator', desc: 'Craft professional statements', icon: PenTool, color: 'purple' },
    { id: 'interview', label: 'Voice Interview', desc: 'Practice with AI officer', icon: Mic, color: 'rose' },
    { id: 'pr', label: 'PR Calculator', desc: 'Score your migration path', icon: Calculator, color: 'blue' },
    { id: 'risk', label: 'Risk Analyzer', desc: 'Predict visa outcomes', icon: Activity, color: 'amber' },
  ];

  return (
    <div className="h-full flex flex-col lg:flex-row bg-slate-50/50 overflow-hidden">
      {/* Premium Tool Sidebar */}
      <aside className="w-full lg:w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 z-10 shadow-sm">
        <div className="p-6 border-b border-slate-100">
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center">
                <Sparkles className="mr-2 text-indigo-600 animate-pulse" size={24} />
                Genius AI Suite
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Intelligence Layer v3.0</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
            {tools.map(tool => {
                const Icon = tool.icon;
                const isActive = activeTool === tool.id;
                return (
                    <button
                        key={tool.id}
                        onClick={() => setActiveTool(tool.id as any)}
                        className={`w-full flex items-center p-3 rounded-2xl transition-all group ${
                            isActive 
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                    >
                        <div className={`p-2.5 rounded-xl mr-3 transition-colors ${
                            isActive ? 'bg-white/20' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                        }`}>
                            <Icon size={20} />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-bold leading-none">{tool.label}</p>
                            <p className={`text-[10px] mt-1 font-medium ${isActive ? 'text-indigo-100' : 'text-slate-400'}`}>{tool.desc}</p>
                        </div>
                        {isActive && <ChevronRight size={16} className="ml-auto opacity-50" />}
                    </button>
                );
            })}
        </nav>

        <div className="p-6 bg-slate-50 border-t border-slate-200">
            <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                <div className="flex items-center space-x-2 text-indigo-600 mb-1">
                    <ShieldAlert size={14}/>
                    <span className="text-[10px] font-black uppercase tracking-widest">Confidentiality</span>
                </div>
                <p className="text-[10px] text-indigo-400 font-medium leading-tight">All AI generations are private to this agency workspace.</p>
            </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 overflow-y-auto custom-scrollbar relative">
        <div className="p-8 lg:p-12 max-w-5xl mx-auto">
            {activeTool === 'uni-matcher' && <UniMatcher />}
            {activeTool === 'sop' && <SopGenerator />}
            {activeTool === 'interview' && <VoiceInterview />}
            {activeTool === 'pr' && <PrCalculator />}
            {activeTool === 'risk' && <RiskAnalyzer />}
        </div>
      </main>
    </div>
  );
};

const UniMatcher = () => {
    const [formData, setFormData] = useState({
        name: '',
        country: 'Australia',
        gpa: '',
        testType: 'IELTS',
        testScore: '',
        financialCap: 'Medium',
        courseInterest: ''
    });
    const [recommendations, setRecommendations] = useState<UniRecommendation[]>([]);
    const [loading, setLoading] = useState(false);

    const handleAnalyze = async () => {
        if (!formData.courseInterest || !formData.country) {
            alert("Please enter a target country and course interest.");
            return;
        }
        setLoading(true);
        const recs = await recommendUniversities({
            name: formData.name || 'Student',
            country: formData.country,
            gpa: formData.gpa || 'N/A',
            testType: formData.testType,
            testScore: formData.testScore || 'N/A',
            financialCap: formData.financialCap,
            courseInterest: formData.courseInterest
        });
        setRecommendations(recs);
        setLoading(false);
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">University Matcher</h2>
                    <p className="text-slate-500 font-medium mt-1">Cross-referencing student profiles against global academic benchmarks.</p>
                </div>
                {recommendations.length > 0 && (
                    <button onClick={() => setRecommendations([])} className="text-xs font-black text-indigo-600 flex items-center hover:underline">
                        <RotateCw size={14} className="mr-1.5"/> Reset Scan
                    </button>
                )}
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Country</label>
                        <select className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})}>
                            {Object.values(Country).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Academic Interest</label>
                        <input className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" placeholder="e.g. Master of Data Science" value={formData.courseInterest} onChange={e => setFormData({...formData, courseInterest: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Budget Tier</label>
                        <select className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" value={formData.financialCap} onChange={e => setFormData({...formData, financialCap: e.target.value})}>
                            <option value="Low">Low (Budget Friendly)</option>
                            <option value="Medium">Medium (Standard)</option>
                            <option value="Satisfactory">High (Premium)</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">GPA / Score</label>
                        <input className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" placeholder="3.65 / 4.0" value={formData.gpa} onChange={e => setFormData({...formData, gpa: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">English Test</label>
                        <div className="flex gap-2">
                            <select className="w-24 p-4 border border-slate-200 rounded-2xl bg-slate-50 font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" value={formData.testType} onChange={e => setFormData({...formData, testType: e.target.value})}>
                                <option value="IELTS">IELTS</option><option value="PTE">PTE</option><option value="TOEFL">TOEFL</option>
                            </select>
                            <input className="flex-1 p-4 border border-slate-200 rounded-2xl bg-slate-50 font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" placeholder="Score" value={formData.testScore} onChange={e => setFormData({...formData, testScore: e.target.value})} />
                        </div>
                    </div>
                </div>
                
                <button 
                    onClick={handleAnalyze} 
                    disabled={loading}
                    className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-2xl shadow-indigo-100 flex items-center justify-center disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin mr-3" size={20} /> : <Sparkles className="mr-3 text-indigo-400" size={20} />}
                    {loading ? 'Consulting Knowledge Graph...' : 'Match Best Universities'}
                </button>
            </div>

            {recommendations.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-8 duration-700">
                    {recommendations.map((rec, idx) => (
                        <div key={idx} className="bg-white rounded-[2.5rem] border border-slate-200 p-8 hover:shadow-2xl transition-all relative overflow-hidden group hover:border-indigo-200">
                            <div className="absolute -top-10 -right-10 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Landmark size={200} className="text-indigo-600 rotate-12"/>
                            </div>
                            <div className="flex justify-between items-start mb-6 relative z-10">
                                <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                    <Landmark size={28}/>
                                </div>
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                    rec.acceptanceChance === 'High' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                                    rec.acceptanceChance === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                                }`}>
                                    {rec.acceptanceChance} Acceptance Chance
                                </span>
                            </div>
                            <h4 className="font-black text-slate-800 text-xl mb-1 relative z-10">{rec.name}</h4>
                            <p className="text-sm text-slate-400 font-bold uppercase tracking-tight mb-6 flex items-center relative z-10"><MapPin size={14} className="mr-1.5 text-slate-300"/> {rec.location}</p>
                            
                            <div className="bg-slate-50 rounded-3xl p-6 mb-6 relative z-10 group-hover:bg-indigo-50/50 transition-colors">
                                <p className="text-sm text-slate-600 leading-relaxed font-medium italic">"{rec.reason}"</p>
                            </div>
                            
                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center text-xs font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100">
                                    <Wallet size={14} className="mr-2"/> Tuition: {rec.tuition}
                                </div>
                                <button className="text-[10px] font-black uppercase text-slate-400 hover:text-indigo-600 transition-colors tracking-widest">Details <ChevronRight size={12} className="inline"/></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const SopGenerator = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [formData, setFormData] = useState({
    name: '', course: '', uni: '', country: '', background: ''
  });
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if(!formData.name || !formData.course) { alert("Please fill at least name and course."); return; }
    setLoading(true);
    const text = await generateSop(formData.name, formData.course, formData.uni, formData.country, formData.background);
    setResult(text);
    setLoading(false);
  };

  const handleCopy = () => {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">SOP Intelligence</h2>
        <p className="text-slate-500 font-medium mt-1">Generating narrative-driven Statements of Purpose optimized for high-tier universities.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Input Side */}
          <div className="lg:col-span-5 space-y-6">
              <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-5">
                  <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Applicant Name</label>
                      <input className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Full Name" />
                  </div>
                  <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Institution</label>
                      <input className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" value={formData.uni} onChange={e => setFormData({...formData, uni: e.target.value})} placeholder="e.g. Monash University" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Course Name</label>
                        <input className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm" value={formData.course} onChange={e => setFormData({...formData, course: e.target.value})} placeholder="e.g. Master of Nursing" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Country</label>
                        <input className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} placeholder="e.g. Australia" />
                    </div>
                  </div>
                  <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Background Snapshot</label>
                      <textarea className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm h-32" placeholder="Describe GPA, work exp, and why this shift..." value={formData.background} onChange={e => setFormData({...formData, background: e.target.value})} />
                  </div>
                  <button 
                    onClick={handleGenerate} 
                    disabled={loading}
                    className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-xl disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : 'Architect Statement'}
                  </button>
              </div>
          </div>

          {/* Output Side */}
          <div className="lg:col-span-7 flex flex-col min-h-[500px]">
              {result ? (
                <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-700">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Document Draft #1</span>
                        <button onClick={handleCopy} className="p-2.5 rounded-xl bg-white border border-slate-200 text-indigo-600 shadow-sm hover:bg-indigo-600 hover:text-white transition-all flex items-center">
                            {copied ? <CheckCircle2 size={16} className="mr-2"/> : <Copy size={16} className="mr-2"/>}
                            <span className="text-[10px] font-black uppercase">{copied ? 'Copied' : 'Copy Text'}</span>
                        </button>
                    </div>
                    <div className="p-10 overflow-y-auto custom-scrollbar flex-1 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]">
                        <p className="whitespace-pre-wrap text-slate-700 text-sm leading-[2] font-serif selection:bg-indigo-100">{result}</p>
                    </div>
                    <div className="p-6 border-t border-slate-100 text-center">
                        <p className="text-[10px] font-black text-slate-300 uppercase italic">Disclaimer: AI output requires professional review before submission.</p>
                    </div>
                </div>
              ) : (
                <div className="flex-1 rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 p-12 text-center">
                    <PenTool size={64} className="mb-6 opacity-10" />
                    <h3 className="font-black text-slate-400 uppercase tracking-widest">Narrative Workspace</h3>
                    <p className="text-xs font-medium mt-2 max-w-xs">Fill in student background on the left to generate a personalized academic statement.</p>
                </div>
              )}
          </div>
      </div>
    </div>
  );
};

const VoiceInterview = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiQuestion, setAiQuestion] = useState('Welcome. I am your Mock Visa Officer. Press below to begin.');
  const [targetCountry, setTargetCountry] = useState('Australia');
  const [loading, setLoading] = useState(false);

  const startInterview = async () => {
    setLoading(true);
    setAiQuestion('Connecting to Embassy Protocol...');
    const q = await getInterviewQuestion(targetCountry);
    setAiQuestion(q);
    speak(q);
    setLoading(false);
  };

  const speak = (text: string) => {
    const utter = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utter);
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      setIsRecording(true);
      if ('webkitSpeechRecognition' in window) {
        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'en-US';
        recognition.onresult = (event: any) => {
            setTranscript(event.results[0][0].transcript);
            setIsRecording(false);
        };
        recognition.start();
      } else {
          alert("Speech recognition not supported. Please use Chrome.");
          setIsRecording(false);
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-12 animate-in fade-in duration-500 text-center">
      <div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Embassy Mock Simulator</h2>
        <p className="text-slate-500 font-medium mt-1">Realistic voice-to-voice interview training with dynamic AI feedback.</p>
      </div>

      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-200 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Volume2 size={120} className="text-indigo-600"/>
          </div>
          
          <div className="max-w-xs mx-auto mb-10">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Immigration Context</label>
            <select 
                value={targetCountry} 
                onChange={e => setTargetCountry(e.target.value)}
                className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none text-center"
            >
                <option value="Australia">GTE Australia</option>
                <option value="USA">F1 Visa USA</option>
                <option value="UK">UK Credibility</option>
                <option value="Canada">Canada Study Permit</option>
            </select>
          </div>

          <div className="bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden mb-12">
              <div className="relative z-10 space-y-4">
                  <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em]">Officer Statement</p>
                  <p className="text-2xl font-black text-white leading-snug">"{aiQuestion}"</p>
                  {isRecording && (
                      <div className="flex justify-center items-center space-x-1.5 mt-8 h-10">
                          {[...Array(6)].map((_, i) => (
                              <div key={i} className="w-1.5 bg-indigo-400 rounded-full animate-pulse" style={{ height: `${20 + Math.random()*60}%`, animationDelay: `${i*100}ms` }} />
                          ))}
                      </div>
                  )}
              </div>
              <div className="absolute bottom-0 left-0 w-full h-1.5 bg-indigo-500/20">
                  <div className="h-full bg-indigo-500 animate-[loading_2s_infinite]" style={{ width: '30%' }}></div>
              </div>
          </div>

          <div className="flex flex-col items-center gap-6">
              <div className="flex items-center space-x-6">
                <button 
                    onClick={startInterview}
                    disabled={loading}
                    className="p-5 bg-white border border-slate-200 rounded-full text-slate-600 hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm hover:shadow-lg disabled:opacity-30"
                >
                    <RotateCw size={24} className={loading ? 'animate-spin' : ''} />
                </button>
                <button 
                    onClick={toggleRecording}
                    className={`h-24 w-24 rounded-full flex items-center justify-center shadow-2xl transition-all relative ${
                        isRecording 
                        ? 'bg-rose-500 text-white scale-110 ring-8 ring-rose-500/10' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105'
                    }`}
                >
                    {isRecording ? <Square size={32} fill="currentColor" /> : <Mic size={36} />}
                </button>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRecording ? 'Listening for your response...' : 'Tap Mic to Respond'}</p>
          </div>
      </div>

      {transcript && (
          <div className="bg-indigo-50 p-8 rounded-[2rem] border border-indigo-100 text-left animate-in slide-in-from-bottom-4">
            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Speech Analysis Output</h4>
            <p className="text-indigo-900 font-bold text-lg leading-relaxed">"{transcript}"</p>
          </div>
      )}
    </div>
  );
};

const PrCalculator = () => {
    const [points, setPoints] = useState(0);
    const [criteria, setCriteria] = useState<PRPointsCriteria>({
        age: 25,
        englishLevel: 'Competent',
        education: 'Master/Bachelor',
        experienceYears: 0,
        australianStudy: false,
        regionalStudy: false,
        partnerSkills: false
    });

    const calculate = () => {
        let p = 0;
        if (criteria.age >= 18 && criteria.age < 25) p += 25;
        else if (criteria.age >= 25 && criteria.age < 33) p += 30;
        else if (criteria.age >= 33 && criteria.age < 40) p += 25;
        else if (criteria.age >= 40 && criteria.age < 45) p += 15;
        if (criteria.englishLevel === 'Proficient') p += 10;
        if (criteria.englishLevel === 'Superior') p += 20;
        if (criteria.education === 'Doctorate') p += 20;
        if (criteria.education === 'Master/Bachelor') p += 15;
        if (criteria.education === 'Diploma' || criteria.education === 'Trade') p += 10;
        if (criteria.experienceYears >= 3 && criteria.experienceYears < 5) p += 5;
        if (criteria.experienceYears >= 5 && criteria.experienceYears < 8) p += 10;
        if (criteria.experienceYears >= 8) p += 15;
        if (criteria.australianStudy) p += 5;
        if (criteria.regionalStudy) p += 5;
        if (criteria.partnerSkills) p += 5;
        setPoints(p);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500">
            <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight text-center lg:text-left">PR Points Matrix</h2>
                <p className="text-slate-500 font-medium mt-1 text-center lg:text-left">Precise calculation for Australia Skilled Migration (Subclass 189/190).</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Applicant Age</label>
                            <input type="number" value={criteria.age} onChange={e => setCriteria({...criteria, age: parseInt(e.target.value)})} className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">English Competency</label>
                            <select value={criteria.englishLevel} onChange={e => setCriteria({...criteria, englishLevel: e.target.value as any})} className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all">
                                <option value="Competent">Competent (IELTS 6 / PTE 50)</option>
                                <option value="Proficient">Proficient (IELTS 7 / PTE 65)</option>
                                <option value="Superior">Superior (IELTS 8 / PTE 79)</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Highest Qualification</label>
                            <select value={criteria.education} onChange={e => setCriteria({...criteria, education: e.target.value as any})} className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all">
                                <option value="Doctorate">Doctorate (PhD)</option>
                                <option value="Master/Bachelor">Master or Bachelor Degree</option>
                                <option value="Diploma">Diploma / Trade Qualification</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Overseas Work Exp (Yrs)</label>
                            <input type="number" value={criteria.experienceYears} onChange={e => setCriteria({...criteria, experienceYears: parseInt(e.target.value)})} className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" />
                        </div>
                        <div className="md:col-span-2 space-y-3 pt-4 border-t border-slate-100">
                            <label className="flex items-center p-4 border border-slate-100 rounded-2xl hover:bg-indigo-50/50 transition-all cursor-pointer group">
                                <input type="checkbox" checked={criteria.australianStudy} onChange={e => setCriteria({...criteria, australianStudy: e.target.checked})} className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                <div className="ml-4">
                                    <span className="text-sm font-black text-slate-700">2 Years Australian Study</span>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">+5 Points Bonus</p>
                                </div>
                            </label>
                            <label className="flex items-center p-4 border border-slate-100 rounded-2xl hover:bg-indigo-50/50 transition-all cursor-pointer group">
                                <input type="checkbox" checked={criteria.regionalStudy} onChange={e => setCriteria({...criteria, regionalStudy: e.target.checked})} className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                <div className="ml-4">
                                    <span className="text-sm font-black text-slate-700">Regional Residence/Study</span>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">+5 Points Bonus</p>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4">
                    <div className="bg-slate-900 text-white rounded-[2.5rem] p-10 h-full flex flex-col justify-between shadow-2xl relative overflow-hidden border border-white/5">
                        <div className="relative z-10">
                            <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Migration Yield</p>
                            <h3 className="text-7xl font-black tabular-nums">{points}</h3>
                            <p className="text-lg font-bold text-slate-400 mt-2">Total Points</p>
                        </div>
                        
                        <div className="relative z-10 space-y-6 mt-12">
                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px] font-black uppercase text-slate-500">
                                    <span>Eligibility Threshold</span>
                                    <span>65 Points</span>
                                </div>
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div className={`h-full transition-all duration-1000 ${points >= 65 ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-amber-500'}`} style={{ width: `${Math.min((points/100)*100, 100)}%` }} />
                                </div>
                            </div>
                            <button onClick={calculate} className="w-full bg-white text-slate-900 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-100 transition-all shadow-xl active:scale-95">Recalculate</button>
                        </div>
                        <TrendingUp size={200} className="absolute -bottom-10 -right-10 text-white/5 pointer-events-none" />
                    </div>
                </div>
            </div>
        </div>
    );
};

const RiskAnalyzer = () => {
    const [age, setAge] = useState('');
    const [educationGap, setEducationGap] = useState('');
    const [englishScore, setEnglishScore] = useState('');
    const [country, setCountry] = useState('Australia');
    const [refusals, setRefusals] = useState('No');
    const [workExp, setWorkExp] = useState('');
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAnalyze = async () => {
        setLoading(true);
        const profile = `Age: ${age}, Education Gap: ${educationGap} years, English Score: ${englishScore}, Work Experience: ${workExp} years, Previous Refusals: ${refusals}.`;
        const res = await analyzeVisaRisk(profile, country);
        setResult(res);
        setLoading(false);
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <div className="text-center">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Visa Outcome Predictor</h2>
                <p className="text-slate-500 font-medium mt-1">AI-driven predictive analysis based on historical visa processing trends.</p>
            </div>
            
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Country</label>
                        <select className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 font-bold focus:bg-white transition-all" value={country} onChange={e => setCountry(e.target.value)}>
                            <option value="Australia">Australia</option><option value="USA">USA</option><option value="Canada">Canada</option><option value="UK">UK</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Applicant Age</label>
                        <input type="number" className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 font-bold" value={age} onChange={e => setAge(e.target.value)} placeholder="e.g. 24" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Study Gap (Years)</label>
                        <input type="number" className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 font-bold" value={educationGap} onChange={e => setEducationGap(e.target.value)} placeholder="e.g. 2" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Language Band</label>
                        <input className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 font-bold" value={englishScore} onChange={e => setEnglishScore(e.target.value)} placeholder="e.g. 6.5" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Industry Exp (Yrs)</label>
                        <input type="number" className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 font-bold" value={workExp} onChange={e => setWorkExp(e.target.value)} placeholder="e.g. 1" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Prior Rejections?</label>
                        <select className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 font-bold focus:bg-white transition-all" value={refusals} onChange={e => setRefusals(e.target.value)}>
                            <option value="No">No History</option><option value="Yes">Yes, Declared</option>
                        </select>
                    </div>
                </div>

                <button 
                    onClick={handleAnalyze}
                    disabled={loading}
                    className="w-full bg-rose-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-rose-700 transition-all shadow-2xl shadow-rose-100 flex items-center justify-center disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin mr-3" /> : <Activity className="mr-3 text-rose-300" />}
                    {loading ? 'Simulating Decision Trees...' : 'Analyze Approval Probability'}
                </button>
            </div>

            {result && (
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden animate-in slide-in-from-bottom-10 duration-700">
                    <div className="p-8 border-b border-slate-100 bg-rose-50 flex items-center space-x-3">
                        <div className="p-3 bg-white rounded-2xl text-rose-600 shadow-sm"><ShieldAlert size={24}/></div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Risk Assessment Report</h3>
                            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Target: {country} Consulate General</p>
                        </div>
                    </div>
                    <div className="p-10">
                        <div className="prose prose-slate max-w-none">
                            <p className="text-slate-700 whitespace-pre-wrap leading-[1.8] font-medium text-sm">{result}</p>
                        </div>
                        <div className="mt-10 p-6 bg-slate-50 rounded-3xl border border-slate-200 flex items-center space-x-4">
                            <div className="bg-white p-3 rounded-2xl shadow-sm text-slate-400"><Info size={20}/></div>
                            <p className="text-[11px] text-slate-400 font-bold italic leading-relaxed">The risk analyzer utilizes real-time rejection patterns and regional immigration trends. Use this score to strengthen document preparation.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};