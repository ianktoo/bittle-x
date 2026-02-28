import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ControlPad from './ControlPad';
import { OPEN_CAT_COMMANDS } from '../types';

describe('ControlPad', () => {
  const onCommand = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderPad(disabled = false, activeCommand?: string) {
    return render(
      <ControlPad onCommand={onCommand} disabled={disabled} activeCommand={activeCommand} />
    );
  }

  it('forward button sends kwkF', async () => {
    renderPad();
    const fwdBtn = screen.getByTitle(/walk forward/i);
    await userEvent.click(fwdBtn);
    expect(onCommand).toHaveBeenCalledWith(OPEN_CAT_COMMANDS.WALK_F);
  });

  it('stop button sends kbalance', async () => {
    renderPad();
    const stopBtn = screen.getByTitle(/stop.*balance/i);
    await userEvent.click(stopBtn);
    expect(onCommand).toHaveBeenCalledWith(OPEN_CAT_COMMANDS.BALANCE);
  });

  it('backward button sends kbk', async () => {
    renderPad();
    const backBtn = screen.getByTitle(/backward/i);
    await userEvent.click(backBtn);
    expect(onCommand).toHaveBeenCalledWith(OPEN_CAT_COMMANDS.BACKWARD);
  });

  it('buttons are disabled when disabled prop is true', () => {
    renderPad(true);
    const fwdBtn = screen.getByTitle(/walk forward/i);
    expect(fwdBtn).toBeDisabled();
  });

  it('all buttons are disabled when not connected', () => {
    renderPad(true);
    const buttons = screen.getAllByRole('button');
    buttons.forEach(btn => expect(btn).toBeDisabled());
  });
});
