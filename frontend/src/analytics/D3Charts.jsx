import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';

// 1. ORGANIC VOLATILE STREAMGRAPH WITH ANIMATED TRANSITION
export const D3Streamgraph = ({ data }) => {
  const svgRef = useRef(null);

  const normalized = useMemo(() => {
    const defaultGases = ['Ethanol', 'Ethylene', 'Ammonia', 'Acetaldehyde', 'Acetone', 'Toluene'];
    let batches = [];

    if (Array.isArray(data) && data.length > 0) {
      batches = data;
    } else if (data && Array.isArray(data.batches)) {
      batches = data.batches;
    } else {
      batches = Array.from({ length: 10 }, (_, i) => ({
        batch: `Phase ${String(i + 1).padStart(2, '0')}`,
        Ethanol: 50 + Math.sin(i * 0.8) * 30,
        Ethylene: 70 + Math.cos(i * 0.7) * 35,
        Ammonia: 40 + i * 4,
        Acetaldehyde: 55 + Math.sin(i * 1.2) * 20,
        Acetone: 65 - i * 2,
        Toluene: 35 + Math.cos(i * 1.5) * 15
      }));
    }

    return { batches, gases: defaultGases };
  }, [data]);

  useEffect(() => {
    if (!svgRef.current || !normalized.batches || normalized.batches.length === 0) return;

    const width = 850;
    const height = 320;
    const margin = { top: 25, right: 30, bottom: 40, left: 45 };

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('viewBox', `0 0 ${width} ${height}`)
       .attr('preserveAspectRatio', 'xMidYMid meet');

    const stack = d3.stack()
      .keys(normalized.gases)
      .order(d3.stackOrderInsideOut)
      .offset(d3.stackOffsetWiggle);

    const series = stack(normalized.batches);

    const x = d3.scaleLinear()
      .domain([0, normalized.batches.length - 1])
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
      .domain([
        d3.min(series, layer => d3.min(layer, d => d[0])),
        d3.max(series, layer => d3.max(layer, d => d[1]))
      ])
      .range([height - margin.bottom, margin.top]);

    const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];
    const color = d3.scaleOrdinal().domain(normalized.gases).range(colors);

    // Baseline flat area for animation
    const flatArea = d3.area()
      .x((d, i) => x(i))
      .y0((height - margin.bottom) / 2)
      .y1((height - margin.bottom) / 2)
      .curve(d3.curveBasis);

    const area = d3.area()
      .x((d, i) => x(i))
      .y0(d => y(d[0]))
      .y1(d => y(d[1]))
      .curve(d3.curveBasis);

    const g = svg.append('g');

    // Animated Path Transition with interactive hover feedback
    g.selectAll('path')
      .data(series)
      .join('path')
      .attr('d', flatArea)
      .attr('fill', d => color(d.key))
      .attr('opacity', 0)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .on('mouseenter', function() {
        g.selectAll('path').transition().duration(200).attr('opacity', 0.35);
        d3.select(this).transition().duration(200).attr('opacity', 1).attr('stroke-width', 2.5);
      })
      .on('mouseleave', function() {
        g.selectAll('path').transition().duration(200).attr('opacity', 0.88).attr('stroke-width', 1);
      })
      .transition()
      .duration(1100)
      .delay((_, i) => i * 120)
      .ease(d3.easeCubicOut)
      .attr('d', area)
      .attr('opacity', 0.88);

    // X Axis
    const xAxis = d3.axisBottom(x)
      .ticks(normalized.batches.length)
      .tickFormat((d, i) => normalized.batches[i]?.batch || `Phase ${i + 1}`);

    svg.append('g')
      .attr('transform', `translate(0, ${height - margin.bottom + 8})`)
      .call(xAxis)
      .attr('color', '#94a3b8')
      .call(gAxis => gAxis.select('.domain').attr('stroke', '#cbd5e1'))
      .selectAll('text')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .attr('fill', '#64748b');

  }, [normalized]);

  return (
    <div className="w-full overflow-hidden">
      <svg ref={svgRef} className="w-full h-auto block" />
    </div>
  );
};

