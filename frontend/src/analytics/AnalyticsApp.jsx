import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AnalyticsSidebar from './AnalyticsSidebar';
import MetricCards from './MetricCards';
import {
  Plotly3DSurface,
  PlotlyCorrelationHeatmap,
  PlotlyGasBoxPlots,
  PlotlyGasDonut,
  PlotlySensorScatter,
  PlotlyChamberContour,
  Plotly3DScatter,
  PlotlyAlertTimeline,
  PlotlySpeciesHeatmap,
  PlotlyViolinDist,
  PlotlyThresholdHistogram,
  PlotlyPhasePlane,
  PlotlyWaterfallDecay,
  PlotlyPolarBar,
  PlotlyBaselineArea
} from './PlotlyCharts';
import {
  D3Streamgraph,
  D3RadarChart,
  D3ZoomableSunburst,
  D3ParallelCoordinates,
  D3RidgelinePlot,
  D3ConcentrationGauges,
  D3GasFrequencyBars,
  D3ConcentricRings,
  D3SlopeCurves,
  D3SensitivityNetwork,
  D3TimeDecayStep,
  D3CumulativeOgive,
  D3VelocityCurves,
  D3SpectralDistribution
} from './D3Charts';
import { 
  Search, 
  RefreshCw,
  LogOut,
  X,
  Menu
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://127.0.0.1:8000';

const getLastName = (fullName) => {
  if (!fullName) return 'Officer';
  const parts = fullName.trim().split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1] : parts[0];
};

