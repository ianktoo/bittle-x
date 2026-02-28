/**
 * Sends user input to the backend /api/translate endpoint, which calls Gemini
 * with the API key on the server. The key is never exposed to the client.
 */
export const translateCommand = async (userInput: string): Promise<string[]> => {
  const input = userInput?.trim();
  if (!input) return [];

  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input }),
    });

    if (!res.ok) {
      if (res.status === 503) {
        console.warn("AI not configured: set GEMINI_API_KEY on the server.");
      }
      return [];
    }

    const data = await res.json();
    return Array.isArray(data?.commands) ? data.commands : [];
  } catch (error) {
    console.error("Translate API error:", error);
    return [];
  }
};