// 2. TRANSDUCER ARRAY RADAR WITH ANIMATED MORPHING
export const D3RadarChart = ({ data }) => {
  const svgRef = useRef(null);
  const [selectedGasKey, setSelectedGasKey] = useState('1');

  const channels = useMemo(() => {
    if (!data) {
      return Array.from({ length: 16 }, (_, i) => ({
        name: `S${String(i + 1).padStart(2, '0')}`,
        value: 30 + (Math.sin(i * 0.9) * 35) + 20
      }));
    }

    if (Array.isArray(data)) {
      return data.map((d, i) => ({
        name: d.sensor || d.name || `S${String(i + 1).padStart(2, '0')}`,
        value: Number(d.value) || 50
      }));
    }

    if (data.channels && Array.isArray(data.channels)) {
      return data.channels;
    }

    const gasDataset = data[selectedGasKey] || data[Object.keys(data)[0]];
    if (Array.isArray(gasDataset)) {
      return gasDataset.map((d, i) => ({
        name: d.sensor || d.name || `S${String(i + 1).padStart(2, '0')}`,
        value: Number(d.value) || 50
      }));
    }

    return Array.from({ length: 16 }, (_, i) => ({
      name: `S${String(i + 1).padStart(2, '0')}`,
      value: 50
    }));
  }, [data, selectedGasKey]);

  useEffect(() => {
    if (!svgRef.current || !channels || channels.length === 0) return;

    const width = 450;
    const height = 360;
    const margin = 50;
    const radius = Math.min(width, height) / 2 - margin;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('viewBox', `0 0 ${width} ${height}`)
       .attr('preserveAspectRatio', 'xMidYMid meet');

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const angleSlice = (Math.PI * 2) / channels.length;
    const rScale = d3.scaleLinear().domain([0, 100]).range([0, radius]);

    // Concentric Circular Grid Rings
    const levels = 4;
    for (let level = 1; level <= levels; level++) {
      const r = (radius / levels) * level;
      g.append('circle')
        .attr('r', 0)
        .attr('fill', 'none')
        .attr('stroke', '#e2e8f0')
        .attr('stroke-dasharray', '3,3')
        .transition()
        .duration(600)
        .delay(level * 100)
        .attr('r', r);
    }

    // Radial Axis Lines & Labels
    const axis = g.selectAll('.axis')
      .data(channels)
      .enter()
      .append('g')
      .attr('class', 'axis');

    axis.append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', 0)
      .attr('y2', 0)
      .attr('stroke', '#e2e8f0')
      .transition()
      .duration(700)
      .attr('x2', (d, i) => rScale(100) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr('y2', (d, i) => rScale(100) * Math.sin(angleSlice * i - Math.PI / 2));

    axis.append('text')
      .attr('x', (d, i) => (rScale(100) + 16) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr('y', (d, i) => (rScale(100) + 16) * Math.sin(angleSlice * i - Math.PI / 2))
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .attr('fill', '#64748b')
      .attr('opacity', 0)
      .text(d => d.name)
      .transition()
      .duration(800)
      .attr('opacity', 1);

    // Initial 0 radius polygon
    const zeroLine = d3.lineRadial()
      .curve(d3.curveLinearClosed)
      .radius(0)
      .angle((d, i) => i * angleSlice);

    const radarLine = d3.lineRadial()
      .curve(d3.curveLinearClosed)
      .radius(d => rScale(d.value))
      .angle((d, i) => i * angleSlice);

    g.append('path')
      .datum(channels)
      .attr('d', zeroLine)
      .attr('fill', '#10b981')
      .attr('fill-opacity', 0.25)
      .attr('stroke', '#059669')
      .attr('stroke-width', 2)
      .transition()
      .duration(1000)
      .ease(d3.easeCubicOut)
      .attr('d', radarLine);

    // Points with animated scaling
    g.selectAll('.radarCircle')
      .data(channels)
      .enter()
      .append('circle')
      .attr('cx', (d, i) => rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr('cy', (d, i) => rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2))
      .attr('r', 0)
      .attr('fill', '#059669')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1.5)
      .transition()
      .duration(800)
      .delay((_, i) => 600 + i * 30)
      .attr('r', 3.5);

  }, [channels]);

  const gasNames = [
    { id: '1', name: 'Ethanol' },
    { id: '2', name: 'Ethylene' },
    { id: '3', name: 'Ammonia' },
    { id: '4', name: 'Acetaldehyde' },
    { id: '5', name: 'Acetone' },
    { id: '6', name: 'Toluene' }
  ];

  return (
    <div className="w-full flex flex-col items-center">
      <div className="flex flex-wrap items-center justify-center gap-1.5 mb-3">
        {gasNames.map(g => (
          <button
            key={g.id}
            onClick={() => setSelectedGasKey(g.id)}
            className={`px-2.5 py-1 text-[11px] font-mono rounded-lg transition ${
              selectedGasKey === g.id
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {g.name}
          </button>
        ))}
      </div>
      <div className="w-full overflow-hidden">
        <svg ref={svgRef} className="w-full h-auto block" />
      </div>
    </div>
  );
};

// 3. ZOOMABLE HIERARCHICAL SUNBURST WITH SMOOTH TWEENING
export const D3ZoomableSunburst = ({ data }) => {
  const svgRef = useRef(null);

  const hierarchyData = useMemo(() => {
    if (data && data.children) return data;
    return {
      name: 'Transducer Array',
      children: [
        {
          name: 'Cluster A',
          children: [
            { name: 'Ethanol', value: 120 },
            { name: 'Ethylene', value: 90 },
            { name: 'Ammonia', value: 80 }
          ]
        },
        {
          name: 'Cluster B',
          children: [
            { name: 'Acetaldehyde', value: 110 },
            { name: 'Acetone', value: 95 },
            { name: 'Toluene', value: 70 }
          ]
        },
        {
          name: 'Cluster C',
          children: [
            { name: 'High Flux', value: 140 },
            { name: 'Baseline Flux', value: 85 }
          ]
        }
      ]
    };
  }, [data]);

  useEffect(() => {
    if (!svgRef.current || !hierarchyData) return;

    const width = 420;
    const radius = width / 6;

    const childCount = Array.isArray(hierarchyData?.children) ? Math.max(1, hierarchyData.children.length) : 3;
    const color = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, childCount + 1));

    const hierarchy = d3.hierarchy(hierarchyData)
      .sum(d => d.value)
      .sort((a, b) => b.value - a.value);

    const root = d3.partition().size([2 * Math.PI, hierarchy.height + 1])(hierarchy);
    root.each(d => d.current = d);

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('viewBox', [-width / 2, -width / 2, width, width])
       .attr('preserveAspectRatio', 'xMidYMid meet');

    const arc = d3.arc()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
      .padRadius(radius * 1.5)
      .innerRadius(d => d.y0 * radius)
      .outerRadius(d => Math.max(d.y0 * radius, d.y1 * radius - 1));

    const path = svg.append('g')
      .selectAll('path')
      .data(root.descendants().slice(1))
      .join('path')
      .attr('fill', d => {
        while (d.depth > 1) d = d.parent;
        return color(d.data.name);
      })
      .attr('fill-opacity', d => arcVisible(d.current) ? (d.children ? 0.75 : 0.5) : 0)
      .attr('d', d => arc(d.current))
      .style('cursor', 'pointer');

    path.filter(d => d.children)
      .on('click', clicked);

    function clicked(event, p) {
      root.each(d => d.target = {
        x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
        x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
        y0: Math.max(0, d.y0 - p.depth),
        y1: Math.max(0, d.y1 - p.depth)
      });

      const t = svg.transition().duration(800);

      path.transition(t)
        .tween('data', d => {
          const i = d3.interpolate(d.current, d.target);
          return tTween => d.current = i(tTween);
        })
        .filter(function(d) {
          return +this.getAttribute('fill-opacity') || arcVisible(d.target);
        })
        .attr('fill-opacity', d => arcVisible(d.target) ? (d.children ? 0.75 : 0.5) : 0)
        .attrTween('d', d => () => arc(d.current));
    }

    function arcVisible(d) {
      return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
    }

  }, [hierarchyData]);

  return (
    <div className="w-full overflow-hidden flex justify-center">
      <svg ref={svgRef} className="w-80 h-80 block" />
    </div>
  );
};

// 4. HIGH-DIMENSIONAL PARALLEL COORDINATES WITH ANIMATED DRAW
export const D3ParallelCoordinates = ({ data }) => {
  const svgRef = useRef(null);

  const samples = useMemo(() => {
    if (Array.isArray(data) && data.length > 0) return data.slice(0, 50);
    return Array.from({ length: 45 }, (_, i) => ({
      Concentration: 40 + (i * 3.8) + (Math.sin(i) * 20),
      Channel_01: 20 + Math.cos(i * 0.5) * 30 + 35,
      Channel_03: 15 + Math.sin(i * 0.7) * 40 + 40,
      Channel_05: 25 + Math.cos(i * 0.3) * 25 + 30,
      Channel_07: 30 + Math.sin(i * 0.4) * 35 + 45,
      Channel_09: 10 + Math.cos(i * 0.6) * 50 + 50,
      Gas: ['Ethanol', 'Ethylene', 'Ammonia', 'Acetone'][i % 4]
    }));
  }, [data]);

  useEffect(() => {
    if (!svgRef.current || !samples || samples.length === 0) return;

    const width = 850;
    const height = 300;
    const margin = { top: 30, right: 30, bottom: 25, left: 40 };

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('viewBox', `0 0 ${width} ${height}`)
       .attr('preserveAspectRatio', 'xMidYMid meet');

    const dimensions = ['Concentration', 'Channel_01', 'Channel_03', 'Channel_05', 'Channel_07', 'Channel_09'];

    const y = {};
    dimensions.forEach(dim => {
      y[dim] = d3.scaleLinear()
        .domain(d3.extent(samples, d => +d[dim]))
        .range([height - margin.bottom, margin.top]);
    });

    const x = d3.scalePoint()
      .range([margin.left, width - margin.right])
      .padding(0.2)
      .domain(dimensions);

    const gasColors = {
      Ethanol: '#3b82f6',
      Ethylene: '#10b981',
      Ammonia: '#8b5cf6',
      Acetone: '#f59e0b'
    };

    function path(d) {
      return d3.line()(dimensions.map(pDim => [x(pDim), y[pDim](d[pDim])]));
    }

    // Polylines with animated stroke-dashoffset entrance and interactive hover
    const paths = svg.append('g')
      .selectAll('path')
      .data(samples)
      .join('path')
      .attr('d', path)
      .style('fill', 'none')
      .style('stroke', d => gasColors[d.Gas] || '#6366f1')
      .style('opacity', 0.55)
      .style('stroke-width', 1.5)
      .style('cursor', 'pointer')
      .on('mouseenter', function() {
        paths.transition().duration(150).style('opacity', 0.15).style('stroke-width', 1);
        d3.select(this).transition().duration(150).style('opacity', 1).style('stroke-width', 3.5);
      })
      .on('mouseleave', function() {
        paths.transition().duration(150).style('opacity', 0.55).style('stroke-width', 1.5);
      });

    paths.each(function() {
      const length = this.getTotalLength ? this.getTotalLength() : 800;
      d3.select(this)
        .attr('stroke-dasharray', `${length} ${length}`)
        .attr('stroke-dashoffset', length)
        .transition()
        .duration(1200)
        .delay((_, i) => i * 15)
        .ease(d3.easeCubicOut)
        .attr('stroke-dashoffset', 0);
    });

    // Vertical Axes
    svg.selectAll('.axis')
      .data(dimensions)
      .enter()
      .append('g')
      .attr('transform', d => `translate(${x(d)},0)`)
      .each(function(d) {
        d3.select(this).call(d3.axisLeft().scale(y[d]).ticks(5));
      })
      .attr('color', '#cbd5e1')
      .selectAll('text')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .attr('fill', '#64748b');

    // Dimension Title Labels
    svg.selectAll('.axis-label')
      .data(dimensions)
      .enter()
      .append('text')
      .attr('x', d => x(d))
      .attr('y', margin.top - 12)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'monospace')
      .attr('fill', '#334155')
      .text(d => d);

  }, [samples]);

  return (
    <div className="w-full overflow-hidden">
      <svg ref={svgRef} className="w-full h-auto block" />
    </div>
  );
};

// 5. CONTINUOUS DENSITY RIDGELINE PLOT WITH ANIMATED CRESTS
export const D3RidgelinePlot = ({ data }) => {
  const svgRef = useRef(null);

  const seriesData = useMemo(() => {
    if (Array.isArray(data) && data.length > 0) {
      return data.map((d, gIdx) => {
        const gasName = d.label || d.gas || `Gas ${d.gas_type || gIdx + 1}`;
        let points = [];
        if (Array.isArray(d.curve) && d.curve.length > 0) {
          points = d.curve.map(pt => ({
            x: Number(pt.ppm ?? pt.x ?? 0),
            y: Number(pt.density ?? pt.y ?? 0) * 1200
          }));
        } else if (Array.isArray(d.points) && d.points.length > 0) {
          points = d.points.map(pt => ({
            x: Number(pt.x ?? 0),
            y: Number(pt.y ?? 0)
          }));
        } else {
          points = Array.from({ length: 40 }, (_, i) => ({
            x: i * 6,
            y: Math.exp(-((i * 6 - (60 + gIdx * 25)) ** 2) / 800) * (35 + (gIdx % 2) * 10)
          }));
        }
        return { gas: gasName, points };
      });
    }

    const gases = ['Ethanol', 'Ethylene', 'Ammonia', 'Acetaldehyde', 'Acetone', 'Toluene'];
    return gases.map((gas, gIdx) => {
      const points = Array.from({ length: 40 }, (_, i) => {
        const xVal = i * 6;
        const mean = 60 + gIdx * 25;
        const density = Math.exp(-((xVal - mean) ** 2) / 800) * (35 + (gIdx % 2) * 10);
        return { x: xVal, y: density };
      });
      return { gas, points };
    });
  }, [data]);

  useEffect(() => {
    if (!svgRef.current || !seriesData || seriesData.length === 0) return;

    const width = 850;
    const height = 340;
    const margin = { top: 30, right: 30, bottom: 35, left: 90 };

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('viewBox', `0 0 ${width} ${height}`)
       .attr('preserveAspectRatio', 'xMidYMid meet');

    const x = d3.scaleLinear().domain([0, 240]).range([margin.left, width - margin.right]);
    const validGasNames = seriesData.map(d => d.gas || 'Gas');
    const yName = d3.scalePoint().domain(validGasNames).range([margin.top, height - margin.bottom]).padding(1);

    const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

    seriesData.forEach((s, idx) => {
      if (!s || !Array.isArray(s.points) || s.points.length === 0) return;
      const baseLineY = yName(s.gas) || (margin.top + idx * 45);
      const yDensity = d3.scaleLinear().domain([0, 50]).range([0, -45]);

      const flatArea = d3.area()
        .x(d => x(d?.x || 0))
        .y0(baseLineY)
        .y1(baseLineY)
        .curve(d3.curveBasis);

      const area = d3.area()
        .x(d => x(d?.x || 0))
        .y0(baseLineY)
        .y1(d => baseLineY + yDensity(d?.y || 0))
        .curve(d3.curveBasis);

      // Animated Area Crest Rise with interactive hover
      svg.append('path')
        .datum(s.points)
        .attr('class', 'ridgeline-path')
        .attr('d', flatArea)
        .attr('fill', colors[idx % colors.length])
        .attr('fill-opacity', 0.65)
        .attr('stroke', colors[idx % colors.length])
        .attr('stroke-width', 1.5)
        .style('cursor', 'pointer')
        .on('mouseenter', function() {
          svg.selectAll('.ridgeline-path').transition().duration(150).attr('fill-opacity', 0.25);
          d3.select(this).transition().duration(150).attr('fill-opacity', 0.95).attr('stroke-width', 2.5);
        })
        .on('mouseleave', function() {
          svg.selectAll('.ridgeline-path').transition().duration(150).attr('fill-opacity', 0.65).attr('stroke-width', 1.5);
        })
        .transition()
        .duration(900)
        .delay(idx * 120)
        .ease(d3.easeCubicOut)
        .attr('d', area);

      // Gas Label
      svg.append('text')
        .attr('x', margin.left - 10)
        .attr('y', baseLineY)
        .attr('text-anchor', 'end')
        .attr('dy', '0.35em')
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .attr('font-family', 'monospace')
        .attr('fill', '#475569')
        .text(s.gas);
    });

    // X Axis
    const xAxis = d3.axisBottom(x).ticks(8);
    svg.append('g')
      .attr('transform', `translate(0, ${height - margin.bottom + 5})`)
      .call(xAxis)
      .attr('color', '#cbd5e1')
      .selectAll('text')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .attr('fill', '#64748b');

  }, [seriesData]);

  return (
    <div className="w-full overflow-hidden">
      <svg ref={svgRef} className="w-full h-auto block" />
    </div>
  );
};

// 6. ANIMATED VOLATILE CONCENTRATION GAUGES
export const D3ConcentrationGauges = () => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 850;
    const height = 150;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('viewBox', `0 0 ${width} ${height}`)
       .attr('preserveAspectRatio', 'xMidYMid meet');

    const gases = [
      { name: 'Ethanol', val: 78, max: 100, color: '#3b82f6' },
      { name: 'Ethylene', val: 92, max: 100, color: '#10b981' },
      { name: 'Ammonia', val: 45, max: 100, color: '#8b5cf6' },
      { name: 'Acetone', val: 68, max: 100, color: '#f59e0b' },
      { name: 'Toluene', val: 34, max: 100, color: '#ef4444' }
    ];

    const slotWidth = width / gases.length;
    const radius = 45;

    gases.forEach((g, idx) => {
      const cx = slotWidth * idx + slotWidth / 2;
      const cy = 75;

      const group = svg.append('g').attr('transform', `translate(${cx}, ${cy})`);

      // Background Arc
      const arcBg = d3.arc()
        .innerRadius(radius - 8)
        .outerRadius(radius)
        .startAngle(-Math.PI * 0.75)
        .endAngle(Math.PI * 0.75);

      group.append('path')
        .attr('d', arcBg)
        .attr('fill', '#e2e8f0');

      // Value Arc with animated sweep
      const targetAngle = -Math.PI * 0.75 + (g.val / g.max) * (Math.PI * 1.5);
      const arcVal = d3.arc()
        .innerRadius(radius - 8)
        .outerRadius(radius)
        .startAngle(-Math.PI * 0.75);

      group.append('path')
        .datum({ endAngle: -Math.PI * 0.75 })
        .attr('fill', g.color)
        .transition()
        .duration(1200)
        .delay(idx * 150)
        .attrTween('d', function() {
          const interpolate = d3.interpolate(-Math.PI * 0.75, targetAngle);
          return function(t) {
            return arcVal({ endAngle: interpolate(t) });
          };
        });

      // Center Value Text
      group.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.3em')
        .attr('font-size', '14px')
        .attr('font-weight', 'bold')
        .attr('font-family', 'monospace')
        .attr('fill', '#1e293b')
        .text(`${g.val}%`);

      // Label below gauge
      group.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', radius + 16)
        .attr('font-size', '11px')
        .attr('font-weight', 'bold')
        .attr('fill', '#64748b')
        .text(g.name);
    });

  }, []);

  return (
    <div className="w-full overflow-hidden">
      <svg ref={svgRef} className="w-full h-auto block" />
    </div>
  );
};

// 7. ANIMATED GAS FREQUENCY BARS
export const D3GasFrequencyBars = () => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 450;
    const height = 300;
    const margin = { top: 20, right: 20, bottom: 40, left: 50 };

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('viewBox', `0 0 ${width} ${height}`)
       .attr('preserveAspectRatio', 'xMidYMid meet');

    const data = [
      { gas: 'Ethanol', count: 2850, color: '#3b82f6' },
      { gas: 'Ethylene', count: 3120, color: '#10b981' },
      { gas: 'Ammonia', count: 2460, color: '#8b5cf6' },
      { gas: 'Acetaldehyde', count: 2110, color: '#f59e0b' },
      { gas: 'Acetone', count: 1980, color: '#ef4444' },
      { gas: 'Toluene', count: 1390, color: '#06b6d4' }
    ];

    const x = d3.scaleBand()
      .domain(data.map(d => d.gas))
      .range([margin.left, width - margin.right])
      .padding(0.3);

    const y = d3.scaleLinear()
      .domain([0, 3500])
      .range([height - margin.bottom, margin.top]);

    // Bars with rising animation and interactive hover
    const barG = svg.append('g');
    const bars = barG.selectAll('rect')
      .data(data)
      .join('rect')
      .attr('x', d => x(d.gas))
      .attr('y', height - margin.bottom)
      .attr('width', x.bandwidth())
      .attr('height', 0)
      .attr('fill', d => d.color)
      .attr('rx', 4)
      .style('cursor', 'pointer')
      .on('mouseenter', function() {
        bars.transition().duration(150).attr('opacity', 0.4);
        d3.select(this).transition().duration(150).attr('opacity', 1).attr('stroke', '#0f172a').attr('stroke-width', 2);
      })
      .on('mouseleave', function() {
        bars.transition().duration(150).attr('opacity', 1).attr('stroke-width', 0);
      });

    bars.transition()
      .duration(1000)
      .delay((_, i) => i * 100)
      .ease(d3.easeCubicOut)
      .attr('y', d => y(d.count))
      .attr('height', d => height - margin.bottom - y(d.count));

    // Axes
    svg.append('g')
      .attr('transform', `translate(0, ${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .attr('color', '#cbd5e1')
      .selectAll('text')
      .attr('font-size', '9px')
      .attr('tickangle', -20)
      .attr('fill', '#64748b');

    svg.append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(y).ticks(5))
      .attr('color', '#cbd5e1')
      .selectAll('text')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .attr('fill', '#64748b');

  }, []);

  return (
    <div className="w-full overflow-hidden">
      <svg ref={svgRef} className="w-full h-auto block" />
    </div>
  );
};

// 8. ANIMATED CONCENTRIC CHAMBER ELEVATION RINGS
export const D3ConcentricRings = () => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 450;
    const height = 340;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('viewBox', `0 0 ${width} ${height}`)
       .attr('preserveAspectRatio', 'xMidYMid meet');

    const g = svg.append('g').attr('transform', `translate(${width / 2}, ${height / 2})`);

    const rings = [25, 50, 75, 100, 125];
    const colors = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

    rings.forEach((r, idx) => {
      g.append('circle')
        .attr('r', 0)
        .attr('fill', 'none')
        .attr('stroke', colors[idx])
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', idx % 2 === 0 ? 'none' : '4,4')
        .attr('opacity', 0.8)
        .transition()
        .duration(1200)
        .delay(idx * 160)
        .ease(d3.easeCubicOut)
        .attr('r', r);
    });

    // Outer nodes along the ring
    const nodeCount = 12;
    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2;
      const targetR = 100;
      g.append('circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', 0)
        .attr('fill', '#6366f1')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 1.5)
        .transition()
        .duration(1000)
        .delay(800 + i * 50)
        .attr('cx', Math.cos(angle) * targetR)
        .attr('cy', Math.sin(angle) * targetR)
        .attr('r', 4);
    }

  }, []);

  return (
    <div className="w-full overflow-hidden flex justify-center">
      <svg ref={svgRef} className="w-80 h-80 block" />
    </div>
  );
};

