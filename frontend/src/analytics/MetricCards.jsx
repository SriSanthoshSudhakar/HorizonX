import React from 'react';
import { Layers, Radio, Cpu, Gauge } from 'lucide-react';

export const MetricCards = ({ summary }) => {
  const metrics = [
    {
      title: 'Total Telemetry Packets',
      value: summary?.total_samples ? summary.total_samples.toLocaleString() : '13,910',
      change: '+12.4%',
      isPositive: true,
      icon: Layers,
      color: 'text-blue-600',
      sparklineColor: '#2563eb',
      points: '0,18 10,14 20,20 30,12 40,16 50,8 60,11 70,5 80,9 90,2'
    },
    {
      title: 'Active Sensor Channels',
      value: '16 Figaro TGS',
      change: '100% Online',
      isPositive: true,
      icon: Radio,
      color: 'text-emerald-600',
      sparklineColor: '#10b981',
      points: '0,10 10,12 20,10 30,9 40,10 50,11 60,9 70,10 80,8 90,9'
    },
    {
      title: 'Chemical Gas Species',
      value: '6 Volatile Classes',
      change: 'Calibrated',
      isPositive: true,
      icon: Cpu,
      color: 'text-purple-600',
      sparklineColor: '#8b5cf6',
      points: '0,15 15,10 30,17 45,8 60,14 75,6 90,12'
    },
    {
      title: 'Mean Concentration',
      value: `${summary?.average_concentration || 157.09} PPM`,
      change: '-3.1% Drift',
      isPositive: false,
      icon: Gauge,
      color: 'text-amber-600',
      sparklineColor: '#f59e0b',
      points: '0,5 15,12 30,8 45,16 60,11 75,18 90,14'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((m, idx) => {
        const IconComponent = m.icon;
        return (
          <div 
            key={idx}
            className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 font-mono">
                {m.title}
              </span>
              <IconComponent className={`w-4 h-4 ${m.color}`} />
            </div>

            <div className="flex items-end justify-between mt-2">
              <div>
                <p className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
                  {m.value}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`text-[11px] font-semibold ${m.isPositive ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {m.change}
                  </span>
                  <span className="text-[10px] text-slate-400">vs baseline</span>
                </div>
              </div>

              {/* Mini Sparkline (Untitled UI Style) */}
              <div className="w-20 h-8">
                <svg viewBox="0 0 90 24" className="w-full h-full overflow-visible">
                  <polyline
                    fill="none"
                    stroke={m.sparklineColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={m.points}
                  />
                </svg>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MetricCards;
