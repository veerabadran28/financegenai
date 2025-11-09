import React from 'react';
import { Globe, Briefcase } from 'lucide-react';

interface ModeToggleProps {
  mode: 'web' | 'work';
  onChange: (mode: 'web' | 'work') => void;
}

export const ModeToggle: React.FC<ModeToggleProps> = ({ mode, onChange }) => {
  return (
    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
      <button
        onClick={() => onChange('web')}
        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 font-medium ${
          mode === 'web'
            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
        }`}
      >
        <Globe size={18} />
        <span>Web</span>
      </button>

      <button
        onClick={() => onChange('work')}
        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 font-medium ${
          mode === 'work'
            ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
        }`}
      >
        <Briefcase size={18} />
        <span>Work</span>
      </button>
    </div>
  );
};
