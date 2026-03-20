import React, { useState } from 'react';
import { CaseInput, ComplexityLevel } from '../types';
import { Sparkles, Loader2, Settings } from 'lucide-react';
import { motion } from 'motion/react';

interface GeneratorFormProps {
  onGenerate: (input: CaseInput) => void;
  onCancel: () => void;
  isLoading: boolean;
  onOpenSettings: () => void;
  diagnosticMode?: boolean;
}

const EXAMPLES = [
  "Acute Myocardial Infarction",
  "Type 2 Diabetes with DKA",
  "Systemic Lupus Erythematosus",
  "Community-Acquired Pneumonia",
  "Acute Appendicitis",
  "Multiple Sclerosis Flare"
];

const AGE_RANGES = [
  "Pediatric (0-12)",
  "Adolescent (13-18)",
  "Young Adult (19-35)",
  "Middle-Aged (36-64)",
  "Elderly (65-84)",
  "Geriatric (85+)"
];

const COMPLEXITY_LEVELS: { level: ComplexityLevel; description: string }[] = [
  { level: 'Basic', description: 'Classic presentation, straightforward diagnosis, common condition.' },
  { level: 'Intermediate', description: 'Atypical presentation, multiple comorbidities, or less common condition.' },
  { level: 'Advanced', description: 'Rare condition, complex social factors, or significant red herrings.' }
];

const RACES = [
  "White",
  "Black or African American",
  "Hispanic or Latino",
  "Asian",
  "American Indian or Alaska Native",
  "Native Hawaiian or Other Pacific Islander",
  "Middle Eastern or North African",
  "Multiracial",
  "Other"
];

export default function GeneratorForm({ onGenerate, onCancel, isLoading, onOpenSettings, diagnosticMode }: GeneratorFormProps) {
  const [disease, setDisease] = useState('');
  const [ageRange, setAgeRange] = useState(AGE_RANGES[3]);
  const [biologicalSex, setBiologicalSex] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [race, setRace] = useState(RACES[0]);
  const [complexity, setComplexity] = useState<ComplexityLevel>('Basic');
  const [additionalInstructions, setAdditionalInstructions] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate({
      disease,
      ageRange,
      biologicalSex,
      race,
      complexity,
      additionalInstructions
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800"
    >
      {/* Diagnostic Mode Info */}
      {diagnosticMode && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl"
        >
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs mb-2 uppercase tracking-wider">
            <Settings className="w-3 h-3" /> Diagnostic Mode Active
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <p className="text-slate-500 dark:text-slate-400">API Key Source:</p>
              <p className="font-mono font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                {import.meta.env.VITE_GEMINI_API_KEY ? 'Environment (VITE_GEMINI_API_KEY)' : 
                 process.env.GEMINI_API_KEY ? 'Environment (GEMINI_API_KEY)' : 
                 localStorage.getItem('clinical_case_api_key') ? 'Local Storage (Manual)' : 'None Detected'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-slate-500 dark:text-slate-400">Build Version:</p>
              <p className="font-mono font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                v2.3 - {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Disease or Clinical Condition
            </label>
            <button 
              type="button"
              onClick={onOpenSettings}
              className="text-[11px] px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg font-bold flex items-center gap-1.5 transition-all border border-blue-100 dark:border-blue-800"
            >
              <Settings className="w-3.5 h-3.5" /> Setup API Key
            </button>
          </div>
          <input
            type="text"
            value={disease}
            onChange={(e) => setDisease(e.target.value)}
            placeholder="e.g. Heart Failure, Crohn's Disease..."
            className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            required
          />
          <div className="flex flex-wrap gap-2 mt-3">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setDisease(ex)}
                className="text-xs px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Age Range
            </label>
            <select
              value={ageRange}
              onChange={(e) => setAgeRange(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            >
              {AGE_RANGES.map((r) => (
                <option key={r} value={r} className="bg-white dark:bg-[#1a1a1a]">{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Biological Sex
            </label>
            <div className="flex gap-2">
              {(['Male', 'Female', 'Other'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setBiologicalSex(s)}
                  className={`flex-1 py-2 rounded-xl border transition-all ${
                    biologicalSex === s
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'border-slate-200 dark:border-slate-700 hover:border-blue-500'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Race/Ethnicity
            </label>
            <select
              value={race}
              onChange={(e) => setRace(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            >
              {RACES.map((r) => (
                <option key={r} value={r} className="bg-white dark:bg-[#1a1a1a]">{r}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
            Complexity Level
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {COMPLEXITY_LEVELS.map(({ level, description }) => (
              <button
                key={level}
                type="button"
                onClick={() => setComplexity(level)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  complexity === level
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 ring-1 ring-blue-500'
                    : 'border-slate-200 dark:border-slate-700 hover:border-blue-500'
                }`}
              >
                <div className="font-bold text-sm mb-1">{level}</div>
                <div className="text-[10px] leading-tight text-slate-500 dark:text-slate-400">
                  {description}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
            Optional: Additional Instructions
          </label>
          <textarea
            value={additionalInstructions}
            onChange={(e) => setAdditionalInstructions(e.target.value)}
            placeholder="e.g. Set in a rural ER, include an ECG finding, focus on ethical dilemma..."
            className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none transition-all h-24 resize-none"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={isLoading || !disease}
            className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Case...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Clinical Case
              </>
            )}
          </button>
          
          {isLoading && (
            <button
              type="button"
              onClick={onCancel}
              className="py-4 px-6 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-xl font-bold transition-all border border-rose-100 dark:border-rose-800"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </motion.div>
  );
}
