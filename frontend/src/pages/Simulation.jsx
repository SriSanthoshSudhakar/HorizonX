import React, { useState, useEffect } from 'react';

const Simulation = () => {
  const [logs, setLogs] = useState([]);
  const [active, setActive] = useState(false);

  useEffect(() => {
    let interval;
    if (active) {
      interval = setInterval(() => {
        const events = [
          "Initiating atmospheric scrub...",
          "WARNING: Micro-meteoroid impact detected on Sector 4.",
          "Re-routing power to forward shields.",
          "Gas mixture nominal: O2 21%, N2 78%, CO2 0.04%",
          "Thruster sequence aligned.",
          "Checking airlock pressure: 14.7 psi (Stable)",
          "ALERT: Temperature spike in Engine Room 2."
        ];
        const newLog = `[${new Date().toISOString().split('T')[1].slice(0, -1)}] ${events[Math.floor(Math.random() * events.length)]}`;
        
        setLogs(prevLogs => {
          const updated = [...prevLogs, newLog];
          return updated.length > 15 ? updated.slice(1) : updated;
        });
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [active]);

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-12 px-4 sm:px-6 md:px-12 font-sans flex flex-col">
      <div className="max-w-6xl mx-auto w-full flex-grow flex flex-col">
        <header className="mb-6 sm:mb-8 border-b border-gray-800 pb-4 sm:pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold uppercase tracking-widest mb-1 sm:mb-2">Flight Simulation</h1>
            <p className="text-gray-400 text-sm sm:text-lg tracking-wide">Real-time Spacecraft Systems Test</p>
          </div>
          <button 
            onClick={() => setActive(!active)}
            className={`px-4 sm:px-6 py-2 uppercase tracking-widest text-xs sm:text-sm font-bold border transition-colors shrink-0 ${active ? 'bg-red-900/30 border-red-500 text-red-500 hover:bg-red-900/50' : 'bg-white text-black hover:bg-gray-200'}`}
          >
            {active ? 'Halt Simulation' : 'Run Simulation'}
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 flex-grow">
          {/* Main Visuals Placeholder */}
          <div className="md:col-span-2 bg-gray-900/30 border border-gray-800 relative overflow-hidden flex items-center justify-center min-h-[280px] sm:min-h-[400px]">
            {/* A simple CSS radar animation */}
            <div className="absolute w-[240px] h-[240px] sm:w-[400px] sm:h-[400px] border border-gray-700 rounded-full flex items-center justify-center">
              <div className="absolute w-[180px] h-[180px] sm:w-[300px] sm:h-[300px] border border-gray-700 rounded-full"></div>
              <div className="absolute w-[120px] h-[120px] sm:w-[200px] sm:h-[200px] border border-gray-700 rounded-full"></div>
              <div className="absolute w-[60px] h-[60px] sm:w-[100px] sm:h-[100px] border border-gray-700 rounded-full"></div>
              {active && <div className="absolute w-1/2 h-[2px] bg-green-500 origin-left animate-[spin_4s_linear_infinite] left-1/2"></div>}
            </div>
            <div className={`z-10 uppercase tracking-widest text-base sm:text-xl ${active ? 'text-green-500' : 'text-gray-600'}`}>
              {active ? 'Radar Active' : 'Radar Standby'}
            </div>
          </div>

          {/* Terminal Logs */}
          <div className="bg-black border border-gray-800 p-4 font-mono text-xs flex flex-col">
            <h3 className="text-gray-500 uppercase tracking-widest mb-4 border-b border-gray-800 pb-2">Terminal Output</h3>
            <div className="flex-grow overflow-y-auto space-y-2">
              {logs.map((log, i) => (
                <div key={i} className={`${log.includes('WARNING') || log.includes('ALERT') ? 'text-red-500' : 'text-green-400'}`}>
                  {log}
                </div>
              ))}
              {!active && logs.length === 0 && <div className="text-gray-600">Waiting for simulation to start...</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Simulation;

