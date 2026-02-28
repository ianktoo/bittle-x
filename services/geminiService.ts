export class GeminiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeminiError';
  }
}

export const translateCommand = async (userInput: string): Promise<string[]> => {
  const response = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: userInput }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new GeminiError(body.error || `API error: ${response.status}`);
  }

  const data = await response.json();
  return data.commands || [];
};
