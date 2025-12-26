import { GoogleGenAI, Type } from "@google/genai";
import { OPEN_CAT_COMMANDS } from "../types";

const SYSTEM_INSTRUCTION = `
You are a friendly translator for a robot dog named Bittle. 
Kids will ask you to do things, and you need to translate their words into robot codes.

Supported Robot Codes:
- kbalance: Stop / Stand still
- ksit: Sit down
- kwk: Walk forward
- kcr: Crawl forward
- kbk: Walk backward
- kturnL: Turn Left
- kturnR: Turn Right
- khi: Say Hello (Wave)
- kpee: Do a funny trick (Pee)
- kp: Push up
- kstr: Stretch
- krl: Roll over
- d: Go to sleep / Rest
- kck: Check surroundings
- kvt: Victory pose
- b14,8,14,8: Bark like a dog
- b10,4,12,4,14,4,16,8: Sing a song

Rules:
1. Return ONLY a valid JSON object.
2. The JSON object must have a 'commands' property which is an array of strings.
3. If a kid asks for a sequence (e.g., "Walk then bark"), provide the array in order.
4. Use "wait:MILLISECONDS" for pauses. Default to 1000ms between moves.
5. If the request is unsafe or unknown, just return ["kbalance"].

Example:
User: "Do a push up then bark"
Output: { "commands": ["kp", "wait:2000", "b14,8,14,8"] }
`;

export const translateCommand = async (userInput: string): Promise<string[]> => {
  if (!process.env.API_KEY) {
    console.error("Missing API KEY");
    return [];
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userInput,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            commands: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of OpenCat commands and wait instructions"
            },
            explanation: {
              type: Type.STRING,
              description: "Short explanation for a child"
            }
          },
          required: ["commands"]
        }
      }
    });

    const text = response.text;
    if (!text) return [];

    const parsed = JSON.parse(text);
    return parsed.commands || [];
  } catch (error) {
    console.error("Gemini Translation Error:", error);
    return [];
  }
};