// 9. ANIMATED MULTI-CHANNEL SLOPE CURVES
export const D3SlopeCurves = () => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 850;
    const height = 300;
    const margin = { top: 25, right: 30, bottom: 35, left: 45 };

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('viewBox', `0 0 ${width} ${height}`)
       .attr('preserveAspectRatio', 'xMidYMid meet');

    const x = d3.scaleLinear().domain([0, 20]).range([margin.left, width - margin.right]);
    const y = d3.scaleLinear().domain([0, 100]).range([height - margin.bottom, margin.top]);

    const linesData = [
      { name: 'Channel Alpha', color: '#3b82f6', fn: i => 20 + i * 3.5 + Math.sin(i * 0.8) * 8 },
      { name: 'Channel Beta', color: '#10b981', fn: i => 15 + i * 2.8 + Math.cos(i * 0.6) * 12 },
      { name: 'Channel Gamma', color: '#8b5cf6', fn: i => 30 + i * 2.2 + Math.sin(i * 1.1) * 6 }
    ];

    linesData.forEach((ld, idx) => {
      const points = Array.from({ length: 21 }, (_, i) => ({ x: i, y: ld.fn(i) }));
      const lineGen = d3.line().x(d => x(d.x)).y(d => y(d.y)).curve(d3.curveMonotoneX);

      const path = svg.append('path')
        .datum(points)
        .attr('fill', 'none')
        .attr('stroke', ld.color)
        .attr('stroke-width', 2.5)
        .attr('d', lineGen);

      const length = path.node().getTotalLength();
      path.attr('stroke-dasharray', `${length} ${length}`)
        .attr('stroke-dashoffset', length)
        .transition()
        .duration(1400)
        .delay(idx * 200)
        .ease(d3.easeCubicOut)
        .attr('stroke-dashoffset', 0);
    });

    // X and Y Axes
    svg.append('g')
      .attr('transform', `translate(0, ${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(10))
      .attr('color', '#cbd5e1')
      .selectAll('text')
      .attr('fill', '#64748b');

    svg.append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(y).ticks(5))
      .attr('color', '#cbd5e1')
      .selectAll('text')
      .attr('fill', '#64748b');

  }, []);

  return (
    <div className="w-full overflow-hidden">
      <svg ref={svgRef} className="w-full h-auto block" />
    </div>
  );
};

// 10. ANIMATED SENSITIVITY NETWORK CLUSTER
export const D3SensitivityNetwork = () => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 450;
    const height = 340;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('viewBox', `0 0 ${width} ${height}`)
       .attr('preserveAspectRatio', 'xMidYMid meet');

    const nodes = Array.from({ length: 12 }, (_, i) => ({
      id: `S${i + 1}`,
      group: i % 3
    }));

    const links = [
      { source: 'S1', target: 'S2' },
      { source: 'S2', target: 'S3' },
      { source: 'S3', target: 'S1' },
      { source: 'S4', target: 'S5' },
      { source: 'S5', target: 'S6' },
      { source: 'S7', target: 'S8' },
      { source: 'S8', target: 'S9' },
      { source: 'S1', target: 'S7' },
      { source: 'S3', target: 'S10' },
      { source: 'S10', target: 'S11' },
      { source: 'S11', target: 'S12' }
    ];

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(55))
      .force('charge', d3.forceManyBody().strength(-120))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 1.5);

    const colors = ['#3b82f6', '#10b981', '#f59e0b'];

    const node = svg.append('g')
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', 0)
      .attr('fill', d => colors[d.group])
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .transition()
      .duration(800)
      .delay((_, i) => i * 40)
      .attr('r', 7);

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      svg.selectAll('circle')
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);
    });

  }, []);

  return (
    <div className="w-full overflow-hidden flex justify-center">
      <svg ref={svgRef} className="w-80 h-80 block" />
    </div>
  );
};

// 11. ANIMATED TIME DECAY STEP FUNCTION
export const D3TimeDecayStep = () => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 850;
    const height = 280;
    const margin = { top: 25, right: 30, bottom: 35, left: 45 };

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('viewBox', `0 0 ${width} ${height}`)
       .attr('preserveAspectRatio', 'xMidYMid meet');

    const steps = [
      { step: 1, val: 100 },
      { step: 2, val: 92 },
      { step: 3, val: 86 },
      { step: 4, val: 81 },
      { step: 5, val: 75 },
      { step: 6, val: 71 },
      { step: 7, val: 66 },
      { step: 8, val: 62 },
      { step: 9, val: 59 },
      { step: 10, val: 55 }
    ];

    const x = d3.scaleLinear().domain([1, 10]).range([margin.left, width - margin.right]);
    const y = d3.scaleLinear().domain([40, 110]).range([height - margin.bottom, margin.top]);

    const stepLine = d3.line()
      .x(d => x(d.step))
      .y(d => y(d.val))
      .curve(d3.curveStepAfter);

    const path = svg.append('path')
      .datum(steps)
      .attr('fill', 'none')
      .attr('stroke', '#6366f1')
      .attr('stroke-width', 2.5)
      .attr('d', stepLine);

    const length = path.node().getTotalLength();
    path.attr('stroke-dasharray', `${length} ${length}`)
      .attr('stroke-dashoffset', length)
      .transition()
      .duration(1300)
      .ease(d3.easeCubicOut)
      .attr('stroke-dashoffset', 0);

    svg.append('g')
      .attr('transform', `translate(0, ${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(10))
      .attr('color', '#cbd5e1')
      .selectAll('text')
      .attr('fill', '#64748b');

    svg.append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(y).ticks(5))
      .attr('color', '#cbd5e1')
      .selectAll('text')
      .attr('fill', '#64748b');

  }, []);

  return (
    <div className="w-full overflow-hidden">
      <svg ref={svgRef} className="w-full h-auto block" />
    </div>
  );
};

