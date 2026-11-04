import React, { useMemo } from 'react';
import PlotlyComponent from './PlotlyComponent';

// 1. 3D SURFACE TOPOGRAPHY
export const Plotly3DSurface = ({ height = 400 }) => {
  const { data, layout } = useMemo(() => {
    const zData = [];
    const xLabels = ['Phase 1', 'Phase 2', 'Phase 3', 'Phase 4', 'Phase 5', 'Phase 6', 'Phase 7', 'Phase 8', 'Phase 9', 'Phase 10'];
    const yLabels = Array.from({ length: 16 }, (_, i) => `Ch ${String(i + 1).padStart(2, '0')}`);

    for (let i = 0; i < 16; i++) {
      const row = [];
      for (let j = 0; j < 10; j++) {
        const base = Math.sin((i / 16) * Math.PI) * 45;
        const drift = (j * 4.2) + Math.cos(j * 0.8) * 12;
        const noise = (Math.sin(i * 1.5 + j * 2) * 8);
        row.push(Number((base + drift + noise + 20).toFixed(2)));
      }
      zData.push(row);
    }

    const surfaceData = [{
      z: zData,
      x: xLabels,
      y: yLabels,
      type: 'surface',
      colorscale: [
        [0.0, '#3b82f6'],
        [0.3, '#06b6d4'],
        [0.6, '#10b981'],
        [0.85, '#f59e0b'],
        [1.0, '#ef4444']
      ],
      showscale: true,
      colorbar: {
        title: { text: 'PPM / Ω', side: 'right', font: { size: 10, color: '#64748b' } },
        thickness: 12,
        len: 0.8,
        tickfont: { size: 9, color: '#64748b' }
      },
      contours: {
        z: { show: true, usecolormap: true, highlightcolor: '#ffffff', project: { z: true } }
      }
    }];

    const surfaceLayout = {
      margin: { l: 0, r: 0, t: 10, b: 0 },
      scene: {
        xaxis: { title: 'Calibration Phase', color: '#64748b', gridcolor: '#e2e8f0' },
        yaxis: { title: 'Transducer Channel', color: '#64748b', gridcolor: '#e2e8f0' },
        zaxis: { title: 'Drift Response', color: '#64748b', gridcolor: '#e2e8f0' },
        camera: {
          eye: { x: 1.6, y: -1.7, z: 1.3 }
        }
      }
    };

    return { data: surfaceData, layout: surfaceLayout };
  }, []);

  return (
    <div style={{ height }}>
      <PlotlyComponent data={data} layout={layout} />
    </div>
  );
};

// 2. SENSOR CORRELATION HEATMAP
export const PlotlyCorrelationHeatmap = ({ height = 380 }) => {
  const { data, layout } = useMemo(() => {
    const sensorNames = Array.from({ length: 16 }, (_, i) => `S${String(i + 1).padStart(2, '0')}`);
    const matrix = [];

    for (let i = 0; i < 16; i++) {
      const row = [];
      for (let j = 0; j < 16; j++) {
        if (i === j) {
          row.push(1.0);
        } else {
          const diff = Math.abs(i - j);
          const corr = Math.max(0.12, Math.cos(diff * 0.42) * 0.75 + 0.18 + (i % 2 === j % 2 ? 0.2 : 0));
          row.push(Number(Math.min(0.98, corr).toFixed(2)));
        }
      }
      matrix.push(row);
    }

    const heatmapData = [{
      z: matrix,
      x: sensorNames,
      y: sensorNames,
      type: 'heatmap',
      colorscale: [
        [0.0, '#f8fafc'],
        [0.2, '#dbeafe'],
        [0.5, '#60a5fa'],
        [0.8, '#2563eb'],
        [1.0, '#1e3a8a']
      ],
      showscale: true,
      colorbar: {
        title: { text: 'Pearson r', side: 'right', font: { size: 10, color: '#64748b' } },
        thickness: 10,
        len: 0.85,
        tickfont: { size: 9, color: '#64748b' }
      }
    }];

    const heatmapLayout = {
      margin: { l: 45, r: 25, t: 15, b: 45 },
      xaxis: { color: '#64748b', tickangle: -45, tickfont: { size: 9 } },
      yaxis: { color: '#64748b', tickfont: { size: 9 } }
    };

    return { data: heatmapData, layout: heatmapLayout };
  }, []);

  return (
    <div style={{ height }}>
      <PlotlyComponent data={data} layout={layout} />
    </div>
  );
};

