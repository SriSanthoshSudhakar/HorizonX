import React, { useState, useEffect } from 'react';
import { AlertTriangle, Flame, UserCheck, Wind, X, ExternalLink } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const API_BASE = 'http://127.0.0.1:8000';

const playAlarmSound = (critical = false) => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = critical ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(critical ? 880 : 587.33, ctx.currentTime);
    if (critical) {
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.35);
    }
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    // Ignore audio restriction
  }
};

const LiveAnomalyNotifier = () => {
  const [activeAlert, setActiveAlert] = useState(null);
  const [dismissedId, setDismissedId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    const checkAlerts = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/live/alerts`);
        if (!res.ok) return;
        const data = await res.json();
        
        if (isMounted) {
          if (data.active_alert) {
            const isCrit = data.active_alert.severity === 'CRITICAL' || data.active_alert.occupancy === 'POSSIBLE_OCCUPANCY';
            // Escalate to critical even if previous warning was dismissed
            if (isCrit || data.active_alert.id !== dismissedId) {
              setActiveAlert(prev => {
                if (!prev || (isCrit && prev.severity !== 'CRITICAL')) {
                  playAlarmSound(isCrit);
                }
                return data.active_alert;
              });
            }
          } else {
            setActiveAlert(null);
          }
        }
      } catch (err) {
        // Backend offline or polling error - fail silently
      }
    };

    // Check immediately and poll every 2.0 seconds
    checkAlerts();
    const interval = setInterval(checkAlerts, 2000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [dismissedId]);

  const handleDismiss = async () => {
    if (!activeAlert) return;
    const alertId = activeAlert.id;
    setDismissedId(alertId);
    setActiveAlert(null);

    try {
      await fetch(`${API_BASE}/api/live/alerts/dismiss?alert_id=${alertId}`, {
        method: 'POST'
      });
    } catch (e) {
      // ignore
    }
  };

  if (!activeAlert) return null;

  // Show notification if MQ >= 1200, smoke detected, OR occupancy detected in hazard zone
  const isMQSurge = (activeAlert.mq2_1 >= 1200) || (activeAlert.mq2_2 >= 1200);
  const isSmoke = Boolean(activeAlert.hazard_detected);
  const isOccupancyAlert = activeAlert.severity === 'CRITICAL' || activeAlert.occupancy === 'POSSIBLE_OCCUPANCY' || Boolean(activeAlert.object_detected);

  if (!isMQSurge && !isSmoke && !isOccupancyAlert) {
    return null;
  }

  const isCritical = activeAlert.severity === 'CRITICAL' || activeAlert.occupancy === 'POSSIBLE_OCCUPANCY';

  return (
    <aside 
      aria-label="Critical hardware anomaly alerts"
      className="fixed bottom-6 right-6 z-50 max-w-md w-[calc(100vw-3rem)] animate-bounce-in shadow-2xl rounded-2xl overflow-hidden border transition-all duration-300"
      style={{
        backgroundColor: '#0a0a0c',
        borderColor: isCritical ? '#ef4444' : '#f59e0b',
        boxShadow: isCritical ? '0 10px 30px rgba(239, 68, 68, 0.35)' : '0 10px 30px rgba(245, 158, 11, 0.25)'
      }}
    >
      {/* Top Banner Ribbon */}
      <div 
        className={`px-4 py-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-white ${
          isCritical ? 'bg-red-600' : 'bg-amber-600'
        }`}
      >
        <div className="flex items-center space-x-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
          </span>
          <span>{isCritical ? 'CRITICAL HARDWARE ANOMALY' : 'HAZARD WARNING DETECTED'}</span>
        </div>
        <button 
          onClick={handleDismiss} 
          aria-label="Dismiss anomaly alert"
          className="text-white/80 hover:text-white transition p-0.5 rounded cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Alert Body */}
      <div className="p-4 text-white">
        <div className="flex items-start space-x-3">
          <div className={`p-2.5 rounded-xl shrink-0 ${isCritical ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
            {isCritical ? <AlertTriangle className="w-6 h-6 animate-pulse" /> : <Flame className="w-6 h-6" />}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-gray-100 leading-snug">
              {activeAlert.reason || 'Abnormal sensor spike detected on ESP32 array!'}
            </h4>
            <div className="mt-2.5 flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                MQ1: <strong className="text-red-400">{activeAlert.mq2_1 ?? '--'}</strong>
              </span>
              <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                MQ2: <strong className="text-red-400">{activeAlert.mq2_2 ?? '--'}</strong>
              </span>
              {activeAlert.temperature && (
                <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                  Temp: <strong>{activeAlert.temperature}°C</strong>
                </span>
              )}
              {(activeAlert.occupancy === 'POSSIBLE_OCCUPANCY' || activeAlert.object_detected) && (
                <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 flex items-center space-x-1 font-semibold animate-pulse">
                  <UserCheck className="w-3.5 h-3.5 text-red-400" />
                  <span>
                    Occupancy Detected {activeAlert.distance_cm ? `(${activeAlert.distance_cm} cm)` : ''}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between text-xs">
          <span className="text-neutral-400">
            Device: <code className="text-neutral-300">{activeAlert.device_id || 'ESP32'}</code>
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition cursor-pointer"
            >
              Dismiss
            </button>
            {location.pathname !== '/analytics' && (
              <button
                onClick={() => {
                  handleDismiss();
                  navigate('/analytics?tab=live');
                }}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium flex items-center space-x-1 transition cursor-pointer shadow-md"
              >
                <span>Live View</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default LiveAnomalyNotifier;