// 12. ANIMATED CUMULATIVE OGIVE CURVE
export const D3CumulativeOgive = () => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 450;
    const height = 300;
    const margin = { top: 20, right: 25, bottom: 35, left: 45 };

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('viewBox', `0 0 ${width} ${height}`)
       .attr('preserveAspectRatio', 'xMidYMid meet');

    const points = Array.from({ length: 30 }, (_, i) => {
      const xVal = i * 8;
      const prob = 1 / (1 + Math.exp(-(xVal - 100) / 25));
      return { x: xVal, y: prob * 100 };
    });

    const x = d3.scaleLinear().domain([0, 240]).range([margin.left, width - margin.right]);
    const y = d3.scaleLinear().domain([0, 100]).range([height - margin.bottom, margin.top]);

    const line = d3.line().x(d => x(d.x)).y(d => y(d.y)).curve(d3.curveMonotoneX);

    const path = svg.append('path')
      .datum(points)
      .attr('fill', 'none')
      .attr('stroke', '#06b6d4')
      .attr('stroke-width', 2.5)
      .attr('d', line);

    const length = path.node().getTotalLength();
    path.attr('stroke-dasharray', `${length} ${length}`)
      .attr('stroke-dashoffset', length)
      .transition()
      .duration(1200)
      .ease(d3.easeCubicOut)
      .attr('stroke-dashoffset', 0);

    svg.append('g')
      .attr('transform', `translate(0, ${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(6))
      .attr('color', '#cbd5e1')
      .selectAll('text')
      .attr('fill', '#64748b');

    svg.append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}%`))
      .attr('color', '#cbd5e1')
      .selectAll('text')
      .attr('fill', '#64748b');

  }, []);

  return (
    <div className="w-full overflow-hidden">
      <svg ref={svgRef} className="w-full h-auto block" />
    </div>
  );
};