// 3. STATISTICAL GAS BOX PLOTS
export const PlotlyGasBoxPlots = ({ height = 360 }) => {
  const { data, layout } = useMemo(() => {
    const gases = ['Ethanol', 'Ethylene', 'Ammonia', 'Acetaldehyde', 'Acetone', 'Toluene'];
    const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

    const boxData = gases.map((gas, idx) => {
      const baseMean = [120, 180, 85, 140, 210, 95][idx];
      const yValues = Array.from({ length: 40 }, () => {
        return Math.max(10, baseMean + (Math.random() - 0.5) * 110 + (Math.sin(idx) * 20));
      });

      return {
        y: yValues,
        type: 'box',
        name: gas,
        marker: { color: colors[idx] },
        boxpoints: 'outliers',
        jitter: 0.3,
        pointpos: -1.5
      };
    });

    const boxLayout = {
      margin: { l: 40, r: 20, t: 15, b: 40 },
      yaxis: { title: 'Concentration (PPM)', gridcolor: '#f1f5f9', color: '#64748b' },
      xaxis: { color: '#64748b' },
      showlegend: false
    };

    return { data: boxData, layout: boxLayout };
  }, []);

  return (
    <div style={{ height }}>
      <PlotlyComponent data={data} layout={layout} />
    </div>
  );
};

// 4. VOLATILE GAS COMPOSITION DONUT
export const PlotlyGasDonut = ({ height = 320 }) => {
  const { data, layout } = useMemo(() => {
    const gases = ['Ethanol', 'Ethylene', 'Ammonia', 'Acetaldehyde', 'Acetone', 'Toluene'];
    const counts = [2850, 3120, 2460, 2110, 1980, 1390];
    const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

    const donutData = [{
      values: counts,
      labels: gases,
      type: 'pie',
      hole: 0.6,
      marker: { colors },
      textinfo: 'label+percent',
      textposition: 'outside',
      insidetextorientation: 'radial',
      hoverinfo: 'label+value+percent'
    }];

    const donutLayout = {
      margin: { l: 20, r: 20, t: 20, b: 20 },
      showlegend: false,
      annotations: [
        {
          font: { size: 12, color: '#334155', weight: 'bold' },
          showarrow: false,
          text: 'SPECIES<br>RATIO',
          x: 0.5,
          y: 0.5
        }
      ]
    };

    return { data: donutData, layout: donutLayout };
  }, []);

  return (
    <div style={{ height }}>
      <PlotlyComponent data={data} layout={layout} />
    </div>
  );
};

