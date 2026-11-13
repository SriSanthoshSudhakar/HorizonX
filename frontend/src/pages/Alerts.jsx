import React, { useState, useEffect } from 'react';
import { AlertTriangle, Flame, UserCheck, ShieldAlert, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_BASE = 'http://127.0.0.1:8000';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/live/alerts`);
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.recent_anomalies || []);
      }
    } catch (e) {
      console.error('Failed to fetch alerts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-white pt-24 pb-16 px-4 sm:px-6 md:px-12">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-xl">
          <div>
            <div className="flex items-center space-x-3">
              <ShieldAlert className="w-7 h-7 text-red-500" />
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Hardware Alert Center
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1">
              Real-time anomaly events and hazard triggers logged by the ESP32 sensor array
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={fetchAlerts}
              className="px-3 py-1.5 rounded-xl text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center space-x-1.5 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
            <Link
              to="/dashboard"
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition"
            >
              Live Dashboard
            </Link>
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-3">
          {alerts.length > 0 ? (
            alerts.map((alert) => {
              const isCrit = alert.hazard_detected && alert.object_detected;
              return (
                <div 
                  key={alert.id}
                  className={`p-5 rounded-2xl border transition-all duration-300 ${
                    isCrit 
                      ? 'bg-red-950/30 border-red-800/80 hover:border-red-700' 
                      : 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-2.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider ${
                        isCrit ? 'bg-red-500 text-white' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}>
                        {isCrit ? 'CRITICAL HAZARD' : 'HAZARD SPIKE'}
                      </span>
                      <span className="text-xs text-neutral-400 font-mono">
                        Event #{alert.id} • {alert.device_id}
                      </span>
                    </div>
                    <span className="text-xs text-neutral-400 font-mono">
                      {alert.created_at ? new Date(alert.created_at).toLocaleString() : '--'}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-neutral-100">
                    {alert.anomaly_reason || 'Unusual sensor spike detected'}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-mono">
                    <span className="px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300">
                      MQ-2 #1: <strong className={alert.mq2_sensor_1 >= 1200 ? 'text-red-400' : 'text-neutral-200'}>{alert.mq2_sensor_1}</strong>
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300">
                      MQ-2 #2: <strong className={alert.mq2_sensor_2 >= 1200 ? 'text-red-400' : 'text-neutral-200'}>{alert.mq2_sensor_2}</strong>
                    </span>
                    {alert.temperature != null && (
                      <span className="px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300">
                        Temp: {alert.temperature}°C
                      </span>
                    )}
                    {alert.occupancy_status === 'POSSIBLE_OCCUPANCY' && (
                      <span className="px-2.5 py-1 rounded-lg bg-red-950 text-red-300 border border-red-800 font-bold flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Occupancy Warning</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center rounded-3xl bg-neutral-900 border border-neutral-800">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-80" />
              <h3 className="text-base font-bold text-neutral-200">No Active Anomalies Detected</h3>
              <p className="text-xs text-neutral-400 mt-1">All telemetry channels are operating within baseline thresholds.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Alerts;
