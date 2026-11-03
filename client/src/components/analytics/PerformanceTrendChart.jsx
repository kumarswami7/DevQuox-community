import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  BarChart2,
  Eye,
  Heart,
  MessageSquare,
  Users,
  Percent,
} from 'lucide-react';

/**
 * PerformanceTrendChart
 *
 * Lightweight, zero-dependency interactive SVG time-series chart component.
 * Renders smooth metric curves, gradient fills, axes, and interactive hover tooltips.
 */
export const PerformanceTrendChart = ({ timeline = [], range = '30d' }) => {
  const [selectedMetric, setSelectedMetric] = useState('impressions');
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const metricsConfig = {
    impressions: {
      label: 'Impressions & Reach',
      icon: BarChart2,
      stroke: '#10b981', // emerald-500
      fillId: 'grad-emerald',
      gradientFrom: '#10b981',
      unit: '',
      colorClass: 'text-emerald-600 dark:text-emerald-400',
    },
    views: {
      label: 'Unique Viewers',
      icon: Eye,
      stroke: '#3b82f6', // blue-500
      fillId: 'grad-blue',
      gradientFrom: '#3b82f6',
      unit: '',
      colorClass: 'text-blue-600 dark:text-blue-400',
    },
    engagement: {
      label: 'Engagement Rate',
      icon: Percent,
      stroke: '#6366f1', // indigo-500
      fillId: 'grad-indigo',
      gradientFrom: '#6366f1',
      unit: '%',
      colorClass: 'text-indigo-600 dark:text-indigo-400',
    },
    reactions: {
      label: 'Reactions & Upvotes',
      icon: Heart,
      stroke: '#f43f5e', // rose-500
      fillId: 'grad-rose',
      gradientFrom: '#f43f5e',
      unit: '',
      colorClass: 'text-rose-600 dark:text-rose-400',
    },
    comments: {
      label: 'Comments & Reviews',
      icon: MessageSquare,
      stroke: '#f59e0b', // amber-500
      fillId: 'grad-amber',
      gradientFrom: '#f59e0b',
      unit: '',
      colorClass: 'text-amber-600 dark:text-amber-400',
    },
    applications: {
      label: 'Project Applications',
      icon: Users,
      stroke: '#8b5cf6', // purple-500
      fillId: 'grad-purple',
      gradientFrom: '#8b5cf6',
      unit: '',
      colorClass: 'text-purple-600 dark:text-purple-400',
    },
  };

  const currentConfig = metricsConfig[selectedMetric] || metricsConfig.impressions;

  // Compute SVG dimensions and normalized coordinates
  const chartWidth = 800;
  const chartHeight = 220;
  const paddingX = 40;
  const paddingY = 30;

  const { points, maxValue, pathD, areaD } = useMemo(() => {
    if (!timeline || timeline.length === 0) {
      return { points: [], maxValue: 0, pathD: '', areaD: '' };
    }

    const values = timeline.map((d) => Number(d[selectedMetric] || 0));
    const max = Math.max(1, ...values);

    const stepX = (chartWidth - paddingX * 2) / Math.max(1, timeline.length - 1);

    const calculatedPoints = timeline.map((d, idx) => {
      const val = Number(d[selectedMetric] || 0);
      const x = paddingX + idx * stepX;
      const normalizedY = (val / max) * (chartHeight - paddingY * 2);
      const y = chartHeight - paddingY - normalizedY;
      return { x, y, value: val, date: d.date, label: d.label };
    });

    if (calculatedPoints.length === 1) {
      const p = calculatedPoints[0];
      return {
        points: calculatedPoints,
        maxValue: max,
        pathD: `M ${paddingX} ${p.y} L ${chartWidth - paddingX} ${p.y}`,
        areaD: `M ${paddingX} ${p.y} L ${chartWidth - paddingX} ${p.y} L ${chartWidth - paddingX} ${chartHeight - paddingY} L ${paddingX} ${chartHeight - paddingY} Z`,
      };
    }

    // Build SVG path strings
    const pathSegments = calculatedPoints.map((p, idx) => (idx === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`));
    const linePath = pathSegments.join(' ');
    const firstPoint = calculatedPoints[0];
    const lastPoint = calculatedPoints[calculatedPoints.length - 1];
    const areaPath = `${linePath} L ${lastPoint.x} ${chartHeight - paddingY} L ${firstPoint.x} ${chartHeight - paddingY} Z`;

    return {
      points: calculatedPoints,
      maxValue: max,
      pathD: linePath,
      areaD: areaPath,
    };
  }, [timeline, selectedMetric]);

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-cardDark border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-5">
      {/* Chart Header & Metric Selectors */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary-500" />
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Performance Over Time
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Daily engagement telemetry and audience growth for the selected period ({range})
          </p>
        </div>

        {/* Metric Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {Object.entries(metricsConfig).map(([key, cfg]) => {
            const isSelected = selectedMetric === key;
            const Icon = cfg.icon;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedMetric(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-primary-400 dark:text-primary-600' : 'text-slate-400'}`} />
                <span>{cfg.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative w-full overflow-hidden">
        {points.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-xs text-slate-400">
            No telemetry records available for this date window.
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-48 sm:h-56 select-none"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id={currentConfig.fillId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={currentConfig.gradientFrom} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={currentConfig.gradientFrom} stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                const y = paddingY + (chartHeight - paddingY * 2) * (1 - pct);
                const gridVal = Math.round(maxValue * pct);
                return (
                  <g key={i}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={chartWidth - paddingX}
                      y2={y}
                      stroke="currentColor"
                      className="text-slate-100 dark:text-slate-800/80"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={paddingX - 8}
                      y={y + 3}
                      textAnchor="end"
                      className="text-[9px] fill-slate-400 font-mono"
                    >
                      {gridVal}
                      {currentConfig.unit}
                    </text>
                  </g>
                );
              })}

              {/* Area Fill */}
              {areaD && <path d={areaD} fill={`url(#${currentConfig.fillId})`} />}

              {/* Line Stroke */}
              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  stroke={currentConfig.stroke}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Interactive Data Points */}
              {points.map((p, idx) => (
                <g key={idx}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={hoveredPoint?.date === p.date ? 5 : 3}
                    fill={hoveredPoint?.date === p.date ? '#ffffff' : currentConfig.stroke}
                    stroke={currentConfig.stroke}
                    strokeWidth={hoveredPoint?.date === p.date ? 3 : 1.5}
                    className="transition-all cursor-pointer"
                    onMouseEnter={() => setHoveredPoint(p)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  {/* Invisible larger hit target */}
                  <rect
                    x={p.x - 12}
                    y={0}
                    width={24}
                    height={chartHeight}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredPoint(p)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                </g>
              ))}

              {/* X-Axis Dates Labels */}
              {points.map((p, idx) => {
                // Show only a subset of labels if many points
                const interval = Math.ceil(points.length / 6);
                const showLabel = idx === 0 || idx === points.length - 1 || idx % interval === 0;
                if (!showLabel) return null;

                return (
                  <text
                    key={idx}
                    x={p.x}
                    y={chartHeight - 8}
                    textAnchor="middle"
                    className="text-[9px] fill-slate-400 font-medium"
                  >
                    {p.label}
                  </text>
                );
              })}
            </svg>
          </div>
        )}

        {/* Hover Tooltip Overlay */}
        {hoveredPoint && (
          <div
            className="absolute top-2 pointer-events-none px-3 py-1.5 rounded-xl bg-slate-900/90 text-white dark:bg-white dark:text-slate-900 text-xs shadow-lg backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 transition-all z-20 flex items-center gap-2"
            style={{
              left: `${Math.min(chartWidth - 140, Math.max(20, (hoveredPoint.x / chartWidth) * 100))}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <span className="font-semibold text-slate-300 dark:text-slate-600">{hoveredPoint.label}:</span>
            <span className="font-black">
              {hoveredPoint.value.toLocaleString()}
              {currentConfig.unit}
            </span>
            <span className="text-[10px] text-slate-400 capitalize">({currentConfig.label})</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceTrendChart;