// 5. DYNAMIC SENSOR DRIFT SCATTER WITH TRENDLINES
export const PlotlySensorScatter = ({ height = 360 }) => {
  const { data, layout } = useMemo(() => {
    const pointsCount = 45;
    const x1 = Array.from({ length: pointsCount }, (_, i) => i * 3.5 + (Math.sin(i) * 2));
    const y1 = x1.map(x => x * 1.8 + Math.cos(x * 0.2) * 15 + 30);
    const x2 = Array.from({ length: pointsCount }, (_, i) => i * 3.2 + 10);
    const y2 = x2.map(x => x * 2.6 + Math.sin(x * 0.3) * 25 + 55);

    const scatterData = [
      {
        x: x1,
        y: y1,
        mode: 'markers',
        name: 'Nominal Baseline',
        marker: { color: '#3b82f6', size: 6, opacity: 0.7 }
      },
      {
        x: x1,
        y: x1.map(x => x * 1.8 + 30),
        mode: 'lines',
        name: 'Baseline Spline',
        line: { color: '#2563eb', width: 2, dash: 'dot' }
      },
      {
        x: x2,
        y: y2,
        mode: 'markers',
        name: 'Hull Excursion',
        marker: { color: '#ef4444', size: 7, symbol: 'diamond', opacity: 0.85 }
      },
      {
        x: x2,
        y: x2.map(x => x * 2.6 + 55),
        mode: 'lines',
        name: 'Excursion Trend',
        line: { color: '#dc2626', width: 2 }
      }
    ];

    const scatterLayout = {
      margin: { l: 45, r: 20, t: 15, b: 40 },
      xaxis: { title: 'Dynamic Resistance Slope (dΩ/dt)', gridcolor: '#f1f5f9', color: '#64748b' },
      yaxis: { title: 'Peak Steady-State (ΔR / R0)', gridcolor: '#f1f5f9', color: '#64748b' },
      legend: { orientation: 'h', y: -0.22, x: 0.1, font: { size: 10, color: '#64748b' } }
    };

    return { data: scatterData, layout: scatterLayout };
  }, []);

  return (
    <div style={{ height }}>
      <PlotlyComponent data={data} layout={layout} />
    </div>
  );
};

// 6. SPATIAL CHAMBER 2D CONTOUR MAP
export const PlotlyChamberContour = ({ height = 360 }) => {
  const { data, layout } = useMemo(() => {
    const size = 20;
    const z = [];
    for (let i = 0; i < size; i++) {
      const row = [];
      for (let j = 0; j < size; j++) {
        const d1 = Math.sqrt((i - 7) ** 2 + (j - 8) ** 2);
        const d2 = Math.sqrt((i - 14) ** 2 + (j - 13) ** 2);
        row.push(100 * Math.exp(-d1 / 4) + 80 * Math.exp(-d2 / 5) + Math.random() * 5);
      }
      z.push(row);
    }

    const contourData = [{
      z,
      type: 'contour',
      colorscale: 'Viridis',
      contours: {
        coloring: 'heatmap',
        showlabels: true,
        labelfont: { size: 9, color: 'white' }
      },
      colorbar: {
        title: { text: 'Flux (PPM)', side: 'right', font: { size: 10, color: '#64748b' } },
        thickness: 10,
        len: 0.85
      }
    }];

    const contourLayout = {
      margin: { l: 40, r: 20, t: 15, b: 35 },
      xaxis: { title: 'Chamber Width (cm)', color: '#64748b' },
      yaxis: { title: 'Chamber Depth (cm)', color: '#64748b' }
    };

    return { data: contourData, layout: contourLayout };
  }, []);

  return (
    <div style={{ height }}>
      <PlotlyComponent data={data} layout={layout} />
    </div>
  );
};

// 7. TRANSDUCER 3D SCATTER DISPERSION
export const Plotly3DScatter = ({ height = 380 }) => {
  const { data, layout } = useMemo(() => {
    const n = 60;
    const x = Array.from({ length: n }, (_, i) => 20 + i * 2.5 + Math.sin(i) * 10);
    const y = x.map((v, i) => 150 + Math.cos(i * 0.4) * 80 + v * 0.5);
    const z = x.map((v, i) => Math.sin(i * 0.6) * 40 + v * 0.8 + 25);
    const colors = z;

    const scatter3dData = [{
      x,
      y,
      z,
      mode: 'markers',
      type: 'scatter3d',
      marker: {
        size: 4,
        color: colors,
        colorscale: 'Plasma',
        opacity: 0.85
      }
    }];

    const scatter3dLayout = {
      margin: { l: 0, r: 0, t: 10, b: 0 },
      scene: {
        xaxis: { title: 'Impedance (kΩ)', color: '#64748b' },
        yaxis: { title: 'Temp (°C)', color: '#64748b' },
        zaxis: { title: 'Concentration (PPM)', color: '#64748b' },
        camera: { eye: { x: 1.4, y: 1.4, z: 1.2 } }
      }
    };

    return { data: scatter3dData, layout: scatter3dLayout };
  }, []);

  return (
    <div style={{ height }}>
      <PlotlyComponent data={data} layout={layout} />
    </div>
  );
};

