import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Bluetooth, WifiOff, Battery, Gamepad2, Rocket, Usb, Zap, Wifi, HelpCircle, Octagon, BookOpen, AlertTriangle, Sun, Moon } from 'lucide-react';
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

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('App error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-8">
          <div className="text-center space-y-4 max-w-md">
            <h1 className="text-2xl font-bold text-red-400">Something went wrong</h1>
            <p className="text-slate-400 text-sm font-mono">{this.state.error?.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-fun-primary text-black font-bold rounded-xl hover:bg-yellow-300"
            >
              Reload app
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const App: React.FC = () => {
  const [view, setView] = useState<'APP' | 'DOCS'>('APP');
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [connectionType, setConnectionType] = useState<'BLUETOOTH' | 'USB' | 'WIFI' | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [gamepadConnected, setGamepadConnected] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [activeCmd, setActiveCmd] = useState<string | null>(null);
  const [batteryVoltage, setBatteryVoltage] = useState<number | null>(null);
  const [useAdvancedGaits, setUseAdvancedGaits] = useState(false);
  
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('theme');
        return (saved === 'light' || saved === 'dark') ? saved : 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };
  
  const [showWifiInput, setShowWifiInput] = useState(false);
  const [wifiIp, setWifiIp] = useState('');

  const abortControllerRef = useRef<AbortController | null>(null);
  const lastCommandTime = useRef<number>(0);
  const lastGamepadCmd = useRef<string | null>(null);
  const requestRef = useRef<number | undefined>(undefined);
  const batteryIntervalRef = useRef<number | null>(null);
  const lastBatteryVoltageRef = useRef<number | null>(null);

  // Refs that mirror state for use in rAF callbacks (avoids stale closures)
  const connectionStateRef = useRef<ConnectionState>(ConnectionState.DISCONNECTED);
  const connectionTypeRef = useRef<'BLUETOOTH' | 'USB' | 'WIFI' | null>(null);
  const useAdvancedGaitsRef = useRef(false);

  const addToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, message, type }]);
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

  const handleDataReceived = useCallback((data: string) => {
    const trimmed = data.trim();
    if (!trimmed) return;
    
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      type: 'RX',
      message: trimmed
    }]);

    let volStr = '';
    if (trimmed.toLowerCase().startsWith('v')) {
      volStr = trimmed.substring(1);
    } else if (/^\d+\.\d+$/.test(trimmed)) {
       volStr = trimmed;
    }

    if (volStr) {
      const volts = parseFloat(volStr);
      if (!isNaN(volts)) {
        setBatteryVoltage(volts);
        const prevVoltage = lastBatteryVoltageRef.current;
        lastBatteryVoltageRef.current = volts;
        if (volts < 6.8 && (prevVoltage === null || prevVoltage >= 6.8)) {
          addToast(`Low Battery: ${volts}V! Servos may disable.`, 'error');
        }
      }
    }
  }, [addToast]);

  const sendCommand = useCallback(async (cmd: string) => {
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
      
      if (cmd !== 'v') {
         addLog('TX', cmd);
      }
    } catch (error) {
      console.error('[CMD] Error sending:', error);
      addLog('ERROR', 'Send failed');
      addToast('Failed to send command', 'error');
    }
  }, [connectionState, connectionType, addLog, addToast]);

  const handleEmergencyStop = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      addLog('INFO', 'Sequence Aborted');
    }

    if (connectionState === ConnectionState.CONNECTED) {
      try {
        if (connectionType === 'BLUETOOTH') await bluetoothService.sendCommand(OPEN_CAT_COMMANDS.BALANCE);
        else if (connectionType === 'USB') await serialService.sendCommand(OPEN_CAT_COMMANDS.BALANCE);
        else if (connectionType === 'WIFI') await wifiService.sendCommand(OPEN_CAT_COMMANDS.BALANCE);
        
        addLog('TX', 'STOP (Emergency)');
        addToast('EMERGENCY STOP!', 'error');
      } catch (e) {
        console.error(e);
      }
    }
  }, [connectionState, connectionType, addLog, addToast]);

  // Keep state-mirror refs in sync
  useEffect(() => { connectionStateRef.current = connectionState; }, [connectionState]);
  useEffect(() => { connectionTypeRef.current = connectionType; }, [connectionType]);
  useEffect(() => { useAdvancedGaitsRef.current = useAdvancedGaits; }, [useAdvancedGaits]);

  // Stable callback refs so rAF loop never captures a stale closure
  const sendCommandRef = useRef(sendCommand);
  useEffect(() => { sendCommandRef.current = sendCommand; }, [sendCommand]);
  const handleEmergencyStopRef = useRef(handleEmergencyStop);
  useEffect(() => { handleEmergencyStopRef.current = handleEmergencyStop; }, [handleEmergencyStop]);

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
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
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

  const handleGamepadInput = useCallback(() => {
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

    const now = Date.now();
    const DEADZONE = 0.25;
    let cmd = '';

    const axisX = gp.axes[0]; 
    const axisY = gp.axes[1]; 
    
    const isUp = axisY < -DEADZONE || (gp.buttons[12]?.pressed ?? false);
    const isDown = axisY > DEADZONE || (gp.buttons[13]?.pressed ?? false);
    const isLeft = axisX < -DEADZONE || gp.buttons[14].pressed;
    const isRight = axisX > DEADZONE || gp.buttons[15].pressed;

    // Directional Mapping using official gaits
    if (isUp && isLeft) cmd = useAdvancedGaitsRef.current ? 'kwkL' : 'kwkF';
    else if (isUp && isRight) cmd = useAdvancedGaitsRef.current ? 'kwkR' : 'kwkF';
    else if (isDown && isLeft) cmd = 'kbkL';
    else if (isDown && isRight) cmd = 'kbkR';
    else if (isUp) cmd = OPEN_CAT_COMMANDS.WALK_F;
    else if (isDown) cmd = OPEN_CAT_COMMANDS.BACKWARD;
    else if (isLeft) cmd = OPEN_CAT_COMMANDS.SPIN_L;
    else if (isRight) cmd = 'kvtR'; // Mirror of kvtL
    
    if (!cmd) {
        if (gp.buttons[0].pressed) cmd = OPEN_CAT_COMMANDS.BALANCE; // A
        else if (gp.buttons[1].pressed) cmd = OPEN_CAT_COMMANDS.SIT; // B
        else if (gp.buttons[2].pressed) cmd = OPEN_CAT_COMMANDS.HI;  // X
        else if (gp.buttons[3].pressed) cmd = OPEN_CAT_COMMANDS.PEE; // Y
        else if (gp.buttons[4].pressed) cmd = OPEN_CAT_COMMANDS.PUSH_UPS; // LB
        else if (gp.buttons[5].pressed) cmd = OPEN_CAT_COMMANDS.STRETCH; // RB
        
        if (gp.buttons[8].pressed || gp.buttons[9].pressed) {
             if (now - lastCommandTime.current > 1000) {
                 handleEmergencyStopRef.current();
                 lastCommandTime.current = now;
             }
             return;
        }
    }

    if (cmd !== activeCmd) {
      setActiveCmd(cmd);
    }

    if (cmd) {
        if (cmd !== lastGamepadCmd.current) {
            sendCommandRef.current(cmd);
            lastGamepadCmd.current = cmd;
        }
    } else {
        const movementCommands = [
            'kwkF', 'kwkL', 'kwkR', 'kbk', 'kbkL', 'kbkR', 'kcrF', 'ktrF', 'kvtL', 'kvtR'
        ];

        if (lastGamepadCmd.current && movementCommands.includes(lastGamepadCmd.current)) {
            sendCommandRef.current(OPEN_CAT_COMMANDS.BALANCE);
            addLog('INFO', 'Gamepad: Auto-Stop');
            lastGamepadCmd.current = null;
        } else {
            lastGamepadCmd.current = null;
        }
    }
  }, [gamepadConnected, addLog, addToast, activeCmd, view]);

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

  const startBatteryPolling = useCallback(() => {
    sendCommand(OPEN_CAT_COMMANDS.BATTERY);
    if (batteryIntervalRef.current) clearInterval(batteryIntervalRef.current);
    batteryIntervalRef.current = window.setInterval(() => {
      sendCommand(OPEN_CAT_COMMANDS.BATTERY);
    }, 20000);
  }, [sendCommand]);

  const handleConnectBluetooth = async () => {
    if (!('bluetooth' in navigator)) {
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
      setTimeout(() => {
          bluetoothService.sendCommand(OPEN_CAT_COMMANDS.BALANCE).catch(() => {});
          startBatteryPolling();
      }, 500);
      bluetoothService.setOnDisconnect(() => {
        setConnectionState(ConnectionState.DISCONNECTED);
        setConnectionType(null);
        setBatteryVoltage(null);
        if (batteryIntervalRef.current) clearInterval(batteryIntervalRef.current);
        addToast('Bluetooth Disconnected', 'info');
      });
      bluetoothService.setOnDataReceived(handleDataReceived);
    } catch (error: any) {
      setConnectionState(ConnectionState.DISCONNECTED);
      if (error.message === "Connection cancelled by user") {
        addToast("Connection cancelled", 'info');
      } else {
        console.error(error);
        addToast('Bluetooth connection failed', 'error');
      }
    }
  };

  const handleConnectUSB = async () => {
    if (!('serial' in navigator)) {
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
      setTimeout(() => {
          serialService.sendCommand(OPEN_CAT_COMMANDS.BALANCE).catch(() => {});
          startBatteryPolling();
      }, 500);
      serialService.setOnDisconnect(() => {
        setConnectionState(ConnectionState.DISCONNECTED);
        setConnectionType(null);
        setBatteryVoltage(null);
        if (batteryIntervalRef.current) clearInterval(batteryIntervalRef.current);
        addToast('USB Disconnected', 'info');
      });
      serialService.setOnDataReceived(handleDataReceived);
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
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(wifiIp)) {
      addToast("Invalid IP address format", 'error');
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
      setTimeout(() => {
         wifiService.sendCommand(OPEN_CAT_COMMANDS.BALANCE).catch(() => {});
      }, 500);
      wifiService.setOnDisconnect(() => {
        setConnectionState(ConnectionState.DISCONNECTED);
        setConnectionType(null);
        setBatteryVoltage(null);
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
    if (batteryIntervalRef.current) clearInterval(batteryIntervalRef.current);
    if (connectionType === 'BLUETOOTH') await bluetoothService.disconnect();
    else if (connectionType === 'USB') await serialService.disconnect();
    else if (connectionType === 'WIFI') await wifiService.disconnect();
    setConnectionState(ConnectionState.DISCONNECTED);
    setConnectionType(null);
    setBatteryVoltage(null);
    addToast('Disconnected', 'info');
  };

  useEffect(() => {
    const handleSerialDisconnectEvent = () => {
      if (connectionType === 'USB') {
        serialService.disconnect();
      }
    };

    if ('serial' in navigator) {
      (navigator as unknown as { serial: { addEventListener: (t: string, l: EventListener) => void; removeEventListener: (t: string, l: EventListener) => void } }).serial.addEventListener('disconnect', handleSerialDisconnectEvent);
    }
    return () => {
      if ('serial' in navigator) {
        (navigator as unknown as { serial: { addEventListener: (t: string, l: EventListener) => void; removeEventListener: (t: string, l: EventListener) => void } }).serial.removeEventListener('disconnect', handleSerialDisconnectEvent);
      }
    };
  }, [connectionType]);

  if (view === 'DOCS') {
    return <Documentation onBack={() => setView('APP')} />;
  }

  return (
    <ErrorBoundary>
    <div className="min-h-screen p-4 sm:p-6 pb-20 font-sans selection:bg-fun-primary selection:text-white transition-colors duration-300">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      
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
        
        <header className="flex flex-col xl:flex-row items-center justify-between gap-6 bg-white dark:bg-fun-card/80 backdrop-blur-md p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl relative transition-all">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-fun-primary to-fun-accent p-3 rounded-2xl shadow-lg">
              <Rocket size={32} className="text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Bittle <span className="text-yellow-500 dark:text-fun-secondary">Explorer</span>
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-bold">BiBoard v1.0 Edition</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 flex-wrap justify-center">
            
            {gamepadConnected && (
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-900/50 rounded-full border border-yellow-500/50 text-yellow-600 dark:text-fun-primary animate-pulse">
                <Gamepad2 size={20} />
                <span className="font-mono font-bold text-xs uppercase hidden sm:inline">Gamepad Active</span>
              </div>
            )}

            {connectionState === ConnectionState.CONNECTED ? (
               <div className="flex items-center gap-4">
                  <div className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-full border transition-colors ${
                      batteryVoltage !== null && batteryVoltage < 6.8 
                        ? 'bg-red-100 dark:bg-red-900/50 border-red-500 text-red-600 dark:text-red-200 animate-pulse' 
                        : 'bg-slate-100 dark:bg-slate-900/50 border-slate-300 dark:border-slate-700'
                  }`}>
                      {batteryVoltage !== null && batteryVoltage < 6.8 ? (
                         <AlertTriangle size={20} />
                      ) : (
                         <Battery size={20} className={batteryVoltage !== null ? "text-green-600 dark:text-fun-success" : "text-slate-400 dark:text-slate-500"} />
                      )}
                      
                      <div className="flex flex-col leading-none">
                         <span className="font-mono font-bold text-slate-700 dark:text-white text-sm">
                            {batteryVoltage !== null ? `${batteryVoltage.toFixed(1)}V` : 'Online'}
                         </span>
                         {batteryVoltage === null && (
                             <span className="text-[10px] text-slate-500">{connectionType}</span>
                         )}
                      </div>
                  </div>
                  <button
                    onClick={handleDisconnect}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-200 dark:bg-fun-card text-slate-900 dark:text-white font-bold rounded-xl hover:bg-slate-300 dark:hover:bg-zinc-700 transition-all border border-slate-300 dark:border-slate-600"
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
                    <div className="absolute top-full mt-2 right-0 bg-white dark:bg-slate-800 p-3 rounded-xl shadow-xl z-50 flex gap-2 w-[240px] border-2 border-indigo-600">
                      <input 
                        type="text" 
                        value={wifiIp}
                        onChange={(e) => setWifiIp(e.target.value)}
                        placeholder="192.168.x.x"
                        className="w-full text-black dark:text-white bg-slate-100 dark:bg-slate-900 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded font-mono text-sm"
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
              className="p-3 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300 dark:hover:bg-slate-700 rounded-full border border-slate-300 dark:border-slate-600 transition-all"
              title="Open Documentation"
            >
              <BookOpen size={22} />
            </button>

            <button 
              onClick={() => setIsHelpOpen(true)}
              className="p-3 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300 dark:hover:bg-slate-700 rounded-full border border-slate-300 dark:border-slate-600 transition-all"
              title="Quick Help"
            >
              <HelpCircle size={22} />
            </button>
            
            <button 
              onClick={toggleTheme}
              className="p-3 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300 dark:hover:bg-slate-700 rounded-full border border-slate-300 dark:border-slate-600 transition-all"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 flex flex-col gap-6">
             <div className="bg-white/60 dark:bg-fun-card/40 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 flex flex-col items-center shadow-xl backdrop-blur-sm transition-all">
                <div className="flex items-center justify-between w-full mb-4 px-2">
                  <div className="flex items-center gap-2 text-yellow-600 dark:text-fun-secondary font-bold uppercase tracking-widest text-sm">
                    <Gamepad2 size={18} />
                    <span>Controller</span>
                  </div>
                  {gamepadConnected && (
                     <span className="text-[10px] bg-yellow-100 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-300 px-2 py-0.5 rounded border border-yellow-200 dark:border-yellow-500/30">
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
                advancedGaits={useAdvancedGaits}
                onToggleAdvancedGaits={() => setUseAdvancedGaits(!useAdvancedGaits)}
             />
          </div>

          <div className="lg:col-span-7 flex flex-col gap-6">
            <AIController 
              onExecuteSequence={executeSequence}
              disabled={connectionState !== ConnectionState.CONNECTED}
            />

            <section className="bg-white/60 dark:bg-fun-card/40 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-xl backdrop-blur-sm transition-all">
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Zap size={24} className="text-yellow-500 dark:text-yellow-400" />
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
    </ErrorBoundary>
  );
};

export default App;