import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AIController from './AIController';

vi.mock('../services/geminiService', () => ({
  translateCommand: vi.fn(),
  GeminiError: class GeminiError extends Error {
    constructor(msg: string) { super(msg); this.name = 'GeminiError'; }
  },
}));

import { translateCommand } from '../services/geminiService';
const mockTranslate = vi.mocked(translateCommand);

describe('AIController', () => {
  const onExecuteSequence = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderComponent(disabled = false) {
    return render(<AIController onExecuteSequence={onExecuteSequence} disabled={disabled} />);
  }

  it('submitting a command fires onExecuteSequence with returned commands', async () => {
    mockTranslate.mockResolvedValue(['kwkF', 'wait:1500', 'ksit']);
    renderComponent();

    const input = screen.getByPlaceholderText(/type/i);
    await userEvent.type(input, 'walk then sit');
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      expect(onExecuteSequence).toHaveBeenCalledWith(['kwkF', 'wait:1500', 'ksit']);
    });
  });

  it('does not fire onExecuteSequence when commands array is empty', async () => {
    mockTranslate.mockResolvedValue([]);
    renderComponent();

    const input = screen.getByPlaceholderText(/type/i);
    await userEvent.type(input, 'unknownthing');
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      expect(mockTranslate).toHaveBeenCalled();
    });
    expect(onExecuteSequence).not.toHaveBeenCalled();
  });

  it('shows error message when Gemini throws', async () => {
    mockTranslate.mockRejectedValue(new Error('Server configuration error'));
    renderComponent();

    const input = screen.getByPlaceholderText(/type/i);
    await userEvent.type(input, 'do something');
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Server configuration error')).toBeInTheDocument();
    });
    expect(onExecuteSequence).not.toHaveBeenCalled();
  });

  it('speech onerror resets isListening state and shows error', async () => {
    const mockRecognition = {
      continuous: false,
      lang: '',
      interimResults: false,
      onstart: null as Function | null,
      onend: null as Function | null,
      onresult: null as Function | null,
      onerror: null as Function | null,
      start: vi.fn().mockImplementation(function(this: any) {
        this.onstart?.();
        // Simulate error after start
        setTimeout(() => this.onerror?.({ error: 'not-allowed' }), 0);
      }),
    };

    (window as any).SpeechRecognition = vi.fn().mockImplementation(() => mockRecognition);

    renderComponent();
    const micButton = screen.getByTitle(/microphone/i);
    await userEvent.click(micButton);

    await waitFor(() => {
      expect(screen.getByText(/microphone error: not-allowed/i)).toBeInTheDocument();
    });
  });

  it('form is disabled when disabled prop is true', () => {
    renderComponent(true);
    const input = screen.getByPlaceholderText(/wake up/i);
    expect(input).toBeDisabled();
  });
});
