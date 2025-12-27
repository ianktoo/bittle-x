import React from 'react';
import { RobotSkill, OPEN_CAT_COMMANDS } from '../types';
import { 
  Heart, 
  Activity, 
  Hand, 
  Moon, 
  Smile, 
  Trophy, 
  Zap, 
  Star, 
  Shield, 
  Ghost, 
  Swords, 
  Waves,
  Search,
  Fingerprint
} from 'lucide-react';

interface SkillGridProps {
  onCommand: (cmd: string) => void;
  disabled: boolean;
}

const skills: RobotSkill[] = [
  // Movement / Acrobatics
  { id: 'backflip', name: 'Backflip', command: OPEN_CAT_COMMANDS.BACKFLIP, category: 'movement' },
  { id: 'frontflip', name: 'Frontflip', command: OPEN_CAT_COMMANDS.FRONTFLIP, category: 'movement' },
  { id: 'handstand', name: 'Handstand', command: OPEN_CAT_COMMANDS.HANDSTAND, category: 'movement' },
  { id: 'moonwalk', name: 'Moonwalk', command: OPEN_CAT_COMMANDS.MOONWALK, category: 'movement' },
  { id: 'kick', name: 'Kick!', command: OPEN_CAT_COMMANDS.KICK, category: 'movement' },
  { id: 'boxing', name: 'Boxing', command: OPEN_CAT_COMMANDS.BOXING, category: 'movement' },
  { id: 'pushup', name: 'Push Ups', command: OPEN_CAT_COMMANDS.PUSH_UPS, category: 'movement' },
  { id: 'recover', name: 'Recover', command: OPEN_CAT_COMMANDS.RECOVER, category: 'movement' },
  
  // Social / Funny
  { id: 'hi', name: 'Say Hi', command: OPEN_CAT_COMMANDS.HI, category: 'social' },
  { id: 'fiv', name: 'High Five', command: OPEN_CAT_COMMANDS.HIGH_FIVE, category: 'social' },
  { id: 'hg', name: 'Hug', command: OPEN_CAT_COMMANDS.HUG, category: 'social' },
  { id: 'gdb', name: 'Good Boy!', command: OPEN_CAT_COMMANDS.GOOD_BOY, category: 'social' },
  { id: 'wh', name: 'Wave Head', command: OPEN_CAT_COMMANDS.WAVE_HEAD, category: 'social' },
  { id: 'scrh', name: 'Scratch', command: OPEN_CAT_COMMANDS.SCRATCH, category: 'social' },
  { id: 'snf', name: 'Sniff', command: OPEN_CAT_COMMANDS.SNIFF, category: 'social' },
  { id: 'cheers', name: 'Cheers!', command: OPEN_CAT_COMMANDS.CHEERS, category: 'social' },
  { id: 'rl', name: 'Roll Over', command: OPEN_CAT_COMMANDS.ROLL, category: 'social' },
  { id: 'pd', name: 'Play Dead', command: OPEN_CAT_COMMANDS.PLAY_DEAD, category: 'social' },
];

const SkillGrid: React.FC<SkillGridProps> = ({ onCommand, disabled }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {skills.map((skill) => (
        <button
          key={skill.id}
          onClick={() => onCommand(skill.command)}
          disabled={disabled}
          className={`
            relative overflow-hidden group p-4 rounded-xl border-b-4 transition-all duration-150
            active:border-b-0 active:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed
            flex flex-col items-center justify-center gap-2 text-center shadow-sm h-full min-h-[105px]
            ${
              skill.category === 'social' ? 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-800 dark:text-white' :
              skill.category === 'movement' ? 'bg-fun-primary border-yellow-600 hover:bg-yellow-300 text-black' :
              'bg-slate-800 dark:bg-zinc-700 border-slate-900 dark:border-zinc-950 hover:bg-slate-700 text-white'
            }
          `}
        >
          {skill.id === 'hi' && <Hand size={22} />}
          {skill.id === 'fiv' && <Hand size={22} className="rotate-45" />}
          {skill.id === 'hg' && <Heart size={22} />}
          {skill.id === 'gdb' && <Smile size={22} />}
          {skill.id === 'wh' && <Waves size={22} />}
          {skill.id === 'scrh' && <Fingerprint size={22} />}
          {skill.id === 'snf' && <Search size={22} />}
          {skill.id === 'cheers' && <Trophy size={22} />}
          {skill.id === 'rl' && <Activity size={22} className="rotate-90" />}
          {skill.id === 'pd' && <Ghost size={22} />}
          
          {skill.id === 'backflip' && <Zap size={22} />}
          {skill.id === 'frontflip' && <Zap size={22} className="scale-x-[-1]" />}
          {skill.id === 'handstand' && <Star size={22} />}
          {skill.id === 'moonwalk' && <Moon size={22} />}
          {skill.id === 'kick' && <Zap size={22} className="rotate-90" />}
          {skill.id === 'boxing' && <Swords size={22} />}
          {skill.id === 'pushup' && <Activity size={22} />}
          {skill.id === 'recover' && <Shield size={22} />}

          <span className="font-bold text-xs leading-tight">{skill.name}</span>
          
          {/* Subtle Command Hint */}
          <span className="absolute bottom-1 right-1 text-[8px] opacity-20 group-hover:opacity-60 transition-opacity font-mono">
            {skill.command}
          </span>
        </button>
      ))}
    </div>
  );
};

export default SkillGrid;