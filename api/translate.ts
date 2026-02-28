import { GoogleGenAI, Type } from "@google/genai";

const SYSTEM_INSTRUCTION = `
You are a friendly translator for a robot dog named Bittle. 
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

export const config = {
  runtime: "nodejs",
};

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "GEMINI_API_KEY not configured" },
      { status: 503 }
    );
  }

  let body: { input?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const input = typeof body?.input === "string" ? body.input.trim() : "";
  if (!input) {
    return Response.json(
      { error: "Missing or empty 'input' in body" },
      { status: 400 }
    );
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: input,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
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
      return Response.json({ commands: [] });
    }

    const parsed = JSON.parse(text);
    const commands = Array.isArray(parsed?.commands) ? parsed.commands : [];
    return Response.json({ commands });
  } catch (error) {
    console.error("Gemini API error:", error);
    return Response.json(
      { error: "Translation failed" },
      { status: 500 }
    );
  }
}
