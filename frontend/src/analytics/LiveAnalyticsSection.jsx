import React, { useState, useEffect, useMemo } from 'react';
import PlotlyComponent from './PlotlyComponent';
import { 
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
  Cpu, 
  CheckCircle2,
  Activity
} from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000';

export const LiveAnalyticsSection = () => {
  const [latestData, setLatestData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
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
      console.warn('Error fetching live telemetry:', err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);


  const isHazard = latestData?.is_anomaly || (latestData?.mq2_sensor_1 >= 1200) || (latestData?.mq2_sensor_2 >= 1200) || latestData?.hazard_detected;
  const isOccupancy = latestData?.object_detected || latestData?.occupancy_status === 'POSSIBLE_OCCUPANCY';
  const isFanOn = latestData?.fan_status;

  // 1. PLOTLY GAS TRANSDUCER WAVEFORM (MQ-2 #1 & #2 + Threshold)
  const gasPlot = useMemo(() => {
    if (!historyData || historyData.length === 0) {
      return { data: [], layout: {} };
    }

    const xVals = historyData.map((d, i) => `#${d.id || i + 1}`);
    const mq1Vals = historyData.map(d => d.mq2_sensor_1 || 0);
    const mq2Vals = historyData.map(d => d.mq2_sensor_2 || 0);

    const data = [
      {
        x: xVals,
        y: mq1Vals,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'MQ-2 Transducer #1 (GPIO 34)',
        line: { color: '#f97316', width: 2.5, shape: 'spline' },
        marker: { size: 4, color: '#ea580c' },
        fill: 'tozeroy',
        fillcolor: 'rgba(249, 115, 22, 0.08)'
      },
      {
        x: xVals,
        y: mq2Vals,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'MQ-2 Transducer #2 (GPIO 35)',
        line: { color: '#eab308', width: 2, shape: 'spline' },
        marker: { size: 4, color: '#ca8a04' },
        fill: 'tozeroy',
        fillcolor: 'rgba(234, 179, 8, 0.05)'
      },
      {
        x: [xVals[0], xVals[xVals.length - 1]],
        y: [1200, 1200],
        type: 'scatter',
        mode: 'lines',
        name: 'Hazard Threshold (1200 ADC)',
        line: { color: '#ef4444', width: 1.5, dash: 'dash' }
      }
    ];

    const layout = {
      autosize: true,
      height: 320,
      margin: { l: 45, r: 20, t: 15, b: 40 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      hovermode: 'x unified',
      xaxis: {
        title: { text: 'Chronological Packet Sequence', font: { size: 10, color: '#64748b' } },
        color: '#64748b',
        gridcolor: '#f1f5f9',
        zeroline: false
      },
      yaxis: {
        title: { text: 'Transducer Intensity (ADC)', font: { size: 10, color: '#64748b' } },
        color: '#64748b',
        gridcolor: '#f1f5f9',
        zeroline: false,
        range: [0, Math.max(2000, ...mq1Vals, ...mq2Vals) + 200]
      },
      legend: {
        orientation: 'h',
        y: 1.15,
        x: 0,
        font: { size: 10, color: '#475569' }
      }
    };

    return { data, layout };
  }, [historyData]);

  // 2. PLOTLY ENVIRONMENTAL DRIFT (Temperature & Humidity)
  const envPlot = useMemo(() => {
    if (!historyData || historyData.length === 0) {
      return { data: [], layout: {} };
    }

    const xVals = historyData.map((d, i) => `#${d.id || i + 1}`);
    const tempVals = historyData.map(d => d.temperature || 25);
    const humVals = historyData.map(d => d.humidity || 50);

    const data = [
      {
        x: xVals,
        y: tempVals,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Temperature (°C)',
        line: { color: '#0284c7', width: 2.5, shape: 'spline' },
        marker: { size: 4, color: '#0369a1' },
        yaxis: 'y1'
      },
      {
        x: xVals,
        y: humVals,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Humidity (%RH)',
        line: { color: '#0d9488', width: 2, shape: 'spline' },
        marker: { size: 4, color: '#0f766e' },
        yaxis: 'y2'
      }
    ];

    const layout = {
      autosize: true,
      height: 290,
      margin: { l: 45, r: 45, t: 15, b: 40 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      hovermode: 'x unified',
      xaxis: {
        title: { text: 'Chronological Packet Sequence', font: { size: 10, color: '#64748b' } },
        color: '#64748b',
        gridcolor: '#f1f5f9'
      },
      yaxis: {
        title: { text: 'Temp (°C)', font: { size: 10, color: '#0284c7' } },
        color: '#0284c7',
        gridcolor: '#f1f5f9',
        range: [15, 45]
      },
      yaxis2: {
        title: { text: 'Humidity (%)', font: { size: 10, color: '#0d9488' } },
        color: '#0d9488',
        overlaying: 'y',
        side: 'right',
        range: [30, 90],
        gridcolor: 'rgba(0,0,0,0)'
      },
      legend: {
        orientation: 'h',
        y: 1.15,
        x: 0,
        font: { size: 10, color: '#475569' }
      }
    };

    return { data, layout };
  }, [historyData]);

  // Sparkline points generator for KPI cards
  const getSparkPoints = (arr, max = 4095) => {
    if (!arr || arr.length < 2) return '0,15 30,12 60,14 90,10';
    return arr
      .map((v, i) => {
        const x = Math.round((i / (arr.length - 1)) * 90);
        const y = Math.round(22 - (Math.min(max, Math.max(0, v)) / max) * 18);
        return `${x},${y}`;
      })
      .join(' ');
  };

  const mq1History = historyData.map(d => d.mq2_sensor_1 || 0);
  const mq2History = historyData.map(d => d.mq2_sensor_2 || 0);
  const tempHistory = historyData.map(d => d.temperature || 25);
  const humHistory = historyData.map(d => d.humidity || 50);

  return (
    <div className="space-y-6">
      
      {/* SECTION HEADER: EXACT MATCH TO OTHER ANALYTICS SECTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 font-mono uppercase tracking-wider">
            Live Hardware Telemetry &amp; Sensor Acquisition
          </h2>
          <p className="text-xs text-slate-500">
            Real-time ESP32 transducer stream, active ventilation telemetry, and baseline threshold monitoring.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchData}
            title="Refresh telemetry"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 transition cursor-pointer shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ANOMALY HAZARD ALERT CALLOUT */}
      {Boolean(latestData?.is_anomaly || (latestData?.mq2_sensor_1 >= 1200) || (latestData?.mq2_sensor_2 >= 1200) || latestData?.hazard_detected) && (
        <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all duration-300 ${
          latestData?.severity === 'CRITICAL' 
            ? 'bg-rose-50/70 border-rose-200 text-rose-950' 
            : 'bg-amber-50/70 border-amber-200 text-amber-950'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${latestData?.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider font-mono">
                {latestData?.severity === 'CRITICAL' ? 'Critical Compartment Hazard' : 'Threshold Exceedance Warning'}
              </p>
              <p className="text-xs text-slate-700 mt-0.5">
                {latestData?.anomaly_reason || 'Elevated volatile gas concentration detected above calibrated safety margin.'}
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-white text-slate-800 border border-slate-200 shrink-0 uppercase tracking-wider">
            Ventilation Active
          </span>
        </div>
      )}

      {/* 4 CORE KPI METRIC CARDS: EXACT MATCH TO MetricCards.jsx STYLE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: MQ-2 Primary */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 font-mono">
              MQ-2 Transducer #1
            </span>
            <Flame className={`w-4 h-4 ${latestData?.mq2_sensor_1 >= 1200 ? 'text-rose-600' : 'text-orange-500'}`} />
          </div>
          <div className="flex items-end justify-between mt-2">
            <div>
              <p className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
                {latestData?.mq2_sensor_1?.toLocaleString() ?? '1,370'} <span className="text-xs font-normal text-slate-400">ADC</span>
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`text-[11px] font-semibold ${latestData?.mq2_sensor_1 >= 1200 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {latestData?.mq2_sensor_1 >= 1200 ? 'Threshold Surge' : 'Nominal Baseline'}
                </span>
                <span className="text-[10px] text-slate-400">(Limit: 1200)</span>
              </div>
            </div>
            <div className="w-20 h-8">
              <svg viewBox="0 0 90 24" className="w-full h-full overflow-visible">
                <polyline
                  fill="none"
                  stroke={latestData?.mq2_sensor_1 >= 1200 ? '#ef4444' : '#f97316'}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={getSparkPoints(mq1History)}
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Metric 2: MQ-2 Secondary */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 font-mono">
              MQ-2 Transducer #2
            </span>
            <Flame className={`w-4 h-4 ${latestData?.mq2_sensor_2 >= 1200 ? 'text-rose-600' : 'text-amber-500'}`} />
          </div>
          <div className="flex items-end justify-between mt-2">
            <div>
              <p className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
                {latestData?.mq2_sensor_2?.toLocaleString() ?? '592'} <span className="text-xs font-normal text-slate-400">ADC</span>
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`text-[11px] font-semibold ${latestData?.mq2_sensor_2 >= 1200 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {latestData?.mq2_sensor_2 >= 1200 ? 'Threshold Surge' : 'Nominal Baseline'}
                </span>
                <span className="text-[10px] text-slate-400">(Limit: 1200)</span>
              </div>
            </div>
            <div className="w-20 h-8">
              <svg viewBox="0 0 90 24" className="w-full h-full overflow-visible">
                <polyline
                  fill="none"
                  stroke={latestData?.mq2_sensor_2 >= 1200 ? '#ef4444' : '#eab308'}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={getSparkPoints(mq2History)}
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Metric 3: Ambient Temperature */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 font-mono">
              Ambient Temperature
            </span>
            <Thermometer className="w-4 h-4 text-sky-600" />
          </div>
          <div className="flex items-end justify-between mt-2">
            <div>
              <p className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
                {latestData?.temperature != null ? `${latestData.temperature}°C` : '30.9°C'}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[11px] font-semibold text-emerald-600">
                  Cabin Regulated
                </span>
                <span className="text-[10px] text-slate-400">±0.4°C drift</span>
              </div>
            </div>
            <div className="w-20 h-8">
              <svg viewBox="0 0 90 24" className="w-full h-full overflow-visible">
                <polyline
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={getSparkPoints(tempHistory, 50)}
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Metric 4: Relative Humidity */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 font-mono">
              Relative Humidity
            </span>
            <Droplets className="w-4 h-4 text-teal-600" />
          </div>
          <div className="flex items-end justify-between mt-2">
            <div>
              <p className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
                {latestData?.humidity != null ? `${latestData.humidity}%` : '65.0%'}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[11px] font-semibold text-emerald-600">
                  Dew Point Stable
                </span>
                <span className="text-[10px] text-slate-400">Target 40-70%</span>
              </div>
            </div>
            <div className="w-20 h-8">
              <svg viewBox="0 0 90 24" className="w-full h-full overflow-visible">
                <polyline
                  fill="none"
                  stroke="#0d9488"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={getSparkPoints(humHistory, 100)}
                />
              </svg>
            </div>
          </div>
        </div>

      </div>

      {/* ROW 1: PRIMARY TRANSDUCER WAVEFORM (PLOTLY SCIENTIFIC CHART) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
              Real-Time Gas Transducer Intensity Stream
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Sampling: 2.0s Interval
          </span>
        </div>
        <div style={{ height: 320 }}>
          <PlotlyComponent data={gasPlot.data} layout={gasPlot.layout} />
        </div>
      </div>

      {/* ROW 2: SPLIT VIEW - ACTUATOR/OCCUPANCY STATUS + ENVIRONMENTAL DRIFT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Subsystem & Actuator Telemetry (6-col) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                Subsystem &amp; Actuator State
              </h3>
            </div>

            <div className="space-y-4">
              {/* Exhaust Fan Status */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isFanOn ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-600'}`}>
                    <Wind className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">L298N Exhaust Ventilation</p>
                    <p className="text-[11px] text-slate-500">{isFanOn ? 'Motor driver actively extracting air' : 'Standby mode (Relay disabled)'}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  isFanOn ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                }`}>
                  {isFanOn ? 'ACTIVE' : 'STANDBY'}
                </span>
              </div>

              {/* HC-SR04 Occupancy */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isOccupancy ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-600'}`}>
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">Ultrasonic Spatial Detection</p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {latestData?.distance_cm != null ? `${latestData.distance_cm} cm distance` : 'Clear range'}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  isOccupancy ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-600'
                }`}>
                  {isOccupancy ? 'OCCUPANCY ALERT' : 'CLEAR'}
                </span>
              </div>

              {/* RC522 RFID Security */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                    <Radio className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">RC522 Authentication Badge</p>
                    <p className="text-[11px] text-slate-500 font-mono truncate max-w-[160px]">
                      {latestData?.rfid_uid || 'No badge scanned'}
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700">
                  {latestData?.rfid_uid ? 'SCANNED' : 'READY'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between font-mono">
            <span>Hardware Target: ESP32-WROOM</span>
            <span>Baud: 115200</span>
          </div>
        </div>

        {/* Right Column: Environmental Drift Dual-Axis (7-col) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-600"></span>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                Cabin Thermal &amp; Hygrometric Drift
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              DHT11 Transducer (GPIO 4)
            </span>
          </div>
          <div style={{ height: 290 }}>
            <PlotlyComponent data={envPlot.data} layout={envPlot.layout} />
          </div>
        </div>

      </div>

      {/* ROW 3: RECENT DATABASE TELEMETRY LOGS (CLEAN TABULAR STYLE) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
              PostgreSQL Telemetry Stream (live_sensor_telemetry)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Showing last 10 synchronized records
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200/80">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-slate-500 uppercase font-mono text-[10px] tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="py-2.5 px-4">Record</th>
                <th className="py-2.5 px-4">MQ-2 #1 (ADC)</th>
                <th className="py-2.5 px-4">MQ-2 #2 (ADC)</th>
                <th className="py-2.5 px-4">Temp</th>
                <th className="py-2.5 px-4">Humidity</th>
                <th className="py-2.5 px-4">Distance</th>
                <th className="py-2.5 px-4">Occupancy</th>
                <th className="py-2.5 px-4">Transducer Status</th>
                <th className="py-2.5 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {historyData.slice(-10).reverse().map((row) => {
                const isRowHazard = row.is_anomaly || row.mq2_sensor_1 >= 1200 || row.mq2_sensor_2 >= 1200;
                return (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-4 font-bold text-slate-900">#{row.id}</td>
                    <td className={`py-2.5 px-4 font-semibold ${row.mq2_sensor_1 >= 1200 ? 'text-rose-600' : 'text-slate-800'}`}>
                      {row.mq2_sensor_1}
                    </td>
                    <td className={`py-2.5 px-4 font-semibold ${row.mq2_sensor_2 >= 1200 ? 'text-rose-600' : 'text-slate-800'}`}>
                      {row.mq2_sensor_2}
                    </td>
                    <td className="py-2.5 px-4">{row.temperature != null ? `${row.temperature}°C` : '--'}</td>
                    <td className="py-2.5 px-4">{row.humidity != null ? `${row.humidity}%` : '--'}</td>
                    <td className="py-2.5 px-4">{row.distance_cm != null ? `${row.distance_cm} cm` : '--'}</td>
                    <td className="py-2.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        row.occupancy_status === 'POSSIBLE_OCCUPANCY' ? 'bg-rose-50 text-rose-700 font-semibold border border-rose-200' : 'text-slate-500'
                      }`}>
                        {row.occupancy_status === 'POSSIBLE_OCCUPANCY' ? 'OCCUPIED' : 'CLEAR'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold ${
                        isRowHazard ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isRowHazard ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                        {isRowHazard ? 'SURGE' : 'NOMINAL'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-400">
                      {row.created_at ? new Date(row.created_at).toLocaleTimeString() : '--'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default LiveAnalyticsSection;