export const AnalyticsApp = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  const [loading, setLoading] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = React.useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Telemetry Datasets
  const [summary, setSummary] = useState({
    total_samples: 13910,
    high_concentration_alerts: 9498,
    unique_gas_types: 6,
    average_concentration: 157.09
  });

  const [streamData, setStreamData] = useState(null);
  const [radarData, setRadarData] = useState(null);
  const [sunburstData, setSunburstData] = useState(null);
  const [pcpData, setPcpData] = useState(null);
  const [ridgelineData, setRidgelineData] = useState(null);

  // Fetch telemetry datasets
  const fetchTelemetry = async () => {
    setLoading(true);
    try {
      const sumRes = await fetch(`${API_BASE}/api/analytics/summary`).catch(() => null);
      if (sumRes && sumRes.ok) {
        const sumJson = await sumRes.json();
        if (!sumJson.error) setSummary(sumJson);
      }

      const sgRes = await fetch(`${API_BASE}/api/analytics/d3/streamgraph`).catch(() => null);
      if (sgRes && sgRes.ok) {
        setStreamData(await sgRes.json());
      }

      const radRes = await fetch(`${API_BASE}/api/analytics/d3/radar`).catch(() => null);
      if (radRes && radRes.ok) {
        setRadarData(await radRes.json());
      }

      const sunRes = await fetch(`${API_BASE}/api/analytics/d3/sunburst`).catch(() => null);
      if (sunRes && sunRes.ok) {
        setSunburstData(await sunRes.json());
      }

      const pcpRes = await fetch(`${API_BASE}/api/analytics/d3/parallel-coordinates`).catch(() => null);
      if (pcpRes && pcpRes.ok) {
        setPcpData(await pcpRes.json());
      }

      const ridgeRes = await fetch(`${API_BASE}/api/analytics/d3/ridgeline`).catch(() => null);
      if (ridgeRes && ridgeRes.ok) {
        setRidgelineData(await ridgeRes.json());
      }
    } catch (err) {
      console.warn('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800 antialiased selection:bg-blue-600 selection:text-white">
      
      {/* 1. LEFT SIDEBAR NAVIGATION (CLOSEABLE & OPENABLE) */}
      <AnalyticsSidebar 
        activePage={activePage} 
        onSelectPage={setActivePage} 
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* 2. MAIN SCROLLABLE DASHBOARD VIEWPORT */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto scroll-smooth">
        
        {/* TOP HEADER */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 sm:gap-4">
          
          {/* Left Title & Subtitle + Sidebar Open Button */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-800 hover:text-black transition flex items-center justify-center shadow-xs"
              title={sidebarOpen ? "Close Sidebar" : "Open Sidebar"}
            >
              <Menu className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                {activePage === 'overview' && 'Overview'}
                {(activePage === 'topography' || activePage === 'telemetry') && 'Topography'}
                {activePage === 'sensors' && 'Sensors'}
                {(activePage === 'dynamics' || activePage === 'drift') && 'Gas Drift'}
                {(activePage === 'concentration' || activePage === 'composition' || activePage === 'distribution') && 'Concentration'}
                {(activePage === 'diagnostics' || activePage === 'health') && 'Diagnostics'}
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Historical Telemetry Calibration Data
              </p>
            </div>
          </div>

          {/* Right Header Area: Search + TOP CORNER REGISTERED USER (LAST NAME BELOW IMAGE) */}
          <div className="flex items-center gap-3 sm:gap-5">
            
            {/* Search Input */}
            <div className="relative hidden md:block">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search telemetry..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-slate-50 text-slate-700 w-44"
              />
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchTelemetry}
              disabled={loading}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
              title="Refresh Telemetry Bus"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            </button>

            {/* TOP CORNER: REGISTERED IMAGE IN BLACK CIRCLE - NO NAME BELOW */}
            <div className="relative pl-2 border-l border-slate-200" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center justify-center cursor-pointer group focus:outline-none"
                title="Click to view profile & sign out"
              >
                <div className="relative">
                  <img 
                    src={user?.avatar || "/sri_avatar_nav.png"} 
                    alt={user?.name || "Registered User"}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-black shadow-xs group-hover:scale-105 transition bg-slate-100"
                    onError={(e) => {
                      if (user?.avatar) e.target.src = user.avatar;
                    }}
                  />
                </div>
              </button>

              {/* Profile Dropdown Popup (STRICTLY BLACK AND WHITE ONLY) */}
              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-2rem)] bg-black text-white rounded-2xl p-4 shadow-2xl border border-neutral-800 z-50 animate-fade-in text-left">
                  
                  {/* Close Button Row */}
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-neutral-800">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">
                      Account Profile
                    </span>
                    <button
                      onClick={() => setProfileOpen(false)}
                      className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition"
                      title="Close"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Profile Info Card: Registered Photo in Black Circle, Name, Role, Black/White Pro Badge */}
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <img 
                        src={user?.avatar || "/sri_avatar_nav.png"} 
                        alt={user?.name || "Registered User"}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md bg-neutral-900"
                        onError={(e) => {
                          if (user?.avatar) e.target.src = user.avatar;
                        }}
                      />
                    </div>

                    <div className="overflow-hidden">
                      <h4 className="text-sm font-bold text-white truncate">
                        {user?.name || "Crew Member"}
                      </h4>
                      <p className="text-xs text-neutral-400 truncate mt-0.5">
                        {user?.role || "System Engineer"}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-[10px] font-mono text-neutral-300 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-700">
                          {user?.batch_id || "Bravo-0-6"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="my-3 border-t border-neutral-800" />

                  {/* Sign Out Action Button */}
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      logout();
                      navigate('/');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-neutral-300 hover:text-white hover:bg-neutral-900 border border-transparent hover:border-neutral-800 transition text-xs font-semibold text-left group"
                  >
                    <LogOut className="w-4 h-4 text-neutral-400 group-hover:text-white transition" />
                    <span>Sign out</span>
                  </button>

                </div>
              )}
            </div>

          </div>
        </header>

        {/* 3. DEDICATED DASHBOARD PAGES (EACH WITH 5 TO 8 CHARTS/DASHBOARDS) */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6 sm:space-y-8">
          
          {/* ================= PAGE 1: EXECUTIVE OVERVIEW (6 DASHBOARDS/CHARTS) ================= */}
          {activePage === 'overview' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 font-mono uppercase">
                  Executive Telemetry Pulse
                </h2>
                <p className="text-xs text-slate-500">Global volatile composition, subsystem health, and multi-gas concentration status.</p>
              </div>

              {/* 1. KPI Cards */}
              <MetricCards summary={summary} />

              {/* 2. Real-Time Concentration Gauges */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                    Real-Time Species Concentration Gauges
                  </h3>
                </div>
                <D3ConcentrationGauges />
              </div>

              {/* Row: Donut + Gas Frequency Bars */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* 3. Volatile Composition Donut */}
                <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-2 pb-3 border-b border-slate-100">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                      Volatile Gas Composition Ratio
                    </h3>
                  </div>
                  <PlotlyGasDonut height={320} />
                </div>

                {/* 4. Gas Frequency Bars */}
                <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-2 pb-3 border-b border-slate-100">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                      Sample Distribution by Volatile Gas
                    </h3>
                  </div>
                  <D3GasFrequencyBars />
                </div>

              </div>

              {/* Row: Alert Timeline + Species Response Heatmap */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* 5. Alert Timeline */}
                <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
                  <div className="flex items-center gap-2 mb-2 pb-3 border-b border-slate-100">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                      Threshold Exceedance Timeline
                    </h3>
                  </div>
                  <PlotlyAlertTimeline height={300} />
                </div>

                {/* 6. Species Response Heatmap */}
                <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
                  <div className="flex items-center gap-2 mb-2 pb-3 border-b border-slate-100">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                      Chemical Species Intensity Matrix
                    </h3>
                  </div>
                  <PlotlySpeciesHeatmap height={300} />
                </div>

              </div>

              {/* 7. Multi-Phase Baseline Tolerance Band */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center gap-2 mb-2 pb-3 border-b border-slate-100">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                    Baseline Tolerance Band &amp; Multi-Phase Calibration
                  </h3>
                </div>
                <PlotlyBaselineArea height={280} />
              </div>

            </div>
          )}

          {/* ================= PAGE 2: TOPOGRAPHY (7 CHARTS/DASHBOARDS) ================= */}
          {(activePage === 'topography' || activePage === 'telemetry') && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 font-mono uppercase">
                  Telemetry Matrix &amp; Flux Mapping
                </h2>
                <p className="text-xs text-slate-500">
                  Volumetric 3D mesh surface, chamber flux contour mapping, and radial sensor elevation contours.
                </p>
              </div>

              {/* 1. 3D Volumetric Mesh Surface */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                      Volumetric Multi-Channel Drift Surface
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                    Click &amp; Drag to Rotate 3D View
                  </span>
                </div>
                <Plotly3DSurface height={480} />
              </div>

              {/* Row: 2D Chamber Contour + 3D Transducer Scatter */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* 2. Spatial Chamber Contour Map */}
                <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                      Chamber Gas Flux Contour Map
                    </h3>
                  </div>
                  <PlotlyChamberContour height={360} />
                </div>

                {/* 3. Transducer 3D Scatter */}
                <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                      Impedance vs Temperature vs Concentration (3D)
                    </h3>
                  </div>
                  <Plotly3DScatter height={360} />
                </div>

              </div>

              {/* Row: Concentric Rings + Slope Curves */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* 4. Concentric Chamber Elevation Rings */}
                <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                      Radial Chamber Elevation Rings
                    </h3>
                  </div>
                  <D3ConcentricRings />
                </div>

                {/* 5. Topographical Slope Curves */}
                <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                      Multi-Channel Topographical Slopes
                    </h3>
                  </div>
                  <D3SlopeCurves />
                </div>

              </div>

              {/* Row: Sensor Scatter + Dynamic Velocity */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* 6. Calibration Scatter */}
                <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                      Telemetry Transducer Slope vs Amplitude
                    </h3>
                  </div>
                  <PlotlySensorScatter height={320} />
                </div>

                {/* 7. Velocity Waveform */}
                <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                      Dynamic Response Rise Velocity
                    </h3>
                  </div>
                  <D3VelocityCurves />
                </div>
              </div>

            </div>
          )}

          {/* ================= PAGE 3: SENSOR ARRAY (6 CHARTS/DASHBOARDS) ================= */}
          {activePage === 'sensors' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 font-mono uppercase">
                  Sensor Array Matrix &amp; Fingerprints
                </h2>
                <p className="text-xs text-slate-500">
                  Cross-sensitivity correlation matrices, morphing radial response fingerprints, and transducer clustering.
                </p>
              </div>

              {/* Row: Correlation Heatmap + Morphing Radar */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* 1. Correlation Matrix */}
                <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2 pb-3 border-b border-slate-100">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                        Transducer Cross-Correlation Matrix
                      </h3>
                    </div>
                  </div>
                  <PlotlyCorrelationHeatmap height={380} />
                </div>

                {/* 2. Morphing Polar Response Radar */}
                <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2 pb-3 border-b border-slate-100">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                        Polar Response Fingerprint
                      </h3>
                    </div>
                  </div>
                  <D3RadarChart data={radarData} />
                </div>

              </div>

              {/* Row: Sensitivity Network + Polar Bar + Scatter */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* 3. Sensitivity Network */}
                <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                      Correlation Network Cluster
                    </h3>
                  </div>
                  <D3SensitivityNetwork />
                </div>

                {/* 4. Polar Volatile Bar */}
                <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-600"></span>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                      Polar Volatile Selectivity
                    </h3>
                  </div>
                  <PlotlyPolarBar height={340} />
                </div>

                {/* 5. Transducer Drift Scatter */}
                <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                      Resistance Slope vs Amplitude
                    </h3>
                  </div>
                  <PlotlySensorScatter height={340} />
                </div>

              </div>

              {/* 6. Orbit Phase Portrait */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                    Transducer Phase Orbit Stability
                  </h3>
                </div>
                <PlotlyPhasePlane height={280} />
              </div>

            </div>
          )}

          {/* ================= PAGE 4: GAS DYNAMICS / DRIFT (6 CHARTS/DASHBOARDS) ================= */}
          {(activePage === 'dynamics' || activePage === 'drift') && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 font-mono uppercase">
                  Gas Dynamics &amp; Transient Drift
                </h2>
                <p className="text-xs text-slate-500">
                  Continuous multi-phase baseline calibration, parallel coordinate sample trajectories, and baseline tolerance bands.
                </p>
              </div>

              {/* 1. Volatile Drift Streamgraph */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                      Continuous Volatile Drift Waveform
                    </h3>
                  </div>
                </div>
                <D3Streamgraph data={streamData} />
              </div>

              {/* 2. Parallel Coordinates */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                      Parallel Coordinate Sample Trajectories
                    </h3>
                  </div>
                </div>
                <D3ParallelCoordinates data={pcpData} />
              </div>

              {/* Row: Tolerance Band Area + Time Decay Step + Phase Plane */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* 3. Multi-Phase Baseline Area */}
                <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                      Baseline Drift Tolerance Band
                    </h3>
                  </div>
                  <PlotlyBaselineArea height={280} />
                </div>

                {/* 4. Time Decay Step Function */}
                <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                      Step Calibration Decay
                    </h3>
                  </div>
                  <D3TimeDecayStep />
                </div>

                {/* 5. Phase Plane Trajectories */}
                <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                      Resistance Phase Portrait
                    </h3>
                  </div>
                  <PlotlyPhasePlane height={280} />
                </div>

              </div>

              {/* 6. Dynamic Rise Velocity */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                    Dynamic Response Rise Velocity Waveforms
                  </h3>
                </div>
                <D3VelocityCurves />
              </div>

            </div>
          )}

          {/* ================= PAGE 5: CONCENTRATION / COMPOSITION (7 CHARTS/DASHBOARDS) ================= */}
          {(activePage === 'concentration' || activePage === 'composition' || activePage === 'distribution') && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 font-mono uppercase">
                  Chemical Species Composition &amp; Dispersion
                </h2>
                <p className="text-xs text-slate-500">
                  Dispersion profiles, continuous elevation density crests, and hierarchical transducer partitioning.
                </p>
              </div>

              {/* 1. Volatile Box Plots */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                      Statistical Concentration Dispersion Profiles
                    </h3>
                  </div>
                </div>
                <PlotlyGasBoxPlots height={340} />
              </div>

              {/* 2. Continuous Density Ridgeline Plot */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                      Continuous Density Crests by Species
                    </h3>
                  </div>
                </div>
                <D3RidgelinePlot data={ridgelineData} />
              </div>

              {/* Row: Sunburst + Violins */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* 3. Zoomable Sunburst Partition */}
                <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                      Transducer Partition Sunburst
                    </h3>
                  </div>
                  <D3ZoomableSunburst data={sunburstData} />
                </div>

                {/* 4. Kernel Density Violins */}
                <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-600"></span>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                      Kernel Density Violin Curves
                    </h3>
                  </div>
                  <PlotlyViolinDist height={340} />
                </div>

              </div>

              {/* Row: Cumulative Ogive + Histogram */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* 5. Cumulative Ogive */}
                <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                      Cumulative Probability Sigmoid Curve
                    </h3>
                  </div>
                  <D3CumulativeOgive />
                </div>

                {/* 6. Threshold Histogram */}
                <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                      Concentration Exceedance Frequency
                    </h3>
                  </div>
                  <PlotlyThresholdHistogram height={300} />
                </div>

              </div>

              {/* 7. Volatile Composition Ratio Donut */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center gap-2 mb-2 pb-3 border-b border-slate-100">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                    Volatile Species Ratio Distribution
                  </h3>
                </div>
                <PlotlyGasDonut height={320} />
              </div>

            </div>
          )}

          {/* ================= PAGE 6: DIAGNOSTICS / SYSTEM HEALTH (6 CHARTS/DASHBOARDS) ================= */}
          {(activePage === 'diagnostics' || activePage === 'health') && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 font-mono uppercase">
                  System Health &amp; Diagnostics
                </h2>
                <p className="text-xs text-slate-500">
                  Dynamic response velocities, baseline decay waterfalls, and channel spectrum distribution.
                </p>
              </div>

              {/* 1. Dynamic Response Velocity Curves */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                      Transducer Response Rise &amp; Recovery Velocity
                    </h3>
                  </div>
                </div>
                <D3VelocityCurves />
              </div>

              {/* Row: Dynamic Scatter + Waterfall */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* 2. Slope vs Amplitude Scatter */}
                <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                      Derivative Resistance Slope vs Peak Amplitude
                    </h3>
                  </div>
                  <PlotlySensorScatter height={340} />
                </div>

                {/* 3. Calibration Waterfall Decay */}
                <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                      Baseline Calibration Decay Waterfall
                    </h3>
                  </div>
                  <PlotlyWaterfallDecay height={340} />
                </div>

              </div>

              {/* Row: Spectral Distribution + Orbit Phase */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* 4. Spectral Distribution Bars */}
                <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                      Channel Frequency Power Spectrum
                    </h3>
                  </div>
                  <D3SpectralDistribution />
                </div>

                {/* 5. Phase Plane Trajectory */}
                <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                      Transducer Orbit Phase Stability
                    </h3>
                  </div>
                  <PlotlyPhasePlane height={300} />
                </div>

              </div>

              {/* 6. Systemic Cross-Correlation Matrix */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center gap-2 mb-2 pb-3 border-b border-slate-100">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                    Systemic Cross-Channel Correlation Matrix
                  </h3>
                </div>
                <PlotlyCorrelationHeatmap height={360} />
              </div>

            </div>
          )}

        </div>

      </main>

    </div>
  );
};

export default AnalyticsApp;