// 8. ALERT EVENTS TIMELINE
export const PlotlyAlertTimeline = ({ height = 300 }) => {
  const { data, layout } = useMemo(() => {
    const dates = ['W01', 'W02', 'W03', 'W04', 'W05', 'W06', 'W07', 'W08', 'W09', 'W10', 'W11', 'W12'];
    const nominal = [120, 140, 110, 160, 150, 130, 170, 145, 155, 165, 135, 150];
    const alerts = [8, 12, 5, 24, 18, 9, 32, 14, 20, 28, 11, 16];

    const timelineData = [
      {
        x: dates,
        y: nominal,
        type: 'bar',
        name: 'Nominal Samples',
        marker: { color: '#93c5fd' }
      },
      {
        x: dates,
        y: alerts,
        type: 'bar',
        name: 'Threshold Exceedances',
        marker: { color: '#f87171' }
      }
    ];

    const timelineLayout = {
      barmode: 'stack',
      margin: { l: 35, r: 20, t: 15, b: 35 },
      xaxis: { title: 'Telemetry Window', color: '#64748b' },
      yaxis: { title: 'Event Count', color: '#64748b', gridcolor: '#f1f5f9' },
      legend: { orientation: 'h', y: -0.25, x: 0.2, font: { size: 10, color: '#64748b' } }
    };

    return { data: timelineData, layout: timelineLayout };
  }, []);

  return (
    <div style={{ height }}>
      <PlotlyComponent data={data} layout={layout} />
    </div>
  );
};

// 9. SPECIES VS SENSOR RESPONSE HEATMAP
export const PlotlySpeciesHeatmap = ({ height = 320 }) => {
  const { data, layout } = useMemo(() => {
    const gases = ['Ethanol', 'Ethylene', 'Ammonia', 'Acetaldehyde', 'Acetone', 'Toluene'];
    const sensors = ['S01', 'S03', 'S05', 'S07', 'S09', 'S11', 'S13', 'S15'];
    const z = gases.map((_, i) =>
      sensors.map((_, j) => Math.round(30 + Math.sin(i * 1.5 + j * 0.9) * 45 + (i * 8)))
    );

    const speciesHeatmapData = [{
      z,
      x: sensors,
      y: gases,
      type: 'heatmap',
      colorscale: 'YlGnBu',
      colorbar: { thickness: 10, len: 0.85, title: { text: 'ΔR (Ω)', side: 'right' } }
    }];

    const speciesHeatmapLayout = {
      margin: { l: 85, r: 20, t: 15, b: 35 },
      xaxis: { color: '#64748b' },
      yaxis: { color: '#64748b' }
    };

    return { data: speciesHeatmapData, layout: speciesHeatmapLayout };
  }, []);

  return (
    <div style={{ height }}>
      <PlotlyComponent data={data} layout={layout} />
    </div>
  );
};

// 10. KERNEL DENSITY VIOLIN DISTRIBUTIONS
export const PlotlyViolinDist = ({ height = 340 }) => {
  const { data, layout } = useMemo(() => {
    const gases = ['Ethanol', 'Ammonia', 'Acetone', 'Toluene'];
    const colors = ['#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4'];

    const violinData = gases.map((gas, i) => ({
      type: 'violin',
      y: Array.from({ length: 50 }, () => 70 + (i * 30) + (Math.random() - 0.5) * 80),
      name: gas,
      box: { visible: true },
      line: { color: colors[i] },
      meanline: { visible: true }
    }));

    const violinLayout = {
      margin: { l: 40, r: 20, t: 15, b: 35 },
      yaxis: { title: 'Concentration (PPM)', gridcolor: '#f1f5f9', color: '#64748b' },
      showlegend: false
    };

    return { data: violinData, layout: violinLayout };
  }, []);

  return (
    <div style={{ height }}>
      <PlotlyComponent data={data} layout={layout} />
    </div>
  );
};

