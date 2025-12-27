import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, StopCircle } from 'lucide-react';
import { OPEN_CAT_COMMANDS } from '../types';

interface ControlPadProps {
  onCommand: (cmd: string) => void;
  disabled: boolean;
  activeCommand?: string | null;
}

const ControlPad: React.FC<ControlPadProps> = ({ onCommand, disabled, activeCommand }) => {
  const btnBase = `
    flex items-center justify-center rounded-2xl border-b-4 transition-all duration-100 
    disabled:opacity-50 disabled:cursor-not-allowed
    shadow-lg
  `;

  const isButtonActive = (type: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'STOP') => {
    if (!activeCommand) return false;
    
    switch (type) {
        case 'UP':
            return [OPEN_CAT_COMMANDS.WALK_F, OPEN_CAT_COMMANDS.WALK_L, OPEN_CAT_COMMANDS.WALK_R].includes(activeCommand);
        case 'DOWN':
            return [OPEN_CAT_COMMANDS.BACKWARD, OPEN_CAT_COMMANDS.BACK_L, OPEN_CAT_COMMANDS.BACK_R].includes(activeCommand);
        case 'LEFT':
            return [OPEN_CAT_COMMANDS.WALK_L, OPEN_CAT_COMMANDS.BACK_L, OPEN_CAT_COMMANDS.SPIN_L].includes(activeCommand);
        case 'RIGHT':
            return [OPEN_CAT_COMMANDS.WALK_R, OPEN_CAT_COMMANDS.BACK_R].includes(activeCommand);
        case 'STOP':
            return activeCommand === OPEN_CAT_COMMANDS.BALANCE;
        default:
            return false;
    }
  };

  const getStyle = (type: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'STOP') => {
    const isActive = isButtonActive(type);
    
    if (type !== 'STOP') {
        if (isActive) {
            return `${btnBase} bg-green-400 border-green-600 text-black scale-95 shadow-[0_0_15px_rgba(74,222,128,0.5)]`;
        }
        return `${btnBase} bg-fun-primary border-yellow-600 text-black hover:bg-yellow-300 active:border-b-0 active:translate-y-1`;
    } else {
        if (isActive) {
             return `${btnBase} bg-red-500 border-red-700 text-white scale-95 shadow-[0_0_15px_rgba(239,68,68,0.5)]`;
        }
        return `${btnBase} bg-slate-100 dark:bg-white border-slate-300 dark:border-zinc-400 text-black hover:bg-slate-200 active:border-b-0 active:translate-y-1`;
    }
  };

  return (
    <div className="bg-white dark:bg-fun-card p-6 rounded-3xl border-4 border-slate-200 dark:border-zinc-800 shadow-2xl w-full max-w-[280px] aspect-square flex flex-col items-center justify-center gap-3 transition-colors">
      <div className="grid grid-cols-3 gap-3 w-full h-full">
        <div />
        <button 
          className={`${getStyle('UP')} h-full`}
          onClick={() => onCommand(OPEN_CAT_COMMANDS.WALK_F)}
          disabled={disabled}
          title="Walk Forward (kwkF)"
        >
          <ArrowUp size={36} strokeWidth={3} />
        </button>
        <div />

        <button 
          className={`${getStyle('LEFT')} h-full`}
          onClick={() => onCommand(OPEN_CAT_COMMANDS.SPIN_L)}
          disabled={disabled}
          title="Spin Left (kvtL)"
        >
          <ArrowLeft size={36} strokeWidth={3} />
        </button>
        <button 
          className={`${getStyle('STOP')} h-full rounded-full`}
          onClick={() => onCommand(OPEN_CAT_COMMANDS.BALANCE)}
          disabled={disabled}
          title="Stop / Balance (kbalance)"
        >
          <StopCircle size={36} strokeWidth={3} />
        </button>
        <button 
          className={`${getStyle('RIGHT')} h-full`}
          onClick={() => onCommand('kvtR')} // Implied mirror
          disabled={disabled}
          title="Spin Right (kvtR)"
        >
          <ArrowRight size={36} strokeWidth={3} />
        </button>

        <div />
        <button 
          className={`${getStyle('DOWN')} h-full`}
          onClick={() => onCommand(OPEN_CAT_COMMANDS.BACKWARD)}
          disabled={disabled}
          title="Go Backward (kbk)"
        >
          <ArrowDown size={36} strokeWidth={3} />
        </button>
        <div />
      </div>
    </div>
  );
};

export default ControlPad;