import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Flame, 
  Thermometer, 
  Droplets, 
  Wind, 
  Radio, 
  UserCheck, 
  AlertTriangle, 
  ShieldCheck, 
  RefreshCw, 
  Database, 
  Wifi, 
  PlayCircle,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

const API_BASE = 'http://127.0.0.1:8000';

const Dashboard = () => {
  const [latestData, setLatestData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(null);

  const fetchData = async () => {
    try {
      const [resLatest, resHistory] = await Promise.all([
        fetch(`${API_BASE}/api/live/latest`),
        fetch(`${API_BASE}/api/live/history?limit=30`)
      ]);

      if (resLatest.ok) {
        const latest = await resLatest.json();
        setLatestData(latest);
      }

      if (resHistory.ok) {
        const history = await resHistory.json();
        setHistoryData(history);
      }

      setLastFetchTime(new Date().toLocaleTimeString());
      setLoading(false);
    } catch (err) {
      console.error('Error fetching live telemetry:', err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  const triggerSimulation = async (scenario) => {
    setIsSimulating(true);
    try {
      await fetch(`${API_BASE}/api/live/simulate?scenario=${scenario}`, {
        method: 'POST'
      });
      await fetchData();
    } catch (e) {
      console.error('Simulation error:', e);
    } finally {
      setIsSimulating(false);
    }
  };

  const isHazard = (latestData?.mq2_sensor_1 >= 1200) || (latestData?.mq2_sensor_2 >= 1200);
  const isOccupancy = latestData?.object_detected || latestData?.occupancy_status === 'POSSIBLE_OCCUPANCY';
  const isFanOn = latestData?.fan_status;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 pt-20 pb-16 px-4 sm:px-6 md:px-12">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER & HARDWARE STATUS BAR */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl bg-neutral-900/90 border border-neutral-800 shadow-xl backdrop-blur-md">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Live Telemetry Dashboard
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                POSTGRESQL LIVE
              </span>
            </div>
            <p className="text-sm text-neutral-400 flex items-center gap-2">
              <span>Hardware Device:</span>
              <strong className="text-white font-mono">{latestData?.device_id || 'HORIZONX_ESP32_01'}</strong>
              <span>•</span>
              <Wifi className="w-3.5 h-3.5 text-neutral-400" />
              <span>Target: <code className="text-neutral-300">10.183.170.220:8000/api/sensor-data</code></span>
              {lastFetchTime && <span>• Updated: {lastFetchTime}</span>}
            </p>
          </div>

          {/* Action & Simulation Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-neutral-400 mr-1 hidden sm:inline">Simulate Packet:</span>
            <button
              onClick={() => triggerSimulation('normal')}
              disabled={isSimulating}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition cursor-pointer"
            >
              Normal
            </button>
            <button
              onClick={() => triggerSimulation('gas_leak')}
              disabled={isSimulating}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-800/80 transition cursor-pointer"
            >
              Gas Spike
            </button>
            <button
              onClick={() => triggerSimulation('occupancy_hazard')}
              disabled={isSimulating}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/80 transition cursor-pointer"
            >
              Occupancy Alert
            </button>
            <Link
              to="/analytics"
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center space-x-1.5 transition ml-1"
            >
              <span>Historical Analytics</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* ANOMALY / HAZARD BANNER (When MQ >= 1200) */}
        {Boolean((latestData?.mq2_sensor_1 >= 1200) || (latestData?.mq2_sensor_2 >= 1200)) && (
          <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all duration-300 ${
            latestData?.severity === 'CRITICAL' 
              ? 'bg-red-950/40 border-red-800 text-red-200 shadow-lg shadow-red-950/30' 
              : 'bg-amber-950/40 border-amber-800 text-amber-200 shadow-lg shadow-amber-950/30'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`p-2.5 rounded-xl ${latestData?.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h4 className="font-bold text-sm sm:text-base">
                  {latestData?.anomaly_reason || 'Anomaly Alert Active'}
                </h4>
                <p className="text-xs opacity-80 mt-0.5">
                  Severity: <strong className="font-mono uppercase">{latestData?.severity}</strong> | Score: {latestData?.anomaly_score} | Database Record ID #{latestData?.id}
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-white/10 uppercase tracking-wider">
              AUTO-VENTILATING
            </span>
          </div>
        )}

        {/* 6 KEY SENSOR HARDWARE METRIC CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          
          {/* Card 1: MQ-2 Sensor 1 */}
          <div className="p-5 rounded-3xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition shadow-md">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-400" />
                MQ-2 Sensor #1 (GPIO 34)
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                latestData?.mq2_sensor_1 >= 1200 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {latestData?.mq2_sensor_1 >= 1200 ? 'HAZARD SPIKE' : 'NORMAL'}
              </span>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl sm:text-4xl font-black font-mono text-white">
                {latestData?.mq2_sensor_1 ?? '--'}
              </span>
              <span className="text-xs text-neutral-400 font-mono">ADC / 4095</span>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-[11px] text-neutral-400 font-mono mb-1">
                <span>Threshold: 1200</span>
                <span>{Math.min(100, Math.round(((latestData?.mq2_sensor_1 || 0) / 4095) * 100))}%</span>
              </div>
              <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    latestData?.mq2_sensor_1 >= 1200 ? 'bg-red-500' : 'bg-orange-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(5, ((latestData?.mq2_sensor_1 || 0) / 4095) * 100))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 2: MQ-2 Sensor 2 */}
          <div className="p-5 rounded-3xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition shadow-md">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-400" />
                MQ-2 Sensor #2 (GPIO 35)
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                latestData?.mq2_sensor_2 >= 1200 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {latestData?.mq2_sensor_2 >= 1200 ? 'HAZARD SPIKE' : 'NORMAL'}
              </span>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl sm:text-4xl font-black font-mono text-white">
                {latestData?.mq2_sensor_2 ?? '--'}
              </span>
              <span className="text-xs text-neutral-400 font-mono">ADC / 4095</span>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-[11px] text-neutral-400 font-mono mb-1">
                <span>Threshold: 1200</span>
                <span>{Math.min(100, Math.round(((latestData?.mq2_sensor_2 || 0) / 4095) * 100))}%</span>
              </div>
              <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    latestData?.mq2_sensor_2 >= 1200 ? 'bg-red-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(5, ((latestData?.mq2_sensor_2 || 0) / 4095) * 100))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 3: DHT11 Climate */}
          <div className="p-5 rounded-3xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition shadow-md">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <Thermometer className="w-4 h-4 text-cyan-400" />
                DHT11 Climate (GPIO 4)
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                ACTIVE
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <span className="text-xs text-neutral-400">Temperature</span>
                <div className="text-2xl sm:text-3xl font-black font-mono text-white mt-1">
                  {latestData?.temperature != null ? `${latestData.temperature}°C` : 'N/A'}
                </div>
              </div>
              <div>
                <span className="text-xs text-neutral-400">Humidity</span>
                <div className="text-2xl sm:text-3xl font-black font-mono text-white mt-1">
                  {latestData?.humidity != null ? `${latestData.humidity}%` : 'N/A'}
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-neutral-800/80 text-[11px] text-neutral-400 flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ambient environment regulation normal</span>
            </div>
          </div>

          {/* Card 4: HC-SR04 Ultrasonic Distance & Occupancy */}
          <div className="p-5 rounded-3xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition shadow-md">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-purple-400" />
                Ultrasonic Occupancy
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                isOccupancy ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              }`}>
                {latestData?.occupancy_status || 'CLEAR'}
              </span>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl sm:text-4xl font-black font-mono text-white">
                {latestData?.distance_cm != null ? latestData.distance_cm : '--'}
              </span>
              <span className="text-xs text-neutral-400 font-mono">cm range</span>
            </div>
            <div className="mt-4 pt-3 border-t border-neutral-800/80 text-[11px] text-neutral-400">
              {latestData?.object_detected 
                ? '⚠️ Obstacle/Person detected in range (5-100 cm)' 
                : 'Sensor in Standby / Compartment Unoccupied'}
            </div>
          </div>

          {/* Card 5: L298N Exhaust Fan */}
          <div className="p-5 rounded-3xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition shadow-md">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <Wind className="w-4 h-4 text-emerald-400" />
                L298N Exhaust Fan
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                isFanOn ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-neutral-800 text-neutral-400'
              }`}>
                {isFanOn ? 'RUNNING' : 'STANDBY'}
              </span>
            </div>
            <div className="flex items-center space-x-3 mt-1">
              <Wind className={`w-8 h-8 ${isFanOn ? 'text-emerald-400' : 'text-neutral-600'}`} />
              <div>
                <span className="text-xl sm:text-2xl font-black font-mono text-white">
                  {isFanOn ? 'VENTILATING' : 'IDLE'}
                </span>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {isFanOn ? 'Active ventilation on hazard trigger' : 'Driver disabled (Normal state)'}
                </p>
              </div>
            </div>
          </div>

          {/* Card 6: RC522 RFID Security */}
          <div className="p-5 rounded-3xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition shadow-md">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-indigo-400" />
                RC522 RFID Scanner
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                STANDBY
              </span>
            </div>
            <div className="mt-1">
              <span className="text-xs text-neutral-400">Last Scanned Card UID</span>
              <div className="text-xl sm:text-2xl font-mono font-bold text-indigo-300 mt-1 truncate">
                {latestData?.rfid_uid || 'NO CARD SCANNED'}
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-neutral-800/80 text-[11px] text-neutral-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Crew physical identity verification link</span>
            </div>
          </div>

        </div>

        {/* REAL-TIME TELEMETRY STREAM CHART */}
        <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                Real-Time Hardware Telemetry Stream
              </h3>
              <p className="text-xs text-neutral-400">
                Live chronological sequence of the last 30 telemetry records committed to PostgreSQL
              </p>
            </div>
            <div className="flex items-center space-x-4 text-xs font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-orange-500 inline-block"></span>
                MQ-2 #1
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-400 inline-block"></span>
                MQ-2 #2
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-cyan-400 inline-block"></span>
                Temp (°C)
              </span>
            </div>
          </div>

          {/* SVG Line Stream */}
          <div className="h-64 w-full bg-neutral-950 rounded-2xl p-4 border border-neutral-800 relative overflow-hidden flex items-end">
            {historyData.length > 1 ? (
              <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 200" preserveAspectRatio="none">
                {/* Grid Lines */}
                <line x1="0" y1="50" x2="1000" y2="50" stroke="#262626" strokeDasharray="4 4" />
                <line x1="0" y1="100" x2="1000" y2="100" stroke="#262626" strokeDasharray="4 4" />
                <line x1="0" y1="150" x2="1000" y2="150" stroke="#262626" strokeDasharray="4 4" />
                
                {/* Threshold line 1200 ADC */}
                <line 
                  x1="0" 
                  y1={200 - (1200 / 3000) * 180} 
                  x2="1000" 
                  y2={200 - (1200 / 3000) * 180} 
                  stroke="#ef4444" 
                  strokeDasharray="6 4" 
                  strokeWidth="1.5" 
                />
                <text x="10" y={195 - (1200 / 3000) * 180} fill="#ef4444" fontSize="10" fontFamily="monospace">
                  MQ-2 HAZARD THRESHOLD (1200)
                </text>

                {/* Path MQ2 Sensor 1 */}
                <polyline
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  points={historyData.map((d, i) => {
                    const x = (i / (historyData.length - 1)) * 1000;
                    const val = Math.min(3000, Math.max(0, d.mq2_sensor_1 || 0));
                    const y = 190 - (val / 3000) * 170;
                    return `${x},${y}`;
                  }).join(' ')}
                />

                {/* Path MQ2 Sensor 2 */}
                <polyline
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="2"
                  strokeLinecap="round"
                  points={historyData.map((d, i) => {
                    const x = (i / (historyData.length - 1)) * 1000;
                    const val = Math.min(3000, Math.max(0, d.mq2_sensor_2 || 0));
                    const y = 190 - (val / 3000) * 170;
                    return `${x},${y}`;
                  }).join(' ')}
                />

                {/* Path Temperature */}
                <polyline
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="2"
                  strokeDasharray="3 3"
                  points={historyData.map((d, i) => {
                    const x = (i / (historyData.length - 1)) * 1000;
                    const t = Math.min(60, Math.max(10, d.temperature || 25));
                    const y = 190 - ((t - 10) / 50) * 150;
                    return `${x},${y}`;
                  }).join(' ')}
                />
              </svg>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm text-neutral-500">
                Awaiting telemetry records from ESP32 hardware...
              </div>
            )}
          </div>
        </div>

        {/* RECENT DATABASE LOGS TABLE */}
        <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-400" />
                PostgreSQL Hardware Telemetry Records
              </h3>
              <p className="text-xs text-neutral-400">
                Verified stream stored inside <code>horizonx.live_sensor_telemetry</code>
              </p>
            </div>
            <button
              onClick={fetchData}
              className="px-3 py-1.5 rounded-xl text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center space-x-1.5 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-neutral-800">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-neutral-950 text-neutral-400 uppercase font-mono text-[11px] border-b border-neutral-800">
                <tr>
                  <th className="py-3 px-4">Record ID</th>
                  <th className="py-3 px-4">MQ-2 #1</th>
                  <th className="py-3 px-4">MQ-2 #2</th>
                  <th className="py-3 px-4">Temp</th>
                  <th className="py-3 px-4">Humidity</th>
                  <th className="py-3 px-4">Distance</th>
                  <th className="py-3 px-4">Occupancy</th>
                  <th className="py-3 px-4">Anomaly State</th>
                  <th className="py-3 px-4">Recorded At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 font-mono">
                {historyData.slice(-10).reverse().map((row) => (
                  <tr key={row.id} className="hover:bg-neutral-800/40 transition">
                    <td className="py-3 px-4 font-bold text-white">#{row.id}</td>
                    <td className={`py-3 px-4 font-bold ${row.mq2_sensor_1 >= 1200 ? 'text-red-400' : 'text-neutral-300'}`}>
                      {row.mq2_sensor_1}
                    </td>
                    <td className={`py-3 px-4 font-bold ${row.mq2_sensor_2 >= 1200 ? 'text-red-400' : 'text-neutral-300'}`}>
                      {row.mq2_sensor_2}
                    </td>
                    <td className="py-3 px-4">{row.temperature != null ? `${row.temperature}°C` : '--'}</td>
                    <td className="py-3 px-4">{row.humidity != null ? `${row.humidity}%` : '--'}</td>
                    <td className="py-3 px-4">{row.distance_cm != null ? `${row.distance_cm} cm` : '--'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        row.occupancy_status === 'POSSIBLE_OCCUPANCY' ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-neutral-800 text-neutral-400'
                      }`}>
                        {row.occupancy_status || 'CLEAR'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {row.is_anomaly ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                          ANOMALY
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          NOMINAL
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-neutral-400">
                      {row.created_at ? new Date(row.created_at).toLocaleTimeString() : '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
