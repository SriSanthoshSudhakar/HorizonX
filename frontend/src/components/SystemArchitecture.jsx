import React, { useState, useEffect } from 'react';

const SystemArchitecture = () => {
  const [activeSimulation, setActiveSimulation] = useState(null); // 'normal' | 'hazard' | null
  const [selectedNode, setSelectedNode] = useState(null);
  const [hatchState, setHatchState] = useState('open'); // 'open' | 'closed'
  const [themeMode, setThemeMode] = useState('light'); // 'light' matches the uploaded diagram 1:1, 'dark' matches dark theme

  // Handle simulation flow
  useEffect(() => {
    let timer;
    if (activeSimulation === 'hazard') {
      timer = setTimeout(() => {
        setActiveSimulation(null);
        setHatchState('open');
      }, 7000);
    }
    return () => clearTimeout(timer);
  }, [activeSimulation]);

  const handleSimulate = (type) => {
    if (activeSimulation === type) {
      setActiveSimulation(null);
      setHatchState('open');
    } else {
      setActiveSimulation(type);
      if (type === 'hazard') {
        setHatchState('closed');
      } else {
        setHatchState('open');
      }
    }
  };

  return (
    <div className="w-full flex flex-col items-center select-none">
      
      {/* Top Controls Bar */}
      <div className="w-full max-w-7xl flex flex-wrap items-center justify-between gap-4 mb-4 px-2">
        <div className="flex items-center gap-3">
          <span className={`text-xs uppercase tracking-widest font-bold ${themeMode === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>View Mode:</span>
          <div className={`inline-flex rounded-lg shadow-2xs border p-0.5 ${themeMode === 'light' ? 'border-slate-200 bg-slate-100' : 'border-gray-700 bg-gray-900'}`}>
            <button
              onClick={() => setThemeMode('light')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                themeMode === 'light' ? 'bg-white text-slate-900 shadow-xs' : 'text-gray-400 hover:text-white'
              }`}
            >
              Diagram Blueprint (Original)
            </button>
            <button
              onClick={() => setThemeMode('dark')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                themeMode === 'dark' ? 'bg-gray-800 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Dark Avionics HUD
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSimulate('normal')}
            className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all flex items-center gap-2 cursor-pointer ${
              activeSimulation === 'normal'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                : themeMode === 'light'
                ? 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-2xs'
                : 'bg-gray-900 text-gray-300 border-gray-700 hover:border-gray-500 hover:text-white'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${activeSimulation === 'normal' ? 'bg-white animate-ping' : 'bg-emerald-500'}`}></span>
            {activeSimulation === 'normal' ? 'Streaming Live Data...' : 'Simulate Telemetry Flow'}
          </button>

          <button
            onClick={() => handleSimulate('hazard')}
            className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all flex items-center gap-2 cursor-pointer ${
              activeSimulation === 'hazard'
                ? 'bg-rose-600 text-white border-rose-500 shadow-md animate-pulse'
                : themeMode === 'light'
                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 hover:border-rose-300 shadow-2xs'
                : 'bg-gray-900 text-rose-400 border-rose-900/80 hover:bg-rose-950 hover:border-rose-600'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${activeSimulation === 'hazard' ? 'bg-white animate-ping' : 'bg-rose-500'}`}></span>
            {activeSimulation === 'hazard' ? 'Hazard Active (Hatch Sealed)' : 'Trigger Hazard Event'}
          </button>

          <button
            onClick={() => setHatchState(hatchState === 'open' ? 'closed' : 'open')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
              themeMode === 'light'
                ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs'
                : 'border-gray-700 bg-gray-900 text-gray-300 hover:text-white'
            }`}
          >
            Manual Hatch: <span className={hatchState === 'closed' ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>{hatchState.toUpperCase()}</span>
          </button>
        </div>
      </div>

      {/* Main Diagram Container */}
      <div 
        className={`w-full max-w-7xl rounded-xl border p-4 md:p-6 transition-colors duration-300 shadow-2xl relative overflow-x-auto ${
          themeMode === 'light' 
            ? 'bg-white border-gray-300 text-gray-800' 
            : 'bg-[#0c1017] border-gray-800 text-gray-100'
        }`}
      >
        
        {/* Animated Connecting SVG Arrows Layer */}
        <div className="min-w-[1180px] relative">
          
          {/* Top 6 Main Architecture Columns */}
          <div className="grid grid-cols-12 gap-3 items-stretch">
            
            {/* ============================================================== */}
            {/* 1. SENSOR LAYER (HARDWARE) - 2 Columns wide */}
            {/* ============================================================== */}
            <div 
              className={`col-span-2 rounded-2xl p-3 flex flex-col border transition-all relative ${
                themeMode === 'light' 
                  ? 'bg-[#ffe4e9] border-[#f43f5e]' 
                  : 'bg-[#2a0e17] border-[#fb7185]'
              }`}
            >
              <div className="bg-[#f43f5e] text-white py-1.5 px-2 rounded-lg text-center font-bold text-xs tracking-wide mb-3 shadow-sm">
                1. Sensor Layer (Hardware)
              </div>

              <div className="flex flex-col gap-2 flex-grow justify-between">
                {[
                  { name: "Gas Sensor", alert: activeSimulation === 'hazard' },
                  { name: "Temperature Sensor", alert: false },
                  { name: "Pressure Sensor", alert: false },
                  { name: "Air Quality Sensor", alert: activeSimulation === 'hazard' },
                  { name: "Smoke/Particle Sensor", alert: activeSimulation === 'hazard' },
                  { name: "Camera (Existing Spacecraft's Camera)", alert: false },
                  { name: "Thermal Camera (Existing Spacecraft's Camera)", alert: activeSimulation === 'hazard' },
                ].map((sensor, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedNode({
                      title: sensor.name,
                      category: "Hardware Sensor Array",
                      desc: "Multi-spectral environmental sensor mounted inside the spacecraft compartment. Feeds analog & digital telemetry directly to the embedded controller over hardware serial buses.",
                      rate: "100Hz Real-time sampling",
                      bus: "I2C / SPI / CAN-Bus"
                    })}
                    className={`cursor-pointer rounded-xl px-2.5 py-2 text-center text-xs font-semibold transition-all duration-200 border shadow-sm relative group flex items-center justify-center ${
                      sensor.alert
                        ? 'bg-red-500 text-white border-red-600 animate-pulse scale-[1.02]'
                        : themeMode === 'light'
                          ? 'bg-[#ffebee] hover:bg-white text-gray-800 border-[#f8bbd0]'
                          : 'bg-[#401222] hover:bg-[#52172b] text-rose-100 border-[#881337]'
                    }`}
                  >
                    <span className="text-[11px] leading-tight">{sensor.name}</span>

                    {/* Right-pointing connector arrow stub */}
                    <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-3 flex items-center justify-center">
                      <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                        <path d="M1 5H10M10 5L6 1M10 5L6 9" stroke={themeMode === 'light' ? "#333333" : "#e2e8f0"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ============================================================== */}
            {/* 2. EMBEDDED CONTROLLER - 2 Columns wide */}
            {/* ============================================================== */}
            <div 
              className={`col-span-2 rounded-2xl p-3 flex flex-col border transition-all relative ${
                themeMode === 'light' 
                  ? 'bg-[#e0f2fe] border-[#0284c7]' 
                  : 'bg-[#082239] border-[#38bdf8]'
              }`}
            >
              <div className="bg-[#0284c7] text-white py-1.5 px-2 rounded-lg text-center font-bold text-xs tracking-wide mb-2 shadow-sm">
                2. Embedded Controller
              </div>

              {/* Realistic ESP32 Vector Board Illustration */}
              <div className="flex items-center justify-center py-1">
                <div className="w-20 h-10 bg-gray-900 border-2 border-gray-700 rounded-sm relative flex items-center justify-center shadow-md">
                  {/* USB port */}
                  <div className="absolute -top-1 w-4 h-1.5 bg-gray-400 rounded-xs"></div>
                  {/* Metal Shield / Chip */}
                  <div className="w-12 h-6 bg-gray-300 border border-gray-400 rounded-xs flex flex-col items-center justify-center p-0.5">
                    <span className="text-[6px] font-mono font-bold text-gray-800 tracking-tighter">ESP32-S3</span>
                    <span className="text-[5px] text-gray-600">Dual-Core</span>
                  </div>
                  {/* Pins representation */}
                  <div className="absolute -left-1 top-1 bottom-1 flex flex-col justify-between">
                    {[...Array(5)].map((_, i) => <div key={i} className="w-1 h-0.5 bg-yellow-400"></div>)}
                  </div>
                  <div className="absolute -right-1 top-1 bottom-1 flex flex-col justify-between">
                    {[...Array(5)].map((_, i) => <div key={i} className="w-1 h-0.5 bg-yellow-400"></div>)}
                  </div>
                  {/* Blinking power LED */}
                  <div className={`absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full ${activeSimulation ? 'bg-emerald-400 animate-ping' : 'bg-emerald-500'}`}></div>
                </div>
              </div>

              {/* Downward Sequential Process Pills */}
              <div className="flex flex-col gap-1.5 flex-grow justify-between mt-1">
                {[
                  "Receive Sensor Readings",
                  "Sensor Fusion & Filtering",
                  "Hazard Detection",
                  "Compartment Identification",
                  "Hatch Identification",
                  "Safety Validation",
                  "Send Signal to Hatch-Control"
                ].map((step, i) => (
                  <React.Fragment key={i}>
                    <div 
                      onClick={() => setSelectedNode({
                        title: step,
                        category: "Embedded Microcontroller Routine",
                        desc: "Real-time FreeRTOS task executing on the ESP32 microcontroller with deterministic sub-millisecond safety guarantees.",
                        latency: "< 12 ms loop cycle",
                        stack: "C / C++ Embedded Firmware"
                      })}
                      className={`cursor-pointer rounded-xl px-2 py-1.5 text-center text-xs font-semibold transition-all duration-150 border shadow-sm ${
                        activeSimulation === 'hazard' && (step.includes("Hazard") || step.includes("Send"))
                          ? 'bg-cyan-500 text-white border-cyan-600 font-bold scale-[1.02] shadow-md'
                          : themeMode === 'light'
                            ? 'bg-[#e1f5fe] hover:bg-white text-gray-800 border-[#b3e5fc]'
                            : 'bg-[#0e3b5e] hover:bg-[#154f7d] text-cyan-100 border-[#0284c7]'
                      }`}
                    >
                      <span className="text-[11px] leading-tight">{step}</span>
                    </div>

                    {/* Downward connecting arrow between steps */}
                    {i < 6 && (
                      <div className="flex justify-center -my-0.5">
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                          <path d="M4 1V7M4 7L1 4M4 7L7 4" stroke={themeMode === 'light' ? "#0284c7" : "#38bdf8"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Data Outflow Indicator Labels */}
              <div className="mt-2 text-[9px] font-semibold text-center text-sky-700 dark:text-sky-300">
                <span>Sensor Data (Real time + Historical) →</span>
              </div>
            </div>

            {/* ============================================================== */}
            {/* 3. DATA STORAGE LAYER - 2 Columns wide */}
            {/* ============================================================== */}
            <div 
              className={`col-span-2 rounded-2xl p-3 flex flex-col border transition-all relative ${
                themeMode === 'light' 
                  ? 'bg-[#dcfce7] border-[#16a34a]' 
                  : 'bg-[#072714] border-[#4ade80]'
              }`}
            >
              <div className="bg-[#16a34a] text-white py-1.5 px-2 rounded-lg text-center font-bold text-xs tracking-wide mb-2 shadow-sm">
                3. Data Storage Layer
              </div>

              {/* PostgreSQL Elephant Logo Representation */}
              <div 
                onClick={() => setSelectedNode({
                  title: "PostgreSQL Telemetry DB",
                  category: "Time-Series Relational Storage",
                  desc: "Stores partitioned records of gas sensor levels, incident markers, and hatch operational state logs.",
                  stack: "PostgreSQL 16 with TimescaleDB extension",
                  metrics: "13,910 samples loaded"
                })}
                className="cursor-pointer flex flex-col items-center justify-center p-2 rounded-xl transition-transform hover:scale-[1.02]"
              >
                {/* SVG PostgreSQL Elephant */}
                <svg className="w-12 h-12" viewBox="0 0 128 128" fill="none">
                  <path d="M64 12C36.4 12 14 34.4 14 62c0 14.2 6 27.1 15.6 36.2.8.8 1.8 1.5 2.8 2.2V116l14.4-7.2c5.4 1.8 11.2 2.8 17.2 2.8 27.6 0 50-22.4 50-50S89.6 12 64 12z" fill="#336791"/>
                  <path d="M80 52c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z" fill="#ffffff"/>
                  <path d="M48 66c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z" fill="#ffffff"/>
                  <path d="M48 60c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" fill="#336791"/>
                  <path d="M80 72c-5.5 0-10-4.5-10-10 0-1.1.9-2 2-2s2 .9 2 2c0 3.3 2.7 6 6 6s6-2.7 6-6c0-1.1.9-2 2-2s2 .9 2 2c0 5.5-4.5 10-10 10z" fill="#ffffff"/>
                </svg>
                <span className="font-bold text-xs mt-1 text-[#166534] dark:text-emerald-200">PostgreSQL (Database)</span>
              </div>

              {/* "Stores:" container matching diagram */}
              <div 
                className={`rounded-xl p-3 border mt-1 flex-grow ${
                  themeMode === 'light' 
                    ? 'bg-white border-[#86efac]' 
                    : 'bg-[#0f3d1f] border-[#22c55e]/40'
                }`}
              >
                <div className="font-bold text-xs text-[#166534] dark:text-emerald-300 mb-1.5">
                  Stores:
                </div>
                <ul className="text-xs space-y-1.5 text-gray-700 dark:text-emerald-100 font-medium">
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>Sensor Readings</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>Timestamp</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>Compartment Name</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>Sensor Status</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>Hazard Events</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>Thermal Metadata</span>
                  </li>
                </ul>
              </div>

              <div className="mt-2 text-[9px] font-semibold text-center text-emerald-800 dark:text-emerald-300">
                <span>Historical Data (Batch Processing) →</span>
              </div>
            </div>

            {/* ============================================================== */}
            {/* 4. SPARK ANALYTICS LAYER (PYSPARK) - 2 Columns wide */}
            {/* ============================================================== */}
            <div 
              className={`col-span-2 rounded-2xl p-3 flex flex-col border transition-all relative ${
                themeMode === 'light' 
                  ? 'bg-[#fef9c3] border-[#ca8a04]' 
                  : 'bg-[#292205] border-[#facc15]'
              }`}
            >
              <div className="bg-[#ca8a04] text-white py-1.5 px-2 rounded-lg text-center font-bold text-xs tracking-wide mb-2 shadow-sm">
                4. Spark Analytics Layer (PySpark)
              </div>

              {/* Apache Spark Logo */}
              <div 
                onClick={() => setSelectedNode({
                  title: "Apache Spark (PySpark)",
                  category: "Distributed Big Data Processing",
                  desc: "Batch ingestion engine that converts sensor .dat files, calculates multi-feature correlation matrices, and extracts feature vectors for ML models.",
                  stack: "PySpark 3.5 & Spark SQL",
                  path: "C:\\Horizon\\analytics\\spark_job.py"
                })}
                className="cursor-pointer flex items-center justify-center gap-1.5 py-2 transition-transform hover:scale-[1.02]"
              >
                {/* Spark Flame SVG */}
                <svg className="w-8 h-8" viewBox="0 0 100 100" fill="none">
                  <path d="M48 10C50 24 35 34 32 46c-3 12 4 24 16 26-10-8-12-20-4-28 6-6 12-14 10-24 10 10 18 24 16 38 8-8 12-18 10-28 12 12 16 30 8 44-8 14-26 22-42 16C28 84 18 68 22 52c4-16 16-28 26-42z" fill="#E25A1C"/>
                </svg>
                <span className="font-extrabold text-sm tracking-tight text-gray-900 dark:text-amber-200">
                  Spark
                </span>
              </div>

              {/* 3 Step Process Pills */}
              <div className="flex flex-col gap-2 flex-grow justify-around mt-1">
                {[
                  { title: "Data Loading", sub: "(From PostgreSQL / Files)" },
                  { title: "Data Processing & Cleaning", sub: "(Spark DataFrame)" },
                  { title: "Feature Engineering", sub: "(Spark SQL)" },
                ].map((step, i) => (
                  <React.Fragment key={i}>
                    <div 
                      onClick={() => setSelectedNode({
                        title: step.title,
                        category: "Spark Transformations & Actions",
                        desc: `Step ${i + 1} of the PySpark pipeline: ${step.sub}. Executes distributed batch aggregation.`,
                        stack: "PySpark DataFrame API"
                      })}
                      className={`cursor-pointer rounded-xl p-2.5 text-center transition-all duration-150 border shadow-sm ${
                        activeSimulation
                          ? 'bg-amber-400 text-gray-900 border-amber-500 font-bold'
                          : themeMode === 'light'
                            ? 'bg-[#fffde7] hover:bg-white text-gray-800 border-[#fef08a]'
                            : 'bg-[#4a3d0a] hover:bg-[#5e4d0d] text-amber-100 border-[#ca8a04]'
                      }`}
                    >
                      <div className="text-xs font-bold leading-tight">{step.title}</div>
                      <div className="text-[10px] opacity-80 mt-0.5">{step.sub}</div>
                    </div>

                    {/* Downward connecting arrow */}
                    {i < 2 && (
                      <div className="flex justify-center -my-0.5">
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                          <path d="M4 1V7M4 7L1 4M4 7L7 4" stroke={themeMode === 'light' ? "#ca8a04" : "#facc15"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>

              <div className="mt-2 text-[9px] font-semibold text-center text-amber-800 dark:text-amber-300">
                <span>Processed Results →</span>
              </div>
            </div>

            {/* ============================================================== */}
            {/* 5. BACKEND SERVER (FASTAPI + PYTHON) - 2 Columns wide */}
            {/* ============================================================== */}
            <div 
              className={`col-span-2 rounded-2xl p-3 flex flex-col border transition-all relative ${
                themeMode === 'light' 
                  ? 'bg-[#ede9fe] border-[#7c3aed]' 
                  : 'bg-[#1e1038] border-[#a78bfa]'
              }`}
            >
              <div className="bg-[#7c3aed] text-white py-1.5 px-2 rounded-lg text-center font-bold text-xs tracking-wide mb-2 shadow-sm">
                5. Backend Server (FastAPI + Python)
              </div>

              {/* FastAPI + Python Logos Side-by-Side */}
              <div 
                onClick={() => setSelectedNode({
                  title: "FastAPI + Python Engine",
                  category: "Application & Inference Server",
                  desc: "Asynchronous backend that exposes analytics endpoints, serves Plotly figure data, and runs machine learning inference.",
                  stack: "FastAPI + Uvicorn + PyTorch",
                  path: "C:\\Horizon\\backend\\main.py"
                })}
                className="cursor-pointer flex items-center justify-center gap-3 py-1.5 transition-transform hover:scale-[1.02]"
              >
                {/* FastAPI Logo */}
                <div className="flex items-center gap-1">
                  <svg className="w-5 h-5" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="48" fill="#05998B"/>
                    <path d="M48 20L25 55h22l-5 25 33-38H52l6-22z" fill="#ffffff"/>
                  </svg>
                  <span className="font-bold text-[11px] text-teal-800 dark:text-teal-300">FastAPI</span>
                </div>

                {/* Python Logo */}
                <svg className="w-5 h-5" viewBox="0 0 110 110">
                  <path d="M54.5 10c-24 0-22.5 10.4-22.5 10.4l.1 10.8h23v3.3H22.4S10 33 10 57.2c0 24.2 10.8 23.3 10.8 23.3h6.4v-9.1s-.4-10.8 10.6-10.8h22.8s10.2-.2 10.2-9.9V20.1s1.5-10.1-17.3-10.1zm-12.7 7.2c2.2 0 4 1.8 4 4s-1.8 4-4 4-4-1.8-4-4 1.8-4 4-4z" fill="#3776AB"/>
                  <path d="M55.5 100c24 0 22.5-10.4 22.5-10.4l-.1-10.8h-23v-3.3h32.7S100 77 100 52.8c0-24.2-10.8-23.3-10.8-23.3h-6.4v9.1s.4 10.8-10.6 10.8H49.4s-10.2.2-10.2 9.9v30.6s-1.5 10.1 17.3 10.1zm12.7-7.2c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z" fill="#FFD43B"/>
                </svg>
              </div>

              {/* 5 Process Step Pills */}
              <div className="flex flex-col gap-1 flex-grow justify-between mt-1">
                {[
                  "Receive Processed Data (from Spark)",
                  "Machine Learning (PyTorch)",
                  "Anomaly Detection",
                  "Hazard Analysis & Prediction",
                  "API Endpoints (Real-time Data, Results, Alerts)"
                ].map((step, i) => (
                  <React.Fragment key={i}>
                    <div 
                      onClick={() => setSelectedNode({
                        title: step,
                        category: "Backend Computation Flow",
                        desc: `FastAPI pipeline: ${step}. Provides async endpoints for the frontend visualization engine.`,
                        endpoint: "/api/analytics/*"
                      })}
                      className={`cursor-pointer rounded-xl px-2 py-1 text-center text-xs font-semibold transition-all duration-150 border shadow-sm ${
                        activeSimulation === 'hazard' && (step.includes("Anomaly") || step.includes("Hazard"))
                          ? 'bg-purple-600 text-white border-purple-700 font-bold scale-[1.02]'
                          : themeMode === 'light'
                            ? 'bg-[#f3e8ff] hover:bg-white text-gray-800 border-[#d8b4fe]'
                            : 'bg-[#3b1968] hover:bg-[#4c2185] text-purple-100 border-[#7c3aed]'
                      }`}
                    >
                      <span className="text-[10.5px] leading-tight">{step}</span>
                    </div>

                    {/* Downward connecting arrow */}
                    {i < 4 && (
                      <div className="flex justify-center -my-0.5">
                        <svg width="6" height="6" viewBox="0 0 8 8" fill="none">
                          <path d="M4 1V7M4 7L1 4M4 7L7 4" stroke={themeMode === 'light' ? "#7c3aed" : "#a78bfa"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>

              <div className="mt-2 text-[9px] font-semibold text-center text-purple-800 dark:text-purple-300">
                <span>API Response →</span>
              </div>
            </div>

            {/* ============================================================== */}
            {/* 7. WEB APPLICATION (REACT) - 2 Columns wide */}
            {/* ============================================================== */}
            <div 
              className={`col-span-2 rounded-2xl p-3 flex flex-col border transition-all relative ${
                themeMode === 'light' 
                  ? 'bg-[#ccfbf1] border-[#0d9488]' 
                  : 'bg-[#062c26] border-[#2dd4bf]'
              }`}
            >
              <div className="bg-[#0d9488] text-white py-1.5 px-2 rounded-lg text-center font-bold text-xs tracking-wide mb-2 shadow-sm">
                7. Web Application (React)
              </div>

              {/* React Atom Logo */}
              <div 
                onClick={() => setSelectedNode({
                  title: "React Web Dashboard",
                  category: "Frontend UI & Plotly Visualization",
                  desc: "Single page mission-control dashboard. Renders interactive Plotly 3D/2D graphs, real-time alert banners, and flight simulations.",
                  stack: "React 19 + Tailwind CSS + Plotly.js",
                  path: "C:\\Horizon\\frontend\\src\\App.jsx"
                })}
                className="cursor-pointer flex items-center justify-center gap-2 py-1.5 transition-transform hover:scale-[1.02]"
              >
                {/* SVG React Atom with smooth rotation */}
                <svg className="w-7 h-7 animate-[spin_10s_linear_infinite]" viewBox="-11.5 -10.23174 23 20.46348">
                  <circle cx="0" cy="0" r="2.05" fill="#00d8ff"/>
                  <g stroke="#00d8ff" strokeWidth="1" fill="none">
                    <ellipse rx="11" ry="4.2"/>
                    <ellipse rx="11" ry="4.2" transform="rotate(60)"/>
                    <ellipse rx="11" ry="4.2" transform="rotate(120)"/>
                  </g>
                </svg>
                <span className="font-extrabold text-sm tracking-tight text-gray-900 dark:text-teal-200">
                  React
                </span>
              </div>

              {/* 5 Features Pills */}
              <div className="flex flex-col gap-2 flex-grow justify-around mt-1">
                {[
                  { name: "Real-time Monitoring", alert: false },
                  { name: "Alert (Hazard Events)", alert: activeSimulation === 'hazard' },
                  { name: "Historical Analytics (Processed Data)", alert: false },
                  { name: "Compartment & Hatch Status", alert: false },
                  { name: "User Access & Control (Authorized Operations)", alert: false },
                ].map((item, i) => (
                  <div 
                    key={i}
                    onClick={() => setSelectedNode({
                      title: item.name,
                      category: "React User Interface Module",
                      desc: `Frontend interactive component for ${item.name}. Displays dynamic telemetry and controls.`,
                      route: "/analytics, /simulation, /incidents"
                    })}
                    className={`cursor-pointer rounded-xl px-2 py-1.5 text-center text-xs font-semibold transition-all duration-150 border shadow-sm ${
                      item.alert
                        ? 'bg-rose-500 text-white border-rose-600 font-bold animate-bounce'
                        : themeMode === 'light'
                          ? 'bg-[#e0f2f1] hover:bg-white text-gray-800 border-[#99f6e4]'
                          : 'bg-[#104a41] hover:bg-[#165c52] text-teal-100 border-[#0d9488]'
                    }`}
                  >
                    <span className="text-[11px] leading-tight">{item.name}</span>
                  </div>
                ))}
              </div>

              <div className="mt-2 text-[9px] font-semibold text-center text-teal-800 dark:text-teal-300">
                <span>↓ Operator Control</span>
              </div>
            </div>

          </div>

          {/* ============================================================== */}
          {/* BOTTOM ROW: 6. Hatch-Control Interface & Authorized Person */}
          {/* ============================================================== */}
          <div className="grid grid-cols-12 gap-3 mt-4 items-center">
            
            {/* Left Spacer / Immediate Hazard Link Arrow from Embedded Controller */}
            <div className="col-span-3 flex flex-col items-center justify-center px-4 py-2 rounded-xl border border-dashed border-red-400/80 bg-red-500/5">
              <div className="flex items-center gap-2 text-xs font-bold text-red-600 dark:text-red-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
                <span>Hazard Event (Immediate)</span>
              </div>
              <span className="text-[10px] text-gray-500 text-center mt-0.5">
                Hardware bypass line directly from Controller to Hatch Interface
              </span>
            </div>

            {/* 6. HATCH-CONTROL INTERFACE (EXISTING SPACECRAFT SYSTEM) - 6 Columns */}
            <div 
              className={`col-span-6 rounded-2xl p-3.5 flex flex-col border transition-all relative ${
                themeMode === 'light' 
                  ? 'bg-[#fee2e2] border-[#ef4444]' 
                  : 'bg-[#350d0d] border-[#f87171]'
              }`}
            >
              <div className="bg-[#ef4444] text-white py-1.5 px-3 rounded-lg text-center font-bold text-xs tracking-wide mb-3 shadow-sm flex items-center justify-between">
                <span>6. Hatch-Control Interface (Existing Spacecraft System)</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                  hatchState === 'closed' ? 'bg-black text-rose-300' : 'bg-white text-gray-900'
                }`}>
                  {hatchState === 'closed' ? 'LOCKED / SEALED' : 'OPEN / NORMAL'}
                </span>
              </div>

              {/* 3 Horizontal Sequence Pills */}
              <div className="grid grid-cols-3 gap-2 items-center mb-3">
                {[
                  "Receive Hazard Signal",
                  "Validate Signal (Safety Checks)",
                  "Send Command to Corresponding Hatch"
                ].map((step, i) => (
                  <React.Fragment key={i}>
                    <div 
                      onClick={() => setSelectedNode({
                        title: step,
                        category: "Hatch Solenoid Actuator Protocol",
                        desc: "Spacecraft life-support pressure bulkhead command cycle. Verifies triple-redundant safety checks before triggering pneumatic airtight seals.",
                        actuator: "Pneumatic Bulkhead Relays"
                      })}
                      className={`cursor-pointer rounded-xl px-2 py-2 text-center text-xs font-semibold border shadow-sm transition-all ${
                        activeSimulation === 'hazard'
                          ? 'bg-red-500 text-white border-red-600 font-bold'
                          : themeMode === 'light'
                            ? 'bg-[#ffebee] hover:bg-white text-gray-800 border-[#fecaca]'
                            : 'bg-[#501313] hover:bg-[#681919] text-rose-100 border-[#ef4444]'
                      }`}
                    >
                      <span className="text-[11px] leading-tight">{step}</span>
                    </div>
                  </React.Fragment>
                ))}
              </div>

              {/* Final Downward Pill: Isolated Affected Compartment */}
              <div className="flex flex-col items-center">
                <svg width="10" height="12" viewBox="0 0 10 12" fill="none" className="my-0.5">
                  <path d="M5 1V11M5 11L1 7M5 11L9 7" stroke={themeMode === 'light' ? "#ef4444" : "#f87171"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>

                <div 
                  onClick={() => setHatchState(hatchState === 'open' ? 'closed' : 'open')}
                  className={`cursor-pointer rounded-xl px-4 py-2 text-center text-xs font-bold border shadow-sm transition-all flex items-center justify-center gap-2 w-full max-w-sm ${
                    hatchState === 'closed'
                      ? 'bg-red-600 text-white border-red-700 shadow-md animate-pulse'
                      : themeMode === 'light'
                        ? 'bg-[#fecaca] hover:bg-[#fee2e2] text-red-900 border-red-400'
                        : 'bg-[#681919] hover:bg-[#7e1e1e] text-red-100 border-red-500'
                  }`}
                >
                  <span>Isolated Affected Compartment (Close Hatch)</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-black/20 rounded">
                    {hatchState === 'closed' ? '🔒 SEALED' : '🔓 READY'}
                  </span>
                </div>
              </div>
            </div>

            {/* AUTHORIZED PERSON - 3 Columns */}
            <div className="col-span-3 flex flex-col items-center justify-center p-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60 shadow-sm">
              <div 
                onClick={() => setSelectedNode({
                  title: "Authorized Person",
                  category: "Crew & Mission Specialist Role",
                  desc: "Flight Commander or automated Safety Officer with privileges to view real-time hatch telemetry and issue manual overrides.",
                  permissions: "Full Bulkhead Command Authority"
                })}
                className="cursor-pointer flex items-center gap-3 p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors w-full justify-center"
              >
                {/* Silhouette avatar matching user's image */}
                <div className="w-10 h-10 rounded-full bg-rose-200 dark:bg-rose-900/80 border border-rose-400 flex items-center justify-center shadow-sm">
                  <svg className="w-5 h-5 text-gray-800 dark:text-gray-100" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-xs text-gray-900 dark:text-white">Authorized person</div>
                  <div className="text-[10px] text-gray-500">Commander / Operator</div>
                </div>
              </div>

              {/* Status link label */}
              <div className="mt-1 text-[9px] font-semibold text-gray-600 dark:text-gray-400 text-center">
                <span>← Hatch Status (Closed / Open)</span>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Selected Node Details Drawer */}
      {selectedNode && (
        <div className="w-full max-w-7xl mt-4 p-4 rounded-xl border border-gray-700 bg-gray-900 text-white shadow-xl flex items-start justify-between gap-4 animate-fadeIn">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded font-bold bg-blue-600 text-white">
                {selectedNode.category}
              </span>
              <h4 className="font-bold text-sm text-white">{selectedNode.title}</h4>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed max-w-4xl">{selectedNode.desc}</p>
            {selectedNode.stack && (
              <span className="inline-block mt-2 text-[10px] font-mono text-cyan-300 bg-black/40 px-2 py-0.5 rounded border border-gray-800">
                Stack: {selectedNode.stack}
              </span>
            )}
          </div>
          <button
            onClick={() => setSelectedNode(null)}
            className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded bg-gray-800 hover:bg-gray-700"
          >
            ✕ Close
          </button>
        </div>
      )}

    </div>
  );
};

export default SystemArchitecture;