// 13. ANIMATED DYNAMIC RESPONSE VELOCITY CURVE
export const D3VelocityCurves = () => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 850;
    const height = 300;
    const margin = { top: 25, right: 30, bottom: 35, left: 45 };

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('viewBox', `0 0 ${width} ${height}`)
       .attr('preserveAspectRatio', 'xMidYMid meet');

    const points = Array.from({ length: 50 }, (_, i) => {
      const t = i * 0.2;
      const v = (Math.exp(-t * 0.4) * Math.sin(t * 1.8)) * 40;
      return { t, v };
    });

    const x = d3.scaleLinear().domain([0, 10]).range([margin.left, width - margin.right]);
    const y = d3.scaleLinear().domain([-30, 45]).range([height - margin.bottom, margin.top]);

    const line = d3.line().x(d => x(d.t)).y(d => y(d.v)).curve(d3.curveBasis);

    const path = svg.append('path')
      .datum(points)
      .attr('fill', 'none')
      .attr('stroke', '#f43f5e')
      .attr('stroke-width', 2.5)
      .attr('d', line);

    const length = path.node().getTotalLength();
    path.attr('stroke-dasharray', `${length} ${length}`)
      .attr('stroke-dashoffset', length)
      .transition()
      .duration(1400)
      .ease(d3.easeCubicOut)
      .attr('stroke-dashoffset', 0);

    // Zero threshold line
    svg.append('line')
      .attr('x1', margin.left)
      .attr('y1', y(0))
      .attr('x2', width - margin.right)
      .attr('y2', y(0))
      .attr('stroke', '#e2e8f0')
      .attr('stroke-dasharray', '3,3');

    svg.append('g')
      .attr('transform', `translate(0, ${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(10))
      .attr('color', '#cbd5e1')
      .selectAll('text')
      .attr('fill', '#64748b');

    svg.append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(y).ticks(5))
      .attr('color', '#cbd5e1')
      .selectAll('text')
      .attr('fill', '#64748b');

  }, []);

  return (
    <div className="w-full overflow-hidden">
      <svg ref={svgRef} className="w-full h-auto block" />
    </div>
  );
};

// 14. ANIMATED SPECTRAL FREQUENCY DISTRIBUTION BARS
export const D3SpectralDistribution = () => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 450;
    const height = 300;
    const margin = { top: 20, right: 20, bottom: 35, left: 45 };

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('viewBox', `0 0 ${width} ${height}`)
       .attr('preserveAspectRatio', 'xMidYMid meet');

    const bars = Array.from({ length: 16 }, (_, i) => ({
      ch: `B${i + 1}`,
      power: Math.max(10, Math.sin(i * 0.45) * 55 + 30 + Math.random() * 15)
    }));

    const x = d3.scaleBand().domain(bars.map(d => d.ch)).range([margin.left, width - margin.right]).padding(0.25);
    const y = d3.scaleLinear().domain([0, 100]).range([height - margin.bottom, margin.top]);

    svg.append('g')
      .selectAll('rect')
      .data(bars)
      .join('rect')
      .attr('x', d => x(d.ch))
      .attr('y', height - margin.bottom)
      .attr('width', x.bandwidth())
      .attr('height', 0)
      .attr('fill', '#8b5cf6')
      .attr('rx', 3)
      .transition()
      .duration(1000)
      .delay((_, i) => i * 40)
      .ease(d3.easeCubicOut)
      .attr('y', d => y(d.power))
      .attr('height', d => height - margin.bottom - y(d.power));

    svg.append('g')
      .attr('transform', `translate(0, ${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .attr('color', '#cbd5e1')
      .selectAll('text')
      .attr('font-size', '8px')
      .attr('fill', '#64748b');

    svg.append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(y).ticks(5))
      .attr('color', '#cbd5e1')
      .selectAll('text')
      .attr('font-size', '9px')
      .attr('fill', '#64748b');

  }, []);

  return (
    <div className="w-full overflow-hidden">
      <svg ref={svgRef} className="w-full h-auto block" />
    </div>
  );
};
