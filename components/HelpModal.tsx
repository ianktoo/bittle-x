import React from 'react';
import { X, ExternalLink, Wifi, Bluetooth, Usb, Gamepad2, Mic } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900 sticky top-0 z-10">
            <h2 className="text-2xl font-bold text-white">
                Bittle Commander <span className="text-fun-primary">Help</span>
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
                <X size={24} />
            </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8 text-slate-300">
            {/* Quick Start */}
             <section>
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    🚀 Quick Start
                </h3>
                <p className="mb-2">
                    This app controls your Petoi Bittle X robot dog using the OpenCat protocol. 
                    Connect using one of the methods below to start sending commands or using AI.
                </p>
             </section>

             {/* Connection Methods */}
             <section className="grid md:grid-cols-3 gap-4">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                    <div className="flex items-center gap-2 mb-2 text-blue-400 font-bold">
                        <Bluetooth size={20} /> Bluetooth
                    </div>
                    <ul className="text-sm list-disc list-inside space-y-1 text-slate-400">
                        <li>Desktop/Android: Use <b>Chrome</b> or <b>Edge</b>.</li>
                        <li>iOS: Use the <b>Bluefy</b> browser app.</li>
                        <li>Connect to the Petoi BLE module.</li>
                    </ul>
                </div>

                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                    <div className="flex items-center gap-2 mb-2 text-teal-400 font-bold">
                        <Usb size={20} /> USB / Serial
                    </div>
                    <ul className="text-sm list-disc list-inside space-y-1 text-slate-400">
                        <li>Desktop only (Chrome/Edge).</li>
                        <li>Connect Bittle via USB cable.</li>
                        <li>Select the correct COM port (e.g., CP210x).</li>
                        <li>Baud Rate: 115200 (Default).</li>
                    </ul>
                </div>

                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                    <div className="flex items-center gap-2 mb-2 text-indigo-400 font-bold">
                        <Wifi size={20} /> WiFi
                    </div>
                    <ul className="text-sm list-disc list-inside space-y-1 text-slate-400">
                        <li>Works on <b>Safari</b> & all browsers.</li>
                        <li>Requires Bittle X (BiBoard/ESP32).</li>
                        <li>Enter Bittle's IP address (e.g., 192.168.1.15).</li>
                        <li>Must be on same WiFi network.</li>
                    </ul>
                </div>
             </section>

             {/* Controls */}
             <section>
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    🎮 Controls
                </h3>
                <div className="space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-slate-800 rounded-lg shrink-0 text-yellow-400">
                            <Gamepad2 size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-white">Xbox / Gamepad Support</h4>
                            <p className="text-sm text-slate-400 mb-2">Connect a bluetooth controller to your device.</p>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm font-mono text-slate-400">
                                <div>Left Stick: Move</div>
                                <div>A Button: Stop</div>
                                <div>B Button: Sit</div>
                                <div>X Button: Say Hi</div>
                                <div>Y Button: Pee</div>
                                <div>LB/RB: Pushup / Stretch</div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-slate-800 rounded-lg shrink-0 text-green-400">
                            <Mic size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-white">AI Voice Command</h4>
                            <p className="text-sm text-slate-400">
                                Click the microphone or type natural language commands like 
                                <span className="text-white italic"> "Do a pushup then bark twice"</span>. 
                                The AI translates this into OpenCat codes.
                            </p>
                        </div>
                    </div>
                </div>
             </section>

             {/* Links */}
             <section className="pt-4 border-t border-slate-800">
                 <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
                     Official Documentation
                 </h3>
                 <div className="flex flex-wrap gap-4">
                    <a href="https://docs.petoi.com/" target="_blank" rel="noopener noreferrer" 
                       className="flex items-center gap-2 text-fun-primary hover:text-yellow-300 transition-colors">
                        <ExternalLink size={16} /> Petoi Doc Center
                    </a>
                    <a href="https://github.com/PetoiCamp/OpenCat" target="_blank" rel="noopener noreferrer" 
                       className="flex items-center gap-2 text-fun-primary hover:text-yellow-300 transition-colors">
                        <ExternalLink size={16} /> OpenCat GitHub
                    </a>
                    <a href="https://www.petoi.com/pages/bittle-open-source-bionic-robot-dog" target="_blank" rel="noopener noreferrer" 
                       className="flex items-center gap-2 text-fun-primary hover:text-yellow-300 transition-colors">
                        <ExternalLink size={16} /> Product Page
                    </a>
                 </div>
             </section>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;