// 11. THRESHOLD FREQUENCY HISTOGRAM
export const PlotlyThresholdHistogram = ({ height = 320 }) => {
  const { data, layout } = useMemo(() => {
    const samples = Array.from({ length: 300 }, () => Math.round(40 + Math.random() * 120 + (Math.random() > 0.8 ? 80 : 0)));

    const histData = [
      {
        x: samples,
        type: 'histogram',
        marker: { color: '#6366f1', opacity: 0.85 },
        xbins: { size: 10 }
      }
    ];

    const histLayout = {
      margin: { l: 40, r: 20, t: 15, b: 40 },
      xaxis: { title: 'Concentration Tier (PPM)', gridcolor: '#f1f5f9', color: '#64748b' },
      yaxis: { title: 'Frequency', gridcolor: '#f1f5f9', color: '#64748b' },
      shapes: [
        {
          type: 'line',
          x0: 120,
          x1: 120,
          y0: 0,
          y1: 50,
          line: { color: '#ef4444', width: 2, dash: 'dash' }
        }
      ],
      annotations: [
        {
          x: 120,
          y: 45,
          text: 'Safety Limit (120 PPM)',
          showarrow: true,
          arrowhead: 2,
          arrowcolor: '#ef4444',
          font: { size: 10, color: '#ef4444' }
        }
      ]
    };

    return { data: histData, layout: histLayout };
  }, []);

  return (
    <div style={{ height }}>
      <PlotlyComponent data={data} layout={layout} />
    </div>
  );
};

// 12. RESISTANCE PHASE PLANE TRAJECTORIES
export const PlotlyPhasePlane = ({ height = 340 }) => {
  const { data, layout } = useMemo(() => {
    const t = Array.from({ length: 60 }, (_, i) => i * 0.15);
    const r1 = t.map(v => Math.sin(v) * Math.exp(-v * 0.05) * 50 + 60);
    const dr1 = t.map(v => Math.cos(v) * Math.exp(-v * 0.05) * 35);

    const r2 = t.map(v => Math.sin(v * 1.5) * Math.exp(-v * 0.02) * 75 + 60);
    const dr2 = t.map(v => Math.cos(v * 1.5) * Math.exp(-v * 0.02) * 55);

    const phaseData = [
      {
        x: r1,
        y: dr1,
        mode: 'lines+markers',
        name: 'Stable Orbit',
        line: { color: '#10b981', width: 2 },
        marker: { size: 3 }
      },
      {
        x: r2,
        y: dr2,
        mode: 'lines+markers',
        name: 'Transient Excursion',
        line: { color: '#f59e0b', width: 2, dash: 'dot' },
        marker: { size: 3 }
      }
    ];

    const phaseLayout = {
      margin: { l: 45, r: 20, t: 15, b: 40 },
      xaxis: { title: 'Resistance R(t) [kΩ]', gridcolor: '#f1f5f9', color: '#64748b' },
      yaxis: { title: 'Velocity dR/dt [kΩ/s]', gridcolor: '#f1f5f9', color: '#64748b' },
      legend: { orientation: 'h', y: -0.22, x: 0.15, font: { size: 10, color: '#64748b' } }
    };

    return { data: phaseData, layout: phaseLayout };
  }, []);

  return (
    <div style={{ height }}>
      <PlotlyComponent data={data} layout={layout} />
    </div>
  );
};

