import React from 'react';
import { OPEN_CAT_COMMANDS } from '../types';
import { Music, Mic, Battery, Power, Anchor } from 'lucide-react';

interface SensorsPanelProps {
  onCommand: (cmd: string) => void;
  disabled: boolean;
}

const SensorsPanel: React.FC<SensorsPanelProps> = ({ onCommand, disabled }) => {
  const btnClass = `
    flex flex-col items-center justify-center p-3 rounded-xl border-2 
    bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600
    text-slate-700 dark:text-slate-200 
    hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500 
    transition-all active:scale-95 shadow-sm
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  return (
    <div className="bg-white/60 dark:bg-fun-card/50 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-4 backdrop-blur-sm transition-colors">
      <div className="flex items-center gap-2 mb-4 text-slate-500 dark:text-slate-400 uppercase tracking-widest text-xs font-bold">
        <Power size={14} />
        <span>Senses & Extras</span>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={() => onCommand(OPEN_CAT_COMMANDS.SING)}
          disabled={disabled}
          className={`${btnClass} group`}
        >
          <Music size={24} className="text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-bold mt-1">Sing Song</span>
        </button>
        
        <button 
          onClick={() => onCommand(OPEN_CAT_COMMANDS.BARK)}
          disabled={disabled}
          className={`${btnClass} group`}
        >
          <Mic size={24} className="text-yellow-600 dark:text-yellow-400 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-bold mt-1">Bark</span>
        </button>
        
        <button 
          onClick={() => onCommand(OPEN_CAT_COMMANDS.GYRO_TOGGLE)}
          disabled={disabled}
          className={`${btnClass} group`}
          title="Toggle Gyro/Balance Mode"
        >
          <Anchor size={24} className="text-rose-600 dark:text-rose-400 group-hover:rotate-12 transition-transform" />
          <span className="text-sm font-bold mt-1">Balance</span>
        </button>
        
        <button 
          onClick={() => onCommand(OPEN_CAT_COMMANDS.REST)}
          disabled={disabled}
          className={`${btnClass} group`}
        >
          <Battery size={24} className="text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-bold mt-1">Rest Mode</span>
        </button>
      </div>
    </div>
  );
};

export default SensorsPanel;