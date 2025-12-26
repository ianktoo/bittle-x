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
  // Movements
  WALK: 'kwk',
  WALK_LEFT: 'kturnL',   // Safe default (Spin Left)
  WALK_RIGHT: 'kturnR',  // Safe default (Spin Right)
  
  // Advanced Bittle X Gaits (True Diagonals)
  WALK_LEFT_X: 'kwkL',
  WALK_RIGHT_X: 'kwkR',
  BACK_LEFT_X: 'kbkL',
  BACK_RIGHT_X: 'kbkR',
  
  CRAWL: 'kcr',
  TROT: 'ktr',
  
  BACK: 'kbk',
  BACK_LEFT: 'kturnL',   
  BACK_RIGHT: 'kturnR',  

  LEFT: 'kturnL',
  RIGHT: 'kturnR',
  STOP: 'kbalance',
  
  // Postures
  REST: 'd',
  SIT: 'ksit',
  STRETCH: 'kstr',
  
  // Modes
  GYRO_TOGGLE: 'g', 
  RANDOM_MIND: 'z', // Toggle autonomous behavior
  
  // Vision (Mu Vision / Grove AI)
  VISION: {
    STOP: 'C0',
    COLOR: 'C1', // Often Ball tracking (Green LED)
    FACE: 'C3',  // Face tracking (Blue LED)
    BODY: 'C2',  // Body tracking (Yellow LED)
    GESTURE: 'C5' // Hand gesture (Violet LED)
  },

  // Social/Tricks
  HI: 'khi',
  PEE: 'kpee',
  PUSH_UP: 'kp',
  ROLL: 'krl',
  CHECK: 'kck',
  VT: 'kvt', // Victory
  
  // Sound / Extensions
  BEEP: 'b10,8',
  BARK: 'b14,8,14,8', 
  SING: 'b10,4,12,4,14,4,16,8', 
  
  // Diagnostics
  BATTERY: 'v', // Check voltage
  JOINTS: 'm',  // Servo command prefix
};

export interface AIChatMessage {
  role: 'user' | 'model';
  text: string;
}