import React, { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';

export const PlotlyComponent = ({ data, layout, config, style, className }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const defaultConfig = {
      responsive: true,
      displayModeBar: 'hover',
      displaylogo: false,
      modeBarButtonsToRemove: ['sendDataToCloud'],
      toImageButtonOptions: {
        format: 'png',
        filename: 'telemetry_chart'
      },
      ...config
    };

    const defaultLayout = {
      autosize: true,
      hovermode: 'closest',
      margin: { l: 40, r: 20, t: 30, b: 40 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { family: 'ui-sans-serif, system-ui, sans-serif', size: 11, color: '#64748b' },
      ...layout
    };

    Plotly.newPlot(containerRef.current, data, defaultLayout, defaultConfig);

    const handleResize = () => {
      if (containerRef.current) {
        Plotly.Plots.resize(containerRef.current);
      }
    };

    window.addEventListener('resize', handleResize);

    const node = containerRef.current;
    return () => {
      window.removeEventListener('resize', handleResize);
      if (node) {
        Plotly.purge(node);
      }
    };
  }, [data, layout, config]);

  return (
    <div 
      ref={containerRef} 
      style={style} 
      className={className || "w-full h-full"} 
    />
  );
};

export default PlotlyComponent;
