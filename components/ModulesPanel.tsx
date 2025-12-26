import React, { useState } from 'react';
import { Settings, RefreshCcw, Hand, Maximize2, Activity, BatteryCharging, PlayCircle, Eye, Aperture, User, CircleDot, Layers } from 'lucide-react';
import { OPEN_CAT_COMMANDS } from '../types';

interface ModulesPanelProps {
  onCommand: (cmd: string) => void;
  disabled: boolean;
  advancedGaits?: boolean;
  onToggleAdvancedGaits?: () => void;
}

const ModulesPanel: React.FC<ModulesPanelProps> = ({ onCommand, disabled, advancedGaits, onToggleAdvancedGaits }) => {
  const [headPan, setHeadPan] = useState(0);
  const [headTilt, setHeadTilt] = useState(0);
  const [customCmd, setCustomCmd] = useState('');

  // Send servo command immediately
  const handleServoChange = (joint: number, angle: number) => {
    // Joint 0 = Head Pan, Joint 1 = Head Tilt
    if (joint === 0) setHeadPan(angle);
    if (joint === 1) setHeadTilt(angle);
    
    // Throttle slightly or send direct
    onCommand(`m${joint} ${angle}`); 
  };

  const handleCustomSend = () => {
    if (customCmd.trim()) {
      onCommand(customCmd);
      setCustomCmd('');
    }
  };

  const btnClass = "flex flex-col items-center gap-2 p-3 bg-slate-800 rounded-xl border border-slate-700 hover:bg-slate-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="bg-fun-card/50 border border-slate-700 rounded-3xl p-5 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-4 text-fun-primary font-bold uppercase tracking-wider text-sm border-b border-slate-700 pb-2">
        <Settings size={18} />
        <span>Modules & Config</span>
      </div>

      <div className="space-y-6">
        
        {/* Modes */}
        <div className="grid grid-cols-3 gap-3">
          <button 
            onClick={() => onCommand(OPEN_CAT_COMMANDS.RANDOM_MIND)}
            disabled={disabled}
            className={`${btnClass} hover:border-pink-500/50`}
            title="Toggle Random Autonomous Behavior (z)"
          >
            <RefreshCcw size={24} className="text-pink-400" />
            <span className="text-xs font-bold text-slate-300">Toggle Auto</span>
          </button>

          <button 
            onClick={() => onCommand(OPEN_CAT_COMMANDS.GYRO_TOGGLE)}
            disabled={disabled}
            className={btnClass}
            title="Toggle Gyro Balance"
          >
            <Activity size={24} className="text-blue-400" />
            <span className="text-xs font-bold text-slate-300">Gyro</span>
          </button>
          
          {onToggleAdvancedGaits && (
            <button 
                onClick={onToggleAdvancedGaits}
                disabled={disabled}
                className={`${btnClass} ${advancedGaits ? 'border-green-500/50 bg-green-900/20' : ''}`}
                title="Use Bittle X specific diagonal gaits"
            >
                <Layers size={24} className={advancedGaits ? 'text-green-400' : 'text-slate-500'} />
                <span className="text-xs font-bold text-slate-300">
                    {advancedGaits ? 'X Gaits: ON' : 'X Gaits: OFF'}
                </span>
            </button>
          )}
        </div>

        {/* AI Camera / Vision Section */}
        <div className="bg-slate-900/50 p-4 rounded-xl space-y-3 border border-slate-700/50">
           <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
             <div className="flex items-center gap-2">
               <Eye size={14} className="text-fun-primary" /> 
               <span>AI Camera (Grove)</span>
             </div>
             <span className="text-[10px] text-slate-500 bg-black/40 px-2 py-0.5 rounded">Check LEDs</span>
           </div>
           
           <div className="grid grid-cols-3 gap-2">
             <button 
               onClick={() => onCommand(OPEN_CAT_COMMANDS.VISION.STOP)}
               disabled={disabled}
               className="bg-red-900/30 border border-red-900/50 text-red-200 text-xs font-bold py-2 rounded hover:bg-red-900/50 transition-colors"
             >
               OFF
             </button>
             <button 
               onClick={() => onCommand(OPEN_CAT_COMMANDS.VISION.FACE)}
               disabled={disabled}
               className="bg-blue-900/30 border border-blue-900/50 text-blue-200 text-xs font-bold py-2 rounded hover:bg-blue-900/50 transition-colors flex flex-col items-center"
               title="Look for Blue LED"
             >
               <User size={14} className="mb-1" />
               Face (Blue)
             </button>
             <button 
               onClick={() => onCommand(OPEN_CAT_COMMANDS.VISION.COLOR)}
               disabled={disabled}
               className="bg-green-900/30 border border-green-900/50 text-green-200 text-xs font-bold py-2 rounded hover:bg-green-900/50 transition-colors flex flex-col items-center"
               title="Look for Green LED (Ball)"
             >
               <CircleDot size={14} className="mb-1" />
               Ball (Green)
             </button>
           </div>
        </div>

        {/* Head / Gripper Control */}
        <div className="bg-slate-900/50 p-4 rounded-xl space-y-4">
           <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-2">
             <Hand size={14} /> Head / Gripper / Arm
           </div>
           
           {/* Pan */}
           <div className="space-y-1">
             <div className="flex justify-between text-xs text-slate-500">
               <span>Pan (Joint 0)</span>
               <span>{headPan}°</span>
             </div>
             <input 
               type="range" min="-120" max="120" value={headPan} 
               onChange={(e) => handleServoChange(0, parseInt(e.target.value))}
               disabled={disabled}
               className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-fun-primary"
             />
           </div>

           {/* Tilt */}
           <div className="space-y-1">
             <div className="flex justify-between text-xs text-slate-500">
               <span>Tilt (Joint 1)</span>
               <span>{headTilt}°</span>
             </div>
             <input 
               type="range" min="-30" max="100" value={headTilt} 
               onChange={(e) => handleServoChange(1, parseInt(e.target.value))}
               disabled={disabled}
               className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-fun-primary"
             />
           </div>
        </div>

        {/* Advanced / Sensors */}
        <div className="bg-slate-900/50 p-4 rounded-xl space-y-3">
           <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase">
             <Maximize2 size={14} /> Advanced
           </div>
           
           <div className="flex gap-2">
             <input 
               type="text" 
               value={customCmd}
               onChange={(e) => setCustomCmd(e.target.value)}
               placeholder="e.g. m8 30 or kbk"
               className="flex-1 bg-black/30 border border-slate-600 rounded px-2 py-1 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-fun-primary"
               disabled={disabled}
             />
             <button 
               onClick={handleCustomSend}
               disabled={disabled}
               className="bg-fun-primary hover:bg-yellow-300 text-black p-2 rounded transition-colors disabled:opacity-50"
             >
               <PlayCircle size={18} />
             </button>
           </div>
        </div>

      </div>
    </div>
  );
};

export default ModulesPanel;