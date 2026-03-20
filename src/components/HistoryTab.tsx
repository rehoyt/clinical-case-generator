import { PatientCase } from '../types';
import { History, Clock, ChevronRight, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

interface HistoryTabProps {
  history: PatientCase[];
  onSelect: (patientCase: PatientCase) => void;
  onClear: () => void;
  currentId?: string;
}

export default function HistoryTab({ history, onSelect, onClear, currentId }: HistoryTabProps) {
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-slate-600">
        <History className="w-12 h-12 mb-4 opacity-20" />
        <p className="text-sm">No cases generated yet in this session.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <History className="w-4 h-4" /> Session History
        </h3>
        <button
          onClick={onClear}
          className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1 transition-colors"
        >
          <Trash2 className="w-3 h-3" /> Clear All
        </button>
      </div>

      <div className="space-y-2">
        {history.map((item, index) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelect(item)}
            className={`w-full text-left p-4 rounded-xl border transition-all group ${
              currentId === item.id
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 ring-1 ring-blue-500'
                : 'bg-white dark:bg-[#1a1a1a] border-slate-200 dark:border-slate-800 hover:border-blue-500'
            }`}
          >
            <div className="flex justify-between items-start mb-1">
              <span className="font-bold text-sm text-slate-900 dark:text-white truncate pr-2">
                {item.demographics.name}
              </span>
              <span className="text-[10px] text-slate-400 flex items-center gap-1 shrink-0">
                <Clock className="w-3 h-3" /> {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              {item.input.disease} • {item.demographics.age}
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                item.input.complexity === 'Basic' ? 'bg-green-100 text-green-700' :
                item.input.complexity === 'Intermediate' ? 'bg-orange-100 text-orange-700' :
                'bg-red-100 text-red-700'
              }`}>
                {item.input.complexity}
              </span>
              <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${
                currentId === item.id ? 'text-blue-500' : 'text-slate-300'
              }`} />
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
