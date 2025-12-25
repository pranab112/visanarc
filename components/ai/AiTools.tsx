import React, { useState, useEffect, useRef } from 'react';
import { Mic, PenTool, Calculator, Activity, Square, GraduationCap, MapPin, Wallet, Sparkles, Loader2, Landmark, Copy, CheckCircle2, RotateCw, ShieldAlert, TrendingUp, Info, ChevronRight, MessageSquare, Trash2, Globe, Newspaper, Download, Send, Search, ExternalLink, Volume2 } from 'lucide-react';
import { generateSop, analyzeVisaRisk, recommendUniversities, UniRecommendation, getImmigrationNews, connectLiveInterview, encodePCM, decodePCM, decodeAudioData } from '../../services/geminiService';
import { PRPointsCriteria, Country } from '../../types';

export const AiTools: React.FC = () => {
  const [activeTool, setActiveTool] = useState<'sop' | 'interview' | 'pr' | 'risk' | 'uni-matcher' | 'news'>('uni-matcher');

  const tools = [
    { id: 'uni-matcher', label: 'Uni Matcher', desc: 'Predict best-fit universities', icon: GraduationCap },
    { id: 'sop', label: 'SOP DRAFT AI', desc: 'Streamlined, high-success drafts', icon: PenTool },
    { id: 'news', label: 'Immigration Pulse', desc: 'Real-time grounded updates', icon: Newspaper },
    { id: 'interview', label: 'Live Mock Interview', desc: 'Real-time voice practice', icon: Mic },
    { id: 'pr', label: 'PR Calculator', desc: 'Score your migration path', icon: Calculator },
    { id: 'risk', label: 'Risk Analyzer', desc: 'Predict visa outcomes', icon: Activity },
  ];

  return (
    <div className="h-full flex flex-col lg:flex-row bg-slate-50/50 overflow-hidden">
      <aside className="w-full lg:w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 z-10 shadow-sm">
        <div className="p-6 border-b border-slate-100">
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center">
                <Sparkles className="mr-2 text-indigo-600 animate-pulse" size={24} />
                Genius AI Suite
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Intelligence Layer v3.2</p>
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
                    <span className="text-[10px] font-black uppercase tracking-widest">Enterprise AI</span>
                </div>
                <p className="text-[10px] text-indigo-400 font-medium leading-tight">Grounded results powered by Gemini 3.</p>
            </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto custom-scrollbar relative">
        <div className="p-8 lg:p-12 max-w-5xl mx-auto">
            {activeTool === 'uni-matcher' && <UniMatcher />}
            {activeTool === 'sop' && <SopGenerator />}
            {activeTool === 'interview' && <VoiceInterviewLive />}
            {activeTool === 'pr' && <PrCalculator />}
            {activeTool === 'risk' && <RiskAnalyzer />}
            {activeTool === 'news' && <ImmigrationPulse />}
        </div>
      </main>
    </div>
  );
};

