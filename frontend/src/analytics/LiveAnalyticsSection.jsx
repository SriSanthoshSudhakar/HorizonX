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
  Wifi
} from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000';

export const LiveAnalyticsSection = () => {
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

  const isHazard = latestData?.hazard_detected || (latestData?.mq2_sensor_1 >= 1200) || (latestData?.mq2_sensor_2 >= 1200);
  const isOccupancy = latestData?.object_detected || latestData?.occupancy_status === 'POSSIBLE_OCCUPANCY';
  const isFanOn = latestData?.fan_status;

  return (
    <div className="space-y-6">
      
      {/* SECTION TITLE & STATUS HEADER */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <h2 className="text-base font-bold text-slate-900 font-mono uppercase tracking-wider">
              Live Hardware Telemetry & Gas Monitoring
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              POSTGRESQL LIVE
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
            <span>Hardware: <strong className="font-mono text-slate-800">{latestData?.device_id || 'HORIZONX_ESP32_01'}</strong></span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Wifi className="w-3 h-3 text-slate-400" />
              <span>Target: <code className="text-slate-700">10.135.195.220:8000/api/sensor-data</code></span>
            </span>
            {lastFetchTime && <span>• Last update: {lastFetchTime}</span>}
          </p>
        </div>

        {/* Quick Simulator Buttons */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">Simulate:</span>
          <button
            onClick={() => triggerSimulation('normal')}
            disabled={isSimulating}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition cursor-pointer"
          >
            Normal
          </button>
          <button
            onClick={() => triggerSimulation('gas_leak')}
            disabled={isSimulating}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 transition cursor-pointer"
          >
            Gas Spike
          </button>
          <button
            onClick={() => triggerSimulation('occupancy_hazard')}
            disabled={isSimulating}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 transition cursor-pointer"
          >
            Occupancy Alert
          </button>
          <button
            onClick={fetchData}
            title="Refresh from PostgreSQL"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition cursor-pointer ml-1"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ANOMALY / HAZARD BANNER (When Active) */}
      {latestData?.is_anomaly && (
        <div className={`p-5 rounded-2xl border flex items-center justify-between gap-4 transition-all duration-300 ${
          latestData?.severity === 'CRITICAL' 
            ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-sm' 
            : 'bg-amber-50 border-amber-300 text-amber-900 shadow-sm'
        }`}>
          <div className="flex items-center space-x-3.5">
            <div className={`p-2.5 rounded-xl ${latestData?.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h4 className="font-bold text-sm sm:text-base">
                {latestData?.anomaly_reason || 'Anomaly Alert Active'}
              </h4>
              <p className="text-xs opacity-90 mt-0.5 font-mono">
                Severity: <strong>{latestData?.severity}</strong> | Score: {latestData?.anomaly_score} | Database Record ID #{latestData?.id}
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-white text-slate-800 shadow-xs uppercase tracking-wider shrink-0 border border-slate-200">
            AUTO-VENTILATING
          </span>
        </div>
      )}

      {/* 6 SENSOR HARDWARE METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* Card 1: MQ-2 Sensor 1 */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 font-mono">
              <Flame className="w-4 h-4 text-orange-500" />
              MQ-2 Sensor #1 (GPIO 34)
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
              latestData?.mq2_sensor_1 >= 1200 ? 'bg-rose-100 text-rose-700 border border-rose-300' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              {latestData?.mq2_sensor_1 >= 1200 ? 'HAZARD SPIKE' : 'NORMAL'}
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl sm:text-4xl font-black font-mono text-slate-900">
              {latestData?.mq2_sensor_1 ?? '--'}
            </span>
            <span className="text-xs text-slate-400 font-mono">ADC / 4095</span>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-[11px] text-slate-500 font-mono mb-1">
              <span>Threshold: 1200</span>
              <span>{Math.min(100, Math.round(((latestData?.mq2_sensor_1 || 0) / 4095) * 100))}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  latestData?.mq2_sensor_1 >= 1200 ? 'bg-rose-500' : 'bg-orange-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(5, ((latestData?.mq2_sensor_1 || 0) / 4095) * 100))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: MQ-2 Sensor 2 */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 font-mono">
              <Flame className="w-4 h-4 text-amber-500" />
              MQ-2 Sensor #2 (GPIO 35)
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
              latestData?.mq2_sensor_2 >= 1200 ? 'bg-rose-100 text-rose-700 border border-rose-300' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              {latestData?.mq2_sensor_2 >= 1200 ? 'HAZARD SPIKE' : 'NORMAL'}
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl sm:text-4xl font-black font-mono text-slate-900">
              {latestData?.mq2_sensor_2 ?? '--'}
            </span>
            <span className="text-xs text-slate-400 font-mono">ADC / 4095</span>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-[11px] text-slate-500 font-mono mb-1">
              <span>Threshold: 1200</span>
              <span>{Math.min(100, Math.round(((latestData?.mq2_sensor_2 || 0) / 4095) * 100))}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  latestData?.mq2_sensor_2 >= 1200 ? 'bg-rose-500' : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(5, ((latestData?.mq2_sensor_2 || 0) / 4095) * 100))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: DHT11 Climate */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 font-mono">
              <Thermometer className="w-4 h-4 text-cyan-600" />
              DHT11 Climate (GPIO 4)
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
              ACTIVE
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div>
              <span className="text-xs text-slate-400">Temperature</span>
              <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 mt-1">
                {latestData?.temperature != null ? `${latestData.temperature}°C` : 'N/A'}
              </div>
            </div>
            <div>
              <span className="text-xs text-slate-400">Humidity</span>
              <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 mt-1">
                {latestData?.humidity != null ? `${latestData.humidity}%` : 'N/A'}
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1.5">
            <Droplets className="w-3.5 h-3.5 text-cyan-600" />
            <span>Ambient cabin climate nominal</span>
          </div>
        </div>

        {/* Card 4: HC-SR04 Ultrasonic Distance & Occupancy */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 font-mono">
              <UserCheck className="w-4 h-4 text-purple-600" />
              Ultrasonic Occupancy
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
              isOccupancy ? 'bg-rose-100 text-rose-700 border border-rose-300' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              {latestData?.occupancy_status || 'CLEAR'}
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl sm:text-4xl font-black font-mono text-slate-900">
              {latestData?.distance_cm != null ? latestData.distance_cm : '--'}
            </span>
            <span className="text-xs text-slate-400 font-mono">cm range</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            {latestData?.object_detected 
              ? '⚠️ Human / Obstacle detected in hazard zone' 
              : 'Standby / Compartment Unoccupied'}
          </div>
        </div>

        {/* Card 5: L298N Exhaust Fan */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 font-mono">
              <Wind className="w-4 h-4 text-emerald-600" />
              L298N Exhaust Fan
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
              isFanOn ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-500'
            }`}>
              {isFanOn ? 'RUNNING' : 'STANDBY'}
            </span>
          </div>
          <div className="flex items-center space-x-3 mt-1">
            <Wind className={`w-8 h-8 ${isFanOn ? 'text-emerald-600 animate-spin' : 'text-slate-300'}`} />
            <div>
              <span className="text-xl sm:text-2xl font-black font-mono text-slate-900">
                {isFanOn ? 'VENTILATING' : 'IDLE'}
              </span>
              <p className="text-xs text-slate-500 mt-0.5">
                {isFanOn ? 'Active motor driver ventilation' : 'Driver disabled (Normal state)'}
              </p>
            </div>
          </div>
        </div>

        {/* Card 6: RC522 RFID Security */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 font-mono">
              <Radio className="w-4 h-4 text-indigo-600" />
              RC522 RFID Scanner
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              STANDBY
            </span>
          </div>
          <div className="mt-1">
            <span className="text-xs text-slate-400 font-mono">Last Scanned Card UID</span>
            <div className="text-xl sm:text-2xl font-mono font-bold text-indigo-900 mt-1 truncate">
              {latestData?.rfid_uid || 'NO CARD SCANNED'}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Physical badge identity authentication</span>
          </div>
        </div>

      </div>

      {/* REAL-TIME TELEMETRY STREAM CHART */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-mono uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              Real-Time Hardware Telemetry Stream (PostgreSQL)
            </h3>
            <p className="text-xs text-slate-500">
              Chronological sequence of recent telemetry records committed to PostgreSQL
            </p>
          </div>
          <div className="flex items-center space-x-4 text-xs font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span>
              MQ-2 #1
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
              MQ-2 #2
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block"></span>
              Temp (°C)
            </span>
          </div>
        </div>

        {/* SVG Line Stream */}
        <div className="h-64 w-full bg-slate-950 rounded-xl p-4 border border-slate-800 relative overflow-hidden flex items-end">
          {historyData.length > 1 ? (
            <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 200" preserveAspectRatio="none">
              {/* Grid Lines */}
              <line x1="0" y1="50" x2="1000" y2="50" stroke="#1e293b" strokeDasharray="4 4" />
              <line x1="0" y1="100" x2="1000" y2="100" stroke="#1e293b" strokeDasharray="4 4" />
              <line x1="0" y1="150" x2="1000" y2="150" stroke="#1e293b" strokeDasharray="4 4" />
              
              {/* Threshold line 1200 ADC */}
              <line 
                x1="0" 
                y1={200 - (1200 / 3000) * 180} 
                x2="1000" 
                y2={200 - (1200 / 3000) * 180} 
                stroke="#f43f5e" 
                strokeDasharray="6 4" 
                strokeWidth="1.5" 
              />
              <text x="10" y={195 - (1200 / 3000) * 180} fill="#f43f5e" fontSize="10" fontFamily="monospace">
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
                stroke="#06b6d4"
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
            <div className="w-full h-full flex items-center justify-center text-xs font-mono text-slate-500">
              Awaiting telemetry records from ESP32 hardware...
            </div>
          )}
        </div>
      </div>

      {/* RECENT DATABASE LOGS TABLE */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-mono uppercase tracking-wider flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" />
              Recent Database Records (PostgreSQL: live_sensor_telemetry)
            </h3>
            <p className="text-xs text-slate-500">
              Validated stream stored inside <code>horizonx.live_sensor_telemetry</code>
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 uppercase font-mono text-[11px] border-b border-slate-200">
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
            <tbody className="divide-y divide-slate-100 font-mono">
              {historyData.slice(-10).reverse().map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">#{row.id}</td>
                  <td className={`py-3 px-4 font-bold ${row.mq2_sensor_1 >= 1200 ? 'text-rose-600' : 'text-slate-800'}`}>
                    {row.mq2_sensor_1}
                  </td>
                  <td className={`py-3 px-4 font-bold ${row.mq2_sensor_2 >= 1200 ? 'text-rose-600' : 'text-slate-800'}`}>
                    {row.mq2_sensor_2}
                  </td>
                  <td className="py-3 px-4">{row.temperature != null ? `${row.temperature}°C` : '--'}</td>
                  <td className="py-3 px-4">{row.humidity != null ? `${row.humidity}%` : '--'}</td>
                  <td className="py-3 px-4">{row.distance_cm != null ? `${row.distance_cm} cm` : '--'}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${
                      row.occupancy_status === 'POSSIBLE_OCCUPANCY' ? 'bg-rose-100 text-rose-700 font-bold border border-rose-200' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {row.occupancy_status || 'CLEAR'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {row.is_anomaly ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                        ANOMALY
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        NOMINAL
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {row.created_at ? new Date(row.created_at).toLocaleTimeString() : '--'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default LiveAnalyticsSection;
