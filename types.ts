export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
}

export interface LogEntry {
  id: string;
  timestamp: number;
  type: 'TX' | 'RX' | 'INFO' | 'ERROR' | 'AI';
  message: string;
}

export interface RobotSkill {
  id: string;
  name: string;
  command: string;
  icon?: string;
  category: 'movement' | 'social' | 'posture';
}

export const OPEN_CAT_COMMANDS = {
  // Postures (k prefix)
  BALANCE: 'kbalance',
  SIT: 'ksit',
  STRETCH: 'kstr',
  REST: 'd', 
  K_REST: 'krest',
  BUTT_UP: 'kbuttUp',
  CALIB: 'kcalib',
  UP: 'kup',
  ZERO: 'kzero',

  // Gaits (k prefix)
  WALK_F: 'kwkF',
  WALK_L: 'kwkL',
  WALK_R: 'kwkR',
  BACKWARD: 'kbk',
  BACK_L: 'kbkL',
  BACK_R: 'kbkR',
  CRAWL_F: 'kcrF',
  CRAWL_L: 'kcrL',
  TROT_F: 'ktrF',
  TROT_L: 'ktrL',
  BOUND_F: 'kbdF',
  JUMP_F: 'kjpF',
  STEP_ORIGIN: 'kvtF',
  SPIN_L: 'kvtL',
  
  // Behaviors (k prefix)
  HI: 'khi',
  PEE: 'kpee',
  PUSH_UPS: 'kpu',
  PUSH_UP_1: 'kpu1',
  ROLL: 'krl',
  CHECK: 'kck',
  BACKFLIP: 'kbf',
  FRONTFLIP: 'kff',
  CHEERS: 'kchr',
  BOXING: 'kbx',
  HANDSTAND: 'khds',
  MOONWALK: 'kmw',
  SCRATCH: 'kscrh',
  SNIFF: 'ksnf',
  TABLE: 'ktbl',
  WAVE_HEAD: 'kwh',
  ANGRY: 'kang',
  DIG: 'kdg',
  HUG: 'khg',
  HIGH_FIVE: 'kfiv',
  GOOD_BOY: 'kgdb',
  KICK: 'kkc',
  PLAY_DEAD: 'kpd',
  RECOVER: 'krc',
  
  // System commands
  GYRO_TOGGLE: 'g',
  RANDOM_MIND: 'z',

  // Vision (Mu Vision / Grove AI)
  VISION: {
    STOP: 'C0',
    COLOR: 'C1',
    FACE: 'C3',
    BODY: 'C2',
    GESTURE: 'C5'
  },

  // Sound
  BEEP: 'b10,8',
  BARK: 'b14,8,14,8', 
  SING: 'b10,4,12,4,14,4,16,8', 
  
  // Diagnostics
  BATTERY: 'v', 
  JOINTS: 'm',
};

export interface AIChatMessage {
  role: 'user' | 'model';
  text: string;
}