const VoiceInterviewLive = () => {
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [country, setCountry] = useState('Australia');
    const [status, setStatus] = useState('Standby');
    const sessionRef = useRef<any>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    const stopSession = () => {
        if (sessionRef.current) {
            sessionRef.current.close();
            sessionRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        sourcesRef.current.forEach(s => s.stop());
        sourcesRef.current.clear();
        setIsSessionActive(false);
        setStatus('Session Ended');
    };

    const startSession = async () => {
        try {
            setStatus('Requesting Media...');
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            setStatus('Connecting to Gemini Live...');
            const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            audioContextRef.current = outputCtx;

            const sessionPromise = connectLiveInterview({
                onopen: () => {
                    setStatus('Live: Interview in Progress');
                    const source = inputCtx.createMediaStreamSource(stream);
                    const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
                    scriptProcessorRef.current = scriptProcessor;
                    
                    scriptProcessor.onaudioprocess = (e) => {
                        const inputData = e.inputBuffer.getChannelData(0);
                        const int16 = new Int16Array(inputData.length);
                        for (let i = 0; i < inputData.length; i++) {
                            int16[i] = inputData[i] * 32768;
                        }
                        const pcmBlob = {
                            data: encodePCM(new Uint8Array(int16.buffer)),
                            mimeType: 'audio/pcm;rate=16000',
                        };
                        sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
                    };
                    source.connect(scriptProcessor);
                    scriptProcessor.connect(inputCtx.destination);
                },
                onmessage: async (message: any) => {
                    const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                    if (base64Audio) {
                        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                        const audioBuffer = await decodeAudioData(decodePCM(base64Audio), outputCtx, 24000, 1);
                        const source = outputCtx.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(outputCtx.destination);
                        source.addEventListener('ended', () => sourcesRef.current.delete(source));
                        source.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += audioBuffer.duration;
                        sourcesRef.current.add(source);
                    }
                    if (message.serverContent?.interrupted) {
                        sourcesRef.current.forEach(s => s.stop());
                        sourcesRef.current.clear();
                        nextStartTimeRef.current = 0;
                    }
                },
                onerror: () => setStatus('Connection Error'),
                onclose: () => stopSession(),
            }, country);

            sessionRef.current = await sessionPromise;
            setIsSessionActive(true);
        } catch (err) {
            console.error(err);
            setStatus('Failed to connect');
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-12 animate-in fade-in duration-500 text-center">
            <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Live Interview Simulator</h2>
                <p className="text-slate-500 font-medium mt-1">Real-time low-latency voice practice with an AI Visa Officer.</p>
            </div>

            <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-200">
                <div className="max-w-xs mx-auto mb-10">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Interview Protocol</label>
                    <select 
                        value={country} 
                        onChange={e => setCountry(e.target.value)}
                        disabled={isSessionActive}
                        className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 font-bold focus:bg-white outline-none text-center disabled:opacity-50"
                    >
                        <option value="Australia">Australia GTE</option>
                        <option value="USA">USA F1 Credibility</option>
                        <option value="UK">UK CAS Verification</option>
                    </select>
                </div>

                <div className={`p-16 rounded-[3rem] transition-all duration-700 relative overflow-hidden mb-12 ${isSessionActive ? 'bg-indigo-600 shadow-2xl shadow-indigo-200' : 'bg-slate-900 shadow-xl'}`}>
                    <div className="relative z-10">
                        <div className="flex justify-center items-center space-x-3 mb-6">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className={`w-1.5 rounded-full transition-all duration-300 ${isSessionActive ? 'bg-white animate-pulse' : 'bg-slate-700'}`} style={{ height: isSessionActive ? `${20 + Math.random()*60}px` : '10px', animationDelay: `${i*150}ms` }} />
                            ))}
                        </div>
                        <p className={`text-xs font-black uppercase tracking-[0.3em] mb-2 ${isSessionActive ? 'text-indigo-200' : 'text-slate-500'}`}>{status}</p>
                        <h3 className="text-white text-lg font-bold">{isSessionActive ? 'Speak naturally to the officer' : 'Awaiting initialization...'}</h3>
                    </div>
                </div>

                <div className="flex flex-col items-center">
                    <button 
                        onClick={isSessionActive ? stopSession : startSession}
                        className={`h-24 w-24 rounded-full flex items-center justify-center shadow-2xl transition-all relative ${
                            isSessionActive 
                            ? 'bg-rose-500 text-white scale-110 ring-8 ring-rose-500/10 animate-pulse' 
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105'
                        }`}
                    >
                        {isSessionActive ? <Square size={32} fill="currentColor" /> : <Mic size={36} />}
                    </button>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-6">{isSessionActive ? 'Click to end session' : 'Start Mock Interview'}</p>
                </div>
            </div>
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
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">SOP DRAFT AI</h2>
        <p className="text-slate-500 font-medium mt-1">Architecting original, narrative-driven Statements of Purpose tailored for high-tier academic success.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
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
                    {loading ? <Loader2 className="animate-spin" /> : 'Draft Original Statement'}
                  </button>
              </div>
          </div>

          <div className="lg:col-span-7 flex flex-col min-h-[500px]">
              {result ? (
                <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-700">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Original Draft #1</span>
                        <button onClick={handleCopy} className="p-2.5 rounded-xl bg-white border border-slate-200 text-indigo-600 shadow-sm hover:bg-indigo-600 hover:text-white transition-all flex items-center">
                            {copied ? <CheckCircle2 size={16} className="mr-2"/> : <Copy size={16} className="mr-2"/>}
                            <span className="text-[10px] font-black uppercase">{copied ? 'Copied' : 'Copy Text'}</span>
                        </button>
                    </div>
                    <div className="p-10 overflow-y-auto custom-scrollbar flex-1">
                        <p className="whitespace-pre-wrap text-slate-700 text-sm leading-[2] font-serif selection:bg-indigo-100">{result}</p>
                    </div>
                </div>
              ) : (
                <div className="flex-1 rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 p-12 text-center">
                    <PenTool size={64} className="mb-6 opacity-10" />
                    <h3 className="font-black text-slate-400 uppercase tracking-widest">Narrative Workspace</h3>
                    <p className="text-xs font-medium mt-2 max-w-xs">Fill in student background on the left to architect an original academic statement.</p>
                </div>
              )}
          </div>
      </div>
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
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">PR Points Matrix</h2>
                <p className="text-slate-500 font-medium mt-1">Precise calculation for Australia Skilled Migration.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Applicant Age</label>
                            <input type="number" value={criteria.age} onChange={e => setCriteria({...criteria, age: parseInt(e.target.value)})} className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 font-bold focus:bg-white transition-all" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">English Competency</label>
                            <select value={criteria.englishLevel} onChange={e => setCriteria({...criteria, englishLevel: e.target.value as any})} className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 font-bold">
                                <option value="Competent">Competent (IELTS 6)</option>
                                <option value="Proficient">Proficient (IELTS 7)</option>
                                <option value="Superior">Superior (IELTS 8)</option>
                            </select>
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
                        <button onClick={calculate} className="relative z-10 w-full bg-white text-slate-900 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-100 transition-all shadow-xl active:scale-95">Recalculate</button>
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
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAnalyze = async () => {
        setLoading(true);
        const profile = `Age: ${age}, Education Gap: ${educationGap} years, English Score: ${englishScore}.`;
        const res = await analyzeVisaRisk(profile, country);
        setResult(res);
        setLoading(false);
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <div className="text-center">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Visa Outcome Predictor</h2>
                <p className="text-slate-500 font-medium mt-1">AI-driven predictive analysis based on trends.</p>
            </div>
            
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Country</label>
                        <select className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 font-bold" value={country} onChange={e => setCountry(e.target.value)}>
                            <option value="Australia">Australia</option><option value="USA">USA</option><option value="Canada">Canada</option><option value="UK">UK</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Applicant Age</label>
                        <input type="number" className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 font-bold" value={age} onChange={e => setAge(e.target.value)} placeholder="e.g. 24" />
                    </div>
                </div>
                <button 
                    onClick={handleAnalyze}
                    disabled={loading}
                    className="w-full bg-rose-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-rose-700 transition-all shadow-2xl disabled:opacity-50 flex items-center justify-center"
                >
                    {loading ? <Loader2 className="animate-spin mr-3" /> : <Activity className="mr-3" />}
                    {loading ? 'Analyzing...' : 'Predict Approval Probability'}
                </button>
            </div>

            {result && (
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden animate-in slide-in-from-bottom-10 duration-700 p-10">
                    <p className="text-slate-700 whitespace-pre-wrap leading-[1.8] font-medium text-sm">{result}</p>
                </div>
            )}
        </div>
    );
};

