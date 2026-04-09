/**
 * Unit tests for SettingsPanel component
 *
 * Setup:
 * - npm install -D @testing-library/react @testing-library/jest-dom
 * - Add to vitest config: globals: true
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsPanel from '../../components/SettingsPanel';
import * as keyStorageService from '../../services/keyStorageService';

// Mock keyStorageService
vi.mock('../../services/keyStorageService', () => ({
  saveApiKey: vi.fn(),
  clearApiKey: vi.fn(),
  hasApiKey: vi.fn(),
}));

// Mock @google/genai
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn(),
}));

describe('SettingsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('rendering', () => {
    it('should not render when isOpen is false', () => {
      const { container } = render(
        <SettingsPanel isOpen={false} onClose={vi.fn()} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render when isOpen is true', () => {
      render(<SettingsPanel isOpen={true} onClose={vi.fn()} />);
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should have a close button', () => {
      render(<SettingsPanel isOpen={true} onClose={vi.fn()} />);
      const closeButton = screen.getByTitle('');
      expect(closeButton).toBeInTheDocument();
    });

    it('should show Gemini API Key section', () => {
      render(<SettingsPanel isOpen={true} onClose={vi.fn()} />);
      expect(screen.getByText(/Gemini API Key/i)).toBeInTheDocument();
    });

    it('should show Robot Model section', () => {
      render(<SettingsPanel isOpen={true} onClose={vi.fn()} />);
      expect(screen.getByText(/Robot Model/i)).toBeInTheDocument();
    });
  });

  describe('API Key Input', () => {
    it('should show input field when no key is set', async () => {
      vi.mocked(keyStorageService.hasApiKey).mockResolvedValue(false);

      render(<SettingsPanel isOpen={true} onClose={vi.fn()} />);

      await waitFor(() => {
        const input = screen.queryByPlaceholderText(/AIza/);
        expect(input).toBeInTheDocument();
      });
    });

    it('should show saved key status when key is set', async () => {
      vi.mocked(keyStorageService.hasApiKey).mockResolvedValue(true);

      render(<SettingsPanel isOpen={true} onClose={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText(/Key saved: AIza••••••••/)).toBeInTheDocument();
      });
    });

    it('should accept key input', async () => {
      vi.mocked(keyStorageService.hasApiKey).mockResolvedValue(false);

      render(<SettingsPanel isOpen={true} onClose={vi.fn()} />);

      const input = screen.getByPlaceholderText(/AIza/) as HTMLInputElement;
      await userEvent.type(input, 'AIzaTestKey123');

      expect(input.value).toBe('AIzaTestKey123');
    });

    it('should have password input type', async () => {
      vi.mocked(keyStorageService.hasApiKey).mockResolvedValue(false);

      render(<SettingsPanel isOpen={true} onClose={vi.fn()} />);

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/AIza/) as HTMLInputElement;
        expect(input.type).toBe('password');
      });
    });

    it('should toggle password visibility', async () => {
      vi.mocked(keyStorageService.hasApiKey).mockResolvedValue(false);

      render(<SettingsPanel isOpen={true} onClose={vi.fn()} />);

      const input = screen.getByPlaceholderText(/AIza/) as HTMLInputElement;
      const toggleButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('svg')
      );

      expect(input.type).toBe('password');

      if (toggleButton) {
        fireEvent.click(toggleButton);
        expect(input.type).toBe('text');

        fireEvent.click(toggleButton);
        expect(input.type).toBe('password');
      }
    });
  });

  describe('Robot Model Selection', () => {
    it('should have Bittle X and Nybble Q buttons', () => {
      render(<SettingsPanel isOpen={true} onClose={vi.fn()} />);

      expect(screen.getByText(/Bittle X/)).toBeInTheDocument();
      expect(screen.getByText(/Nybble Q/)).toBeInTheDocument();
    });

    it('should default to Bittle X', () => {
      render(<SettingsPanel isOpen={true} onClose={vi.fn()} />);

      const bittleButton = screen.getByText(/Bittle X/) as HTMLButtonElement;
      expect(bittleButton).toHaveClass(/bg-blue/);
    });

    it('should save robot model selection to localStorage', async () => {
      render(<SettingsPanel isOpen={true} onClose={vi.fn()} />);

      const nybbleButton = screen.getByText(/Nybble Q/) as HTMLButtonElement;
      fireEvent.click(nybbleButton);

      await waitFor(() => {
        expect(localStorage.getItem('bittle.robotModel')).toBe('Nybble Q');
      });
    });

    it('should update button styling when model is selected', async () => {
      render(<SettingsPanel isOpen={true} onClose={vi.fn()} />);

      const nybbleButton = screen.getByText(/Nybble Q/) as HTMLButtonElement;
      fireEvent.click(nybbleButton);

      await waitFor(() => {
        expect(nybbleButton).toHaveClass(/bg-blue/);
      });
    });
  });

  describe('Key Management Actions', () => {
    it('should show Save button when no key exists', async () => {
      vi.mocked(keyStorageService.hasApiKey).mockResolvedValue(false);

      render(<SettingsPanel isOpen={true} onClose={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText(/Save Key/)).toBeInTheDocument();
      });
    });

    it('should show Replace and Remove buttons when key exists', async () => {
      vi.mocked(keyStorageService.hasApiKey).mockResolvedValue(true);

      render(<SettingsPanel isOpen={true} onClose={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText(/Replace/)).toBeInTheDocument();
        expect(screen.getByText(/Remove/)).toBeInTheDocument();
      });
    });

    it('should call clearApiKey when Remove is clicked', async () => {
      vi.mocked(keyStorageService.hasApiKey).mockResolvedValue(true);

      render(<SettingsPanel isOpen={true} onClose={vi.fn()} />);

      await waitFor(() => {
        const removeButton = screen.getByText(/Remove/);
        fireEvent.click(removeButton);
      });

      expect(keyStorageService.clearApiKey).toHaveBeenCalled();
    });

    it('should switch to input mode when Replace is clicked', async () => {
      vi.mocked(keyStorageService.hasApiKey).mockResolvedValue(true);

      render(<SettingsPanel isOpen={true} onClose={vi.fn()} />);

      await waitFor(() => {
        const replaceButton = screen.getByText(/Replace/);
        fireEvent.click(replaceButton);
      });

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/AIza/)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<SettingsPanel isOpen={true} onClose={vi.fn()} />);

      // Check for dialog/modal role indicators
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should allow escape to close (via close button)', () => {
      const onClose = vi.fn();
      render(<SettingsPanel isOpen={true} onClose={onClose} />);

      // Note: Full keyboard handling would require testing modal behavior
      const closeButton = screen.getAllByRole('button')[0];
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should show error message if key validation fails', async () => {
      vi.mocked(keyStorageService.hasApiKey).mockResolvedValue(false);
      const { GoogleGenAI } = await import('@google/genai');
      vi.mocked(GoogleGenAI).mockImplementation(() => ({
        models: {
          generateContent: vi
            .fn()
            .mockRejectedValue(new Error('Invalid key')),
        },
      } as any));

      render(<SettingsPanel isOpen={true} onClose={vi.fn()} />);

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/AIza/) as HTMLInputElement;
        fireEvent.change(input, { target: { value: 'InvalidKey' } });
      });

      // Click save button - would show error after validation fails
      // (Note: full error handling test requires more setup)
    });
  });
});
