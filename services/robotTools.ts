/**
 * Robot Tool Definitions
 *
 * Defines the canonical robot command set and tool schemas for function calling.
 * Providers (Gemini, OpenAI, Anthropic) use these definitions to expose robot
 * capabilities as formal tools/functions that the AI can call.
 */

/**
 * Complete list of valid OpenCat robot commands (from types.ts OPEN_CAT_COMMANDS).
 * Includes postures, gaits, behaviors, vision, sound, and system commands.
 * Note: "wait:N" is a pseudo-command for inter-command delays (handled by executeSequence).
 */
export const VALID_ROBOT_COMMANDS = [
  // Postures
  'kbalance',
  'ksit',
  'kstr',
  'd',
  'krest',
  'kbuttUp',
  'kcalib',
  'kup',
  'kzero',

  // Gaits
  'kwkF',
  'kwkL',
  'kwkR',
  'kbk',
  'kbkL',
  'kbkR',
  'kcrF',
  'kcrL',
  'ktrF',
  'ktrL',
  'kbdF',
  'kjpF',
  'kvtF',
  'kvtL',

  // Behaviors
  'khi',
  'kpee',
  'kpu',
  'kpu1',
  'krl',
  'kck',
  'kbf',
  'kff',
  'kchr',
  'kbx',
  'khds',
  'kmw',
  'kscrh',
  'ksnf',
  'ktbl',
  'kwh',
  'kang',
  'kdg',
  'khg',
  'kfiv',
  'kgdb',
  'kkc',
  'kpd',
  'krc',

  // System
  'g',
  'z',

  // Vision
  'C0',
  'C1',
  'C2',
  'C3',
  'C5',

  // Sound
  'b10,8',
  'b14,8,14,8',
  'b10,4,12,4,14,4,16,8',

  // Diagnostics
  'v',
  'm',
] as const;

export type RobotCommand = (typeof VALID_ROBOT_COMMANDS)[number];

/**
 * Human-readable descriptions for each robot command.
 * Used in tool schemas and UI documentation.
 */
export const COMMAND_DESCRIPTIONS: Record<RobotCommand, string> = {
  // Postures
  kbalance: 'Stand up or return to balanced posture',
  ksit: 'Sit down',
  kstr: 'Stretch',
  d: 'Rest (short form)',
  krest: 'Go to sleep or rest mode',
  kbuttUp: 'Butt up posture',
  kcalib: 'Calibrate joints',
  kup: 'Get up from rest',
  kzero: 'Reset to zero position',

  // Gaits
  kwkF: 'Walk forward',
  kwkL: 'Walk left',
  kwkR: 'Walk right',
  kbk: 'Walk backward',
  kbkL: 'Walk backward left',
  kbkR: 'Walk backward right',
  kcrF: 'Crawl forward',
  kcrL: 'Crawl left',
  ktrF: 'Trot forward',
  ktrL: 'Trot left',
  kbdF: 'Bound forward',
  kjpF: 'Jump forward',
  kvtF: 'Vertical step forward',
  kvtL: 'Vertical spin left',

  // Behaviors
  khi: 'Say hello or wave',
  kpee: 'Do a funny trick (pee)',
  kpu: 'Do push-ups',
  kpu1: 'Single push-up',
  krl: 'Roll over',
  kck: 'Check surroundings',
  kbf: 'Do a backflip',
  kff: 'Do a front flip',
  kchr: 'Cheers or celebrate',
  kbx: 'Do a boxing move',
  khds: 'Do a handstand',
  kmw: 'Moonwalk',
  kscrh: 'Scratch',
  ksnf: 'Sniff',
  ktbl: 'Table posture',
  kwh: 'Wave head',
  kang: 'Look angry',
  kdg: 'Dig',
  khg: 'Give a hug',
  kfiv: 'Give a high five',
  kgdb: 'Good boy behavior',
  kkc: 'Kick',
  kpd: 'Play dead',
  krc: 'Recover from falling',

  // System
  g: 'Toggle gyro mode',
  z: 'Random mind (explore)',

  // Vision
  C0: 'Stop vision recognition',
  C1: 'Color recognition',
  C2: 'Body recognition',
  C3: 'Face recognition',
  C5: 'Gesture recognition',

  // Sound
  'b10,8': 'Beep sound',
  'b14,8,14,8': 'Bark sound',
  'b10,4,12,4,14,4,16,8': 'Sing melody',

  // Diagnostics
  v: 'Check battery voltage',
  m: 'Check servo joints',
};