const ImmigrationPulse = () => {
    const [country, setCountry] = useState('Australia');
    const [loading, setLoading] = useState(false);
    const [news, setNews] = useState<{ text: string, sources: any[] } | null>(null);

    const handleFetchNews = async () => {
        setLoading(true);
        const result = await getImmigrationNews(country);
        setNews(result);
        setLoading(false);
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Immigration Pulse</h2>
                    <p className="text-slate-500 font-medium mt-1">Grounded real-time news and policy updates from global embassies.</p>
                </div>
                <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm w-full md:w-auto">
                    <select 
                        className="bg-transparent px-4 py-2.5 text-xs font-black uppercase tracking-widest text-indigo-700 outline-none"
                        value={country}
                        onChange={e => setCountry(e.target.value)}
                    >
                        {Object.values(Country).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button 
                        onClick={handleFetchNews}
                        disabled={loading}
                        className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center"
                    >
                        {loading ? <Loader2 className="animate-spin mr-2" size={14}/> : <RotateCw className="mr-2" size={14}/>}
                        Sync Updates
                    </button>
                </div>
            </div>

            {news ? (
                <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-700">
                    <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-200">
                        <div className="flex items-center space-x-2 mb-6">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Newspaper size={18}/></div>
                            <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">Policy Intelligence Summary</h3>
                        </div>
                        <div className="prose prose-slate max-w-none">
                            <p className="text-slate-700 leading-[1.8] font-medium whitespace-pre-wrap">{news.text}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 flex items-center">
                            <Globe size={12} className="mr-2"/> Verified Grounding Sources
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {news.sources.map((source, i) => (
                                <a 
                                    key={i} 
                                    href={source.uri} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-300 hover:shadow-lg transition-all flex items-center justify-between group"
                                >
                                    <div className="flex items-center space-x-3 truncate">
                                        <div className="p-2 bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 rounded-lg">
                                            <ExternalLink size={16}/>
                                        </div>
                                        <span className="text-sm font-bold text-slate-700 truncate">{source.title || source.uri}</span>
                                    </div>
                                    <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-400" />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-slate-900 text-white rounded-[3rem] p-12 text-center shadow-2xl relative overflow-hidden group">
                    <div className="relative z-10">
                        <Globe size={64} className="mx-auto mb-6 text-indigo-400 animate-[spin_10s_linear_infinite]" />
                        <h3 className="text-2xl font-black mb-3">Disconnected from Live Feeds</h3>
                        <p className="text-slate-400 max-w-md mx-auto leading-relaxed mb-10">
                            Sync with our intelligence engine to fetch the latest immigration rules, cap updates, and visa news for {country}.
                        </p>
                        <button 
                            onClick={handleFetchNews}
                            disabled={loading}
                            className="bg-white text-slate-900 px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-100 transition-all shadow-xl active:scale-95 disabled:opacity-50"
                        >
                            Establish Search Link
                        </button>
                    </div>
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                </div>
            )}
        </div>
    );
};