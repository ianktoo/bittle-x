import React from 'react';
import { RobotSkill, OPEN_CAT_COMMANDS } from '../types';
import { Heart, Activity, Hand, Moon, Smile, Trophy } from 'lucide-react';

interface SkillGridProps {
  onCommand: (cmd: string) => void;
  disabled: boolean;
}

const skills: RobotSkill[] = [
  { id: 'sit', name: 'Sit Down', command: OPEN_CAT_COMMANDS.SIT, category: 'posture' },
  { id: 'hi', name: 'Say Hi', command: OPEN_CAT_COMMANDS.HI, category: 'social' },
  { id: 'stretch', name: 'Stretch', command: OPEN_CAT_COMMANDS.STRETCH, category: 'posture' },
  { id: 'check', name: 'Look Around', command: OPEN_CAT_COMMANDS.CHECK, category: 'movement' },
  { id: 'pushup', name: 'Push Ups', command: OPEN_CAT_COMMANDS.PUSH_UP, category: 'movement' },
  { id: 'pee', name: 'Naughty', command: OPEN_CAT_COMMANDS.PEE, category: 'social' },
  { id: 'victory', name: 'Victory', command: OPEN_CAT_COMMANDS.VT, category: 'social' },
  { id: 'sleep', name: 'Sleep', command: OPEN_CAT_COMMANDS.REST, category: 'posture' },
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
            flex flex-col items-center justify-center gap-2 text-center
            ${
              skill.category === 'social' ? 'bg-white border-zinc-400 hover:bg-zinc-100 text-black' :
              skill.category === 'movement' ? 'bg-fun-primary border-yellow-600 hover:bg-yellow-300 text-black' :
              'bg-zinc-800 border-zinc-950 hover:bg-zinc-700 text-white'
            }
          `}
        >
          {skill.id === 'hi' && <Hand size={24} />}
          {skill.id === 'sit' && <Activity size={24} />}
          {skill.id === 'pee' && <Smile size={24} />}
          {skill.id === 'victory' && <Trophy size={24} />}
          {skill.id === 'sleep' && <Moon size={24} />}
          {skill.id === 'stretch' && <Activity size={24} />}
          {skill.id === 'check' && <Heart size={24} />}
          {skill.id === 'pushup' && <Activity size={24} />}
          <span className="font-bold text-sm">{skill.name}</span>
        </button>
      ))}
    </div>
  );
};

export default SkillGrid;