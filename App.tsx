import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Bluetooth, WifiOff, Battery, Gamepad2, Rocket, Usb, Zap, Wifi, HelpCircle, Octagon, BookOpen } from 'lucide-react';
import { bluetoothService } from './services/bluetoothService';
import { serialService } from './services/serialService';
import { wifiService } from './services/wifiService';
import { ConnectionState, LogEntry, OPEN_CAT_COMMANDS } from './types';
import ControlPad from './components/ControlPad';
import SkillGrid from './components/SkillGrid';
import Terminal from './components/Terminal';
import AIController from './components/AIController';
import SensorsPanel from './components/SensorsPanel';
import ModulesPanel from './components/ModulesPanel';
import HelpModal from './components/HelpModal';
import ToastContainer, { ToastMessage } from './components/ToastContainer';
import Documentation from './components/Documentation';

const App: React.FC = () => {
  const [view, setView] = useState<'APP' | 'DOCS'>('APP');
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [connectionType, setConnectionType] = useState<'BLUETOOTH' | 'USB' | 'WIFI' | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [gamepadConnected, setGamepadConnected] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [activeCmd, setActiveCmd] = useState<string | null>(null);
  
  // WiFi State
  const [showWifiInput, setShowWifiInput] = useState(false);
  const [wifiIp, setWifiIp] = useState('');

  // Execution Control
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastCommandTime = useRef<number>(0);
  const lastGamepadCmd = useRef<string | null>(null); // Track last sent gamepad command
  const requestRef = useRef<number>();

  // --- Toast Logic ---
  const addToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, message, type }]);
    // Auto dismiss
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const addLog = useCallback((type: LogEntry['type'], message: string) => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      type,
      message
    }]);
  }, []);

  // --- Command Logic ---
  const sendCommand = useCallback(async (cmd: string) => {
    console.log(`%c[CMD] Sending: ${cmd}`, 'color: #FACC15; font-weight: bold; background: #222; padding: 2px 4px; border-radius: 2px;');

    if (connectionState !== ConnectionState.CONNECTED) {
      addToast('Not connected to robot', 'error');
      return;
    }

    try {
      if (connectionType === 'BLUETOOTH') {
        await bluetoothService.sendCommand(cmd);
      } else if (connectionType === 'USB') {
        await serialService.sendCommand(cmd);
      } else if (connectionType === 'WIFI') {
        await wifiService.sendCommand(cmd);
      }
      addLog('TX', cmd);
    } catch (error) {
      console.error('[CMD] Error sending:', error);
      addLog('ERROR', 'Send failed');
      addToast('Failed to send command', 'error');
    }
  }, [connectionState, connectionType, addLog, addToast]);

  // --- Emergency Stop ---
  const handleEmergencyStop = useCallback(async () => {
    // 1. Abort any running AI sequences
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      addLog('INFO', 'Sequence Aborted');
    }

    // 2. Send Stop Command immediately
    if (connectionState === ConnectionState.CONNECTED) {
      console.warn('EMERGENCY STOP TRIGGERED');
      try {
        // Send directly to bypass any queues if we had them, 
        // though here we reuse sendCommand for simplicity
        if (connectionType === 'BLUETOOTH') await bluetoothService.sendCommand(OPEN_CAT_COMMANDS.STOP);
        else if (connectionType === 'USB') await serialService.sendCommand(OPEN_CAT_COMMANDS.STOP);
        else if (connectionType === 'WIFI') await wifiService.sendCommand(OPEN_CAT_COMMANDS.STOP);
        
        addLog('TX', 'STOP (Emergency)');
        addToast('EMERGENCY STOP!', 'error');
      } catch (e) {
        console.error(e);
      }
    }
  }, [connectionState, connectionType, addLog, addToast]);

  // --- AI Sequence Execution with Abort Support ---
  const wait = (ms: number, signal: AbortSignal) => {
    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => resolve(), ms);
      signal.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new Error('Aborted'));
      });
    });
  };

  const executeSequence = useCallback(async (commands: string[]) => {
    // Cancel previous sequence if running
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Start new sequence controller
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const signal = controller.signal;

    addLog('AI', `Sequence Start: ${commands.length} steps`);
    addToast(`Running ${commands.length} actions...`, 'info');
    
    try {
      for (const cmd of commands) {
        if (signal.aborted) throw new Error('Aborted');

        if (cmd.startsWith('wait:')) {
          const ms = parseInt(cmd.split(':')[1], 10);
          await wait(ms, signal);
        } else {
          await sendCommand(cmd);
          // Pause between actions to let robot finish animation
          await wait(800, signal);
        }
      }
      addLog('AI', 'Sequence Complete');
      addToast('Actions complete', 'success');
    } catch (err: any) {
      if (err.message === 'Aborted') {
        console.log('Sequence aborted by user');
      } else {
        console.error('Sequence error:', err);
        addToast('Sequence interrupted', 'error');
      }
    } finally {
      abortControllerRef.current = null;
    }
  }, [sendCommand, addLog, addToast]);

  // --- Gamepad Logic ---
  const handleGamepadInput = useCallback(() => {
    // If viewing docs, don't send commands
    if (view === 'DOCS') return;

    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = gamepads[0]; 

    if (!gp) {
      if (gamepadConnected) setGamepadConnected(false);
      return;
    }

    if (!gamepadConnected) {
      setGamepadConnected(true);
      addLog('INFO', `Gamepad Connected: ${gp.id}`);
      addToast('Gamepad Connected 🎮', 'success');
    }

    // Process Input
    const now = Date.now();
    const DEADZONE = 0.25; // Slight Increase
    let cmd = '';

    // Inputs
    const axisX = gp.axes[0]; // -1 Left, 1 Right
    const axisY = gp.axes[1]; // -1 Up, 1 Down
    
    const isUp = axisY < -DEADZONE || gp.buttons[12].pressed;
    const isDown = axisY > DEADZONE || gp.buttons[13].pressed;
    const isLeft = axisX < -DEADZONE || gp.buttons[14].pressed;
    const isRight = axisX > DEADZONE || gp.buttons[15].pressed;

    // Logic: Check diagonals first, then cardinals
    if (isUp && isLeft) cmd = OPEN_CAT_COMMANDS.WALK_LEFT;
    else if (isUp && isRight) cmd = OPEN_CAT_COMMANDS.WALK_RIGHT;
    else if (isDown && isLeft) cmd = OPEN_CAT_COMMANDS.BACK_LEFT;
    else if (isDown && isRight) cmd = OPEN_CAT_COMMANDS.BACK_RIGHT;
    else if (isUp) cmd = OPEN_CAT_COMMANDS.WALK;
    else if (isDown) cmd = OPEN_CAT_COMMANDS.BACK;
    else if (isLeft) cmd = OPEN_CAT_COMMANDS.LEFT;
    else if (isRight) cmd = OPEN_CAT_COMMANDS.RIGHT;
    
    // Actions (Buttons) - Only if no movement
    if (!cmd) {
        if (gp.buttons[0].pressed) cmd = OPEN_CAT_COMMANDS.STOP; // A
        else if (gp.buttons[1].pressed) cmd = OPEN_CAT_COMMANDS.SIT; // B
        else if (gp.buttons[2].pressed) cmd = OPEN_CAT_COMMANDS.HI;  // X
        else if (gp.buttons[3].pressed) cmd = OPEN_CAT_COMMANDS.PEE; // Y
        else if (gp.buttons[4].pressed) cmd = OPEN_CAT_COMMANDS.PUSH_UP; // LB
        else if (gp.buttons[5].pressed) cmd = OPEN_CAT_COMMANDS.STRETCH; // RB
        
        // Select/Back for Emergency Stop
        if (gp.buttons[8].pressed || gp.buttons[9].pressed) {
             if (now - lastCommandTime.current > 1000) {
                 handleEmergencyStop();
                 lastCommandTime.current = now;
             }
             return;
        }
    }

    // Sync UI State
    if (cmd !== activeCmd) {
      setActiveCmd(cmd);
    }

    // Command Transmission Strategy
    // For movement, we ONLY send on change (Edge Trigger) to avoid resetting the gait cycle which causes stutter.
    if (cmd) {
        if (cmd !== lastGamepadCmd.current) {
            sendCommand(cmd);
            lastGamepadCmd.current = cmd;
        }
    } else {
        // No input detected (Stick Neutral)
        // If we were previously moving, send STOP command once
        const movementCommands = [
            OPEN_CAT_COMMANDS.WALK, OPEN_CAT_COMMANDS.WALK_LEFT, OPEN_CAT_COMMANDS.WALK_RIGHT,
            OPEN_CAT_COMMANDS.BACK, OPEN_CAT_COMMANDS.BACK_LEFT, OPEN_CAT_COMMANDS.BACK_RIGHT,
            OPEN_CAT_COMMANDS.LEFT, OPEN_CAT_COMMANDS.RIGHT,
            OPEN_CAT_COMMANDS.CRAWL
        ];

        if (lastGamepadCmd.current && movementCommands.includes(lastGamepadCmd.current)) {
            sendCommand(OPEN_CAT_COMMANDS.STOP);
            addLog('INFO', 'Gamepad: Auto-Stop');
            lastGamepadCmd.current = null;
        } else {
            // Clear other commands so they can be re-triggered
            lastGamepadCmd.current = null;
        }
    }
  }, [gamepadConnected, sendCommand, addLog, addToast, handleEmergencyStop, activeCmd, view]);

  useEffect(() => {
    const tick = () => {
      handleGamepadInput();
      requestRef.current = requestAnimationFrame(tick);
    };
    requestRef.current = requestAnimationFrame(tick);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [handleGamepadInput]);

  // --- Connection Handlers ---

  const handleConnectBluetooth = async () => {
    if (!(navigator as any).bluetooth) {
      addToast("Web Bluetooth not supported", 'error');
      return;
    }
    setConnectionState(ConnectionState.CONNECTING);
    addLog('INFO', 'Searching for Bittle (Bluetooth)...');
    try {
      await bluetoothService.connect();
      setConnectionType('BLUETOOTH');
      setConnectionState(ConnectionState.CONNECTED);
      addToast('Connected via Bluetooth', 'success');
      
      // Initialize with Stop command to clear any weird states
      setTimeout(() => {
          bluetoothService.sendCommand(OPEN_CAT_COMMANDS.STOP).catch(console.error);
      }, 500);

      bluetoothService.setOnDisconnect(() => {
        setConnectionState(ConnectionState.DISCONNECTED);
        setConnectionType(null);
        addToast('Bluetooth Disconnected', 'info');
      });

      bluetoothService.setOnDataReceived((data) => {
        console.log('%c[RX-BLE]', 'color: #a78bfa', data.trim());
        addLog('RX', data.trim());
      });
      
    } catch (error) {
      console.error(error);
      setConnectionState(ConnectionState.ERROR);
      const msg = String(error).includes("cancelled") ? "Connection cancelled" : "Connection failed";
      addToast(msg, 'error');
      setTimeout(() => setConnectionState(ConnectionState.DISCONNECTED), 2000);
    }
  };

  const handleConnectUSB = async () => {
    if (!(navigator as any).serial) {
      addToast("Web Serial not supported", 'error');
      return;
    }
    setConnectionState(ConnectionState.CONNECTING);
    addLog('INFO', 'Looking for USB Cable...');
    try {
      await serialService.connect();
      setConnectionType('USB');
      setConnectionState(ConnectionState.CONNECTED);
      addToast('Connected via USB', 'success');
      
      // Initialize with Stop command
      setTimeout(() => {
          serialService.sendCommand(OPEN_CAT_COMMANDS.STOP).catch(console.error);
      }, 500);

      serialService.setOnDisconnect(() => {
        setConnectionState(ConnectionState.DISCONNECTED);
        setConnectionType(null);
        addToast('USB Disconnected', 'info');
      });

      serialService.setOnDataReceived((data) => {
        console.log('%c[RX-USB]', 'color: #a78bfa', data.trim());
        addLog('RX', data.trim());
      });

    } catch (error) {
      setConnectionState(ConnectionState.ERROR);
      addToast('USB connection failed', 'error');
      setTimeout(() => setConnectionState(ConnectionState.DISCONNECTED), 2000);
    }
  };

  const handleConnectWifi = async () => {
    if (!wifiIp) {
      addToast("Enter IP address", 'error');
      return;
    }
    setConnectionState(ConnectionState.CONNECTING);
    addLog('INFO', `Connecting to ${wifiIp}...`);
    try {
      await wifiService.connect(wifiIp);
      setConnectionType('WIFI');
      setConnectionState(ConnectionState.CONNECTED);
      setShowWifiInput(false);
      addToast('Connected via WiFi', 'success');
      
      wifiService.setOnDisconnect(() => {
        setConnectionState(ConnectionState.DISCONNECTED);
        setConnectionType(null);
        addToast('WiFi Disconnected', 'info');
      });

    } catch (error) {
      setConnectionState(ConnectionState.ERROR);
      addToast('WiFi connection failed', 'error');
      setTimeout(() => setConnectionState(ConnectionState.DISCONNECTED), 2000);
    }
  };

  const handleDisconnect = async () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    
    if (connectionType === 'BLUETOOTH') await bluetoothService.disconnect();
    else if (connectionType === 'USB') await serialService.disconnect();
    else if (connectionType === 'WIFI') await wifiService.disconnect();
    
    setConnectionState(ConnectionState.DISCONNECTED);
    setConnectionType(null);
    addToast('Disconnected', 'info');
  };

  if (view === 'DOCS') {
    return <Documentation onBack={() => setView('APP')} />;
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 pb-20 font-sans selection:bg-fun-primary selection:text-white">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      
      {/* Floating Emergency Stop Button */}
      {connectionState === ConnectionState.CONNECTED && (
        <button
            onClick={handleEmergencyStop}
            className="fixed bottom-6 right-6 z-40 bg-red-600 hover:bg-red-500 text-white p-4 rounded-full shadow-2xl border-4 border-red-800 active:scale-95 transition-all animate-in zoom-in slide-in-from-bottom-10"
            title="EMERGENCY STOP"
        >
            <Octagon size={40} strokeWidth={3} />
        </button>
      )}
      
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col xl:flex-row items-center justify-between gap-6 bg-fun-card/80 backdrop-blur-md p-6 rounded-3xl border border-slate-700 shadow-2xl relative">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-fun-primary to-fun-accent p-3 rounded-2xl shadow-lg">
              <Rocket size={32} className="text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">
                Bittle <span className="text-fun-secondary">Explorer</span>
              </h1>
              <p className="text-sm text-slate-400 font-bold">Robot Control Center</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 flex-wrap justify-center">
            
            {gamepadConnected && (
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 rounded-full border border-fun-primary/50 text-fun-primary animate-pulse">
                <Gamepad2 size={20} />
                <span className="font-mono font-bold text-xs uppercase hidden sm:inline">Gamepad Active</span>
              </div>
            )}

            {connectionState === ConnectionState.CONNECTED ? (
               <div className="flex items-center gap-4">
                  <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-900/50 rounded-full border border-slate-700">
                      <Battery size={20} className="text-fun-success" />
                      <span className="font-mono font-bold text-white">Online</span>
                      <span className="ml-2 text-xs text-slate-500 bg-black/30 px-2 py-0.5 rounded">{connectionType}</span>
                  </div>
                  <button
                    onClick={handleDisconnect}
                    className="flex items-center gap-2 px-6 py-3 bg-fun-card text-white font-bold rounded-xl hover:bg-zinc-700 transition-all border border-slate-600"
                  >
                    <WifiOff size={20} />
                    <span>Disconnect</span>
                  </button>
               </div>
            ) : (
              <div className="flex flex-wrap gap-3 justify-center items-center">
                <button
                  onClick={handleConnectBluetooth}
                  disabled={connectionState === ConnectionState.CONNECTING}
                  className="flex items-center gap-2 px-4 py-3 bg-fun-primary text-black font-bold rounded-xl hover:bg-yellow-300 transition-all shadow-lg border-b-4 border-yellow-600 active:border-b-0 active:translate-y-1 disabled:opacity-50 disabled:translate-y-0"
                >
                  <Bluetooth size={20} />
                  <span className="hidden sm:inline">Connect (BLE)</span>
                </button>
                
                <button
                  onClick={handleConnectUSB}
                  disabled={connectionState === ConnectionState.CONNECTING}
                  className="flex items-center gap-2 px-4 py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-500 transition-all shadow-lg border-b-4 border-teal-800 active:border-b-0 active:translate-y-1 disabled:opacity-50 disabled:translate-y-0"
                >
                  <Usb size={20} />
                  <span className="hidden sm:inline">Connect (USB)</span>
                </button>

                <div className="relative">
                  {showWifiInput ? (
                    <div className="absolute top-full mt-2 right-0 bg-white p-3 rounded-xl shadow-xl z-50 flex gap-2 w-[240px] border-2 border-indigo-600">
                      <input 
                        type="text" 
                        value={wifiIp}
                        onChange={(e) => setWifiIp(e.target.value)}
                        placeholder="192.168.x.x"
                        className="w-full text-black px-2 py-1 border border-slate-300 rounded font-mono text-sm"
                        autoFocus
                      />
                      <button 
                        onClick={handleConnectWifi}
                        className="bg-indigo-600 text-white px-3 py-1 rounded font-bold hover:bg-indigo-500"
                      >
                        GO
                      </button>
                    </div>
                  ) : null}
                  <button
                    onClick={() => setShowWifiInput(!showWifiInput)}
                    disabled={connectionState === ConnectionState.CONNECTING}
                    className="flex items-center gap-2 px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-all shadow-lg border-b-4 border-indigo-800 active:border-b-0 active:translate-y-1 disabled:opacity-50 disabled:translate-y-0"
                  >
                    <Wifi size={20} />
                    <span className="hidden sm:inline">WiFi</span>
                  </button>
                </div>
              </div>
            )}
            
            <button 
              onClick={() => setView('DOCS')}
              className="p-3 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 rounded-full border border-slate-600 transition-all"
              title="Open Documentation"
            >
              <BookOpen size={22} />
            </button>

            <button 
              onClick={() => setIsHelpOpen(true)}
              className="p-3 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 rounded-full border border-slate-600 transition-all"
              title="Quick Help"
            >
              <HelpCircle size={22} />
            </button>
          </div>
        </header>

        {/* Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 flex flex-col gap-6">
             <div className="bg-fun-card/40 border border-slate-700 rounded-3xl p-6 flex flex-col items-center">
                <div className="flex items-center justify-between w-full mb-4 px-2">
                  <div className="flex items-center gap-2 text-fun-secondary font-bold uppercase tracking-widest text-sm">
                    <Gamepad2 size={18} />
                    <span>Controller</span>
                  </div>
                  {gamepadConnected && (
                     <span className="text-[10px] bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded border border-yellow-500/30">
                        GAMEPAD ACTIVE
                     </span>
                  )}
                </div>
                <ControlPad 
                  onCommand={sendCommand} 
                  disabled={connectionState !== ConnectionState.CONNECTED}
                  activeCommand={activeCmd}
                />
             </div>
             
             <SensorsPanel 
                onCommand={sendCommand}
                disabled={connectionState !== ConnectionState.CONNECTED}
             />
             
             <ModulesPanel 
                onCommand={sendCommand}
                disabled={connectionState !== ConnectionState.CONNECTED}
             />
          </div>

          <div className="lg:col-span-7 flex flex-col gap-6">
            <AIController 
              onExecuteSequence={executeSequence}
              disabled={connectionState !== ConnectionState.CONNECTED}
            />

            <section className="bg-fun-card/40 border border-slate-700 rounded-3xl p-6">
              <h2 className="text-lg font-extrabold text-white mb-4 flex items-center gap-2">
                <Zap size={24} className="text-yellow-400" />
                <span>Cool Tricks</span>
              </h2>
              <SkillGrid 
                onCommand={sendCommand}
                disabled={connectionState !== ConnectionState.CONNECTED}
              />
            </section>
            
            <div className="mt-auto">
               <Terminal logs={logs} onClear={() => setLogs([])} onCommand={sendCommand} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;