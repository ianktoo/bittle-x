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

  // Helper to determine if a specific button is active based on diagonal logic
  const isButtonActive = (type: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'STOP') => {
    if (!activeCommand) return false;
    
    switch (type) {
        case 'UP':
            return [OPEN_CAT_COMMANDS.WALK, OPEN_CAT_COMMANDS.WALK_LEFT, OPEN_CAT_COMMANDS.WALK_RIGHT].includes(activeCommand);
        case 'DOWN':
            return [OPEN_CAT_COMMANDS.BACK, OPEN_CAT_COMMANDS.BACK_LEFT, OPEN_CAT_COMMANDS.BACK_RIGHT].includes(activeCommand);
        case 'LEFT':
            return [OPEN_CAT_COMMANDS.LEFT, OPEN_CAT_COMMANDS.WALK_LEFT, OPEN_CAT_COMMANDS.BACK_LEFT].includes(activeCommand);
        case 'RIGHT':
            return [OPEN_CAT_COMMANDS.RIGHT, OPEN_CAT_COMMANDS.WALK_RIGHT, OPEN_CAT_COMMANDS.BACK_RIGHT].includes(activeCommand);
        case 'STOP':
            return activeCommand === OPEN_CAT_COMMANDS.STOP;
        default:
            return false;
    }
  };

  const getStyle = (type: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'STOP') => {
    const isActive = isButtonActive(type);
    
    if (type !== 'STOP') {
        if (isActive) {
            // Glow effect when active
            return `${btnBase} bg-green-400 border-green-600 text-black scale-95 shadow-[0_0_15px_rgba(74,222,128,0.5)]`;
        }
        return `${btnBase} bg-fun-primary border-yellow-600 text-black hover:bg-yellow-300 active:border-b-0 active:translate-y-1`;
    } else {
        // Stop button
        if (isActive) {
             return `${btnBase} bg-red-500 border-red-700 text-white scale-95 shadow-[0_0_15px_rgba(239,68,68,0.5)]`;
        }
        return `${btnBase} bg-white border-zinc-400 text-black hover:bg-zinc-200 active:border-b-0 active:translate-y-1`;
    }
  };

  return (
    <div className="bg-fun-card p-6 rounded-3xl border-4 border-zinc-800 shadow-2xl w-full max-w-[280px] aspect-square flex flex-col items-center justify-center gap-3">
      {/* Top Row */}
      <div className="grid grid-cols-3 gap-3 w-full h-full">
        <div />
        <button 
          className={`${getStyle('UP')} h-full`}
          onClick={() => onCommand(OPEN_CAT_COMMANDS.WALK)}
          disabled={disabled}
          title="Go Forward"
        >
          <ArrowUp size={36} strokeWidth={3} />
        </button>
        <div />

        {/* Middle Row */}
        <button 
          className={`${getStyle('LEFT')} h-full`}
          onClick={() => onCommand(OPEN_CAT_COMMANDS.LEFT)}
          disabled={disabled}
          title="Turn Left"
        >
          <ArrowLeft size={36} strokeWidth={3} />
        </button>
        <button 
          className={`${getStyle('STOP')} h-full rounded-full`}
          onClick={() => onCommand(OPEN_CAT_COMMANDS.STOP)}
          disabled={disabled}
          title="Stop / Stand"
        >
          <StopCircle size={36} strokeWidth={3} />
        </button>
        <button 
          className={`${getStyle('RIGHT')} h-full`}
          onClick={() => onCommand(OPEN_CAT_COMMANDS.RIGHT)}
          disabled={disabled}
          title="Turn Right"
        >
          <ArrowRight size={36} strokeWidth={3} />
        </button>

        {/* Bottom Row */}
        <div />
        <button 
          className={`${getStyle('DOWN')} h-full`}
          onClick={() => onCommand(OPEN_CAT_COMMANDS.BACK)}
          disabled={disabled}
          title="Go Backward"
        >
          <ArrowDown size={36} strokeWidth={3} />
        </button>
        <div />
      </div>
    </div>
  );
};

export default ControlPad;