/**
 * Google Gemini FunctionDeclarationsTool format
 * https://ai.google.dev/gemini-api
 */
export function toGeminiTool() {
  return {
    name: 'execute_robot_commands',
    description:
      'Execute a sequence of robot commands. Commands are executed in order with optional pauses between them.',
    parameters: {
      type: 'OBJECT',
      properties: {
        commands: {
          type: 'ARRAY',
          items: {
            type: 'STRING',
            enum: VALID_ROBOT_COMMANDS,
          },
          description: `List of robot commands to execute. Valid values: ${VALID_ROBOT_COMMANDS.join(', ')}. Use "wait:MILLISECONDS" (e.g., "wait:1500") to pause between commands.`,
        },
        explanation: {
          type: 'STRING',
          description: 'Optional short explanation of what the robot will do (for logging/clarity)',
        },
      },
      required: ['commands'],
    },
  };
}

/**
 * OpenAI ChatCompletionTool format
 * Used by OpenAI, and also by Ollama (OpenAI-compatible API)
 * https://platform.openai.com/docs/guides/function-calling
 */
export function toOpenAITool() {
  return {
    type: 'function',
    function: {
      name: 'execute_robot_commands',
      description:
        'Execute a sequence of robot commands. Commands are executed in order with optional pauses between them.',
      parameters: {
        type: 'object',
        properties: {
          commands: {
            type: 'array',
            items: {
              type: 'string',
              enum: VALID_ROBOT_COMMANDS,
            },
            description: `List of robot commands to execute. Valid values: ${VALID_ROBOT_COMMANDS.join(', ')}. Use "wait:MILLISECONDS" (e.g., "wait:1500") to pause between commands.`,
          },
          explanation: {
            type: 'string',
            description: 'Optional short explanation of what the robot will do (for logging/clarity)',
          },
        },
        required: ['commands'],
      },
    },
  };
}

/**
 * Anthropic Tool format
 * https://docs.anthropic.com/guides/tool-use
 */
export function toAnthropicTool() {
  return {
    name: 'execute_robot_commands',
    description:
      'Execute a sequence of robot commands. Commands are executed in order with optional pauses between them.',
    input_schema: {
      type: 'object',
      properties: {
        commands: {
          type: 'array',
          items: {
            type: 'string',
            enum: VALID_ROBOT_COMMANDS,
          },
          description: `List of robot commands to execute. Valid values: ${VALID_ROBOT_COMMANDS.join(', ')}. Use "wait:MILLISECONDS" (e.g., "wait:1500") to pause between commands.`,
        },
        explanation: {
          type: 'string',
          description: 'Optional short explanation of what the robot will do (for logging/clarity)',
        },
      },
      required: ['commands'],
    },
  };
}

/**
 * Standard system instruction for robot AI assistants.
 * Adapts based on robot model.
 * @param robotModel 'Bittle' or 'Nybble Q'
 */
export function getSystemInstruction(robotModel: string = 'Bittle'): string {
  const robotType =
    robotModel === 'Nybble Q' ? 'robot cat named Nybble Q' : 'robot dog named Bittle';

  return `You are a friendly controller for a ${robotType}.
Users will ask you to perform actions.
Use the execute_robot_commands tool to send command sequences to the robot.

For pauses between actions, include "wait:MILLISECONDS" in the commands array (e.g., "wait:1500" for a 1.5-second pause).

If a request is unsafe, unclear, or impossible, respond with ["kbalance"] (return to safe neutral posture).
Always explain what the robot will do in the explanation field.

Common sequences:
- Greeting: ["khi", "wait:1000", "kgdb"] (say hi, then good boy)
- Celebration: ["kchr", "wait:2000", "kbf"] (cheers, then backflip)
- Sleep: ["krest"] (go to sleep mode)`;
}
