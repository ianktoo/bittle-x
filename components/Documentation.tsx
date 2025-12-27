import React, { useState } from 'react';
import { ArrowLeft, Book, Cpu, Bluetooth, Wifi, Zap, Eye, Terminal, AlertTriangle, Menu } from 'lucide-react';

interface DocumentationProps {
  onBack: () => void;
}

const Documentation: React.FC<DocumentationProps> = ({ onBack }) => {
  const [activeSection, setActiveSection] = useState('intro');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const sections = [
    { id: 'intro', title: 'Introduction', icon: Book },
    { id: 'hardware', title: 'Hardware Setup', icon: Cpu },
    { id: 'connection', title: 'Connection Methods', icon: Bluetooth },
    { id: 'controls', title: 'Controls & Gamepad', icon: Zap },
    { id: 'vision', title: 'AI Vision System', icon: Eye },
    { id: 'api', title: 'OpenCat Protocol', icon: Terminal },
    { id: 'troubleshooting', title: 'Troubleshooting', icon: AlertTriangle },
  ];

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-300 font-sans flex flex-col md:flex-row transition-colors">
      
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <button onClick={onBack} className="flex items-center gap-2 text-yellow-600 dark:text-fun-primary font-bold">
          <ArrowLeft size={20} /> Back
        </button>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-900 dark:text-white">
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <div className="bg-fun-primary p-2 rounded-lg text-black">
                <Book size={24} />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Docs</h1>
        </div>
        
        <nav className="p-4 space-y-1">
            <button 
                onClick={onBack} 
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition-all mb-6 border border-transparent hover:border-slate-300 dark:hover:border-slate-700"
            >
                <ArrowLeft size={18} />
                Back to App
            </button>

            <div className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest px-4 mb-2 mt-6">Contents</div>
            
            {sections.map((section) => (
                <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all ${
                        activeSection === section.id 
                        ? 'bg-fun-primary text-black shadow-md dark:shadow-[0_0_15px_rgba(250,204,21,0.3)]' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
                    }`}
                >
                    <section.icon size={18} />
                    {section.title}
                </button>
            ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto bg-slate-50 dark:bg-black custom-scrollbar scroll-smooth">
        <div className="max-w-4xl mx-auto p-6 md:p-12 space-y-16 pb-32">
            
            {/* Header */}
            <div className="border-b border-slate-200 dark:border-slate-800 pb-8">
                <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4">
                    Bittle X Explorer <span className="text-yellow-600 dark:text-fun-primary">Documentation</span>
                </h1>
                <p className="text-xl text-slate-500 dark:text-slate-400 leading-relaxed">
                    The complete technical reference for controlling the Petoi Bittle X robot dog using Web Bluetooth, Serial, and Gemini AI.
                </p>
            </div>

            {/* Intro */}
            <section id="intro" className="space-y-6">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <Book className="text-yellow-600 dark:text-fun-primary" /> Introduction
                </h2>
                <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300">
                    <p>
                        Bittle X Explorer is a futuristic web interface designed to interface with the 
                        <strong> OpenCat</strong> protocol running on Petoi robots. It leverages modern web standards 
                        (Web Bluetooth, Web Serial) to allow driverless connections directly from the browser.
                    </p>
                    <div className="bg-white dark:bg-slate-900/50 border-l-4 border-yellow-500 dark:border-fun-primary p-4 rounded-r-xl shadow-sm">
                        <strong className="text-slate-900 dark:text-white">Key Features:</strong>
                        <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                            <li><strong>Multi-Protocol:</strong> Supports BLE, USB Serial, and WiFi (ESP32).</li>
                            <li><strong>AI Integration:</strong> Uses Google Gemini to translate natural language into robot commands.</li>
                            <li><strong>Vision Control:</strong> Dedicated interface for the Grove AI (Mu Vision) camera.</li>
                            <li><strong>Gamepad Support:</strong> Native Xbox/PlayStation controller mapping.</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Hardware */}
            <section id="hardware" className="space-y-6">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <Cpu className="text-purple-600 dark:text-purple-400" /> Hardware Setup
                </h2>
                <div className="space-y-4">
                    <p className="text-slate-600 dark:text-slate-300">Ensure your Bittle is configured correctly before connecting.</p>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Supported Boards</h3>
                            <ul className="list-disc list-inside text-slate-500 dark:text-slate-400 space-y-2">
                                <li><strong>BiBoard (ESP32):</strong> Recommended for WiFi and fast BLE.</li>
                                <li><strong>NyBoard V1_1/V1_2:</strong> Supported via standard Bluetooth dongle or USB.</li>
                            </ul>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Modules</h3>
                            <ul className="list-disc list-inside text-slate-500 dark:text-slate-400 space-y-2">
                                <li><strong>Grove AI (Mu Vision):</strong> Connects to I2C ports.</li>
                                <li><strong>Petoi BLE Dongle:</strong> Required for NyBoard wireless control.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Connection */}
            <section id="connection" className="space-y-6">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <Bluetooth className="text-blue-600 dark:text-blue-400" /> Connection Methods
                </h2>
                
                <div className="space-y-8">
                    {/* BLE */}
                    <div className="bg-white dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-2">1. Bluetooth Low Energy (BLE)</h3>
                        <p className="mb-4 text-slate-600 dark:text-slate-300">The preferred method for wireless control.</p>
                        <ul className="list-disc list-inside space-y-2 text-slate-500 dark:text-slate-300 text-sm">
                            <li><strong>Service UUID:</strong> <code>6e400001-b5a3-f393-e0a9-e50e24dcca9e</code> (Nordic UART)</li>
                            <li><strong>Desktop:</strong> Use Chrome, Edge, or Opera.</li>
                            <li><strong>Android:</strong> Use Chrome.</li>
                            <li><strong>iOS/iPadOS:</strong> Apple does not support Web Bluetooth in Safari. You <strong>must</strong> use the <a href="https://apps.apple.com/us/app/bluefy-web-ble-browser/id1492822055" target="_blank" className="text-yellow-600 dark:text-fun-primary underline">Bluefy Browser</a>.</li>
                        </ul>
                    </div>

                    {/* USB */}
                    <div className="bg-white dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <h3 className="text-xl font-bold text-teal-600 dark:text-teal-400 mb-2">2. USB Serial</h3>
                        <p className="mb-4 text-slate-600 dark:text-slate-300">Lowest latency, best for debugging.</p>
                        <ul className="list-disc list-inside space-y-2 text-slate-500 dark:text-slate-300 text-sm">
                            <li>Connect Bittle via USB-C (BiBoard) or Micro-USB (NyBoard).</li>
                            <li>Baud Rate defaults to <strong>115200</strong>.</li>
                            <li>No drivers needed on macOS/Linux. Windows may need CP210x drivers.</li>
                        </ul>
                    </div>

                    {/* WiFi */}
                    <div className="bg-white dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">3. WiFi</h3>
                        <p className="mb-4 text-slate-600 dark:text-slate-300">Long range, requires BiBoard configuration.</p>
                        <div className="bg-slate-100 dark:bg-black p-3 rounded font-mono text-xs text-green-600 dark:text-green-400 mb-2">
                            http://[IP_ADDRESS]/action?cmd=[COMMAND]
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500">Note: This app sends "no-cors" requests. The robot executes commands but may not return confirmation due to browser security policies.</p>
                    </div>
                </div>
            </section>

            {/* Controls */}
            <section id="controls" className="space-y-6">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <Zap className="text-yellow-500 dark:text-yellow-400" /> Controls & Gamepad
                </h2>
                <p className="text-slate-600 dark:text-slate-300">
                    The app automatically detects connected Gamepads (Xbox, PlayStation, etc). 
                    Press any button on your controller to activate it.
                </p>
                
                <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white">
                            <tr>
                                <th className="p-4">Input</th>
                                <th className="p-4">Action</th>
                                <th className="p-4">Command</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900/50">
                            <tr><td className="p-4 font-mono text-slate-500 dark:text-slate-400">Left Stick Y-</td><td className="p-4 text-slate-700 dark:text-slate-300">Walk Forward</td><td className="p-4 font-mono text-yellow-600 dark:text-fun-primary">kwk</td></tr>
                            <tr><td className="p-4 font-mono text-slate-500 dark:text-slate-400">Left Stick Y+</td><td className="p-4 text-slate-700 dark:text-slate-300">Walk Backward</td><td className="p-4 font-mono text-yellow-600 dark:text-fun-primary">kbk</td></tr>
                            <tr><td className="p-4 font-mono text-slate-500 dark:text-slate-400">Left Stick X-</td><td className="p-4 text-slate-700 dark:text-slate-300">Turn Left</td><td className="p-4 font-mono text-yellow-600 dark:text-fun-primary">kturnL</td></tr>
                            <tr><td className="p-4 font-mono text-slate-500 dark:text-slate-400">Left Stick X+</td><td className="p-4 text-slate-700 dark:text-slate-300">Turn Right</td><td className="p-4 font-mono text-yellow-600 dark:text-fun-primary">kturnR</td></tr>
                            <tr><td className="p-4 font-mono text-slate-500 dark:text-slate-400">Button A (0)</td><td className="p-4 text-slate-700 dark:text-slate-300">Stop / Balance</td><td className="p-4 font-mono text-yellow-600 dark:text-fun-primary">kbalance</td></tr>
                            <tr><td className="p-4 font-mono text-slate-500 dark:text-slate-400">Button B (1)</td><td className="p-4 text-slate-700 dark:text-slate-300">Sit</td><td className="p-4 font-mono text-yellow-600 dark:text-fun-primary">ksit</td></tr>
                            <tr><td className="p-4 font-mono text-slate-500 dark:text-slate-400">Button X (2)</td><td className="p-4 text-slate-700 dark:text-slate-300">Say Hi</td><td className="p-4 font-mono text-yellow-600 dark:text-fun-primary">khi</td></tr>
                            <tr><td className="p-4 font-mono text-slate-500 dark:text-slate-400">Select / Back</td><td className="p-4 text-red-500 dark:text-red-400 font-bold">EMERGENCY STOP</td><td className="p-4 font-mono text-yellow-600 dark:text-fun-primary">kbalance</td></tr>
                        </tbody>
                    </table>
                </div>
            </section>

             {/* API Reference */}
             <section id="api" className="space-y-6">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <Terminal className="text-pink-600 dark:text-pink-400" /> OpenCat Protocol Reference
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                    The app communicates using raw ASCII strings. You can type these directly into the app's Terminal.
                </p>

                <div className="grid md:grid-cols-2 gap-8">
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white mb-2 border-b border-slate-200 dark:border-slate-700 pb-1">Gait & Movement</h3>
                        <ul className="font-mono text-sm space-y-1 text-slate-600 dark:text-slate-300">
                            <li><span className="text-yellow-600 dark:text-fun-primary">kbalance</span> - Stand / Stop</li>
                            <li><span className="text-yellow-600 dark:text-fun-primary">kwk</span> - Walk</li>
                            <li><span className="text-yellow-600 dark:text-fun-primary">kbk</span> - Back</li>
                            <li><span className="text-yellow-600 dark:text-fun-primary">kcr</span> - Crawl</li>
                            <li><span className="text-yellow-600 dark:text-fun-primary">ktr</span> - Trot</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white mb-2 border-b border-slate-200 dark:border-slate-700 pb-1">Postures</h3>
                        <ul className="font-mono text-sm space-y-1 text-slate-600 dark:text-slate-300">
                            <li><span className="text-yellow-600 dark:text-fun-primary">ksit</span> - Sit</li>
                            <li><span className="text-yellow-600 dark:text-fun-primary">kstr</span> - Stretch</li>
                            <li><span className="text-yellow-600 dark:text-fun-primary">d</span> - Shutdown / Rest</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white mb-2 border-b border-slate-200 dark:border-slate-700 pb-1">Servos</h3>
                        <ul className="font-mono text-sm space-y-1 text-slate-600 dark:text-slate-300">
                            <li><span className="text-yellow-600 dark:text-fun-primary">m0 30</span> - Head Pan to 30°</li>
                            <li><span className="text-yellow-600 dark:text-fun-primary">m1 -20</span> - Head Tilt to -20°</li>
                            <li><span className="text-yellow-600 dark:text-fun-primary">m8 60</span> - Move joint 8 to 60°</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white mb-2 border-b border-slate-200 dark:border-slate-700 pb-1">System</h3>
                        <ul className="font-mono text-sm space-y-1 text-slate-600 dark:text-slate-300">
                            <li><span className="text-yellow-600 dark:text-fun-primary">v</span> - Check Battery Voltage</li>
                            <li><span className="text-yellow-600 dark:text-fun-primary">g</span> - Toggle Gyro On/Off</li>
                            <li><span className="text-yellow-600 dark:text-fun-primary">z</span> - Toggle Random Behavior</li>
                        </ul>
                    </div>
                </div>
            </section>

             {/* Troubleshooting */}
             <section id="troubleshooting" className="space-y-6">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <AlertTriangle className="text-red-500 dark:text-red-400" /> Troubleshooting
                </h2>
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 rounded-xl p-6 space-y-4">
                    <div>
                        <h4 className="font-bold text-red-700 dark:text-red-200">Robot Stutters while Walking</h4>
                        <p className="text-sm text-red-600 dark:text-red-100/70">
                            This happens if commands are sent too fast, resetting the gait cycle. 
                            The app has a built-in "Edge Trigger" to prevent this, but ensure your Bluetooth signal is strong.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold text-red-700 dark:text-red-200">Bluetooth "Device Not Supported"</h4>
                        <p className="text-sm text-red-600 dark:text-red-100/70">
                            Ensure you are not using standard Safari. Use <strong>Bluefy</strong> on iOS or Chrome on Android.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold text-red-700 dark:text-red-200">Gyro / Balance is weird</h4>
                        <p className="text-sm text-red-600 dark:text-red-100/70">
                            Place the robot on a flat surface and send the command <code>c</code> to calibrate, or <code>kbalance</code> to reset posture.
                        </p>
                    </div>
                </div>
            </section>

            <div className="text-center pt-10 text-slate-400 dark:text-slate-600 text-sm">
                Built for Petoi OpenCat Quadruped Robots.
            </div>

        </div>
      </main>
    </div>
  );
};

export default Documentation;