// 13. CALIBRATION BASELINE WATERFALL DECAY
export const PlotlyWaterfallDecay = ({ height = 320 }) => {
  const { data, layout } = useMemo(() => {
    const waterfallData = [{
      type: 'waterfall',
      orientation: 'v',
      measure: ['relative', 'relative', 'relative', 'relative', 'relative', 'total'],
      x: ['Initial Baseline', 'Phase Alpha Drift', 'Phase Beta Drift', 'Thermal Shift', 'Chamber Recal', 'Current State'],
      y: [100, -12, -18, 8, 14, 0],
      connector: { line: { color: '#cbd5e1' } },
      decreasing: { marker: { color: '#f87171' } },
      increasing: { marker: { color: '#34d399' } },
      totals: { marker: { color: '#60a5fa' } }
    }];

    const waterfallLayout = {
      margin: { l: 40, r: 20, t: 15, b: 60 },
      yaxis: { title: 'Baseline Resistance Index', gridcolor: '#f1f5f9', color: '#64748b' },
      xaxis: { tickangle: -25, color: '#64748b', tickfont: { size: 9 } }
    };

    return { data: waterfallData, layout: waterfallLayout };
  }, []);

  return (
    <div style={{ height }}>
      <PlotlyComponent data={data} layout={layout} />
    </div>
  );
};

// 14. POLAR VOLATILE SELECTIVITY
export const PlotlyPolarBar = ({ height = 360 }) => {
  const { data, layout } = useMemo(() => {
    const channels = ['Ch 01', 'Ch 03', 'Ch 05', 'Ch 07', 'Ch 09', 'Ch 11', 'Ch 13', 'Ch 15'];
    const rValues = [45, 78, 62, 90, 55, 84, 70, 95];

    const polarData = [{
      type: 'barpolar',
      r: rValues,
      theta: channels,
      marker: {
        color: rValues,
        colorscale: 'Blues'
      }
    }];

    const polarLayout = {
      margin: { l: 30, r: 30, t: 20, b: 20 },
      polar: {
        radialaxis: { visible: true, range: [0, 100], color: '#94a3b8' },
        angularaxis: { color: '#64748b' }
      }
    };

    return { data: polarData, layout: polarLayout };
  }, []);

  return (
    <div style={{ height }}>
      <PlotlyComponent data={data} layout={layout} />
    </div>
  );
};

// 15. MULTI-PHASE BASELINE DRIFT AREA
export const PlotlyBaselineArea = ({ height = 320 }) => {
  const { data, layout } = useMemo(() => {
    const phases = ['P-01', 'P-02', 'P-03', 'P-04', 'P-05', 'P-06', 'P-07', 'P-08', 'P-09', 'P-10'];
    const baseline = [45, 48, 52, 58, 64, 71, 79, 87, 94, 102];
    const upperLimit = baseline.map(v => v + 25);
    const lowerLimit = baseline.map(v => Math.max(10, v - 20));

    const areaData = [
      {
        x: phases,
        y: upperLimit,
        mode: 'lines',
        line: { color: 'rgba(59, 130, 246, 0.2)' },
        showlegend: false
      },
      {
        x: phases,
        y: lowerLimit,
        mode: 'lines',
        fill: 'tonexty',
        fillcolor: 'rgba(59, 130, 246, 0.12)',
        line: { color: 'rgba(59, 130, 246, 0.2)' },
        name: 'Tolerance Band'
      },
      {
        x: phases,
        y: baseline,
        mode: 'lines+markers',
        line: { color: '#2563eb', width: 2.5 },
        name: 'Mean Baseline Drift'
      }
    ];

    const areaLayout = {
      margin: { l: 40, r: 20, t: 15, b: 35 },
      xaxis: { title: 'Historical Baseline Phase', color: '#64748b' },
      yaxis: { title: 'Drift Index', gridcolor: '#f1f5f9', color: '#64748b' },
      legend: { orientation: 'h', y: -0.22, x: 0.2, font: { size: 10, color: '#64748b' } }
    };

    return { data: areaData, layout: areaLayout };
  }, []);

  return (
    <div style={{ height }}>
      <PlotlyComponent data={data} layout={layout} />
    </div>
  );
};
