import { GoogleGenAI, Type } from "@google/genai";
import { loadApiKey, hasApiKey } from "./keyStorageService";

/**
 * Error thrown when no API key is configured.
 * Callers can catch this specifically to prompt user to open settings.
 */
export class ApiKeyNotConfiguredError extends Error {
  constructor(message: string = "No API key configured") {
    super(message);
    this.name = "ApiKeyNotConfiguredError";
  }
}

/**
 * Generates the system instruction based on robot model.
 * Supports "Bittle" (dog) and "Nybble Q" (cat).
 */
function getSystemInstruction(robotModel: string = "Bittle"): string {
  const robotType = robotModel === "Nybble Q" ? "robot cat named Nybble Q" : "robot dog named Bittle";

  return `
You are a friendly translator for a ${robotType}.
Users will ask you to perform actions, and you need to translate their words into robot codes based on the official OpenCat Skill List.

Supported Robot Codes:
- kbalance: Stand up / Stop / Balanced posture
- ksit: Sit down
- kwkF: Walk forward
- kbk: Walk backward
- kwkL: Walk Left
- kwkR: Walk Right
- kcrF: Crawl forward
- ktrF: Trot forward
- khi: Say Hello / Hi
- kfiv: High five
- khg: Give a hug
- kgdb: Good boy (affectionate behavior)
- kwh: Wave head
- kpee: Do a funny trick (Pee)
- kpu: Push ups
- kstr: Stretch
- kbf: Backflip
- kff: Front flip
- kbx: Boxing
- kkc: Kick
- krl: Roll over
- khds: Handstand
- kmw: Moonwalk
- kchr: Cheers / Victory
- kpd: Play dead
- krc: Recover from falling
- krest: Go to sleep / Rest
- kck: Check surroundings
- b14,8,14,8: Bark like a dog
- b10,4,12,4,14,4,16,8: Sing a song

Rules:
1. Return ONLY a valid JSON object.
2. The JSON object must have a 'commands' property which is an array of strings.
3. If a user asks for a sequence (e.g., "Walk then bark"), provide the array in order.
4. Use "wait:MILLISECONDS" for pauses between complex moves. Default to 1500ms.
5. If the request is unsafe or unknown, return ["kbalance"].
6. If the user asks for something like "be a good boy", use "kgdb".
7. If the user asks for "victory" or "celebrate", use "kchr".

Example:
User: "Do a backflip then sit"
Output: { "commands": ["kbf", "wait:3000", "ksit"] }
`;
}

/**
 * Translates natural language to OpenCat robot commands using Gemini.
 * The API key is decrypted from browser storage and used directly.
 *
 * @param userInput - Natural language command from user
 * @param robotModel - Robot model ("Bittle" or "Nybble Q"), defaults to "Bittle"
 * @returns Array of OpenCat command strings
 * @throws ApiKeyNotConfiguredError if no API key has been stored
 */
export const translateCommand = async (
  userInput: string,
  robotModel: string = "Bittle"
): Promise<string[]> => {
  const input = userInput?.trim();
  if (!input) return [];

  // Load the encrypted API key from browser storage
  const apiKey = await loadApiKey();
  if (!apiKey) {
    throw new ApiKeyNotConfiguredError(
      "No Gemini API key configured. Please enter your key in Settings."
    );
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: input,
      config: {
        systemInstruction: getSystemInstruction(robotModel),
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            commands: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of OpenCat commands and wait instructions",
            },
            explanation: {
              type: Type.STRING,
              description: "Short explanation for a child",
            },
          },
          required: ["commands"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      return [];
    }

    const parsed = JSON.parse(text);
    const commands = Array.isArray(parsed?.commands) ? parsed.commands : [];
    return commands;
  } catch (error) {
    if (error instanceof ApiKeyNotConfiguredError) {
      throw error;
    }
    console.error("Gemini API error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to translate command"
    );
  }
};
