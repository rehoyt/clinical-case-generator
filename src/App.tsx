import { useState, useEffect } from 'react';
import { PatientCase, CaseInput } from './types';
import { generatePatientCase, testApiKey, getApiKeySource, isPlaceholder } from './services/geminiService';
import GeneratorForm from './components/GeneratorForm';
import CaseView from './components/CaseView';
import HistoryTab from './components/HistoryTab';
import ThemeToggle from './components/ThemeToggle';
import { Stethoscope, Plus, History as HistoryIcon, AlertCircle, X, Settings, CheckCircle2, Loader2, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Tab = 'generator' | 'case' | 'history';

export default function App() {
  const [currentCase, setCurrentCase] = useState<PatientCase | null>(null);
  const [history, setHistory] = useState<PatientCase[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('generator');
  const [error, setError] = useState<string | null>(null);
  const [manualApiKey, setManualApiKey] = useState<string>('');
  const [isKeySetupOpen, setIsKeySetupOpen] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [diagnosticMode, setDiagnosticMode] = useState(false);

  // Load history and manual key from session/local storage on mount
  useEffect(() => {
    const savedHistory = sessionStorage.getItem('clinical_case_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }

    const savedKey = localStorage.getItem('clinical_case_api_key');
    if (savedKey) setManualApiKey(savedKey);
  }, []);

  // Save history to session storage
  useEffect(() => {
    sessionStorage.setItem('clinical_case_history', JSON.stringify(history));
  }, [history]);

  // Save manual key to local storage
  useEffect(() => {
    if (manualApiKey) {
      localStorage.setItem('clinical_case_api_key', manualApiKey);
    }
  }, [manualApiKey]);

  const handleGenerate = async (input: CaseInput) => {
    const controller = new AbortController();
    setAbortController(controller);
    setIsLoading(true);
    setError(null);
    try {
      const newCase = await generatePatientCase(input, manualApiKey, controller.signal);
      setCurrentCase(newCase);
      setHistory(prev => [newCase, ...prev]);
      setActiveTab('case');
    } catch (err: any) {
      console.error(err);
      if (err.name === 'AbortError') {
        setError('Generation was cancelled.');
      } else if (err.message === 'API_KEY_MISSING') {
        setIsKeySetupOpen(true);
      } else {
        const errorMsg = err.message || (typeof err === 'string' ? err : 'An unknown error occurred');
        setError(`${errorMsg}. Please check your API key and try again.`);
      }
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const cancelGeneration = () => {
    if (abortController) {
      abortController.abort();
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const handleTestKey = async () => {
    setIsTestingKey(true);
    setTestResult(null);
    try {
      const success = await testApiKey(manualApiKey);
      if (success) {
        setTestResult({ success: true, message: "API Key is working correctly!" });
      } else {
        setTestResult({ success: false, message: "API Key is valid but the response was unexpected." });
      }
    } catch (err: any) {
      console.error(err);
      setTestResult({ 
        success: false, 
        message: err.message || "Failed to verify API Key. Please check the key and try again." 
      });
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleSelectCase = (c: PatientCase) => {
    setCurrentCase(c);
    setActiveTab('case');
  };

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear your session history?')) {
      setHistory([]);
      if (activeTab === 'history') setActiveTab('generator');
    }
  };

  return (
    <div className="min-h-screen font-sans selection:bg-blue-100 dark:selection:bg-blue-900/40">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <Stethoscope className="w-5 h-5" />
            </div>
            <h1 className="font-bold text-lg tracking-tight text-slate-900 dark:text-white hidden sm:block">
              ClinicalCase <span className="text-blue-600">AI</span>
              <button 
                onClick={() => setDiagnosticMode(!diagnosticMode)}
                className={`ml-2 text-[12px] font-bold text-white px-2 py-0.5 rounded-full animate-pulse shadow-lg transition-all ${
                  diagnosticMode ? 'bg-emerald-600 shadow-emerald-500/40' : 'bg-rose-600 shadow-rose-500/40'
                }`}
              >
                v2.3 - {diagnosticMode ? 'DIAGNOSTIC' : 'LATEST'}
              </button>
            </h1>
          </div>

          <nav className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('generator')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'generator'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Plus className="w-4 h-4" /> <span className="hidden xs:inline">Generate</span>
            </button>
            <button
              onClick={() => currentCase && setActiveTab('case')}
              disabled={!currentCase}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'case'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 disabled:opacity-30'
              }`}
            >
              <FileText className="w-4 h-4" /> <span className="hidden xs:inline">Case View</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'history'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <HistoryIcon className="w-4 h-4" /> <span className="hidden xs:inline">History</span>
            </button>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button 
              onClick={() => setIsKeySetupOpen(true)}
              className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-500 hover:text-blue-600 dark:hover:text-blue-400"
              title="API Settings"
            >
              <Settings className="w-5 h-5" />
              <span className="text-sm font-medium hidden md:inline">Settings</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {/* Prominent API Key Banner if missing */}
          {!isPlaceholder(getApiKeySource(manualApiKey)) && getApiKeySource(manualApiKey) === "None" && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                  API Key is not configured. The generator will not work until you set it up.
                </p>
              </div>
              <button 
                onClick={() => setIsKeySetupOpen(true)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20 whitespace-nowrap"
              >
                Setup API Key
              </button>
            </motion.div>
          )}

          {isKeySetupOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-8 shadow-2xl border border-slate-200 dark:border-slate-800"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">API Key Setup</h3>
                  <button onClick={() => setIsKeySetupOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-4 mb-6">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    To generate clinical cases, you need a Gemini API Key. You have two options:
                  </p>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800 text-xs space-y-2">
                    <p className="font-bold text-blue-700 dark:text-blue-400">Option 1: AI Studio Secrets (Recommended)</p>
                    <ol className="list-decimal list-inside text-blue-600 dark:text-blue-300 space-y-1">
                      <li>Click the ⚙️ <strong>Settings</strong> icon in the top-right of the <strong>AI Studio interface</strong>.</li>
                      <li>Select <strong>Secrets</strong>.</li>
                      <li>Add a secret named <strong>EXACTLY</strong> <code>GOOGLE_API_KEY</code> (if <code>GEMINI_API_KEY</code> is reserved).</li>
                      <li>Paste your key and press <strong>Enter</strong>.</li>
                      <li>The app will rebuild automatically.</li>
                    </ol>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                    Or use Option 2 below to paste it directly into this browser session.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Gemini API Key</label>
                      {manualApiKey && (
                        <button 
                          onClick={() => {
                            setManualApiKey('');
                            localStorage.removeItem('clinical_case_api_key');
                            setTestResult(null);
                          }}
                          className="text-[10px] text-rose-500 hover:underline font-bold uppercase tracking-widest"
                        >
                          Clear Key
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={manualApiKey}
                        onChange={(e) => {
                          setManualApiKey(e.target.value);
                          setTestResult(null);
                        }}
                        placeholder="Paste your key here..."
                        className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                      <button
                        onClick={handleTestKey}
                        disabled={!manualApiKey || isTestingKey}
                        className="px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center min-w-[100px]"
                      >
                        {isTestingKey ? <Loader2 className="w-4 h-4 animate-spin" /> : "Test Key"}
                      </button>
                    </div>
                  </div>

                  {testResult && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-2xl border flex items-start gap-3 ${
                        testResult.success 
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400' 
                          : 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800 text-rose-700 dark:text-rose-400'
                      }`}
                    >
                      {testResult.success ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                      <p className="text-xs leading-relaxed">{testResult.message}</p>
                    </motion.div>
                  )}
                  
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">System Diagnostics</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Active Key Source:</span>
                        <span className="text-blue-500 font-bold">
                          {getApiKeySource(manualApiKey)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">GEMINI_API_KEY:</span>
                        <span className={!isPlaceholder(process.env.GEMINI_API_KEY) ? "text-emerald-500 font-bold" : "text-rose-500"}>
                          {!isPlaceholder(process.env.GEMINI_API_KEY) ? "DETECTED" : "NOT FOUND"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">GOOGLE_API_KEY:</span>
                        <span className={!isPlaceholder(process.env.GOOGLE_API_KEY) ? "text-emerald-500 font-bold" : "text-rose-500"}>
                          {!isPlaceholder(process.env.GOOGLE_API_KEY) ? "DETECTED" : "NOT FOUND"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">API_KEY:</span>
                        <span className={!isPlaceholder(process.env.API_KEY) ? "text-emerald-500 font-bold" : "text-rose-500"}>
                          {!isPlaceholder(process.env.API_KEY) ? "DETECTED" : "NOT FOUND"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-200 dark:border-slate-700 mt-2">
                        <span className="text-slate-500">Build Version:</span>
                        <span className="text-slate-700 dark:text-slate-300 font-mono">2.3</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Build Time:</span>
                        <span className="text-slate-700 dark:text-slate-300 font-mono text-[9px]">{new Date().toISOString()}</span>
                      </div>
                      <p className="text-[9px] text-slate-400 mt-2 italic">
                        Note: After adding a secret, the app rebuilds automatically. If it still says "NOT FOUND", check the name in AI Studio Secrets.
                      </p>
                      <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-3">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Detected Source:</span>
                          <span className="text-blue-600 font-mono font-bold">
                            {getApiKeySource(manualApiKey)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Manual Key (Browser):</span>
                          <span className={!isPlaceholder(manualApiKey) ? "text-emerald-500 font-bold" : "text-rose-500"}>
                            {!isPlaceholder(manualApiKey) ? "ACTIVE" : "NOT SET"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                        <p className="text-[9px] text-slate-400 italic">
                          Vercel users: Ensure keys are set in Project Settings.
                        </p>
                        <button 
                          onClick={() => window.location.reload()}
                          className="text-[10px] text-blue-500 hover:underline font-bold uppercase tracking-widest"
                        >
                          Reload App
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsKeySetupOpen(false)}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20"
                  >
                    Save & Close
                  </button>
                  
                  <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block text-center text-xs text-blue-600 hover:underline"
                  >
                    Get a free API key here
                  </a>
                </div>
              </motion.div>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-8 p-6 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-3xl flex flex-col md:flex-row items-center gap-6"
            >
              <div className="p-3 bg-rose-100 dark:bg-rose-900/40 rounded-2xl">
                <AlertCircle className="w-8 h-8 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-lg font-bold text-rose-900 dark:text-white mb-1">Configuration Error</h3>
                <p className="text-rose-700 dark:text-rose-300 text-sm leading-relaxed">
                  {error === 'API_KEY_MISSING' 
                    ? "Your Gemini API Key is missing. Please set it up to continue generating cases." 
                    : error}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsKeySetupOpen(true)}
                  className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-rose-500/20 whitespace-nowrap"
                >
                  Setup API Key
                </button>
                <button 
                  onClick={() => setError(null)}
                  className="p-3 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-xl transition-colors text-rose-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'generator' && (
            <motion.div
              key="generator"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Synthetic Patient Generator</h2>
                <p className="text-slate-500 dark:text-slate-400">Create richly detailed, realistic clinical scenarios for medical education.</p>
              </div>
              <GeneratorForm 
                onGenerate={handleGenerate} 
                onCancel={cancelGeneration}
                isLoading={isLoading} 
                onOpenSettings={() => setIsKeySetupOpen(true)}
                diagnosticMode={diagnosticMode}
              />
            </motion.div>
          )}

          {activeTab === 'case' && currentCase && (
            <motion.div
              key="case"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
            >
              <CaseView 
                patientCase={currentCase} 
                onReset={() => setActiveTab('generator')}
                diagnosticMode={diagnosticMode}
              />
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-2xl mx-auto"
            >
              <HistoryTab
                history={history}
                onSelect={handleSelectCase}
                onClear={clearHistory}
                currentId={currentCase?.id}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-slate-400 dark:text-slate-600 text-xs">
        <p>© 2026 ClinicalCase AI • For Educational Purposes Only • Powered by Gemini AI</p>
      </footer>
    </div>
  );
}

